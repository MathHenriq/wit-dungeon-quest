import { describe, expect, it } from 'vitest';
import { newProgress, sanitizeProgress } from '../progress';
import { buyReward, cancelTicket, deliverTicket, MAX_PENDING, pending, ticketCode } from '../room-rewards';

describe('Recompensas da Sala', () => {
  it('compra gera ticket com código, desconta moedas e respeita o limite', () => {
    let p = { ...newProgress(), coins: 5000 };
    const a = buyReward(p, 'musica', 100, 7);
    if (!a.ok) throw new Error('devia comprar');
    expect(a.progress.coins).toBe(4400);
    expect(a.ticket.code).toMatch(/^[A-Z2-9]{4}$/);
    p = a.progress;
    for (let i = 1; i < MAX_PENDING; i++) { const r = buyReward(p, 'lugar', 100, 7 + i); if (!r.ok) throw new Error('x'); p = r.progress; }
    expect(pending(p)).toHaveLength(MAX_PENDING);
    expect(buyReward(p, 'lugar', 100, 99).ok).toBe(false);
    // professor entrega: libera espaço; cancelar devolve moedas
    const code = p.tickets[0].code;
    const d = deliverTicket(p, code, 101);
    expect(pending(d)).toHaveLength(MAX_PENDING - 1);
    const c = cancelTicket(d, d.tickets[1].code);
    expect(c.coins).toBe(d.coins + d.tickets[1].preco);
    expect(sanitizeProgress(JSON.parse(JSON.stringify(c))).tickets).toEqual(c.tickets);
  });
  it('sem moedas não compra; códigos não repetem', () => {
    expect(buyReward(newProgress(), 'vr-10', 1, 1).ok).toBe(false);
    expect(ticketCode(1)).not.toBe(ticketCode(2));
  });
});
