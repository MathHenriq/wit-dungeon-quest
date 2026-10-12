import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readPng } from '../../../../scripts/mapa/png';
import { ACC_INFO, measureFrames, normalizeWearing, placeAcc, type AccManifest } from '../accessories';
import { MODELOS, normalizeLook } from '../outfit';

const root = resolve(__dirname, '../../../..');
const manifest: AccManifest = JSON.parse(readFileSync(`${root}/public/game/sprites/acessorios/manifest.json`, 'utf8'));

describe('acessórios', () => {
  it('todo acessório do jogo tem sprite nas 4 direções', () => {
    for (const id of Object.keys(ACC_INFO)) {
      expect(manifest[id], id).toBeTruthy();
      expect(manifest[id].a).toHaveLength(4);
    }
  });

  it('mede cabeça e tronco de todos os modelos com números que fazem sentido', () => {
    for (const m of MODELOS) {
      const pm = readPng(`${root}/public/game/sprites/modelos/${m}.png`);
      for (const b of measureFrames(pm.data, pm.w, 64, 80)) {
        expect(b.neck - b.top, m).toBeGreaterThan(18);       // cabeça grande (chibi)
        expect(b.headR - b.headL, m).toBeGreaterThan(20);
        expect(b.torsoBottom, m).toBeGreaterThan(b.neck);
        expect(b.torsoBottom, m).toBeLessThan(80);
      }
    }
  });

  it('chapéu fica em cima da cabeça, óculos no rosto e somem de costas', () => {
    const pm = readPng(`${root}/public/game/sprites/modelos/modelo-01.png`);
    const b = measureFrames(pm.data, pm.w, 64, 80)[0];
    const hat = placeAcc('bone', 0, b, 38, 20);
    expect(hat.y + 20).toBeLessThan(b.neck);
    expect(hat.y).toBeLessThan(b.top + 10);
    const g = placeAcc('oculos', 0, b, 26, 8);
    expect(g.y).toBeGreaterThan(b.top + 8);
    expect(g.y + 8).toBeLessThan(b.neck);
    expect(placeAcc('oculos', 3, b, 26, 8).hidden).toBe(true);
    expect(placeAcc('mochila', 0, b, 23, 24).behind).toBe(true);
    expect(placeAcc('mochila', 3, b, 23, 24).behind).toBe(false);
  });

  it('visual salvo com acessório errado é limpo', () => {
    expect(normalizeWearing({ cabeca: { id: 'oculos' } })).toBeUndefined();          // espaço errado
    expect(normalizeWearing({ rosto: { id: 'oculos', cor: 'xadrez' } })).toEqual({ rosto: { id: 'oculos' } });
    expect(normalizeLook({ acc: { cabeca: { id: 'bone', cor: 'roxo' } } } as never).acc).toEqual({ cabeca: { id: 'bone', cor: 'roxo' } });
    expect(normalizeLook({ acc: 'x' } as never).acc).toBeUndefined();
  });
});
