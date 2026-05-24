/**
 * WIT Dungeon 2.0 — Sistema de Evoluções por Atributo
 * 
 * 6 atributos × 3 marcos (30/60/90 pontos) = 18 evoluções por classe.
 * Cumulativas: todas as evoluções desbloqueadas ficam ativas simultaneamente.
 * Cada evolução combina: bônus numérico + habilidade passiva única.
 */

import type { AttributeType } from './skillsRegistry';

// =================== TIPOS ===================

export type EvolutionMilestone = 30 | 60 | 90;

export interface PassiveAbility {
  key: string;                    // identificador único, usado pelo BattleEngine
  name: string;
  description: string;            // texto exibido ao aluno
  effect: PassiveEffect;          // dados estruturados para o engine
}

export interface PassiveEffect {
  type: PassiveEffectType;
  value: number;                  // intensidade do efeito
  condition?: PassiveCondition;   // condição opcional (HP baixo, primeiro turno, etc.)
}

export type PassiveEffectType =
  | 'damage_mult'           // multiplicador de dano
  | 'crit_chance'           // % de crítico
  | 'crit_multiplier'       // multiplicador de dano crítico
  | 'evade_chance'          // % de esquiva
  | 'damage_taken_mult'     // multiplicador de dano recebido (negativo = redução)
  | 'hp_max_mult'           // multiplicador de HP máximo
  | 'defense_ignore'        // % de defesa que ignora
  | 'stun_chance'           // % de stun em ataques
  | 'double_attack_chance'  // % de atacar 2x
  | 'first_turn_free'       // primeira skill da batalha é grátis
  | 'survive_lethal'        // sobrevive a golpe letal (1x por batalha)
  | 'skill_cost_reduce'     // reduz custo de skills
  | 'first_strike'          // sempre age primeiro
  | 'enemy_miss_chance'     // % de inimigo errar primeiro ataque
  | 'ally_buff'             // buffa aliados (em raids)
  | 'heal_per_turn'         // cura aliados por turno (raid)
  | 'no_miss'               // imune a miss em skills próprias
  | 'lifesteal';            // % de dano causado retorna como cura

export type PassiveCondition =
  | 'always'
  | 'hp_below_30'
  | 'first_skill_of_battle'
  | 'damage_type_physical'
  | 'damage_type_magical'
  | 'in_raid_context';

export interface Evolution {
  id: string;                           // ex: 'forca_30'
  attribute: AttributeType;
  milestone: EvolutionMilestone;
  bonusAttributeMultiplier: number;     // ex: 0.10 = +10% no atributo
  passive: PassiveAbility;
  spriteColor: string;                  // cor do sprite genérico
  spriteShape: SpriteShape;             // forma do sprite
}

export type SpriteShape = 'circle' | 'hexagon' | 'star';

// =================== CORES POR ATRIBUTO ===================

export const ATTRIBUTE_COLORS: Record<AttributeType, string> = {
  forca: '#dc2626',         // vermelho
  destreza: '#84cc16',      // verde-limão
  inteligencia: '#3b82f6',  // azul
  carisma: '#ec4899',       // rosa/magenta
  agilidade: '#06b6d4',     // ciano
  resistencia: '#f59e0b',   // âmbar
};

export const ATTRIBUTE_LABELS: Record<AttributeType, string> = {
  forca: 'Força',
  destreza: 'Destreza',
  inteligencia: 'Inteligência',
  carisma: 'Carisma',
  agilidade: 'Agilidade',
  resistencia: 'Resistência',
};

// Forma do sprite escala por marco
const MILESTONE_SHAPE: Record<EvolutionMilestone, SpriteShape> = {
  30: 'circle',
  60: 'hexagon',
  90: 'star',
};

// =================== REGISTRY DE EVOLUÇÕES ===================

