import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FloorStatus = 'completed' | 'current' | 'locked';

export interface FloorBoss {
  name:   string;
  icon:   string;
  hp:     number;
  atk:    number;
  def:    number;
  coins?: number;
  xp?:    number;
  item?:  string;
}

export interface FloorSelectData {
  id:           string;
  floor_number: number;
  name:         string;
  theme:        string;
  boss:         FloorBoss | null;
  status:       FloorStatus;
}

interface UseFloorSelectOptions {
  floors: FloorSelectData[];
  onPlay: (floorId: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFloorSelect({ floors, onPlay }: UseFloorSelectOptions) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedCount = floors.filter(f => f.status === 'completed').length;
  const currentFloor   = floors.find(f => f.status === 'current') ?? null;

  const toggle = useCallback((floorId: string) => {
    setExpandedId(prev => prev === floorId ? null : floorId);
  }, []);

  const handlePlay = useCallback((floorId: string) => {
    onPlay(floorId);
  }, [onPlay]);

  return {
    expandedId,
    completedCount,
    currentFloor,
    toggle,
    handlePlay,
  };
}

// ─── Status helper ────────────────────────────────────────────────────────────

export function getFloorStatus(
  floorNumber: number,
  bossDefeatedSet: Set<number>,
): FloorStatus {
  if (bossDefeatedSet.has(floorNumber)) return 'completed';
  const prevCompleted = floorNumber === 1 || bossDefeatedSet.has(floorNumber - 1);
  if (prevCompleted) return 'current';
  return 'locked';
}
