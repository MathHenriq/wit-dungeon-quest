// Central de trocas (Oficina de Cartas e cartão de perfil): OFERTAS recebidas
// e enviadas, PROPOR uma troca a um colega (só repetidas, com o selo de troca
// justa), VITRINE da turma (comprar) e VENDER uma repetida (preço na faixa).
import { useEffect, useMemo, useState } from 'react';
import { buyListing, friendsList, listCard, socialOn, tradeAnswer, tradeCancel, tradeError, tradeOffer, tradesMine, tradeView, unlist, vitrine, type FriendRow, type Listing, type TradeRow } from '@/game/social';
import { bagSize, checkOffer, fairness, PRICE_BANDS, priceOk, sideValue, spareOf, suggestedPrice, TRADE_MAX_COINS, type CardBag } from '@/game/trades';
import { loadProgress, saveProgress } from '@/game/progress';
import { refreshValues } from '@/game/cloud';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { RARITY_ORDER } from '@/lib/tcg/opponents';
import { RARITY_PT } from '@/lib/tcg/labels';
import { TcgCard } from '@/components/tcg/TcgCard';
import { PxBox, PxButton, PxPanel, PxTabs } from '@/components/pixel/Pixel';
import { Icon } from '@/components/Icon';
import { play } from '@/game/sfx';

type Tab = 'ofertas' | 'propor' | 'vitrine' | 'vender';
const byRarity = (ids: string[]) => ids.filter(id => CARD_BY_ID.has(id))
  .sort((a, b) => RARITY_ORDER.indexOf(CARD_BY_ID.get(b)!.rarity) - RARITY_ORDER.indexOf(CARD_BY_ID.get(a)!.rarity));

function BagLine({ cards, coins }: { cards: Record<string, number>; coins: number }) {
  const parts = Object.entries(cards).map(([id, n]) => `${n}× ${CARD_BY_ID.get(id)?.name ?? id}`);
  if (coins) parts.push(`${coins} moedas`);
  return <span>{parts.join(' + ') || 'nada'}</span>;
}

