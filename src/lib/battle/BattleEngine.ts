import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import type { ShopItem } from '@/types';
import {
  getEquipmentAbilityHandler,
  type BattleActionResult,
} from './equipmentAbilityRegistry';
import { calculateDamage, estimateDamage, type CombatantStats } from './damageCalculator';
import {
  applyAttributeModifiers, identityModifiers, type AttributeModifiers,
} from './attributeModifiers';
import {
  computeCoinReward, computeXpReward,
  BOSS_PHASE2_HP_THRESHOLD, BOSS_PHASE2_DAMAGE_REDUCTION,
} from './enemyScaling';
import {
  tickStatus, canAct, getAccuracyModifier, getAttackModifier, getDefenseModifier,
  defaultDuration, STAT_MODIFIERS,
  type ActiveStatus, type StatusEffect, type EquipStatus,
} from './statusEffects';
import type { BattlefieldEffect, PlayerForm, ElementOverride, EnemyMark, ExecutionRule, QueuedFollowUp } from './battleState';
// ─── Onda 11.3 — classes, elementos e passivas ────────────────────────────────
import type { ClassType } from '@/lib/skills/skillsRegistry';
import type { PassiveEffectAggregation } from '@/lib/skills/evolutionsRegistry';
import { getAffinityMultiplier } from './elementBridge';

// ─── Battle-specific types ────────────────────────────────────────────────────

export type BattlePhase =
  | 'STARTING'
  | 'PLAYER_TURN'
  | 'ENEMY_TURN'
  | 'PROCESSING'
  | 'VICTORY'
  | 'DEFEAT'
  | 'FLED';

export interface BattleEnemy {
  id:          string;
  name:        string;
  level:       number;
  hpCurrent:   number;
  hpMax:       number;
  defFisica:   number;
  defMagica:   number;
  velocidade:  number;
  elementType: ElementType;
  abilities:   Ability[];
  spriteUrl?:  string;
  isBoss?:     boolean;
  /** Floor depth (1..N) — used to scale rewards. Set by toBattleEnemy. */
  floorNumber?: number;
  // Special ability
  specialName?:        string;
  specialEffect?:      string;
  specialTrigger?:     'hp_below_50' | 'turn_3' | 'random_20pct';
  specialUsed?:        boolean;
}

export interface BattleLogEntry {
  turn:      number;
  actor:     'player' | 'enemy' | 'system';
  message:   string;
  type:      'action' | 'damage' | 'status' | 'effect' | 'info';
  value?:    number;   // damage / heal amount for UI animations
}

export interface BattleContext {
  player:       BattleCharacter;
  enemy:        BattleEnemy;
  /** PP (Power Points) per ability — how many uses remain this battle */
  abilityPP:    Record<string, { current: number; max: number }>;
  /** True once the Recharge item has been used this battle */
  rechargeUsed: boolean;
  /** Times the small potion (50 HP) has been used — max 3 */
  healSmallUses: number;
  /** True once the large potion (150 HP) has been used */
  healLargeUsed: boolean;
  playerStatus: ActiveStatus | null;
  enemyStatus:  ActiveStatus | null;
  /** Equipment-ability statuses — multiple can stack simultaneously */
  playerStatuses: EquipStatus[];
  enemyStatuses:  EquipStatus[];
  turn:         number;
  phase:        BattlePhase;
  log:          BattleLogEntry[];
  /** Abilities the player has equipped for this fight */
  equippedAbilities: Ability[];
  /** Equipped item that grants an in-battle ability (null if none) */
  equippedItem: ShopItem | null;
  /** Player turns the equipment ability is on cooldown for (0 = ready). */
  equipmentCooldown: number;
  /** True when an item flagged once_per_battle has already been spent. */
  equipmentUsed: boolean;
  /** XP / rewards after VICTORY */
  rewards?: { xp: number; coins?: number };
  /** Attribute-derived modifiers, computed once at battle start (Patch 2.1). */
  playerMods: AttributeModifiers;
  enemyMods:  AttributeModifiers;
  /** Patch 2.2: latched true once a boss falls below the phase-2 HP threshold. */
  bossPhase2Active: boolean;

  // ─── Patch 2.5 — generic mechanic slots ─────────────────────────────────
  // These exist so the higher-rarity card handlers the designer is writing
  // can express common mechanics without each card reinventing the engine
  // hook. Defaults are inert (no behaviour change) so any handler that
  // doesn't touch them runs exactly like before.

  /** Player auto-revives this many times when hit lethal damage (restored to 50% hpMax). */
  reviveCharges: number;
  /** Enemy will skip this many of its upcoming turns. */
  enemySkipTurns: number;
  /** Player auto-dodges every incoming attack until this counter reaches 0. */
  autoDodgeTurnsLeft: number;
  /** Enemy ability IDs the engine must remove from the enemy's pool. */
  erasedEnemyAbilityIds: string[];
  /** The last ability id used by the enemy (set by the engine after each enemy attack). */
  lastEnemyAbilityId: string | null;
  /** An enemy ability id the player has copied and can spend on their next attack. */
  copiedEnemyAbilityId: string | null;
  /** Forge buffs that were merged into playerMods at battle start (display only). */
  activeBuffs: ActiveBuffInput[];
  /** Guild raid phase (1–4) when this battle is a raid encounter; undefined otherwise. */
  raidPhase?: number;
  battlefieldEffects: BattlefieldEffect[];
  playerForms: PlayerForm[];
  elementOverrides: ElementOverride[];
  enemyMarks: EnemyMark[];
  executionRules: ExecutionRule[];
  queuedFollowUps: QueuedFollowUp[];

  // ─── Onda 11.3 — perfil de classe e passivas ─────────────────────────────
  /** Classe do jogador (null = aluno legacy sem onboarding 11.x). */
  playerClass:    ClassType | null;
  /** Elemento principal do jogador no namespace legacy ('Fire' etc.). null = sem afinidade. */
  playerElement:  ElementType | null;
  /** Passivas agregadas do jogador. null = sem passivas (comportamento legacy). */
  playerPassives: PassiveEffectAggregation | null;
  /** PvP: classe e passivas do oponente (sempre null em PvE). */
  enemyClass:     ClassType | null;
  enemyPassives:  PassiveEffectAggregation | null;
  /** True após a primeira skill do jogador na batalha (usado por firstTurnFree). */
  firstPlayerSkillUsed: boolean;
  /** True enquanto a passiva survive_lethal ainda está disponível nesta batalha. */
  surviveLethalAvailable: boolean;
  /** Mesmo para o oponente em PvP. */
  enemySurviveLethalAvailable: boolean;
  /** True se ainda devemos rolar enemyMissChance (sai depois do primeiro ataque do inimigo). */
  enemyMissCheckPending: boolean;
}

// ─── Item types ───────────────────────────────────────────────────────────────

export type ItemEffect = 'heal' | 'recharge' | 'cure' | 'revive';

// ─── Forge buff types (Patch 3.3 wiring) ──────────────────────────────────────

export type BuffEffectKey =
  | 'evade_bonus'
  | 'physical_dmg'
  | 'magic_dmg'
  | 'proc_bonus'
  | 'damage_reduction'
  | 'crit_bonus';

export interface ActiveBuffInput {
  /** temporary_buffs.effect column */
  effect:       BuffEffectKey;
  /** Magnitude — 0.10 = +10% (or −10% for damage_reduction). */
  effect_value: number;
  /** Display label for the battle log. */
  name?:        string;
}

/** Forge consumable effect — mirrors consumables.effect column. */
export type ConsumableEffectKey = 'heal_flat' | 'heal_percent' | 'cure' | 'revive' | 'recharge';

