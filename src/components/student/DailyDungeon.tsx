import { useState, useEffect, useCallback } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Student } from "@/types";
import { Loader2, ChevronRight, CheckCircle, XCircle, Trophy, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  student: Student;
  onCoinsChanged?: () => void;
}

interface BossQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  damage: number;
}

interface DungeonAttempt {
  id: string;
  floors_completed: number;
  coins_earned: number;
  xp_earned: number;
  completed: boolean;
}

const FLOOR_REWARDS = [
  { coins: 10, xp: 15 },
  { coins: 15, xp: 20 },
  { coins: 20, xp: 30 },
  { coins: 30, xp: 45 },
  { coins: 50, xp: 70 },
];
const BONUS_MULTIPLIER = 1.5;
const TOTAL_FLOORS = 5;

function getDaySeed(): number {
  return Math.floor(Date.now() / 86400000);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function getDailyQuestions(allQuestions: BossQuestion[], seed: number, count: number): BossQuestion[] {
  const shuffled = [...allQuestions].sort((a, b) => {
    return simpleHash(a.id + seed) - simpleHash(b.id + seed);
  });
  return shuffled.slice(0, count);
}

function timeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function FloorDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i < current ? '10px' : '8px',
            height: i < current ? '10px' : '8px',
            background: i < current
              ? '#00e5ff'
              : i === current
              ? 'rgba(0,229,255,0.4)'
              : 'rgba(255,255,255,0.1)',
            boxShadow: i < current ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

export function DailyDungeon({ student, onCoinsChanged }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [attempt, setAttempt] = useState<DungeonAttempt | null>(null);

  // Game state
  const [currentFloor, setCurrentFloor] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<BossQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'wrong' | 'complete' | 'done_today'>('playing');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const daySeed = getDaySeed();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check today's attempt
      const anonClient = supabaseAnon;
      const { data: attemptData } = await anonClient
        .from('daily_dungeon_attempts')
        .select('*')
        .eq('student_id', student.id)
        .eq('day_seed', daySeed)
        .maybeSingle();

      if (attemptData) {
        setAttempt(attemptData as DungeonAttempt);
        setGameState('done_today');
        setCoinsEarned((attemptData as DungeonAttempt).coins_earned);
        setXpEarned((attemptData as DungeonAttempt).xp_earned);
        setIsLoading(false);
        return;
      }

      // Load boss questions from teacher's class
      const { data: questionsData } = await anonClient
        .from('boss_questions')
        .select('id, question_text, question_type, options, correct_answer, damage, boss_battles(teacher_id, difficulty)')
        .limit(200);

      // Filter to teacher's questions
      const filtered = ((questionsData ?? []) as (BossQuestion & { boss_battles: { teacher_id: string; difficulty: string } | null })[])
        .filter(q => q.boss_battles?.teacher_id === student.teacher_id);

      if (filtered.length < 5) {
        // Not enough questions, use all available
        const daily = getDailyQuestions(
          (questionsData ?? []) as BossQuestion[],
          daySeed,
          Math.min(TOTAL_FLOORS, (questionsData ?? []).length)
        );
        setQuestions(daily);
      } else {
        const daily = getDailyQuestions(filtered as BossQuestion[], daySeed, TOTAL_FLOORS);
        setQuestions(daily);
      }
    } finally {
      setIsLoading(false);
    }
  }, [student, daySeed]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (questions.length > 0 && currentFloor < questions.length) {
      setCurrentQuestion(questions[currentFloor]);
      setSelected(null);
      setAnswered(false);
    }
  }, [questions, currentFloor]);

  function handleAnswer(option: string) {
    if (answered || !currentQuestion) return;
    setSelected(option);
    setAnswered(true);

    const correct = option.startsWith(currentQuestion.correct_answer) ||
      option === currentQuestion.correct_answer;
    setIsCorrect(correct);

    if (correct) {
      const reward = FLOOR_REWARDS[currentFloor] ?? FLOOR_REWARDS[FLOOR_REWARDS.length - 1];
      setCoinsEarned(prev => prev + reward.coins);
      setXpEarned(prev => prev + reward.xp);
    }
  }

  async function handleNext() {
    if (!answered) return;

    if (!isCorrect) {
      // Wrong — end dungeon
      await saveResult(currentFloor, false);
      setGameState('wrong');
      return;
    }

    const nextFloor = currentFloor + 1;
    if (nextFloor >= Math.min(TOTAL_FLOORS, questions.length)) {
      // Completed all floors — apply bonus
      const bonus = Math.floor(coinsEarned * (BONUS_MULTIPLIER - 1));
      const bonusXp = Math.floor(xpEarned * (BONUS_MULTIPLIER - 1));
      setCoinsEarned(prev => prev + bonus);
      setXpEarned(prev => prev + bonusXp);
      await saveResult(nextFloor, true, bonus, bonusXp);
      setGameState('complete');
    } else {
      setCurrentFloor(nextFloor);
    }
  }

  async function saveResult(floors: number, completed: boolean, bonusCoins = 0, bonusXp = 0) {
    setIsSaving(true);
    try {
      const totalCoins = coinsEarned + bonusCoins;
      const totalXp = xpEarned + bonusXp;

      const client = student.user_id ? supabaseStudent : supabaseAnon;
      await (client as typeof supabaseAnon).rpc('complete_daily_dungeon', {
        p_student_id: student.id,
        p_day_seed: daySeed,
        p_floors: floors,
        p_coins: totalCoins,
        p_xp: totalXp,
        p_completed: completed,
      });

      setAttempt({ id: '', floors_completed: floors, coins_earned: totalCoins, xp_earned: totalXp, completed });
      onCoinsChanged?.();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar resultado.');
    } finally {
      setIsSaving(false);
    }
  }

  const cardStyle = {
    background: 'rgba(10,14,26,0.8)',
    border: '1px solid rgba(0,229,255,0.1)',
    borderRadius: '16px',
    padding: '20px',
  };

  if (isLoading) {
    return (
      <div style={cardStyle} className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" style={{ color: '#00e5ff' }} size={28} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={cardStyle} className="text-center py-8">
        <Clock size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Nenhuma pergunta disponível ainda. O professor precisa criar boss battles com perguntas.
        </p>
      </div>
    );
  }

  // ── Done today ──
  if (gameState === 'done_today' || attempt) {
    const a = attempt!;
    return (
      <div style={cardStyle} className="text-center space-y-4">
        <div>
          <Trophy size={32} className="mx-auto mb-2" style={{ color: '#ffd700' }} />
          <p className="font-display text-base font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Dungeon de Hoje Concluída
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Renova em: {timeUntilMidnight()}
          </p>
        </div>
        <div className="flex justify-center gap-6">
          <div>
            <p className="text-xl font-bold" style={{ color: '#ffd700' }}>+{a.coins_earned}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>moedas</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: '#00e5ff' }}>+{a.xp_earned}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>XP</p>
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{a.floors_completed}/{TOTAL_FLOORS}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>andares</p>
          </div>
        </div>
        {a.completed && (
          <p className="text-xs font-bold" style={{ color: '#00e5ff' }}>Dungeon completa! Bônus aplicado.</p>
        )}
      </div>
    );
  }

  // ── Wrong answer ──
  if (gameState === 'wrong') {
    return (
      <div style={cardStyle} className="text-center space-y-4">
        <XCircle size={40} className="mx-auto" style={{ color: '#ef4444' }} />
        <div>
          <p className="font-display text-base font-bold" style={{ color: '#ef4444' }}>Dungeon Encerrada</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Você chegou ao Andar {currentFloor + 1}
          </p>
        </div>
        {coinsEarned > 0 ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Você ganhou <span style={{ color: '#ffd700' }}>+{coinsEarned} moedas</span> e <span style={{ color: '#00e5ff' }}>+{xpEarned} XP</span> pelo progresso.
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma recompensa desta vez. Tente amanhã!</p>
        )}
        {isSaving && <Loader2 className="animate-spin mx-auto" style={{ color: '#00e5ff' }} size={20} />}
      </div>
    );
  }

  // ── Complete ──
  if (gameState === 'complete') {
    return (
      <div style={{ ...cardStyle, border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.04)' }} className="text-center space-y-4">
        <Trophy size={40} className="mx-auto" style={{ color: '#ffd700' }} />
        <div>
          <p className="font-display text-lg font-bold" style={{ color: '#ffd700' }}>Dungeon Completa!</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Bônus de +50% aplicado</p>
        </div>
        <div className="flex justify-center gap-6">
          <div>
            <p className="text-2xl font-bold" style={{ color: '#ffd700' }}>+{coinsEarned}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>moedas</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: '#00e5ff' }}>+{xpEarned}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>XP</p>
          </div>
        </div>
        {isSaving && <Loader2 className="animate-spin mx-auto" style={{ color: '#00e5ff' }} size={20} />}
      </div>
    );
  }

  // ── Playing ──
  const floorReward = FLOOR_REWARDS[currentFloor] ?? FLOOR_REWARDS[FLOOR_REWARDS.length - 1];

  return (
    <div style={cardStyle} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-bold" style={{ color: '#00e5ff' }}>
            Dungeon Diária
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Renova em: {timeUntilMidnight()}
          </p>
        </div>
        <div className="text-right">
          <FloorDots current={currentFloor} total={Math.min(TOTAL_FLOORS, questions.length)} />
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Andar {currentFloor + 1}/{Math.min(TOTAL_FLOORS, questions.length)}
          </p>
        </div>
      </div>

      {/* Rewards row */}
      <div className="flex gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span>Acumulado: <span style={{ color: '#ffd700' }}>+{coinsEarned}</span> moedas</span>
        <span>·</span>
        <span>Este andar: <span style={{ color: '#00e5ff' }}>+{floorReward.coins}</span> moedas</span>
      </div>

      {/* Difficulty badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{
            background: currentFloor < 2 ? 'rgba(76,175,80,0.15)' : currentFloor < 4 ? 'rgba(255,152,0,0.15)' : 'rgba(239,68,68,0.15)',
            color: currentFloor < 2 ? '#4caf50' : currentFloor < 4 ? '#ff9800' : '#ef4444',
          }}
        >
          {currentFloor < 2 ? 'Fácil' : currentFloor < 4 ? 'Médio' : 'Difícil'}
        </span>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {currentQuestion.question_text}
          </p>

          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => {
                const letter = opt.split(')')[0]?.trim() ?? String.fromCharCode(65 + i);
                const isSelected = selected === opt || selected === letter;
                const isAnswer = opt.startsWith(currentQuestion.correct_answer) ||
                  opt === currentQuestion.correct_answer ||
                  letter === currentQuestion.correct_answer;
                const showResult = answered;

                let bg = 'rgba(255,255,255,0.04)';
                let border = 'rgba(255,255,255,0.08)';
                let color = 'rgba(255,255,255,0.7)';

                if (showResult && isAnswer) { bg = 'rgba(76,175,80,0.15)'; border = 'rgba(76,175,80,0.4)'; color = '#4caf50'; }
                else if (showResult && isSelected && !isAnswer) { bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.3)'; color = '#ef4444'; }
                else if (!showResult && isSelected) { bg = 'rgba(0,229,255,0.1)'; border = 'rgba(0,229,255,0.3)'; color = '#00e5ff'; }

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
            // Open answer
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map(letter => (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  disabled={answered}
                  className="w-full text-left px-4 py-2 rounded-xl transition-all text-sm font-mono"
                  style={{
                    background: selected === letter ? (isCorrect ? 'rgba(76,175,80,0.15)' : 'rgba(239,68,68,0.12)') : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selected === letter ? (isCorrect ? 'rgba(76,175,80,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.08)'}`,
                    color: selected === letter ? (isCorrect ? '#4caf50' : '#ef4444') : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback + Next */}
      {answered && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {isCorrect
              ? `Correto! +${FLOOR_REWARDS[currentFloor]?.coins ?? 0} moedas`
              : `Errado. Resposta: ${currentQuestion?.correct_answer}`}
          </div>
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
            style={{
              background: isCorrect ? 'rgba(0,229,255,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isCorrect ? 'rgba(0,229,255,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: isCorrect ? '#00e5ff' : '#ef4444',
            }}
          >
            {isSaving
              ? <Loader2 size={15} className="animate-spin" />
              : isCorrect
              ? <><ChevronRight size={15} /> {currentFloor + 1 >= Math.min(TOTAL_FLOORS, questions.length) ? 'Finalizar' : 'Próximo andar'}</>
              : 'Encerrar dungeon'}
          </button>
        </div>
      )}
    </div>
  );
}

