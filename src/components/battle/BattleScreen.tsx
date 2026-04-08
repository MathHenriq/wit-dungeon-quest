import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle';
import { ELEMENT_META } from '@/types/character';
import { useBattleEngine } from '@/hooks/useBattleEngine';
import './PokemonBattle.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleScreenProps {
  player:            BattleCharacter;
  enemy:             BattleEnemy;
  equippedAbilities: Ability[];
  onVictory:         (xp: number, coins: number) => void;
  onDefeat:          () => void;
  onFled?:           () => void;
}

// ─── Items ────────────────────────────────────────────────────────────────────

const ITEMS = [
  { label: 'Poção (+50 HP)',         effect: 'heal'   as const, value: 50,  icon: '🧪' },
  { label: 'Poção Grande (+150 HP)', effect: 'heal'   as const, value: 150, icon: '💊' },
  { label: 'Éter (+30 Energia)',     effect: 'energy' as const, value: 30,  icon: '⚡' },
  { label: 'Antídoto (cura status)', effect: 'cure'   as const, value: 0,   icon: '🌿' },
];

const STATUS_ICONS: Record<string, string> = {
  burn: '🔥', poison: '☠️', freeze: '❄️', paralyze: '⚡',
  sleep: '💤', confuse: '😵', blind: '🙈', stun: '💫',
  bleed: '🩸', curse: '💀', wet: '💧', fear: '😨',
};

