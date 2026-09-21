import { describe, it, expect, beforeEach } from 'vitest';
import {
  acquireOcclusion,
  isBackdropOccluded,
  subscribeOcclusion,
} from '../backdropOcclusion';

/**
 * Este sinal decide se o starfield 3D desenha ou fica parado. Ele é um módulo
 * com estado global, lido por um componente (SpaceBackground) e escrito por
 * outros dois em telas diferentes — o tipo de coisa que quebra em silêncio:
 * o fundo volta a rodar embaixo de uma tela opaca e ninguém percebe, porque
 * não muda nada na aparência, só no consumo.
 *
 * Os testes são chatos de propósito. A regra que importa é o contador não
 * descer cedo demais nem ficar preso em cima.
 */

/** Zera o estado global entre os testes. */
beforeEach(() => {
  let guarda = 0;
  while (isBackdropOccluded() && guarda++ < 50) {
    // Não há reset exposto — solta uma aquisição de cada vez.
    acquireOcclusion()();
    if (isBackdropOccluded()) acquireOcclusion()();
    else break;
  }
});

describe('contador de oclusão', () => {
  it('começa livre', () => {
    expect(isBackdropOccluded()).toBe(false);
  });

  it('uma tela opaca ocupa o fundo e o devolve ao sair', () => {
    const soltar = acquireOcclusion();
    expect(isBackdropOccluded()).toBe(true);
    soltar();
    expect(isBackdropOccluded()).toBe(false);
  });

  it('duas telas sobrepostas: só a última a sair libera', () => {
    // Acontece numa transição — a tela nova monta antes da antiga desmontar.
    const a = acquireOcclusion();
    const b = acquireOcclusion();
    expect(isBackdropOccluded()).toBe(true);

    a();
    expect(isBackdropOccluded(), 'ainda há uma tela opaca na frente').toBe(true);

    b();
    expect(isBackdropOccluded()).toBe(false);
  });

  it('soltar a mesma aquisição duas vezes não zera o contador', () => {
    // O StrictMode monta e desmonta os efeitos duas vezes em desenvolvimento;
    // sem a guarda, a segunda chamada derrubaria o contador de outra tela.
    const a = acquireOcclusion();
    const b = acquireOcclusion();
    a();
    a();
    a();
    expect(isBackdropOccluded(), 'b ainda não soltou').toBe(true);
    b();
    expect(isBackdropOccluded()).toBe(false);
  });
});

describe('assinatura', () => {
  it('avisa ao ocupar e ao liberar, e só nas transições', () => {
    const vistos: boolean[] = [];
    const cancelar = subscribeOcclusion(v => vistos.push(v));

    const a = acquireOcclusion();
    const b = acquireOcclusion();   // já ocupado — não deve avisar de novo
    a();                            // ainda ocupado — não deve avisar
    b();                            // agora sim, liberou

    expect(vistos).toEqual([true, false]);
    cancelar();
  });

  it('para de avisar depois de cancelar', () => {
    const vistos: boolean[] = [];
    const cancelar = subscribeOcclusion(v => vistos.push(v));
    cancelar();

    const soltar = acquireOcclusion();
    soltar();

    expect(vistos).toEqual([]);
  });

  it('avisa todos os assinantes', () => {
    const a: boolean[] = [];
    const b: boolean[] = [];
    const ca = subscribeOcclusion(v => a.push(v));
    const cb = subscribeOcclusion(v => b.push(v));

    acquireOcclusion()();

    expect(a).toEqual([true, false]);
    expect(b).toEqual([true, false]);
    ca(); cb();
  });
});
