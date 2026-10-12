import { describe, expect, it } from 'vitest';
import {
  BOSS_OF_RANK, cardChance, chooseBuff, doorTile, dungeonCard, FLOORS, generate, gradeOf, neighbor, newEnemy, NO_INPUT, petCap, petAffinity,
  reachableIn, RH, roomCount, RW, startRun, stepRun, warpTo, type Enemy, type Input, type Run,
} from '../dungeon';
import { dps, WEAPONS, weapon } from '../dungeon-weapons';
import { skillOf } from '../dungeon-skills';
import {
  DUNGEON_PAID, finishPortal, forgeWeapon, hunterLevel, hunterRank, portalOpen, RANK_XP, ARISE_WINS, brew, crystalsToDust, setSkills, portalRun,
  upgradeWeapon, spendPoint, pointsFree, weekSeed,
} from '../hunter';
import { addItem, newProgress } from '../progress';
import { CATALOG, CARD_BY_ID } from '@/lib/tcg/cards/catalog';

const steps = (run: Run, input: Input, secs: number) => { let r = run; for (let t = 0; t < secs; t += 0.05) r = stepRun(r, input, 0.05); return r; };
const skill = (id: string) => skillOf(CARD_BY_ID.get(id)!)!;
/** Sala de luta só com os inimigos dados, portas trancadas, sem pedras. */
function arena(seed: number, mk: (r: Run) => Enemy[], o: Partial<Run['p']> = {}, rank = 0): Run {
  const run = startRun({ seed, rank });
  const room = run.d.rooms.findIndex(r => r.kind === 'normal');
  let r: Run = { ...run, room, breaks: run.breaks.map((b, i) => (i === room ? [] : b)), cleared: run.cleared.map((c, i) => (i === room ? false : c)) };
  r.d = { ...r.d, rooms: r.d.rooms.map((x, i) => (i === room ? { ...x, rocks: [], breaks: [], haz: [], spawns: [{ kind: 'goblin', x: 1.5, y: 1.5, wave: 9 }] } : x)) };
  r = { ...r, p: { ...r.p, x: 8.5, y: 5.5, ...o } };
  return { ...r, enemies: mk(r) };
}
/** Inimigo de teste: muita vida, não ataca (recarga alta). */
const foe = (run: Run, kind: Enemy['kind'], x: number, y: number, hp = 1000, o: Partial<Enemy> = {}): Enemy => ({ ...newEnemy(run, kind, x, y), hp, max: hp, cd: 99, cardCd: 99, poise: 1e6, poiseMax: 1e6, ...o });

describe('masmorra: mapa', () => {
  it('mesma semente, mesmo andar; salas ligadas; fim na mais longe; mini-chefe no 3º e chefe no 5º; portas e monstros alcançáveis', () => {
    expect(generate(7, 2, 1)).toEqual(generate(7, 2, 1));
    expect(generate(7, 2, 1)).not.toEqual(generate(7, 2, 2));
    for (let seed = 1; seed < 40; seed++) for (const floor of [1, 3, 5]) {
      const rank = seed % 6, d = generate(seed, rank, floor);
      const main = d.rooms.filter(r => r.kind !== 'secreta');
      expect(main).toHaveLength(roomCount(rank, floor));
      const seen = new Set([0]), q = [0], dist = [0];
      while (q.length) { const c = q.shift()!; for (const s of d.rooms[c].doors) { const n = neighbor(d, c, s); expect(n).toBeGreaterThanOrEqual(0); if (!seen.has(n)) { seen.add(n); dist[n] = dist[c] + 1; q.push(n); } } }
      expect(seen.size).toBe(d.rooms.length);
      expect(d.rooms[d.end].kind).toBe(floor === FLOORS ? 'chefe' : floor === 3 ? 'elite' : 'fim');
      if (floor === FLOORS) expect(d.rooms[d.end].spawns[0].kind).toBe(BOSS_OF_RANK[rank]);
      for (const r of d.rooms) {
        const ok = reachableIn(r);
        for (const s of r.doors) expect(ok.has(doorTile(s).join(',')), `semente ${seed}`).toBe(true);
        for (const sp of r.spawns) { expect(ok.has(`${Math.floor(sp.x)},${Math.floor(sp.y)}`)).toBe(true); expect(r.haz.some(h => h.kind === 'lava' && h.x === Math.floor(sp.x) && h.y === Math.floor(sp.y))).toBe(false); }
        for (const b of r.breaks) expect(b.x > 0 && b.y > 0 && b.x < RW - 1 && b.y < RH - 1).toBe(true);
        // a sala secreta só liga com a parede rachada
        if (r.kind === 'secreta') { expect(r.doors).toHaveLength(1); const back = neighbor(d, d.rooms.indexOf(r), r.doors[0]); expect(d.rooms[back].secret).toBeDefined(); }
      }
    }
  });
  it('cartas nos inimigos crescem com o rank: portal E andar 1 sem carta; S com muitas', () => {
    expect(cardChance(0, 1)).toBe(0);
    expect(cardChance(5, 1)).toBeGreaterThan(0.5);
    const count = (rank: number, floor: number) => { let n = 0, c = 0; for (let s = 1; s < 30; s++) for (const r of generate(s, rank, floor).rooms) for (const sp of r.spawns) { n++; if (sp.cards?.length && sp.kind !== 'mago') c++; } return c / n; };
    expect(count(0, 1)).toBe(0);
    expect(count(5, 3)).toBeGreaterThan(0.4);
  });
  it('a sala do começo já vem aberta; a vizinha de luta tranca até limpar as ondas', () => {
    let run = startRun({ seed: 11, rank: 1 });
    expect(run.cleared[run.d.start]).toBe(true);
    const side = run.d.rooms[run.d.start].doors.find(s => s !== run.d.rooms[run.d.start].secret)!;
    const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[side];
    run = steps(run, { ...NO_INPUT, mx: dir[0], my: dir[1] }, 3);
    expect(run.room).toBe(neighbor(run.d, run.d.start, side));
    const kind = run.d.rooms[run.room].kind;
    if (kind === 'normal') { expect(run.enemies.length).toBeGreaterThan(0); expect(run.cleared[run.room]).toBe(false); }
  });
});

