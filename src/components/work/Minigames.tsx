// Os minijogos das profissões (padeiro, músico, artista, IA, IoT, metaverso,
// repórter, games). Cada um recebe o bônus do cargo (`perk`) e uma semente, e
// devolve a nota (0–1), os acertos e (repórter) a manchete. As regras do que
// cada nota rende ficam em src/game/minigames.ts.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { labelSet, litTiles, connected, makeCircuit, paintPattern, PAINT_COLORS, reporterQuiz, rng, shown, type Circuit } from '@/game/minigames';
import type { MinigameId } from '@/game/professions';
import { play } from '@/game/sfx';
import { Composer } from './Composer';
import { Materia } from './Materia';
import { RobotCode } from './RobotCode';
import { Grafico } from './Grafico';
import { Acuracia, Afinar, Coordenadas, Cores, Regras, Rota } from './Lessons';
import { Barraca, Boato, Calendario, Fermento, Logica, PixelArt } from './Lessons2';
import { BreadMaker } from './BreadMaker';
import { Icon, Symbol } from '@/components/Icon';

export interface GameResult { score: number; hits: number; headline?: string; /** item que sai (o formato do pão) */ item?: string }
export interface GameProps { perk: number; seed: number; onDone: (r: GameResult) => void; towerMax?: number; day?: number }

/** Relógio que redesenha a cada quadro enquanto o jogo roda. */
function useNow(active = true): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

/** Tecla apertada (sem repetir segurando). */
function useKey(handler: (key: string) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.repeat || e.key === 'Escape') return;
      ref.current(e.key);
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('keydown', on, true);
    return () => window.removeEventListener('keydown', on, true);
  }, []);
}

const Bar = ({ v, color = '#3a9a5a' }: { v: number; color?: string }) => (
  <div className="h-2 rounded bg-black/15 overflow-hidden"><div className="h-full" style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%`, background: color }} /></div>
);
const btn = 'rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-transform';

// ─── Padaria: forno ─────────────────────────────────────────────────────────

function Forno({ perk, onDone }: GameProps) {
  const ROUNDS = 3, DUR = 2600, TARGET = 72, WIN = 9 + perk * 4;
  const [round, setRound] = useState(0);
  const [t0, setT0] = useState(() => performance.now() + 600);
  const [marks, setMarks] = useState<number[]>([]);
  const [shownRes, setShownRes] = useState<string | null>(null);
  const now = useNow(round < ROUNDS && !shownRes);
  const v = Math.max(0, ((now - t0) / DUR) * 100);
  const finish = useCallback((val: number) => {
    const close = Math.max(0, 1 - Math.abs(val - TARGET) / 30);
    const hit = Math.abs(val - TARGET) <= WIN;
    play(hit ? 'coin' : 'lose');
    setShownRes(val >= 100 ? 'QUEIMOU!' : hit ? (Math.abs(val - TARGET) < 3 ? 'PERFEITO!' : 'NO PONTO!') : val < TARGET ? 'CRU...' : 'PASSOU DO PONTO');
    const m = [...marks, hit ? 1 + close : close];
    setMarks(m);
    window.setTimeout(() => {
      setShownRes(null);
      if (m.length >= ROUNDS) {
        const hits = m.filter(x => x >= 1).length;
        onDone({ score: m.reduce((s, x) => s + (x >= 1 ? x - 1 : x * 0.5), 0) / ROUNDS, hits });
      } else { setRound(r => r + 1); setT0(performance.now() + 500); }
    }, 900);
  }, [marks, onDone, WIN]);
  useEffect(() => { if (!shownRes && round < ROUNDS && v >= 100) finish(100); }, [v, shownRes, round, finish]);
  const press = () => { if (!shownRes && now >= t0) finish(v); };
  useKey(k => { if (k === ' ' || k === 'Enter') press(); });
  const brown = Math.min(1, v / 100);
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">FORNADA {Math.min(round + 1, ROUNDS)} DE {ROUNDS} · tire quando a agulha estiver no verde</div>
      <div className="mx-auto w-[220px] h-[120px] rounded-t-[60px] bg-[#8a4a2a] border-4 border-[#4a2a1a] flex items-center justify-center relative">
        <div className="w-[170px] h-[70px] mt-6 rounded-lg bg-[#2a1a12] flex items-center justify-center" style={{ boxShadow: `inset 0 0 ${10 + brown * 30}px #ff8a20` }}>
          <span style={{ filter: `brightness(${1.15 - brown * 0.6})` }}><Icon id="pao" size={64} /></span>
        </div>
      </div>
      <div className="relative mx-auto mt-3 w-[min(80vw,320px)] h-5 rounded bg-[#e8d8c0] border-2 border-[#4a2a1a] overflow-hidden">
        <div className="absolute inset-y-0 bg-[#3ac46a]" style={{ left: `${TARGET - WIN}%`, width: `${WIN * 2}%` }} />
        <div className="absolute inset-y-0 bg-[#e8485a]/60" style={{ left: '92%', right: 0 }} />
        <div className="absolute inset-y-[-2px] w-1.5 bg-[#2e2a40]" style={{ left: `calc(${Math.min(100, v)}% - 3px)` }} />
      </div>
      <div className="h-6 mt-2 text-[11px] text-[#b0487a]">{shownRes ?? (now < t0 ? 'PREPARAR...' : '')}</div>
      <button onPointerDown={press} className={`${btn} mt-1 px-6 py-3 bg-[#e8a020] border-[#a86a10] text-white text-[11px]`}>TIRAR DO FORNO</button>
    </div>
  );
}

