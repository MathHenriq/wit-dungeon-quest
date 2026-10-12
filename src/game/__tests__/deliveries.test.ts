import { describe, expect, it } from 'vitest';
import { buildZone } from '../world/world';
import { DESTINOS, finishDelivery, takeDelivery } from '../deliveries';
import { newProgress } from '../progress';

describe('entregas', () => {
  it('toda porta de entrega existe no mapa da área', () => {
    const zones = new Map<string, Set<string>>();
    for (const d of DESTINOS) {
      if (!zones.has(d.zona)) zones.set(d.zona, new Set(buildZone(d.zona).doors.map(x => x.building)));
      expect(zones.get(d.zona)!.has(d.porta), `${d.zona}/${d.porta}`).toBe(true);
    }
  }, 30_000);

  it('no prazo paga inteiro; atrasado, metade', () => {
    const t = takeDelivery(newProgress(), 0.5, 1000);
    const ok = finishDelivery(t.progress, 1001) as { progress: import('../progress').Progress; coins: number; late: boolean };
    const late = finishDelivery(t.progress, t.progress.entrega!.ate + 1) as { coins: number };
    expect(ok.late).toBe(false);
    expect(late.coins).toBe(Math.round(ok.coins / 2));
    expect(ok.progress.entrega).toBeUndefined();
    expect(ok.progress.stats.entregas).toBe(1);
    expect(ok.progress.xp.entregador).toBeGreaterThan(0);
  });
});

describe('encomendas das profissões', () => {
  it('o músico leva um disco: sem disco não entrega; com disco gasta e ganha XP de músico', async () => {
    const { takeOrder } = await import('../deliveries');
    const { addItem, newProgress } = await import('../progress');
    const t = takeOrder(newProgress(), 'musico', 0.3, 1000);
    if ('reason' in t) throw new Error(t.reason);
    expect('reason' in finishDelivery(t.progress, 2000)!).toBe(true);
    const r = finishDelivery(addItem(t.progress, 'disco-ouro', 1), 2000)!;
    if ('reason' in r) throw new Error(r.reason);
    expect(r.progress.itens['disco-ouro']).toBeUndefined();
    expect(r.progress.xp.musico).toBeGreaterThan(0);
  });
});
