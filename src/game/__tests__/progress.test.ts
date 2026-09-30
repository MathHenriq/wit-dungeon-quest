import { describe, expect, it } from 'vitest';
import { bossFoe, tableFoe, TABLES_FOR_BOSS } from '@/lib/tcg/opponents';
import {
  activeDeckCards, applyDuel, bossUnlocked, buyMat, canGoUp, checkDeck, equipMat, newProgress, sanitizeProgress, suggestDeck, tablesWon,
} from '../progress';

describe('progresso', () => {
  it('começa com o deck inicial válido', () => {
    const p = newProgress();
    expect(checkDeck(p.decks[0], p.collection).ok).toBe(true);
    expect(activeDeckCards(p)).toHaveLength(20);
    expect(p.towerMax).toBe(1);
  });

  it('mesa: moedas cheias na 1ª vitória, 20% depois; derrota não muda nada', () => {
    const p = newProgress();
    const foe = tableFoe(1, 1, 'mesa-fogo', 'X');
    const lost = applyDuel(p, foe, false, 0);
    expect(lost.progress).toBe(p);
    const a = applyDuel(p, foe, true, 0);
    expect(a.result.coins).toBe(foe.coins);
    expect(a.result.firstWin).toBe(true);
    const b = applyDuel(a.progress, foe, true, 0);
    expect(b.result.coins).toBe(Math.max(1, Math.round(foe.coins * 0.2)));
    expect(b.progress.coins).toBe(foe.coins + b.result.coins);
  });

  it(`chefe libera depois de ${TABLES_FOR_BOSS} mesas, dá carta e libera o andar de cima`, () => {
    let p = newProgress();
    expect(bossUnlocked(p, 1)).toBe(false);
    for (let m = 1; m <= TABLES_FOR_BOSS; m++) p = applyDuel(p, tableFoe(1, m, 'mesa-agua', 'X'), true, 0).progress;
    expect(tablesWon(p, 1)).toBe(TABLES_FOR_BOSS);
    expect(bossUnlocked(p, 1)).toBe(true);
    expect(canGoUp(p, 1)).toBe(false);
    const boss = bossFoe(1, 'Chefe');
    const r = applyDuel(p, boss, true, 0.5);
    expect(r.result.card).toBeTruthy();
    expect(r.progress.collection[r.result.card!.id]).toBe((p.collection[r.result.card!.id] ?? 0) + 1);
    expect(r.result.unlocked).toBe(2);
    expect(canGoUp(r.progress, 1)).toBe(true);
    // vencer de novo: carta de novo, mas não libera andar outra vez
    const r2 = applyDuel(r.progress, boss, true, 0.1);
    expect(r2.result.card).toBeTruthy();
    expect(r2.result.unlocked).toBeUndefined();
  });

  it('deck inválido é recusado com o motivo', () => {
    const p = newProgress();
    const ids = p.decks[0].slice(0, 19);
    expect(checkDeck(ids, p.collection).problems[0]).toMatch(/20 cartas/);
    const tooMany = [...p.decks[0].slice(0, 17), ...Array(3).fill(p.decks[0][0])];
    expect(checkDeck(tooMany, p.collection).ok).toBe(false);
  });

  it('progresso salvo estragado vira um progresso válido', () => {
    expect(sanitizeProgress('x').towerMax).toBe(1);
    const s = sanitizeProgress({ coins: -5, collection: { 'nao-existe': 3 }, towerMax: 500, wins: { 'torre-1-mesa-1': 2, 'x<y': 1 }, decks: [['nao-existe']] });
    expect(s.coins).toBe(0);
    expect(s.towerMax).toBe(100);
    expect(s.wins).toEqual({ 'torre-1-mesa-1': 2 });
    expect(Object.keys(s.collection).length).toBeGreaterThan(0);
    expect(s.decks[0]).toEqual([]);
  });

  it('a sugestão monta um deck válido com a coleção, e a carta rara nova entra', () => {
    const p = newProgress();
    const d = suggestDeck(p.collection);
    expect(checkDeck(d, p.collection).ok).toBe(true);
    const boss = bossFoe(30, 'X');
    const rare = boss.deck.find(c => c.rarity === 'epic' || c.rarity === 'legendary')!;
    const col = { ...p.collection, [rare.id]: 1 };
    expect(suggestDeck(col, rare.element)).toContain(rare.id);
  });

  it('tapetes: começa com o Clássico; compra desconta moedas e já equipa; recusa sem moedas, repetido ou em breve', () => {
    const p = newProgress();
    expect(p.mats).toEqual(['classico']);
    expect(p.mat).toBe('classico');
    expect(buyMat(p, 'circuito').ok).toBe(false);
    const rich = { ...p, coins: 1000 };
    const r = buyMat(rich, 'circuito');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.progress.coins).toBe(400);
    expect(r.progress.mat).toBe('circuito');
    expect(buyMat(r.progress, 'circuito').ok).toBe(false);
    expect(buyMat({ ...rich, coins: 99999 }, 'monstrinhos').ok).toBe(false);
    expect(equipMat(r.progress, 'classico').mat).toBe('classico');
    expect(equipMat(r.progress, 'vulcao').mat).toBe('circuito');
    // salvo estragado: tapete que não existe some, o Clássico nunca falta
    const s = sanitizeProgress({ mats: ['xx', 'noite'], mat: 'xx' });
    expect(s.mats).toEqual(['classico', 'noite']);
    expect(s.mat).toBe('classico');
  });
});
