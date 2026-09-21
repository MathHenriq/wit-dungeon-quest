import { describe, it, expect } from 'vitest';
import {
  getTypeEffectiveness,
  getDualTypeEffectiveness,
  getEffectivenessLabel,
} from '../typeEffectiveness';
import { ELEMENT_META, type ElementType } from '@/types/character';

const TODOS = Object.keys(ELEMENT_META) as ElementType[];

/**
 * A tabela de tipos decide toda vantagem elemental do jogo. O risco aqui não
 * é uma conta errada — é uma entrada faltando, que vira 1.0 em silêncio e
 * some com a vantagem sem ninguém perceber.
 */

describe('getTypeEffectiveness', () => {
  it('cobre os 12 elementos como atacante e como defensor', () => {
    for (const atk of TODOS) {
      for (const def of TODOS) {
        const m = getTypeEffectiveness(atk, def);
        expect(Number.isFinite(m), `${atk} -> ${def}`).toBe(true);
        expect(m, `${atk} -> ${def}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('só devolve multiplicadores do conjunto esperado', () => {
    const validos = new Set([0, 0.25, 0.5, 1, 2, 4]);
    for (const atk of TODOS) {
      for (const def of TODOS) {
        expect(validos.has(getTypeEffectiveness(atk, def)), `${atk} -> ${def}`).toBe(true);
      }
    }
  });

  it('aplica as vantagens clássicas', () => {
    expect(getTypeEffectiveness('Water', 'Fire')).toBeGreaterThan(1);
    expect(getTypeEffectiveness('Fire', 'Grass')).toBeGreaterThan(1);
    expect(getTypeEffectiveness('Grass', 'Water')).toBeGreaterThan(1);
  });

  it('aplica as desvantagens correspondentes', () => {
    expect(getTypeEffectiveness('Fire', 'Water')).toBeLessThan(1);
    expect(getTypeEffectiveness('Grass', 'Fire')).toBeLessThan(1);
    expect(getTypeEffectiveness('Water', 'Grass')).toBeLessThan(1);
  });

  it('devolve 1.0 para elemento desconhecido em vez de quebrar', () => {
    // O jogo tem carta empurrando override para 'Light', que nao existe no
    // conjunto — ver comentario em equipmentAbilityRegistry.
    expect(getTypeEffectiveness('Light' as ElementType, 'Fire')).toBe(1);
    expect(getTypeEffectiveness('Fire', 'Light' as ElementType)).toBe(1);
  });
});

describe('getDualTypeEffectiveness', () => {
  it('multiplica os dois elementos do defensor', () => {
    const a = getTypeEffectiveness('Water', 'Fire');
    const b = getTypeEffectiveness('Water', 'Ground');
    expect(getDualTypeEffectiveness('Water', 'Fire', 'Ground')).toBe(a * b);
  });

  it('ignora o secundário quando ausente', () => {
    expect(getDualTypeEffectiveness('Water', 'Fire', null))
      .toBe(getTypeEffectiveness('Water', 'Fire'));
    expect(getDualTypeEffectiveness('Water', 'Fire'))
      .toBe(getTypeEffectiveness('Water', 'Fire'));
  });

  it('não conta duas vezes quando os dois elementos são iguais', () => {
    expect(getDualTypeEffectiveness('Water', 'Fire', 'Fire'))
      .toBe(getTypeEffectiveness('Water', 'Fire'));
  });

  it('zera quando um dos dois é imune', () => {
    // Se existir imunidade na tabela, ela domina o produto.
    for (const atk of TODOS) {
      for (const d1 of TODOS) {
        for (const d2 of TODOS) {
          if (d1 === d2) continue;
          const imune = getTypeEffectiveness(atk, d1) === 0
                     || getTypeEffectiveness(atk, d2) === 0;
          if (imune) {
            expect(getDualTypeEffectiveness(atk, d1, d2)).toBe(0);
          }
        }
      }
    }
  });

  it('chega a 4× quando os dois elementos são fracos ao mesmo ataque', () => {
    let achou = false;
    for (const atk of TODOS) {
      for (const d1 of TODOS) {
        for (const d2 of TODOS) {
          if (d1 === d2) continue;
          if (getDualTypeEffectiveness(atk, d1, d2) === 4) achou = true;
        }
      }
    }
    // Bosses de elemento duplo (andar 26+) dependem disso para valer a pena.
    expect(achou).toBe(true);
  });
});

describe('getEffectivenessLabel', () => {
  it('nomeia cada faixa', () => {
    expect(getEffectivenessLabel(0)).toBe('Não afeta...');
    expect(getEffectivenessLabel(0.5)).toBe('Não muito efetivo...');
    expect(getEffectivenessLabel(2)).toBe('SUPER EFETIVO!');
  });

  it('não escreve nada no dano neutro', () => {
    expect(getEffectivenessLabel(1)).toBe('');
  });
});
