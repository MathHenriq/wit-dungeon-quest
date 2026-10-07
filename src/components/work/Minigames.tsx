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
import { PxButton } from '@/components/pixel/Pixel';
import { Prop } from './Scene';
import './minigames.css';

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
  const look = (x: number) => (x >= 1 ? 'ok' : x > 0.5 ? 'meh' : 'bad');
  return (
    <div className="fn">
      <div className="fn-oven">
        <Prop id="fogao" scale={4} />
        {/* o pão na janela do forno: doura com o calor; vapor quando está perto */}
        <div className="fn-window" style={{ boxShadow: `inset 0 0 ${8 + brown * 34}px rgba(255,${150 - brown * 80},40,${0.35 + brown * 0.5})` }}>
          <span style={{ filter: `brightness(${1.2 - brown * 0.75}) saturate(${1 + brown})` }}><Icon id="pao" size={48} /></span>
        </div>
        {v > 55 && v < 100 && <div className="fn-steam"><i /><i /><i /></div>}
      </div>
      <div className="fn-side">
        <div className="fn-label">FORNADA {Math.min(round + 1, ROUNDS)}/{ROUNDS}</div>
        {/* termômetro: verde = no ponto, vermelho = queima */}
        <div className="fn-thermo">
          <div className="zone ok" style={{ bottom: `${TARGET - WIN}%`, height: `${WIN * 2}%` }} />
          <div className="zone burn" style={{ bottom: '92%', top: 0 }} />
          <div className="fill" style={{ height: `${Math.min(100, v)}%` }} />
          <span className="t t1">QUEIMA</span><span className="t t2">NO PONTO</span><span className="t t3">CRU</span>
        </div>
        <div className="fn-loaves">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span key={i} className={`fn-loaf ${i < marks.length ? look(marks[i]) : ''}`}><Icon id="pao" size={26} /></span>
          ))}
        </div>
      </div>
      <div className="fn-msg">{shownRes ?? (now < t0 ? 'PREPARAR...' : 'Aperte quando o termômetro estiver no verde')}</div>
      <PxButton big color="#d8901a" onPointerDown={press} className="fn-btn">TIRAR DO FORNO</PxButton>
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
  const [streak, setStreak] = useState(0);
  const [judge, setJudge] = useState<{ text: string; t: number; ok: boolean } | null>(null);
  const hit = (lane: number) => {
    const i = notes.findIndex((n, k) => n.lane === lane && !judged.current.has(k) && Math.abs(el - n.at) <= WIN);
    if (i >= 0) {
      judged.current.set(i, true); play('click');
      const d = Math.abs(el - notes[i].at);
      setStreak(s => s + 1);
      setJudge({ text: d < WIN * 0.35 ? 'PERFEITO!' : 'BOM!', t: now, ok: true });
    } else { setStreak(0); setJudge({ text: 'ERROU', t: now, ok: false }); }
    setFlash({ lane, ok: i >= 0, t: now });
  };
  useKey(k => { if (k in LANE_KEYS) hit(LANE_KEYS[k]); });
  const H = 250, LINE = H - 34;
  const hits = [...judged.current.values()].filter(Boolean).length;
  const missed = [...judged.current.values()].filter(x => !x).length;
  const crowd = Math.max(0, Math.min(1, 0.4 + (hits - missed * 1.2) / N));
  const pulse = flash && flash.ok && now - flash.t < 160;
  return (
    <>
    <img src={`${import.meta.env.BASE_URL}game/cenas/musica-palco.webp`} alt="" draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}
      className="block mx-auto mb-2 max-h-[110px] [image-rendering:pixelated] transition-[filter] duration-300" style={{ filter: `brightness(${0.6 + crowd * 0.5})` }} />
    <div className="rt">
      <div className={`rt-spk ${pulse ? 'boom' : ''}`}><Prop id="caixa-som" scale={3} /></div>
      <div className="rt-mid">
        <div className="rt-top"><span>{hits}/{N}</span><span className="rt-crowd">PÚBLICO <b><i style={{ width: `${crowd * 100}%` }} /></b></span></div>
        <div className="rt-road" style={{ height: H }}>
          {LANES.map((c, l) => <div key={l} className="rt-lane" style={{ left: l * 60, ['--lc' as string]: c }} />)}
          <div className="rt-line" style={{ top: LINE }} />
          {notes.map((n, i) => {
            if (judged.current.get(i) === true) return null;
            const y = LINE - ((n.at - el) / TRAVEL) * LINE;
            if (y < -20 || y > H + 10) return null;
            return <div key={i} className={`rt-note ${judged.current.get(i) === false ? 'miss' : ''}`} style={{ left: n.lane * 60 + 10, top: y - 10, ['--lc' as string]: LANES[n.lane] }} />;
          })}
          {flash && now - flash.t < 200 && <div className={`rt-hit ${flash.ok ? 'ok' : 'bad'}`} style={{ left: flash.lane * 60, top: LINE - 22 }} />}
          {judge && now - judge.t < 600 && <div key={judge.t} className={`rt-judge ${judge.ok ? 'ok' : 'bad'}`}>{judge.text}{judge.ok && streak >= 4 ? ` ×${streak}` : ''}</div>}
        </div>
        <div className="rt-pads">
          {LANES.map((c, l) => (
            <button key={l} onPointerDown={e => { e.preventDefault(); hit(l); }} className={`rt-pad ${flash && flash.lane === l && now - flash.t < 120 ? 'down' : ''}`} style={{ ['--lc' as string]: c }}>
              <i className={`ar a${l}`} />
            </button>
          ))}
        </div>
        <div className="text-[7px] mt-1 text-[#7a5a34]">{!('ontouchstart' in window) ? 'Setas ← ↓ ↑ → (ou D F J K) quando a nota chegar na linha' : 'Toque a cor quando a nota chegar na linha'}</div>
      </div>
      <div className={`rt-spk ${pulse ? 'boom' : ''}`}><Prop id="caixa-som" scale={3} /></div>
    </div>
    </>
  );
}

