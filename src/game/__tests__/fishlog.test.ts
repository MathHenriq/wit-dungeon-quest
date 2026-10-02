import { describe, expect, it } from 'vitest';
import { addLog, byPeriod, logQuestion, MAX_LOG, periodOf, rareBySpot, sanitizeLog, type LogEntry } from '../fishlog';
import { addCatch, newProgress, sanitizeProgress } from '../progress';
import { FISH } from '../fishing';

const common = FISH.find(f => f.rarity === 'comum')!.id, rare = FISH.find(f => f.rarity === 'raro')!.id;
const e = (f: string, h: number, w: LogEntry['w']): LogEntry => ({ f, cm: 20, h, w, d: 1 });

describe('diário do lago', () => {
  it('guarda cada peixe pescado com hora e lugar, e sobrevive ao salvar', () => {
    const p = addCatch(newProgress(), common, 33, { h: 7, w: 'barco', d: 9 }).progress;
    expect(p.diario[0]).toEqual({ f: common, cm: 33, h: 7, w: 'barco', d: 9 });
    expect(sanitizeProgress(JSON.parse(JSON.stringify(p))).diario).toEqual(p.diario);
    expect(sanitizeLog([{ f: 'nada', cm: 1, h: 1, w: 'x', d: 1 }])).toHaveLength(0);
    let l: LogEntry[] = [];
    for (let k = 0; k < MAX_LOG + 5; k++) l = addLog(l, e(common, 8, 'margem'));
    expect(l).toHaveLength(MAX_LOG);
  });
  it('conta por período e por lugar, e a pergunta tem a resposta dos dados', () => {
    expect([2, 6, 13, 20].map(periodOf)).toEqual([0, 1, 2, 3]);
    const log = [...Array(5)].map(() => e(common, 14, 'margem')).concat([e(common, 8, 'funda'), e(rare, 21, 'barco'), e(rare, 22, 'barco'), e(common, 3, 'funda')]);
    expect(byPeriod(log)).toEqual([1, 1, 5, 2]);
    expect(rareBySpot(log)).toEqual([0, 0, 2]);
    expect(logQuestion(log.slice(0, 5), 0)).toBeNull();
    for (let d = 0; d < 6; d++) {
      const q = logQuestion(log, d)!;
      expect(q).toBeTruthy();
      expect(q.options[q.answer]).toMatch(/tarde|barco|margem/);
    }
  });
});

import { cleanLake, CLEAN_PAY, lakeLuck } from '../fishlog';
import { finishDelivery, takeDelivery, deliveryTerms } from '../deliveries';

describe('limpeza do lago e entrega expressa', () => {
  it('lixo pescado paga e o 3º do dia deixa o lago com mais peixe raro', () => {
    let p = { ...newProgress(), coins: 0 };
    for (let k = 1; k <= 3; k++) { const r = cleanLake(p, 50); p = r.progress; expect(r.n).toBe(k); expect(r.luckNow).toBe(k === 3); }
    expect(p.coins).toBe(3 * CLEAN_PAY);
    expect(lakeLuck(p, 50)).toBe(1);
    expect(lakeLuck(p, 51)).toBe(0);
    expect(cleanLake(p, 51).n).toBe(1);
  });
  it('expressa: menos tempo e o dobro das moedas', () => {
    const p = newProgress();
    const n = takeDelivery(p, 0.3, 0).progress.entrega!, x = takeDelivery(p, 0.3, 0, true).progress.entrega!;
    expect(x.ate).toBeLessThan(n.ate);
    const t = deliveryTerms(p, x.zona === 'wit');
    const done = finishDelivery({ ...p, coins: 0, entrega: x }, 1) as { coins: number };
    expect(done.coins).toBe(t.coins * 2);
  });
});
