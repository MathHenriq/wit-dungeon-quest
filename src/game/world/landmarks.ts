// Prédios-tema: cada um tem a forma do que ele é, para o aluno reconhecer de
// longe sem ler placa.
//   Loja            → um pacotinho gigante, rasgado no canto, cartas saindo.
//   Oficina         → uma carta gigante em pé, com a ala do álbum e a forja.
//   Guildas         → castelo com torres, ameias, portão e estandartes.
// Mesma linguagem das casas (degradê contínuo, contorno na cor escura do
// material) e camada `night` para o ciclo dia/noite.
import { hash, hex, mix, Pixmap, type RGB } from './pixmap';
import { TILE, type Building } from './buildings';
import { drawText, FONT_H, textWidth } from './font';
import { LED, WHITE, WIT } from './palette';
import { makeRamp, type RoofHG } from './house-hg';
import { glassDoorHG, plasterWall, SIGN_ICONS, signHG, slabRoof, WALL_HG } from './buildings-hg';

type Glow = NonNullable<Building['glow']>[number];

function pair(tw: number, th: number, extraTop: number): [Pixmap, Pixmap, number, number] {
  const W = tw * TILE, H = th * TILE + extraTop;
  return [new Pixmap(W, H), new Pixmap(W, H), W, H];
}

/** Copia `src` por cima de `dst` com contorno de 1 px na cor dada em volta da silhueta. */
function blitOutlined(dst: Pixmap, src: Pixmap, line: RGB, x = 0, y = 0): void {
  src.outline(line);
  dst.blit(src, x, y);
}