export interface ConsumableInput {
  key:          string;
  name:         string;
  effect:       ConsumableEffectKey;
  effect_value: number;
  icon?:        string;
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class BattleEngine {
  private ctx: BattleContext;

  constructor(
    player: BattleCharacter,
    enemy: BattleEnemy,
    equippedAbilities: Ability[],
    equippedItem: ShopItem | null = null,
    activeBuffs: ActiveBuffInput[] = [],
    raidPhase?: number,
    // ─── Onda 11.3 — opcionais; null/undefined = comportamento legacy ──
    playerClass:    ClassType | null = null,
    playerElement:  ElementType | null = null,
    playerPassives: PassiveEffectAggregation | null = null,
    enemyClass:     ClassType | null = null,
    enemyPassives:  PassiveEffectAggregation | null = null,
  ) {
    // Initialise PP for every equipped ability
    const abilityPP: Record<string, { current: number; max: number }> = {};
    for (const ability of equippedAbilities) {
      const max = BattleEngine.getMaxPP(ability);
      abilityPP[ability.id] = { current: max, max };
    }

    // Onda 11.3 — aplica hpMaxMult da passiva vitalidade no início da batalha.
    // Multiplica hpMax e preserva % de hpCurrent para evitar surpresas.
    const playerCopy: BattleCharacter = { ...player };
    if (playerPassives && playerPassives.hpMaxMult > 0) {
      const hpRatio = playerCopy.hpMax > 0 ? playerCopy.hpCurrent / playerCopy.hpMax : 1;
      playerCopy.hpMax = Math.max(1, Math.floor(playerCopy.hpMax * (1 + playerPassives.hpMaxMult)));
      playerCopy.hpCurrent = Math.max(1, Math.floor(playerCopy.hpMax * hpRatio));
    }

    this.ctx = {
      player:       playerCopy,
      enemy:        { ...enemy },
      abilityPP,
      rechargeUsed:  false,
      healSmallUses: 0,
      healLargeUsed: false,
      playerStatus:   null,
      enemyStatus:    null,
      playerStatuses: [],
      enemyStatuses:  [],
      turn:         1,
      phase:        'STARTING',
      log:          [],
      equippedAbilities,
      equippedItem,
      equipmentCooldown: 0,
      equipmentUsed:     false,
      // Patch 2.1: attribute modifiers computed once. Enemies stay at identity
      // (will be flipped on demand in Patch 2.2's boss phase-2 trigger).
      playerMods: BattleEngine.applyBuffsToMods(applyAttributeModifiers(player), activeBuffs),
      enemyMods:  identityModifiers(),
      activeBuffs: [...activeBuffs],
      raidPhase,
      bossPhase2Active: false,
      // Patch 2.5 inert defaults
      reviveCharges: 0,
      enemySkipTurns: 0,
      autoDodgeTurnsLeft: 0,
      erasedEnemyAbilityIds: [],
      lastEnemyAbilityId: null,
      copiedEnemyAbilityId: null,
      battlefieldEffects: [],
      playerForms: [],
      elementOverrides: [],
      enemyMarks: [],
      executionRules: [],
      queuedFollowUps: [],
      // Onda 11.3
      playerClass,
      playerElement,
      playerPassives,
      enemyClass,
      enemyPassives,
      firstPlayerSkillUsed: false,
      surviveLethalAvailable:        !!(playerPassives && playerPassives.surviveLethal),
      enemySurviveLethalAvailable:   !!(enemyPassives  && enemyPassives.surviveLethal),
      enemyMissCheckPending:         !!(playerPassives && playerPassives.enemyMissChance > 0),
    };
  }

  // ─── Start ──────────────────────────────────────────────────────────────────

  start(): BattleContext {
    this.log('system', `⚔️ Batalha iniciada!`, 'info');
    this.log('system', `${this.ctx.player.name} vs ${this.ctx.enemy.name}!`, 'info');

    // Patch 2.1: surface active attribute modifiers on battle start so we have
    // a clear trace in console + battle log. Eventually the HUD will read this.
    const m = this.ctx.playerMods;
    const a = this.ctx.player;
    console.info('[BattleEngine] Attribute modifiers active for', this.ctx.player.name, {
      attributes: {
        forca: a.forca, destreza: a.destreza, inteligencia: a.inteligencia,
        carisma: a.carisma, agilidade: a.agilidade, resistencia: a.resistencia,
      },
      modifiers: m,
    });
    const pct = (n: number) => Math.round(n * 100);
    this.log(
      'system',
      `⚙️ Atributos: +${pct(m.physicalDmgMult - 1)}% dano físico · +${pct(m.magicalDmgMult - 1)}% dano mágico · +${pct(m.critBonus)}% crit · +${pct(m.procMult - 1)}% efeito · +${pct(m.evadeBonus)}% esquiva · −${pct(1 - m.damageTakenMult)}% dano recebido`,
      'info',
    );

    if (this.ctx.raidPhase === 2) {
      this.log('system', '💀 Maldição da Guilda ativa — o boss drena 5% do seu HP máximo a cada turno.', 'effect');
    }
    if (this.ctx.raidPhase === 4) {
      this.log('enemy', `🔥 ${this.ctx.enemy.name} está ENFURECIDO! Dano dobrado.`, 'effect');
    }

    if (this.ctx.activeBuffs.length) {
      const summary = this.ctx.activeBuffs
        .map(b => b.name ?? b.effect)
        .join(', ');
      this.log('system', `🔮 Buffs da Forja ativos: ${summary}.`, 'effect');
    }

    // Onda 11.3 — log perfil de classe/elemento se setado.
    if (this.ctx.playerClass || this.ctx.playerElement) {
      const parts: string[] = [];
      if (this.ctx.playerClass)   parts.push(`Classe: ${this.ctx.playerClass}`);
      if (this.ctx.playerElement) parts.push(`Elemento: ${this.ctx.playerElement}`);
      this.log('system', `🎭 ${parts.join(' · ')}`, 'info');
    }
    if (this.ctx.playerPassives && this.ctx.playerPassives.hpMaxMult > 0) {
      this.log('system', `❤️ Vitalidade: HP máximo +${Math.round(this.ctx.playerPassives.hpMaxMult * 100)}% (${this.ctx.player.hpMax}).`, 'effect');
    }

    // Turn order: firstStrike (passive iniciativa) força o jogador primeiro.
    const passiveFirstStrike = !!(this.ctx.playerPassives && this.ctx.playerPassives.firstStrike);
    const playerFirst = passiveFirstStrike || this.ctx.player.agilidade >= this.ctx.enemy.velocidade;
    this.ctx.phase = playerFirst ? 'PLAYER_TURN' : 'ENEMY_TURN';

    if (passiveFirstStrike) {
      this.log('system', `⚡ Iniciativa: ${this.ctx.player.name} ataca primeiro!`, 'effect');
    } else {
      this.log('system',
        playerFirst
          ? `${this.ctx.player.name} é mais ágil e ataca primeiro!`
          : `${this.ctx.enemy.name} é mais rápido e ataca primeiro!`,
        'info',
      );
    }

    return this.snapshot();
  }

  // ─── Player Actions ──────────────────────────────────────────────────────────

  /** Player uses an equipped ability */
  playerAttack(abilityId: string): BattleContext {
    if (this.ctx.phase !== 'PLAYER_TURN') return this.snapshot();

    const ability = this.ctx.equippedAbilities.find(a => a.id === abilityId);
    if (!ability) {
      this.log('system', '❌ Habilidade não encontrada.', 'info');
      return this.snapshot();
    }

    // PP check
    const pp = this.ctx.abilityPP[ability.id];
    if (!pp || pp.current <= 0) {
      this.log('system', `❌ ${ability.name} sem PP! (0/${pp?.max ?? 0})`, 'info');
      return this.snapshot();
    }

    // Status tick (might block action)
    const blocked = this.tickPlayerStatus();
    if (blocked) {
      this.ctx.phase = 'ENEMY_TURN';
      return this.snapshot();
    }

    // Spend one PP
    pp.current--;

    // Status move
    if (ability.damageType === 'Status') {
      this.log('player', `${this.ctx.player.name} usou ${ability.name}!`, 'action');
      this.applyAbilityEffect('enemy', ability);
      this.ctx.phase = 'ENEMY_TURN';
      return this.snapshot();
    }

    // Build combatant stats
    const atkMod  = getAttackModifier(this.ctx.playerStatus);
    const accMod  = getAccuracyModifier(this.ctx.playerStatus);
    const effectiveAbility = this.resolvePlayerAttackAbility(ability);
    const wetMod  = getDefenseModifier(this.ctx.enemyStatus, effectiveAbility.elementName);

    const attacker: CombatantStats = {
      level:        this.ctx.player.level,
      forca:        Math.floor(this.ctx.player.forca       * atkMod),
      inteligencia: Math.floor(this.ctx.player.inteligencia * atkMod),
      agilidade:    this.ctx.player.agilidade,
      defFisica:    0,
      defMagica:    0,
    };
    // Apply defense_down from equip statuses to enemy defender stats
    const defDown = this.ctx.enemyStatuses
      .filter(s => s.type === 'defense_down')
      .reduce((acc, s) => acc + (s.value ?? 0), 0);
    const defender: CombatantStats = {
      level:        this.ctx.enemy.level,
      forca:        0,
      inteligencia: 0,
      agilidade:    this.ctx.enemy.velocidade,
      defFisica:    Math.max(0, this.ctx.enemy.defFisica - defDown),
      defMagica:    Math.max(0, this.ctx.enemy.defMagica - defDown),
      elementType:  this.ctx.enemy.elementType,
    };

    // Apply accuracy debuff by reducing ability accuracy temporarily
    const modifiedAbility: Ability = { ...effectiveAbility, accuracy: Math.floor(effectiveAbility.accuracy * accMod) };
    // Onda 11.3 — afinidade + passivas do jogador
    const passiveBundle = this.computePlayerPassiveBundle(modifiedAbility);
    const result = calculateDamage(attacker, defender, modifiedAbility, {
      attackerMods: this.ctx.playerMods,
      defenderMods: this.ctx.enemyMods,
      ...passiveBundle,
    });

    this.log('player', `${this.ctx.player.name} usou ${ability.name}!`, 'action');

    if (result.isMiss || result.isEvaded) {
      this.log('player', result.effectivenessLabel || (result.isMiss ? 'Errou!' : 'Desviou!'), 'info');
    } else if (result.effectiveness === 0) {
      this.log('player', '🛡️ Imune! Sem efeito.', 'effect');
    } else {
      const baseDmg  = Math.floor(result.damage * wetMod * this.getOutgoingFieldMultiplier(effectiveAbility.elementName) * this.getPlayerFormDamageMultiplier(effectiveAbility.damageType));
      const finalDmg = this.applyEquipStatusAmp(baseDmg, effectiveAbility.damageType);
      this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - finalDmg);
      this.applyEquipStatusLifesteal(finalDmg);
      this.onPlayerDamageDealt(finalDmg, result.effectiveness, effectiveAbility);
      this.maybeActivateBossPhase2();

      if (result.isCritical)         this.log('player', '💥 Acerto crítico!', 'effect');
      if (result.effectivenessLabel) this.log('player', result.effectivenessLabel, 'effect');
      this.log('player', `Causou ${finalDmg} de dano!`, 'damage', finalDmg);

      // Drain recovery
      if (ability.effectType === 'drain') {
        const recovered = Math.floor(finalDmg * 0.5);
        this.ctx.player.hpCurrent = Math.min(
          this.ctx.player.hpMax,
          this.ctx.player.hpCurrent + recovered,
        );
        this.log('player', `↩️ Absorveu ${recovered} HP!`, 'effect', recovered);
      }

      // Recoil damage
      if (ability.effectType === 'recoil') {
        const recoil = Math.floor(finalDmg * 0.25);
        this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - recoil);
        this.log('player', `💢 Recuo: −${recoil} HP próprio`, 'damage', recoil);
      }

      // Secondary effect — Patch 2.1: Carisma scales proc chance via procMult.
      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance * this.ctx.playerMods.procMult
      ) {
        this.applyEffect('enemy', ability.effectType as StatusEffect);
      }

