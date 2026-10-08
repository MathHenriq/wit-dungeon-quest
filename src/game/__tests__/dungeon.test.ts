import { describe, expect, it } from 'vitest';
import {
  chooseBuff, doorTile, dungeonCard, FLOORS, generate, neighbor, NO_INPUT, petCap, petAffinity, reachableIn, RH, roomCount, RW,
  startRun, stepRun, type Enemy, type Input, type Run,
} from '../dungeon';
import { dps, WEAPONS, weapon } from '../dungeon-weapons';
import { skillOf } from '../dungeon-skills';
import { DUNGEON_PAID, finishPortal, forgeWeapon, hunterRank, portalOpen, RANK_XP, ARISE_WINS, brew, crystalsToDust, setSkills, portalRun, upgradeWeapon } from '../hunter';
import { addItem, newProgress } from '../progress';
import { CATALOG, CARD_BY_ID } from '@/lib/tcg/cards/catalog';

const steps = (run: Run, input: Input, secs: number) => { let r = run; for (let t = 0; t < secs; t += 0.05) r = stepRun(r, input, 0.05); return r; };
const foe = (run: Run, kind: Enemy['kind'], x: number, y: number, hp = 1000): Enemy => ({ id: 900 + run.seq, kind, x, y, hp, max: hp, cd: 99, t: 0, hit: 0, state: 'move', st: 0, vx: 0, vy: 0, burn: 0, burnDps: 0, freeze: 0, stun: 0, phase: 1, next: 0 });
/** Sala de luta só com o inimigo dado, portas trancadas. */
function arena(seed: number, e: (r: Run) => Enemy[], o: Partial<Run['p']> = {}): Run {
  const run = startRun({ seed, rank: 0 });
  const room = run.d.rooms.findIndex(r => r.kind === 'normal');
  const r: Run = { ...run, room, breaks: run.breaks.map((b, i) => (i === room ? [] : b)), cleared: run.cleared.map((c, i) => (i === room ? false : c)) };
  r.d = { ...r.d, rooms: r.d.rooms.map((x, i) => (i === room ? { ...x, rocks: [], breaks: [], spawns: [{ kind: 'goblin', x: 1.5, y: 1.5, wave: 9 }] } : x)) };
  return { ...r, p: { ...r.p, x: 8.5, y: 5.5, ...o }, enemies: e(r) };
}

describe('masmorra: mapa', () => {
  it('mesma semente, mesmo andar; salas ligadas; o fim na mais longe; escada nos andares 1–2 e chefe no 3; portas e monstros alcançáveis', () => {
    expect(generate(7, 2, 1)).toEqual(generate(7, 2, 1));
    expect(generate(7, 2, 1)).not.toEqual(generate(7, 2, 2));
    for (let seed = 1; seed < 50; seed++) for (const floor of [1, 2, 3]) {
      const rank = seed % 6, d = generate(seed, rank, floor);
      expect(d.rooms).toHaveLength(roomCount(rank, floor));
      const seen = new Set([0]), q = [0], dist = [0];
      while (q.length) { const c = q.shift()!; for (const s of d.rooms[c].doors) { const n = neighbor(d, c, s); expect(n).toBeGreaterThanOrEqual(0); if (!seen.has(n)) { seen.add(n); dist[n] = dist[c] + 1; q.push(n); } } }
      expect(seen.size).toBe(d.rooms.length);
      expect(dist[d.end]).toBe(Math.max(...dist));
      expect(d.rooms[d.end].kind).toBe(floor === FLOORS ? 'chefe' : 'fim');
      for (const r of d.rooms) {
        const ok = reachableIn(r);
        for (const s of r.doors) expect(ok.has(doorTile(s).join(',')), `semente ${seed}`).toBe(true);
        for (const sp of r.spawns) expect(ok.has(`${Math.floor(sp.x)},${Math.floor(sp.y)}`)).toBe(true);
        for (const b of r.breaks) expect(b.x > 0 && b.y > 0 && b.x < RW - 1 && b.y < RH - 1).toBe(true);
      }
    }
  });
  it('a sala do começo já vem aberta; a vizinha de luta tranca até limpar as ondas', () => {
    let run = startRun({ seed: 11, rank: 1 });
    expect(run.cleared[run.d.start]).toBe(true);
    const side = run.d.rooms[run.d.start].doors[0];
    const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[side];
    run = steps(run, { ...NO_INPUT, mx: dir[0], my: dir[1] }, 3);
    expect(run.room).toBe(neighbor(run.d, run.d.start, side));
    const kind = run.d.rooms[run.room].kind;
    if (kind === 'normal') { expect(run.enemies.length).toBeGreaterThan(0); expect(run.cleared[run.room]).toBe(false); }
  });
});

