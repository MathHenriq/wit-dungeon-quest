import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BattleCharacter, Ability } from '@/types/character';
import type { ShopItem } from '@/types';
import type { BattleEnemy } from '@/lib/battle';
import { ELEMENT_META } from '@/types/character';
import { useBattleEngine } from '@/hooks/useBattleEngine';
import type { PvPBattleEngineControls } from '@/hooks/usePvPBattleEngine';
import { FALLBACK_SPRITE_URL } from '@/lib/sprites/getEnemySprite';
import './PokemonBattle.css';
import { useCardActivation, type CardRarity } from './CardActivationAnimation';
import { BattleBackdrop, pickBackdropForRarity, type BackdropKey } from './BattleBackdrop';
import { ActiveModifiersHUD } from './ActiveModifiersHUD';
import { useDamagePopups, type PopupKind } from './DamagePopups';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { useEquippedSkins, resolveItemImage } from '@/hooks/useEquippedSkins';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleScreenProps {
  player:            BattleCharacter;
  enemy:             BattleEnemy;
  equippedAbilities: Ability[];
  equippedItem?:     ShopItem | null;
  onVictory:         (xp: number, coins: number, meta?: { isFlawless: boolean }) => void;
  onDefeat:          () => void;
  onFled?:           () => void;
  /** PvP: pass external engine so auto-enemy-turns are disabled */
  engineOverride?:   PvPBattleEngineControls;
  /** PvP: called when the player picks an ability (so wrapper can broadcast it) */
  onPlayerAttack?:   (abilityId: string) => void;
  /** PvP: called when the player clicks the surrender button */
  onSurrender?:      () => void;
  /** PvP: replaces "TURNO DO INIMIGO" label and hides flee/items */
  pvpMode?:          boolean;
  /** Guild raid phase (1–4). Drives extra boss mechanics in BattleEngine. */
  raidPhase?:        number;
}

// ─── Items ────────────────────────────────────────────────────────────────────

