// Balcão "Troca de prêmios" do shopping: Recompensas da Sala (room-rewards.ts).
// Comprar gera um ticket com código; o professor entrega na aula com um toque.
import { useState } from 'react';
import { buyReward, cancelTicket, MAX_PENDING, pending, REWARD_BY_ID, ROOM_REWARDS } from '@/game/room-rewards';
import { loadProgress, saveProgress, type Progress } from '@/game/progress';
import { cloudBuyReward, cloudCancelTicket, cloudEnabled } from '@/game/cloud';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { PxBox, PxButton, PxPanel } from '@/components/pixel/Pixel';

const today = () => Math.floor(Date.now() / 86_400_000);

export function RoomRewards({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [, redraw] = useState(0);
  const p = loadProgress();
  const buy = async (id: string) => {
    const r = buyReward(loadProgress(), id, today(), Math.floor(Math.random() * 1e9));
    if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
    // com o banco ligado: o código e a cobrança são do servidor
    if (cloudEnabled()) {
      const c = await cloudBuyReward(id);
      if ('reason' in c) { setMsg(c.reason); play('lose'); return; }
      r.ticket.code = c.code;
      r.progress = { ...r.progress, coins: c.coins, tickets: [r.ticket, ...loadProgress().tickets].slice(0, 30) };
    }
    saveProgress(r.progress); play('coin');
    setMsg(`Ticket ${r.ticket.code}: mostre ao professor na próxima aula.`);
    redraw(x => x + 1);
  };
  const cancel = async (code: string) => {
    let next = cancelTicket(loadProgress(), code);
    if (cloudEnabled()) {
      const c = await cloudCancelTicket(code);
      if ('reason' in c) { setMsg(c.reason); return; }
      next = { ...next, coins: c.coins };
    }
    saveProgress(next); play('drop'); setMsg('Ticket cancelado, moedas devolvidas.'); redraw(x => x + 1);
  };
  const wait = pending(p);
  return (
    <PxPanel title="RECOMPENSAS DA SALA" color="#3a9a5a" coins={p.coins ?? progress.coins} onClose={onClose} width={760}>
      <div className="text-[8px] leading-4 text-[#6a4a2a] mb-3">Troque moedas por um prêmio de verdade na aula. Você recebe um ticket com código; o professor entrega com um toque.</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {ROOM_REWARDS.map(r => (
          <PxBox key={r.id} className="flex items-center gap-2">
            <Icon id={r.icone} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] leading-4">{r.nome}</div>
              <div className="text-[7px] leading-3 text-[#7a5a34]">{r.sobre}</div>
            </div>
            <PxButton color="#3a9a5a" disabled={p.coins < r.preco || wait.length >= MAX_PENDING} onClick={() => buy(r.id)}>
              <span className="flex items-center gap-1"><Icon id="moeda" size={12} />{r.preco}</span>
            </PxButton>
          </PxBox>
        ))}
      </div>
      {msg && <div className="mt-2 text-[9px] text-[#2a7a3a]">{msg}</div>}
      <div className="mt-3 text-[9px]">MEUS TICKETS ({wait.length}/{MAX_PENDING} esperando)</div>
      <div className="mt-1 grid gap-1">
        {!p.tickets.length && <div className="text-[8px] text-[#7a5a34]">Nenhum ainda.</div>}
        {p.tickets.slice(0, 8).map(t => (
          <div key={t.code} className="flex items-center gap-2 text-[8px]">
            <span className="px-2 py-0.5 bg-[#2e2a40] text-[#ffd84a] tracking-widest">{t.code}</span>
            <span className="flex-1">{REWARD_BY_ID.get(t.reward)?.nome ?? t.reward}</span>
            {t.entregue ? <span className="text-[#2a7a3a]">ENTREGUE</span> : <>
              <span className="text-[#b0721e]">ESPERANDO O PROFESSOR</span>
              <PxButton color="#b8433a" onClick={() => cancel(t.code)}>CANCELAR</PxButton>
            </>}
          </div>
        ))}
      </div>
    </PxPanel>
  );
}
