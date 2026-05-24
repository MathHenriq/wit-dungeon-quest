// ============================================================
// Onda 11.4 — Tela de escolha de classe + elemento primário.
//
// State machine em 3 etapas. Bloqueia o resto do app até que
// student_class_profile.class_type seja preenchido.
//
// O gate vive em StudentPortal (render condicional, padrão já
// usado pelo OnboardingFlow legacy). Esta tela só conhece o
// `student` atual e um callback `onComplete` para refetch.
// ============================================================

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { gsap } from 'gsap';
import { toast } from 'sonner';
import { supabaseStudent } from '@/integrations/supabase/studentClient';

import type { Student } from '@/types';
import type { ClassType, ElementType } from '@/lib/skills/skillsRegistry';
import { CLASS_ATTRIBUTES, CLASS_ELEMENT_AFFINITY, SKILLS_REGISTRY } from '@/lib/skills/skillsRegistry';
import { CLASS_META } from '@/lib/skills/classIcons';
import { ELEMENT_ICONS, ELEMENT_META_PT } from '@/lib/skills/elementIcons';
import { CardClassPreview } from '@/components/onboarding/CardClassPreview';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Data de corte da Season 2.
 * - Alunos criados ANTES desta data = veteranos (modal curto, "nova era").
 * - Alunos criados DEPOIS = novatos (tutorial mais longo).
 * Ajustar quando admin disparar o wipe oficial via apply_patch11_wipe().
 */
const WIPE_DATE_ISO = '2026-05-18T00:00:00Z';

const CLASS_ORDER: ClassType[] = [
  'guerreiro','arqueiro','mago','assassino','monge','paladino',
  'curandeiro','invocador','samurai','bardo','lanceiro','alquimista',
];

type Step = 'intro' | 'class' | 'element';

interface Props {
  student:    Student;
  onComplete: () => void;
}

// ─── Componente principal ────────────────────────────────────────────────────

