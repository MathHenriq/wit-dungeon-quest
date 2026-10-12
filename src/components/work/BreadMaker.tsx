// Padaria: fazer pão de verdade, em 6 passos: medir (frações no copo
// medidor), misturar (girar o dedo na tigela), sovar (arrastar para lá e para
// cá), modelar (escolher o formato), crescer e assar (tirar na hora). A nota
// junta a medida e o ponto do forno; o pão sai no formato escolhido.
// A cena e as fases da massa vêm do GPT (docs/PROMPTS-GPT.md §H); até lá,
// tigela e massa desenhadas de forma simples.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { play } from '@/game/sfx';
import type { GameProps } from './Minigames';

type Step = 'medir' | 'misturar' | 'sovar' | 'modelar' | 'crescer' | 'forno';
const STEPS: Step[] = ['medir', 'misturar', 'sovar', 'modelar', 'crescer', 'forno'];
const LABEL: Record<Step, string> = { medir: 'MEDIR', misturar: 'MISTURAR', sovar: 'SOVAR', modelar: 'MODELAR', crescer: 'CRESCER', forno: 'ASSAR' };

/** O que a receita pede (em xícaras); a ordem muda a cada fornada. */
const MEASURES: { name: string; frac: number; label: string; color: string }[][] = [
  [{ name: 'Farinha', frac: 3 / 4, label: '3/4', color: '#f4ecd8' }, { name: 'Água morna', frac: 1 / 2, label: '1/2', color: '#9ad8ff' }, { name: 'Fermento', frac: 1 / 4, label: '1/4', color: '#d8b070' }],
  [{ name: 'Farinha', frac: 1, label: '1', color: '#f4ecd8' }, { name: 'Leite', frac: 1 / 4, label: '1/4', color: '#fffaf0' }, { name: 'Água morna', frac: 3 / 4, label: '3/4', color: '#9ad8ff' }],
  [{ name: 'Farinha', frac: 1 / 2, label: '1/2', color: '#f4ecd8' }, { name: 'Água morna', frac: 1 / 4, label: '1/4', color: '#9ad8ff' }, { name: 'Fermento', frac: 1 / 4, label: '1/4', color: '#d8b070' }],
];
const SHAPES: { id: string; name: string }[] = [
  { id: 'pao-bisnaga', name: 'Bisnaga' }, { id: 'pao-redondo', name: 'Redondo' }, { id: 'pao-forma', name: 'De forma' }, { id: 'pao-tranca', name: 'Trança' },
];
const SCENE = `${import.meta.env.BASE_URL}game/cenas/padaria-cena.webp`;
/** Massa na tigela, do GPT: farinha, ovo, massa crua, bola lisa, sovando, enfarinhada. */
const MASSA = (i: number) => `${import.meta.env.BASE_URL}game/cenas/padaria-massa-${i}.png`;

