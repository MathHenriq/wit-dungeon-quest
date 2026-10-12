// Fliperama dos alunos: o EDITOR (pinta a grade com chão, parede, moeda,
// espinho, início e saída; testa; publica no mural com um nome da lista) e o
// JOGADOR (setas ou botões; pega as moedas e chega na saída). Ensina a pensar
// como quem cria jogo: a fase tem de ter caminho e o autor tem de vencer antes.
import { useCallback, useEffect, useState } from 'react';
import { checkLevel, emptyLevel, LEVEL_TITLES, setTile, startPlay, step, tileAt, TILES, totalCoins, type Level, type Play, type Tile } from '@/game/arcade';
import { postFase, socialError, socialOn } from '@/game/social';
import { PxButton, PxPanel } from '@/components/pixel/Pixel';
import { Icon } from '@/components/Icon';
import { play as sfx } from '@/game/sfx';

const KEY = 'wit.fase';
const loadDraft = (): Level => { try { const l = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return l && !checkLevel(l) ? l : emptyLevel(); } catch { return emptyLevel(); } };

function Cell({ t, me }: { t: Tile; me?: boolean }) {
  const bg = t === '#' ? '#3a2e5a' : t === 'e' ? '#3a9a5a' : t === 's' ? '#3a78c8' : '#f2ead8';
  return (
    <div className="relative aspect-square flex items-center justify-center" style={{ background: bg, boxShadow: t === '#' ? 'inset 0 -3px 0 #241c3a, inset 0 2px 0 #5a4a8a' : 'inset 0 0 0 1px rgba(0,0,0,.06)' }}>
      {t === 'o' && <Icon id="moeda" size={18} />}
      {t === 'x' && <svg viewBox="0 0 16 16" className="w-[70%] h-[70%]"><path d="M1 15 L4 6 L7 15 Z M6 15 L9 4 L12 15 Z M11 15 L13 8 L15 15 Z" fill="#c8303a" stroke="#6a1018" strokeWidth=".8" /></svg>}
      {t === 'e' && <Icon id="bandeira" size={18} />}
      {me && <span className="absolute inset-[12%] rounded-[30%] bg-[#ffd84a] border-2 border-[#8a5a10] shadow-[0_2px_0_#6a4a10]"><i className="absolute left-[22%] top-[30%] w-[14%] h-[22%] bg-[#2e2a40]" /><i className="absolute right-[22%] top-[30%] w-[14%] h-[22%] bg-[#2e2a40]" /></span>}
    </div>
  );
}

/** Joga uma fase (a do editor ou a de um colega no mural). */
export function ArcadePlayer({ level, onWin, onClose, title }: { level: Level; onWin?: (p: Play) => void; onClose?: () => void; title?: string }) {
  const [p, setP] = useState<Play>(() => startPlay(level));
  const move = useCallback((dx: number, dy: number) => {
    setP(cur => {
      const n = step(level, cur, dx, dy);
      if (n.deaths > cur.deaths) sfx('lose');
      else if (n.coins > cur.coins) sfx('coin');
      if (n.won && !cur.won) { sfx('win'); onWin?.(n); }
      return n;
    });
  }, [level, onWin]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const d = ({ ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] } as Record<string, number[]>)[e.key];
      if (d) { e.preventDefault(); move(d[0], d[1]); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [move]);
  return (
    <div>
      {title && <div className="text-[10px] mb-1">{title}</div>}
      <div className="flex items-center gap-3 text-[8px] mb-1.5">
        <span className="flex items-center gap-1"><Icon id="moeda" size={12} /> {p.coins}/{totalCoins(level)}</span>
        <span>espinhos: {p.deaths}</span>
        {p.won && <span className="text-[#3a9a5a]">VENCEU!</span>}
        <PxButton color="#6a6a7a" onClick={() => setP(startPlay(level))}>RECOMEÇAR</PxButton>
        {onClose && <PxButton color="#6a6a7a" onClick={onClose}>VOLTAR</PxButton>}
      </div>
      <div className="grid content-start w-full mx-auto rounded overflow-hidden border-4 border-[#241c3a]" style={{ gridTemplateColumns: `repeat(${level.w}, 1fr)`, maxWidth: `min(560px, calc((100dvh - 190px) * ${level.w} / ${level.h}))` }}>
        {Array.from({ length: level.w * level.h }, (_, i) => <Cell key={i} t={tileAt(level, i % level.w, Math.floor(i / level.w))} me={p.x === i % level.w && p.y === Math.floor(i / level.w)} />)}
      </div>
      <div className="grid grid-cols-3 gap-1 w-[132px] mt-2">
        {[[null], [0, -1], [null], [-1, 0], [null], [1, 0], [null], [0, 1], [null]].map((d, i) => d[0] === null
          ? <span key={i} />
          : <button key={i} className="h-10 rounded bg-[#2e2a40] text-white" onClick={() => move(d[0] as number, d[1] as number)}>{d[1] === -1 ? '▲' : d[1] === 1 ? '▼' : d[0] === -1 ? '◀' : '▶'}</button>)}
      </div>
    </div>
  );
}

