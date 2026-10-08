import { describe, expect, it } from 'vitest';
import { newProgress } from '../progress';
import { plantKey, REGAS_POR_FRUTO, waterPlant } from '../house-life';
import { buyFurniture, furniturePrice, FREE_FURNITURE, ownsFurniture } from '../furniture';
import { readFileSync } from 'node:fs';
import type { Manifest } from '../interior/room';

const m: Manifest = JSON.parse(readFileSync('public/game/interior/manifest.json', 'utf8'));

describe('vida na casa', () => {
  it('planta: 1 rega por dia; a 5ª dá fruto', () => {
    let p = newProgress();
    const k = plantKey('limoeiro', 3, 4);
    for (let d = 0; d < REGAS_POR_FRUTO - 1; d++) p = waterPlant(p, k, 100 + d).progress;
    expect(waterPlant(p, k, 100 + REGAS_POR_FRUTO - 2).text).toMatch(/já foi regada/);
    const r = waterPlant(p, k, 200);
    expect(r.fruit).toBe('fruta:limao');
    expect(r.progress.itens['fruta:limao']).toBe(1);
    expect(r.progress.plantas[k].regas).toBe(0);
  });
  it('Loja de Móveis: os da casa inicial são de graça; o resto custa e fica liberado', () => {
    const free = [...FREE_FURNITURE][0];
    expect(furniturePrice(m, free)).toBe(0);
    const paid = Object.keys(m).find(id => m[id].cat === 'sofa' && !m[id].de && !FREE_FURNITURE.has(id))!;
    const price = furniturePrice(m, paid);
    expect(price).toBeGreaterThan(0);
    expect(buyFurniture({ ...newProgress(), coins: price - 1 }, m, paid).ok).toBe(false);
    const r = buyFurniture({ ...newProgress(), coins: price }, m, paid);
    expect(r.ok && ownsFurniture(r.progress, paid) && r.progress.coins === 0).toBe(true);
  });
});
