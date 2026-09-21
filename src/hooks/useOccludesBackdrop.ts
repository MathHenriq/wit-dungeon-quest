import { useEffect } from 'react';
import { acquireOcclusion } from '@/lib/ui/backdropOcclusion';

/**
 * Declara que esta tela cobre o fundo 3D por completo, para que ele pare de
 * desenhar enquanto ela estiver montada.
 *
 * Use só em tela que realmente ocupa a viewport inteira com fundo sólido —
 * declarar numa tela translúcida deixaria um retângulo preto no lugar das
 * estrelas. Ver `lib/ui/backdropOcclusion.ts`.
 *
 * @param active permite condicionar a oclusão (por exemplo, um overlay que às
 *               vezes está aberto e às vezes não).
 */
export function useOccludesBackdrop(active = true): void {
  useEffect(() => {
    if (!active) return;
    return acquireOcclusion();
  }, [active]);
}
