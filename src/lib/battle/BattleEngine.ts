import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import type { ShopItem } from '@/types';
import {
  getEquipmentAbilityHandler,
  type BattleActionResult,
} from './equipmentAbilityRegistry';
import { calculateDamage, estimateDamage, type CombatantStats } from './damageCalculator';
import {
  tickStatus, canAct, getAccuracyModifier, getAttackModifier, getDefenseModifier,
  defaultDuration, STAT_MODIFIERS,
  type ActiveStatus, type StatusEffect, type EquipStatus,
} from './statusEffects';

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
}

// ─── Item types ───────────────────────────────────────────────────────────────

export type ItemEffect = 'heal' | 'recharge' | 'cure' | 'revive';

// ─── Engine ───────────────────────────────────────────────────────────────────

export class BattleEngine {
  private ctx: BattleContext;

  constructor(
    player: BattleCharacter,
    enemy: BattleEnemy,
    equippedAbilities: Ability[],
    equippedItem: ShopItem | null = null,
  ) {
    // Initialise PP for every equipped ability
    const abilityPP: Record<string, { current: number; max: number }> = {};
    for (const ability of equippedAbilities) {
      const max = BattleEngine.getMaxPP(ability);
      abilityPP[ability.id] = { current: max, max };
    }

    this.ctx = {
      player:       { ...player },      // shallow copy — won't mutate original
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
    };
  }

  // ─── Start ──────────────────────────────────────────────────────────────────

  start(): BattleContext {
    this.log('system', `⚔️ Batalha iniciada!`, 'info');
    this.log('system', `${this.ctx.player.name} vs ${this.ctx.enemy.name}!`, 'info');

    const playerFirst = this.ctx.player.agilidade >= this.ctx.enemy.velocidade;
    this.ctx.phase = playerFirst ? 'PLAYER_TURN' : 'ENEMY_TURN';

    this.log('system',
      playerFirst
        ? `${this.ctx.player.name} é mais ágil e ataca primeiro!`
        : `${this.ctx.enemy.name} é mais rápido e ataca primeiro!`,
      'info',
    );

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
    const wetMod  = getDefenseModifier(this.ctx.enemyStatus, ability.elementName);

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
    const modifiedAbility: Ability = { ...ability, accuracy: Math.floor(ability.accuracy * accMod) };
    const result = calculateDamage(attacker, defender, modifiedAbility);

    this.log('player', `${this.ctx.player.name} usou ${ability.name}!`, 'action');

    if (result.isMiss || result.isEvaded) {
      this.log('player', result.effectivenessLabel || (result.isMiss ? 'Errou!' : 'Desviou!'), 'info');
    } else if (result.effectiveness === 0) {
      this.log('player', '🛡️ Imune! Sem efeito.', 'effect');
    } else {
      const baseDmg  = Math.floor(result.damage * wetMod);
      const finalDmg = this.applyEquipStatusAmp(baseDmg, ability.damageType);
      this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - finalDmg);
      this.applyEquipStatusLifesteal(finalDmg);

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

      // Secondary effect
      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance
      ) {
        this.applyEffect('enemy', ability.effectType as StatusEffect);
      }
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

    this.ctx.phase = 'ENEMY_TURN';
    return this.snapshot();
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
      const dmg = calculateDamage(attacker, defender, modified);

      if (!dmg.isMiss && !dmg.isEvaded && dmg.effectiveness !== 0) {
        const finalDmg = Math.floor(dmg.damage * wetMod);
        this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - finalDmg);
        totalDamage = finalDmg;
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

    // Status tick
    const blocked = this.tickEnemyStatus();
    if (!blocked) {
      this.enemyChooseAndAttack();
    }

