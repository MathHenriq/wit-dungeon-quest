// Telas que os móveis da Sua Casa abrem (house-acts.ts): computador, galeria
// de quadros, aquário e os painéis da cidade que fazem sentido em casa
// (cozinha, mochila, mercado, minijogos).
import type { MinigameId } from '@/game/professions';
import type { Progress } from '@/game/progress';
import { aquariumFish } from '@/game/interior/house-acts';
import { decodeArt, PIX, PIX_PALETTE } from '@/game/lessons2';
import { FISH_BY_ID } from '@/game/fishing';
import { fishIconUrl } from '@/game/world/fish-art';
import { Backpack, KitchenPanel, MarketPanel } from '@/components/work/LifePanels';
import { WorkPanel } from '@/components/work/WorkPanel';
import { PxBox, PxButton, PxPanel } from '@/components/pixel/Pixel';
import { Icon } from '@/components/Icon';
import { useState } from 'react';
import { isSolved, shuffled, slide, type Puzzle } from '@/game/puzzle';
import { cardArtUrl } from '@/components/tcg/cardArt';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { play } from '@/game/sfx';
import './house.css';

export type HousePanel =
  | { kind: 'cozinha' } | { kind: 'mercado' } | { kind: 'pc' } | { kind: 'quadros' } | { kind: 'aquario' } | { kind: 'quebra' }
  | { kind: 'mochila'; start?: 'mochila' | 'cargos' | 'missoes' | 'titulos' }
  | { kind: 'work'; game: MinigameId };

