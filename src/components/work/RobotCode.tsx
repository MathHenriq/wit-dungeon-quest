// Laboratório de IA: programar o robô gari. Monta o programa com blocos
// (ANDAR, VIRAR, PEGAR, REPETIR), aperta RODAR e vê o robô seguir passo a
// passo. Errou? Ajusta e roda de novo. 3 fases; a 2ª só cabe com REPETIR.
import { useEffect, useMemo, useRef, useState } from 'react';
import { countBlocks, levelScore, robotLevels, runProgram, type Block, type Frame } from '@/game/robot';
import { gariBotFrames, litterArt } from '@/game/world/buildings-wit';
import { toCanvas } from '@/game/world/sprites';
import type { Pixmap } from '@/game/world/pixmap';
import { play } from '@/game/sfx';
import type { GameProps } from './Minigames';

const COLORS: Record<Block['op'], { bg: string; dark: string; name: string }> = {
  andar: { bg: '#3a8ae8', dark: '#1e5aa8', name: 'ANDAR' },
  esquerda: { bg: '#8a5ae8', dark: '#5a34a8', name: 'VIRAR' },
  direita: { bg: '#8a5ae8', dark: '#5a34a8', name: 'VIRAR' },
  pegar: { bg: '#3aa85a', dark: '#1e7a3a', name: 'PEGAR' },
  repetir: { bg: '#e8902a', dark: '#a85a10', name: 'REPETIR' },
};
const CELL = 46;
const url = (pm: Pixmap) => toCanvas(pm.hd ?? pm).toDataURL();

/** Seta de virar (desenho, nada de emoji). */
function TurnArrow({ left }: { left: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ transform: left ? 'scaleX(-1)' : undefined }}>
      <path d="M3 13 V7 A4 4 0 0 1 7 3 H11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 0 L14 3 L10 6 Z" fill="#fff" />
    </svg>
  );
}

