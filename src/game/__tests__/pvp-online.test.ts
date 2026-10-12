import { describe, expect, it } from 'vitest';
import { ActionQueue, buildMatch, hostOf, validDeck, type PvpHello, type PvpStart } from '../pvp-online';
import { mirrorState } from '@/lib/tcg/mirror';
import { starterDeck } from '@/lib/tcg/opponents';
import { CATALOG } from '@/lib/tcg/cards/catalog';

const deck = starterDeck().map(c => c.id);
const hello = (tab: string, nick: string): PvpHello => ({ tab, nick, look: {} as never, deck });

describe('PvP online', () => {
  it('os dois concordam sobre quem é o anfitrião', () => {
    const a = hello('aaa', 'Ana'), b = hello('bbb', 'Beto');
    expect(hostOf(a, b).tab).toBe('aaa');
    expect(hostOf(b, a).tab).toBe('aaa');
  });
  it('deck do colega: 20 cartas que existem, sem passar das cópias', () => {
    expect(validDeck(deck)).toHaveLength(20);
    expect(validDeck(deck.slice(0, 19))).toBeNull();
    expect(validDeck([...deck.slice(0, 19), 'nao-existe'])).toBeNull();
    const single = CATALOG.find(c => c.rarity === 'legendary')!.id;
    expect(validDeck([...deck.slice(0, 18), single, single])).toBeNull();
  });
  it('o convidado vê o espelho da partida do anfitrião', () => {
    const st: PvpStart = { key: 'k', seed: 99, first: 1, host: hello('aaa', 'Ana'), guest: hello('bbb', 'Beto') };
    const h = buildMatch(st, true)!, g = buildMatch(st, false)!;
    expect(h.players[0].name).toBe('Ana');
    expect(g.players[0].name).toBe('Beto');
    expect(JSON.parse(JSON.stringify(mirrorState(g)))).toEqual(JSON.parse(JSON.stringify(h)));
    expect(g.active).toBe(0);   // o anfitrião sorteou que o convidado (1) começa: no espelho é "eu"
  });
  it('fila de jogadas: entrega em ordem e pede a que faltou', () => {
    const q = new ActionQueue();
    expect(q.push(0, { t: 'end' }).ready).toHaveLength(1);
    const r = q.push(2, { t: 'mull' });
    expect(r.ready).toHaveLength(0);
    expect(r.missing).toBe(1);
    const r2 = q.push(1, { t: 'end' });
    expect(r2.ready.map(a => a.t)).toEqual(['end', 'mull']);
    expect(r2.missing).toBeNull();
    expect(q.push(1, { t: 'end' }).ready).toHaveLength(0);   // repetida: ignora
  });
});
