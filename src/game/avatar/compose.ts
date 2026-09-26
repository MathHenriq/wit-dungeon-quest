// Transforma o esqueleto (rig.ts) em pixels: pinta cada parte com a rampa de
// cor escolhida e aplica, sozinho, o que dá cara de Pokémon HGSS/BW:
// contorno escuro por fora, linha entre partes, sombra do lado oposto à luz,
// brilho de borda e faixa de brilho no cabelo. Função pura.

import { buildRig, type Dir, type Material, type Part, type Pose } from './rig';
import { at, SIZE } from './shapes';
import {
  CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, SKIN_TONES, type Ramp,
} from './palette';

export const FRAME = SIZE;

export interface AvatarLook {
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  top: string;
  sleeves: 'curta' | 'longa';
  bottom: string;
  legs: 'curta' | 'comprida';
  shoes: string;
}

export type Facing = Dir | 'right';
export type { Pose };

/** Ciclo de caminhada do Pokémon: parado, passo, parado, outro passo. */
export const WALK_CYCLE: Pose[] = [0, 1, 0, 2];

const BLUSH = [244, 150, 150] as const;
const WHITE = [255, 255, 255] as const;

function rgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const darken = ([r, g, b]: readonly number[], k: number): [number, number, number] =>
  [Math.round(r * k), Math.round(g * k), Math.round(b * k)];

const mix = (a: readonly number[], b: readonly number[], t: number): [number, number, number] =>
  [0, 1, 2].map(i => Math.round(a[i] * (1 - t) + b[i] * t)) as [number, number, number];

/** Braço e perna contam como uma peça só (mão + antebraço + manga). */
function group(p: Part): string {
  return p.id.startsWith('braco-') || p.id.startsWith('perna-')
    ? p.id.split('-').slice(0, 2).join('-')
    : p.id;
}