export const ClassSelectionScreen: FC<Props> = ({ student, onComplete }) => {
  const [step, setStep] = useState<Step>('intro');
  const [chosenClass,   setChosenClass]   = useState<ClassType | null>(null);
  const [hoverClass,    setHoverClass]    = useState<ClassType | null>(null);
  const [chosenElement, setChosenElement] = useState<ElementType | null>(null);
  const [confirmStage,  setConfirmStage]  = useState<0 | 1 | 2>(0); // 0=nenhum, 1=primeiro modal, 2=último
  const [submitting,    setSubmitting]    = useState(false);

  const isVeteran = useMemo(() => {
    // `Student` (legacy type) não declara created_at / wiped_at_patch_1_1 ainda;
    // ambos existem no banco. Acesso defensivo via cast.
    const extra = student as unknown as { created_at?: string | null; wiped_at_patch_1_1?: string | null };
    const createdAt = extra.created_at ? new Date(extra.created_at) : null;
    const wipe      = new Date(WIPE_DATE_ISO);
    const wipedFlag = !!extra.wiped_at_patch_1_1;
    return wipedFlag || (createdAt !== null && createdAt < wipe);
  }, [student]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#020611] text-white">
      {/* Fundo: gradiente animado sutil */}
      <BackgroundFx />

      <div className="relative h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <Header step={step} />

          <div className="mt-8 md:mt-12">
            {step === 'intro' && (
              <IntroStep
                isVeteran={isVeteran}
                onNext={() => setStep('class')}
              />
            )}

            {step === 'class' && (
              <ChooseClassStep
                chosenClass={chosenClass}
                hoverClass={hoverClass}
                onPick={setChosenClass}
                onHover={setHoverClass}
                onBack={() => setStep('intro')}
                onNext={() => { if (chosenClass) setStep('element'); }}
              />
            )}

            {step === 'element' && chosenClass && (
              <ChooseElementStep
                classType={chosenClass}
                chosenElement={chosenElement}
                onPick={setChosenElement}
                onBackToClasses={() => setStep('class')}
                onConfirm={() => setConfirmStage(1)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modais de confirmação dupla */}
      {confirmStage !== 0 && chosenClass && chosenElement && (
        <ConfirmDouble
          stage={confirmStage}
          classType={chosenClass}
          element={chosenElement}
          submitting={submitting}
          onCancel={() => setConfirmStage(0)}
          onAdvance={() => setConfirmStage(2)}
          onFinalConfirm={async () => {
            setSubmitting(true);
            try {
              const { data, error } = await supabaseStudent.rpc(
                'choose_class_and_element' as never,
                { p_class: chosenClass, p_primary_element: chosenElement } as never,
              );
              if (error) throw error;
              const res = data as unknown as { success: boolean; error?: string };
              if (!res?.success) {
                // Sync issue: DB already has a class but the frontend's classProfile
                // is stale (other device, RLS quirk, cache). Hard reload bypasses
                // every cache layer reliably.
                if (res?.error === 'class_already_chosen') {
                  toast.info('Classe já definida — recarregando...');
                  setTimeout(() => window.location.reload(), 1200);
                  return;
                }
                toast.error('Erro ao definir classe', { description: res?.error ?? 'desconhecido' });
                setConfirmStage(0);
                return;
              }
              toast.success(`Classe definida: ${CLASS_META[chosenClass].label}`);
              onComplete();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error('Falha ao salvar', { description: msg });
              setConfirmStage(0);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}
    </div>
  );
};

// ─── Cabeçalho com indicador de etapas ──────────────────────────────────────

const Header: FC<{ step: Step }> = ({ step }) => {
  const stepIdx = step === 'intro' ? 1 : step === 'class' ? 2 : 3;
  return (
    <header className="text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70 font-rajdhani">
        WIT Dungeon · Season 2
      </p>
      <h1 className="mt-2 font-orbitron text-3xl md:text-5xl tracking-wider">
        {step === 'intro'   && 'Bem-vindo à Nova Era'}
        {step === 'class'   && 'Escolha sua Classe'}
        {step === 'element' && 'Escolha seu Elemento Primário'}
      </h1>
      <div className="mt-5 flex items-center justify-center gap-2">
        {[1, 2, 3].map(n => (
          <div
            key={n}
            className={[
              'h-1 rounded-full transition-all duration-500',
              n <= stepIdx ? 'w-12 bg-cyan-300' : 'w-6 bg-white/15',
            ].join(' ')}
          />
        ))}
      </div>
    </header>
  );
};

// ─── Etapa 1 — Introdução ──────────────────────────────────────────────────

const IntroStep: FC<{ isVeteran: boolean; onNext: () => void }> = ({ isVeteran, onNext }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll<HTMLElement>('[data-fade]');
    gsap.fromTo(els, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' });
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl">
      <div
        data-fade
        className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-10"
        style={{ boxShadow: '0 30px 80px -30px rgba(34,211,238,0.25)' }}
      >
        <p className="font-rajdhani text-lg leading-relaxed text-white/85">
          {isVeteran
            ? 'O ciclo anterior se encerrou. Suas atribuições antigas, suas skills, sua arena — tudo foi recolhido para forjar algo maior. A partir de hoje cada aluno escolhe uma classe e um elemento primário que definem como joga, com quem é forte, e quem é seu desafio natural.'
            : 'WIT Dungeon é um jogo de batalhas táticas. Cada aluno tem uma classe (12 opções), um elemento primário (12 opções) e uma árvore de skills que cresce com pontos ganhos por nível. As classes não são só um nome: definem com quais elementos você tem afinidade e quais atributos vão te beneficiar mais.'}
        </p>

        <ul data-fade className="mt-6 space-y-3">
          <BulletLine
            title="Elementos com efetividade"
            body="Cada elemento é forte contra alguns e fraco contra outros — igual ao sistema clássico de Pokémon."
          />
          <BulletLine
            title="Afinidade de classe"
            body="Sua classe dá +10% de dano no elemento principal dela e +5% nos dois afins. Escolher com cuidado importa."
          />
          <BulletLine
            title="Evoluções por atributo"
            body="A cada 30, 60 e 90 pontos investidos em um atributo (Força, Destreza, etc.) você desbloqueia uma evolução com bônus + passiva permanente."
          />
          {!isVeteran && (
            <BulletLine
              title="Skills por elemento"
              body="Você gasta pontos para liberar skills numa árvore de 13 slots por elemento. Dominar um elemento inteiro libera um secundário."
            />
          )}
        </ul>

        <div data-fade className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-widest text-amber-300/80 font-rajdhani">
            Escolha permanente · só pode escolher uma vez
          </p>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-6 py-3 font-orbitron text-sm uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-500/25 hover:border-cyan-400/70 hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.6)]"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
};

const BulletLine: FC<{ title: string; body: string }> = ({ title, body }) => (
  <li className="flex gap-3">
    <span className="mt-1 size-2 rounded-full bg-cyan-300 shrink-0" />
    <div>
      <p className="font-orbitron text-sm uppercase tracking-wider text-cyan-200">{title}</p>
      <p className="font-rajdhani text-white/70">{body}</p>
    </div>
  </li>
);

// ─── Etapa 2 — Grid de classes ──────────────────────────────────────────────

const ChooseClassStep: FC<{
  chosenClass: ClassType | null;
  hoverClass:  ClassType | null;
  onPick:      (c: ClassType) => void;
  onHover:     (c: ClassType | null) => void;
  onBack:      () => void;
  onNext:      () => void;
}> = ({ chosenClass, hoverClass, onPick, onHover, onBack, onNext }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll<HTMLElement>('[data-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out' },
    );
  }, []);

  return (
    <>
      <div
        ref={gridRef}
        className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-start"
      >
        {CLASS_ORDER.map(c => (
          <div key={c} data-card>
            <CardClassPreview
              classType={c}
              selected={chosenClass === c}
              expanded={chosenClass === c}
              onClick={() => onPick(c)}
              onMouseEnter={() => onHover(c)}
              onMouseLeave={() => onHover(null)}
            />
          </div>
        ))}
      </div>

      <NavBar
        backLabel="← Voltar"
        onBack={onBack}
        nextLabel="Escolher elemento →"
        onNext={onNext}
        nextDisabled={!chosenClass}
      />
    </>
  );
};

// ─── Etapa 3 — Elementos da classe ──────────────────────────────────────────

const ChooseElementStep: FC<{
  classType:     ClassType;
  chosenElement: ElementType | null;
  onPick:        (e: ElementType) => void;
  onBackToClasses: () => void;
  onConfirm:     () => void;
}> = ({ classType, chosenElement, onPick, onBackToClasses, onConfirm }) => {
  const aff = CLASS_ELEMENT_AFFINITY[classType];
  const classMeta = CLASS_META[classType];

  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!rowRef.current) return;
    const els = rowRef.current.querySelectorAll<HTMLElement>('[data-el]');
    gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.4)' });
  }, [classType]);

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-rajdhani text-white/65">
          Classe escolhida:{' '}
          <strong className="font-orbitron uppercase tracking-wider" style={{ color: classMeta.color }}>
            {classMeta.label}
          </strong>
          . Estes três elementos têm afinidade com ela.
        </p>
      </div>

      <div
        ref={rowRef}
        className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-3"
      >
        {aff.affinities.map(el => (
          <div key={el} data-el>
            <ElementCard
              classType={classType}
              element={el}
              isRecommended={el === aff.primary}
              selected={chosenElement === el}
              onClick={() => onPick(el)}
            />
          </div>
        ))}
      </div>

      <NavBar
        backLabel="← Trocar de classe"
        onBack={onBackToClasses}
        nextLabel="Iniciar jornada →"
        onNext={onConfirm}
        nextDisabled={!chosenElement}
      />
    </>
  );
};

