import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Student } from '@/types';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { getDivision, calculateEloChange, DIVISIONS_CONFIG } from './pvp-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnlinePlayer {
  student_id: string;
  name: string;
  character_name: string | null;
  character_class: string | null;
  level: number;
  class_id: string;
  rating: number;
  wins: number;
  losses: number;
  last_seen: string;
}

interface PvpChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'finished';
  challenger_score: number;
  opponent_score: number;
  winner_id: string | null;
  teacher_id: string;
  created_at: string;
}

interface PvpStats {
  rating: number;
  wins: number;
  losses: number;
  win_streak: number;
}

interface MatchHistoryRow {
  id: string;
  opponent_name: string;
  opponent_rating: number;
  result: 'win' | 'loss';
  my_score: number;
  opp_score: number;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const HEARTBEAT_MS = 30_000;
const POLL_MS = 8_000;

const CLASS_COLOR: Record<string, string> = {
  Mago:       '#9b6dff',
  Arqueiro:   '#4ade80',
  Curandeiro: '#38d9e8',
  Guerreiro:  '#ff6b35',
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes pvp-pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
@keyframes pvp-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pvp-slide-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes pvp-challenge-in { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
@keyframes pvp-dot { 0%,80%,100%{opacity:.2} 40%{opacity:1} }

.pvp-online-dot { animation: pvp-pulse 2s ease-in-out infinite; }
.pvp-spin       { animation: pvp-spin 1.2s linear infinite; }
.pvp-row        { animation: pvp-slide-in .3s ease both; }
.pvp-challenge-banner { animation: pvp-challenge-in .25s ease both; }

.pvp-tab-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 20px;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  letter-spacing: 2px;
  transition: all .2s;
  position: relative;
}
.pvp-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 10%; right: 10%;
  height: 2px;
  border-radius: 1px;
  background: #38d9e8;
}

.pvp-player-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(8,14,24,.7);
  border: 1px solid rgba(80,120,180,.12);
  transition: all .2s;
  cursor: default;
}
.pvp-player-row:hover {
  border-color: rgba(56,217,232,.25);
  background: rgba(12,20,36,.85);
}

