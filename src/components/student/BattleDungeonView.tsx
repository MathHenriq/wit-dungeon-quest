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
  useEnemyDefeats, useRecordEnemyDefeat,
  type Floor, type FloorEnemy,
} from '@/hooks/useFloors';
import { useEquippedAbilities, useAbilities } from '@/hooks/useAbilities';
import { useEquippedItem } from '@/hooks/useEquippedItem';
import { useApplyBattleRewards } from '@/hooks/useCharacter';
import type { BattleRewards } from '@/lib/loot/lootGenerator';
import { applyBattleDrops } from '@/lib/drops/applyBattleDrops';
import type { DropResult } from '@/lib/drops/dropTypes';
import {
  processXPGain,
  getTotalXPForLevel,
  type XPReward,
} from '@/lib/progression/xpCalculator';
import { XPLevelBadge } from './XPLevelBadge';
import { useAnalytics } from '@/hooks/useAnalytics';

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

type ViewPhase =
  | { type: 'select' }
  | { type: 'map';     floor: Floor }
  | { type: 'battle';  floor: Floor; enemy: FloorMapEnemy }
  | { type: 'victory'; floor: Floor; enemy: FloorMapEnemy; xp: number; coins: number; drops: DropResult[] }
  | { type: 'defeat';  floor: Floor; enemy: FloorMapEnemy };

