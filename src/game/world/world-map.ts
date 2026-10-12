// Onde cada área fica no mapa-múndi (em blocos): as saídas batem — a Fazenda
// encosta no oeste do Centro na linha 20, o Lago no leste, e a Cidade WIT fica
// embaixo, com a entrada dela (x 18 a 21) logo abaixo da saída sul do Centro
// (x 30 a 33). A imagem pronta sai de scripts/mapa/mapa-mundo.ts.
import type { ZoneId } from './zone';

export const WORLD_LAYOUT: { w: number; h: number; areas: Record<ZoneId, { x: number; y: number }> } = {
  w: 208, h: 96,
  areas: {
    fazenda: { x: 0, y: 0 },
    cidade: { x: 72, y: 0 },
    lago: { x: 136, y: 0 },
    wit: { x: 84, y: 48 },
  },
};

/** Tamanho de cada área (blocos); um teste confere com a planta de verdade. */
export const ZONE_SIZE: Record<ZoneId, [number, number]> = { fazenda: [72, 48], cidade: [64, 48], lago: [72, 48], wit: [72, 48] };

/** Retângulo (0 a 1) de uma área no mapa-múndi. */
export function zoneRect(zone: ZoneId): { x: number; y: number; w: number; h: number } {
  const a = WORLD_LAYOUT.areas[zone], [w, h] = ZONE_SIZE[zone];
  return { x: a.x / WORLD_LAYOUT.w, y: a.y / WORLD_LAYOUT.h, w: w / WORLD_LAYOUT.w, h: h / WORLD_LAYOUT.h };
}

/** Ponto (0 a 1) do mapa-múndi para um bloco de uma área. */
export function worldPoint(zone: ZoneId, tx: number, ty: number): { x: number; y: number } {
  const a = WORLD_LAYOUT.areas[zone];
  return { x: (a.x + tx + 0.5) / WORLD_LAYOUT.w, y: (a.y + ty + 0.5) / WORLD_LAYOUT.h };
}