function useNow(active: boolean) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const f = () => { setNow(performance.now()); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

export function BreadMaker({ perk, seed, onDone }: GameProps) {
  const recipe = MEASURES[seed % MEASURES.length];
  const [step, setStep] = useState<Step>('medir');
  const [mi, setMi] = useState(0);              // qual ingrediente está medindo
  const [fill, setFill] = useState(0);          // 0..1.1 do copo
  const [pouring, setPouring] = useState(false);
  const [errs, setErrs] = useState<number[]>([]);
  const [mix, setMix] = useState(0);            // voltas
  const [knead, setKnead] = useState(0);
  const [shape, setShape] = useState(SHAPES[0].id);
  const [ovenT0, setOvenT0] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [scene, setScene] = useState(true);
  const now = useNow(pouring || step === 'crescer' || step === 'forno');
  const last = useRef<{ a: number; x: number; dir: number } | null>(null);
  const bowl = useRef<HTMLDivElement>(null);

  // copo enchendo enquanto segura
  useEffect(() => {
    if (!pouring) return;
    const t = window.setInterval(() => setFill(f => Math.min(1.1, f + 0.012)), 16);
    return () => window.clearInterval(t);
  }, [pouring]);
  const stopPour = () => {
    if (!pouring) return;
    setPouring(false);
    const want = recipe[mi].frac, err = Math.abs(fill - want);
    setErrs(e => [...e, err]);
    setMsg(err < 0.05 ? 'Na medida certinha!' : err < 0.12 ? 'Quase na marca.' : fill > want ? 'Passou da marca...' : 'Faltou um pouco...');
    play(err < 0.05 ? 'coin' : 'drop');
    window.setTimeout(() => {
      setFill(0); setMsg(null);
      if (mi + 1 < recipe.length) setMi(mi + 1); else setStep('misturar');
    }, 700);
  };

  // misturar: giro do dedo em volta do meio da tigela
  const onMixMove = (e: React.PointerEvent) => {
    if (step !== 'misturar' || !(e.buttons & 1) || !bowl.current) return;
    const r = bowl.current.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    if (last.current) {
      let d = a - last.current.a;
      if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      const next = mix + Math.abs(d) / (2 * Math.PI);
      setMix(next);
      if (next >= 3) { play('coin'); setStep('sovar'); last.current = null; return; }
    }
    last.current = { a, x: e.clientX, dir: 0 };
  };
  // sovar: cada vez que o arrasto muda de lado conta uma sovada
  const onKneadMove = (e: React.PointerEvent) => {
    if (step !== 'sovar' || !(e.buttons & 1)) return;
    const l = last.current;
    if (l) {
      const dx = e.clientX - l.x;
      if (Math.abs(dx) > 18) {
        const dir = Math.sign(dx);
        if (l.dir && dir !== l.dir) {
          const k = knead + 1; setKnead(k); play('drop');
          if (k >= 12) { play('coin'); setStep('modelar'); last.current = null; return; }
        }
        last.current = { a: 0, x: e.clientX, dir };
      }
    } else last.current = { a: 0, x: e.clientX, dir: 0 };
  };
  const shapeChosen = (id: string) => { setShape(id); play('click'); setStep('crescer'); setOvenT0(performance.now()); };
  useEffect(() => {
    if (step === 'crescer' && now - ovenT0 > 3000) { setStep('forno'); setOvenT0(performance.now() + 500); play('flip'); }
  }, [step, now, ovenT0]);

  // forno: a agulha do ponto vai de cru a queimado
  const DUR = 4200, ovenV = step === 'forno' ? Math.max(0, (now - ovenT0) / DUR) : 0, WIN = 0.08 + perk * 0.02, TARGET = 0.62;
  const finish = (v: number) => {
    const measure = Math.max(0, 1 - (errs.reduce((a, b) => a + b, 0) / Math.max(1, errs.length)) / 0.25);
    const oven = v >= 1 ? 0 : Math.max(0, 1 - Math.abs(v - TARGET) / 0.35);
    const hit = Math.abs(v - TARGET) <= WIN;
    const score = Math.max(0, Math.min(1, measure * 0.4 + oven * 0.6 + (hit ? 0.1 : 0)));
    play(score >= 0.5 ? 'win' : 'lose');
    onDone({ score, hits: hit ? 1 : 0, item: shape });
  };
  useEffect(() => { if (step === 'forno' && ovenV >= 1) finish(1); });   // queimou

  const doughStage = step === 'medir' ? 0 : step === 'misturar' ? Math.min(2, Math.floor(mix)) + 1 : step === 'sovar' ? 3 + Math.floor(knead / 4) : 6;
  const smooth = Math.min(1, doughStage / 6), rise = step === 'crescer' ? Math.min(1, (now - ovenT0) / 3000) : step === 'forno' ? 1 : 0;
  const bake = step === 'forno' ? Math.min(1, ovenV) : 0;

  return (
    <div className="select-none">
      {/* passos */}
      <div className="flex gap-1 mb-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 text-center py-1 rounded text-[7px] ${s === step ? 'bg-[#c87a2a] text-white' : STEPS.indexOf(step) > i ? 'bg-[#e8d8b8] text-[#8a5a2a]' : 'bg-[#efe6d6] text-[#b8a890]'}`}>{LABEL[s]}</div>
        ))}
      </div>
      <div className="relative rounded-xl overflow-hidden border-4 border-[#6a3e1c] h-[300px] bg-[radial-gradient(ellipse_at_50%_30%,#f6d9a8,#b9763c)]"
        onPointerMove={step === 'misturar' ? onMixMove : step === 'sovar' ? onKneadMove : undefined}
        onPointerUp={() => { last.current = null; }}>
        {scene && <img src={SCENE} alt="" onError={() => setScene(false)} className="absolute inset-0 w-full h-full object-cover [image-rendering:pixelated]" />}
        {/* bancada (a cena do GPT já tem a dela) */}
        {!scene && <div className="absolute left-0 right-0 bottom-0 h-[38%] bg-[linear-gradient(#a8693a,#7a4422)] border-t-4 border-[#5a3018]" />}
        {/* tigela com a massa: a do GPT, ou a desenhada */}
        {step !== 'forno' && scene && (
          <div ref={bowl} className="absolute left-1/2 -translate-x-1/2 bottom-[16%] w-[190px] h-[140px] touch-none flex items-end justify-center">
            <img src={MASSA(step === 'medir' ? 0 : step === 'sovar' ? 3 + (knead % 2) : Math.min(5, doughStage))} alt="" draggable={false}
              className="w-[170px] [image-rendering:pixelated] transition-transform duration-300 origin-bottom"
              style={{ opacity: step === 'medir' && errs.length === 0 ? 0.35 : 1, transform: `scale(${1 + rise * 0.25})` }} />
          </div>
        )}
        {step !== 'forno' && !scene && (
          <div ref={bowl} className="absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[190px] h-[120px] touch-none">
            <div className="absolute inset-x-0 bottom-0 h-[70%] rounded-b-[90px] rounded-t-[20px] bg-[linear-gradient(#e8f0f4,#9ab0c0)] border-4 border-[#5a6a7a]" />
            <div className="absolute left-1/2 bottom-[30%] -translate-x-1/2 rounded-[50%] transition-all duration-300"
              style={{
                width: `${60 + smooth * 40 + rise * 40}px`, height: `${34 + smooth * 18 + rise * 26}px`,
                background: `radial-gradient(circle at 35% 30%, #fff8e8, ${smooth > 0.5 ? '#f0d8a8' : '#e8d4a8'} 60%, #c8a878)`,
                filter: smooth < 0.5 ? 'contrast(1.2)' : undefined, opacity: step === 'medir' && errs.length === 0 ? 0 : 1,
                transform: step === 'sovar' ? `translateX(-50%) scaleX(${1 + (knead % 2) * 0.12})` : 'translateX(-50%)',
              }} />
          </div>
        )}
        {/* forno */}
        {step === 'forno' && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[16%] w-[240px] h-[170px] rounded-t-[120px] bg-[linear-gradient(#b05a32,#7a3a1e)] border-4 border-[#4a2210] flex items-end justify-center pb-6">
            <div className="w-[170px] h-[90px] rounded-t-[80px] bg-[#2a120a] flex items-center justify-center" style={{ boxShadow: `inset 0 0 ${20 + bake * 30}px #ff8a20` }}>
              <div style={{ filter: `brightness(${1.25 - bake * 0.75}) saturate(${0.6 + bake})` }}><Icon id={shape} size={72} /></div>
            </div>
          </div>
        )}
        {/* copo medidor */}
        {step === 'medir' && (
          <div className="absolute right-6 bottom-[18%] w-[70px] h-[150px] rounded-b-lg border-4 border-white/90 bg-white/20 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 transition-[height] duration-75" style={{ height: `${Math.min(100, fill / 1.1 * 100)}%`, background: recipe[mi].color }} />
            {[0.25, 0.5, 0.75, 1].map(f => (
              <div key={f} className="absolute left-0 w-1/2 border-t-2 border-[#2e2a40]" style={{ bottom: `${f / 1.1 * 100}%` }}>
                <span className="absolute left-full ml-1 -top-2 text-[7px] text-[#2e2a40]">{f === 1 ? '1' : f === 0.75 ? '3/4' : f === 0.5 ? '1/2' : '1/4'}</span>
              </div>
            ))}
          </div>
        )}
        {/* fala do passo */}
        <div className="absolute top-2 left-2 right-2 rounded-lg bg-white/90 px-3 py-2 text-[9px] leading-5 text-[#2e2a40]">
          {step === 'medir' && <>Receita: <b>{recipe[mi].label} xícara de {recipe[mi].name}</b>. Segure ENCHER e solte na marca.</>}
          {step === 'misturar' && <>Gire o dedo (ou o mouse) dentro da tigela para misturar. Voltas: {Math.min(3, Math.floor(mix))}/3</>}
          {step === 'sovar' && <>Sove! Arraste para um lado e para o outro em cima da massa. {knead}/12</>}
          {step === 'modelar' && <>Que pão vai ser? Escolha o formato.</>}
          {step === 'crescer' && <>O fermento está trabalhando: a massa cresce porque ele solta gás. Espere...</>}
          {step === 'forno' && <>Tire do forno quando a agulha estiver no dourado!</>}
          {msg && <span className="ml-2 text-[#3a9a5a]">{msg}</span>}
        </div>
      </div>
      {/* controles */}
      <div className="mt-2 min-h-[48px] flex items-center justify-center gap-2">
        {step === 'medir' && (
          <button onPointerDown={() => setPouring(true)} onPointerUp={stopPour} onPointerLeave={stopPour}
            className="px-6 py-3 rounded-lg bg-[#3a9ae8] border-b-4 border-[#1e5a9a] text-white text-[11px] touch-none">ENCHER</button>
        )}
        {step === 'modelar' && SHAPES.map(s => (
          <button key={s.id} onClick={() => shapeChosen(s.id)} className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-white border-2 border-[#c8a878] text-[8px] text-[#2e2a40]">
            <Icon id={s.id} size={32} />{s.name}
          </button>
        ))}
        {step === 'forno' && (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="relative w-[min(80vw,340px)] h-4 rounded border-2 border-[#4a2210] overflow-hidden bg-[linear-gradient(90deg,#f4ecd8,#e8c888_40%,#d89a48_60%,#8a4a1a_85%,#2a120a)]">
              <div className="absolute inset-y-0 border-x-2 border-[#3ac46a] bg-[#3ac46a]/30" style={{ left: `${(TARGET - WIN) * 100}%`, width: `${WIN * 200}%` }} />
              <div className="absolute inset-y-[-2px] w-1.5 bg-[#2e2a40]" style={{ left: `calc(${Math.min(100, ovenV * 100)}% - 3px)` }} />
            </div>
            <button onPointerDown={() => now >= ovenT0 && finish(ovenV)} className="px-6 py-3 rounded-lg bg-[#e8a020] border-b-4 border-[#a86a10] text-white text-[11px]">TIRAR DO FORNO</button>
          </div>
        )}
      </div>
    </div>
  );
}