/** Grade de cartas para escolher quantas de cada (até `max` de cada). */
function Picker({ have, chosen, onChange }: { have: CardBag; chosen: CardBag; onChange: (b: CardBag) => void }) {
  const ids = byRarity(Object.keys(have).filter(id => have[id] > 0));
  if (!ids.length) return <div className="text-[7px] text-[#6a4a2a]">Nenhuma carta repetida.</div>;
  return (
    <div className="grid grid-cols-4 gap-1.5 max-h-[230px] overflow-auto pr-1">
      {ids.map(id => {
        const n = chosen[id] ?? 0;
        return (
          <button key={id} onClick={() => onChange({ ...chosen, [id]: n >= have[id] ? 0 : n + 1 })}
            className={`relative rounded ${n ? 'ring-2 ring-[#e8a020]' : 'opacity-80'}`}>
            <TcgCard card={CARD_BY_ID.get(id)!} />
            <span className="absolute top-1 right-1 px-1 rounded bg-black/70 text-white text-[8px]">{n ? `${n}/` : ''}{have[id]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TradeHub({ onClose, target, start }: { onClose: () => void; target?: string; start?: Tab }) {
  const [tab, setTab] = useState<Tab>(start ?? (target ? 'propor' : 'ofertas'));
  const [msg, setMsg] = useState<string | null>(null);
  const [p, setP] = useState(loadProgress);
  const [trades, setTrades] = useState<TradeRow[] | null>(null);
  const [shop, setShop] = useState<Listing[] | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  // propor
  const [who, setWho] = useState<string | undefined>(target);
  const [their, setTheir] = useState<{ nick: string; spare: CardBag } | null>(null);
  const [give, setGive] = useState<CardBag>({});
  const [want, setWant] = useState<CardBag>({});
  const [giveCoins, setGiveCoins] = useState(0);
  const [wantCoins, setWantCoins] = useState(0);
  // vender
  const [sellId, setSellId] = useState<string | null>(null);
  const [price, setPrice] = useState(0);

  const reload = () => {
    tradesMine().then(setTrades).catch(e => setMsg(tradeError(e)));
    vitrine().then(setShop).catch(() => setShop([]));
  };
  useEffect(reload, []);
  useEffect(() => { friendsList().then(f => setFriends(f.filter(x => x.estado === 'amigos'))).catch(() => undefined); }, []);
  useEffect(() => {
    setTheir(null); setWant({});
    if (who) tradeView(who).then(setTheir).catch(e => setMsg(tradeError(e)));
  }, [who]);
  const values = async () => { const next = await refreshValues(loadProgress()); saveProgress(next); setP(next); };
  const run = async (f: () => Promise<unknown>, ok: string) => {
    try { await f(); setMsg(ok); play('coin'); reload(); await values(); } catch (e) { setMsg(tradeError(e)); play('lose'); }
  };

  const mySpare = useMemo(() => Object.fromEntries(Object.keys(p.collection).map(id => [id, spareOf(p.collection, id)]).filter(([, n]) => (n as number) > 0)) as CardBag, [p]);
  const problem = their ? checkOffer(p.collection, give, giveCoins, p.coins, their.spare, want, wantCoins) : 'Escolha um colega.';
  const fair = fairness(sideValue(give, giveCoins), sideValue(want, wantCoins));
  const open = trades?.filter(t => t.aberta) ?? [];

  return (
    <PxPanel title="TROCAS E VITRINE" color="#3a78c8" coins={p.coins} onClose={onClose} width={900}>
      {!socialOn() ? (
        <div className="text-[8px] leading-4 text-[#6a4a2a]">Trocas e Vitrine precisam estar online (com o banco ligado). Só cartas repetidas entram: a primeira cópia sempre fica no seu álbum.</div>
      ) : (
        <>
          <PxTabs<Tab> tabs={[['ofertas', `OFERTAS${open.filter(t => t.eu === 'recebi').length ? ` (${open.filter(t => t.eu === 'recebi').length})` : ''}`], ['propor', 'PROPOR TROCA'], ['vitrine', 'VITRINE'], ['vender', 'VENDER']]}
            value={tab} onChange={t => { setTab(t); setMsg(null); }} color="#3a78c8" />
          {tab === 'ofertas' && (
            <div className="flex flex-col gap-1.5">
              {!trades && <div className="text-[8px]">Carregando...</div>}
              {trades && !trades.length && <div className="text-[8px] text-[#6a4a2a]">Nenhuma oferta. Toque num colega na cidade e escolha TROCAR, ou use PROPOR TROCA.</div>}
              {trades?.map(t => (
                <PxBox key={t.id} className="flex flex-wrap items-center gap-2 text-[8px] leading-4">
                  <div className="flex-1 min-w-[260px]">
                    <div className="text-[9px]">{t.eu === 'recebi' ? `${t.com?.nick ?? '?'} quer trocar com você` : `Você ofereceu para ${t.com?.nick ?? '?'}`}{!t.aberta && ` · ${t.status.toUpperCase()}`}</div>
                    <div>Você dá: <BagLine cards={t.daCards} coins={t.daCoins} /></div>
                    <div>Você recebe: <BagLine cards={t.recebeCards} coins={t.recebeCoins} /></div>
                  </div>
                  {t.aberta && t.eu === 'recebi' && <>
                    <PxButton color="#3a9a5a" onClick={() => void run(() => tradeAnswer(t.id, true), 'Troca feita!')}>ACEITAR</PxButton>
                    <PxButton color="#b8433a" onClick={() => void run(() => tradeAnswer(t.id, false), 'Troca recusada.')}>RECUSAR</PxButton>
                  </>}
                  {t.aberta && t.eu === 'ofereci' && <PxButton color="#6a6a7a" onClick={() => void run(() => tradeCancel(t.id), 'Oferta cancelada.')}>CANCELAR</PxButton>}
                </PxBox>
              ))}
            </div>
          )}
          {tab === 'propor' && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
                <span>COM:</span>
                {friends.map(f => (
                  <PxButton key={f.handle} color={who === f.handle ? '#3a78c8' : '#8a8aa0'} onClick={() => setWho(f.handle)}>{f.nick}</PxButton>
                ))}
                {who && !friends.some(f => f.handle === who) && <PxButton color="#3a78c8">{their?.nick ?? '...'}</PxButton>}
                {!friends.length && !who && <span className="text-[#6a4a2a]">Toque num colega na cidade e escolha TROCAR (ou adicione amigos).</span>}
              </div>
              {their && (
                <div className="grid md:grid-cols-2 gap-2">
                  <PxBox>
                    <div className="text-[9px] mb-1">VOCÊ DÁ ({bagSize(give)}/5)</div>
                    <Picker have={mySpare} chosen={give} onChange={setGive} />
                    <label className="flex items-center gap-1 mt-1.5 text-[8px]"><Icon id="moeda" size={12} /> moedas:
                      <input type="number" min={0} max={TRADE_MAX_COINS} value={giveCoins} onChange={e => setGiveCoins(Math.max(0, Math.min(TRADE_MAX_COINS, Math.floor(+e.target.value || 0))))} className="w-20 px-1 border rounded bg-white text-[#2e2a40]" />
                    </label>
                  </PxBox>
                  <PxBox>
                    <div className="text-[9px] mb-1">VOCÊ RECEBE DE {their.nick.toUpperCase()} ({bagSize(want)}/5)</div>
                    <Picker have={their.spare} chosen={want} onChange={setWant} />
                    <label className="flex items-center gap-1 mt-1.5 text-[8px]"><Icon id="moeda" size={12} /> moedas:
                      <input type="number" min={0} max={TRADE_MAX_COINS} value={wantCoins} onChange={e => setWantCoins(Math.max(0, Math.min(TRADE_MAX_COINS, Math.floor(+e.target.value || 0))))} className="w-20 px-1 border rounded bg-white text-[#2e2a40]" />
                    </label>
                  </PxBox>
                </div>
              )}
              {their && (
                <div className="flex flex-wrap items-center gap-2 text-[8px]">
                  <span className={`px-2 py-1 rounded ${fair === 'justa' ? 'bg-[#3a9a5a]' : 'bg-[#c8861a]'} text-white`}>
                    {fair === 'justa' ? 'TROCA JUSTA' : fair === 'voce-da-mais' ? 'VOCÊ ESTÁ DANDO MAIS' : 'VOCÊ ESTÁ PEDINDO MAIS'}
                  </span>
                  <PxButton color="#3a78c8" disabled={!!problem}
                    onClick={() => void run(async () => { await tradeOffer(who!, give, giveCoins, want, wantCoins); setGive({}); setWant({}); setGiveCoins(0); setWantCoins(0); }, 'Oferta enviada! O colega vê em OFERTAS.')}>ENVIAR OFERTA</PxButton>
                  {problem && <span className="text-[#6a4a2a]">{problem}</span>}
                </div>
              )}
            </div>
          )}
          {tab === 'vitrine' && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {!shop?.length && <div className="col-span-full text-[8px] text-[#6a4a2a]">Ninguém da turma está vendendo agora.</div>}
              {shop?.map(l => (
                <div key={l.id} className="flex flex-col gap-1">
                  <TcgCard card={CARD_BY_ID.get(l.card)!} />
                  <div className="text-[7px] text-center">{l.minha ? 'SUA' : l.nick} · <Icon id="moeda" size={10} /> {l.price}</div>
                  {l.minha
                    ? <PxButton color="#6a6a7a" onClick={() => void run(() => unlist(l.id), 'A carta voltou para o seu álbum.')}>TIRAR</PxButton>
                    : <PxButton color="#3a9a5a" disabled={p.coins < l.price} onClick={() => void run(() => buyListing(l.id), 'Comprada! Está no seu álbum.')}>COMPRAR</PxButton>}
                </div>
              ))}
            </div>
          )}
          {tab === 'vender' && (
            <div className="grid md:grid-cols-[1fr_240px] gap-2">
              <PxBox>
                <div className="text-[9px] mb-1">SUAS CARTAS REPETIDAS</div>
                <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-auto pr-1">
                  {byRarity(Object.keys(mySpare)).map(id => (
                    <button key={id} onClick={() => { setSellId(id); setPrice(suggestedPrice(id)); }} className={`rounded ${sellId === id ? 'ring-2 ring-[#e8a020]' : ''}`}>
                      <TcgCard card={CARD_BY_ID.get(id)!} />
                    </button>
                  ))}
                </div>
                {!Object.keys(mySpare).length && <div className="text-[7px] text-[#6a4a2a]">Nenhuma carta repetida para vender.</div>}
              </PxBox>
              {sellId && (
                <PxBox>
                  <div className="text-[9px] mb-1">{CARD_BY_ID.get(sellId)!.name}</div>
                  <div className="text-[7px] leading-4 text-[#6a4a2a] mb-1">
                    {RARITY_PT[CARD_BY_ID.get(sellId)!.rarity]}: de {PRICE_BANDS[CARD_BY_ID.get(sellId)!.rarity][0]} a {PRICE_BANDS[CARD_BY_ID.get(sellId)!.rarity][1]} moedas.
                    A carta sai do álbum enquanto estiver à venda.
                  </div>
                  <input type="number" value={price} onChange={e => setPrice(Math.floor(+e.target.value || 0))} className="w-full px-2 py-1 border rounded text-[10px] mb-2 bg-white text-[#2e2a40]" />
                  <PxButton color="#3a9a5a" disabled={!priceOk(sellId, price)} onClick={() => void run(async () => { await listCard(sellId, price); setSellId(null); }, 'À venda na Vitrine da turma!')}>PÔR À VENDA</PxButton>
                </PxBox>
              )}
            </div>
          )}
        </>
      )}
      {msg && <div className="text-[8px] text-[#3a78c8] mt-2">{msg}</div>}
    </PxPanel>
  );
}