export function composeFrame(look: AvatarLook, facing: Facing, pose: Pose): Uint8ClampedArray {
  const dir: Dir = facing === 'right' ? 'left' : facing;
  const rig = buildRig(look, dir, pose);
  const ramps: Record<Material, Ramp> = {
    skin: SKIN_TONES[look.skin] ?? SKIN_TONES.clara,
    top: CLOTH_COLORS[look.top] ?? CLOTH_COLORS.azul,
    bottom: CLOTH_COLORS[look.bottom] ?? CLOTH_COLORS.jeans,
    shoes: CLOTH_COLORS[look.shoes] ?? CLOTH_COLORS.preto,
    hair: HAIR_COLORS[look.hairColor] ?? HAIR_COLORS.castanho,
  };
  const tone = (p: Part, i: 0 | 1 | 2 | 3) => rgb(ramps[p.mat][i]);

  const N = SIZE * SIZE;
  const owner = new Int16Array(N).fill(-1);
  rig.parts.forEach((p, i) => {
    for (let k = 0; k < N; k++) if (p.mask[k]) owner[k] = i;
  });

  const px = new Uint8ClampedArray(N * 4);
  const put = (x: number, y: number, c: readonly number[]) => {
    const k = (y * SIZE + x) * 4;
    px[k] = c[0]; px[k + 1] = c[1]; px[k + 2] = c[2]; px[k + 3] = 255;
  };
  const ownerAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= SIZE || y >= SIZE ? -1 : owner[y * SIZE + x];

  // Faixa de brilho do cabelo: 4–5 px abaixo do topo, na metade do lado da luz.
  const hairIdx = rig.parts.findIndex(p => p.shine);
  let hairBox = { x0: 0, x1: 0 };
  if (hairIdx >= 0) {
    const m = rig.parts[hairIdx].mask;
    let x0 = SIZE, x1 = 0;
    for (let k = 0; k < N; k++) if (m[k]) { const x = k % SIZE; x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    hairBox = { x0, x1 };
  }

  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = owner[y * SIZE + x];
    if (i < 0) continue;
    const p = rig.parts[i];

    // Linha entre partes: a parte da frente ganha contorno onde encosta numa
    // parte de trás diferente.
    const edge = N4.some(([dx, dy]) => {
      const j = ownerAt(x + dx, y + dy);
      if (j < 0 || j >= i) return false;
      const q = rig.parts[j];
      return group(q) !== group(p) || q.mat !== p.mat;
    });
    if (edge) { put(x, y, darken(tone(p, 0), p.dark ? 0.8 : 1)); continue; }

    let c = tone(p, 2);
    const shaded = !at(p.mask, x + p.shade[0], y + p.shade[1]) && (p.shade[0] || p.shade[1]);
    if (p.dark) c = shaded ? mix(tone(p, 1), tone(p, 0), 0.4) : tone(p, 1);
    else if (shaded) c = tone(p, 1);
    else if (p.rim && !at(p.mask, x - 1, y - 1)) c = tone(p, 3);

    if (p.shine && !shaded) {
      let depth = 0;
      while (depth < 8 && at(p.mask, x, y - depth - 1)) depth++;
      const span = hairBox.x1 - hairBox.x0;
      const inLeft = x > hairBox.x0 + span * 0.12 && x < hairBox.x0 + span * 0.62;
      if (inLeft && (depth === 3 || depth === 4)) c = tone(p, 3);
      else if (depth <= 1 && x < hairBox.x0 + span * 0.5) c = mix(tone(p, 2), tone(p, 3), 0.5);
    }
    // Sombra que o cabelo projeta no rosto logo abaixo da franja.
    if (p.mat === 'skin' && p.id === 'cabeca') {
      const above = ownerAt(x, y - 1);
      if (above >= 0 && rig.parts[above].mat === 'hair') c = tone(p, 1);
    }
    put(x, y, c);
  }

  // Contorno externo, quase preto, puxando a cor da parte vizinha.
  const snapshot = new Int16Array(owner);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (snapshot[y * SIZE + x] >= 0) continue;
    for (const [dx, dy] of N4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      const j = snapshot[ny * SIZE + nx];
      if (j >= 0) { put(x, y, darken(tone(rig.parts[j], 0), 0.5)); break; }
    }
  }

  // Mechas: linhas no tom de sombra, só por cima do cabelo.
  if (rig.strands && hairIdx >= 0) {
    const hairPart = rig.parts[hairIdx];
    const line = mix(tone(hairPart, 1), tone(hairPart, 0), 0.35);
    for (const [x1, y1, x2, y2] of rig.strands) {
      const n = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))) + 1;
      for (let k = 0; k <= n; k++) {
        const x = Math.floor(x1 + ((x2 - x1) * k) / n), y = Math.floor(y1 + ((y2 - y1) * k) / n);
        if (ownerAt(x, y) === hairIdx && ownerAt(x, y + 1) !== -1) put(x, y, line);
      }
    }
  }

  // Rosto: só onde a cabeça está visível (a franja pode cobrir).
  if (rig.face) {
    const head = rig.parts.findIndex(p => p.id === 'cabeca');
    const onFace = (x: number, y: number) => ownerAt(x, y) === head;
    const eye = EYE_COLORS[look.eyes] ?? EYE_COLORS.escuro;
    const skin = SKIN_TONES[look.skin] ?? SKIN_TONES.clara;
    const EYE_L = ['.DD', 'DeE', 'DEE', 'DEE', '.DD'];
    const EYE_R = EYE_L.map(r => [...r].reverse().join(''));
    const EYE_SIDE = ['DD', 'eE', 'EE', 'EE', 'DD'];
    const stamp = (pat: string[], ox: number, oy: number) => pat.forEach((row, ry) => [...row].forEach((ch, rx) => {
      const x = ox + rx, y = oy + ry;
      if (ch === '.' || !onFace(x, y)) return;
      put(x, y, ch === 'D' ? rgb(eye[0]) : ch === 'E' ? rgb(eye[2]) : WHITE);
    }));
    if (rig.face.side) stamp(EYE_SIDE, rig.face.eyes[0][0], rig.face.eyes[0][1]);
    else { stamp(EYE_L, ...rig.face.eyes[0]); stamp(EYE_R, ...rig.face.eyes[1]); }

    for (const [bx, by] of rig.face.blush) for (let k = 0; k < 3; k++) {
      if (!onFace(bx + k, by)) continue;
      const i = (by * SIZE + bx + k) * 4;
      put(bx + k, by, mix([px[i], px[i + 1], px[i + 2]], BLUSH, 0.55));
    }
    const [mx, my] = rig.face.mouth;
    const mouth = rgb(skin[0]);
    for (let k = 0; k < (rig.face.side ? 1 : 2); k++) if (onFace(mx + k, my)) put(mx + k, my, mouth);
  }

  if (facing === 'right') mirror(px);
  return px;
}

function mirror(px: Uint8ClampedArray): void {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE / 2; x++) {
    const a = (y * SIZE + x) * 4, b = (y * SIZE + (SIZE - 1 - x)) * 4;
    for (let k = 0; k < 4; k++) { const t = px[a + k]; px[a + k] = px[b + k]; px[b + k] = t; }
  }
}