function Chip({ b, active, onClick, small }: { b: Block; active?: boolean; onClick?: () => void; small?: boolean }) {
  const c = COLORS[b.op];
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md text-white border-b-[3px] ${small ? 'px-1.5 py-1 text-[7px]' : 'px-2 py-1.5 text-[8px]'} ${active ? 'ring-2 ring-[#ffd84a] scale-105' : ''} transition-transform`}
      style={{ background: c.bg, borderColor: c.dark }}>
      {c.name}{b.op === 'esquerda' && <><TurnArrow left /> ESQ</>}{b.op === 'direita' && <><TurnArrow left={false} /> DIR</>}
      {b.op === 'repetir' && <span className="bg-white/25 rounded px-1">{b.n}x</span>}
    </button>
  );
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function RobotCode({ seed, onDone }: GameProps) {
  const levels = useMemo(() => robotLevels(seed), [seed]);
  const art = useMemo(() => ({ bot: [gariBotFrames(1), gariBotFrames(-1)].map(f => f.map(url)), litter: litterArt().map(url) }), []);
  const [li, setLi] = useState(0);
  const [prog, setProg] = useState<Block[]>([]);
  /** Em qual REPETIR os blocos novos entram (índice no programa) ou null = no programa. */
  const [inside, setInside] = useState<number | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [running, setRunning] = useState(false);
  const [fails, setFails] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  const l = levels[li];
  const used = countBlocks(prog);

  const add = (b: Block) => {
    if (running) return;
    if (used + 1 > l.max) { setMsg({ text: `Só cabem ${l.max} blocos nesta fase. Use o REPETIR!` }); play('lose'); return; }
    play('click'); setMsg(null); setFrame(null);
    if (inside !== null && b.op !== 'repetir') {
      setProg(p => p.map((x, i) => (i === inside && x.op === 'repetir' ? { ...x, body: [...x.body, b] } : x)));
      return;
    }
    setProg(p => [...p, b]);
    if (b.op === 'repetir') setInside(prog.length);
  };
  const remove = (i: number, j?: number) => {
    if (running) return;
    setFrame(null);
    if (j === undefined) { setProg(p => p.filter((_, k) => k !== i)); setInside(null); }
    else setProg(p => p.map((x, k) => (k === i && x.op === 'repetir' ? { ...x, body: x.body.filter((_, m) => m !== j) } : x)));
  };
  const setN = (i: number, d: number) => setProg(p => p.map((x, k) => (k === i && x.op === 'repetir' ? { ...x, n: Math.max(2, Math.min(6, x.n + d)) } : x)));

  const run = () => {
    if (running || !prog.length) return;
    const r = runProgram(l, prog);
    setRunning(true); setMsg(null); setInside(null);
    let k = 0;
    setFrame({ ...l.start, got: [], at: [] });
    timer.current = window.setInterval(() => {
      const f = r.frames[k++];
      if (f) {
        setFrame(f);
        if (f.event === 'pegou') play('coin'); else if (f.event === 'bateu') play('lose'); else play('draw');
        return;
      }
      window.clearInterval(timer.current!); timer.current = null;
      setRunning(false);
      if (r.done) {
        const sc = levelScore(l, prog, fails);
        setScores(s => [...s, sc]);
        play('win');
        setMsg({ ok: true, text: countBlocks(prog) <= l.par ? `Perfeito! Resolveu com ${countBlocks(prog)} blocos.` : `Conseguiu! Dá para fazer com ${l.par} blocos: tente o REPETIR.` });
      } else {
        setFails(n => n + 1);
        setMsg({ text: r.crashed ? 'O robô bateu! Ajuste o programa e rode de novo.' : `Faltou lixo: pegou ${r.got} de ${l.litter.length}.` });
      }
    }, 380);
  };
  const next = () => {
    const done = [...scores];
    if (li + 1 >= levels.length) { onDone({ score: done.reduce((a, b) => a + b, 0) / levels.length, hits: done.length }); return; }
    setLi(li + 1); setProg([]); setInside(null); setFrame(null); setFails(0); setMsg(null);
  };
  const skip = () => { setScores(s => [...s, 0]); setMsg(null); if (li + 1 >= levels.length) onDone({ score: scores.reduce((a, b) => a + b, 0) / levels.length, hits: scores.filter(x => x > 0).length }); else { setLi(li + 1); setProg([]); setInside(null); setFrame(null); setFails(0); } };

  const pos = frame ?? { ...l.start, got: [] as number[], at: [] as number[] };
  const solved = msg?.ok;
  const face = pos.dir === 3 ? 1 : 0;
  const botImg = art.bot[face][frame?.event === 'pegou' ? 2 : running ? Math.floor(Date.now() / 200) % 2 : 0];

  return (
    <div className="text-[#2e2a40]">
      <div className="flex items-center justify-between text-[8px] mb-2">
        <span>FASE {li + 1}/{levels.length}</span>
        <span className="text-[#5a5470]">{l.hint}</span>
      </div>
      <div className="flex flex-wrap gap-3 items-start">
        {/* tabuleiro: a rua com os lixos e os canteiros */}
        <div className="relative rounded-lg border-4 border-[#3a4050] bg-[#9aa2ac] shrink-0" style={{ width: l.w * CELL + 8, height: l.h * CELL + 8, padding: 4 }}>
          <div className="relative" style={{ width: l.w * CELL, height: l.h * CELL }}>
            {Array.from({ length: l.w * l.h }, (_, i) => {
              const x = i % l.w, y = Math.floor(i / l.w);
              return <div key={i} className="absolute border border-[#7a828c]" style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL, background: (x + y) % 2 ? '#b8c0c8' : '#aeb6c0' }} />;
            })}
            {l.walls.map((w, i) => (
              <div key={`w${i}`} className="absolute rounded-md border-2 border-[#3a2a1a] overflow-hidden" style={{ left: w.x * CELL + 4, top: w.y * CELL + 4, width: CELL - 8, height: CELL - 8, background: '#6a4428' }}>
                <div className="absolute inset-x-0 top-0 h-[55%] bg-[#4aa84a]" />
                <div className="absolute left-1 top-1 w-2 h-2 rounded-full bg-[#f06a8a]" /><div className="absolute right-2 top-2 w-2 h-2 rounded-full bg-[#ffd84a]" />
              </div>
            ))}
            {l.litter.map((p, i) => !pos.got.includes(i) && (
              <img key={`l${i}`} src={art.litter[i % 3]} alt="lixo" className="absolute [image-rendering:pixelated]" style={{ left: p.x * CELL + CELL / 2 - 14, top: p.y * CELL + CELL / 2 - 12, width: 28, height: 24 }} />
            ))}
            <img src={botImg} alt="robô" className="absolute [image-rendering:pixelated] transition-all duration-300" style={{ left: pos.x * CELL + CELL / 2 - 20, top: pos.y * CELL + CELL / 2 - 34, width: 40, height: 48 }} />
            {/* seta de para onde o robô olha */}
            <div className="absolute transition-all duration-300" style={{ left: pos.x * CELL + CELL / 2 - 6 + [0, 18, 0, -18][pos.dir], top: pos.y * CELL + CELL / 2 - 6 + [-18, 0, 18, 0][pos.dir] + 6, width: 12, height: 12 }}>
              <svg viewBox="0 0 12 12" width="12" height="12" style={{ transform: `rotate(${pos.dir * 90}deg)` }}><path d="M6 0 L12 9 L0 9 Z" fill="#ffd84a" stroke="#5a4a10" strokeWidth="1" /></svg>
            </div>
            {frame?.event === 'bateu' && <div className="absolute text-[9px] text-white bg-[#e8485a] px-1 rounded" style={{ left: pos.x * CELL, top: pos.y * CELL - 10 }}>BATEU!</div>}
          </div>
        </div>
        {/* blocos e programa */}
        <div className="flex-1 min-w-[220px]">
          <div className="text-[8px] mb-1 text-[#5a5470]">BLOCOS (toque para pôr no programa)</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {([{ op: 'andar' }, { op: 'esquerda' }, { op: 'direita' }, { op: 'pegar' }, { op: 'repetir', n: 2, body: [] }] as Block[]).map(b => <Chip key={b.op} b={b} onClick={() => add(b)} />)}
          </div>
          <div className="flex items-center justify-between text-[8px] mb-1">
            <span>PROGRAMA</span>
            <span className={used > l.max ? 'text-[#e8485a]' : 'text-[#5a5470]'}>{used}/{l.max} blocos</span>
          </div>
          <div className={`rounded-lg border-2 p-2 min-h-[150px] bg-white ${inside === null ? 'border-[#3a8ae8]' : 'border-[#d8d0c0]'}`} onClick={() => setInside(null)}>
            <div className="text-[7px] text-[#3aa85a] mb-1">QUANDO RODAR</div>
            {!prog.length && <div className="text-[8px] text-[#a8a4b4] leading-4">Toque nos blocos acima. Toque num bloco do programa para tirar.</div>}
            <div className="flex flex-col gap-1">
              {prog.map((b, i) => {
                const hot = running && frame && frame.at[0] === i;
                if (b.op !== 'repetir') return <div key={i} className={hot ? 'translate-x-1' : ''}><Chip b={b} active={!!hot} small onClick={() => remove(i)} /></div>;
                return (
                  <div key={i} onClick={e => { e.stopPropagation(); setInside(i); }}
                    className={`rounded-md border-l-[10px] p-1 pl-1.5 ${inside === i ? 'bg-[#fff1dc] ring-2 ring-[#e8902a]' : 'bg-[#fbf3e6]'} ${hot ? 'ring-2 ring-[#ffd84a]' : ''}`} style={{ borderColor: COLORS.repetir.bg }}>
                    <div className="flex items-center gap-1 text-[8px] text-white">
                      <span className="px-1.5 py-1 rounded" style={{ background: COLORS.repetir.bg }}>REPETIR</span>
                      <button onClick={e => { e.stopPropagation(); setN(i, -1); }} className="w-5 h-5 rounded bg-[#a85a10]">-</button>
                      <span className="text-[#a85a10] w-5 text-center">{b.n}x</span>
                      <button onClick={e => { e.stopPropagation(); setN(i, 1); }} className="w-5 h-5 rounded bg-[#a85a10]">+</button>
                      <button onClick={e => { e.stopPropagation(); remove(i); }} className="ml-auto px-1.5 py-0.5 rounded bg-[#4a4660] text-[7px]">TIRAR</button>
                    </div>
                    <div className="flex flex-col gap-1 mt-1 pl-1 min-h-[22px]">
                      {b.body.map((c, j) => {
                        const hot2 = running && frame && frame.at[0] === i && same(frame.at.slice(1), [j]);
                        return <div key={j} onClick={e => e.stopPropagation()}><Chip b={c} small active={!!hot2} onClick={() => remove(i, j)} /></div>;
                      })}
                      {!b.body.length && <span className="text-[7px] text-[#a85a10]">{inside === i ? 'os próximos blocos entram aqui' : 'toque aqui para pôr blocos dentro'}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {!solved ? <>
              <button onClick={run} disabled={running || !prog.length}
                className={`flex-1 py-2 rounded-lg text-white text-[10px] border-b-4 ${running || !prog.length ? 'bg-[#a8a4b4] border-[#8a86a0]' : 'bg-[#3aa85a] border-[#1e7a3a]'}`}>{running ? 'RODANDO...' : 'RODAR'}</button>
              <button onClick={() => { setProg([]); setInside(null); setFrame(null); }} disabled={running} className="px-3 py-2 rounded-lg bg-[#4a4660] text-white text-[9px]">LIMPAR</button>
              {fails >= 3 && <button onClick={skip} className="px-3 py-2 rounded-lg bg-white border-2 border-[#d8d0c0] text-[8px]">PULAR</button>}
            </> : <button onClick={next} className="flex-1 py-2 rounded-lg text-white text-[10px] bg-[#3a8ae8] border-b-4 border-[#1e5aa8]">{li + 1 >= levels.length ? 'TERMINAR' : 'PRÓXIMA FASE'}</button>}
          </div>
          {msg && <div className={`mt-2 text-[8px] leading-4 ${msg.ok ? 'text-[#3a9a5a]' : 'text-[#e8485a]'}`}>{msg.text}</div>}
        </div>
      </div>
    </div>
  );
}
