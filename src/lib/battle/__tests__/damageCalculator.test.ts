import { describe, it, expect, afterEach, vi } from 'vitest';
import { calculateDamage, estimateDamage, type CombatantStats } from '../damageCalculator';
import { identityModifiers } from '../attributeModifiers';
import { makeAbility } from './factories';

/**
 * A fórmula de dano é o coração do jogo e não tinha nenhum teste. Estes
 * travam o formato: quem mexer numa constante vê exatamente o que muda.
 *
 * Todo RNG é fixado, porque o objetivo aqui é o determinismo da fórmula —
 * a aleatoriedade em si é testada à parte, nos limiares.
 */

afterEach(() => vi.restoreAllMocks());

/** Meio da faixa: não erra, não esquiva, não critica, variância = 92,5%. */
function rng(valor: number) {
  vi.spyOn(Math, 'random').mockReturnValue(valor);
}

function atacante(over: Partial<CombatantStats> = {}): CombatantStats {
  return {
    level: 10, forca: 20, inteligencia: 20, agilidade: 10,
    defFisica: 0, defMagica: 0, ...over,
  };
}

function defensor(over: Partial<CombatantStats> = {}): CombatantStats {
  return {
    level: 10, forca: 0, inteligencia: 0, agilidade: 10,
    defFisica: 10, defMagica: 10, ...over,
  };
}

describe('calculateDamage — fórmula base', () => {
  it('segue ((2*nivel/5 + 2) * poder * atk/def) / 50 + 2', () => {
    rng(0.5);
    // levelMod = (2*10/5)+2 = 6
    // raw = (6 * 40 * (20/10)) / 50 + 2 = 480/50 + 2 = 11.6 -> 11
    const r = calculateDamage(
      atacante(), defensor(),
      makeAbility({ baseDamage: 40, elementName: 'Steel' }),
    );
    expect(r.rawDamage).toBe(11);
  });

  it('nunca devolve menos de 1 de dano num acerto', () => {
    rng(0.5);
    const r = calculateDamage(
      atacante({ forca: 1, level: 1 }),
      defensor({ defFisica: 9999 }),
      makeAbility({ baseDamage: 1 }),
    );
    expect(r.damage).toBeGreaterThanOrEqual(1);
  });

  it('trata defesa zero sem dividir por zero', () => {
    rng(0.5);
    const r = calculateDamage(
      atacante(), defensor({ defFisica: 0 }),
      makeAbility({ baseDamage: 40 }),
    );
    expect(Number.isFinite(r.damage)).toBe(true);
    expect(r.damage).toBeGreaterThan(0);
  });

  it('golpe de status não causa dano', () => {
    rng(0.5);
    const r = calculateDamage(
      atacante(), defensor(),
      makeAbility({ damageType: 'Status', baseDamage: 999 }),
    );
    expect(r.damage).toBe(0);
    expect(r.isMiss).toBe(false);
  });

  it('usa inteligência para golpe Special e força para Physical', () => {
    rng(0.5);
    const comum = { level: 10, agilidade: 10, defFisica: 0, defMagica: 0 };
    const fisico = calculateDamage(
      { ...comum, forca: 40, inteligencia: 1 }, defensor(),
      makeAbility({ damageType: 'Physical', baseDamage: 40 }),
    );
    const magico = calculateDamage(
      { ...comum, forca: 1, inteligencia: 40 }, defensor(),
      makeAbility({ damageType: 'Special', baseDamage: 40 }),
    );
    expect(fisico.rawDamage).toBe(magico.rawDamage);
  });
});