describe('masmorra: combate do caçador', () => {
  it('espada (curta) tira mais vida que a pistola (longa), sem gastar mana; curta ~2× o dano por segundo da longa', () => {
    const tap = (r: Run, secs: number) => { for (let t = 0; t < secs; t += 0.05) r = stepRun(r, { ...NO_INPUT, attack: Math.floor(t / 0.05) % 2 === 0 }, 0.05); return r; };
    const a = tap(arena(3, r => [foe(r, 'golem', 9.6, 5.5)]), 3);
    const b = steps(arena(3, r => [foe(r, 'golem', 14.5, 5.5)], { hand: 1 }), { ...NO_INPUT, attack: true }, 3);
    expect(1000 - a.enemies[0].hp).toBeGreaterThan((1000 - b.enemies[0].hp) * 1.4);
    for (const t of [0, 1, 2, 3]) {
      const c = WEAPONS.filter(w => w.kind === 'curta' && w.tier === t), l = WEAPONS.filter(w => w.kind === 'longa' && w.tier === t);
      if (c.length && l.length) expect(Math.max(...c.map(dps)) / Math.max(...l.map(dps))).toBeGreaterThan(1.5);
    }
  });
  it('combo de 3: o 3º golpe é o finalizador; segurar e soltar = golpe pesado; atacar logo depois da esquiva = investida', () => {
    let run = arena(4, r => [foe(r, 'golem', 9.6, 5.5)]);
    const kinds: string[] = [];
    for (let k = 0; k < 40 && kinds.length < 3; k++) { run = stepRun(run, { ...NO_INPUT, attack: k % 2 === 0, ax: 1, ay: 0 }, 0.05); for (const e of run.ev) if (e.k === 'swing') kinds.push(e.kind ?? ''); }
    expect(kinds).toEqual(['leve', 'leve', 'final']);
    run = arena(4, r => [foe(r, 'golem', 9.6, 5.5)]);
    let heavy = false;
    for (let k = 0; k < 14; k++) run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    run = stepRun(run, { ...NO_INPUT, attack: false, ax: 1, ay: 0 }, 0.05);
    heavy = run.ev.some(e => e.k === 'swing' && e.kind === 'pesado');
    expect(heavy).toBe(true);
    run = arena(4, r => [foe(r, 'golem', 12.5, 5.5)]);
    run = stepRun(run, { ...NO_INPUT, dodge: true, mx: 1 }, 0.05);
    run = steps(run, { ...NO_INPUT, mx: 1 }, 0.2);
    const x0 = run.p.x;
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    expect(run.ev.some(e => e.k === 'swing' && e.kind === 'investida')).toBe(true);
    expect(run.p.x).toBeGreaterThan(x0 + 1.5);
  });
  it('a espada devolve o tiro inimigo que pega', () => {
    let run = arena(5, r => [foe(r, 'golem', 14.5, 5.5)]);
    run = { ...run, shots: [{ id: 1, x: 9.6, y: 5.5, vx: -1, vy: 0, mine: false, life: 3, dmg: 1, r: 0.15, kind: 'orbe' }] };
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    expect(run.shots.filter(s => !s.mine)).toHaveLength(0);
    expect(run.shots.some(s => s.mine && s.vx > 0)).toBe(true);
  });
  it('todo golpe de goblin é avisado no chão antes de machucar; a esquiva escapa; esquivar no último instante = ESQUIVA PERFEITA', () => {
    let run = arena(6, r => [foe(r, 'goblin', 9.3, 5.5, 100, { cd: 0 })], { armor: 0, armorMax: 0 });
    let warned = false, hurtAt = -1;
    for (let k = 0; k < 40 && hurtAt < 0; k++) { run = stepRun(run, NO_INPUT, 0.05); if (run.warns.length) warned = true; if (run.p.hp < run.p.max) hurtAt = k; }
    expect(warned).toBe(true);
    expect(hurtAt).toBeGreaterThan(5);
    let dodge = arena(6, r => [foe(r, 'goblin', 9.3, 5.5, 100, { cd: 0 })], { armor: 0, armorMax: 0 });
    let perfect = false;
    for (let k = 0; k < 40; k++) { dodge = stepRun(dodge, { ...NO_INPUT, mx: -1, dodge: dodge.warns.some(w => w.t < 0.1) }, 0.05); if (dodge.ev.some(e => e.k === 'perfeita')) perfect = true; }
    expect(perfect).toBe(false);          // fugiu andando: não é perfeita
    dodge = arena(6, r => [foe(r, 'goblin', 9.3, 5.5, 100, { cd: 0 })], { armor: 0, armorMax: 0 });
    // parado dentro do vermelho, esquiva quando o golpe vai chegar
    for (let k = 0; k < 40 && !perfect; k++) { dodge = stepRun(dodge, { ...NO_INPUT, dodge: dodge.warns.some(w => w.t < 0.1 && w.dmg > 0) }, 0.05); if (dodge.ev.some(e => e.k === 'perfeita')) perfect = true; }
    expect(dodge.p.hp).toBe(dodge.p.max);
    expect(perfect).toBe(true);
  });
  it('escudo segura o golpe e volta sozinho; perdeu toda a vida, perdeu; Pedra da Ressurreição revive uma vez', () => {
    let run = arena(7, r => [foe(r, 'golem', 14.5, 5.5)], { armor: 1, armorMax: 1, hp: 1, max: 1 });
    run = { ...run, warns: [{ id: 1, kind: 'circle', x: run.p.x, y: run.p.y, r: 1, x2: 0, y2: 0, t: 0.01, total: 0.5, dmg: 1, src: -1 }] };
    run = stepRun(run, NO_INPUT, 0.05);
    expect(run.p.armor).toBe(0); expect(run.p.hp).toBe(1);
    run = steps(run, NO_INPUT, 6);
    expect(run.p.armor).toBe(1);
    const hit = (r: Run): Run => ({ ...r, p: { ...r.p, armor: 0, armorT: 5, inv: 0 }, warns: [{ id: 2, kind: 'circle', x: r.p.x, y: r.p.y, r: 1, x2: 0, y2: 0, t: 0.01, total: 0.5, dmg: 1, src: -1 }] });
    expect(stepRun(hit(run), NO_INPUT, 0.05).result).toBe('lose');
    const saved = stepRun(hit({ ...run, revive: 1 }), NO_INPUT, 0.05);
    expect(saved.result).toBeUndefined(); expect(saved.revived).toBe(true); expect(saved.ev.some(e => e.k === 'reviveu')).toBe(true);
    expect(stepRun(hit(steps(saved, NO_INPUT, 3)), NO_INPUT, 0.05).result).toBe('lose');
  });
  it('postura: golpes seguidos quebram a postura (atordoa); empurrão contra a parede machuca', () => {
    let run = arena(8, r => [{ ...foe(r, 'golem', 9.4, 5.5), poise: 20, poiseMax: 20 }]);
    let broke = false;
    for (let k = 0; k < 40 && !broke; k++) { run = stepRun(run, { ...NO_INPUT, attack: k % 2 === 0, ax: 1, ay: 0 }, 0.05); broke = run.ev.some(e => e.k === 'postura'); }
    expect(broke).toBe(true);
    expect(run.enemies[0].broken).toBeGreaterThan(0);
    let wall = arena(9, r => [foe(r, 'goblin', 14.6, 5.5, 500)], { x: 13.4 });
    wall = stepRun(wall, NO_INPUT, 0.05);
    wall = { ...wall, enemies: wall.enemies.map(e => ({ ...e, kbx: 14, kby: 0 })) };
    let slam = false;
    for (let k = 0; k < 10; k++) { wall = stepRun(wall, NO_INPUT, 0.05); if (wall.ev.some(e => e.k === 'parede')) slam = true; }
    expect(slam).toBe(true);
  });
  it('nota da sala: combo alto sem apanhar = S; apanhou muito = C', () => {
    expect(gradeOf(30, 0)).toBe('S'); expect(gradeOf(16, 1)).toBe('A'); expect(gradeOf(3, 4)).toBe('C');
  });
});

