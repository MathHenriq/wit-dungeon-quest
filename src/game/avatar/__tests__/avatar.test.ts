import { describe, expect, it } from 'vitest';
import { composeFrame, FRAME, type AvatarLook, type Facing, type Pose } from '../compose';
import { HAIR_IDS } from '../rig';
import { HAIR_COLORS, SKIN_TONES } from '../palette';

const base: AvatarLook = {
  skin: 'clara', hair: 'curto', hairColor: 'castanho', eyes: 'escuro',
  top: 'azul', sleeves: 'curta', bottom: 'jeans', legs: 'comprida', shoes: 'preto',
};
const facings: Facing[] = ['down', 'up', 'left', 'right'];
const poses: Pose[] = [0, 1, 2];

const opaque = (px: Uint8ClampedArray) => { let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i]) n++; return n; };

describe('boneco', () => {
  it.each(HAIR_IDS)('cabelo "%s" monta todas as direções e poses dentro do quadro', hair => {
    for (const f of facings) for (const p of poses) {
      const px = composeFrame({ ...base, hair }, f, p);
      expect(px.length).toBe(FRAME * FRAME * 4);
      expect(opaque(px)).toBeGreaterThan(600);
      // Nada cortado em cima nem dos lados (o pé pode encostar embaixo).
      for (let i = 0; i < FRAME; i++) {
        expect(px[i * 4 + 3]).toBe(0);
        expect(px[(i * FRAME) * 4 + 3]).toBe(0);
        expect(px[(i * FRAME + FRAME - 1) * 4 + 3]).toBe(0);
      }
    }
  });

  it('direita é o espelho exato da esquerda', () => {
    const l = composeFrame(base, 'left', 1), r = composeFrame(base, 'right', 1);
    for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
      const a = (y * FRAME + x) * 4, b = (y * FRAME + FRAME - 1 - x) * 4;
      expect([r[a], r[a + 1], r[a + 2], r[a + 3]]).toEqual([l[b], l[b + 1], l[b + 2], l[b + 3]]);
    }
  });

  it('trocar a cor de pele e de cabelo só troca a cor, não o formato', () => {
    const ref = composeFrame(base, 'down', 0);
    for (const skin of Object.keys(SKIN_TONES)) for (const hairColor of Object.keys(HAIR_COLORS)) {
      const px = composeFrame({ ...base, skin, hairColor }, 'down', 0);
      for (let i = 3; i < px.length; i += 4) expect(px[i]).toBe(ref[i]);
    }
  });
});
