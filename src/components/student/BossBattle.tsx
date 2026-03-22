import { useState } from "react";
import { Skull, Zap, ChevronLeft, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { useBossBattle, useBattleSession } from "@/hooks/useBossBattle";
import type { Student, BossBattle as BossBattleType } from "@/types";

// Map character class name → icon id
const CLASS_ICON: Record<string, string> = {
  Guerreiro: 'sword', Mago: 'wand', Arqueiro: 'bow', Curandeiro: 'heart',
  Engenheiro: 'scroll', Alquimista: 'potion', Bardo: 'star', Espião: 'gem',
  Monge: 'flame', Necromante: 'skull', Paladino: 'shield', Druida: 'scroll',
  Cavaleiro: 'sword', Oráculo: 'star', Samurai: 'sword',
};

// Boss HP bar
function HpBar({ current, max, className = "" }: { current: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? '#ef4444' : pct > 25 ? '#f97316' : '#dc2626';
  return (
    <div className={`w-full h-3 rounded-full ${className}`} style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
      />
    </div>
  );
}

// Difficulty badge config
const DIFFICULTY_CONFIG = {
  easy:      { label: 'Fácil',    color: 'text-green-400',  bg: 'rgba(76,175,80,0.12)'  },
  normal:    { label: 'Normal',   color: 'text-cyan-400',   bg: 'rgba(0,229,255,0.12)'  },
  hard:      { label: 'Difícil',  color: 'text-orange-400', bg: 'rgba(255,107,53,0.12)' },
  legendary: { label: 'Lendário',color: 'text-yellow-400', bg: 'rgba(255,215,0,0.12)'  },
};

// Format time mm:ss
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Per-question countdown ring
function QuestionTimer({ timeLeft }: { timeLeft: number }) {
  const pct = timeLeft / 30;
  const urgent = timeLeft <= 10;
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={urgent ? '#ef4444' : '#00e5ff'}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span
        className="absolute font-bold text-sm"
        style={{ fontFamily: 'Rajdhani, sans-serif', color: urgent ? '#ef4444' : '#00e5ff' }}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// ─── BATTLE SCREEN ─────────────────────────────────────────────────────────────

export function BattleScreen({
  bossId,
  student,
  onExit,
  onRetry,
}: {
  bossId: string;
  student: Student;
  onExit: () => void;
  onRetry: () => void;
}) {
  const {
    boss, questions, currentIndex, totalDamage, isFinished, isDefeated,
    lastResult, isLoading, timeLeft, questionTimeLeft, currentHp, hpPct, submitAnswer,
  } = useBattleSession(bossId, student.id);

  if (isLoading || !boss) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0a0408 0%, #1a0a0e 40%, #2d1015 100%)', zIndex: 200 }}
      >
        <div className="w-10 h-10 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      </div>
    );
  }

  const question = questions[currentIndex];
  const diffConfig = DIFFICULTY_CONFIG[boss.difficulty] ?? DIFFICULTY_CONFIG.normal;
  const studentIconId = CLASS_ICON[student.character_class ?? ''] ?? 'user';

  // ── RESULT SCREEN ──
  if (isFinished) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(180deg, #0a0408 0%, #1a0a0e 40%, #2d1015 100%)', zIndex: 200 }}
      >
        {isDefeated ? (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.12)', border: '2px solid rgba(255,215,0,0.4)' }}>
                <Trophy size={40} className="text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '4px' }}>
                BOSS DERROTADO!
              </h2>
              <p className="text-white/50 text-sm">{boss.boss_name} foi eliminado</p>
            </div>
            <div className="holo-panel-gold w-full max-w-sm p-5 space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Dano Total</span>
                <span className="text-red-400 font-bold">{totalDamage}/{boss.boss_hp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Moedas</span>
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  <GameIcon id="coin" size={16} /> +{boss.reward_coins}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>XP</span>
                <span className="text-cyan-400 font-bold">+{boss.reward_xp}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)' }}>
                <Skull size={40} className="text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-red-400 mb-1" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>
                BOSS SOBREVIVEU
              </h2>
              <p className="text-white/50 text-sm">Continue tentando — você vai melhorar!</p>
            </div>
            <div className="holo-panel w-full max-w-sm p-5 space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Dano causado</span>
                <span className="text-orange-400 font-bold">{totalDamage}/{boss.boss_hp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Score</span>
                <span className="text-white font-bold">{Math.round((totalDamage / boss.boss_hp) * 100)}%</span>
              </div>
            </div>
          </>
        )}
        <div className="flex gap-3">
          <button onClick={onExit} className="btn-cyber gap-2">
            <ChevronLeft size={16} /> Voltar
          </button>
          {!isDefeated && (
            <button onClick={onRetry} className="btn-cyber gap-2">
              <RotateCcw size={16} /> Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0a0408 0%, #1a0a0e 20%, #2d1015 40%, #3d1518 55%, #2d1015 70%, #1a0a0e 90%)', zIndex: 200 }}
    >
      {/* Hit/Miss overlay */}
      {lastResult && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all"
          style={{ background: lastResult === 'hit' ? 'rgba(0,255,100,0.04)' : 'rgba(255,50,50,0.06)' }}
        />
      )}

      {/* Header: boss vs student + HP */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        {/* VS row */}
        <div className="flex items-center justify-between mb-3">
          {/* Boss side */}
          <div className="flex items-center gap-2 min-w-0">
            <GameIcon id="dragon" size={36} ringColor="#ef4444" fillColor="#ef4444" bgColor="rgba(239,68,68,0.1)" />
            <div className="min-w-0">
              <h2 className="font-bold text-white text-base truncate" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                {boss.boss_name}
              </h2>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${diffConfig.color}`} style={{ background: diffConfig.bg }}>
                {diffConfig.label}
              </span>
            </div>
          </div>

          {/* HP counter */}
          <div className="flex flex-col items-center px-2 flex-shrink-0">
            <span className="text-red-400 font-bold text-xs" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              HP {currentHp}/{boss.boss_hp}
            </span>
            {timeLeft !== null && (
              <p className={`text-xs mt-0.5 ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-white/40'}`}>
                {formatTime(timeLeft)}
              </p>
            )}
          </div>

          {/* Student side */}
          <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
            <GameIcon id={studentIconId} size={36} ringColor="#00e5ff" fillColor="#00e5ff" bgColor="rgba(0,229,255,0.08)" />
            <div className="min-w-0 text-right">
              <p className="font-bold text-cyan-400 text-base truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {student.character_name || student.name}
              </p>
              <p className="text-white/40 text-xs">{student.character_class ?? 'Guerreiro'}</p>
            </div>
          </div>
        </div>

        {/* Boss HP bar */}
        <HpBar current={currentHp} max={boss.boss_hp} />
      </div>

      {/* Battle area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Question counter + per-question timer */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/40 text-xs uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Pergunta {currentIndex + 1} de {questions.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-red-400 text-sm font-bold flex items-center gap-1">
              <Zap size={14} /> {totalDamage} dano
            </span>
            <QuestionTimer timeLeft={questionTimeLeft} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="cyber-progress h-0.5 mb-5">
          <div className="cyber-progress-bar" style={{ width: `${(currentIndex / questions.length) * 100}%`, background: '#ef4444', boxShadow: '0 0 4px rgba(239,68,68,0.5)' }} />
        </div>

        {/* Question */}
        {question && (
          <>
            <div className="holo-panel p-4 mb-5 flex-shrink-0" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
              <p className="text-white text-base leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.05rem' }}>
                {question.question_text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-red-400/60 uppercase tracking-wider">
                  {question.question_type === 'multiple_choice' ? 'Múltipla Escolha' : question.question_type === 'true_false' ? 'V ou F' : 'Resposta Aberta'}
                </span>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-orange-400">{question.damage} dano</span>
              </div>
            </div>

            {/* Answers */}
            {question.question_type === 'multiple_choice' && question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(question.options as string[]).map((opt, i) => {
                  const letter = ['A', 'B', 'C', 'D'][i];
                  return (
                    <button
                      key={i}
                      onClick={() => submitAnswer(letter)}
                      disabled={lastResult !== null}
                      className="p-4 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: 'Rajdhani, sans-serif',
                      }}
                    >
                      <span className="text-red-400 font-bold mr-2">{letter})</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {question.question_type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {[['Verdadeiro', 'Verdadeiro'], ['Falso', 'Falso']].map(([label, val]) => (
                  <button
                    key={val}
                    onClick={() => submitAnswer(val)}
                    disabled={lastResult !== null}
                    className="p-5 rounded-lg text-center transition-all hover:scale-[1.02] font-bold text-lg"
                    style={{
                      background: val === 'Verdadeiro' ? 'rgba(76,175,80,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${val === 'Verdadeiro' ? 'rgba(76,175,80,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      color: val === 'Verdadeiro' ? '#4caf50' : '#ef4444',
                      fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '2px',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {question.question_type === 'text' && (
              <TextAnswerForm onSubmit={submitAnswer} disabled={lastResult !== null} />
            )}

            {/* Hit/Miss feedback */}
            {lastResult && (
              <div
                className={`mt-4 p-3 rounded-lg text-center font-bold text-lg animate-fade-in-up ${lastResult === 'hit' ? 'text-green-400' : 'text-red-400'}`}
                style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', background: lastResult === 'hit' ? 'rgba(76,175,80,0.1)' : 'rgba(239,68,68,0.1)' }}
              >
                {lastResult === 'hit' ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> HIT! -{question.damage} HP
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <XCircle size={20} /> MISS!
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Escape button */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onExit} className="text-white/20 hover:text-white/50 text-xs flex items-center gap-1 transition-colors">
          <ChevronLeft size={12} /> Abandonar batalha
        </button>
      </div>
    </div>
  );
}

// Text answer form
function TextAnswerForm({ onSubmit, disabled }: { onSubmit: (v: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); if (value.trim()) { onSubmit(value.trim()); setValue(""); } }} className="flex gap-3">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Digite sua resposta..."
        className="flex-1 px-4 py-3 rounded-lg text-sm"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(255,255,255,0.85)', outline: 'none', fontFamily: 'Exo 2, sans-serif' }}
      />
      <button type="submit" disabled={disabled || !value.trim()} className="btn-cyber px-4">
        <Zap size={16} />
      </button>
    </form>
  );
}

// ─── BOSS SELECTION LIST ───────────────────────────────────────────────────────

export function BossBattleTab({
  student,
  onStartBoss,
}: {
  student: Student;
  onStartBoss: (bossId: string) => void;
}) {
  const { activeBosses, isLoading, getBossAttempt, loadBosses } = useBossBattle(student.id);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (activeBosses.length === 0) {
    return (
      <div className="holo-panel text-center py-12 text-white/40">
        <GameIcon id="dragon" size={56} ringColor="rgba(255,255,255,0.2)" fillColor="rgba(255,255,255,0.2)" bgColor="rgba(255,255,255,0.03)" className="mx-auto mb-4" />
        <p className="font-bold" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>NENHUM BOSS ATIVO</p>
        <p className="text-sm mt-1 text-white/25">Aguarde seu professor criar uma batalha</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="section-title">
        <span>Boss Battles</span>
      </div>
      {activeBosses.map((boss: BossBattleType) => {
        const attempt = getBossAttempt(boss.id);
        const diffConfig = DIFFICULTY_CONFIG[boss.difficulty] ?? DIFFICULTY_CONFIG.normal;
        return (
          <div key={boss.id} className="holo-panel relative overflow-hidden" style={{ borderColor: attempt?.boss_defeated ? 'rgba(255,215,0,0.3)' : 'rgba(239,68,68,0.15)' }}>
            {!attempt?.boss_defeated && (
              <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ boxShadow: 'inset 0 0 30px rgba(239,68,68,0.04)' }} />
            )}
            <div className="flex items-center gap-4">
              <GameIcon id="dragon" size={52} ringColor="#ef4444" fillColor="#ef4444" bgColor="rgba(239,68,68,0.08)" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                    {boss.boss_name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffConfig.color}`} style={{ background: diffConfig.bg }}>
                    {diffConfig.label}
                  </span>
                </div>
                {boss.title && <p className="text-white/40 text-xs mb-2">{boss.title}</p>}
                <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                  <span>HP: {boss.boss_hp}</span>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <GameIcon id="coin" size={12} /> {boss.reward_coins}
                  </span>
                  <span className="text-cyan-400">XP +{boss.reward_xp}</span>
                  {boss.time_limit_minutes && <span>{boss.time_limit_minutes}min</span>}
                </div>
                {attempt && (
                  <div className="mt-2">
                    <HpBar current={Math.max(0, boss.boss_hp - attempt.total_damage)} max={boss.boss_hp} />
                    <p className="text-xs text-white/30 mt-1">Score anterior: {Math.round((attempt.total_damage / boss.boss_hp) * 100)}%</p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {attempt?.boss_defeated ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)' }}>
                      <Trophy size={18} className="text-yellow-400" />
                    </div>
                    <span className="text-xs text-yellow-400 font-bold">DERROTADO</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartBoss(boss.id)}
                    className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: '#ef4444',
                      fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '1px',
                    }}
                  >
                    {attempt ? 'REANFRENTAR' : 'ENFRENTAR'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
