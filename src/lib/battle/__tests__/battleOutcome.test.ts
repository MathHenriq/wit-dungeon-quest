import { describe, it, expect, afterEach, vi } from 'vitest';
import { BattleEngine } from '../BattleEngine';
import { makeAbility, makeEnemy, makePlayer } from './factories';

/**
 * Regression tests for the end-of-battle arbiter.
 *
 * Every one of these used to leave the fight running with a 0 HP combatant
 * still taking turns, because only direct hits checked for a KO.
 */

afterEach(() => vi.restoreAllMocks());

/**
 * Pin the RNG mid-range: accuracy 100 never misses, evade chance never reaches
 * 0.5, crit chance never reaches 0.5, and variance lands at 92.5%. Mocking to 0
 * would instead make *every* attack evade, since the evade roll is `rand < p`.
 */
function noLuck() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
}

function engineWith(enemyHp: number, playerHp = 200) {
  const ability = makeAbility();
  return new BattleEngine(
    makePlayer({ hpCurrent: playerHp, hpMax: 200 }),
    makeEnemy({ hpCurrent: enemyHp, hpMax: 200 }),
    [ability],
  );
}

describe('BattleEngine — vitória por dano indireto', () => {
  it('declara VICTORY quando o veneno mata o inimigo no turno dele', () => {
    noLuck();
    // Status move so the DoT is provably the only thing that can land a kill.
    const support = makeAbility({ damageType: 'Status', baseDamage: 0 });
    const engine = new BattleEngine(
      makePlayer(),
      makeEnemy({ hpCurrent: 40, hpMax: 200 }),
      [support],
    );
    engine.start(true);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.enemyStatuses.push({ type: 'poison', value: 50, turnsLeft: 3 });

    engine.playerAttack('ab-1');
    const after = engine.enemyTurn();

    expect(after.enemy.hpCurrent).toBe(0);
    expect(after.phase).toBe('VICTORY');
    expect(after.rewards?.xp).toBeGreaterThan(0);
  });

  it('declara VICTORY quando o counter reflete dano letal no inimigo', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(false);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.enemy.hpCurrent = 1;
    live.playerStatuses.push({ type: 'counter', multiplier: 5, cooldownRounds: 0 });

    const after = engine.enemyTurn();

    expect(after.enemy.hpCurrent).toBe(0);
    expect(after.phase).toBe('VICTORY');
  });

  it('declara VICTORY quando o companion mata no fim do turno', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(true);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.enemy.hpCurrent = 5000; // survives the player's hit
    live.enemy.hpMax = 5000;
    live.companion = { name: 'Dragão', damage: 99999, turnsLeft: 3 };

    engine.playerAttack('ab-1');
    const after = engine.enemyTurn();

    expect(after.enemy.hpCurrent).toBe(0);
    expect(after.phase).toBe('VICTORY');
  });

  it('concede recompensas uma única vez ao vencer', () => {
    noLuck();
    const engine = engineWith(1);
    engine.start(true);
    const after = engine.playerAttack('ab-1');
    expect(after.phase).toBe('VICTORY');

    // Further input must be inert once the fight is decided.
    const again = engine.playerAttack('ab-1');
    expect(again.phase).toBe('VICTORY');
    expect(again.rewards).toEqual(after.rewards);
  });
});

describe('BattleEngine — derrota por dano indireto', () => {
  it('declara DEFEAT quando o campo de batalha mata o jogador no fim do turno', () => {
    noLuck();
    const engine = engineWith(5000, 10);
    engine.start(true);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.enemy.hpMax = 5000;
    live.battlefieldEffects.push({
      key: 'custom', source: 'enemy', name: 'Chuva Ácida', turnsLeft: 5,
      endTurnDamage: { target: 'player', base: 9999 },
    });

    engine.playerAttack('ab-1');
    const after = engine.enemyTurn();

    expect(after.player.hpCurrent).toBe(0);
    expect(after.phase).toBe('DEFEAT');
  });

  it('gasta a carga de renascimento antes de declarar DEFEAT', () => {
    noLuck();
    const engine = engineWith(5000, 10);
    engine.start(true);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.enemy.hpMax = 5000;
    live.reviveCharges = 1;
    live.battlefieldEffects.push({
      key: 'custom', source: 'enemy', name: 'Chuva Ácida', turnsLeft: 5,
      endTurnDamage: { target: 'player', base: 9999 },
    });

    engine.playerAttack('ab-1');
    const after = engine.enemyTurn();

    expect(after.phase).toBe('PLAYER_TURN');
    expect(after.player.hpCurrent).toBe(100); // 50% of hpMax
    expect(after.reviveCharges).toBe(0);
  });

  it('declara DEFEAT quando o recuo da própria skill mata o jogador', () => {
    noLuck();
    const recoil = makeAbility({ effectType: 'recoil', baseDamage: 400 });
    const engine = new BattleEngine(
      makePlayer({ hpCurrent: 5, hpMax: 200 }),
      makeEnemy({ hpCurrent: 99999, hpMax: 99999 }),
      [recoil],
    );
    engine.start(true);
    const after = engine.playerAttack('ab-1');

    expect(after.player.hpCurrent).toBe(0);
    expect(after.phase).toBe('DEFEAT');
  });
});

describe('BattleEngine — snapshot é imutável', () => {
  it('não compartilha os arrays de status com o contexto vivo', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(true);
    const first = engine.getContext();
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.playerStatuses.push({ type: 'shield', value: 50 });
    const second = engine.getContext();

    expect(first.playerStatuses).toHaveLength(0);
    expect(second.playerStatuses).toHaveLength(1);
    expect(first.playerStatuses).not.toBe(second.playerStatuses);
  });
});

describe('BattleEngine — itens que não fazem nada não gastam o turno', () => {
  it('curar sem status mantém PLAYER_TURN', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(true);
    const after = engine.useItem('cure', 0);
    expect(after.phase).toBe('PLAYER_TURN');
  });

  it('curar com status consome o turno', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(true);
    const live = (engine as unknown as { ctx: ReturnType<typeof engine.getContext> }).ctx;
    live.playerStatus = { type: 'burn', turnsRemaining: 3 };
    const after = engine.useItem('cure', 0);
    expect(after.phase).toBe('ENEMY_TURN');
    expect(after.playerStatus).toBeNull();
  });

  it('reviver com vida cheia vira guarda contra morte', () => {
    noLuck();
    const engine = engineWith(200);
    engine.start(true);
    const after = engine.useItem('revive', 0);
    expect(after.reviveCharges).toBe(1);
  });
});
