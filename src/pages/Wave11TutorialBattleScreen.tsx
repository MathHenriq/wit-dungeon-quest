// ============================================================
// Onda 11.8 — Tutorial de combate (3 cenas scriptadas).
//
// Não usa BattleEngine real: simulação visual para ensinar
// efetividade e atributos sem afetar XP/ranking/inventário.
// ============================================================

import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';

import type { ElementType } from '@/lib/skills/skillsRegistry';
import { ELEMENT_EFFECTIVENESS } from '@/lib/skills/skillsRegistry';
import { ELEMENT_ICONS, ELEMENT_META_PT } from '@/lib/skills/elementIcons';
import { CLASS_META } from '@/lib/skills/classIcons';
import { getClassProfile, getStudentAttributes } from '@/lib/skills/api';
import { useCompleteTutorial } from '@/hooks/useSkillMutations';
import type { Student } from '@/types';

const WIPE_DATE_ISO = '2026-05-18T00:00:00Z';

interface Props {
  student:    Student;
  onComplete: () => void;
}

type SceneId = 0 | 1 | 2 | 3;

interface LogLine { kind: 'system' | 'player' | 'enemy' | 'effect'; text: string }

export const Wave11TutorialBattleScreen: FC<Props> = ({ student, onComplete }) => {
  const profileQ = useQuery({
    queryKey: ['skills', 'classProfile', student.id],
    queryFn:  () => getClassProfile(student.id),
    staleTime: 60_000,
  });
  const attrsQ = useQuery({
    queryKey: ['skills', 'attributes', student.id],
    queryFn:  () => getStudentAttributes(student.id),
    staleTime: 60_000,
  });

  const completeMut = useCompleteTutorial();

  const [scene, setScene]     = useState<SceneId>(0);
  const [showSkip, setShowSkip] = useState(false);

  const isVeteran = useMemo(() => {
    const extra = student as unknown as { created_at?: string | null; wiped_at_patch_1_1?: string | null };
    const created = extra.created_at ? new Date(extra.created_at) : null;
    return !!extra.wiped_at_patch_1_1 || (created !== null && created < new Date(WIPE_DATE_ISO));
  }, [student]);

  if (profileQ.isLoading || attrsQ.isLoading || !profileQ.data?.primaryElement) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020611] text-white">
        <p className="font-orbitron uppercase tracking-widest text-white/60">Carregando tutorial...</p>
      </div>
    );
  }

  const playerElement = profileQ.data.primaryElement as ElementType;
  const classType = profileQ.data.classType!;
  const attrs = attrsQ.data!;

  // Calcula adversários a partir da matriz de efetividade
  const weakAgainst   = pickWeakness(playerElement);   // inimigo cujo elemento bate forte em mim
  const strongAgainst = pickStrength(playerElement);   // inimigo que meu elemento bate forte

  const handleFinish = async () => {
    const res = await completeMut.mutateAsync();
    if (res.success) onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#020611] text-white">
      <BackgroundFx />

      <div className="relative h-full w-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <TutorialHeader
            scene={scene}
            isVeteran={isVeteran}
            onSkip={() => setShowSkip(true)}
          />

          {scene === 0 && (
            <Scene
              key="s0"
              title="Batalha 1 — A fraqueza"
              intro={`Atenção! Seu elemento ${ELEMENT_META_PT[playerElement].label} é fraco contra ${ELEMENT_META_PT[weakAgainst].label}. Suas skills causam pouco dano nesse inimigo.`}
              playerElement={playerElement}
              enemyElement={weakAgainst}
              classLabel={CLASS_META[classType].label}
              outcome="player_loses"
              finalToast={{
                title: 'Lição: efetividade',
                body: 'Quando atacou com seu elemento, foi "Não muito efetivo...". Atacar o tipo errado custa caro.',
              }}
              showAttributesPanel={false}
              attrs={attrs}
              onNext={() => setScene(1)}
              nextLabel="Próxima cena →"
            />
          )}

          {scene === 1 && (
            <Scene
              key="s1"
              title="Batalha 2 — A vantagem"
              intro={`Agora um inimigo de ${ELEMENT_META_PT[strongAgainst].label}. Seu elemento ${ELEMENT_META_PT[playerElement].label} é SUPER EFETIVO contra ele.`}
              playerElement={playerElement}
              enemyElement={strongAgainst}
              classLabel={CLASS_META[classType].label}
              outcome="player_wins_big"
              finalToast={{
                title: 'Lição: vantagem',
                body: 'Aproveitar a fraqueza do inimigo é a chave. "SUPER EFETIVO!" significa 2× de dano.',
              }}
              showAttributesPanel={false}
              attrs={attrs}
              onNext={() => setScene(2)}
              nextLabel="Próxima cena →"
            />
          )}

          {scene === 2 && (
            <Scene
              key="s2"
              title="Batalha 3 — Os atributos"
              intro={`Um inimigo neutro. Além da efetividade, seus atributos multiplicam o dano. Veja na HUD como cada ponto importa.`}
              playerElement={playerElement}
              enemyElement={playerElement}
              classLabel={CLASS_META[classType].label}
              outcome="player_wins_normal"
              finalToast={{
                title: 'Pronto pra batalhar',
                body: 'Cada ponto de atributo conta. Distribua com cuidado — eles são permanentes na temporada.',
              }}
              showAttributesPanel
              attrs={attrs}
              onNext={() => setScene(3)}
              nextLabel="Concluir →"
            />
          )}

          {scene === 3 && (
            <FinalCard
              loading={completeMut.isPending}
              onConfirm={handleFinish}
            />
          )}
        </div>
      </div>

      {showSkip && (
        <SkipConfirm
          isVeteran={isVeteran}
          loading={completeMut.isPending}
          onCancel={() => setShowSkip(false)}
          onConfirm={handleFinish}
        />
      )}
    </div>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────

const TutorialHeader: FC<{ scene: SceneId; isVeteran: boolean; onSkip: () => void }> = ({ scene, isVeteran, onSkip }) => (
  <header className="flex items-start justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70 font-rajdhani">
        Tutorial de combate
      </p>
      <h1 className="mt-1 font-orbitron text-2xl md:text-3xl tracking-wider">
        Cena {Math.min(scene + 1, 3)} de 3
      </h1>
      <div className="mt-3 flex gap-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={[
              'h-1 rounded-full transition-all',
              i < scene ? 'w-12 bg-cyan-300' : i === scene ? 'w-12 bg-cyan-200 animate-pulse' : 'w-6 bg-white/15',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
    <button
      onClick={onSkip}
      className={[
        'rounded-lg border font-rajdhani text-xs uppercase tracking-widest transition px-3 py-2',
        isVeteran
          ? 'border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 shadow-[0_0_18px_-4px_rgba(251,191,36,0.5)]'
          : 'border-white/15 text-white/60 hover:text-white hover:border-white/30',
      ].join(' ')}
    >
      {isVeteran ? 'Já joguei antes — pular tutorial' : 'Já entendi, pular'}
    </button>
  </header>
);

// ─── Scene (3 batalhas scriptadas, estrutura comum) ─────────────────────────

type SceneOutcome = 'player_loses' | 'player_wins_big' | 'player_wins_normal';

const Scene: FC<{
  title:               string;
  intro:               string;
  playerElement:       ElementType;
  enemyElement:        ElementType;
  classLabel:          string;
  outcome:             SceneOutcome;
  finalToast:          { title: string; body: string };
  showAttributesPanel: boolean;
  attrs:               Record<string, number>;
  onNext:              () => void;
  nextLabel:           string;
}> = ({ title, intro, playerElement, enemyElement, classLabel, outcome, finalToast, showAttributesPanel, attrs, onNext, nextLabel }) => {
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp,  setEnemyHp]  = useState(100);
  const [log, setLog]           = useState<LogLine[]>([]);
  const [phase, setPhase]       = useState<'intro' | 'attack1' | 'attack2' | 'done'>('intro');
  const [showFinal, setShowFinal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset on prop change (key reset already remounts, mas garantia)
  useEffect(() => {
    setPlayerHp(100); setEnemyHp(100); setLog([]); setPhase('intro'); setShowFinal(false);
  }, [playerElement, enemyElement, outcome]);

  // Animação de entrada
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll<HTMLElement>('[data-fade]');
    gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
  }, [outcome]);

  const playOut = () => {
    setPhase('attack1');
    const lines: LogLine[] = [];
    const pushLog = (l: LogLine) => { lines.push(l); setLog([...lines]); };

    if (outcome === 'player_loses') {
      // Player attacks weak → tiny damage. Enemy retaliates → player loses.
      setTimeout(() => {
        pushLog({ kind: 'player', text: 'Você usou sua skill principal!' });
        pushLog({ kind: 'effect', text: 'Não muito efetivo...' });
        pushLog({ kind: 'player', text: 'Causou 5 de dano.' });
        setEnemyHp(95);
      }, 600);
      setTimeout(() => {
        pushLog({ kind: 'enemy', text: 'O inimigo contra-atacou!' });
        pushLog({ kind: 'effect', text: 'SUPER EFETIVO!' });
        pushLog({ kind: 'enemy', text: 'Você sofreu 95 de dano.' });
        setPlayerHp(5);
        setPhase('attack2');
      }, 2200);
      setTimeout(() => {
        pushLog({ kind: 'enemy', text: 'Golpe final.' });
        pushLog({ kind: 'enemy', text: 'Você sofreu 5 de dano.' });
        setPlayerHp(0);
        pushLog({ kind: 'system', text: 'Você foi derrotado.' });
        setShowFinal(true); setPhase('done');
      }, 3600);

    } else if (outcome === 'player_wins_big') {
      setTimeout(() => {
        pushLog({ kind: 'player', text: 'Você atacou!' });
        pushLog({ kind: 'effect', text: 'SUPER EFETIVO!' });
        pushLog({ kind: 'player', text: 'Causou 80 de dano.' });
        setEnemyHp(20);
        setPhase('attack2');
      }, 600);
      setTimeout(() => {
        pushLog({ kind: 'player', text: 'Acerto crítico!' });
        pushLog({ kind: 'player', text: 'Causou 60 de dano.' });
        setEnemyHp(0);
        pushLog({ kind: 'system', text: 'Inimigo derrotado!' });
        setShowFinal(true); setPhase('done');
      }, 2000);

    } else {
      // player_wins_normal — show attribute multipliers in action
      setTimeout(() => {
        pushLog({ kind: 'player', text: 'Skill base: 40 de dano.' });
        pushLog({ kind: 'effect', text: `× ${(1 + (attrs.forca + attrs.inteligencia) / 100).toFixed(2)} dos atributos = ${Math.floor(40 * (1 + (attrs.forca + attrs.inteligencia) / 100))} de dano.` });
        setEnemyHp(40);
        setPhase('attack2');
      }, 600);
      setTimeout(() => {
        pushLog({ kind: 'enemy', text: 'Inimigo respondeu — você esquivou!' });
      }, 1900);
      setTimeout(() => {
        pushLog({ kind: 'player', text: 'Você finalizou com mais uma skill.' });
        setEnemyHp(0);
        pushLog({ kind: 'system', text: 'Vitória técnica!' });
        setShowFinal(true); setPhase('done');
      }, 3000);
    }
  };

  return (
    <div ref={containerRef} className="mt-8 md:mt-10">
      <div data-fade>
        <h2 className="font-orbitron text-xl md:text-2xl">{title}</h2>
        <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4 backdrop-blur-xl">
          <p className="font-rajdhani text-cyan-100 leading-relaxed">{intro}</p>
        </div>
      </div>

      {/* HUD player vs enemy */}
      <div data-fade className="mt-6 grid grid-cols-2 gap-4">
        <CombatantHud label={classLabel} element={playerElement} hp={playerHp} side="player" />
        <CombatantHud label="Inimigo" element={enemyElement} hp={enemyHp} side="enemy" />
      </div>

      {/* Atributos (cena 3) */}
      {showAttributesPanel && (
        <div data-fade className="mt-4 rounded-lg border border-purple-400/30 bg-purple-500/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-purple-200/80 font-rajdhani">
            Seus multiplicadores ativos
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 font-rajdhani text-sm">
            <AttrStat label="Força → Físico"     value={`+${attrs.forca}%`}        />
            <AttrStat label="Inteligência → Mág."  value={`+${attrs.inteligencia}%`} />
            <AttrStat label="Destreza → Crit"     value={`+${attrs.destreza}%`}    />
            <AttrStat label="Agilidade → Esquiva" value={`+${attrs.agilidade}%`}   />
            <AttrStat label="Resistência → Def."  value={`−${attrs.resistencia}%`} />
            <AttrStat label="Carisma → Efeitos"   value={`+${attrs.carisma}%`}     />
          </div>
        </div>
      )}

      {/* Log */}
      <div data-fade className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 h-40 overflow-y-auto font-mono text-xs">
        {log.length === 0
          ? <p className="text-white/40">Aperte "Iniciar" abaixo para ver a batalha.</p>
          : log.map((l, i) => (
              <p key={i} className={[
                'leading-relaxed',
                l.kind === 'effect' ? 'text-amber-300' :
                l.kind === 'player' ? 'text-cyan-200'  :
                l.kind === 'enemy'  ? 'text-rose-200'  : 'text-white/60',
              ].join(' ')}>
                {l.text}
              </p>
            ))
        }
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {phase === 'intro' ? (
          <button
            onClick={playOut}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-5 py-2.5 font-orbitron text-sm uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/25"
          >
            Iniciar batalha
          </button>
        ) : <div />}

        {showFinal && (
          <button
            onClick={onNext}
            className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-5 py-2.5 font-orbitron text-sm uppercase tracking-widest text-amber-100 hover:bg-amber-500/25"
          >
            {nextLabel}
          </button>
        )}
      </div>

      {showFinal && (
        <div data-fade className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="font-orbitron text-sm text-amber-200">{finalToast.title}</p>
          <p className="mt-1 font-rajdhani text-white/85">{finalToast.body}</p>
        </div>
      )}
    </div>
  );
};

