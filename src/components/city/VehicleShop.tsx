// Estação de veículos (praça da Cidade WIT): compra, escolhe qual montar
// (tecla V na cidade) e explica as regras (vehicles.ts). O desenho do boneco
// montado chega com a arte do GPT; até lá o veículo aparece como rastro.
import { useState } from 'react';
import { buyVehicle, VEHICLES, type VehicleId } from '@/game/vehicles';
import { loadProgress, saveProgress } from '@/game/progress';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { PxBox, PxButton, PxPanel } from '@/components/pixel/Pixel';

/** Quantas vezes mais rápido que andar a pé (230 ms por bloco). */
const speed = (ms: number) => (230 / ms).toFixed(1).replace('.', ',');

export function VehicleShop({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [, redraw] = useState(0);
  const p = loadProgress();
  const buy = (id: VehicleId) => {
    const r = buyVehicle(loadProgress(), id);
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    saveProgress(r.progress); play('coin'); setMsg('Comprado! Aperte V na rua para montar.'); redraw(x => x + 1); onChange();
  };
  const pick = (id: VehicleId) => { saveProgress({ ...loadProgress(), veiculo: id }); play('click'); redraw(x => x + 1); onChange(); };
  return (
    <PxPanel title="ESTAÇÃO DE VEÍCULOS" color="#3a78c8" coins={p.coins} onClose={onClose} width={760}>
      <div className="text-[8px] leading-4 text-[#6a4a2a] mb-3">Veículo só anda em rua, calçada e caminho de terra. Com fome não dá para pilotar. Aperte <b>V</b> para montar e descer.</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {VEHICLES.map(v => {
          const has = p.veiculos.includes(v.id), on = p.veiculo === v.id;
          return (
            <PxBox key={v.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px]"><span>{v.name}</span>{has && on && !v.flies && <span className="text-[#2a7a3a]">ESCOLHIDO</span>}</div>
              <div className="text-[7px] leading-3 text-[#7a5a34]">{v.about}</div>
              <div className="text-[7px] text-[#5a4a34]">{v.flies ? 'Viagem rápida pelo mapa voando' : `${speed(v.msPerTile)}× mais rápido que a pé`}</div>
              <div className="flex justify-end">
                {!has && <PxButton color="#3a9a5a" disabled={p.coins < v.price} onClick={() => buy(v.id)}><span className="flex items-center gap-1"><Icon id="moeda" size={12} />{v.price}</span></PxButton>}
                {has && !v.flies && !on && <PxButton color="#3a78c8" onClick={() => pick(v.id)}>USAR ESTE</PxButton>}
                {has && v.flies && <span className="text-[8px] text-[#2a7a3a]">NO MAPA: VOAR</span>}
              </div>
            </PxBox>
          );
        })}
      </div>
      {msg && <div className="mt-2 text-[9px] text-[#2a7a3a]">{msg}</div>}
    </PxPanel>
  );
}
