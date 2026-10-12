// Esqueleto do boneco: onde fica cada parte em cada direção e pose.
// Proporção de Pokémon HGSS/BW: cabeça + cabelo ≈ 55% da altura, corpo curto.
// Quadro 64×64, pés tocando y ≈ 62.

import {
  capsule, ellipse, fromTest, intersect, polygon, roundRect, subtract, union, type Mask,
} from './shapes';

export type Dir = 'down' | 'up' | 'left';
export type Pose = 0 | 1 | 2;

export type Material = 'skin' | 'top' | 'bottom' | 'shoes' | 'hair';

export interface Part {
  id: string;
  mask: Mask;
  mat: Material;
  /** Deslocamento da sombra (luz vindo de cima-esquerda). */
  shade: [number, number];
  /** Brilho de borda do lado da luz. */
  rim?: boolean;
  /** Parte inteira na sombra (pescoço, perna de trás). */
  dark?: boolean;
  /** Faixa de brilho do cabelo. */
  shine?: boolean;
}

export interface Rig {
  parts: Part[];
  /** Onde desenhar os olhos, a boca e as bochechas (no rosto já pintado). */
  strands?: Strand[];
  face?: { eyes: [number, number][]; mouth: [number, number]; blush: [number, number][]; side?: boolean };
}

export interface RigLook {
  hair: string;
  sleeves: 'curta' | 'longa';
  legs: 'curta' | 'comprida';
}

/** Linha da franja: dente de serra entre y0 e y0+amp. */
function bangs(x: number, y0: number, amp: number, period: number, phase = 0): number {
  const t = (((x - phase) / period) % 1 + 1) % 1;
  return y0 + amp * (1 - Math.abs(t - 0.5) * 2);
}

// ─────────────────────── Cabelos ───────────────────────
// Cada estilo devolve a máscara da frente (sobre o rosto) e, se houver, a de
// trás (atrás do corpo). O rosto é recortado da máscara da frente.

/** Linha de mecha: segmento desenhado em tom escuro por cima do cabelo. */
export type Strand = [number, number, number, number];

interface HairShape { front: Mask; back?: Mask; strands?: Strand[] }

/** Mechas saindo dos vales da franja, para cima. */
function bangStrands(x0: number, x1: number, y0: number, period: number, phase: number, len = 5, lean = 1): Strand[] {
  const out: Strand[] = [];
  for (let x = phase; x <= x1; x += period) {
    if (x < x0) continue;
    out.push([x, y0 + 0.5, x + lean, y0 - len]);
  }
  return out;
}

/** Ponta afilada de cabelo: triângulo da base (bx1,by1)-(bx2,by2) até a ponta. */
function spike(bx1: number, by1: number, bx2: number, by2: number, tx: number, ty: number): Mask {
  return polygon([[bx1, by1], [tx, ty], [bx2, by2]]);
}

type HairFn = (dir: Dir, dy: number) => HairShape;

/** Rosto de perfil: redondo na frente, costeleta curva atrás. */
function sideFace(dy: number, y0: number, amp: number, period: number, phase: number): Mask {
  return subtract(
    intersect(ellipse(26, 28.5 + dy, 11.5, 10), fromTest((x, y) => y > bangs(x, y0 + dy, amp, period, phase))),
    ellipse(40, 25 + dy, 7.5, 10),
  );
}