      // Onda 11.3 — gatilhos pós-acerto (impacto / lifesteal / sombra)
      this.applyPlayerPostHitPassives(effectiveAbility, finalDmg);
    }

    // Check enemy death
    if (this.ctx.enemy.hpCurrent <= 0) {
      this.ctx.enemy.hpCurrent = 0;
      this.ctx.phase = 'VICTORY';
      this.computeRewards();
      this.log('system', `🏆 ${this.ctx.enemy.name} foi derrotado!`, 'info');
      return this.snapshot();
    }

    // Check enemy special ability trigger
    this.checkSpecialTrigger();

    // Onda 11.3 — firstTurnFree (tempo_suspenso): primeira skill da batalha
    // não consome turno. Marca usada e mantém PLAYER_TURN.
    const isFirstSkill = !this.ctx.firstPlayerSkillUsed;
    this.ctx.firstPlayerSkillUsed = true;
    const freeFirstTurn = isFirstSkill && !!(this.ctx.playerPassives && this.ctx.playerPassives.firstTurnFree);
    if (freeFirstTurn) {
      this.log('system', '⏳ Tempo Suspenso — sua primeira skill não consumiu turno.', 'effect');
      return this.snapshot();
    }

    this.ctx.phase = 'ENEMY_TURN';
    return this.snapshot();
  }

  // ─── Onda 11.3 — bundle de passivas para o calculateDamage ─────────────────

  private computePlayerPassiveBundle(ability: Ability) {
    const p = this.ctx.playerPassives;
    if (!p) {
      // Sem passivas: só afinidade de classe ainda pode aplicar.
      return {
        affinityMult: getAffinityMultiplier(this.ctx.playerClass, ability.elementName),
      };
    }
    const isPhysical = ability.damageType === 'Physical';
    const isMagical  = ability.damageType === 'Special';
    const hpRatio = this.ctx.player.hpMax > 0 ? this.ctx.player.hpCurrent / this.ctx.player.hpMax : 1;
    const lowHp = hpRatio < 0.30;

    let passiveDmgMult = 1;
    if (isPhysical) passiveDmgMult *= 1 + p.damageMultPhysical;
    if (isMagical)  passiveDmgMult *= 1 + p.damageMultMagical;
    if (lowHp)      passiveDmgMult *= 1 + p.damageMultLowHp;

    return {
      affinityMult:           getAffinityMultiplier(this.ctx.playerClass, ability.elementName),
      passiveDmgMult,
      passiveExtraCritChance: p.critChance,
      passiveCritMultiplier:  p.critMultiplier,
      defenseIgnore:          isPhysical ? p.defenseIgnore : 0,
      noMiss:                 p.noMiss,
    };
  }

  private applyPlayerPostHitPassives(ability: Ability, dmgDealt: number) {
    const p = this.ctx.playerPassives;
    if (!p || dmgDealt <= 0) return;

    // impacto — chance de stun em ataques físicos
    if (ability.damageType === 'Physical' && p.stunChance > 0 && Math.random() < p.stunChance) {
      this.log('player', '💫 Impacto — inimigo atordoado!', 'effect');
      this.applyEffect('enemy', 'stun' as StatusEffect);
    }

    // sombra — double attack: re-executa um golpe livre na mesma skill
    if (p.doubleAttackChance > 0 && Math.random() < p.doubleAttackChance) {
      const second = this.replayPlayerAttackOnce(ability);
      if (second > 0) {
        this.log('player', `🌑 Sombra — segundo ataque! +${second} de dano.`, 'damage', second);
      }
    }
  }

  /** Replica o cálculo de dano da skill atual sem consumir PP nem disparar onPlayerDamageDealt em cascata. */
  private replayPlayerAttackOnce(ability: Ability): number {
    if (this.ctx.enemy.hpCurrent <= 0) return 0;
    const atkMod = getAttackModifier(this.ctx.playerStatus);
    const accMod = getAccuracyModifier(this.ctx.playerStatus);
    const attacker: CombatantStats = {
      level:        this.ctx.player.level,
      forca:        Math.floor(this.ctx.player.forca       * atkMod),
      inteligencia: Math.floor(this.ctx.player.inteligencia * atkMod),
      agilidade:    this.ctx.player.agilidade,
      defFisica:    0,
      defMagica:    0,
    };
    const defender: CombatantStats = {
      level:        this.ctx.enemy.level,
      forca:        0,
      inteligencia: 0,
      agilidade:    this.ctx.enemy.velocidade,
      defFisica:    this.ctx.enemy.defFisica,
      defMagica:    this.ctx.enemy.defMagica,
      elementType:  this.ctx.enemy.elementType,
    };
    const modifiedAbility: Ability = { ...ability, accuracy: Math.floor(ability.accuracy * accMod) };
    const passiveBundle = this.computePlayerPassiveBundle(modifiedAbility);
    const r = calculateDamage(attacker, defender, modifiedAbility, {
      attackerMods: this.ctx.playerMods,
      defenderMods: this.ctx.enemyMods,
      ...passiveBundle,
    });
    if (r.isMiss || r.isEvaded || r.effectiveness === 0) return 0;
    this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - r.damage);
    return r.damage;
  }

  // ─── Onda 11.3 — passivas no ataque do inimigo / PvP ───────────────────────

  private computeEnemyPassiveBundle(ability: Ability) {
    // Em PvE o `enemy` não tem class profile — só identidade. Em PvP usa o
    // enemyClass/enemyPassives carregados no construtor.
    const p = this.ctx.enemyPassives;
    if (!p) {
      return {
        affinityMult: getAffinityMultiplier(this.ctx.enemyClass, ability.elementName),
      };
    }
    const isPhysical = ability.damageType === 'Physical';
    const isMagical  = ability.damageType === 'Special';
    const hpRatio = this.ctx.enemy.hpMax > 0 ? this.ctx.enemy.hpCurrent / this.ctx.enemy.hpMax : 1;
    const lowHp = hpRatio < 0.30;

    let passiveDmgMult = 1;
    if (isPhysical) passiveDmgMult *= 1 + p.damageMultPhysical;
    if (isMagical)  passiveDmgMult *= 1 + p.damageMultMagical;
    if (lowHp)      passiveDmgMult *= 1 + p.damageMultLowHp;

    return {
      affinityMult:           getAffinityMultiplier(this.ctx.enemyClass, ability.elementName),
      passiveDmgMult,
      passiveExtraCritChance: p.critChance,
      passiveCritMultiplier:  p.critMultiplier,
      defenseIgnore:          isPhysical ? p.defenseIgnore : 0,
      noMiss:                 p.noMiss,
    };
  }

  /** Persuasão — chance do inimigo errar o primeiro ataque da batalha. Retorna true se errou. */
  private tryRollEnemyFirstMiss(): boolean {
    if (!this.ctx.enemyMissCheckPending) return false;
    this.ctx.enemyMissCheckPending = false;
    const chance = this.ctx.playerPassives?.enemyMissChance ?? 0;
    if (chance > 0 && Math.random() < chance) {
      this.log('enemy', '🕊️ Persuasão — o inimigo hesitou e errou!', 'effect');
      return true;
    }
    return false;
  }

  /** Aplica dano ao jogador respeitando passivas (couro_duro, imortal). Retorna o dano efetivamente sofrido. */
  private applyDamageToPlayerWithPassives(rawDmg: number): number {
    let dmg = rawDmg;
    // couro_duro — damageTakenMult vem NEGATIVO no passive (e.g. -0.10).
    const dtMult = this.ctx.playerPassives?.damageTakenMult ?? 0;
    if (dtMult !== 0) dmg = Math.max(0, Math.floor(dmg * (1 + dtMult)));
    // imortal — sobrevive a golpe letal com 1 HP (uma vez por batalha).
    if (dmg >= this.ctx.player.hpCurrent && this.ctx.surviveLethalAvailable && this.ctx.player.hpCurrent > 0) {
      this.ctx.surviveLethalAvailable = false;
      dmg = this.ctx.player.hpCurrent - 1;
      this.ctx.player.hpCurrent = 1;
      this.log('player', '🔥 Imortal — sobreviveu com 1 HP!', 'effect');
      return Math.max(0, dmg);
    }
    this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - dmg);
    return dmg;
  }

  /** Player uses an item (does not consume an action in enemy turn if player turn) */
  useItem(effect: ItemEffect, value: number, abilityId?: string): BattleContext {
    if (this.ctx.phase !== 'PLAYER_TURN') return this.snapshot();

    switch (effect) {
      case 'heal': {
        if (value <= 50) {
          if (this.ctx.healSmallUses >= 3) {
            this.log('player', '🧪 Poção esgotada!', 'info');
            return this.snapshot();
          }
          this.ctx.healSmallUses++;
        } else {
          if (this.ctx.healLargeUsed) {
            this.log('player', '💊 Poção Grande já foi utilizada!', 'info');
            return this.snapshot();
          }
          this.ctx.healLargeUsed = true;
        }
        const gain = Math.min(value, this.ctx.player.hpMax - this.ctx.player.hpCurrent);
        this.ctx.player.hpCurrent += gain;
        this.log('player', `🧪 Usou poção — recuperou ${gain} HP!`, 'effect', gain);
        break;
      }
      case 'recharge': {
        if (this.ctx.rechargeUsed) {
          this.log('player', '🔋 Recarga já foi utilizada nessa batalha!', 'info');
          return this.snapshot();
        }
        const pp = abilityId ? this.ctx.abilityPP[abilityId] : null;
        if (!pp) return this.snapshot();
        this.ctx.rechargeUsed = true;
        pp.current = pp.max;
        const ability = this.ctx.equippedAbilities.find(a => a.id === abilityId);
        this.log('player', `🔋 PP de "${ability?.name ?? 'ataque'}" restaurado!`, 'effect');
        break;
      }
      case 'cure': {
        const removed = this.ctx.playerStatus?.type ?? null;
        this.ctx.playerStatus = null;
        this.log('player', removed ? `💊 Status (${removed}) curado!` : '💊 Sem status para curar.', 'effect');
        break;
      }
      case 'revive': {
        if (this.ctx.player.hpCurrent <= 0) {
          this.ctx.player.hpCurrent = Math.floor(this.ctx.player.hpMax * 0.5);
          this.log('player', '✨ Reviveu com 50% HP!', 'effect');
        }
        break;
      }
    }

    this.ctx.phase = 'ENEMY_TURN';
    return this.snapshot();
  }

  /**
   * Player triggers the active ability of the currently equipped item.
   * Dispatches by ability_mode:
   *  - 'unique': handler from equipmentAbilityRegistry (custom logic)
   *  - 'combo':  data-driven via the existing damage / status pipeline,
   *              parameters come from ability_config.
   *
   * Cooldown / availability rules come from ability_config:
   *  - cooldown:        number of player turns until usable again (default 2).
   *  - once_per_battle: when true, the item can only fire once and is permanently
   *                     disabled after a successful use, regardless of cooldown.
   */
  async useEquipmentAbility(): Promise<BattleContext> {
    if (this.ctx.phase !== 'PLAYER_TURN') return this.snapshot();

    const item = this.ctx.equippedItem;
    if (!item || !item.ability_mode) {
      this.log('system', '❌ Nenhum item equipado.', 'info');
      return this.snapshot();
    }

    if (this.ctx.equipmentCooldown > 0) {
      this.log(
        'system',
        `⏳ ${item.ability_name ?? item.name} em recarga (${this.ctx.equipmentCooldown}).`,
        'info',
      );
      return this.snapshot();
    }

    const config = (item.ability_config ?? {}) as Record<string, unknown>;
    const oncePerBattle = config.once_per_battle === true;
    if (oncePerBattle && this.ctx.equipmentUsed) {
      this.log('system', `❌ ${item.ability_name ?? item.name} já foi utilizado nesta batalha.`, 'info');
      return this.snapshot();
    }

    const blocked = this.tickPlayerStatus();
    if (blocked) {
      this.ctx.phase = 'ENEMY_TURN';
      return this.snapshot();
    }

    this.log('player', `${this.ctx.player.name} usou ${item.ability_name ?? item.name}!`, 'action');

    // Route all items with ability_key through registry (unique AND combo).
    // runUniqueEquipmentAbility already falls back to runComboEquipmentAbility
    // when no handler is registered.
    let result: BattleActionResult;
    if (item.ability_key) {
      result = await this.runUniqueEquipmentAbility(item);
    } else {
      result = this.runComboEquipmentAbility(config);
    }

    if (result.message) {
      this.log('player', result.message, result.damage ? 'damage' : 'effect', result.damage ?? result.heal);
    }
    if (result.damage && result.damage > 0) {
      this.onPlayerDamageDealt(result.damage, 1, null);
    }

    if (!result.success) {
      // Failure does not consume cooldown / once-per-battle.
      return this.snapshot();
    }

    // Cooldown comes from ability_config (default 2 turns). Clamped to >= 0.
    // For once_per_battle items we still set a cooldown so the cooldown text
    // doesn't matter — equipmentUsed permanently disables the button.
    const rawCooldown   = Number(config.cooldown);
    const cooldownTurns = Number.isFinite(rawCooldown) && rawCooldown >= 0 ? Math.floor(rawCooldown) : 2;
    this.ctx.equipmentCooldown = cooldownTurns;
    if (oncePerBattle) this.ctx.equipmentUsed = true;

    if (this.ctx.enemy.hpCurrent <= 0) {
      this.ctx.enemy.hpCurrent = 0;
      this.ctx.phase = 'VICTORY';
      this.computeRewards();
      this.log('system', `🏆 ${this.ctx.enemy.name} foi derrotado!`, 'info');
      return this.snapshot();
    }

    this.checkSpecialTrigger();
    this.ctx.phase = 'ENEMY_TURN';
    return this.snapshot();
  }

  private async runUniqueEquipmentAbility(item: ShopItem): Promise<BattleActionResult> {
    if (!item.ability_key) {
      return { success: false, message: '❌ Habilidade sem chave registrada.' };
    }
    const handler = getEquipmentAbilityHandler(item.ability_key);
    if (!handler && item.ability_config) {
      return this.runComboEquipmentAbility((item.ability_config ?? {}) as Record<string, unknown>);
    }
    if (!handler) {
      return { success: false, message: `❌ Handler "${item.ability_key}" não registrado.` };
    }
    return handler.execute(this.ctx);
  }

  private runComboEquipmentAbility(config: Record<string, unknown>): BattleActionResult {
    const damageType = (config.damage_type as Ability['damageType']) ?? 'Physical';
    const baseDamage = Number(config.base_damage ?? config.damage ?? 0);
    const accuracy   = Number(config.accuracy ?? 100);
    const effects    = Array.isArray(config.effects)
      ? (config.effects as Array<{ type: string; chance?: number }>)
      : [];

    let totalDamage = 0;

    if (baseDamage > 0 && damageType !== 'Status') {
      const fallbackElement: ElementType =
        (config.element as ElementType | undefined) ??
        this.ctx.equippedAbilities[0]?.elementName ??
        'Steel';
      const synthetic: Ability = {
        id:           '__equip_combo__',
        name:         'Equipment Skill',
        elementId:    0,
        elementName:  fallbackElement,
        tier:         1,
        damageType,
        baseDamage,
        energyCost:   0,
        accuracy,
        requirement:  0,
        description:  '',
      };

      const atkMod = getAttackModifier(this.ctx.playerStatus);
      const accMod = getAccuracyModifier(this.ctx.playerStatus);
      const wetMod = getDefenseModifier(this.ctx.enemyStatus, synthetic.elementName);

      const attacker: CombatantStats = {
        level:        this.ctx.player.level,
        forca:        Math.floor(this.ctx.player.forca        * atkMod),
        inteligencia: Math.floor(this.ctx.player.inteligencia * atkMod),
        agilidade:    this.ctx.player.agilidade,
        defFisica:    0,
        defMagica:    0,
      };
      const defender: CombatantStats = {
        level:        this.ctx.enemy.level,
        forca:        0,
        inteligencia: 0,
        agilidade:    this.ctx.enemy.velocidade,
        defFisica:    this.ctx.enemy.defFisica,
        defMagica:    this.ctx.enemy.defMagica,
        elementType:  this.ctx.enemy.elementType,
      };

      const modified = { ...synthetic, accuracy: Math.floor(synthetic.accuracy * accMod) };
      const dmg = calculateDamage(attacker, defender, modified, {
        attackerMods: this.ctx.playerMods,
        defenderMods: this.ctx.enemyMods,
      });

      if (!dmg.isMiss && !dmg.isEvaded && dmg.effectiveness !== 0) {
        const finalDmg = Math.floor(dmg.damage * wetMod);
        this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - finalDmg);
        totalDamage = finalDmg;
        this.maybeActivateBossPhase2();
      }
    }

    for (const eff of effects) {
      const rawChance = typeof eff.chance === 'number' ? eff.chance : 100;
      const chance = rawChance > 1 ? rawChance / 100 : rawChance;
      if (Math.random() <= Math.max(0, Math.min(1, chance))) {
        this.applyEffect('enemy', eff.type as StatusEffect);
      }
    }

    const message = totalDamage > 0
      ? `Causou ${totalDamage} de dano!`
      : effects.length
        ? '✨ Efeito aplicado!'
        : '⚪ Sem efeito.';

    return { success: true, damage: totalDamage || undefined, message };
  }

  /** Player flees — always succeeds (can gate behind agilidade check later) */
  flee(): BattleContext {
    this.log('system', '🏃 Você fugiu da batalha!', 'info');
    this.ctx.phase = 'FLED';
    return this.snapshot();
  }

  // ─── Enemy Turn ──────────────────────────────────────────────────────────────

  enemyTurn(): BattleContext {
    if (this.ctx.phase !== 'ENEMY_TURN') return this.snapshot();

    this.ctx.phase = 'PROCESSING';

    // Patch 2.5: time-stop / enemy-skip mechanic. A card can push N into
    // enemySkipTurns and we consume one each turn until back to 0.
    if (this.ctx.enemySkipTurns > 0) {
      this.ctx.enemySkipTurns -= 1;
      this.log('system', '⏸️ Tempo congelado — o inimigo perdeu o turno.', 'effect');
      this.endTurn();
      return this.snapshot();
    }

    // Raid phase 2 — guild curse: boss drains 5% of player max HP as true damage.
    this.applyRaidPhase2Curse();

    // Status tick
    const blocked = this.tickEnemyStatus();
    if (!blocked) {
      this.enemyChooseAndAttack();
    }

    // Player dead? — Patch 2.5 revive check kicks in here.
    if (this.ctx.player.hpCurrent <= 0) {
      if (this.ctx.reviveCharges > 0) {
        this.ctx.reviveCharges -= 1;
        this.ctx.player.hpCurrent = Math.max(1, Math.floor(this.ctx.player.hpMax * 0.5));
        this.log('system', `✨ Você renasceu! HP restaurado a ${this.ctx.player.hpCurrent}.`, 'effect');
      } else {
        this.ctx.player.hpCurrent = 0;
        this.ctx.phase = 'DEFEAT';
        this.log('system', '💀 Você foi derrotado!', 'info');
        return this.snapshot();
      }
    }

    this.endTurn();
    return this.snapshot();
  }

  // ─── PvP: enemy turn driven by opponent's choice ─────────────────────────────

  /** Like enemyTurn() but uses a specific ability chosen by the opponent player. */
  enemyAttackWith(abilityId: string): BattleContext {
    if (this.ctx.phase !== 'ENEMY_TURN') return this.snapshot();

    this.ctx.phase = 'PROCESSING';

    const blocked = this.tickEnemyStatus();
    if (!blocked) {
      this.enemyAttackWithAbility(abilityId);
    }

    if (this.ctx.player.hpCurrent <= 0) {
      this.ctx.player.hpCurrent = 0;
      this.ctx.phase = 'DEFEAT';
      this.log('system', '💀 Você foi derrotado!', 'info');
      return this.snapshot();
    }

    this.endTurn();
    return this.snapshot();
  }

  private enemyAttackWithAbility(abilityId: string) {
    // Patch 2.5: respect erased abilities even in the PvP-driven path.
    if (this.ctx.erasedEnemyAbilityIds.includes(abilityId)) {
      this.log('enemy', `${this.ctx.enemy.name} tentou uma habilidade apagada!`, 'info');
      return;
    }

    const ability = this.ctx.enemy.abilities.find(a => a.id === abilityId);
    if (!ability) {
      this.log('enemy', `${this.ctx.enemy.name} não encontrou a habilidade!`, 'info');
      return;
    }

    // Patch 2.5: track for copy mechanics.
    this.ctx.lastEnemyAbilityId = ability.id;

    // Patch 2.5: auto-dodge consumes one charge here too.
    if (this.ctx.autoDodgeTurnsLeft > 0) {
      this.ctx.autoDodgeTurnsLeft -= 1;
      this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');
      this.log('player', 'Você desviou automaticamente!', 'effect');
      return;
    }

    const atkMod = getAttackModifier(this.ctx.enemyStatus);
    const attacker: CombatantStats = {
      ...this.enemyStats(),
      forca:        Math.floor(this.enemyStats().forca        * atkMod),
      inteligencia: Math.floor(this.enemyStats().inteligencia * atkMod),
    };

    if (ability.damageType === 'Status') {
      this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');
      this.applyAbilityEffect('player', ability);
      return;
    }

    // Onda 11.3 — Persuasão também roda em PvP (passiva do "player" deste cliente).
    if (this.tryRollEnemyFirstMiss()) return;

    // Onda 11.3 — passivas do oponente em PvP modificam o ataque dele.
    const enemyBundle = this.computeEnemyPassiveBundle(ability);
    const result = calculateDamage(attacker, this.playerStats(), ability, {
      attackerMods: this.ctx.enemyMods,
      defenderMods: this.ctx.playerMods,
      ...enemyBundle,
    });

    this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');

    if (result.isMiss || result.isEvaded) {
      this.log('enemy', result.isEvaded ? 'Você desviou!' : 'Errou!', 'info');
    } else if (result.effectiveness === 0) {
      this.log('enemy', '🛡️ Imune! Sem efeito.', 'effect');
    } else {
      if (result.isCritical)         this.log('enemy', '💥 Acerto crítico!', 'effect');
      if (result.effectivenessLabel) this.log('enemy', result.effectivenessLabel, 'effect');

      const isMagic2     = ability.damageType === 'Special';
      const effectiveDmg2 = this.applyEquipStatusOnIncomingDamage(result.damage, isMagic2);
      if (effectiveDmg2 === -1) {
        // blocked
      } else {
        const sufferedDmg2 = this.applyDamageToPlayerWithPassives(effectiveDmg2);
        this.log('enemy', `Você sofreu ${sufferedDmg2} de dano!`, 'damage', sufferedDmg2);
        if (sufferedDmg2 > 0) this.applyEquipStatusCounter(sufferedDmg2);
      }

      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance * this.ctx.enemyMods.procMult
      ) {
        this.applyEffect('player', ability.effectType as StatusEffect);
      }
    }
  }

  // ─── Private: enemy AI ───────────────────────────────────────────────────────

  private enemyChooseAndAttack() {
    // Onda 11.3 — Persuasão (carisma 60): inimigo erra primeiro ataque.
    if (this.tryRollEnemyFirstMiss()) return;

    // Patch 2.5: filter out any abilities erased by player cards.
    const erased = this.ctx.erasedEnemyAbilityIds;
    const pool = erased.length === 0
      ? this.ctx.enemy.abilities
      : this.ctx.enemy.abilities.filter(a => !erased.includes(a.id));

    if (!pool.length) {
      this.log('enemy', `${this.ctx.enemy.name} ficou sem habilidades!`, 'info');
      return;
    }

    // Simple AI: pick ability that does most estimated damage (with some randomness)
    const sorted = [...pool].sort(
      (a, b) =>
        estimateDamage(this.enemyStats(), this.playerStats(), b) -
        estimateDamage(this.enemyStats(), this.playerStats(), a),
    );

    // 60% chance to pick best, 40% random
    const ability = Math.random() < 0.6 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];

    // Patch 2.5: record last enemy ability so "copy" cards can replay it.
    this.ctx.lastEnemyAbilityId = ability.id;

    // Patch 2.5: auto-dodge — player cards can grant N turns of guaranteed evade.
    if (this.ctx.autoDodgeTurnsLeft > 0) {
      this.ctx.autoDodgeTurnsLeft -= 1;
      this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');
      this.log('player', 'Você desviou automaticamente!', 'effect');
      return;
    }

    const atkMod = getAttackModifier(this.ctx.enemyStatus);
    const attacker: CombatantStats = {
      ...this.enemyStats(),
      forca:        Math.floor(this.enemyStats().forca        * atkMod),
      inteligencia: Math.floor(this.enemyStats().inteligencia * atkMod),
    };

    if (ability.damageType === 'Status') {
      this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');
      this.applyAbilityEffect('player', ability);
      return;
    }

    const result = calculateDamage(attacker, this.playerStats(), ability, {
      attackerMods: this.ctx.enemyMods,
      defenderMods: this.ctx.playerMods,
    });

    this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');

    if (result.isMiss || result.isEvaded) {
      this.log('enemy', result.isEvaded ? 'Você desviou!' : 'Errou!', 'info');
    } else if (result.effectiveness === 0) {
      this.log('enemy', '🛡️ Imune! Sem efeito.', 'effect');
    } else {
      if (result.isCritical)         this.log('enemy', '💥 Acerto crítico!', 'effect');
      if (result.effectivenessLabel) this.log('enemy', result.effectivenessLabel, 'effect');

      const isMagic    = ability.damageType === 'Special';
      const rawIncoming = this.applyRaidPhase4Multiplier(result.damage);
      const effectiveDmg = this.applyEquipStatusOnIncomingDamage(rawIncoming, isMagic);
      if (effectiveDmg === -1) {
        // blocked by evasion / invincible / magic_immune
      } else {
        // Onda 11.3: aplica couro_duro + imortal por baixo.
        const sufferedDmg = this.applyDamageToPlayerWithPassives(effectiveDmg);
        this.log('enemy', `Você sofreu ${sufferedDmg} de dano!`, 'damage', sufferedDmg);
        if (sufferedDmg > 0) this.applyEquipStatusCounter(sufferedDmg);
      }

      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance * this.ctx.enemyMods.procMult
      ) {
        this.applyEffect('player', ability.effectType as StatusEffect);
      }
    }
  }

  // ─── Private: raid phase mechanics ──────────────────────────────────────────

  /** Phase 2 — Maldição da Guilda. Boss drains 5% of player maxHP at the start
   *  of its turn as true damage (ignores defenses, statuses, shields). */
  private applyRaidPhase2Curse() {
    if (this.ctx.raidPhase !== 2) return;
    const dmg = Math.max(1, Math.ceil(this.ctx.player.hpMax * 0.05));
    this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - dmg);
    this.log('system', `💀 Maldição do Boss — você perde ${dmg} HP.`, 'damage', dmg);
  }

  /** Phase 4 — Boss enfurecido. All boss-dealt damage doubles before the
   *  defender's equip-status pipeline (shield/evasion/etc.) runs on top. */
  private applyRaidPhase4Multiplier(rawDmg: number): number {
    if (this.ctx.raidPhase !== 4) return rawDmg;
    return Math.floor(rawDmg * 2);
  }

  // ─── Private: turn management ────────────────────────────────────────────────

  private endTurn() {
    this.tickBattlefieldEffects();
    this.tickPlayerForms();
    this.ctx.turn++;
    if (this.ctx.equipmentCooldown > 0) this.ctx.equipmentCooldown--;
    // Tick cooldownRounds for counter status (once per full round)
    for (const s of this.ctx.playerStatuses) {
      if (s.type === 'counter' && s.cooldownRounds !== undefined && s.cooldownRounds > 0 && s.cooldownRounds < 999) {
        s.cooldownRounds--;
      }
    }
    // Onda 11.3 — inspiração (passiva healPerTurn): só em contexto de raid.
    this.applyHealPerTurnIfRaid();
    this.ctx.phase = 'PLAYER_TURN';
  }

  // Onda 11.3 — passiva inspiração: cura % do HP máximo por turno em raids.
  private applyHealPerTurnIfRaid() {
    const p = this.ctx.playerPassives;
    if (!p || !this.ctx.raidPhase || p.healPerTurn <= 0) return;
    if (this.ctx.player.hpCurrent <= 0) return;
    const heal = Math.max(1, Math.floor(this.ctx.player.hpMax * p.healPerTurn));
    const before = this.ctx.player.hpCurrent;
    this.ctx.player.hpCurrent = Math.min(this.ctx.player.hpMax, before + heal);
    const gained = this.ctx.player.hpCurrent - before;
    if (gained > 0) {
      this.log('player', `🎶 Inspiração — +${gained} HP.`, 'effect', gained);
    }
  }

  // ─── Private: status ticks ───────────────────────────────────────────────────

  // ─── Private: equipment status helpers ──────────────────────────────────────

  /** Apply amp multiplier when player deals damage. Returns amplified damage. */
  private applyEquipStatusAmp(rawDmg: number, damageType: Ability['damageType']): number {
    const ss = this.ctx.playerStatuses;
    const ampType = damageType === 'Physical' ? 'physical_amp' : damageType === 'Special' ? 'magic_amp' : null;
    if (!ampType) return rawDmg;
    const idx = ss.findIndex(s => s.type === ampType && (s.charges ?? 0) > 0);
    if (idx < 0) return rawDmg;
    const amp    = ss[idx];
    const result = Math.floor(rawDmg * (amp.multiplier ?? 2));
    amp.charges! -= 1;
    if (amp.charges! <= 0) ss.splice(idx, 1);
    this.log('player', `⚡ ${ampType === 'physical_amp' ? 'PHYSICAL' : 'MAGIC'} AMP ×${amp.multiplier ?? 2}!`, 'effect');
    return result;
  }

  /** Heal player by lifesteal percent after dealing damage. */
  private applyEquipStatusLifesteal(dmgDealt: number) {
    const ss = this.ctx.playerStatuses;
    for (const type of ['lifesteal', 'vampiric'] as const) {
      const idx = ss.findIndex(s => s.type === type && (s.charges ?? 0) > 0);
      if (idx < 0) continue;
      const ls     = ss[idx];
      const healed = Math.floor(dmgDealt * (ls.percent ?? 0.30));
      this.ctx.player.hpCurrent = Math.min(this.ctx.player.hpMax, this.ctx.player.hpCurrent + healed);
      ls.charges! -= 1;
      if (ls.charges! <= 0) ss.splice(idx, 1);
      this.log('player', `🩸 Lifesteal: +${healed} HP!`, 'effect', healed);
      break;
    }
  }

  /**
   * Process incoming damage through player equip statuses.
   * Returns effective damage after shields/evasion/etc.
   * Returns -1 if the attack is completely blocked.
   */
  private applyEquipStatusOnIncomingDamage(rawDmg: number, isMagic: boolean): number {
    const ss = this.ctx.playerStatuses;

    // 1. Evasion
    const evIdx = ss.findIndex(s => s.type === 'evasion' && (s.charges ?? 0) > 0);
    if (evIdx >= 0) {
      ss[evIdx].charges! -= 1;
      if (ss[evIdx].charges! <= 0) ss.splice(evIdx, 1);
      this.log('player', '💨 EVASION — ataque esquivado automaticamente!', 'effect');
      return -1;
    }

    // 2. Invincible
    const invIdx = ss.findIndex(s => s.type === 'invincible' && (s.charges ?? 0) > 0);
    if (invIdx >= 0) {
      ss[invIdx].charges! -= 1;
      if (ss[invIdx].charges! <= 0) ss.splice(invIdx, 1);
      this.log('player', '✨ INVINCIBLE — hit completamente negado!', 'effect');
      return -1;
    }

    // 3. Magic immune
    if (isMagic) {
      const imIdx = ss.findIndex(s => s.type === 'magic_immune' && ((s.turnsLeft ?? 0) > 0 || s.turnsLeft === -1));
      if (imIdx >= 0) {
        this.log('player', '🧿 MAGIC IMMUNE — dano mágico anulado!', 'effect');
        return -1;
      }
    }

    let dmg = rawDmg;

    // 4. Vulnerable (takes extra damage)
    const vulnIdx = ss.findIndex(s => s.type === 'vulnerable');
    if (vulnIdx >= 0) {
      dmg = Math.floor(dmg * (1 + (ss[vulnIdx].percent ?? 0.30)));
    }

    // 5. Shield (absorbs damage)
    const shieldIdx = ss.findIndex(s => s.type === 'shield' && (s.value ?? 0) > 0);
    if (shieldIdx >= 0) {
      const shield   = ss[shieldIdx];
      const absorbed = Math.min(shield.value!, dmg);
      shield.value! -= absorbed;
      dmg           -= absorbed;
      this.log('player', `🛡️ Escudo absorveu ${absorbed} de dano!`, 'effect');
      if (shield.value! <= 0) ss.splice(shieldIdx, 1);
    }

    return Math.max(0, dmg);
  }

  /** Reflect damage back to enemy via counter status. */
  private applyEquipStatusCounter(dmgReceived: number) {
    const ss       = this.ctx.playerStatuses;
    const cIdx     = ss.findIndex(s => s.type === 'counter' && (s.cooldownRounds ?? 0) <= 0);
    if (cIdx < 0 || dmgReceived <= 0) return;
    const counter  = ss[cIdx];
    const reflected = Math.floor(dmgReceived * (counter.multiplier ?? 2));
    this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - reflected);
    this.maybeActivateBossPhase2();
    this.log('player', `⚡ COUNTER — ${reflected} refletido ao inimigo!`, 'damage', reflected);
    // Set cooldown
    counter.cooldownRounds = 5;
    // Reduce charges if this counter has a use limit
    if (counter.charges !== undefined) {
      counter.charges -= 1;
      if (counter.charges <= 0) ss.splice(cIdx, 1);
    }
  }

  /** Tick equip DoT effects and decrement turnsLeft/charges. */
  private tickEquipStatusesFor(target: 'player' | 'enemy') {
    const ss = target === 'player' ? this.ctx.playerStatuses : this.ctx.enemyStatuses;
    for (const s of ss) {
      const val = s.value ?? 0;
      // DoT damage
      if (val > 0 && (s.type === 'burn' || s.type === 'poison' || s.type === 'bleed' || s.type === 'death_curse')) {
        const icon = s.type === 'burn' ? '🔥' : s.type === 'bleed' ? '🩸' : s.type === 'death_curse' ? '💀' : '☠️';
        if (target === 'player') {
          this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - val);
        } else {
          this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - val);
          this.maybeActivateBossPhase2();
        }
        this.log(target, `${icon} ${s.type}: −${val} HP!`, 'status', val);
      }
      // Tick turnsLeft
      if (s.turnsLeft !== undefined && s.turnsLeft > 0) s.turnsLeft -= 1;
    }
    // Remove expired
    for (let i = ss.length - 1; i >= 0; i--) {
      const s = ss[i];
      const tExpired = s.turnsLeft !== undefined && s.turnsLeft !== -1 && s.turnsLeft <= 0;
      const cExpired = s.charges !== undefined && s.charges <= 0;
      if (tExpired || cExpired) {
        this.log('system', `✅ Efeito (${s.type}) expirou.`, 'info');
        ss.splice(i, 1);
      }
    }
  }

  /** Returns true if enemy has an active stun/freeze equip status. */
  private isEnemyBlockedByEquipStatus(): boolean {
    return this.ctx.enemyStatuses.some(
      s => (s.type === 'stun' || s.type === 'freeze') &&
           ((s.turnsLeft !== undefined && s.turnsLeft > 0) || s.turnsLeft === -1),
    );
  }


  private resolvePlayerAttackAbility(ability: Ability): Ability {
    const form = [...this.ctx.playerForms].reverse().find(f => f.overrideAttackElement);
    const override = this.ctx.elementOverrides.find(o =>
      o.charges > 0 && (!o.onlyDamageType || o.onlyDamageType === ability.damageType),
    );
    const elementName = override?.replaceWith ?? form?.overrideAttackElement ?? ability.elementName;
    if (override) override.charges -= 1;
    this.ctx.elementOverrides = this.ctx.elementOverrides.filter(o => o.charges > 0);
    return elementName === ability.elementName ? ability : { ...ability, elementName };
  }

  private getPlayerFormDamageMultiplier(damageType: Ability['damageType']): number {
    return this.ctx.playerForms.reduce((mult, form) => {
      if (damageType === 'Physical') return mult * (form.physicalDmgMult ?? 1);
      if (damageType === 'Special') return mult * (form.magicalDmgMult ?? 1);
      return mult;
    }, 1);
  }

  private getOutgoingFieldMultiplier(element: ElementType): number {
    return this.ctx.battlefieldEffects.reduce(
      (mult, field) => mult * (field.outgoingElementMult?.[element] ?? 1),
      1,
    );
  }

  private onPlayerDamageDealt(damage: number, effectiveness: number, ability: Ability | null) {
    const murasame = this.ctx.enemyMarks.find(m => m.key === 'murasame_death_curse');
    if (murasame) murasame.stacks = Math.min(5, murasame.stacks + 1);

    if (ability && effectiveness > 1) {
      const followUps = this.ctx.queuedFollowUps.filter(f =>
        f.trigger === 'on_super_effective' && f.expiresAfterTurn >= this.ctx.turn,
      );
      for (const follow of followUps) {
        const bonus = Math.max(1, Math.floor(damage * follow.damageMultiplier));
        this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - bonus);
        this.log('player', `?? Follow-up super efetivo: ${bonus} de dano adicional!`, 'damage', bonus);
      }
      if (followUps.length) {
        this.ctx.queuedFollowUps = this.ctx.queuedFollowUps.filter(f => !followUps.includes(f));
      }
    }

    this.checkExecutionRules();
  }

  private checkExecutionRules() {
    for (const rule of this.ctx.executionRules) {
      if (rule.excludesBosses && this.ctx.enemy.isBoss) continue;
      const hpFraction = this.ctx.enemy.hpCurrent / Math.max(1, this.ctx.enemy.hpMax);
      if (hpFraction > rule.thresholdHpFraction) continue;
      if (rule.requiresMarkKey) {
        const mark = this.ctx.enemyMarks.find(m => m.key === rule.requiresMarkKey);
        if (!mark || mark.stacks < (rule.minStacks ?? 1)) continue;
      }
      if (this.ctx.enemy.hpCurrent > 0) {
        const dmg = this.ctx.enemy.hpCurrent;
        this.ctx.enemy.hpCurrent = 0;
        this.log('player', rule.message, 'damage', dmg);
      }
    }
  }

  private tickBattlefieldEffects() {
    for (const field of this.ctx.battlefieldEffects) {
      if (field.endTurnDamage) {
        const turn = field.endTurnDamage.currentTurn ?? 0;
        const dmg = field.endTurnDamage.base + turn * (field.endTurnDamage.growthPerTurn ?? 0);
        if (field.endTurnDamage.target === 'enemy') {
          this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - dmg);
          this.maybeActivateBossPhase2();
          this.log('enemy', `?? ${field.name}: ?${dmg} HP`, 'status', dmg);
        } else {
          this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - dmg);
          this.log('player', `?? ${field.name}: ?${dmg} HP`, 'status', dmg);
        }
        field.endTurnDamage.currentTurn = turn + 1;
      }
      if (field.turnsLeft !== null) field.turnsLeft -= 1;
    }
    this.ctx.battlefieldEffects = this.ctx.battlefieldEffects.filter(f => f.turnsLeft === null || f.turnsLeft > 0);
  }

  private tickPlayerForms() {
    for (const form of this.ctx.playerForms) {
      if (form.turnsLeft !== null) form.turnsLeft -= 1;
    }
    const expired = this.ctx.playerForms.filter(f => f.turnsLeft !== null && f.turnsLeft <= 0);
    for (const form of expired) {
      if (form.key === 'titan') {
        const originalHpMax = Number(form.payload?.originalHpMax ?? this.ctx.player.hpMax);
        this.ctx.player.hpMax = originalHpMax;
        this.ctx.player.hpCurrent = Math.min(this.ctx.player.hpCurrent, originalHpMax);
        this.log('system', '?? A forma Tit? terminou.', 'info');
      }
    }
    this.ctx.playerForms = this.ctx.playerForms.filter(f => f.turnsLeft === null || f.turnsLeft > 0);
  }

  private tickPlayerStatus(): boolean {
    return this.tickStatusFor('player');
  }

  private tickEnemyStatus(): boolean {
    return this.tickStatusFor('enemy');
  }

  private tickStatusFor(target: 'player' | 'enemy'): boolean {
    // Also process equip-status DoTs and blocking effects
    this.tickEquipStatusesFor(target);

    const status  = target === 'player' ? this.ctx.playerStatus : this.ctx.enemyStatus;
    if (!status) {
      // Even with no legacy status, equip stun/freeze can block enemy
      if (target === 'enemy') return this.isEnemyBlockedByEquipStatus();
      return false;
    }

    const maxHp     = target === 'player' ? this.ctx.player.hpMax  : this.ctx.enemy.hpMax;
    const currentHp = target === 'player' ? this.ctx.player.hpCurrent : this.ctx.enemy.hpCurrent;
    const result    = tickStatus(status, currentHp, maxHp);

    if (result.damage > 0) {
      if (target === 'player') {
        this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - result.damage);
      } else {
        this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - result.damage);
        this.maybeActivateBossPhase2();
      }
    }

    if (result.message) {
      this.log(target, result.message, 'status', result.damage || undefined);
    }

    // Decrement duration
    status.turnsRemaining--;
    if (status.turnsRemaining <= 0) {
      if (target === 'player') this.ctx.playerStatus = null;
      else                     this.ctx.enemyStatus  = null;
      this.log('system', `✅ Status ${status.type} removido.`, 'info');
    }

    // Merge with equip-status blocking (stun/freeze)
    return result.blocked || (target === 'enemy' && this.isEnemyBlockedByEquipStatus());
  }

  // ─── Private: apply effects ───────────────────────────────────────────────────

  private applyEffect(target: 'player' | 'enemy', effect: StatusEffect) {
    // Don't stack same status
    const current = target === 'player' ? this.ctx.playerStatus : this.ctx.enemyStatus;
    if (current?.type === effect) return;

    const status: ActiveStatus = { type: effect, turnsRemaining: defaultDuration(effect) };
    const name = target === 'player' ? this.ctx.player.name : this.ctx.enemy.name;

    if (target === 'player') this.ctx.playerStatus = status;
    else                     this.ctx.enemyStatus  = status;

    this.log(target, `${name} foi afetado por ${effect}!`, 'status');
  }

  private applyAbilityEffect(target: 'player' | 'enemy', ability: Ability) {
    if (!ability.effectType) return;
    const effect = ability.effectType as StatusEffect;

    // Heal effect applied to self (player)
    if (effect === 'heal' && target === 'player') {
      const amount = Math.floor(this.ctx.player.hpMax * 0.20);
      this.ctx.player.hpCurrent = Math.min(this.ctx.player.hpMax, this.ctx.player.hpCurrent + amount);
      this.log('player', `💚 Recuperou ${amount} HP!`, 'effect', amount);
      return;
    }

    if (!STAT_MODIFIERS.has(effect)) {
      this.applyEffect(target, effect);
    }
  }

  // ─── Private: special ability trigger ────────────────────────────────────────

  private checkSpecialTrigger() {
    const e = this.ctx.enemy;
    if (!e.specialTrigger || e.specialUsed || !e.specialName) return;

    let triggered = false;

    if (e.specialTrigger === 'hp_below_50' && e.hpCurrent < e.hpMax * 0.5) triggered = true;
    if (e.specialTrigger === 'turn_3'      && this.ctx.turn >= 3)           triggered = true;
    if (e.specialTrigger === 'random_20pct' && Math.random() < 0.20)        triggered = true;

    if (triggered) {
      e.specialUsed = true;
      this.log('enemy', `⚠️ ${e.name} ativou ${e.specialName}!`, 'effect');
      if (e.specialEffect) {
        this.log('enemy', e.specialEffect, 'info');
      }
    }
  }

  // ─── Private: PP helper ──────────────────────────────────────────────────────

  /**
   * Merge forge buffs onto the attribute-derived modifier set.
   * Multiplicative effects compound on top of attributes; additive effects
   * are clamped using the same caps that attributeModifiers enforces.
   */
  static applyBuffsToMods(
    base: AttributeModifiers,
    buffs: ActiveBuffInput[],
  ): AttributeModifiers {
    if (!buffs.length) return base;
    const out: AttributeModifiers = { ...base };
    for (const b of buffs) {
      const v = Number(b.effect_value) || 0;
      switch (b.effect) {
        case 'physical_dmg':     out.physicalDmgMult += v; break;
        case 'magic_dmg':        out.magicalDmgMult  += v; break;
        case 'crit_bonus':       out.critBonus       = Math.min(0.95, out.critBonus + v); break;
        case 'evade_bonus':      out.evadeBonus      = Math.min(0.80, out.evadeBonus + v); break;
        case 'proc_bonus':       out.procMult        += v; break;
        case 'damage_reduction': out.damageTakenMult = Math.max(0.05, out.damageTakenMult * (1 - v)); break;
      }
    }
    return out;
  }

  /** Apply a forge consumable effect mid-battle. Returns the updated context. */
  useConsumable(c: ConsumableInput, abilityId?: string): BattleContext {
    if (this.ctx.phase !== 'PLAYER_TURN') return this.snapshot();

    const label = c.name || c.key;
    switch (c.effect) {
      case 'heal_flat': {
        const gain = Math.min(c.effect_value, this.ctx.player.hpMax - this.ctx.player.hpCurrent);
        this.ctx.player.hpCurrent += gain;
        this.log('player', `${label} — +${gain} HP.`, 'effect', gain);
        break;
      }
      case 'heal_percent': {
        const amount = Math.floor(this.ctx.player.hpMax * c.effect_value);
        const gain = Math.min(amount, this.ctx.player.hpMax - this.ctx.player.hpCurrent);
        this.ctx.player.hpCurrent += gain;
        this.log('player', `${label} — +${gain} HP.`, 'effect', gain);
        break;
      }
      case 'cure': {
        const removed = this.ctx.playerStatus?.type ?? null;
        this.ctx.playerStatus = null;
        this.log('player', removed ? `${label} — status (${removed}) removido.` : `${label} — sem status.`, 'effect');
        break;
      }
      case 'revive': {
        if (this.ctx.player.hpCurrent <= 0) {
          this.ctx.player.hpCurrent = Math.floor(this.ctx.player.hpMax * 0.5);
          this.log('player', `${label} — reviveu com 50% HP.`, 'effect');
        } else {
          this.ctx.reviveCharges += 1;
          this.log('player', `${label} — guardia contra morte ativa.`, 'effect');
        }
        break;
      }
      case 'recharge': {
        const pp = abilityId ? this.ctx.abilityPP[abilityId] : null;
        if (pp) {
          pp.current = pp.max;
          const ability = this.ctx.equippedAbilities.find(a => a.id === abilityId);
          this.log('player', `${label} — PP de "${ability?.name ?? 'ataque'}" restaurado.`, 'effect');
        } else {
          for (const id of Object.keys(this.ctx.abilityPP)) {
            const slot = this.ctx.abilityPP[id];
            slot.current = slot.max;
          }
          this.log('player', `${label} — todos os PP restaurados.`, 'effect');
        }
        break;
      }
    }

    this.ctx.phase = 'ENEMY_TURN';
    return this.snapshot();
  }

  /** Returns how many uses (PP) an ability starts with, based on its tier. */
  static getMaxPP(ability: Ability): number {
    switch (ability.tier) {
      case 1: return 30;
      case 2: return 20;
      case 3: return 10;
      case 4: return 5;
      default: return 20;
    }
  }

  // ─── Private: stat helpers ───────────────────────────────────────────────────

  private playerStats(): CombatantStats {
    return {
      level:        this.ctx.player.level,
      forca:        this.ctx.player.forca,
      inteligencia: this.ctx.player.inteligencia,
      agilidade:    this.ctx.player.agilidade,
      // Both defenses use resistencia so the stat is meaningful and scaling is symmetric
      defFisica:    Math.floor(this.ctx.player.resistencia / 2),
      defMagica:    Math.floor(this.ctx.player.resistencia / 2),
    };
  }

  private enemyStats(): CombatantStats {
    // Enemy forca/inteligencia scale +1 per level — mirrors player attribute growth.
    // A small flat bonus (+2) keeps them slightly threatening without exponential gaps.
    const base = 8 + this.ctx.enemy.level;
    return {
      level:        this.ctx.enemy.level,
      forca:        base,
      inteligencia: base,
      agilidade:    this.ctx.enemy.velocidade,
      defFisica:    this.ctx.enemy.defFisica,
      defMagica:    this.ctx.enemy.defMagica,
      elementType:  this.ctx.enemy.elementType,
    };
  }

  // ─── Private: rewards ────────────────────────────────────────────────────────

  private computeRewards() {
    // Patch 2.2: rewards now derive from floor depth (+ enemy level for XP).
    // See enemyScaling.ts for the full curve and tunables. Speed bonus (early
    // wins) remains as a 10% XP kicker so fast clears still feel rewarding.
    const floor   = this.ctx.enemy.floorNumber ?? 1;
    const isBoss  = !!this.ctx.enemy.isBoss;
    const baseXP  = computeXpReward(floor, this.ctx.enemy.level, isBoss);
    const bonus   = Math.floor(baseXP * 0.1 * (this.ctx.turn < 5 ? 1.5 : 1));
    this.ctx.rewards = {
      xp:    baseXP + bonus,
      coins: computeCoinReward(floor, isBoss),
    };
  }

  /**
   * Patch 2.2 — Boss phase-2 trigger.
   * Once a boss drops below BOSS_PHASE2_HP_THRESHOLD, latch on a
   * permanent damageTakenMult so subsequent hits do less damage.
   * Logged exactly once for clarity.
   */
  private maybeActivateBossPhase2() {
    if (this.ctx.bossPhase2Active) return;
    if (!this.ctx.enemy.isBoss) return;
    const hpFraction = this.ctx.enemy.hpCurrent / Math.max(1, this.ctx.enemy.hpMax);
    if (hpFraction > BOSS_PHASE2_HP_THRESHOLD) return;
    if (this.ctx.enemy.hpCurrent <= 0) return; // boss already dead — skip

    this.ctx.bossPhase2Active = true;
    // Apply damage reduction by lowering the enemy's damageTakenMult.
    // identityModifiers is a fresh object so this mutation is safe.
    this.ctx.enemyMods = {
      ...this.ctx.enemyMods,
      damageTakenMult: this.ctx.enemyMods.damageTakenMult * (1 - BOSS_PHASE2_DAMAGE_REDUCTION),
    };
    this.log(
      'system',
      `🛡️ ${this.ctx.enemy.name} entrou em modo defensivo! Dano recebido −${Math.round(BOSS_PHASE2_DAMAGE_REDUCTION * 100)}%.`,
      'effect',
    );
  }

  // ─── Private: logging ────────────────────────────────────────────────────────

  private log(
    actor:   BattleLogEntry['actor'],
    message: string,
    type:    BattleLogEntry['type'],
    value?:  number,
  ) {
    this.ctx.log.push({ turn: this.ctx.turn, actor, message, type, value });
  }

  // ─── Snapshot (immutable copy for React state) ───────────────────────────────

  snapshot(): BattleContext {
    // Deep-copy abilityPP so React detects the state change
    const ppCopy: Record<string, { current: number; max: number }> = {};
    for (const [id, pp] of Object.entries(this.ctx.abilityPP)) {
      ppCopy[id] = { ...pp };
    }
    return {
      ...this.ctx,
      player:            { ...this.ctx.player },
      enemy:             { ...this.ctx.enemy  },
      log:               [...this.ctx.log],
      equippedAbilities: [...this.ctx.equippedAbilities],
      abilityPP:         ppCopy,
      battlefieldEffects: this.ctx.battlefieldEffects.map(f => ({ ...f, outgoingElementMult: { ...f.outgoingElementMult }, incomingElementMult: { ...f.incomingElementMult }, endTurnDamage: f.endTurnDamage ? { ...f.endTurnDamage } : undefined })),
      playerForms: this.ctx.playerForms.map(f => ({ ...f, payload: f.payload ? { ...f.payload } : undefined })),
      elementOverrides: this.ctx.elementOverrides.map(o => ({ ...o })),
      enemyMarks: this.ctx.enemyMarks.map(m => ({ ...m })),
      executionRules: this.ctx.executionRules.map(r => ({ ...r })),
      queuedFollowUps: this.ctx.queuedFollowUps.map(f => ({ ...f })),
    };
  }

  getContext(): BattleContext { return this.snapshot(); }
}
