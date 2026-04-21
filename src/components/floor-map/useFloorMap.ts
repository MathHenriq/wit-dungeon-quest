import { useState, useCallback, useRef, useEffect } from 'react';
import { checkPathForCollisions, isBossUnlocked, getProgress } from './CollisionSystem';
import type { MapEnemy } from './CollisionSystem';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FloorTheme = 'forest' | 'desert' | 'cave' | 'castle' | 'ice';

export interface FloorData {
  id: string;
  floorNumber: number;
  name: string;
  theme: FloorTheme;
  backgroundUrl?: string | null;
}

export interface FloorMapEnemy extends MapEnemy {
  name:      string;
  level:     number;
  iconType:  string;
  spriteUrl?: string;   // PNG from /assets/sprites/all/ — shown on map marker and in battle
  // Full battle data (forwarded to battle engine on encounter)
  hpMax:        number;
  defFisica:    number;
  defMagica:    number;
  velocidade:   number;
  elementType:  string;
  ability1?:    string | null;
  ability2?:    string | null;
  ability3?:    string | null;
  ability4?:    string | null;
  specialAbilityName?:   string | null;
  specialAbilityEffect?: string | null;
  specialTrigger?:       string | null;
}

export type TransitionState = 'idle' | 'flash' | 'wipe' | 'done';

interface UseFloorMapOptions {
  floor: FloorData;
  enemies: FloorMapEnemy[];
  onEnemyEncounter: (enemy: FloorMapEnemy) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BOUNDS  = { minX: 4, maxX: 96, minY: 6, maxY: 94 };
const START   = { x: 8, y: 50 };
const MOVE_MS = 850; // must match CSS transition

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFloorMap({ enemies: init, onEnemyEncounter }: UseFloorMapOptions) {
  // --- position state ---
  const [position,   setPosition]   = useState(START);
  const [isMoving,   setIsMoving]   = useState(false);
  const positionRef  = useRef(START); // always current, safe in async/closures

  // --- enemies ---
  const [enemies, setEnemies] = useState<FloorMapEnemy[]>(init);
  const enemiesRef = useRef(init);
  enemiesRef.current = enemies;

  // --- battle transition ---
  const [transition, setTransition] = useState<TransitionState>('idle');
  const [transitionEnemy, setTransitionEnemy] = useState<FloorMapEnemy | null>(null);
  const locked = useRef(false);

  // --- ripples ---
  const [ripples, setRipples] = useState<{ x: number; y: number; key: number }[]>([]);
  const rippleKey = useRef(0);

  // --- tooltip ---
  const [tooltip, setTooltip] = useState('Clique no mapa para mover');

  // --- timers ---
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- map ref (for dimensions) ---
  const mapRef = useRef<HTMLDivElement | null>(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  function getMapSize() {
    const el = mapRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 1200, h: 700 };
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ── handleMapClick ────────────────────────────────────────────────────────

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (locked.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width)  * 100;
    const rawY = ((e.clientY - rect.top)  / rect.height) * 100;
    const tx   = clamp(rawX, BOUNDS.minX, BOUNDS.maxX);
    const ty   = clamp(rawY, BOUNDS.minY, BOUNDS.maxY);

    // Ripple at pixel position of click
    const key = ++rippleKey.current;
    const rx  = e.clientX - rect.left;
    const ry  = e.clientY - rect.top;
    setRipples(prev => [...prev, { x: rx, y: ry, key }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.key !== key)), 700);

    const { w, h } = getMapSize();
    const from     = positionRef.current;

    // Check path for collision
    const hit = checkPathForCollisions(
      from.x, from.y, tx, ty,
      enemiesRef.current,
      w, h,
    );

    if (hit) {
      const stopPos = { x: hit.stopX, y: hit.stopY };
      positionRef.current = stopPos;
      setPosition(stopPos);
      setIsMoving(true);

      // Travel time proportional to distance, min 250ms
      const dx      = hit.stopX - from.x;
      const dy      = hit.stopY - from.y;
      const distPct = Math.hypot(dx, dy) / 100;
      const delay   = Math.max(250, distPct * MOVE_MS);

      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => {
        setIsMoving(false);
        doTransition(hit.id);
      }, delay);
    } else {
      const newPos = { x: tx, y: ty };
      positionRef.current = newPos;
      setPosition(newPos);
      setIsMoving(true);

      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = setTimeout(() => setIsMoving(false), MOVE_MS + 50);
    }
  }, []);

  // ── battle transition ──────────────────────────────────────────────────────

  function doTransition(enemyId: string) {
    if (locked.current) return;
    locked.current = true;

    const enemy = enemiesRef.current.find(e => e.id === enemyId) ?? null;
    setTransitionEnemy(enemy);
    setTransition('flash');
    setTimeout(() => setTransition('wipe'), 220);
    setTimeout(() => {
      setTransition('done');
      if (enemy) onEnemyEncounter(enemy);
    }, 680);
  }

  // ── public callbacks ───────────────────────────────────────────────────────

  const markEnemyDefeated = useCallback((enemyId: string) => {
    setEnemies(prev => prev.map(e => e.id === enemyId ? { ...e, defeated: true } : e));
    setTransition('idle');
    locked.current = false;
  }, []);

  const resetToMap = useCallback(() => {
    setTransition('idle');
    locked.current = false;
  }, []);

  // ── tooltip ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const allNormal   = enemies.filter(e => !e.isBoss);
    const allDefeated = allNormal.every(e => e.defeated);
    const bossAlive   = enemies.some(e => e.isBoss && !e.defeated);

    if (allDefeated && bossAlive) {
      setTooltip('Boss desbloqueado — enfrente o guardiao');
    } else if (isMoving) {
      setTooltip('Movendo...');
    } else {
      setTooltip('Clique no mapa para mover');
    }
  }, [enemies, isMoving]);

  // ── derived ────────────────────────────────────────────────────────────────

  const bossUnlocked = isBossUnlocked(enemies);
  const progress     = getProgress(enemies);
  const floorDone    = progress.total > 0 &&
                       progress.defeated === progress.total &&
                       enemies.find(e => e.isBoss)?.defeated === true;

  return {
    mapRef,
    position,
    isMoving,
    enemies,
    bossUnlocked,
    progress,
    floorDone,
    transition,
    transitionEnemy,
    ripples,
    tooltip,
    handleMapClick,
    markEnemyDefeated,
    resetToMap,
  };
}
