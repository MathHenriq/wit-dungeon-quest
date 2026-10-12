// Renderiza a cidade inicial em PNG (inteira + recortes do tamanho da tela),
// de dia e à noite (e no entardecer, só a cidade inteira).
//   npx vite-node scripts/mapa/render-cidade.ts -- <pasta-saida> [escala]
import { mkdirSync } from 'node:fs';
import { Pixmap } from '../../src/game/world/pixmap';
import { buildTown, renderTown, type Placed } from '../../src/game/world/town';
import { readPng, savePixmap } from './png';
import { loadWorldAssetsNode } from './assets-node';

const args = process.argv.slice(2).filter(a => a !== '--');
const dir = args[0] ?? '.';
const scale = Number(args[1] ?? 2);
mkdirSync(dir, { recursive: true });

const t0 = Date.now();
const town = buildTown(process.argv.includes('--codigo') ? undefined : loadWorldAssetsNode());
const t1 = Date.now();
const sp = (file: string, tx: number, ty: number): Placed => {
  const pix = readPng(`public/game/sprites/${file}`);
  return { id: file, pix, x: tx * 16 - 8, y: ty * 16 + 16 - 31, baseY: ty * 16 + 16 };
};
const people = [
  sp('base/south.png', town.spawn.tx, town.spawn.ty + 3),
  sp('pets/raposa-chama/andar-west-0.png', town.spawn.tx + 1, town.spawn.ty + 3),
];
for (const [suffix, hour] of [['', undefined], ['-noite', 22], ['-tarde', 18.4]] as [string, number | undefined][]) {
  const full = renderTown(town, people, hour);
  savePixmap(full, `${dir}/cidade${suffix}.png`, scale);
  if (suffix === '-tarde') continue;
  // recortes do tamanho de uma tela de jogo (20×13 blocos)
  const crops: [string, number, number][] = [['praca', 10, 6], ['oeste', 0, 6], ['leste', 20, 6], ['sul', 10, 17], ['norte', 0, 0]];
  for (const [name, tx, ty] of crops) {
    const c = new Pixmap(320, 208);
    for (let y = 0; y < 208; y++) for (let x = 0; x < 320; x++) {
      const px = full.get(tx * 16 + x, ty * 16 + y);
      if (px) c.put(x, y, px);
    }
    savePixmap(c, `${dir}/tela-${name}${suffix}.png`, 3);
  }
}
console.log(`cidade gerada em ${t1 - t0} ms; ${town.objects.length} objetos; ${town.doors.length} portas`);
