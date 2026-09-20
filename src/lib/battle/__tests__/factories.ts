import type { Ability, BattleCharacter, ElementType } from '@/types/character';
import type { BattleEnemy } from '../BattleEngine';

/**
 * Minimal, deterministic fixtures for engine tests.
 *
 * Everything here is deliberately boring — neutral elements, no passives, no
 * forge buffs — so a test only has to state the one thing it cares about.
 */

export function makeAbility(over: Partial<Ability> = {}): Ability {
  return {
    id:          'ab-1',
    name:        'Golpe de Teste',
    elementId:   1,
    elementName: 'Steel',
    tier:        1,
    damageType:  'Physical',
    baseDamage:  40,
    energyCost:  0,
    accuracy:    100,
    requirement: 0,
    description: '',
    ...over,
  };
}

export function makePlayer(over: Partial<BattleCharacter> = {}): BattleCharacter {
  return {
    id: 'char-1', userId: 'user-1', name: 'Aluno', class: 'Guerreiro',
    level: 10, xp: 0, hpCurrent: 200, hpMax: 200, energyMax: 100,
    forca: 20, inteligencia: 20, destreza: 10, carisma: 10,
    agilidade: 10, resistencia: 20,
    ptsFire: 0, ptsWater: 0, ptsElectric: 0, ptsGrass: 0, ptsIce: 0,
    ptsGround: 0, ptsFighting: 0, ptsSteel: 0, ptsPoison: 0, ptsDark: 0,
    ptsGhost: 0, ptsFlying: 0, freePoints: 0,
    ...over,
  };
}

export function makeEnemy(over: Partial<BattleEnemy> = {}): BattleEnemy {
  return {
    id: 'enemy-1', name: 'Alvo de Treino', level: 10,
    hpCurrent: 200, hpMax: 200,
    defFisica: 10, defMagica: 10, velocidade: 5,
    elementType: 'Steel' as ElementType,
    abilities: [makeAbility({ id: 'e-ab-1', name: 'Investida', baseDamage: 20 })],
    floorNumber: 1,
    ...over,
  };
}
