import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import { calculateDamage, estimateDamage, type CombatantStats } from './damageCalculator';
import {
  tickStatus, canAct, getAccuracyModifier, getAttackModifier, getDefenseModifier,
  defaultDuration, STAT_MODIFIERS,
  type ActiveStatus, type StatusEffect,
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
  turn:         number;
  phase:        BattlePhase;
  log:          BattleLogEntry[];
  /** Abilities the player has equipped for this fight */
  equippedAbilities: Ability[];
  /** XP / rewards after VICTORY */
  rewards?: { xp: number; coins?: number };
}

// ─── Item types ───────────────────────────────────────────────────────────────

export type ItemEffect = 'heal' | 'recharge' | 'cure' | 'revive';

// ─── Engine ───────────────────────────────────────────────────────────────────

export class BattleEngine {
  private ctx: BattleContext;

  constructor(player: BattleCharacter, enemy: BattleEnemy, equippedAbilities: Ability[]) {
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
      playerStatus: null,
      enemyStatus:  null,
      turn:         1,
      phase:        'STARTING',
      log:          [],
      equippedAbilities,
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
    const defender: CombatantStats = {
      level:        this.ctx.enemy.level,
      forca:        0,
      inteligencia: 0,
      agilidade:    this.ctx.enemy.velocidade,
      defFisica:    this.ctx.enemy.defFisica,
      defMagica:    this.ctx.enemy.defMagica,
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
      const finalDmg = Math.floor(result.damage * wetMod);
      this.ctx.enemy.hpCurrent = Math.max(0, this.ctx.enemy.hpCurrent - finalDmg);

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
      this.ctx.player.hpCurrent = Math.max(0, this.ctx.player.hpCurrent - result.damage);

      if (result.isCritical)         this.log('enemy', '💥 Acerto crítico!', 'effect');
      if (result.effectivenessLabel) this.log('enemy', result.effectivenessLabel, 'effect');
      this.log('enemy', `Você sofreu ${result.damage} de dano!`, 'damage', result.damage);

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
    this.ctx.phase = 'PLAYER_TURN';
  }

  // ─── Private: status ticks ───────────────────────────────────────────────────

  private tickPlayerStatus(): boolean {
    return this.tickStatusFor('player');
  }

  private tickEnemyStatus(): boolean {
    return this.tickStatusFor('enemy');
  }

  private tickStatusFor(target: 'player' | 'enemy'): boolean {
    const status  = target === 'player' ? this.ctx.playerStatus : this.ctx.enemyStatus;
    if (!status) return false;

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

    return result.blocked;
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