function hsl(h: number, s: number, l: number): RGB {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/** Degraus de calçada na frente do prédio (a base onde ele "pisa"). */
function plinth(pm: Pixmap, x0: number, x1: number, y: number): void {
  pm.rect(x0, y, x1 - x0 + 1, 3, hex('#d8dce6'));
  pm.rect(x0, y, x1 - x0 + 1, 1, hex('#f2f4f8'));
  pm.rect(x0, y + 3, x1 - x0 + 1, 1, hex('#8a90a4'));
}

/** Cartinha em pé (costas ou frente), com borda, moldura e reflexo. */
function miniCard(pm: Pixmap, nt: Pixmap | null, x: number, y: number, w: number, h: number, frame: RGB, art: RGB): void {
  const line = mix(frame, hex('#140a20'), 0.7);
  pm.rect(x, y, w, h, line);
  pm.rect(x + 1, y + 1, w - 2, h - 2, frame);
  pm.rect(x + 1, y + 1, w - 2, 1, mix(frame, WHITE, 0.5));
  pm.rect(x + 3, y + 3, w - 6, Math.round(h * 0.45), art);
  pm.rect(x + 3, y + 3, w - 6, 1, mix(art, WHITE, 0.45));
  pm.put(x + 4, y + 4, WHITE);
  for (let k = 0; k < 2; k++) pm.rect(x + 3, y + 5 + Math.round(h * 0.45) + k * 3, w - 7 - k * 2, 1, mix(frame, line, 0.35));
  if (nt) {
    nt.rect(x + 1, y + 1, w - 2, 1, mix(frame, WHITE, 0.6));
    nt.rect(x + 3, y + 3, w - 6, Math.round(h * 0.45), mix(art, WHITE, 0.25));
  }
}

// ─────────────────────── Loja: pacotinho gigante ───────────────────────

const FOIL: RoofHG = { hi: hex('#f0dcff'), light: hex('#c29cf4'), base: hex('#9464dc'), shade: hex('#6a3cb8'), dark: hex('#44227e'), line: hex('#26103e') };
const CRIMP = { hi: hex('#ffffff'), light: hex('#e6eaf2'), base: hex('#c2cad8'), shade: hex('#939db2'), line: hex('#4a5068') };

export function packShop(): Building {
  const tw = 5, th = 5, extraTop = 22;
  const [pm, nt, W, H] = pair(tw, th, extraTop);
  const ramp = makeRamp(FOIL);
  const x0 = 8, x1 = W - 9, top = 20, bottom = H - 8;
  const cx = (x0 + x1) / 2;
  const tearX = 50;
  // borda rasgada no canto de cima à direita: do (tearX, top) descendo até (x1, top + 12)
  const tearY = (x: number) => top + Math.max(0, x - tearX) * (12 / (x1 - tearX)) + (hash(x, 3, 7) < 0.5 ? 0 : 1);

  // cartas saindo pelo rasgo (desenhadas antes: o pacote tapa a parte de baixo delas)
  miniCard(pm, nt, 48, 3, 14, 20, hex('#ffd84a'), hex('#ff8a3a'));
  miniCard(pm, nt, 55, 0, 14, 20, hex('#e8eef8'), hex('#5ac0f0'));
  miniCard(pm, nt, 62, 6, 14, 20, WIT.lime, WIT.dark);
  // brilho de carta rara
  for (const [sx, sy] of [[46, 2], [70, 1], [76, 12]] as [number, number][]) {
    pm.stamp(['.w.', 'wyw', '.w.'], sx - 1, sy - 1, { w: hex('#fff4b0'), y: WHITE });
    nt.stamp(['.w.', 'wyw', '.w.'], sx - 1, sy - 1, { w: LED.warm, y: WHITE });
  }

  const body = new Pixmap(W, H);
  const inBody = (x: number, y: number) => x >= x0 && x <= x1 && y <= bottom && y >= (x > tearX ? tearY(x) : top + Math.abs((x % 4) - 2));
  for (let y = 0; y <= bottom; y++) for (let x = x0; x <= x1; x++) {
    if (!inBody(x, y)) continue;
    const crimpTop = y < top + 9 && x <= tearX + 2;
    const crimpBottom = y > bottom - 7;
    if (crimpTop || crimpBottom) {
      // selo prensado: pregas verticais prateadas
      const p = x % 3;
      let c = p === 0 ? CRIMP.hi : p === 1 ? CRIMP.base : CRIMP.shade;
      if (crimpTop && y === top + 8) c = CRIMP.shade;
      if (crimpBottom && y === bottom - 6) c = CRIMP.hi;
      if (x - x0 < 3) c = mix(c, CRIMP.hi, 0.4);
      if (x1 - x < 3) c = mix(c, CRIMP.shade, 0.5);
      body.put(x, y, c);
      continue;
    }
    // foil estufado: mais claro no meio, sombra na direita, reflexo arco-íris na diagonal
    const k = ((x - x0) / (x1 - x0)) * 2 - 1;
    let c = ramp(1.1 + 1.5 * k * k + 0.6 * k + ((y - top) / (bottom - top)) * 0.4);
    const s = (((x * 0.9 + y) % 44) + 44) % 44;
    if (s < 9) c = mix(c, hsl((y * 7 + x * 3) % 360, 0.85, 0.72), 0.38);
    else if (s < 10.5) c = mix(c, WHITE, 0.55);
    body.put(x, y, c);
  }
  // pontilhado "rasgue aqui" logo abaixo do selo
  for (let x = x0 + 2; x < tearX; x += 3) body.put(x, top + 10, mix(FOIL.light, WHITE, 0.4));
  // borda branca do rasgo
  for (let x = tearX + 1; x <= x1; x++) { const y = Math.round(tearY(x)); body.put(x, y, WHITE); body.put(x, y + 1, CRIMP.light); }
  blitOutlined(pm, body, FOIL.line);

  // estrela e a marca WIT no meio do pacote
  const sy = 36, scx = Math.round(cx);
  for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) {
    const a = Math.atan2(y, x), r = Math.hypot(x, y);
    const R = 6 + 5 * Math.pow(Math.abs(Math.cos(a * 2.5)), 3);
    if (r > R) continue;
    const c = r > R - 1.3 ? hex('#c07a10') : mix(hex('#fff2a0'), hex('#ffc830'), r / R);
    pm.put(scx + x, sy + y, c);
    nt.put(scx + x, sy + y, mix(LED.warmSoft, LED.warm, r / R));
  }
  const word = 'WIT', ww = textWidth(word);
  drawText(pm, word, scx - Math.ceil(ww / 2), sy - 3, { fill: WIT.base, fillBottom: WIT.dark, outline: hex('#fff8d0') });
  drawText(nt, word, scx - Math.ceil(ww / 2), sy - 3, { fill: WIT.base, fillBottom: WIT.dark, outline: hex('#fff8d0') });
  // nome do prédio
  const name = 'PACOTINHOS', nw = textWidth(name), ny = 53;
  drawText(pm, name, Math.round(cx - nw / 2), ny, { fill: WHITE, fillBottom: hex('#ffe0f4'), outline: FOIL.line, shadow: FOIL.dark });
  drawText(nt, name, Math.round(cx - nw / 2), ny, { fill: WHITE, fillBottom: LED.pink, outline: FOIL.line, shadow: FOIL.dark });
  // porta de vidro recortada no pacote
  glassDoorHG(pm, nt, 40, bottom - 1, 20, 22, hex('#ff7ab8'));
  // LEDs em volta do pacote (acendem à noite, de dia pontinhos)
  const leds = [LED.pink, LED.cyan, LED.green, LED.warm];
  let k = 0;
  for (let y = 0; y <= bottom; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
    if (inBody(x, y)) continue;
    const touch = inBody(x + 1, y) || inBody(x - 1, y) || inBody(x, y + 1);
    if (!touch || (x + y) % 4 !== 0) continue;
    nt.put(x, y, leds[k++ % leds.length]);
  }
  plinth(pm, 3, W - 4, H - 7);
  pm.rect(3, H - 3, W - 6, 1, hex('#6a7088'));
  return {
    id: 'loja', name: 'Loja de Pacotinhos', pix: pm, night: nt, tilesW: tw, tilesH: th, extraTop, doorCols: [2],
    glow: [{ x: 40, y: H - 4, r: 22, color: LED.pink, k: 0.25 }],
  };
}