// ─── HUD componentes ────────────────────────────────────────────────────────

const CombatantHud: FC<{ label: string; element: ElementType; hp: number; side: 'player' | 'enemy' }> = ({
  label, element, hp, side,
}) => {
  const meta = ELEMENT_META_PT[element];
  const Icon = ELEMENT_ICONS[element];
  return (
    <div
      className="rounded-xl border p-4 backdrop-blur-xl"
      style={{ borderColor: `${meta.color}55`, background: `${meta.color}10` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-orbitron text-sm uppercase tracking-wider truncate" style={{ color: meta.color }}>
          {label}
        </p>
        <span style={{ color: meta.color }}><Icon size={28} /></span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40 font-rajdhani">
        {side === 'player' ? 'Você' : 'Inimigo'} · {meta.label}
      </p>
      <div className="mt-3">
        <div className="flex justify-between text-[10px] font-rajdhani uppercase tracking-wider">
          <span className="text-white/40">HP</span>
          <span style={{ color: meta.color }}>{hp}/100</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${hp}%`, background: hp > 50 ? '#34d399' : hp > 20 ? '#facc15' : '#f87171' }}
          />
        </div>
      </div>
    </div>
  );
};

const AttrStat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
    <p className="text-purple-100">{value}</p>
  </div>
);

// ─── Cena final + confirm de skip ──────────────────────────────────────────

const FinalCard: FC<{ loading: boolean; onConfirm: () => void }> = ({ loading, onConfirm }) => (
  <div className="mt-12 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-8 text-center backdrop-blur-xl">
    <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70 font-rajdhani">
      Tutorial completo
    </p>
    <h2 className="mt-2 font-orbitron text-3xl text-cyan-100">Você está pronto.</h2>
    <p className="mt-4 font-rajdhani text-white/80 leading-relaxed max-w-xl mx-auto">
      Você entendeu efetividade, atributos e a importância da preparação.
      Agora é hora de entrar nas masmorras de verdade.
    </p>
    <button
      onClick={onConfirm}
      disabled={loading}
      className="mt-6 rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-6 py-3 font-orbitron text-sm uppercase tracking-widest text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-60"
    >
      {loading ? 'Salvando...' : 'Entrar na masmorra →'}
    </button>
  </div>
);

const SkipConfirm: FC<{ isVeteran: boolean; loading: boolean; onCancel: () => void; onConfirm: () => void }> = ({
  isVeteran, loading, onCancel, onConfirm,
}) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0f1d] p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80 font-rajdhani">
        Pular tutorial
      </p>
      <h3 className="mt-2 font-orbitron text-xl">
        {isVeteran ? 'Pular tutorial?' : 'Tem certeza?'}
      </h3>
      <p className="mt-3 font-rajdhani text-white/75 leading-relaxed">
        {isVeteran
          ? 'Você é veterano — faz sentido pular. Pode visitar a árvore de skills depois pra ver as mudanças.'
          : 'Você ainda não viu como funcionam efetividade e atributos. Recomendamos passar pelo tutorial. Mesmo assim quer pular?'}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} disabled={loading} className="font-rajdhani text-white/55 hover:text-white px-3 py-2">
          Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg px-5 py-2.5 border border-amber-400/50 bg-amber-500/15 text-amber-100 font-orbitron text-sm uppercase tracking-widest hover:bg-amber-500/25"
        >
          {loading ? 'Salvando...' : 'Sim, pular'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Background ──────────────────────────────────────────────────────────────

const BackgroundFx: FC = () => (
  <div
    className="absolute inset-0 opacity-70"
    style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.2), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.15), transparent 55%)',
    }}
  />
);

// ─── Picks por efetividade ───────────────────────────────────────────────────

/** Retorna um elemento que ataca FORTE no jogador (fraqueza dele). */
function pickWeakness(playerElement: ElementType): ElementType {
  for (const attacker of Object.keys(ELEMENT_EFFECTIVENESS) as ElementType[]) {
    const row = ELEMENT_EFFECTIVENESS[attacker];
    if (row[playerElement] === 2) return attacker;
  }
  // fallback: qualquer outro elemento
  return playerElement === 'fire' ? 'water' : 'fire';
}

/** Retorna um elemento que o jogador ataca FORTE. */
function pickStrength(playerElement: ElementType): ElementType {
  const row = ELEMENT_EFFECTIVENESS[playerElement];
  for (const def of Object.keys(row) as ElementType[]) {
    if (row[def] === 2) return def;
  }
  return playerElement === 'fire' ? 'grass' : 'fire';
}

export default Wave11TutorialBattleScreen;
