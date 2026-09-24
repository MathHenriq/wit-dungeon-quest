/**
 * Gera `docs/cartas-tcg.md`: o catálogo inteiro com o texto gerado de cada carta.
 *
 *   npx vite-node scripts/tcg-simular.ts 12000 --json | tail -1 > /tmp/wr.json
 *   npx vite-node scripts/tcg-catalogo.ts /tmp/wr.json
 *
 * O arquivo de taxa de vitória é opcional.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { CATALOG, CARD_ID_BY_SHOP_NAME } from '../src/lib/tcg/cards/catalog';
import { describeCard } from '../src/lib/tcg/describe';
import { ELEMENT_PT, RARITY_PT, TYPE_PT } from '../src/lib/tcg/labels';
import type { Rarity } from '../src/lib/tcg/types';

const wrPath = process.argv[2];
const wr = new Map<string, number>(
  wrPath ? (JSON.parse(readFileSync(wrPath, 'utf8')) as { id: string; wr: number }[]).map(r => [r.id, r.wr]) : [],
);
const shopById = new Map([...CARD_ID_BY_SHOP_NAME].map(([shop, id]) => [id, shop]));

const ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
const cell = (s: string) => s.replace(/\|/g, '\\|');

const out: string[] = [
  '# Catálogo do TCG — cartas da loja traduzidas',
  '',
  '> Gerado por `scripts/tcg-catalogo.ts` a partir de `src/lib/tcg/cards/catalog.ts`. Não edite à mão.',
  '> O texto de cada carta é gerado a partir dos efeitos programados.',
  wr.size ? '> **Vitória sim.**: taxa de vitória dos decks que tinham a carta, em 12 mil partidas simuladas entre decks aleatórios (IA simples). Serve para comparar cartas, não é verdade absoluta.' : '',
  '',
  `Total: **${CATALOG.length} cartas**.`,
  '',
];

for (const r of ORDER) {
  const cards = CATALOG.filter(c => c.rarity === r);
  if (!cards.length) continue;
  out.push(`## ${RARITY_PT[r]} (${cards.length})`, '');
  out.push(`| Carta | Tipo | Elemento | Dano | Custo | Efeito | Obra | Era na loja |${wr.size ? ' Vitória sim. |' : ''}`);
  out.push(`|---|---|---|---|---|---|---|---|${wr.size ? '---|' : ''}`);
  for (const c of cards) {
    const d = describeCard(c);
    const tipo = c.type === 'equipment' ? `${TYPE_PT[c.type]} (${c.slot === 'armor' ? 'armadura' : 'arma'})` : TYPE_PT[c.type];
    const w = wr.get(c.id);
    out.push(`| **${cell(c.name)}** | ${tipo} | ${ELEMENT_PT[c.element]} | ${c.damage ?? ''} | ${cell(d.cost ?? '')} | ${cell(d.text)} | ${c.anime ?? ''} | ${cell(shopById.get(c.id) ?? '')} |${wr.size ? ` ${w !== undefined ? `${(w * 100).toFixed(0)}%` : ''} |` : ''}`);
  }
  out.push('');
}

writeFileSync('docs/cartas-tcg.md', out.join('\n'));
console.log(`docs/cartas-tcg.md: ${CATALOG.length} cartas`);