export function HousePanels({ panel, progress, nick, onClose, onOpen, onDeck }: {
  panel: HousePanel; progress: Progress; nick: string;
  onClose: () => void; onOpen: (p: HousePanel) => void; onDeck: () => void;
}) {
  switch (panel.kind) {
    case 'cozinha': return <KitchenPanel progress={progress} onClose={onClose} />;
    case 'mercado': return <MarketPanel progress={progress} onClose={onClose} />;
    case 'mochila': return <Backpack progress={progress} start={panel.start} onClose={onClose} />;
    case 'work': return <WorkPanel game={panel.game} progress={progress} nick={nick} onClose={onClose} />;
    case 'pc': return (
      <PxPanel title="COMPUTADOR" color="#2a6ac8" onClose={onClose} width={520}>
        <div className="hs-screen">
          <div className="text-[9px] mb-3">Olá, {nick}! O que vamos fazer?</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['MEU DECK', 'pacote', onDeck],
              ['MISSÕES DO DIA', 'mapa', () => onOpen({ kind: 'mochila', start: 'missoes' })],
              ['MERCADO ONLINE', 'moeda', () => onOpen({ kind: 'mercado' })],
              ['MEUS TÍTULOS', 'diamante', () => onOpen({ kind: 'mochila', start: 'titulos' })],
              ['PROFISSÕES', 'livro', () => onOpen({ kind: 'mochila', start: 'cargos' })],
              ['DESENHAR', 'quadro', () => onOpen({ kind: 'work', game: 'pixelart' })],
            ] as [string, string, () => void][]).map(([l, ic, go]) => (
              <PxButton key={l} color="#2a5aa8" onClick={go} className="flex items-center gap-2 justify-start"><Icon id={ic} size={20} /> {l}</PxButton>
            ))}
          </div>
        </div>
      </PxPanel>
    );
    case 'quadros': {
      const arts = progress.desenhos.map(decodeArt).filter((a): a is number[] => !!a);
      return (
        <PxPanel title="MEUS QUADROS" color="#b0487a" onClose={onClose} width={620}>
          {arts.length ? (
            <div className="hs-gallery">
              {arts.map((px, i) => (
                <div key={i} className="hs-frame">
                  <div className="hs-art" style={{ gridTemplateColumns: `repeat(${PIX}, 1fr)` }}>
                    {px.map((c, k) => <i key={k} style={{ background: c ? PIX_PALETTE[c] : '#fbf1d6' }} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : <PxBox className="text-[8px] leading-5">Nenhum quadro ainda. Pinte no cavalete (ou no Ateliê da Cidade WIT) e ele aparece aqui.</PxBox>}
          <div className="mt-3 flex justify-end"><PxButton color="#b0487a" onClick={() => onOpen({ kind: 'work', game: 'pixelart' })}>PINTAR UM NOVO</PxButton></div>
        </PxPanel>
      );
    }
    case 'quebra': return <PuzzlePanel progress={progress} onClose={onClose} />;
    case 'aquario': {
      const fish = aquariumFish(progress);
      return (
        <PxPanel title="AQUÁRIO" color="#2a78c8" onClose={onClose} width={620}>
          <div className="hs-tank">
            {fish.map((id, i) => (
              <img key={id} src={fishIconUrl(FISH_BY_ID.get(id)!, 3)} alt="" className="hs-fish" style={{ top: `${12 + ((i * 37) % 70)}%`, animationDuration: `${7 + (i % 4) * 2}s`, animationDelay: `${-i * 1.7}s` }} />
            ))}
            {Array.from({ length: 6 }, (_, i) => <span key={i} className="hs-bubble" style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.7}s` }} />)}
            {!fish.length && <div className="hs-empty">Vazio. Os peixes que você pescar no Lago Azul vêm nadar aqui!</div>}
          </div>
          {!!fish.length && <div className="text-[8px] mt-2 text-[#6a4a2a]">{fish.map(id => FISH_BY_ID.get(id)?.name).join(' · ')}</div>}
        </PxPanel>
      );
    }
  }
}

// ─── baú de brinquedos: quebra-cabeça com a arte de uma carta do álbum ──────

const BEST_KEY = 'wit.quebra';
function PuzzlePanel({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const owned = Object.keys(progress.collection).filter(id => (progress.collection[id] ?? 0) > 0 && CARD_BY_ID.has(id));
  const pickCard = () => owned[Math.floor(Math.random() * owned.length)] ?? 'excalibur-de-arthur';
  const [card, setCard] = useState(pickCard);
  const [p, setP] = useState<Puzzle>(() => shuffled(3, Date.now()));
  const [peek, setPeek] = useState(false);
  const best = (() => { try { return JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}') as Record<string, number>; } catch { return {}; } })();
  const done = isSolved(p);
  const restart = (n = p.n, c = card) => { setCard(c); setP(shuffled(n, Date.now())); };
  const tap = (i: number) => {
    if (done) return;
    const q = slide(p, i);
    if (q === p) return;
    play('click');
    setP(q);
    if (isSolved(q)) {
      play('win');
      const k = `${q.n}`;
      if (!best[k] || q.moves < best[k]) { try { localStorage.setItem(BEST_KEY, JSON.stringify({ ...best, [k]: q.moves })); } catch { /* sem armazenamento */ } }
    }
  };
  const url = cardArtUrl(card), n = p.n, hole = n * n - 1;
  return (
    <PxPanel title="QUEBRA-CABEÇA" color="#c8762a" onClose={onClose} width={560}>
      <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[8px]">
        <span className="flex-1">{CARD_BY_ID.get(card)?.name} · {p.moves} movimentos{best[`${n}`] ? ` · recorde ${best[`${n}`]}` : ''}</span>
        <PxButton color="#3a78c8" onClick={() => restart(n === 3 ? 4 : 3)}>{n === 3 ? 'DIFÍCIL 4×4' : 'FÁCIL 3×3'}</PxButton>
        <PxButton color="#8a4ac8" onClick={() => restart(n, pickCard())}>OUTRA CARTA</PxButton>
        <PxButton color="#6a6a7a" onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)}>ESPIAR</PxButton>
      </div>
      <div className="relative mx-auto w-full max-w-[480px] grid gap-[2px] bg-[#2e2a40] p-[2px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, aspectRatio: '768 / 528' }}>
        {p.tiles.map((t, i) => (
          <button key={i} onClick={() => tap(i)} aria-label={`peça ${t + 1}`}
            className="relative" style={t === hole && !done ? { background: '#1e1b2c' } : {
              backgroundImage: `url(${url})`, backgroundSize: `${n * 100}% ${n * 100}%`,
              backgroundPosition: `${((t % n) / (n - 1)) * 100}% ${(Math.floor(t / n) / (n - 1)) * 100}%`,
            }} />
        ))}
        {peek && <div className="absolute inset-0" style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }} />}
      </div>
      <div className="text-[8px] leading-4 text-[#6a4a2a] mt-2">
        {done ? `Montou! ${p.moves} movimentos.` : 'Toque numa peça do lado do buraco para deslizar. Segure ESPIAR para ver a carta inteira.'}
      </div>
      {done && <PxButton color="#3a9a5a" className="mt-2" onClick={() => restart()}>DE NOVO</PxButton>}
    </PxPanel>
  );
}