describe('masmorra: combate', () => {
  it('espada (curta) tira mais vida que a pistola (longa) no mesmo tempo, sem gastar mana', () => {
    const near = arena(3, r => [foe(r, 'golem', 9.6, 5.5)]);
    const far = arena(3, r => [foe(r, 'golem', 14.5, 5.5)], { hand: 1 });
    const a = steps(near, { ...NO_INPUT, attack: true }, 3), b = steps(far, { ...NO_INPUT, attack: true }, 3);
    const lostA = 1000 - a.enemies[0].hp, lostB = 1000 - b.enemies[0].hp;
    expect(lostA).toBeGreaterThan(lostB * 1.4);
    expect(a.p.mana).toBeGreaterThanOrEqual(near.p.mana);
    for (const t of [0, 1, 2, 3]) {
      const c = WEAPONS.filter(w => w.kind === 'curta' && w.tier === t), l = WEAPONS.filter(w => w.kind === 'longa' && w.tier === t);
      if (c.length && l.length) expect(Math.max(...c.map(dps)) / Math.max(...l.map(dps))).toBeGreaterThan(1.5);
    }
  });
  it('arma longa gasta mana; sem mana não atira (e avisa)', () => {
    let run = arena(4, r => [foe(r, 'golem', 14.5, 5.5)], { hand: 1, mana: 3, manaMax: 3, arms: [{ id: 'espada', lvl: 0 }, { id: 'canhao', lvl: 0 }] });
    let nomana = false;
    for (let k = 0; k < 40; k++) { run = stepRun(run, { ...NO_INPUT, attack: true }, 0.05); if (run.ev.some(e => e.k === 'nomana')) nomana = true; }
    expect(nomana).toBe(true);
    expect(run.p.mana).toBeLessThan(4);
  });
  it('a espada corta o tiro inimigo que pega', () => {
    let run = arena(5, r => [foe(r, 'golem', 14.5, 5.5)]);
    run = { ...run, shots: [{ id: 1, x: 9.6, y: 5.5, vx: -1, vy: 0, mine: false, life: 3, dmg: 1, r: 0.15, kind: 'orbe' }] };
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    expect(run.shots.filter(s => !s.mine)).toHaveLength(0);
  });
  it('todo golpe de goblin é avisado no chão antes de machucar; a esquiva escapa', () => {
    let run = arena(6, r => [{ ...foe(r, 'goblin', 9.3, 5.5, 100), cd: 0 }], { armor: 0, armorMax: 0 });
    let warned = false, hurtAt = -1;
    for (let k = 0; k < 40 && hurtAt < 0; k++) { run = stepRun(run, NO_INPUT, 0.05); if (run.warns.length) warned = true; if (run.p.hp < run.p.max) hurtAt = k; }
    expect(warned).toBe(true);
    expect(hurtAt).toBeGreaterThan(5);     // pelo menos ~0,3 s de aviso
    let dodge = arena(6, r => [{ ...foe(r, 'goblin', 9.3, 5.5, 100), cd: 0 }], { armor: 0, armorMax: 0 });
    for (let k = 0; k < 40; k++) dodge = stepRun(dodge, { ...NO_INPUT, mx: -1, dodge: dodge.warns.some(w => w.t < 0.15) }, 0.05);
    expect(dodge.p.hp).toBe(dodge.p.max);
  });
  it('escudo segura o golpe e volta sozinho; perdeu toda a vida, perdeu a partida', () => {
    let run = arena(7, r => [foe(r, 'golem', 14.5, 5.5)], { armor: 1, armorMax: 1, hp: 1, max: 1 });
    run = { ...run, warns: [{ id: 1, kind: 'circle', x: run.p.x, y: run.p.y, r: 1, x2: 0, y2: 0, t: 0.01, total: 0.5, dmg: 1, src: -1 }] };
    run = stepRun(run, NO_INPUT, 0.05);
    expect(run.p.armor).toBe(0); expect(run.p.hp).toBe(1);
    run = steps(run, NO_INPUT, 4);
    expect(run.p.armor).toBe(1);
    run = { ...run, p: { ...run.p, armor: 0, armorT: 5, inv: 0 }, warns: [{ id: 2, kind: 'circle', x: run.p.x, y: run.p.y, r: 1, x2: 0, y2: 0, t: 0.01, total: 0.5, dmg: 1, src: -1 }] };
    expect(stepRun(run, NO_INPUT, 0.05).result).toBe('lose');
  });
  it('carta de fogo explode e queima; carta de raio cai em até 3 inimigos', () => {
    const fire = skillOf(CATALOG.find(c => c.type === 'attack' && c.element === 'Fire' && (c.damage ?? 0) > 0)!)!;
    let run = arena(8, r => [foe(r, 'golem', 11.5, 5.5)], { skills: [fire], skillCd: [0] });
    run = stepRun(run, { ...NO_INPUT, skill: 0 }, 0.05);
    expect(run.p.skillCd[0]).toBeGreaterThan(0);
    run = steps(run, NO_INPUT, 1);
    expect(run.enemies[0].hp).toBeLessThan(1000 - fire.dmg + 1);
    const bolt = skillOf(CATALOG.find(c => c.type === 'attack' && c.element === 'Electric' && (c.damage ?? 0) > 0)!)!;
    let r2 = arena(9, r => [foe(r, 'golem', 12, 3), foe(r, 'golem', 4, 8), foe(r, 'golem', 13, 8), foe(r, 'golem', 3, 2)], { skills: [bolt], skillCd: [0] });
    r2 = stepRun(r2, { ...NO_INPUT, skill: 0 }, 0.05);
    expect(r2.enemies.filter(e => e.hp < e.max)).toHaveLength(3);
  });
});

