import { describe, expect, it } from 'vitest';
import { legacyPacks, migrateStudent, type Wit1Student } from '../migration';
import { CARD_ID_BY_SHOP_NAME } from '@/lib/tcg/cards/catalog';
import { sanitizeProgress } from '../progress';
import { grimoirePoints } from '../grimoire';
import { earnedTitles } from '../titles';
import shopNames from '@/lib/tcg/__tests__/shop-names.json';

const base: Wit1Student = { id: 'a', level: 20, xp: 5000, coins: 300, diamonds: 10, characterClass: 'Mago', shopItems: [], materials: [], consumables: 0, attributePoints: 25, skillPoints: 12, titles: [] };

describe('migração WIT 1 → WIT 2', () => {
  it('converte moedas, cartas, pó, pacotes, pontos e títulos', () => {
    const names = (shopNames as string[]).filter(n => CARD_ID_BY_SHOP_NAME.has(n)).slice(0, 3);
    const r = migrateStudent({ ...base, shopItems: [...names, names[0], 'Item que não existe'], materials: [{ rarity: 'rare', quantity: 4 }], consumables: 2, titles: ['helper_of_week', 'xyz'] });
    if ('skipped' in r) throw new Error('não devia pular');
    const p = r.progress;
    expect(p.coins).toBe(300 + 10 * 20);
    expect(r.report.cards).toBe(4);
    expect(r.report.unknownItems).toEqual(['Item que não existe']);
    expect(p.collection[CARD_ID_BY_SHOP_NAME.get(names[0])!]).toBeGreaterThanOrEqual(2);
    expect(p.po.rare).toBe(Math.round(25 / 2 * 4));
    expect(p.po.common).toBe(5);
    expect(p.pacotes).toEqual({ comum: 4, raro: 1 });
    expect(r.report.talentPoints).toBe(3);                          // (25 + 12) / 10
    expect(grimoirePoints(p)).toBe(3);
    expect(p.caminhoSugerido).toBe('sabio');
    expect(p.caminho).toBeUndefined();                              // a escolha é do aluno
    expect(earnedTitles(p).map(t => t.id)).toEqual(expect.arrayContaining(['veterano', 'ajudante-semana']));
    expect(sanitizeProgress(JSON.parse(JSON.stringify(p)))).toEqual(sanitizeProgress(p));
  });
  it('conta de teste fica de fora; pontos têm teto; pacotes por nível', () => {
    expect(migrateStudent({ ...base, isTest: true })).toEqual({ skipped: 'conta de teste' });
    const r = migrateStudent({ ...base, attributePoints: 500, skillPoints: 500 });
    expect('progress' in r && r.report.talentPoints).toBe(6);
    expect(legacyPacks(1)).toEqual({});
    expect(legacyPacks(30)).toEqual({ comum: 6, raro: 2, epico: 1 });
  });
});
