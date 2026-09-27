// Folha de revisão dos prédios.  npx vite-node scripts/mapa/folha-predios.ts -- saida.png [escala]
import { Pixmap } from '../../src/game/world/pixmap';
import { GRASS } from '../../src/game/world/palette';
import * as B from '../../src/game/world/buildings';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const list: B.Building[] = [
  B.cardCenter(), B.shop(), B.tower(), B.arena(), B.guildHall(),
  B.house('casa1', 'Casa', { roof: 'laranja', wall: 'cinza', chimney: true }),
  B.house('casa2', 'Casa', { roof: 'azul', wall: 'creme', tilesW: 6 }),
  B.house('casa3', 'Casa', { roof: 'rosa', wall: 'rosa', floors: 2, tilesW: 6, door: '#b0608a' }),
];
const pad = 8;
let W = pad, H = 0;
const rows: B.Building[][] = [list.slice(0, 5), list.slice(5)];
const rowH = rows.map(r => Math.max(...r.map(b => b.pix.h)) + pad * 2);
W = Math.max(...rows.map(r => r.reduce((s, b) => s + b.pix.w + pad, pad)));
H = rowH.reduce((a, b) => a + b, 0);
const sheet = new Pixmap(W, H);
sheet.rect(0, 0, W, H, GRASS.base);
let y = 0;
rows.forEach((r, i) => {
  let x = pad;
  for (const b of r) { sheet.blit(b.pix, x, y + rowH[i] - pad - b.pix.h); x += b.pix.w + pad; }
  y += rowH[i];
});
savePixmap(sheet, args[0] ?? 'predios.png', Number(args[1] ?? 3));
console.log('ok', W, H);
