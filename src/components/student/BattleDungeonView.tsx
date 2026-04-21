import { useState, useRef, useEffect } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { getEnemySpriteUrl } from '@/lib/sprites/getEnemySprite';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle/BattleEngine';
import { FloorSelect as FloorSelectVisual } from '@/components/floor-select/FloorSelect';
import { getFloorStatus } from '@/components/floor-select/useFloorSelect';
import type { FloorSelectData } from '@/components/floor-select/useFloorSelect';
import { FloorMap } from '@/components/floor-map/FloorMap';
import type { FloorMapHandle, FloorMapEnemy } from '@/components/floor-map/FloorMap';
import type { FloorData } from '@/components/floor-map/useFloorMap';
import { BattleScreen } from '@/components/battle/BattleScreen';
import { VictoryScreen } from '@/components/battle/VictoryScreen';
import {
  useFloors, useFloorProgress, useFloorEnemies,
  useEnemyDefeats, useRecordEnemyDefeatById, useRecordEnemyDefeat,
  type Floor, type FloorEnemy,
} from '@/hooks/useFloors';
import { useEquippedAbilities, useAbilities } from '@/hooks/useAbilities';
import { useApplyBattleRewards } from '@/hooks/useCharacter';
import type { BattleRewards } from '@/lib/loot/lootGenerator';
import {
  processXPGain,
  getTotalXPForLevel,
  type XPReward,
} from '@/lib/progression/xpCalculator';
import { XPLevelBadge } from './XPLevelBadge';

// ─── Convert FloorEnemy → FloorMapEnemy ──────────────────────────────────────

function toFloorMapEnemy(fe: FloorEnemy, defeatedIds: Set<string>): FloorMapEnemy {
  return {
    id:           fe.id,
    positionX:    fe.positionX,
    positionY:    fe.positionY,
    defeated:     defeatedIds.has(fe.id),
    isBoss:       fe.isBoss,
    name:         fe.name,
    level:        fe.level,
    iconType:     fe.iconType,
    spriteUrl:    getEnemySpriteUrl(fe.id),
    hpMax:        fe.hpMax,
    defFisica:    fe.defFisica,
    defMagica:    fe.defMagica,
    velocidade:   fe.velocidade,
    elementType:  fe.elementType,
    ability1:     fe.ability1,
    ability2:     fe.ability2,
    ability3:     fe.ability3,
    ability4:     fe.ability4,
    specialAbilityName:   fe.specialAbilityName,
    specialAbilityEffect: fe.specialAbilityEffect,
    specialTrigger:       fe.specialTrigger,
  };
}

// ─── Convert FloorMapEnemy → BattleEnemy ─────────────────────────────────────

function toBattleEnemy(fe: FloorMapEnemy, abilityMap: Record<string, Ability>): BattleEnemy {
  const ids = [fe.ability1, fe.ability2, fe.ability3, fe.ability4].filter(Boolean) as string[];
  return {
    id:          fe.id,
    name:        fe.name,
    level:       fe.level,
    hpCurrent:   fe.hpMax,
    hpMax:       fe.hpMax,
    defFisica:   fe.defFisica,
    defMagica:   fe.defMagica,
    velocidade:  fe.velocidade,
    elementType: fe.elementType as BattleEnemy['elementType'],
    abilities:   ids.map(id => abilityMap[id]).filter(Boolean),
    isBoss:      fe.isBoss,
    spriteUrl:   getEnemySpriteUrl(fe.id),
    specialName:    fe.specialAbilityName   ?? undefined,
    specialEffect:  fe.specialAbilityEffect ?? undefined,
    specialTrigger: (fe.specialTrigger as BattleEnemy['specialTrigger']) ?? undefined,
  };
}

// ─── Phase types ──────────────────────────────────────────────────────────────

