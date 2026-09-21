/**
 * Sinal de oclusão do fundo 3D.
 *
 * O SpaceBackground é um canvas WebGL fixo em `-z-50`, atrás de tudo. Telas
 * como a de combate (`.poke-scene`, 100vh e fundo sólido) e o hub cobrem esse
 * canvas por completo — mas o three.js não tem como saber disso e continua
 * desenhando 1.800 estrelas e três nebulosas a 60 fps embaixo de uma camada
 * opaca. Num Chromebook de escola é GPU gasta em pixels que ninguém vai ver,
 * exatamente durante a batalha, que é quando o resto da tela mais precisa dela.
 *
 * A oclusão não é detectável pelo navegador (não existe "estou coberto?"), e
 * IntersectionObserver só responde sobre viewport, não sobre o que está por
 * cima. Então as telas que cobrem tudo declaram isso com `useOccludesBackdrop()`
 * e o fundo pausa o render loop enquanto houver ao menos uma declarada.
 *
 * É um contador, não um booleano, porque duas telas opacas podem se sobrepor
 * durante uma transição — a última a desmontar é que libera o fundo.
 */

type Listener = (occluded: boolean) => void;

let count = 0;
const listeners = new Set<Listener>();

function emit() {
  const occluded = count > 0;
  for (const l of listeners) l(occluded);
}

/** Declara que algo opaco cobre o fundo. Devolve a função que desfaz. */
export function acquireOcclusion(): () => void {
  count += 1;
  if (count === 1) emit();

  let released = false;
  return () => {
    // Guarda contra liberação dupla (StrictMode monta e desmonta os efeitos
    // duas vezes em desenvolvimento), que zeraria o contador cedo demais e
    // religaria o fundo embaixo de uma tela ainda visível.
    if (released) return;
    released = true;
    count -= 1;
    if (count === 0) emit();
  };
}

export function isBackdropOccluded(): boolean {
  return count > 0;
}

export function subscribeOcclusion(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