// ─── Estúdio de Música: ritmo ───────────────────────────────────────────────

const LANES = ['#e8485a', '#f0c040', '#3ac46a', '#3a9ae8'];
const LANE_KEYS: Record<string, number> = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3 };
function Ritmo({ perk, seed, onDone }: GameProps) {
  const TRAVEL = 1700, WIN = 150 + perk * 20, N = 20;
  const [start] = useState(() => performance.now() + 1200);
  const notes = useMemo(() => {
    const r = rng(seed); let t = 0;
    return Array.from({ length: N }, () => { t += 420 + Math.floor(r() * 3) * 160; return { lane: Math.floor(r() * 4), at: t }; });
  }, [seed]);
  const judged = useRef<Map<number, boolean>>(new Map());
  const [flash, setFlash] = useState<{ lane: number; ok: boolean; t: number } | null>(null);
  const done = useRef(false);
  const now = useNow(!done.current);
  const el = now - start;
  // nota que passou do tempo: errou
  notes.forEach((n, i) => { if (!judged.current.has(i) && el > n.at + WIN) judged.current.set(i, false); });
  useEffect(() => {
    if (!done.current && judged.current.size === N) {
      done.current = true;
      const hits = [...judged.current.values()].filter(Boolean).length;
      window.setTimeout(() => onDone({ score: hits / N, hits }), 500);
    }
  });
  const hit = (lane: number) => {
    const i = notes.findIndex((n, k) => n.lane === lane && !judged.current.has(k) && Math.abs(el - n.at) <= WIN);
    if (i >= 0) { judged.current.set(i, true); play('click'); }
    setFlash({ lane, ok: i >= 0, t: now });
  };
  useKey(k => { if (k in LANE_KEYS) hit(LANE_KEYS[k]); });
  const H = 240, LINE = H - 30;
  const hits = [...judged.current.values()].filter(Boolean).length;
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">Toque a cor quando a nota chegar na linha · {hits}/{N} {!('ontouchstart' in window) && '· ← ↓ ↑ →'}</div>
      <div className="relative mx-auto w-[240px] rounded-lg bg-[#1e1a30] border-4 border-[#4a4660] overflow-hidden" style={{ height: H }}>
        {LANES.map((c, l) => <div key={l} className="absolute top-0 bottom-0 border-r border-white/10" style={{ left: l * 60, width: 60 }} />)}
        <div className="absolute left-0 right-0 h-1 bg-white/70" style={{ top: LINE }} />
        {notes.map((n, i) => {
          if (judged.current.get(i) === true) return null;
          const y = LINE - ((n.at - el) / TRAVEL) * LINE;
          if (y < -20 || y > H + 10) return null;
          return <div key={i} className="absolute w-11 h-4 rounded-full border-2 border-white/80" style={{ left: n.lane * 60 + 8, top: y - 8, background: LANES[n.lane], opacity: judged.current.get(i) === false ? 0.3 : 1 }} />;
        })}
        {flash && now - flash.t < 180 && <div className="absolute bottom-0 h-8" style={{ left: flash.lane * 60, width: 60, background: flash.ok ? '#ffffff55' : '#e8485a55' }} />}
      </div>
      <div className="flex justify-center gap-1 mt-2">
        {LANES.map((c, l) => <button key={l} onPointerDown={e => { e.preventDefault(); hit(l); }} className={`${btn} w-[58px] h-12 border-black/30 text-white text-[14px]`} style={{ background: c }}>{['◀', '▼', '▲', '▶'][l]}</button>)}
      </div>
    </div>
  );
}

