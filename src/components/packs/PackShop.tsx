// Balcão da Loja de Pacotinhos: os 6 pacotes com preço e chances da carta
// destaque; comprar abre na hora (PackOpening).
import { useState } from 'react';
import { buyAndOpen, openSaved, PACK_BY_ID, PACKS, PITY, type PackId } from '@/game/packs';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { RARITY_PT } from '@/lib/tcg/labels';
import type { CardDef } from '@/lib/tcg/types';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { PackArt, PackOpening, RARITY_COLOR } from './PackOpening';

export function PackShop({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [opening, setOpening] = useState<{ id: PackId; cards: CardDef[]; fresh: Set<string>; saved?: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const font = "font-['Press_Start_2P',monospace]";
  const buy = (id: PackId) => {
    const r = buyAndOpen(loadProgress(), id, Math.random);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); play('coin');
    setOpening({ id, cards: r.result.cards, fresh: r.fresh });
  };
  // pacote guardado (do professor ou do legado do WIT 1): abre de graça
  const openMine = (id: PackId) => {
    const r = openSaved(loadProgress(), id, Math.random);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); play('flip');
    setOpening({ id, cards: r.result.cards, fresh: r.fresh, saved: true });
  };
  if (opening) {
    const pack = PACK_BY_ID.get(opening.id)!;
    const again = opening.saved ? (progress.pacotes[opening.id] ?? 0) > 0 : progress.coins >= pack.price;
    return (
      <PackOpening pack={pack} cards={opening.cards} fresh={opening.fresh} canAgain={again}
        onAgain={() => (opening.saved ? openMine(opening.id) : buy(opening.id))} onClose={() => setOpening(null)} />
    );
  }
  const mine = PACKS.filter(p => (progress.pacotes[p.id] ?? 0) > 0);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3" onPointerDown={onClose}>
      <div onPointerDown={e => e.stopPropagation()} className={`w-[min(96vw,820px)] max-h-[94vh] overflow-auto rounded-xl border-4 border-[#e8a020] bg-[#1c1428] p-4 text-white ${font}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="text-[12px] text-[#ffd45c]">LOJA DE PACOTINHOS</div>
          <span className="ml-auto text-[10px] text-[#ffd45c] inline-flex items-center gap-1"><Icon id="moeda" size={14} /> {progress.coins}</span>
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#4a4660] text-[10px]">SAIR</button>
        </div>
        <div className="text-[8px] leading-4 text-white/70 mb-3">
          5 cartas em cada pacotinho: 4 do nível dele e 1 destaque, que é no mínimo da raridade do nome. A cada {PITY} pacotinhos sem Épica, o próximo destaque é Épica ou melhor
          {progress.semEpica ? ` (faltam ${PITY - progress.semEpica})` : ''}.
        </div>
        {mine.length > 0 && (
          <div className="mb-4 rounded-lg border-2 border-lime-400/70 bg-lime-400/10 p-2">
            <div className="text-[9px] text-lime-300 mb-2">MEUS PACOTES (já são seus: abra quando quiser)</div>
            <div className="flex flex-wrap gap-3">
              {mine.map(p => (
                <button key={p.id} onClick={() => openMine(p.id)} className="flex flex-col items-center rounded-lg bg-white/5 border-2 p-2" style={{ borderColor: RARITY_COLOR[p.rarity] }}>
                  <PackArt pack={p} className="!w-[64px] floating" />
                  <span className="text-[8px] mt-1" style={{ color: RARITY_COLOR[p.rarity] }}>{p.name.toUpperCase()} ×{progress.pacotes[p.id]}</span>
                  <span className="mt-1 px-2 py-1 rounded bg-lime-500 text-[#14210a] text-[8px]">ABRIR</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PACKS.map(p => {
            const can = progress.coins >= p.price;
            return (
              <div key={p.id} className="rounded-lg border-2 p-2 flex flex-col items-center bg-white/5" style={{ borderColor: RARITY_COLOR[p.rarity] }}>
                <PackArt pack={p} className="!w-[96px] floating" />
                <div className="text-[9px] mt-2 text-center" style={{ color: RARITY_COLOR[p.rarity] }}>{p.name.toUpperCase()}</div>
                <div className="text-[7px] leading-4 text-white/60 text-center mt-1 min-h-[32px]">
                  Destaque: {p.highlight.map(([r, w]) => `${RARITY_PT[r]} ${w}%`).join(' · ')}
                </div>
                <button disabled={!can} onClick={() => buy(p.id)}
                  className={`mt-2 w-full py-2 rounded text-[9px] inline-flex items-center justify-center gap-1 border-b-4 ${can ? 'bg-[#e8a020] border-[#a86a10]' : 'bg-[#3a3448] border-[#2a2436] text-white/40'}`}>
                  <Icon id="moeda" size={12} /> {p.price}
                </button>
              </div>
            );
          })}
        </div>
        {msg && <div className="mt-3 text-[9px] text-[#ff9aa8]">{msg}</div>}
      </div>
    </div>
  );
}
