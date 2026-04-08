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

  // ── 100 Floors Logic ─────────────────────────────────────────────────────
  const ALL_FLOORS_NUMBERS = Array.from({ length: 100 }, (_, i) => i + 1);
  const aincradFloors = ALL_FLOORS_NUMBERS.map((num) => {
    const existing = floors.find(f => Number(f.floor_number) === num);
    if (existing) return existing;
    
    // Fallback: If no floors exist in database, make virtual floor 1 interactive for testing
    const isFirstVirtual = num === 1 && floors.length === 0;
    
    return {
      id: `virtual_${num}`,
      floor_number: num,
      name: '???',
      theme: 'Misterio',
      status: isFirstVirtual ? 'current' : 'locked',
    } as FloorSelectData;
  });

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
        y: 20,
        duration: 0.6,
        stagger: 0.02, 
        ease: 'power2.out',
        delay: 0.1,
      });
    }, towerRef);

    return () => ctx.revert();
  }, []);

  // ── Auto-scroll to current floor ─────────────────────────────────────────

  useEffect(() => {
    // Determine the target floor to scroll to.
    let activeId = currentFloor?.id;
    if (!activeId) {
      if (floors.length > 0) activeId = floors[floors.length - 1].id;
      else activeId = 'virtual_1'; // Start at floor 1 if completely empty
    }

    setTimeout(() => {
      const el = document.querySelector(`[data-floor="${activeId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 450);
  }, [currentFloor, floors]);

  return (
    <div className="fs-root">
      <TowerBackground />

      <FloorSelectHUD
        completedCount={completedCount}
        totalFloors={100}
        onBack={onBack}
      />

      <div className="fs-content" ref={contentRef} style={{ paddingBottom: '30vh', paddingTop: '30vh' }}>
        <div className="fs-tower" ref={towerRef}>
          {/* Vertical connecting line */}
          <div className="fs-line" ref={lineRef} style={{ background: 'linear-gradient(to bottom, transparent, #00e5ff 20%, #4ade80 80%, transparent)' }} />

          {aincradFloors.map(floor => (
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
