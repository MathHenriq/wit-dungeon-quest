// ============================================================
// Onda 11.5 — Tela da árvore de skills.
//
// 13 slots em 5 tiers (3-3-3-2-2). Conectores SVG entre pré-
// requisitos. Toggle entre elemento primário e secundário (se
// dominado). Botão de reset condicional com cooldown de 7 dias.
// ============================================================

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { toast } from 'sonner';

import type { ClassType, ElementType } from '@/lib/skills/skillsRegistry';
import {
  getClassProfile,
  getSkillPoints,
  getMasteredElements,
} from '@/lib/skills/api';
import {
  getElementSkills, groupByTier, canUnlock, sumElementSpent,
  isElementMastered, MECHANIC_ICONS, MECHANIC_LABELS,
  type SkillView, type SkillState,
} from '@/lib/skills/skillTree';
import { useUnlockedSkills } from '@/hooks/useUnlockedSkills';
import { useUnlockSkill, useResetElement } from '@/hooks/useSkillMutations';
import { ELEMENT_ICONS, ELEMENT_META_PT } from '@/lib/skills/elementIcons';
import { CLASS_META } from '@/lib/skills/classIcons';

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  studentId: string;
  onBack?:   () => void;
}

// ─── Componente principal ────────────────────────────────────────────────────