// ─── Ateliê: pintura de memória ─────────────────────────────────────────────

function Pintura({ perk, seed, onDone }: GameProps) {
  const target = useMemo(() => paintPattern(seed), [seed]);
  const SHOW = 3500 + perk * 1000;
  const [phase, setPhase] = useState<'ver' | 'pintar'>('ver');
  const [grid, setGrid] = useState<number[]>(() => Array(16).fill(4));
  const [color, setColor] = useState(0);
  const [t0] = useState(() => performance.now());
  const now = useNow(phase === 'ver');
  useEffect(() => { if (phase === 'ver' && now - t0 > SHOW) setPhase('pintar'); }, [now, t0, phase, SHOW]);
  const send = () => {
    const ok = grid.filter((c, i) => c === target[i]).length;
    onDone({ score: ok / 16, hits: ok });
  };
  const cells = phase === 'ver' ? target : grid;
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">{phase === 'ver' ? `Decore o desenho! (${Math.max(0, Math.ceil((SHOW - (now - t0)) / 1000))})` : 'Pinte igual ao desenho que você viu.'}</div>
      <div className="mx-auto grid grid-cols-4 gap-1 w-[200px] p-2 rounded bg-[#8a5a34] border-4 border-[#5a3a20]">
        {cells.map((c, i) => (
          <button key={i} disabled={phase === 'ver'} onPointerDown={() => { const g = [...grid]; g[i] = color; setGrid(g); }}
            className="w-[42px] h-[42px] rounded-sm border border-black/20" style={{ background: PAINT_COLORS[c] }} />
        ))}
      </div>
      {phase === 'pintar' && (
        <>
          <div className="flex justify-center gap-2 mt-3">
            {PAINT_COLORS.map((c, i) => (
              <button key={c} onPointerDown={() => setColor(i)} className={`w-9 h-9 rounded-full border-4 ${color === i ? 'border-[#2e2a40] scale-110' : 'border-white'}`} style={{ background: c }} aria-label={`cor ${i + 1}`} />
            ))}
          </div>
          <button onPointerDown={send} className={`${btn} mt-3 px-5 py-3 bg-[#b0487a] border-[#7a2a50] text-white text-[10px]`}>ENTREGAR QUADRO</button>
        </>
      )}
    </div>
  );
}

// ─── Lab de IA: rotular dados ───────────────────────────────────────────────

