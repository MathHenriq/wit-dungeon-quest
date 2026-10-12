import { describe, expect, it } from 'vitest';
import { chartQuiz, dayPrice, mean, priceSeries, spread } from '../charts';

describe('ler o gráfico (comerciante)', () => {
  it('as respostas batem com os números do gráfico, em vários dias', () => {
    for (let day = 20_700; day < 20_760; day++) {
      const qs = chartQuiz(day, day * 7);
      expect(qs.map(q => q.kind)).toEqual(['pico', 'direcao', 'estavel', 'media', 'amanha']);
      for (const q of qs) {
        if (q.kind === 'pico') { expect(q.series[q.answer]).toBe(Math.max(...q.series)); expect(q.series.filter(v => v === Math.max(...q.series))).toHaveLength(1); }
        if (q.kind === 'direcao') expect(q.answer === 'subiu' ? q.series[9] > q.series[8] : q.series[9] < q.series[8]).toBe(true);
        if (q.kind === 'estavel') { const sp = q.series.map(spread); expect(sp[q.answer]).toBe(Math.min(...sp)); }
        if (q.kind === 'media') { expect(q.options[q.answer]).toBe(Math.round(mean(q.series))); expect(new Set(q.options).size).toBe(3); }
        if (q.kind === 'amanha') {
          expect(q.tomorrow).toBe(dayPrice(q.item, day + 1));
          expect(q.answer === 'sobe' ? q.tomorrow > q.series[9] : q.tomorrow < q.series[9]).toBe(true);
        }
      }
    }
  });
  it('a série termina hoje', () => {
    expect(priceSeries('pao', 20_727).at(-1)).toBe(dayPrice('pao', 20_727));
  });
});