export const EVOLUTIONS_REGISTRY: Evolution[] = [
  // ============= FORÇA — combate físico, dano bruto =============
  {
    id: 'forca_30',
    attribute: 'forca',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.forca,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'impacto',
      name: 'Impacto',
      description: '10% de chance de atordoar o inimigo por 1 turno em ataques físicos.',
      effect: { type: 'stun_chance', value: 0.10, condition: 'damage_type_physical' },
    },
  },
  {
    id: 'forca_60',
    attribute: 'forca',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.forca,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'quebra_defesa',
      name: 'Quebra Defesa',
      description: 'Ataques físicos ignoram 25% da defesa do inimigo.',
      effect: { type: 'defense_ignore', value: 0.25, condition: 'damage_type_physical' },
    },
  },
  {
    id: 'forca_90',
    attribute: 'forca',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.forca,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'berserker',
      name: 'Berserker',
      description: '+50% de dano físico quando seu HP estiver abaixo de 30%.',
      effect: { type: 'damage_mult', value: 0.50, condition: 'hp_below_30' },
    },
  },

  // ============= DESTREZA — precisão, crítico =============
  {
    id: 'destreza_30',
    attribute: 'destreza',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.destreza,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'mira_agucada',
      name: 'Mira Aguçada',
      description: '+10% de chance de causar crítico em todos os ataques.',
      effect: { type: 'crit_chance', value: 0.10 },
    },
  },
  {
    id: 'destreza_60',
    attribute: 'destreza',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.destreza,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'tiro_certeiro',
      name: 'Tiro Certeiro',
      description: 'Críticos causam 2x de dano (ao invés de 1.5x).',
      effect: { type: 'crit_multiplier', value: 2.0 },
    },
  },
  {
    id: 'destreza_90',
    attribute: 'destreza',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.destreza,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'sangue_frio',
      name: 'Sangue Frio',
      description: 'Suas skills nunca erram. Imune a miss.',
      effect: { type: 'no_miss', value: 1 },
    },
  },

  // ============= INTELIGÊNCIA — magia, conhecimento =============
  {
    id: 'inteligencia_30',
    attribute: 'inteligencia',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.inteligencia,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'mente_afiada',
      name: 'Mente Afiada',
      description: '+15% de dano em todas as skills mágicas.',
      effect: { type: 'damage_mult', value: 0.15, condition: 'damage_type_magical' },
    },
  },
  {
    id: 'inteligencia_60',
    attribute: 'inteligencia',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.inteligencia,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'sabedoria_arcana',
      name: 'Sabedoria Arcana',
      description: 'Skills custam 1 ponto a menos para desbloquear (mínimo 1).',
      effect: { type: 'skill_cost_reduce', value: 1 },
    },
  },
  {
    id: 'inteligencia_90',
    attribute: 'inteligencia',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.inteligencia,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'tempo_suspenso',
      name: 'Tempo Suspenso',
      description: 'A primeira skill que você usar em cada batalha não consome turno.',
      effect: { type: 'first_turn_free', value: 1, condition: 'first_skill_of_battle' },
    },
  },

  // ============= CARISMA — influência, suporte =============
  {
    id: 'carisma_30',
    attribute: 'carisma',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.carisma,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'lideranca',
      name: 'Liderança',
      description: 'Em raids: aliados ganham +5% em todos os atributos.',
      effect: { type: 'ally_buff', value: 0.05, condition: 'in_raid_context' },
    },
  },
  {
    id: 'carisma_60',
    attribute: 'carisma',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.carisma,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'persuasao',
      name: 'Persuasão',
      description: '25% de chance de o inimigo errar seu primeiro ataque da batalha.',
      effect: { type: 'enemy_miss_chance', value: 0.25 },
    },
  },
  {
    id: 'carisma_90',
    attribute: 'carisma',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.carisma,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'inspiracao',
      name: 'Inspiração',
      description: 'Em raids: cura todos os aliados em 5% do HP máximo a cada turno.',
      effect: { type: 'heal_per_turn', value: 0.05, condition: 'in_raid_context' },
    },
  },

  // ============= AGILIDADE — velocidade, esquiva =============
  {
    id: 'agilidade_30',
    attribute: 'agilidade',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.agilidade,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'reflexos',
      name: 'Reflexos',
      description: '+10% de chance de esquivar de qualquer ataque.',
      effect: { type: 'evade_chance', value: 0.10 },
    },
  },
  {
    id: 'agilidade_60',
    attribute: 'agilidade',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.agilidade,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'iniciativa',
      name: 'Iniciativa',
      description: 'Você sempre age primeiro em todas as batalhas.',
      effect: { type: 'first_strike', value: 1 },
    },
  },
  {
    id: 'agilidade_90',
    attribute: 'agilidade',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.agilidade,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'sombra',
      name: 'Sombra',
      description: '25% de chance de atacar duas vezes seguidas em qualquer skill ofensiva.',
      effect: { type: 'double_attack_chance', value: 0.25 },
    },
  },

  // ============= RESISTÊNCIA — vida, defesa =============
  {
    id: 'resistencia_30',
    attribute: 'resistencia',
    milestone: 30,
    bonusAttributeMultiplier: 0.10,
    spriteColor: ATTRIBUTE_COLORS.resistencia,
    spriteShape: MILESTONE_SHAPE[30],
    passive: {
      key: 'couro_duro',
      name: 'Couro Duro',
      description: '-10% de dano recebido de qualquer fonte.',
      effect: { type: 'damage_taken_mult', value: -0.10 },
    },
  },
  {
    id: 'resistencia_60',
    attribute: 'resistencia',
    milestone: 60,
    bonusAttributeMultiplier: 0.20,
    spriteColor: ATTRIBUTE_COLORS.resistencia,
    spriteShape: MILESTONE_SHAPE[60],
    passive: {
      key: 'vitalidade',
      name: 'Vitalidade',
      description: '+30% de HP máximo permanente.',
      effect: { type: 'hp_max_mult', value: 0.30 },
    },
  },
  {
    id: 'resistencia_90',
    attribute: 'resistencia',
    milestone: 90,
    bonusAttributeMultiplier: 0.30,
    spriteColor: ATTRIBUTE_COLORS.resistencia,
    spriteShape: MILESTONE_SHAPE[90],
    passive: {
      key: 'imortal',
      name: 'Imortal',
      description: 'Sobrevive a um golpe letal com 1 HP. Ativa apenas uma vez por batalha.',
      effect: { type: 'survive_lethal', value: 1 },
    },
  },
];

