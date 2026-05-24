/**
 * WIT Dungeon 2.0 — Skills Registry
 * Auto-gerado: 156 skills (13 slots × 12 elementos) × 12 classes = 1872 variantes
 * 
 * Estrutura: árvore de habilidades por elemento, conquistada com pontos (1 ponto/nível).
 * Cada skill tem mecânica universal + 12 variantes (uma por classe) com nome/atributo/visual diferentes.
 */

// =================== TIPOS ===================

export type ElementType = 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'fighting' 
                        | 'poison' | 'ground' | 'flying' | 'ghost' | 'steel' | 'dark';

export type ClassType = 'guerreiro' | 'arqueiro' | 'mago' | 'assassino' | 'monge' 
                       | 'paladino' | 'curandeiro' | 'invocador' | 'samurai' | 'bardo' 
                       | 'lanceiro' | 'alquimista';

export type AttributeType = 'forca' | 'destreza' | 'inteligencia' | 'carisma' 
                          | 'agilidade' | 'resistencia';

export type DamageType = 'physical' | 'magical' | 'true';

export type MechanicType = 'damage' | 'heal' | 'buff' | 'debuff' | 'status' 
                         | 'control' | 'aoe' | 'combo' | 'ultimate' | 'passive';

export type TierLevel = 1 | 2 | 3 | 4 | 5;

export interface ClassVariant {
  name: string;
  description: string;
  primaryAttribute: AttributeType;
  damageType: DamageType;
  visualKey: string;
}

export interface Skill {
  id: string;
  element: ElementType;
  tier: TierLevel;
  slot: number;              // 1-13 dentro do elemento
  cost: number;              // pontos para desbloquear
  mechanicType: MechanicType;
  baseValue: number;
  statusChance?: number;
  statusDuration?: number;
  prerequisites: string[];   // IDs de skills que precisam estar desbloqueadas
  variants: Record<ClassType, ClassVariant>;
}

// =================== TABELA DE EFETIVIDADE ===================

export const ELEMENT_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  fire:     { dark: 1,   electric: 1,   fighting: 1,   fire: 0.5, flying: 1,   ghost: 1,   grass: 2,   ground: 1,   ice: 2,   poison: 1,   steel: 2,   water: 0.5 },
  water:    { dark: 1,   electric: 1,   fighting: 1,   fire: 2,   flying: 1,   ghost: 1,   grass: 0.5, ground: 2,   ice: 1,   poison: 1,   steel: 1,   water: 0.5 },
  grass:    { dark: 1,   electric: 1,   fighting: 1,   fire: 0.5, flying: 0.5, ghost: 1,   grass: 0.5, ground: 2,   ice: 1,   poison: 0.5, steel: 0.5, water: 2 },
  electric: { dark: 1,   electric: 0.5, fighting: 1,   fire: 1,   flying: 2,   ghost: 1,   grass: 0.5, ground: 0,   ice: 1,   poison: 1,   steel: 1,   water: 2 },
  ice:      { dark: 1,   electric: 1,   fighting: 1,   fire: 0.5, flying: 2,   ghost: 1,   grass: 2,   ground: 2,   ice: 0.5, poison: 1,   steel: 0.5, water: 0.5 },
  fighting: { dark: 2,   electric: 1,   fighting: 1,   fire: 1,   flying: 0.5, ghost: 0,   grass: 1,   ground: 1,   ice: 2,   poison: 0.5, steel: 2,   water: 1 },
  poison:   { dark: 1,   electric: 1,   fighting: 1,   fire: 1,   flying: 1,   ghost: 0.5, grass: 2,   ground: 0.5, ice: 1,   poison: 0.5, steel: 0,   water: 1 },
  ground:   { dark: 1,   electric: 2,   fighting: 1,   fire: 2,   flying: 0,   ghost: 1,   grass: 0.5, ground: 1,   ice: 1,   poison: 2,   steel: 2,   water: 1 },
  flying:   { dark: 1,   electric: 0.5, fighting: 2,   fire: 1,   flying: 1,   ghost: 1,   grass: 2,   ground: 1,   ice: 1,   poison: 1,   steel: 0.5, water: 1 },
  ghost:    { dark: 0.5, electric: 1,   fighting: 1,   fire: 1,   flying: 1,   ghost: 2,   grass: 1,   ground: 1,   ice: 1,   poison: 1,   steel: 1,   water: 1 },
  steel:    { dark: 1,   electric: 0.5, fighting: 1,   fire: 0.5, flying: 1,   ghost: 1,   grass: 1,   ground: 1,   ice: 2,   poison: 1,   steel: 0.5, water: 0.5 },
  dark:     { dark: 0.5, electric: 1,   fighting: 0.5, fire: 1,   flying: 1,   ghost: 2,   grass: 1,   ground: 1,   ice: 1,   poison: 1,   steel: 1,   water: 1 },
};

// =================== AFINIDADES DE CLASSE ===================

export const CLASS_ELEMENT_AFFINITY: Record<ClassType, { primary: ElementType; affinities: ElementType[] }> = {
  guerreiro:  { primary: 'fire',     affinities: ['fire', 'fighting', 'steel'] },
  arqueiro:   { primary: 'flying',   affinities: ['flying', 'grass', 'ice'] },
  mago:       { primary: 'electric', affinities: ['electric', 'ice', 'ghost'] },
  assassino:  { primary: 'dark',     affinities: ['dark', 'poison', 'ghost'] },
  monge:      { primary: 'fighting', affinities: ['fighting', 'ground', 'electric'] },
  paladino:   { primary: 'steel',    affinities: ['steel', 'fire', 'electric'] },
  curandeiro: { primary: 'grass',    affinities: ['grass', 'water', 'electric'] },
  invocador:  { primary: 'ghost',    affinities: ['ghost', 'dark', 'poison'] },
  samurai:    { primary: 'dark',     affinities: ['dark', 'steel', 'fire'] },
  bardo:      { primary: 'electric', affinities: ['electric', 'flying', 'dark'] },
  lanceiro:   { primary: 'steel',    affinities: ['steel', 'flying', 'ice'] },
  alquimista: { primary: 'poison',   affinities: ['poison', 'ground', 'water'] },
};

// Bônus de afinidade: primary = +10%, demais affinities = +5%
export const AFFINITY_BONUS_PRIMARY = 0.10;
export const AFFINITY_BONUS_SECONDARY = 0.05;

// =================== ATRIBUTOS POR CLASSE ===================

export const CLASS_ATTRIBUTES: Record<ClassType, { primary: AttributeType; secondary: AttributeType; tertiary: AttributeType }> = {
  guerreiro:  { primary: 'forca',         secondary: 'resistencia', tertiary: 'agilidade' },
  arqueiro:   { primary: 'destreza',      secondary: 'agilidade',   tertiary: 'forca' },
  mago:       { primary: 'inteligencia',  secondary: 'carisma',     tertiary: 'agilidade' },
  assassino:  { primary: 'agilidade',     secondary: 'destreza',    tertiary: 'forca' },
  monge:      { primary: 'forca',         secondary: 'agilidade',   tertiary: 'resistencia' },
  paladino:   { primary: 'forca',         secondary: 'carisma',     tertiary: 'resistencia' },
  curandeiro: { primary: 'carisma',       secondary: 'resistencia', tertiary: 'inteligencia' },
  invocador:  { primary: 'inteligencia',  secondary: 'carisma',     tertiary: 'resistencia' },
  samurai:    { primary: 'forca',         secondary: 'destreza',    tertiary: 'agilidade' },
  bardo:      { primary: 'carisma',       secondary: 'destreza',    tertiary: 'agilidade' },
  lanceiro:   { primary: 'destreza',      secondary: 'forca',       tertiary: 'agilidade' },
  alquimista: { primary: 'inteligencia',  secondary: 'resistencia', tertiary: 'carisma' },
};

// =================== EVOLUÇÕES POR ATRIBUTO ===================
// Cada classe tem evoluções em 6 atributos × 3 marcos (30/60/90 pontos)
// Total potencial: 18 evoluções por classe
export const EVOLUTION_THRESHOLDS = [30, 60, 90];

// =================== SKILLS REGISTRY ===================

