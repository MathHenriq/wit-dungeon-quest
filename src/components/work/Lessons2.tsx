// Telas das tarefas de game/lessons2.ts: calendário da horta (Fazendeiro),
// por que a massa cresce (Padeiro), minha barraca (Comerciante), fato ou
// boato (Repórter), lógica do jogo (Games), pixel art (Artista) e compra e
// venda (Comerciante).
import { useMemo, useState } from 'react';
import {
  artScore, bestPrice, bestTrade, margin, TRADE_PLACES, tradeRounds, BOWLS, calendarRounds, claims, encodeArt, fill, GAME_ACTIONS, GAME_DESIGN, GAME_EVENTS, PIX, PIX_PALETTE, plantDay, profit, riseScore,
  rulesRight, runGame, sold, STALL_DAYS, stallOf, type GameAction, type GameEvent,
} from '@/game/lessons2';
import { itemIcon, itemLabel } from '@/game/items';
import { loadProgress, saveProgress } from '@/game/progress';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import type { GameProps } from './Minigames';
import { Big, Head, Note } from './LessonKit';


// ─── Fazendeiro: calendário da horta ────────────────────────────────────────

export function Calendario({ seed, onDone }: GameProps) {
  const rounds = useMemo(() => calendarRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [sel, setSel] = useState(0);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const r = rounds[i];
  const right = r.crops.filter(c => pick[c.id] === plantDay(r.feira, c)).length;
  const next = () => {
    const s = score + right / r.crops.length;
    if (i + 1 >= rounds.length) { onDone({ score: s / rounds.length, hits: Math.round(s * 3) }); return; }
    setScore(s); setI(i + 1); setPick({}); setSel(0); setChecked(false);
  };
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={rounds.length}>A feira é no dia {r.feira}. Plante cada semente no dia certo para colher tudo junto no dia da feira. Dia de plantar = dia da feira − dias para crescer.</Head>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {r.crops.map((c, k) => (
          <button key={c.id} onClick={() => !checked && setSel(k)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 text-[8px] ${sel === k ? 'border-[#5a9a3a] bg-[#eef8e4]' : 'border-[#d8d0c0] bg-white'}`}>
            <Icon id={itemIcon(`colheita:${c.id}`)} size={22} /> {c.name} · {c.days} dias {pick[c.id] ? `· dia ${pick[c.id]}` : ''}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_, k) => k + 1).map(d => {
          const here = r.crops.filter(c => pick[c.id] === d);
          const harvest = r.crops.filter(c => pick[c.id] && pick[c.id] + c.days === d);
          return (
            <button key={d} disabled={checked} onClick={() => { setPick(p => ({ ...p, [r.crops[sel].id]: d })); setSel(s => Math.min(r.crops.length - 1, s + 1)); play('click'); }}
              className={`relative h-14 rounded-md border-2 text-[8px] ${d === r.feira ? 'border-[#e8a020] bg-[#fff4dc]' : 'border-[#e0d8c4] bg-white'}`}>
              <div className="absolute top-0.5 left-1">{d}</div>
              {d === r.feira && <div className="absolute bottom-0.5 inset-x-0 text-[6px] text-[#a86a10]">FEIRA</div>}
              <div className="flex justify-center gap-0.5 mt-2">{here.map(c => <Icon key={c.id} id="semente" size={14} />)}{harvest.map(c => <Icon key={c.id + 'h'} id={itemIcon(`colheita:${c.id}`)} size={14} />)}</div>
            </button>
          );
        })}
      </div>
      {!checked ? <Big disabled={Object.keys(pick).length < r.crops.length} onClick={() => { setChecked(true); play(right === r.crops.length ? 'win' : 'lose'); }} color="#5a9a3a">CONFERIR</Big>
        : <><Note ok={right === r.crops.length}>{r.crops.map(c => `${c.name}: dia ${plantDay(r.feira, c)} (${r.feira} − ${c.days})`).join(' · ')}</Note><Big onClick={next} color="#5a9a3a">{i + 1 >= rounds.length ? 'TERMINAR' : 'PRÓXIMA FEIRA'}</Big></>}
    </div>
  );
}

// ─── Padeiro: por que a massa cresce? ───────────────────────────────────────

export function Fermento({ onDone }: GameProps) {
  const [most, setMost] = useState<string | null>(null);
  const [least, setLeast] = useState<string | null>(null);
  const [t, setT] = useState(0);   // 0 = ainda não esperou; 1 = 1 hora
  const run = () => {
    play('click');
    const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 2400); setT(k); if (k < 1) requestAnimationFrame(step); else play(riseScore(most!, least!) === 1 ? 'win' : 'coin'); };
    requestAnimationFrame(step);
  };
  const done = t >= 1, sc = most && least ? riseScore(most, least) : 0;
  return (
    <div className="text-[#2e2a40]">
      <Head>Experimento: 4 tigelas com a mesma massa. Muda só o fermento e a água. Antes de esperar, faça a sua previsão!</Head>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BOWLS.map(b => {
          const h = 18 + b.rise * 70 * t;
          return (
            <div key={b.id} className="lk-card p-2 text-center">
              <div className="relative mx-auto h-[110px] w-[86px] flex items-end justify-center">
                {/* massa crescendo (formas de interface) */}
                <div className="w-[70px] rounded-t-[40px] bg-[#f4dcae] border-2 border-[#c8a070] transition-none" style={{ height: h }} />
                <div className="absolute bottom-0 w-[86px] h-[26px] rounded-b-[20px] bg-[#3a78c8] border-2 border-[#1e4a8a]" />
              </div>
              <div className="text-[7px] leading-3 mt-1 min-h-[24px]">{b.label}</div>
              {!done && t === 0 && <div className="flex gap-1 justify-center mt-1">
                <button onClick={() => setMost(b.id)} className={`px-1.5 py-1 rounded text-[6px] border ${most === b.id ? 'bg-[#3a9a5a] text-white' : 'bg-white'}`}>MAIS</button>
                <button onClick={() => setLeast(b.id)} className={`px-1.5 py-1 rounded text-[6px] border ${least === b.id ? 'bg-[#c84a6a] text-white' : 'bg-white'}`}>MENOS</button>
              </div>}
              {done && <div className="text-[8px] mt-1">{Math.round(b.rise * 100)}%</div>}
            </div>
          );
        })}
      </div>
      {t === 0 && <Big disabled={!most || !least || most === least} onClick={run} color="#c87a2a">ESPERAR 1 HORA</Big>}
      {done && <>
        <Note ok={sc === 1}>O fermento é cheio de seres vivos minúsculos. Eles comem o açúcar da farinha e soltam gás, que faz bolhas e a massa cresce. No quentinho eles trabalham mais rápido; no gelado, bem devagar. Sem fermento, quase nada acontece.</Note>
        <Big onClick={() => onDone({ score: 0.4 + sc * 0.6, hits: Math.round(sc * 2) })} color="#c87a2a">TERMINAR</Big>
      </>}
    </div>
  );
}

// ─── Comerciante: minha barraca ─────────────────────────────────────────────

export function Barraca({ seed, onDone }: GameProps) {
  const st = useMemo(() => stallOf(seed), [seed]);
  const [price, setPrice] = useState(st.cost + 2);
  const [days, setDays] = useState<{ price: number; sold: number; profit: number }[]>([]);
  const best = bestPrice(st);
  const open = () => {
    const d = { price, sold: sold(st, price), profit: profit(st, price) };
    setDays(x => [...x, d]); play(d.profit > 0 ? 'coin' : 'lose');
  };
  const top = Math.max(0, ...days.map(d => d.profit));
  const W = 300, H = 120, maxP = 30, maxY = Math.max(10, best.profit * 1.15);
  return (
    <div className="text-[#2e2a40]">
      <Head step={Math.min(days.length + 1, STALL_DAYS)} total={STALL_DAYS}>Você vende {itemLabel(st.item)} na praça. Cada um custa {st.cost} moedas para fazer. Escolha o preço do dia: caro demais, ninguém compra; barato demais, não sobra lucro.</Head>
      <div className="flex items-center gap-2 mb-2">
        <Icon id={itemIcon(st.item)} size={32} />
        <button onClick={() => setPrice(p => Math.max(1, p - 1))} className="w-8 h-8 rounded bg-[#c8762a] text-white">-</button>
        <div className="text-[14px] w-20 text-center">{price} <Icon id="moeda" size={14} /></div>
        <button onClick={() => setPrice(p => Math.min(30, p + 1))} className="w-8 h-8 rounded bg-[#c8762a] text-white">+</button>
        <div className="flex-1" />
        {days.length < STALL_DAYS && <button onClick={open} className="px-3 py-2 rounded-lg bg-[#3a9a5a] text-white text-[9px] border-b-4 border-[#1e6a3a]">ABRIR A BARRACA</button>}
      </div>
      {/* gráfico: preço × lucro de cada dia (pontos) */}
      <div className="lk-card p-2">
        <div className="text-[8px] mb-1">LUCRO DE CADA DIA PELO PREÇO</div>
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-auto" style={{ maxWidth: 480 }}>
          <line x1={20} y1={H} x2={W} y2={H} stroke="#e4dccb" /><line x1={20} y1={0} x2={20} y2={H} stroke="#e4dccb" />
          {[0, 10, 20].map(p => <text key={p} x={20 + (p / maxP) * (W - 30)} y={H + 12} fontSize={8} fill="#8a8498" textAnchor="middle">{p}</text>)}
          <text x={W} y={H + 12} fontSize={7} fill="#8a8498" textAnchor="end">preço</text>
          {days.map((d, k) => (
            <g key={k}>
              <circle cx={20 + (d.price / maxP) * (W - 30)} cy={H - (Math.max(0, d.profit) / maxY) * H} r={5} fill={d.profit === top && top > 0 ? '#3a9a5a' : '#c8762a'} stroke="#fff" />
              <text x={20 + (d.price / maxP) * (W - 30)} y={H - (Math.max(0, d.profit) / maxY) * H - 8} fontSize={8} textAnchor="middle" fill="#2e2a40">{d.profit}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[8px] mt-2">
        <div className="font-bold">PREÇO</div><div className="font-bold">VENDEU</div><div className="font-bold">LUCRO</div>
        {days.map((d, k) => [<div key={`a${k}`}>{d.price}</div>, <div key={`b${k}`}>{d.sold}</div>, <div key={`c${k}`} style={{ color: d.profit > 0 ? '#3a9a5a' : '#c84a6a' }}>{d.profit}</div>])}
      </div>
      {days.length >= STALL_DAYS && <>
        <Note ok={top >= best.profit}>O melhor preço era {best.price} moedas: {sold(st, best.price)} vendidos, {best.profit} de lucro. Subir o preço vende menos; abaixar vende mais mas sobra menos em cada um. O lucro máximo fica no meio: isso é a curva da procura.</Note>
        <Big onClick={() => onDone({ score: Math.max(0, top) / best.profit, hits: days.length })} color="#c8762a">TERMINAR</Big>
      </>}
    </div>
  );
}

// ─── Comerciante: compra e venda ────────────────────────────────────────────

export function Atacado({ seed, onDone }: GameProps) {
  const rounds = useMemo(() => tradeRounds(seed), [seed]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const t = rounds[i], best = bestTrade(t);
  const next = () => {
    const sc = pick ? Math.max(0, margin(t, pick[0], pick[1])) / best.margin : 0;
    const total = score + sc;
    if (i + 1 >= rounds.length) { onDone({ score: total / rounds.length, hits: Math.round(total) }); return; }
    setScore(total); setI(i + 1); setPick(null);
  };
  return (
    <div className="text-[#2e2a40]">
      <Head step={i + 1} total={rounds.length}>Cada lugar vende mais caro ou mais barato. Compre onde o LUCRO (venda no Mercado − compra) é o maior. Toque na célula da tabela.</Head>
      <div className="lk-card p-2 overflow-x-auto">
        <table className="w-full text-[8px] text-center border-collapse">
          <thead><tr><th className="text-left p-1">ITEM</th>{TRADE_PLACES.map(pl => <th key={pl} className="p-1">{pl.toUpperCase()}</th>)}<th className="p-1 text-[#3a9a5a]">MERCADO PAGA</th></tr></thead>
          <tbody>
            {t.items.map((it, k) => (
              <tr key={it} className="border-t border-[#eee6d4]">
                <td className="text-left p-1"><span className="inline-flex items-center gap-1"><Icon id={itemIcon(it)} size={18} />{itemLabel(it)}</span></td>
                {TRADE_PLACES.map((_, p) => {
                  const on = pick?.[0] === k && pick?.[1] === p;
                  return <td key={p} className="p-0.5"><button onClick={() => { setPick([k, p]); play('drop'); }} className={`w-full rounded py-1 ${on ? 'bg-[#c8762a] text-white' : 'bg-[#f6f0e2] hover:bg-[#efe4cc]'}`}>{t.buy[k][p]}</button></td>;
                })}
                <td className="p-1 text-[#3a9a5a]">{t.sell[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pick && <div className="text-[8px] mt-2">Lucro de cada um: {t.sell[pick[0]]} − {t.buy[pick[0]][pick[1]]} = <b style={{ color: margin(t, pick[0], pick[1]) > 0 ? '#3a9a5a' : '#c84a6a' }}>{margin(t, pick[0], pick[1])}</b></div>}
      <Big onClick={next} disabled={!pick} color="#c8762a">{i + 1 >= rounds.length ? 'TERMINAR' : 'PRÓXIMA'}</Big>
    </div>
  );
}

// ─── Repórter: fato ou boato ────────────────────────────────────────────────

export function Boato({ seed, onDone }: GameProps) {
  const list = useMemo(() => claims(seed), [seed]);
  const [ans, setAns] = useState<(boolean | null)[]>(() => list.map(() => null));
  const [checked, setChecked] = useState(false);
  const hits = list.filter((c, k) => ans[k] === c.fact).length;
  return (
    <div className="text-[#2e2a40]">
      <Head>Antes de publicar, confira! Marque cada manchete como FATO ou BOATO. As pistas estão no próprio jogo (Loja, Casa de Pesca, Fazenda, Torre, duelo).</Head>
      <div className="grid gap-1.5">
        {list.map((c, k) => (
          <div key={k} className={`rounded-lg border-2 p-2 ${checked ? (ans[k] === c.fact ? 'border-[#3a9a5a] bg-[#eefaf0]' : 'border-[#e8485a] bg-[#fff0f0]') : 'border-[#e0d8c4] bg-white'}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-[9px] leading-4">{c.text}</div>
              {[true, false].map(v => (
                <button key={String(v)} disabled={checked} onClick={() => setAns(a => a.map((x, j) => (j === k ? v : x)))}
                  className={`px-2 py-1.5 rounded text-[8px] border-2 ${ans[k] === v ? (v ? 'bg-[#3a9a5a] text-white border-[#3a9a5a]' : 'bg-[#c84a6a] text-white border-[#c84a6a]') : 'bg-white border-[#d8d0c0]'}`}>{v ? 'FATO' : 'BOATO'}</button>
              ))}
            </div>
            {checked && <div className="text-[7px] text-[#5a5470] mt-1">{c.fact ? 'Fato.' : 'Boato.'} Pista: {c.pista}</div>}
          </div>
        ))}
      </div>
      {!checked ? <Big disabled={ans.some(a => a === null)} onClick={() => { setChecked(true); play(hits >= 5 ? 'win' : 'lose'); }} color="#c84a6a">CONFERIR</Big>
        : <><Note ok={hits >= 5}>{hits} de {list.length} certas. Boato se espalha rápido: quem confere antes de compartilhar ajuda todo mundo.</Note><Big onClick={() => onDone({ score: hits / list.length, hits })} color="#c84a6a">TERMINAR</Big></>}
    </div>
  );
}

// ─── Games: lógica do jogo ──────────────────────────────────────────────────

export function Logica({ onDone }: GameProps) {
  const [rules, setRules] = useState<Partial<Record<GameEvent, GameAction>>>({});
  const [run, setRun] = useState<ReturnType<typeof runGame> | null>(null);
  const [tries, setTries] = useState(0);
  const full = GAME_EVENTS.every(e => rules[e]);
  const ok = run && rulesRight(rules) === GAME_EVENTS.length;
  return (
    <div className="text-[#2e2a40]">
      <Head>O documento do jogo diz: espinho machuca, moeda dá ponto, buraco manda de volta para o começo e a bandeira termina a fase. Monte as regras e teste.</Head>
      <div className="rounded-lg bg-[#1e1a30] p-2 grid gap-1.5">
        {GAME_EVENTS.map(e => (
          <div key={e} className="flex flex-wrap items-center gap-1.5 text-[8px] text-white">
            <span className="px-2 py-1 rounded bg-[#e8902a]">SE</span>
            <span className="px-2 py-1 rounded bg-[#2a9ac8]">{e}</span>
            <span className="px-2 py-1 rounded bg-[#e8902a]">ENTÃO</span>
            <select value={rules[e] ?? ''} onChange={x => { setRules(r => ({ ...r, [e]: x.target.value as GameAction })); setRun(null); }}
              className="px-2 py-1 rounded bg-[#3aa85a] text-white text-[8px]">
              <option value="" disabled>escolha...</option>
              {GAME_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        ))}
      </div>
      {!run ? <Big disabled={!full} onClick={() => { setRun(runGame(rules)); setTries(n => n + 1); play('click'); }} color="#c8a020">TESTAR O JOGO</Big> : (
        <div className="mt-2 lk-card text-[8px] overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_44px_44px] px-2 py-1 bg-[#c8a020] text-white"><span>ACONTECEU</span><span>O JOGO FEZ</span><span>VIDAS</span><span>PONTOS</span></div>
          {run.map((s, k) => (
            <div key={k} className={`grid grid-cols-[1fr_1fr_44px_44px] px-2 py-1 ${s.action !== GAME_DESIGN[s.event] ? 'bg-[#fdecef]' : k % 2 ? 'bg-[#f6f2e8]' : ''}`}>
              <span>{s.event}</span><span>{s.action ?? 'nada'}</span><span>{s.lives}</span><span>{s.points}</span>
            </div>
          ))}
          <div className="px-2 py-1">{run.at(-1)!.done ? 'FASE COMPLETA!' : 'A fase não terminou.'}</div>
        </div>
      )}
      {run && <><Note ok={!!ok}>{ok ? 'O jogo funciona como o documento manda. Programar jogo é isso: regras SE/ENTÃO para cada coisa que acontece.' : 'As linhas vermelhas fizeram outra coisa. Ajuste as regras e teste de novo.'}</Note>
        {ok ? <Big onClick={() => onDone({ score: Math.max(0.5, 1 - (tries - 1) * 0.2), hits: 4 })} color="#c8a020">TERMINAR</Big>
          : <button onClick={() => setRun(null)} className="w-full mt-2 py-2 rounded-lg bg-[#4a4660] text-white text-[9px]">AJUSTAR</button>}</>}
    </div>
  );
}

// ─── Artista: pixel art ─────────────────────────────────────────────────────

export function PixelArt({ onDone }: GameProps) {
  const [px, setPx] = useState<number[]>(() => Array(PIX * PIX).fill(0));
  const [color, setColor] = useState(3);
  const [tool, setTool] = useState<'lapis' | 'balde' | 'borracha'>('lapis');
  const [down, setDown] = useState(false);
  const paint = (i: number) => {
    if (tool === 'balde') { setPx(p => fill(p, i, color)); return; }
    setPx(p => (p[i] === (tool === 'borracha' ? 0 : color) ? p : p.map((c, k) => (k === i ? (tool === 'borracha' ? 0 : color) : c))));
  };
  const save = () => {
    const p = loadProgress();
    saveProgress({ ...p, desenhos: [encodeArt(px), ...p.desenhos].slice(0, 12) });
    play('win');
    onDone({ score: artScore(px), hits: new Set(px.filter(c => c > 0)).size });
  };
  return (
    <div className="text-[#2e2a40]" onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}>
      <Head>Desenhe o que quiser em 16 × 16 quadradinhos. Pronto, ele vira um quadro para a sua casa (ou para vender no Mercado).</Head>
      <div className="flex flex-wrap gap-3 items-start">
        <div className="grid select-none touch-none border-2 border-[#2e2a40]" style={{ gridTemplateColumns: `repeat(${PIX}, 18px)`, background: 'repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 18px 18px' }}>
          {px.map((c, i) => (
            <div key={i} onPointerDown={e => { e.preventDefault(); setDown(true); paint(i); }} onPointerEnter={() => down && tool !== 'balde' && paint(i)}
              style={{ width: 18, height: 18, background: c ? PIX_PALETTE[c] : 'transparent' }} />
          ))}
        </div>
        <div className="flex-1 min-w-[140px]">
          <div className="grid grid-cols-5 gap-1 mb-2">
            {PIX_PALETTE.slice(1).map((c, k) => <button key={c} onClick={() => { setColor(k + 1); if (tool === 'borracha') setTool('lapis'); }} className={`h-7 rounded border-2 ${color === k + 1 ? 'border-[#2e2a40] scale-110' : 'border-white'}`} style={{ background: c }} aria-label={`cor ${k + 1}`} />)}
          </div>
          <div className="flex gap-1">
            {(['lapis', 'balde', 'borracha'] as const).map(t => <button key={t} onClick={() => setTool(t)} className={`flex-1 py-1.5 rounded text-[8px] border-2 ${tool === t ? 'bg-[#b0487a] text-white border-[#b0487a]' : 'bg-white border-[#d8d0c0]'}`}>{t === 'lapis' ? 'LÁPIS' : t === 'balde' ? 'BALDE' : 'BORRACHA'}</button>)}
          </div>
          <button onClick={() => setPx(Array(PIX * PIX).fill(0))} className="w-full mt-1 py-1.5 rounded bg-[#4a4660] text-white text-[8px]">APAGAR TUDO</button>
          <div className="text-[7px] leading-4 text-[#5a5470] mt-2">Dica: use pelo menos 3 cores e preencha boa parte do quadro.</div>
          <Big disabled={!px.some(c => c > 0)} onClick={save} color="#b0487a">PENDURAR NA PAREDE</Big>
        </div>
      </div>
    </div>
  );
}