const HAIR: Record<string, HairFn> = {
  curto: (dir, dy) => {
    if (dir === 'down') {
      const mass = union(
        ellipse(32, 20.5 + dy, 16, 13.5),
        capsule(18.5, 22 + dy, 19, 30 + dy, 2.8),
        capsule(45.5, 22 + dy, 45, 30 + dy, 2.8),
      );
      const face = intersect(
        ellipse(32, 28 + dy, 12, 10),
        fromTest((x, y) => y > bangs(x, 21 + dy, 3.5, 5, 1)),
      );
      return {
        front: subtract(mass, face),
        strands: [...bangStrands(21, 43, 21 + dy, 5, 1), [26, 10 + dy, 23, 15 + dy], [38, 10 + dy, 41, 15 + dy]],
      };
    }
    if (dir === 'up') {
      return {
        front: union(ellipse(32, 21.5 + dy, 16, 14), roundRect(20, 24 + dy, 44, 35 + dy, 6)),
        strands: [[32, 12 + dy, 32, 33 + dy], [26, 14 + dy, 23, 32 + dy], [38, 14 + dy, 41, 32 + dy], [21, 20 + dy, 19, 30 + dy], [43, 20 + dy, 45, 30 + dy]],
      };
    }
    const mass = union(ellipse(33.5, 20.5 + dy, 15.5, 13.5), ellipse(38, 27 + dy, 9.5, 8.5));
    return {
      front: subtract(mass, sideFace(dy, 21, 3.5, 5, 0)),
      strands: [...bangStrands(19, 32, 21 + dy, 5, 0, 5, 1), [40, 14 + dy, 45, 22 + dy], [38, 22 + dy, 43, 31 + dy]],
    };
  },

  longo: (dir, dy) => {
    if (dir === 'down') {
      const mass = union(
        ellipse(32, 20.5 + dy, 16, 13.5),
        capsule(18.5, 22 + dy, 18.5, 41 + dy, 3.4),
        capsule(45.5, 22 + dy, 45.5, 41 + dy, 3.4),
      );
      const face = intersect(
        ellipse(32, 28 + dy, 12, 10),
        fromTest((x, y) => y > bangs(x, 21 + dy, 3, 6, 2)),
      );
      return {
        front: subtract(mass, face),
        back: roundRect(17, 24 + dy, 47, 44 + dy, 7),
        strands: [...bangStrands(21, 43, 21 + dy, 6, 2), [18.5, 26 + dy, 18.5, 41 + dy], [45.5, 26 + dy, 45.5, 41 + dy], [27, 10 + dy, 24, 16 + dy]],
      };
    }
    if (dir === 'up') {
      return {
        front: union(ellipse(32, 21.5 + dy, 16, 14), roundRect(17.5, 24 + dy, 46.5, 46 + dy, 8)),
        strands: [[32, 12 + dy, 32, 45 + dy], [26, 14 + dy, 24, 45 + dy], [38, 14 + dy, 40, 45 + dy], [21, 22 + dy, 20, 44 + dy], [43, 22 + dy, 44, 44 + dy]],
      };
    }
    const mass = union(
      ellipse(33.5, 20.5 + dy, 15.5, 13.5),
      roundRect(31, 22 + dy, 48.5, 45 + dy, 7),
    );
    return {
      front: subtract(mass, sideFace(dy, 21, 3, 6, 0)),
      strands: [...bangStrands(19, 32, 21 + dy, 6, 0), [38, 16 + dy, 38, 44 + dy], [43, 18 + dy, 44, 44 + dy]],
    };
  },

  espetado: (dir, dy) => {
    const top = union(
      spike(17, 22 + dy, 24, 12 + dy, 9, 8 + dy),
      spike(22, 14 + dy, 31, 9 + dy, 22, 2 + dy),
      spike(29, 10 + dy, 38, 9 + dy, 35, 1 + dy),
      spike(35, 9 + dy, 44, 13 + dy, 45, 2 + dy),
      spike(41, 12 + dy, 48, 22 + dy, 56, 9 + dy),
    );
    if (dir === 'down') {
      const mass = union(ellipse(32, 20.5 + dy, 16, 13.5), top,
        spike(17, 22 + dy, 21, 22 + dy, 18, 31 + dy), spike(43, 22 + dy, 47, 22 + dy, 46, 31 + dy));
      const face = intersect(
        ellipse(32, 28 + dy, 12, 10),
        fromTest((x, y) => y > bangs(x, 20 + dy, 5, 6, 3)),
      );
      return {
        front: subtract(mass, face),
        strands: [...bangStrands(21, 43, 20 + dy, 6, 3, 6), [22, 12 + dy, 19, 9 + dy], [31, 10 + dy, 29, 4 + dy], [37, 10 + dy, 39, 4 + dy], [44, 13 + dy, 48, 10 + dy]],
      };
    }
    if (dir === 'up') {
      return {
        front: union(ellipse(32, 21.5 + dy, 16, 14), top, roundRect(20, 24 + dy, 44, 34 + dy, 6),
          spike(24, 30 + dy, 32, 30 + dy, 28, 38 + dy), spike(32, 30 + dy, 40, 30 + dy, 36, 38 + dy)),
        strands: [[32, 12 + dy, 32, 33 + dy], [25, 15 + dy, 22, 31 + dy], [39, 15 + dy, 42, 31 + dy]],
      };
    }
    const mass = union(
      ellipse(33.5, 20.5 + dy, 15.5, 13.5), ellipse(38, 27 + dy, 9.5, 8),
      spike(20, 16 + dy, 28, 10 + dy, 16, 5 + dy),
      spike(26, 11 + dy, 35, 8 + dy, 31, 1 + dy),
      spike(33, 8 + dy, 43, 12 + dy, 45, 2 + dy),
      spike(41, 12 + dy, 48, 22 + dy, 57, 12 + dy),
      spike(44, 22 + dy, 46, 32 + dy, 54, 29 + dy),
    );
    return {
      front: subtract(mass, sideFace(dy, 20, 5, 6, 1)),
      strands: [...bangStrands(19, 32, 20 + dy, 6, 1, 6), [33, 9 + dy, 35, 4 + dy], [42, 13 + dy, 47, 9 + dy], [44, 22 + dy, 49, 23 + dy]],
    };
  },

  coques: (dir, dy) => {
    const buns = union(ellipse(16.5, 14 + dy, 5.5, 5.5), ellipse(47.5, 14 + dy, 5.5, 5.5));
    if (dir === 'down') {
      const mass = union(ellipse(32, 20.5 + dy, 16, 13.5), buns,
        capsule(18.5, 22 + dy, 19, 31 + dy, 2.6), capsule(45.5, 22 + dy, 45, 31 + dy, 2.6));
      const face = intersect(
        ellipse(32, 28 + dy, 12, 10),
        fromTest((x, y) => y > bangs(x, 21 + dy, 2.5, 4, 0)),
      );
      return {
        front: subtract(mass, face),
        strands: [...bangStrands(21, 43, 21 + dy, 4, 0, 4), [14, 12 + dy, 18, 17 + dy], [50, 12 + dy, 46, 17 + dy]],
      };
    }
    if (dir === 'up') {
      return {
        front: union(ellipse(32, 21.5 + dy, 16, 14), buns, roundRect(20, 24 + dy, 44, 34 + dy, 6)),
        strands: [[32, 11 + dy, 32, 33 + dy], [26, 13 + dy, 24, 32 + dy], [38, 13 + dy, 40, 32 + dy]],
      };
    }
    const mass = union(ellipse(33.5, 20.5 + dy, 15.5, 13.5), ellipse(38, 27 + dy, 9.5, 8.5),
      ellipse(42, 11 + dy, 5.5, 5.5));
    return {
      front: subtract(mass, sideFace(dy, 21, 2.5, 4, 0)),
      strands: [...bangStrands(19, 32, 21 + dy, 4, 0, 4), [40, 15 + dy, 44, 22 + dy]],
    };
  },
};

