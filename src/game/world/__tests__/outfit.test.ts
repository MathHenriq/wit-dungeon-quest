import { describe, expect, it } from 'vitest';
import { applyLook, CLOTH, DEFAULT_LOOK, HAIR, MODEL_CELL, MODELOS, MOLDE, normalizeLook, SKIN } from '../outfit';

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

describe('visual do personagem', () => {
  it('troca cada tom da paleta-molde pelo tom da rampa', () => {
    const px = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
    const data = new Uint8ClampedArray([...px(MOLDE.hair[2]), ...px(MOLDE.top[0]), ...px(MOLDE.skin[3]), ...px('#181420')]);
    const look = { ...DEFAULT_LOOK, cabelo: 'loiro', cima: 'vermelho', pele: 'pele-6' };
    applyLook(data, look);
    expect(hex(data[0], data[1], data[2])).toBe(HAIR.loiro[2]);
    expect(hex(data[4], data[5], data[6])).toBe(CLOTH.vermelho[0]);
    expect(hex(data[8], data[9], data[10])).toBe(SKIN['pele-6'][3]);
    expect(hex(data[12], data[13], data[14])).toBe('#181420'); // contorno fica
  });

  it('visual salvo com valor que não existe volta ao padrão', () => {
    expect(normalizeLook({ modelo: 'modelo-99', cabelo: 'rosa', pele: 'x' })).toEqual({ ...DEFAULT_LOOK, cabelo: 'rosa' });
    expect(normalizeLook(null)).toEqual(DEFAULT_LOOK);
  });

  it('os PNGs dos modelos usam só a paleta-molde, contorno e branco', async () => {
    const { readPng } = await import('../../../../scripts/mapa/png');
    const known = new Set<string>([...MOLDE.hair, ...MOLDE.top, ...MOLDE.bottom, ...MOLDE.skin]);
    for (const m of MODELOS) {
      const pm = readPng(`public/game/sprites/modelos/${m}.png`);
      expect(pm.w).toBe(MODEL_CELL.w * 4);
      expect(pm.h).toBe(MODEL_CELL.h * 4);
      const other = new Set<string>();
      let painted = 0;
      for (let i = 0; i < pm.data.length; i += 4) {
        if (!pm.data[i + 3]) continue;
        const c = hex(pm.data[i], pm.data[i + 1], pm.data[i + 2]);
        if (known.has(c)) painted++; else other.add(c);
      }
      // fora da paleta: só contorno e os 4 brancos (tênis, olhos)
      expect(other.size).toBeLessThanOrEqual(5);
      expect(painted).toBeGreaterThan(1500);
    }
  });
});
