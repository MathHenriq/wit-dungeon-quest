// Aba AMIGOS da mochila: pedidos recebidos (aceitar/recusar), amigos (visitar a
// casa, ver o cartão) e pedidos enviados. Só com o banco ligado (?social=demo
// mostra dados de mentira).
import { useEffect, useState } from 'react';
import { friendAnswer, friendsList, socialError, socialOn, type FriendRow } from '@/game/social';
import { PxBox, PxButton } from '@/components/pixel/Pixel';
import { LookPortrait } from './ProfileCard';
import { play } from '@/game/sfx';

export function FriendsList({ onVisit, onCard }: { onVisit?: (handle: string, nick: string) => void; onCard?: (handle: string) => void }) {
  const [rows, setRows] = useState<FriendRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => { friendsList().then(setRows).catch(e => { setRows([]); setMsg(socialError(e)); }); };
  useEffect(load, []);
  if (!socialOn()) return <div className="text-[8px] leading-4 text-[#5a5470]">Amizades precisam estar online (com o banco ligado). Toque num colega na cidade para ver o cartão dele e pedir amizade.</div>;
  if (!rows) return <div className="text-[8px] text-[#5a5470]">Carregando...</div>;
  const answer = async (h: string, ok: boolean) => {
    try { await friendAnswer(h, ok); play(ok ? 'coin' : 'drop'); load(); } catch (e) { setMsg(socialError(e)); }
  };
  const group = (estado: FriendRow['estado'], title: string) => {
    const list = rows.filter(r => r.estado === estado);
    if (!list.length) return null;
    return (
      <div className="mb-3">
        <div className="text-[8px] text-[#6a4a2a] mb-1">{title} ({list.length})</div>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {list.map(f => (
            <PxBox key={f.handle} className="flex items-center gap-2">
              <div className="shrink-0 w-[44px] h-[56px] overflow-hidden flex items-end justify-center bg-[#bfe3ec]"><LookPortrait look={f.look} size={40} /></div>
              <button className="min-w-0 flex-1 text-left" onClick={() => onCard?.(f.handle)}>
                <div className="text-[10px] truncate">{f.nick}</div>
                <div className="text-[7px] text-[#5a5470]">ANDAR {f.andar}{f.title ? ` · ${f.title}` : ''}</div>
              </button>
              {estado === 'recebido' && <><PxButton color="#3a9a5a" onClick={() => void answer(f.handle, true)}>ACEITAR</PxButton><PxButton color="#b8433a" onClick={() => void answer(f.handle, false)}>NÃO</PxButton></>}
              {estado === 'amigos' && onVisit && <PxButton color="#c8861a" onClick={() => onVisit(f.handle, f.nick)}>VISITAR</PxButton>}
              {estado === 'enviado' && <PxButton color="#6a6a7a" onClick={() => void answer(f.handle, false)}>CANCELAR</PxButton>}
            </PxBox>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div>
      {!rows.length && <div className="text-[8px] leading-4 text-[#5a5470]">Nenhum amigo ainda. Toque num colega na cidade para ver o cartão dele e pedir amizade.</div>}
      {group('recebido', 'PEDIDOS PARA VOCÊ')}
      {group('amigos', 'AMIGOS')}
      {group('enviado', 'PEDIDOS ENVIADOS')}
      {msg && <div className="text-[8px] text-[#b8433a]">{msg}</div>}
    </div>
  );
}