export const Wave11SkillTreeScreen: FC<Props> = ({ studentId, onBack }) => {
  const profileQ  = useQuery({
    queryKey: ['skills', 'classProfile', studentId],
    queryFn:  () => getClassProfile(studentId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const pointsQ   = useQuery({
    queryKey: ['skills', 'pool', studentId],
    queryFn:  () => getSkillPoints(studentId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  const masteryQ  = useQuery({
    queryKey: ['skills', 'mastery', studentId],
    queryFn:  () => getMasteredElements(studentId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const unlockedQ = useUnlockedSkills(studentId);

  const profile  = profileQ.data;
  const points   = pointsQ.data;
  const mastered = masteryQ.data ?? [];
  const unlockedSet = useMemo(() => new Set(unlockedQ.data ?? []), [unlockedQ.data]);

  // Elemento sendo visualizado — começa no primário
  const [activeElement, setActiveElement] = useState<ElementType | null>(null);
  useEffect(() => {
    if (!activeElement && profile?.primaryElement) {
      setActiveElement(profile.primaryElement as ElementType);
    }
  }, [profile?.primaryElement, activeElement]);

  // Modal de detalhe
  const [selectedSkill, setSelectedSkill] = useState<SkillView | null>(null);

  // Loading
  if (profileQ.isLoading || pointsQ.isLoading || unlockedQ.isLoading) {
    return <FullScreenLoader label="Carregando árvore..." />;
  }

  if (!profile?.classType || !profile?.primaryElement) {
    return (
      <FullScreenInfo
        title="Defina sua classe primeiro"
        body="Você precisa escolher classe e elemento antes de acessar a árvore de skills."
        onBack={onBack}
      />
    );
  }

  if (!activeElement) return <FullScreenLoader label="..." />;

  const classType = profile.classType as ClassType;
  const skills    = getElementSkills(activeElement, classType);
  const tiers     = groupByTier(skills);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#020611] text-white">
      <BackgroundFx color={ELEMENT_META_PT[activeElement].color} />

      <div className="relative h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
          <Header
            classType={classType}
            element={activeElement}
            secondaryElement={profile.secondaryElement as ElementType | null}
            mastered={mastered as ElementType[]}
            availablePoints={points?.available ?? 0}
            onChangeElement={setActiveElement}
            onBack={onBack}
          />

          <div className="mt-8 md:mt-12 flex flex-col gap-10 md:gap-12">
            {tiers.map(group => (
              <TierRow
                key={group.tier}
                tier={group.tier}
                skills={group.skills}
                unlocked={unlockedSet}
                availablePoints={points?.available ?? 0}
                elementColor={ELEMENT_META_PT[activeElement].color}
                onSelect={setSelectedSkill}
              />
            ))}
          </div>

          <ResetSection
            studentId={studentId}
            element={activeElement}
            classType={classType}
            unlocked={unlockedSet}
            mastered={mastered as ElementType[]}
            secondaryChosen={!!profile.secondaryElement}
          />
        </div>
      </div>

      {selectedSkill && (
        <SkillDetailModal
          studentId={studentId}
          skill={selectedSkill}
          elementColor={ELEMENT_META_PT[activeElement].color}
          unlocked={unlockedSet}
          availablePoints={points?.available ?? 0}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────

const Header: FC<{
  classType:        ClassType;
  element:          ElementType;
  secondaryElement: ElementType | null;
  mastered:         ElementType[];
  availablePoints:  number;
  onChangeElement:  (e: ElementType) => void;
  onBack?:          () => void;
}> = ({ classType, element, secondaryElement, mastered, availablePoints, onChangeElement, onBack }) => {
  const cls = CLASS_META[classType];
  const el  = ELEMENT_META_PT[element];
  const ElIcon = ELEMENT_ICONS[element];

  // Toggle só aparece se aluno tem secundário OU dominou mais de 1 elemento
  const togglableElements = useMemo(() => {
    const list: ElementType[] = [];
    // primário sempre vem das props chamando o pai com profile.primaryElement;
    // nesse componente o `element` corrente pode ser tanto primário quanto secundário,
    // então usamos `mastered` ∪ {primário, secundário} para listar opções.
    if (secondaryElement) list.push(secondaryElement);
    for (const m of mastered) if (!list.includes(m)) list.push(m);
    return list;
  }, [secondaryElement, mastered]);

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white transition px-2 py-1 font-rajdhani text-sm"
          >
            ← Voltar
          </button>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-rajdhani">
            Classe
          </p>
          <h1
            className="font-orbitron text-2xl md:text-3xl uppercase tracking-wider"
            style={{ color: cls.color }}
          >
            {cls.label}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Toggle de elemento */}
        <div className="flex items-center gap-2">
          <ElementChip element={element} active />
          {togglableElements.length > 0 && togglableElements.map(other => (
            other !== element && (
              <button
                key={other}
                onClick={() => onChangeElement(other)}
                className="opacity-60 hover:opacity-100 transition"
                title={`Ver árvore de ${ELEMENT_META_PT[other].label}`}
              >
                <ElementChip element={other} />
              </button>
            )
          ))}
        </div>

        {/* Pontos disponíveis */}
        <div
          className="rounded-lg border px-4 py-2 backdrop-blur-xl"
          style={{
            borderColor: `${el.color}55`,
            background:  `${el.color}1A`,
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-rajdhani">
            Pontos
          </p>
          <p
            className="font-orbitron text-2xl"
            style={{ color: el.color }}
          >
            {availablePoints}
          </p>
        </div>
      </div>
    </header>
  );
};

const ElementChip: FC<{ element: ElementType; active?: boolean }> = ({ element, active }) => {
  const meta = ELEMENT_META_PT[element];
  const Icon = ELEMENT_ICONS[element];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 border"
      style={{
        color: meta.color,
        borderColor: active ? `${meta.color}AA` : 'rgba(255,255,255,0.1)',
        background: active ? `${meta.color}22` : 'rgba(255,255,255,0.03)',
        boxShadow: active ? `0 0 16px ${meta.color}55` : undefined,
      }}
    >
      <Icon size={20} />
      <span className="font-orbitron text-xs uppercase tracking-wider">{meta.label}</span>
    </span>
  );
};

// ─── Tier row ────────────────────────────────────────────────────────────────

const TierRow: FC<{
  tier:             number;
  skills:           SkillView[];
  unlocked:         Set<string>;
  availablePoints:  number;
  elementColor:     string;
  onSelect:         (s: SkillView) => void;
}> = ({ tier, skills, unlocked, availablePoints, elementColor, onSelect }) => {
  // Conectores verticais entre tier atual e o anterior — feito via SVG pseudo
  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-[10px] uppercase tracking-widest font-rajdhani px-2 py-0.5 rounded"
          style={{ color: elementColor, background: `${elementColor}22` }}
        >
          Tier {tier}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Conectores SVG até o tier anterior */}
      {tier > 1 && (
        <ConnectorsSVG
          skills={skills}
          unlocked={unlocked}
          elementColor={elementColor}
        />
      )}

      <div className={[
        'grid gap-4',
        skills.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2',
      ].join(' ')}>
        {skills.map(s => (
          <SkillNode
            key={s.id}
            skill={s}
            unlocked={unlocked}
            availablePoints={availablePoints}
            elementColor={elementColor}
            onClick={() => onSelect(s)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Conectores SVG (linha pontilhada simples por trás dos cards) ───────────

const ConnectorsSVG: FC<{
  skills:       SkillView[];
  unlocked:     Set<string>;
  elementColor: string;
}> = ({ skills, unlocked, elementColor }) => {
  // Cada skill conecta a seus prereqs do tier anterior. Como o layout
  // exato depende do grid responsivo, usamos uma linha vertical leve
  // por skill (sinal visual de "vem de cima") — a posição precisa
  // ficaria frágil em CSS responsivo. Estratégia: bullets discretos.
  return (
    <div className="pointer-events-none absolute left-0 right-0 -top-8 h-8">
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-full">
        {skills.map((s, i) => {
          const x = ((i + 0.5) / skills.length) * 100;
          const allOk = s.prerequisites.every(p => unlocked.has(p));
          return (
            <line
              key={s.id}
              x1={x} y1={0} x2={x} y2={32}
              stroke={allOk ? '#facc15' : '#ffffff20'}
              strokeWidth={allOk ? 1.5 : 1}
              strokeDasharray={allOk ? '0' : '3 3'}
            />
          );
        })}
      </svg>
    </div>
  );
};

// ─── Skill node ──────────────────────────────────────────────────────────────

const SkillNode: FC<{
  skill:            SkillView;
  unlocked:         Set<string>;
  availablePoints:  number;
  elementColor:     string;
  onClick:          () => void;
}> = ({ skill, unlocked, availablePoints, elementColor, onClick }) => {
  const isUnlocked = unlocked.has(skill.id);
  const prereqsOk  = skill.prerequisites.every(p => unlocked.has(p));
  const hasPoints  = availablePoints >= skill.cost;
  const state: SkillState = isUnlocked ? 'unlocked' : prereqsOk ? 'available' : 'locked';
  const Icon = MECHANIC_ICONS[skill.mechanicType];

  // Pulse animation on first render after unlock — handled by parent invalidation
  // re-mounting via key. We just style here.

  const borderColor = state === 'unlocked'
    ? '#facc15'   // gold
    : state === 'available'
      ? `${elementColor}88`
      : 'rgba(255,255,255,0.08)';

  const bg = state === 'unlocked'
    ? `linear-gradient(135deg, ${elementColor}22, rgba(250,204,21,0.15))`
    : state === 'available'
      ? `linear-gradient(135deg, ${elementColor}14, rgba(255,255,255,0.04))`
      : 'rgba(255,255,255,0.025)';

  const iconColor = state === 'unlocked'
    ? '#facc15'
    : state === 'available'
      ? elementColor
      : '#ffffff44';

  const costColor = isUnlocked
    ? '#facc15'
    : hasPoints ? '#86efac' : '#fca5a5';

  return (
    <button
      onClick={onClick}
      className={[
        'relative w-full text-left rounded-xl p-4 border backdrop-blur-xl transition-all duration-300',
        state === 'locked' ? 'opacity-70' : 'hover:scale-[1.02]',
        state === 'unlocked' ? 'shadow-[0_0_28px_-6px_rgba(250,204,21,0.5)]' : '',
      ].join(' ')}
      style={{ borderColor, background: bg }}
    >
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 rounded-lg p-2"
          style={{ color: iconColor, background: state === 'locked' ? 'rgba(255,255,255,0.05)' : `${elementColor}1A` }}
        >
          <Icon size={28} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-orbitron text-sm tracking-wide truncate" style={{ color: iconColor }}>
              {skill.variantName}
            </h4>
            {state === 'locked' && <LockIcon />}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-rajdhani mt-0.5">
            {MECHANIC_LABELS[skill.mechanicType]} · Slot {skill.slot}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-white/40 font-rajdhani">
              Custo
            </span>
            <span className="font-orbitron text-sm" style={{ color: costColor }}>
              {skill.cost} {skill.cost === 1 ? 'pt' : 'pts'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const LockIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);

// ─── Modal de detalhe ────────────────────────────────────────────────────────

const SkillDetailModal: FC<{
  studentId:       string;
  skill:           SkillView;
  elementColor:    string;
  unlocked:        Set<string>;
  availablePoints: number;
  onClose:         () => void;
}> = ({ studentId, skill, elementColor, unlocked, availablePoints, onClose }) => {
  const unlockMut = useUnlockSkill(studentId);
  const { ok, reason } = canUnlock(skill, unlocked, availablePoints);
  const isUnlocked = unlocked.has(skill.id);
  const Icon = MECHANIC_ICONS[skill.mechanicType];

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.92, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' },
    );
  }, []);

  const handleUnlock = async () => {
    const res = await unlockMut.mutateAsync({
      skillId:       skill.id,
      cost:          skill.cost,
      prerequisites: skill.prerequisites,
    });
    if (res.success) {
      // Mestria? (este check final é confirmação visual; o servidor não dispara
      // mastery aqui — mastery é registrado pela RPC check_element_mastery,
      // que o front pode chamar após o 13º slot. Mantemos UX otimista.)
      onClose();
      const element = skill.element;
      // se acabou de bater 13 slots, mostra mensagem (cálculo otimista local)
      const futureUnlocked = new Set(unlocked).add(skill.id);
      if (isElementMastered(element, futureUnlocked)) {
        toast.success('ELEMENTO DOMINADO!', {
          description: 'Você desbloqueou todos os 13 slots. Um novo elemento pode ser escolhido.',
          duration: 6000,
        });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end md:items-center justify-center px-4 pb-4 md:pb-0 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border bg-[#0a0f1d] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        style={{ borderColor: `${elementColor}55` }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span
              className="rounded-xl p-3"
              style={{ color: elementColor, background: `${elementColor}1F` }}
            >
              <Icon size={36} />
            </span>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-rajdhani text-white/40">
                {MECHANIC_LABELS[skill.mechanicType]} · Tier {skill.tier} · Slot {skill.slot}
              </p>
              <h2 className="font-orbitron text-xl md:text-2xl mt-1" style={{ color: elementColor }}>
                {skill.variantName}
              </h2>
            </div>
          </div>

          <p className="mt-5 font-rajdhani text-white/85 leading-relaxed">
            {skill.variantDescription}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-rajdhani">
            <Field label="Custo" value={`${skill.cost} ponto${skill.cost === 1 ? '' : 's'}`} />
            <Field label="Base" value={String(skill.baseValue)} />
            <Field label="Atributo" value={skill.variantPrimaryAttr} />
            <Field label="Tipo de dano" value={skill.variantDamageType} />
          </div>

          {skill.prerequisites.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani mb-2">
                Pré-requisitos
              </p>
              <div className="flex flex-wrap gap-2">
                {skill.prerequisites.map(p => (
                  <span
                    key={p}
                    className={[
                      'text-xs px-2 py-1 rounded border font-rajdhani',
                      unlocked.has(p)
                        ? 'border-green-400/40 bg-green-500/10 text-green-200'
                        : 'border-red-400/40 bg-red-500/10 text-red-200',
                    ].join(' ')}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="font-rajdhani text-white/55 hover:text-white px-3 py-2 transition"
            >
              Fechar
            </button>
            {isUnlocked ? (
              <span className="px-4 py-2 rounded border border-amber-300/40 bg-amber-500/15 text-amber-200 font-orbitron text-xs uppercase tracking-widest">
                Já desbloqueada
              </span>
            ) : (
              <button
                onClick={handleUnlock}
                disabled={!ok || unlockMut.isPending}
                className={[
                  'px-5 py-2.5 rounded-lg border font-orbitron text-sm uppercase tracking-widest transition',
                  ok
                    ? 'border-green-400/40 bg-green-500/15 text-green-200 hover:bg-green-500/25 hover:shadow-[0_0_22px_-4px_rgba(74,222,128,0.55)]'
                    : 'border-white/10 bg-white/[0.03] text-white/30 cursor-not-allowed',
                  unlockMut.isPending ? 'opacity-60 cursor-wait' : '',
                ].join(' ')}
                title={!ok ? reason : 'Gastar pontos e desbloquear'}
              >
                {unlockMut.isPending ? 'Desbloqueando...' : 'Desbloquear'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    <p className="text-white/85 capitalize">{value}</p>
  </div>
);

// ─── Reset section ───────────────────────────────────────────────────────────

const ResetSection: FC<{
  studentId:        string;
  element:          ElementType;
  classType:        ClassType;
  unlocked:         Set<string>;
  mastered:         ElementType[];
  secondaryChosen:  boolean;
}> = ({ studentId, element, classType, unlocked, mastered, secondaryChosen }) => {
  const resetMut  = useResetElement(studentId);
  const isMastered = mastered.includes(element);
  const eligible   = isMastered && !secondaryChosen;
  const totalSpent = sumElementSpent(element, classType, unlocked);

  if (!eligible) return null;

  return (
    <div className="mt-12 rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-5">
      <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-rajdhani">
        Reset disponível · cooldown 7 dias
      </p>
      <h3 className="mt-1 font-orbitron text-lg text-amber-100">
        Resetar árvore de {ELEMENT_META_PT[element].label}
      </h3>
      <p className="mt-2 font-rajdhani text-white/70 text-sm leading-relaxed">
        Você dominou este elemento mas ainda não escolheu um secundário. Pode
        desfazer todas as skills deste elemento e recuperar 80% dos pontos
        gastos. Disponível só desta vez — após escolher secundário, sem volta.
      </p>
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <p className="font-rajdhani text-sm text-white/80">
          Pontos investidos: <strong className="text-amber-200">{totalSpent}</strong>
          {' · '}Refund estimado: <strong className="text-green-200">{Math.floor(totalSpent * 0.8)}</strong>
        </p>
        <button
          onClick={() => {
            const ok = window.confirm(
              `Confirmar reset de ${ELEMENT_META_PT[element].label}? Vai apagar TODAS as skills deste elemento e devolver ${Math.floor(totalSpent * 0.8)} pontos. Não dá pra desfazer.`,
            );
            if (!ok) return;
            void resetMut.mutateAsync({ element, totalSpent });
          }}
          disabled={resetMut.isPending || totalSpent === 0}
          className="rounded-lg px-5 py-2.5 border border-amber-400/50 bg-amber-500/15 text-amber-100 font-orbitron text-xs uppercase tracking-widest transition hover:bg-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetMut.isPending ? 'Resetando...' : 'Resetar elemento'}
        </button>
      </div>
    </div>
  );
};

// ─── Auxiliares ──────────────────────────────────────────────────────────────

const FullScreenLoader: FC<{ label: string }> = ({ label }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020611] text-white">
    <p className="font-orbitron uppercase tracking-widest text-white/60">{label}</p>
  </div>
);

const FullScreenInfo: FC<{ title: string; body: string; onBack?: () => void }> = ({ title, body, onBack }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020611] text-white px-4">
    <div className="max-w-md text-center">
      <h2 className="font-orbitron text-2xl">{title}</h2>
      <p className="mt-3 font-rajdhani text-white/70">{body}</p>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 rounded-lg border border-white/20 px-5 py-2.5 font-orbitron text-xs uppercase tracking-widest hover:bg-white/5"
        >
          ← Voltar
        </button>
      )}
    </div>
  </div>
);

const BackgroundFx: FC<{ color: string }> = ({ color }) => (
  <>
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${color}22, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.04), transparent 60%)`,
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

export default Wave11SkillTreeScreen;
