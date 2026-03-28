import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle';
import { ELEMENT_META } from '@/types/character';
import { useBattleEngine } from '@/hooks/useBattleEngine';
import { HPBar }             from './HPBar';
import { BattleAbilityMenu } from './BattleAbilityMenu';
import { BattleLog }         from './BattleLog';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleScreenProps {
  player:            BattleCharacter;
  enemy:             BattleEnemy;
  equippedAbilities: Ability[];
  onVictory:         (xp: number, coins: number) => void;
  onDefeat:          () => void;
  onFled?:           () => void;
}

// ─── Item modal ───────────────────────────────────────────────────────────────

const ITEMS = [
  { label: 'Poção (+50 HP)',          effect: 'heal'   as const, value: 50,  icon: '🧪' },
  { label: 'Poção Grande (+150 HP)',  effect: 'heal'   as const, value: 150, icon: '💊' },
  { label: 'Éter (+30 Energia)',      effect: 'energy' as const, value: 30,  icon: '⚡' },
  { label: 'Antídoto (cura status)', effect: 'cure'   as const, value: 0,   icon: '🌿' },
];

// ─── Phase overlay label ──────────────────────────────────────────────────────

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'PLAYER_TURN': return 'Seu turno';
    case 'ENEMY_TURN':
    case 'PROCESSING':  return 'Turno do inimigo...';
    case 'VICTORY':     return '🏆 Vitória!';
    case 'DEFEAT':      return '💀 Derrota!';
    case 'FLED':        return '🏃 Fugiu!';
    default:            return '';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BattleScreen({
  player,
  enemy,
  equippedAbilities,
  onVictory,
  onDefeat,
  onFled,
}: BattleScreenProps) {
  const { ctx, startBattle, playerAttack, useItem, flee } = useBattleEngine();
  const [showItems, setShowItems] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy,  setShakeEnemy]  = useState(false);
  const [prevPlayerHp, setPrevPlayerHp] = useState(player.hpCurrent);
  const [prevEnemyHp,  setPrevEnemyHp]  = useState(enemy.hpCurrent);

  // Start battle on mount
  useEffect(() => {
    startBattle(player, enemy, equippedAbilities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect HP changes → shake animation
  useEffect(() => {
    if (!ctx) return;

    if (ctx.player.hpCurrent < prevPlayerHp) {
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 400);
    }
    if (ctx.enemy.hpCurrent < prevEnemyHp) {
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 400);
    }
    setPrevPlayerHp(ctx.player.hpCurrent);
    setPrevEnemyHp(ctx.enemy.hpCurrent);
  }, [ctx?.player.hpCurrent, ctx?.enemy.hpCurrent]); // eslint-disable-line

  // Handle end states
  useEffect(() => {
    if (!ctx) return;
    if (ctx.phase === 'VICTORY') {
      const xp    = ctx.rewards?.xp    ?? 0;
      const coins = ctx.rewards?.coins  ?? 0;
      const timer = setTimeout(() => onVictory(xp, coins), 1800);
      return () => clearTimeout(timer);
    }
    if (ctx.phase === 'DEFEAT') {
      const timer = setTimeout(() => onDefeat(), 1800);
      return () => clearTimeout(timer);
    }
    if (ctx.phase === 'FLED') {
      const timer = setTimeout(() => onFled?.(), 1000);
      return () => clearTimeout(timer);
    }
  }, [ctx?.phase]); // eslint-disable-line

  if (!ctx) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: 320, color: 'rgba(0,229,255,0.5)',
          fontSize: '0.9rem', letterSpacing: 2,
        }}
      >
        INICIANDO BATALHA...
      </div>
    );
  }

  const enemyMeta  = ELEMENT_META[ctx.enemy.elementType];
  const isEnded    = ['VICTORY','DEFEAT','FLED'].includes(ctx.phase);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        padding: '12px 8px',
        position: 'relative',
      }}
    >
      {/* ═══ Turn indicator ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div
          style={{
            fontSize: '0.65rem',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'rgba(0,229,255,0.5)',
          }}
        >
          TURNO {ctx.turn}
        </div>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: 1.5,
            color:
              ctx.phase === 'PLAYER_TURN' ? '#4ade80' :
              ctx.phase === 'VICTORY'     ? '#fbbf24' :
              ctx.phase === 'DEFEAT'      ? '#f87171' :
              'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
          }}
        >
          {phaseLabel(ctx.phase)}
        </div>
      </div>

      {/* ═══ Battle arena ════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          padding: '16px 12px',
          background: 'linear-gradient(160deg, rgba(0,0,0,0.6), rgba(10,15,30,0.8))',
          border: '1px solid rgba(0,229,255,0.15)',
          overflow: 'hidden',
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Background element glow */}
        {enemyMeta?.color && (
          <div
            style={{
              position: 'absolute',
              top: 0, right: 0,
              width: 200, height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${enemyMeta.color}22 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Enemy side */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Enemy sprite / icon */}
          <motion.div
            animate={shakeEnemy ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
            style={{
              width: 72, height: 72,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10,
              background: enemyMeta?.color
                ? `radial-gradient(circle, ${enemyMeta.color}30 0%, rgba(0,0,0,0.3) 100%)`
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${enemyMeta?.color ?? 'rgba(255,255,255,0.1)'}44`,
            }}
          >
            {ctx.enemy.spriteUrl ? (
              <img
                src={ctx.enemy.spriteUrl}
                alt={ctx.enemy.name}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                }}
              />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>
                {ctx.enemy.isBoss ? '👾' : enemyMeta?.icon ?? '👹'}
              </span>
            )}
          </motion.div>

          {/* Enemy HP bars */}
          <div style={{ flex: 1 }}>
            <HPBar
              label={`${ctx.enemy.name} Lv.${ctx.enemy.level}`}
              current={ctx.enemy.hpCurrent}
              max={ctx.enemy.hpMax}
              status={ctx.enemyStatus?.type ?? null}
              flip
            />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent)',
          }}
        />

        {/* Player side */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Player avatar */}
          <motion.div
            animate={shakePlayer ? { x: [0, 6, -6, 4, -4, 0] } : {}}
            transition={{ duration: 0.35 }}
            style={{
              width: 56, height: 56,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              fontSize: '1.8rem',
            }}
          >
            🧙
          </motion.div>

          {/* Player HP + Energy bars */}
          <div style={{ flex: 1 }}>
            <HPBar
              label={`${ctx.player.name} Lv.${ctx.player.level}`}
              current={ctx.player.hpCurrent}
              max={ctx.player.hpMax}
              energy={ctx.playerEnergy}
              energyMax={ctx.player.energyMax}
              status={ctx.playerStatus?.type ?? null}
            />
          </div>
        </div>
      </div>

      {/* ═══ Battle Log ══════════════════════════════════════════════════════ */}
      <BattleLog entries={ctx.log} maxLines={5} />

      {/* ═══ Action menu ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isEnded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <BattleAbilityMenu
              abilities={ctx.equippedAbilities}
              playerEnergy={ctx.playerEnergy}
              phase={ctx.phase}
              onAbility={playerAttack}
              onItem={() => setShowItems(true)}
              onFlee={flee}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ End overlay ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              gap: 8,
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: '3rem' }}>
              {ctx.phase === 'VICTORY' ? '🏆' : ctx.phase === 'FLED' ? '🏃' : '💀'}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                letterSpacing: 3,
                color:
                  ctx.phase === 'VICTORY' ? '#fbbf24' :
                  ctx.phase === 'FLED'    ? '#94a3b8' : '#f87171',
                textTransform: 'uppercase',
                textShadow:
                  ctx.phase === 'VICTORY'
                    ? '0 0 20px rgba(251,191,36,0.8)'
                    : ctx.phase === 'DEFEAT'
                      ? '0 0 20px rgba(248,113,113,0.8)'
                      : 'none',
              }}
            >
              {ctx.phase === 'VICTORY' ? 'Vitória!' : ctx.phase === 'FLED' ? 'Fugiu!' : 'Derrota!'}
            </span>
            {ctx.phase === 'VICTORY' && ctx.rewards && (
              <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>✨ +{ctx.rewards.xp} XP</span>
                {ctx.rewards.coins && <span>🪙 +{ctx.rewards.coins}</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Item modal ═════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showItems && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowItems(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              style={{
                position: 'fixed',
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                width: 280,
                background: 'rgba(8,12,24,0.97)',
                border: '1px solid rgba(0,229,255,0.25)',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#67e8f9',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                🧪 Usar Item
              </div>

              {ITEMS.map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    useItem(item.effect, item.value);
                    setShowItems(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,229,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,229,255,0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              <button
                onClick={() => setShowItems(false)}
                style={{
                  marginTop: 4,
                  padding: '8px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  letterSpacing: 1,
                }}
              >
                Cancelar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
