import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloorSelect }     from '@/components/floor-select/FloorSelect';
import type { FloorSelectData } from '@/components/floor-select/useFloorSelect';
import { toast } from 'sonner';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FLOORS: FloorSelectData[] = [
  {
    id: 'floor-1', floor_number: 1, name: 'Floresta Sombria', theme: 'forest',
    boss: { name: 'Guardiao da Floresta', icon: 'crown', hp: 500, atk: 20, def: 15, coins: 50, xp: 100, item: 'Escudo Verdejante' },
    status: 'completed',
  },
  {
    id: 'floor-2', floor_number: 2, name: 'Deserto Ardente', theme: 'desert',
    boss: { name: 'Escorpiao Imperador', icon: 'skull', hp: 700, atk: 25, def: 12, coins: 75, xp: 150, item: 'Lamina do Sol' },
    status: 'completed',
  },
  {
    id: 'floor-3', floor_number: 3, name: 'Cavernas de Cristal', theme: 'cave',
    boss: { name: 'Golem de Cristal', icon: 'shield', hp: 900, atk: 18, def: 30, coins: 80, xp: 180, item: 'Amuleto Prismatico' },
    status: 'completed',
  },
  {
    id: 'floor-4', floor_number: 4, name: 'Pantano Sombrio', theme: 'forest',
    boss: { name: 'Hydra Venenosa', icon: 'spider', hp: 1100, atk: 28, def: 18 },
    status: 'current',
  },
  {
    id: 'floor-5', floor_number: 5, name: 'Picos Congelados', theme: 'ice',
    boss: null, status: 'locked',
  },
  {
    id: 'floor-6', floor_number: 6, name: 'Ruinas Ancestrais', theme: 'castle',
    boss: null, status: 'locked',
  },
  {
    id: 'floor-7', floor_number: 7, name: 'Vulcao Infernal', theme: 'volcano',
    boss: null, status: 'locked',
  },
  {
    id: 'floor-8', floor_number: 8, name: 'Abismo Profundo', theme: 'cave',
    boss: null, status: 'locked',
  },
  {
    id: 'floor-9', floor_number: 9, name: 'Jardim Celestial', theme: 'forest',
    boss: null, status: 'locked',
  },
  {
    id: 'floor-10', floor_number: 10, name: 'Trono do Rei Sombrio', theme: 'castle',
    boss: null, status: 'locked',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FloorSelectDemo() {
  const navigate = useNavigate();

  function handleBack() {
    navigate(-1);
  }

  function handlePlay(floorId: string) {
    if (floorId === 'floor-4') {
      navigate('/floor-map-demo');
    } else {
      toast.info(`Navegando para o andar: ${floorId}`);
    }
  }

  return (
    <FloorSelect
      floors={MOCK_FLOORS}
      onBack={handleBack}
      onPlay={handlePlay}
    />
  );
}
