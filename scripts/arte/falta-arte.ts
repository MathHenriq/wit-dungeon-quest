// Lista a arte do mundo novo que ainda é feita por código (falta a imagem do GPT).
//   npx vite-node scripts/arte/falta-arte.ts
// Prompts em docs/prompts-mundo.md; salvar em public/Novos assets/mundo/<área>/
// e rodar python3 scripts/arte/importar-gpt.py --folha revisao.png.
import { readFileSync } from 'node:fs';
import { missingArt, WORLD_ART } from '../../src/game/world/art-list';

const have = Object.keys(JSON.parse(readFileSync('public/game/world/manifest.json', 'utf8')));
const falta = missingArt(have);
console.log(`\nArte do mundo novo: ${WORLD_ART.length - falta.length} de ${WORLD_ART.length} peças com a imagem do GPT.\n`);
const byFile = new Map<string, typeof falta>();
for (const p of falta) byFile.set(`${p.area}/${p.file}.png`, [...(byFile.get(`${p.area}/${p.file}.png`) ?? []), p]);
for (const [file, list] of byFile) console.log(`  ✗ ${file}  (${list.length}: ${list.slice(0, 6).map(p => p.what).join(', ')}${list.length > 6 ? '…' : ''})`);
if (!falta.length) console.log('  tudo pronto!');
console.log('');