// ─────────────────────── Oficina: carta gigante + álbum + forja ───────────────────────

const GOLD: RoofHG = { hi: hex('#fff6c8'), light: hex('#ffe07a'), base: hex('#f0b830'), shade: hex('#c88a18'), dark: hex('#8e5a10'), line: hex('#4a2c08') };
const SLATE: RoofHG = { hi: hex('#c8cede'), light: hex('#9aa2ba'), base: hex('#747e9a'), shade: hex('#56607c'), dark: hex('#3c4460'), line: hex('#222838') };
const GREENR: RoofHG = { hi: hex('#e2f6c8'), light: hex('#b4e088'), base: hex('#7cc050'), shade: hex('#4e9a3e'), dark: hex('#2e7032'), line: hex('#16401e') };

export function cardWorkshop(): Building {
  const arts = [0, 1, 2].map(cardWorkshopArt);
  return {
    id: 'centro', name: 'Oficina de Cartas', pix: arts[0].pm, frames: arts.map(a => a.pm),
    night: arts[0].nt, nightFrames: arts.map(a => a.nt),
    tilesW: 7, tilesH: 5, extraTop: 18, doorCols: [3],
    glow: [{ x: 93, y: 74, r: 20, color: LED.orange, k: 0.4 }, { x: 98, y: 18, r: 10, color: LED.orange, k: 0.3 }],
  };
}