describe('masmorra: golpes das cartas', () => {
  it('Howitzer Impact: o tornado de fogo anda girando em círculos, acerta várias vezes e queima', () => {
    let run = arena(10, r => [foe(r, 'golem', 13.5, 5.5)], { skills: [skill('howitzer-impact')], skillCd: [0] });
    run = stepRun(run, { ...NO_INPUT, skill: 0 }, 0.05);
    const path: [number, number][] = [];
    let hits = 0;
    for (let k = 0; k < 30; k++) { run = stepRun(run, NO_INPUT, 0.05); const t = run.acts.find(a => a.mv.m === 'tornado'); if (t) path.push([t.x, t.y]); hits += run.ev.filter(e => e.k === 'hit').length; }
    expect(path.length).toBeGreaterThan(10);
    expect(Math.max(...path.map(p => Math.abs(p[1] - 5.5)))).toBeGreaterThan(0.4);   // sai da linha reta: gira
    expect(hits).toBeGreaterThan(2);
    expect(run.enemies[0].sb.queimar).toBeDefined();
  });
  it('água e depois gelo: o inimigo molhado CONGELA', () => {
    let run = arena(11, r => [foe(r, 'golem', 10.5, 5.5)], { skills: [skill('respiracao-da-agua'), skill('bola-de-neve')], skillCd: [0, 0] });
    run = stepRun(run, { ...NO_INPUT, skill: 0 }, 0.05);
    run = steps(run, NO_INPUT, 0.5);
    expect(run.enemies[0].sb.molhado).toBeDefined();
    let reaction = '';
    run = stepRun(run, { ...NO_INPUT, skill: 1 }, 0.05);
    for (const e of run.ev) if (e.k === 'reacao') reaction = e.id;
    for (let k = 0; k < 20; k++) { run = stepRun(run, NO_INPUT, 0.05); for (const e of run.ev) if (e.k === 'reacao') reaction = e.id; }
    expect(reaction).toBe('congelou');
    expect(run.enemies[0].sb.congelado).toBeDefined();
  });
  it('Titã Colossal: o caçador fica gigante, mais lento, sem esquiva; pisadas machucam; explode no fim', () => {
    let run = arena(12, r => [foe(r, 'golem', 10.5, 5.5)], { skills: [skill('tita-colossal')], skillCd: [0] });
    run = stepRun(run, { ...NO_INPUT, skill: 0 }, 0.05);
    expect(run.p.form?.form).toBe('colosso'); expect(run.p.form?.scale).toBeGreaterThan(2);
    const before = run.p.dashCd;
    run = stepRun(run, { ...NO_INPUT, dodge: true, mx: 1 }, 0.05);
    expect(run.p.dash).toBe(0); expect(run.p.dashCd).toBe(before);
    let hp = run.enemies[0].hp;
    run = steps(run, { ...NO_INPUT, mx: 0.3 }, 1.5);
    expect(run.enemies[0].hp).toBeLessThan(hp);
    hp = run.enemies[0].hp;
    let ended = false;
    for (let k = 0; k < 200 && !ended; k++) { run = stepRun(run, NO_INPUT, 0.05); ended = run.ev.some(e => e.k === 'forma' && !e.on); }
    expect(ended).toBe(true); expect(run.p.form).toBeUndefined();
  });
  it('Zoltraak: cena (o mundo quase para) e só depois os 3 feixes que atravessam', () => {
    let run = arena(13, r => [foe(r, 'golem', 13.5, 5.5), foe(r, 'goblin', 11.5, 5.5, 1000, { cd: 0 })], { skills: [skill('zoltraak')], skillCd: [0] });
    run = stepRun(run, { ...NO_INPUT, skill: 0 }, 0.05);
    expect(run.cine?.style).toBe('circulo');
    const gx = run.enemies[1].x;
    run = steps(run, NO_INPUT, 0.4);
    expect(run.acts.filter(a => a.mv.m === 'raio')).toHaveLength(0);
    expect(Math.abs(run.enemies[1].x - gx)).toBeLessThan(0.2);     // o goblin quase não andou
    run = steps(run, NO_INPUT, 0.35);
    expect(run.acts.filter(a => a.mv.m === 'raio').length).toBeGreaterThan(0);
    run = steps(run, NO_INPUT, 0.5);
    expect(run.enemies.every(e => e.hp < 1000)).toBe(true);           // o feixe atravessa os dois
  });
  it('Kamehameha: segurar a tecla carrega; feixe mais grosso', () => {
    const w = (hold: number) => {
      let run = arena(14, r => [foe(r, 'golem', 13.5, 5.5)], { skills: [skill('kamehameha')], skillCd: [0] });
      run = stepRun(run, { ...NO_INPUT, skill: 0, held: 0 }, 0.05);
      for (let t = 0; t < hold; t += 0.05) run = stepRun(run, { ...NO_INPUT, held: 0 }, 0.05);
      run = stepRun(run, NO_INPUT, 0.05);
      return run.acts.find(a => a.mv.m === 'raio')?.w ?? 0;
    };
    expect(w(1.6)).toBeGreaterThan(w(0) * 1.8);
  });
  it('carta de inimigo: a carta vira em cima da cabeça e o golpe tem aviso antes', () => {
    let run = arena(15, r => [foe(r, 'mago', 12.5, 5.5, 200, { cards: ['bola-de-fogo'], cardCd: 0 })], { armor: 0, armorMax: 0 });
    let flip = false, warned = false, hurt = -1;
    for (let k = 0; k < 60 && hurt < 0; k++) { run = stepRun(run, NO_INPUT, 0.05); if (run.ev.some(e => e.k === 'cardflip')) flip = true; if (run.warns.length) warned = true; if (run.p.hp < run.p.max) hurt = k; }
    expect(flip).toBe(true); expect(warned).toBe(true);
    if (hurt >= 0) expect(hurt).toBeGreaterThan(10);
  });
  it('maestria: derrotar com a carta soma; nível 3 dá extra; nível 5, recarga menor', () => {
    const c = CARD_BY_ID.get('bola-de-fogo')!;
    expect(skillOf(c, 5)!.dmg).toBeGreaterThan(skillOf(c, 0)!.dmg);
    expect(skillOf(c, 5)!.cd).toBeLessThan(skillOf(c, 0)!.cd);
  });
});

