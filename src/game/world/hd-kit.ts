// Kit para desenhar prédios e objetos direto em hd (2×: 1 bloco = 32 px),
// no mesmo jeito dos sprites do GPT: contorno escuro, luz de cima à esquerda,
// textura (tábuas, telhas, pedra, vidro) e a camada da noite (janelas acesas).
// Os prédios do Lago, da Fazenda e da Cidade WIT saem daqui até a arte do
// GPT chegar (docs/PROMPTS-GPT.md).
import { TILE, type Building } from './buildings';
import { drawText, textWidth } from './font';
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { LED } from './palette';
import { withHd } from './zone';

export const K = 2;           // hd = 2 × o pixel do mundo
export const T2 = TILE * K;   // um bloco em hd

export const INK = hex('#35243a');      // contorno (marrom-arroxeado, como o do GPT)
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [20, 14, 28];

export const lighten = (c: RGB, t: number): RGB => mix(c, mix(WHITE, hex('#fff4d8'), 0.4), t);
export const darken = (c: RGB, t: number): RGB => mix(c, mix(BLACK, hex('#2a1e48'), 0.5), t);

/** Uma arte em hd com a camada da noite do mesmo tamanho. */
export class Art {
  readonly pm: Pixmap;
  readonly nt: Pixmap;
  constructor(readonly W: number, readonly H: number) {
    this.pm = new Pixmap(W, H);
    this.nt = new Pixmap(W, H);
  }

  px(x: number, y: number, c: RGB): void { this.pm.put(x, y, c); }
  rect(x: number, y: number, w: number, h: number, c: RGB): void { this.pm.rect(x, y, w, h, c); }
  hline(x: number, y: number, w: number, c: RGB): void { this.pm.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: RGB): void { this.pm.rect(x, y, 1, h, c); }
  glow(x: number, y: number, w: number, h: number, c: RGB): void { this.nt.rect(x, y, w, h, c); }