export function ArcadeMaker({ onClose, onClassic }: { onClose: () => void; onClassic?: () => void }) {
  const [level, setLevel] = useState<Level>(loadDraft);
  const [brush, setBrush] = useState<Tile>('#');
  const [testing, setTesting] = useState(false);
  const [beaten, setBeaten] = useState(false);
  const [title, setTitle] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(level)); } catch { /* sem armazenamento */ } }, [level]);
  const problem = checkLevel(level);
  const paint = (i: number) => { setLevel(l => setTile(l, i % l.w, Math.floor(i / l.w), brush)); setBeaten(false); };
  const publish = async () => {
    try { await postFase(level, title); setMsg('Publicada no mural da turma! Os colegas podem jogar.'); sfx('super'); }
    catch (e) { setMsg(socialError(e)); }
  };
  return (
    <PxPanel title="FLIPERAMA: CRIAR FASE" color="#c8303a" onClose={onClose} width={720}>
      {testing ? (
        <ArcadePlayer level={level} onWin={() => setBeaten(true)} onClose={() => setTesting(false)} title="TESTANDO A SUA FASE" />
      ) : (
        <div className="grid md:grid-cols-[1fr_200px] gap-3">
          <div className="grid self-start content-start w-full mx-auto rounded overflow-hidden border-4 border-[#241c3a]" style={{ gridTemplateColumns: `repeat(${level.w}, 1fr)`, maxWidth: `calc((100dvh - 150px) * ${level.w} / ${level.h})` }}>
            {Array.from({ length: level.w * level.h }, (_, i) => (
              <button key={i} onPointerDown={() => paint(i)} onPointerEnter={e => { if (e.buttons) paint(i); }} className="p-0"><Cell t={tileAt(level, i % level.w, Math.floor(i / level.w))} /></button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 text-[8px]">
            <div>PEÇA:</div>
            <div className="grid grid-cols-3 gap-1">
              {TILES.map(t => (
                <button key={t.id} onClick={() => setBrush(t.id)} className={`rounded p-0.5 ${brush === t.id ? 'ring-2 ring-[#e8a020]' : ''}`} title={t.nome}>
                  <Cell t={t.id} /><div className="text-[6px] mt-0.5">{t.nome}</div>
                </button>
              ))}
            </div>
            <PxButton color="#6a6a7a" onClick={() => { setLevel(emptyLevel()); setBeaten(false); }}>LIMPAR</PxButton>
            <PxButton color="#3a78c8" disabled={!!problem} onClick={() => setTesting(true)}>TESTAR</PxButton>
            {problem && <div className="text-[#b8433a] leading-4">{problem}</div>}
            {!problem && !beaten && <div className="leading-4 text-[#6a4a2a]">Vença a sua fase uma vez para poder publicar.</div>}
            <select value={title} onChange={e => setTitle(+e.target.value)} className="px-1 py-1 rounded border bg-white text-[#2e2a40] text-[8px]">
              {LEVEL_TITLES.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <PxButton color="#3a9a5a" disabled={!!problem || !beaten || !socialOn()} onClick={() => void publish()}>PUBLICAR NO MURAL</PxButton>
            {!socialOn() && <div className="leading-4 text-[#6a4a2a]">Publicar precisa estar online.</div>}
            {onClassic && <PxButton color="#8a4ac8" onClick={onClassic}>JOGAR O CAÇA-BUGS</PxButton>}
          </div>
        </div>
      )}
      {msg && <div className="text-[8px] text-[#3a9a5a] mt-2">{msg}</div>}
    </PxPanel>
  );
}
