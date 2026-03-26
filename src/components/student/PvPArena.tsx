import { useState, useEffect, useRef } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { usePvP } from "@/hooks/usePvP";
import type { Student } from "@/types";
import { Loader2, Swords, Shield, ChevronRight, Trophy, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  student: Student;
  classmates?: Student[];
}

// ── Timer bar ──
function TimerBar({ duration, onExpire }: { duration: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(duration);
  useEffect(() => {
    setRemaining(duration);
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [duration, onExpire]);

  const pct = (remaining / duration) * 100;
  const color = pct > 60 ? '#00e5ff' : pct > 30 ? '#ff9800' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60`, transition: 'width 1s linear' }}
        />
      </div>
      <p className="text-xs text-right" style={{ color }}>{remaining}s</p>
    </div>
  );
}

export function PvPArena({ student, classmates: classmatesProp }: Props) {
  const { phase, match, currentQuestion, myScore, opponentScore,
    pendingChallenges, history, wins, losses, isLoading,
    challenge, accept, sendAnswer, cancel, reject, backToLobby } = usePvP(student.id, student.teacher_id);

  const [classmates, setClassmates] = useState<Student[]>(classmatesProp ?? []);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [isChallenging, setIsChallenging] = useState(false);

  useEffect(() => {
    if (classmatesProp && classmatesProp.length > 0) return;
    supabaseAnon
      .from('students')
      .select('id, name, character_name, class_id, level, teacher_id, coins, presencas_consecutivas')
      .eq('class_id', student.class_id)
      .eq('status', 'active')
      .then(({ data }) => setClassmates((data ?? []) as Student[]));
  }, [student.class_id, classmatesProp]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerStart, setAnswerStart] = useState(0);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = pendingChallenges.map(m => m.challenger_id);
    if (!ids.length) return;
    supabaseAnon
      .from('students')
      .select('id, name, character_name')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const s of data ?? []) map[s.id] = s.character_name || s.name;
        setOpponentNames(map);
      });
  }, [pendingChallenges]);

  // Reset answer state per question
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswerStart(Date.now());
  }, [currentQuestion]);

  async function handleChallenge() {
    if (!selectedOpponent) { toast.error('Selecione um oponente.'); return; }
    if (selectedOpponent === student.id) { toast.error('Você não pode se desafiar.'); return; }
    setIsChallenging(true);
    const ok = await challenge(selectedOpponent);
    if (!ok) toast.error('Erro ao enviar desafio.');
    setIsChallenging(false);
  }

  function handleAnswer(option: string) {
    if (answered || !match) return;
    const timeMs = Date.now() - answerStart;
    setSelectedAnswer(option);
    setAnswered(true);

    const q = match.questions[currentQuestion];
    const letter = option.split(')')[0]?.trim() ?? option;
    sendAnswer(currentQuestion, letter, timeMs);
  }

  function handleTimerExpire() {
    if (!answered && match) {
      handleAnswer('__timeout__');
    }
  }

  const arenaStyle = {
    background: 'linear-gradient(180deg, #0a0410 0%, #1a0820 30%, #2d1030 60%, #1a0820 80%, #0a0410 100%)',
    minHeight: '100vh',
  };

  const cardStyle = {
    background: 'rgba(20,10,35,0.8)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: '16px',
    padding: '20px',
  };

  // ── LOBBY ──
  if (phase === 'lobby') {
    return (
      <div style={cardStyle} className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords size={20} style={{ color: '#a78bfa' }} />
            <p className="font-display text-base font-bold" style={{ color: '#a78bfa' }}>PvP Arena</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span style={{ color: '#4caf50' }}>{wins}V</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#ef4444' }}>{losses}D</span>
          </div>
        </div>

        {/* Challenge */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Desafiar</p>
          <div className="flex gap-2">
            <select
              value={selectedOpponent}
              onChange={e => setSelectedOpponent(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(255,255,255,0.8)' }}
            >
              <option value="">— Escolher oponente —</option>
              {classmates.filter(c => c.id !== student.id).map(c => (
                <option key={c.id} value={c.id}>{c.character_name || c.name}</option>
              ))}
            </select>
            <button
              onClick={handleChallenge}
              disabled={isChallenging || !selectedOpponent}
              className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-all"
              style={{
                background: 'rgba(139,92,246,0.2)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: '#a78bfa',
                opacity: isChallenging || !selectedOpponent ? 0.5 : 1,
              }}
            >
              {isChallenging ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
              Desafiar
            </button>
          </div>
        </div>

        {/* Pending challenges */}
        {pendingChallenges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Desafios Recebidos
            </p>
            {pendingChallenges.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ color: '#a78bfa' }}>{opponentNames[m.challenger_id] ?? '...'}</span> te desafiou!
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => accept(m.id)} className="px-3 py-1 rounded text-xs font-bold"
                    style={{ background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', color: '#4caf50' }}>
                    Aceitar
                  </button>
                  <button onClick={() => reject(m.id)} className="px-3 py-1 rounded text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Histórico</p>
            {history.slice(0, 5).map(h => (
              <div key={h.id} className="flex items-center justify-between text-xs">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  vs <span style={{ color: '#a78bfa' }}>{h.opponent_name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{h.my_score} x {h.opp_score}</span>
                  <span style={{ color: h.won ? '#4caf50' : '#ef4444', fontWeight: 'bold' }}>
                    {h.won ? 'VITÓRIA' : 'DERROTA'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin" style={{ color: '#a78bfa' }} size={20} />
          </div>
        )}
      </div>
    );
  }

  // ── WAITING ──
  if (phase === 'waiting') {
    return (
      <div style={cardStyle} className="text-center space-y-5">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', animation: 'pulse 2s infinite' }}>
          <Swords size={28} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <p className="font-display text-base font-bold" style={{ color: '#a78bfa' }}>Aguardando Oponente...</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Desafio enviado. O oponente tem 5 minutos para aceitar.
          </p>
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: '#a78bfa', animation: `pulse 1.5s ${i * 0.3}s infinite` }} />
          ))}
        </div>
        <button onClick={() => cancel()} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 mx-auto"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          <X size={14} /> Cancelar
        </button>
      </div>
    );
  }

  // ── BATTLE ──
  if (phase === 'battle' && match) {
    const q = match.questions[currentQuestion];
    const total = match.questions.length;
    const amChallenger = match.challenger_id === student.id;
    const myName = student.character_name || student.name;

    // Figure out opponent name from match + classmates
    const oppId = amChallenger ? match.opponent_id : match.challenger_id;
    const opp = classmates.find(c => c.id === oppId);
    const oppName = opp?.character_name || opp?.name || 'Oponente';

    return (
      <div className="space-y-4" style={{ background: arenaStyle.background, borderRadius: 16, padding: 20 }}>
        {/* Scoreboard */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="font-display text-sm font-bold" style={{ color: '#a78bfa' }}>{myName}</p>
            <p className="text-3xl font-bold" style={{ color: '#a78bfa' }}>{myScore}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Swords size={20} style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentQuestion + 1}/{total}</p>
          </div>
          <div className="text-center">
            <p className="font-display text-sm font-bold" style={{ color: '#ef4444' }}>{oppName}</p>
            <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{opponentScore}</p>
          </div>
        </div>

        <TimerBar key={currentQuestion} duration={15} onExpire={handleTimerExpire} />

        {q && (
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{q.question_text}</p>

            {q.options && q.options.length > 0 ? (
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const letter = opt.split(')')[0]?.trim() ?? String.fromCharCode(65 + i);
                  const isSelected = selectedAnswer !== null &&
                    (selectedAnswer === opt || selectedAnswer === letter);
                  const isCorrect = answered && isSelected && letter === q.correct_answer;
                  const isWrong = answered && isSelected && letter !== q.correct_answer;
                  const showCorrect = answered && letter === q.correct_answer;

                  let bg = 'rgba(255,255,255,0.04)';
                  let border = 'rgba(255,255,255,0.08)';
                  let color = 'rgba(255,255,255,0.7)';

                  if (showCorrect) { bg = 'rgba(76,175,80,0.15)'; border = 'rgba(76,175,80,0.4)'; color = '#4caf50'; }
                  else if (isWrong) { bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.3)'; color = '#ef4444'; }
                  else if (isSelected) { bg = 'rgba(139,92,246,0.15)'; border = 'rgba(139,92,246,0.4)'; color = '#a78bfa'; }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(letter)}
                      disabled={answered}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all text-sm"
                      style={{ background: bg, border: `1px solid ${border}`, color }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Resposta aberta — aguardando processamento...
              </div>
            )}
          </div>
        )}

        {answered && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Loader2 size={12} className="animate-spin" />
            Aguardando oponente responder...
          </div>
        )}
      </div>
    );
  }

  // ── RESULT ──
  if (phase === 'result' && match) {
    const won = match.winner_id === student.id;
    const draw = !match.winner_id;
    const amChallenger = match.challenger_id === student.id;
    const oppId = amChallenger ? match.opponent_id : match.challenger_id;
    const opp = classmates.find(c => c.id === oppId);
    const oppName = opp?.character_name || opp?.name || 'Oponente';

    const resultColor = won ? '#ffd700' : draw ? '#00e5ff' : '#ef4444';
    const resultText = won ? 'VITÓRIA!' : draw ? 'EMPATE' : 'DERROTA';
    const coins = won ? 15 : draw ? 10 : 5;

    return (
      <div style={cardStyle} className="text-center space-y-5">
        <Trophy size={40} className="mx-auto" style={{ color: resultColor }} />
        <div>
          <p className="font-display text-2xl font-bold" style={{ color: resultColor }}>{resultText}</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>vs {oppName}</p>
        </div>
        <div className="flex justify-center gap-8">
          <div>
            <p className="text-3xl font-bold" style={{ color: '#a78bfa' }}>{myScore}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Você</p>
          </div>
          <div className="flex items-center">
            <Swords size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>{opponentScore}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{oppName}</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: '#ffd700' }}>+{coins} moedas</p>
        <button onClick={backToLobby} className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }}>
          <ChevronRight size={15} /> Voltar ao Lobby
        </button>
      </div>
    );
  }

  return null;
}
