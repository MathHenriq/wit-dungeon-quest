// O mundo: as áreas ligadas pelas bordas (plano §3.7). Só a área em que o
// jogador está fica montada; trocar de área monta a outra.
import type { WorldAssets } from './assets';
import { buildTown, type BuildOptions } from './town';
import { buildLago } from './zone-lago';
import { buildFazenda } from './zone-fazenda';
import type { Town, ZoneId } from './zone';

export { ZONE_NAMES, type ZoneId } from './zone';

export const ZONES: ZoneId[] = ['cidade', 'lago', 'fazenda'];

export function buildZone(id: ZoneId, assets?: WorldAssets, opts: BuildOptions = {}): Town {
  switch (id) {
    case 'lago': return buildLago(assets, opts);
    case 'fazenda': return buildFazenda(assets, opts);
    default: return buildTown(assets, opts);
  }
}