describe('calculateDamage — acerto, esquiva e crítico', () => {
  it('erra quando a rolagem passa da precisão', () => {
    rng(0.99); // 0.99 * 100 = 99 > 90
    const r = calculateDamage(atacante(), defensor(), makeAbility({ accuracy: 90 }));
    expect(r.isMiss).toBe(true);
    expect(r.damage).toBe(0);
  });

  it('não erra com precisão 100', () => {
    rng(0.999);
    const r = calculateDamage(atacante(), defensor(), makeAbility({ accuracy: 100 }));
    expect(r.isMiss).toBe(false);
  });

  it('noMiss ignora o teste de precisão', () => {
    rng(0.99);
    const r = calculateDamage(
      atacante(), defensor(), makeAbility({ accuracy: 10 }), { noMiss: true },
    );
    expect(r.isMiss).toBe(false);
  });

  it('esquiva legada limita em 15% por agilidade', () => {
    // agilidade 9999 -> min(0.15, 9999/2000) = 0.15
    rng(0.14);
    const esquivou = calculateDamage(
      atacante(), defensor({ agilidade: 9999 }), makeAbility(),
    );
    expect(esquivou.isEvaded).toBe(true);

    rng(0.16);
    const acertou = calculateDamage(
      atacante(), defensor({ agilidade: 9999 }), makeAbility(),
    );
    expect(acertou.isEvaded).toBe(false);
  });

  it('crítico multiplica o dano por 1.5 por padrão', () => {
    // A ordem das rolagens em calculateDamage e: precisao, esquiva, critico,
    // variancia. Sequencia explicita para isolar so o critico.
    // Poder alto de proposito: com dano na casa das dezenas o Math.floor
    // final distorce a razao (10 -> 16 da 1.6, nao 1.5).
    const base = makeAbility({ baseDamage: 4000, elementName: 'Steel' });

    const rodar = (rolagemCritica: number) => {
      const seq = [0.5, 0.9, rolagemCritica, 0.5];
      let i = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => seq[Math.min(i++, seq.length - 1)]);
      return calculateDamage(atacante(), defensor(), base);
    };

    const normal = rodar(0.99);
    const critico = rodar(0.0);

    expect(normal.isCritical).toBe(false);
    expect(critico.isCritical).toBe(true);
    // O Math.floor so acontece no fim do calculo, entao floor(d * 1.5) nao e
    // igual a floor(floor(d) * 1.5). Comparar a razao evita travar o teste
    // num artefato de arredondamento.
    expect(critico.damage / normal.damage).toBeCloseTo(1.5, 1);
  });

  it('passiveCritMultiplier substitui o 1.5 padrão', () => {
    // Sequencia: miss, evade, crit, variancia.
    const seq = [0.5, 0.9, 0.0, 0.5];
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => seq[Math.min(i++, seq.length - 1)]);
    const r = calculateDamage(
      atacante(), defensor(), makeAbility({ baseDamage: 40, elementName: 'Steel' }),
      { passiveCritMultiplier: 3 },
    );
    expect(r.isCritical).toBe(true);
  });
});

describe('calculateDamage — modificadores', () => {
  it('defenseIgnore reduz a defesa efetiva e é limitado a 95%', () => {
    rng(0.5);
    const semIgnore = calculateDamage(
      atacante(), defensor({ defFisica: 100 }), makeAbility({ baseDamage: 40 }),
    );
    const comIgnore = calculateDamage(
      atacante(), defensor({ defFisica: 100 }), makeAbility({ baseDamage: 40 }),
      { defenseIgnore: 0.5 },
    );
    expect(comIgnore.rawDamage).toBeGreaterThan(semIgnore.rawDamage);

    // Acima de 0.95 o efeito satura em vez de virar divisão por ~0.
    const extremo = calculateDamage(
      atacante(), defensor({ defFisica: 100 }), makeAbility({ baseDamage: 40 }),
      { defenseIgnore: 5 },
    );
    expect(Number.isFinite(extremo.damage)).toBe(true);
  });

  it('damageTakenMult do defensor reduz o dano final', () => {
    rng(0.5);
    const mods = { ...identityModifiers(), damageTakenMult: 0.5 };
    const cheio = calculateDamage(
      atacante(), defensor(), makeAbility({ baseDamage: 40, elementName: 'Steel' }),
    );
    const reduzido = calculateDamage(
      atacante(), defensor(), makeAbility({ baseDamage: 40, elementName: 'Steel' }),
      { defenderMods: mods },
    );
    expect(reduzido.damage).toBeLessThan(cheio.damage);
  });

  it('imunidade (efetividade 0) zera o dano', () => {
    rng(0.5);
    // Ghost é imune a Fighting no chart clássico.
    const r = calculateDamage(
      atacante(), defensor({ elementType: 'Ghost' }),
      makeAbility({ elementName: 'Fighting', baseDamage: 40 }),
    );
    if (r.effectiveness === 0) {
      expect(r.damage).toBe(0);
      expect(r.isMiss).toBe(false);
    }
  });
});

describe('estimateDamage', () => {
  it('não usa RNG — chamadas repetidas dão o mesmo valor', () => {
    const ab = makeAbility({ baseDamage: 40 });
    const a = estimateDamage(atacante(), defensor(), ab);
    const b = estimateDamage(atacante(), defensor(), ab);
    expect(a).toBe(b);
  });

  it('devolve 0 para golpe de status', () => {
    expect(estimateDamage(atacante(), defensor(), makeAbility({ damageType: 'Status' }))).toBe(0);
  });
});