  /** Retângulo com textura leve (variação de tom por pixel). */
  grain(x: number, y: number, w: number, h: number, c: RGB, amt = 0.06, seed = 1): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const n = hash(xx, yy, seed) - 0.5;
      this.pm.put(xx, yy, n > 0 ? lighten(c, n * amt * 2) : darken(c, -n * amt * 2));
    }
  }

  /** Degradê vertical de `top` até `bottom`. */
  vgrad(x: number, y: number, w: number, h: number, top: RGB, bottom: RGB): void {
    for (let k = 0; k < h; k++) this.pm.rect(x, y + k, w, 1, mix(top, bottom, h > 1 ? k / (h - 1) : 0));
  }

  /** Parede de tábuas deitadas (sidings): luz em cima de cada tábua, sombra embaixo, nós na madeira. */
  planks(x: number, y: number, w: number, h: number, c: RGB, board = 6, seed = 3, mask?: (x: number, y: number) => boolean): void {
    const put = (X: number, Y: number, p: RGB) => { if (!mask || mask(X, Y)) this.pm.put(X, Y, p); };
    for (let yy = 0; yy < h; yy++) {
      const row = Math.floor(yy / board), inRow = yy % board;
      const tone = (hash(row, 7, seed) - 0.5) * 0.12;
      const base = tone > 0 ? lighten(c, tone) : darken(c, -tone);
      for (let xx = 0; xx < w; xx++) {
        let p = base;
        if (inRow === 0) p = lighten(base, 0.18);
        else if (inRow === board - 1) p = darken(base, 0.28);
        else if (hash(x + xx, y + yy, seed) > 0.93) p = darken(base, 0.08);
        put(x + xx, y + yy, p);
      }
      // emendas das tábuas
      if (inRow > 0 && inRow < board - 1) {
        const joint = Math.floor(hash(row, 3, seed) * w * 0.6) + 8;
        if (joint < w - 4) put(x + joint, y + yy, darken(base, 0.22));
      }
    }
  }

  /** Tábuas em pé (celeiro, cerca, cais). */
  vplanks(x: number, y: number, w: number, h: number, c: RGB, board = 6, seed = 5): void {
    for (let xx = 0; xx < w; xx++) {
      const col = Math.floor(xx / board), inCol = xx % board;
      const tone = (hash(col, 11, seed) - 0.5) * 0.14;
      const base = tone > 0 ? lighten(c, tone) : darken(c, -tone);
      for (let yy = 0; yy < h; yy++) {
        let p = base;
        if (inCol === 0) p = lighten(base, 0.14);
        else if (inCol === board - 1) p = darken(base, 0.3);
        else if (hash(x + xx, y + yy, seed) > 0.95) p = darken(base, 0.1);
        this.pm.put(x + xx, y + yy, p);
      }
    }
  }

  /** Tijolinho. */
  bricks(x: number, y: number, w: number, h: number, c: RGB, mortar: RGB, bw = 8, bh = 4, seed = 9): void {
    for (let yy = 0; yy < h; yy++) {
      const row = Math.floor(yy / bh), off = row % 2 ? bw >> 1 : 0;
      for (let xx = 0; xx < w; xx++) {
        const col = Math.floor((xx + off) / bw);
        const edge = yy % bh === bh - 1 || (xx + off) % bw === bw - 1;
        const tone = (hash(col, row, seed) - 0.5) * 0.18;
        const b = tone > 0 ? lighten(c, tone) : darken(c, -tone);
        this.pm.put(x + xx, y + yy, edge ? mortar : yy % bh === 0 ? lighten(b, 0.12) : b);
      }
    }
  }

  /** Base de pedras (alicerce): pedras irregulares com rejunte. */
  stones(x: number, y: number, w: number, h: number, c: RGB, seed = 13): void {
    const mortar = darken(c, 0.45);
    this.rect(x, y, w, h, mortar);
    let yy = 0, row = 0;
    while (yy < h) {
      const sh = Math.min(h - yy, 5 + Math.floor(hash(row, 1, seed) * 3));
      let xx = -Math.floor(hash(row, 2, seed) * 6);
      let col = 0;
      while (xx < w) {
        const sw = 8 + Math.floor(hash(col, row, seed) * 8);
        const tone = (hash(col, row, seed + 1) - 0.5) * 0.3;
        const b = tone > 0 ? lighten(c, tone) : darken(c, -tone);
        for (let py = 0; py < sh - 1; py++) for (let px = 0; px < sw - 1; px++) {
          const X = x + xx + px, Y = y + yy + py;
          if (X < x || X >= x + w) continue;
          const corner = (px === 0 || px === sw - 2) && (py === 0 || py === sh - 2);
          if (corner) continue;
          this.pm.put(X, Y, py === 0 ? lighten(b, 0.2) : py === sh - 2 ? darken(b, 0.15) : b);
        }
        xx += sw; col++;
      }
      yy += sh; row++;
    }
  }

  /**
   * Telhado de telhas visto de cima em 3/4: fileiras com meia-telha de
   * deslocamento, cada telha com luz na esquerda e sombra embaixo; a
   * fileira de cima é mais clara (pega mais sol). `inset(y)` recolhe os lados.
   */
  shingles(x: number, y: number, w: number, h: number, c: RGB, o: { row?: number; tile?: number; seed?: number; inset?: (dy: number) => number; round?: boolean } = {}): void {
    const rh = o.row ?? 6, tw = o.tile ?? 8, seed = o.seed ?? 21;
    for (let yy = 0; yy < h; yy++) {
      const ins = Math.round(o.inset?.(yy) ?? 0);
      const row = Math.floor(yy / rh), inRow = yy % rh, off = row % 2 ? tw >> 1 : 0;
      const light = 0.16 - (yy / h) * 0.28;
      for (let xx = ins; xx < w - ins; xx++) {
        const col = Math.floor((xx + off) / tw), inCol = (xx + off) % tw;
        const tone = (hash(col, row, seed) - 0.5) * 0.1 + light;
        let p = tone > 0 ? lighten(c, tone) : darken(c, -tone);
        if (inRow === rh - 1) p = darken(p, 0.38);
        else if (inRow === rh - 2) p = darken(p, 0.12);
        else if (inRow === 0) p = lighten(p, 0.1);
        if (inCol === 0 && inRow < rh - 1) p = lighten(p, 0.14);
        if (inCol === tw - 1 && inRow < rh - 1) p = darken(p, 0.2);
        // telha arredondada: cantos de baixo recolhidos
        if (o.round && inRow === rh - 2 && (inCol === 0 || inCol === tw - 1)) p = darken(p, 0.3);
        this.pm.put(x + xx, y + yy, p);
      }
    }
  }

  /** Beiral: faixa de madeira na frente do telhado, com a sombra dele na parede. */
  eave(x: number, y: number, w: number, c: RGB): void {
    this.rect(x, y, w, 3, c);
    this.hline(x, y, w, lighten(c, 0.25));
    this.hline(x, y + 2, w, darken(c, 0.3));
  }

  /** Sombra projetada (escurece o que já está desenhado). */
  shadow(x: number, y: number, w: number, h: number, k = 0.28): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const c = this.pm.get(xx, yy);
      if (c) this.pm.put(xx, yy, darken(c, k * (1 - (yy - y) / Math.max(1, h) * 0.5)));
    }
  }

  /** Janela: moldura, vidro com reflexo, cruzeta, peitoril; acende à noite. */
  window(x: number, y: number, w: number, h: number, o: { frame?: RGB; glass?: RGB; cross?: boolean; sill?: boolean; shutters?: RGB; lit?: RGB; arch?: boolean; box?: boolean; curtain?: RGB } = {}): void {
    const fr = o.frame ?? hex('#f4efe4'), gl = o.glass ?? hex('#7cc4e8');
    this.rect(x - 1, y - 1, w + 2, h + 2, darken(fr, 0.55));
    this.rect(x, y, w, h, fr);
    this.hline(x, y, w, lighten(fr, 0.3));
    const gx = x + 2, gy = y + 2, gw = w - 4, gh = h - 4;
    for (let k = 0; k < gh; k++) this.rect(gx, gy + k, gw, 1, mix(lighten(gl, 0.25), darken(gl, 0.35), k / Math.max(1, gh - 1)));
    if (o.arch) { this.px(gx, gy, fr); this.px(gx + gw - 1, gy, fr); }
    // reflexo diagonal
    for (let k = 0; k < Math.min(gw, gh); k++) {
      const X = gx + gw - 3 - k, Y = gy + 1 + k;
      if (X > gx && X < gx + gw && Y < gy + gh) { this.px(X, Y, lighten(gl, 0.7)); if (X + 1 < gx + gw) this.px(X + 1, Y, lighten(gl, 0.45)); }
    }
    if (o.curtain) { this.rect(gx, gy, 2, gh, o.curtain); this.rect(gx + gw - 2, gy, 2, gh, o.curtain); }
    if (o.cross !== false && gw >= 6) { this.rect(gx + (gw >> 1), gy, 1, gh, fr); if (gh >= 8) this.rect(gx, gy + (gh >> 1), gw, 1, fr); }
    this.rect(gx, gy + gh - 1, gw, 1, darken(gl, 0.45));
    if (o.sill !== false) { this.rect(x - 2, y + h, w + 4, 2, lighten(fr, 0.1)); this.hline(x - 2, y + h + 2, w + 4, darken(fr, 0.5)); }
    if (o.shutters) {
      for (const sx of [x - 5, x + w + 1]) {
        this.rect(sx, y - 1, 4, h + 2, o.shutters);
        for (let k = 1; k < h; k += 3) this.hline(sx, y + k, 4, darken(o.shutters, 0.25));
        this.vline(sx, y - 1, h + 2, lighten(o.shutters, 0.2));
      }
    }
    if (o.box) this.flowerBox(x - 2, y + h + 2, w + 4);
    const lit = o.lit ?? LED.warm;
    this.nt.rect(gx, gy, gw, gh, lit);
    if (o.cross !== false && gw >= 6) { this.nt.rect(gx + (gw >> 1), gy, 1, gh, darken(lit, 0.5)); if (gh >= 8) this.nt.rect(gx, gy + (gh >> 1), gw, 1, darken(lit, 0.5)); }
  }

  /** Floreira embaixo da janela. */
  flowerBox(x: number, y: number, w: number): void {
    const wood = hex('#8a5a34');
    this.rect(x, y + 3, w, 4, wood);
    this.hline(x, y + 3, w, lighten(wood, 0.25));
    this.hline(x, y + 6, w, darken(wood, 0.35));
    const flowers = [hex('#f06a8a'), hex('#ffd44a'), hex('#f4f0f8'), hex('#c878e8')];
    for (let k = 0; k < w; k++) {
      const leaf = hash(x + k, y, 31) > 0.35;
      if (leaf) this.px(x + k, y + 2, hex('#4aa04a'));
      if (hash(x + k, y, 33) > 0.55) this.px(x + k, y + 1, hex('#3a8a3e'));
      if (k % 3 === 1) { const f = flowers[Math.floor(hash(x + k, y, 35) * flowers.length)]; this.px(x + k, y + 1, f); this.px(x + k, y, lighten(f, 0.3)); }
    }
  }

  /** Porta de madeira com almofadas, maçaneta e degrau; luzinha em cima à noite. */
  door(cx: number, bottom: number, w: number, h: number, o: { color?: RGB; frame?: RGB; glass?: boolean; step?: RGB; lamp?: boolean; double?: boolean } = {}): void {
    const c = o.color ?? hex('#9a5a2e'), fr = o.frame ?? darken(c, 0.45);
    const x = Math.round(cx - w / 2), y = bottom - h;
    this.rect(x - 2, y - 2, w + 4, h + 2, fr);
    this.hline(x - 2, y - 2, w + 4, lighten(fr, 0.2));
    this.vgrad(x, y, w, h, lighten(c, 0.12), darken(c, 0.18));
    if (o.double) this.vline(x + (w >> 1), y, h, darken(c, 0.45));
    const halves = o.double ? [[x, w >> 1], [x + (w >> 1) + 1, (w >> 1) - 1]] : [[x, w]];
    for (const [hx, hw] of halves) {
      if (o.glass) {
        this.rect(hx + 2, y + 2, hw - 4, Math.round(h * 0.38), hex('#9ad4ee'));
        this.px(hx + hw - 4, y + 3, WHITE);
        this.nt.rect(hx + 2, y + 2, hw - 4, Math.round(h * 0.38), LED.warm);
      } else {
        this.rect(hx + 2, y + 2, hw - 4, Math.round(h * 0.38), darken(c, 0.14));
        this.hline(hx + 2, y + 2, hw - 4, darken(c, 0.32));
      }
      this.rect(hx + 2, y + Math.round(h * 0.52), hw - 4, Math.round(h * 0.36), darken(c, 0.14));
      this.hline(hx + 2, y + Math.round(h * 0.52), hw - 4, darken(c, 0.32));
    }
    const kx = o.double ? x + (w >> 1) + 2 : x + w - 4;
    this.rect(kx, y + Math.round(h * 0.5), 2, 2, hex('#f2c84a'));
    this.rect(x - 3, bottom, w + 6, 2, o.step ?? hex('#b8b0a4'));
    this.hline(x - 3, bottom, w + 6, lighten(o.step ?? hex('#b8b0a4'), 0.3));
    if (o.lamp !== false) {
      const lx = x + w + 4, ly = y + 2;
      this.rect(lx, ly, 3, 5, hex('#3a3440'));
      this.px(lx + 1, ly + 1, hex('#ffe08a')); this.px(lx + 1, ly + 2, hex('#ffd060'));
      this.nt.rect(lx, ly + 1, 3, 3, LED.warmSoft);
    }
  }

  /** Toldo listrado com a borda recortada em ondas. */
  awning(x: number, y: number, w: number, h: number, a: RGB, b: RGB, stripe = 5): void {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      let c = Math.floor(xx / stripe) % 2 ? b : a;
      c = mix(lighten(c, 0.15), darken(c, 0.15), yy / Math.max(1, h - 1));
      this.px(x + xx, y + yy, c);
    }
    // ondas embaixo
    for (let xx = 0; xx < w; xx++) {
      const k = xx % stripe, deep = k > 0 && k < stripe - 1 ? 2 : 1;
      const c = Math.floor(xx / stripe) % 2 ? b : a;
      for (let d = 0; d < deep; d++) this.px(x + xx, y + h + d, darken(c, 0.1 + d * 0.15));
    }
    this.hline(x, y, w, lighten(a, 0.35));
  }

  /** Placa de madeira ou metal com o texto na fonte da cidade (1 px da fonte = 1 px hd). */
  sign(cx: number, y: number, text: string, o: { bg?: RGB; fg?: RGB; border?: RGB; lit?: RGB; pad?: number } = {}): { x: number; w: number } {
    const bg = o.bg ?? hex('#7a4a26'), fg = o.fg ?? hex('#fff4d0'), pad = o.pad ?? 4;
    const tw = textWidth(text), w = tw + pad * 2 + 2, h = 7 + 6;
    const x = Math.round(cx - w / 2);
    this.rect(x, y, w, h, o.border ?? darken(bg, 0.5));
    this.vgrad(x + 1, y + 1, w - 2, h - 2, lighten(bg, 0.15), darken(bg, 0.1));
    this.hline(x + 1, y + 1, w - 2, lighten(bg, 0.35));
    drawText(this.pm, text, x + pad + 1, y + 3, { fill: fg, fillBottom: mix(fg, bg, 0.25), shadow: darken(bg, 0.55) });
    if (o.lit) {
      this.nt.rect(x + 1, y + 1, w - 2, h - 2, darken(o.lit, 0.7));
      drawText(this.nt, text, x + pad + 1, y + 3, { fill: WHITE, fillBottom: o.lit, shadow: darken(o.lit, 0.6) });
    }
    return { x, w };
  }

  /** Chaminé de tijolo com borda de pedra. */
  chimney(x: number, y: number, w: number, h: number): { x: number; y: number } {
    this.bricks(x, y + 3, w, h - 3, hex('#b0583a'), hex('#6a3a2a'), 6, 3);
    this.rect(x - 1, y, w + 2, 3, hex('#9a9aa8'));
    this.hline(x - 1, y, w + 2, hex('#c8c8d4'));
    this.rect(x + 1, y, w - 2, 1, hex('#3a3440'));
    return { x: x + w / 2, y };
  }

  /** Parede de vidro (prédio moderno): painéis com caixilho e reflexo; parte acende à noite. */
  glassWall(x: number, y: number, w: number, h: number, o: { tint?: RGB; frame?: RGB; pane?: [number, number]; seed?: number; lit?: RGB; litShare?: number } = {}): void {
    const tint = o.tint ?? hex('#6ab8e0'), fr = o.frame ?? hex('#dfe6ee');
    const [pw, ph] = o.pane ?? [10, 12];
    this.rect(x, y, w, h, fr);
    for (let py = y + 1; py < y + h - 1; py += ph) for (let px = x + 1; px < x + w - 1; px += pw) {
      const ww = Math.min(pw - 1, x + w - 1 - px), hh = Math.min(ph - 1, y + h - 1 - py);
      if (ww < 2 || hh < 2) continue;
      for (let k = 0; k < hh; k++) this.rect(px, py + k, ww, 1, mix(lighten(tint, 0.3), darken(tint, 0.3), k / Math.max(1, hh - 1)));
      // reflexo do céu: duas linhas diagonais
      for (let k = 0; k < hh; k++) {
        const X = px + ((k + (px >> 1)) % (ww + 6)) - 3;
        if (X >= px && X < px + ww) this.px(X, py + k, lighten(tint, 0.55));
      }
      if (hash(px, py, o.seed ?? 3) < (o.litShare ?? 0.65)) this.nt.rect(px, py, ww, hh, o.lit ?? LED.warm);
    }
    this.hline(x, y, w, lighten(fr, 0.4));
    this.hline(x, y + h - 1, w, darken(fr, 0.4));
  }

  /** Painel de metal com emendas em pé. */
  metal(x: number, y: number, w: number, h: number, c: RGB, seam = 12): void {
    this.vgrad(x, y, w, h, lighten(c, 0.12), darken(c, 0.12));
    for (let xx = x + seam; xx < x + w; xx += seam) { this.vline(xx, y, h, darken(c, 0.25)); this.vline(xx + 1, y, h, lighten(c, 0.2)); }
  }

  /** Telhado plano (laje) com mureta: visto de cima, borda clara e miolo com textura. */
  slab(x: number, y: number, w: number, h: number, c: RGB, rim: RGB): void {
    this.rect(x, y, w, h, rim);
    this.hline(x, y, w, lighten(rim, 0.3));
    this.grain(x + 3, y + 3, w - 6, h - 6, c, 0.05, 41);
    this.hline(x + 3, y + 3, w - 6, darken(c, 0.25));
    this.rect(x, y + h - 3, w, 3, darken(rim, 0.15));
    this.hline(x, y + h - 1, w, darken(rim, 0.45));
  }

  /** Contorno escuro por fora de tudo (o toque final do estilo). */
  ink(c: RGB = INK): void { this.pm.outline(c); }
}

