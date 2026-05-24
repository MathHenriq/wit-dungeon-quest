import { useState, useRef, useEffect } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { getEnemySpriteUrl } from '@/lib/sprites/getEnemySprite';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle/BattleEngine';
import { scaleEnemyForFloor } from '@/lib/battle/enemyScaling';
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
import { useClassProfile } from '@/hooks/useClassProfile';
import { applyClassVariant } from '@/lib/skills/abilityVariants';
import { useEquippedItem } from '@/hooks/useEquippedItem';
import { useApplyBattleRewards } from '@/hooks/useCharacter';
import type { BattleRewards } from '@/lib/loot/lootGenerator';
import { applyBattleDrops } from '@/lib/drops/applyBattleDrops';
import { applyBattleMaterials, type MaterialDrop } from '@/lib/drops/applyBattleMaterials';
import { applyBattleEventFragments } from '@/lib/drops/applyBattleEventFragments';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { toast } from 'sonner';
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
    elementTypeSecondary: fe.elementTypeSecondary ?? null,
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

function toBattleEnemy(
  fe: FloorMapEnemy,
  abilityMap: Record<string, Ability>,
  floorNumber: number,
): BattleEnemy {
  const ids = [fe.ability1, fe.ability2, fe.ability3, fe.ability4].filter(Boolean) as string[];
  const base: BattleEnemy = {
    id:          fe.id,
    name:        fe.name,
    level:       fe.level,
    hpCurrent:   fe.hpMax,
    hpMax:       fe.hpMax,
    defFisica:   fe.defFisica,
    defMagica:   fe.defMagica,
    velocidade:  fe.velocidade,
    elementType: fe.elementType as BattleEnemy['elementType'],
    elementTypeSecondary: (fe.elementTypeSecondary ?? null) as BattleEnemy['elementTypeSecondary'],
    abilities:   ids.map(id => abilityMap[id]).filter(Boolean),
    isBoss:      fe.isBoss,
    floorNumber,
    spriteUrl:   getEnemySpriteUrl(fe.id),
    specialName:    fe.specialAbilityName   ?? undefined,
    specialEffect:  fe.specialAbilityEffect ?? undefined,
    specialTrigger: (fe.specialTrigger as BattleEnemy['specialTrigger']) ?? undefined,
  };
  // Patch 2.2 — apply the floor-depth curve to HP and defenses, and the boss
  // HP bonus, before handing the enemy to the BattleEngine.
  return scaleEnemyForFloor(base, floorNumber);
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
  // Local combo streak: 3+ vitórias consecutivas sem derrota/fuga → daily counter.
  const winStreakRef = useRef<number>(0);

  // Floors + progress (for FloorSelect visual)
  const { data: floors = [],   isLoading: loadingFloors }   = useFloors();
  const { data: progress = [], isLoading: loadingProgress }  = useFloorProgress(character.id);

  // Abilities — Wave 11 C.4: rewrite legacy ability names/descriptions to the
  // class-specific variant from SKILLS_REGISTRY when the student has a class.
  // baseDamage/accuracy/effect stay from the legacy table; only display +
  // damage type are replaced.
  const { data: classProfile } = useClassProfile(studentId);
  const wave11Class = classProfile?.classType ?? null;
  const { data: rawAllAbilities = [] } = useAbilities();
  const allAbilities = wave11Class
    ? rawAllAbilities.map(a => applyClassVariant(a, wave11Class))
    : rawAllAbilities;
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
            // Onda 11.3 — anexa studentId para que o useBattleEngine carregue
            // class_profile/passivas do aluno. Sem isso o wiring é no-op.
            player={{ ...character, studentId }}
            enemy={toBattleEnemy(phase.enemy, abilityMap, phase.floor.floorNumber)}
            equippedAbilities={equippedAbilities}
            equippedItem={equippedItem}
            onVictory={(xp, coins, meta) => {
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

              // 3. Roll drops via RPC. Materials are a parallel drop pool
              // (Patch 3.1) — separate RPC, separate inventory table, can't
              // be traded. We resolve both in parallel.
              const dropsPromise: Promise<DropResult[]> = studentId
                ? applyBattleDrops(studentId, phase.enemy.id)
                : Promise.resolve<DropResult[]>([]);
              const materialsPromise: Promise<MaterialDrop[]> = studentId
                ? applyBattleMaterials(studentId, phase.enemy.id, phase.floor.floorNumber)
                : Promise.resolve<MaterialDrop[]>([]);
              // Patch 8.4: bump daily counters (battles + bosses).
              void supabaseStudent.rpc('increment_daily_counter', { p_type: 'battles_won', p_amount: 1 });
              if (phase.enemy.isBoss) {
                void supabaseStudent.rpc('increment_daily_counter', { p_type: 'bosses_won', p_amount: 1 });
                // Vencer o boss libera o próximo andar — conta como floor cleared.
                void supabaseStudent.rpc('increment_daily_counter', { p_type: 'floors_cleared', p_amount: 1 });
              }
              if (meta?.isFlawless) {
                void supabaseStudent.rpc('increment_daily_counter', { p_type: 'flawless_battles', p_amount: 1 });
              }
              // 3+ vitórias consecutivas (estado local). Reset em derrota/fuga.
              winStreakRef.current = (winStreakRef.current ?? 0) + 1;
              if (winStreakRef.current >= 3) {
                void supabaseStudent.rpc('increment_daily_counter', { p_type: 'battle_combo', p_amount: 1 });
              }
              // Patch 5.3: event-vault fragment drop (resolved server-side).
              void applyBattleEventFragments(!!phase.enemy.isBoss).then(async drops => {
                for (const d of drops) {
                  toast.success(`+${d.amount} fragmento(s)`, { description: d.eventName });
                }
                // Patch 5.4: check event missions for auto-completion.
                const { data } = await supabaseStudent.rpc('check_my_event_missions');
                const completed = ((data as { completed?: Array<{ title: string; reward_coins: number }> } | null)?.completed) ?? [];
                completed.forEach(m => toast.success(`Missão concluída: ${m.title}`, { description: `+${m.reward_coins} moedas` }));
                if (completed.length > 0) {
                  void supabaseStudent.rpc('increment_daily_counter', { p_type: 'event_missions_done', p_amount: completed.length });
                }
                // Patch 5.5: increment usage for equipped items (mastery skins).
                const { data: usageData } = await supabaseStudent.rpc('increment_my_card_usage', { p_item_ids: null });
                const unlocks = ((usageData as { unlocked?: Array<{ skin_name: string }> } | null)?.unlocked) ?? [];
                unlocks.forEach(u => toast.success(`Nova skin: ${u.skin_name}`, { description: 'Mestria desbloqueada' }));
              });

              // 4. Track Analytics
              if (phase.enemy.isBoss) {
                trackBossAttempt(teacherId, studentId, classId ?? '', phase.enemy.id, true, xp);
              } else {
                trackEnemyVictory(teacherId, studentId, classId ?? '', String(phase.floor.id), phase.enemy.id, xp);
              }

              // 5. Transition to victory screen once both drop pools resolved.
              Promise.all([dropsPromise, materialsPromise]).then(([drops, materials]) => {
                setPhase({ type: 'victory', floor: phase.floor, enemy: phase.enemy, xp, coins, drops });
                // Lightweight material notification; full inventory tab updates
                // automatically via React Query invalidation on focus / refetch.
                if (materials.length > 0) {
                  for (const m of materials) {
                    toast.success(`+${m.quantity} ${m.name}`, { description: 'Material adicionado ao inventário' });
                  }
                }
              });
            }}
            onDefeat={() => { winStreakRef.current = 0; setPhase({ type: 'defeat', floor: phase.floor, enemy: phase.enemy }); }}
            // Flee: no rewards, no defeat record — just bounce back to the floor map.
            // Without this handler the "Fugiu!" overlay traps the player forever.
            onFled={() => { winStreakRef.current = 0; setPhase({ type: 'map', floor: phase.floor }); }}
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
