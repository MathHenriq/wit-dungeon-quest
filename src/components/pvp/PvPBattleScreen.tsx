import { useEffect, useRef } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { BattleScreen } from '@/components/battle/BattleScreen';
import { usePvPBattleEngine } from '@/hooks/usePvPBattleEngine';
import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import type { BattleEnemy } from '@/lib/battle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PvPBattleScreenProps {
  matchId:       string;
  myChar:        BattleCharacter;
  myAbilities:   Ability[];
  oppChar:       BattleCharacter;
  oppAbilities:  Ability[];
  /** true = I was the challenger (player order for turn-first determination) */
  iAmChallenger: boolean;
  onFinish:      (won: boolean) => void;
}

type BroadcastAction = { type: 'ATTACK'; abilityId: string };

// ─── Character → BattleEnemy conversion ──────────────────────────────────────

function charToEnemy(char: BattleCharacter, abilities: Ability[]): BattleEnemy {
  return {
    id:          char.id,
    name:        char.name,
    level:       char.level,
    hpCurrent:   char.hpMax,   // start at full HP
    hpMax:       char.hpMax,
    defFisica:   Math.floor(char.resistencia / 2),
    defMagica:   Math.floor(char.inteligencia / 2),
    velocidade:  char.agilidade,
    elementType: 'Fire' as ElementType,  // PvP ignores type effectiveness
    abilities,
    spriteUrl:   char.spritePixelFront ?? char.spriteNormal ?? undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PvPBattleScreen({
  matchId,
  myChar,
  myAbilities,
  oppChar,
  oppAbilities,
  iAmChallenger,
  onFinish,
}: PvPBattleScreenProps) {
  const engine  = usePvPBattleEngine();
  const started = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabaseStudent.channel> | null>(null);

  // Start battle once on mount
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const oppAsEnemy = charToEnemy(oppChar, oppAbilities);
    const initial = engine.startBattle(myChar, oppAsEnemy, myAbilities);

    // If engine determined opponent goes first (ENEMY_TURN) we just wait.
    // The opponent's engine will also start, see PLAYER_TURN, and broadcast their first attack.
    void initial;
  }, []); // eslint-disable-line

  // Subscribe to opponent's actions via Supabase Realtime broadcast
  useEffect(() => {
    const channel = supabaseStudent
      .channel(`pvp_battle_${matchId}`)
      .on('broadcast', { event: 'pvp_action' }, ({ payload }: { payload: BroadcastAction }) => {
        if (payload.type === 'ATTACK') {
          engine.applyEnemyAction(payload.abilityId);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabaseStudent.removeChannel(channel); };
  }, [matchId]); // eslint-disable-line

  // Called by BattleScreen when the local player picks an ability
  function handlePlayerAttack(abilityId: string) {
    channelRef.current?.send({
      type:    'broadcast',
      event:   'pvp_action',
      payload: { type: 'ATTACK', abilityId } satisfies BroadcastAction,
    });
  }

  if (!engine.ctx) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#020611',
        color: 'rgba(0,229,255,0.5)',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '0.9rem', letterSpacing: 2, fontWeight: 700,
      }}>
        INICIANDO BATALHA PvP...
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
      <BattleScreen
        player={myChar}
        enemy={charToEnemy(oppChar, oppAbilities)}
        equippedAbilities={myAbilities}
        engineOverride={engine}
        onPlayerAttack={handlePlayerAttack}
        pvpMode
        onVictory={() => onFinish(true)}
        onDefeat={() => onFinish(false)}
        onFled={() => onFinish(false)}
      />
    </div>
  );
}
