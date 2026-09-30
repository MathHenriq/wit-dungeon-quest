import { useMemo, useState } from 'react';
import { boardOfDay, FISH, FISH_BY_ID, RARITY_COLOR, RARITY_LABEL } from '@/game/fishing';
import { fishIconUrl } from '@/game/world/fish-art';
import { saveProgress, sellItems, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';

/**
 * Casa de Pesca: o QUADRO com o que os pescadores pegaram hoje, a VENDA dos
 * peixes da mochila e o ÁLBUM de peixes do lago (com o recorde de cada um).
 */
type Tab = 'quadro' | 'vender' | 'album';

export function FishHouse({ progress, onClose, start = 'quadro' }: { progress: Progress; onClose: () => void; start?: Tab }) {
  const [tab, setTab] = useState<Tab>(start);
  const [msg, setMsg] = useState<string | null>(null);
  const font = "font-['Press_Start_2P',monospace]";
  const day = Math.floor(Date.now() / 86_400_000);
  const board = useMemo(() => boardOfDay(day), [day]);
  const bag = FISH.filter(f => (progress.itens[`peixe:${f.id}`] ?? 0) > 0);
  const total = bag.reduce((s, f) => s + f.price * (progress.itens[`peixe:${f.id}`] ?? 0), 0);
  const caught = FISH.filter(f => progress.recordes[f.id]).length;

  const sell = (ids: string[]) => {
    const r = sellItems(progress, ids, id => FISH_BY_ID.get(id.replace('peixe:', ''))?.price ?? 0);
    if (!r.sold) return;
    saveProgress(r.progress);
    play('coin');
    setMsg(r.coins ? `Vendido! +${r.coins} moedas` : 'O Seu Tião jogou o lixo fora para você.');
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onPointerDown={onClose}>
      <div className={`w-[min(94vw,640px)] max-h-[92vh] overflow-auto rounded-xl border-4 border-[#27566e] bg-[#f4efe2] p-4 text-[#2e2a40] ${font}`} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-[13px] text-[#27566e]">CASA DE PESCA</div>
          <span className="text-[10px] text-[#8a6a1a]">🪙 {progress.coins}</span>
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#4a4660] text-white text-[10px]">SAIR</button>
        </div>
        <div className="flex gap-1 mb-3">
          {([['quadro', 'QUADRO'], ['vender', `VENDER${bag.length ? ` (${bag.length})` : ''}`], ['album', `ÁLBUM ${caught}/${FISH.length}`]] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setMsg(null); play('click'); }}
              className={`px-2 py-1.5 rounded text-[9px] border-2 ${tab === t ? 'bg-[#27566e] text-white border-[#27566e]' : 'bg-white border-[#c8c0ac]'}`}>{l}</button>
          ))}
        </div>

        {tab === 'quadro' && (
          <div>
            <div className="text-[9px] leading-5 text-[#5a5470] mb-2">O que os pescadores do lago pegaram hoje:</div>
            <div className="rounded-lg bg-[#2f4a3a] p-3 border-4 border-[#8a5a34]">
              {board.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-[#e8f0e0] text-[9px]">
                  <img src={fishIconUrl(e.fish, 1)} alt="" className="w-12 h-8 [image-rendering:pixelated]" />
                  <span className="flex-1">{e.who}: {e.fish.name} · {e.cm} cm</span>
                  <span style={{ color: RARITY_COLOR[e.fish.rarity] }}>{RARITY_LABEL[e.fish.rarity]}</span>
                </div>
              ))}
            </div>
            <div className="text-[8px] leading-4 text-[#5a5470] mt-2">Em breve: os peixes que os colegas pescarem aparecem aqui, e dá para comprar e vender entre vocês.</div>
          </div>
        )}

        {tab === 'vender' && (
          <div>
            {!bag.length && <div className="text-[9px] leading-5 text-[#5a5470]">Sua mochila não tem peixe. Vá pescar! (De frente para a água, aperte ESPAÇO.)</div>}
            {bag.map(f => {
              const n = progress.itens[`peixe:${f.id}`] ?? 0;
              return (
                <div key={f.id} className="flex items-center gap-2 py-1.5 border-b border-[#e0d8c4] text-[9px]">
                  <img src={fishIconUrl(f, 1)} alt="" className="w-12 h-8 [image-rendering:pixelated]" />
                  <span className="flex-1">{f.name} ×{n}</span>
                  <span className="text-[#8a6a1a]">{f.price ? `${f.price * n} 🪙` : 'lixo'}</span>
                  <button onClick={() => sell([`peixe:${f.id}`])} className="px-2 py-1 rounded bg-[#3a9a5a] text-white text-[8px]">{f.price ? 'VENDER' : 'JOGAR FORA'}</button>
                </div>
              );
            })}
            {bag.length > 1 && (
              <button onClick={() => sell(bag.map(f => `peixe:${f.id}`))} className="mt-3 px-3 py-2 rounded bg-[#27566e] text-white text-[9px]">VENDER TUDO · {total} 🪙</button>
            )}
            {msg && <div className="mt-3 text-[9px] text-[#3a9a5a]">{msg}</div>}
          </div>
        )}

        {tab === 'album' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FISH.map(f => {
              const rec = progress.recordes[f.id];
              return (
                <div key={f.id} className="rounded-lg bg-white border-2 p-2 flex flex-col items-center text-center" style={{ borderColor: rec ? RARITY_COLOR[f.rarity] : '#d8d0c0' }}>
                  <img src={fishIconUrl(f, 2, !rec)} alt="" className="w-[72px] h-12 [image-rendering:pixelated]" />
                  <div className="text-[8px] leading-4 mt-1">{rec ? f.name : '???'}</div>
                  <div className="text-[7px] leading-4" style={{ color: RARITY_COLOR[f.rarity] }}>{RARITY_LABEL[f.rarity]}</div>
                  <div className="text-[7px] leading-4 text-[#5a5470]">{rec ? `recorde ${rec} cm` : f.night === 'only' ? 'só à noite' : f.deep ? 'água funda' : 'na margem'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
