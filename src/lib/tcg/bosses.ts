/**
 * Os chefes da Torre com identidade: cada um tem um elemento (gira pelos 12)
 * e um estilo (um dos 7 Caminhos de jogo, menos o Desafiante). O nome diz os
 * dois ("Ceifador das Sombras") e o deck de 20 puxa as cartas do estilo.
 * Os andares 10, 20... têm o Grão-chefe (mais vida, IA mais esperta).
 */
import { bossElement, bossFoe, type Foe } from './opponents';
import { fit, PATH_BY_ID, type PathId } from './paths';
import type { Element } from './types';

const STYLES: PathId[] = ['sabio', 'louco', 'guardiao', 'alquimista', 'ceifador', 'trapaceiro', 'forjador'];
const STYLE_NAME: Record<string, string> = { sabio: 'Sábio', louco: 'Louco', guardiao: 'Guardião', alquimista: 'Alquimista', ceifador: 'Ceifador', trapaceiro: 'Trapaceiro', forjador: 'Forjador' };
export const ELEMENT_OF: Record<Element, string> = {
  Fire: 'do Fogo', Water: 'da Água', Electric: 'do Trovão', Grass: 'da Floresta', Ice: 'do Gelo', Ground: 'da Terra',
  Fighting: 'da Luta', Steel: 'do Aço', Poison: 'do Veneno', Dark: 'das Sombras', Ghost: 'dos Fantasmas', Flying: 'dos Ventos',
};

export interface BossIdentity { andar: number; style: PathId; element: Element; name: string; big: boolean; line: string }

export function bossIdentity(andar: number): BossIdentity {
  const style = STYLES[(andar * 3 + 1) % STYLES.length];
  const element = bossElement(andar);
  const big = andar % 10 === 0;
  const name = `${big ? 'Grão-' : ''}${STYLE_NAME[style]} ${ELEMENT_OF[element]}`;
  return { andar, style, element, big, name, line: `${PATH_BY_ID.get(style)!.style}. Meu deck é ${ELEMENT_OF[element].replace(/^d[oa]s? /, '')}.` };
}

/** O chefe do andar, com o deck no estilo dele. */
export function towerBoss(andar: number): Foe {
  const id = bossIdentity(andar);
  const p = PATH_BY_ID.get(id.style)!;
  return bossFoe(andar, id.name, c => 1 + fit(c, p) * 0.8);
}
