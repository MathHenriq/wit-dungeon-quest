import { describe, expect, it } from 'vitest';
import { completeTarget, FIELD_JOBS, fieldOf, pendingByZone, reachable, takeField, targetsIn } from '../fieldwork';
import { addItem, newProgress, sanitizeProgress } from '../progress';
import { buildZone, ZONES } from '../world/world';
import type { Town, ZoneId } from '../world/zone';

const towns = Object.fromEntries(ZONES.map(z => [z, buildZone(z)])) as Record<ZoneId, Town>;

describe('trabalho de campo', () => {
  it('todo alvo de todo trabalho cai num bloco alcançável, sem repetir, em várias sementes', () => {
    for (const job of FIELD_JOBS) for (let seed = 1; seed < 12; seed++) {
      const c = { job: job.id, seed, feitos: [], ini: 0 };
      const all = ZONES.flatMap(z => targetsIn(towns[z], c).map(t => ({ ...t, z })));
      expect(all.map(t => t.i).sort()).toEqual(job.zones.map((_, i) => i));
      for (const t of all) {
        if (job.kind === 'falar') continue;
        expect(reachable(towns[t.z]).has(`${t.tx},${t.ty}`), `${job.id} ${t.z} ${t.tx},${t.ty}`).toBe(true);
      }
      const keys = all.map(t => `${t.z}:${t.tx},${t.ty}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it('pegar, cumprir os pontos e receber no último', () => {
    let p = { ...newProgress(), coins: 0 };
    const r = takeField(p, 'tecnico-iot', 7, 1000);
    expect('progress' in r).toBe(true);
    p = (r as { progress: typeof p }).progress;
    expect('reason' in takeField(p, 'tecnico-iot', 8, 1000)).toBe(true);
    expect(pendingByZone(p.campo!)).toEqual({ cidade: 1, wit: 2, fazenda: 1 });
    for (let i = 0; i < 3; i++) { const s = completeTarget(p, i, 2000); expect('progress' in s && !s.done).toBe(true); p = (s as { progress: typeof p }).progress; }
    expect('reason' in completeTarget(p, 0, 2000)).toBe(true);   // já feito
    const end = completeTarget(p, 3, 2000) as { progress: typeof p; done: { coins: number } };
    expect(end.done.coins).toBe(fieldOf('tecnico-iot')!.coins);
    expect(end.progress.campo).toBeUndefined();
    expect(end.progress.coins).toBe(fieldOf('tecnico-iot')!.coins);
  });
  it('cesta do padeiro: precisa dos pães, gasta um por casa e tem prazo', () => {
    let p = newProgress();
    expect('reason' in takeField(p, 'padeiro', 1, 0)).toBe(true);
    p = addItem(p, 'pao', 4);
    p = (takeField(p, 'padeiro', 1, 0) as { progress: typeof p }).progress;
    const s = completeTarget(p, 0, 60_000) as { progress: typeof p };
    expect(s.progress.itens.pao).toBe(3);
    expect('reason' in completeTarget(s.progress, 1, 6 * 60_000)).toBe(true);
    expect(sanitizeProgress(JSON.parse(JSON.stringify(s.progress))).campo).toEqual(s.progress.campo);
  });
});
