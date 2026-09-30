// Folha de revisão dos prédios e objetos do mundo grande (arte por código, hd).
//   npx vite-node scripts/mapa/folha-mundo.ts -- saida.png [escala] [noite]
import { hdOf } from '../../src/game/world/assets';
import { Pixmap } from '../../src/game/world/pixmap';
import { hex } from '../../src/game/world/pixmap';
import * as L from '../../src/game/world/buildings-lago';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const out = args[0] ?? 'folha-mundo.png';
const scale = Number(args[1] ?? 2);
const night = args[2] === 'noite';

const items: Pixmap[] = [];
const add = (p: { pix: Pixmap; night?: Pixmap }) => items.push(hdOf(night && p.night ? p.night : p.pix));
add(L.fishHouse()); add(L.lighthouse()); add(L.fishStall()); add(L.crates()); add(L.ringPost());
items.push(hdOf(L.boatArt('north')), hdOf(L.boatArt('east')), hdOf(L.boatArt('south')), hdOf(L.boatArt('west')));
items.push(hdOf(L.lilyPads(1)), hdOf(L.lilyPads(2)), hdOf(L.dockArt(1, 3, true)), hdOf(L.dockArt(3, 1, false)));
items.push(...L.duckFrames('west').map(hdOf), hdOf(L.shoreRocks(1).pix));

const pad = 16;
let W = pad, H = 0;
for (const p of items) { W += p.w + pad; H = Math.max(H, p.h); }
H += pad * 2;
const sheet = new Pixmap(W, H);
sheet.rect(0, 0, W, H, night ? hex('#1a2a3a') : hex('#74d4a8'));
let x = pad;
for (const p of items) { sheet.blit(p, x, H - pad - p.h); x += p.w + pad; }
savePixmap(sheet, out, scale);
console.log('ok', out, W, H);
