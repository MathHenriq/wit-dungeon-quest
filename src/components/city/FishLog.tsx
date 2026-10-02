// Diário do lago (Casa de Pesca): a tabela dos peixes que o aluno pescou e os
// gráficos desses dados; a pergunta do dia só se responde olhando para eles.
import { useState } from 'react';
import { FISH_BY_ID, RARITY_COLOR } from '@/game/fishing';
import { byPeriod, countBySpot, logQuestion, MIN_FOR_QUESTION, PERIODS, rareBySpot, SPOT_NAME, SPOTS, trashCount } from '@/game/fishlog';
import { doWork, today } from '@/game/life';
import { saveProgress, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';
import { BarChart } from '@/components/work/Charts';

export const LOG_PRIZE = 12;

export function FishLog({ progress }: { progress: Progress }) {
  const log = progress.diario;
  const day = today();
  const q = logQuestion(log, day);
  const [picked, setPicked] = useState<number | null>(null);
  const answered = progress.diarioDia === day;

  const answer = (k: number) => {
    if (!q || picked !== null || answered) return;
    setPicked(k);
    if (k === q.answer) {
      const w = doWork({ ...progress, coins: progress.coins + LOG_PRIZE, diarioDia: day }, 'pescador', null, 3);
      saveProgress(w.progress); play('win');
    } else { saveProgress({ ...progress, diarioDia: day }); play('lose'); }
  };

  if (!log.length) return <div className="text-[9px] leading-5 text-[#5a5470]">Seu diário está vazio. Cada peixe que você pescar entra aqui: a hora, o lugar e o tamanho. Com os dados, você descobre onde e quando pescar melhor.</div>;
  return (
    <div>
      <div className="text-[8px] leading-4 text-[#5a5470] mb-2">{log.length} registros{trashCount(log) ? ` (${trashCount(log)} de lixo: o lago agradece!)` : ''}. Os gráficos são feitos com os SEUS dados.</div>
      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <div className="rounded-lg bg-white border-2 border-[#e0d8c4] p-2">
          <div className="text-[8px] mb-1">PEIXES POR PERÍODO DO DIA</div>
          <BarChart values={byPeriod(log)} labels={PERIODS.map(p => p)} colors={['#4a4a8a', '#f0a830', '#e8762a', '#2a3a6a']} width={240} height={120} />
        </div>
        <div className="rounded-lg bg-white border-2 border-[#e0d8c4] p-2">
          <div className="text-[8px] mb-1">POR LUGAR: TOTAL <span className="text-[#a84ae8]">(e os RAROS por dentro)</span></div>
          <BarChart values={countBySpot(log)} inner={rareBySpot(log)} labels={SPOTS.map(s => SPOT_NAME[s])} colors={['#3a8ae8', '#2a5aa8', '#3aa8a0']} width={240} height={120} />
        </div>
      </div>
      {/* a pergunta do dia */}
      <div className="rounded-lg border-2 border-[#27566e] bg-[#eaf4f8] p-2 mb-2">
        <div className="text-[8px] text-[#27566e] mb-1">PERGUNTA DO DIÁRIO · vale {LOG_PRIZE} moedas</div>
        {!q ? <div className="text-[8px] leading-4">Pesque pelo menos {MIN_FOR_QUESTION} peixes para ter dados (tem {log.length}).</div>
          : answered && picked === null ? <div className="text-[8px] leading-4">Respondida hoje. Amanhã tem outra (pesque mais para os dados mudarem).</div>
          : (
            <div>
              <div className="text-[9px] leading-4 mb-1.5">{q.text}</div>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((o, k) => (
                  <button key={o} onClick={() => answer(k)} disabled={picked !== null}
                    className={`px-2 py-1.5 rounded border-2 text-[8px] ${picked === null ? 'bg-white border-[#c8c0ac]' : k === q.answer ? 'bg-[#c8f0d0] border-[#3a9a5a]' : k === picked ? 'bg-[#f8c8c8] border-[#e8485a]' : 'bg-white border-[#e0d8c4] opacity-50'}`}>{o}</button>
                ))}
              </div>
              {picked !== null && <div className="text-[8px] leading-4 mt-1.5" style={{ color: picked === q.answer ? '#3a9a5a' : '#c84a6a' }}>{picked === q.answer ? `Certo! +${LOG_PRIZE} moedas. ` : 'Não foi dessa vez. '}{q.why}</div>}
            </div>
          )}
      </div>
      {/* a tabela */}
      <div className="rounded-lg bg-white border-2 border-[#e0d8c4] overflow-hidden">
        <div className="grid grid-cols-[1fr_44px_56px_70px] gap-1 px-2 py-1 bg-[#27566e] text-white text-[7px]"><span>PEIXE</span><span>CM</span><span>HORA</span><span>LUGAR</span></div>
        {log.slice(0, 12).map((e, i) => {
          const f = FISH_BY_ID.get(e.f)!;
          return (
            <div key={i} className={`grid grid-cols-[1fr_44px_56px_70px] gap-1 px-2 py-1 text-[8px] ${i % 2 ? 'bg-[#f6f2e8]' : ''}`}>
              <span style={{ color: RARITY_COLOR[f.rarity] }}>{f.name}</span><span>{e.cm}</span><span>{String(e.h).padStart(2, '0')}h{e.d === day - 1 ? ' ontem' : e.d < day ? ` há ${day - e.d}d` : ''}</span><span>{SPOT_NAME[e.w]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