describe('masmorra: pet, andares e chefe', () => {
  it('o pet cata o que tem espaço; o tipo preferido cabe o dobro', () => {
    expect(petAffinity('pet-raposa-chama')).toBe('cristal');
    expect(petAffinity('pet-toupeira-pedra')).toBe('minerio');
    expect(petCap('pet-raposa-chama', 'cristal')).toBe(petCap('pet-raposa-chama', 'erva') * 2);
    let run = arena(10, r => [foe(r, 'golem', 15, 9)]);
    run = { ...run, loot: Array.from({ length: 30 }, (_, k) => ({ id: 500 + k, x: 7 + (k % 5) * 0.3, y: 5 + Math.floor(k / 5) * 0.3, item: 'erva:cura', n: 1 })) };
    run = steps(run, NO_INPUT, 12);
    expect(run.pet.bag.erva).toBe(petCap(run.pet.id, 'erva'));
    expect(run.pet.items['erva:cura']).toBe(petCap(run.pet.id, 'erva'));
  });
  it('pedra com minério quebra no golpe e solta minério', () => {
    let run = arena(11, r => [foe(r, 'golem', 15, 9)]);
    run = { ...run, breaks: run.breaks.map((b, i) => (i === run.room ? [{ x: 9, y: 5, kind: 'minerio' as const, hp: 5 }] : b)) };
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    expect(run.loot.some(l => l.item.startsWith('minerio:'))).toBe(true);
  });
  it('escada → SISTEMA oferece 3 bênçãos → próximo andar; no 3º, o chefe; vencer o chefe vence o portal', () => {
    let run = startRun({ seed: 21, rank: 0 });
    const fim = run.d.end;
    run = { ...run, room: fim, p: { ...run.p, x: 8.5, y: 5.5 } };
    run = stepRun(run, NO_INPUT, 0.05);
    expect(run.choice).toHaveLength(3);
    expect(stepRun(run, { ...NO_INPUT, mx: 1 }, 0.05).p.x).toBe(run.p.x);   // parado esperando a escolha
    run = chooseBuff(run, run.choice![0]);
    expect(run.floor).toBe(2); expect(run.buffs).toHaveLength(1); expect(run.choice).toBeUndefined();
    run = { ...run, room: run.d.end, p: { ...run.p, x: 8.5, y: 5.5 } };
    run = stepRun(run, NO_INPUT, 0.05);
    run = chooseBuff(run, run.choice![1]);
    expect(run.floor).toBe(3);
    expect(run.d.rooms[run.d.end].kind).toBe('chefe');
    run = { ...run, room: run.d.end, cleared: run.cleared.map((c, i) => (i === run.d.end ? false : c)), enemies: [] };
    expect(stepRun(run, NO_INPUT, 0.05).result).toBe('win');
  });
  it('chefe muda de fase com a vida e avisa cada golpe', () => {
    let run = arena(12, r => [{ ...foe(r, 'chefe', 8.5, 2.5, 300), cd: 0 }]);
    run = { ...run, enemies: [{ ...run.enemies[0], hp: 90, max: 300 }] };
    let phase = 0, warned = false;
    for (let k = 0; k < 60; k++) { run = stepRun(run, NO_INPUT, 0.05); for (const e of run.ev) if (e.k === 'phase') phase = e.phase; if (run.warns.length) warned = true; }
    expect(phase).toBe(3); expect(warned).toBe(true);
  });
});