function Rotular({ perk, seed, onDone }: GameProps) {
  const set = useMemo(() => labelSet(seed), [seed]);
  const TIME = 22000 + perk * 3000;
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [t0] = useState(() => performance.now());
  const doneRef = useRef(false);
  const now = useNow(!doneRef.current);
  const left = TIME - (now - t0);
  const end = useCallback((good: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone({ score: good / set.items.length, hits: good });
  }, [onDone, set.items.length]);
  useEffect(() => { if (left <= 0) end(ok); }, [left, ok, end]);
  const pick = (side: 0 | 1) => {
    if (doneRef.current) return;
    const right = set.items[i].side === side;
    play(right ? 'click' : 'lose');
    const good = ok + (right ? 1 : 0);
    if (right) setOk(good); else setWrong(Date.now());
    if (i + 1 >= set.items.length) end(good); else setI(i + 1);
  };
  useKey(k => { if (k === 'ArrowLeft' || k === 'a' || k === 'A') pick(0); if (k === 'ArrowRight' || k === 'd' || k === 'D') pick(1); });
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">Ensine a IA: cada exemplo vai para o lado certo · {i + 1}/{set.items.length}</div>
      <Bar v={left / TIME} color="#4ad0ff" />
      <div className={`mx-auto my-4 w-[120px] h-[120px] rounded-xl bg-white border-4 flex items-center justify-center ${Date.now() - wrong < 300 ? 'border-[#e8485a]' : 'border-[#4ad0ff]'}`}><Icon id={set.items[i].icon} size={80} /></div>
      <div className="flex justify-center gap-3">
        <button onPointerDown={() => pick(0)} className={`${btn} px-5 py-4 bg-[#3a78c8] border-[#1a4a8a] text-white text-[10px]`}>◀ {set.left}</button>
        <button onPointerDown={() => pick(1)} className={`${btn} px-5 py-4 bg-[#c86a3a] border-[#8a3a1a] text-white text-[10px]`}>{set.right} ▶</button>
      </div>
      <div className="text-[8px] mt-3 text-[#5a5470]">Acertos: {ok} · a IA só aprende certo se os exemplos estiverem certos!</div>
    </div>
  );
}

// ─── Casa Inteligente: circuito ─────────────────────────────────────────────

function PipeTile({ p, lit }: { p: number; lit: boolean }) {
  const c = lit ? '#4ae88a' : '#8a94a8';
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      <rect x="0" y="0" width="40" height="40" fill="#1e2a36" />
      {p & 1 ? <rect x="16" y="0" width="8" height="24" fill={c} /> : null}
      {p & 2 ? <rect x="16" y="16" width="24" height="8" fill={c} /> : null}
      {p & 4 ? <rect x="16" y="16" width="8" height="24" fill={c} /> : null}
      {p & 8 ? <rect x="0" y="16" width="24" height="8" fill={c} /> : null}
      {p ? <circle cx="20" cy="20" r="6" fill={c} /> : null}
    </svg>
  );
}
function Circuito({ perk, seed, onDone }: GameProps) {
  const TIME = 60000 + perk * 6000, GOAL = 3;
  const [n, setN] = useState(0);
  const [c, setC] = useState<Circuit>(() => makeCircuit(seed));
  const [t0] = useState(() => performance.now());
  const [win, setWin] = useState(false);
  const doneRef = useRef(false);
  const now = useNow(!doneRef.current);
  const left = TIME - (now - t0);
  const end = useCallback((solved: number) => { if (!doneRef.current) { doneRef.current = true; onDone({ score: Math.min(1, solved / GOAL), hits: solved }); } }, [onDone]);
  useEffect(() => { if (left <= 0) end(n); }, [left, n, end]);
  const lit = litTiles(c);
  const tap = (i: number) => {
    if (win || doneRef.current || !c.tiles[i]) return;
    const next = { ...c, turns: c.turns.map((t, k) => (k === i ? (t + 1) % 4 : t)) };
    setC(next); play('click');
    if (connected(next)) {
      setWin(true); play('coin');
      const solved = n + 1; setN(solved);
      window.setTimeout(() => { setWin(false); if (solved >= GOAL + 2) end(solved); else setC(makeCircuit(seed + solved * 101)); }, 700);
    }
  };
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">Gire as peças e leve o sinal da tomada até o sensor · sensores: {n}</div>
      <Bar v={left / TIME} color="#4ae88a" />
      <div className="relative mx-auto mt-3 inline-block">
        <div className="grid gap-0.5 p-1 rounded bg-[#0e161e]" style={{ gridTemplateColumns: `repeat(${c.w}, 48px)` }}>
          {c.tiles.map((_, i) => (
            <button key={i} onPointerDown={() => tap(i)} className="w-12 h-12" aria-label={`peça ${i + 1}`}><PipeTile p={shown(c, i)} lit={lit.has(i) || win} /></button>
          ))}
        </div>
        <span className="absolute rounded bg-[#e8a020] p-0.5" style={{ left: -28, top: 4 + c.inY * 50 + 12 }}><Symbol id="eletrico" size={18} /></span>
        <span className="absolute" style={{ right: -32, top: 4 + c.outY * 50 + 8 }}><Icon id="sensor" size={26} /></span>
      </div>
      {win && <div className="text-[10px] text-[#3a9a5a] mt-2">LIGOU! +1 SENSOR</div>}
      {!win && <div><button onPointerDown={() => end(n)} className={`${btn} mt-3 px-4 py-2 bg-[#4a4660] border-[#2e2a40] text-white text-[9px]`}>TERMINAR</button></div>}
    </div>
  );
}

