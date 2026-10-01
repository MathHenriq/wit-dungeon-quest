// Estúdio de Música: compor de verdade. Grade de 16 tempos: 8 notas (escala
// pentatônica, sempre soa bem) e 4 batidas de bateria. Escolhe o instrumento,
// liga as notas, aperta TOCAR e ouve em laço; dá nome e grava o disco.
import { useEffect, useRef, useState } from 'react';
import { DRUMS, emptySong, INSTRUMENTS, NOTES, songScore, songSize, STEPS, type InstrumentId, type Song } from '@/game/music';
import { loadProgress, saveProgress } from '@/game/progress';
import { audio } from '@/game/sfx';
import { loopSong, playDrum, playNote } from './synth';
import type { GameProps } from './Minigames';

const ROW_COLORS = ['#ff6a8a', '#ff9a4a', '#ffd04a', '#8ade4a', '#3ad0a0', '#3aa8ff', '#7a7aff', '#c86aff'];
const DRUM_COLOR = '#e8e0d0';

/** Ideias prontas para quem não sabe por onde começar (a criança muda o que quiser). */
const IDEAS: { name: string; notas: [number, number][]; bateria: [number, number][] }[] = [
  { name: 'Passeio', notas: [[0, 7], [2, 5], [4, 4], [6, 5], [8, 7], [10, 4], [12, 3], [14, 4]], bateria: [[0, 0], [4, 1], [8, 0], [12, 1], [2, 2], [6, 2], [10, 2], [14, 2]] },
  { name: 'Festa', notas: [[0, 4], [1, 3], [2, 2], [4, 3], [6, 4], [8, 2], [9, 1], [10, 0], [12, 1], [14, 2]], bateria: [[0, 0], [3, 0], [4, 1], [8, 0], [11, 0], [12, 1], [12, 3], [4, 3]] },
  { name: 'Ninar', notas: [[0, 2], [4, 3], [8, 4], [12, 5], [14, 7]], bateria: [[0, 0], [8, 0]] },
];

function ideaSong(k: number) {
  const i = IDEAS[k], g = emptySong();
  for (const [s, r] of i.notas) g.notas[s].push(r);
  for (const [s, r] of i.bateria) g.bateria[s].push(r);
  return g;
}

