// Veículos (plano §3.6): andar mais rápido pela cidade. Só as REGRAS e a
// economia; o boneco montado precisa de arte (prompts em docs/prompts-lote2.md
// §N) e entra quando a imagem chegar. Simulação: `scripts/veiculos.ts`.
//
//  - cada veículo tem um ritmo (ms por bloco), preço e quanto gasta de barriga;
//  - fome baixa impede veículo (como impede correr); nunca impede andar;
//  - só anda em rua/calçada/terra (não entra em grama alta, água nem interior);
//  - o avião não anda: voa entre pistas (viagem rápida entre áreas).
import type { Progress } from './progress';
import { HUNGRY } from './life';

export type VehicleId = 'patinete' | 'bicicleta' | 'moto' | 'carro' | 'aviao';
export interface Vehicle { id: VehicleId; name: string; price: number; msPerTile: number; hunger: number; flies?: boolean; about: string }

/** Andando: 230 ms por bloco; correndo: 125 (CityDemo). */
export const WALK_MS = 230, RUN_MS = 125;

export const VEHICLES: Vehicle[] = [
  { id: 'patinete', name: 'Patinete elétrico', price: 600, msPerTile: 118, hunger: 0.5, about: 'Da estação de patinetes da Cidade WIT. Leve e silencioso.' },
  { id: 'bicicleta', name: 'Bicicleta', price: 1200, msPerTile: 105, hunger: 1.2, about: 'Pedalar dá fome, mas é bem mais rápido que correr.' },
  { id: 'moto', name: 'Moto elétrica', price: 4000, msPerTile: 90, hunger: 0.6, about: 'Rápida e econômica. Só nas ruas.' },
  { id: 'carro', name: 'Carro elétrico', price: 9000, msPerTile: 75, hunger: 0.4, about: 'O mais rápido do chão. Cabe o pet no banco de trás.' },
  { id: 'aviao', name: 'Aviãozinho', price: 20000, msPerTile: 0, hunger: 2, flies: true, about: 'Voa entre as pistas das áreas (viagem rápida). Não anda pela rua.' },
];
export const VEHICLE_BY_ID = new Map(VEHICLES.map(v => [v.id, v]));

/** Terrenos onde dá para andar de veículo. */
export const ROAD_TERRAIN = new Set(['rua', 'calcada', 'terra', 'praca', 'ponte']);

/** Pode usar o veículo agora? */
export function canRide(p: Pick<Progress, 'fome'>, v: Vehicle, terrain?: string): { ok: true } | { ok: false; reason: string } {
  if (p.fome <= HUNGRY) return { ok: false, reason: 'Com fome não dá para pilotar. Coma alguma coisa!' };
  if (!v.flies && terrain && !ROAD_TERRAIN.has(terrain)) return { ok: false, reason: 'Veículo só anda em rua, calçada e caminho de terra.' };
  return { ok: true };
}

/** Quanto tempo leva uma viagem de `tiles` blocos (ms). Avião: 6 s fixos de voo. */
export const tripMs = (v: Vehicle | null, tiles: number) => (v?.flies ? 6000 : tiles * (v ? v.msPerTile : WALK_MS));
/** Barriga gasta numa viagem (por bloco andado; o avião gasta por voo). */
export const tripHunger = (v: Vehicle | null, tiles: number, hungerPerTileWalking: number) =>
  v?.flies ? v.hunger : tiles * hungerPerTileWalking * (v ? v.hunger : 1);
