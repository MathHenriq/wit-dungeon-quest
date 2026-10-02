// Trabalho de campo (aba NO MAPA): pegar o trabalho que faz andar pelo mundo,
// ver quantos pontos faltam em cada área e cancelar.
import { useState } from 'react';
import { cancelField, FIELD_BY_ID, fieldLeft, fieldOf, pendingByZone, takeField } from '@/game/fieldwork';
import type { ProfId } from '@/game/professions';
import { saveProgress, type Progress } from '@/game/progress';
import { play } from '@/game/sfx';
import { ZONE_NAMES, type ZoneId } from '@/game/world/zone';
import { Icon } from '@/components/Icon';
import { itemIcon } from '@/game/items';

export function FieldBox({ prof, progress }: { prof: ProfId; progress: Progress }) {
  const [msg, setMsg] = useState<string | null>(null);
  const job = fieldOf(prof);
  if (!job) return null;
  const c = progress.campo, mine = c && c.job === job.id, other = c && !mine ? FIELD_BY_ID.get(c.job) : null;
  const left = mine ? fieldLeft(progress, Date.now()) : null;
  return (
    <div className="rounded-lg border-2 bg-white p-3 text-[9px] leading-5" style={{ borderColor: job.color }}>
      <div style={{ color: job.color }}>NO MAPA · {job.name.toUpperCase()}</div>
      <div className="text-[8px] leading-4 text-[#5a5470] mt-1">{job.how}</div>
      <div className="text-[8px] mt-1 flex items-center gap-1">Paga {job.coins} <Icon id="moeda" size={10} /> e {job.xp} XP{job.need && <> · leva <Icon id={itemIcon(job.need)} size={14} /> ×{job.zones.length} (tem {progress.itens[job.need] ?? 0})</>}{job.minutes && ` · prazo ${job.minutes} min`}</div>
      {mine ? (
        <div className="mt-2">
          <div className="text-[8px]">Feitos: {c!.feitos.length}/{job.zones.length}{left !== null && ` · ${left > 0 ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}` : 'PRAZO ACABOU'}`}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(pendingByZone(c!)).map(([z, n]) => <span key={z} className="px-1.5 py-0.5 rounded text-[7px] text-white" style={{ background: job.color }}>{ZONE_NAMES[z as ZoneId]}: {n}</span>)}
          </div>
          <div className="text-[7px] text-[#5a5470] mt-1">{job.hidden ? 'Os bugs só aparecem de perto: ande pelas áreas marcadas.' : 'Os pontos aparecem marcados no chão de cada área (e no MAPA).'}</div>
          <button onClick={() => { saveProgress(cancelField(progress)); setMsg('Trabalho cancelado.'); }} className="mt-2 px-2 py-1 rounded bg-[#4a4660] text-white text-[8px]">CANCELAR</button>
        </div>
      ) : other ? (
        <div className="mt-2 text-[8px] text-[#c84a6a]">Você já está fazendo outro trabalho de campo ({other.name}). Termine ou cancele no lugar dele.</div>
      ) : (
        <button onClick={() => {
          const r = takeField(progress, prof, Math.floor(Math.random() * 1e6), Date.now());
          if ('reason' in r) { setMsg(r.reason); play('lose'); return; }
          saveProgress(r.progress); play('drop'); setMsg('Trabalho anotado! Saia e procure os pontos marcados.');
        }} className="mt-2 px-3 py-2 rounded text-white text-[9px]" style={{ background: job.color }}>PEGAR O TRABALHO</button>
      )}
      {msg && <div className="mt-2 text-[8px] text-[#3a9a5a]">{msg}</div>}
    </div>
  );
}
