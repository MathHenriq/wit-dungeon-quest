// Casinhas em hd por código (hd-kit), com variações de parede, telhado e
// enfeites: as casas dos pescadores, a loja de iscas, a casa da fazenda e
// as lojinhas da Cidade WIT usam a mesma base.
import type { Building } from './buildings';
import { darken, hdBuilding, lighten, type Art } from './hd-kit';
import { hex, type RGB } from './pixmap';
import { LED } from './palette';

export interface CottageOpts {
  wall: RGB;
  wallKind?: 'planks' | 'plaster' | 'bricks' | 'logs';
  roof: RGB;
  trim?: RGB;
  shutters?: RGB;
  door?: RGB;
  /** Placa em cima da porta (lojinha). */
  sign?: { text: string; bg: RGB; lit?: RGB };
  awning?: [RGB, RGB];
  chimney?: boolean;
  /** Enfeites na parede e na frente. */
  extras?: (a: Art, g: { W: number; H: number; wallTop: number; base: number; cx: number }) => void;
  /** Largura em blocos (5 ou 6). */
  tw?: number;
  seed?: number;
}

/** Casinha de 5 (ou 6) × 3 blocos, com o telhado subindo 2 blocos acima. */
export function cottage(id: string, name: string, o: CottageOpts): Building {
  const tw = o.tw ?? 5;
  return hdBuilding(id, name, tw, 3, 2, [tw >> 1], a => {
    const W = a.W, H = a.H, cx = ((tw >> 1) + 0.5) * 32;
    const wallTop = 74, base = H - 8;
    const trim = o.trim ?? hex('#f2ece0');
    // parede
    const wx = 8, ww = W - 16, wh = base - wallTop;
    if (o.wallKind === 'plaster') { a.grain(wx, wallTop, ww, wh, o.wall, 0.06, o.seed ?? 3); a.shadow(wx, wallTop, ww, wh, 0); }
    else if (o.wallKind === 'bricks') a.bricks(wx, wallTop, ww, wh, o.wall, darken(o.wall, 0.4));
    else if (o.wallKind === 'logs') {
      for (let y = wallTop; y < base; y += 7) {
        a.rect(wx, y, ww, 7, o.wall);
        a.hline(wx, y, ww, lighten(o.wall, 0.25)); a.hline(wx, y + 1, ww, lighten(o.wall, 0.12));
        a.hline(wx, y + 5, ww, darken(o.wall, 0.2)); a.hline(wx, y + 6, ww, darken(o.wall, 0.45));
        for (const ex of [wx - 3, W - wx - 1]) { a.rect(ex, y + 1, 4, 5, lighten(o.wall, 0.15)); a.px(ex + 1, y + 3, darken(o.wall, 0.4)); }
      }
    } else a.planks(wx, wallTop, ww, wh, o.wall, 6, o.seed ?? 4);
    if (o.wallKind !== 'logs') for (const x of [wx, W - wx - 5]) { a.rect(x, wallTop, 5, wh, trim); a.vline(x, wallTop, wh, lighten(trim, 0.3)); a.vline(x + 4, wallTop, wh, darken(trim, 0.3)); }
    a.stones(wx - 2, base, ww + 4, 6, hex('#a8a4a0'), (o.seed ?? 1) + 20);
    // telhado de quatro águas
    const roofTop = 8, roofH = wallTop - roofTop + 4;
    a.shingles(2, roofTop, W - 4, roofH, o.roof, { row: 7, tile: 10, inset: dy => Math.max(0, 22 - dy) * 0.9, round: true, seed: (o.seed ?? 1) * 7 });
    a.rect(24, roofTop - 2, W - 48, 4, darken(o.roof, 0.3));
    a.hline(24, roofTop - 2, W - 48, lighten(o.roof, 0.3));
    a.shadow(2, roofTop + roofH - 8, W - 4, 8, 0.16);
    a.eave(2, roofTop + roofH, W - 4, trim);
    a.shadow(wx + 5, wallTop + 3, ww - 10, 4, 0.3);
    let chimney: { x: number; y: number } | undefined;
    if (o.chimney !== false) chimney = a.chimney(W - 40, roofTop - 6, 10, 18);
    // porta, janelas
    a.door(cx, base, 18, 30, { color: o.door ?? hex('#9a5a2e'), lamp: !o.sign });
    const winY = wallTop + 16;
    const ws = tw >= 6 ? [18, cx + 24, cx - 52] : [18, W - 42];
    for (const x of ws.slice(0, 2)) a.window(x, winY, 22, 18, { frame: trim, shutters: o.shutters, box: true });
    if (o.awning) a.awning(cx - 20, wallTop + 2, 40, 7, o.awning[0], o.awning[1], 5);
    if (o.sign) a.sign(cx, o.awning ? wallTop + 12 : wallTop + 4, o.sign.text, { bg: o.sign.bg, lit: o.sign.lit ?? LED.warm });
    o.extras?.(a, { W, H, wallTop, base, cx });
    a.ink();
    return { chimney };
  });
}
