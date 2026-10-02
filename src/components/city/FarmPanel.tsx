import { useState } from 'react';
import { CROP_BY_ID, CROPS, isFarmItem, itemName, loadFarm, saveFarm, sellPrice, type CropId } from '@/game/farm';
import { addItem, saveProgress, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { OrderBox } from '@/components/work/OrderBox';
import { FieldBox } from '@/components/work/FieldBox';

/** Id do ícone de um item da fazenda (planta sem prefixo vira a colheita). */
export const iconOf = (item: string) => (CROP_BY_ID.has(item as CropId) ? `colheita:${item}` : item.startsWith('semente:') ? `colheita:${item.slice(8)}` : item);

/**
 * Barraca de sementes (comprar) e caixa de envio (deixar o que colheu para
 * vender; paga quando o dia vira, às 6h).
 */
export function FarmPanel({ mode, progress, onClose, onWork }: { mode: 'sementes' | 'envio'; progress: Progress; onClose: () => void; onWork?: () => void }) {
  const font = "font-['Press_Start_2P',monospace]";
  const [msg, setMsg] = useState<string | null>(null);
  const [farm, setFarm] = useState(() => loadFarm());
  const buy = (id: CropId, n: number) => {
    const c = CROPS.find(x => x.id === id)!;
    if (progress.coins < c.seedPrice * n) { setMsg(`Faltam ${c.seedPrice * n - progress.coins} moedas.`); play('click'); return; }
    saveProgress({ ...addItem(progress, `semente:${id}`, n), coins: progress.coins - c.seedPrice * n });
    play('coin');
    setMsg(`+${n} semente${n > 1 ? 's' : ''} de ${c.name}!`);
  };
  const bagItems = Object.keys(progress.itens).filter(isFarmItem);
  const ship = () => {
    let p = progress;
    const bin = { ...farm.bin };
    for (const id of bagItems) { const n = p.itens[id] ?? 0; bin[id] = (bin[id] ?? 0) + n; p = addItem(p, id, -n); }
    const next = { ...farm, bin };
    saveFarm(next); setFarm(next); saveProgress(p);
    play('drop');
    setMsg('Tudo na caixa! Amanhã às 6h o caminhão passa e paga.');
  };
  const binTotal = Object.entries(farm.bin).reduce((s, [id, n]) => s + sellPrice(id) * n, 0);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onPointerDown={onClose}>
      <div className={`w-[min(94vw,560px)] max-h-[92vh] overflow-auto rounded-xl border-4 border-[#3a7a3a] bg-[#f4efe2] p-4 text-[#2e2a40] ${font}`} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-[12px] text-[#3a7a3a]">{mode === 'sementes' ? 'BARRACA DE SEMENTES' : 'CAIXA DE ENVIO'}</div>
          <span className="text-[10px] text-[#8a6a1a] flex items-center gap-1"><Icon id="moeda" size={14} /> {progress.coins}</span>
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#4a4660] text-white text-[10px]">SAIR</button>
        </div>
        {mode === 'sementes' && (
          <div>
            {CROPS.map(c => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-[#e0d8c4]">
                <Icon id={iconOf(c.id)} size={32} />
                <div className="flex-1">
                  <div className="text-[9px]">{c.name} <span className="text-[#5a5470]">· tem {progress.itens[`semente:${c.id}`] ?? 0}</span></div>
                  <div className="text-[7px] leading-4 text-[#5a5470]">{c.days} dias · vende por {c.sellPrice} moedas{c.regrow ? ` · dá de novo a cada ${c.regrow} dias` : ''}</div>
                </div>
                <button onClick={() => buy(c.id, 1)} className="px-2 py-1 rounded bg-[#3a9a5a] text-white text-[8px]">1 · {c.seedPrice} <Icon id="moeda" size={10} /></button>
                <button onClick={() => buy(c.id, 5)} className="px-2 py-1 rounded bg-[#2a7a4a] text-white text-[8px]">5 · {c.seedPrice * 5} <Icon id="moeda" size={10} /></button>
              </div>
            ))}
            <div className="text-[8px] leading-4 text-[#5a5470] mt-2">Escolha a semente embaixo da tela (◀ ▶ ou Q/E) e aperte ESPAÇO de frente para a terra arada.</div>
            {onWork && <button onClick={onWork} className="mt-3 w-full py-2.5 rounded-lg bg-[#5a9a3a] text-white text-[10px] border-b-4 border-[#3a6a1a]">TRABALHAR: CALENDÁRIO DA HORTA (Fazendeiro)</button>}
          </div>
        )}
        {mode === 'envio' && (
          <div>
            <div className="text-[9px] mb-2">Na mochila:</div>
            {!bagItems.length && <div className="text-[8px] leading-4 text-[#5a5470]">Nada para vender. Colha, pegue ovos, tire leite ou colha frutas no pomar.</div>}
            <div className="flex flex-wrap gap-2">
              {bagItems.map(id => (
                <div key={id} className="px-2 py-1 rounded bg-white border-2 border-[#d8d0c0] text-[8px] flex items-center gap-1"><Icon id={iconOf(id)} size={18} /> {itemName(id)} ×{progress.itens[id]} · {sellPrice(id) * (progress.itens[id] ?? 0)} moedas</div>
              ))}
            </div>
            {bagItems.length > 0 && <button onClick={ship} className="mt-3 px-3 py-2 rounded bg-[#3a7a3a] text-white text-[9px]">COLOCAR TUDO NA CAIXA</button>}
            <div className="text-[9px] mt-4 mb-1">Na caixa (paga amanhã às 6h): {binTotal} moedas</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(farm.bin).map(([id, n]) => <div key={id} className="px-2 py-1 rounded bg-[#e8f0e0] text-[8px] flex items-center gap-1"><Icon id={iconOf(id)} size={18} /> {itemName(id)} ×{n}</div>)}
            </div>
            <div className="mt-4"><OrderBox prof="fazendeiro" progress={progress} zone="fazenda" /></div>
            <div className="mt-3"><FieldBox prof="fazendeiro" progress={progress} /></div>
          </div>
        )}
        {msg && <div className="mt-3 text-[9px] text-[#3a9a5a]">{msg}</div>}
      </div>
    </div>
  );
}
