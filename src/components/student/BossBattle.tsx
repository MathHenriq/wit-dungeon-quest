import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import confetti from "canvas-confetti";
import {
  Skull,
  Zap,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Clock,
  Swords,
} from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { CircularTimer } from "@/components/ui/CircularTimer";
import { HologramCard } from "@/components/ui/HologramCard";
import { StatBar } from "@/components/ui/StatBar";
import { NeonButton } from "@/components/ui/NeonButton";
import { useBossBattle, useBattleSession } from "@/hooks/useBossBattle";
import type { Student, BossBattle as BossBattleType } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASS_ICON: Record<string, string> = {
  Guerreiro: "sword",   Mago: "wand",    Arqueiro: "bow",   Curandeiro: "heart",
  Engenheiro: "scroll", Alquimista: "potion", Bardo: "star", Espião: "gem",
  Monge: "flame",       Necromante: "skull",  Paladino: "shield", Druida: "scroll",
  Cavaleiro: "sword",   Oráculo: "star",  Samurai: "sword",
};

const DIFFICULTY_CONFIG = {
  easy:      { label: "Fácil",    color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.35)",   glow: "rgba(74,222,128,0.3)",   atmo: "rgba(74,222,128,0.07)"   },
  normal:    { label: "Normal",   color: "#00d9ff", bg: "rgba(0,217,255,0.1)",    border: "rgba(0,217,255,0.35)",    glow: "rgba(0,217,255,0.3)",    atmo: "rgba(0,217,255,0.06)"    },
  hard:      { label: "Difícil",  color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.35)",   glow: "rgba(251,146,60,0.3)",   atmo: "rgba(251,146,60,0.08)"   },
  legendary: { label: "Lendário", color: "#a855f7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.4)",    glow: "rgba(168,85,247,0.35)",  atmo: "rgba(168,85,247,0.1)"    },
};

const DIFFICULTY_STAT_VARIANT: Record<string, "boss" | "legendary"> = {
  legendary: "legendary",
};

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

// ─── Confetti burst ───────────────────────────────────────────────────────────

function fireBossDefeatedConfetti() {
  const colors = ["#ffd60a", "#00d9ff", "#a855f7", "#ff006e", "#4ade80"];

  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors });

  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 50, origin: { x: 0 }, colors });
    confetti({ particleCount: 60, angle: 120, spread: 50, origin: { x: 1 }, colors });
  }, 350);

  setTimeout(() => {
    confetti({ particleCount: 40, spread: 90, origin: { y: 0.4 }, colors, gravity: 0.4 });
  }, 700);
}

// ─── Glow ring component ──────────────────────────────────────────────────────

