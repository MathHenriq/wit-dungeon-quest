// Renderiza a cidade como o jogo desenha (resolução hd, 2×): o mapa inteiro e
// recortes do tamanho da tela, para revisar os detalhes.
//   npx vite-node scripts/mapa/render-hd.ts -- <pasta-saida> [--zona lago] [x,y ...]
// Cada x,y (em blocos) vira um recorte de 20×12 blocos com canto ali.
import { mkdirSync } from 'node:fs';
import { hdOf } from '../../src/game/world/assets';
import { Pixmap } from '../../src/game/world/pixmap';
import { buildZone, type ZoneId } from '../../src/game/world/world';
import { savePixmap } from './png';
import { loadWorldAssetsNode } from './assets-node';

let args = process.argv.slice(2).filter(a => a !== '--');
const zi = args.indexOf('--zona');
const zona = (zi >= 0 ? args[zi + 1] : 'cidade') as ZoneId;
if (zi >= 0) args = args.filter((_, i) => i !== zi && i !== zi + 1);
const dir = args[0] ?? '.';
mkdirSync(dir, { recursive: true });
const town = buildZone(zona, loadWorldAssetsNode(undefined, true));
const full = new Pixmap(town.ground.w * 2, town.ground.h * 2);
full.blit(hdOf(town.ground), 0, 0);
for (const o of [...town.objects].sort((a, b) => a.baseY - b.baseY)) full.blit(hdOf(o.pix), o.x * 2, o.y * 2);
savePixmap(full, `${dir}/${zona}-hd.png`, 1);
const spots = args.slice(1).length ? args.slice(1) : ['21,13', '2,2', '40,2', '2,20', '42,20', '10,32', '38,32', '22,34'];
for (const s of spots) {
  const [tx, ty] = s.split(',').map(Number);
  const c = new Pixmap(640, 384);
  for (let y = 0; y < 384; y++) for (let x = 0; x < 640; x++) {
    const px = full.get(tx * 32 + x, ty * 32 + y);
    if (px) c.put(x, y, px);
  }
  savePixmap(c, `${dir}/${zona}-${tx}-${ty}.png`, 1);
}
console.log('ok', full.w, full.h);