type DungeonPhase =
  | { type: 'select' }
  | { type: 'map';     floor: Floor }
  | { type: 'battle';  floor: Floor; enemy: FloorMapEnemy }
  | { type: 'victory'; floor: Floor; enemy: FloorMapEnemy; xp: number; coins: number }
  | { type: 'defeat';  floor: Floor; enemy: FloorMapEnemy };

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleDungeonViewProps {
  character:         BattleCharacter;
  onRewardApplied?:  () => void;
  onBack?:           () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BattleDungeonView({ character, onRewardApplied, onBack }: BattleDungeonViewProps) {
  const [phase, setPhase] = useState<DungeonPhase>({ type: 'select' });

  // XP reward computed at battle-end, shown in the VictoryScreen
  const [pendingXPReward, setPendingXPReward] = useState<XPReward | null>(null);

  // Floor map handle (to mark enemies defeated / reset after battle)
  const mapHandle = useRef<FloorMapHandle>(null);

  // Floors + progress (for FloorSelect visual)
  const { data: floors = [],   isLoading: loadingFloors }   = useFloors();
  const { data: progress = [], isLoading: loadingProgress }  = useFloorProgress(character.id);

  // Abilities
  const { data: allAbilities = [] } = useAbilities();
  const { data: equippedSlots = [], isLoading: loadingEquipped } = useEquippedAbilities(character.id);
  const abilityMap = Object.fromEntries(allAbilities.map(a => [a.id, a]));
  const equippedAbilities: Ability[] = equippedSlots
    .sort((a, b) => a.slot - b.slot)
    .map(s => abilityMap[s.ability_id])
    .filter(Boolean);

  // Active floor's enemies (loaded when on map/battle phase)
  const activeFloorId = (phase.type === 'map' || phase.type === 'battle' || phase.type === 'victory' || phase.type === 'defeat')
    ? phase.floor.id : null;
  const { data: floorEnemies = [], isLoading: loadingEnemies } = useFloorEnemies(activeFloorId);

  // Which individual enemies this character has already defeated on this floor
  const { data: defeatedIds = new Set<string>(), isLoading: loadingDefeats } =
    useEnemyDefeats(character.id, activeFloorId);

  // Mutations
  const recordDefeatById = useRecordEnemyDefeatById();
  const recordDefeat     = useRecordEnemyDefeat();
  const applyRewards     = useApplyBattleRewards(character.id);

  // Safety net: if equipped-abilities query never resolves in battle phase, unblock after 10 s
  const [battleLoadTimedOut, setBattleLoadTimedOut] = useState(false);
  useEffect(() => {
    if (phase.type !== 'battle' || !loadingEquipped) {
      setBattleLoadTimedOut(false);
      return;
    }
    const t = setTimeout(() => {
      console.warn('[BattleDungeonView] loadingEquipped timed out after 10 s');
      setBattleLoadTimedOut(true);
    }, 10_000);
    return () => clearTimeout(t);
  }, [phase.type, loadingEquipped]);

  // ── SELECT phase ──────────────────────────────────────────────────────────

  if (phase.type === 'select') {
    if (loadingFloors || loadingProgress) {
      return (
        <div className="flex items-center justify-center h-full text-white/60">
          <Loader2 className="animate-spin mr-3" size={24} /> Carregando andares...
        </div>
      );
    }

    // Removed empty state so that FloorSelectVisual can map the 100 dummy floors.

    const bossDefeatedSet = new Set<number>(
      progress
        .filter(p => p.bossDefeated)
        .map(p => floors.find(f => String(f.id) === String(p.floorId))?.floorNumber)
        .filter((n): n is number => n !== undefined),
    );

    const lowestAvailableFloorNumber = floors.length > 0
      ? Math.min(...floors.map(f => Number(f.floorNumber)))
      : 1;

    const floorSelectData: FloorSelectData[] = floors.map((floor, index) => {
      const fNum = Number(floor.floorNumber) || (index + 1);
      return {
        id:           String(floor.id),
        floor_number: fNum,
      name:         floor.name || floor.theme,
      theme:        floor.theme,
      boss:         null,
      status:       fNum <= 5 ? 'current' : getFloorStatus(fNum, bossDefeatedSet, lowestAvailableFloorNumber),
    };
  });

    return (
      <FloorSelectVisual
        floors={floorSelectData}
        onBack={onBack ?? (() => {})}
        onPlay={(floorId) => {
          const floorIdStr = String(floorId);
          const floor = floors.find(f => String(f.id) === floorIdStr);
          if (floor) setPhase({ type: 'map', floor });
        }}
      />
    );
  }

  // ── MAP phase ─────────────────────────────────────────────────────────────

  if (phase.type === 'map') {
    if (loadingEnemies || loadingDefeats) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020611] text-white/60">
          <Loader2 className="animate-spin mr-3" size={24} /> Carregando mapa...
        </div>
      );
    }

    const mapEnemies: FloorMapEnemy[] = floorEnemies.map(fe => toFloorMapEnemy(fe, defeatedIds));

    const floorData: FloorData = {
      id:          String(phase.floor.id),
      floorNumber: phase.floor.floorNumber,
      name:        phase.floor.name,
      theme:       (phase.floor.theme as FloorData['theme']) ?? 'forest',
    };

    return (
      <>
        <FloorMap
          floor={floorData}
          enemies={mapEnemies}
          mapRef={mapHandle}
          onBack={() => setPhase({ type: 'select' })}
          onEnemyEncounter={(enemy) => {
            setPhase({ type: 'battle', floor: phase.floor, enemy });
          }}
        />
        {/* XP / Level badge — always visible on the floor map */}
        <XPLevelBadge character={character} />
      </>
    );
  }

  // ── BATTLE phase ──────────────────────────────────────────────────────────

  if (phase.type === 'battle') {
    if (loadingEquipped && !battleLoadTimedOut) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020611] text-white/60">
          <Loader2 className="animate-spin mr-3" size={24} /> Carregando batalha...
        </div>
      );
    }

    if (battleLoadTimedOut && loadingEquipped) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020611] gap-4">
          <div className="holo-panel text-center p-8 max-w-sm">
            <p className="text-lg font-bold mb-2 text-white">Erro ao carregar batalha</p>
            <p className="text-sm text-white/60 mb-4">Não foi possível carregar as habilidades. Verifique sua conexão e tente novamente.</p>
            <button className="btn-cyber w-full justify-center" onClick={() => setPhase({ type: 'map', floor: phase.floor })}>
              Voltar ao mapa
            </button>
          </div>
        </div>
      );
    }

    if (equippedAbilities.length === 0) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#020611]">
          <div className="holo-panel text-center p-8 max-w-sm">
            <p className="text-lg font-bold mb-2 text-white">Nenhuma habilidade equipada!</p>
            <p className="text-sm text-white/60 mb-4">Vá até a aba <strong>Skills</strong> e equipe até 4 habilidades antes de batalhar.</p>
            <button className="btn-cyber" onClick={() => setPhase({ type: 'map', floor: phase.floor })}>
              Voltar ao mapa
            </button>
          </div>
        </div>
      );
    }

    const battleEnemy = toBattleEnemy(phase.enemy, abilityMap);

    return (
      <BattleScreen
        player={character}
        enemy={battleEnemy}
        equippedAbilities={equippedAbilities}
        onVictory={(xp, coins) => {
          // Compute level-up result immediately for instant VictoryScreen feedback
          const spentOnPastLevels = getTotalXPForLevel(character.level);
          const currentLevelXP    = Math.max(0, character.xp - spentOnPastLevels);
          const xpResult          = processXPGain(character.level, currentLevelXP, xp);
          setPendingXPReward(xpResult);

          // Record defeat + apply rewards (DB write)
          recordDefeatById.mutate({ characterId: character.id, enemyId: phase.enemy.id });
          recordDefeat.mutate({ characterId: character.id, floorId: phase.floor.id, isBoss: phase.enemy.isBoss });
          applyRewards.mutate({ xp, coins }, { onSuccess: () => onRewardApplied?.() });
          setPhase({ type: 'victory', floor: phase.floor, enemy: phase.enemy, xp, coins });
        }}
        onDefeat={() => setPhase({ type: 'defeat', floor: phase.floor, enemy: phase.enemy })}
        onFled={() => setPhase({ type: 'defeat', floor: phase.floor, enemy: phase.enemy })}
      />
    );
  }

  // ── VICTORY phase ─────────────────────────────────────────────────────────

  if (phase.type === 'victory') {
    const xpReward: XPReward = pendingXPReward ?? {
      baseXP: phase.xp, bonusXP: 0, totalXP: phase.xp, leveledUp: false, levelsGained: 0,
    };
    const rewards: BattleRewards = {
      xp:       phase.xp,
      coins:    phase.coins,
      diamonds: phase.enemy.isBoss ? Math.floor(Math.random() * 3) + 1 : 0,
      items:    [],
    };

    return (
      <VictoryScreen
        rewards={rewards}
        xpReward={xpReward}
        onContinue={() => {
          setPendingXPReward(null);
          mapHandle.current?.markDefeated(phase.enemy.id);
          setPhase({ type: 'map', floor: phase.floor });
        }}
      />
    );
  }

  // ── DEFEAT phase ──────────────────────────────────────────────────────────

  if (phase.type === 'defeat') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#020611] gap-6">
        <div className="holo-panel text-center p-8 max-w-sm">
          <p className="text-5xl mb-4">💀</p>
          <h2 className="text-2xl font-black text-red-400 mb-2">Derrota...</h2>
          <p className="text-white/60 text-sm mb-2">
            <strong className="text-white/80">{phase.enemy.name}</strong> foi mais forte desta vez.
          </p>
          <p className="text-white/40 text-xs mb-6">
            Distribua mais pontos elementais e equipe habilidades melhores.
          </p>
          <button
            className="btn-cyber w-full justify-center"
            onClick={() => {
              mapHandle.current?.resetToMap();
              setPhase({ type: 'map', floor: phase.floor });
            }}
          >
            <RotateCcw size={14} /> Voltar ao mapa
          </button>
        </div>
      </div>
    );
  }

  return null;
}