const ITEMS = [
  { label: 'Poção (+50 HP)',         effect: 'heal'     as const, value: 50, icon: '🧪' },
  { label: 'Poção Grande (+150 HP)', effect: 'heal'     as const, value: 150, icon: '💊' },
  { label: 'Recarga de Ataques',     effect: 'recharge' as const, value: 0, icon: '🔋' },
  { label: 'Antídoto (cura status)', effect: 'cure'     as const, value: 0, icon: '🌿' },
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
  equippedItem = null,
  onVictory,
  onDefeat,
  onFled,
  engineOverride,
  onPlayerAttack,
  onSurrender,
  pvpMode = false,
  raidPhase,
}: BattleScreenProps) {
  const internalEngine = useBattleEngine();
  const { ctx, startBattle, playerAttack, useItem, flee } = engineOverride ?? internalEngine;
  // Forge consumables only flow through the internal engine (PvP excluded).
  const consumables   = engineOverride ? [] : internalEngine.consumables;
  const useConsumable = engineOverride ? null : internalEngine.useConsumable;
  const { skinsByBaseId } = useEquippedSkins();

  // Patch 6.1: cinematic activation for Legendary+ equipment cards.
  const sfxMuted = (typeof window !== "undefined" ? localStorage.getItem("wit:sfx_muted") : "1") !== "0";
  const { play: playCardActivation, overlay: cardActivationOverlay } = useCardActivation(sfxMuted);

  // Patch 6.2: dramatic backdrop swaps when a Legendary+ card fires.
  const [backdropKey, setBackdropKey] = useState<BackdropKey>("default");

  // Patch 6.4: damage popup host.
  const { push: pushDamage, host: damageHost } = useDamagePopups();
  const lastLogIdxRef = useRef(0);

  // Patch 6.4: translate new ctx.log entries into floating popups.
  useEffect(() => {
    const log = ctx?.log;
    if (!log) return;
    if (log.length <= lastLogIdxRef.current) {
      // Log shrunk (battle restart) — reset.
      if (log.length < lastLogIdxRef.current) lastLogIdxRef.current = log.length;
      return;
    }

    for (let i = lastLogIdxRef.current; i < log.length; i++) {
      const entry = log[i];
      if (entry.actor === 'system') continue;
      const damageSide: 'player' | 'enemy' = entry.actor === 'player' ? 'enemy' : 'player';

      // ── Damage popups ──
      if (entry.type === 'damage' && entry.value && entry.value > 0) {
        // Crit detection: same actor logged "Acerto crítico" within last 3 entries.
        let isCrit = false;
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          if (log[j].actor !== entry.actor) break;
          if (log[j].message.includes('crítico')) { isCrit = true; break; }
        }
        let kind: PopupKind = 'physical';
        if (isCrit) kind = 'crit';
        else if (entry.actor === 'player' && lastUsedAbilityRef.current?.damageType === 'Magical') kind = 'magical';
        pushDamage({ side: damageSide, kind, value: entry.value });
        continue;
      }

      // ── Miss / evade popups ──
      if (entry.type === 'info' && /Errou|Desviou|desviou/.test(entry.message)) {
        // Player evaded enemy attack → "Você desviou!" with actor='enemy' → popup on player side.
        const playerEvaded = /Você desviou/i.test(entry.message);
        const side: 'player' | 'enemy' = playerEvaded ? 'player' : damageSide;
        const label = playerEvaded || /Desviou/.test(entry.message) ? 'DESVIOU' : 'ERROU';
        pushDamage({ side, kind: 'miss', value: 0, label });
        continue;
      }

      // ── Heal popups ──
      if (entry.type === 'effect' && entry.value && entry.value > 0 &&
          /Recuperou|Absorveu|💚|↩️/.test(entry.message)) {
        const side: 'player' | 'enemy' = entry.actor === 'player' ? 'player' : 'enemy';
        pushDamage({ side, kind: 'heal', value: entry.value });
        continue;
      }
    }

    lastLogIdxRef.current = log.length;
  }, [ctx?.log?.length, pushDamage]); // eslint-disable-line
  useEffect(() => {
    // Reset to default backdrop the moment a battle ends — keeps the next
    // encounter starting on neutral ground.
    if (ctx?.phase === 'VICTORY' || ctx?.phase === 'DEFEAT' || ctx?.phase === 'FLED') {
      setBackdropKey("default");
    }
  }, [ctx?.phase]);

  // Menu state
  const [menu, setMenu] = useState<'main' | 'fight' | 'item'>('main');
  const [confirmSurrender, setConfirmSurrender] = useState(false);
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);

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
  const [showRechargeSelect, setShowRechargeSelect] = useState(false);

  // ── Start battle (only when using the internal engine) ─────────────────────
  useEffect(() => {
    if (!engineOverride) {
      internalEngine.startBattle(player, enemy, equippedAbilities, equippedItem, raidPhase);
    }
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
          // Patch 2.0 — dispara o CardActivationAnimation pro deck do inimigo,
          // mesma animação cinemática do jogador, vinda do "deck dele".
          const enemyAbId = ctx.lastEnemyAbilityId;
          const enemyAb   = enemyAbId
            ? ctx.enemy.abilities.find(a => a.id === enemyAbId)
            : null;
          if (enemyAb) {
            const abMeta = ELEMENT_META[enemyAb.elementName];
            void playCardActivation({
              rarity:      'common' as CardRarity,
              cardName:    enemyAb.name,
              description: `${ctx.enemy.name} canalizou ${enemyAb.elementName}.`,
              customTone:  abMeta?.color ?? meta?.color ?? '#ef4444',
            });
          }
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
      const isFlawless = ctx.player.hpCurrent >= ctx.player.hpMax;
      const t = setTimeout(() => onVictory(ctx.rewards?.xp ?? 0, ctx.rewards?.coins ?? 0, { isFlawless }), 2200);
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

  // Current player sprite (back or attack)
  const playerSprite = showAttackSprite && ctx.player.spritePixelAttack
    ? ctx.player.spritePixelAttack
    : ctx.player.spritePixelBack;

  return (
    <div className="poke-scene" data-element={activeElement}>

      {/* Patch 6.1: cinematic card activation overlay (renders nothing when idle). */}
      {cardActivationOverlay}

      {/* Patch 6.2: dramatic battle backdrop. Sits between the page bg and
          combat HUD. Crossfades when backdropKey changes. */}
      <BattleBackdrop activeKey={backdropKey} />

      {/* Patch 6.4: floating damage / heal / miss numbers. */}
      {damageHost}

      {/* Patch 6.3: HUD lateral de modificadores ativos. Reativo ao ctx. */}
      <ActiveModifiersHUD
        playerName={ctx.player.name}
        enemyName={ctx.enemy.name}
        playerStatus={ctx.playerStatus}
        enemyStatus={ctx.enemyStatus}
        playerStatuses={ctx.playerStatuses}
        enemyStatuses={ctx.enemyStatuses}
        raidPhase={ctx.raidPhase}
      />

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
          {isPlayerTurn ? 'SEU TURNO' : ctx.phase === 'ENEMY_TURN' || ctx.phase === 'PROCESSING' ? (pvpMode ? 'TURNO DO OPONENTE' : 'TURNO DO INIMIGO') : ctx.phase}
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

        {/* Patch 2.0: badges de elemento (dual nos bosses 26+) */}
        <div className="poke-element-row">
          {[ctx.enemy.elementType, ctx.enemy.elementTypeSecondary].filter(Boolean).map((el, i) => {
            const meta = ELEMENT_META[el as keyof typeof ELEMENT_META];
            if (!meta) return null;
            return (
              <span
                key={i}
                className="poke-element-chip"
                style={{
                  background: `${meta.color}22`,
                  border: `1px solid ${meta.color}88`,
                  color: meta.color,
                  textShadow: `0 0 6px ${meta.color}66`,
                }}
                title={el as string}
              >
                <span style={{ fontSize: '0.9em' }}>{meta.icon}</span>
                <span>{el}</span>
              </span>
            );
          })}
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

        {/* Patch 2.0: deck do inimigo — abilities visíveis sem revelar dano */}
        {ctx.enemy.abilities.length > 0 && (
          <div className="poke-enemy-skills">
            <span className="poke-enemy-skills-label">DECK</span>
            <div className="poke-enemy-skills-list">
              {ctx.enemy.abilities.slice(0, 4).map(ab => {
                const meta = ELEMENT_META[ab.elementName as keyof typeof ELEMENT_META];
                const color = meta?.color ?? '#94a3b8';
                return (
                  <span
                    key={ab.id}
                    className="poke-enemy-skill-chip"
                    style={{
                      borderColor: `${color}66`,
                      color: '#e6f0ff',
                    }}
                    title={`${ab.name} · ${ab.elementName}`}
                  >
                    <span style={{ color }}>{meta?.icon ?? '◇'}</span>
                    <span>{ab.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
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
        <img
          src={ctx.enemy.spriteUrl ?? FALLBACK_SPRITE_URL}
          alt={ctx.enemy.name}
          className="poke-sprite-img"
          onError={(e) => {
            // If the chosen sprite 404s, fall back to the first sprite in the list
            const img = e.currentTarget;
            if (img.src !== window.location.origin + FALLBACK_SPRITE_URL) {
              img.src = FALLBACK_SPRITE_URL;
            }
          }}
        />
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
              {!pvpMode && (
                <button className="poke-action-btn" onClick={() => { setMenu('item'); setShowItems(true); }}>
                  🧪 ITEM
                </button>
              )}
              {!pvpMode && (
                <button className="poke-action-btn" disabled>
                  🎒 MOCHILA
                </button>
              )}
              {!pvpMode && (
                <button className="poke-action-btn" onClick={flee}>
                  🏃 FUGIR
                </button>
              )}
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
              {!pvpMode && useConsumable && consumables.length > 0 && (
                <div
                  style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '8px 10px',
                    marginBottom: 4,
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.55)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(96,200,248,0.22)',
                    boxShadow: '0 0 20px rgba(96,200,248,0.08) inset',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.55rem',
                      letterSpacing: 2,
                      color: 'rgba(96,200,248,0.85)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Consumíveis
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {consumables.map((c) => (
                      <button
                        key={c.key}
                        disabled={c.quantity <= 0}
                        onClick={() => {
                          void useConsumable(c.key);
                          setMenu('main');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(148,163,184,0.25)',
                          background: 'rgba(30,41,59,0.65)',
                          color: '#e2e8f0',
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.6rem',
                          letterSpacing: 0.5,
                          cursor: c.quantity > 0 ? 'pointer' : 'not-allowed',
                          opacity: c.quantity > 0 ? 1 : 0.4,
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            gap: 6,
                            alignItems: 'center',
                            fontSize: '0.55rem',
                          }}
                        >
                          <span style={{ color: 'rgba(148,163,184,0.85)' }}>×{c.quantity}</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: 'rgba(96,200,248,0.18)',
                              border: '1px solid rgba(96,200,248,0.4)',
                              color: '#60c8f8',
                              letterSpacing: 1.2,
                            }}
                          >
                            USAR
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ctx.equippedAbilities.slice(0, 4).map((ability) => {
                const meta    = ELEMENT_META[ability.elementName];
                const pp      = ctx.abilityPP[ability.id];
                const hasPP   = (pp?.current ?? 0) > 0;
                const isAnimating = animatingCardId === ability.id;
                
                return (
                  <motion.div
                    layout
                    key={ability.id}
                    style={isAnimating ? {
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      marginTop: '-90px',
                      marginLeft: '-130px',
                      width: '260px',
                      height: '180px',
                      zIndex: 50,
                    } : {
                      position: 'relative',
                      width: '100%',
                      zIndex: 1,
                    }}
                    animate={{
                      rotateY: isAnimating ? 360 : 0,
                      scale: isAnimating ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                    className="group"
                  >
                    <button
                      disabled={!hasPP || animatingCardId !== null}
                      onClick={async () => {
                        setAnimatingCardId(ability.id);
                        lastUsedAbilityRef.current = ability;

                        // Simulate card activation delay
                        setTimeout(async () => {
                          if ((ability.tier ?? 0) >= 3) {
                            void supabaseStudent.rpc('increment_daily_counter', { p_type: 'rare_card_uses', p_amount: 1 });
                          }
                          // Patch 6.1b — show ALARM panel for every ability,
                          // tier maps to rarity tone.
                          const t = ability.tier ?? 1;
                          const rar: CardRarity =
                            t >= 6 ? 'unknown'
                            : t === 5 ? 'mythic'
                            : t === 4 ? 'legendary'
                            : t === 3 ? 'rare'
                            : t === 2 ? 'uncommon'
                            : 'common';
                          await playCardActivation({
                            rarity: rar,
                            cardName: ability.name,
                            cardImage: null,
                            description: ability.description,
                          });
                          
                          if (elementTimerRef.current) clearTimeout(elementTimerRef.current);
                          setActiveElement('');
                          requestAnimationFrame(() => {
                            setActiveElement(ability.elementName);
                            elementTimerRef.current = setTimeout(() => setActiveElement(''), 1500);
                          });
                          
                          playerAttack(ability.id);
                          onPlayerAttack?.(ability.id);
                          
                          setTimeout(() => {
                             setAnimatingCardId(null);
                             setMenu('main');
                          }, 400); // Wait for hit effect
                        }, 1000); // Wait for card pull animation
                      }}
                      className="w-full h-full text-left rounded-xl border p-3 flex flex-col gap-2 transition-all shadow-lg overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(2,6,23,0.95) 100%)`,
                        borderColor: meta?.color ? `${meta.color}66` : 'rgba(255,255,255,0.2)',
                        boxShadow: `0 4px 20px rgba(0,0,0,0.5), inset 0 0 12px ${meta?.color ? meta.color + '22' : 'transparent'}`,
                        opacity: hasPP ? 1 : 0.5,
                        cursor: hasPP && !animatingCardId ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {/* Glow Overlay */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `radial-gradient(circle at 50% -20%, ${meta?.color}44 0%, transparent 70%)` }}
                      />
                      
                      {/* Element Strip */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ background: meta?.color ?? '#fff', boxShadow: `0 0 10px ${meta?.color}` }}
                      />

                      {/* Header */}
                      <div className="flex items-start justify-between relative z-10 pl-2">
                        <div>
                          <h4 className="font-['Rajdhani'] font-bold text-[#f8fafc] text-[0.8rem] leading-tight">
                            {ability.name}
                          </h4>
                          <span className="text-[0.6rem] font-['Orbitron'] font-semibold" style={{ color: meta?.color }}>
                            {meta?.icon} {ability.elementName}
                          </span>
                        </div>
                        <div className="text-[0.55rem] px-1.5 py-0.5 rounded-sm font-['Orbitron'] border" style={{ color: meta?.color, borderColor: `${meta?.color}44`, backgroundColor: `${meta?.color}11` }}>
                          {ability.damageType === 'Physical' ? 'FÍS' : ability.damageType === 'Special' ? 'MAG' : 'SUP'}
                        </div>
                      </div>

                      {/* Power / Accuracy */}
                      <div className="flex gap-3 text-[0.6rem] font-semibold text-slate-300 relative z-10 pl-2">
                        {ability.damageType !== 'Status' && (
                          <span className="flex items-center gap-1">
                            <span className="text-red-400">⚔</span> {ability.baseDamage}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">🎯</span> {ability.accuracy}%
                        </span>
                      </div>

                      {/* PP Bar / Uses */}
                      <div className="mt-auto relative z-10 pl-2">
                        <div className="flex justify-between text-[0.55rem] font-['Orbitron'] text-slate-400 mb-1">
                          <span>ENERGIA</span>
                          <span style={{ color: hasPP ? '#67e8f9' : '#f87171' }}>{pp?.current ?? 0} / {pp?.max ?? 0}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${((pp?.current ?? 0) / (pp?.max ?? 1)) * 100}%`,
                              background: hasPP ? '#00e5ff' : '#f87171',
                              boxShadow: `0 0 5px ${hasPP ? '#00e5ff' : '#f87171'}`
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Single Use Label if PP is 1 */}
                      {(pp?.max === 1) && (
                        <div className="absolute bottom-2 right-2 text-[0.5rem] font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-1 rounded">
                          USO ÚNICO
                        </div>
                      )}
                    </button>
                    
                    {/* Discard Animation Layer (only if it was the last use and is animating) */}
                    {isAnimating && (pp?.current === 1) && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/20 rounded-xl border-2 border-red-500 flex items-center justify-center z-20 pointer-events-none"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0, 1, 0], scale: [1, 1.1, 0.8], filter: ['blur(0px)', 'blur(0px)', 'blur(4px)'] }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                      >
                        <span className="font-['Rajdhani'] font-bold text-red-500 text-xl tracking-widest bg-black/50 px-2 rounded">DESCARTADA</span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {/* Pad empty slots */}
              {Array.from({ length: Math.max(0, 4 - ctx.equippedAbilities.length) }).map((_, i) => (
                <button key={`empty-${i}`} className="poke-skill-btn" disabled>
                  <span className="poke-skill-name" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                </button>
              ))}

              {/* 5th slot: equipment-granted ability */}
              {!pvpMode && ctx.equippedItem?.ability_key && (() => {
                const item         = ctx.equippedItem;
                const skinImage    = resolveItemImage(item, skinsByBaseId);
                const onCooldown  = ctx.equipmentCooldown > 0;
                const isSingleUse = !!((item.ability_config as Record<string, unknown> | null | undefined)?.once_per_battle);
                const usedOnce    = isSingleUse && ctx.equipmentUsed;
                const disabled    = onCooldown || usedOnce;
                const label       = item.ability_name ?? item.name;
                const subline     = usedOnce
                  ? 'UTILIZADA'
                  : onCooldown
                    ? `RECARGA ${ctx.equipmentCooldown}T`
                    : item.ability_mode === 'unique' ? 'ÚNICA' : 'COMBO';
                    
                const isAnimating = animatingCardId === 'equip-skill';

                return (
                  <motion.div
                    layout
                    key="equip-skill"
                    style={isAnimating ? {
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      marginTop: '-190px',
                      marginLeft: '-140px',
                      width: '280px',
                      height: '380px',
                      zIndex: 50,
                    } : {
                      position: 'relative',
                      width: '100%',
                      gridColumn: '1 / -1',
                      zIndex: 1,
                    }}
                    animate={{
                      rotateY: isAnimating ? 360 : 0,
                      scale: isAnimating ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                    className="group"
                  >
                    <button
                      disabled={disabled || animatingCardId !== null}
                      onClick={async () => {
                        setAnimatingCardId('equip-skill');
                        
                        setTimeout(async () => {
                          // Patch 6.1: cinematic for every rarity before applying effect.
                          const rar = (item.rarity ?? 'common') as CardRarity;
                          if (['legendary','mythic','unknown','epic','rare','uncommon','common'].includes(rar)) {
                            await playCardActivation({
                              rarity: rar,
                              cardName: item.name,
                              cardImage: skinImage ?? null,
                              description: item.ability_description ?? undefined,
                            });
                          }
                          // Patch 6.2: swap battle backdrop on rare+ activations.
                          if (['rare','epic','legendary','mythic','unknown'].includes(rar)) {
                            let nextKey = pickBackdropForRarity(rar);
                            const lowerName = item.name.toLowerCase();
                            if (lowerName.includes("expansão") || lowerName.includes("domínio") || lowerName.includes("dominio")) {
                              nextKey = "expansao_dominio" as any;
                            } else if (lowerName.includes("instinto") || lowerName.includes("superior") || lowerName.includes("goku")) {
                              nextKey = "instinto_superior" as any;
                            } else if (lowerName.includes("soro") || lowerName.includes("titã") || lowerName.includes("titan") || lowerName.includes("tita")) {
                              nextKey = "soro_tita" as any;
                            }
                            setBackdropKey(nextKey);
                            void supabaseStudent.rpc('unlock_backdrop', { p_key: nextKey });
                          }
                          internalEngine.useEquipmentAbility();
                          
                          setTimeout(() => {
                             setAnimatingCardId(null);
                             setMenu('main');
                          }, 400);
                        }, 1000);
                      }}
                      className={`w-full text-left rounded-xl border p-3 flex transition-all shadow-lg overflow-hidden ${
                        isAnimating ? 'flex-col items-center justify-center h-full' : 'items-center gap-3'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, rgba(30,20,10,0.9) 0%, rgba(15,10,5,0.95) 100%)`,
                        borderColor: '#f59e0b66',
                        boxShadow: `0 4px 20px rgba(0,0,0,0.5), inset 0 0 12px rgba(245,158,11,0.15)`,
                        opacity: disabled ? 0.5 : 1,
                        cursor: (disabled || animatingCardId) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Glow Overlay */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% -20%, rgba(245,158,11,0.3) 0%, transparent 70%)` }}
                      />
                      
                      {/* Element Strip */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ background: '#f59e0b', boxShadow: `0 0 10px #f59e0b` }}
                      />

                      {/* Item thumbnail */}
                      <div className={`rounded border border-amber-500/30 bg-black/50 flex items-center justify-center overflow-hidden shrink-0 relative z-10 transition-all duration-700 ${
                        isAnimating ? 'w-32 h-32 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'w-10 h-10'
                      }`}>
                        {skinImage
                          ? <img src={skinImage} alt={item.name} className="w-full h-full object-contain" />
                          : <span className={isAnimating ? 'text-6xl' : 'text-xl'}>{item.icon ?? '🗡️'}</span>
                        }
                      </div>

                      {/* Text block */}
                      <div className={`flex-1 min-w-0 relative z-10 flex flex-col justify-center transition-all duration-700 ${
                        isAnimating ? 'items-center text-center gap-2' : ''
                      }`}>
                        <span className={`font-['Rajdhani'] font-bold text-amber-400 uppercase tracking-wider block transition-all ${
                          isAnimating ? 'text-2xl drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] whitespace-normal' : 'text-[0.85rem] truncate'
                        }`}>
                          {item.name}
                        </span>
                        <span className={`font-['Orbitron'] text-slate-300 block transition-all ${
                          isAnimating ? 'text-[0.85rem] whitespace-normal' : 'text-[0.6rem] truncate'
                        }`}>
                          {label}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className={`shrink-0 relative z-10 transition-all ${isAnimating ? 'mt-4' : ''}`}>
                        <span className={`px-2 py-1 rounded font-['Orbitron'] font-bold tracking-widest border transition-all ${
                          isAnimating ? 'text-xs' : 'text-[0.55rem]'
                        } ${disabled ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                          {subline}
                        </span>
                      </div>
                    </button>
                    
                    {/* Discard Animation Layer */}
                    {isAnimating && isSingleUse && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/20 rounded-xl border-2 border-red-500 flex items-center justify-center z-20 pointer-events-none"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: [0, 1, 0], scale: [1, 1.1, 0.8], filter: ['blur(0px)', 'blur(0px)', 'blur(4px)'] }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                      >
                        <span className="font-['Rajdhani'] font-bold text-red-500 text-xl tracking-widest bg-black/50 px-2 rounded">CONSUMIDO</span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })()}

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
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.7rem',
                  letterSpacing: 3,
                  color: 'rgba(0,229,255,0.7)',
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
        {showItems && !showRechargeSelect && (
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
              {ITEMS.map(item => {
                const isRechargeUsed  = item.effect === 'recharge' && ctx.rechargeUsed;
                const isHealSmallDone = item.effect === 'heal' && item.value <= 50  && ctx.healSmallUses >= 3;
                const isHealLargeDone = item.effect === 'heal' && item.value > 50   && ctx.healLargeUsed;
                const disabled = isRechargeUsed || isHealSmallDone || isHealLargeDone;

                let suffix = '';
                if (isRechargeUsed)  suffix = ' (usada)';
                else if (isHealSmallDone) suffix = ' (esgotada)';
                else if (isHealLargeDone) suffix = ' (usada)';
                else if (item.effect === 'heal' && item.value <= 50) suffix = ` (${3 - ctx.healSmallUses}/3)`;
                else if (item.effect === 'heal' && item.value > 50)  suffix = ' (1×)';

                return (
                  <button
                    key={item.label}
                    className="poke-item-btn"
                    disabled={disabled}
                    style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                    onClick={() => {
                      if (item.effect === 'recharge') {
                        setShowRechargeSelect(true);
                      } else {
                        useItem(item.effect, item.value);
                        setShowItems(false);
                        setMenu('main');
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span>{item.label}{suffix}</span>
                  </button>
                );
              })}
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

      {/* ── Recharge — choose which attack to restore ────────────────────────── */}
      <AnimatePresence>
        {showRechargeSelect && ctx && (
          <>
            <motion.div
              className="poke-item-modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRechargeSelect(false)}
            />
            <motion.div
              className="poke-item-modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
            >
              <div className="poke-item-title">🔋 Qual ataque recarregar?</div>
              {ctx.equippedAbilities.map(ability => {
                const pp = ctx.abilityPP[ability.id];
                const full = pp && pp.current === pp.max;
                return (
                  <button
                    key={ability.id}
                    className="poke-item-btn"
                    disabled={!!full}
                    style={full ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                    onClick={() => {
                      useItem('recharge', 0, ability.id);
                      setShowRechargeSelect(false);
                      setShowItems(false);
                      setMenu('main');
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>⚔️</span>
                    <span>
                      {ability.name}
                      <span style={{ opacity: 0.6, marginLeft: 6 }}>
                        ({pp?.current ?? 0}/{pp?.max ?? 0} PP)
                      </span>
                    </span>
                  </button>
                );
              })}
              <button
                className="poke-cancel-btn"
                onClick={() => setShowRechargeSelect(false)}
              >
                Voltar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PvP Surrender Button ─────────────────────────────────────────────── */}
      {pvpMode && !isEnded && onSurrender && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 20,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {confirmSurrender ? (
            <>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.55rem', color: 'rgba(248,113,113,0.8)', letterSpacing: 1,
              }}>
                Desistir?
              </span>
              <button
                onClick={() => { setConfirmSurrender(false); onSurrender(); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.55rem',
                  fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
                  border: '1px solid rgba(248,113,113,0.6)',
                  background: 'rgba(248,113,113,0.15)', color: '#f87171',
                  cursor: 'pointer',
                }}
              >
                SIM
              </button>
              <button
                onClick={() => setConfirmSurrender(false)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.55rem',
                  fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
                  border: '1px solid rgba(100,116,139,0.4)',
                  background: 'rgba(100,116,139,0.1)', color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                NÃO
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmSurrender(true)}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: '0.55rem',
                fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
                border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.7)',
                cursor: 'pointer',
              }}
            >
              🏳 DESISTIR
            </button>
          )}
        </div>
      )}
    </div>
  );
}