interface BattleDungeonViewProps {
  character:         BattleCharacter;
  studentId:         string;
  teacherId:         string;
  classId?:          string;
  onRewardApplied?:  () => void;
  onBack:            () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BattleDungeonView({ 
  character, 
  studentId, 
  teacherId, 
  classId, 
  onRewardApplied, 
  onBack 
}: BattleDungeonViewProps) {
  const { track, trackBossAttempt, trackEnemyVictory } = useAnalytics();
  const [phase, setPhase] = useState<ViewPhase>({ type: 'select' });

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

  // Equipped item granting an in-battle ability (null if none)
  const { data: equippedItem = null } = useEquippedItem(studentId);

  // Active floor's enemies (loaded when on map/battle phase)
  const activeFloorId = (phase.type === 'map' || phase.type === 'battle' || phase.type === 'victory' || phase.type === 'defeat')
    ? phase.floor.id : null;
  const { data: floorEnemies = [], isLoading: loadingEnemies } = useFloorEnemies(activeFloorId);

  // Which individual enemies this character has already defeated on this floor
  const { data: defeatedIds = new Set<string>(), isLoading: loadingDefeats } =
    useEnemyDefeats(character.id, activeFloorId);

  // Mutations
  const recordDefeat     = useRecordEnemyDefeat();
  const applyRewards     = useApplyBattleRewards(character.id);

  // ── Rendering logic ──

  if (phase.type === 'select') {
    if (loadingFloors || loadingProgress) {
      return (
        <div className="flex items-center justify-center h-full text-white/60 bg-[#020611]">
          <Loader2 className="animate-spin mr-3" size={24} /> Carregando andares...
        </div>
      );
    }

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
        status:       getFloorStatus(fNum, bossDefeatedSet, lowestAvailableFloorNumber),
      };
    });

    return (
      <FloorSelectVisual
        floors={floorSelectData}
        onBack={onBack}
        onPlay={(floorId) => {
          const floorIdStr = String(floorId);
          const floor = floors.find(f => String(f.id) === floorIdStr);
          if (floor) setPhase({ type: 'map', floor });
        }}
      />
    );
  }

  // If we are here, we are in a floor (map, battle, victory, or defeat)
  
  const xpReward: XPReward | null = phase.type === 'victory' ? (pendingXPReward ?? {
    baseXP: phase.xp, bonusXP: 0, totalXP: phase.xp, leveledUp: false, levelsGained: 0,
  }) : null;

  const rewards: BattleRewards | null = phase.type === 'victory' ? {
    xp:       phase.xp,
    coins:    phase.coins,
    diamonds: phase.enemy.isBoss ? Math.floor(Math.random() * 3) + 1 : 0,
    items:    [],
  } : null;

  const mapEnemies: FloorMapEnemy[] = floorEnemies.map(fe => toFloorMapEnemy(fe, defeatedIds));

  const activeFloorData: FloorData = {
    id:          String(phase.floor.id),
    floorNumber: phase.floor.floorNumber,
    name:        phase.floor.name,
    theme:       (phase.floor.theme as FloorData['theme']) ?? 'forest',
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020611]">
      {/* ── MAP LAYER (always mounted if a floor is picked) ── */}
      <div 
        className="absolute inset-0 z-10"
        style={{ visibility: phase.type === 'map' ? 'visible' : 'hidden' }}
      >
        {(loadingEnemies || loadingDefeats) ? (
          <div className="flex items-center justify-center h-full text-white/60">
            <Loader2 className="animate-spin mr-3" size={24} /> Carregando mapa...
          </div>
        ) : (
          <>
            <FloorMap
              floor={activeFloorData}
              enemies={mapEnemies}
              mapRef={mapHandle}
              onBack={() => setPhase({ type: 'select' })}
              onEnemyEncounter={(enemy) => {
                setPhase({ type: 'battle', floor: phase.floor, enemy });
              }}
            />
            <XPLevelBadge character={character} />
          </>
        )}
      </div>

      {/* ── BATTLE LAYER ── */}
      {phase.type === 'battle' && (
        <div className="absolute inset-0 z-20">
          <BattleScreen
            player={character}
            enemy={toBattleEnemy(phase.enemy, abilityMap)}
            equippedAbilities={equippedAbilities}
            equippedItem={equippedItem}
            onVictory={(xp, coins) => {
              // 1. Compute level-up result immediately for instant VictoryScreen feedback
              const spentOnPastLevels = getTotalXPForLevel(character.level);
              const currentLevelXP    = Math.max(0, character.xp - spentOnPastLevels);
              const xpResult          = processXPGain(character.level, currentLevelXP, xp);
              setPendingXPReward(xpResult);

              // 2. Record defeat + apply rewards (DB write)
              recordDefeat.mutate({ 
                characterId: character.id, 
                floorId: String(phase.floor.id), 
                enemyId: phase.enemy.id, 
                isBoss: phase.enemy.isBoss 
              });
              applyRewards.mutate({ xp, coins }, { onSuccess: () => onRewardApplied?.() });

              // 3. Roll drops via RPC
              const dropsPromise = studentId
                ? applyBattleDrops(studentId, phase.enemy.id)
                : Promise.resolve<DropResult[]>([]);

              // 4. Track Analytics
              if (phase.enemy.isBoss) {
                trackBossAttempt(teacherId, studentId, classId ?? '', phase.enemy.id, true, xp);
              } else {
                trackEnemyVictory(teacherId, studentId, classId ?? '', String(phase.floor.id), phase.enemy.id, xp);
              }

              // 5. Transition to victory screen
              dropsPromise.then((drops) => {
                setPhase({ type: 'victory', floor: phase.floor, enemy: phase.enemy, xp, coins, drops });
              });
            }}
            onDefeat={() => setPhase({ type: 'defeat', floor: phase.floor, enemy: phase.enemy })}
          />
        </div>
      )}

      {/* ── VICTORY LAYER ── */}
      {phase.type === 'victory' && rewards && xpReward && (
        <div className="absolute inset-0 z-30">
          <VictoryScreen
            rewards={rewards}
            xpReward={xpReward}
            drops={phase.drops}
            onContinue={() => {
              setPendingXPReward(null);
              mapHandle.current?.markDefeated(phase.enemy.id);
              setPhase({ type: 'map', floor: phase.floor });
            }}
          />
        </div>
      )}

      {/* ── DEFEAT LAYER ── */}
      {phase.type === 'defeat' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020611] gap-6">
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
      )}
    </div>
  );
}
