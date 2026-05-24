// ============================================================
// Onda 11.7 — Modais cinematográficos de mestria/troca de
// elemento + painel do perfil.
//
// Três peças:
//   1. <SecondaryElementUnlocked>  — modal pós-1ª mestria
//   2. <TertiaryElementSwap>       — modal pós-2ª mestria (3º elem)
//   3. <ElementsPanel>             — painel pro perfil
// ============================================================

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';

import type { ClassType, ElementType } from '@/lib/skills/skillsRegistry';
import { CLASS_ELEMENT_AFFINITY } from '@/lib/skills/skillsRegistry';
import { ELEMENT_ICONS, ELEMENT_META_PT } from '@/lib/skills/elementIcons';
import { CLASS_META } from '@/lib/skills/classIcons';
import { sumElementSpent } from '@/lib/skills/skillTree';
import { getClassProfile, getMasteredElements } from '@/lib/skills/api';
import { useUnlockedSkills } from '@/hooks/useUnlockedSkills';
import { useSwapElement } from '@/hooks/useSkillMutations';

const ALL_ELEMENTS: ElementType[] = [
  'fire','water','grass','electric','ice','fighting',
  'poison','ground','flying','ghost','steel','dark',
];

// ─── 1) Modal: Secundário desbloqueado ─────────────────────────────────────

export const SecondaryElementUnlocked: FC<{
  studentId:        string;
  classType:        ClassType;
  primaryElement:   ElementType;
  /** O elemento que acabou de ser dominado (geralmente o primário). */
  masteredElement:  ElementType;
  onClose:          () => void;
}> = ({ studentId, classType, primaryElement, masteredElement, onClose }) => {
  const swapMut = useSwapElement(studentId);

  // 2 candidatos: as outras 2 afinidades da classe (excluindo o primário)
  const candidates = useMemo(() => {
    const aff = CLASS_ELEMENT_AFFINITY[classType];
    return aff.affinities.filter(e => e !== primaryElement);
  }, [classType, primaryElement]);

  const [picked, setPicked]         = useState<ElementType | null>(null);
  const [confirmStage, setConfirm]  = useState<0 | 1 | 2>(0);

  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)' });
    }
  }, []);

  const handleConfirm = async () => {
    if (!picked) return;
    const res = await swapMut.mutateAsync({ newElement: picked, removeElement: null, refund: 0 });
    if (res.success) onClose();
  };

  return (
    <CinematicModal accent="#facc15">
      <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300/80 font-rajdhani">
        Marco da temporada
      </p>
      <h2 ref={titleRef} className="font-orbitron text-3xl md:text-4xl mt-2 text-amber-200">
        ELEMENTO DOMINADO
      </h2>
      <p className="font-orbitron text-xl mt-1" style={{ color: ELEMENT_META_PT[masteredElement].color }}>
        {ELEMENT_META_PT[masteredElement].label}
      </p>

      <p className="mt-6 font-rajdhani text-white/85 leading-relaxed">
        Você desbloqueou um novo elemento. Escolha entre as outras 2 afinidades da sua classe ({CLASS_META[classType].label}).
        Você poderá começar a desbloquear suas skills imediatamente.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map(el => (
          <ElementChoiceCard
            key={el}
            element={el}
            selected={picked === el}
            onClick={() => setPicked(el)}
          />
        ))}
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <button onClick={onClose} className="font-rajdhani text-white/55 hover:text-white px-3 py-2 transition">
          Mais tarde
        </button>
        <button
          onClick={() => picked && setConfirm(1)}
          disabled={!picked}
          className={[
            'rounded-lg px-5 py-2.5 border font-orbitron text-sm uppercase tracking-widest transition',
            picked
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
              : 'border-white/10 bg-white/[0.03] text-white/30 cursor-not-allowed',
          ].join(' ')}
        >
          Escolher
        </button>
      </div>

      {confirmStage !== 0 && picked && (
        <ConfirmDouble
          stage={confirmStage}
          title="Adicionar elemento secundário"
          body={
            confirmStage === 1
              ? `Adicionar ${ELEMENT_META_PT[picked].label} como segundo elemento ativo. Você poderá começar a investir pontos na árvore dele.`
              : `Última chance. Após confirmar, ${ELEMENT_META_PT[picked].label} fica como seu secundário até você dominar e trocar.`
          }
          submitting={swapMut.isPending}
          onCancel={() => setConfirm(0)}
          onAdvance={() => setConfirm(2)}
          onFinalConfirm={handleConfirm}
        />
      )}
    </CinematicModal>
  );
};

