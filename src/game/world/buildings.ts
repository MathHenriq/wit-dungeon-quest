// Tipos comuns dos prédios da cidade. Cada prédio ocupa um retângulo de
// blocos (colisão) e pode ter arte acima dele (`extraTop`, para torres e
// telhados altos). A porta é um bloco da última fileira: o jogador entra
// andando para cima nela. A arte fica em `house-hg.ts` e `buildings-hg.ts`.
import { type Pixmap } from './pixmap';

export { drawText, textWidth } from './font';

export const TILE = 16;

export interface Building {
  id: string;
  name: string;
  pix: Pixmap;
  tilesW: number;
  tilesH: number;
  /** Pixels de arte acima do retângulo de colisão. */
  extraTop: number;
  /** Colunas (relativas) das portas, na última fileira do prédio. */
  doorCols: number[];
  /** Quadros de animação (o primeiro é igual a `pix`). */
  frames?: Pixmap[];
  /** Pixels que acendem à noite (mesmo tamanho de `pix`). */
  night?: Pixmap;
  nightFrames?: Pixmap[];
  /** Fontes de luz que iluminam o chão à noite (refletor, fogo), relativas à arte. */
  glow?: { x: number; y: number; r: number; color: readonly [number, number, number]; k: number }[];
  /** Deslocamento horizontal da arte (px) para a porta cair no meio do bloco da porta. */
  offsetX?: number;
}
