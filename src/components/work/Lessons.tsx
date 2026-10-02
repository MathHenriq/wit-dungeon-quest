// As tarefas que ensinam (regras em game/lessons.ts): afinar (Músico),
// misturar cores (Artista), regra SE/ENTÃO (IoT), melhor rota (Entregador),
// coordenadas X Y Z (Metaverso) e teste do modelo (IA). Visual de interface:
// gráficos, cores e blocos em código; nada de emoji.
import { useMemo, useState, type ReactNode } from 'react';
import {
  accuracy, ACTIONS, bestRoute, colorMatches, colorRounds, coordRounds, GRID3, mixDrops, modelTest, pitchRounds, routeLength, routeRounds, routeScore,
  ruleOk, ruleTasks, runRule, SENSORS, toCss, truth, tuneScore, ZMAX, type Drops, type Label, type P3, type Rule,
} from '@/game/lessons';
import { audio, play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { playNote } from './synth';
import type { GameProps } from './Minigames';

const INK = '#2e2a40';
const Head = ({ step, total, children }: { step: number; total: number; children: ReactNode }) => (
  <div className="flex justify-between items-start gap-2 text-[8px] mb-2"><span className="shrink-0">{step}/{total}</span><span className="text-[#5a5470] text-right leading-4">{children}</span></div>
);
const Big = ({ onClick, children, color = '#3a78c8', disabled }: { onClick: () => void; children: ReactNode; color?: string; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="w-full mt-2 py-2.5 rounded-lg text-white text-[10px] border-b-4 border-black/25 disabled:opacity-40" style={{ background: color }}>{children}</button>
);
const Feedback = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <div className="mt-2 rounded-lg p-2 text-[8px] leading-4" style={{ background: ok ? '#e8f8ec' : '#fdecef' }}><b style={{ color: ok ? '#3a9a5a' : '#c84a6a' }}>{ok ? 'CERTO! ' : 'QUASE. '}</b>{children}</div>
);

// ─── Músico: afinar ─────────────────────────────────────────────────────────

export function Afinar({ seed, onDone }: GameProps) {
  const R = useMemo(() => pitchRounds(seed), [seed]);
  const total = R.compare.length + R.tune.length;
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [knob, setKnob] = useState<number | null>(null);
  const [cents, setCents] = useState<number | null>(null);
  const tone = (m: number, at = 0) => { const a = audio(); if (a) playNote('teclado', m, a.currentTime + 0.02 + at, 0.55); };
  const isCompare = i < R.compare.length;
  const c = R.compare[i], t = R.tune[i - R.compare.length];
  const cur = knob ?? t?.start ?? 60;
  const next = (gain: number) => {
    const s = score + gain;
    if (i + 1 >= total) { onDone({ score: s / total, hits: Math.round(s) }); return; }
    setScore(s); setI(i + 1); setPicked(null); setKnob(null); setCents(null);
  };
  if (isCompare) {
    const higher = c.a > c.b ? 0 : 1;
    return (
      <div className="text-[#2e2a40]">
        <Head step={i + 1} total={total}>Som AGUDO é fino (passarinho); som GRAVE é grosso (trovão). A diferença fica menor a cada rodada.</Head>
        <div className="text-[10px] mb-3">Qual das duas notas é MAIS AGUDA?</div>
        <button onClick={() => { tone(c.a); tone(c.b, 0.7); }} className="w-full py-3 rounded-lg bg-[#3a78c8] text-white text-[10px] border-b-4 border-[#1e4a8a]">OUVIR AS DUAS (1 e depois 2)</button>
        <div className="flex gap-2 mt-3">
          {[0, 1].map(k => (
            <button key={k} disabled={picked !== null} onClick={() => { setPicked(k); play(k === higher ? 'coin' : 'lose'); tone(k ? c.b : c.a); }}
              className={`flex-1 py-4 rounded-lg border-2 text-[12px] ${picked === null ? 'bg-white border-[#d8d0c0]' : k === higher ? 'bg-[#c8f0d0] border-[#3a9a5a]' : k === picked ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white opacity-50'}`}>
              NOTA {k + 1}
              <div onClick={e => { e.stopPropagation(); tone(k ? c.b : c.a); }} className="text-[7px] mt-1 underline text-[#3a78c8]">ouvir só esta</div>
            </button>
          ))}
        </div>
        {picked !== null && <Feedback ok={picked === higher}>A nota {higher + 1} é mais aguda: {Math.abs(c.a - c.b)} {Math.abs(c.a - c.b) === 1 ? 'semitom' : 'semitons'} acima.</Feedback>}
        {picked !== null && <Big onClick={() => next(picked === higher ? 1 : 0)}>PRÓXIMA</Big>}
      </div>
    );
  }
  const diff = Math.round((cur - t.target) * 100);
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={total}>Afinar é deixar duas notas iguais. Ouça a nota certa e gire a tarraxa até a sua soar igual.</Head>
      <div className="flex gap-2">
        <button onClick={() => tone(t.target)} className="flex-1 py-3 rounded-lg bg-[#3a9a5a] text-white text-[9px] border-b-4 border-[#1e6a3a]">NOTA CERTA</button>
        <button onClick={() => tone(cur)} className="flex-1 py-3 rounded-lg bg-[#3a78c8] text-white text-[9px] border-b-4 border-[#1e4a8a]">MINHA NOTA</button>
        <button onClick={() => { tone(t.target); tone(cur, 0.65); }} className="flex-1 py-3 rounded-lg bg-[#8a5ae8] text-white text-[9px] border-b-4 border-[#5a34a8]">AS DUAS</button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[8px]">GRAVE</span>
        <input type="range" min={t.target - 6} max={t.target + 6} step={0.05} value={cur} disabled={cents !== null}
          onChange={e => setKnob(Number(e.target.value))} onPointerUp={() => tone(cur)} className="flex-1 accent-[#3a78c8]" aria-label="tarraxa" />
        <span className="text-[8px]">AGUDO</span>
      </div>
      {/* a tarraxa girando (desenho de interface) */}
      <div className="flex justify-center mt-2">
        <svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="#e8e0d0" stroke={INK} strokeWidth="2" />
          <line x1="30" y1="30" x2={30 + 20 * Math.sin(((cur - t.target) / 6) * Math.PI)} y2={30 - 20 * Math.cos(((cur - t.target) / 6) * Math.PI)} stroke="#c84a6a" strokeWidth="4" strokeLinecap="round" /></svg>
      </div>
      {cents === null
        ? <Big onClick={() => { setCents(diff); play(tuneScore(diff) >= 0.7 ? 'win' : 'lose'); }} color="#3a78c8">ESTÁ AFINADO!</Big>
        : <>
          <Feedback ok={tuneScore(cents) >= 0.7}>Ficou {Math.abs(cents)} cents {cents > 0 ? 'mais agudo' : cents < 0 ? 'mais grave' : ''} (100 cents = 1 semitom). {tuneScore(cents) >= 1 ? 'Ouvido de músico!' : 'Use AS DUAS: quando estão diferentes, o som "treme".'}</Feedback>
          <Big onClick={() => next(tuneScore(cents))}>{i + 1 >= total ? 'TERMINAR' : 'PRÓXIMA'}</Big>
        </>}
    </div>
  );
}