describe('masmorra: inimigos, elites e chefes', () => {
  it('elite tem mais vida; explosivo avisa a explosão ao cair; gêmeo vira dois', () => {
    const r0 = startRun({ seed: 1, rank: 2 });
    expect(newEnemy(r0, 'goblin', 5, 5, { elite: 'veloz' }).max).toBeGreaterThan(newEnemy(r0, 'goblin', 5, 5).max * 2);
    let run = arena(16, r => [{ ...foe(r, 'goblin', 9.6, 5.5, 1), elite: 'explosivo' }, foe(r, 'golem', 15, 9)]);
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    run = stepRun(run, NO_INPUT, 0.05);
    expect(run.warns.some(w => w.r >= 2)).toBe(true);
    let tw = arena(17, r => [{ ...foe(r, 'lobo', 9.6, 5.5, 1), max: 300, elite: 'gemeo' }, foe(r, 'golem', 15, 9)]);
    tw = stepRun(tw, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    tw = stepRun(tw, NO_INPUT, 0.05);
    expect(tw.enemies.filter(e => e.kind === 'lobo')).toHaveLength(2);
  });
  it('cada rank tem o seu chefe, com fases e golpes avisados', () => {
    for (let rank = 0; rank < 6; rank++) {
      let run = startRun({ seed: 30 + rank, rank, hearts: 99 });
      run = warpTo(run, FLOORS, 0); run = warpTo(run, FLOORS, run.d.end);
      const b = run.enemies.find(e => e.kind === BOSS_OF_RANK[rank])!;
      expect(b, `rank ${rank}`).toBeDefined();
      run = { ...run, enemies: run.enemies.map(e => (e === b ? { ...e, hp: e.max * 0.3, cd: 0 } : e)) };
      let phase = 0, warned = false;
      for (let k = 0; k < 80; k++) { run = stepRun(run, NO_INPUT, 0.05); for (const e of run.ev) if (e.k === 'phase') phase = e.phase; if (run.warns.length) warned = true; }
      expect(phase, `rank ${rank}`).toBe(3); expect(warned, `rank ${rank}`).toBe(true);
    }
  });
  it('Guardião: os lampiões acesos dão escudo; Troll: a armadura de gelo só cai com fogo ou golpe pesado', () => {
    let g = startRun({ seed: 41, rank: 1 });
    g = warpTo(g, FLOORS, 0); g = warpTo(g, FLOORS, g.d.end);
    g = stepRun(g, NO_INPUT, 0.05);
    expect(g.enemies[0].shield).toBe(4);
    g = { ...g, breaks: g.breaks.map((bs, i) => (i === g.room ? bs.map(b => ({ ...b, hp: 0 })) : bs)) };
    g = stepRun(g, NO_INPUT, 0.05);
    expect(g.enemies[0].shield).toBe(0);
    let t = startRun({ seed: 42, rank: 2 });
    t = warpTo(t, FLOORS, 0); t = warpTo(t, FLOORS, t.d.end);
    const troll = t.enemies[0], armor = troll.shield;
    expect(armor).toBeGreaterThan(0);
    t = { ...t, p: { ...t.p, x: troll.x, y: troll.y + 1.4 }, enemies: [{ ...troll, cd: 99, cardCd: 99, aux2: 99 }] };
    t = stepRun(t, { ...NO_INPUT, attack: true, ax: 0, ay: -1 }, 0.05);
    expect(t.enemies[0].hp).toBe(troll.hp);            // espada leve não passa da armadura
  });
  it('Espírito da Floresta: as plantas curam o chefe; Monarca: as cópias usam as cartas do caçador', () => {
    let f = startRun({ seed: 43, rank: 4 });
    f = warpTo(f, FLOORS, 0); f = warpTo(f, FLOORS, f.d.end);
    const boss = f.enemies[0];
    f = { ...f, enemies: [{ ...boss, hp: boss.max * 0.5, cd: 99, cardCd: 99, aux2: 99 }, newEnemy(f, 'planta', 3, 3, { minion: true }), newEnemy(f, 'planta', 14, 8, { minion: true })] };
    const hp0 = f.enemies[0].hp;
    f = steps(f, NO_INPUT, 2);
    expect(f.enemies.find(e => e.kind === 'espiritoFloresta')!.hp).toBeGreaterThan(hp0);
    let m = startRun({ seed: 44, rank: 5, skills: [skill('bola-de-fogo')] });
    m = warpTo(m, FLOORS, 0); m = warpTo(m, FLOORS, m.d.end);
    const mon = m.enemies[0];
    m = { ...m, enemies: [{ ...mon, hp: mon.max * 0.5, phase: 2, next: 1, cd: 0, cardCd: 99, aux2: 99 }] };
    let copies: Enemy[] = [];
    for (let k = 0; k < 60 && !copies.length; k++) { m = stepRun(m, { ...NO_INPUT, dodge: k % 20 === 0, mx: k % 2 ? 1 : -1 }, 0.05); copies = m.enemies.filter(e => e.kind === 'sombraP'); }
    expect(copies.length).toBeGreaterThan(0);
    expect(copies[0].cards).toContain('bola-de-fogo');
  });
  it('escada → SISTEMA oferece 3 bênçãos → próximo andar; vencer o chefe do 5º vence o portal', () => {
    let run = startRun({ seed: 21, rank: 0 });
    run = { ...run, room: run.d.end, cleared: run.cleared.map((c, i) => (i === run.d.end ? true : c)), p: { ...run.p, x: 8.5, y: 5.5 } };
    run = stepRun(run, NO_INPUT, 0.05);
    expect(run.choice).toHaveLength(3);
    expect(stepRun(run, { ...NO_INPUT, mx: 1 }, 0.05).p.x).toBe(run.p.x);
    run = chooseBuff(run, run.choice![0]);
    expect(run.floor).toBe(2); expect(run.buffs).toHaveLength(1); expect(run.choice).toBeUndefined();
    run = warpTo(run, FLOORS, 0); run = warpTo(run, FLOORS, run.d.end);
    expect(run.d.rooms[run.room].kind).toBe('chefe');
    run = { ...run, enemies: run.enemies.map(e => ({ ...e, hp: 0 })) };
    expect(stepRun(run, NO_INPUT, 0.05).result).toBe('win');
  });
});

describe('masmorra: pet e o que quebra', () => {
  it('o pet cata o que tem espaço; o tipo preferido cabe o dobro', () => {
    expect(petAffinity('pet-raposa-chama')).toBe('cristal');
    expect(petAffinity('pet-toupeira-pedra')).toBe('minerio');
    expect(petCap('pet-raposa-chama', 'cristal')).toBe(petCap('pet-raposa-chama', 'erva') * 2);
    let run = arena(18, r => [foe(r, 'golem', 15, 9)]);
    run = { ...run, loot: Array.from({ length: 30 }, (_, k) => ({ id: 500 + k, x: 7 + (k % 5) * 0.3, y: 5 + Math.floor(k / 5) * 0.3, item: 'erva:cura', n: 1 })) };
    run = steps(run, NO_INPUT, 12);
    expect(run.pet.bag.erva).toBe(petCap(run.pet.id, 'erva'));
  });
  it('pedra com minério quebra no golpe; parede rachada abre a sala secreta', () => {
    let run = arena(19, r => [foe(r, 'golem', 15, 9)]);
    run = { ...run, breaks: run.breaks.map((b, i) => (i === run.room ? [{ x: 9, y: 5, kind: 'minerio' as const, hp: 5 }] : b)) };
    run = stepRun(run, { ...NO_INPUT, attack: true, ax: 1, ay: 0 }, 0.05);
    expect(run.loot.some(l => l.item.startsWith('minerio:'))).toBe(true);
    // procura um andar com sala secreta
    for (let seed = 1; seed < 80; seed++) {
      let r = startRun({ seed, rank: 1 });
      const par = r.d.rooms.findIndex(x => x.secret);
      if (par < 0) continue;
      r = warpTo(r, 1, par);
      r = { ...r, cleared: r.cleared.map((c, i) => (i === par ? true : c)), enemies: [] };
      const [dx, dy] = doorTile(r.d.rooms[par].secret!);
      const s = r.d.rooms[par].secret!;
      r = { ...r, p: { ...r.p, x: dx + 0.5 + (s === 'e' ? -1.2 : s === 'w' ? 1.2 : 0), y: dy + 0.5 + (s === 's' ? -1.2 : s === 'n' ? 1.2 : 0) } };
      expect(r.cracked.includes(par)).toBe(false);
      r = stepRun(r, { ...NO_INPUT, attack: true, ax: dx + 0.5 - r.p.x, ay: dy + 0.5 - r.p.y }, 0.05);
      expect(r.cracked.includes(par)).toBe(true);
      return;
    }
    throw new Error('nenhuma sala secreta nas sementes');
  });
});

describe('masmorra: cartas e armas', () => {
  it('toda carta de Ataque vira habilidade com kit; cura e suporte não; Épica+ tem efeito próprio', () => {
    let n = 0;
    for (const c of CATALOG) {
      const s = skillOf(c);
      if (c.type === 'attack' && (c.damage ?? 0) > 0) { expect(s, c.id).not.toBeNull(); expect(s!.dmg).toBeGreaterThan(0); expect(s!.cd).toBeGreaterThan(0); expect(s!.kit.moves.length).toBeGreaterThan(0); n++; expect(s!.ownVfx).toBe(['epic', 'legendary', 'mythic', 'unknown'].includes(c.rarity)); }
      else expect(s).toBeNull();
    }
    expect(n).toBe(168);
  });
  it('arma: todas válidas', () => { for (const w of WEAPONS) { expect(w.dmg).toBeGreaterThan(0); expect(weapon(w.id)).toBe(w); } });
});

describe('caçador', () => {
  it('rank e nível pela XP; o portal só abre vencendo o chefe do anterior', () => {
    expect(hunterRank(0)).toBe(0); expect(hunterRank(RANK_XP[2])).toBe(2); expect(hunterRank(1e6)).toBe(5);
    expect(hunterLevel(0)).toBe(1); expect(hunterLevel(1200)).toBeGreaterThan(5);
    const p = newProgress();
    expect(portalOpen(p, 0).ok).toBe(true); expect(portalOpen(p, 1).ok).toBe(false);
    expect(portalOpen({ ...p, towerMax: 99, masmorra: { ...p.masmorra, xp: 1e6 } }, 1).ok).toBe(false);
    expect(portalOpen({ ...p, masmorra: { ...p.masmorra, vitorias: [1, 0, 0, 0, 0, 0] } }, 1).ok).toBe(true);
  });
  it('pontos de status: 1 por nível, até 10 em cada; Vitalidade dá coração', () => {
    let p = { ...newProgress(), masmorra: { ...newProgress().masmorra, xp: 30 * 16 } };
    expect(pointsFree(p.masmorra)).toBe(4);
    for (let k = 0; k < 6; k++) p = spendPoint(p, 'vitalidade');
    expect(p.masmorra.pontos.vitalidade).toBe(4); expect(pointsFree(p.masmorra)).toBe(0);
    expect(portalRun(p, 0, 1, 'pet-x').options.hearts).toBe(portalRun(newProgress(), 0, 1, 'pet-x').options.hearts + 1);
  });
  it('prêmio: carta do chefe e moedas (× nota) com teto nas 3 pagas; perdeu, metade; maestria e chefe vencido abre o próximo', () => {
    const now = Date.UTC(2026, 9, 9, 15);
    const base = startRun({ seed: 1, rank: 0, potions: { vida: 1, mana: 0 } });
    const win: Run = { ...base, result: 'win', gold: 500, kills: 20, pet: { ...base.pet, items: { 'erva:cura': 4, 'cristal:azul': 2 } }, cardKills: { 'bola-de-fogo': 12 }, cardUse: { 'bola-de-fogo': 5 } };
    let p = newProgress();
    const c0 = p.coins;
    for (let k = 0; k < DUNGEON_PAID; k++) {
      const r = finishPortal(p, win, now);
      expect(r.paid).toBe(true); expect(r.card).toBe(dungeonCard(0, 1)); expect(CARD_BY_ID.has(r.card!)).toBe(true);
      if (k === 0) { expect(r.abriu).toBe(1); expect(r.maestria).toEqual([{ card: 'bola-de-fogo', antes: 0, depois: 1 }]); }
      p = r.progress;
    }
    expect(p.coins - c0).toBeGreaterThanOrEqual(60 * DUNGEON_PAID);
    expect(p.masmorra.maestria['bola-de-fogo']).toBe(36);
    expect(portalOpen(p, 1).ok).toBe(true);
    expect(p.itens['erva:cura']).toBe(12); expect(p.itens['pocao:vida']).toBe(3);
    const extra = finishPortal(p, win, now);
    expect(extra.paid).toBe(false); expect(extra.card).toBeUndefined(); expect(extra.xp).toBeGreaterThan(0);
    const lose = finishPortal(newProgress(), { ...win, result: 'lose', gold: 30 }, now);
    expect(lose.coins).toBe(15); expect(lose.items['erva:cura']).toBe(2); expect(lose.items['cristal:azul']).toBe(1);
    const graded = finishPortal(newProgress(), { ...win, result: 'lose', gold: 30, grades: ['S', 'S'] }, now);
    expect(graded.coins).toBeGreaterThan(lose.coins); expect(graded.xp).toBeGreaterThan(lose.xp);
  });
  it(`Arise: o chefe do rank vencido ${ARISE_WINS} vezes vira sombra; Portal da Semana guarda o recorde`, () => {
    const base = startRun({ seed: 2, rank: 0 });
    let p = newProgress(), got;
    for (let k = 0; k < ARISE_WINS; k++) { const r = finishPortal(p, { ...base, result: 'win' }, Date.UTC(2026, 9, 9 + k)); p = r.progress; got = r.sombra ?? got; }
    expect(got).toBe('soldado'); expect(p.masmorra.sombras).toEqual(['soldado']); expect(p.masmorra.sombra).toBe('soldado');
    expect(weekSeed(0, Date.UTC(2026, 9, 9))).toBe(weekSeed(0, Date.UTC(2026, 9, 10)));
    const s = finishPortal(newProgress(), { ...base, semana: true, result: 'lose', floor: 3, t: 400 }, Date.UTC(2026, 9, 9));
    expect(s.semana?.recorde).toBe(true); expect(s.progress.masmorra.semana.andar).toBe(3);
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
  it('habilidades só das cartas que tem; poções saem da mochila ao entrar no portal; o Caminho vira a habilidade de classe', () => {
    let p = newProgress();
    const atk = Object.keys(p.collection).find(id => skillOf(CARD_BY_ID.get(id)!));
    p = setSkills(p, [atk!, 'carta-que-nao-existe']);
    expect(p.masmorra.cartas).toEqual([atk]);
    p = addItem(p, 'pocao:vida', 5);
    const r = portalRun({ ...p, caminho: 'guardiao' }, 0, 9, 'pet-raposa-chama');
    expect(r.options.potions).toEqual({ vida: 2, mana: 0 });
    expect(r.progress.itens['pocao:vida']).toBe(3);
    expect(r.options.skills).toHaveLength(1);
    expect(r.options.classe).toBe('guardiao');
    let run = startRun(r.options);
    run = stepRun({ ...run, p: { ...run.p, classCd: 0 } }, { ...NO_INPUT, classe: true }, 0.05);
    expect(run.ev.some(e => e.k === 'classe' && e.id === 'guardiao')).toBe(true);
  });
});