function cardWorkshopArt(frame: number): { pm: Pixmap; nt: Pixmap } {
  const [pm, nt, W, H] = pair(7, 5, 18);
  const bottom = H - 8;

  // ── ala esquerda: Álbum (parede branca, telhado verde, estante de álbuns) ──
  plasterWall(pm, 5, 50, 30, bottom, WALL_HG.branco);
  slabRoof(pm, 3, 32, 36, 52, GREENR, 0.3, 3);
  {
    const wx = 9, wy = 60, ww = 18, wh = 16;
    pm.rect(wx - 2, wy - 2, ww + 4, wh + 4, hex('#3a5474'));
    pm.rect(wx - 1, wy - 1, ww + 2, wh + 2, WHITE);
    for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) {
      pm.put(wx + x, wy + y, mix(hex('#fff2dc'), hex('#d8c09a'), y / wh));
      nt.put(wx + x, wy + y, mix(LED.warmSoft, LED.warm, y / wh));
    }
    // prateleiras com lombadas coloridas (os álbuns)
    for (const sy of [wy + 6, wy + 14]) {
      pm.rect(wx, sy, ww, 1, hex('#8a5a30')); nt.rect(wx, sy, ww, 1, hex('#8a5a30'));
      for (let x = 1; x < ww - 1; x += 2) {
        const c = hsl((x * 47 + sy * 13) % 360, 0.65, 0.55), hgt = 3 + Math.floor(hash(x, sy, 3) * 3);
        pm.rect(wx + x, sy - hgt, 1, hgt, c); nt.rect(wx + x, sy - hgt, 1, hgt, c);
      }
    }
    for (let k = 0; k < ww; k++) if (k % 5 === 2) pm.put(wx + k, wy + k * 0.5, WHITE);
  }

  // ── ala direita: Forja (pedra, telhado de ardósia, chaminé, fogo) ──
  for (let y = 50; y <= bottom; y++) for (let x = 81; x <= 106; x++) {
    const row = Math.floor((y - 50) / 5), off = row % 2 ? 4 : 0;
    const joint = (y - 50) % 5 === 4 || (x + off) % 9 === 0;
    let c = joint ? hex('#7c7280') : mix(hex('#c8bcc0'), hex('#a09098'), hash(Math.floor((x + off) / 9), row, 4) * 0.8);
    if (x < 84) c = mix(c, WHITE, 0.2);
    if (x > 103) c = mix(c, hex('#5a5060'), 0.3);
    pm.put(x, y, c);
  }
  for (let y = 50; y <= bottom + 1; y++) { pm.put(80, y, hex('#3a3040')); pm.put(107, y, hex('#3a3040')); }
  pm.rect(80, bottom + 1, 28, 1, hex('#3a3040'));
  // chaminé
  for (let y = 12; y < 42; y++) for (let x = 92; x <= 102; x++) {
    const row = Math.floor(y / 4), off = row % 2 ? 3 : 0;
    const joint = y % 4 === 3 || (x + off) % 6 === 0;
    pm.put(x, y, joint ? hex('#6a3a30') : x < 95 ? hex('#d07a5a') : x > 100 ? hex('#8a4a3a') : hex('#b05a44'));
  }
  pm.rect(90, 10, 15, 3, hex('#5a5060')); pm.rect(90, 10, 15, 1, hex('#8a8098'));
  for (let y = 10; y < 42; y++) { pm.put(91, y, hex('#3a2020')); pm.put(103, y, hex('#3a2020')); }
  nt.rect(93, 13, 9, 1, LED.orange);
  slabRoof(pm, 78, 109, 36, 52, SLATE, 0.3, 3);
  // fumaça (anima)
  const puffs: [number, number, number][] = [[97, 5, 3], [100, 0, 2.5], [94, 1, 2]];
  puffs.forEach(([px, py, r], i) => {
    const dy = -((frame + i) % 3), dx = (frame + i) % 2;
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      if (Math.hypot(x, y) > r) continue;
      pm.put(px + x + dx, py + y + dy, Math.hypot(x + 1, y + 1) < r - 1 ? hex('#f4f4f8') : hex('#c4c6d2'));
    }
  });
  // boca da forja em arco, com fogo e bigorna
  const fx = 86, fy = 64, fw = 16, fh = 16;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const arc = y < 5 && ((x + 0.5 - fw / 2) / (fw / 2)) ** 2 + ((5 - y) / 5) ** 2 > 1;
    if (arc) continue;
    const edge = x === 0 || x === fw - 1 || y === 0 || (y < 5 && ((x + 0.5 - fw / 2) / (fw / 2 - 1)) ** 2 + ((5 - y) / 4) ** 2 > 1);
    const t = y / fh;
    const flick = hash(x, y, frame + 20) * 0.25;
    const c = edge ? hex('#3a2020') : mix(hex('#ffd060'), hex('#d8401c'), Math.min(1, t * 0.7 + flick + 0.1));
    pm.put(fx + x, fy + y, c);
    if (!edge) nt.put(fx + x, fy + y, mix(hex('#fff0a0'), hex('#ff6a1c'), Math.min(1, t * 0.7 + flick)));
  }
  pm.stamp(['.oooooooo..', 'ommmmmmmmoo', '.ooommmoo..', '...ommmo...', '..ommmmmo..', '..ooooooo..'], fx + 2, fy + fh - 6, { o: hex('#1e1a24'), m: hex('#5a5a6c') });
  nt.stamp(['.oooooooo..', 'ommmmmmmmoo', '.ooommmoo..', '...ommmo...', '..ommmmmo..', '..ooooooo..'], fx + 2, fy + fh - 6, { o: hex('#1e1a24'), m: hex('#4a4a5a') });
  // placa de martelo
  pm.stamp(['oooooooo', 'owwwwwwo', 'owmmmmwo', 'owwmmwwo', 'owwbbwwo', 'owwbbwwo', 'oooooooo'], 90, 55, { o: hex('#3a2020'), w: hex('#f4e8d0'), m: hex('#6a6a7c'), b: hex('#a06a40') });

  // ── carta gigante no meio ──
  const cx0 = 30, cx1 = 81, ctop = 2, cbot = bottom;
  const card = new Pixmap(W, H);
  const gr = makeRamp(GOLD);
  for (let y = ctop; y <= cbot; y++) for (let x = cx0; x <= cx1; x++) {
    const corner = (x - cx0 < 2 || cx1 - x < 2) && (y - ctop < 2 || cbot - y < 2);
    if (corner && !((x - cx0 === 1 || cx1 - x === 1) && (y - ctop === 1 || cbot - y === 1))) continue;
    // moldura dourada com brilho na diagonal
    const d = (((x - y * 0.7) % 40) + 40) % 40;
    card.put(x, y, gr(0.9 + ((x - cx0) / (cx1 - cx0)) * 1.8 + (d < 4 ? -0.9 : 0)));
  }
  // barra do nome
  const nbY = ctop + 5, inX0 = cx0 + 5, inX1 = cx1 - 5;
  card.rect(inX0 - 1, nbY - 1, inX1 - inX0 + 3, 13, GOLD.dark);
  card.rect(inX0, nbY, inX1 - inX0 + 1, 11, hex('#fff8e8'));
  card.rect(inX0, nbY + 10, inX1 - inX0 + 1, 1, hex('#e8dcc0'));
  // janela da arte (vidro com o holograma)
  const aY0 = nbY + 14, aY1 = aY0 + 34;
  card.rect(inX0 - 1, aY0 - 1, inX1 - inX0 + 3, aY1 - aY0 + 3, GOLD.dark);
  for (let y = aY0; y <= aY1; y++) for (let x = inX0; x <= inX1; x++) {
    const t = (y - aY0) / (aY1 - aY0);
    card.put(x, y, mix(hex('#bfe8ff'), hex('#3a6ab8'), t));
  }
  // barra de raridade (estrelinhas)
  const rY = aY1 + 3;
  card.rect(inX0, rY, inX1 - inX0 + 1, 5, GOLD.light);
  card.rect(inX0, rY + 4, inX1 - inX0 + 1, 1, GOLD.shade);
  // caixa de texto (onde fica a porta)
  const tY = rY + 7;
  card.rect(inX0 - 1, tY - 1, inX1 - inX0 + 3, cbot - tY - 1, GOLD.dark);
  card.rect(inX0, tY, inX1 - inX0 + 1, cbot - tY - 3, hex('#fff8e8'));
  blitOutlined(pm, card, GOLD.line);

  // conteúdo da carta
  const ccx = Math.round((cx0 + cx1) / 2);
  const title = 'OFICINA', tw = textWidth(title);
  drawText(pm, title, ccx - Math.ceil(tw / 2), nbY + 2, { fill: hex('#3a2a18'), fillBottom: hex('#5a3a18') });
  drawText(nt, title, ccx - Math.ceil(tw / 2), nbY + 2, { fill: hex('#3a2a18'), fillBottom: hex('#5a3a18') });
  nt.rect(inX0, nbY, inX1 - inX0 + 1, 1, LED.warmSoft);
  // holograma na janela: estrela de 4 pontas + quadradinhos WIT
  const hx = ccx, hy = Math.round((aY0 + aY1) / 2);
  for (let y = aY0; y <= aY1; y++) for (let x = inX0; x <= inX1; x++) {
    const dx = Math.abs(x - hx), dy = Math.abs(y - hy);
    const star = dx * dy < 10 && dx + dy < 16;
    if (star) {
      const c = mix(WHITE, hex('#9ce8ff'), Math.min(1, (dx + dy) / 16));
      pm.put(x, y, c); nt.put(x, y, mix(LED.white, LED.cyan, Math.min(1, (dx + dy) / 16)));
    } else {
      nt.put(x, y, mix(hex('#3a8ac8'), hex('#1a3a78'), (y - aY0) / (aY1 - aY0)));
    }
  }
  for (const [sx, sy2, c] of [[inX0 + 3, aY1 - 6, WIT.lime], [inX0 + 6, aY1 - 9, WIT.mid], [inX0 + 9, aY1 - 12, WIT.limeLight]] as [number, number, RGB][]) {
    pm.rect(sx, sy2, 2, 2, c); nt.rect(sx, sy2, 2, 2, LED.green);
  }
  for (let k = 0; k < 5; k++) {
    const sx = ccx - 10 + k * 5;
    pm.stamp(['.y.', 'yyy', '.y.'], sx - 1, rY, { y: k < 4 ? hex('#fff4b0') : GOLD.shade });
    if (k < 4) nt.stamp(['.y.', 'yyy', '.y.'], sx - 1, rY, { y: LED.warmSoft });
  }
  // linhas de "texto" da carta dos dois lados da porta
  for (let k = 0; k < 3; k++) {
    pm.rect(inX0 + 2, tY + 3 + k * 4, 9 - k * 2, 1, hex('#c8b898'));
    pm.rect(inX1 - 10, tY + 3 + k * 4, 9 - k, 1, hex('#c8b898'));
  }
  glassDoorHG(pm, nt, ccx, cbot - 3, 20, 20, GOLD.base);
  // moldura acende à noite (fita de LED dourada em volta da carta)
  for (let x = cx0; x <= cx1; x += 2) { nt.put(x, ctop, LED.warm); }
  for (let y = ctop; y <= cbot; y += 2) { nt.put(cx0, y, LED.warm); nt.put(cx1, y, LED.warm); }
  plinth(pm, 3, W - 4, H - 7);
  return { pm, nt };
}

