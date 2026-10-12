// Folha de revisão dos acessórios: cada linha é um acessório; as colunas são
// os 10 modelos, cada um nas 4 direções (quadro parado).
//   npx vite-node scripts/mapa/folha-acessorios.ts -- saida.png [ids separados por vírgula]
import { readFileSync } from 'node:fs';
import { ACC_INFO, measureFrames, placeAcc, tintGray, type AccManifest } from '../../src/game/world/accessories';
import { applyLook, CLOTH, DEFAULT_LOOK, MODELOS } from '../../src/game/world/outfit';
import { Pixmap } from '../../src/game/world/pixmap';
import { readPng, savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const out = args[0] ?? 'acessorios.png';
const manifest: AccManifest = JSON.parse(readFileSync('public/game/sprites/acessorios/manifest.json', 'utf8'));
const atlas = readPng('public/game/sprites/acessorios/atlas.png');
const ids = args[1] ? args[1].split(',') : Object.keys(manifest);
const CW = 64, CH = 80;
const colors = ['vermelho', 'marinho', 'amarelo', 'roxo', 'rosa', 'verde'];

const sheets = MODELOS.map(m => readPng(`public/game/sprites/modelos/${m}.png`));
const bodies = sheets.map(s => measureFrames(s.data, s.w, CW, CH));
const painted = sheets.map(s => {
  const p = new Pixmap(s.w, s.h);
  p.data.set(s.data);
  applyLook(p.data, DEFAULT_LOOK);
  return p;
});

const W = MODELOS.length * 4 * CW, H = ids.length * CH;
const sheet = new Pixmap(W, H);
for (let i = 0; i < W * H; i++) sheet.data.set([176, 214, 150, 255], i * 4);

ids.forEach((id, row) => {
  const def = manifest[id];
  if (!def || !ACC_INFO[id]) { console.log('sem', id); return; }
  const cor = CLOTH[colors[row % colors.length]];
  const dirs = def.a.map(([ax, ay, aw, ah]) => {
    const p = new Pixmap(aw, ah);
    for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
      const s = ((ay + y) * atlas.w + ax + x) * 4, d = (y * aw + x) * 4;
      p.data.set(atlas.data.subarray(s, s + 4), d);
    }
    if (!def.fixo) tintGray(p.data, cor);
    return p;
  });
  MODELOS.forEach((_, mi) => {
    for (let r = 0; r < 4; r++) {
      const ox = (mi * 4 + r) * CW, oy = row * CH;
      const b = bodies[mi][r * 4];
      const src = dirs[r], pos = placeAcc(id, r, b, src.w, src.h);
      const frame = new Pixmap(CW, CH);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const s = ((r * CH + y) * painted[mi].w + x) * 4;
        frame.data.set(painted[mi].data.subarray(s, s + 4), (y * CW + x) * 4);
      }
      const layer = (behind: boolean) => { if (!pos.hidden && pos.behind === behind) sheet.blit(src, ox + pos.x, oy + pos.y); };
      layer(true);
      sheet.blit(frame, ox, oy);
      layer(false);
    }
  });
});
savePixmap(sheet, out, 1);
console.log('folha:', out, `${W}x${H}`);