// ─── Ateliê: pintura de memória ─────────────────────────────────────────────
// O quadro de referência fica na parede e é coberto por um pano; o aluno
// pinta a tela no cavalete com os potes de tinta. Ao entregar, os dois
// aparecem lado a lado e o que ficou diferente pisca.

function Pintura({ perk, seed, onDone }: GameProps) {
  const target = useMemo(() => paintPattern(seed), [seed]);
  const SHOW = 3500 + perk * 1000;
  const [phase, setPhase] = useState<'ver' | 'pintar' | 'conferir'>('ver');
  const [grid, setGrid] = useState<number[]>(() => Array(16).fill(4));
  const [color, setColor] = useState(0);
  const [splat, setSplat] = useState<{ i: number; t: number } | null>(null);
  const [t0] = useState(() => performance.now());
  const now = useNow(phase === 'ver');
  useEffect(() => { if (phase === 'ver' && now - t0 > SHOW) { setPhase('pintar'); play('flip'); } }, [now, t0, phase, SHOW]);
  const paint = (i: number) => {
    if (phase !== 'pintar') return;
    const g = [...grid]; g[i] = color; setGrid(g); setSplat({ i, t: performance.now() }); play('click');
  };
  const send = () => {
    if (phase !== 'pintar') return;
    setPhase('conferir');
    const ok = grid.filter((c, i) => c === target[i]).length;
    play(ok >= 13 ? 'coin' : 'drop');
    window.setTimeout(() => onDone({ score: ok / 16, hits: ok }), 1600);
  };
  const left = Math.max(0, Math.ceil((SHOW - (now - t0)) / 1000));
  return (
    <div className="pt">
      <div className="pt-wall">
        <div className="pt-frame">
          <div className="pt-grid">{target.map((c, i) => <i key={i} style={{ background: PAINT_COLORS[c] }} />)}</div>
          {phase === 'pintar' && <div className="pt-cloth">COBERTO</div>}
        </div>
        <div className="pt-cap">{phase === 'ver' ? `DECORE! ${left}` : phase === 'conferir' ? 'MODELO' : 'O MODELO'}</div>
      </div>
      <div className="pt-easel">
        <div className={`pt-canvas ${phase}`}>
          {grid.map((c, i) => (
            <button key={`${i}-${splat?.i === i ? splat.t : 0}`} onPointerDown={() => paint(i)} disabled={phase !== 'pintar'} aria-label={`quadrado ${i + 1}`}
              className={`${phase === 'conferir' && c !== target[i] ? 'bad' : ''} ${splat?.i === i ? 'splat' : ''}`}
              style={{ background: phase === 'ver' ? '#fbf6ea' : PAINT_COLORS[c] }} />
          ))}
        </div>
      </div>
      <div className="pt-bar">
        {phase === 'pintar' && <>
          <div className="pt-pots">
            {PAINT_COLORS.map((c, i) => (
              <button key={c} onPointerDown={() => setColor(i)} className={`pt-pot ${color === i ? 'on' : ''}`} style={{ ['--pc' as string]: c }} aria-label={`tinta ${i + 1}`}><i /></button>
            ))}
          </div>
          <PxButton big color="#b0487a" onPointerDown={send}>ENTREGAR QUADRO</PxButton>
        </>}
        {phase === 'ver' && <div className="pt-hint">Olhe bem as cores de cada quadradinho...</div>}
        {phase === 'conferir' && <div className="pt-hint">{grid.filter((c, i) => c === target[i]).length} de 16 iguais ao modelo</div>}
      </div>
    </div>
  );
}