// ─── Artista: misturar cores ────────────────────────────────────────────────

const PAINTS: { k: keyof Drops; name: string; css: string }[] = [
  { k: 'r', name: 'VERMELHO', css: '#e3262b' }, { k: 'y', name: 'AMARELO', css: '#ffd51a' }, { k: 'b', name: 'AZUL', css: '#2662c0' }, { k: 'w', name: 'BRANCO', css: '#ffffff' },
];
const EMPTY: Drops = { r: 0, y: 0, b: 0, w: 0 };

export function Cores({ seed, onDone }: GameProps) {
  const goals = useMemo(() => colorRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [d, setD] = useState<Drops>(EMPTY);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [res, setRes] = useState<boolean | null>(null);
  const g = goals[i];
  const total = Object.values(d).reduce((a, b) => a + b, 0);
  const check = () => {
    const ok = colorMatches(d, g);
    setRes(ok); setTries(n => n + 1); play(ok ? 'win' : 'lose');
  };
  const next = () => {
    const gain = res ? Math.max(0.5, 1 - (tries - 1) * 0.25) : 0;
    if (i + 1 >= goals.length) { onDone({ score: (score + gain) / goals.length, hits: Math.round(score + gain) }); return; }
    setScore(s => s + gain); setI(i + 1); setD(EMPTY); setTries(0); setRes(null);
  };
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={goals.length}>Primárias: VERMELHO, AMARELO e AZUL. Misturando duas, saem as secundárias. Branco clareia.</Head>
      <div className="flex gap-3 items-center">
        <div className="text-center"><div className="w-24 h-24 rounded-full border-4 border-[#2e2a40] shadow-inner" style={{ background: toCss(mixDrops(g.recipe)) }} /><div className="text-[8px] mt-1">FAÇA: {g.name}</div></div>
        <div className="text-[16px] text-[#8a8498]">=</div>
        <div className="text-center"><div className="w-24 h-24 rounded-full border-4 border-[#8a6a4a] transition-colors duration-300" style={{ background: toCss(mixDrops(d)), boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.12)' }} /><div className="text-[8px] mt-1">SUA TIGELA ({total} gotas)</div></div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {PAINTS.map(p => (
          <button key={p.k} disabled={res === true || d[p.k] >= 6} onClick={() => { setD(x => ({ ...x, [p.k]: x[p.k] + 1 })); setRes(null); play('click'); }}
            className="rounded-lg border-2 border-[#2e2a40] py-2 text-[7px] disabled:opacity-40" style={{ background: p.css, color: p.k === 'b' || p.k === 'r' ? '#fff' : INK }}>
            + {p.name}<div className="text-[9px] mt-0.5">{d[p.k]}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={() => { setD(EMPTY); setRes(null); }} disabled={res === true} className="px-3 py-2 rounded-lg bg-[#4a4660] text-white text-[9px]">LAVAR A TIGELA</button>
        {res !== true && <button onClick={check} disabled={!total} className="flex-1 py-2 rounded-lg bg-[#b0487a] text-white text-[10px] border-b-4 border-[#7a2a50] disabled:opacity-40">PRONTO</button>}
      </div>
      {res !== null && <Feedback ok={res}>{res ? g.tip : `Ainda não. Dica: ${g.tip}`}</Feedback>}
      {res === true && <Big onClick={next} color="#b0487a">{i + 1 >= goals.length ? 'TERMINAR' : 'PRÓXIMA COR'}</Big>}
      {res === false && tries >= 3 && <button onClick={next} className="w-full mt-2 py-2 rounded-lg bg-white border-2 border-[#d8d0c0] text-[8px]">PULAR ESTA COR</button>}
    </div>
  );
}

// ─── Técnico de IoT: regra SE/ENTÃO ─────────────────────────────────────────

function Pick<T extends string>({ value, options, onChange, color, placeholder }: { value?: T; options: [T, string][]; onChange: (v: T) => void; color: string; placeholder: string }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value as T)} className="px-2 py-1.5 rounded-md text-white text-[8px] border-b-[3px] border-black/25 max-w-full" style={{ background: color }}>
      <option value="" disabled>{placeholder}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Regras({ seed, onDone }: GameProps) {
  const tasks = useMemo(() => ruleTasks(seed), [seed]);
  const [i, setI] = useState(0);
  const [rule, setRule] = useState<Rule>({});
  const [tested, setTested] = useState(false);
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const t = tasks[i];
  const sensor = SENSORS.find(s => s.id === rule.sensor);
  const ok = tested && ruleOk(t, rule);
  const run = tested ? runRule(t, rule) : [];
  const tSensor = SENSORS.find(s => s.id === t.sensor)!;
  const next = () => {
    const gain = ok ? Math.max(0.4, 1 - (tries - 1) * 0.3) : 0;
    if (i + 1 >= tasks.length) { onDone({ score: (score + gain) / tasks.length, hits: Math.round(score + gain) }); return; }
    setScore(s => s + gain); setI(i + 1); setRule({}); setTested(false); setTries(0);
  };
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={tasks.length}>Uma coisa inteligente segue regras: SE (o sensor mede algo) ENTÃO (faz uma ação).</Head>
      <div className="rounded-lg bg-white border-2 border-[#2a9a5a] p-2 text-[9px] leading-4 mb-2"><b>{t.place}:</b> {t.ask}</div>
      <div className="rounded-lg bg-[#1e2a24] p-3 flex flex-wrap items-center gap-1.5 text-[9px] text-white">
        <span className="px-2 py-1.5 rounded bg-[#e8902a]">SE</span>
        <Pick value={rule.sensor} placeholder="sensor..." color="#2a9ac8" options={SENSORS.map(s => [s.id, s.name])} onChange={v => { setRule(r => ({ ...r, sensor: v, cond: undefined })); setTested(false); }} />
        {sensor && <Pick value={rule.cond} placeholder="for..." color="#2a9ac8" options={sensor.conds.map(c => [c.id, c.label])} onChange={v => { setRule(r => ({ ...r, cond: v })); setTested(false); }} />}
        <span className="px-2 py-1.5 rounded bg-[#e8902a]">ENTÃO</span>
        <Pick value={rule.action} placeholder="ação..." color="#3aa85a" options={ACTIONS.map(a => [a, a])} onChange={v => { setRule(r => ({ ...r, action: v })); setTested(false); }} />
      </div>
      {!tested
        ? <Big disabled={!rule.sensor || !rule.cond || !rule.action} onClick={() => { setTested(true); setTries(n => n + 1); play(ruleOk(t, rule) ? 'win' : 'lose'); }} color="#2a9a5a">TESTAR A REGRA</Big>
        : <>
          {/* o teste: as leituras ao longo do dia, o que a regra fez e o que devia fazer */}
          <div className="mt-2 rounded-lg bg-white border-2 border-[#e0d8c4] overflow-hidden text-[8px]">
            <div className="grid grid-cols-[1fr_1fr_1fr] px-2 py-1 bg-[#2a9a5a] text-white"><span>{tSensor.name.toUpperCase()}</span><span>SUA REGRA</span><span>DEVIA</span></div>
            {t.readings.map((v, k) => (
              <div key={k} className={`grid grid-cols-[1fr_1fr_1fr] px-2 py-1 ${run[k].fired !== run[k].should ? 'bg-[#fdecef]' : k % 2 ? 'bg-[#f6f2e8]' : ''}`}>
                <span>{t.sensor === 'presenca' ? (v ? 'alguém' : 'ninguém') : `${v}${tSensor.unit}`}</span>
                <span style={{ color: run[k].fired ? '#3a9a5a' : '#a8a4b4' }}>{run[k].fired ? t.action : 'nada'}</span>
                <span style={{ color: run[k].should ? '#3a9a5a' : '#a8a4b4' }}>{run[k].should ? t.action : 'nada'}</span>
              </div>
            ))}
          </div>
          <Feedback ok={ok}>{ok ? 'A regra liga só quando precisa. É assim que a casa inteligente funciona!' : 'As linhas vermelhas mostram onde a regra errou. Troque o sensor, a condição ou a ação.'}</Feedback>
          {ok ? <Big onClick={next} color="#2a9a5a">{i + 1 >= tasks.length ? 'TERMINAR' : 'PRÓXIMA'}</Big>
            : <button onClick={() => setTested(false)} className="w-full mt-2 py-2 rounded-lg bg-[#4a4660] text-white text-[9px]">AJUSTAR</button>}
        </>}
    </div>
  );
}

