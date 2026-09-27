// Dia e noite. Cada objeto pode ter uma camada "noite" (pixels que acendem:
// janelas, letreiros, LEDs, postes). À noite a cena inteira é multiplicada
// por uma tinta azulada, a camada de luzes é desenhada por cima e um halo
// (a mesma camada borrada) é somado para dar o brilho em volta.
import { hex, mix, Pixmap, type RGB } from './pixmap';

export interface TimeOfDay {
  /** Hora do jogo (0–24). */
  hour: number;
  /** Cor que multiplica a cena (branco = sem efeito). */
  tint: RGB;
  /** Quanto as luzes acendem (0 = dia, 1 = noite). */
  light: number;
  label: 'madrugada' | 'amanhecer' | 'dia' | 'entardecer' | 'noite';
}

const KEYS: { h: number; tint: string; light: number }[] = [
  { h: 0, tint: '#646ebc', light: 1 },
  { h: 4.5, tint: '#646ebc', light: 1 },
  { h: 5.75, tint: '#e6b8c8', light: 0.45 },
  { h: 7, tint: '#ffffff', light: 0 },
  { h: 16.5, tint: '#ffffff', light: 0 },
  { h: 18, tint: '#ffcf9c', light: 0.3 },
  { h: 19.25, tint: '#a08ccc', light: 0.8 },
  { h: 20.5, tint: '#646ebc', light: 1 },
  { h: 24, tint: '#646ebc', light: 1 },
];

export function timeOfDay(hour: number): TimeOfDay {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = (h - a.h) / (b.h - a.h || 1);
  const label: TimeOfDay['label'] = h < 5 ? 'madrugada' : h < 7 ? 'amanhecer' : h < 17 ? 'dia' : h < 19.5 ? 'entardecer' : 'noite';
  return { hour: h, tint: mix(hex(a.tint), hex(b.tint), t), light: a.light + (b.light - a.light) * t, label };
}

/**
 * Halo das luzes: a camada de luzes borrada (3 passadas de caixa ≈ gaussiana),
 * em RGB aditivo (preto = não soma nada). `gain` compensa o apagamento do borrão.
 */
export function lightHalo(lights: Pixmap, radius = 6, gain = 1.2, down = 1): Pixmap {
  // `down` = 2 calcula em meia resolução (4× mais rápido); quem desenha amplia
  const w = Math.ceil(lights.w / down), h = Math.ceil(lights.h / down);
  radius = Math.max(1, Math.round(radius / down));
  let r = new Float32Array(w * h), g = new Float32Array(w * h), b = new Float32Array(w * h);
  const share = 1 / (down * down);
  for (let y = 0; y < lights.h; y++) for (let x = 0; x < lights.w; x++) {
    const si = (y * lights.w + x) * 4;
    if (lights.data[si + 3] === 0) continue;
    const i = ((y / down) | 0) * w + ((x / down) | 0);
    r[i] += lights.data[si] * share; g[i] += lights.data[si + 1] * share; b[i] += lights.data[si + 2] * share;
  }
  const pass = (src: Float32Array, horiz: boolean): Float32Array => {
    const out = new Float32Array(w * h);
    const n = horiz ? w : h, lines = horiz ? h : w, k = 2 * radius + 1;
    for (let l = 0; l < lines; l++) {
      const at = (p: number) => (horiz ? l * w + p : p * w + l);
      let acc = 0;
      for (let p = -radius; p <= radius; p++) if (p >= 0 && p < n) acc += src[at(p)];
      for (let p = 0; p < n; p++) {
        out[at(p)] = acc / k;
        const add = p + radius + 1, sub = p - radius;
        if (add < n) acc += src[at(add)];
        if (sub >= 0) acc -= src[at(sub)];
      }
    }
    return out;
  };
  for (let k = 0; k < 3; k++) {
    r = pass(pass(r, true), false); g = pass(pass(g, true), false); b = pass(pass(b, true), false);
  }
  const out = new Pixmap(w, h);
  for (let i = 0; i < w * h; i++) {
    out.data[i * 4] = Math.min(255, r[i] * gain);
    out.data[i * 4 + 1] = Math.min(255, g[i] * gain);
    out.data[i * 4 + 2] = Math.min(255, b[i] * gain);
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

/**
 * Aplica a hora do dia numa imagem já composta (versão CPU, para os PNGs de
 * revisão; o jogo faz o mesmo no canvas). `lights` e `halo` do tamanho de `img`.
 */
export function applyTimeOfDay(img: Pixmap, lights: Pixmap, halo: Pixmap, tod: TimeOfDay, haloAmount = 0.6): void {
  const [tr, tg, tb] = tod.tint;
  const L = tod.light;
  for (let i = 0; i < img.w * img.h; i++) {
    const o = i * 4;
    if (img.data[o + 3] === 0) continue;
    let r = (img.data[o] * tr) / 255, g = (img.data[o + 1] * tg) / 255, b = (img.data[o + 2] * tb) / 255;
    if (L > 0) {
      if (lights.data[o + 3] > 0) {
        r += (lights.data[o] - r) * L; g += (lights.data[o + 1] - g) * L; b += (lights.data[o + 2] - b) * L;
      }
      const k = L * haloAmount;
      r += halo.data[o] * k; g += halo.data[o + 1] * k; b += halo.data[o + 2] * k;
    }
    img.data[o] = Math.min(255, r); img.data[o + 1] = Math.min(255, g); img.data[o + 2] = Math.min(255, b);
  }
}
