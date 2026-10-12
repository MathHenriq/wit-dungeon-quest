import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CROP_ROWS, missingArt, WORLD_ART } from '../art-list';
import { FISH } from '../../fishing';
import { CROPS } from '../../farm';

const py = readFileSync('scripts/arte/importar-gpt.py', 'utf8');
const pyList = (name: string) => JSON.parse(py.match(new RegExp(`${name} = (\\[[^\\]]*\\])`))![1].replace(/'/g, '"').replace(/,\s*\]/, ']'));

describe('arte do mundo que falta (GPT)', () => {
  it('cada sprite tem um nome só', () => {
    const names = WORLD_ART.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('o importador conhece todos os sprites da lista, na mesma ordem das folhas', () => {
    expect(pyList('FISH_IDS')).toEqual(FISH.map(f => f.id));
    expect(pyList('CROP_ROWS')).toEqual([...CROP_ROWS]);
    expect(new Set(CROP_ROWS)).toEqual(new Set(CROPS.map(c => c.id)));
    for (const p of WORLD_ART) {
      if (p.name.startsWith('peixe-') || p.name.startsWith('planta-')) continue;
      expect(py.includes(`'${p.name}'`), `${p.name} fora do importar-gpt.py`).toBe(true);
    }
  });

  it('lista o que ainda falta (todos, enquanto a arte do GPT não chega)', () => {
    const have = Object.keys(JSON.parse(readFileSync('public/game/world/manifest.json', 'utf8')));
    const falta = missingArt(have);
    // não falha: é o lembrete. Quando a arte chegar, este número cai.
    if (falta.length) console.warn(`arte do mundo novo por código: ${falta.length} de ${WORLD_ART.length} peças ainda sem a imagem do GPT (npx vite-node scripts/arte/falta-arte.ts)`);
    expect(falta.length).toBeLessThanOrEqual(WORLD_ART.length);
  });
});

describe('troca automática pela arte do GPT', () => {
  it('um sprite com o nome da lista entra no lugar da arte por código', async () => {
    const { Pixmap } = await import('../pixmap');
    const { buildZone } = await import('../world');
    const fake = new Pixmap(112, 90);   // "imagem do GPT" vazia
    const t = buildZone('lago', { 'casa-pesca': { pix: fake } });
    const o = t.objects.find(x => x.id === 'casa-pesca')!;
    expect(o.pix.data.some((v, i) => i % 4 === 3 && v > 0)).toBe(false);   // é a do "GPT", não a por código
    const code = buildZone('lago').objects.find(x => x.id === 'casa-pesca')!;
    expect(code.pix.data.some((v, i) => i % 4 === 3 && v > 0)).toBe(true);
    // a porta continua no mesmo lugar
    expect(t.doors.find(d => d.building === 'casa-pesca')).toEqual(buildZone('lago').doors.find(d => d.building === 'casa-pesca'));
  });
});