// ─── Entregador: melhor rota ────────────────────────────────────────────────

const CELLW = 30;
export function Rota({ seed, onDone }: GameProps) {
  const maps = useMemo(() => routeRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const m = maps[i];
  const best = useMemo(() => bestRoute(m.depot, m.stops), [m]);
  const done = order.length === m.stops.length;
  const len = done ? routeLength(m.depot, m.stops, order) : null;
  const pts = [m.depot, ...order.map(k => m.stops[k]), ...(done ? [m.depot] : [])];
  const cx = (x: number) => x * CELLW + CELLW / 2, cy = (y: number) => y * CELLW + CELLW / 2;
  // caminho em "L" (as ruas são em grade: anda na horizontal e depois na vertical)
  const path = pts.map((p, k) => (k ? `L${cx(p.x)},${cy(pts[k - 1].y)} L${cx(p.x)},${cy(p.y)}` : `M${cx(p.x)},${cy(p.y)}`)).join(' ');
  const next = () => {
    const gain = routeScore(len!, best.len);
    if (i + 1 >= maps.length) { onDone({ score: (score + gain) / maps.length, hits: Math.round(score + gain) }); return; }
    setScore(s => s + gain); setI(i + 1); setOrder([]);
  };
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={maps.length}>Saia da CENTRAL, passe em todas as casas e volte. Toque nas casas na ordem. Cada quadradinho = 1 quarteirão.</Head>
      <div className="flex justify-center">
        <svg width={10 * CELLW} height={7 * CELLW} viewBox={`0 0 ${10 * CELLW} ${7 * CELLW}`} className="max-w-full h-auto rounded-lg bg-[#cfe8c0] border-2 border-[#6a8a5a]">
          {Array.from({ length: 11 }, (_, k) => <line key={`v${k}`} x1={k * CELLW} x2={k * CELLW} y1={0} y2={7 * CELLW} stroke="#a8c898" />)}
          {Array.from({ length: 8 }, (_, k) => <line key={`h${k}`} y1={k * CELLW} y2={k * CELLW} x1={0} x2={10 * CELLW} stroke="#a8c898" />)}
          <path d={path} fill="none" stroke="#e8762a" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
          <rect x={cx(m.depot.x) - 12} y={cy(m.depot.y) - 12} width={24} height={24} rx={4} fill="#2a5aa8" stroke={INK} strokeWidth={2} />
          <text x={cx(m.depot.x)} y={cy(m.depot.y) + 3} fontSize={8} textAnchor="middle" fill="#fff" fontWeight={700}>C</text>
          {m.stops.map((s, k) => {
            const n = order.indexOf(k);
            return (
              <g key={k} onClick={() => { if (n < 0 && !done) { setOrder(o => [...o, k]); play('click'); } }} style={{ cursor: n < 0 ? 'pointer' : undefined }}>
                <path d={`M${cx(s.x) - 11},${cy(s.y) - 1} L${cx(s.x)},${cy(s.y) - 12} L${cx(s.x) + 11},${cy(s.y) - 1} L${cx(s.x) + 9},${cy(s.y) - 1} L${cx(s.x) + 9},${cy(s.y) + 11} L${cx(s.x) - 9},${cy(s.y) + 11} L${cx(s.x) - 9},${cy(s.y) - 1} Z`}
                  fill={n >= 0 ? '#ffd84a' : '#fff'} stroke={INK} strokeWidth={2} />
                <text x={cx(s.x)} y={cy(s.y) + 8} fontSize={9} textAnchor="middle" fill={INK} fontWeight={700}>{n >= 0 ? n + 1 : ''}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[8px] mt-1"><span>Casas: {order.length}/{m.stops.length}</span><span>{len !== null ? `Sua rota: ${len} quarteirões` : ''}</span></div>
      {!done && order.length > 0 && <button onClick={() => setOrder([])} className="w-full mt-2 py-2 rounded-lg bg-[#4a4660] text-white text-[9px]">RECOMEÇAR</button>}
      {done && <>
        <Feedback ok={len === best.len}>{len === best.len ? `A menor rota possível: ${best.len} quarteirões.` : `Dava para fazer com ${best.len} quarteirões (você fez ${len}). Dica: não fique indo e voltando; passe pelas casas que estão no caminho.`}</Feedback>
        <div className="flex gap-2">
          {len !== best.len && <button onClick={() => setOrder([])} className="flex-1 mt-2 py-2 rounded-lg bg-white border-2 border-[#d8d0c0] text-[9px]">TENTAR DE NOVO</button>}
          <div className="flex-1"><Big onClick={next} color="#e8762a">{i + 1 >= maps.length ? 'TERMINAR' : 'PRÓXIMO MAPA'}</Big></div>
        </div>
      </>}
    </div>
  );
}

// ─── Arquiteto do Metaverso: coordenadas X Y Z ──────────────────────────────

const TW = 40, TH = 20, TZ = 22;
/** Tela isométrica: x vai para a direita-baixo, y para a esquerda-baixo, z para cima. */
const iso = (x: number, y: number, z: number) => ({ sx: 130 + (x - y) * (TW / 2), sy: 60 + (x + y) * (TH / 2) - z * TZ });
function Cube({ p, color, ghost }: { p: P3; color: string; ghost?: boolean }) {
  const a = iso(p.x, p.y, p.z + 1), b = iso(p.x + 1, p.y, p.z + 1), c = iso(p.x + 1, p.y + 1, p.z + 1), d = iso(p.x, p.y + 1, p.z + 1);
  const c0 = iso(p.x + 1, p.y + 1, p.z), b0 = iso(p.x + 1, p.y, p.z), d0 = iso(p.x, p.y + 1, p.z);
  return (
    <g opacity={ghost ? 0.45 : 1}>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`} fill={color} stroke={INK} strokeWidth={1.2} />
      <polygon points={`${d.sx},${d.sy} ${c.sx},${c.sy} ${c0.sx},${c0.sy} ${d0.sx},${d0.sy}`} fill={color} stroke={INK} strokeWidth={1.2} style={{ filter: 'brightness(0.8)' }} />
      <polygon points={`${c.sx},${c.sy} ${b.sx},${b.sy} ${b0.sx},${b0.sy} ${c0.sx},${c0.sy}`} fill={color} stroke={INK} strokeWidth={1.2} style={{ filter: 'brightness(0.62)' }} />
    </g>
  );
}

export function Coordenadas({ seed, onDone }: GameProps) {
  const rounds = useMemo(() => coordRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [cell, setCell] = useState<{ x: number; y: number } | null>(null);
  const [z, setZ] = useState(0);
  const [res, setRes] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = rounds[i];
  const placed: P3 | null = cell ? { ...cell, z } : null;
  const fmt = (p: P3) => `(x=${p.x}, y=${p.y}, z=${p.z})`;
  const next = (gain: number) => {
    if (i + 1 >= rounds.length) { onDone({ score: (score + gain) / rounds.length, hits: Math.round(score + gain) }); return; }
    setScore(s => s + gain); setI(i + 1); setCell(null); setZ(0); setRes(null); setPicked(null);
  };
  const tiles = [];
  for (let y = 0; y < GRID3; y++) for (let x = 0; x < GRID3; x++) {
    const a = iso(x, y, 0), b = iso(x + 1, y, 0), c = iso(x + 1, y + 1, 0), d = iso(x, y + 1, 0);
    const on = cell && cell.x === x && cell.y === y;
    tiles.push(<polygon key={`${x},${y}`} points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
      fill={on ? '#c8b0ff' : (x + y) % 2 ? '#e8e0ff' : '#dcd2fa'} stroke="#9a8ac8" strokeWidth={1}
      onClick={q.kind === 'por' && res === null ? () => { setCell({ x, y }); play('click'); } : undefined} style={{ cursor: q.kind === 'por' ? 'pointer' : undefined }} />);
  }
  const ax = iso(GRID3, 0, 0), ay = iso(0, GRID3, 0), o = iso(0, 0, 0), oz = iso(0, 0, ZMAX + 1);
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={rounds.length}>No 3D, cada ponto tem 3 números: X (para um lado), Y (para o outro) e Z (a altura).</Head>
      <div className="text-[10px] mb-1">{q.kind === 'por' ? <>Coloque o bloco em <b className="text-[#7a4ac8]">{fmt(q.p)}</b></> : 'Qual é a coordenada do bloco roxo?'}</div>
      <div className="flex justify-center">
        <svg viewBox="0 0 260 190" className="w-full h-auto" style={{ maxWidth: 440 }}>
          {tiles}
          {/* eixos com os números */}
          <line x1={o.sx} y1={o.sy} x2={ax.sx + 8} y2={ax.sy + 4} stroke="#e8485a" strokeWidth={2} /><text x={ax.sx + 12} y={ax.sy + 10} fontSize={11} fill="#e8485a" fontWeight={700}>X</text>
          <line x1={o.sx} y1={o.sy} x2={ay.sx - 8} y2={ay.sy + 4} stroke="#3a9a5a" strokeWidth={2} /><text x={ay.sx - 20} y={ay.sy + 10} fontSize={11} fill="#3a9a5a" fontWeight={700}>Y</text>
          <line x1={o.sx} y1={o.sy} x2={oz.sx} y2={oz.sy} stroke="#3a78c8" strokeWidth={2} /><text x={oz.sx - 4} y={oz.sy - 4} fontSize={11} fill="#3a78c8" fontWeight={700}>Z</text>
          {Array.from({ length: GRID3 }, (_, k) => { const p = iso(k + 0.5, 0, 0); return <text key={`x${k}`} x={p.sx + 6} y={p.sy - 3} fontSize={8} fill="#e8485a">{k}</text>; })}
          {Array.from({ length: GRID3 }, (_, k) => { const p = iso(0, k + 0.5, 0); return <text key={`y${k}`} x={p.sx - 12} y={p.sy - 3} fontSize={8} fill="#3a9a5a">{k}</text>; })}
          {Array.from({ length: ZMAX + 1 }, (_, k) => { const p = iso(0, 0, k + 0.5); return <text key={`z${k}`} x={p.sx - 10} y={p.sy + 3} fontSize={8} fill="#3a78c8">{k}</text>; })}
          {q.kind === 'ler' && <Cube p={q.p} color="#9a6aff" />}
          {q.kind === 'por' && placed && Array.from({ length: z }, (_, k) => <Cube key={k} p={{ ...placed, z: k }} color="#c8c0d8" ghost />)}
          {q.kind === 'por' && placed && <Cube p={placed} color={res === false ? '#e8485a' : '#9a6aff'} />}
          {q.kind === 'por' && res === false && <Cube p={q.p} color="#3a9a5a" ghost />}
        </svg>
      </div>
      {q.kind === 'por' && <>
        <div className="flex items-center justify-center gap-2 text-[9px]">
          <span>Altura Z:</span>
          <button disabled={res !== null} onClick={() => setZ(v => Math.max(0, v - 1))} className="w-7 h-7 rounded bg-[#3a78c8] text-white">-</button>
          <span className="w-5 text-center">{z}</span>
          <button disabled={res !== null} onClick={() => setZ(v => Math.min(ZMAX, v + 1))} className="w-7 h-7 rounded bg-[#3a78c8] text-white">+</button>
          <span className="text-[8px] text-[#5a5470] ml-2">{placed ? `seu bloco: ${fmt(placed)}` : 'toque num quadrado do chão'}</span>
        </div>
        {res === null ? <Big disabled={!placed} onClick={() => { const ok = !!placed && placed.x === q.p.x && placed.y === q.p.y && placed.z === q.p.z; setRes(ok); play(ok ? 'win' : 'lose'); }} color="#7a4ac8">COLOCAR</Big>
          : <><Feedback ok={res}>{res ? 'No lugar certo!' : `O certo era ${fmt(q.p)} (o verde-claro). Conte X pela linha vermelha, Y pela verde e Z para cima.`}</Feedback><Big onClick={() => next(res ? 1 : 0)} color="#7a4ac8">{i + 1 >= rounds.length ? 'TERMINAR' : 'PRÓXIMA'}</Big></>}
      </>}
      {q.kind === 'ler' && <>
        <div className="flex gap-1.5">
          {q.options!.map((p, k) => (
            <button key={k} disabled={picked !== null} onClick={() => { setPicked(k); play(k === q.answer ? 'win' : 'lose'); }}
              className={`flex-1 py-2.5 rounded-lg border-2 text-[8px] ${picked === null ? 'bg-white border-[#d8d0c0]' : k === q.answer ? 'bg-[#c8f0d0] border-[#3a9a5a]' : k === picked ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white opacity-50'}`}>{fmt(p)}</button>
          ))}
        </div>
        {picked !== null && <><Feedback ok={picked === q.answer}>O bloco está em {fmt(q.p)}. Cuidado para não trocar o X com o Y!</Feedback><Big onClick={() => next(picked === q.answer ? 1 : 0)} color="#7a4ac8">{i + 1 >= rounds.length ? 'TERMINAR' : 'PRÓXIMA'}</Big></>}
      </>}
    </div>
  );
}

// ─── Treinador de IA: teste do modelo (acurácia) ────────────────────────────

export function Acuracia({ seed, onDone }: GameProps) {
  const m = useMemo(() => modelTest(seed), [seed]);
  const [step, setStep] = useState<'marcar' | 'conta' | 'treino' | 'conta2'>('marcar');
  const [marks, setMarks] = useState<(boolean | null)[]>(() => m.test.map(() => null));
  const [fixed, setFixed] = useState<number[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [pts, setPts] = useState(0);
  const pred = step === 'conta2' ? m.after : m.before;
  const acc = accuracy(m.test, pred);
  const markOk = marks.every((v, k) => v === (m.before[k] === truth(m.test[k])));
  const opts = step === 'conta' ? [50, 70, 90] : [70, 80, 90];
  const lbl = (l: Label) => <span className={`px-1.5 py-0.5 rounded text-[7px] text-white ${l === 'FRUTA' ? 'bg-[#e8762a]' : 'bg-[#3a9a5a]'}`}>{l}</span>;

  return (
    <div className="text-[#2e2a40]">
      {step === 'marcar' && <>
        <Head step={1} total={3}>O modelo de IA olhou 10 imagens e disse se é FRUTA ou LEGUME. Confira cada resposta: toque para marcar CERTO ou ERRADO.</Head>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {m.test.map((ic, k) => (
            <button key={ic} onClick={() => setMarks(x => x.map((v, j) => (j === k ? (v === null ? true : v ? false : null) : v)))}
              className={`rounded-lg border-2 p-1.5 flex flex-col items-center gap-1 ${marks[k] === null ? 'bg-white border-[#d8d0c0]' : marks[k] ? 'bg-[#e8f8ec] border-[#3a9a5a]' : 'bg-[#fdecef] border-[#e8485a]'}`}>
              <Icon id={ic} size={30} />
              <span className="text-[6px]">o modelo disse</span>{lbl(m.before[k])}
              <span className="text-[7px]" style={{ color: marks[k] === null ? '#a8a4b4' : marks[k] ? '#3a9a5a' : '#e8485a' }}>{marks[k] === null ? 'tocar' : marks[k] ? 'CERTO' : 'ERRADO'}</span>
            </button>
          ))}
        </div>
        {marks.every(v => v !== null) && !markOk && <div className="mt-2 text-[8px] text-[#e8485a]">Tem marcação trocada. Confira de novo: cenoura, rabanete e pimentão são legumes; maçã, uva e banana são frutas.</div>}
        <Big disabled={!markOk} onClick={() => { setStep('conta'); setPts(p => p + 1); play('coin'); }} color="#2a9ac8">PRÓXIMO: CALCULAR</Big>
      </>}
      {(step === 'conta' || step === 'conta2') && <>
        <Head step={step === 'conta' ? 2 : 3} total={3}>Acurácia = acertos ÷ total. Se acertou 7 de 10, a acurácia é 7 ÷ 10 = 70%.</Head>
        <div className="text-[10px] mb-2">{step === 'conta' ? 'O modelo acertou quantos por cento?' : 'Depois de consertar o treino, a acurácia ficou...'}</div>
        <div className="flex flex-wrap gap-1 mb-2">{m.test.map((ic, k) => <span key={ic} className={`p-1 rounded border-2 ${pred[k] === truth(ic) ? 'border-[#3a9a5a] bg-[#e8f8ec]' : 'border-[#e8485a] bg-[#fdecef]'}`}><Icon id={ic} size={22} /></span>)}</div>
        <div className="flex gap-2">
          {opts.map(o => (
            <button key={o} disabled={answer !== null} onClick={() => { setAnswer(o); if (o === acc) setPts(p => p + 1); play(o === acc ? 'win' : 'lose'); }}
              className={`flex-1 py-3 rounded-lg border-2 text-[11px] ${answer === null ? 'bg-white border-[#d8d0c0]' : o === acc ? 'bg-[#c8f0d0] border-[#3a9a5a]' : o === answer ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white opacity-50'}`}>{o}%</button>
          ))}
        </div>
        {answer !== null && <Feedback ok={answer === acc}>{pred.filter((p, k) => p === truth(m.test[k])).length} certos de 10 = {acc}%.{step === 'conta2' ? ' Exemplos bons no treino deixam a IA melhor!' : ''}</Feedback>}
        {answer !== null && (step === 'conta'
          ? <Big onClick={() => { setStep('treino'); setAnswer(null); }} color="#2a9ac8">POR QUE ERROU? VER O TREINO</Big>
          : <Big onClick={() => onDone({ score: pts / 4, hits: pts })} color="#2a9ac8">TERMINAR</Big>)}
      </>}
      {step === 'treino' && <>
        <Head step={3} total={3}>A IA aprende com os exemplos do treino. Dois deles estão com a ETIQUETA ERRADA: ache e toque para consertar.</Head>
        <div className="grid grid-cols-4 gap-1.5">
          {m.train.map((t, k) => {
            const fx = fixed.includes(k), shown: Label = fx ? truth(t.icon) : t.label;
            return (
              <button key={t.icon} onClick={() => {
                if (fx) return;
                if (m.bad.includes(k)) { setFixed(f => [...f, k]); play('coin'); } else play('lose');
              }} className={`rounded-lg border-2 p-1.5 flex flex-col items-center gap-1 ${fx ? 'bg-[#e8f8ec] border-[#3a9a5a]' : 'bg-white border-[#d8d0c0]'}`}>
                <Icon id={t.icon} size={30} />{lbl(shown)}
              </button>
            );
          })}
        </div>
        <Big disabled={fixed.length < 2} onClick={() => { setStep('conta2'); setPts(p => p + 1); play('win'); }} color="#2a9ac8">TREINAR DE NOVO ({fixed.length}/2 consertados)</Big>
      </>}
    </div>
  );
}