// ─── 2) Modal: 3º elemento (precisa abandonar um) ──────────────────────────

export const TertiaryElementSwap: FC<{
  studentId:          string;
  classType:          ClassType;
  primaryElement:     ElementType;
  secondaryElement:   ElementType;
  onClose:            () => void;
}> = ({ studentId, classType, primaryElement, secondaryElement, onClose }) => {
  const swapMut    = useSwapElement(studentId);
  const unlockedQ  = useUnlockedSkills(studentId);
  const unlocked   = useMemo(() => new Set(unlockedQ.data ?? []), [unlockedQ.data]);

  const aff = CLASS_ELEMENT_AFFINITY[classType];

  const [picked,      setPicked]   = useState<ElementType | null>(null);
  const [toRemove,    setToRemove] = useState<ElementType | null>(null);
  const [confirmName, setConfirmName] = useState('');

  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
    }
  }, []);

  const refund = picked && toRemove
    ? sumElementSpent(toRemove, classType, unlocked)
    : 0;

  const expected = toRemove ? ELEMENT_META_PT[toRemove].label : '';
  const canConfirm = !!picked && !!toRemove && confirmName.trim().toLowerCase() === expected.toLowerCase();

  const handleSubmit = async () => {
    if (!picked || !toRemove) return;
    const res = await swapMut.mutateAsync({
      newElement:    picked,
      removeElement: toRemove,
      refund,
    });
    if (res.success) onClose();
  };

  return (
    <CinematicModal accent="#a855f7" wide>
      <p className="text-[10px] uppercase tracking-[0.4em] text-purple-300/80 font-rajdhani">
        Encruzilhada de temporada
      </p>
      <h2 ref={titleRef} className="font-orbitron text-3xl md:text-4xl mt-2 text-purple-200">
        AMBOS ELEMENTOS DOMINADOS
      </h2>
      <p className="mt-4 font-rajdhani text-white/85 leading-relaxed">
        Você pode escolher um terceiro elemento, mas precisará abandonar um dos atuais.
        As skills do elemento abandonado serão removidas e você recuperará{' '}
        <strong className="text-green-300">integralmente</strong> os pontos gastos.
      </p>

      {/* Etapa 1: escolher o novo */}
      <section className="mt-6">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani mb-2">
          Escolha o novo elemento (afinidades destacadas)
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {ALL_ELEMENTS.map(el => {
            const isActive = el === primaryElement || el === secondaryElement;
            const isAffinity = aff.primary === el || aff.affinities.includes(el);
            return (
              <button
                key={el}
                disabled={isActive}
                onClick={() => setPicked(el)}
                className={[
                  'rounded-lg border p-3 transition flex flex-col items-center gap-1.5',
                  isActive ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.04] hover:border-white/30',
                  picked === el ? 'border-purple-400 shadow-[0_0_20px_-2px_rgba(168,85,247,0.6)]' : 'border-white/10',
                  isAffinity && !isActive ? 'ring-1 ring-amber-300/40' : '',
                ].join(' ')}
                style={{ background: picked === el ? `${ELEMENT_META_PT[el].color}1F` : 'rgba(255,255,255,0.03)' }}
                title={isActive ? 'Já ativo' : isAffinity ? 'Afinidade da sua classe' : ''}
              >
                <span style={{ color: ELEMENT_META_PT[el].color }}>
                  {(() => { const I = ELEMENT_ICONS[el]; return <I size={28} />; })()}
                </span>
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-white/75">
                  {ELEMENT_META_PT[el].label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Etapa 2: escolher qual abandonar */}
      {picked && (
        <section className="mt-6">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani mb-2">
            Qual você quer abandonar?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[primaryElement, secondaryElement].map(el => {
              const spent = sumElementSpent(el, classType, unlocked);
              return (
                <button
                  key={el}
                  onClick={() => { setToRemove(el); setConfirmName(''); }}
                  className={[
                    'rounded-lg border p-4 text-left transition',
                    toRemove === el
                      ? 'border-red-400/60 bg-red-500/10 shadow-[0_0_20px_-4px_rgba(248,113,113,0.5)]'
                      : 'border-white/10 hover:border-white/30',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: ELEMENT_META_PT[el].color }}>
                      {(() => { const I = ELEMENT_ICONS[el]; return <I size={32} />; })()}
                    </span>
                    <div>
                      <p className="font-orbitron uppercase tracking-wider text-sm" style={{ color: ELEMENT_META_PT[el].color }}>
                        {ELEMENT_META_PT[el].label}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-white/45 font-rajdhani">
                        {el === primaryElement ? 'Primário atual' : 'Secundário atual'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 font-rajdhani text-white/70 text-sm">
                    Pontos gastos: <strong className="text-amber-200">{spent}</strong>
                    {toRemove === el && (
                      <> · Refund: <strong className="text-green-300">{spent} (100%)</strong></>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Etapa 3: confirmação tripla — digitar o nome */}
      {picked && toRemove && (
        <section className="mt-6 rounded-lg border border-red-400/30 bg-red-500/[0.05] p-4">
          <p className="font-orbitron text-xs uppercase tracking-widest text-red-200">
            Confirmação final
          </p>
          <p className="mt-2 font-rajdhani text-sm text-white/80">
            Digite <strong className="text-red-300">{expected}</strong> abaixo para confirmar
            que você quer abandonar este elemento. As {sumElementSpent(toRemove, classType, unlocked)} skills serão apagadas.
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={expected}
            className="mt-3 w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 font-rajdhani text-white placeholder-white/30 outline-none focus:border-red-400/60"
          />
        </section>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        <button onClick={onClose} className="font-rajdhani text-white/55 hover:text-white px-3 py-2 transition">
          Continuar com os 2 atuais
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canConfirm || swapMut.isPending}
          className={[
            'rounded-lg px-5 py-2.5 border font-orbitron text-sm uppercase tracking-widest transition',
            canConfirm
              ? 'border-red-400/50 bg-red-500/15 text-red-100 hover:bg-red-500/25'
              : 'border-white/10 bg-white/[0.03] text-white/30 cursor-not-allowed',
          ].join(' ')}
        >
          {swapMut.isPending ? 'Trocando...' : 'Confirmar troca'}
        </button>
      </div>
    </CinematicModal>
  );
};

// ─── 3) Painel pro perfil ──────────────────────────────────────────────────

export const ElementsPanel: FC<{ studentId: string; className?: string }> = ({ studentId, className }) => {
  const profileQ  = useQuery({
    queryKey: ['skills', 'classProfile', studentId],
    queryFn:  () => getClassProfile(studentId),
    staleTime: 60_000,
  });
  const masteryQ  = useQuery({
    queryKey: ['skills', 'mastery', studentId],
    queryFn:  () => getMasteredElements(studentId),
    staleTime: 60_000,
  });

  const profile  = profileQ.data;
  const mastered = (masteryQ.data ?? []) as ElementType[];

  if (!profile?.primaryElement) return null;

  return (
    <div className={['rounded-lg border border-white/10 bg-white/[0.03] p-3', className ?? ''].join(' ')}>
      <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani">
        Elementos
      </p>
      <div className="mt-2 flex items-center flex-wrap gap-2">
        <ActiveBadge element={profile.primaryElement as ElementType} role="Primário" />
        {profile.secondaryElement && (
          <ActiveBadge element={profile.secondaryElement as ElementType} role="Secundário" />
        )}
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-white/40 font-rajdhani">
        Dominados no histórico
      </p>
      <p className="mt-1 font-orbitron text-xl text-amber-200">
        {mastered.length} <span className="text-white/30 text-sm">/ 12</span>
      </p>
    </div>
  );
};

const ActiveBadge: FC<{ element: ElementType; role: string }> = ({ element, role }) => {
  const meta = ELEMENT_META_PT[element];
  const Icon = ELEMENT_ICONS[element];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 border"
      style={{ color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}1A` }}
      title={role}
    >
      <Icon size={16} />
      <span className="font-orbitron text-[11px] uppercase tracking-wider">{meta.label}</span>
    </span>
  );
};

// ─── Auxiliares: card de escolha + modal cinematográfico + confirm duplo ────

const ElementChoiceCard: FC<{
  element: ElementType; selected: boolean; onClick: () => void;
}> = ({ element, selected, onClick }) => {
  const meta = ELEMENT_META_PT[element];
  const Icon = ELEMENT_ICONS[element];
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-xl border p-5 transition text-left',
        selected ? 'scale-[1.02] shadow-[0_0_30px_-5px_var(--glow)]' : 'hover:scale-[1.01]',
      ].join(' ')}
      style={{
        ['--glow' as any]: meta.color,
        background: selected ? `linear-gradient(135deg, ${meta.color}22, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.03)',
        borderColor: selected ? `${meta.color}AA` : 'rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: meta.color }}><Icon size={36} /></span>
        <div>
          <p className="font-orbitron text-lg uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </p>
          <p className="font-rajdhani text-xs text-white/60 mt-0.5">{meta.theme}</p>
        </div>
      </div>
    </button>
  );
};

const CinematicModal: FC<{ accent: string; wide?: boolean; children: React.ReactNode }> = ({ accent, wide, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
  }, []);
  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center px-4 pb-4 md:pb-0 bg-black/80 backdrop-blur-md">
      <div
        ref={cardRef}
        className={['w-full rounded-2xl border bg-[#0a0f1d] p-6 md:p-8 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]',
          wide ? 'max-w-3xl' : 'max-w-lg'].join(' ')}
        style={{ borderColor: `${accent}55`, boxShadow: `0 30px 120px -30px ${accent}66` }}
      >
        {children}
      </div>
    </div>
  );
};

const ConfirmDouble: FC<{
  stage: 1 | 2;
  title: string;
  body: string;
  submitting: boolean;
  onCancel: () => void;
  onAdvance: () => void;
  onFinalConfirm: () => void;
}> = ({ stage, title, body, submitting, onCancel, onAdvance, onFinalConfirm }) => (
  <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0f1d] p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80 font-rajdhani">
        {stage === 1 ? 'Confirmar' : 'Última chance'}
      </p>
      <h3 className="mt-2 font-orbitron text-xl">{title}</h3>
      <p className="mt-3 font-rajdhani text-white/75 leading-relaxed">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} disabled={submitting} className="font-rajdhani text-white/55 hover:text-white px-3 py-2">
          Cancelar
        </button>
        <button
          onClick={stage === 1 ? onAdvance : onFinalConfirm}
          disabled={submitting}
          className={[
            'rounded-lg px-5 py-2.5 border font-orbitron text-sm uppercase tracking-widest',
            stage === 1
              ? 'border-amber-400/50 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
              : 'border-amber-500/60 bg-amber-500/25 text-amber-50 hover:bg-amber-500/35',
            submitting ? 'opacity-60 cursor-wait' : '',
          ].join(' ')}
        >
          {stage === 1 ? 'Continuar' : submitting ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  </div>
);
