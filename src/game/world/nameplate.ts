// Plaquinha de nome sobre o personagem (jogador, colegas online, moradores):
// o título em cima, colorido, e o apelido numa etiqueta escura. Desenhada em
// hd (2 pixels por pixel do mundo) com a fonte pixel da cidade.
import { drawText, FONT_H, textWidth } from './font';
import { hex, Pixmap, type RGB } from './pixmap';

export interface PlateStyle {
  /** Cor da borda da etiqueta (o jogador usa o verde WIT). */
  border: RGB;
  /** Cor do título. */
  title: RGB;
}

export const PLATE_PLAYER: PlateStyle = { border: hex('#8cc63f'), title: hex('#c6f06a') };
export const PLATE_NPC: PlateStyle = { border: hex('#f0c850'), title: hex('#ffe08a') };
export const PLATE_OTHER: PlateStyle = { border: hex('#7ab8ff'), title: hex('#b8dcff') };

/** Plaquinha em hd; a base (ponta de baixo) fica no meio embaixo da imagem. */
export function nameplate(name: string, title: string | undefined, st: PlateStyle): Pixmap {
  const nw = textWidth(name), tw = title ? textWidth(title) : 0;
  const pillW = nw + 8, pillH = FONT_H + 5;
  const titleH = title ? FONT_H + 3 : 0;
  const W = Math.max(pillW, tw + 4) + 2, H = titleH + pillH + 3;
  const pm = new Pixmap(W, H);
  const dark = hex('#16241c'), out: RGB = [10, 18, 14];
  if (title) drawText(pm, title, ((W - tw) >> 1), 1, { fill: st.title, outline: out });
  // etiqueta: cantos arredondados, borda colorida, fundo escuro
  const px = (W - pillW) >> 1, py = titleH;
  for (let y = 0; y < pillH; y++) for (let x = 0; x < pillW; x++) {
    const corner = (x === 0 || x === pillW - 1) && (y === 0 || y === pillH - 1);
    if (corner) continue;
    const edge = x === 0 || y === 0 || x === pillW - 1 || y === pillH - 1;
    pm.put(px + x, py + y, edge ? st.border : dark);
  }
  // ponta embaixo, apontando para a cabeça
  const cx = W >> 1;
  pm.put(cx - 1, py + pillH, st.border); pm.put(cx, py + pillH, st.border); pm.put(cx, py + pillH + 1, st.border);
  drawText(pm, name, px + 4, py + 3, { fill: [255, 255, 255] });
  return pm;
}