// ─── Metaverso: pares 3D ────────────────────────────────────────────────────

const OBJ3D = ['rubi', 'safira', 'jade', 'ametista', 'diamante', 'opala', 'ouro', 'cristal'];
function Pares({ perk, seed, onDone }: GameProps) {
  const TIME = 60000 + perk * 8000;
  const cards = useMemo(() => { const r = rng(seed); return [...OBJ3D, ...OBJ3D].map(v => ({ v, k: r() })).sort((a, b) => a.k - b.k).map(x => x.v); }, [seed]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState(0);
  const [t0] = useState(() => performance.now());
  const doneRef = useRef(false);
  const now = useNow(!doneRef.current);
  const left = TIME - (now - t0);
  const end = useCallback((pairs: number, miss: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone({ score: Math.max(0, pairs / 8 - Math.max(0, miss - 8) * 0.03), hits: pairs });
  }, [onDone]);
  useEffect(() => { if (left <= 0) end(found.size / 2, misses); }, [left, found, misses, end]);
  const flip = (i: number) => {
    if (open.length >= 2 || open.includes(i) || found.has(i)) return;
    const o = [...open, i]; setOpen(o); play('flip');
    if (o.length === 2) {
      if (cards[o[0]] === cards[o[1]]) {
        const f = new Set(found); f.add(o[0]); f.add(o[1]); setFound(f); setOpen([]); play('coin');
        if (f.size === 16) window.setTimeout(() => end(8, misses), 400);
      } else { setMisses(m => m + 1); window.setTimeout(() => setOpen([]), 650); }
    }
  };
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">Ache os pares para montar a sala virtual · pares {found.size / 2}/8</div>
      <Bar v={left / TIME} color="#c88aff" />
      <div className="mx-auto mt-3 grid grid-cols-4 gap-1.5 w-[232px]">
        {cards.map((v, i) => {
          const up = open.includes(i) || found.has(i);
          return (
            <button key={i} onPointerDown={() => flip(i)} className={`h-[54px] rounded-lg border-4 text-[26px] ${up ? 'bg-white border-[#c88aff]' : 'bg-[#4a2a7a] border-[#2a1a4a]'} ${found.has(i) ? 'opacity-60' : ''}`}>
              {up ? <Icon id={v} size={34} /> : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Estúdio de Comunicação: notícia ────────────────────────────────────────

function Noticia({ seed, onDone, towerMax = 1, day = 0 }: GameProps) {
  const qs = useMemo(() => reporterQuiz(day, seed, towerMax), [day, seed, towerMax]);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const q = qs[i];
  const pick = (k: number) => {
    if (chosen !== null) return;
    setChosen(k);
    const right = k === q.answer;
    play(right ? 'coin' : 'lose');
    const h = right ? [...hits, i] : hits;
    setHits(h);
    window.setTimeout(() => {
      setChosen(null);
      if (i + 1 >= qs.length) {
        const first = h.length ? qs[h[Math.floor(rng(seed + 5)() * h.length)]].headline : undefined;
        onDone({ score: h.length / qs.length, hits: h.length, headline: first });
      } else setI(i + 1);
    }, 900);
  };
  useKey(k => { const n = Number(k); if (n >= 1 && n <= q.options.length) pick(n - 1); });
  return (
    <div>
      <div className="text-[9px] mb-2 text-center">Confira os fatos antes de publicar · {i + 1}/{qs.length}</div>
      <div className="rounded-lg bg-white border-4 border-[#ff8aa8] p-3 text-[10px] leading-5 mb-2">{q.q}</div>
      <div className="grid gap-1.5">
        {q.options.map((o, k) => (
          <button key={o} onPointerDown={() => pick(k)}
            className={`text-left px-3 py-2 rounded-lg border-2 text-[9px] leading-4 ${chosen === null ? 'bg-[#fff4f6] border-[#e8c0cc]' : k === q.answer ? 'bg-[#c8f0d0] border-[#3a9a5a]' : k === chosen ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white border-[#e0d8c4] opacity-60'}`}>
            {k + 1}. {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Oficina de Games: teste de jogo ────────────────────────────────────────

function TesteJogo({ perk, seed, onDone }: GameProps) {
  const TIME = 20000 + perk * 2000, GOAL = 14;
  const [t0] = useState(() => performance.now() + 500);
  const [holes, setHoles] = useState<({ bug: boolean; until: number } | null)[]>(() => Array(9).fill(null));
  const [score, setScore] = useState(0);
  const [boom, setBoom] = useState(0);
  const doneRef = useRef(false);
  const now = useNow(!doneRef.current);
  const r = useMemo(() => rng(seed), [seed]);
  const lastSpawn = useRef(0);
  const left = TIME - (now - t0);
  useEffect(() => {
    if (doneRef.current) return;
    if (left <= 0) { doneRef.current = true; onDone({ score: Math.min(1, score / GOAL), hits: score }); return; }
    if (now < t0) return;
    setHoles(h => {
      let changed = false;
      const next = h.map(x => { if (x && x.until < now) { changed = true; return null; } return x; });
      if (now - lastSpawn.current > 560) {
        lastSpawn.current = now;
        const free = next.map((x, i) => (x ? -1 : i)).filter(i => i >= 0);
        if (free.length) { next[free[Math.floor(r() * free.length)]] = { bug: r() < 0.74, until: now + 950 }; changed = true; }
      }
      return changed ? next : h;
    });
  }, [now, left, t0, score, onDone, r]);
  const whack = (i: number) => {
    const x = holes[i];
    if (!x) return;
    if (x.bug) { setScore(s => s + 1); play('click'); } else { setScore(s => Math.max(0, s - 2)); setBoom(performance.now()); play('lose'); }
    setHoles(h => h.map((y, k) => (k === i ? null : y)));
  };
  return (
    <div className="text-center">
      <div className="text-[9px] mb-2">Pegue os bugs, fuja das bombas · bugs: {score}</div>
      <Bar v={left / TIME} color="#ffd84a" />
      <div className={`mx-auto mt-3 grid grid-cols-3 gap-2 w-[228px] p-2 rounded-lg ${now - boom < 250 ? 'bg-[#e8485a]' : 'bg-[#1e1a30]'}`}>
        {holes.map((x, i) => (
          <button key={i} onPointerDown={() => whack(i)} className="h-[68px] rounded-lg bg-[#3a3456] border-2 border-[#6a6488] flex items-center justify-center">{x ? <Icon id={x.bug ? 'bug' : 'bomba'} size={44} /> : ''}</button>
        ))}
      </div>
    </div>
  );
}

export const GAMES: Record<MinigameId, (p: GameProps) => JSX.Element> = {
  compor: Composer, pao: BreadMaker, materia: Materia, programar: RobotCode, grafico: Grafico, afinar: Afinar, cores: Cores, regras: Regras, rota: Rota, coordenadas: Coordenadas, acuracia: Acuracia, calendario: Calendario, fermento: Fermento, barraca: Barraca, boato: Boato, logica: Logica, pixelart: PixelArt,
  forno: Forno, ritmo: Ritmo, pintura: Pintura, rotular: Rotular, circuito: Circuito, pares: Pares, noticia: Noticia, 'teste-jogo': TesteJogo,
};
