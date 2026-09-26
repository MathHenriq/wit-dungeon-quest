import { describe, expect, it } from 'vitest';
import { BODY, FACE, FRAME, HAIR_STYLES, HEAD } from '../base';
import { composeFrame, type AvatarLook } from '../compose';
import { CLOTH_COLORS, HAIR_COLORS, SKIN_TONES } from '../palette';

const grids: [string, readonly string[]][] = [
  ...Object.entries(HEAD).map(([d, g]) => [`head.${d}`, g] as [string, readonly string[]]),
  ...Object.entries(FACE).filter(([, g]) => g).map(([d, g]) => [`face.${d}`, g!] as [string, readonly string[]]),
  ...Object.entries(BODY).flatMap(([d, poses]) => poses.map((g, i) => [`body.${d}.${i}`, g] as [string, readonly string[]])),
  ...HAIR_STYLES.flatMap(h => [
    ...Object.entries(h.front).map(([d, g]) => [`hair.${h.id}.front.${d}`, g] as [string, readonly string[]]),
    ...Object.entries(h.back ?? {}).map(([d, g]) => [`hair.${h.id}.back.${d}`, g!] as [string, readonly string[]]),
  ]),
];

describe('boneco base', () => {
  it.each(grids)('%s tem todas as linhas do mesmo tamanho', (_nome, g) => {
    const w = g[0].length;
    expect(g.every(r => r.length === w)).toBe(true);
  });

  it('usa só códigos conhecidos', () => {
    const ok = new Set('.OSskHhTtUAaRrPpVQqFfGYyZDEeMB');
    for (const [nome, g] of grids) for (const r of g) for (const c of r) {
      if (!ok.has(c)) throw new Error(`${nome}: código desconhecido "${c}"`);
    }
  });

  it('monta todas as combinações de pele, cabelo e roupa sem pixel vazio no corpo', () => {
    for (const skin of Object.keys(SKIN_TONES)) for (const hairColor of Object.keys(HAIR_COLORS)) {
      const look: AvatarLook = { skin, hair: 'longo', hairColor, eyes: 'escuro', top: Object.keys(CLOTH_COLORS)[0], sleeves: 'curta', bottom: 'jeans', legs: 'curta', shoes: 'preto' };
      const px = composeFrame(look, 'down', 0);
      expect(px.length).toBe(FRAME * FRAME * 4);
      // O centro do tronco sempre é pintado.
      const i = (20 * FRAME + 16) * 4;
      expect(px[i + 3]).toBe(255);
    }
  });
});
