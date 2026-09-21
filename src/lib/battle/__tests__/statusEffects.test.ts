import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  tickStatus,
  canAct,
  defaultDuration,
  getAccuracyModifier,
  getAttackModifier,
  getDefenseModifier,
  STAT_MODIFIERS,
  type ActiveStatus,
  type StatusEffect,
} from '../statusEffects';

/**
 * Efeitos de status mexem em HP e em quem pode agir — é onde um ajuste de
 * porcentagem passa despercebido. Estes testes fixam as taxas atuais.
 */

afterEach(() => vi.restoreAllMocks());

function status(type: StatusEffect, turnos = 3): ActiveStatus {
  return { type, turnsRemaining: turnos };
}

describe('tickStatus — dano ao longo do tempo', () => {
  const casos: Array<[StatusEffect, number]> = [
    ['burn',   0.05],
    ['poison', 0.08],
    ['bleed',  0.04],
    ['curse',  0.06],
  ];

  it.each(casos)('%s tira %s do HP máximo', (tipo, fracao) => {
    const r = tickStatus(status(tipo), 1000, 1000);
    expect(r.damage).toBe(Math.floor(1000 * fracao));
    expect(r.blocked).toBe(false);
  });

  it.each(casos)('%s sempre tira pelo menos 1 de HP', (tipo) => {
    // Com HP máximo baixo a fração arredondaria para 0.
    const r = tickStatus(status(tipo), 5, 5);
    expect(r.damage).toBeGreaterThanOrEqual(1);
  });

  it('calcula o DoT sobre o HP máximo, não o atual', () => {
    const cheio  = tickStatus(status('poison'), 1000, 1000);
    const quaseMorto = tickStatus(status('poison'), 1, 1000);
    expect(quaseMorto.damage).toBe(cheio.damage);
  });
});

describe('tickStatus — bloqueio de ação', () => {
  it('sono e atordoamento sempre bloqueiam', () => {
    expect(tickStatus(status('sleep'), 100, 100).blocked).toBe(true);
    expect(tickStatus(status('stun'), 100, 100).blocked).toBe(true);
  });

  it('congelamento bloqueia em 70% das vezes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.69);
    expect(tickStatus(status('freeze'), 100, 100).blocked).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.71);
    expect(tickStatus(status('freeze'), 100, 100).blocked).toBe(false);
  });

  it('paralisia bloqueia em 50% das vezes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.49);
    expect(tickStatus(status('paralyze'), 100, 100).blocked).toBe(true);
    vi.spyOn(Math, 'random').mockReturnValue(0.51);
    expect(tickStatus(status('paralyze'), 100, 100).blocked).toBe(false);
  });

  it('confusão bate em si mesmo em 45% das vezes, com 10% do HP atual', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.44);
    const bateu = tickStatus(status('confuse'), 500, 1000);
    expect(bateu.damage).toBe(50);
    expect(bateu.blocked).toBe(false);

    vi.spyOn(Math, 'random').mockReturnValue(0.46);
    expect(tickStatus(status('confuse'), 500, 1000).damage).toBe(0);
  });

  it('cegueira e medo não tiram HP nem bloqueiam', () => {
    for (const t of ['blind', 'fear'] as StatusEffect[]) {
      const r = tickStatus(status(t), 100, 100);
      expect(r.damage).toBe(0);
      expect(r.blocked).toBe(false);
    }
  });
});

describe('modificadores de combate', () => {
  it('cegueira reduz a precisão em 30%', () => {
    expect(getAccuracyModifier(status('blind'))).toBeCloseTo(0.7, 5);
    expect(getAccuracyModifier(null)).toBe(1);
  });

  it('medo reduz o ataque em 20%', () => {
    expect(getAttackModifier(status('fear'))).toBeCloseTo(0.8, 5);
    expect(getAttackModifier(null)).toBe(1);
  });

  it('molhado dobra o dano elétrico recebido e não mexe no resto', () => {
    expect(getDefenseModifier(status('wet'), 'Electric')).toBe(2);
    expect(getDefenseModifier(status('wet'), 'Fire')).toBe(1);
    expect(getDefenseModifier(null, 'Electric')).toBe(1);
  });
});

describe('canAct', () => {
  it('deixa agir quando não há status', () => {
    expect(canAct(null)).toBe(true);
  });

  it('impede de agir sob sono', () => {
    expect(canAct(status('sleep'))).toBe(false);
  });
});

describe('defaultDuration', () => {
  it('atordoamento dura um turno', () => {
    expect(defaultDuration('stun')).toBe(1);
  });

  it('DoTs duram três turnos', () => {
    for (const t of ['burn', 'poison', 'bleed', 'curse'] as StatusEffect[]) {
      expect(defaultDuration(t)).toBe(3);
    }
  });

  it('sono sorteia entre 1 e 3 turnos', () => {
    for (const v of [0, 0.5, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(v);
      const d = defaultDuration('sleep');
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(3);
    }
  });

  it('toda duração é de pelo menos um turno', () => {
    const todos: StatusEffect[] = [
      'burn', 'poison', 'freeze', 'paralyze', 'sleep', 'confuse', 'blind',
      'stun', 'bleed', 'curse', 'wet', 'fear',
    ];
    for (const t of todos) expect(defaultDuration(t)).toBeGreaterThanOrEqual(1);
  });
});

describe('STAT_MODIFIERS', () => {
  it('separa o que o motor trata à parte do que faz tick', () => {
    // O BattleEngine só chama applyEffect para o que NÃO está neste conjunto.
    expect(STAT_MODIFIERS.has('atk_up')).toBe(true);
    expect(STAT_MODIFIERS.has('heal')).toBe(true);
    expect(STAT_MODIFIERS.has('drain')).toBe(true);
    expect(STAT_MODIFIERS.has('recoil')).toBe(true);

    expect(STAT_MODIFIERS.has('burn')).toBe(false);
    expect(STAT_MODIFIERS.has('stun')).toBe(false);
  });
});
