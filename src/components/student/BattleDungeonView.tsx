import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import type { BattleCharacter, Ability } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle/BattleEngine';
import { FloorSelect } from '@/components/student/FloorSelect';
import { BattleScreen } from '@/components/battle/BattleScreen';
import { VictoryScreen } from '@/components/battle/VictoryScreen';
import { useFloorEnemies, useRecordEnemyDefeat, type Floor, type FloorEnemy } from '@/hooks/useFloors';
import { useEquippedAbilities, useAbilities } from '@/hooks/useAbilities';
import { calculateXPGain, processXPGain } from '@/lib/progression/xpCalculator';
import { calculateCoinReward } from '@/lib/loot/lootGenerator';
import type { BattleRewards } from '@/lib/loot/lootGenerator';
import type { XPReward } from '@/lib/progression/xpCalculator';

// ─── Convert FloorEnemy → BattleEnemy ────────────────────────────────────────

function toBattleEnemy(fe: FloorEnemy, abilityMap: Record<string, Ability>): BattleEnemy {
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
    elementType: fe.elementType,
    abilities:   ids.map(id => abilityMap[id]).filter(Boolean),
    isBoss:      fe.isBoss,
    spriteUrl:   undefined,
    specialName:    fe.specialAbilityName   ?? undefined,
    specialEffect:  fe.specialAbilityEffect ?? undefined,
    specialTrigger: (fe.specialTrigger as BattleEnemy['specialTrigger']) ?? undefined,
  };
}

// ─── Enemy battle sub-view ────────────────────────────────────────────────────

interface EnemyBattleProps {
  character:   BattleCharacter;
  floor:       Floor;
  enemy:       FloorEnemy;
  abilityMap:  Record<string, Ability>;
  equippedAbilities: Ability[];
  onWin:       (xp: number, coins: number) => void;
  onLose:      () => void;
}

function EnemyBattle({ character, floor, enemy, abilityMap, equippedAbilities, onWin, onLose }: EnemyBattleProps) {
  const battleEnemy = toBattleEnemy(enemy, abilityMap);

  if (equippedAbilities.length === 0) {
    return (
      <div className="holo-panel text-center py-12 text-white/60">
        <p className="text-lg font-bold mb-2">Nenhuma habilidade equipada!</p>
        <p className="text-sm">Vá até a aba <strong>Skills</strong> e equipe até 4 habilidades antes de batalhar.</p>
      </div>
    );
  }

  return (
    <BattleScreen
      player={character}
      enemy={battleEnemy}
      equippedAbilities={equippedAbilities}
      onVictory={onWin}
      onDefeat={onLose}
      onFled={onLose}
    />
  );
}

// ─── Main BattleDungeonView ───────────────────────────────────────────────────

type DungeonPhase =
  | { type: 'select' }
  | { type: 'battle'; floor: Floor; enemy: FloorEnemy }
  | { type: 'victory'; floor: Floor; enemy: FloorEnemy; xp: number; coins: number }
  | { type: 'defeat';  floor: Floor }
  | { type: 'floor_complete'; floor: Floor };

interface BattleDungeonViewProps {
  character: BattleCharacter;
}