// =================== HELPERS ===================

/**
 * Retorna todas as evoluções já desbloqueadas pelo aluno, baseado nos pontos por atributo.
 */
export function getActiveEvolutions(attributePoints: Record<AttributeType, number>): Evolution[] {
  const active: Evolution[] = [];
  for (const evo of EVOLUTIONS_REGISTRY) {
    const pts = attributePoints[evo.attribute] || 0;
    if (pts >= evo.milestone) {
      active.push(evo);
    }
  }
  return active;
}

/**
 * Retorna todas as passivas ativas (cumulativas) para o aluno.
 */
export function getActivePassives(attributePoints: Record<AttributeType, number>): PassiveAbility[] {
  return getActiveEvolutions(attributePoints).map(evo => evo.passive);
}

/**
 * Calcula bônus total acumulado em um atributo (soma de todas evoluções desbloqueadas dele).
 */
export function getAttributeBonus(attribute: AttributeType, points: number): number {
  let bonus = 0;
  for (const evo of EVOLUTIONS_REGISTRY) {
    if (evo.attribute === attribute && points >= evo.milestone) {
      bonus += evo.bonusAttributeMultiplier;
    }
  }
  return bonus;
}

/**
 * Retorna a próxima evolução que o aluno está perto de desbloquear (para UI motivacional).
 */
export function getNextEvolution(attribute: AttributeType, currentPoints: number): Evolution | null {
  const sorted = EVOLUTIONS_REGISTRY
    .filter(e => e.attribute === attribute && e.milestone > currentPoints)
    .sort((a, b) => a.milestone - b.milestone);
  return sorted[0] || null;
}

/**
 * Retorna SVG inline do sprite genérico de uma evolução.
 * Forma escala com marco (30=círculo, 60=hexágono, 90=estrela) e cor é do atributo.
 */