export const SKILLS_REGISTRY: Skill[] = [
  {
    "id": "fire_slot1",
    "element": "fire",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_1"
      },
      "arqueiro": {
        "name": "Flecha Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_1"
      },
      "mago": {
        "name": "Esfera Flamejante",
        "description": "Causa 25 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_1"
      },
      "assassino": {
        "name": "Punhalada Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_1"
      },
      "monge": {
        "name": "Palma Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_1"
      },
      "curandeiro": {
        "name": "Brisa Flamejante",
        "description": "Causa 25 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_1"
      },
      "invocador": {
        "name": "Invocação Flamejante",
        "description": "Causa 25 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_1"
      },
      "samurai": {
        "name": "Corte Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_1"
      },
      "bardo": {
        "name": "Acorde Flamejante",
        "description": "Causa 25 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_1"
      },
      "lanceiro": {
        "name": "Estocada Flamejante",
        "description": "Causa 25 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_1"
      },
      "alquimista": {
        "name": "Frasco Flamejante",
        "description": "Causa 25 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_1"
      }
    }
  },
  {
    "id": "fire_slot2",
    "element": "fire",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_2"
      },
      "arqueiro": {
        "name": "Salto Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_2"
      },
      "mago": {
        "name": "Barreira Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_2"
      },
      "assassino": {
        "name": "Véu Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_2"
      },
      "monge": {
        "name": "Postura Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_2"
      },
      "paladino": {
        "name": "Escudo Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_2"
      },
      "curandeiro": {
        "name": "Bênção Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_2"
      },
      "invocador": {
        "name": "Selo Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_2"
      },
      "samurai": {
        "name": "Iaijutsu Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_2"
      },
      "bardo": {
        "name": "Acalanto Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_2"
      },
      "lanceiro": {
        "name": "Reverso Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_2"
      },
      "alquimista": {
        "name": "Vapor Flamejante",
        "description": "Concede 15 de escudo flamejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_2"
      }
    }
  },
  {
    "id": "fire_slot3",
    "element": "fire",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_3"
      },
      "arqueiro": {
        "name": "Mira Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_3"
      },
      "mago": {
        "name": "Selo Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_3"
      },
      "assassino": {
        "name": "Brasão Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_3"
      },
      "monge": {
        "name": "Tatuagem Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_3"
      },
      "paladino": {
        "name": "Sinal Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_3"
      },
      "invocador": {
        "name": "Maldição Leve Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_3"
      },
      "samurai": {
        "name": "Selo Ronin Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_3"
      },
      "bardo": {
        "name": "Ressonância Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_3"
      },
      "alquimista": {
        "name": "Tinta Flamejante",
        "description": "15% de chance de aplicar efeito flamejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "fire_slot4",
    "element": "fire",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "fire_slot1",
      "fire_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_4"
      },
      "arqueiro": {
        "name": "Disparo Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_4"
      },
      "mago": {
        "name": "Bola Flamejante",
        "description": "Causa 45 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_4"
      },
      "assassino": {
        "name": "Espinho Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_4"
      },
      "monge": {
        "name": "Punho Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_4"
      },
      "paladino": {
        "name": "Julgamento Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_4"
      },
      "curandeiro": {
        "name": "Bálsamo Flamejante",
        "description": "Causa 45 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_4"
      },
      "invocador": {
        "name": "Manifestação Flamejante",
        "description": "Causa 45 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_4"
      },
      "samurai": {
        "name": "Lâmina Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_4"
      },
      "bardo": {
        "name": "Melodia Flamejante",
        "description": "Causa 45 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_4"
      },
      "lanceiro": {
        "name": "Perfuração Flamejante",
        "description": "Causa 45 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_4"
      },
      "alquimista": {
        "name": "Poção Flamejante",
        "description": "Causa 45 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_4"
      }
    }
  },
  {
    "id": "fire_slot5",
    "element": "fire",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "fire_slot1",
      "fire_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_5"
      },
      "arqueiro": {
        "name": "Tiro Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_5"
      },
      "mago": {
        "name": "Vortex Flamejante",
        "description": "Atinge todos com 35 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_5"
      },
      "assassino": {
        "name": "Golpe Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_5"
      },
      "monge": {
        "name": "Foco Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_5"
      },
      "paladino": {
        "name": "Cetro Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_5"
      },
      "curandeiro": {
        "name": "Aura Flamejante",
        "description": "Atinge todos com 35 de dano mágico flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_5"
      },
      "invocador": {
        "name": "Sombra Flamejante",
        "description": "Atinge todos com 35 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_5"
      },
      "samurai": {
        "name": "Fenda Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_5"
      },
      "bardo": {
        "name": "Verso Flamejante",
        "description": "Atinge todos com 35 de dano mágico flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_5"
      },
      "lanceiro": {
        "name": "Salto Flamejante",
        "description": "Atinge todos com 35 de dano físico flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_5"
      },
      "alquimista": {
        "name": "Bomba Flamejante",
        "description": "Atinge todos com 35 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_5"
      }
    }
  },
  {
    "id": "fire_slot6",
    "element": "fire",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "fire_slot1",
      "fire_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_6"
      },
      "arqueiro": {
        "name": "Foco Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_6"
      },
      "mago": {
        "name": "Combustão Mental Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_6"
      },
      "assassino": {
        "name": "Espreita Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_6"
      },
      "monge": {
        "name": "Zen Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_6"
      },
      "paladino": {
        "name": "Voto Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_6"
      },
      "curandeiro": {
        "name": "Vibração Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_6"
      },
      "invocador": {
        "name": "Pacto Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_6"
      },
      "samurai": {
        "name": "Bushido Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_6"
      },
      "bardo": {
        "name": "Embalo Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_6"
      },
      "lanceiro": {
        "name": "Postura Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_6"
      },
      "alquimista": {
        "name": "Frasco Flamejante",
        "description": "Aumenta seu próprio dano flamejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_6"
      }
    }
  },
  {
    "id": "fire_slot7",
    "element": "fire",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "fire_slot4",
      "fire_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_7"
      },
      "arqueiro": {
        "name": "Ponta de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_7"
      },
      "mago": {
        "name": "Raio de Chama",
        "description": "Ataque devastador. 75 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_7"
      },
      "assassino": {
        "name": "Lâmina de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_7"
      },
      "monge": {
        "name": "Kata de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_7"
      },
      "paladino": {
        "name": "Aura de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_7"
      },
      "curandeiro": {
        "name": "Prece de Chama",
        "description": "Ataque devastador. 75 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_7"
      },
      "invocador": {
        "name": "Selo de Chama",
        "description": "Ataque devastador. 75 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_7"
      },
      "samurai": {
        "name": "Iai de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_7"
      },
      "bardo": {
        "name": "Ressonância de Chama",
        "description": "Ataque devastador. 75 de dano mágico flamejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_7"
      },
      "lanceiro": {
        "name": "Lança de Chama",
        "description": "Ataque devastador. 75 de dano físico flamejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_7"
      },
      "alquimista": {
        "name": "Mistura de Chama",
        "description": "Ataque devastador. 75 de dano mágico flamejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_7"
      }
    }
  },
  {
    "id": "fire_slot8",
    "element": "fire",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "fire_slot4",
      "fire_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_8"
      },
      "arqueiro": {
        "name": "Veneno Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_8"
      },
      "mago": {
        "name": "Maldição Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_8"
      },
      "assassino": {
        "name": "Selo Letal Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_8"
      },
      "monge": {
        "name": "Marca de Chi Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_8"
      },
      "paladino": {
        "name": "Estigma Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_8"
      },
      "curandeiro": {
        "name": "Pacto Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_8"
      },
      "invocador": {
        "name": "Maldição Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_8"
      },
      "samurai": {
        "name": "Honra Manchada Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_8"
      },
      "bardo": {
        "name": "Dissonância Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_8"
      },
      "lanceiro": {
        "name": "Cravo Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_8"
      },
      "alquimista": {
        "name": "Toxina Flamejante",
        "description": "40% de chance de aplicar efeito flamejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "fire_slot9",
    "element": "fire",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "fire_slot4",
      "fire_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_9"
      },
      "arqueiro": {
        "name": "Bálsamo Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_9"
      },
      "mago": {
        "name": "Recuperação Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_9"
      },
      "assassino": {
        "name": "Recuo Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_9"
      },
      "monge": {
        "name": "Meditação Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_9"
      },
      "paladino": {
        "name": "Bênção Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_9"
      },
      "curandeiro": {
        "name": "Cura Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_9"
      },
      "invocador": {
        "name": "Sucção Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_9"
      },
      "samurai": {
        "name": "Restauro Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_9"
      },
      "bardo": {
        "name": "Cantiga Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_9"
      },
      "lanceiro": {
        "name": "Sopro Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_9"
      },
      "alquimista": {
        "name": "Elixir Flamejante",
        "description": "Recupera 50 de HP usando energia flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_9"
      }
    }
  },
  {
    "id": "fire_slot10",
    "element": "fire",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "fire_slot7",
      "fire_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_10"
      },
      "arqueiro": {
        "name": "Trinca Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_10"
      },
      "mago": {
        "name": "Tríplice Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_10"
      },
      "assassino": {
        "name": "Tríade Letal Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_10"
      },
      "monge": {
        "name": "Trindade Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_10"
      },
      "invocador": {
        "name": "Tríade Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_10"
      },
      "samurai": {
        "name": "Tríplice Corte Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_10"
      },
      "bardo": {
        "name": "Acorde Triplo Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Flamejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_10"
      }
    }
  },
  {
    "id": "fire_slot11",
    "element": "fire",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "fire_slot7",
      "fire_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_11"
      },
      "arqueiro": {
        "name": "Imobilização Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_11"
      },
      "mago": {
        "name": "Petrificação Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_11"
      },
      "assassino": {
        "name": "Paralisia Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_11"
      },
      "monge": {
        "name": "Pressão de Chi Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_11"
      },
      "invocador": {
        "name": "Aprisionamento Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_11"
      },
      "samurai": {
        "name": "Iai Paralisante Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico flamejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_11"
      },
      "lanceiro": {
        "name": "Cravamento Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico flamejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Flamejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico flamejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "fire_slot12",
    "element": "fire",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "fire_slot10",
      "fire_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_12"
      },
      "arqueiro": {
        "name": "Chuva de Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_12"
      },
      "mago": {
        "name": "Apocalipse Inferno",
        "description": "Habilidade definitiva. 150 de dano mágico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_12"
      },
      "assassino": {
        "name": "Execução Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_12"
      },
      "monge": {
        "name": "Despertar do Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_12"
      },
      "paladino": {
        "name": "Julgamento Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_12"
      },
      "curandeiro": {
        "name": "Bênção do Inferno",
        "description": "Habilidade definitiva. 150 de dano mágico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_12"
      },
      "invocador": {
        "name": "Manifestação Inferno",
        "description": "Habilidade definitiva. 150 de dano mágico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_12"
      },
      "samurai": {
        "name": "Bushido Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_12"
      },
      "bardo": {
        "name": "Sinfonia Inferno",
        "description": "Habilidade definitiva. 150 de dano mágico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_12"
      },
      "lanceiro": {
        "name": "Lança Mística Inferno",
        "description": "Habilidade definitiva. 150 de dano físico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_12"
      },
      "alquimista": {
        "name": "Transmutação Inferno",
        "description": "Habilidade definitiva. 150 de dano mágico flamejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_12"
      }
    }
  },
  {
    "id": "fire_slot13",
    "element": "fire",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "fire_slot10",
      "fire_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fire_13"
      },
      "arqueiro": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fire_13"
      },
      "mago": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fire_13"
      },
      "assassino": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fire_13"
      },
      "monge": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fire_13"
      },
      "paladino": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fire_13"
      },
      "curandeiro": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fire_13"
      },
      "invocador": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fire_13"
      },
      "samurai": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fire_13"
      },
      "bardo": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fire_13"
      },
      "lanceiro": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fire_13"
      },
      "alquimista": {
        "name": "Coração de Magma",
        "description": "PASSIVA: +15% dano flamejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fire_13"
      }
    }
  },
  {
    "id": "water_slot1",
    "element": "water",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_1"
      },
      "arqueiro": {
        "name": "Flecha Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_1"
      },
      "mago": {
        "name": "Esfera Aquático",
        "description": "Causa 25 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_1"
      },
      "assassino": {
        "name": "Punhalada Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_1"
      },
      "monge": {
        "name": "Palma Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_1"
      },
      "curandeiro": {
        "name": "Brisa Aquático",
        "description": "Causa 25 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_1"
      },
      "invocador": {
        "name": "Invocação Aquático",
        "description": "Causa 25 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_1"
      },
      "samurai": {
        "name": "Corte Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_1"
      },
      "bardo": {
        "name": "Acorde Aquático",
        "description": "Causa 25 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_1"
      },
      "lanceiro": {
        "name": "Estocada Aquático",
        "description": "Causa 25 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_1"
      },
      "alquimista": {
        "name": "Frasco Aquático",
        "description": "Causa 25 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_1"
      }
    }
  },
  {
    "id": "water_slot2",
    "element": "water",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_2"
      },
      "arqueiro": {
        "name": "Salto Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_2"
      },
      "mago": {
        "name": "Barreira Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_2"
      },
      "assassino": {
        "name": "Véu Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_2"
      },
      "monge": {
        "name": "Postura Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_2"
      },
      "paladino": {
        "name": "Escudo Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_2"
      },
      "curandeiro": {
        "name": "Bênção Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_2"
      },
      "invocador": {
        "name": "Selo Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_2"
      },
      "samurai": {
        "name": "Iaijutsu Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_2"
      },
      "bardo": {
        "name": "Acalanto Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_2"
      },
      "lanceiro": {
        "name": "Reverso Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_2"
      },
      "alquimista": {
        "name": "Vapor Aquático",
        "description": "Concede 15 de escudo aquático por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_2"
      }
    }
  },
  {
    "id": "water_slot3",
    "element": "water",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_3"
      },
      "arqueiro": {
        "name": "Mira Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_3"
      },
      "mago": {
        "name": "Selo Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_3"
      },
      "assassino": {
        "name": "Brasão Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_3"
      },
      "monge": {
        "name": "Tatuagem Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_3"
      },
      "paladino": {
        "name": "Sinal Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_3"
      },
      "invocador": {
        "name": "Maldição Leve Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_3"
      },
      "samurai": {
        "name": "Selo Ronin Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_3"
      },
      "bardo": {
        "name": "Ressonância Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_3"
      },
      "alquimista": {
        "name": "Tinta Aquático",
        "description": "15% de chance de aplicar efeito aquático (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "water_slot4",
    "element": "water",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "water_slot1",
      "water_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_4"
      },
      "arqueiro": {
        "name": "Disparo Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_4"
      },
      "mago": {
        "name": "Bola Aquático",
        "description": "Causa 45 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_4"
      },
      "assassino": {
        "name": "Espinho Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_4"
      },
      "monge": {
        "name": "Punho Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_4"
      },
      "paladino": {
        "name": "Julgamento Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_4"
      },
      "curandeiro": {
        "name": "Bálsamo Aquático",
        "description": "Causa 45 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_4"
      },
      "invocador": {
        "name": "Manifestação Aquático",
        "description": "Causa 45 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_4"
      },
      "samurai": {
        "name": "Lâmina Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_4"
      },
      "bardo": {
        "name": "Melodia Aquático",
        "description": "Causa 45 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_4"
      },
      "lanceiro": {
        "name": "Perfuração Aquático",
        "description": "Causa 45 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_4"
      },
      "alquimista": {
        "name": "Poção Aquático",
        "description": "Causa 45 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_4"
      }
    }
  },
  {
    "id": "water_slot5",
    "element": "water",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "water_slot1",
      "water_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_5"
      },
      "arqueiro": {
        "name": "Tiro Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_5"
      },
      "mago": {
        "name": "Vortex Aquático",
        "description": "Atinge todos com 35 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_5"
      },
      "assassino": {
        "name": "Golpe Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_5"
      },
      "monge": {
        "name": "Foco Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_5"
      },
      "paladino": {
        "name": "Cetro Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_5"
      },
      "curandeiro": {
        "name": "Aura Aquático",
        "description": "Atinge todos com 35 de dano mágico aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_5"
      },
      "invocador": {
        "name": "Sombra Aquático",
        "description": "Atinge todos com 35 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_5"
      },
      "samurai": {
        "name": "Fenda Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_5"
      },
      "bardo": {
        "name": "Verso Aquático",
        "description": "Atinge todos com 35 de dano mágico aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_5"
      },
      "lanceiro": {
        "name": "Salto Aquático",
        "description": "Atinge todos com 35 de dano físico aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_5"
      },
      "alquimista": {
        "name": "Bomba Aquático",
        "description": "Atinge todos com 35 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_5"
      }
    }
  },
  {
    "id": "water_slot6",
    "element": "water",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "water_slot1",
      "water_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_6"
      },
      "arqueiro": {
        "name": "Foco Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_6"
      },
      "mago": {
        "name": "Combustão Mental Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_6"
      },
      "assassino": {
        "name": "Espreita Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_6"
      },
      "monge": {
        "name": "Zen Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_6"
      },
      "paladino": {
        "name": "Voto Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_6"
      },
      "curandeiro": {
        "name": "Vibração Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_6"
      },
      "invocador": {
        "name": "Pacto Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_6"
      },
      "samurai": {
        "name": "Bushido Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_6"
      },
      "bardo": {
        "name": "Embalo Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_6"
      },
      "lanceiro": {
        "name": "Postura Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_6"
      },
      "alquimista": {
        "name": "Frasco Aquático",
        "description": "Aumenta seu próprio dano aquático em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_6"
      }
    }
  },
  {
    "id": "water_slot7",
    "element": "water",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "water_slot4",
      "water_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_7"
      },
      "arqueiro": {
        "name": "Ponta de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_7"
      },
      "mago": {
        "name": "Raio de Onda",
        "description": "Ataque devastador. 75 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_7"
      },
      "assassino": {
        "name": "Lâmina de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_7"
      },
      "monge": {
        "name": "Kata de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_7"
      },
      "paladino": {
        "name": "Aura de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_7"
      },
      "curandeiro": {
        "name": "Prece de Onda",
        "description": "Ataque devastador. 75 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_7"
      },
      "invocador": {
        "name": "Selo de Onda",
        "description": "Ataque devastador. 75 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_7"
      },
      "samurai": {
        "name": "Iai de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_7"
      },
      "bardo": {
        "name": "Ressonância de Onda",
        "description": "Ataque devastador. 75 de dano mágico aquático. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_7"
      },
      "lanceiro": {
        "name": "Lança de Onda",
        "description": "Ataque devastador. 75 de dano físico aquático. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_7"
      },
      "alquimista": {
        "name": "Mistura de Onda",
        "description": "Ataque devastador. 75 de dano mágico aquático. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_7"
      }
    }
  },
  {
    "id": "water_slot8",
    "element": "water",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "water_slot4",
      "water_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_8"
      },
      "arqueiro": {
        "name": "Veneno Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_8"
      },
      "mago": {
        "name": "Maldição Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_8"
      },
      "assassino": {
        "name": "Selo Letal Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_8"
      },
      "monge": {
        "name": "Marca de Chi Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_8"
      },
      "paladino": {
        "name": "Estigma Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_8"
      },
      "curandeiro": {
        "name": "Pacto Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_8"
      },
      "invocador": {
        "name": "Maldição Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_8"
      },
      "samurai": {
        "name": "Honra Manchada Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_8"
      },
      "bardo": {
        "name": "Dissonância Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_8"
      },
      "lanceiro": {
        "name": "Cravo Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_8"
      },
      "alquimista": {
        "name": "Toxina Aquático",
        "description": "40% de chance de aplicar efeito aquático forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "water_slot9",
    "element": "water",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "water_slot4",
      "water_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_9"
      },
      "arqueiro": {
        "name": "Bálsamo Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_9"
      },
      "mago": {
        "name": "Recuperação Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_9"
      },
      "assassino": {
        "name": "Recuo Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_9"
      },
      "monge": {
        "name": "Meditação Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_9"
      },
      "paladino": {
        "name": "Bênção Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_9"
      },
      "curandeiro": {
        "name": "Cura Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_9"
      },
      "invocador": {
        "name": "Sucção Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_9"
      },
      "samurai": {
        "name": "Restauro Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_9"
      },
      "bardo": {
        "name": "Cantiga Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_9"
      },
      "lanceiro": {
        "name": "Sopro Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_9"
      },
      "alquimista": {
        "name": "Elixir Aquático",
        "description": "Recupera 50 de HP usando energia aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_9"
      }
    }
  },
  {
    "id": "water_slot10",
    "element": "water",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "water_slot7",
      "water_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_10"
      },
      "arqueiro": {
        "name": "Trinca Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_10"
      },
      "mago": {
        "name": "Tríplice Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_10"
      },
      "assassino": {
        "name": "Tríade Letal Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_10"
      },
      "monge": {
        "name": "Trindade Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_10"
      },
      "invocador": {
        "name": "Tríade Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_10"
      },
      "samurai": {
        "name": "Tríplice Corte Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_10"
      },
      "bardo": {
        "name": "Acorde Triplo Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Aquático",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_10"
      }
    }
  },
  {
    "id": "water_slot11",
    "element": "water",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "water_slot7",
      "water_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_11"
      },
      "arqueiro": {
        "name": "Imobilização Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_11"
      },
      "mago": {
        "name": "Petrificação Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_11"
      },
      "assassino": {
        "name": "Paralisia Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_11"
      },
      "monge": {
        "name": "Pressão de Chi Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_11"
      },
      "invocador": {
        "name": "Aprisionamento Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_11"
      },
      "samurai": {
        "name": "Iai Paralisante Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aquático.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_11"
      },
      "lanceiro": {
        "name": "Cravamento Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aquático.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Aquático",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aquático.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "water_slot12",
    "element": "water",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "water_slot10",
      "water_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_12"
      },
      "arqueiro": {
        "name": "Chuva de Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_12"
      },
      "mago": {
        "name": "Apocalipse Maremoto",
        "description": "Habilidade definitiva. 150 de dano mágico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_12"
      },
      "assassino": {
        "name": "Execução Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_12"
      },
      "monge": {
        "name": "Despertar do Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_12"
      },
      "paladino": {
        "name": "Julgamento Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_12"
      },
      "curandeiro": {
        "name": "Bênção do Maremoto",
        "description": "Habilidade definitiva. 150 de dano mágico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_12"
      },
      "invocador": {
        "name": "Manifestação Maremoto",
        "description": "Habilidade definitiva. 150 de dano mágico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_12"
      },
      "samurai": {
        "name": "Bushido Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_12"
      },
      "bardo": {
        "name": "Sinfonia Maremoto",
        "description": "Habilidade definitiva. 150 de dano mágico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_12"
      },
      "lanceiro": {
        "name": "Lança Mística Maremoto",
        "description": "Habilidade definitiva. 150 de dano físico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_12"
      },
      "alquimista": {
        "name": "Transmutação Maremoto",
        "description": "Habilidade definitiva. 150 de dano mágico aquático. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_12"
      }
    }
  },
  {
    "id": "water_slot13",
    "element": "water",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "water_slot10",
      "water_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_water_13"
      },
      "arqueiro": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_water_13"
      },
      "mago": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_water_13"
      },
      "assassino": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_water_13"
      },
      "monge": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_water_13"
      },
      "paladino": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_water_13"
      },
      "curandeiro": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_water_13"
      },
      "invocador": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_water_13"
      },
      "samurai": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_water_13"
      },
      "bardo": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_water_13"
      },
      "lanceiro": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_water_13"
      },
      "alquimista": {
        "name": "Sangue Fluido",
        "description": "PASSIVA: +15% dano aquático, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_water_13"
      }
    }
  },
  {
    "id": "grass_slot1",
    "element": "grass",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_1"
      },
      "arqueiro": {
        "name": "Flecha Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_1"
      },
      "mago": {
        "name": "Esfera Verdejante",
        "description": "Causa 25 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_1"
      },
      "assassino": {
        "name": "Punhalada Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_1"
      },
      "monge": {
        "name": "Palma Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_1"
      },
      "curandeiro": {
        "name": "Brisa Verdejante",
        "description": "Causa 25 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_1"
      },
      "invocador": {
        "name": "Invocação Verdejante",
        "description": "Causa 25 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_1"
      },
      "samurai": {
        "name": "Corte Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_1"
      },
      "bardo": {
        "name": "Acorde Verdejante",
        "description": "Causa 25 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_1"
      },
      "lanceiro": {
        "name": "Estocada Verdejante",
        "description": "Causa 25 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_1"
      },
      "alquimista": {
        "name": "Frasco Verdejante",
        "description": "Causa 25 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_1"
      }
    }
  },
  {
    "id": "grass_slot2",
    "element": "grass",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_2"
      },
      "arqueiro": {
        "name": "Salto Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_2"
      },
      "mago": {
        "name": "Barreira Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_2"
      },
      "assassino": {
        "name": "Véu Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_2"
      },
      "monge": {
        "name": "Postura Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_2"
      },
      "paladino": {
        "name": "Escudo Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_2"
      },
      "curandeiro": {
        "name": "Bênção Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_2"
      },
      "invocador": {
        "name": "Selo Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_2"
      },
      "samurai": {
        "name": "Iaijutsu Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_2"
      },
      "bardo": {
        "name": "Acalanto Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_2"
      },
      "lanceiro": {
        "name": "Reverso Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_2"
      },
      "alquimista": {
        "name": "Vapor Verdejante",
        "description": "Concede 15 de escudo verdejante por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_2"
      }
    }
  },
  {
    "id": "grass_slot3",
    "element": "grass",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_3"
      },
      "arqueiro": {
        "name": "Mira Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_3"
      },
      "mago": {
        "name": "Selo Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_3"
      },
      "assassino": {
        "name": "Brasão Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_3"
      },
      "monge": {
        "name": "Tatuagem Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_3"
      },
      "paladino": {
        "name": "Sinal Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_3"
      },
      "invocador": {
        "name": "Maldição Leve Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_3"
      },
      "samurai": {
        "name": "Selo Ronin Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_3"
      },
      "bardo": {
        "name": "Ressonância Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_3"
      },
      "alquimista": {
        "name": "Tinta Verdejante",
        "description": "15% de chance de aplicar efeito verdejante (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "grass_slot4",
    "element": "grass",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "grass_slot1",
      "grass_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_4"
      },
      "arqueiro": {
        "name": "Disparo Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_4"
      },
      "mago": {
        "name": "Bola Verdejante",
        "description": "Causa 45 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_4"
      },
      "assassino": {
        "name": "Espinho Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_4"
      },
      "monge": {
        "name": "Punho Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_4"
      },
      "paladino": {
        "name": "Julgamento Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_4"
      },
      "curandeiro": {
        "name": "Bálsamo Verdejante",
        "description": "Causa 45 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_4"
      },
      "invocador": {
        "name": "Manifestação Verdejante",
        "description": "Causa 45 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_4"
      },
      "samurai": {
        "name": "Lâmina Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_4"
      },
      "bardo": {
        "name": "Melodia Verdejante",
        "description": "Causa 45 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_4"
      },
      "lanceiro": {
        "name": "Perfuração Verdejante",
        "description": "Causa 45 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_4"
      },
      "alquimista": {
        "name": "Poção Verdejante",
        "description": "Causa 45 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_4"
      }
    }
  },
  {
    "id": "grass_slot5",
    "element": "grass",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "grass_slot1",
      "grass_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_5"
      },
      "arqueiro": {
        "name": "Tiro Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_5"
      },
      "mago": {
        "name": "Vortex Verdejante",
        "description": "Atinge todos com 35 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_5"
      },
      "assassino": {
        "name": "Golpe Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_5"
      },
      "monge": {
        "name": "Foco Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_5"
      },
      "paladino": {
        "name": "Cetro Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_5"
      },
      "curandeiro": {
        "name": "Aura Verdejante",
        "description": "Atinge todos com 35 de dano mágico verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_5"
      },
      "invocador": {
        "name": "Sombra Verdejante",
        "description": "Atinge todos com 35 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_5"
      },
      "samurai": {
        "name": "Fenda Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_5"
      },
      "bardo": {
        "name": "Verso Verdejante",
        "description": "Atinge todos com 35 de dano mágico verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_5"
      },
      "lanceiro": {
        "name": "Salto Verdejante",
        "description": "Atinge todos com 35 de dano físico verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_5"
      },
      "alquimista": {
        "name": "Bomba Verdejante",
        "description": "Atinge todos com 35 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_5"
      }
    }
  },
  {
    "id": "grass_slot6",
    "element": "grass",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "grass_slot1",
      "grass_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_6"
      },
      "arqueiro": {
        "name": "Foco Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_6"
      },
      "mago": {
        "name": "Combustão Mental Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_6"
      },
      "assassino": {
        "name": "Espreita Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_6"
      },
      "monge": {
        "name": "Zen Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_6"
      },
      "paladino": {
        "name": "Voto Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_6"
      },
      "curandeiro": {
        "name": "Vibração Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_6"
      },
      "invocador": {
        "name": "Pacto Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_6"
      },
      "samurai": {
        "name": "Bushido Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_6"
      },
      "bardo": {
        "name": "Embalo Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_6"
      },
      "lanceiro": {
        "name": "Postura Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_6"
      },
      "alquimista": {
        "name": "Frasco Verdejante",
        "description": "Aumenta seu próprio dano verdejante em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_6"
      }
    }
  },
  {
    "id": "grass_slot7",
    "element": "grass",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "grass_slot4",
      "grass_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_7"
      },
      "arqueiro": {
        "name": "Ponta de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_7"
      },
      "mago": {
        "name": "Raio de Espinho",
        "description": "Ataque devastador. 75 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_7"
      },
      "assassino": {
        "name": "Lâmina de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_7"
      },
      "monge": {
        "name": "Kata de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_7"
      },
      "paladino": {
        "name": "Aura de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_7"
      },
      "curandeiro": {
        "name": "Prece de Espinho",
        "description": "Ataque devastador. 75 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_7"
      },
      "invocador": {
        "name": "Selo de Espinho",
        "description": "Ataque devastador. 75 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_7"
      },
      "samurai": {
        "name": "Iai de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_7"
      },
      "bardo": {
        "name": "Ressonância de Espinho",
        "description": "Ataque devastador. 75 de dano mágico verdejante. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_7"
      },
      "lanceiro": {
        "name": "Lança de Espinho",
        "description": "Ataque devastador. 75 de dano físico verdejante. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_7"
      },
      "alquimista": {
        "name": "Mistura de Espinho",
        "description": "Ataque devastador. 75 de dano mágico verdejante. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_7"
      }
    }
  },
  {
    "id": "grass_slot8",
    "element": "grass",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "grass_slot4",
      "grass_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_8"
      },
      "arqueiro": {
        "name": "Veneno Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_8"
      },
      "mago": {
        "name": "Maldição Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_8"
      },
      "assassino": {
        "name": "Selo Letal Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_8"
      },
      "monge": {
        "name": "Marca de Chi Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_8"
      },
      "paladino": {
        "name": "Estigma Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_8"
      },
      "curandeiro": {
        "name": "Pacto Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_8"
      },
      "invocador": {
        "name": "Maldição Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_8"
      },
      "samurai": {
        "name": "Honra Manchada Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_8"
      },
      "bardo": {
        "name": "Dissonância Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_8"
      },
      "lanceiro": {
        "name": "Cravo Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_8"
      },
      "alquimista": {
        "name": "Toxina Verdejante",
        "description": "40% de chance de aplicar efeito verdejante forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "grass_slot9",
    "element": "grass",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "grass_slot4",
      "grass_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_9"
      },
      "arqueiro": {
        "name": "Bálsamo Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_9"
      },
      "mago": {
        "name": "Recuperação Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_9"
      },
      "assassino": {
        "name": "Recuo Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_9"
      },
      "monge": {
        "name": "Meditação Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_9"
      },
      "paladino": {
        "name": "Bênção Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_9"
      },
      "curandeiro": {
        "name": "Cura Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_9"
      },
      "invocador": {
        "name": "Sucção Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_9"
      },
      "samurai": {
        "name": "Restauro Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_9"
      },
      "bardo": {
        "name": "Cantiga Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_9"
      },
      "lanceiro": {
        "name": "Sopro Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_9"
      },
      "alquimista": {
        "name": "Elixir Verdejante",
        "description": "Recupera 50 de HP usando energia verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_9"
      }
    }
  },
  {
    "id": "grass_slot10",
    "element": "grass",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "grass_slot7",
      "grass_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_10"
      },
      "arqueiro": {
        "name": "Trinca Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_10"
      },
      "mago": {
        "name": "Tríplice Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_10"
      },
      "assassino": {
        "name": "Tríade Letal Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_10"
      },
      "monge": {
        "name": "Trindade Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_10"
      },
      "invocador": {
        "name": "Tríade Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_10"
      },
      "samurai": {
        "name": "Tríplice Corte Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_10"
      },
      "bardo": {
        "name": "Acorde Triplo Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Verdejante",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_10"
      }
    }
  },
  {
    "id": "grass_slot11",
    "element": "grass",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "grass_slot7",
      "grass_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_11"
      },
      "arqueiro": {
        "name": "Imobilização Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_11"
      },
      "mago": {
        "name": "Petrificação Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_11"
      },
      "assassino": {
        "name": "Paralisia Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_11"
      },
      "monge": {
        "name": "Pressão de Chi Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_11"
      },
      "invocador": {
        "name": "Aprisionamento Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_11"
      },
      "samurai": {
        "name": "Iai Paralisante Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico verdejante.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_11"
      },
      "lanceiro": {
        "name": "Cravamento Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico verdejante.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Verdejante",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico verdejante.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "grass_slot12",
    "element": "grass",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "grass_slot10",
      "grass_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_12"
      },
      "arqueiro": {
        "name": "Chuva de Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_12"
      },
      "mago": {
        "name": "Apocalipse Floresta",
        "description": "Habilidade definitiva. 150 de dano mágico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_12"
      },
      "assassino": {
        "name": "Execução Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_12"
      },
      "monge": {
        "name": "Despertar do Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_12"
      },
      "paladino": {
        "name": "Julgamento Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_12"
      },
      "curandeiro": {
        "name": "Bênção do Floresta",
        "description": "Habilidade definitiva. 150 de dano mágico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_12"
      },
      "invocador": {
        "name": "Manifestação Floresta",
        "description": "Habilidade definitiva. 150 de dano mágico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_12"
      },
      "samurai": {
        "name": "Bushido Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_12"
      },
      "bardo": {
        "name": "Sinfonia Floresta",
        "description": "Habilidade definitiva. 150 de dano mágico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_12"
      },
      "lanceiro": {
        "name": "Lança Mística Floresta",
        "description": "Habilidade definitiva. 150 de dano físico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_12"
      },
      "alquimista": {
        "name": "Transmutação Floresta",
        "description": "Habilidade definitiva. 150 de dano mágico verdejante. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_12"
      }
    }
  },
  {
    "id": "grass_slot13",
    "element": "grass",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "grass_slot10",
      "grass_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_grass_13"
      },
      "arqueiro": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_grass_13"
      },
      "mago": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_grass_13"
      },
      "assassino": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_grass_13"
      },
      "monge": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_grass_13"
      },
      "paladino": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_grass_13"
      },
      "curandeiro": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_grass_13"
      },
      "invocador": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_grass_13"
      },
      "samurai": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_grass_13"
      },
      "bardo": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_grass_13"
      },
      "lanceiro": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_grass_13"
      },
      "alquimista": {
        "name": "Raízes Eternas",
        "description": "PASSIVA: +15% dano verdejante, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_grass_13"
      }
    }
  },
  {
    "id": "electric_slot1",
    "element": "electric",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_1"
      },
      "arqueiro": {
        "name": "Flecha Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_1"
      },
      "mago": {
        "name": "Esfera Elétrico",
        "description": "Causa 25 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_1"
      },
      "assassino": {
        "name": "Punhalada Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_1"
      },
      "monge": {
        "name": "Palma Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_1"
      },
      "curandeiro": {
        "name": "Brisa Elétrico",
        "description": "Causa 25 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_1"
      },
      "invocador": {
        "name": "Invocação Elétrico",
        "description": "Causa 25 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_1"
      },
      "samurai": {
        "name": "Corte Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_1"
      },
      "bardo": {
        "name": "Acorde Elétrico",
        "description": "Causa 25 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_1"
      },
      "lanceiro": {
        "name": "Estocada Elétrico",
        "description": "Causa 25 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_1"
      },
      "alquimista": {
        "name": "Frasco Elétrico",
        "description": "Causa 25 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_1"
      }
    }
  },
  {
    "id": "electric_slot2",
    "element": "electric",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_2"
      },
      "arqueiro": {
        "name": "Salto Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_2"
      },
      "mago": {
        "name": "Barreira Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_2"
      },
      "assassino": {
        "name": "Véu Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_2"
      },
      "monge": {
        "name": "Postura Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_2"
      },
      "paladino": {
        "name": "Escudo Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_2"
      },
      "curandeiro": {
        "name": "Bênção Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_2"
      },
      "invocador": {
        "name": "Selo Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_2"
      },
      "samurai": {
        "name": "Iaijutsu Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_2"
      },
      "bardo": {
        "name": "Acalanto Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_2"
      },
      "lanceiro": {
        "name": "Reverso Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_2"
      },
      "alquimista": {
        "name": "Vapor Elétrico",
        "description": "Concede 15 de escudo elétrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_2"
      }
    }
  },
  {
    "id": "electric_slot3",
    "element": "electric",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_3"
      },
      "arqueiro": {
        "name": "Mira Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_3"
      },
      "mago": {
        "name": "Selo Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_3"
      },
      "assassino": {
        "name": "Brasão Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_3"
      },
      "monge": {
        "name": "Tatuagem Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_3"
      },
      "paladino": {
        "name": "Sinal Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_3"
      },
      "invocador": {
        "name": "Maldição Leve Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_3"
      },
      "samurai": {
        "name": "Selo Ronin Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_3"
      },
      "bardo": {
        "name": "Ressonância Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_3"
      },
      "alquimista": {
        "name": "Tinta Elétrico",
        "description": "15% de chance de aplicar efeito elétrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "electric_slot4",
    "element": "electric",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "electric_slot1",
      "electric_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_4"
      },
      "arqueiro": {
        "name": "Disparo Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_4"
      },
      "mago": {
        "name": "Bola Elétrico",
        "description": "Causa 45 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_4"
      },
      "assassino": {
        "name": "Espinho Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_4"
      },
      "monge": {
        "name": "Punho Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_4"
      },
      "paladino": {
        "name": "Julgamento Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_4"
      },
      "curandeiro": {
        "name": "Bálsamo Elétrico",
        "description": "Causa 45 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_4"
      },
      "invocador": {
        "name": "Manifestação Elétrico",
        "description": "Causa 45 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_4"
      },
      "samurai": {
        "name": "Lâmina Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_4"
      },
      "bardo": {
        "name": "Melodia Elétrico",
        "description": "Causa 45 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_4"
      },
      "lanceiro": {
        "name": "Perfuração Elétrico",
        "description": "Causa 45 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_4"
      },
      "alquimista": {
        "name": "Poção Elétrico",
        "description": "Causa 45 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_4"
      }
    }
  },
  {
    "id": "electric_slot5",
    "element": "electric",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "electric_slot1",
      "electric_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_5"
      },
      "arqueiro": {
        "name": "Tiro Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_5"
      },
      "mago": {
        "name": "Vortex Elétrico",
        "description": "Atinge todos com 35 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_5"
      },
      "assassino": {
        "name": "Golpe Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_5"
      },
      "monge": {
        "name": "Foco Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_5"
      },
      "paladino": {
        "name": "Cetro Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_5"
      },
      "curandeiro": {
        "name": "Aura Elétrico",
        "description": "Atinge todos com 35 de dano mágico elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_5"
      },
      "invocador": {
        "name": "Sombra Elétrico",
        "description": "Atinge todos com 35 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_5"
      },
      "samurai": {
        "name": "Fenda Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_5"
      },
      "bardo": {
        "name": "Verso Elétrico",
        "description": "Atinge todos com 35 de dano mágico elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_5"
      },
      "lanceiro": {
        "name": "Salto Elétrico",
        "description": "Atinge todos com 35 de dano físico elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_5"
      },
      "alquimista": {
        "name": "Bomba Elétrico",
        "description": "Atinge todos com 35 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_5"
      }
    }
  },
  {
    "id": "electric_slot6",
    "element": "electric",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "electric_slot1",
      "electric_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_6"
      },
      "arqueiro": {
        "name": "Foco Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_6"
      },
      "mago": {
        "name": "Combustão Mental Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_6"
      },
      "assassino": {
        "name": "Espreita Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_6"
      },
      "monge": {
        "name": "Zen Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_6"
      },
      "paladino": {
        "name": "Voto Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_6"
      },
      "curandeiro": {
        "name": "Vibração Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_6"
      },
      "invocador": {
        "name": "Pacto Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_6"
      },
      "samurai": {
        "name": "Bushido Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_6"
      },
      "bardo": {
        "name": "Embalo Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_6"
      },
      "lanceiro": {
        "name": "Postura Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_6"
      },
      "alquimista": {
        "name": "Frasco Elétrico",
        "description": "Aumenta seu próprio dano elétrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_6"
      }
    }
  },
  {
    "id": "electric_slot7",
    "element": "electric",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "electric_slot4",
      "electric_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_7"
      },
      "arqueiro": {
        "name": "Ponta de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_7"
      },
      "mago": {
        "name": "Raio de Raio",
        "description": "Ataque devastador. 75 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_7"
      },
      "assassino": {
        "name": "Lâmina de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_7"
      },
      "monge": {
        "name": "Kata de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_7"
      },
      "paladino": {
        "name": "Aura de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_7"
      },
      "curandeiro": {
        "name": "Prece de Raio",
        "description": "Ataque devastador. 75 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_7"
      },
      "invocador": {
        "name": "Selo de Raio",
        "description": "Ataque devastador. 75 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_7"
      },
      "samurai": {
        "name": "Iai de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_7"
      },
      "bardo": {
        "name": "Ressonância de Raio",
        "description": "Ataque devastador. 75 de dano mágico elétrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_7"
      },
      "lanceiro": {
        "name": "Lança de Raio",
        "description": "Ataque devastador. 75 de dano físico elétrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_7"
      },
      "alquimista": {
        "name": "Mistura de Raio",
        "description": "Ataque devastador. 75 de dano mágico elétrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_7"
      }
    }
  },
  {
    "id": "electric_slot8",
    "element": "electric",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "electric_slot4",
      "electric_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_8"
      },
      "arqueiro": {
        "name": "Veneno Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_8"
      },
      "mago": {
        "name": "Maldição Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_8"
      },
      "assassino": {
        "name": "Selo Letal Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_8"
      },
      "monge": {
        "name": "Marca de Chi Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_8"
      },
      "paladino": {
        "name": "Estigma Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_8"
      },
      "curandeiro": {
        "name": "Pacto Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_8"
      },
      "invocador": {
        "name": "Maldição Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_8"
      },
      "samurai": {
        "name": "Honra Manchada Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_8"
      },
      "bardo": {
        "name": "Dissonância Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_8"
      },
      "lanceiro": {
        "name": "Cravo Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_8"
      },
      "alquimista": {
        "name": "Toxina Elétrico",
        "description": "40% de chance de aplicar efeito elétrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "electric_slot9",
    "element": "electric",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "electric_slot4",
      "electric_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_9"
      },
      "arqueiro": {
        "name": "Bálsamo Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_9"
      },
      "mago": {
        "name": "Recuperação Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_9"
      },
      "assassino": {
        "name": "Recuo Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_9"
      },
      "monge": {
        "name": "Meditação Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_9"
      },
      "paladino": {
        "name": "Bênção Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_9"
      },
      "curandeiro": {
        "name": "Cura Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_9"
      },
      "invocador": {
        "name": "Sucção Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_9"
      },
      "samurai": {
        "name": "Restauro Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_9"
      },
      "bardo": {
        "name": "Cantiga Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_9"
      },
      "lanceiro": {
        "name": "Sopro Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_9"
      },
      "alquimista": {
        "name": "Elixir Elétrico",
        "description": "Recupera 50 de HP usando energia elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_9"
      }
    }
  },
  {
    "id": "electric_slot10",
    "element": "electric",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "electric_slot7",
      "electric_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_10"
      },
      "arqueiro": {
        "name": "Trinca Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_10"
      },
      "mago": {
        "name": "Tríplice Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_10"
      },
      "assassino": {
        "name": "Tríade Letal Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_10"
      },
      "monge": {
        "name": "Trindade Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_10"
      },
      "invocador": {
        "name": "Tríade Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_10"
      },
      "samurai": {
        "name": "Tríplice Corte Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_10"
      },
      "bardo": {
        "name": "Acorde Triplo Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Elétrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_10"
      }
    }
  },
  {
    "id": "electric_slot11",
    "element": "electric",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "electric_slot7",
      "electric_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_11"
      },
      "arqueiro": {
        "name": "Imobilização Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_11"
      },
      "mago": {
        "name": "Petrificação Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_11"
      },
      "assassino": {
        "name": "Paralisia Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_11"
      },
      "monge": {
        "name": "Pressão de Chi Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_11"
      },
      "invocador": {
        "name": "Aprisionamento Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_11"
      },
      "samurai": {
        "name": "Iai Paralisante Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico elétrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_11"
      },
      "lanceiro": {
        "name": "Cravamento Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico elétrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Elétrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico elétrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "electric_slot12",
    "element": "electric",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "electric_slot10",
      "electric_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_12"
      },
      "arqueiro": {
        "name": "Chuva de Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_12"
      },
      "mago": {
        "name": "Apocalipse Tempestade",
        "description": "Habilidade definitiva. 150 de dano mágico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_12"
      },
      "assassino": {
        "name": "Execução Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_12"
      },
      "monge": {
        "name": "Despertar do Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_12"
      },
      "paladino": {
        "name": "Julgamento Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_12"
      },
      "curandeiro": {
        "name": "Bênção do Tempestade",
        "description": "Habilidade definitiva. 150 de dano mágico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_12"
      },
      "invocador": {
        "name": "Manifestação Tempestade",
        "description": "Habilidade definitiva. 150 de dano mágico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_12"
      },
      "samurai": {
        "name": "Bushido Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_12"
      },
      "bardo": {
        "name": "Sinfonia Tempestade",
        "description": "Habilidade definitiva. 150 de dano mágico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_12"
      },
      "lanceiro": {
        "name": "Lança Mística Tempestade",
        "description": "Habilidade definitiva. 150 de dano físico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_12"
      },
      "alquimista": {
        "name": "Transmutação Tempestade",
        "description": "Habilidade definitiva. 150 de dano mágico elétrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_12"
      }
    }
  },
  {
    "id": "electric_slot13",
    "element": "electric",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "electric_slot10",
      "electric_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_electric_13"
      },
      "arqueiro": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_electric_13"
      },
      "mago": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_electric_13"
      },
      "assassino": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_electric_13"
      },
      "monge": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_electric_13"
      },
      "paladino": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_electric_13"
      },
      "curandeiro": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_electric_13"
      },
      "invocador": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_electric_13"
      },
      "samurai": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_electric_13"
      },
      "bardo": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_electric_13"
      },
      "lanceiro": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_electric_13"
      },
      "alquimista": {
        "name": "Pulso Galvânico",
        "description": "PASSIVA: +15% dano elétrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_electric_13"
      }
    }
  },
  {
    "id": "ice_slot1",
    "element": "ice",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_1"
      },
      "arqueiro": {
        "name": "Flecha Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_1"
      },
      "mago": {
        "name": "Esfera Gélido",
        "description": "Causa 25 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_1"
      },
      "assassino": {
        "name": "Punhalada Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_1"
      },
      "monge": {
        "name": "Palma Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_1"
      },
      "curandeiro": {
        "name": "Brisa Gélido",
        "description": "Causa 25 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_1"
      },
      "invocador": {
        "name": "Invocação Gélido",
        "description": "Causa 25 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_1"
      },
      "samurai": {
        "name": "Corte Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_1"
      },
      "bardo": {
        "name": "Acorde Gélido",
        "description": "Causa 25 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_1"
      },
      "lanceiro": {
        "name": "Estocada Gélido",
        "description": "Causa 25 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_1"
      },
      "alquimista": {
        "name": "Frasco Gélido",
        "description": "Causa 25 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_1"
      }
    }
  },
  {
    "id": "ice_slot2",
    "element": "ice",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_2"
      },
      "arqueiro": {
        "name": "Salto Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_2"
      },
      "mago": {
        "name": "Barreira Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_2"
      },
      "assassino": {
        "name": "Véu Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_2"
      },
      "monge": {
        "name": "Postura Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_2"
      },
      "paladino": {
        "name": "Escudo Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_2"
      },
      "curandeiro": {
        "name": "Bênção Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_2"
      },
      "invocador": {
        "name": "Selo Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_2"
      },
      "samurai": {
        "name": "Iaijutsu Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_2"
      },
      "bardo": {
        "name": "Acalanto Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_2"
      },
      "lanceiro": {
        "name": "Reverso Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_2"
      },
      "alquimista": {
        "name": "Vapor Gélido",
        "description": "Concede 15 de escudo gélido por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_2"
      }
    }
  },
  {
    "id": "ice_slot3",
    "element": "ice",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_3"
      },
      "arqueiro": {
        "name": "Mira Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_3"
      },
      "mago": {
        "name": "Selo Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_3"
      },
      "assassino": {
        "name": "Brasão Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_3"
      },
      "monge": {
        "name": "Tatuagem Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_3"
      },
      "paladino": {
        "name": "Sinal Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_3"
      },
      "invocador": {
        "name": "Maldição Leve Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_3"
      },
      "samurai": {
        "name": "Selo Ronin Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_3"
      },
      "bardo": {
        "name": "Ressonância Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_3"
      },
      "alquimista": {
        "name": "Tinta Gélido",
        "description": "15% de chance de aplicar efeito gélido (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "ice_slot4",
    "element": "ice",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "ice_slot1",
      "ice_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_4"
      },
      "arqueiro": {
        "name": "Disparo Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_4"
      },
      "mago": {
        "name": "Bola Gélido",
        "description": "Causa 45 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_4"
      },
      "assassino": {
        "name": "Espinho Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_4"
      },
      "monge": {
        "name": "Punho Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_4"
      },
      "paladino": {
        "name": "Julgamento Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_4"
      },
      "curandeiro": {
        "name": "Bálsamo Gélido",
        "description": "Causa 45 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_4"
      },
      "invocador": {
        "name": "Manifestação Gélido",
        "description": "Causa 45 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_4"
      },
      "samurai": {
        "name": "Lâmina Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_4"
      },
      "bardo": {
        "name": "Melodia Gélido",
        "description": "Causa 45 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_4"
      },
      "lanceiro": {
        "name": "Perfuração Gélido",
        "description": "Causa 45 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_4"
      },
      "alquimista": {
        "name": "Poção Gélido",
        "description": "Causa 45 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_4"
      }
    }
  },
  {
    "id": "ice_slot5",
    "element": "ice",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "ice_slot1",
      "ice_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_5"
      },
      "arqueiro": {
        "name": "Tiro Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_5"
      },
      "mago": {
        "name": "Vortex Gélido",
        "description": "Atinge todos com 35 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_5"
      },
      "assassino": {
        "name": "Golpe Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_5"
      },
      "monge": {
        "name": "Foco Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_5"
      },
      "paladino": {
        "name": "Cetro Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_5"
      },
      "curandeiro": {
        "name": "Aura Gélido",
        "description": "Atinge todos com 35 de dano mágico gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_5"
      },
      "invocador": {
        "name": "Sombra Gélido",
        "description": "Atinge todos com 35 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_5"
      },
      "samurai": {
        "name": "Fenda Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_5"
      },
      "bardo": {
        "name": "Verso Gélido",
        "description": "Atinge todos com 35 de dano mágico gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_5"
      },
      "lanceiro": {
        "name": "Salto Gélido",
        "description": "Atinge todos com 35 de dano físico gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_5"
      },
      "alquimista": {
        "name": "Bomba Gélido",
        "description": "Atinge todos com 35 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_5"
      }
    }
  },
  {
    "id": "ice_slot6",
    "element": "ice",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "ice_slot1",
      "ice_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_6"
      },
      "arqueiro": {
        "name": "Foco Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_6"
      },
      "mago": {
        "name": "Combustão Mental Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_6"
      },
      "assassino": {
        "name": "Espreita Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_6"
      },
      "monge": {
        "name": "Zen Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_6"
      },
      "paladino": {
        "name": "Voto Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_6"
      },
      "curandeiro": {
        "name": "Vibração Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_6"
      },
      "invocador": {
        "name": "Pacto Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_6"
      },
      "samurai": {
        "name": "Bushido Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_6"
      },
      "bardo": {
        "name": "Embalo Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_6"
      },
      "lanceiro": {
        "name": "Postura Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_6"
      },
      "alquimista": {
        "name": "Frasco Gélido",
        "description": "Aumenta seu próprio dano gélido em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_6"
      }
    }
  },
  {
    "id": "ice_slot7",
    "element": "ice",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "ice_slot4",
      "ice_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_7"
      },
      "arqueiro": {
        "name": "Ponta de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_7"
      },
      "mago": {
        "name": "Raio de Cristal",
        "description": "Ataque devastador. 75 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_7"
      },
      "assassino": {
        "name": "Lâmina de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_7"
      },
      "monge": {
        "name": "Kata de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_7"
      },
      "paladino": {
        "name": "Aura de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_7"
      },
      "curandeiro": {
        "name": "Prece de Cristal",
        "description": "Ataque devastador. 75 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_7"
      },
      "invocador": {
        "name": "Selo de Cristal",
        "description": "Ataque devastador. 75 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_7"
      },
      "samurai": {
        "name": "Iai de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_7"
      },
      "bardo": {
        "name": "Ressonância de Cristal",
        "description": "Ataque devastador. 75 de dano mágico gélido. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_7"
      },
      "lanceiro": {
        "name": "Lança de Cristal",
        "description": "Ataque devastador. 75 de dano físico gélido. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_7"
      },
      "alquimista": {
        "name": "Mistura de Cristal",
        "description": "Ataque devastador. 75 de dano mágico gélido. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_7"
      }
    }
  },
  {
    "id": "ice_slot8",
    "element": "ice",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "ice_slot4",
      "ice_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_8"
      },
      "arqueiro": {
        "name": "Veneno Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_8"
      },
      "mago": {
        "name": "Maldição Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_8"
      },
      "assassino": {
        "name": "Selo Letal Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_8"
      },
      "monge": {
        "name": "Marca de Chi Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_8"
      },
      "paladino": {
        "name": "Estigma Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_8"
      },
      "curandeiro": {
        "name": "Pacto Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_8"
      },
      "invocador": {
        "name": "Maldição Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_8"
      },
      "samurai": {
        "name": "Honra Manchada Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_8"
      },
      "bardo": {
        "name": "Dissonância Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_8"
      },
      "lanceiro": {
        "name": "Cravo Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_8"
      },
      "alquimista": {
        "name": "Toxina Gélido",
        "description": "40% de chance de aplicar efeito gélido forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "ice_slot9",
    "element": "ice",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "ice_slot4",
      "ice_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_9"
      },
      "arqueiro": {
        "name": "Bálsamo Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_9"
      },
      "mago": {
        "name": "Recuperação Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_9"
      },
      "assassino": {
        "name": "Recuo Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_9"
      },
      "monge": {
        "name": "Meditação Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_9"
      },
      "paladino": {
        "name": "Bênção Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_9"
      },
      "curandeiro": {
        "name": "Cura Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_9"
      },
      "invocador": {
        "name": "Sucção Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_9"
      },
      "samurai": {
        "name": "Restauro Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_9"
      },
      "bardo": {
        "name": "Cantiga Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_9"
      },
      "lanceiro": {
        "name": "Sopro Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_9"
      },
      "alquimista": {
        "name": "Elixir Gélido",
        "description": "Recupera 50 de HP usando energia gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_9"
      }
    }
  },
  {
    "id": "ice_slot10",
    "element": "ice",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "ice_slot7",
      "ice_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_10"
      },
      "arqueiro": {
        "name": "Trinca Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_10"
      },
      "mago": {
        "name": "Tríplice Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_10"
      },
      "assassino": {
        "name": "Tríade Letal Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_10"
      },
      "monge": {
        "name": "Trindade Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_10"
      },
      "invocador": {
        "name": "Tríade Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_10"
      },
      "samurai": {
        "name": "Tríplice Corte Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_10"
      },
      "bardo": {
        "name": "Acorde Triplo Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Gélido",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_10"
      }
    }
  },
  {
    "id": "ice_slot11",
    "element": "ice",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "ice_slot7",
      "ice_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_11"
      },
      "arqueiro": {
        "name": "Imobilização Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_11"
      },
      "mago": {
        "name": "Petrificação Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_11"
      },
      "assassino": {
        "name": "Paralisia Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_11"
      },
      "monge": {
        "name": "Pressão de Chi Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_11"
      },
      "invocador": {
        "name": "Aprisionamento Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_11"
      },
      "samurai": {
        "name": "Iai Paralisante Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico gélido.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_11"
      },
      "lanceiro": {
        "name": "Cravamento Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico gélido.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Gélido",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico gélido.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "ice_slot12",
    "element": "ice",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "ice_slot10",
      "ice_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_12"
      },
      "arqueiro": {
        "name": "Chuva de Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_12"
      },
      "mago": {
        "name": "Apocalipse Glaciação",
        "description": "Habilidade definitiva. 150 de dano mágico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_12"
      },
      "assassino": {
        "name": "Execução Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_12"
      },
      "monge": {
        "name": "Despertar do Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_12"
      },
      "paladino": {
        "name": "Julgamento Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_12"
      },
      "curandeiro": {
        "name": "Bênção do Glaciação",
        "description": "Habilidade definitiva. 150 de dano mágico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_12"
      },
      "invocador": {
        "name": "Manifestação Glaciação",
        "description": "Habilidade definitiva. 150 de dano mágico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_12"
      },
      "samurai": {
        "name": "Bushido Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_12"
      },
      "bardo": {
        "name": "Sinfonia Glaciação",
        "description": "Habilidade definitiva. 150 de dano mágico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_12"
      },
      "lanceiro": {
        "name": "Lança Mística Glaciação",
        "description": "Habilidade definitiva. 150 de dano físico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_12"
      },
      "alquimista": {
        "name": "Transmutação Glaciação",
        "description": "Habilidade definitiva. 150 de dano mágico gélido. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_12"
      }
    }
  },
  {
    "id": "ice_slot13",
    "element": "ice",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "ice_slot10",
      "ice_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ice_13"
      },
      "arqueiro": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ice_13"
      },
      "mago": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ice_13"
      },
      "assassino": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ice_13"
      },
      "monge": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ice_13"
      },
      "paladino": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ice_13"
      },
      "curandeiro": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ice_13"
      },
      "invocador": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ice_13"
      },
      "samurai": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ice_13"
      },
      "bardo": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ice_13"
      },
      "lanceiro": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ice_13"
      },
      "alquimista": {
        "name": "Sangue de Inverno",
        "description": "PASSIVA: +15% dano gélido, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ice_13"
      }
    }
  },
  {
    "id": "fighting_slot1",
    "element": "fighting",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_1"
      },
      "arqueiro": {
        "name": "Flecha Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_1"
      },
      "mago": {
        "name": "Esfera Marcial",
        "description": "Causa 25 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_1"
      },
      "assassino": {
        "name": "Punhalada Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_1"
      },
      "monge": {
        "name": "Palma Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_1"
      },
      "curandeiro": {
        "name": "Brisa Marcial",
        "description": "Causa 25 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_1"
      },
      "invocador": {
        "name": "Invocação Marcial",
        "description": "Causa 25 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_1"
      },
      "samurai": {
        "name": "Corte Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_1"
      },
      "bardo": {
        "name": "Acorde Marcial",
        "description": "Causa 25 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_1"
      },
      "lanceiro": {
        "name": "Estocada Marcial",
        "description": "Causa 25 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_1"
      },
      "alquimista": {
        "name": "Frasco Marcial",
        "description": "Causa 25 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_1"
      }
    }
  },
  {
    "id": "fighting_slot2",
    "element": "fighting",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_2"
      },
      "arqueiro": {
        "name": "Salto Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_2"
      },
      "mago": {
        "name": "Barreira Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_2"
      },
      "assassino": {
        "name": "Véu Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_2"
      },
      "monge": {
        "name": "Postura Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_2"
      },
      "paladino": {
        "name": "Escudo Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_2"
      },
      "curandeiro": {
        "name": "Bênção Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_2"
      },
      "invocador": {
        "name": "Selo Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_2"
      },
      "samurai": {
        "name": "Iaijutsu Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_2"
      },
      "bardo": {
        "name": "Acalanto Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_2"
      },
      "lanceiro": {
        "name": "Reverso Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_2"
      },
      "alquimista": {
        "name": "Vapor Marcial",
        "description": "Concede 15 de escudo marcial por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_2"
      }
    }
  },
  {
    "id": "fighting_slot3",
    "element": "fighting",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_3"
      },
      "arqueiro": {
        "name": "Mira Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_3"
      },
      "mago": {
        "name": "Selo Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_3"
      },
      "assassino": {
        "name": "Brasão Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_3"
      },
      "monge": {
        "name": "Tatuagem Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_3"
      },
      "paladino": {
        "name": "Sinal Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_3"
      },
      "invocador": {
        "name": "Maldição Leve Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_3"
      },
      "samurai": {
        "name": "Selo Ronin Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_3"
      },
      "bardo": {
        "name": "Ressonância Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_3"
      },
      "alquimista": {
        "name": "Tinta Marcial",
        "description": "15% de chance de aplicar efeito marcial (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "fighting_slot4",
    "element": "fighting",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "fighting_slot1",
      "fighting_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_4"
      },
      "arqueiro": {
        "name": "Disparo Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_4"
      },
      "mago": {
        "name": "Bola Marcial",
        "description": "Causa 45 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_4"
      },
      "assassino": {
        "name": "Espinho Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_4"
      },
      "monge": {
        "name": "Punho Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_4"
      },
      "paladino": {
        "name": "Julgamento Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_4"
      },
      "curandeiro": {
        "name": "Bálsamo Marcial",
        "description": "Causa 45 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_4"
      },
      "invocador": {
        "name": "Manifestação Marcial",
        "description": "Causa 45 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_4"
      },
      "samurai": {
        "name": "Lâmina Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_4"
      },
      "bardo": {
        "name": "Melodia Marcial",
        "description": "Causa 45 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_4"
      },
      "lanceiro": {
        "name": "Perfuração Marcial",
        "description": "Causa 45 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_4"
      },
      "alquimista": {
        "name": "Poção Marcial",
        "description": "Causa 45 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_4"
      }
    }
  },
  {
    "id": "fighting_slot5",
    "element": "fighting",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "fighting_slot1",
      "fighting_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_5"
      },
      "arqueiro": {
        "name": "Tiro Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_5"
      },
      "mago": {
        "name": "Vortex Marcial",
        "description": "Atinge todos com 35 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_5"
      },
      "assassino": {
        "name": "Golpe Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_5"
      },
      "monge": {
        "name": "Foco Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_5"
      },
      "paladino": {
        "name": "Cetro Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_5"
      },
      "curandeiro": {
        "name": "Aura Marcial",
        "description": "Atinge todos com 35 de dano mágico marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_5"
      },
      "invocador": {
        "name": "Sombra Marcial",
        "description": "Atinge todos com 35 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_5"
      },
      "samurai": {
        "name": "Fenda Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_5"
      },
      "bardo": {
        "name": "Verso Marcial",
        "description": "Atinge todos com 35 de dano mágico marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_5"
      },
      "lanceiro": {
        "name": "Salto Marcial",
        "description": "Atinge todos com 35 de dano físico marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_5"
      },
      "alquimista": {
        "name": "Bomba Marcial",
        "description": "Atinge todos com 35 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_5"
      }
    }
  },
  {
    "id": "fighting_slot6",
    "element": "fighting",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "fighting_slot1",
      "fighting_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_6"
      },
      "arqueiro": {
        "name": "Foco Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_6"
      },
      "mago": {
        "name": "Combustão Mental Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_6"
      },
      "assassino": {
        "name": "Espreita Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_6"
      },
      "monge": {
        "name": "Zen Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_6"
      },
      "paladino": {
        "name": "Voto Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_6"
      },
      "curandeiro": {
        "name": "Vibração Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_6"
      },
      "invocador": {
        "name": "Pacto Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_6"
      },
      "samurai": {
        "name": "Bushido Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_6"
      },
      "bardo": {
        "name": "Embalo Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_6"
      },
      "lanceiro": {
        "name": "Postura Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_6"
      },
      "alquimista": {
        "name": "Frasco Marcial",
        "description": "Aumenta seu próprio dano marcial em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_6"
      }
    }
  },
  {
    "id": "fighting_slot7",
    "element": "fighting",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "fighting_slot4",
      "fighting_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_7"
      },
      "arqueiro": {
        "name": "Ponta de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_7"
      },
      "mago": {
        "name": "Raio de Punho",
        "description": "Ataque devastador. 75 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_7"
      },
      "assassino": {
        "name": "Lâmina de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_7"
      },
      "monge": {
        "name": "Kata de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_7"
      },
      "paladino": {
        "name": "Aura de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_7"
      },
      "curandeiro": {
        "name": "Prece de Punho",
        "description": "Ataque devastador. 75 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_7"
      },
      "invocador": {
        "name": "Selo de Punho",
        "description": "Ataque devastador. 75 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_7"
      },
      "samurai": {
        "name": "Iai de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_7"
      },
      "bardo": {
        "name": "Ressonância de Punho",
        "description": "Ataque devastador. 75 de dano mágico marcial. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_7"
      },
      "lanceiro": {
        "name": "Lança de Punho",
        "description": "Ataque devastador. 75 de dano físico marcial. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_7"
      },
      "alquimista": {
        "name": "Mistura de Punho",
        "description": "Ataque devastador. 75 de dano mágico marcial. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_7"
      }
    }
  },
  {
    "id": "fighting_slot8",
    "element": "fighting",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "fighting_slot4",
      "fighting_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_8"
      },
      "arqueiro": {
        "name": "Veneno Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_8"
      },
      "mago": {
        "name": "Maldição Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_8"
      },
      "assassino": {
        "name": "Selo Letal Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_8"
      },
      "monge": {
        "name": "Marca de Chi Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_8"
      },
      "paladino": {
        "name": "Estigma Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_8"
      },
      "curandeiro": {
        "name": "Pacto Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_8"
      },
      "invocador": {
        "name": "Maldição Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_8"
      },
      "samurai": {
        "name": "Honra Manchada Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_8"
      },
      "bardo": {
        "name": "Dissonância Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_8"
      },
      "lanceiro": {
        "name": "Cravo Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_8"
      },
      "alquimista": {
        "name": "Toxina Marcial",
        "description": "40% de chance de aplicar efeito marcial forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "fighting_slot9",
    "element": "fighting",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "fighting_slot4",
      "fighting_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_9"
      },
      "arqueiro": {
        "name": "Bálsamo Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_9"
      },
      "mago": {
        "name": "Recuperação Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_9"
      },
      "assassino": {
        "name": "Recuo Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_9"
      },
      "monge": {
        "name": "Meditação Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_9"
      },
      "paladino": {
        "name": "Bênção Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_9"
      },
      "curandeiro": {
        "name": "Cura Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_9"
      },
      "invocador": {
        "name": "Sucção Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_9"
      },
      "samurai": {
        "name": "Restauro Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_9"
      },
      "bardo": {
        "name": "Cantiga Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_9"
      },
      "lanceiro": {
        "name": "Sopro Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_9"
      },
      "alquimista": {
        "name": "Elixir Marcial",
        "description": "Recupera 50 de HP usando energia marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_9"
      }
    }
  },
  {
    "id": "fighting_slot10",
    "element": "fighting",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "fighting_slot7",
      "fighting_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_10"
      },
      "arqueiro": {
        "name": "Trinca Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_10"
      },
      "mago": {
        "name": "Tríplice Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_10"
      },
      "assassino": {
        "name": "Tríade Letal Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_10"
      },
      "monge": {
        "name": "Trindade Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_10"
      },
      "invocador": {
        "name": "Tríade Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_10"
      },
      "samurai": {
        "name": "Tríplice Corte Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_10"
      },
      "bardo": {
        "name": "Acorde Triplo Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Marcial",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_10"
      }
    }
  },
  {
    "id": "fighting_slot11",
    "element": "fighting",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "fighting_slot7",
      "fighting_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_11"
      },
      "arqueiro": {
        "name": "Imobilização Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_11"
      },
      "mago": {
        "name": "Petrificação Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_11"
      },
      "assassino": {
        "name": "Paralisia Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_11"
      },
      "monge": {
        "name": "Pressão de Chi Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_11"
      },
      "invocador": {
        "name": "Aprisionamento Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_11"
      },
      "samurai": {
        "name": "Iai Paralisante Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico marcial.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_11"
      },
      "lanceiro": {
        "name": "Cravamento Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico marcial.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Marcial",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico marcial.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "fighting_slot12",
    "element": "fighting",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "fighting_slot10",
      "fighting_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_12"
      },
      "arqueiro": {
        "name": "Chuva de Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_12"
      },
      "mago": {
        "name": "Apocalipse Combate",
        "description": "Habilidade definitiva. 150 de dano mágico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_12"
      },
      "assassino": {
        "name": "Execução Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_12"
      },
      "monge": {
        "name": "Despertar do Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_12"
      },
      "paladino": {
        "name": "Julgamento Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_12"
      },
      "curandeiro": {
        "name": "Bênção do Combate",
        "description": "Habilidade definitiva. 150 de dano mágico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_12"
      },
      "invocador": {
        "name": "Manifestação Combate",
        "description": "Habilidade definitiva. 150 de dano mágico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_12"
      },
      "samurai": {
        "name": "Bushido Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_12"
      },
      "bardo": {
        "name": "Sinfonia Combate",
        "description": "Habilidade definitiva. 150 de dano mágico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_12"
      },
      "lanceiro": {
        "name": "Lança Mística Combate",
        "description": "Habilidade definitiva. 150 de dano físico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_12"
      },
      "alquimista": {
        "name": "Transmutação Combate",
        "description": "Habilidade definitiva. 150 de dano mágico marcial. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_12"
      }
    }
  },
  {
    "id": "fighting_slot13",
    "element": "fighting",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "fighting_slot10",
      "fighting_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_fighting_13"
      },
      "arqueiro": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_fighting_13"
      },
      "mago": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_fighting_13"
      },
      "assassino": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_fighting_13"
      },
      "monge": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_fighting_13"
      },
      "paladino": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_fighting_13"
      },
      "curandeiro": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_fighting_13"
      },
      "invocador": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_fighting_13"
      },
      "samurai": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_fighting_13"
      },
      "bardo": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_fighting_13"
      },
      "lanceiro": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_fighting_13"
      },
      "alquimista": {
        "name": "Disciplina Eterna",
        "description": "PASSIVA: +15% dano marcial, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_fighting_13"
      }
    }
  },
  {
    "id": "poison_slot1",
    "element": "poison",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_1"
      },
      "arqueiro": {
        "name": "Flecha Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_1"
      },
      "mago": {
        "name": "Esfera Tóxico",
        "description": "Causa 25 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_1"
      },
      "assassino": {
        "name": "Punhalada Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_1"
      },
      "monge": {
        "name": "Palma Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_1"
      },
      "curandeiro": {
        "name": "Brisa Tóxico",
        "description": "Causa 25 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_1"
      },
      "invocador": {
        "name": "Invocação Tóxico",
        "description": "Causa 25 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_1"
      },
      "samurai": {
        "name": "Corte Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_1"
      },
      "bardo": {
        "name": "Acorde Tóxico",
        "description": "Causa 25 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_1"
      },
      "lanceiro": {
        "name": "Estocada Tóxico",
        "description": "Causa 25 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_1"
      },
      "alquimista": {
        "name": "Frasco Tóxico",
        "description": "Causa 25 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_1"
      }
    }
  },
  {
    "id": "poison_slot2",
    "element": "poison",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_2"
      },
      "arqueiro": {
        "name": "Salto Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_2"
      },
      "mago": {
        "name": "Barreira Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_2"
      },
      "assassino": {
        "name": "Véu Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_2"
      },
      "monge": {
        "name": "Postura Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_2"
      },
      "paladino": {
        "name": "Escudo Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_2"
      },
      "curandeiro": {
        "name": "Bênção Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_2"
      },
      "invocador": {
        "name": "Selo Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_2"
      },
      "samurai": {
        "name": "Iaijutsu Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_2"
      },
      "bardo": {
        "name": "Acalanto Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_2"
      },
      "lanceiro": {
        "name": "Reverso Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_2"
      },
      "alquimista": {
        "name": "Vapor Tóxico",
        "description": "Concede 15 de escudo tóxico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_2"
      }
    }
  },
  {
    "id": "poison_slot3",
    "element": "poison",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_3"
      },
      "arqueiro": {
        "name": "Mira Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_3"
      },
      "mago": {
        "name": "Selo Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_3"
      },
      "assassino": {
        "name": "Brasão Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_3"
      },
      "monge": {
        "name": "Tatuagem Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_3"
      },
      "paladino": {
        "name": "Sinal Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_3"
      },
      "invocador": {
        "name": "Maldição Leve Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_3"
      },
      "samurai": {
        "name": "Selo Ronin Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_3"
      },
      "bardo": {
        "name": "Ressonância Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_3"
      },
      "alquimista": {
        "name": "Tinta Tóxico",
        "description": "15% de chance de aplicar efeito tóxico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "poison_slot4",
    "element": "poison",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "poison_slot1",
      "poison_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_4"
      },
      "arqueiro": {
        "name": "Disparo Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_4"
      },
      "mago": {
        "name": "Bola Tóxico",
        "description": "Causa 45 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_4"
      },
      "assassino": {
        "name": "Espinho Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_4"
      },
      "monge": {
        "name": "Punho Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_4"
      },
      "paladino": {
        "name": "Julgamento Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_4"
      },
      "curandeiro": {
        "name": "Bálsamo Tóxico",
        "description": "Causa 45 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_4"
      },
      "invocador": {
        "name": "Manifestação Tóxico",
        "description": "Causa 45 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_4"
      },
      "samurai": {
        "name": "Lâmina Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_4"
      },
      "bardo": {
        "name": "Melodia Tóxico",
        "description": "Causa 45 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_4"
      },
      "lanceiro": {
        "name": "Perfuração Tóxico",
        "description": "Causa 45 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_4"
      },
      "alquimista": {
        "name": "Poção Tóxico",
        "description": "Causa 45 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_4"
      }
    }
  },
  {
    "id": "poison_slot5",
    "element": "poison",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "poison_slot1",
      "poison_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_5"
      },
      "arqueiro": {
        "name": "Tiro Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_5"
      },
      "mago": {
        "name": "Vortex Tóxico",
        "description": "Atinge todos com 35 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_5"
      },
      "assassino": {
        "name": "Golpe Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_5"
      },
      "monge": {
        "name": "Foco Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_5"
      },
      "paladino": {
        "name": "Cetro Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_5"
      },
      "curandeiro": {
        "name": "Aura Tóxico",
        "description": "Atinge todos com 35 de dano mágico tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_5"
      },
      "invocador": {
        "name": "Sombra Tóxico",
        "description": "Atinge todos com 35 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_5"
      },
      "samurai": {
        "name": "Fenda Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_5"
      },
      "bardo": {
        "name": "Verso Tóxico",
        "description": "Atinge todos com 35 de dano mágico tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_5"
      },
      "lanceiro": {
        "name": "Salto Tóxico",
        "description": "Atinge todos com 35 de dano físico tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_5"
      },
      "alquimista": {
        "name": "Bomba Tóxico",
        "description": "Atinge todos com 35 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_5"
      }
    }
  },
  {
    "id": "poison_slot6",
    "element": "poison",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "poison_slot1",
      "poison_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_6"
      },
      "arqueiro": {
        "name": "Foco Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_6"
      },
      "mago": {
        "name": "Combustão Mental Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_6"
      },
      "assassino": {
        "name": "Espreita Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_6"
      },
      "monge": {
        "name": "Zen Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_6"
      },
      "paladino": {
        "name": "Voto Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_6"
      },
      "curandeiro": {
        "name": "Vibração Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_6"
      },
      "invocador": {
        "name": "Pacto Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_6"
      },
      "samurai": {
        "name": "Bushido Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_6"
      },
      "bardo": {
        "name": "Embalo Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_6"
      },
      "lanceiro": {
        "name": "Postura Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_6"
      },
      "alquimista": {
        "name": "Frasco Tóxico",
        "description": "Aumenta seu próprio dano tóxico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_6"
      }
    }
  },
  {
    "id": "poison_slot7",
    "element": "poison",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "poison_slot4",
      "poison_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_7"
      },
      "arqueiro": {
        "name": "Ponta de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_7"
      },
      "mago": {
        "name": "Raio de Veneno",
        "description": "Ataque devastador. 75 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_7"
      },
      "assassino": {
        "name": "Lâmina de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_7"
      },
      "monge": {
        "name": "Kata de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_7"
      },
      "paladino": {
        "name": "Aura de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_7"
      },
      "curandeiro": {
        "name": "Prece de Veneno",
        "description": "Ataque devastador. 75 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_7"
      },
      "invocador": {
        "name": "Selo de Veneno",
        "description": "Ataque devastador. 75 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_7"
      },
      "samurai": {
        "name": "Iai de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_7"
      },
      "bardo": {
        "name": "Ressonância de Veneno",
        "description": "Ataque devastador. 75 de dano mágico tóxico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_7"
      },
      "lanceiro": {
        "name": "Lança de Veneno",
        "description": "Ataque devastador. 75 de dano físico tóxico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_7"
      },
      "alquimista": {
        "name": "Mistura de Veneno",
        "description": "Ataque devastador. 75 de dano mágico tóxico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_7"
      }
    }
  },
  {
    "id": "poison_slot8",
    "element": "poison",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "poison_slot4",
      "poison_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_8"
      },
      "arqueiro": {
        "name": "Veneno Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_8"
      },
      "mago": {
        "name": "Maldição Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_8"
      },
      "assassino": {
        "name": "Selo Letal Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_8"
      },
      "monge": {
        "name": "Marca de Chi Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_8"
      },
      "paladino": {
        "name": "Estigma Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_8"
      },
      "curandeiro": {
        "name": "Pacto Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_8"
      },
      "invocador": {
        "name": "Maldição Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_8"
      },
      "samurai": {
        "name": "Honra Manchada Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_8"
      },
      "bardo": {
        "name": "Dissonância Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_8"
      },
      "lanceiro": {
        "name": "Cravo Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_8"
      },
      "alquimista": {
        "name": "Toxina Tóxico",
        "description": "40% de chance de aplicar efeito tóxico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "poison_slot9",
    "element": "poison",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "poison_slot4",
      "poison_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_9"
      },
      "arqueiro": {
        "name": "Bálsamo Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_9"
      },
      "mago": {
        "name": "Recuperação Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_9"
      },
      "assassino": {
        "name": "Recuo Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_9"
      },
      "monge": {
        "name": "Meditação Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_9"
      },
      "paladino": {
        "name": "Bênção Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_9"
      },
      "curandeiro": {
        "name": "Cura Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_9"
      },
      "invocador": {
        "name": "Sucção Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_9"
      },
      "samurai": {
        "name": "Restauro Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_9"
      },
      "bardo": {
        "name": "Cantiga Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_9"
      },
      "lanceiro": {
        "name": "Sopro Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_9"
      },
      "alquimista": {
        "name": "Elixir Tóxico",
        "description": "Recupera 50 de HP usando energia tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_9"
      }
    }
  },
  {
    "id": "poison_slot10",
    "element": "poison",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "poison_slot7",
      "poison_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_10"
      },
      "arqueiro": {
        "name": "Trinca Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_10"
      },
      "mago": {
        "name": "Tríplice Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_10"
      },
      "assassino": {
        "name": "Tríade Letal Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_10"
      },
      "monge": {
        "name": "Trindade Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_10"
      },
      "invocador": {
        "name": "Tríade Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_10"
      },
      "samurai": {
        "name": "Tríplice Corte Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_10"
      },
      "bardo": {
        "name": "Acorde Triplo Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Tóxico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_10"
      }
    }
  },
  {
    "id": "poison_slot11",
    "element": "poison",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "poison_slot7",
      "poison_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_11"
      },
      "arqueiro": {
        "name": "Imobilização Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_11"
      },
      "mago": {
        "name": "Petrificação Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_11"
      },
      "assassino": {
        "name": "Paralisia Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_11"
      },
      "monge": {
        "name": "Pressão de Chi Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_11"
      },
      "invocador": {
        "name": "Aprisionamento Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_11"
      },
      "samurai": {
        "name": "Iai Paralisante Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico tóxico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_11"
      },
      "lanceiro": {
        "name": "Cravamento Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico tóxico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Tóxico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico tóxico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "poison_slot12",
    "element": "poison",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "poison_slot10",
      "poison_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_12"
      },
      "arqueiro": {
        "name": "Chuva de Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_12"
      },
      "mago": {
        "name": "Apocalipse Pandemia",
        "description": "Habilidade definitiva. 150 de dano mágico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_12"
      },
      "assassino": {
        "name": "Execução Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_12"
      },
      "monge": {
        "name": "Despertar do Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_12"
      },
      "paladino": {
        "name": "Julgamento Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_12"
      },
      "curandeiro": {
        "name": "Bênção do Pandemia",
        "description": "Habilidade definitiva. 150 de dano mágico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_12"
      },
      "invocador": {
        "name": "Manifestação Pandemia",
        "description": "Habilidade definitiva. 150 de dano mágico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_12"
      },
      "samurai": {
        "name": "Bushido Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_12"
      },
      "bardo": {
        "name": "Sinfonia Pandemia",
        "description": "Habilidade definitiva. 150 de dano mágico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_12"
      },
      "lanceiro": {
        "name": "Lança Mística Pandemia",
        "description": "Habilidade definitiva. 150 de dano físico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_12"
      },
      "alquimista": {
        "name": "Transmutação Pandemia",
        "description": "Habilidade definitiva. 150 de dano mágico tóxico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_12"
      }
    }
  },
  {
    "id": "poison_slot13",
    "element": "poison",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "poison_slot10",
      "poison_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_poison_13"
      },
      "arqueiro": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_poison_13"
      },
      "mago": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_poison_13"
      },
      "assassino": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_poison_13"
      },
      "monge": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_poison_13"
      },
      "paladino": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_poison_13"
      },
      "curandeiro": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_poison_13"
      },
      "invocador": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_poison_13"
      },
      "samurai": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_poison_13"
      },
      "bardo": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_poison_13"
      },
      "lanceiro": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_poison_13"
      },
      "alquimista": {
        "name": "Imunidade Total",
        "description": "PASSIVA: +15% dano tóxico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_poison_13"
      }
    }
  },
  {
    "id": "ground_slot1",
    "element": "ground",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_1"
      },
      "arqueiro": {
        "name": "Flecha Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_1"
      },
      "mago": {
        "name": "Esfera Telúrico",
        "description": "Causa 25 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_1"
      },
      "assassino": {
        "name": "Punhalada Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_1"
      },
      "monge": {
        "name": "Palma Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_1"
      },
      "curandeiro": {
        "name": "Brisa Telúrico",
        "description": "Causa 25 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_1"
      },
      "invocador": {
        "name": "Invocação Telúrico",
        "description": "Causa 25 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_1"
      },
      "samurai": {
        "name": "Corte Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_1"
      },
      "bardo": {
        "name": "Acorde Telúrico",
        "description": "Causa 25 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_1"
      },
      "lanceiro": {
        "name": "Estocada Telúrico",
        "description": "Causa 25 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_1"
      },
      "alquimista": {
        "name": "Frasco Telúrico",
        "description": "Causa 25 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_1"
      }
    }
  },
  {
    "id": "ground_slot2",
    "element": "ground",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_2"
      },
      "arqueiro": {
        "name": "Salto Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_2"
      },
      "mago": {
        "name": "Barreira Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_2"
      },
      "assassino": {
        "name": "Véu Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_2"
      },
      "monge": {
        "name": "Postura Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_2"
      },
      "paladino": {
        "name": "Escudo Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_2"
      },
      "curandeiro": {
        "name": "Bênção Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_2"
      },
      "invocador": {
        "name": "Selo Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_2"
      },
      "samurai": {
        "name": "Iaijutsu Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_2"
      },
      "bardo": {
        "name": "Acalanto Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_2"
      },
      "lanceiro": {
        "name": "Reverso Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_2"
      },
      "alquimista": {
        "name": "Vapor Telúrico",
        "description": "Concede 15 de escudo telúrico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_2"
      }
    }
  },
  {
    "id": "ground_slot3",
    "element": "ground",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_3"
      },
      "arqueiro": {
        "name": "Mira Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_3"
      },
      "mago": {
        "name": "Selo Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_3"
      },
      "assassino": {
        "name": "Brasão Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_3"
      },
      "monge": {
        "name": "Tatuagem Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_3"
      },
      "paladino": {
        "name": "Sinal Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_3"
      },
      "invocador": {
        "name": "Maldição Leve Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_3"
      },
      "samurai": {
        "name": "Selo Ronin Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_3"
      },
      "bardo": {
        "name": "Ressonância Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_3"
      },
      "alquimista": {
        "name": "Tinta Telúrico",
        "description": "15% de chance de aplicar efeito telúrico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "ground_slot4",
    "element": "ground",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "ground_slot1",
      "ground_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_4"
      },
      "arqueiro": {
        "name": "Disparo Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_4"
      },
      "mago": {
        "name": "Bola Telúrico",
        "description": "Causa 45 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_4"
      },
      "assassino": {
        "name": "Espinho Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_4"
      },
      "monge": {
        "name": "Punho Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_4"
      },
      "paladino": {
        "name": "Julgamento Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_4"
      },
      "curandeiro": {
        "name": "Bálsamo Telúrico",
        "description": "Causa 45 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_4"
      },
      "invocador": {
        "name": "Manifestação Telúrico",
        "description": "Causa 45 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_4"
      },
      "samurai": {
        "name": "Lâmina Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_4"
      },
      "bardo": {
        "name": "Melodia Telúrico",
        "description": "Causa 45 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_4"
      },
      "lanceiro": {
        "name": "Perfuração Telúrico",
        "description": "Causa 45 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_4"
      },
      "alquimista": {
        "name": "Poção Telúrico",
        "description": "Causa 45 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_4"
      }
    }
  },
  {
    "id": "ground_slot5",
    "element": "ground",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "ground_slot1",
      "ground_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_5"
      },
      "arqueiro": {
        "name": "Tiro Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_5"
      },
      "mago": {
        "name": "Vortex Telúrico",
        "description": "Atinge todos com 35 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_5"
      },
      "assassino": {
        "name": "Golpe Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_5"
      },
      "monge": {
        "name": "Foco Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_5"
      },
      "paladino": {
        "name": "Cetro Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_5"
      },
      "curandeiro": {
        "name": "Aura Telúrico",
        "description": "Atinge todos com 35 de dano mágico telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_5"
      },
      "invocador": {
        "name": "Sombra Telúrico",
        "description": "Atinge todos com 35 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_5"
      },
      "samurai": {
        "name": "Fenda Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_5"
      },
      "bardo": {
        "name": "Verso Telúrico",
        "description": "Atinge todos com 35 de dano mágico telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_5"
      },
      "lanceiro": {
        "name": "Salto Telúrico",
        "description": "Atinge todos com 35 de dano físico telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_5"
      },
      "alquimista": {
        "name": "Bomba Telúrico",
        "description": "Atinge todos com 35 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_5"
      }
    }
  },
  {
    "id": "ground_slot6",
    "element": "ground",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "ground_slot1",
      "ground_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_6"
      },
      "arqueiro": {
        "name": "Foco Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_6"
      },
      "mago": {
        "name": "Combustão Mental Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_6"
      },
      "assassino": {
        "name": "Espreita Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_6"
      },
      "monge": {
        "name": "Zen Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_6"
      },
      "paladino": {
        "name": "Voto Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_6"
      },
      "curandeiro": {
        "name": "Vibração Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_6"
      },
      "invocador": {
        "name": "Pacto Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_6"
      },
      "samurai": {
        "name": "Bushido Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_6"
      },
      "bardo": {
        "name": "Embalo Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_6"
      },
      "lanceiro": {
        "name": "Postura Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_6"
      },
      "alquimista": {
        "name": "Frasco Telúrico",
        "description": "Aumenta seu próprio dano telúrico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_6"
      }
    }
  },
  {
    "id": "ground_slot7",
    "element": "ground",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "ground_slot4",
      "ground_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_7"
      },
      "arqueiro": {
        "name": "Ponta de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_7"
      },
      "mago": {
        "name": "Raio de Pedra",
        "description": "Ataque devastador. 75 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_7"
      },
      "assassino": {
        "name": "Lâmina de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_7"
      },
      "monge": {
        "name": "Kata de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_7"
      },
      "paladino": {
        "name": "Aura de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_7"
      },
      "curandeiro": {
        "name": "Prece de Pedra",
        "description": "Ataque devastador. 75 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_7"
      },
      "invocador": {
        "name": "Selo de Pedra",
        "description": "Ataque devastador. 75 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_7"
      },
      "samurai": {
        "name": "Iai de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_7"
      },
      "bardo": {
        "name": "Ressonância de Pedra",
        "description": "Ataque devastador. 75 de dano mágico telúrico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_7"
      },
      "lanceiro": {
        "name": "Lança de Pedra",
        "description": "Ataque devastador. 75 de dano físico telúrico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_7"
      },
      "alquimista": {
        "name": "Mistura de Pedra",
        "description": "Ataque devastador. 75 de dano mágico telúrico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_7"
      }
    }
  },
  {
    "id": "ground_slot8",
    "element": "ground",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "ground_slot4",
      "ground_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_8"
      },
      "arqueiro": {
        "name": "Veneno Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_8"
      },
      "mago": {
        "name": "Maldição Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_8"
      },
      "assassino": {
        "name": "Selo Letal Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_8"
      },
      "monge": {
        "name": "Marca de Chi Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_8"
      },
      "paladino": {
        "name": "Estigma Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_8"
      },
      "curandeiro": {
        "name": "Pacto Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_8"
      },
      "invocador": {
        "name": "Maldição Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_8"
      },
      "samurai": {
        "name": "Honra Manchada Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_8"
      },
      "bardo": {
        "name": "Dissonância Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_8"
      },
      "lanceiro": {
        "name": "Cravo Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_8"
      },
      "alquimista": {
        "name": "Toxina Telúrico",
        "description": "40% de chance de aplicar efeito telúrico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "ground_slot9",
    "element": "ground",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "ground_slot4",
      "ground_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_9"
      },
      "arqueiro": {
        "name": "Bálsamo Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_9"
      },
      "mago": {
        "name": "Recuperação Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_9"
      },
      "assassino": {
        "name": "Recuo Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_9"
      },
      "monge": {
        "name": "Meditação Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_9"
      },
      "paladino": {
        "name": "Bênção Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_9"
      },
      "curandeiro": {
        "name": "Cura Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_9"
      },
      "invocador": {
        "name": "Sucção Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_9"
      },
      "samurai": {
        "name": "Restauro Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_9"
      },
      "bardo": {
        "name": "Cantiga Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_9"
      },
      "lanceiro": {
        "name": "Sopro Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_9"
      },
      "alquimista": {
        "name": "Elixir Telúrico",
        "description": "Recupera 50 de HP usando energia telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_9"
      }
    }
  },
  {
    "id": "ground_slot10",
    "element": "ground",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "ground_slot7",
      "ground_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_10"
      },
      "arqueiro": {
        "name": "Trinca Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_10"
      },
      "mago": {
        "name": "Tríplice Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_10"
      },
      "assassino": {
        "name": "Tríade Letal Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_10"
      },
      "monge": {
        "name": "Trindade Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_10"
      },
      "invocador": {
        "name": "Tríade Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_10"
      },
      "samurai": {
        "name": "Tríplice Corte Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_10"
      },
      "bardo": {
        "name": "Acorde Triplo Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Telúrico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_10"
      }
    }
  },
  {
    "id": "ground_slot11",
    "element": "ground",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "ground_slot7",
      "ground_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_11"
      },
      "arqueiro": {
        "name": "Imobilização Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_11"
      },
      "mago": {
        "name": "Petrificação Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_11"
      },
      "assassino": {
        "name": "Paralisia Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_11"
      },
      "monge": {
        "name": "Pressão de Chi Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_11"
      },
      "invocador": {
        "name": "Aprisionamento Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_11"
      },
      "samurai": {
        "name": "Iai Paralisante Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico telúrico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_11"
      },
      "lanceiro": {
        "name": "Cravamento Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico telúrico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Telúrico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico telúrico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "ground_slot12",
    "element": "ground",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "ground_slot10",
      "ground_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_12"
      },
      "arqueiro": {
        "name": "Chuva de Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_12"
      },
      "mago": {
        "name": "Apocalipse Terremoto",
        "description": "Habilidade definitiva. 150 de dano mágico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_12"
      },
      "assassino": {
        "name": "Execução Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_12"
      },
      "monge": {
        "name": "Despertar do Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_12"
      },
      "paladino": {
        "name": "Julgamento Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_12"
      },
      "curandeiro": {
        "name": "Bênção do Terremoto",
        "description": "Habilidade definitiva. 150 de dano mágico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_12"
      },
      "invocador": {
        "name": "Manifestação Terremoto",
        "description": "Habilidade definitiva. 150 de dano mágico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_12"
      },
      "samurai": {
        "name": "Bushido Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_12"
      },
      "bardo": {
        "name": "Sinfonia Terremoto",
        "description": "Habilidade definitiva. 150 de dano mágico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_12"
      },
      "lanceiro": {
        "name": "Lança Mística Terremoto",
        "description": "Habilidade definitiva. 150 de dano físico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_12"
      },
      "alquimista": {
        "name": "Transmutação Terremoto",
        "description": "Habilidade definitiva. 150 de dano mágico telúrico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_12"
      }
    }
  },
  {
    "id": "ground_slot13",
    "element": "ground",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "ground_slot10",
      "ground_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ground_13"
      },
      "arqueiro": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ground_13"
      },
      "mago": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ground_13"
      },
      "assassino": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ground_13"
      },
      "monge": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ground_13"
      },
      "paladino": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ground_13"
      },
      "curandeiro": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ground_13"
      },
      "invocador": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ground_13"
      },
      "samurai": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ground_13"
      },
      "bardo": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ground_13"
      },
      "lanceiro": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ground_13"
      },
      "alquimista": {
        "name": "Núcleo Sísmico",
        "description": "PASSIVA: +15% dano telúrico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ground_13"
      }
    }
  },
  {
    "id": "flying_slot1",
    "element": "flying",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_1"
      },
      "arqueiro": {
        "name": "Flecha Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_1"
      },
      "mago": {
        "name": "Esfera Aéreo",
        "description": "Causa 25 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_1"
      },
      "assassino": {
        "name": "Punhalada Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_1"
      },
      "monge": {
        "name": "Palma Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_1"
      },
      "curandeiro": {
        "name": "Brisa Aéreo",
        "description": "Causa 25 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_1"
      },
      "invocador": {
        "name": "Invocação Aéreo",
        "description": "Causa 25 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_1"
      },
      "samurai": {
        "name": "Corte Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_1"
      },
      "bardo": {
        "name": "Acorde Aéreo",
        "description": "Causa 25 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_1"
      },
      "lanceiro": {
        "name": "Estocada Aéreo",
        "description": "Causa 25 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_1"
      },
      "alquimista": {
        "name": "Frasco Aéreo",
        "description": "Causa 25 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_1"
      }
    }
  },
  {
    "id": "flying_slot2",
    "element": "flying",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_2"
      },
      "arqueiro": {
        "name": "Salto Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_2"
      },
      "mago": {
        "name": "Barreira Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_2"
      },
      "assassino": {
        "name": "Véu Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_2"
      },
      "monge": {
        "name": "Postura Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_2"
      },
      "paladino": {
        "name": "Escudo Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_2"
      },
      "curandeiro": {
        "name": "Bênção Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_2"
      },
      "invocador": {
        "name": "Selo Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_2"
      },
      "samurai": {
        "name": "Iaijutsu Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_2"
      },
      "bardo": {
        "name": "Acalanto Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_2"
      },
      "lanceiro": {
        "name": "Reverso Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_2"
      },
      "alquimista": {
        "name": "Vapor Aéreo",
        "description": "Concede 15 de escudo aéreo por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_2"
      }
    }
  },
  {
    "id": "flying_slot3",
    "element": "flying",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_3"
      },
      "arqueiro": {
        "name": "Mira Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_3"
      },
      "mago": {
        "name": "Selo Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_3"
      },
      "assassino": {
        "name": "Brasão Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_3"
      },
      "monge": {
        "name": "Tatuagem Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_3"
      },
      "paladino": {
        "name": "Sinal Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_3"
      },
      "invocador": {
        "name": "Maldição Leve Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_3"
      },
      "samurai": {
        "name": "Selo Ronin Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_3"
      },
      "bardo": {
        "name": "Ressonância Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_3"
      },
      "alquimista": {
        "name": "Tinta Aéreo",
        "description": "15% de chance de aplicar efeito aéreo (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "flying_slot4",
    "element": "flying",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "flying_slot1",
      "flying_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_4"
      },
      "arqueiro": {
        "name": "Disparo Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_4"
      },
      "mago": {
        "name": "Bola Aéreo",
        "description": "Causa 45 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_4"
      },
      "assassino": {
        "name": "Espinho Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_4"
      },
      "monge": {
        "name": "Punho Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_4"
      },
      "paladino": {
        "name": "Julgamento Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_4"
      },
      "curandeiro": {
        "name": "Bálsamo Aéreo",
        "description": "Causa 45 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_4"
      },
      "invocador": {
        "name": "Manifestação Aéreo",
        "description": "Causa 45 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_4"
      },
      "samurai": {
        "name": "Lâmina Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_4"
      },
      "bardo": {
        "name": "Melodia Aéreo",
        "description": "Causa 45 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_4"
      },
      "lanceiro": {
        "name": "Perfuração Aéreo",
        "description": "Causa 45 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_4"
      },
      "alquimista": {
        "name": "Poção Aéreo",
        "description": "Causa 45 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_4"
      }
    }
  },
  {
    "id": "flying_slot5",
    "element": "flying",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "flying_slot1",
      "flying_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_5"
      },
      "arqueiro": {
        "name": "Tiro Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_5"
      },
      "mago": {
        "name": "Vortex Aéreo",
        "description": "Atinge todos com 35 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_5"
      },
      "assassino": {
        "name": "Golpe Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_5"
      },
      "monge": {
        "name": "Foco Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_5"
      },
      "paladino": {
        "name": "Cetro Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_5"
      },
      "curandeiro": {
        "name": "Aura Aéreo",
        "description": "Atinge todos com 35 de dano mágico aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_5"
      },
      "invocador": {
        "name": "Sombra Aéreo",
        "description": "Atinge todos com 35 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_5"
      },
      "samurai": {
        "name": "Fenda Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_5"
      },
      "bardo": {
        "name": "Verso Aéreo",
        "description": "Atinge todos com 35 de dano mágico aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_5"
      },
      "lanceiro": {
        "name": "Salto Aéreo",
        "description": "Atinge todos com 35 de dano físico aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_5"
      },
      "alquimista": {
        "name": "Bomba Aéreo",
        "description": "Atinge todos com 35 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_5"
      }
    }
  },
  {
    "id": "flying_slot6",
    "element": "flying",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "flying_slot1",
      "flying_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_6"
      },
      "arqueiro": {
        "name": "Foco Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_6"
      },
      "mago": {
        "name": "Combustão Mental Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_6"
      },
      "assassino": {
        "name": "Espreita Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_6"
      },
      "monge": {
        "name": "Zen Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_6"
      },
      "paladino": {
        "name": "Voto Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_6"
      },
      "curandeiro": {
        "name": "Vibração Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_6"
      },
      "invocador": {
        "name": "Pacto Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_6"
      },
      "samurai": {
        "name": "Bushido Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_6"
      },
      "bardo": {
        "name": "Embalo Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_6"
      },
      "lanceiro": {
        "name": "Postura Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_6"
      },
      "alquimista": {
        "name": "Frasco Aéreo",
        "description": "Aumenta seu próprio dano aéreo em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_6"
      }
    }
  },
  {
    "id": "flying_slot7",
    "element": "flying",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "flying_slot4",
      "flying_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_7"
      },
      "arqueiro": {
        "name": "Ponta de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_7"
      },
      "mago": {
        "name": "Raio de Brisa",
        "description": "Ataque devastador. 75 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_7"
      },
      "assassino": {
        "name": "Lâmina de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_7"
      },
      "monge": {
        "name": "Kata de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_7"
      },
      "paladino": {
        "name": "Aura de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_7"
      },
      "curandeiro": {
        "name": "Prece de Brisa",
        "description": "Ataque devastador. 75 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_7"
      },
      "invocador": {
        "name": "Selo de Brisa",
        "description": "Ataque devastador. 75 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_7"
      },
      "samurai": {
        "name": "Iai de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_7"
      },
      "bardo": {
        "name": "Ressonância de Brisa",
        "description": "Ataque devastador. 75 de dano mágico aéreo. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_7"
      },
      "lanceiro": {
        "name": "Lança de Brisa",
        "description": "Ataque devastador. 75 de dano físico aéreo. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_7"
      },
      "alquimista": {
        "name": "Mistura de Brisa",
        "description": "Ataque devastador. 75 de dano mágico aéreo. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_7"
      }
    }
  },
  {
    "id": "flying_slot8",
    "element": "flying",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "flying_slot4",
      "flying_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_8"
      },
      "arqueiro": {
        "name": "Veneno Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_8"
      },
      "mago": {
        "name": "Maldição Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_8"
      },
      "assassino": {
        "name": "Selo Letal Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_8"
      },
      "monge": {
        "name": "Marca de Chi Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_8"
      },
      "paladino": {
        "name": "Estigma Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_8"
      },
      "curandeiro": {
        "name": "Pacto Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_8"
      },
      "invocador": {
        "name": "Maldição Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_8"
      },
      "samurai": {
        "name": "Honra Manchada Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_8"
      },
      "bardo": {
        "name": "Dissonância Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_8"
      },
      "lanceiro": {
        "name": "Cravo Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_8"
      },
      "alquimista": {
        "name": "Toxina Aéreo",
        "description": "40% de chance de aplicar efeito aéreo forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "flying_slot9",
    "element": "flying",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "flying_slot4",
      "flying_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_9"
      },
      "arqueiro": {
        "name": "Bálsamo Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_9"
      },
      "mago": {
        "name": "Recuperação Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_9"
      },
      "assassino": {
        "name": "Recuo Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_9"
      },
      "monge": {
        "name": "Meditação Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_9"
      },
      "paladino": {
        "name": "Bênção Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_9"
      },
      "curandeiro": {
        "name": "Cura Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_9"
      },
      "invocador": {
        "name": "Sucção Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_9"
      },
      "samurai": {
        "name": "Restauro Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_9"
      },
      "bardo": {
        "name": "Cantiga Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_9"
      },
      "lanceiro": {
        "name": "Sopro Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_9"
      },
      "alquimista": {
        "name": "Elixir Aéreo",
        "description": "Recupera 50 de HP usando energia aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_9"
      }
    }
  },
  {
    "id": "flying_slot10",
    "element": "flying",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "flying_slot7",
      "flying_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_10"
      },
      "arqueiro": {
        "name": "Trinca Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_10"
      },
      "mago": {
        "name": "Tríplice Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_10"
      },
      "assassino": {
        "name": "Tríade Letal Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_10"
      },
      "monge": {
        "name": "Trindade Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_10"
      },
      "invocador": {
        "name": "Tríade Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_10"
      },
      "samurai": {
        "name": "Tríplice Corte Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_10"
      },
      "bardo": {
        "name": "Acorde Triplo Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Aéreo",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_10"
      }
    }
  },
  {
    "id": "flying_slot11",
    "element": "flying",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "flying_slot7",
      "flying_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_11"
      },
      "arqueiro": {
        "name": "Imobilização Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_11"
      },
      "mago": {
        "name": "Petrificação Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_11"
      },
      "assassino": {
        "name": "Paralisia Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_11"
      },
      "monge": {
        "name": "Pressão de Chi Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_11"
      },
      "invocador": {
        "name": "Aprisionamento Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_11"
      },
      "samurai": {
        "name": "Iai Paralisante Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aéreo.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_11"
      },
      "lanceiro": {
        "name": "Cravamento Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico aéreo.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Aéreo",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico aéreo.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "flying_slot12",
    "element": "flying",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "flying_slot10",
      "flying_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_12"
      },
      "arqueiro": {
        "name": "Chuva de Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_12"
      },
      "mago": {
        "name": "Apocalipse Ciclone",
        "description": "Habilidade definitiva. 150 de dano mágico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_12"
      },
      "assassino": {
        "name": "Execução Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_12"
      },
      "monge": {
        "name": "Despertar do Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_12"
      },
      "paladino": {
        "name": "Julgamento Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_12"
      },
      "curandeiro": {
        "name": "Bênção do Ciclone",
        "description": "Habilidade definitiva. 150 de dano mágico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_12"
      },
      "invocador": {
        "name": "Manifestação Ciclone",
        "description": "Habilidade definitiva. 150 de dano mágico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_12"
      },
      "samurai": {
        "name": "Bushido Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_12"
      },
      "bardo": {
        "name": "Sinfonia Ciclone",
        "description": "Habilidade definitiva. 150 de dano mágico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_12"
      },
      "lanceiro": {
        "name": "Lança Mística Ciclone",
        "description": "Habilidade definitiva. 150 de dano físico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_12"
      },
      "alquimista": {
        "name": "Transmutação Ciclone",
        "description": "Habilidade definitiva. 150 de dano mágico aéreo. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_12"
      }
    }
  },
  {
    "id": "flying_slot13",
    "element": "flying",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "flying_slot10",
      "flying_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_flying_13"
      },
      "arqueiro": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_flying_13"
      },
      "mago": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_flying_13"
      },
      "assassino": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_flying_13"
      },
      "monge": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_flying_13"
      },
      "paladino": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_flying_13"
      },
      "curandeiro": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_flying_13"
      },
      "invocador": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_flying_13"
      },
      "samurai": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_flying_13"
      },
      "bardo": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_flying_13"
      },
      "lanceiro": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_flying_13"
      },
      "alquimista": {
        "name": "Pulmão Etéreo",
        "description": "PASSIVA: +15% dano aéreo, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_flying_13"
      }
    }
  },
  {
    "id": "ghost_slot1",
    "element": "ghost",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_1"
      },
      "arqueiro": {
        "name": "Flecha Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_1"
      },
      "mago": {
        "name": "Esfera Espectral",
        "description": "Causa 25 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_1"
      },
      "assassino": {
        "name": "Punhalada Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_1"
      },
      "monge": {
        "name": "Palma Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_1"
      },
      "curandeiro": {
        "name": "Brisa Espectral",
        "description": "Causa 25 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_1"
      },
      "invocador": {
        "name": "Invocação Espectral",
        "description": "Causa 25 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_1"
      },
      "samurai": {
        "name": "Corte Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_1"
      },
      "bardo": {
        "name": "Acorde Espectral",
        "description": "Causa 25 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_1"
      },
      "lanceiro": {
        "name": "Estocada Espectral",
        "description": "Causa 25 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_1"
      },
      "alquimista": {
        "name": "Frasco Espectral",
        "description": "Causa 25 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_1"
      }
    }
  },
  {
    "id": "ghost_slot2",
    "element": "ghost",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_2"
      },
      "arqueiro": {
        "name": "Salto Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_2"
      },
      "mago": {
        "name": "Barreira Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_2"
      },
      "assassino": {
        "name": "Véu Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_2"
      },
      "monge": {
        "name": "Postura Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_2"
      },
      "paladino": {
        "name": "Escudo Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_2"
      },
      "curandeiro": {
        "name": "Bênção Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_2"
      },
      "invocador": {
        "name": "Selo Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_2"
      },
      "samurai": {
        "name": "Iaijutsu Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_2"
      },
      "bardo": {
        "name": "Acalanto Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_2"
      },
      "lanceiro": {
        "name": "Reverso Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_2"
      },
      "alquimista": {
        "name": "Vapor Espectral",
        "description": "Concede 15 de escudo espectral por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_2"
      }
    }
  },
  {
    "id": "ghost_slot3",
    "element": "ghost",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_3"
      },
      "arqueiro": {
        "name": "Mira Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_3"
      },
      "mago": {
        "name": "Selo Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_3"
      },
      "assassino": {
        "name": "Brasão Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_3"
      },
      "monge": {
        "name": "Tatuagem Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_3"
      },
      "paladino": {
        "name": "Sinal Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_3"
      },
      "invocador": {
        "name": "Maldição Leve Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_3"
      },
      "samurai": {
        "name": "Selo Ronin Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_3"
      },
      "bardo": {
        "name": "Ressonância Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_3"
      },
      "alquimista": {
        "name": "Tinta Espectral",
        "description": "15% de chance de aplicar efeito espectral (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "ghost_slot4",
    "element": "ghost",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "ghost_slot1",
      "ghost_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_4"
      },
      "arqueiro": {
        "name": "Disparo Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_4"
      },
      "mago": {
        "name": "Bola Espectral",
        "description": "Causa 45 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_4"
      },
      "assassino": {
        "name": "Espinho Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_4"
      },
      "monge": {
        "name": "Punho Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_4"
      },
      "paladino": {
        "name": "Julgamento Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_4"
      },
      "curandeiro": {
        "name": "Bálsamo Espectral",
        "description": "Causa 45 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_4"
      },
      "invocador": {
        "name": "Manifestação Espectral",
        "description": "Causa 45 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_4"
      },
      "samurai": {
        "name": "Lâmina Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_4"
      },
      "bardo": {
        "name": "Melodia Espectral",
        "description": "Causa 45 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_4"
      },
      "lanceiro": {
        "name": "Perfuração Espectral",
        "description": "Causa 45 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_4"
      },
      "alquimista": {
        "name": "Poção Espectral",
        "description": "Causa 45 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_4"
      }
    }
  },
  {
    "id": "ghost_slot5",
    "element": "ghost",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "ghost_slot1",
      "ghost_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_5"
      },
      "arqueiro": {
        "name": "Tiro Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_5"
      },
      "mago": {
        "name": "Vortex Espectral",
        "description": "Atinge todos com 35 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_5"
      },
      "assassino": {
        "name": "Golpe Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_5"
      },
      "monge": {
        "name": "Foco Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_5"
      },
      "paladino": {
        "name": "Cetro Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_5"
      },
      "curandeiro": {
        "name": "Aura Espectral",
        "description": "Atinge todos com 35 de dano mágico espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_5"
      },
      "invocador": {
        "name": "Sombra Espectral",
        "description": "Atinge todos com 35 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_5"
      },
      "samurai": {
        "name": "Fenda Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_5"
      },
      "bardo": {
        "name": "Verso Espectral",
        "description": "Atinge todos com 35 de dano mágico espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_5"
      },
      "lanceiro": {
        "name": "Salto Espectral",
        "description": "Atinge todos com 35 de dano físico espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_5"
      },
      "alquimista": {
        "name": "Bomba Espectral",
        "description": "Atinge todos com 35 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_5"
      }
    }
  },
  {
    "id": "ghost_slot6",
    "element": "ghost",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "ghost_slot1",
      "ghost_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_6"
      },
      "arqueiro": {
        "name": "Foco Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_6"
      },
      "mago": {
        "name": "Combustão Mental Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_6"
      },
      "assassino": {
        "name": "Espreita Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_6"
      },
      "monge": {
        "name": "Zen Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_6"
      },
      "paladino": {
        "name": "Voto Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_6"
      },
      "curandeiro": {
        "name": "Vibração Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_6"
      },
      "invocador": {
        "name": "Pacto Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_6"
      },
      "samurai": {
        "name": "Bushido Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_6"
      },
      "bardo": {
        "name": "Embalo Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_6"
      },
      "lanceiro": {
        "name": "Postura Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_6"
      },
      "alquimista": {
        "name": "Frasco Espectral",
        "description": "Aumenta seu próprio dano espectral em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_6"
      }
    }
  },
  {
    "id": "ghost_slot7",
    "element": "ghost",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "ghost_slot4",
      "ghost_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_7"
      },
      "arqueiro": {
        "name": "Ponta de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_7"
      },
      "mago": {
        "name": "Raio de Alma",
        "description": "Ataque devastador. 75 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_7"
      },
      "assassino": {
        "name": "Lâmina de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_7"
      },
      "monge": {
        "name": "Kata de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_7"
      },
      "paladino": {
        "name": "Aura de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_7"
      },
      "curandeiro": {
        "name": "Prece de Alma",
        "description": "Ataque devastador. 75 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_7"
      },
      "invocador": {
        "name": "Selo de Alma",
        "description": "Ataque devastador. 75 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_7"
      },
      "samurai": {
        "name": "Iai de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_7"
      },
      "bardo": {
        "name": "Ressonância de Alma",
        "description": "Ataque devastador. 75 de dano mágico espectral. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_7"
      },
      "lanceiro": {
        "name": "Lança de Alma",
        "description": "Ataque devastador. 75 de dano físico espectral. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_7"
      },
      "alquimista": {
        "name": "Mistura de Alma",
        "description": "Ataque devastador. 75 de dano mágico espectral. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_7"
      }
    }
  },
  {
    "id": "ghost_slot8",
    "element": "ghost",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "ghost_slot4",
      "ghost_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_8"
      },
      "arqueiro": {
        "name": "Veneno Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_8"
      },
      "mago": {
        "name": "Maldição Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_8"
      },
      "assassino": {
        "name": "Selo Letal Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_8"
      },
      "monge": {
        "name": "Marca de Chi Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_8"
      },
      "paladino": {
        "name": "Estigma Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_8"
      },
      "curandeiro": {
        "name": "Pacto Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_8"
      },
      "invocador": {
        "name": "Maldição Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_8"
      },
      "samurai": {
        "name": "Honra Manchada Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_8"
      },
      "bardo": {
        "name": "Dissonância Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_8"
      },
      "lanceiro": {
        "name": "Cravo Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_8"
      },
      "alquimista": {
        "name": "Toxina Espectral",
        "description": "40% de chance de aplicar efeito espectral forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "ghost_slot9",
    "element": "ghost",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "ghost_slot4",
      "ghost_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_9"
      },
      "arqueiro": {
        "name": "Bálsamo Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_9"
      },
      "mago": {
        "name": "Recuperação Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_9"
      },
      "assassino": {
        "name": "Recuo Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_9"
      },
      "monge": {
        "name": "Meditação Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_9"
      },
      "paladino": {
        "name": "Bênção Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_9"
      },
      "curandeiro": {
        "name": "Cura Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_9"
      },
      "invocador": {
        "name": "Sucção Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_9"
      },
      "samurai": {
        "name": "Restauro Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_9"
      },
      "bardo": {
        "name": "Cantiga Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_9"
      },
      "lanceiro": {
        "name": "Sopro Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_9"
      },
      "alquimista": {
        "name": "Elixir Espectral",
        "description": "Recupera 50 de HP usando energia espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_9"
      }
    }
  },
  {
    "id": "ghost_slot10",
    "element": "ghost",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "ghost_slot7",
      "ghost_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_10"
      },
      "arqueiro": {
        "name": "Trinca Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_10"
      },
      "mago": {
        "name": "Tríplice Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_10"
      },
      "assassino": {
        "name": "Tríade Letal Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_10"
      },
      "monge": {
        "name": "Trindade Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_10"
      },
      "invocador": {
        "name": "Tríade Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_10"
      },
      "samurai": {
        "name": "Tríplice Corte Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_10"
      },
      "bardo": {
        "name": "Acorde Triplo Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Espectral",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_10"
      }
    }
  },
  {
    "id": "ghost_slot11",
    "element": "ghost",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "ghost_slot7",
      "ghost_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_11"
      },
      "arqueiro": {
        "name": "Imobilização Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_11"
      },
      "mago": {
        "name": "Petrificação Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_11"
      },
      "assassino": {
        "name": "Paralisia Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_11"
      },
      "monge": {
        "name": "Pressão de Chi Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_11"
      },
      "invocador": {
        "name": "Aprisionamento Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_11"
      },
      "samurai": {
        "name": "Iai Paralisante Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico espectral.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_11"
      },
      "lanceiro": {
        "name": "Cravamento Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico espectral.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Espectral",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico espectral.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "ghost_slot12",
    "element": "ghost",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "ghost_slot10",
      "ghost_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_12"
      },
      "arqueiro": {
        "name": "Chuva de Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_12"
      },
      "mago": {
        "name": "Apocalipse Assombração",
        "description": "Habilidade definitiva. 150 de dano mágico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_12"
      },
      "assassino": {
        "name": "Execução Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_12"
      },
      "monge": {
        "name": "Despertar do Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_12"
      },
      "paladino": {
        "name": "Julgamento Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_12"
      },
      "curandeiro": {
        "name": "Bênção do Assombração",
        "description": "Habilidade definitiva. 150 de dano mágico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_12"
      },
      "invocador": {
        "name": "Manifestação Assombração",
        "description": "Habilidade definitiva. 150 de dano mágico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_12"
      },
      "samurai": {
        "name": "Bushido Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_12"
      },
      "bardo": {
        "name": "Sinfonia Assombração",
        "description": "Habilidade definitiva. 150 de dano mágico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_12"
      },
      "lanceiro": {
        "name": "Lança Mística Assombração",
        "description": "Habilidade definitiva. 150 de dano físico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_12"
      },
      "alquimista": {
        "name": "Transmutação Assombração",
        "description": "Habilidade definitiva. 150 de dano mágico espectral. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_12"
      }
    }
  },
  {
    "id": "ghost_slot13",
    "element": "ghost",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "ghost_slot10",
      "ghost_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_ghost_13"
      },
      "arqueiro": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_ghost_13"
      },
      "mago": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_ghost_13"
      },
      "assassino": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_ghost_13"
      },
      "monge": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_ghost_13"
      },
      "paladino": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_ghost_13"
      },
      "curandeiro": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_ghost_13"
      },
      "invocador": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_ghost_13"
      },
      "samurai": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_ghost_13"
      },
      "bardo": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_ghost_13"
      },
      "lanceiro": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_ghost_13"
      },
      "alquimista": {
        "name": "Forma Etérea",
        "description": "PASSIVA: +15% dano espectral, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_ghost_13"
      }
    }
  },
  {
    "id": "steel_slot1",
    "element": "steel",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_1"
      },
      "arqueiro": {
        "name": "Flecha Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_1"
      },
      "mago": {
        "name": "Esfera Metálico",
        "description": "Causa 25 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_1"
      },
      "assassino": {
        "name": "Punhalada Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_1"
      },
      "monge": {
        "name": "Palma Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_1"
      },
      "curandeiro": {
        "name": "Brisa Metálico",
        "description": "Causa 25 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_1"
      },
      "invocador": {
        "name": "Invocação Metálico",
        "description": "Causa 25 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_1"
      },
      "samurai": {
        "name": "Corte Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_1"
      },
      "bardo": {
        "name": "Acorde Metálico",
        "description": "Causa 25 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_1"
      },
      "lanceiro": {
        "name": "Estocada Metálico",
        "description": "Causa 25 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_1"
      },
      "alquimista": {
        "name": "Frasco Metálico",
        "description": "Causa 25 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_1"
      }
    }
  },
  {
    "id": "steel_slot2",
    "element": "steel",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_2"
      },
      "arqueiro": {
        "name": "Salto Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_2"
      },
      "mago": {
        "name": "Barreira Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_2"
      },
      "assassino": {
        "name": "Véu Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_2"
      },
      "monge": {
        "name": "Postura Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_2"
      },
      "paladino": {
        "name": "Escudo Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_2"
      },
      "curandeiro": {
        "name": "Bênção Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_2"
      },
      "invocador": {
        "name": "Selo Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_2"
      },
      "samurai": {
        "name": "Iaijutsu Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_2"
      },
      "bardo": {
        "name": "Acalanto Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_2"
      },
      "lanceiro": {
        "name": "Reverso Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_2"
      },
      "alquimista": {
        "name": "Vapor Metálico",
        "description": "Concede 15 de escudo metálico por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_2"
      }
    }
  },
  {
    "id": "steel_slot3",
    "element": "steel",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_3"
      },
      "arqueiro": {
        "name": "Mira Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_3"
      },
      "mago": {
        "name": "Selo Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_3"
      },
      "assassino": {
        "name": "Brasão Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_3"
      },
      "monge": {
        "name": "Tatuagem Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_3"
      },
      "paladino": {
        "name": "Sinal Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_3"
      },
      "invocador": {
        "name": "Maldição Leve Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_3"
      },
      "samurai": {
        "name": "Selo Ronin Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_3"
      },
      "bardo": {
        "name": "Ressonância Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_3"
      },
      "alquimista": {
        "name": "Tinta Metálico",
        "description": "15% de chance de aplicar efeito metálico (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "steel_slot4",
    "element": "steel",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "steel_slot1",
      "steel_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_4"
      },
      "arqueiro": {
        "name": "Disparo Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_4"
      },
      "mago": {
        "name": "Bola Metálico",
        "description": "Causa 45 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_4"
      },
      "assassino": {
        "name": "Espinho Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_4"
      },
      "monge": {
        "name": "Punho Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_4"
      },
      "paladino": {
        "name": "Julgamento Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_4"
      },
      "curandeiro": {
        "name": "Bálsamo Metálico",
        "description": "Causa 45 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_4"
      },
      "invocador": {
        "name": "Manifestação Metálico",
        "description": "Causa 45 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_4"
      },
      "samurai": {
        "name": "Lâmina Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_4"
      },
      "bardo": {
        "name": "Melodia Metálico",
        "description": "Causa 45 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_4"
      },
      "lanceiro": {
        "name": "Perfuração Metálico",
        "description": "Causa 45 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_4"
      },
      "alquimista": {
        "name": "Poção Metálico",
        "description": "Causa 45 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_4"
      }
    }
  },
  {
    "id": "steel_slot5",
    "element": "steel",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "steel_slot1",
      "steel_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_5"
      },
      "arqueiro": {
        "name": "Tiro Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_5"
      },
      "mago": {
        "name": "Vortex Metálico",
        "description": "Atinge todos com 35 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_5"
      },
      "assassino": {
        "name": "Golpe Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_5"
      },
      "monge": {
        "name": "Foco Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_5"
      },
      "paladino": {
        "name": "Cetro Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_5"
      },
      "curandeiro": {
        "name": "Aura Metálico",
        "description": "Atinge todos com 35 de dano mágico metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_5"
      },
      "invocador": {
        "name": "Sombra Metálico",
        "description": "Atinge todos com 35 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_5"
      },
      "samurai": {
        "name": "Fenda Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_5"
      },
      "bardo": {
        "name": "Verso Metálico",
        "description": "Atinge todos com 35 de dano mágico metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_5"
      },
      "lanceiro": {
        "name": "Salto Metálico",
        "description": "Atinge todos com 35 de dano físico metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_5"
      },
      "alquimista": {
        "name": "Bomba Metálico",
        "description": "Atinge todos com 35 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_5"
      }
    }
  },
  {
    "id": "steel_slot6",
    "element": "steel",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "steel_slot1",
      "steel_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_6"
      },
      "arqueiro": {
        "name": "Foco Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_6"
      },
      "mago": {
        "name": "Combustão Mental Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_6"
      },
      "assassino": {
        "name": "Espreita Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_6"
      },
      "monge": {
        "name": "Zen Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_6"
      },
      "paladino": {
        "name": "Voto Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_6"
      },
      "curandeiro": {
        "name": "Vibração Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_6"
      },
      "invocador": {
        "name": "Pacto Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_6"
      },
      "samurai": {
        "name": "Bushido Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_6"
      },
      "bardo": {
        "name": "Embalo Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_6"
      },
      "lanceiro": {
        "name": "Postura Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_6"
      },
      "alquimista": {
        "name": "Frasco Metálico",
        "description": "Aumenta seu próprio dano metálico em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_6"
      }
    }
  },
  {
    "id": "steel_slot7",
    "element": "steel",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "steel_slot4",
      "steel_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_7"
      },
      "arqueiro": {
        "name": "Ponta de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_7"
      },
      "mago": {
        "name": "Raio de Lâmina",
        "description": "Ataque devastador. 75 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_7"
      },
      "assassino": {
        "name": "Lâmina de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_7"
      },
      "monge": {
        "name": "Kata de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_7"
      },
      "paladino": {
        "name": "Aura de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_7"
      },
      "curandeiro": {
        "name": "Prece de Lâmina",
        "description": "Ataque devastador. 75 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_7"
      },
      "invocador": {
        "name": "Selo de Lâmina",
        "description": "Ataque devastador. 75 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_7"
      },
      "samurai": {
        "name": "Iai de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_7"
      },
      "bardo": {
        "name": "Ressonância de Lâmina",
        "description": "Ataque devastador. 75 de dano mágico metálico. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_7"
      },
      "lanceiro": {
        "name": "Lança de Lâmina",
        "description": "Ataque devastador. 75 de dano físico metálico. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_7"
      },
      "alquimista": {
        "name": "Mistura de Lâmina",
        "description": "Ataque devastador. 75 de dano mágico metálico. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_7"
      }
    }
  },
  {
    "id": "steel_slot8",
    "element": "steel",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "steel_slot4",
      "steel_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_8"
      },
      "arqueiro": {
        "name": "Veneno Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_8"
      },
      "mago": {
        "name": "Maldição Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_8"
      },
      "assassino": {
        "name": "Selo Letal Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_8"
      },
      "monge": {
        "name": "Marca de Chi Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_8"
      },
      "paladino": {
        "name": "Estigma Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_8"
      },
      "curandeiro": {
        "name": "Pacto Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_8"
      },
      "invocador": {
        "name": "Maldição Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_8"
      },
      "samurai": {
        "name": "Honra Manchada Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_8"
      },
      "bardo": {
        "name": "Dissonância Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_8"
      },
      "lanceiro": {
        "name": "Cravo Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_8"
      },
      "alquimista": {
        "name": "Toxina Metálico",
        "description": "40% de chance de aplicar efeito metálico forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "steel_slot9",
    "element": "steel",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "steel_slot4",
      "steel_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_9"
      },
      "arqueiro": {
        "name": "Bálsamo Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_9"
      },
      "mago": {
        "name": "Recuperação Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_9"
      },
      "assassino": {
        "name": "Recuo Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_9"
      },
      "monge": {
        "name": "Meditação Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_9"
      },
      "paladino": {
        "name": "Bênção Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_9"
      },
      "curandeiro": {
        "name": "Cura Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_9"
      },
      "invocador": {
        "name": "Sucção Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_9"
      },
      "samurai": {
        "name": "Restauro Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_9"
      },
      "bardo": {
        "name": "Cantiga Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_9"
      },
      "lanceiro": {
        "name": "Sopro Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_9"
      },
      "alquimista": {
        "name": "Elixir Metálico",
        "description": "Recupera 50 de HP usando energia metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_9"
      }
    }
  },
  {
    "id": "steel_slot10",
    "element": "steel",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "steel_slot7",
      "steel_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_10"
      },
      "arqueiro": {
        "name": "Trinca Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_10"
      },
      "mago": {
        "name": "Tríplice Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_10"
      },
      "assassino": {
        "name": "Tríade Letal Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_10"
      },
      "monge": {
        "name": "Trindade Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_10"
      },
      "invocador": {
        "name": "Tríade Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_10"
      },
      "samurai": {
        "name": "Tríplice Corte Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_10"
      },
      "bardo": {
        "name": "Acorde Triplo Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Metálico",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_10"
      }
    }
  },
  {
    "id": "steel_slot11",
    "element": "steel",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "steel_slot7",
      "steel_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_11"
      },
      "arqueiro": {
        "name": "Imobilização Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_11"
      },
      "mago": {
        "name": "Petrificação Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_11"
      },
      "assassino": {
        "name": "Paralisia Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_11"
      },
      "monge": {
        "name": "Pressão de Chi Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_11"
      },
      "invocador": {
        "name": "Aprisionamento Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_11"
      },
      "samurai": {
        "name": "Iai Paralisante Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico metálico.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_11"
      },
      "lanceiro": {
        "name": "Cravamento Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico metálico.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Metálico",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico metálico.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "steel_slot12",
    "element": "steel",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "steel_slot10",
      "steel_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_12"
      },
      "arqueiro": {
        "name": "Chuva de Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_12"
      },
      "mago": {
        "name": "Apocalipse Cerco",
        "description": "Habilidade definitiva. 150 de dano mágico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_12"
      },
      "assassino": {
        "name": "Execução Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_12"
      },
      "monge": {
        "name": "Despertar do Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_12"
      },
      "paladino": {
        "name": "Julgamento Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_12"
      },
      "curandeiro": {
        "name": "Bênção do Cerco",
        "description": "Habilidade definitiva. 150 de dano mágico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_12"
      },
      "invocador": {
        "name": "Manifestação Cerco",
        "description": "Habilidade definitiva. 150 de dano mágico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_12"
      },
      "samurai": {
        "name": "Bushido Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_12"
      },
      "bardo": {
        "name": "Sinfonia Cerco",
        "description": "Habilidade definitiva. 150 de dano mágico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_12"
      },
      "lanceiro": {
        "name": "Lança Mística Cerco",
        "description": "Habilidade definitiva. 150 de dano físico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_12"
      },
      "alquimista": {
        "name": "Transmutação Cerco",
        "description": "Habilidade definitiva. 150 de dano mágico metálico. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_12"
      }
    }
  },
  {
    "id": "steel_slot13",
    "element": "steel",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "steel_slot10",
      "steel_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_steel_13"
      },
      "arqueiro": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_steel_13"
      },
      "mago": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_steel_13"
      },
      "assassino": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_steel_13"
      },
      "monge": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_steel_13"
      },
      "paladino": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_steel_13"
      },
      "curandeiro": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_steel_13"
      },
      "invocador": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_steel_13"
      },
      "samurai": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_steel_13"
      },
      "bardo": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_steel_13"
      },
      "lanceiro": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_steel_13"
      },
      "alquimista": {
        "name": "Pele de Aço",
        "description": "PASSIVA: +15% dano metálico, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_steel_13"
      }
    }
  },
  {
    "id": "dark_slot1",
    "element": "dark",
    "tier": 1,
    "slot": 1,
    "cost": 1,
    "mechanicType": "damage",
    "baseValue": 25,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Soco Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_1"
      },
      "arqueiro": {
        "name": "Flecha Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_1"
      },
      "mago": {
        "name": "Esfera Sombrio",
        "description": "Causa 25 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_1"
      },
      "assassino": {
        "name": "Punhalada Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_1"
      },
      "monge": {
        "name": "Palma Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_1"
      },
      "paladino": {
        "name": "Lâmina Sagrada Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_1"
      },
      "curandeiro": {
        "name": "Brisa Sombrio",
        "description": "Causa 25 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_1"
      },
      "invocador": {
        "name": "Invocação Sombrio",
        "description": "Causa 25 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_1"
      },
      "samurai": {
        "name": "Corte Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_1"
      },
      "bardo": {
        "name": "Acorde Sombrio",
        "description": "Causa 25 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_1"
      },
      "lanceiro": {
        "name": "Estocada Sombrio",
        "description": "Causa 25 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_1"
      },
      "alquimista": {
        "name": "Frasco Sombrio",
        "description": "Causa 25 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_1"
      }
    }
  },
  {
    "id": "dark_slot2",
    "element": "dark",
    "tier": 1,
    "slot": 2,
    "cost": 1,
    "mechanicType": "buff",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Aura Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_2"
      },
      "arqueiro": {
        "name": "Salto Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_2"
      },
      "mago": {
        "name": "Barreira Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_2"
      },
      "assassino": {
        "name": "Véu Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_2"
      },
      "monge": {
        "name": "Postura Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_2"
      },
      "paladino": {
        "name": "Escudo Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_2"
      },
      "curandeiro": {
        "name": "Bênção Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_2"
      },
      "invocador": {
        "name": "Selo Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_2"
      },
      "samurai": {
        "name": "Iaijutsu Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_2"
      },
      "bardo": {
        "name": "Acalanto Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_2"
      },
      "lanceiro": {
        "name": "Reverso Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_2"
      },
      "alquimista": {
        "name": "Vapor Sombrio",
        "description": "Concede 15 de escudo sombrio por 2 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_2"
      }
    }
  },
  {
    "id": "dark_slot3",
    "element": "dark",
    "tier": 1,
    "slot": 3,
    "cost": 1,
    "mechanicType": "status",
    "baseValue": 15,
    "prerequisites": [],
    "variants": {
      "guerreiro": {
        "name": "Marca Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_3"
      },
      "arqueiro": {
        "name": "Mira Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_3"
      },
      "mago": {
        "name": "Selo Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_3"
      },
      "assassino": {
        "name": "Brasão Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_3"
      },
      "monge": {
        "name": "Tatuagem Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_3"
      },
      "paladino": {
        "name": "Sinal Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_3"
      },
      "curandeiro": {
        "name": "Bênção Ardente Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_3"
      },
      "invocador": {
        "name": "Maldição Leve Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_3"
      },
      "samurai": {
        "name": "Selo Ronin Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_3"
      },
      "bardo": {
        "name": "Ressonância Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_3"
      },
      "lanceiro": {
        "name": "Marca de Lança Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_3"
      },
      "alquimista": {
        "name": "Tinta Sombrio",
        "description": "15% de chance de aplicar efeito sombrio (2 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_3"
      }
    },
    "statusChance": 0.15,
    "statusDuration": 2
  },
  {
    "id": "dark_slot4",
    "element": "dark",
    "tier": 2,
    "slot": 4,
    "cost": 2,
    "mechanicType": "damage",
    "baseValue": 45,
    "prerequisites": [
      "dark_slot1",
      "dark_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Lâmina Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_4"
      },
      "arqueiro": {
        "name": "Disparo Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_4"
      },
      "mago": {
        "name": "Bola Sombrio",
        "description": "Causa 45 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_4"
      },
      "assassino": {
        "name": "Espinho Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_4"
      },
      "monge": {
        "name": "Punho Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_4"
      },
      "paladino": {
        "name": "Julgamento Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_4"
      },
      "curandeiro": {
        "name": "Bálsamo Sombrio",
        "description": "Causa 45 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_4"
      },
      "invocador": {
        "name": "Manifestação Sombrio",
        "description": "Causa 45 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_4"
      },
      "samurai": {
        "name": "Lâmina Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_4"
      },
      "bardo": {
        "name": "Melodia Sombrio",
        "description": "Causa 45 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_4"
      },
      "lanceiro": {
        "name": "Perfuração Sombrio",
        "description": "Causa 45 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_4"
      },
      "alquimista": {
        "name": "Poção Sombrio",
        "description": "Causa 45 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_4"
      }
    }
  },
  {
    "id": "dark_slot5",
    "element": "dark",
    "tier": 2,
    "slot": 5,
    "cost": 2,
    "mechanicType": "aoe",
    "baseValue": 35,
    "prerequisites": [
      "dark_slot1",
      "dark_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Pisão Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_5"
      },
      "arqueiro": {
        "name": "Tiro Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_5"
      },
      "mago": {
        "name": "Vortex Sombrio",
        "description": "Atinge todos com 35 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_5"
      },
      "assassino": {
        "name": "Golpe Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_5"
      },
      "monge": {
        "name": "Foco Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_5"
      },
      "paladino": {
        "name": "Cetro Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_5"
      },
      "curandeiro": {
        "name": "Aura Sombrio",
        "description": "Atinge todos com 35 de dano mágico sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_5"
      },
      "invocador": {
        "name": "Sombra Sombrio",
        "description": "Atinge todos com 35 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_5"
      },
      "samurai": {
        "name": "Fenda Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_5"
      },
      "bardo": {
        "name": "Verso Sombrio",
        "description": "Atinge todos com 35 de dano mágico sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_5"
      },
      "lanceiro": {
        "name": "Salto Sombrio",
        "description": "Atinge todos com 35 de dano físico sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_5"
      },
      "alquimista": {
        "name": "Bomba Sombrio",
        "description": "Atinge todos com 35 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_5"
      }
    }
  },
  {
    "id": "dark_slot6",
    "element": "dark",
    "tier": 2,
    "slot": 6,
    "cost": 2,
    "mechanicType": "buff",
    "baseValue": 25,
    "prerequisites": [
      "dark_slot1",
      "dark_slot2"
    ],
    "variants": {
      "guerreiro": {
        "name": "Sangue Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_6"
      },
      "arqueiro": {
        "name": "Foco Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_6"
      },
      "mago": {
        "name": "Combustão Mental Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_6"
      },
      "assassino": {
        "name": "Espreita Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_6"
      },
      "monge": {
        "name": "Zen Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_6"
      },
      "paladino": {
        "name": "Voto Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_6"
      },
      "curandeiro": {
        "name": "Vibração Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_6"
      },
      "invocador": {
        "name": "Pacto Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_6"
      },
      "samurai": {
        "name": "Bushido Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_6"
      },
      "bardo": {
        "name": "Embalo Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_6"
      },
      "lanceiro": {
        "name": "Postura Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_6"
      },
      "alquimista": {
        "name": "Frasco Sombrio",
        "description": "Aumenta seu próprio dano sombrio em 25% por 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_6"
      }
    }
  },
  {
    "id": "dark_slot7",
    "element": "dark",
    "tier": 3,
    "slot": 7,
    "cost": 3,
    "mechanicType": "damage",
    "baseValue": 75,
    "prerequisites": [
      "dark_slot4",
      "dark_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Corte de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_7"
      },
      "arqueiro": {
        "name": "Ponta de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_7"
      },
      "mago": {
        "name": "Raio de Sombra",
        "description": "Ataque devastador. 75 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_7"
      },
      "assassino": {
        "name": "Lâmina de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Agilidade.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_7"
      },
      "monge": {
        "name": "Kata de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_7"
      },
      "paladino": {
        "name": "Aura de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_7"
      },
      "curandeiro": {
        "name": "Prece de Sombra",
        "description": "Ataque devastador. 75 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_7"
      },
      "invocador": {
        "name": "Selo de Sombra",
        "description": "Ataque devastador. 75 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_7"
      },
      "samurai": {
        "name": "Iai de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Força.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_7"
      },
      "bardo": {
        "name": "Ressonância de Sombra",
        "description": "Ataque devastador. 75 de dano mágico sombrio. Escala com Carisma.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_7"
      },
      "lanceiro": {
        "name": "Lança de Sombra",
        "description": "Ataque devastador. 75 de dano físico sombrio. Escala com Destreza.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_7"
      },
      "alquimista": {
        "name": "Mistura de Sombra",
        "description": "Ataque devastador. 75 de dano mágico sombrio. Escala com Inteligência.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_7"
      }
    }
  },
  {
    "id": "dark_slot8",
    "element": "dark",
    "tier": 3,
    "slot": 8,
    "cost": 3,
    "mechanicType": "status",
    "baseValue": 50,
    "prerequisites": [
      "dark_slot4",
      "dark_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Brasão Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_8"
      },
      "arqueiro": {
        "name": "Veneno Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_8"
      },
      "mago": {
        "name": "Maldição Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_8"
      },
      "assassino": {
        "name": "Selo Letal Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_8"
      },
      "monge": {
        "name": "Marca de Chi Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_8"
      },
      "paladino": {
        "name": "Estigma Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_8"
      },
      "curandeiro": {
        "name": "Pacto Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_8"
      },
      "invocador": {
        "name": "Maldição Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_8"
      },
      "samurai": {
        "name": "Honra Manchada Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_8"
      },
      "bardo": {
        "name": "Dissonância Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_8"
      },
      "lanceiro": {
        "name": "Cravo Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_8"
      },
      "alquimista": {
        "name": "Toxina Sombrio",
        "description": "40% de chance de aplicar efeito sombrio forte (5 turnos).",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_8"
      }
    },
    "statusChance": 0.4,
    "statusDuration": 5
  },
  {
    "id": "dark_slot9",
    "element": "dark",
    "tier": 3,
    "slot": 9,
    "cost": 3,
    "mechanicType": "heal",
    "baseValue": 50,
    "prerequisites": [
      "dark_slot4",
      "dark_slot5"
    ],
    "variants": {
      "guerreiro": {
        "name": "Forja Vital Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_9"
      },
      "arqueiro": {
        "name": "Bálsamo Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_9"
      },
      "mago": {
        "name": "Recuperação Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_9"
      },
      "assassino": {
        "name": "Recuo Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_9"
      },
      "monge": {
        "name": "Meditação Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_9"
      },
      "paladino": {
        "name": "Bênção Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_9"
      },
      "curandeiro": {
        "name": "Cura Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_9"
      },
      "invocador": {
        "name": "Sucção Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_9"
      },
      "samurai": {
        "name": "Restauro Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_9"
      },
      "bardo": {
        "name": "Cantiga Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_9"
      },
      "lanceiro": {
        "name": "Sopro Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_9"
      },
      "alquimista": {
        "name": "Elixir Sombrio",
        "description": "Recupera 50 de HP usando energia sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_9"
      }
    }
  },
  {
    "id": "dark_slot10",
    "element": "dark",
    "tier": 4,
    "slot": 10,
    "cost": 4,
    "mechanicType": "combo",
    "baseValue": 100,
    "prerequisites": [
      "dark_slot7",
      "dark_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Trifúria Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_10"
      },
      "arqueiro": {
        "name": "Trinca Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_10"
      },
      "mago": {
        "name": "Tríplice Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_10"
      },
      "assassino": {
        "name": "Tríade Letal Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_10"
      },
      "monge": {
        "name": "Trindade Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_10"
      },
      "paladino": {
        "name": "Triplo Julgamento Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_10"
      },
      "curandeiro": {
        "name": "Triplo Toque Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_10"
      },
      "invocador": {
        "name": "Tríade Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_10"
      },
      "samurai": {
        "name": "Tríplice Corte Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_10"
      },
      "bardo": {
        "name": "Acorde Triplo Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_10"
      },
      "lanceiro": {
        "name": "Tríplice Estocada Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano físico por hit.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_10"
      },
      "alquimista": {
        "name": "Tríplice Frasco Sombrio",
        "description": "Acerta 3 vezes seguidas. 33 de dano mágico por hit.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_10"
      }
    }
  },
  {
    "id": "dark_slot11",
    "element": "dark",
    "tier": 4,
    "slot": 11,
    "cost": 4,
    "mechanicType": "control",
    "baseValue": 60,
    "prerequisites": [
      "dark_slot7",
      "dark_slot8"
    ],
    "variants": {
      "guerreiro": {
        "name": "Atordoamento Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_11"
      },
      "arqueiro": {
        "name": "Imobilização Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_11"
      },
      "mago": {
        "name": "Petrificação Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_11"
      },
      "assassino": {
        "name": "Paralisia Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_11"
      },
      "monge": {
        "name": "Pressão de Chi Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_11"
      },
      "paladino": {
        "name": "Imobilização Sagrada Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_11"
      },
      "curandeiro": {
        "name": "Atordoamento Sagrado Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_11"
      },
      "invocador": {
        "name": "Aprisionamento Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_11"
      },
      "samurai": {
        "name": "Iai Paralisante Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_11"
      },
      "bardo": {
        "name": "Acorde Hipnótico Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico sombrio.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_11"
      },
      "lanceiro": {
        "name": "Cravamento Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano físico sombrio.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_11"
      },
      "alquimista": {
        "name": "Gás Atordoante Sombrio",
        "description": "Atordoa o inimigo por 1 turno. 60 de dano mágico sombrio.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_11"
      }
    },
    "statusDuration": 1
  },
  {
    "id": "dark_slot12",
    "element": "dark",
    "tier": 5,
    "slot": 12,
    "cost": 5,
    "mechanicType": "ultimate",
    "baseValue": 150,
    "prerequisites": [
      "dark_slot10",
      "dark_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Despertar Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_12"
      },
      "arqueiro": {
        "name": "Chuva de Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_12"
      },
      "mago": {
        "name": "Apocalipse Eclipse",
        "description": "Habilidade definitiva. 150 de dano mágico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_12"
      },
      "assassino": {
        "name": "Execução Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_12"
      },
      "monge": {
        "name": "Despertar do Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_12"
      },
      "paladino": {
        "name": "Julgamento Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_12"
      },
      "curandeiro": {
        "name": "Bênção do Eclipse",
        "description": "Habilidade definitiva. 150 de dano mágico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_12"
      },
      "invocador": {
        "name": "Manifestação Eclipse",
        "description": "Habilidade definitiva. 150 de dano mágico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_12"
      },
      "samurai": {
        "name": "Bushido Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_12"
      },
      "bardo": {
        "name": "Sinfonia Eclipse",
        "description": "Habilidade definitiva. 150 de dano mágico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_12"
      },
      "lanceiro": {
        "name": "Lança Mística Eclipse",
        "description": "Habilidade definitiva. 150 de dano físico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_12"
      },
      "alquimista": {
        "name": "Transmutação Eclipse",
        "description": "Habilidade definitiva. 150 de dano mágico sombrio. Cooldown 3 turnos.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_12"
      }
    }
  },
  {
    "id": "dark_slot13",
    "element": "dark",
    "tier": 5,
    "slot": 13,
    "cost": 5,
    "mechanicType": "passive",
    "baseValue": 0,
    "prerequisites": [
      "dark_slot10",
      "dark_slot11"
    ],
    "variants": {
      "guerreiro": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "guerreiro_dark_13"
      },
      "arqueiro": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "arqueiro_dark_13"
      },
      "mago": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "mago_dark_13"
      },
      "assassino": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "agilidade",
        "damageType": "physical",
        "visualKey": "assassino_dark_13"
      },
      "monge": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "monge_dark_13"
      },
      "paladino": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "paladino_dark_13"
      },
      "curandeiro": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "curandeiro_dark_13"
      },
      "invocador": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "invocador_dark_13"
      },
      "samurai": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "forca",
        "damageType": "physical",
        "visualKey": "samurai_dark_13"
      },
      "bardo": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "carisma",
        "damageType": "magical",
        "visualKey": "bardo_dark_13"
      },
      "lanceiro": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "destreza",
        "damageType": "physical",
        "visualKey": "lanceiro_dark_13"
      },
      "alquimista": {
        "name": "Coração Negro",
        "description": "PASSIVA: +15% dano sombrio, +5% proc de status, imunidade ao efeito.",
        "primaryAttribute": "inteligencia",
        "damageType": "magical",
        "visualKey": "alquimista_dark_13"
      }
    }
  }
];

