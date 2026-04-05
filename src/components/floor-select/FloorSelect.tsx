import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FloorSelectHUD }  from './FloorSelectHUD';
import { TowerBackground } from './TowerBackground';
import { FloorNode }       from './FloorNode';
import { useFloorSelect }  from './useFloorSelect';
import type { FloorSelectData } from './useFloorSelect';
import './floor-select.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FloorSelectProps {
  floors:  FloorSelectData[];
  onBack:  () => void;
  onPlay:  (floorId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloorSelect({ floors, onBack, onPlay }: FloorSelectProps) {
  const { expandedId, completedCount, currentFloor, toggle, handlePlay } =
    useFloorSelect({ floors, onPlay });

  const towerRef  = useRef<HTMLDivElement>(null);
  const lineRef   = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── GSAP entrance ────────────────────────────────────────────────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line grows from bottom
      gsap.from(lineRef.current, {
        scaleY: 0,
        transformOrigin: 'bottom',
        duration: 0.9,
        ease: 'power2.out',
        delay: 0.1,
      });

      // Cards stagger from bottom up
      gsap.from('.fs-node', {
        y: 28,
        opacity: 0,
        duration: 0.4,
        stagger: { each: 0.07, from: 'end' }, // 'end' = first card (bottom) animates first
        ease: 'power2.out',
        delay: 0.2,
      });
    }, towerRef);

    return () => ctx.revert();
  }, []);

  // ── Auto-scroll to current floor ─────────────────────────────────────────

  useEffect(() => {
    if (!currentFloor) return;
    const el = document.querySelector(`[data-floor="${currentFloor.id}"]`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 700);
    }
  }, [currentFloor]);

  return (
    <div className="fs-root">
      <TowerBackground />

      <FloorSelectHUD
        completedCount={completedCount}
        totalFloors={floors.length}
        onBack={onBack}
      />

      <div className="fs-content" ref={contentRef}>
        <div className="fs-tower" ref={towerRef}>
          {/* Vertical connecting line */}
          <div className="fs-line" ref={lineRef} />

          {/* Floors rendered in reverse order visually (column-reverse = andar 1 at bottom) */}
          {floors.map(floor => (
            <FloorNode
              key={floor.id}
              floor={floor}
              expanded={expandedId === floor.id}
              onToggle={() => toggle(floor.id)}
              onPlay={() => handlePlay(floor.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