export function BattleDungeonView({ character }: BattleDungeonViewProps) {
  const [phase, setPhase] = useState<DungeonPhase>({ type: 'select' });

  // Load all abilities and equipped slots
  const { data: allAbilities = [] }  = useAbilities();
  const { data: equippedSlots = [], isLoading: loadingEquipped } =
    useEquippedAbilities(character.id);

  const abilityMap = Object.fromEntries(allAbilities.map(a => [a.id, a]));
  const equippedAbilities: Ability[] = equippedSlots
    .sort((a, b) => a.slot - b.slot)
    .map(s => abilityMap[s.ability_id])
    .filter(Boolean);

  const recordDefeat = useRecordEnemyDefeat();

  // Enemies for current floor (only needed during battle/select-enemy phase)
  const activeFlorId = phase.type !== 'select' ? phase.floor.id : null;
  const { data: floorEnemies = [], isLoading: loadingEnemies } = useFloorEnemies(activeFlorId);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectFloor(floor: Floor) {
    // Load enemies, then pick first non-boss; if none, pick boss
    // We set to battle phase once enemies load (handled by effect below via floorEnemies)
    setPhase({ type: 'battle', floor, enemy: undefined as unknown as FloorEnemy });
  }

  function handleVictory(floor: Floor, enemy: FloorEnemy, xp: number, coins: number) {
    recordDefeat.mutate({ characterId: character.id, floorId: floor.id, isBoss: enemy.isBoss });
    setPhase({ type: 'victory', floor, enemy, xp, coins });
  }

  function handleDefeat(floor: Floor) {
    setPhase({ type: 'defeat', floor });
  }

  function handleContinueAfterVictory(floor: Floor, enemy: FloorEnemy) {
    if (enemy.isBoss) {
      setPhase({ type: 'floor_complete', floor });
      return;
    }
    // Next enemy: pick first non-boss not yet defeated
    // For simplicity, return to floor select so progress reloads
    setPhase({ type: 'select' });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase.type === 'select') {
    return (
      <FloorSelect
        characterId={character.id}
        characterLevel={character.level}
        onSelectFloor={handleSelectFloor}
      />
    );
  }

  // "battle" phase but enemies not loaded yet
  if (phase.type === 'battle' && (!phase.enemy || loadingEnemies || loadingEquipped)) {
    if (loadingEnemies || loadingEquipped) {
      return (
        <div className="flex items-center justify-center h-64 text-white/60">
          <Loader2 className="animate-spin mr-3" size={24} />
          Carregando batalha...
        </div>
      );
    }

    // Pick next enemy: first non-boss, fallback to boss
    const normal = floorEnemies.filter(e => !e.isBoss);
    const boss   = floorEnemies.filter(e =>  e.isBoss);
    const next   = normal[0] ?? boss[0];

    if (!next) {
      return (
        <div className="holo-panel text-center py-12">
          <p className="text-white/60">Este andar não tem inimigos cadastrados ainda.</p>
          <button className="btn-cyber mt-4" onClick={() => setPhase({ type: 'select' })}>
            Voltar
          </button>
        </div>
      );
    }

    // Update phase with the resolved enemy
    setPhase({ type: 'battle', floor: phase.floor, enemy: next });
    return null;
  }

  if (phase.type === 'battle' && phase.enemy) {
    return (
      <EnemyBattle
        character={character}
        floor={phase.floor}
        enemy={phase.enemy}
        abilityMap={abilityMap}
        equippedAbilities={equippedAbilities}
        onWin={(xp, coins) => handleVictory(phase.floor, phase.enemy, xp, coins)}
        onLose={() => handleDefeat(phase.floor)}
      />
    );
  }

  if (phase.type === 'victory') {
    const xpReward: XPReward = processXPGain(character.level, character.xp, phase.xp);
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
        onContinue={() => handleContinueAfterVictory(phase.floor, phase.enemy)}
      />
    );
  }

  if (phase.type === 'defeat') {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6">
        <div className="holo-panel text-center p-8 max-w-sm">
          <p className="text-5xl mb-4">💀</p>
          <h2 className="text-2xl font-black text-red-400 mb-2">Derrota...</h2>
          <p className="text-white/60 text-sm mb-6">
            Distribua mais pontos elementais e equipe habilidades melhores antes de tentar novamente.
          </p>
          <button
            className="btn-cyber w-full justify-center"
            onClick={() => setPhase({ type: 'select' })}
          >
            <RotateCcw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (phase.type === 'floor_complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6">
        <div className="holo-panel-gold text-center p-8 max-w-sm aaa-pop">
          <p className="text-5xl mb-4">🏰</p>
          <h2 className="text-2xl font-black text-yellow-400 text-glow-gold mb-2">
            Andar Concluído!
          </h2>
          <p className="text-white/70 text-sm mb-6">
            <strong className="text-yellow-300">{phase.floor.name}</strong> foi dominado!
            O próximo andar foi desbloqueado.
          </p>
          <button
            className="btn-cyber-gold w-full justify-center"
            onClick={() => setPhase({ type: 'select' })}
          >
            Continuar Exploração
          </button>
        </div>
      </div>
    );
  }

  return null;
}
