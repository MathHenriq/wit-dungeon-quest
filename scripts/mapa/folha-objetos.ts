// Folha de revisão dos objetos do mapa sobre grama.
//   npx vite-node scripts/mapa/folha-objetos.ts -- saida.png [escala]
import { Pixmap } from '../../src/game/world/pixmap';
import { GRASS } from '../../src/game/world/palette';
import * as P from '../../src/game/world/props';
import * as T from '../../src/game/world/props-tech';
import { hex } from '../../src/game/world/pixmap';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const items: Pixmap[] = [
  P.tree('pinheiro', 1), P.tree('pinheiro', 2), P.tree('redonda', 3), P.tree('florida', 4), P.tree('arbusto', 5),
  P.tallGrass(), P.flowerTile([hex('#ff6a7a'), hex('#ffffff'), hex('#ffd84a')]), P.fence(), P.mailbox(hex('#e84848')),
  P.signPost(), T.lampLit().pix, P.bench(), T.vendingLit().pix, T.noticeBoardLit().pix, T.fountainLit().pix, P.rock(), T.totemLit().pix,
  T.planterLit(hex('#e079a9')).pix, T.welcomeArchLit('CIDADE WIT').pix,
];
const cellW = 70, cellH = 52, cols = 6;
const sheet = new Pixmap(cellW * cols, cellH * Math.ceil(items.length / cols));
sheet.rect(0, 0, sheet.w, sheet.h, GRASS.base);
items.forEach((it, i) => {
  const x = (i % cols) * cellW + ((cellW - it.w) >> 1), y = Math.floor(i / cols) * cellH + (cellH - it.h - 2);
  sheet.blit(it, x, y);
});
savePixmap(sheet, args[0] ?? 'objetos.png', Number(args[1] ?? 4));
console.log('ok');