export const HAIR_IDS = Object.keys(HAIR);

// ─────────────────────── Corpo ───────────────────────

/** Braço em duas partes: manga (roupa) e antebraço (roupa ou pele). */
function arm(id: string, sx: number, sy: number, hx: number, hy: number, look: RigLook, back = false): Part[] {
  const ex = (sx + hx) / 2, ey = (sy + hy) / 2;
  const sleeveEnd = look.sleeves === 'longa' ? [hx, hy - 1] : [ex, ey];
  return [
    { id: `${id}-mao`, mask: ellipse(hx, hy + 1, 2.7, 2.7), mat: 'skin', shade: [1, 1], dark: back },
    ...(look.sleeves === 'curta'
      ? [{ id: `${id}-antebraco`, mask: capsule(ex, ey, hx, hy, 2.4), mat: 'skin' as Material, shade: [1, 0] as [number, number], dark: back }]
      : []),
    { id: `${id}-manga`, mask: capsule(sx, sy, sleeveEnd[0], sleeveEnd[1], 2.9), mat: 'top', shade: [1, 0], dark: back },
  ];
}

/** Perna em duas partes: coxa (roupa de baixo) e canela (roupa ou pele). */
function leg(id: string, hx: number, hy: number, fx: number, fy: number, look: RigLook, back = false, side = false): Part[] {
  const kx = (hx + fx) / 2, ky = (hy + fy) / 2;
  const parts: Part[] = [
    { id: `${id}-canela`, mask: capsule(kx, ky, fx, fy - 1, 2.6), mat: look.legs === 'comprida' ? 'bottom' : 'skin', shade: [1, 0], dark: back },
    { id: `${id}-coxa`, mask: capsule(hx, hy, kx, ky, 3.1), mat: 'bottom', shade: [1, 0], dark: back },
  ];
  const shoe = side ? ellipse(fx - 1, fy + 0.5, 4.6, 2.6) : ellipse(fx, fy + 0.5, 3.8, 2.7);
  return [{ id: `${id}-sapato`, mask: shoe, mat: 'shoes', shade: [1, 1], dark: back, rim: true }, ...parts];
}