const ElementCard: FC<{
  classType: ClassType;
  element: ElementType;
  isRecommended: boolean;
  selected: boolean;
  onClick: () => void;
}> = ({ classType, element, isRecommended, selected, onClick }) => {
  const meta = ELEMENT_META_PT[element];
  const Icon = ELEMENT_ICONS[element];

  // Pega a tier-1 real da combinação classe+elemento (não o sample genérico).
  const tier1 = SKILLS_REGISTRY.find(s => s.element === element && s.tier === 1 && s.slot === 1);
  const variant = tier1?.variants[classType];
  const skillLine = variant
    ? `${variant.name} — ${variant.description}`
    : meta.sampleSkill;
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected}
      className={[
        'group relative w-full rounded-2xl border p-6 text-left backdrop-blur-xl transition-all duration-300',
        selected
          ? 'border-white/40 scale-[1.02] shadow-[0_0_40px_-5px_var(--glow)]'
          : 'border-white/10 hover:border-white/25 hover:scale-[1.01]',
      ].join(' ')}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${meta.color}26, rgba(255,255,255,0.04))`
          : 'rgba(255,255,255,0.04)',
        ['--glow' as any]: meta.color,
      }}
      aria-pressed={selected}
    >
      {isRecommended && (
        <span
          className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-orbitron uppercase tracking-widest"
          style={{
            color: '#1f1300',
            background: 'linear-gradient(135deg, #fde047, #f59e0b)',
            boxShadow: '0 0 18px rgba(253,224,71,0.55)',
          }}
        >
          Recomendado
        </span>
      )}
      <div className="flex items-center gap-3">
        <span
          className="rounded-xl p-2"
          style={{
            color: meta.color,
            background: `${meta.color}1F`,
            boxShadow: isRecommended ? `0 0 24px ${meta.color}66` : undefined,
          }}
        >
          <Icon size={44} />
        </span>
        <div>
          <h3 className="font-orbitron text-xl uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </h3>
          <p className="font-rajdhani text-xs text-white/60 mt-0.5">{meta.theme}</p>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-rajdhani mb-1">
          Skill básica
        </p>
        <p className="font-rajdhani text-white/80">{skillLine}</p>
      </div>
    </button>
  );
};

// ─── Nav bar (voltar/avançar) ───────────────────────────────────────────────

const NavBar: FC<{
  backLabel: string; onBack: () => void;
  nextLabel: string; onNext: () => void; nextDisabled?: boolean;
}> = ({ backLabel, onBack, nextLabel, onNext, nextDisabled }) => (
  <div className="mt-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
    <button
      type="button"
      onClick={onBack}
      className="font-rajdhani text-white/55 hover:text-white/90 transition"
    >
      {backLabel}
    </button>
    <button
      type="button"
      onClick={onNext}
      disabled={nextDisabled}
      className={[
        'rounded-lg px-6 py-3 font-orbitron text-sm uppercase tracking-widest border transition',
        nextDisabled
          ? 'border-white/10 bg-white/[0.03] text-white/30 cursor-not-allowed'
          : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400/70 hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.6)]',
      ].join(' ')}
    >
      {nextLabel}
    </button>
  </div>
);

// ─── Modal de confirmação dupla ─────────────────────────────────────────────

const ConfirmDouble: FC<{
  stage: 1 | 2;
  classType: ClassType;
  element: ElementType;
  submitting: boolean;
  onCancel: () => void;
  onAdvance: () => void;        // stage 1 → 2
  onFinalConfirm: () => void;   // stage 2 → RPC
}> = ({ stage, classType, element, submitting, onCancel, onAdvance, onFinalConfirm }) => {
  const cls = CLASS_META[classType];
  const el  = ELEMENT_META_PT[element];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0f1d] p-6 md:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <p className="text-xs uppercase tracking-[0.3em] font-rajdhani text-amber-300/80">
          {stage === 1 ? 'Confirmar escolha' : 'Última chance'}
        </p>
        <h2 className="mt-2 font-orbitron text-2xl">
          {stage === 1 ? 'Tem certeza?' : 'Isto é permanente.'}
        </h2>
        <p className="mt-3 font-rajdhani text-white/70 leading-relaxed">
          {stage === 1
            ? `Você vai entrar na Season 2 como `
            : `Esta é a última chance de voltar. Após confirmar você é `}
          <strong style={{ color: cls.color }}>{cls.label}</strong>
          {' '}com elemento{' '}
          <strong style={{ color: el.color }}>{el.label}</strong>
          {stage === 1
            ? '. Isto não pode ser desfeito depois.'
            : ' até o fim da temporada. Sem retorno.'}
        </p>

        <div className="mt-6 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="font-rajdhani text-white/60 hover:text-white px-4 py-2 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={stage === 1 ? onAdvance : onFinalConfirm}
            disabled={submitting}
            className={[
              'rounded-lg px-5 py-2.5 font-orbitron text-sm uppercase tracking-widest border transition',
              stage === 1
                ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                : 'border-amber-400/50 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 hover:shadow-[0_0_25px_-5px_rgba(251,191,36,0.6)]',
              submitting ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
          >
            {stage === 1 ? 'Sim, continuar' : submitting ? 'Salvando...' : 'Confirmar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Fundo animado (gradiente + grid sutil) ─────────────────────────────────

const BackgroundFx: FC = () => (
  <>
    <div
      className="absolute inset-0 opacity-60"
      style={{
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(34,211,238,0.18), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(168,85,247,0.15), transparent 50%)',
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  </>
);

export default ClassSelectionScreen;
