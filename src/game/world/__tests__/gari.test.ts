import { describe, expect, it } from 'vitest';
import { buildZone } from '../world';
import { PLAZA_WIT } from '../zone-wit';
import { spawnCritters, spawnLitter, stepGari, type Critter } from '../critters';
import { rng } from '../../minigames';

describe('robô gari (Cidade WIT)', () => {
  it('nasce na rua e cata o lixo espalhado', () => {
    const t = buildZone('wit');
    const street = { x0: Math.max(1, PLAZA_WIT.x0 - 8), y0: PLAZA_WIT.y0, x1: Math.min(t.solid[0].length - 1, PLAZA_WIT.x1 + 9), y1: Math.min(t.solid.length - 1, PLAZA_WIT.y1 + 10) };
    const r = rng(5);
    const [gari] = spawnCritters(t, 'gari', 1, street, 29) as Critter[];
    expect(gari).toBeTruthy();
    const litter = spawnLitter(t, street, 6, r);
    expect(litter).toHaveLength(6);
    // 4 minutos de jogo, 50 ms por passo
    for (let k = 0; k < 4800 && litter.length; k++) stepGari(gari, litter, 50, t, r);
    expect(gari.picked).toBeGreaterThanOrEqual(4);
  });
});
