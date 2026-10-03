import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { actOf, aquariumFish, canSleep, houseActAt, itemAt } from '../house-acts';
import { HOUSE_CATS, catalogOf, houseRoom, type Manifest } from '../room';
import { newProgress } from '../../progress';

const m: Manifest = JSON.parse(readFileSync(resolve(__dirname, '../../../../public/game/interior/manifest.json'), 'utf8'));

describe('móveis da casa', () => {
  it('cada tipo de móvel faz a coisa certa', () => {
    expect(actOf('cama-solteiro')?.act).toBe('dormir');
    expect(actOf('sofa-nuvem.lado')?.act).toBe('sentar');
    expect(actOf('fogao')?.act).toBe('cozinhar');
    expect(actOf('geladeira-mini')?.act).toBe('comer');
    expect(actOf('pc-gamer')?.act).toBe('computador');
    expect(actOf('tv-rack')?.act).toBe('tv');
    expect(actOf('toca-discos')?.act).toBe('musica');
    expect(actOf('cavalete')?.act).toBe('pintar');
    expect(actOf('aquario')?.act).toBe('aquario');
    expect(actOf('guarda-roupa')?.act).toBe('visual');
    expect(actOf('tapete-tranca')).toBeNull();
  });

  it('boa parte do catálogo da casa tem uma ação', () => {
    const ids = HOUSE_CATS.flatMap(c => catalogOf(m, c.id)).filter(id => !/\.(lado|costas)$/.test(id));
    const withAct = ids.filter(id => actOf(id));
    expect(withAct.length / ids.length).toBeGreaterThan(0.6);
  });

  it('acha o móvel na frente do aluno (chão e parede)', () => {
    const r = houseRoom();
    const bed = r.items.find(q => q.id === 'cama-solteiro')!;
    expect(itemAt(m, r, bed.tx, bed.ty)?.id).toBe('cama-solteiro');
    expect(houseActAt(m, r, bed.tx, bed.ty)?.act).toBe('dormir');
    const clock = r.items.find(q => q.id === 'relogio-parede')!;
    expect(houseActAt(m, r, clock.tx, r.wallRows - 1)?.act).toBe('relogio');
  });

  it('só dorme de noite', () => {
    expect(canSleep(22)).toBe(true);
    expect(canSleep(3)).toBe(true);
    expect(canSleep(12)).toBe(false);
  });

  it('aquário: um de cada peixe pescado, o maior primeiro', () => {
    const p = { ...newProgress(), diario: [{ f: 'lambari', cm: 10, h: 8, w: 'margem' as const, d: 1 }, { f: 'lambari', cm: 14, h: 9, w: 'margem' as const, d: 1 }, { f: 'tilapia', cm: 30, h: 9, w: 'margem' as const, d: 1 }] };
    const fish = aquariumFish(p);
    expect(new Set(fish).size).toBe(fish.length);
  });
});