export function renderEvolutionSprite(evolution: Evolution, size: number = 48): string {
  const { spriteColor, spriteShape } = evolution;
  const half = size / 2;
  
  if (spriteShape === 'circle') {
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${half}" cy="${half}" r="${half * 0.85}" fill="${spriteColor}" stroke="${spriteColor}" stroke-width="2" opacity="0.9"/>
      <circle cx="${half}" cy="${half}" r="${half * 0.55}" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
    </svg>`;
  }
  
  if (spriteShape === 'hexagon') {
    const r = half * 0.85;
    const points = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
    }).join(' ');
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <polygon points="${points}" fill="${spriteColor}" stroke="white" stroke-width="2"/>
      <polygon points="${points}" fill="none" stroke="${spriteColor}" stroke-width="4" opacity="0.5"/>
    </svg>`;
  }
  
  // star (5 pontas)
  const outerR = half * 0.85;
  const innerR = half * 0.40;
  const starPoints = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
  }).join(' ');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <polygon points="${starPoints}" fill="${spriteColor}" stroke="white" stroke-width="1.5"/>
    <polygon points="${starPoints}" fill="none" stroke="${spriteColor}" stroke-width="3" opacity="0.6"/>
  </svg>`;
}

// =================== INTEGRAÇÃO COM BATTLE ENGINE ===================

/**
 * Aplica todas as passivas ativas ao contexto de batalha.
 * O BattleEngine deve chamar esta função no início de cada batalha.
 */
export interface PassiveEffectAggregation {
  damageMultPhysical: number;
  damageMultMagical: number;
  damageMultLowHp: number;
  critChance: number;
  critMultiplier: number;
  evadeChance: number;
  damageTakenMult: number;
  hpMaxMult: number;
  defenseIgnore: number;
  stunChance: number;
  doubleAttackChance: number;
  firstTurnFree: boolean;
  surviveLethal: boolean;
  firstStrike: boolean;
  enemyMissChance: number;
  noMiss: boolean;
  allyBuff: number;
  healPerTurn: number;
  skillCostReduce: number;
}

export function aggregatePassives(
  attributePoints: Record<AttributeType, number>,
  isInRaid: boolean = false
): PassiveEffectAggregation {
  const passives = getActivePassives(attributePoints);
  const agg: PassiveEffectAggregation = {
    damageMultPhysical: 0,
    damageMultMagical: 0,
    damageMultLowHp: 0,
    critChance: 0,
    critMultiplier: 1.5,
    evadeChance: 0,
    damageTakenMult: 0,
    hpMaxMult: 0,
    defenseIgnore: 0,
    stunChance: 0,
    doubleAttackChance: 0,
    firstTurnFree: false,
    surviveLethal: false,
    firstStrike: false,
    enemyMissChance: 0,
    noMiss: false,
    allyBuff: 0,
    healPerTurn: 0,
    skillCostReduce: 0,
  };

  for (const p of passives) {
    const { effect } = p;
    // Pula passivas condicionais que dependem de contexto
    if (effect.condition === 'in_raid_context' && !isInRaid) continue;

    switch (effect.type) {
      case 'damage_mult':
        if (effect.condition === 'damage_type_physical') agg.damageMultPhysical += effect.value;
        else if (effect.condition === 'damage_type_magical') agg.damageMultMagical += effect.value;
        else if (effect.condition === 'hp_below_30') agg.damageMultLowHp += effect.value;
        break;
      case 'crit_chance':
        agg.critChance += effect.value;
        break;
      case 'crit_multiplier':
        agg.critMultiplier = Math.max(agg.critMultiplier, effect.value);
        break;
      case 'evade_chance':
        agg.evadeChance += effect.value;
        break;
      case 'damage_taken_mult':
        agg.damageTakenMult += effect.value;
        break;
      case 'hp_max_mult':
        agg.hpMaxMult += effect.value;
        break;
      case 'defense_ignore':
        agg.defenseIgnore += effect.value;
        break;
      case 'stun_chance':
        agg.stunChance += effect.value;
        break;
      case 'double_attack_chance':
        agg.doubleAttackChance += effect.value;
        break;
      case 'first_turn_free':
        agg.firstTurnFree = true;
        break;
      case 'survive_lethal':
        agg.surviveLethal = true;
        break;
      case 'first_strike':
        agg.firstStrike = true;
        break;
      case 'enemy_miss_chance':
        agg.enemyMissChance += effect.value;
        break;
      case 'no_miss':
        agg.noMiss = true;
        break;
      case 'ally_buff':
        agg.allyBuff += effect.value;
        break;
      case 'heal_per_turn':
        agg.healPerTurn += effect.value;
        break;
      case 'skill_cost_reduce':
        agg.skillCostReduce += effect.value;
        break;
    }
  }
  return agg;
}
