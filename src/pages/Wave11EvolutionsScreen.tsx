// ============================================================
// Onda 11.6 — Tela de evoluções de atributo.
//
// 6 atributos × 3 marcos (30/60/90) = 18 evoluções por aluno.
// Cumulativas; pontos vêm do pool unificado (student_skill_points).
// ============================================================

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { toast } from 'sonner';

import type { AttributeType } from '@/lib/skills/skillsRegistry';
import {
  EVOLUTIONS_REGISTRY,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_COLORS,
  getActiveEvolutions,
  getAttributeBonus,
  getNextEvolution,
  renderEvolutionSprite,
  type Evolution,
} from '@/lib/skills/evolutionsRegistry';

import { getStudentAttributes, getSkillPoints } from '@/lib/skills/api';
import { useSpendAttributePoint } from '@/hooks/useSkillMutations';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  studentId: string;
  onBack?:   () => void;
}

type Filter = 'all' | 'active' | 'locked';

const ATTR_ORDER: AttributeType[] = [
  'forca', 'destreza', 'inteligencia', 'carisma', 'agilidade', 'resistencia',
];

// ─── Componente principal ────────────────────────────────────────────────────

export const Wave11EvolutionsScreen: FC<Props> = ({ studentId, onBack }) => {
  const attrsQ  = useQuery({
    queryKey: ['skills', 'attributes', studentId],
    queryFn:  () => getStudentAttributes(studentId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  const pointsQ = useQuery({
    queryKey: ['skills', 'pool', studentId],
    queryFn:  () => getSkillPoints(studentId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const attrs  = attrsQ.data;
  const points = pointsQ.data;

  const [selected, setSelected]   = useState<Evolution | null>(null);
  const [filter, setFilter]       = useState<Filter>('all');

  const active = useMemo<Evolution[]>(
    () => (attrs ? getActiveEvolutions(attrs) : []),
    [attrs],
  );
  const activeIds = useMemo(() => new Set(active.map(e => e.id)), [active]);

  // Próximas evoluções (ordenadas por progresso decrescente)
  const upcoming = useMemo<Array<{ evo: Evolution; progress: number; current: number }>>(() => {
    if (!attrs) return [];
    return EVOLUTIONS_REGISTRY
      .filter(e => !activeIds.has(e.id))
      .map(e => ({
        evo: e,
        current: attrs[e.attribute],
        progress: Math.min(1, attrs[e.attribute] / e.milestone),
      }))
      .sort((a, b) => b.progress - a.progress);
  }, [attrs, activeIds]);

  if (attrsQ.isLoading || pointsQ.isLoading || !attrs || !points) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020611] text-white">
        <p className="font-orbitron uppercase tracking-widest text-white/60">Carregando evoluções...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#020611] text-white">
      <BackgroundFx />

      <div className="relative h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          <Header
            activeCount={active.length}
            availablePoints={points.available}
            upcoming={upcoming.slice(0, 3)}
            onBack={onBack}
          />

          <FilterTabs current={filter} onChange={setFilter} />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* 6 colunas de atributos */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {ATTR_ORDER.map(attr => (
                <AttributeColumn
                  key={attr}
                  attr={attr}
                  currentPoints={attrs[attr]}
                  activeIds={activeIds}
                  filter={filter}
                  availablePoints={points.available}
                  studentId={studentId}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
            </div>

            {/* Painel lateral de detalhe */}
            <DetailPanel evolution={selected} attrs={attrs} activeIds={activeIds} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Header (resumo) ─────────────────────────────────────────────────────────

const Header: FC<{
  activeCount:     number;
  availablePoints: number;
  upcoming:        Array<{ evo: Evolution; progress: number; current: number }>;
  onBack?:         () => void;
}> = ({ activeCount, availablePoints, upcoming, onBack }) => (
  <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white transition font-rajdhani text-sm px-2 py-1"
        >
          ← Voltar
        </button>
      )}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-rajdhani">
          Evoluções de Atributo
        </p>
        <h1 className="mt-1 font-orbitron text-2xl md:text-3xl tracking-wider">
          <span className="text-cyan-300">{activeCount}</span>
          <span className="text-white/40"> / 18 ativas</span>
        </h1>
      </div>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
      {upcoming.map(({ evo, current }) => (
        <div
          key={evo.id}
          className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5"
          title={`${ATTRIBUTE_LABELS[evo.attribute]} ${current}/${evo.milestone} — ${evo.passive.name}`}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani">
            Próxima · {ATTRIBUTE_LABELS[evo.attribute]} {evo.milestone}
          </p>
          <p className="font-orbitron text-sm" style={{ color: ATTRIBUTE_COLORS[evo.attribute] }}>
            {current} / {evo.milestone}
          </p>
        </div>
      ))}

      <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2">
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 font-rajdhani">
          Pontos disponíveis
        </p>
        <p className="font-orbitron text-2xl text-cyan-200">{availablePoints}</p>
      </div>
    </div>
  </header>
);

// ─── Tabs de filtro ──────────────────────────────────────────────────────────

const FilterTabs: FC<{ current: Filter; onChange: (f: Filter) => void }> = ({ current, onChange }) => {
  const opts: Array<{ id: Filter; label: string }> = [
    { id: 'all',    label: 'Todas' },
    { id: 'active', label: 'Ativas' },
    { id: 'locked', label: 'Bloqueadas' },
  ];
  return (
    <div className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {opts.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={[
            'px-4 py-1.5 rounded-md font-orbitron text-xs uppercase tracking-widest transition',
            current === o.id
              ? 'bg-cyan-500/20 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.4)]'
              : 'text-white/55 hover:text-white/85',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

// ─── Coluna de atributo ──────────────────────────────────────────────────────

const AttributeColumn: FC<{
  attr:            AttributeType;
  currentPoints:   number;
  activeIds:       Set<string>;
  filter:          Filter;
  availablePoints: number;
  studentId:       string;
  selected:        Evolution | null;
  onSelect:        (e: Evolution) => void;
}> = ({ attr, currentPoints, activeIds, filter, availablePoints, studentId, selected, onSelect }) => {
  const color    = ATTRIBUTE_COLORS[attr];
  const label    = ATTRIBUTE_LABELS[attr];
  const bonus    = getAttributeBonus(attr, currentPoints);
  const next     = getNextEvolution(attr, currentPoints);
  const spendMut = useSpendAttributePoint(studentId);

  // 3 marcos para essa coluna (ordem decrescente — 90 no topo, 30 embaixo)
  const milestones = EVOLUTIONS_REGISTRY
    .filter(e => e.attribute === attr)
    .sort((a, b) => b.milestone - a.milestone);

  const visible = milestones.filter(e => {
    if (filter === 'all')    return true;
    if (filter === 'active') return activeIds.has(e.id);
    return !activeIds.has(e.id);
  });

  const handleInvest = async () => {
    const prevActive = new Set(activeIds);
    const res = await spendMut.mutateAsync(attr);
    if (!res.success) return;
    // Toast de evolução desbloqueada
    const newlyUnlocked = (res.unlocked_evolutions ?? []).filter(id => !prevActive.has(id));
    for (const evoId of newlyUnlocked) {
      const evo = EVOLUTIONS_REGISTRY.find(e => e.id === evoId);
      if (evo) {
        toast.success(`EVOLUÇÃO DESBLOQUEADA: ${evo.passive.name}`, {
          description: evo.passive.description,
          duration: 6000,
        });
      }
    }
  };

  const canInvest = availablePoints > 0 && !spendMut.isPending;

  return (
    <div
      className="relative rounded-xl border p-4 backdrop-blur-xl flex flex-col"
      style={{
        borderColor: `${color}33`,
        background: `linear-gradient(180deg, ${color}10, rgba(255,255,255,0.02) 40%)`,
      }}
    >
      {/* Topo: label + valor + bônus */}
      <div className="text-center">
        <p className="font-orbitron text-xs uppercase tracking-wider" style={{ color }}>
          {label}
        </p>
        <p className="mt-1 font-orbitron text-3xl text-white">{currentPoints}</p>
        {bonus > 0 && (
          <p className="text-[10px] font-rajdhani uppercase tracking-wider opacity-70" style={{ color }}>
            +{Math.round(bonus * 100)}% bônus
          </p>
        )}
      </div>

      {/* Marcos (90 → 30, de cima pra baixo) */}
      <div className="mt-5 flex flex-col items-center gap-5 flex-1">
        {visible.length === 0 && (
          <p className="text-[10px] text-white/30 font-rajdhani uppercase tracking-wider py-8">
            Nenhuma neste filtro
          </p>
        )}
        {visible.map(evo => (
          <MilestoneCell
            key={evo.id}
            evolution={evo}
            isActive={activeIds.has(evo.id)}
            currentPoints={currentPoints}
            selected={selected?.id === evo.id}
            onClick={() => onSelect(evo)}
          />
        ))}
      </div>

      {/* Progresso até próxima */}
      {next && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-rajdhani uppercase tracking-wider">
            <span className="text-white/40">Próxima · {next.milestone}</span>
            <span style={{ color }}>{currentPoints}/{next.milestone}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (currentPoints / next.milestone) * 100)}%`,
                background: color,
                boxShadow: `0 0 8px ${color}AA`,
              }}
            />
          </div>
        </div>
      )}

      {/* Botão investir */}
      <button
        onClick={handleInvest}
        disabled={!canInvest}
        className={[
          'mt-4 w-full rounded-md py-2 font-orbitron text-[11px] uppercase tracking-widest border transition',
          canInvest
            ? 'border-white/20 hover:bg-white/10'
            : 'border-white/5 bg-white/[0.02] text-white/25 cursor-not-allowed',
        ].join(' ')}
        style={canInvest ? { color, borderColor: `${color}55` } : undefined}
      >
        {spendMut.isPending ? '...' : '+1 ponto'}
      </button>
    </div>
  );
};

// ─── Célula de marco (sprite + cadeado/glow) ─────────────────────────────────

const MilestoneCell: FC<{
  evolution:     Evolution;
  isActive:      boolean;
  currentPoints: number;
  selected:      boolean;
  onClick:       () => void;
}> = ({ evolution, isActive, currentPoints, selected, onClick }) => {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const prevActive = useRef(isActive);
  const svgString = renderEvolutionSprite(evolution, 56);

  // Bounce + glow ao desbloquear
  useEffect(() => {
    if (isActive && !prevActive.current && wrapRef.current) {
      gsap.fromTo(
        wrapRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' },
      );
      // partículas: pulsa um anel radial
      const ring = wrapRef.current.querySelector<HTMLElement>('[data-ring]');
      if (ring) {
        gsap.fromTo(ring, { scale: 0, opacity: 0.9 }, { scale: 3, opacity: 0, duration: 0.9, ease: 'power2.out' });
      }
    }
    prevActive.current = isActive;
  }, [isActive]);

  return (
    <button
      ref={wrapRef}
      onClick={onClick}
      data-selected={selected}
      className={[
        'relative rounded-full p-1 transition-all duration-300',
        isActive ? 'opacity-100' : 'opacity-40',
        selected ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#020611]' : '',
      ].join(' ')}
      title={`${evolution.passive.name} (marco ${evolution.milestone}) · ${currentPoints}/${evolution.milestone}`}
    >
      <span
        data-ring
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 24px ${evolution.spriteColor}` }}
      />
      <div
        className={isActive ? '' : 'grayscale'}
        style={{ filter: isActive ? undefined : 'grayscale(1) brightness(0.6)' }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
      <span className="absolute -bottom-1 -right-1 text-[9px] font-orbitron px-1 rounded bg-black/70 text-white/80 border border-white/20">
        {evolution.milestone}
      </span>
    </button>
  );
};

// ─── Painel lateral de detalhe ───────────────────────────────────────────────

const DetailPanel: FC<{
  evolution: Evolution | null;
  attrs:     Record<AttributeType, number>;
  activeIds: Set<string>;
}> = ({ evolution, attrs, activeIds }) => {
  if (!evolution) {
    return (
      <aside className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-center">
        <p className="font-rajdhani text-white/55">
          Selecione um marco para ver os detalhes da evolução.
        </p>
      </aside>
    );
  }
  const color = ATTRIBUTE_COLORS[evolution.attribute];
  const current = attrs[evolution.attribute];
  const isActive = activeIds.has(evolution.id);
  const progress = Math.min(1, current / evolution.milestone);
  const status: 'active' | 'next' | 'locked' = isActive ? 'active' : progress >= 0.5 ? 'next' : 'locked';
  const statusMeta = {
    active: { label: 'ATIVA',         color: '#34d399' },
    next:   { label: 'PRÓXIMA',       color: '#facc15' },
    locked: { label: 'BLOQUEADA',     color: '#94a3b8' },
  }[status];

  return (
    <aside
      className="rounded-xl border p-6 backdrop-blur-xl"
      style={{
        borderColor: `${color}55`,
        background: `linear-gradient(180deg, ${color}14, rgba(255,255,255,0.02))`,
      }}
    >
      <span
        className="inline-block text-[10px] px-2 py-0.5 rounded font-orbitron uppercase tracking-widest"
        style={{ color: statusMeta.color, background: `${statusMeta.color}22`, border: `1px solid ${statusMeta.color}55` }}
      >
        {statusMeta.label}
      </span>

      <h2 className="mt-3 font-orbitron text-xl" style={{ color }}>
        {evolution.passive.name}
      </h2>
      <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani mt-1">
        {ATTRIBUTE_LABELS[evolution.attribute]} · marco {evolution.milestone}
      </p>

      <p className="mt-4 font-rajdhani text-white/85 leading-relaxed">
        {evolution.passive.description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-rajdhani">
        <Field label="Bônus de atributo" value={`+${Math.round(evolution.bonusAttributeMultiplier * 100)}%`} accent={color} />
        <Field label="Tipo de efeito"     value={evolution.passive.effect.type.replace(/_/g, ' ')} accent={color} />
      </div>

      {!isActive && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-rajdhani uppercase tracking-wider">
            <span className="text-white/40">Progresso</span>
            <span style={{ color }}>{current}/{evolution.milestone}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: color }}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

const Field: FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    <p className="capitalize" style={{ color: accent }}>{value}</p>
  </div>
);

// ─── Helper exportável: badge de progresso para o ProfileCard ────────────────

/**
 * Componente reutilizável: mostra "{N}/18" com cor por progresso.
 * Pode ser usado em ProfileCard, ranking, etc.
 */
export const EvolutionsBadge: FC<{ attrs: Record<AttributeType, number> | null | undefined; className?: string }> = ({
  attrs, className,
}) => {
  const active = attrs ? getActiveEvolutions(attrs) : [];
  const n = active.length;
  const ratio = n / 18;
  const color = ratio >= 0.66 ? '#facc15' : ratio >= 0.33 ? '#a3e635' : '#64748b';
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 border font-orbitron text-[11px] uppercase tracking-wider',
        className ?? '',
      ].join(' ')}
      style={{ color, borderColor: `${color}55`, background: `${color}1A` }}
      title={`${n} evoluções ativas de 18`}
    >
      <span className="opacity-60">EVO</span>
      <span>{n}/18</span>
    </span>
  );
};

// ─── Background ──────────────────────────────────────────────────────────────

const BackgroundFx: FC = () => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(168,85,247,0.18), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(34,211,238,0.15), transparent 55%)',
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  </>
);

export default Wave11EvolutionsScreen;
