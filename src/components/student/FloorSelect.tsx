import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Swords, ChevronRight } from 'lucide-react';
import { useFloors, useFloorProgress, type Floor, type FloorProgress } from '@/hooks/useFloors';
import { ELEMENT_META } from '@/types/character';
import type { ElementType } from '@/types/character';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FloorSelectProps {
  characterId:   string;
  characterLevel: number;
  onSelectFloor: (floor: Floor) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function floorState(
  floor: Floor,
  floorIndex: number,
  progress: FloorProgress[],
): 'locked' | 'available' | 'in_progress' | 'completed' {
  // First floor is always available
  if (floorIndex === 0) {
    const p = progress.find(x => x.floorId === floor.id);
    if (!p) return 'available';
    if (p.bossDefeated) return 'completed';
    return 'in_progress';
  }
  // Subsequent floors locked until previous boss defeated
  const prevFloorId = progress.find(
    // We need the ID of the previous floor — caller passes ordered array so we look by index-1
    // We resolve it from the sorted progress array instead
    _ => false, // placeholder — resolved below via the floors list param
  );
  void prevFloorId;
  return 'available'; // default; refined in component with floors list
}

function resolveState(
  floor: Floor,
  floors: Floor[],
  progress: FloorProgress[],
): 'locked' | 'available' | 'in_progress' | 'completed' {
  const idx = floors.findIndex(f => f.id === floor.id);
  const myProgress = progress.find(p => p.floorId === floor.id);

  if (myProgress?.bossDefeated) return 'completed';

  if (idx > 0) {
    const prevFloor   = floors[idx - 1];
    const prevProgress = progress.find(p => p.floorId === prevFloor.id);
    if (!prevProgress?.bossDefeated) return 'locked';
  }

  if (myProgress && myProgress.enemiesDefeated > 0) return 'in_progress';
  return 'available';
}

const STATE_CONFIG = {
  locked: {
    badge: <Lock size={18} />,
    badgeColor: '#475569',
    borderColor: 'rgba(255,255,255,0.06)',
    bg: 'rgba(255,255,255,0.02)',
    dimmed: true,
  },
  available: {
    badge: <Swords size={18} />,
    badgeColor: '#00e5ff',
    borderColor: 'rgba(0,229,255,0.2)',
    bg: 'rgba(0,229,255,0.04)',
    dimmed: false,
  },
  in_progress: {
    badge: <Swords size={18} />,
    badgeColor: '#fbbf24',
    borderColor: 'rgba(251,191,36,0.25)',
    bg: 'rgba(251,191,36,0.04)',
    dimmed: false,
  },
  completed: {
    badge: <CheckCircle2 size={18} />,
    badgeColor: '#4ade80',
    borderColor: 'rgba(74,222,128,0.2)',
    bg: 'rgba(74,222,128,0.04)',
    dimmed: false,
  },
};

// ─── Floor card ───────────────────────────────────────────────────────────────

function FloorCard({
  floor,
  state,
  progress,
  onClick,
  index,
}: {
  floor: Floor;
  state: ReturnType<typeof resolveState>;
  progress: FloorProgress | undefined;
  onClick: () => void;
  index: number;
}) {
  const cfg      = STATE_CONFIG[state];
  const isLocked = state === 'locked';

  // Try to parse theme element (first word) for color
  const themeEl = Object.keys(ELEMENT_META).find(
    el => floor.theme.toLowerCase().includes(el.toLowerCase()),
  ) as ElementType | undefined;
  const meta = themeEl ? ELEMENT_META[themeEl] : null;

  const accentColor = meta?.color ?? '#475569';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={isLocked ? undefined : onClick}
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: '16px 18px',
        background: cfg.bg,
        border: `1px solid ${cfg.borderColor}`,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: cfg.dimmed ? 0.5 : 1,
        overflow: 'hidden',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      {/* Left accent stripe */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: isLocked ? '#334155' : accentColor,
          borderRadius: '12px 0 0 12px',
          opacity: isLocked ? 0.3 : 0.8,
        }}
      />

      <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Floor number badge */}
          <div
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: isLocked ? 'rgba(255,255,255,0.04)' : `${accentColor}18`,
              border: `1px solid ${isLocked ? 'rgba(255,255,255,0.06)' : accentColor + '44'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: '1rem',
              color: isLocked ? '#334155' : accentColor,
            }}
          >
            {floor.floorNumber}
          </div>

          {/* Name + theme */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                color: isLocked ? '#334155' : '#e2e8f0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {floor.name || floor.theme}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 1 }}>
              Nível {floor.levelMin}–{floor.levelMax}
            </div>
          </div>

          {/* State icon + arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: cfg.badgeColor }}>
            {cfg.badge}
            {!isLocked && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
          </div>
        </div>

        {/* Progress bar (in_progress / completed) */}
        {progress && progress.enemiesDefeated > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: 1 }}>
                INIMIGOS
              </span>
              <span style={{ fontSize: '0.65rem', color: state === 'completed' ? '#4ade80' : '#fbbf24' }}>
                {progress.bossDefeated
                  ? '5/5 + Boss ✅'
                  : `${Math.min(progress.enemiesDefeated, 5)}/5`}
              </span>
            </div>
            <div
              style={{
                height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: progress.bossDefeated
                    ? '100%'
                    : `${Math.min(100, (progress.enemiesDefeated / 5) * 100)}%`,
                  background: state === 'completed'
                    ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                    : 'linear-gradient(90deg,#fbbf24,#f59e0b)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FloorSelect({ characterId, characterLevel, onSelectFloor }: FloorSelectProps) {
  const { data: floors  = [], isLoading: loadingFloors }   = useFloors();
  const { data: progress = [], isLoading: loadingProgress } = useFloorProgress(characterId);

  const isLoading = loadingFloors || loadingProgress;

  const completed   = progress.filter(p => p.bossDefeated).length;
  const inProgress  = progress.filter(p => !p.bossDefeated && p.enemiesDefeated > 0).length;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 200, color: 'rgba(0,229,255,0.4)', fontSize: '0.85rem', letterSpacing: 2,
        }}
      >
        CARREGANDO ANDARES...
      </div>
    );
  }

  if (floors.length === 0) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 200, gap: 8, color: '#475569', textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '2rem' }}>🏰</span>
        <span style={{ fontSize: '0.85rem' }}>Nenhum andar disponível ainda.</span>
        <span style={{ fontSize: '0.72rem' }}>Aguarde o professor criar novos andares.</span>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          🏰 Andares
        </h2>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, fontSize: '0.72rem' }}>
          <span style={{ color: '#4ade80' }}>✅ {completed} concluídos</span>
          {inProgress > 0 && (
            <span style={{ color: '#fbbf24' }}>⚔️ {inProgress} em progresso</span>
          )}
          <span style={{ color: '#475569' }}>Lv. {characterLevel}</span>
        </div>
      </div>

      {/* Floor grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {floors.map((floor, i) => {
          const state     = resolveState(floor, floors, progress);
          const myProgress = progress.find(p => p.floorId === floor.id);

          return (
            <FloorCard
              key={floor.id}
              floor={floor}
              state={state}
              progress={myProgress}
              index={i}
              onClick={() => onSelectFloor(floor)}
            />
          );
        })}
      </div>
    </div>
  );
}