function GlowRings({ color, size = 80 }: { color: string; size?: number }) {
  return (
    <div className="absolute" style={{ inset: -size / 2, pointerEvents: "none" }}>
      {[1, 1.4, 1.8].map((scale, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${color}`,
            opacity: 0.3 - i * 0.08,
            transform: `scale(${scale})`,
            animation: `ring-pulse 2s ease-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Answer button ────────────────────────────────────────────────────────────

type AnswerState = "default" | "correct" | "wrong" | "dimmed";

function AnswerButton({
  label,
  text,
  onClick,
  state,
  disabled,
  reduceMotion,
}: {
  label: string;
  text: string;
  onClick: () => void;
  state: AnswerState;
  disabled: boolean;
  reduceMotion: boolean;
}) {
  const styles = {
    default: { bg: "rgba(255,255,255,0.04)",   border: "rgba(0,217,255,0.2)",   color: "rgba(255,255,255,0.85)", labelBg: "rgba(0,217,255,0.12)",  labelColor: "#00d9ff" },
    correct: { bg: "rgba(74,222,128,0.12)",    border: "rgba(74,222,128,0.55)", color: "#4ade80",                labelBg: "rgba(74,222,128,0.2)",   labelColor: "#4ade80" },
    wrong:   { bg: "rgba(239,68,68,0.12)",     border: "rgba(239,68,68,0.55)",  color: "#f87171",                labelBg: "rgba(239,68,68,0.2)",    labelColor: "#ef4444" },
    dimmed:  { bg: "rgba(255,255,255,0.015)",  border: "rgba(255,255,255,0.06)","color": "rgba(255,255,255,0.2)", labelBg: "rgba(255,255,255,0.04)", labelColor: "rgba(255,255,255,0.18)" },
  };
  const s = styles[state];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={
        !reduceMotion && state === "wrong"
          ? { x: [-6, 6, -5, 5, -3, 3, 0] }
          : !reduceMotion && state === "correct"
          ? { scale: [1, 1.04, 1] }
          : {}
      }
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={!disabled && state === "default" && !reduceMotion ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !reduceMotion ? { scale: 0.97 } : {}}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        borderRadius: 12,
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        width: "100%",
        boxShadow:
          state === "correct" ? "0 0 28px rgba(74,222,128,0.25)"
          : state === "wrong" ? "0 0 28px rgba(239,68,68,0.2)"
          : "none",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Hexagon letter badge */}
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: s.labelBg,
          color: s.labelColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Orbitron, Rajdhani, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          transition: "all 0.2s",
        }}
      >
        {state === "correct" ? (
          <CheckCircle size={15} />
        ) : state === "wrong" ? (
          <XCircle size={15} />
        ) : (
          label
        )}
      </span>

      {/* Answer text */}
      <span
        style={{
          fontSize: 13,
          color: s["color"],
          fontFamily: "Exo 2, sans-serif",
          lineHeight: 1.4,
          fontWeight: state === "correct" || state === "wrong" ? 600 : 400,
          transition: "color 0.2s",
        }}
      >
        {text}
      </span>
    </motion.button>
  );
}

// ─── Text Answer Form ─────────────────────────────────────────────────────────

function TextAnswerForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (v: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(value.trim());
          setValue("");
        }
      }}
      style={{ display: "flex", gap: 10 }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Digite sua resposta..."
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(0,217,255,0.2)",
          color: "rgba(255,255,255,0.85)",
          outline: "none",
          fontFamily: "Exo 2, sans-serif",
          fontSize: 14,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(0,217,255,0.6)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(0,217,255,0.2)")}
      />
      <NeonButton
        type="submit"
        disabled={disabled || !value.trim()}
        variant="primary"
        size="md"
      >
        <Zap size={16} />
      </NeonButton>
    </form>
  );
}

