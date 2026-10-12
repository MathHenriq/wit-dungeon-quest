// De onde vem a ilustração de cada carta. No jogo é um arquivo por carta
// (public/cards/art/<id>.webp, carregado só quando a carta aparece). A demo
// empacotada (vite.demo.config.ts) usa folhas com várias ilustrações, porque o
// link da demo tem limite de arquivos: `initCardAtlas` carrega o índice antes.

export interface CardAtlas { base: string; cols: number; rows: number; w: number; h: number; cards: Record<string, [number, number]> }
let atlas: CardAtlas | null = null;

/** A versão "+" (evolução) usa a ilustração da carta normal. */
const artId = (id: string) => (id.endsWith('+') ? id.slice(0, -1) : id);

/** Endereço da ilustração (um arquivo por carta). */
export const cardArtUrl = (id: string) => `${import.meta.env.BASE_URL}cards/art/${artId(id)}.webp`;

export async function initCardAtlas(base: string): Promise<void> {
  try {
    const r = await fetch(`${base}/index.json`);
    if (r.ok) atlas = { ...(await r.json()), base };
  } catch { /* sem folhas: usa um arquivo por carta */ }
}

/** Fundo CSS da célula da carta na folha (ou null sem folhas). */
export function atlasBackground(id: string): React.CSSProperties | null {
  const at = atlas?.cards[artId(id)];
  if (!atlas || !at) return null;
  const [sheet, i] = at, col = i % atlas.cols, row = Math.floor(i / atlas.cols);
  return {
    backgroundImage: `url(${atlas.base}/folha-${sheet}.webp)`,
    backgroundSize: `${atlas.cols * 100}% ${atlas.rows * 100}%`,
    backgroundPosition: `${(col / (atlas.cols - 1)) * 100}% ${(row / (atlas.rows - 1)) * 100}%`,
  };
}
export const artAspect = () => (atlas ? atlas.w / atlas.h : 768 / 528);
