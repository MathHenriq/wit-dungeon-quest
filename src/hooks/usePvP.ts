import { useState, useEffect, useRef, useCallback } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";

export interface PvPQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
}

export interface PvPMatch {
  id: string;
  teacher_id: string;
  challenger_id: string;
  opponent_id: string;
  winner_id: string | null;
  status: 'pending' | 'active' | 'finished' | 'cancelled';
  challenger_score: number;
  opponent_score: number;
  questions: PvPQuestion[];
  reward_coins: number;
  created_at: string;
  finished_at: string | null;
}

export interface PvPHistory {
  id: string;
  opponent_name: string;
  won: boolean;
  my_score: number;
  opp_score: number;
  created_at: string;
}

interface AnswerPayload {
  student_id: string;
  question_index: number;
  answer: string;
  time_ms: number;
}

export type PvPPhase = 'lobby' | 'waiting' | 'battle' | 'result';

export function usePvP(studentId: string, teacherId: string) {
  const [phase, setPhase] = useState<PvPPhase>('lobby');
  const [match, setMatch] = useState<PvPMatch | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [pendingChallenges, setPendingChallenges] = useState<PvPMatch[]>([]);
  const [history, setHistory] = useState<PvPHistory[]>([]);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Track answers per question: { [questionIndex]: { myAnswer, myTime, oppAnswer, oppTime } }
  const answersRef = useRef<Record<number, { myAnswer?: string; myTime?: number; oppAnswer?: string; oppTime?: number }>>({});
  const channelRef = useRef<ReturnType<typeof supabaseAnon.channel> | null>(null);
  const statusChannelRef = useRef<ReturnType<typeof supabaseAnon.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLobby = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pending challenges received
      const { data: pendingData } = await supabaseAnon
        .from('pvp_matches')
        .select('*')
        .eq('opponent_id', studentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPendingChallenges((pendingData ?? []) as PvPMatch[]);

      // History: finished matches
      const { data: histData } = await supabaseAnon
        .from('pvp_matches')
        .select('id, challenger_id, opponent_id, winner_id, challenger_score, opponent_score, created_at')
        .or(`challenger_id.eq.${studentId},opponent_id.eq.${studentId}`)
        .eq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(10);

      if (histData) {
        const studentIds = [...new Set(histData.flatMap(m => [m.challenger_id, m.opponent_id]).filter(id => id !== studentId))];
        let nameMap: Record<string, string> = {};
        if (studentIds.length > 0) {
          const { data: students } = await supabaseAnon
            .from('students')
            .select('id, name, character_name')
            .in('id', studentIds);
          nameMap = Object.fromEntries((students ?? []).map(s => [s.id, s.character_name || s.name]));
        }

        const hist: PvPHistory[] = histData.map(m => {
          const isChallenger = m.challenger_id === studentId;
          const oppId = isChallenger ? m.opponent_id : m.challenger_id;
          const won = m.winner_id === studentId;
          return {
            id: m.id,
            opponent_name: nameMap[oppId] ?? 'Oponente',
            won,
            my_score: isChallenger ? m.challenger_score : m.opponent_score,
            opp_score: isChallenger ? m.opponent_score : m.challenger_score,
            created_at: m.created_at,
          };
        });
        setHistory(hist);
        setWins(hist.filter(h => h.won).length);
        setLosses(hist.filter(h => !h.won).length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadLobby();

    // Realtime: listen for new pending challenges
    const ch = supabaseAnon
      .channel(`pvp-lobby-${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pvp_matches',
        filter: `opponent_id=eq.${studentId}`,
      }, () => loadLobby())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pvp_matches',
      }, () => {
        if (phase === 'lobby') loadLobby();
      })
      .subscribe();

    return () => { supabaseAnon.removeChannel(ch); };
  }, [studentId, loadLobby, phase]);

  function cleanupBattleChannel() {
    if (channelRef.current) {
      supabaseAnon.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (statusChannelRef.current) {
      supabaseAnon.removeChannel(statusChannelRef.current);
      statusChannelRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  const challenge = async (opponentId: string): Promise<boolean> => {
    try {
      // Select 7 random questions from teacher's bosses
      const { data: allQ } = await supabaseAnon
        .from('boss_questions')
        .select('id, question_text, question_type, options, correct_answer, boss_battles!inner(teacher_id)')
        .limit(100);

      const teacherQ = ((allQ ?? []) as (PvPQuestion & { boss_battles: { teacher_id: string } | null })[])
        .filter(q => q.boss_battles?.teacher_id === teacherId);

      const pool = teacherQ.length >= 5 ? teacherQ : (allQ ?? []) as PvPQuestion[];
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 7);
      const questions: PvPQuestion[] = shuffled.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
      }));

      const { data: newMatch, error } = await supabaseAnon
        .from('pvp_matches')
        .insert({
          teacher_id: teacherId,
          challenger_id: studentId,
          opponent_id: opponentId,
          status: 'pending',
          questions,
          challenger_score: 0,
          opponent_score: 0,
          reward_coins: 15,
        })
        .select()
        .single();

      if (error || !newMatch) return false;

      setMatch(newMatch as PvPMatch);
      setPhase('waiting');
      answersRef.current = {};
      setMyScore(0);
      setOpponentScore(0);
      setCurrentQuestion(0);

      // Listen for opponent accepting (status → active)
      subscribeToStatus(newMatch.id as string, studentId === (newMatch as PvPMatch).challenger_id);

      // Auto-cancel after 5 minutes
      timeoutRef.current = setTimeout(() => cancel(newMatch.id as string), 5 * 60 * 1000);

      return true;
    } catch {
      return false;
    }
  };

  const accept = async (matchId: string): Promise<boolean> => {
    try {
      const { data: updatedMatch, error } = await supabaseAnon
        .from('pvp_matches')
        .update({ status: 'active' })
        .eq('id', matchId)
        .select()
        .single();

      if (error || !updatedMatch) return false;

      setMatch(updatedMatch as PvPMatch);
      setPhase('battle');
      answersRef.current = {};
      setMyScore(0);
      setOpponentScore(0);
      setCurrentQuestion(0);
      subscribeToBattle(matchId, studentId === (updatedMatch as PvPMatch).challenger_id);
      return true;
    } catch {
      return false;
    }
  };

  function subscribeToStatus(matchId: string, iAmChallenger: boolean) {
    cleanupBattleChannel();
    const ch = supabaseAnon
      .channel(`pvp-status-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pvp_matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        const updated = payload.new as PvPMatch;
        if (updated.status === 'active') {
          setMatch(updated);
          setPhase('battle');
          if (statusChannelRef.current) {
            supabaseAnon.removeChannel(statusChannelRef.current);
            statusChannelRef.current = null;
          }
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          subscribeToBattle(matchId, iAmChallenger);
        } else if (updated.status === 'cancelled') {
          setPhase('lobby');
          setMatch(null);
          cleanupBattleChannel();
          loadLobby();
        }
      })
      .subscribe();
    statusChannelRef.current = ch;
  }

  function subscribeToBattle(matchId: string, iAmChallenger: boolean) {
    const ch = supabaseAnon
      .channel(`pvp-battle-${matchId}`)
      .on('broadcast', { event: 'answer' }, ({ payload }: { payload: AnswerPayload }) => {
        if (payload.student_id === studentId) return; // own echo
        const idx = payload.question_index;
        const entry = answersRef.current[idx] ?? {};
        entry.oppAnswer = payload.answer;
        entry.oppTime = payload.time_ms;
        answersRef.current[idx] = entry;
        tryResolveQuestion(idx, iAmChallenger, matchId);
      })
      .subscribe();
    channelRef.current = ch;
  }

  const sendAnswer = useCallback((questionIndex: number, answer: string, timeMs: number) => {
    if (!match || !channelRef.current) return;
    const entry = answersRef.current[questionIndex] ?? {};
    entry.myAnswer = answer;
    entry.myTime = timeMs;
    answersRef.current[questionIndex] = entry;

    channelRef.current.send({
      type: 'broadcast',
      event: 'answer',
      payload: { student_id: studentId, question_index: questionIndex, answer, time_ms: timeMs },
    });

    // If opp already answered, resolve immediately
    const isChallenger = match.challenger_id === studentId;
    tryResolveQuestion(questionIndex, isChallenger, match.id);
  }, [match, studentId]);

  function tryResolveQuestion(idx: number, iAmChallenger: boolean, matchId: string) {
    const m = match;
    if (!m) return;
    const entry = answersRef.current[idx];
    if (!entry?.myAnswer || !entry?.oppAnswer) return; // not both answered yet

    const q = m.questions[idx];
    if (!q) return;

    const myCorrect = entry.myAnswer === q.correct_answer;
    const oppCorrect = entry.oppAnswer === q.correct_answer;

    let myPts = 0;
    let oppPts = 0;

    if (myCorrect && oppCorrect) {
      // Both correct: faster gets 1, slower gets 0.5
      if ((entry.myTime ?? 0) <= (entry.oppTime ?? 0)) { myPts = 1; oppPts = 0.5; }
      else { myPts = 0.5; oppPts = 1; }
    } else if (myCorrect) {
      myPts = 1;
    } else if (oppCorrect) {
      oppPts = 1;
    }

    setMyScore(prev => {
      const next = prev + myPts;
      setOpponentScore(prevOpp => {
        const nextOpp = prevOpp + oppPts;
        const nextQ = idx + 1;
        if (nextQ >= m.questions.length) {
          // Game over
          finishMatch(matchId, next, nextOpp, iAmChallenger);
        } else {
          setCurrentQuestion(nextQ);
        }
        return nextOpp;
      });
      return next;
    });
  }

  async function finishMatch(matchId: string, finalMy: number, finalOpp: number, iAmChallenger: boolean) {
    const winnerId = finalMy > finalOpp ? studentId
      : finalOpp > finalMy ? (match?.challenger_id === studentId ? match?.opponent_id : match?.challenger_id)
      : null;

    const update = iAmChallenger
      ? { status: 'finished', winner_id: winnerId, challenger_score: finalMy, opponent_score: finalOpp, finished_at: new Date().toISOString() }
      : { status: 'finished', winner_id: winnerId, challenger_score: finalOpp, opponent_score: finalMy, finished_at: new Date().toISOString() };

    await supabaseAnon.from('pvp_matches').update(update).eq('id', matchId);

    // Award coins
    const reward = finalMy > finalOpp ? 15 : finalOpp > finalMy ? 5 : 10;
    await supabaseAnon.from('students')
      .update({ coins: supabaseAnon.from('students').select('coins') } as never)
      .eq('id', studentId);
    // Simple coin update
    await supabaseAnon.rpc('complete_daily_dungeon' as never, {
      p_student_id: studentId, p_day_seed: -1, p_floors: 0, p_coins: reward, p_xp: finalMy > finalOpp ? 10 : 3, p_completed: false,
    } as never).catch(() => null);

    cleanupBattleChannel();
    setMatch(prev => prev ? { ...prev, winner_id: winnerId ?? undefined, status: 'finished' } as PvPMatch : prev);
    setPhase('result');
  }

  const cancel = async (matchId?: string) => {
    const id = matchId ?? match?.id;
    if (!id) return;
    await supabaseAnon.from('pvp_matches').update({ status: 'cancelled' }).eq('id', id);
    cleanupBattleChannel();
    setMatch(null);
    setPhase('lobby');
    loadLobby();
  };

  const reject = async (matchId: string) => {
    await supabaseAnon.from('pvp_matches').update({ status: 'cancelled' }).eq('id', matchId);
    loadLobby();
  };

  const backToLobby = () => {
    cleanupBattleChannel();
    setMatch(null);
    setPhase('lobby');
    setMyScore(0);
    setOpponentScore(0);
    setCurrentQuestion(0);
    answersRef.current = {};
    loadLobby();
  };

  return {
    phase, match, currentQuestion, myScore, opponentScore,
    pendingChallenges, history, wins, losses, isLoading,
    challenge, accept, sendAnswer, cancel, reject, backToLobby,
  };
}