// ─── BATTLE SCREEN ────────────────────────────────────────────────────────────

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
  const shouldReduceMotion = useReducedMotion();

  const {
    boss,
    questions,
    currentIndex,
    totalDamage,
    isFinished,
    isDefeated,
    lastResult,
    isLoading,
    timeLeft,
    questionTimeLeft,
    currentHp,
    submitAnswer,
  } = useBattleSession(bossId, student.id);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState<"hit" | "miss" | null>(null);
  const hasConfettiedRef = useRef(false);

  // Reset selected answer when question changes
  useEffect(() => {
    if (!lastResult) setSelectedAnswer(null);
  }, [lastResult]);

  // Flash overlay
  useEffect(() => {
    if (lastResult) {
      setShowFlash(lastResult);
      const t = setTimeout(() => setShowFlash(null), 500);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  // Confetti on boss defeat
  useEffect(() => {
    if (isFinished && isDefeated && !hasConfettiedRef.current) {
      hasConfettiedRef.current = true;
      setTimeout(fireBossDefeatedConfetti, 400);
    }
  }, [isFinished, isDefeated]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    submitAnswer(answer);
  };

  const studentIconId = CLASS_ICON[student.character_class ?? ""] ?? "user";
  const diffConfig =
    DIFFICULTY_CONFIG[boss?.difficulty as keyof typeof DIFFICULTY_CONFIG] ??
    DIFFICULTY_CONFIG.normal;
  const statVariant = DIFFICULTY_STAT_VARIANT[boss?.difficulty ?? ""] ?? "boss";

  // ── Loading ──
  if (isLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center cyber-grid"
        style={{
          background: "linear-gradient(180deg,#070810 0%,#0d0a14 100%)",
          zIndex: 200,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "2px solid rgba(0,217,255,0.15)",
              borderTop: "2px solid #00d9ff",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            className="font-orbitron text-glow-cyan"
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(0,217,255,0.7)",
              textTransform: "uppercase",
            }}
          >
            Invocando Boss...
          </span>
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!boss) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#07080c", zIndex: 200 }}
      >
        <Skull size={48} className="text-red-400/40" />
        <p className="font-orbitron" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "2px", fontSize: 12 }}>
          BOSS NÃO ENCONTRADO
        </p>
        <NeonButton onClick={onExit} variant="secondary">
          <ChevronLeft size={15} /> Voltar
        </NeonButton>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: "#07080c", zIndex: 200 }}
      >
        <Skull size={48} style={{ color: diffConfig.color, opacity: 0.5 }} />
        <p className="font-orbitron" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "3px", fontSize: 14 }}>
          {boss.boss_name}
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Este boss não possui perguntas.
        </p>
        <NeonButton onClick={onExit} variant="secondary">
          <ChevronLeft size={15} /> Voltar
        </NeonButton>
      </div>
    );
  }

  const question = questions[currentIndex];
  const answered = selectedAnswer !== null;
  const progressPct = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  // ── RESULT SCREEN ──
  if (isFinished) {
    return (
      <motion.div
        key="result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 flex flex-col items-center justify-center p-6 cyber-grid"
        style={{
          background: isDefeated
            ? "radial-gradient(ellipse at 50% 20%, rgba(255,214,10,0.1) 0%, #07080c 60%)"
            : "radial-gradient(ellipse at 50% 20%, rgba(239,68,68,0.1) 0%, #07080c 60%)",
          zIndex: 200,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
          style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}
        >
          {isDefeated ? (
            <>
              {/* Victory icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 12, delay: 0.2 }}
                style={{ position: "relative" }}
              >
                <div style={{
                  position: "absolute", inset: -24,
                  background: "radial-gradient(circle, rgba(255,214,10,0.25), transparent 70%)",
                  animation: "glow-breathe 2s ease-in-out infinite",
                }} />
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "rgba(255,214,10,0.08)",
                  border: "2px solid rgba(255,214,10,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  boxShadow: "0 0 30px rgba(255,214,10,0.3)",
                }}>
                  <Trophy size={48} style={{ color: "#ffd60a" }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ textAlign: "center" }}
              >
                <h2
                  className="font-orbitron text-glow-gold"
                  style={{ fontSize: 28, fontWeight: 900, color: "#ffd60a", letterSpacing: "0.08em", marginBottom: 8 }}
                >
                  BOSS DERROTADO!
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Exo 2, sans-serif" }}>
                  {boss.boss_name} foi eliminado
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ width: "100%" }}
              >
                <HologramCard accentColor="#ffd60a" noHover>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Dano Total", value: `${totalDamage} / ${boss.boss_hp}`, color: "#ef4444" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>{label}</span>
                        <span style={{ color, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: "rgba(255,214,10,0.1)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>Moedas</span>
                      <span style={{ color: "#ffd60a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <GameIcon id="coin" size={16} /> +{boss.reward_coins}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>XP</span>
                      <span style={{ color: "#00d9ff", fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>+{boss.reward_xp}</span>
                    </div>
                  </div>
                </HologramCard>
              </motion.div>
            </>
          ) : (
            <>
              {/* Defeat icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
                style={{ position: "relative" }}
              >
                <div style={{
                  position: "absolute", inset: -24,
                  background: "radial-gradient(circle, rgba(239,68,68,0.2), transparent 70%)",
                  animation: "glow-breathe 2s ease-in-out infinite",
                }} />
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "rgba(239,68,68,0.08)",
                  border: "2px solid rgba(239,68,68,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <Skull size={48} style={{ color: "#ef4444" }} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ textAlign: "center" }}>
                <h2 className="font-orbitron text-glow-red" style={{ fontSize: 26, fontWeight: 900, color: "#ef4444", letterSpacing: "0.08em", marginBottom: 8 }}>
                  BOSS SOBREVIVEU
                </h2>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, fontFamily: "Exo 2, sans-serif" }}>
                  Continue tentando — você vai melhorar!
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ width: "100%" }}>
                <HologramCard accentColor="#ef4444" noHover>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>Dano causado</span>
                      <span style={{ color: "#fb923c", fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{totalDamage} / {boss.boss_hp}</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>Desempenho</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>
                        {Math.round((totalDamage / boss.boss_hp) * 100)}%
                      </span>
                    </div>
                    <StatBar current={totalDamage} max={boss.boss_hp} variant="boss" showNumbers={false} />
                  </div>
                </HologramCard>
              </motion.div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ display: "flex", gap: 12 }}
          >
            <NeonButton onClick={onExit} variant="secondary">
              <ChevronLeft size={15} /> Voltar
            </NeonButton>
            {!isDefeated && (
              <NeonButton onClick={onRetry} variant="primary">
                <RotateCcw size={14} /> Tentar Novamente
              </NeonButton>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // ── MAIN BATTLE UI ──
  return (
    <div
      className="fixed inset-0 flex flex-col cyber-grid"
      style={{
        background: "linear-gradient(180deg,#070810 0%,#0d0a14 40%,#110b14 70%,#070810 100%)",
        zIndex: 200,
      }}
    >
      {/* Atmospheric boss aura */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 300,
          background: `radial-gradient(ellipse at 50% 0%, ${diffConfig.atmo} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Answer flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key={`flash-${Date.now()}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5,
              background: showFlash === "hit" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.1)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── BOSS SECTION ── */}
      <motion.div
        initial={!shouldReduceMotion ? { y: -20, opacity: 0 } : {}}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          flexShrink: 0,
          padding: "14px 18px 12px",
          borderBottom: `1px solid ${diffConfig.border}20`,
          position: "relative",
        }}
        className="glass-boss"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Boss icon with glow rings */}
          <motion.div
            initial={!shouldReduceMotion ? { scale: 0, rotate: -30 } : {}}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.15 }}
            style={{ position: "relative", flexShrink: 0 }}
          >
            <GlowRings color={diffConfig.glow} size={60} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <GameIcon
                id="dragon"
                size={58}
                ringColor={diffConfig.color}
                fillColor={diffConfig.color}
                bgColor={`${diffConfig.color}12`}
              />
            </div>
          </motion.div>

          {/* Boss name + difficulty + HP */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
              <motion.h2
                initial={!shouldReduceMotion ? { opacity: 0, x: -10 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="font-orbitron"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: "0.06em",
                  margin: 0,
                  lineHeight: 1,
                  textShadow: `0 0 20px ${diffConfig.color}40`,
                }}
              >
                {boss.boss_name}
              </motion.h2>
              <span
                className="badge-angled"
                style={{
                  padding: "2px 10px",
                  fontSize: 9,
                  fontFamily: "Orbitron, Rajdhani, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: diffConfig.color,
                  background: diffConfig.bg,
                }}
              >
                {diffConfig.label}
              </span>
            </div>
            <StatBar
              current={currentHp}
              max={boss.boss_hp}
              variant={statVariant}
              thick
              showNumbers
            />
          </div>

          {/* Circular timer */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <CircularTimer timeLeft={questionTimeLeft} totalTime={30} size={60} />
            {timeLeft !== null && (
              <span style={{
                fontSize: 9, display: "flex", alignItems: "center", gap: 2,
                color: timeLeft < 60 ? "#ef4444" : "rgba(255,255,255,0.25)",
                fontFamily: "Rajdhani, sans-serif", fontWeight: 600, letterSpacing: "0.06em",
              }}>
                <Clock size={8} /> {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>

        {/* Progress track */}
        <div style={{ marginTop: 10, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              height: "100%",
              borderRadius: 1,
              background: `linear-gradient(90deg, ${diffConfig.color}80, ${diffConfig.color})`,
              boxShadow: `0 0 6px ${diffConfig.glow}`,
            }}
          />
        </div>
      </motion.div>

      {/* ── CONTENT: QUESTION + ANSWERS ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "14px 18px",
          gap: 12,
        }}
      >
        {/* Question counter + damage */}
        <motion.div
          initial={!shouldReduceMotion ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{
            fontFamily: "Orbitron, sans-serif", fontSize: 10,
            letterSpacing: "0.16em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
          }}>
            Pergunta {currentIndex + 1} / {questions.length}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 12, color: "#ef4444", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "Rajdhani, sans-serif",
            }}>
              <Swords size={12} /> {totalDamage} dano
            </span>
            {question?.damage && (
              <span style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 11,
                color: diffConfig.color,
                background: diffConfig.bg,
                fontFamily: "Rajdhani, sans-serif", fontWeight: 600,
              }}>
                -{question.damage} HP
              </span>
            )}
          </div>
        </motion.div>

        {/* Question card — AnimatePresence for transitions */}
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={`q-${currentIndex}`}
              initial={!shouldReduceMotion ? { opacity: 0, x: 60 } : {}}
              animate={{ opacity: 1, x: 0 }}
              exit={!shouldReduceMotion ? { opacity: 0, x: -60 } : {}}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <HologramCard accentColor={diffConfig.color} noHover>
                <div style={{ position: "relative" }}>
                  {/* Left accent bar */}
                  <div style={{
                    position: "absolute", top: -4, left: -20, bottom: -4, width: 3,
                    background: `linear-gradient(180deg, ${diffConfig.color}80, transparent)`,
                    borderRadius: 2,
                  }} />
                  <p style={{
                    fontFamily: "Exo 2, sans-serif",
                    fontSize: 15,
                    color: "rgba(255,255,255,0.88)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}>
                    {question.question_text}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <span style={{
                      fontSize: 9, color: `${diffConfig.color}60`,
                      textTransform: "uppercase", letterSpacing: "0.12em",
                      fontFamily: "Orbitron, Rajdhani, sans-serif",
                    }}>
                      {question.question_type === "multiple_choice"
                        ? "Múltipla Escolha"
                        : question.question_type === "true_false"
                        ? "Verdadeiro ou Falso"
                        : "Resposta Aberta"}
                    </span>
                  </div>
                </div>
              </HologramCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Answers ── */}
        {question && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`answers-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Multiple Choice */}
              {question.question_type === "multiple_choice" && question.options && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(question.options as string[]).map((opt, i) => {
                    const letter = ["A", "B", "C", "D"][i];
                    let state: AnswerState = "default";
                    if (answered) {
                      state = selectedAnswer === letter
                        ? lastResult === "hit" ? "correct" : "wrong"
                        : "dimmed";
                    }
                    return (
                      <motion.div
                        key={i}
                        initial={!shouldReduceMotion ? { opacity: 0, y: 14 } : {}}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                      >
                        <AnswerButton
                          label={letter}
                          text={opt}
                          onClick={() => handleAnswer(letter)}
                          state={state}
                          disabled={answered}
                          reduceMotion={!!shouldReduceMotion}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {question.question_type === "true_false" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "V", text: "Verdadeiro", value: "Verdadeiro", accent: "#4ade80" },
                    { label: "F", text: "Falso",      value: "Falso",      accent: "#ef4444" },
                  ].map(({ label, text, value, accent }, i) => {
                    let state: AnswerState = "default";
                    if (answered) {
                      state = selectedAnswer === value
                        ? lastResult === "hit" ? "correct" : "wrong"
                        : "dimmed";
                    }
                    return (
                      <motion.div
                        key={value}
                        initial={!shouldReduceMotion ? { opacity: 0, y: 14 } : {}}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.06 }}
                      >
                        <AnswerButton
                          label={label}
                          text={text}
                          onClick={() => handleAnswer(value)}
                          state={state}
                          disabled={answered}
                          reduceMotion={!!shouldReduceMotion}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Text answer */}
              {question.question_type === "text" && (
                <motion.div
                  initial={!shouldReduceMotion ? { opacity: 0, y: 10 } : {}}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <TextAnswerForm onSubmit={submitAnswer} disabled={answered} />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Feedback banner */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={`feedback-${currentIndex}`}
              initial={!shouldReduceMotion ? { opacity: 0, y: 8, scale: 0.96 } : {}}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: "11px 16px",
                borderRadius: 10,
                background: lastResult === "hit" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${lastResult === "hit" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "Orbitron, Rajdhani, sans-serif", fontWeight: 700, fontSize: 13,
                letterSpacing: "0.1em",
                color: lastResult === "hit" ? "#4ade80" : "#ef4444",
              }}
            >
              {lastResult === "hit" ? (
                <><CheckCircle size={16} /> HIT! -{question?.damage} HP</>
              ) : (
                <><XCircle size={16} /> MISS! Sem dano</>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        flexShrink: 0, padding: "10px 18px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(0,0,0,0.2)",
      }}>
        <button
          onClick={onExit}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            color: "rgba(255,255,255,0.2)", fontSize: 11,
            fontFamily: "Exo 2, sans-serif",
            background: "none", border: "none", cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
        >
          <ChevronLeft size={12} /> Abandonar batalha
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GameIcon id={studentIconId} size={22} ringColor="#00d9ff" fillColor="#00d9ff" bgColor="rgba(0,217,255,0.08)" />
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 11, color: "rgba(0,217,255,0.55)", letterSpacing: "0.06em" }}>
            {student.character_name || student.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── BOSS SELECTION LIST ──────────────────────────────────────────────────────

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
      <div style={{ textAlign: "center", padding: "64px 0" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "2px solid rgba(0,217,255,0.15)", borderTop: "2px solid #00d9ff",
          animation: "spin 0.8s linear infinite", margin: "0 auto",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (activeBosses.length === 0) {
    return (
      <div className="holo-panel text-center py-12">
        <GameIcon id="dragon" size={56} ringColor="rgba(255,255,255,0.12)" fillColor="rgba(255,255,255,0.12)" bgColor="rgba(255,255,255,0.03)" className="mx-auto mb-4" />
        <p className="font-orbitron" style={{ fontSize: 13, letterSpacing: "2px", color: "rgba(255,255,255,0.3)" }}>
          NENHUM BOSS ATIVO
        </p>
        <p style={{ fontSize: 13, marginTop: 6, color: "rgba(255,255,255,0.2)", fontFamily: "Exo 2, sans-serif" }}>
          Aguarde seu professor criar uma batalha
        </p>
        <button
          onClick={() => loadBosses()}
          style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "Exo 2, sans-serif",
            background: "none", border: "none", cursor: "pointer", transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
        >
          <RotateCcw size={11} /> Atualizar lista
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="section-title">
        <span>Boss Battles</span>
        <button
          onClick={() => loadBosses()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
          title="Atualizar"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {activeBosses.map((boss: BossBattleType, idx: number) => {
        const attempt = getBossAttempt(boss.id);
        const diffConfig =
          DIFFICULTY_CONFIG[boss.difficulty as keyof typeof DIFFICULTY_CONFIG] ??
          DIFFICULTY_CONFIG.normal;
        const isDefeated = attempt?.boss_defeated;
        const prevPct = attempt ? Math.min(100, (attempt.total_damage / boss.boss_hp) * 100) : 0;

        return (
          <motion.div
            key={boss.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <HologramCard accentColor={isDefeated ? "#ffd60a" : diffConfig.color} noPadding>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                {/* Boss icon */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <GameIcon
                    id="dragon"
                    size={52}
                    ringColor={isDefeated ? "#ffd60a" : diffConfig.color}
                    fillColor={isDefeated ? "#ffd60a" : diffConfig.color}
                    bgColor={isDefeated ? "rgba(255,214,10,0.08)" : `${diffConfig.color}10`}
                  />
                </div>

                {/* Boss info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <h3
                      className="font-orbitron"
                      style={{
                        fontSize: 14, fontWeight: 700, margin: 0,
                        color: isDefeated ? "#ffd60a" : "rgba(255,255,255,0.9)",
                        letterSpacing: "0.05em",
                        textShadow: isDefeated ? "0 0 16px rgba(255,214,10,0.4)" : undefined,
                      }}
                    >
                      {boss.boss_name}
                    </h3>
                    <span
                      className="badge-angled"
                      style={{
                        padding: "2px 10px", fontSize: 9,
                        fontFamily: "Orbitron, Rajdhani, sans-serif",
                        fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: diffConfig.color, background: diffConfig.bg,
                      }}
                    >
                      {diffConfig.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: attempt ? 8 : 0 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Rajdhani, sans-serif" }}>HP {boss.boss_hp}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ffd60a" }}>
                      <GameIcon id="coin" size={11} /> {boss.reward_coins}
                    </span>
                    <span style={{ fontSize: 11, color: "#00d9ff", fontFamily: "Rajdhani, sans-serif" }}>XP +{boss.reward_xp}</span>
                    {boss.time_limit_minutes && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                        <Clock size={9} /> {boss.time_limit_minutes}min
                      </span>
                    )}
                  </div>

                  {attempt && !isDefeated && (
                    <StatBar
                      current={attempt.total_damage}
                      max={boss.boss_hp}
                      variant="boss"
                      showNumbers={false}
                      label={`Última tentativa: ${Math.round(prevPct)}%`}
                    />
                  )}
                </div>

                {/* CTA */}
                <div style={{ flexShrink: 0 }}>
                  {isDefeated ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "rgba(255,214,10,0.1)",
                        border: "1px solid rgba(255,214,10,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 16px rgba(255,214,10,0.2)",
                      }}>
                        <Trophy size={18} style={{ color: "#ffd60a" }} />
                      </div>
                      <span className="font-orbitron" style={{ fontSize: 8, color: "#ffd60a", letterSpacing: "0.1em" }}>
                        DERROTADO
                      </span>
                    </div>
                  ) : (
                    <NeonButton onClick={() => onStartBoss(boss.id)} variant="primary" size="sm">
                      {attempt ? "REENF." : "ENFRENTAR"}
                    </NeonButton>
                  )}
                </div>
              </div>
            </HologramCard>
          </motion.div>
        );
      })}
    </div>
  );
}