export function Composer({ onDone }: GameProps) {
  const [song, setSong] = useState(() => emptySong());
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState<Song[]>(() => loadProgress().musicas);
  const songRef = useRef(song);
  songRef.current = song;
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const toggle = (layer: 'notas' | 'bateria', s: number, row: number) => {
    const a = audio(), t = a ? a.currentTime + 0.01 : 0;
    const on = song[layer][s].includes(row);
    if (!on) { if (layer === 'notas') playNote(song.inst, NOTES[row].midi, t, 0.3); else playDrum(row, t); }
    setSong(g => ({ ...g, [layer]: g[layer].map((x, k) => (k === s ? (on ? x.filter(r => r !== row) : [...x, row]) : x)) }));
  };
  const play = () => {
    if (playing) { stopRef.current?.(); stopRef.current = null; setPlaying(false); return; }
    stopRef.current = loopSong(() => songRef.current, setStep);
    setPlaying(true);
  };
  const idea = (k: number) => { const g = ideaSong(k); setSong(x => ({ ...g, inst: x.inst, bpm: x.bpm })); };
  const save = () => {
    const nome = name.trim() || 'Minha música';
    const s: Song = { ...song, id: `m${Date.now().toString(36)}`, nome };
    const p = loadProgress();
    const musicas = [s, ...p.musicas].slice(0, 30);
    saveProgress({ ...p, musicas });
    setSaved(musicas);
    stopRef.current?.(); stopRef.current = null; setPlaying(false);
    // ideia pronta sem mexer em nada não vale Disco de Ouro (tem que ser sua)
    const key = (g: Pick<Song, 'notas' | 'bateria'>) => JSON.stringify([g.notas.map(x => [...x].sort()), g.bateria.map(x => [...x].sort())]);
    const copy = IDEAS.some((_, k) => key(ideaSong(k)) === key(song));
    onDone({ score: copy ? Math.min(0.5, songScore(song)) : songScore(song), hits: songSize(song), headline: nome });
  };
  const size = songSize(song);

  const cell = 'w-[clamp(16px,4.2vw,28px)] h-[clamp(16px,3.6vw,22px)] rounded-[4px] border transition-transform';
  return (
    <div className="text-white">
      <div className="rounded-xl bg-[#1a1530] p-3 border-2 border-[#3a3060]">
        {/* instrumento e andamento */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {INSTRUMENTS.map(i => (
            <button key={i.id} onClick={() => { setSong(g => ({ ...g, inst: i.id as InstrumentId })); const a = audio(); if (a) playNote(i.id, 67, a.currentTime + 0.01, 0.4); }}
              className={`px-2.5 py-1.5 rounded-md text-[9px] border-2 ${song.inst === i.id ? 'bg-[#ffd04a] text-[#1a1530] border-[#ffd04a]' : 'border-white/25 text-white/85'}`}>{i.name.toUpperCase()}</button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[8px]">
            <button onClick={() => setSong(g => ({ ...g, bpm: Math.max(70, g.bpm - 10) }))} className="w-6 h-6 rounded bg-white/15">-</button>
            <span className="w-16 text-center">{song.bpm} BPM</span>
            <button onClick={() => setSong(g => ({ ...g, bpm: Math.min(160, g.bpm + 10) }))} className="w-6 h-6 rounded bg-white/15">+</button>
          </div>
        </div>
        {/* grade */}
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `40px repeat(${STEPS}, auto)` }}>
            {NOTES.map((n, row) => (
              [<div key={`l${row}`} className="text-[7px] self-center text-right pr-1" style={{ color: ROW_COLORS[row] }}>{n.name}</div>,
                ...Array.from({ length: STEPS }, (_, s) => {
                  const on = song.notas[s].includes(row), hit = on && step === s;
                  return (
                    <button key={`${row}-${s}`} onClick={() => toggle('notas', s, row)} aria-label={`${n.name} tempo ${s + 1}`}
                      className={`${cell} ${s % 4 === 0 ? 'ml-[3px]' : ''}`}
                      style={{
                        background: on ? ROW_COLORS[row] : step === s ? '#3a3462' : s % 8 < 4 ? '#262046' : '#211b3c',
                        borderColor: on ? '#fff8' : '#ffffff14', transform: hit ? 'scale(1.18)' : undefined,
                        boxShadow: hit ? `0 0 12px ${ROW_COLORS[row]}` : undefined,
                      }} />
                  );
                })]
            ))}
            <div className="col-span-full h-2" />
            {DRUMS.map((d, row) => (
              [<div key={`d${row}`} className="text-[6px] self-center text-right pr-1 text-white/70">{d}</div>,
                ...Array.from({ length: STEPS }, (_, s) => {
                  const on = song.bateria[s].includes(row), hit = on && step === s;
                  return (
                    <button key={`d${row}-${s}`} onClick={() => toggle('bateria', s, row)} aria-label={`${d} tempo ${s + 1}`}
                      className={`${cell} ${s % 4 === 0 ? 'ml-[3px]' : ''}`}
                      style={{ background: on ? DRUM_COLOR : step === s ? '#3a3462' : '#191530', borderColor: on ? '#fff' : '#ffffff14', transform: hit ? 'scale(1.18)' : undefined }} />
                  );
                })]
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <button onClick={play} className={`px-4 py-2 rounded-lg text-[10px] border-b-4 ${playing ? 'bg-[#e8485a] border-[#a02838]' : 'bg-[#3ac46a] border-[#1e8a44]'}`}>{playing ? 'PARAR' : 'TOCAR'}</button>
          <button onClick={() => setSong(g => ({ ...emptySong(), inst: g.inst, bpm: g.bpm }))} className="px-3 py-2 rounded-lg text-[9px] bg-white/15">LIMPAR</button>
          <span className="text-[7px] text-white/60 ml-1">IDEIAS:</span>
          {IDEAS.map((i, k) => <button key={i.name} onClick={() => idea(k)} className="px-2 py-1.5 rounded text-[8px] bg-[#3a3060]">{i.name.toUpperCase()}</button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 text-[#2e2a40]">
        <input value={name} onChange={e => setName(e.target.value.slice(0, 24))} placeholder="Nome da música"
          className="flex-1 min-w-[140px] px-2 py-2 rounded border-2 border-[#3a78c8] text-[9px] bg-white" />
        <button disabled={size < 4} onClick={save} className={`px-3 py-2 rounded-lg text-[9px] text-white border-b-4 ${size >= 4 ? 'bg-[#3a78c8] border-[#1e4a8a]' : 'bg-[#a8a4b4] border-[#8a86a0]'}`}>GRAVAR DISCO</button>
      </div>
      <div className="text-[7px] leading-4 text-[#5a5470] mt-1">Dica: misture melodia e bateria e deixe espaços. Uma música bem variada (e sua!) vira Disco de Ouro. Ideia pronta sem mudar nada vira disco comum.</div>
      {saved.length > 0 && (
        <div className="mt-3">
          <div className="text-[8px] text-[#3a78c8] mb-1">MEUS DISCOS</div>
          <div className="flex flex-wrap gap-1.5">
            {saved.slice(0, 8).map(m => (
              <button key={m.id} onClick={() => setSong({ inst: m.inst, bpm: m.bpm, notas: m.notas, bateria: m.bateria })}
                className="px-2 py-1 rounded bg-white border-2 border-[#d8d0c0] text-[8px] text-[#2e2a40]">{m.nome}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
