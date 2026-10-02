// Telas do dia a dia: mochila (comer, irrigador), profissões, missões do dia,
// Mercado Central, cozinha da Casa da Fazenda e Central de Entregas.
import { earnedTitles, visibleTitles } from '@/game/titles';
import { useState } from 'react';
import { canCook, chooseProfession, cook, craftIrrigator, eat, gainXp, RECIPES, SENSORS_PER_IRRIG } from '@/game/life';
import { buy, buyPrice, MARKET_SELLS, marketPrice, sell, sellable, trend } from '@/game/market';
import { claimMission, missionProgress, missionsOf, syncMissions } from '@/game/missions';
import { PROFESSIONS, TITLES, levelOf } from '@/game/professions';
import { itemDef, itemIcon, itemLabel, type ItemKind } from '@/game/items';
import { loadFarm, saveFarm, MAX_IRRIG } from '@/game/farm';
import { cancelDelivery, deliveryTerms, takeDelivery } from '@/game/deliveries';
import { saveProgress, type Progress } from '@/game/progress';
import { today } from '@/game/life';
import { play } from '@/game/sfx';
import { HungerBar, LevelBar, Shell, Tabs } from './Shell';
import { Icon } from '@/components/Icon';
import { LineChart } from './Charts';
import { CHART_ITEMS, dayLabel, priceSeries } from '@/game/charts';

const KIND_ORDER: [ItemKind, string][] = [['comida', 'COMIDA'], ['produto', 'FEITO NO TRABALHO'], ['peixe', 'PEIXES'], ['colheita', 'COLHEITA'], ['fazenda', 'DA FAZENDA'], ['semente', 'SEMENTES']];
const Msg = ({ msg }: { msg: string | null }) => (msg ? <div className="mt-3 text-[9px] text-[#3a9a5a]">{msg}</div> : null);

// ─── Profissões (Núcleo WIT e mochila) ──────────────────────────────────────

