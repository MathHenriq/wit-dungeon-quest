import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { PROF_SPRITES } from '../prof-sprites';
import { bateNaPorta, CURSO, emCasa, ondeEsta, parteDoDia, PROF_BY_ID, PROFESSORES, profNpcs, profOf, profVisible } from '../professores';
import { buildZone, ZONES } from '../world';
import { NPCS } from '../content';
import type { Town, ZoneId } from '../zone';

const towns = Object.fromEntries(ZONES.map(z => [z, buildZone(z)])) as Record<ZoneId, Town>;

function reachable(t: Town, zone: ZoneId): Set<string> {
  const npc = new Set(NPCS.filter(n => (n.zona ?? 'cidade') === zone).map(n => `${n.tx},${n.ty}`));
  const H = t.solid.length, W = t.solid[0].length;
  const seen = new Set([`${t.spawn.tx},${t.spawn.ty}`]);
  const q = [[t.spawn.tx, t.spawn.ty]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || t.solid[ny][nx] || npc.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

describe('professores', () => {
  it('são os 12 da lista do Matheus, cada um com curso e casa que existem', () => {
    expect(PROFESSORES.map(p => p.id).sort()).toEqual(['dante', 'felipe', 'grazyelle', 'guilherme', 'leticia', 'macedo', 'mayara', 'maycon', 'miguel', 'servilha', 'vitor', 'wellington']);
    const doors = new Set(ZONES.flatMap(z => towns[z].doors.map(d => d.building)));
    for (const p of PROFESSORES) {
      expect(doors.has(p.casa), `${p.id}: casa ${p.casa}`).toBe(true);
      expect(doors.has(CURSO[p.curso].predio), `${p.id}: curso`).toBe(true);
    }
  });

  it('usa a distribuição de cursos confirmada pelo Matheus', () => {
    const cursos = Object.fromEntries(PROFESSORES.map(({ id, curso }) => [id, curso]));
    expect(cursos).toEqual({
      dante: 'ia',
      macedo: 'ia',
      mayara: 'ia',
      guilherme: 'ia',
      servilha: 'games',
      leticia: 'games',
      wellington: 'iot',
      miguel: 'iot',
      grazyelle: 'comunicacao',
      maycon: 'comunicacao',
      vitor: 'metaverso',
      felipe: 'metaverso',
    });
  });

  it('a cada hora, cada professor está em uma parte só do dia', () => {
    for (const p of PROFESSORES) for (let h = 0; h < 24; h += 0.5) {
      const vis = profNpcs().filter(n => n.id.startsWith(`prof:${p.id}:`) && profVisible(n.id, h));
      expect(vis.length, `${p.id} às ${h}h`).toBeLessThanOrEqual(1);
      if (ondeEsta(p, h).spot) expect(vis.length, `${p.id} às ${h}h`).toBe(1);
    }
    expect(parteDoDia(PROF_BY_ID.get('servilha')!, 21)).toBe('passatempo');
    expect(parteDoDia(PROF_BY_ID.get('mayara')!, 21)).toBe('casa');
  });

  it('ficam em blocos livres, alcançáveis, sem tapar porta nem morador, e cada um no seu bloco', () => {
    const used = new Map<string, string>();
    for (const n of profNpcs()) {
      const z = n.zona!, t = towns[z], k = `${z}:${n.tx},${n.ty}`;
      expect(t.solid[n.ty][n.tx], `${n.id} em bloco sólido`).toBe(false);
      expect(reachable(t, z).has(`${n.tx},${n.ty}`), `${n.id} alcançável`).toBe(true);
      expect(t.doors.some(d => d.tx === n.tx && (d.ty === n.ty || d.ty + 1 === n.ty)), `${n.id} tapa porta`).toBe(false);
      expect(NPCS.some(o => (o.zona ?? 'cidade') === z && o.tx === n.tx && o.ty === n.ty), `${n.id} em cima de morador`).toBe(false);
      // dois professores podem dividir o bloco só se nunca aparecem na mesma hora
      const other = used.get(k);
      if (other) for (let h = 0; h < 24; h += 0.5) expect(profVisible(other, h) && profVisible(n.id, h), `${n.id} e ${other} às ${h}h`).toBe(false);
      used.set(k, n.id);
      for (const [x, y] of n.job?.route ?? []) expect(reachable(t, z).has(`${x},${y}`), `${n.id}: rota ${x},${y}`).toBe(true);
    }
  });

  it('o id do morador diz quem é e a parte do dia', () => {
    expect(profOf('prof:maycon:passatempo')?.prof.nome).toBe('Prof. Maycon');
    expect(profOf('guia')).toBeNull();
    expect(profVisible('guia', 3)).toBe(true);
  });

  it('bater na porta: quem está em casa responde; senão, diz onde a pessoa está', () => {
    expect(bateNaPorta('casa-rosa', 10)).toBeNull();
    expect(bateNaPorta('moradia-3', 10)!.at(-1)).toMatch(/Inteligência Artificial/);
    expect(bateNaPorta('moradia-3', 15)!.join(' ')).toMatch(/jiu-jitsu/i);
    // à tarde o Vitor e o Miguel jogam na casa do Servilha
    expect(emCasa('casa-vermelha', 16).map(p => p.id).sort()).toEqual(['miguel', 'servilha', 'vitor']);
    expect(emCasa('moradia-1', 16)).toEqual([]);
    expect(emCasa('moradia-1', 23).map(p => p.id).sort()).toEqual(['miguel', 'vitor']);
  });
});

describe('bonecos dos professores (kit em scripts/arte/professores)', () => {
  const kit = JSON.parse(readFileSync('scripts/arte/professores/professores.json', 'utf8')) as { professores: { id: string; nome: string }[] };

  it('o kit tem os mesmos professores do jogo', () => {
    expect(kit.professores.map(p => p.id).sort()).toEqual(PROFESSORES.map(p => p.id).sort());
    for (const p of kit.professores) expect(p.nome).toBe(PROF_BY_ID.get(p.id)!.nome);
  });

  it('cada boneco importado existe e é de um professor; quem tem boneco usa ele', () => {
    for (const s of PROF_SPRITES) {
      expect(existsSync(`public/game/sprites/professores/${s}.png`), s).toBe(true);
      expect(PROF_BY_ID.has(s.replace(/^prof-/, '')), s).toBe(true);
    }
    for (const n of profNpcs()) expect(n.sprite).toBe(PROF_SPRITES.includes(`prof-${profOf(n.id)!.prof.id}`) ? `prof-${profOf(n.id)!.prof.id}` : undefined);
  });
});
