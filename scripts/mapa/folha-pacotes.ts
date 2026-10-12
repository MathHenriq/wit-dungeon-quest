// Folha de revisão dos pacotinhos desenhados em código (6 raridades).
//   npx vite-node scripts/mapa/folha-pacotes.ts -- saida.png [escala]
import { drawPack, PACK_H, PACK_W } from '../../src/game/world/packs-art';
import { Pixmap } from '../../src/game/world/pixmap';
import { PACKS } from '../../src/game/packs';
import { RARITY_PT } from '../../src/lib/tcg/labels';
import { savePixmap } from './png';

const args = process.argv.slice(2).filter(a => a !== '--');
const out = new Pixmap(PACKS.length * (PACK_W + 8) + 8, PACK_H + 16);
for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.put(x, y, [40, 30, 52]);
PACKS.forEach((p, i) => out.blit(drawPack(p.rarity, RARITY_PT[p.rarity].toUpperCase()), 8 + i * (PACK_W + 8), 8));
savePixmap(out, args[0] ?? 'pacotes.png', Number(args[1] ?? 4));