export function ProfessionsList({ progress, onMsg }: { progress: Progress; onMsg: (m: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-[8px] leading-4 text-[#5a5470] mb-1">Qualquer um faz qualquer trabalho e ganha experiência nele. O CARGO escolhido dá um bônus (troque quando quiser; a experiência fica guardada).</div>
      {PROFESSIONS.map(p => {
        const mine = progress.profissao === p.id;
        return (
          <div key={p.id} className={`rounded-lg border-2 p-2 ${mine ? 'bg-[#fff8e0] border-[#e8a020]' : 'bg-white border-[#e0d8c4]'}`}>
            <div className="flex items-center gap-2">
              <Icon id={p.icon} size={24} />
              <div className="flex-1 text-[9px]">{p.name}{p.course && <span className="text-[7px] text-[#5a5470]"> · curso de {p.course}</span>}</div>
              {mine ? <span className="text-[8px] text-[#e8a020]">SEU CARGO</span>
                : <button onClick={() => { saveProgress(chooseProfession(progress, p.id)); play('coin'); onMsg(`Agora você é ${p.name}!`); }} className="px-2 py-1 rounded bg-[#3c56b0] text-white text-[7px]">ESCOLHER</button>}
            </div>
            <div className="text-[7px] leading-4 text-[#5a5470] mt-1">{p.place} · {p.how}</div>
            <div className="text-[7px] leading-4 text-[#3a7a3a]">Bônus: {p.perk}</div>
            <div className="mt-1"><LevelBar xp={progress.xp[p.id] ?? 0} /></div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Missões do dia ─────────────────────────────────────────────────────────

export function MissionsList({ progress, onMsg }: { progress: Progress; onMsg: (m: string) => void }) {
  const p = syncMissions(progress);
  const ms = missionsOf(today());
  return (
    <div className="grid gap-2">
      <div className="text-[8px] leading-4 text-[#5a5470]">Três missões por dia, iguais para a turma toda. Viram à meia-noite.</div>
      {ms.map(m => {
        const n = missionProgress(p, m), done = p.missoes.feitas.includes(m.id);
        return (
          <div key={m.id} className={`rounded-lg border-2 p-2 ${done ? 'bg-[#e8f0e0] border-[#3a9a5a]' : 'bg-white border-[#e0d8c4]'}`}>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex-1">{done ? 'FEITO · ' : ''}{m.text}</span>
              <span className="text-[#8a6a1a] flex items-center gap-1"><Icon id="moeda" size={12} /> {m.reward}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 rounded bg-black/15 overflow-hidden"><div className="h-full bg-[#3a9a5a]" style={{ width: `${(n / m.target) * 100}%` }} /></div>
              <span className="text-[8px]">{n}/{m.target}</span>
              {!done && n >= m.target && (
                <button onClick={() => { const r = claimMission(progress, m.id); if (r.ok) { saveProgress(r.progress); play('coin'); onMsg(`Missão cumprida! +${r.coins} moedas`); } }}
                  className="px-2 py-1 rounded bg-[#e8a020] text-white text-[8px] animate-pulse">RECEBER</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mochila ────────────────────────────────────────────────────────────────

export function Backpack({ progress, onClose, start = 'mochila' }: { progress: Progress; onClose: () => void; start?: 'mochila' | 'cargos' | 'missoes' | 'titulos' }) {
  const [tab, setTab] = useState(start);
  const [msg, setMsg] = useState<string | null>(null);
  const ids = Object.keys(progress.itens).filter(k => progress.itens[k] > 0 && itemDef(k));
  const prof = PROFESSIONS.find(p => p.id === progress.profissao);
  const p = syncMissions(progress);
  const ready = missionsOf(today()).filter(m => !p.missoes.feitas.includes(m.id) && missionProgress(p, m) >= m.target).length;

  const doEat = (id: string) => {
    const r = eat(progress, id);
    if ('reason' in r) { setMsg(r.reason); return; }
    saveProgress(r.progress); play('coin'); setMsg(`Nham! +${Math.round(r.gain)} de barriga`);
  };
  const install = () => {
    const f = loadFarm();
    if (f.irrig >= MAX_IRRIG) { setMsg(`A fazenda já tem ${MAX_IRRIG} irrigadores.`); return; }
    saveFarm({ ...f, irrig: f.irrig + 1 });
    saveProgress({ ...progress, itens: { ...progress.itens, irrigador: (progress.itens.irrigador ?? 1) - 1 } });
    play('super'); setMsg(`Irrigador instalado na Fazenda do Vale (${f.irrig + 1}/${MAX_IRRIG}). Ele rega sozinho quando o dia vira.`);
  };
  const craft = () => {
    const r = craftIrrigator(progress);
    if ('reason' in r) { setMsg(r.reason); return; }
    saveProgress(r.progress); play('super'); setMsg('Você montou um Irrigador Automático!');
  };

  return (
    <Shell title="MOCHILA" color="#8a5a2e" coins={progress.coins} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[8px]">
        <HungerBar v={progress.fome} />
        <span>{Math.round(progress.fome)}/100</span>
        <span className="ml-auto flex items-center gap-1">{prof ? <><Icon id={prof.icon} size={16} /> {prof.name} · {TITLES[levelOf(progress.xp[prof.id] ?? 0).level - 1]}</> : 'Sem cargo: escolha no Núcleo WIT'}</span>
      </div>
      <Tabs tabs={[['mochila', 'ITENS'], ['cargos', 'PROFISSÕES'], ['missoes', `MISSÕES${ready ? ` (${ready}!)` : ''}`], ['titulos', `TÍTULOS ${earnedTitles(progress).length}/${visibleTitles(progress).length}`]]} value={tab} onChange={t => { setTab(t); setMsg(null); }} color="#8a5a2e" />
      {tab === 'mochila' && (
        <div>
          {!ids.length && <div className="text-[8px] leading-4 text-[#5a5470]">A mochila está vazia. Pesque, plante, trabalhe nos prédios da Cidade WIT ou compre comida na Padaria e no Mercado.</div>}
          {KIND_ORDER.map(([kind, label]) => {
            const list = ids.filter(id => itemDef(id)!.kind === kind);
            if (!list.length) return null;
            return (
              <div key={kind} className="mb-3">
                <div className="text-[8px] text-[#8a5a2e] mb-1">{label}</div>
                <div className="grid sm:grid-cols-2 gap-1">
                  {list.map(id => {
                    const d = itemDef(id)!;
                    return (
                      <div key={id} className="flex items-center gap-2 px-2 py-1 rounded bg-white border border-[#e0d8c4]">
                        <Icon id={d.icon} size={28} />
                        <span className="flex-1 text-[8px] leading-4">{d.name} ×{progress.itens[id]}{d.food ? <span className="text-[#5a5470]"> · +{d.food}</span> : null}</span>
                        {d.food ? <button onClick={() => doEat(id)} className="px-2 py-1 rounded bg-[#e8a020] text-white text-[7px]">COMER</button> : null}
                        {id === 'irrigador' && <button onClick={install} className="px-2 py-1 rounded bg-[#2a9a5a] text-white text-[7px]">INSTALAR</button>}
                        {id === 'sensor' && (progress.itens.sensor ?? 0) >= SENSORS_PER_IRRIG && <button onClick={craft} className="px-2 py-1 rounded bg-[#2a7ac8] text-white text-[7px]">MONTAR IRRIGADOR</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="text-[7px] leading-4 text-[#5a5470]">A barriga esvazia andando (correndo, o dobro). Com fome você não corre. A fome nunca atrapalha os duelos.</div>
        </div>
      )}
      {tab === 'cargos' && <ProfessionsList progress={progress} onMsg={setMsg} />}
      {tab === 'missoes' && <MissionsList progress={progress} onMsg={setMsg} />}
      {tab === 'titulos' && (
        <div>
          <div className="text-[8px] leading-4 text-[#5a5470] mb-2">O título aparece na plaquinha em cima do seu personagem. Toque num que você já ganhou para usar.</div>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {visibleTitles(progress).map(t => {
              const got = t.has(progress), on = progress.titulo === t.id && got, pr = t.progress?.(progress);
              return (
                <button key={t.id} disabled={!got} onClick={() => { saveProgress({ ...progress, titulo: t.id }); play('click'); setMsg(`Título: ${t.name}`); }}
                  className={`text-left px-2 py-1.5 rounded border-2 ${on ? 'border-[#e8a020] bg-[#fff4dc]' : got ? 'border-[#d8d0c0] bg-white' : 'border-dashed border-[#d8d0c0] bg-[#f6f2e8] opacity-70'}`}>
                  <div className="text-[9px]">{t.name}{on && <span className="text-[#e8a020]"> · EM USO</span>}</div>
                  <div className="text-[7px] leading-4 text-[#5a5470]">{t.how}{!got && pr ? ` (${pr[0]}/${pr[1]})` : ''}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Msg msg={msg} />
    </Shell>
  );
}

// ─── Mercado Central ────────────────────────────────────────────────────────

const ARROW = { sobe: <span className="text-[#3a9a5a]">▲</span>, desce: <span className="text-[#e8485a]">▼</span>, igual: <span className="text-[#8a8a94]">●</span> };

export function MarketPanel({ progress, onClose, onWork }: { progress: Progress; onClose: () => void; onWork?: () => void }) {
  const [tab, setTab] = useState<'vender' | 'comprar' | 'grafico'>('vender');
  const [chartItem, setChartItem] = useState<string>(() => sellable(progress).find(i => CHART_ITEMS.includes(i)) ?? 'pao');
  const [msg, setMsg] = useState<string | null>(null);
  const items = sellable(progress).sort((a, b) => marketPrice(progress, b) - marketPrice(progress, a));
  const doSell = (id: string, n: number) => {
    const r = sell(progress, id, n);
    const g = gainXp(r.progress, 'comerciante', Math.max(1, Math.round(r.coins / 4)));
    saveProgress(g.progress); play('coin');
    setMsg(`Vendido! +${r.coins} moedas${g.levelUp ? ` · Comerciante subiu para o nível ${g.levelUp}!` : ''}`);
  };
  const doBuy = (id: string) => {
    const r = buy(progress, id);
    if ('reason' in r) { setMsg(r.reason); return; }
    saveProgress(r.progress); play('coin'); setMsg(`+1 ${itemLabel(id)}`);
  };
  return (
    <Shell title="MERCADO CENTRAL" color="#c8762a" coins={progress.coins} onClose={onClose}>
      <div className="text-[8px] leading-4 text-[#5a5470] mb-2">Os preços mudam todo dia (▲ subiu, ▼ caiu). Vender muito da mesma coisa enche o mercado e o preço cai; ele esvazia aos poucos.</div>
      <Tabs tabs={[['vender', 'VENDER'], ['comprar', 'COMPRAR'], ['grafico', 'GRÁFICOS']]} value={tab} onChange={t => { setTab(t); setMsg(null); }} color="#c8762a" />
      {tab === 'grafico' && (
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {[...new Set([...sellable(progress).filter(i => (itemDef(i)?.price ?? 0) > 0), ...CHART_ITEMS])].slice(0, 14).map(id => (
              <button key={id} onClick={() => setChartItem(id)} title={itemLabel(id)}
                className={`p-1 rounded border-2 ${chartItem === id ? 'border-[#c8762a] bg-[#fff1dc]' : 'border-[#e0d8c4] bg-white'}`}><Icon id={itemIcon(id)} size={24} /></button>
            ))}
          </div>
          <div className="rounded-lg bg-white border-2 border-[#e0d8c4] p-2">
            <div className="text-[8px] mb-1">{itemLabel(chartItem)} · preço normal nos últimos 10 dias</div>
            <LineChart series={priceSeries(chartItem, today())} labels={Array.from({ length: 10 }, (_, k) => dayLabel(k, 10))} />
          </div>
          <div className="text-[8px] leading-4 text-[#5a5470] mt-2">Venda quando a linha estiver no alto. O preço muito acima do normal costuma voltar para o meio.</div>
          {onWork && <button onClick={onWork} className="mt-2 w-full py-2.5 rounded-lg bg-[#c8762a] text-white text-[10px] border-b-4 border-[#8a4a10]">TRABALHAR: LER O GRÁFICO (Comerciante)</button>}
        </div>
      )}
      {tab === 'vender' && (
        <div>
          {!items.length && <div className="text-[8px] text-[#5a5470]">Nada para vender. Peixes, colheitas, ovos, discos, quadros, sensores... tudo vende aqui.</div>}
          {items.map(id => {
            const price = marketPrice(progress, id), base = itemDef(id)!.price;
            return (
              <div key={id} className="flex items-center gap-2 py-1.5 border-b border-[#e0d8c4]">
                <Icon id={itemIcon(id)} size={28} />
                <div className="flex-1 text-[8px] leading-4">{itemLabel(id)} ×{progress.itens[id]}<br /><span className="text-[#5a5470]">hoje {price} <Icon id="moeda" size={10} /> {ARROW[trend(id)]} · normal {base}</span></div>
                <button onClick={() => doSell(id, 1)} className="px-2 py-1 rounded bg-[#3a9a5a] text-white text-[7px]">VENDER 1</button>
                {(progress.itens[id] ?? 0) > 1 && <button onClick={() => doSell(id, progress.itens[id])} className="px-2 py-1 rounded bg-[#2a7a4a] text-white text-[7px]">TODOS</button>}
              </div>
            );
          })}
        </div>
      )}
      {tab === 'comprar' && MARKET_SELLS.map(id => (
        <div key={id} className="flex items-center gap-2 py-1.5 border-b border-[#e0d8c4]">
          <Icon id={itemIcon(id)} size={28} />
          <div className="flex-1 text-[8px]">{itemLabel(id)} <span className="text-[#5a5470]">· tem {progress.itens[id] ?? 0}{itemDef(id)?.food ? ` · +${itemDef(id)!.food} barriga` : ''}</span></div>
          <button onClick={() => doBuy(id)} className="px-2 py-1.5 rounded bg-[#c8762a] text-white text-[8px]">{buyPrice(id)} <Icon id="moeda" size={10} /></button>
        </div>
      ))}
      <Msg msg={msg} />
    </Shell>
  );
}

// ─── Cozinha (Casa da Fazenda) ──────────────────────────────────────────────

const needLabel = (k: string) => (k === 'peixe:*' ? 'qualquer peixe' : k === 'fruta:*' ? 'qualquer fruta' : itemLabel(k));
const needIcon = (k: string) => (k === 'peixe:*' ? 'peixe' : k === 'fruta:*' ? 'fruta:maca' : itemIcon(k));
const haveOf = (p: Progress, k: string) => (k.endsWith(':*') ? Object.keys(p.itens).filter(i => i.startsWith(k.slice(0, -1)) && (itemDef(i)?.price ?? 0) > 0).reduce((s, i) => s + p.itens[i], 0) : p.itens[k] ?? 0);

export function KitchenPanel({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Shell title="COZINHA DA FAZENDA" color="#3a7a3a" coins={progress.coins} onClose={onClose}>
      <div className="text-[8px] leading-4 text-[#5a5470] mb-2">Junte o que você colheu, pescou e pegou dos bichos. Comida feita enche mais a barriga e vale mais no Mercado.</div>
      {RECIPES.map(r => {
        const ok = canCook(progress, r);
        const out = itemDef(r.out)!;
        return (
          <div key={r.id} className="flex items-center gap-2 py-2 border-b border-[#e0d8c4]">
            <Icon id={out.icon} size={32} />
            <div className="flex-1">
              <div className="text-[9px]">{out.name} <span className="text-[7px] text-[#5a5470]">· +{out.food} barriga · {out.price} <Icon id="moeda" size={10} /></span></div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(r.needs).map(([k, n]) => (
                  <span key={k} className={`px-1.5 py-0.5 rounded text-[7px] ${haveOf(progress, k) >= n ? 'bg-[#e0f0d8]' : 'bg-[#f8e0e0]'}`}><Icon id={needIcon(k)} size={12} /> {needLabel(k)} {Math.min(haveOf(progress, k), n)}/{n}</span>
                ))}
              </div>
            </div>
            <button disabled={!ok} onClick={() => { const c = cook(progress, r); if (c.ok) { saveProgress(c.progress); play('super'); setMsg(`+1 ${out.name}!`); } }}
              className={`px-2 py-1.5 rounded text-white text-[8px] ${ok ? 'bg-[#3a7a3a]' : 'bg-[#a8a4b4]'}`}>COZINHAR</button>
          </div>
        );
      })}
      <Msg msg={msg} />
    </Shell>
  );
}

// ─── Central de Entregas ────────────────────────────────────────────────────

export function DeliveryPanel({ progress, zone, onClose, onWork }: { progress: Progress; zone: string; onClose: () => void; onWork?: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const e = progress.entrega;
  const near = deliveryTerms(progress, true), far = deliveryTerms(progress, false);
  return (
    <Shell title="CENTRAL DE ENTREGAS" color="#2a8a8a" coins={progress.coins} onClose={onClose}>
      <div className="text-[8px] leading-4 text-[#5a5470] mb-3">Leve a encomenda até a porta certa, em qualquer área do mundo, antes do tempo acabar. Atrasou? Ganha metade. Na Cidade WIT: {near.coins} moedas · em outra área: {far.coins} moedas.</div>
      {e ? (
        <div className="rounded-lg bg-white border-2 border-[#2a8a8a] p-3 text-[9px] leading-5">
          Entrega em andamento: <b>{e.nome}</b><br />
          {e.ate > Date.now() ? `Faltam ${Math.ceil((e.ate - Date.now()) / 1000)} s` : 'Atrasada! Ainda dá para entregar (metade das moedas).'}
          <div className="text-[8px] text-[#5a5470] mt-1">Ande até a porta e entre nela (de frente, para cima).</div>
          <button onClick={() => { saveProgress(cancelDelivery(progress)); setMsg('Entrega cancelada.'); }} className="mt-2 px-2 py-1 rounded bg-[#4a4660] text-white text-[8px]">CANCELAR</button>
        </div>
      ) : (
        <button onClick={() => {
          const t = takeDelivery(progress, Math.random(), Date.now());
          saveProgress(t.progress); play('drop');
          setMsg(`Você pegou ${t.what}. Leve até: ${t.dest.nome}.${t.dest.zona !== zone ? ' Fica em outra área: use as saídas ou o MAPA.' : ''}`);
        }} className="w-full py-3 rounded-lg bg-[#2a8a8a] text-white text-[11px] border-b-4 border-black/30">PEGAR ENCOMENDA</button>
      )}
      {!e && (
        <button onClick={() => {
          const t = takeDelivery(progress, Math.random(), Date.now(), true);
          saveProgress(t.progress); play('drop');
          setMsg(`EXPRESSA! ${t.what} para ${t.dest.nome}. Pouco tempo e o dobro de moedas: corra (SHIFT)!`);
        }} className="mt-2 w-full py-2.5 rounded-lg bg-[#e8485a] text-white text-[10px] border-b-4 border-black/30">ENTREGA EXPRESSA (metade do tempo, dobro das moedas)</button>
      )}
      <Msg msg={msg} />
      {onWork && <button onClick={onWork} className="mt-3 w-full py-2.5 rounded-lg bg-[#e8762a] text-white text-[10px] border-b-4 border-[#a84a10]">TRABALHAR: MELHOR ROTA (Entregador)</button>}
    </Shell>
  );
}
