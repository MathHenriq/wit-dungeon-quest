import React from 'react';
import type { TransitionState } from './useFloorMap';

interface FloorTransitionProps {
  state: TransitionState;
  enemyName?: string;
  isBoss?: boolean;
}

export function FloorTransition({ state, enemyName, isBoss }: FloorTransitionProps) {
  if (state === 'idle' || state === 'done') return null;

  return (
    <div className="fm-transition">
      {state === 'flash' && <div className="fm-transition__flash" />}

      {state === 'wipe' && (
        <div className="fm-transition__wipe">
          {isBoss
            ? <span className="fm-transition__label">Batalha de Boss</span>
            : <span className="fm-transition__label">Encontro</span>
          }
          {enemyName && (
            <span className="fm-transition__name">{enemyName}</span>
          )}
          <span className="fm-transition__sub">Preparando batalha...</span>
        </div>
      )}
    </div>
  );
}
