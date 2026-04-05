/**
 * FloorMapDemo — Tests the complete floor map system with mock data.
 * Route: /floor-map-demo
 *
 * Phases covered:
 *   Phase 1 — Background, topography, fog, player movement, click-to-move
 *   Phase 2 — Enemies, collision detection, battle transition
 *   Phase 3 — HUD, progress tracking, boss lock/unlock, floor complete
 *   Phase 4 — (production) uses useFloorMapData hook with real Supabase data
 */

import { useState, useCallback, useRef } from 'react';
import { FloorMap }      from '@/components/floor-map/FloorMap';
import type { FloorMapEnemy, FloorData, FloorMapHandle } from '@/components/floor-map';
import { toast } from 'sonner';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FLOOR: FloorData = {
  id:          'floor-1',
  floorNumber: 1,
  name:        'Floresta Sombria',
  theme:       'forest',
  backgroundUrl: null, // uses CSS gradient fallback
};

const MOCK_ENEMIES: FloorMapEnemy[] = [
  {
    id: 'e1', name: 'Lobo Sombrio', level: 1, iconType: 'wolf',
    positionX: 22, positionY: 50,
    defeated: false, isBoss: false,
    hpMax: 80, defFisica: 3, defMagica: 2, velocidade: 12,
    elementType: 'Dark',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'e2', name: 'Esqueleto Errante', level: 1, iconType: 'skull',
    positionX: 34, positionY: 22,
    defeated: false, isBoss: false,
    hpMax: 60, defFisica: 2, defMagica: 3, velocidade: 8,
    elementType: 'Ghost',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'e3', name: 'Aranha Venenosa', level: 2, iconType: 'spider',
    positionX: 34, positionY: 78,
    defeated: false, isBoss: false,
    hpMax: 50, defFisica: 1, defMagica: 4, velocidade: 16,
    elementType: 'Poison',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'e4', name: 'Golem de Pedra', level: 2, iconType: 'shield',
    positionX: 52, positionY: 50,
    defeated: false, isBoss: false,
    hpMax: 150, defFisica: 12, defMagica: 4, velocidade: 4,
    elementType: 'Ground',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'e5', name: 'Morcego Noturno', level: 1, iconType: 'bat',
    positionX: 64, positionY: 22,
    defeated: false, isBoss: false,
    hpMax: 40, defFisica: 2, defMagica: 2, velocidade: 18,
    elementType: 'Flying',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'e6', name: 'Treant Corrompido', level: 3, iconType: 'tree',
    positionX: 64, positionY: 78,
    defeated: false, isBoss: false,
    hpMax: 120, defFisica: 8, defMagica: 5, velocidade: 6,
    elementType: 'Grass',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
  {
    id: 'boss', name: 'Guardiao da Floresta', level: 5, iconType: 'crown',
    positionX: 78, positionY: 50,
    defeated: false, isBoss: true,
    hpMax: 500, defFisica: 15, defMagica: 12, velocidade: 10,
    elementType: 'Grass',
    specialAbilityName:   'Furia da Floresta',
    specialAbilityEffect: 'Ataque em area que causa bleeding',
    specialTrigger:       'hp_below_50',
    ability1: null, ability2: null, ability3: null, ability4: null,
  },
];

// ─── Battle simulation overlay ────────────────────────────────────────────────

interface BattleSimProps {
  enemy: FloorMapEnemy;
  onVictory: () => void;
  onDefeat:  () => void;
}

function BattleSim({ enemy, onVictory, onDefeat }: BattleSimProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(2,6,17,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: 'rgba(0,229,255,0.6)', textTransform: 'uppercase' }}>
        {enemy.isBoss ? 'Batalha de Boss' : 'Batalha'}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>
        {enemy.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
        Lv.{enemy.level} — {enemy.elementType} — HP {enemy.hpMax}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
        <button
          onClick={onVictory}
          style={{
            padding: '10px 28px',
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: 4, color: 'rgba(34,197,94,0.95)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Vitoria
        </button>
        <button
          onClick={onDefeat}
          style={{
            padding: '10px 28px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 4, color: 'rgba(239,68,68,0.85)',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Derrota
        </button>
      </div>
      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: 1, marginTop: 8 }}>
        Demo — em producao sera o BattleScreen real
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FloorMapDemo() {
  const mapHandle = useRef<FloorMapHandle>(null);
  const [currentEnemy, setCurrentEnemy] = useState<FloorMapEnemy | null>(null);

  // We keep a mutable list so the FloorMap can re-render with defeats
  const [defeatedIds, setDefeatedIds] = useState<Set<string>>(new Set());

  // Merge defeated state into mock enemies
  const enemies = MOCK_ENEMIES.map(e => ({
    ...e,
    defeated: defeatedIds.has(e.id),
  }));

  const handleEncounter = useCallback((enemy: FloorMapEnemy) => {
    setCurrentEnemy(enemy);
  }, []);

  function handleVictory() {
    if (!currentEnemy) return;
    mapHandle.current?.markDefeated(currentEnemy.id);
    setDefeatedIds(prev => new Set([...prev, currentEnemy.id]));
    toast.success(`${currentEnemy.name} derrotado!`, {
      description: currentEnemy.isBoss ? '+100 XP  +50 moedas' : `+${currentEnemy.hpMax / 4 | 0} XP`,
    });
    setCurrentEnemy(null);
  }

  function handleDefeat() {
    mapHandle.current?.resetToMap();
    toast.error('Derrota — tente novamente');
    setCurrentEnemy(null);
  }

  function handleBack() {
    // In production this navigates to the floor selection list
    toast.info('Voltando para selecao de andares');
  }

  return (
    <>
      <FloorMap
        floor={floor}
        enemies={enemies}
        onBack={handleBack}
        onEnemyEncounter={handleEncounter}
        mapRef={mapHandle}
      />

      {currentEnemy && (
        <BattleSim
          enemy={currentEnemy}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
        />
      )}
    </>
  );
}

const floor = MOCK_FLOOR;