export function buildRig(look: RigLook, dir: Dir, pose: Pose): Rig {
  const bob = pose === 0 ? 0 : 1;
  const hairFn = HAIR[look.hair] ?? HAIR.curto;
  const hair = hairFn(dir, bob);
  const parts: Part[] = [];

  if (hair.back) parts.push({ id: 'cabelo-tras', mask: hair.back, mat: 'hair', shade: [2, 1], dark: true });

  if (dir === 'down' || dir === 'up') {
    // Passo: uma perna estica, a outra levanta; os braços balançam ao contrário.
    const l = pose === 1 ? 1 : pose === 2 ? -2 : 0;
    const r = pose === 2 ? 1 : pose === 1 ? -2 : 0;
    parts.push(
      ...leg('perna-e', 28, 51 + bob, 27.5, 59 + l, look),
      ...leg('perna-d', 36, 51 + bob, 36.5, 59 + r, look),
      { id: 'quadril', mask: roundRect(24.5, 46 + bob, 39.5, 52 + bob, 2.5), mat: 'bottom', shade: [2, 1] },
      { id: 'pescoco', mask: roundRect(29, 33 + bob, 35, 39 + bob, 1), mat: 'skin', shade: [0, 0], dark: true },
      { id: 'tronco', mask: roundRect(23.5, 37 + bob, 40.5, 49 + bob, 4.5), mat: 'top', shade: [2, 1], rim: true },
      ...arm('braco-e', 22.5, 40 + bob, 21.5 + (pose === 2 ? 0.5 : 0), 47 + bob - (pose === 2 ? 1 : 0), look),
      ...arm('braco-d', 41.5, 40 + bob, 42.5 - (pose === 1 ? 0.5 : 0), 47 + bob - (pose === 1 ? 1 : 0), look),
      { id: 'cabeca', mask: ellipse(32, 24 + bob, 14, 12.5), mat: 'skin', shade: [2, 2] },
    );
    if (dir === 'down') {
      parts.push(
        { id: 'orelha-e', mask: ellipse(18.5, 27 + bob, 2.2, 3), mat: 'skin', shade: [1, 1] },
        { id: 'orelha-d', mask: ellipse(45.5, 27 + bob, 2.2, 3), mat: 'skin', shade: [1, 1] },
      );
    }
    parts.push({ id: 'cabelo', mask: hair.front, mat: 'hair', shade: [2, 2], shine: true });
    return {
      parts,
      strands: hair.strands,
      face: dir === 'down'
        ? { eyes: [[25, 27 + bob], [36, 27 + bob]], mouth: [31, 33 + bob], blush: [[22, 32 + bob], [40, 32 + bob]] }
        : undefined,
    };
  }

  // Esquerda (a direita é o espelho).
  const stride = pose === 1 ? 4 : pose === 2 ? -4 : 0;
  parts.push(
    ...leg('perna-tras', 33, 50 + bob, 33 + stride * -0.8, 59, look, true, true),
    ...arm('braco-tras', 32, 40 + bob, 32 - stride * 0.6, 47 + bob, look, true),
    { id: 'pescoco', mask: roundRect(29, 33 + bob, 35, 39 + bob, 1), mat: 'skin', shade: [0, 0], dark: true },
    { id: 'quadril', mask: roundRect(26.5, 46 + bob, 37.5, 52 + bob, 2.5), mat: 'bottom', shade: [2, 1] },
    ...leg('perna-frente', 31, 50 + bob, 31 + stride * 0.8, 59, look, false, true),
    { id: 'tronco', mask: roundRect(25.5, 37 + bob, 38.5, 49 + bob, 4.5), mat: 'top', shade: [2, 1], rim: true },
    ...arm('braco-frente', 31, 40 + bob, 31 + stride * 0.6, 47 + bob, look),
    { id: 'cabeca', mask: ellipse(31, 24 + bob, 13.5, 12.5), mat: 'skin', shade: [2, 2] },
    { id: 'cabelo', mask: hair.front, mat: 'hair', shade: [2, 2], shine: true },
  );
  if (look.hair !== 'longo') {
    parts.push({ id: 'orelha', mask: ellipse(34.5, 28 + bob, 2.3, 3), mat: 'skin', shade: [1, 1] });
  }
  return {
    parts,
    strands: hair.strands,
    face: { eyes: [[21, 27 + bob]], mouth: [19, 33 + bob], blush: [[20, 32 + bob]], side: true },
  };
}
