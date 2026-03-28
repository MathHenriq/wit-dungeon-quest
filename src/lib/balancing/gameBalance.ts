// ─── Constantes de balanceamento centralizadas ────────────────────────────────
// Altere aqui para ajustar qualquer valor do jogo sem mexer na lógica.

export const GAME_BALANCE = {

  // ── Progressão ──────────────────────────────────────────────────────────────
  XP_PER_LEVEL_EXPONENT:          1.5,    // Curva de XP (higher = mais lento)
  XP_BASE_MULTIPLIER:             100,    // XP necessário no level 1
  POINTS_PER_LEVEL:               3,      // Pontos elementais por level up
  ATTRIBUTE_INCREASE_PER_LEVEL:   1,      // Aumento em cada atributo base

  // ── Energia ─────────────────────────────────────────────────────────────────
  ENERGY_BASE:                    100,
  ENERGY_REGEN_PER_TURN:          5,      // Regen base por turno
  ENERGY_REGEN_LEVEL_BONUS:       0.5,    // +0.5 de regen por level

  // ── Dano ────────────────────────────────────────────────────────────────────
  DAMAGE_LEVEL_DIVISOR:           50,     // Divisor na fórmula de dano
  DAMAGE_VARIANCE_MIN:            0.85,   // Dano mínimo = 85% do base
  DAMAGE_VARIANCE_MAX:            1.0,    // Dano máximo = 100% do base

  // ── Crítico ─────────────────────────────────────────────────────────────────
  CRIT_BASE_CHANCE:               0.05,   // 5% chance base
  CRIT_AGILITY_DIVISOR:           1000,   // Agilidade / divisor = chance extra
  CRIT_MULTIPLIER:                1.5,    // Dano x1.5 no crítico

  // ── Type Effectiveness ──────────────────────────────────────────────────────
  TYPE_SUPER_EFFECTIVE:           2.0,
  TYPE_NOT_VERY_EFFECTIVE:        0.5,
  TYPE_IMMUNE:                    0.0,

  // ── Anti-farm ───────────────────────────────────────────────────────────────
  ANTI_FARM_LEVEL_DIFF:           -5,     // Inimigo 5+ levels abaixo
  ANTI_FARM_XP_MULTIPLIER:        0.2,    // → 80% menos XP

  // ── Boss ────────────────────────────────────────────────────────────────────
  BOSS_XP_MULTIPLIER:             2.0,
  BOSS_COINS_MULTIPLIER:          3.0,
  BOSS_HP_MULTIPLIER:             1.5,    // Para uso em FloorCreator

  // ── Inimigos mais fortes ─────────────────────────────────────────────────
  STRONGER_ENEMY_LEVEL_DIFF:      3,      // Inimigo 3+ levels acima
  STRONGER_ENEMY_XP_BONUS:        1.5,    // → 50% mais XP

  // ── Drops ───────────────────────────────────────────────────────────────────
  DROP_COIN_PER_LEVEL:            10,
  DROP_COIN_VARIANCE:             0.4,    // ±20% aleatório
  DROP_DIAMOND_BOSS_MIN:          1,
  DROP_DIAMOND_BOSS_MAX:          3,
  DROP_DIAMOND_BONUS_CHANCE:      0.10,   // 10% de bônus extra

  // ── PvP ─────────────────────────────────────────────────────────────────────
  PVP_ELO_K_FACTOR:               32,
  PVP_MATCHMAKING_LEVEL_RANGE:    5,
  PVP_MATCHMAKING_RATING_RANGE:   200,

} as const;

export type BalanceKey = keyof typeof GAME_BALANCE;
