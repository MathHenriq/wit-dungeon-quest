// Loja de Móveis do shopping: o catálogo inteiro dos móveis da casa, por tipo,
// com preço; o que já tem aparece como TEM. Depois de comprar, o móvel fica
// liberado no modo DECORAR da Sua Casa.
import { useEffect, useRef, useState } from 'react';
import { catalogOf, HOUSE_CATS, type Manifest } from '@/game/interior/room';
import { buyFurniture, furniturePrice, ownsFurniture } from '@/game/furniture';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { PxButton, PxPanel, PxTabs } from '@/components/pixel/Pixel';
import { Icon } from '@/components/Icon';
import { play } from '@/game/sfx';
import { sprite } from './interior-atlas';

export function FurnThumb({ m, id }: { m: Manifest; id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    sprite(m, id).then(src => {
      const c = ref.current;
      if (!alive || !c) return;
      c.width = src.width; c.height = src.height;
      c.getContext('2d')!.drawImage(src, 0, 0);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [m, id]);
  return <canvas ref={ref} className="max-w-full max-h-[64px] object-contain" style={{ imageRendering: 'pixelated' }} />;
}

export function FurnitureShop({ m, onClose }: { m: Manifest; onClose: () => void }) {
  const [p, setP] = useState<Progress>(loadProgress);
  const [cat, setCat] = useState(HOUSE_CATS[0].id);
  const [msg, setMsg] = useState<string | null>(null);
  const ids = catalogOf(m, cat);
  const buy = (id: string) => {
    const r = buyFurniture(loadProgress(), m, id);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); setP(r.progress); play('coin');
    setMsg(`${m[id].nome ?? id}: é seu! Ponha na casa pelo DECORAR.`);
  };
  return (
    <PxPanel title="LOJA DE MÓVEIS" color="#8a5a2e" coins={p.coins} onClose={onClose} width={860}>
      <PxTabs tabs={HOUSE_CATS.map(c => [c.id, c.nome.toUpperCase()] as [string, string])} value={cat} onChange={c => { setCat(c); setMsg(null); }} color="#8a5a2e" />
      <div className="grid gap-2 max-h-[52vh] overflow-auto pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
        {ids.map(id => {
          const have = ownsFurniture(p, id), price = furniturePrice(m, id);
          return (
            <div key={id} className={`rounded border-2 p-1.5 flex flex-col items-center gap-1 ${have ? 'bg-[#eef6e6] border-[#9ac08a]' : 'bg-white border-black/15'}`}>
              <div className="h-[66px] flex items-end"><FurnThumb m={m} id={id} /></div>
              <div className="text-[7px] leading-3 text-center text-[#5a4630] h-[24px] overflow-hidden">{m[id].nome ?? id}</div>
              {have
                ? <span className="text-[8px] text-[#3a8a3a]">TEM</span>
                : <PxButton color="#3a9a5a" disabled={p.coins < price} onClick={() => buy(id)}><Icon id="moeda" size={10} /> {price}</PxButton>}
            </div>
          );
        })}
      </div>
      {msg && <div className="text-[8px] text-[#3a9a5a] mt-2">{msg}</div>}
    </PxPanel>
  );
}