// =================== HELPERS ===================

/**
 * Retorna todas as skills de um elemento específico.
 */
export function getSkillsByElement(element: ElementType): Skill[] {
  return SKILLS_REGISTRY.filter(s => s.element === element);
}

/**
 * Retorna uma skill específica (variante de uma classe).
 */
export function getSkillVariant(skillId: string, classType: ClassType): { skill: Skill; variant: ClassVariant } | null {
  const skill = SKILLS_REGISTRY.find(s => s.id === skillId);
  if (!skill) return null;
  return { skill, variant: skill.variants[classType] };
}

/**
 * Calcula multiplicador de afinidade de uma classe com um elemento.
 */
export function getAffinityBonus(classType: ClassType, element: ElementType): number {
  const aff = CLASS_ELEMENT_AFFINITY[classType];
  if (element === aff.primary) return 1 + AFFINITY_BONUS_PRIMARY;
  if (aff.affinities.includes(element)) return 1 + AFFINITY_BONUS_SECONDARY;
  return 1;
}

/**
 * Calcula multiplicador de efetividade (atacante x defensor).
 */
export function getEffectivenessMultiplier(attackerElem: ElementType, defenderElem: ElementType): number {
  return ELEMENT_EFFECTIVENESS[attackerElem][defenderElem];
}

/**
 * Calcula dano final de uma skill considerando classe, elemento, alvo e atributos.
 */
export function calculateSkillDamage(
  skill: Skill,
  classType: ClassType,
  attackerElement: ElementType,
  defenderElement: ElementType,
  attackerAttributeValue: number
): number {
  const variant = skill.variants[classType];
  const base = skill.baseValue;
  const classMultiplier = 1 + (attackerAttributeValue / 100);
  const affinityMultiplier = getAffinityBonus(classType, attackerElement);
  const effectivenessMultiplier = getEffectivenessMultiplier(attackerElement, defenderElement);
  
  return Math.round(base * classMultiplier * affinityMultiplier * effectivenessMultiplier);
}

/**
 * Retorna skills desbloqueadas para um aluno (baseado em quais skills ele já adquiriu).
 */
export function getAvailableSkills(unlockedSkillIds: string[], element: ElementType): Skill[] {
  const elementSkills = getSkillsByElement(element);
  return elementSkills.filter(skill => {
    if (skill.prerequisites.length === 0) return true;
    return skill.prerequisites.every(prereqId => unlockedSkillIds.includes(prereqId));
  });
}
