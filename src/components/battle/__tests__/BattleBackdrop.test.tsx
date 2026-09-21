import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { BattleBackdrop, type BackdropKey } from '../BattleBackdrop';

/**
 * O BattleBackdrop deixou de montar os nove cenários de uma vez.
 *
 * Antes, todos ficavam no DOM com `opacity: 0` para que o GSAP pudesse fazer
 * crossfade entre camadas já existentes — e, como `opacity: 0` não pausa
 * animação, o navegador rodava 144 animações ao mesmo tempo durante toda a
 * batalha. Agora só o cenário ativo fica montado, mais o que está saindo
 * enquanto o fade acontece.
 *
 * Estes testes travam as duas metades desse contrato: o custo (não montar o
 * que ninguém vê) e o visual (a camada que sai precisa continuar existindo
 * durante a transição, senão o crossfade vira um corte seco).
 */

// O GSAP mexe em estilo de verdade e não tem o que fazer no jsdom; o que
// importa aqui é quais camadas existem no DOM e quando.
vi.mock('gsap', () => ({
  gsap: { fromTo: vi.fn(), to: vi.fn() },
}));

function camadas(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.bbd-layer')]
    .map(el => [...el.classList].find(c => c.startsWith('bbd-') && c !== 'bbd-layer') ?? '')
    .map(c => c.replace('bbd-', ''));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe('BattleBackdrop — o que fica montado', () => {
  it('monta apenas o cenário ativo no primeiro render', () => {
    const { container } = render(<BattleBackdrop activeKey="vazio_cosmico" />);
    expect(camadas(container)).toEqual(['vazio_cosmico']);
  });

  it('não deixa os outros oito cenários no DOM', () => {
    const { container } = render(<BattleBackdrop activeKey="default" />);
    // A regressão que este teste existe para pegar: nove camadas de uma vez.
    expect(container.querySelectorAll('.bbd-layer').length).toBe(1);
  });

  it('não monta as 60 estrelas de um tema que não está ativo', () => {
    const { container } = render(<BattleBackdrop activeKey="inferno_energetico" />);
    expect(container.querySelectorAll('.bbd-star').length).toBe(0);
    // As brasas do tema ativo, essas sim.
    expect(container.querySelectorAll('.bbd-ember').length).toBe(30);
  });
});

describe('BattleBackdrop — crossfade', () => {
  it('mantém o cenário que sai montado durante a transição', () => {
    const { container, rerender } = render(<BattleBackdrop activeKey="default" />);
    expect(camadas(container)).toEqual(['default']);

    act(() => { rerender(<BattleBackdrop activeKey="reino_espiritual" />); });

    // Os dois coexistem — sem isso o crossfade seria um corte seco.
    expect(camadas(container).sort()).toEqual(['default', 'reino_espiritual']);
  });

  it('desmonta o cenário que saiu quando o fade termina', () => {
    const { container, rerender } = render(<BattleBackdrop activeKey="default" />);
    act(() => { rerender(<BattleBackdrop activeKey="aurora_boreal" />); });
    expect(camadas(container)).toHaveLength(2);

    act(() => { vi.advanceTimersByTime(1100); });

    expect(camadas(container)).toEqual(['aurora_boreal']);
  });

  it('sobrevive a trocas encadeadas sem acumular camadas', () => {
    const seq: BackdropKey[] = [
      'default', 'vazio_cosmico', 'inferno_energetico', 'limbo_distorcido',
      'reino_espiritual', 'aurora_boreal',
    ];
    const { container, rerender } = render(<BattleBackdrop activeKey={seq[0]} />);

    // Troca rápida, antes de cada fade terminar — é o que acontece quando o
    // aluno dispara cartas em sequência.
    for (const k of seq.slice(1)) {
      act(() => { rerender(<BattleBackdrop activeKey={k} />); });
      act(() => { vi.advanceTimersByTime(200); });
    }

    // Enquanto os fades correm pode haver mais de uma, mas nunca as nove.
    expect(camadas(container).length).toBeLessThanOrEqual(seq.length - 1);

    act(() => { vi.advanceTimersByTime(2000); });
    expect(camadas(container)).toEqual(['aurora_boreal']);
  });

  it('não faz nada quando a chave não muda', () => {
    const { container, rerender } = render(<BattleBackdrop activeKey="soro_tita" />);
    act(() => { rerender(<BattleBackdrop activeKey="soro_tita" />); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(camadas(container)).toEqual(['soro_tita']);
  });
});