// ─────────────────────── Guildas: castelo ───────────────────────

const STONE = { hi: hex('#f4f0e8'), light: hex('#dcd6ca'), base: hex('#c4bcae'), shade: hex('#9c9486'), mortar: hex('#8a8272'), line: hex('#4a4438') };
const CONE_RED: RoofHG = { hi: hex('#ffc8c0'), light: hex('#f48a84'), base: hex('#dc5a5a'), shade: hex('#b03a48'), dark: hex('#7e2438'), line: hex('#4a1422') };
const CONE_BLUE: RoofHG = { hi: hex('#d0e4ff'), light: hex('#8cb4f4'), base: hex('#5a84dc'), shade: hex('#3c5cb4'), dark: hex('#283e84'), line: hex('#16224a') };

function stoneWall(pm: Pixmap, x0: number, y0: number, x1: number, y1: number, seed: number): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const row = Math.floor((y - y0) / 6), off = row % 2 ? 5 : 0;
    const joint = (y - y0) % 6 === 5 || (x - x0 + off) % 10 === 0;
    let c = joint ? STONE.mortar : mix(STONE.light, STONE.base, hash(Math.floor((x - x0 + off) / 10), row, seed) * 0.9);
    if (!joint && (y - y0) % 6 === 0) c = mix(c, STONE.hi, 0.5);
    const u = (x - x0) / Math.max(1, x1 - x0);
    if (u < 0.12) c = mix(c, STONE.hi, 0.35);
    else if (u > 0.85) c = mix(c, STONE.shade, 0.55);
    pm.put(x, y, c);
  }
}