/**
 * Prédio desenhado em hd: `tw × th` blocos de colisão e `extra` blocos de
 * arte acima (telhado alto, torre). A arte normal (1×) é a hd reduzida.
 */
export function hdBuilding(id: string, name: string, tw: number, th: number, extra: number, doorCols: number[],
  draw: (a: Art) => { chimney?: { x: number; y: number }; glow?: Building['glow'] } | void): Building {
  const a = new Art(tw * T2, (th + extra) * T2);
  const r = draw(a) || {};
  const pix = withHd(a.pm);
  const night = withHd(a.nt);
  return {
    id, name, pix, night, tilesW: tw, tilesH: th, extraTop: extra * TILE, doorCols,
    chimney: r.chimney ? { x: r.chimney.x / K, y: r.chimney.y / K } : undefined,
    glow: r.glow,
  };
}

/** Objeto (não prédio) em hd: devolve a arte 1× com a hd e a noite, se houver. */
export function hdProp(w: number, h: number, draw: (a: Art) => void, ink = true): { pix: Pixmap; night?: Pixmap } {
  const a = new Art(w * K, h * K);
  draw(a);
  if (ink) a.ink();
  const lit = a.nt.data.some((v, i) => i % 4 === 3 && v > 0);
  return { pix: withHd(a.pm), night: lit ? withHd(a.nt) : undefined };
}
