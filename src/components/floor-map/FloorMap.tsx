import React, { useImperativeHandle } from 'react';
import { ChevronRight } from 'lucide-react';
import { MapCanvas }       from './MapCanvas';
import { MapHUD }          from './MapHUD';
import { FloorTransition } from './FloorTransition';
import { useFloorMap }     from './useFloorMap';
import type { FloorData, FloorMapEnemy } from './useFloorMap';
export type { FloorData, FloorMapEnemy };
import './floor-map.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FloorMapProps {
  floor:    FloorData;
  enemies:  FloorMapEnemy[];
  onBack:   () => void;
  onEnemyEncounter: (enemy: FloorMapEnemy) => void;
  /** Call this after a battle ends to update defeat state. */
  onEnemyDefeated?: (enemyId: string, victorious: boolean) => void;
  /** Internal ref so parent can imperatively mark an enemy as defeated. */
  mapRef?: React.RefObject<FloorMapHandle>;
}

/** Handle exposed to parent for programmatic updates post-battle. */
export interface FloorMapHandle {
  markDefeated: (enemyId: string) => void;
  resetToMap:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorMap({ floor, enemies: initEnemies, onBack, onEnemyEncounter, mapRef: handleRef }: FloorMapProps) {
  const {
    mapRef,
    position,
    isMoving,
    enemies,
    bossUnlocked,
    progress,
    floorDone,
    transition,
    transitionEnemy,
    ripples,
    tooltip,
    handleMapClick,
    markEnemyDefeated,
    resetToMap,
  } = useFloorMap({ floor, enemies: initEnemies, onEnemyEncounter });

  useImperativeHandle(handleRef, () => ({
    markDefeated: markEnemyDefeated,
    resetToMap,
  }));

  return (
    <div className="fm-root">

      {/* HUD */}
      <MapHUD
        floorNumber={floor.floorNumber}
        floorName={floor.name}
        defeated={progress.defeated}
        total={progress.total}
        onBack={onBack}
      />

      {/* Map */}
      <MapCanvas
        mapRef={mapRef}
        theme={floor.theme}
        backgroundUrl={floor.backgroundUrl}
        enemies={enemies}
        bossUnlocked={bossUnlocked}
        playerX={position.x}
        playerY={position.y}
        isMoving={isMoving}
        ripples={ripples}
        onClick={handleMapClick}
      />

      {/* Tooltip */}
      <div className="fm-tooltip">{tooltip}</div>

      {/* Battle transition overlay */}
      <FloorTransition
        state={transition}
        enemyName={transitionEnemy?.name}
        isBoss={transitionEnemy?.isBoss}
      />

      {/* Floor complete overlay */}
      {floorDone && (
        <div className="fm-complete">
          <div className="fm-complete__card">
            <div className="fm-complete__title">Andar Concluido</div>
            <div className="fm-complete__sub">{floor.name} foi dominado</div>
            <button className="fm-complete__btn" onClick={onBack}>
              <ChevronRight size={14} />
              Continuar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
