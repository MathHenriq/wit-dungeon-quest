// Animação por cima do tapete do duelo (playmats.ts `anim`). Só transform e
// opacity (o navegador não repinta o tapete a cada quadro); poucos elementos.
import type { CSSProperties } from 'react';
import type { Playmat } from '@/game/playmats';
import './matanim.css';

// posições fixas (iguais em todo duelo)
const DOTS = [[8, 20], [18, 70], [30, 38], [41, 84], [52, 15], [61, 58], [74, 30], [86, 72], [92, 14]];

export function MatAnim({ mat }: { mat: Playmat }) {
  if (!mat.anim) return null;
  const cor = mat.animCor ?? '#ffffff';
  const style = { ['--ma' as string]: cor } as CSSProperties;
  return (
    <div className={`ma ma-${mat.anim}`} style={style} aria-hidden>
      {mat.anim === 'brilho' && <i className="ma-sheen" />}
      {mat.anim === 'ondas' && <><i className="ma-wave" /><i className="ma-wave b" /></>}
      {(mat.anim === 'faiscas' || mat.anim === 'estrelas') && DOTS.map(([x, y], k) => (
        <i key={k} className="ma-dot" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(k * 0.37) % 3}s`, animationDuration: `${2.4 + (k % 4) * 0.5}s` }} />
      ))}
    </div>
  );
}
