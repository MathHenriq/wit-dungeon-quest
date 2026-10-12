// Mercado Central: "Ler o gráfico" (Comerciante). Cinco perguntas sobre os
// preços de verdade do Mercado: o dia mais caro (tocar no ponto), subiu ou
// desceu, o mais estável, a média e o que esperar amanhã (volta à média).
import { useMemo, useState } from 'react';
import { chartQuiz, dayLabel, mean, type ChartQuestion } from '@/game/charts';
import { itemDef, itemIcon } from '@/game/items';
import { today } from '@/game/life';
import { play } from '@/game/sfx';
import { Icon } from '@/components/Icon';
import { LineChart } from './Charts';
import type { GameProps } from './Minigames';

const COLORS = ['#c8762a', '#3a78c8', '#8a5ae8'];
const labels = (n: number) => Array.from({ length: n }, (_, k) => dayLabel(k, n));

/** Por que a resposta é essa (aparece depois de responder). */
function explain(q: ChartQuestion): string {
  const name = (i: string) => itemDef(i)!.name;
  switch (q.kind) {
    case 'pico': return `O ponto mais alto da linha é o dia mais caro: ${Math.max(...q.series)} moedas.`;
    case 'direcao': return `Ontem ${q.series[8]}, hoje ${q.series[9]}: a linha ${q.answer === 'subiu' ? 'sobe' : 'desce'} no final.`;
    case 'estavel': return `A linha mais "reta" é a que mudou menos: ${name(q.items[q.answer])}. Preço estável é bom para planejar.`;
    case 'media': return `Média = soma ÷ quantidade: ${q.series.join(' + ')} = ${q.series.reduce((a, b) => a + b, 0)}, dividido por ${q.series.length} dá ${mean(q.series).toFixed(1)}.`;
    case 'amanha': return `Amanhã: ${q.tomorrow} moedas. Quando um preço foge muito do normal, o mais comum é voltar para perto da média. Isso se chama "volta à média".`;
  }
}

export function Grafico({ seed, onDone }: GameProps) {
  const qs = useMemo(() => chartQuiz(today(), seed), [seed]);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [picked, setPicked] = useState<number | string | null>(null);
  const q = qs[i];
  const done = picked !== null;
  const right = done && picked === q.answer;

  const pick = (v: number | string) => {
    if (done) return;
    setPicked(v);
    const ok = v === q.answer;
    if (ok) setHits(h => h + 1);
    play(ok ? 'coin' : 'lose');
  };
  const next = () => {
    if (i + 1 >= qs.length) { onDone({ score: hits / qs.length, hits }); return; }
    setI(i + 1); setPicked(null); play('click');
  };
  const btn = (v: string, label: string) => (
    <button key={v} onClick={() => pick(v)} disabled={done}
      className={`flex-1 py-2.5 rounded-lg border-2 text-[10px] ${!done ? 'bg-white border-[#d8d0c0] hover:border-[#c8762a]' : v === q.answer ? 'bg-[#c8f0d0] border-[#3a9a5a]' : v === picked ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white border-[#e0d8c4] opacity-50'}`}>{label}</button>
  );

  return (
    <div className="text-[#2e2a40]">
      <div className="flex justify-between text-[8px] mb-2"><span>PERGUNTA {i + 1}/{qs.length}</span><span className="text-[#5a5470]">acertos: {hits}</span></div>
      <div className="text-[10px] leading-5 mb-2">{q.text}</div>
      <div className="lk-card p-2">
        {'item' in q && (
          <div className="flex items-center gap-1.5 text-[8px] mb-1"><Icon id={itemIcon(q.item)} size={20} /> {itemDef(q.item)!.name} · preço por dia (moedas)</div>
        )}
        {q.kind === 'pico' && <LineChart series={q.series} labels={labels(q.series.length)} onPick={done ? undefined : k => pick(k)} mark={done ? q.answer : null} wrong={done && picked !== q.answer ? (picked as number) : null} />}
        {q.kind === 'direcao' && <LineChart series={q.series} labels={labels(10)} mark={done ? 9 : null} />}
        {q.kind === 'media' && <LineChart series={q.series} labels={labels(q.series.length)} mean={done ? mean(q.series) : null} />}
        {q.kind === 'amanha' && <LineChart series={q.series} labels={labels(10)} extra={done ? { label: 'amanhã', value: q.tomorrow } : null} mean={done ? mean(q.series) : null} />}
        {q.kind === 'estavel' && (() => {
          // cada linha em % da própria média, todas no mesmo eixo: assim dá para comparar de verdade
          const pct = q.series.map(s => { const m = mean(s); return s.map(v => Math.round((v / m) * 100)); });
          const flat = pct.flat(), lo = Math.floor(Math.min(...flat) / 10) * 10 - 5, hi = Math.ceil(Math.max(...flat) / 10) * 10 + 5;
          return (
          <div className="grid grid-cols-3 gap-1.5">
            {q.items.map((it, k) => (
              <button key={it} onClick={() => pick(k)} disabled={done}
                className={`rounded-md border-2 p-1 ${!done ? 'border-[#e0d8c4] hover:border-[#c8762a]' : k === q.answer ? 'border-[#3a9a5a] bg-[#eefaf0]' : k === picked ? 'border-[#e8485a] bg-[#fff0f0]' : 'border-[#e0d8c4] opacity-60'}`}>
                <div className="flex items-center justify-center gap-1 text-[7px] mb-0.5"><Icon id={itemIcon(it)} size={16} /> {itemDef(it)!.name}</div>
                <LineChart series={pct[k]} range={[lo, hi]} unit="%" labels={labels(10).map((l, j) => (j % 3 === 0 || j === 9 ? l : ''))} color={COLORS[k]} width={150} height={90} />
              </button>
            ))}
          </div>
          );
        })()}
      </div>
      <div className="flex gap-2 mt-2">
        {q.kind === 'direcao' && [btn('subiu', 'SUBIU'), btn('desceu', 'DESCEU')]}
        {q.kind === 'amanha' && [btn('sobe', 'SOBE'), btn('desce', 'DESCE')]}
        {q.kind === 'media' && q.options.map((o, k) => (
          <button key={o} onClick={() => pick(k)} disabled={done}
            className={`flex-1 py-2.5 rounded-lg border-2 text-[10px] ${!done ? 'bg-white border-[#d8d0c0]' : k === q.answer ? 'bg-[#c8f0d0] border-[#3a9a5a]' : k === picked ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white border-[#e0d8c4] opacity-50'}`}>
            {o} <Icon id="moeda" size={10} />
          </button>
        ))}
      </div>
      {done && (
        <div className="mt-2 rounded-lg p-2 text-[8px] leading-4" style={{ background: right ? '#e8f8ec' : '#fdecef' }}>
          <b style={{ color: right ? '#3a9a5a' : '#c84a6a' }}>{right ? 'CERTO! ' : 'QUASE. '}</b>{explain(q)}
        </div>
      )}
      {done && <button onClick={next} className="mt-2 w-full py-2 rounded-lg bg-[#c8762a] text-white text-[10px] border-b-4 border-[#8a4a10]">{i + 1 >= qs.length ? 'TERMINAR' : 'PRÓXIMA'}</button>}
    </div>
  );
}