// ─── Lab de IA: rotular dados ───────────────────────────────────────────────
// Os exemplos chegam numa esteira; o aluno manda cada um para a caixa certa.
// A precisão do modelo sobe com os acertos (e cai com os erros).

function Rotular({ perk, seed, onDone }: GameProps) {
  const set = useMemo(() => labelSet(seed), [seed]);
  const TIME = 22000 + perk * 3000;
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(0);
  const [fly, setFly] = useState<{ side: 0 | 1; right: boolean; icon: string; t: number } | null>(null);
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
    const item = set.items[i];
    const right = item.side === side;
    play(right ? 'click' : 'lose');
    const good = ok + (right ? 1 : 0);
    if (right) setOk(good);
    setFly({ side, right, icon: item.icon, t: performance.now() });
    if (i + 1 >= set.items.length) window.setTimeout(() => end(good), 350); else setI(i + 1);
  };
  useKey(k => { if (k === 'ArrowLeft' || k === 'a' || k === 'A') pick(0); if (k === 'ArrowRight' || k === 'd' || k === 'D') pick(1); });
  const acc = i ? ok / i : 0;
  const flying = fly && now - fly.t < 380;
  return (
    <div className="rl">
      <div className="rl-top">
        <span>EXEMPLO {Math.min(i + 1, set.items.length)}/{set.items.length}</span>
        <span className="rl-acc">PRECISÃO DA IA <b><i style={{ width: `${acc * 100}%`, background: acc > 0.8 ? '#4ae88a' : acc > 0.5 ? '#f0c040' : '#e8685a' }} /></b> {Math.round(acc * 100)}%</span>
      </div>
      <Bar v={left / TIME} color="#4ad0ff" />
      <div className="rl-floor">
        <div className={`rl-bin l ${flying && fly!.side === 0 ? (fly!.right ? 'good' : 'bad') : ''}`}><Prop id="cesto-pacotinhos" scale={2} /><span>{set.left}</span></div>
        <div className="rl-belt">
          <div className="rl-scan" />
          {!doneRef.current && <div key={i} className="rl-item"><Icon id={set.items[i].icon} size={64} /></div>}
          {flying && <div key={`f${fly!.t}`} className={`rl-fly ${fly!.side ? 'r' : 'l'}`}><Icon id={fly!.icon} size={48} /></div>}
        </div>
        <div className={`rl-bin r ${flying && fly!.side === 1 ? (fly!.right ? 'good' : 'bad') : ''}`}><Prop id="cesto-pacotinhos" scale={2} /><span>{set.right}</span></div>
      </div>
      <div className="rl-btns">
        <PxButton big color="#3a78c8" onPointerDown={() => pick(0)}>◀ {set.left}</PxButton>
        <PxButton big color="#c86a3a" onPointerDown={() => pick(1)}>{set.right} ▶</PxButton>
      </div>
      <div className="rl-hint">A IA aprende com os exemplos: se o rótulo estiver errado, ela aprende errado.</div>
    </div>
  );
}

// ─── Casa Inteligente: circuito ─────────────────────────────────────────────
// Placa de circuito: as trilhas acesas mostram a corrente andando (tracejado
// correndo). Ligou a bateria ao sensor, a lâmpada da casa acende.

