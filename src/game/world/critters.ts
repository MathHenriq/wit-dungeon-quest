// Bichos soltos no mapa (não são moradores): patos nadando no lago; depois
// galinhas e vacas na fazenda. Cada um anda devagar até um ponto sorteado
// perto de onde está e espera um pouco. Posição em pixels do mundo.
import type { Town } from './zone';
import { hash } from './pixmap';

export type CritterKind = 'pato' | 'galinha' | 'vaca' | 'ovelha';

export interface Critter {
  kind: CritterKind;
  x: number; y: number;
  gx: number; gy: number;
  wait: number;
  /** 1 = olhando para a direita. */
  face: 1 | -1;
  seed: number;
  /** Onde pode andar (blocos). */
  home: { x0: number; y0: number; x1: number; y1: number };
}

const SPEED: Record<CritterKind, number> = { pato: 9, galinha: 14, vaca: 6, ovelha: 7 };

/** Pode ficar neste bloco? Pato só na água funda o bastante; os outros no chão livre. */
export function critterFloor(town: Town, kind: CritterKind, tx: number, ty: number): boolean {
  const t = town.terrain[ty]?.[tx];
  if (kind === 'pato') {
    if (t !== 'agua') return false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (town.terrain[ty + dy]?.[tx + dx] !== 'agua') return false;
    return true;
  }
  return !!t && t !== 'agua' && !town.solid[ty]?.[tx];
}

export function spawnCritters(town: Town, kind: CritterKind, n: number, home: Critter['home'], salt = 1): Critter[] {
  const out: Critter[] = [];
  for (let k = 0, tries = 0; out.length < n && tries < 400; tries++, k++) {
    const tx = Math.floor(home.x0 + hash(k, 1, salt) * (home.x1 - home.x0));
    const ty = Math.floor(home.y0 + hash(k, 2, salt) * (home.y1 - home.y0));
    if (!critterFloor(town, kind, tx, ty)) continue;
    const x = tx * 16 + 8, y = ty * 16 + 10;
    out.push({ kind, x, y, gx: x, gy: y, wait: 500 + hash(k, 3, salt) * 3000, face: hash(k, 4, salt) < 0.5 ? 1 : -1, seed: hash(k, 5, salt), home });
  }
  return out;
}

/** Anda um passo de tempo. `occupied` diz onde tem gente (bichos de chão desviam). */
export function stepCritters(list: Critter[], dt: number, town: Town, rnd: () => number): boolean {
  let moved = false;
  for (const c of list) {
    const dx = c.gx - c.x, dy = c.gy - c.y, d = Math.hypot(dx, dy);
    if (d < 0.5) {
      c.wait -= dt;
      if (c.wait > 0) continue;
      // novo destino: até 4 blocos dali, dentro da área e num lugar possível
      for (let t = 0; t < 8; t++) {
        const tx = Math.floor(c.x / 16 + (rnd() - 0.5) * 8), ty = Math.floor(c.y / 16 + (rnd() - 0.5) * 6);
        if (tx < c.home.x0 || ty < c.home.y0 || tx >= c.home.x1 || ty >= c.home.y1 || !critterFloor(town, c.kind, tx, ty)) continue;
        // o caminho reto não pode atravessar parede
        const steps = Math.ceil(Math.hypot(tx * 16 + 8 - c.x, ty * 16 + 10 - c.y) / 8);
        let ok = true;
        for (let s = 1; s <= steps && ok; s++) {
          const px = c.x + ((tx * 16 + 8 - c.x) * s) / steps, py = c.y + ((ty * 16 + 10 - c.y) * s) / steps;
          ok = critterFloor(town, c.kind, Math.floor(px / 16), Math.floor(py / 16));
        }
        if (!ok) continue;
        c.gx = tx * 16 + 8; c.gy = ty * 16 + 10;
        break;
      }
      c.wait = 1200 + rnd() * (c.kind === 'vaca' ? 6000 : 3500);
      continue;
    }
    const v = (SPEED[c.kind] * dt) / 1000;
    c.x += (dx / d) * Math.min(v, d);
    c.y += (dy / d) * Math.min(v, d);
    if (Math.abs(dx) > 0.5) c.face = dx > 0 ? 1 : -1;
    moved = true;
  }
  return moved;
}
