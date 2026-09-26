// Monta um quadro do boneco (32×32 RGBA) empilhando as camadas de base.ts e
// pintando cada região com a rampa escolhida. Função pura: roda no navegador
// (canvas) e no Node (script que gera a folha em PNG).

import {
  BOB, BODY, BODY_ORIGIN, FACE, FRAME, HAIR_ORIGIN, HAIR_STYLES, HEAD,
  HEAD_ORIGIN, type Dir, type Pose,
} from './base';
import {
  CLOTH_COLORS, DEFAULT_OUTLINE, EYE_COLORS, HAIR_COLORS, SKIN_TONES, type Ramp,
} from './palette';

export interface AvatarLook {
  skin: keyof typeof SKIN_TONES;
  hair: string;
  hairColor: keyof typeof HAIR_COLORS;
  eyes: keyof typeof EYE_COLORS;
  top: keyof typeof CLOTH_COLORS;
  sleeves: 'curta' | 'longa';
  bottom: keyof typeof CLOTH_COLORS;
  legs: 'curta' | 'comprida';
  shoes: keyof typeof CLOTH_COLORS;
}

export type Facing = Dir | 'right';

type Material = 'skin' | 'top' | 'bottom' | 'shoes' | 'hair' | 'eyes';
// Índice na rampa: 0 contorno, 1 sombra, 2 base, 3 luz.
type Tone = 0 | 1 | 2 | 3;

const BLUSH = '#f49a9a';

function codeColor(code: string, look: AvatarLook, ramps: Record<Material, Ramp>): string | null {
  const m = (mat: Material, tone: Tone) => ramps[mat][tone];
  switch (code) {
    case 'S': return m('skin', 2);
    case 's': return m('skin', 1);
    case 'k': return m('skin', 3);
    case 'H': return m('skin', 2);
    case 'h': return m('skin', 1);
    case 'T': case 'A': return m('top', 2);
    case 't': case 'a': return m('top', 1);
    case 'U': return m('top', 3);
    case 'R': return look.sleeves === 'longa' ? m('top', 2) : m('skin', 2);
    case 'r': return look.sleeves === 'longa' ? m('top', 1) : m('skin', 1);
    case 'P': return m('bottom', 2);
    case 'p': return m('bottom', 1);
    case 'V': return m('bottom', 3);
    case 'Q': return look.legs === 'comprida' ? m('bottom', 2) : m('skin', 2);
    case 'q': return look.legs === 'comprida' ? m('bottom', 1) : m('skin', 1);
    case 'F': return m('shoes', 2);
    case 'f': return m('shoes', 1);
    case 'G': return m('shoes', 3);
    case 'Y': return m('hair', 2);
    case 'y': return m('hair', 1);
    case 'Z': return m('hair', 3);
    case 'D': return m('eyes', 0);
    case 'E': return m('eyes', 2);
    case 'e': return m('eyes', 3);
    case 'M': return m('skin', 0);
    case 'B': return BLUSH;
    default: return null;
  }
}

/** Contorno: a cor mais escura da primeira região vizinha na mesma camada. */
function outlineColor(rows: readonly string[], x: number, y: number, look: AvatarLook, ramps: Record<Material, Ramp>): string {
  const around = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (const [dx, dy] of around) {
    const c = rows[y + dy]?.[x + dx];
    if (!c || c === '.' || c === 'O') continue;
    const mat = materialOf(c, look);
    if (mat) return ramps[mat][0];
  }
  return DEFAULT_OUTLINE;
}

function materialOf(code: string, look: AvatarLook): Material | null {
  if ('SskHhMB'.includes(code)) return 'skin';
  if ('TtUAa'.includes(code)) return 'top';
  if ('Rr'.includes(code)) return look.sleeves === 'longa' ? 'top' : 'skin';
  if ('PpV'.includes(code)) return 'bottom';
  if ('Qq'.includes(code)) return look.legs === 'comprida' ? 'bottom' : 'skin';
  if ('FfG'.includes(code)) return 'shoes';
  if ('YyZ'.includes(code)) return 'hair';
  if ('DEe'.includes(code)) return 'eyes';
  return null;
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function composeFrame(look: AvatarLook, facing: Facing, pose: Pose): Uint8ClampedArray {
  const px = new Uint8ClampedArray(FRAME * FRAME * 4);
  const dir: Dir = facing === 'right' ? 'left' : facing;
  const ramps: Record<Material, Ramp> = {
    skin: SKIN_TONES[look.skin],
    top: CLOTH_COLORS[look.top],
    bottom: CLOTH_COLORS[look.bottom],
    shoes: CLOTH_COLORS[look.shoes],
    hair: HAIR_COLORS[look.hairColor],
    eyes: EYE_COLORS[look.eyes],
  };
  const style = HAIR_STYLES.find(h => h.id === look.hair) ?? HAIR_STYLES[0];
  const bob = BOB[pose];

  const layers: { rows: readonly string[] | null | undefined; x: number; y: number }[] = [
    { rows: style.back?.[dir], x: HAIR_ORIGIN.x, y: HAIR_ORIGIN.y + bob },
    { rows: BODY[dir][pose], x: BODY_ORIGIN.x, y: BODY_ORIGIN.y },
    { rows: HEAD[dir], x: HEAD_ORIGIN.x, y: HEAD_ORIGIN.y + bob },
    { rows: FACE[dir], x: HEAD_ORIGIN.x, y: HEAD_ORIGIN.y + bob },
    { rows: style.front[dir], x: HAIR_ORIGIN.x, y: HAIR_ORIGIN.y + bob },
  ];

  for (const layer of layers) {
    if (!layer.rows) continue;
    layer.rows.forEach((row, ry) => {
      [...row].forEach((code, rx) => {
        if (code === '.') return;
        const color = code === 'O'
          ? outlineColor(layer.rows!, rx, ry, look, ramps)
          : codeColor(code, look, ramps);
        if (!color) return;
        const x = layer.x + rx;
        const y = layer.y + ry;
        if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return;
        const i = (y * FRAME + x) * 4;
        const [r, g, b] = hex(color);
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
      });
    });
  }

  if (facing === 'right') mirror(px);
  return px;
}

function mirror(px: Uint8ClampedArray): void {
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME / 2; x++) {
      const a = (y * FRAME + x) * 4;
      const b = (y * FRAME + (FRAME - 1 - x)) * 4;
      for (let k = 0; k < 4; k++) {
        const t = px[a + k]; px[a + k] = px[b + k]; px[b + k] = t;
      }
    }
  }
}

/** Ciclo de caminhada do Black & White: parado, passo, parado, outro passo. */
export const WALK_CYCLE: Pose[] = [0, 1, 0, 2];
