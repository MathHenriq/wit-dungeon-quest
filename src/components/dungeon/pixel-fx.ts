// Camada de pixel: o que é desenhado em código (rastro do golpe, poeira, anéis,
// avisos, feixes, peças das cartas) passa por uma tela com metade da resolução
// e volta ampliada sem suavizar: pixel grande e borda serrilhada, como a pixel
// art do GPT, em vez de curva lisa. Transparência de verdade (miolo de aviso,
// zona no chão, fumaça sumindo) é feita com pontilhado (`dither`): pixels
// cheios em xadrez, como no SNES. Não há corte da transparência na borda: ler
// a tela de volta (ou passar um filtro) derrubava o celular em ~30%.
// Sprites não passam por aqui (perderiam detalhe): vão direto na tela.

/** Quadros por segundo dos efeitos de código (anda em degraus, não desliza). */
export const FX_FPS = 24;
/** Tempo arredondado para o quadro. */
export const stepT = (t: number) => Math.floor(t * FX_FPS) / FX_FPS;

/** Bayer 4 × 4: ordem em que os pixels acendem no pontilhado. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export class PixelLayer {
  readonly cv: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** padrões de pontilhado já feitos (cor + nível) */
  private readonly pats = new Map<string, CanvasPattern>();

  constructor(readonly W: number, readonly H: number, readonly scale = 2) {
    this.cv = document.createElement('canvas');
    this.cv.width = Math.ceil(W / scale); this.cv.height = Math.ceil(H / scale);
    this.ctx = this.cv.getContext('2d')!;
  }

  /** Limpa e devolve o contexto já na escala do mundo (as mesmas coordenadas da tela). */
  begin(): CanvasRenderingContext2D {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(1 / this.scale, 0, 0, 1 / this.scale, 0, 0);
    c.imageSmoothingEnabled = false;
    return c;
  }

  /** Desenha ampliado, sem suavizar, em `target`. */
  end(target: CanvasRenderingContext2D) {
    const w = this.cv.width, h = this.cv.height, smooth = target.imageSmoothingEnabled;
    target.imageSmoothingEnabled = false;
    target.drawImage(this.cv, 0, 0, w, h, 0, 0, w * this.scale, h * this.scale);
    target.imageSmoothingEnabled = smooth;
  }

  /**
   * Tinta pontilhada: `level` de 0 a 1 é quantos pixels acendem (0,5 = xadrez).
   * Use como fillStyle/strokeStyle dentro da camada.
   */
  dither(color: string, level: number): CanvasPattern | string {
    const n = Math.round(Math.max(0, Math.min(1, level)) * 16);
    if (n >= 16) return color;
    const key = `${color}|${n}`;
    let p = this.pats.get(key);
    if (!p) {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 4;
      const x = c.getContext('2d')!;
      x.fillStyle = color;
      for (let i = 0; i < 16; i++) if (BAYER[i] < n) x.fillRect(i % 4, Math.floor(i / 4), 1, 1);
      p = this.ctx.createPattern(c, 'repeat')!;
      // o contexto está na escala do mundo (1/scale): o padrão volta ao tamanho do pixel da camada
      p.setTransform(new DOMMatrix().scale(this.scale));
      this.pats.set(key, p);
    }
    return p;
  }
}

/** Cores do efeito: contorno escuro, principal, clara e miolo. */
export type Ramp = [string, string, string, string];

function hex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** Mistura duas cores (k = 0 → a, 1 → b). */
export function mix(a: string, b: string, k: number): string {
  const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
  return toHex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
}
const RAMPS = new Map<string, Ramp>();
/** Rampa de 4 cores a partir de duas (as do elemento ou da arma). */
export function ramp(c1: string, c2 = '#ffffff'): Ramp {
  const key = c1 + c2;
  let r = RAMPS.get(key);
  if (!r) {
    // contorno: a cor principal bem escura e puxada para o roxo (lê em cima de qualquer chão)
    r = [mix(mix(c1, '#1a0a2a', 0.55), '#000000', 0.25), c1, mix(c1, c2, 0.55), mix(c2, '#ffffff', 0.6)];
    RAMPS.set(key, r);
  }
  return r;
}

// ─── formas (desenhe dentro da camada) ───────────────────────────────────────

/** Anel achatado no chão em 3/4: grosso, sem degradê. `fill` = miolo pontilhado. */
export function pxRing(c: CanvasRenderingContext2D, x: number, y: number, r: number, w: number, color: string, flat = 0.72, fill?: CanvasPattern | string) {
  if (r <= 0.5) return;
  c.beginPath(); c.ellipse(x, y, r, r * flat, 0, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.lineWidth = w; c.strokeStyle = color; c.stroke();
}

/** Estrela de 4 pontas (impacto, clarão do tiro). */
export function pxStar(c: CanvasRenderingContext2D, x: number, y: number, r: number, w: number, ang: number, color: string) {
  c.fillStyle = color; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = ang + (i * Math.PI) / 4, rr = i % 2 ? w : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}

/** Rastro reto que afina para trás (tiro, estocada, linha de velocidade). */
export function pxStreak(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  c.fillStyle = color; c.beginPath();
  c.moveTo(x1, y1); c.lineTo(x2 + nx * w / 2, y2 + ny * w / 2); c.lineTo(x2 + (dx / l) * w * 0.6, y2 + (dy / l) * w * 0.6); c.lineTo(x2 - nx * w / 2, y2 - ny * w / 2);
  c.closePath(); c.fill();
}

/**
 * Meia-lua do corte, de `q0` a `q1` do arco (0–1): grossa na ponta da frente,
 * fina atrás. `inset` empurra para dentro (faixas de cor).
 */
export function pxCrescent(c: CanvasRenderingContext2D, x: number, y: number, R: number, a0: number, sweep: number, q0: number, q1: number, thick: number, inset: number, color: string, flat = 0.72) {
  if (q1 - q0 < 0.01 || thick <= 0) return;
  const N = 18;
  c.fillStyle = color; c.beginPath();
  for (let i = 0; i <= N; i++) { const q = q0 + ((q1 - q0) * i) / N, an = a0 + sweep * q, rr = R - inset; c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * flat); }
  for (let i = N; i >= 0; i--) { const u = i / N, q = q0 + (q1 - q0) * u, an = a0 + sweep * q, rr = R - inset - thick * Math.pow(u, 0.7); c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * flat); }
  c.closePath(); c.fill();
}

/** Nuvem de poeira em 2 tons (cresce e esfarela). */
export function pxPuff(c: CanvasRenderingContext2D, x: number, y: number, r: number, light: string | CanvasPattern, dark: string | CanvasPattern) {
  c.fillStyle = dark; c.beginPath(); c.ellipse(x, y + r * 0.25, r, r * 0.75, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = light; c.beginPath(); c.ellipse(x - r * 0.2, y - r * 0.05, r * 0.7, r * 0.55, 0, 0, Math.PI * 2); c.fill();
}
