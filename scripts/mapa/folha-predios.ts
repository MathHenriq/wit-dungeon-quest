// Folha de revisão dos prédios, de dia (em cima) e à noite (embaixo).
//   npx vite-node scripts/mapa/folha-predios.ts -- saida.png [escala]
import { Pixmap } from '../../src/game/world/pixmap';
import { GRASS } from '../../src/game/world/palette';
import * as H from '../../src/game/world/buildings-hg';
import { houseHG } from '../../src/game/world/house-hg';
import * as L from '../../src/game/world/landmarks';
import { applyTimeOfDay, lightHalo, timeOfDay } from '../../src/game/world/light';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const list = [
  L.cardWorkshop(), L.packShop(), H.towerHG(), H.arenaHG(), L.guildCastle(),
  houseHG('a', 'Casa', { roof: 'azul', wood: 'branco', tech: 'solar', led: 'cyan' }),
  houseHG('b', 'Casa', { roof: 'vermelho', tech: 'antena', led: 'pink' }),
];
const pad = 8;
const W = list.reduce((s, b) => s + b.pix.w + pad, pad);
const rowH = Math.max(...list.map(b => b.pix.h)) + pad * 2;
const day = new Pixmap(W, rowH), night = new Pixmap(W, rowH), lights = new Pixmap(W, rowH);
day.rect(0, 0, W, rowH, GRASS.base);
night.rect(0, 0, W, rowH, GRASS.base);
let x = pad;
for (const b of list) {
  const y = rowH - pad - b.pix.h;
  day.blit(b.pix, x, y); night.blit(b.pix, x, y);
  if (b.night) lights.blit(b.night, x, y);
  x += b.pix.w + pad;
}
applyTimeOfDay(night, lights, lightHalo(lights), timeOfDay(22));
const sheet = new Pixmap(W, rowH * 2);
sheet.blit(day, 0, 0); sheet.blit(night, 0, rowH);
savePixmap(sheet, args[0] ?? 'predios.png', Number(args[1] ?? 3));
console.log('ok', W, rowH * 2);
