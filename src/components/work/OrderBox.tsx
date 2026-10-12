// Encomenda da profissão: pega o pedido de um morador e leva o que você fez
// (disco, pão, peixe, ovos) até a porta dele, em qualquer área do mapa.
import { useState } from 'react';
import { cancelDelivery, orderItems, orderOf, takeOrder } from '@/game/deliveries';
import { PROF_BY_ID, type ProfId } from '@/game/professions';
import { saveProgress, type Progress } from '@/game/progress';
import { itemIcon } from '@/game/items';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';

export function OrderBox({ prof, progress, zone, dark }: { prof: ProfId; progress: Progress; zone?: string; dark?: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const order = orderOf(prof);
  if (!order) return null;
  const e = progress.entrega;
  const have = orderItems(progress, order.item);
  const sub = dark ? 'text-white/70' : 'text-[#5a5470]';
  return (
    <div className={`rounded-lg border-2 p-3 text-[9px] leading-5 ${dark ? 'border-white/20 bg-white/5' : 'border-[#c8c0ac] bg-white'}`}>
      <div className="mb-1">ENCOMENDAS · {PROF_BY_ID.get(prof)!.name.toUpperCase()}</div>
      <div className={`text-[8px] leading-4 ${sub}`}>Um morador pede {order.what}. Leve até a porta dele, em qualquer área, antes do tempo acabar: moedas e experiência de {PROF_BY_ID.get(prof)!.name}.</div>
      <div className="flex items-center gap-2 mt-2 text-[8px]">
        <span className={sub}>Na mochila:</span>
        {have.length ? have.slice(0, 5).map(id => <Icon key={id} id={itemIcon(id)} size={20} />) : <span className="text-[#e8485a]">nada que sirva (faça primeiro!)</span>}
      </div>
      {e ? (
        <div className="mt-2">
          <div>Entrega em andamento: <b>{e.nome}</b>{e.zona !== zone ? ' (outra área)' : ''}</div>
          <button onClick={() => { saveProgress(cancelDelivery(progress)); setMsg('Encomenda cancelada.'); }} className="mt-1 px-2 py-1 rounded bg-[#4a4660] text-white text-[8px]">CANCELAR</button>
        </div>
      ) : (
        <button onClick={() => {
          const r = takeOrder(progress, prof, Math.random(), Date.now());
          if ('reason' in r) { setMsg(r.reason); return; }
          saveProgress(r.progress); play('drop');
          setMsg(`"${order.lines[0]}" Leve até: ${r.dest.nome}.`);
        }} className="mt-2 px-3 py-2 rounded bg-[#3a9a5a] text-white text-[9px]">PEGAR ENCOMENDA</button>
      )}
      {msg && <div className="mt-2 text-[8px] text-[#3a9a5a]">{msg}</div>}
    </div>
  );
}
