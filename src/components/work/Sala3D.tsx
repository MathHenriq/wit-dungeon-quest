// Sala Virtual do Metaverso (sala3d.ts): a escultura vem só em coordenadas;
// o aluno escolhe X, Y e Z e põe cada bloco; a sala aparece em perspectiva.
// Bloco no ar sem nada embaixo não para (cai).
import { useMemo, useState } from 'react';
import { drawOrder, makeTarget, ROOM_HEIGHT, ROOM_SIZE, scoreBuild, supported, type Block } from '@/game/sala3d';
import type { GameProps } from './Minigames';
import { play } from '@/game/sfx';

const CW = 34, CH = 17, BH = 26;   // meio-largura, meia-altura do losango, altura do bloco

function Iso({ blocks, ghost }: { blocks: Block[]; ghost?: Block | null }) {
  const W = ROOM_SIZE * CW * 2 + 20, H = ROOM_SIZE * CH * 2 + ROOM_HEIGHT * BH + 30;
  const at = (x: number, y: number, z: number) => ({ left: W / 2 + (x - y) * CW - CW, top: 20 + ROOM_HEIGHT * BH + (x + y) * CH - z * BH });
  return (
    <div className="relative mx-auto" style={{ width: W, height: H }}>
      {/* chão em losangos, com X e Y marcados */}
      {Array.from({ length: ROOM_SIZE * ROOM_SIZE }, (_, i) => {
        const x = i % ROOM_SIZE, y = Math.floor(i / ROOM_SIZE), p = at(x, y, 0);
        return <svg key={i} className="absolute" style={{ left: p.left, top: p.top + BH, width: CW * 2, height: CH * 2 }} viewBox={`0 0 ${CW * 2} ${CH * 2}`}>
          <path d={`M${CW} 0 L${CW * 2} ${CH} L${CW} ${CH * 2} L0 ${CH} Z`} fill={(x + y) % 2 ? '#2a2450' : '#332c60'} stroke="#5a4ac8" strokeWidth="1" />
        </svg>;
      })}
      {Array.from({ length: ROOM_SIZE }, (_, i) => {
        const px = at(i, ROOM_SIZE, 0), py = at(ROOM_SIZE, i, 0);
        return <span key={i}><b className="absolute text-[9px] text-[#ff8ab0]" style={{ left: px.left + CW - 14, top: px.top + BH + 4 }}>x{i}</b><b className="absolute text-[9px] text-[#8ad0ff]" style={{ left: py.left + CW + 6, top: py.top + BH + 4 }}>y{i}</b></span>;
      })}
      {drawOrder(ghost ? [...blocks, ghost] : blocks).map(b => {
        const p = at(b[0], b[1], b[2]), g = ghost && b === ghost;
        const top = g ? 'rgba(255,255,255,.35)' : `hsl(${190 + b[2] * 30} 80% 62%)`;
        const left = g ? 'rgba(255,255,255,.2)' : `hsl(${190 + b[2] * 30} 70% 44%)`;
        const right = g ? 'rgba(255,255,255,.12)' : `hsl(${190 + b[2] * 30} 70% 34%)`;
        return <svg key={b.join()} className="absolute pointer-events-none" style={{ left: p.left, top: p.top, width: CW * 2, height: CH * 2 + BH }} viewBox={`0 0 ${CW * 2} ${CH * 2 + BH}`}>
          <path d={`M${CW} 0 L${CW * 2} ${CH} L${CW} ${CH * 2} L0 ${CH} Z`} fill={top} stroke="#0e0a24" />
          <path d={`M0 ${CH} L${CW} ${CH * 2} L${CW} ${CH * 2 + BH} L0 ${CH + BH} Z`} fill={left} stroke="#0e0a24" />
          <path d={`M${CW * 2} ${CH} L${CW} ${CH * 2} L${CW} ${CH * 2 + BH} L${CW * 2} ${CH + BH} Z`} fill={right} stroke="#0e0a24" />
        </svg>;
      })}
    </div>
  );
}

function Step({ label, v, max, color, set }: { label: string; v: number; max: number; color: string; set: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <b style={{ color }} className="w-4">{label}</b>
      <button className="w-7 h-7 rounded bg-[#2e2a40] text-white" onClick={() => set(Math.max(0, v - 1))}>-</button>
      <span className="w-6 text-center text-[12px]">{v}</span>
      <button className="w-7 h-7 rounded bg-[#2e2a40] text-white" onClick={() => set(Math.min(max - 1, v + 1))}>+</button>
    </div>
  );
}

export function Sala3D({ seed, onDone }: GameProps) {
  const target = useMemo(() => makeTarget(seed, 5 + (seed % 2)), [seed]);
  const [built, setBuilt] = useState<Block[]>([]);
  const [c, setC] = useState<Block>([0, 0, 0]);
  const [msg, setMsg] = useState<string | null>(null);
  const has = (b: Block) => built.some(x => x.join() === b.join());
  const put = () => {
    if (has(c)) { setBuilt(built.filter(x => x.join() !== c.join())); play('drop'); return; }
    if (!supported(built, c)) { setMsg(`(${c.join(', ')}) está no ar: ponha um bloco embaixo antes (z = ${c[2] - 1}).`); play('lose'); return; }
    setBuilt([...built, [...c] as Block]); setMsg(null); play('card');
  };
  const done = () => { const r = scoreBuild(target, built); onDone({ score: r.score, hits: r.hits }); };
  return (
    <div className="grid md:grid-cols-[1fr_230px] gap-3 text-[9px]">
      <div className="rounded-lg bg-[#160f30] p-2"><Iso blocks={built} ghost={has(c) ? null : c} /></div>
      <div className="flex flex-col gap-2">
        <div className="leading-4">Monte a escultura. Cada bloco é (x, y, z): x e y no chão, z é a altura.</div>
        <div className="rounded bg-white/70 p-2 leading-5">
          {target.map(b => <div key={b.join()} className={has(b) ? 'text-[#3a9a5a]' : ''}>({b.join(', ')}){has(b) ? ' ✓' : ''}</div>)}
        </div>
        <Step label="x" v={c[0]} max={ROOM_SIZE} color="#e8487a" set={n => setC([n, c[1], c[2]])} />
        <Step label="y" v={c[1]} max={ROOM_SIZE} color="#3a9ad8" set={n => setC([c[0], n, c[2]])} />
        <Step label="z" v={c[2]} max={ROOM_HEIGHT} color="#e8a020" set={n => setC([c[0], c[1], n])} />
        <button className="py-2 rounded bg-[#7a4ac8] text-white" onClick={put}>{has(c) ? 'TIRAR BLOCO' : 'PÔR BLOCO'} ({c.join(', ')})</button>
        <button className="py-2 rounded bg-[#3a9a5a] text-white" onClick={done}>PRONTO</button>
        {msg && <div className="text-[#b8433a] leading-4">{msg}</div>}
      </div>
    </div>
  );
}