    // Player dead?
    if (this.ctx.player.hpCurrent <= 0) {
      this.ctx.player.hpCurrent = 0;
      this.ctx.phase = 'DEFEAT';
      this.log('system', '💀 Você foi derrotado!', 'info');
      return this.snapshot();
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
    const ability = this.ctx.enemy.abilities.find(a => a.id === abilityId);
    if (!ability) {
      this.log('enemy', `${this.ctx.enemy.name} não encontrou a habilidade!`, 'info');
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

    const result = calculateDamage(attacker, this.playerStats(), ability);

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
        this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - effectiveDmg2);
        this.log('enemy', `Você sofreu ${effectiveDmg2} de dano!`, 'damage', effectiveDmg2);
        if (effectiveDmg2 > 0) this.applyEquipStatusCounter(effectiveDmg2);
      }

      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance
      ) {
        this.applyEffect('player', ability.effectType as StatusEffect);
      }
    }
  }

  // ─── Private: enemy AI ───────────────────────────────────────────────────────

  private enemyChooseAndAttack() {
    if (!this.ctx.enemy.abilities.length) {
      this.log('enemy', `${this.ctx.enemy.name} ficou sem habilidades!`, 'info');
      return;
    }

    // Simple AI: pick ability that does most estimated damage (with some randomness)
    const sorted = [...this.ctx.enemy.abilities].sort(
      (a, b) =>
        estimateDamage(this.enemyStats(), this.playerStats(), b) -
        estimateDamage(this.enemyStats(), this.playerStats(), a),
    );

    // 60% chance to pick best, 40% random
    const ability = Math.random() < 0.6 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];

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

    const result = calculateDamage(attacker, this.playerStats(), ability);

    this.log('enemy', `${this.ctx.enemy.name} usou ${ability.name}!`, 'action');

    if (result.isMiss || result.isEvaded) {
      this.log('enemy', result.isEvaded ? 'Você desviou!' : 'Errou!', 'info');
    } else if (result.effectiveness === 0) {
      this.log('enemy', '🛡️ Imune! Sem efeito.', 'effect');
    } else {
      if (result.isCritical)         this.log('enemy', '💥 Acerto crítico!', 'effect');
      if (result.effectivenessLabel) this.log('enemy', result.effectivenessLabel, 'effect');

      const isMagic    = ability.damageType === 'Special';
      const effectiveDmg = this.applyEquipStatusOnIncomingDamage(result.damage, isMagic);
      if (effectiveDmg === -1) {
        // blocked by evasion / invincible / magic_immune
      } else {
        this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - effectiveDmg);
        this.log('enemy', `Você sofreu ${effectiveDmg} de dano!`, 'damage', effectiveDmg);
        if (effectiveDmg > 0) this.applyEquipStatusCounter(effectiveDmg);
      }

      if (
        ability.effectType &&
        !STAT_MODIFIERS.has(ability.effectType as StatusEffect) &&
        ability.effectChance &&
        Math.random() < ability.effectChance
      ) {
        this.applyEffect('player', ability.effectType as StatusEffect);
      }
    }
  }

  // ─── Private: turn management ────────────────────────────────────────────────

  private endTurn() {
    this.ctx.turn++;
    if (this.ctx.equipmentCooldown > 0) this.ctx.equipmentCooldown--;
    // Tick cooldownRounds for counter status (once per full round)
    for (const s of this.ctx.playerStatuses) {
      if (s.type === 'counter' && s.cooldownRounds !== undefined && s.cooldownRounds > 0 && s.cooldownRounds < 999) {
        s.cooldownRounds--;
      }
    }
    this.ctx.phase = 'PLAYER_TURN';
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
    const baseXP = this.ctx.enemy.level * 20 * (this.ctx.enemy.isBoss ? 3 : 1);
    const bonus  = Math.floor(baseXP * 0.1 * (this.ctx.turn < 5 ? 1.5 : 1)); // speed bonus
    this.ctx.rewards = {
      xp:    baseXP + bonus,
      coins: this.ctx.enemy.isBoss ? this.ctx.enemy.level * 10 : this.ctx.enemy.level * 3,
    };
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
    };
  }

  getContext(): BattleContext { return this.snapshot(); }
}