function coneRoof(pm: Pixmap, cx: number, baseY: number, halfW: number, h: number, R: RoofHG): void {
  const ramp = makeRamp(R);
  for (let y = 0; y <= h; y++) {
    const hw = (y / h) * halfW;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const u = (x - cx) / Math.max(1, hw);
      if (Math.abs(u) > 1.02) continue;
      const band = Math.floor(y / 5) % 2 === 0 ? 0 : 0.25;               // fiadas de telha
      const c = Math.abs(u) > 0.9 || y === h ? R.line : ramp(0.8 + u * 1.5 + band + (y / h) * 0.6);
      pm.put(x, baseY - h + y, c);
    }
  }
  // beiral
  for (let x = Math.round(cx - halfW); x <= Math.round(cx + halfW); x++) { pm.put(x, baseY, R.dark); pm.put(x, baseY + 1, R.line); }
}

function pennant(pm: Pixmap, x: number, y: number, c: RGB): void {
  pm.rect(x, y, 1, 9, hex('#5a5060'));
  pm.stamp(['cccccl', 'cccl..', 'cl....'], x + 1, y, { c, l: mix(c, hex('#200a20'), 0.4) });
}

export function guildCastle(): Building {
  const tw = 7, th = 5, extraTop = 24;
  const [pm, nt, W, H] = pair(tw, th, extraTop);
  const bottom = H - 8, cx = W / 2;
  const glow: Glow[] = [];

  // ── torres ──
  const towers: [number, number, RoofHG, RGB][] = [[3, 27, CONE_BLUE, hex('#ffd84a')], [W - 28, W - 4, CONE_RED, hex('#9a6ae0')]];
  for (const [tx0, tx1, R, flag] of towers) {
    const tcx = (tx0 + tx1) / 2;
    stoneWall(pm, tx0, 30, tx1, bottom, tx0);
    for (let y = 30; y <= bottom + 1; y++) { pm.put(tx0 - 1, y, STONE.line); pm.put(tx1 + 1, y, STONE.line); }
    pm.rect(tx0 - 1, bottom + 1, tx1 - tx0 + 3, 1, STONE.line);
    coneRoof(pm, tcx, 31, (tx1 - tx0) / 2 + 3, 26, R);
    pennant(pm, Math.round(tcx), 0, flag);
    // seteiras (acendem à noite)
    for (const sy of [44, 66]) {
      pm.rect(Math.round(tcx) - 2, sy - 1, 5, 10, STONE.line);
      pm.rect(Math.round(tcx) - 1, sy, 3, 8, hex('#2a2430'));
      nt.rect(Math.round(tcx) - 1, sy, 3, 8, mix(LED.warm, LED.orange, 0.3));
    }
  }

  // ── corpo do castelo com ameias ──
  const kx0 = 28, kx1 = W - 29, ktop = 40;
  stoneWall(pm, kx0, ktop, kx1, bottom, 9);
  for (let x = kx0 - 1; x <= kx1 + 1; x++) pm.put(x, bottom + 1, STONE.line);
  // ameias
  for (let x = kx0; x <= kx1; x++) {
    const merlon = Math.floor((x - kx0) / 5) % 2 === 0;
    const h = merlon ? 7 : 2;
    for (let y = ktop - h; y < ktop; y++) pm.put(x, y, y === ktop - h ? STONE.hi : x % 5 === 4 ? STONE.shade : STONE.light);
    pm.put(x, ktop - h - 1, STONE.line);
    if (merlon) nt.put(x, ktop - h, LED.green);
  }
  for (let y = ktop - 8; y <= bottom; y++) { pm.put(kx0 - 1, y, STONE.line); pm.put(kx1 + 1, y, STONE.line); }
  // sombra das torres sobre o corpo
  for (let y = ktop; y <= bottom; y++) { pm.put(kx0, y, STONE.shade); pm.put(kx1, y, mix(STONE.shade, STONE.line, 0.3)); }

  // escudo grande (em dobro) acima do portão
  const sh = SIGN_ICONS.escudo, sl: Record<string, RGB> = {};
  for (const [k, v] of Object.entries(sh.legend)) sl[k] = hex(v);
  sh.rows.forEach((row, yy) => [...row].forEach((ch, xx) => {
    const c = sl[ch];
    if (!c) return;
    pm.rect(Math.round(cx) - 9 + xx * 2, ktop + 1 + yy * 2, 2, 2, c);
    nt.rect(Math.round(cx) - 9 + xx * 2, ktop + 1 + yy * 2, 2, 2, ch === 'y' ? LED.warmSoft : ch === 'b' ? hex('#6a98f0') : c);
  }));
  signHG(pm, nt, Math.round(cx), ktop + 20, 'GUILDAS', { bg: hex('#5a84dc'), line: hex('#16224a') }, 'escudo');

  // estandartes das guildas (uma cor para cada)
  const banners = [hex('#e85a5a'), hex('#f0c030'), hex('#4cb048'), hex('#9a6ae0')];
  const bxs = [kx0 + 3, kx0 + 12, kx1 - 18, kx1 - 9];
  banners.forEach((c, i) => {
    const bx = bxs[i], by = ktop + 2, dark = mix(c, hex('#200a20'), 0.5);
    pm.rect(bx - 1, by - 1, 9, 1, hex('#5a4030'));
    pm.rect(bx, by, 7, 16, c);
    pm.rect(bx, by, 2, 16, mix(c, WHITE, 0.3));
    pm.rect(bx + 6, by, 1, 16, dark);
    pm.stamp(['c.c.c.c', '.c.c.c.'], bx, by + 16, { c });
    pm.stamp(['.w.', 'www', '.w.'], bx + 2, by + 5, { w: WHITE });
  });

  // portão em arco de madeira com ferragens
  const gw = 24, gh = 28, gx = Math.round(cx - gw / 2), gy = bottom - gh + 1;
  for (let y = -2; y < gh; y++) for (let x = -2; x < gw + 2; x++) {
    const inArch = (xx: number, yy: number, pad: number) => yy >= 8 || ((xx + 0.5 - gw / 2) / (gw / 2 + pad)) ** 2 + ((8 - yy) / (8 + pad)) ** 2 <= 1;
    if (!inArch(x, y, 2)) continue;
    const inner = x >= 0 && x < gw && inArch(x, y, 0);
    if (!inner) { pm.put(gx + x, gy + y, (x + y) % 4 === 0 ? STONE.shade : STONE.hi); continue; }
    const plank = x % 6 === 5;
    let c = plank ? hex('#5a3620') : mix(hex('#b07a48'), hex('#7a4c2a'), y / gh);
    if (y % 9 === 4) c = hex('#4a4450');                                    // cintas de ferro
    pm.put(gx + x, gy + y, c);
  }
  pm.rect(Math.round(cx), gy + 1, 1, gh - 1, hex('#3a2414'));
  pm.put(Math.round(cx) - 3, gy + 16, hex('#ffd84a')); pm.put(Math.round(cx) + 2, gy + 16, hex('#ffd84a'));
  nt.rect(Math.round(cx), gy + 3, 1, gh - 4, LED.warm);
  // tochas dos lados do portão
  for (const tx of [gx - 7, gx + gw + 4]) {
    const fl = ['.y.', 'yoy', '.o.'];
    pm.stamp(fl, tx - 1, gy + 4, { y: hex('#ffd060'), o: hex('#ff7a2a') });
    pm.rect(tx, gy + 7, 1, 5, hex('#5a3620'));
    nt.stamp(fl, tx - 1, gy + 4, { y: LED.warmSoft, o: LED.orange });
    glow.push({ x: tx, y: gy + 6, r: 16, color: LED.orange, k: 0.35 });
  }
  plinth(pm, 3, W - 4, H - 7);
  return { id: 'guildas', name: 'Castelo das Guildas', pix: pm, night: nt, tilesW: tw, tilesH: th, extraTop, doorCols: [3], glow };
}

/** Rótulo curto em fonte pixel num painel escuro (telões). */
export function screenText(pm: Pixmap, text: string, cx: number, y: number, c: RGB, bg: RGB): void {
  const w = textWidth(text) + 4;
  pm.rect(Math.round(cx - w / 2), y - 1, w, FONT_H + 2, bg);
  drawText(pm, text, Math.round(cx - w / 2) + 2, y, { fill: c });
}