describe('masmorra: cartas e armas', () => {
  it('toda carta de Ataque vira habilidade; cura e suporte não; Épica+ tem efeito próprio', () => {
    let n = 0;
    for (const c of CATALOG) {
      const s = skillOf(c);
      if (c.type === 'attack' && (c.damage ?? 0) > 0) { expect(s, c.id).not.toBeNull(); expect(s!.dmg).toBeGreaterThan(0); expect(s!.cd).toBeGreaterThan(0); n++; expect(s!.ownVfx).toBe(['epic', 'legendary', 'mythic', 'unknown'].includes(c.rarity)); }
      else expect(s).toBeNull();
    }
    expect(n).toBeGreaterThan(100);
    expect(skillOf(CATALOG.find(c => c.name === 'Semente dos Deuses')!)).toBeNull();
  });
  it('arma: todas válidas', () => { for (const w of WEAPONS) { expect(w.dmg).toBeGreaterThan(0); expect(weapon(w.id)).toBe(w); } });
});

describe('caçador', () => {
  it('rank pela XP; portal abre pela Torre ou pelo rank', () => {
    expect(hunterRank(0)).toBe(0); expect(hunterRank(RANK_XP[2])).toBe(2); expect(hunterRank(1e6)).toBe(5);
    const p = newProgress();
    expect(portalOpen(p, 0).ok).toBe(true); expect(portalOpen(p, 1).ok).toBe(false);
    expect(portalOpen({ ...p, towerMax: 10 }, 1).ok).toBe(true);
    expect(portalOpen({ ...p, masmorra: { ...p.masmorra, xp: RANK_XP[3] } }, 3).ok).toBe(true);
  });
  it('prêmio: carta do chefe e moedas com teto nas 3 pagas; perdeu, metade dos itens e das moedas; poções voltam', () => {
    const now = Date.UTC(2026, 9, 9, 15);
    const base = startRun({ seed: 1, rank: 0, potions: { vida: 1, mana: 0 } });
    const win: Run = { ...base, result: 'win', gold: 500, kills: 20, pet: { ...base.pet, items: { 'erva:cura': 4, 'cristal:azul': 2 } } };
    let p = newProgress();
    const c0 = p.coins;
    for (let k = 0; k < DUNGEON_PAID; k++) {
      const r = finishPortal(p, win, now);
      expect(r.paid).toBe(true); expect(r.card).toBe(dungeonCard(0, 1)); expect(CARD_BY_ID.has(r.card!)).toBe(true);
      p = r.progress;
    }
    expect(p.coins - c0).toBeGreaterThanOrEqual(60 * DUNGEON_PAID);
    expect(p.itens['erva:cura']).toBe(12); expect(p.itens['pocao:vida']).toBe(3);
    const extra = finishPortal(p, win, now);
    expect(extra.paid).toBe(false); expect(extra.card).toBeUndefined(); expect(extra.xp).toBeGreaterThan(0);
    const lose = finishPortal(newProgress(), { ...win, result: 'lose', gold: 30 }, now);
    expect(lose.coins).toBe(15); expect(lose.items['erva:cura']).toBe(2); expect(lose.items['cristal:azul']).toBe(1);
  });
  it(`Arise: o chefe do rank vencido ${ARISE_WINS} vezes vira sombra`, () => {
    const base = startRun({ seed: 2, rank: 0 });
    let p = newProgress(), got;
    for (let k = 0; k < ARISE_WINS; k++) { const r = finishPortal(p, { ...base, result: 'win' }, Date.UTC(2026, 9, 9 + k)); p = r.progress; got = r.sombra ?? got; }
    expect(got).toBe('soldado'); expect(p.masmorra.sombras).toEqual(['soldado']); expect(p.masmorra.sombra).toBe('soldado');
  });
  it('ferreiro forja e sobe arma com minério e moedas; boticária faz poção; cristal vira pó', () => {
    let p = { ...newProgress(), coins: 5000 };
    expect(forgeWeapon(p, 'katana').ok).toBe(false);
    p = addItem(addItem(p, 'minerio:cobre', 20), 'minerio:ferro', 20);
    const f = forgeWeapon(p, 'katana'); expect(f.ok).toBe(true);
    if (f.ok) p = f.progress;
    expect(p.masmorra.armas.katana).toBe(0);
    const u = upgradeWeapon(p, 'katana'); expect(u.ok).toBe(true);
    if (u.ok) expect(u.progress.masmorra.armas.katana).toBe(1);
    p = addItem(p, 'erva:cura', 3);
    const b = brew(p, 'vida'); expect(b.ok).toBe(true);
    if (b.ok) expect(b.progress.itens['pocao:vida']).toBe(1);
    const c = crystalsToDust(addItem(p, 'cristal:roxo', 5), 'cristal:roxo');
    expect(c.ok && c.progress.po.rare).toBe(20);
  });
  it('habilidades só das cartas que tem; poções saem da mochila ao entrar no portal', () => {
    let p = newProgress();
    const atk = Object.keys(p.collection).find(id => skillOf(CARD_BY_ID.get(id)!));
    p = setSkills(p, [atk!, 'carta-que-nao-existe']);
    expect(p.masmorra.cartas).toEqual([atk]);
    p = addItem(p, 'pocao:vida', 5);
    const r = portalRun(p, 0, 9, 'pet-raposa-chama');
    expect(r.options.potions).toEqual({ vida: 2, mana: 0 });
    expect(r.progress.itens['pocao:vida']).toBe(3);
    expect(r.options.skills).toHaveLength(1);
  });
});