.pvp-challenge-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid rgba(56,217,232,.35);
  background: rgba(56,217,232,.06);
  color: #38d9e8;
  font-family: 'Orbitron', sans-serif;
  font-size: 9px;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.pvp-challenge-btn:hover:not(:disabled) {
  background: rgba(56,217,232,.14);
  border-color: rgba(56,217,232,.6);
  box-shadow: 0 0 10px rgba(56,217,232,.2);
}
.pvp-challenge-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOnline(last_seen: string): boolean {
  return Date.now() - new Date(last_seen).getTime() < ONLINE_THRESHOLD_MS;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, charClass, size = 40, online }: { name: string; charClass: string | null; size?: number; online?: boolean }) {
  const color = CLASS_COLOR[charClass ?? ''] ?? '#4a9eff';
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}18`,
        border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: size * 0.35,
        fontWeight: 700,
        color,
        boxShadow: `0 0 10px ${color}20`,
      }}>
        {initials(name)}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: online ? '#4ade80' : '#374151',
          border: '2px solid #04060a',
        }} className={online ? 'pvp-online-dot' : ''} />
      )}
    </div>
  );
}

// ─── Division Badge ───────────────────────────────────────────────────────────

function DivBadge({ rating, small }: { rating: number; small?: boolean }) {
  const div = getDivision(rating);
  return (
    <span style={{
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: small ? 9 : 10,
      color: div.color,
      background: `${div.color.replace('0.7', '0.08').replace('0.8', '0.08')}`,
      border: `1px solid ${div.color.replace('0.7', '0.2').replace('0.8', '0.2')}`,
      borderRadius: 4,
      padding: small ? '1px 5px' : '2px 7px',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
    }}>
      {div.name} {div.tier}
    </span>
  );
}

// ─── Incoming challenge banner ────────────────────────────────────────────────

function ChallengeBanner({
  challenge,
  players,
  onAccept,
  onDecline,
}: {
  challenge: PvpChallenge;
  players: OnlinePlayer[];
  onAccept: () => void;
  onDecline: () => void;
}) {
  const challenger = players.find(p => p.student_id === challenge.challenger_id);
  const name = challenger?.character_name ?? challenger?.name ?? 'Alguém';

  return (
    <div className="pvp-challenge-banner" style={{
      position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200,
      background: 'rgba(6,10,20,0.97)',
      border: '1px solid rgba(56,217,232,.4)',
      borderRadius: 12,
      padding: '16px 24px',
      minWidth: 320,
      boxShadow: '0 0 30px rgba(56,217,232,.15), 0 8px 32px rgba(0,0,0,.7)',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: 'rgba(56,217,232,.6)', letterSpacing: '3px', marginBottom: 6 }}>
        DESAFIO RECEBIDO
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, color: '#c8d8f0', fontWeight: 700, marginBottom: 14 }}>
        {name.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={onAccept} style={{
          padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(74,222,128,.4)',
          background: 'rgba(74,222,128,.08)', color: '#4ade80',
          fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '1.5px', cursor: 'pointer',
          transition: 'all .2s',
        }}>ACEITAR</button>
        <button onClick={onDecline} style={{
          padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(248,113,113,.3)',
          background: 'rgba(248,113,113,.05)', color: '#f87171',
          fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '1.5px', cursor: 'pointer',
          transition: 'all .2s',
        }}>RECUSAR</button>
      </div>
    </div>
  );
}

// ─── Battle screen (simple attribute duel) ───────────────────────────────────

function BattleScreen({
  myStudent,
  opponent,
  myStats,
  onFinish,
}: {
  myStudent: Student;
  opponent: OnlinePlayer;
  myStats: PvpStats;
  onFinish: (won: boolean, myScore: number, oppScore: number) => void;
}) {
  const [phase, setPhase] = useState<'countdown' | 'rolling' | 'result'>('countdown');
  const [count, setCount] = useState(3);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  useEffect(() => {
    if (phase === 'countdown') {
      if (count > 0) {
        const t = setTimeout(() => setCount(c => c - 1), 900);
        return () => clearTimeout(t);
      } else {
        setPhase('rolling');
      }
    }
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'rolling') return;

    // Battle based on combined attributes + level + small random factor
    const myPow = (
      (myStudent.attr_forca ?? 0) +
      (myStudent.attr_destreza ?? 0) +
      (myStudent.attr_inteligencia ?? 0) +
      (myStudent.attr_carisma ?? 0) +
      (myStudent.attr_agilidade ?? 0) +
      (myStudent.attr_resistencia ?? 0)
    ) * myStudent.level + Math.floor(Math.random() * 20);

    const oppPow = opponent.level * 15 + Math.floor(Math.random() * 20);

    const rounds = 5;
    let myWins = 0;
    let oppWins = 0;
    for (let i = 0; i < rounds; i++) {
      const myRoll = myPow * (0.8 + Math.random() * 0.4);
      const oppRoll = oppPow * (0.8 + Math.random() * 0.4);
      if (myRoll > oppRoll) myWins++;
      else oppWins++;
    }

    setTimeout(() => {
      setMyScore(myWins);
      setOppScore(oppWins);
      setPhase('result');
    }, 1800);
  }, [phase]);

  const won = myScore > oppScore;
  const eloChange = calculateEloChange(myStats.rating, opponent.rating, won);

  if (phase === 'countdown') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(4,6,10,.97)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(56,217,232,.5)', letterSpacing: '4px', marginBottom: 20 }}>
          BATALHA INICIANDO
        </div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: count > 0 ? 96 : 60,
          fontWeight: 900,
          color: count > 0 ? '#38d9e8' : '#4ade80',
          textShadow: `0 0 40px ${count > 0 ? 'rgba(56,217,232,.5)' : 'rgba(74,222,128,.5)'}`,
          transition: 'all .3s',
        }}>
          {count > 0 ? count : 'VAI!'}
        </div>
      </div>
    );
  }

  if (phase === 'rolling') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(4,6,10,.97)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 24, zIndex: 300,
      }}>
        <div className="pvp-spin" style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#38d9e8',
          borderRightColor: '#4a9eff',
        }} />
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, color: 'rgba(200,216,240,.6)', letterSpacing: '3px' }}>
          CALCULANDO RESULTADO...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(4,6,10,.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 24, zIndex: 300,
    }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 32, fontWeight: 900,
        color: won ? '#4ade80' : '#f87171',
        letterSpacing: '4px',
        textShadow: `0 0 30px ${won ? 'rgba(74,222,128,.5)' : 'rgba(248,113,113,.5)'}`,
      }}>
        {won ? 'VITORIA!' : 'DERROTA'}
      </div>

      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 28, color: '#c8d8f0', letterSpacing: '4px',
      }}>
        {myScore} <span style={{ color: 'rgba(120,150,190,.4)' }}>—</span> {oppScore}
      </div>

      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 13,
        color: eloChange >= 0 ? '#4ade80' : '#f87171',
      }}>
        {eloChange >= 0 ? '+' : ''}{eloChange} ELO
      </div>

      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: 'rgba(120,150,190,.5)', marginTop: 4 }}>
        vs {opponent.character_name ?? opponent.name}
      </div>

      <button
        onClick={() => onFinish(won, myScore, oppScore)}
        style={{
          marginTop: 16,
          padding: '10px 32px',
          borderRadius: 8,
          border: '1px solid rgba(56,217,232,.35)',
          background: 'rgba(56,217,232,.08)',
          color: '#38d9e8',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 10,
          letterSpacing: '2px',
          cursor: 'pointer',
        }}
      >
        CONTINUAR
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PvpArenaProps {
  student: Student;
  onBack: () => void;
}

export function PvpArena({ student, onBack }: PvpArenaProps) {
  const [tab, setTab] = useState<'turma' | 'geral' | 'historico'>('turma');
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [myStats, setMyStats] = useState<PvpStats>({ rating: 1000, wins: 0, losses: 0, win_streak: 0 });
  const [history, setHistory] = useState<MatchHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Challenge state
  const [outgoingChallenge, setOutgoingChallenge] = useState<PvpChallenge | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<PvpChallenge | null>(null);
  const [pendingOpponent, setPendingOpponent] = useState<OnlinePlayer | null>(null);

  // Battle
  const [battleOpponent, setBattleOpponent] = useState<OnlinePlayer | null>(null);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabaseStudent.channel> | null>(null);

  // ── Init: upsert presence, fetch stats ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    // Safety net: if any init query hangs, release the loading screen after 10 s
    const loadingFallback = setTimeout(() => {
      if (mounted) {
        console.warn("[PvpArena] init timed out — releasing loading screen");
        setLoading(false);
      }
    }, 10_000);

    (async () => {
      try {
        // Upsert presence
        await supabaseStudent.from('pvp_presence').upsert({ student_id: student.id, last_seen: new Date().toISOString() });

        // Ensure stats row exists
        await supabaseStudent.from('pvp_student_stats').upsert(
          { student_id: student.id, rating: 1000, wins: 0, losses: 0, win_streak: 0, updated_at: new Date().toISOString() },
          { onConflict: 'student_id', ignoreDuplicates: true }
        );

        await loadMyStats();
        await loadPlayers();
        await loadHistory();
      } catch (err) {
        console.error("[PvpArena] init error:", err);
      } finally {
        clearTimeout(loadingFallback);
        if (mounted) setLoading(false);
      }
    })();

    // Heartbeat
    heartbeatRef.current = setInterval(async () => {
      await supabaseStudent.from('pvp_presence').upsert({ student_id: student.id, last_seen: new Date().toISOString() });
    }, HEARTBEAT_MS);

    // Poll players + incoming challenges
    pollRef.current = setInterval(async () => {
      await loadPlayers();
      await checkIncomingChallenge();
      await checkOutgoingChallenge();
    }, POLL_MS);

    // Realtime subscription on pvp_matches for this student
    realtimeRef.current = supabaseStudent
      .channel(`pvp_student_${student.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pvp_matches',
        filter: `opponent_id=eq.${student.id}`,
      }, (payload) => {
        const match = payload.new as PvpChallenge;
        if (match.status === 'pending') {
          setIncomingChallenge(match);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pvp_matches',
        filter: `challenger_id=eq.${student.id}`,
      }, (payload) => {
        const match = payload.new as PvpChallenge;
        if (match.status === 'accepted') {
          // Opponent accepted — start battle
          setOutgoingChallenge(null);
          const opp = players.find(p => p.student_id === match.opponent_id) ?? pendingOpponent;
          if (opp) setBattleOpponent(opp);
        } else if (match.status === 'declined') {
          setOutgoingChallenge(null);
          setPendingOpponent(null);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      clearTimeout(loadingFallback);
      // Remove presence on unmount
      supabaseStudent.from('pvp_presence').delete().eq('student_id', student.id);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      realtimeRef.current?.unsubscribe();
    };
  }, [student.id]);

  const loadMyStats = useCallback(async () => {
    const { data } = await supabaseStudent
      .from('pvp_student_stats')
      .select('rating, wins, losses, win_streak')
      .eq('student_id', student.id)
      .maybeSingle();
    if (data) setMyStats(data as PvpStats);
  }, [student.id]);

  const loadPlayers = useCallback(async () => {
    // Get all recently seen presences
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
    const { data: presences } = await supabaseStudent
      .from('pvp_presence')
      .select('student_id, last_seen')
      .gte('last_seen', cutoff)
      .neq('student_id', student.id);

    if (!presences?.length) {
      setPlayers([]);
      return;
    }

    const ids = presences.map(p => p.student_id);

    const { data: studs } = await supabaseStudent
      .from('students')
      .select('id, name, character_name, character_class, level, class_id')
      .in('id', ids);

    const { data: stats } = await supabaseStudent
      .from('pvp_student_stats')
      .select('student_id, rating, wins, losses')
      .in('student_id', ids);

    const statsMap = new Map((stats ?? []).map(s => [s.student_id, s]));
    const presenceMap = new Map(presences.map(p => [p.student_id, p.last_seen]));

    const list: OnlinePlayer[] = (studs ?? []).map(s => ({
      student_id: s.id,
      name: s.name,
      character_name: s.character_name,
      character_class: s.character_class,
      level: s.level,
      class_id: s.class_id,
      rating: statsMap.get(s.id)?.rating ?? 1000,
      wins: statsMap.get(s.id)?.wins ?? 0,
      losses: statsMap.get(s.id)?.losses ?? 0,
      last_seen: presenceMap.get(s.id) ?? new Date().toISOString(),
    }));

    setPlayers(list);
  }, [student.id]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabaseStudent
      .from('pvp_matches')
      .select('id, challenger_id, opponent_id, winner_id, challenger_score, opponent_score, teacher_id, created_at')
      .or(`challenger_id.eq.${student.id},opponent_id.eq.${student.id}`)
      .eq('status', 'finished')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data?.length) { setHistory([]); return; }

    const opponentIds = data.map(m =>
      m.challenger_id === student.id ? m.opponent_id : m.challenger_id
    );
    const { data: oppStudents } = await supabaseStudent
      .from('students')
      .select('id, name, character_name')
      .in('id', opponentIds);

    const oppMap = new Map((oppStudents ?? []).map(s => [s.id, s.character_name ?? s.name]));

    // Get opponent ratings from pvp_student_stats
    const { data: oppStats } = await supabaseStudent
      .from('pvp_student_stats')
      .select('student_id, rating')
      .in('student_id', opponentIds);
    const oppRatingMap = new Map((oppStats ?? []).map(s => [s.student_id, s.rating]));

    const rows: MatchHistoryRow[] = data.map(m => {
      const iAmChallenger = m.challenger_id === student.id;
      const oppId = iAmChallenger ? m.opponent_id : m.challenger_id;
      return {
        id: m.id,
        opponent_name: oppMap.get(oppId) ?? 'Desconhecido',
        opponent_rating: oppRatingMap.get(oppId) ?? 1000,
        result: m.winner_id === student.id ? 'win' : 'loss',
        my_score: iAmChallenger ? m.challenger_score : m.opponent_score,
        opp_score: iAmChallenger ? m.opponent_score : m.challenger_score,
        created_at: m.created_at,
      };
    });

    setHistory(rows);
  }, [student.id]);

  const checkIncomingChallenge = useCallback(async () => {
    const { data } = await supabaseStudent
      .from('pvp_matches')
      .select('*')
      .eq('opponent_id', student.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data && !incomingChallenge) {
      setIncomingChallenge(data as PvpChallenge);
    }
  }, [student.id, incomingChallenge]);

  const checkOutgoingChallenge = useCallback(async () => {
    if (!outgoingChallenge) return;
    const { data } = await supabaseStudent
      .from('pvp_matches')
      .select('*')
      .eq('id', outgoingChallenge.id)
      .maybeSingle();
    if (!data) return;
    const match = data as PvpChallenge;
    if (match.status === 'accepted') {
      setOutgoingChallenge(null);
      const opp = players.find(p => p.student_id === match.opponent_id) ?? pendingOpponent;
      if (opp) setBattleOpponent(opp);
    } else if (match.status === 'declined') {
      setOutgoingChallenge(null);
      setPendingOpponent(null);
    }
  }, [outgoingChallenge, players, pendingOpponent]);

  const sendChallenge = useCallback(async (opponent: OnlinePlayer) => {
    if (outgoingChallenge) return;
    setPendingOpponent(opponent);
    const { data, error } = await supabaseStudent
      .from('pvp_matches')
      .insert({
        teacher_id: student.teacher_id,
        challenger_id: student.id,
        opponent_id: opponent.student_id,
        status: 'pending',
      })
      .select()
      .single();
    if (!error && data) {
      setOutgoingChallenge(data as PvpChallenge);
    }
  }, [outgoingChallenge, student]);

  const acceptChallenge = useCallback(async () => {
    if (!incomingChallenge) return;
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'accepted' })
      .eq('id', incomingChallenge.id);

    const challengerPlayer = players.find(p => p.student_id === incomingChallenge.challenger_id);
    setIncomingChallenge(null);
    if (challengerPlayer) setBattleOpponent(challengerPlayer);
  }, [incomingChallenge, players]);

  const declineChallenge = useCallback(async () => {
    if (!incomingChallenge) return;
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', incomingChallenge.id);
    setIncomingChallenge(null);
  }, [incomingChallenge]);

  const cancelChallenge = useCallback(async () => {
    if (!outgoingChallenge) return;
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', outgoingChallenge.id);
    setOutgoingChallenge(null);
    setPendingOpponent(null);
  }, [outgoingChallenge]);

  const finishBattle = useCallback(async (won: boolean, myScore: number, oppScore: number) => {
    if (!battleOpponent) return;

    // Find the pvp_match to update (accepted one between the two)
    const { data: matchRow } = await supabaseStudent
      .from('pvp_matches')
      .select('id')
      .or(`challenger_id.eq.${student.id},opponent_id.eq.${student.id}`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (matchRow) {
      await supabaseStudent.from('pvp_matches').update({
        status: 'finished',
        winner_id: won ? student.id : battleOpponent.student_id,
        challenger_score: myScore,
        opponent_score: oppScore,
        finished_at: new Date().toISOString(),
      }).eq('id', matchRow.id);
    }

    // Update my stats
    const eloChange = calculateEloChange(myStats.rating, battleOpponent.rating, won);
    const newRating = Math.max(0, myStats.rating + eloChange);
    await supabaseStudent.from('pvp_student_stats').upsert({
      student_id: student.id,
      rating: newRating,
      wins: myStats.wins + (won ? 1 : 0),
      losses: myStats.losses + (won ? 0 : 1),
      win_streak: won ? myStats.win_streak + 1 : 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });

    setBattleOpponent(null);
    await loadMyStats();
    await loadHistory();
    await loadPlayers();
  }, [battleOpponent, myStats, student.id]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const turmaPlayers = players.filter(p => p.class_id === student.class_id);
  const geralPlayers = players;
  const displayPlayers = tab === 'turma' ? turmaPlayers : tab === 'geral' ? geralPlayers : [];

  const myDiv = getDivision(myStats.rating);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>

      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'linear-gradient(160deg, #04060a 0%, #060a14 50%, #04060a 100%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(56,217,232,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(56,217,232,0.025) 1px,transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div style={{
          position: 'absolute', top: '10%', left: '-5%',
          width: 500, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse,rgba(56,217,232,0.04),transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-5%',
          width: 400, height: 350, borderRadius: '50%',
          background: 'radial-gradient(ellipse,rgba(155,109,255,0.04),transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Main layout */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        color: '#c8d8f0',
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 60,
          background: 'rgba(4,6,10,0.8)',
          borderBottom: '1px solid rgba(56,217,232,0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 6,
              background: 'transparent', border: '1px solid rgba(80,120,180,.12)',
              color: 'rgba(120,150,190,.5)',
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: '1.5px',
              cursor: 'pointer', transition: 'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(56,217,232,.3)'; (e.currentTarget as HTMLButtonElement).style.color='#6eb4ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(80,120,180,.12)'; (e.currentTarget as HTMLButtonElement).style.color='rgba(120,150,190,.5)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              HUB
            </button>
            <div>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '3px', color: '#c8d8f0' }}>
                PvP ARENA
              </span>
            </div>
          </div>

          {/* My stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'rgba(120,150,190,.4)', letterSpacing: '1px' }}>ELO</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: myDiv.color as string, lineHeight: 1 }}>{myStats.rating}</div>
            </div>
            <DivBadge rating={myStats.rating} />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#4ade80' }}>{myStats.wins}V</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#f87171' }}>{myStats.losses}D</div>
              </div>
            </div>
            <Avatar name={student.character_name ?? student.name} charClass={student.character_class} size={36} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(4,6,10,0.6)',
          borderBottom: '1px solid rgba(80,120,180,.1)',
          paddingLeft: 8,
        }}>
          {(['turma', 'geral', 'historico'] as const).map(t => {
            const labels = { turma: 'TURMA', geral: 'GERAL', historico: 'HISTÓRICO' };
            const count = t === 'turma' ? turmaPlayers.length : t === 'geral' ? geralPlayers.length : history.length;
            return (
              <button
                key={t}
                className={`pvp-tab-btn${tab === t ? ' active' : ''}`}
                style={{ color: tab === t ? '#38d9e8' : 'rgba(120,150,190,.45)' }}
                onClick={() => setTab(t)}
              >
                {labels[t]}
                <span style={{
                  marginLeft: 6, padding: '1px 5px', borderRadius: 3,
                  background: tab === t ? 'rgba(56,217,232,.1)' : 'rgba(80,120,180,.06)',
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                  color: tab === t ? '#38d9e8' : 'rgba(120,150,190,.4)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}

          <div style={{ marginLeft: 'auto', marginRight: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="pvp-online-dot" style={{
              width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
            }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(74,222,128,.7)' }}>
              {geralPlayers.length} ONLINE
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px', maxWidth: 760, width: '100%', margin: '0 auto' }}>

          {/* Outgoing challenge notice */}
          {outgoingChallenge && pendingOpponent && (
            <div style={{
              marginBottom: 14,
              padding: '12px 16px',
              background: 'rgba(56,217,232,.05)',
              border: '1px solid rgba(56,217,232,.2)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(56,217,232,.6)', letterSpacing: '2px' }}>
                  AGUARDANDO RESPOSTA
                </span>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: '#c8d8f0', marginTop: 2 }}>
                  {(pendingOpponent.character_name ?? pendingOpponent.name).toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pvp-spin" style={{
                  display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid transparent', borderTopColor: '#38d9e8',
                }} />
                <button onClick={cancelChallenge} className="pvp-challenge-btn" style={{
                  borderColor: 'rgba(248,113,113,.3)', color: '#f87171', background: 'rgba(248,113,113,.04)',
                }}>
                  CANCELAR
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 14 }}>
              <div className="pvp-spin" style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid transparent', borderTopColor: '#38d9e8',
              }} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(120,150,190,.4)', letterSpacing: '2px' }}>
                CARREGANDO...
              </span>
            </div>
          ) : tab !== 'historico' ? (
            displayPlayers.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: 220, gap: 12,
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="rgba(80,120,180,.15)" strokeWidth="2" />
                  <circle cx="24" cy="24" r="8" stroke="rgba(56,217,232,.2)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="4" y1="44" x2="44" y2="4" stroke="rgba(248,113,113,.2)" strokeWidth="1.5" />
                </svg>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: 'rgba(120,150,190,.35)', letterSpacing: '2px', textAlign: 'center' }}>
                  {tab === 'turma' ? 'NENHUM COLEGA DA TURMA ONLINE' : 'NENHUM JOGADOR ONLINE'}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: 'rgba(120,150,190,.25)', textAlign: 'center' }}>
                  Aguarde outros alunos entrarem na arena
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {displayPlayers.map((p, idx) => {
                  const isChallenged = outgoingChallenge?.opponent_id === p.student_id;
                  const isSameClass = p.class_id === student.class_id;
                  return (
                    <div key={p.student_id} className="pvp-row pvp-player-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <Avatar name={p.character_name ?? p.name} charClass={p.character_class} size={42} online={isOnline(p.last_seen)} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 14, color: '#c8d8f0', letterSpacing: '0.5px' }}>
                            {(p.character_name ?? p.name).toUpperCase()}
                          </span>
                          {isSameClass && tab === 'geral' && (
                            <span style={{
                              fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'rgba(74,222,128,.6)',
                              background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)',
                              borderRadius: 3, padding: '1px 5px', letterSpacing: '0.5px',
                            }}>
                              TURMA
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(120,150,190,.4)' }}>
                            Nv {p.level}
                          </span>
                          {p.character_class && (
                            <span style={{
                              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                              color: CLASS_COLOR[p.character_class] ?? '#4a9eff',
                            }}>
                              {p.character_class.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <DivBadge rating={p.rating} small />
                        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(120,150,190,.35)' }}>
                          {p.wins}V {p.losses}D
                        </span>
                      </div>

                      <button
                        className="pvp-challenge-btn"
                        disabled={!!outgoingChallenge || !!incomingChallenge}
                        onClick={() => sendChallenge(p)}
                        style={isChallenged ? { borderColor: 'rgba(74,222,128,.4)', color: '#4ade80', background: 'rgba(74,222,128,.06)' } : {}}
                      >
                        {isChallenged ? 'AGUARDANDO...' : 'DESAFIAR'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Histórico */
            history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: 'rgba(120,150,190,.3)', letterSpacing: '2px' }}>
                  SEM BATALHAS REGISTRADAS
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {history.map((h, idx) => {
                  const eloChange = calculateEloChange(myStats.rating, h.opponent_rating, h.result === 'win');
                  return (
                    <div key={h.id} className="pvp-row" style={{
                      animationDelay: `${idx * 0.04}s`,
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      background: h.result === 'win' ? 'rgba(74,222,128,.04)' : 'rgba(248,113,113,.04)',
                      border: `1px solid ${h.result === 'win' ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.1)'}`,
                    }}>
                      <div style={{
                        width: 6, borderRadius: 3, alignSelf: 'stretch',
                        background: h.result === 'win' ? '#4ade80' : '#f87171',
                        opacity: 0.7,
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, color: '#c8d8f0' }}>
                          vs {h.opponent_name.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(120,150,190,.4)', marginTop: 2 }}>
                          {timeAgo(h.created_at)}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 16, color: '#c8d8f0', letterSpacing: '2px' }}>
                        {h.my_score}—{h.opp_score}
                      </div>
                      <div style={{
                        fontFamily: "'Share Tech Mono',monospace", fontSize: 12,
                        color: eloChange >= 0 ? '#4ade80' : '#f87171',
                        width: 52, textAlign: 'right',
                      }}>
                        {eloChange >= 0 ? '+' : ''}{eloChange}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Incoming challenge overlay */}
      {incomingChallenge && (
        <ChallengeBanner
          challenge={incomingChallenge}
          players={players}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
        />
      )}

      {/* Battle */}
      {battleOpponent && (
        <BattleScreen
          myStudent={student}
          opponent={battleOpponent}
          myStats={myStats}
          onFinish={finishBattle}
        />
      )}
    </>
  );
}
