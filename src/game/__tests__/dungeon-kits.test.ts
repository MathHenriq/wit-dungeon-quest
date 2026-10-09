import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { KITS, kitOf, kitSignature } from '../dungeon-kits';
import { addStatus, react, type Bag } from '../dungeon-moves';
import { skillOf, kitTags } from '../dungeon-skills';
import { NO_INPUT, startRun, stepRun, newEnemy, type Run } from '../dungeon';

describe('golpes das cartas (kits)', () => {
  it('toda carta de Ataque tem kit; nenhum kit sobra; não há dois kits iguais', () => {
    const atk = CATALOG.filter(c => c.type === 'attack');
    expect(atk).toHaveLength(168);
    for (const c of atk) expect(kitOf(c.id), c.id).toBeDefined();
    const ids = new Set(atk.map(c => c.id));
    for (const k of KITS) expect(ids.has(k.card), k.card).toBe(true);
    const sigs = KITS.map(kitSignature);
    expect(new Set(sigs).size).toBe(KITS.length);
    for (const k of KITS) expect(k.about.length, k.card).toBeGreaterThan(10);
  });
  it('as Épicas para cima têm a mecânica do anime: Titã gigante, Zoltraak com cena, Kamehameha carrega, Amaterasu chama negra', () => {
    const m = (id: string) => kitOf(id)!.moves;
    expect(m('tita-colossal').some(x => x.m === 'transformar' && (x.scale ?? 1) > 2)).toBe(true);
    expect(m('zoltraak')[0].m).toBe('cinematica');
    expect(m('kamehameha').some(x => x.m === 'raio' && x.charge)).toBe(true);
    expect(m('amaterasu').some(x => 'hit' in x && x.hit.st === 'chamaNegra')).toBe(true);
    expect(m('howitzer-impact').some(x => x.m === 'tornado' && x.hit.st === 'queimar')).toBe(true);
    expect(m('star-burst-stream').some(x => x.m === 'rajada' && x.n === 16)).toBe(true);
    expect(m('beru-o-rei-formiga').some(x => x.m === 'invocar' && x.kind === 'formiga')).toBe(true);
    expect(kitOf('contrato-com-o-diabo')!.custo).toBe('coracao');
  });
  it('etiquetas do Códex: forma, estados e reações', () => {
    const t = kitTags(skillOf(CATALOG.find(c => c.id === 'respiracao-da-agua')!)!);
    expect(t.formas).toContain('projétil'); expect(t.estados).toContain('Molhado'); expect(t.reacoes.join(' ')).toMatch(/congela/);
  });
  it('cada peça funciona no motor sem erro (todas as 168 cartas)', () => {
    for (const k of KITS) {
      const c = CATALOG.find(x => x.id === k.card)!;
      let run = startRun({ seed: 3, rank: 2, skills: [skillOf(c)!], hearts: 99 });
      const room = run.d.rooms.findIndex(r => r.kind === 'normal');
      run = { ...run, room, cleared: run.cleared.map((x, i) => (i === room ? false : x)), d: { ...run.d, rooms: run.d.rooms.map((x, i) => (i === room ? { ...x, rocks: [], breaks: [], haz: [], spawns: [{ kind: 'goblin', x: 1.5, y: 1.5, wave: 9 }] } : x)) } };
      run = { ...run, p: { ...run.p, x: 6.5, y: 5.5, skillCd: [0] }, enemies: [{ ...newEnemy(run, 'golem', 7.9, 5.5), hp: 5000, max: 5000, cd: 99, cardCd: 99 }, { ...newEnemy(run, 'goblin', 9.8, 5.2), hp: 5000, max: 5000, cd: 99, cardCd: 99 }] } as Run;
      run = stepRun(run, { ...NO_INPUT, skill: 0, held: 0 }, 0.05);
      for (let t = 0; t < 4; t += 0.05) run = stepRun(run, NO_INPUT, 0.05);
      expect(run.ev.length >= 0, k.card).toBe(true);
      const dealt = run.enemies.reduce((a, e) => a + (e.max - e.hp), 0);
      const support = k.moves.every(x => x.m === 'buff' || x.m === 'transformar' || x.m === 'invocar' || x.m === 'cinematica' || x.m === 'parar_tiros');
      if (!support) expect(dealt + run.kills * 1000, k.card).toBeGreaterThan(0);
    }
  });
});

describe('reações entre elementos (não é fraqueza: depende do estado que o alvo já tem)', () => {
  it('molhado + gelo congela; molhado + raio dá choque; semente + fogo vira incêndio; veneno + fogo explode; fogo derrete o gelo; vento espalha', () => {
    const b = (s: Parameters<typeof addStatus>[1]): Bag => { const x: Bag = {}; addStatus(x, s, 3, 5); return x; };
    let x = b('molhado'); expect(react(x, 'Ice', 'lento', false).id).toBe('congelou'); expect(x.congelado).toBeDefined();
    expect(react(b('molhado'), 'Electric', 'eletrizado', false)).toMatchObject({ id: 'choque', chain: true, mult: 2 });
    expect(react(b('semente'), 'Fire', 'queimar', false).id).toBe('incendio');
    expect(react(b('veneno'), 'Fire', 'queimar', false).burst).toBe(1);
    x = b('congelado'); expect(react(x, 'Fire', undefined, false).id).toBe('derreteu'); expect(x.congelado).toBeUndefined();
    expect(react(b('congelado'), 'Steel', undefined, true).id).toBe('estilhacou');
    expect(react(b('queimar'), 'Flying', undefined, false).id).toBe('espalhou');
    expect(react({}, 'Fire', 'queimar', false).id).toBeUndefined();
  });
  it('3 raios seguidos paralisam', () => {
    const x: Bag = {};
    expect(addStatus(x, 'eletrizado', 3)).toBe(false);
    expect(addStatus(x, 'eletrizado', 3)).toBe(false);
    expect(addStatus(x, 'eletrizado', 3)).toBe(true);
    expect(x.atordoado).toBeDefined();
  });
});