function PipeTile({ p, lit }: { p: number; lit: boolean }) {
  const arms: [number, number][] = [];
  if (p & 1) arms.push([20, 0]); if (p & 2) arms.push([40, 20]); if (p & 4) arms.push([20, 40]); if (p & 8) arms.push([0, 20]);
  return (
    <svg viewBox="0 0 40 40" className={`w-full h-full cc-tile ${lit ? 'lit' : ''}`}>
      <rect x="0" y="0" width="40" height="40" className="cc-bg" />
      {arms.map(([x, y], k) => <line key={k} x1="20" y1="20" x2={x} y2={y} className="cc-cu" />)}
      {lit && arms.map(([x, y], k) => <line key={`f${k}`} x1="20" y1="20" x2={x} y2={y} className="cc-flow" />)}
      {p ? <circle cx="20" cy="20" r="5" className="cc-pad" /> : null}
    </svg>
  );
}
function Circuito({ perk, seed, onDone }: GameProps) {
  const TIME = 60000 + perk * 6000, GOAL = 3;
  const [n, setN] = useState(0);
  const [c, setC] = useState<Circuit>(() => makeCircuit(seed));
  const [t0] = useState(() => performance.now());
  const [win, setWin] = useState(false);
  const [spin, setSpin] = useState<number | null>(null);
  const doneRef = useRef(false);
  const now = useNow(!doneRef.current);
  const left = TIME - (now - t0);
  const end = useCallback((solved: number) => { if (!doneRef.current) { doneRef.current = true; onDone({ score: Math.min(1, solved / GOAL), hits: solved }); } }, [onDone]);
  useEffect(() => { if (left <= 0) end(n); }, [left, n, end]);
  const lit = litTiles(c);
  const tap = (i: number) => {
    if (win || doneRef.current || !c.tiles[i]) return;
    const next = { ...c, turns: c.turns.map((t, k) => (k === i ? (t + 1) % 4 : t)) };
    setC(next); setSpin(i); play('click');
    if (connected(next)) {
      setWin(true); play('super');
      const solved = n + 1; setN(solved);
      window.setTimeout(() => { setWin(false); if (solved >= GOAL + 2) end(solved); else setC(makeCircuit(seed + solved * 101)); }, 1000);
    }
  };
  return (
    <div className="cc">
      <div className="cc-top"><span>SENSORES LIGADOS: {n}</span><span className="cc-goal">META {GOAL}</span></div>
      <Bar v={left / TIME} color="#4ae88a" />
      <div className="cc-row">
        <div className="cc-end"><Icon id="raio" size={34} /><span>ENERGIA</span></div>
        <div className="cc-board">
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${c.w}, 48px)` }}>
            {c.tiles.map((_, i) => (
              <button key={i} onPointerDown={() => tap(i)} className={`w-12 h-12 ${spin === i ? 'cc-spin' : ''}`} onAnimationEnd={() => setSpin(null)} aria-label={`peça ${i + 1}`}>
                <PipeTile p={shown(c, i)} lit={lit.has(i) || win} />
              </button>
            ))}
          </div>
          <span className="cc-in" style={{ top: c.inY * 48 + 14 }}><Symbol id="eletrico" size={16} /></span>
          <span className={`cc-out ${win ? 'on' : ''}`} style={{ top: c.outY * 48 + 10 }}><Icon id="sensor" size={26} /></span>
        </div>
        <div className={`cc-house ${win ? 'on' : ''}`}><Prop id="luminaria-chao" scale={2} /><span>{win ? 'ACENDEU!' : 'CASA'}</span></div>
      </div>
      <div className="cc-hint">Toque nas peças para girar e leve a energia até o sensor.</div>
      {!win && <PxButton color="#4a4660" onPointerDown={() => end(n)}>TERMINAR</PxButton>}
    </div>
  );
}

// ─── Metaverso: pares 3D ────────────────────────────────────────────────────
// Cartas holográficas que giram em 3D num chão de grade neon; cada par achado
// acende uma peça da sala virtual.

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
        const f = new Set(found); f.add(o[0]); f.add(o[1]);
        window.setTimeout(() => { setFound(f); setOpen([]); play('coin'); if (f.size === 16) window.setTimeout(() => end(8, misses), 500); }, 350);
      } else { setMisses(m => m + 1); window.setTimeout(() => setOpen([]), 750); }
    }
  };
  const pairs = found.size / 2;
  return (
    <div className="pr">
      <div className="pr-top"><span>SALA VIRTUAL</span><span className="pr-room">{OBJ3D.map((o, k) => <i key={o} className={k < pairs ? 'on' : ''} />)}</span><span>{pairs}/8</span></div>
      <Bar v={left / TIME} color="#c88aff" />
      <div className="pr-floor">
        {cards.map((v, i) => {
          const up = open.includes(i) || found.has(i);
          return (
            <button key={i} onPointerDown={() => flip(i)} className={`pr-card ${up ? 'up' : ''} ${found.has(i) ? 'got' : ''}`} aria-label={`carta ${i + 1}`}>
              <span className="pr-in">
                <span className="pr-back" />
                <span className="pr-front"><Icon id={v} size={34} /></span>
              </span>
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
// Um fliperama: a tela tem janelas onde os bugs aparecem (e as bombas, que
// tiram pontos e sacodem a tela). Cada bug pego solta um "+1".

function TesteJogo({ perk, seed, onDone }: GameProps) {
  const TIME = 20000 + perk * 2000, GOAL = 14;
  const [t0] = useState(() => performance.now() + 500);
  const [holes, setHoles] = useState<({ bug: boolean; until: number; born: number } | null)[]>(() => Array(9).fill(null));
  const [score, setScore] = useState(0);
  const [boom, setBoom] = useState(0);
  const [pops, setPops] = useState<{ i: number; t: number; good: boolean }[]>([]);
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
        if (free.length) { next[free[Math.floor(r() * free.length)]] = { bug: r() < 0.74, until: now + 950, born: now }; changed = true; }
      }
      return changed ? next : h;
    });
  }, [now, left, t0, score, onDone, r]);
  const whack = (i: number) => {
    const x = holes[i];
    if (!x) return;
    if (x.bug) { setScore(s => s + 1); play('click'); } else { setScore(s => Math.max(0, s - 2)); setBoom(performance.now()); play('lose'); }
    setPops(p => [...p.filter(q => now - q.t < 600), { i, t: performance.now(), good: x.bug }]);
    setHoles(h => h.map((y, k) => (k === i ? null : y)));
  };
  const shake = now - boom < 260;
  return (
    <div className="tj">
      <div className={`tj-cab ${shake ? 'shake' : ''}`}>
        <div className="tj-marquee">CAÇA-BUGS</div>
        <div className="tj-lcd"><span>BUGS {String(score).padStart(2, '0')}</span><span>TEMPO {Math.max(0, Math.ceil(left / 1000))}</span></div>
        <div className={`tj-screen ${shake ? 'red' : ''}`}>
          {holes.map((x, i) => (
            <button key={i} onPointerDown={() => whack(i)} className="tj-hole" aria-label={`janela ${i + 1}`}>
              {x && <span className={`tj-mob ${x.bug ? 'bug' : 'bomb'}`} style={{ animationDuration: '.18s' }}><Icon id={x.bug ? 'bug' : 'bomba'} size={44} /></span>}
              {pops.filter(q => q.i === i && now - q.t < 600).map(q => <span key={q.t} className={`tj-pop ${q.good ? 'g' : 'b'}`}>{q.good ? '+1' : '-2'}</span>)}
            </button>
          ))}
        </div>
        <div className="tj-panel"><i /><i /><i /></div>
      </div>
      <div className="tj-hint">Pegue os bugs antes que sumam. Bomba tira 2 pontos!</div>
    </div>
  );
}

export const GAMES: Record<MinigameId, (p: GameProps) => JSX.Element> = {
  compor: Composer, pao: BreadMaker, materia: Materia, programar: RobotCode, grafico: Grafico, afinar: Afinar, cores: Cores, regras: Regras, rota: Rota, coordenadas: Coordenadas, acuracia: Acuracia, calendario: Calendario, fermento: Fermento, barraca: Barraca, boato: Boato, logica: Logica, pixelart: PixelArt,
  forno: Forno, ritmo: Ritmo, pintura: Pintura, rotular: Rotular, circuito: Circuito, pares: Pares, noticia: Noticia, 'teste-jogo': TesteJogo,
};