// ─── HP % → color ─────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 0.5) return '#22c55e';
  if (pct > 0.25) return '#eab308';
  return '#ef4444';
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
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

  // Menu state
  const [menu, setMenu] = useState<'main' | 'fight' | 'item'>('main');

  // Shake states
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeEnemy,  setShakeEnemy]  = useState(false);

  // Attack sprite
  const [showAttackSprite, setShowAttackSprite] = useState(false);

  // Attack effects
  const [attackEffect, setAttackEffect] = useState<{
    target: 'player' | 'enemy';
    color: string;
    active: boolean;
  } | null>(null);
  const [projectile, setProjectile] = useState<{
    active: boolean;
    from: 'player' | 'enemy';
    color: string;
    icon: string;
  } | null>(null);

  // Dialog message + log
  const [dialogMsg, setDialogMsg] = useState(`O que ${player.name} fará?`);
  const [recentLog, setRecentLog] = useState<string[]>([]);
  const prevLogLen = useRef(0);
  const prevPhase  = useRef('PLAYER_TURN');

  // Track last used ability for attack animation color
  const lastUsedAbilityRef = useRef<Ability | null>(null);

  // Active element for overlay effect
  const [activeElement, setActiveElement] = useState<string>('');
  const elementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Item modal
  const [showItems, setShowItems] = useState(false);

  // ── Start battle ────────────────────────────────────────────────────────────
  useEffect(() => {
    startBattle(player, enemy, equippedAbilities);
  }, []); // eslint-disable-line

  // ── Dialog logic + log + attack animations ──────────────────────────────────
  useEffect(() => {
    if (!ctx) return;

    // New log entry → update dialog + recent log + trigger attack animations
    if (ctx.log.length > prevLogLen.current) {
      const newEntries = ctx.log.slice(prevLogLen.current);
      const last = newEntries[newEntries.length - 1];
      setDialogMsg(last.message);
      setRecentLog(prev => [...prev, ...newEntries.map(e => e.message)].slice(-4));
      prevLogLen.current = ctx.log.length;

      // Trigger projectile + flash when an action is detected in the new entries
      const actionEntry = newEntries.find(e => e.type === 'action');
      if (actionEntry) {
        const isPlayerAtk = actionEntry.actor === 'player';

        // Determine color / icon from ability (player) or enemy element (enemy)
        let color = '#00e5ff';
        let icon  = '⚡';
        if (isPlayerAtk && lastUsedAbilityRef.current) {
          const meta = ELEMENT_META[lastUsedAbilityRef.current.elementName];
          color = meta?.color ?? '#00e5ff';
          icon  = meta?.icon  ?? '⚡';
        } else if (!isPlayerAtk) {
          const meta = ELEMENT_META[ctx.enemy.elementType];
          color = meta?.color ?? '#ef4444';
          icon  = meta?.icon  ?? '💥';
        }

        if (isPlayerAtk) setShowAttackSprite(true);
        setProjectile({ active: true, from: isPlayerAtk ? 'player' : 'enemy', color, icon });

        const hasDamage = newEntries.some(e => e.type === 'damage');
        setTimeout(() => {
          setProjectile(null);
          setShowAttackSprite(false);
          if (hasDamage) {
            setAttackEffect({ target: isPlayerAtk ? 'enemy' : 'player', color, active: true });
            setTimeout(() => setAttackEffect(null), 350);
          }
        }, 450);
      }

      return;
    }

    // Phase changed (no new log entries)
    if (ctx.phase !== prevPhase.current) {
      prevPhase.current = ctx.phase;
      if (ctx.phase === 'PLAYER_TURN') {
        setDialogMsg(`O que ${ctx.player.name} fará?`);
      } else if (ctx.phase === 'VICTORY') {
        setDialogMsg(`Você venceu! +${ctx.rewards?.xp ?? 0} XP`);
      } else if (ctx.phase === 'DEFEAT') {
        setDialogMsg('Você foi derrotado...');
      } else if (ctx.phase === 'FLED') {
        setDialogMsg('Fugiu com segurança!');
      }
    }
  }, [ctx?.log?.length, ctx?.phase]); // eslint-disable-line

  const { displayed: typeText, done: typeDone } = useTypewriter(dialogMsg);

  // ── Shake animations ────────────────────────────────────────────────────────
  const prevPlayerHp = useRef(player.hpCurrent);
  const prevEnemyHp  = useRef(enemy.hpCurrent);

  useEffect(() => {
    if (!ctx) return;
    if (ctx.player.hpCurrent < prevPlayerHp.current) {
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 400);
    }
    if (ctx.enemy.hpCurrent < prevEnemyHp.current) {
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 400);
    }
    prevPlayerHp.current = ctx.player.hpCurrent;
    prevEnemyHp.current  = ctx.enemy.hpCurrent;
  }, [ctx?.player.hpCurrent, ctx?.enemy.hpCurrent]); // eslint-disable-line

  // ── End states ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ctx) return;
    if (ctx.phase === 'VICTORY') {
      const t = setTimeout(() => onVictory(ctx.rewards?.xp ?? 0, ctx.rewards?.coins ?? 0), 2200);
      return () => clearTimeout(t);
    }
    if (ctx.phase === 'DEFEAT') {
      const t = setTimeout(() => onDefeat(), 2200);
      return () => clearTimeout(t);
    }
    if (ctx.phase === 'FLED') {
      const t = setTimeout(() => onFled?.(), 1200);
      return () => clearTimeout(t);
    }
  }, [ctx?.phase]); // eslint-disable-line

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (!ctx) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: 320,
        color: 'rgba(0,229,255,0.5)',
        fontSize: '0.9rem', letterSpacing: 2,
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
      }}>
        INICIANDO BATALHA...
      </div>
    );
  }

  const enemyMeta   = ELEMENT_META[ctx.enemy.elementType];
  const isPlayerTurn = ctx.phase === 'PLAYER_TURN';
  const isEnded      = ['VICTORY', 'DEFEAT', 'FLED'].includes(ctx.phase);

  const enemyHpPct  = Math.max(0, Math.min(1, ctx.enemy.hpCurrent / ctx.enemy.hpMax));
  const playerHpPct = Math.max(0, Math.min(1, ctx.player.hpCurrent / ctx.player.hpMax));
  const energyPct   = ctx.player.energyMax
    ? Math.max(0, Math.min(1, ctx.playerEnergy / ctx.player.energyMax))
    : 0;

  // Current player sprite (back or attack)
  const playerSprite = showAttackSprite && ctx.player.spritePixelAttack
    ? ctx.player.spritePixelAttack
    : ctx.player.spritePixelBack;

  return (
    <div className="poke-scene" data-element={activeElement}>

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div className="poke-bg" />

      {/* Element glow top-right */}
      {enemyMeta?.color && (
        <div
          className="poke-element-glow"
          style={{ background: `radial-gradient(circle, ${enemyMeta.color}18 0%, transparent 70%)` }}
        />
      )}

      {/* ── Turn badge ──────────────────────────────────────────────────────── */}
      <div className="poke-turn-badge">
        TURNO {ctx.turn} &nbsp;·&nbsp;
        <span style={{
          color: isPlayerTurn ? '#4ade80' : ctx.phase === 'VICTORY' ? '#fbbf24' : ctx.phase === 'DEFEAT' ? '#f87171' : 'rgba(255,255,255,0.4)',
        }}>
          {isPlayerTurn ? 'SEU TURNO' : ctx.phase === 'ENEMY_TURN' || ctx.phase === 'PROCESSING' ? 'TURNO DO INIMIGO' : ctx.phase}
        </span>
      </div>

      {/* ── Platforms ───────────────────────────────────────────────────────── */}
      <div className="poke-platform poke-platform-enemy" />
      <div className="poke-platform poke-platform-player" />

      {/* ── Enemy HP Box ────────────────────────────────────────────────────── */}
      <div className="poke-hpbox poke-hpbox-enemy">
        <div className="poke-hpbox-header">
          <span className="poke-hpbox-name">
            {ctx.enemy.name}
            {ctx.enemyStatus && STATUS_ICONS[ctx.enemyStatus.type] && (
              <span className="poke-status-badge">
                {STATUS_ICONS[ctx.enemyStatus.type]} {ctx.enemyStatus.type}
              </span>
            )}
          </span>
          <span className="poke-hpbox-level">Lv.{ctx.enemy.level}</span>
        </div>
        <div className="poke-hpbar-row">
          <span className="poke-hpbar-label">HP</span>
          <div className="poke-hpbar-track">
            <motion.div
              className="poke-hpbar-fill"
              style={{ backgroundColor: hpColor(enemyHpPct) }}
              initial={false}
              animate={{ width: `${enemyHpPct * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Projectile ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {projectile?.active && (
          <motion.div
            key="projectile"
            style={{
              position: 'absolute',
              zIndex: 10,
              fontSize: '1.6rem',
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 8px ${projectile.color})`,
            }}
            initial={projectile.from === 'player'
              ? { left: '18%', top: '62%', opacity: 1, scale: 1 }
              : { left: '65%', top: '22%', opacity: 1, scale: 1 }}
            animate={projectile.from === 'player'
              ? { left: '65%', top: '22%', opacity: 0, scale: 0.5 }
              : { left: '18%', top: '62%', opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.42, ease: 'easeIn' }}
          >
            {projectile.icon}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Enemy Sprite ────────────────────────────────────────────────────── */}
      <motion.div
        className="poke-sprite-wrapper poke-sprite-enemy"
        animate={shakeEnemy ? { x: [0, -8, 8, -5, 5, 0] } : {}}
        transition={{ duration: 0.35 }}
        style={{ position: 'absolute' }}
      >
        {ctx.enemy.spriteUrl ? (
          <img
            src={ctx.enemy.spriteUrl}
            alt={ctx.enemy.name}
            className="poke-sprite-img"
          />
        ) : (
          <div className="poke-sprite-placeholder poke-sprite-placeholder--enemy">
            <span>{ctx.enemy.isBoss ? '👾' : enemyMeta?.icon ?? '👹'}</span>
          </div>
        )}
        {/* Hit flash overlay */}
        <AnimatePresence>
          {attackEffect?.active && attackEffect.target === 'enemy' && (
            <motion.div
              key="enemy-flash"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: `radial-gradient(circle, white 10%, ${attackEffect.color}88 50%, transparent 75%)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Player Sprite ───────────────────────────────────────────────────── */}
      <motion.div
        className="poke-sprite-wrapper poke-sprite-player"
        animate={shakePlayer ? { x: [0, 8, -8, 5, -5, 0] } : {}}
        transition={{ duration: 0.35 }}
        style={{ position: 'absolute' }}
      >
        {playerSprite ? (
          <img
            src={playerSprite}
            alt={ctx.player.name}
            className="poke-sprite-img"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="poke-sprite-placeholder poke-sprite-placeholder--player">
            <span>🧙</span>
          </div>
        )}
        {/* Hit flash overlay */}
        <AnimatePresence>
          {attackEffect?.active && attackEffect.target === 'player' && (
            <motion.div
              key="player-flash"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, white 10%, rgba(239,68,68,0.7) 50%, transparent 75%)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Player HP Box ───────────────────────────────────────────────────── */}
      <div className="poke-hpbox poke-hpbox-player">
        <div className="poke-hpbox-header">
          <span className="poke-hpbox-name">
            {ctx.player.name}
            {ctx.playerStatus && STATUS_ICONS[ctx.playerStatus.type] && (
              <span className="poke-status-badge">
                {STATUS_ICONS[ctx.playerStatus.type]} {ctx.playerStatus.type}
              </span>
            )}
          </span>
          <span className="poke-hpbox-level">Lv.{ctx.player.level}</span>
        </div>
        <div className="poke-hpbar-row">
          <span className="poke-hpbar-label">HP</span>
          <div className="poke-hpbar-track">
            <motion.div
              className="poke-hpbar-fill"
              style={{ backgroundColor: hpColor(playerHpPct) }}
              initial={false}
              animate={{ width: `${playerHpPct * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="poke-hpbar-nums">
          {Math.floor(ctx.player.hpCurrent)} / {ctx.player.hpMax}
        </div>
        {/* Energy bar */}
        <div className="poke-energy-row">
          <span className="poke-energy-label">EN</span>
          <div className="poke-energy-track">
            <motion.div
              className="poke-energy-fill"
              initial={false}
              animate={{ width: `${energyPct * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <span style={{ fontSize: '0.38rem', color: 'rgba(0,229,255,0.6)', fontFamily: "'Press Start 2P', monospace" }}>
            {ctx.playerEnergy}/{ctx.player.energyMax}
          </span>
        </div>
      </div>

      {/* ── Bottom: Dialog + Actions ─────────────────────────────────────────── */}
      <div className="poke-bottom">

        {/* Element attack overlay */}
        <div className="poke-element-overlay" key={activeElement || 'idle'} />

        {/* Dialog box */}
        <div className="poke-dialog">
          {/* Recent log entries (greyed out) */}
          <div className="poke-log-history">
            {recentLog.slice(0, -1).map((entry, i) => (
              <p key={i} className="poke-log-entry">{entry}</p>
            ))}
          </div>
          {/* Current message with typewriter */}
          <p className="poke-dialog-text">
            {typeText}
            {!typeDone && <span className="poke-dialog-cursor">▌</span>}
            {typeDone && isPlayerTurn && menu === 'main' && (
              <span className="poke-dialog-cursor">▼</span>
            )}
          </p>
        </div>

        {/* Action panels */}
        <AnimatePresence mode="wait">
          {!isEnded && isPlayerTurn && menu === 'main' && (
            <motion.div
              key="main"
              className="poke-actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              <button className="poke-action-btn" onClick={() => setMenu('fight')}>
                ⚔ LUTA
              </button>
              <button className="poke-action-btn" onClick={() => { setMenu('item'); setShowItems(true); }}>
                🧪 ITEM
              </button>
              <button className="poke-action-btn" disabled>
                🎒 MOCHILA
              </button>
              <button className="poke-action-btn" onClick={flee}>
                🏃 FUGIR
              </button>
            </motion.div>
          )}

          {!isEnded && isPlayerTurn && menu === 'fight' && (
            <motion.div
              key="fight"
              className="poke-skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              {ctx.equippedAbilities.slice(0, 4).map((ability) => {
                const meta      = ELEMENT_META[ability.elementName];
                const canAfford = ctx.playerEnergy >= ability.energyCost;
                return (
                  <button
                    key={ability.id}
                    className="poke-skill-btn"
                    disabled={!canAfford}
                    style={{ '--el-color': meta?.color ?? 'rgba(0,229,255,0.5)' } as React.CSSProperties}
                    onClick={() => {
                      lastUsedAbilityRef.current = ability;
                      // Trigger elemental overlay effect
                      if (elementTimerRef.current) clearTimeout(elementTimerRef.current);
                      setActiveElement('');
                      requestAnimationFrame(() => {
                        setActiveElement(ability.elementName);
                        elementTimerRef.current = setTimeout(() => setActiveElement(''), 1500);
                      });
                      playerAttack(ability.id);
                      setMenu('main');
                    }}
                  >
                    <span className="poke-skill-name">{ability.name}</span>
                    <div className="poke-skill-meta">
                      <span
                        className="poke-skill-type"
                        style={{ background: meta?.color ? `${meta.color}33` : 'rgba(255,255,255,0.1)', color: meta?.color ?? '#e2e8f0' }}
                      >
                        {meta?.icon} {ability.elementName}
                      </span>
                      <span className="poke-skill-cost">⚡{ability.energyCost}</span>
                    </div>
                  </button>
                );
              })}

              {/* Pad empty slots */}
              {Array.from({ length: Math.max(0, 4 - ctx.equippedAbilities.length) }).map((_, i) => (
                <button key={`empty-${i}`} className="poke-skill-btn" disabled>
                  <span className="poke-skill-name" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                </button>
              ))}

              <button className="poke-back-btn" onClick={() => setMenu('main')}>
                ← VOLTAR
              </button>
            </motion.div>
          )}

          {/* Waiting for enemy turn */}
          {!isEnded && !isPlayerTurn && (
            <motion.div
              key="waiting"
              className="poke-actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  gridColumn: 'span 2',
                  textAlign: 'center',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: '0.45rem',
                  letterSpacing: 3,
                  color: 'rgba(0,229,255,0.5)',
                }}
              >
                AGUARDANDO...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── End Overlay ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEnded && (
          <motion.div
            className="poke-end-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="poke-end-icon"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              {ctx.phase === 'VICTORY' ? '🏆' : ctx.phase === 'FLED' ? '🏃' : '💀'}
            </motion.span>
            <motion.span
              className="poke-end-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                color:
                  ctx.phase === 'VICTORY' ? '#fbbf24' :
                  ctx.phase === 'FLED'    ? '#94a3b8' : '#f87171',
                textShadow:
                  ctx.phase === 'VICTORY' ? '0 0 30px rgba(251,191,36,0.6)' :
                  ctx.phase === 'DEFEAT'  ? '0 0 30px rgba(248,113,113,0.6)' : 'none',
              }}
            >
              {ctx.phase === 'VICTORY' ? 'VITÓRIA!' : ctx.phase === 'FLED' ? 'FUGIU!' : 'DERROTA!'}
            </motion.span>
            {ctx.phase === 'VICTORY' && ctx.rewards && (
              <motion.div
                className="poke-end-rewards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>✨ +{ctx.rewards.xp} XP</span>
                {ctx.rewards.coins != null && <span>🪙 +{ctx.rewards.coins}</span>}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Item Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showItems && (
          <>
            <motion.div
              className="poke-item-modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowItems(false); setMenu('main'); }}
            />
            <motion.div
              className="poke-item-modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
            >
              <div className="poke-item-title">🧪 Usar Item</div>
              {ITEMS.map(item => (
                <button
                  key={item.label}
                  className="poke-item-btn"
                  onClick={() => { useItem(item.effect, item.value); setShowItems(false); setMenu('main'); }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                className="poke-cancel-btn"
                onClick={() => { setShowItems(false); setMenu('main'); }}
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
