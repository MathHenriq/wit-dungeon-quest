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

type BroadcastAction =
  | { type: 'ATTACK'; abilityId: string }
  | { type: 'SURRENDER' };

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
  // Realtime handshake: the opponent may not have subscribed yet when the
  // first-mover picks a card. Broadcasts to a channel with no listener are
  // dropped, so the slower side would wait on "AGUARDANDO..." forever (cards
  // never appear). We exchange a hello on subscribe and buffer any action
  // until we know the opponent is listening.
  const oppReadyRef     = useRef(false);
  const pendingActionRef = useRef<BroadcastAction | null>(null);

  function rawSend(payload: BroadcastAction) {
    channelRef.current?.send({ type: 'broadcast', event: 'pvp_action', payload });
  }

  function sendAction(payload: BroadcastAction) {
    if (oppReadyRef.current) rawSend(payload);
    else pendingActionRef.current = payload; // flush once the opponent says hello
  }

  function markOppReady() {
    if (oppReadyRef.current) return;
    oppReadyRef.current = true;
    if (pendingActionRef.current) {
      rawSend(pendingActionRef.current);
      pendingActionRef.current = null;
    }
  }

  // Start battle once on mount
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const oppAsEnemy = charToEnemy(oppChar, oppAbilities);
    // Onda 11.3 — passa o studentId do oponente pra carregar classe/passivas/elemento dele.
    // O hook sobrescreve o elementType 'Fire' hardcoded em charToEnemy() pelo elemento real.
    // iAmChallenger desempata o primeiro turno deterministicamente nos dois clientes.
    const initial = engine.startBattle(myChar, oppAsEnemy, myAbilities, oppChar.studentId ?? null, iAmChallenger);

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
          markOppReady(); // any inbound action also proves the opponent is live
          engine.applyEnemyAction(payload.abilityId);
        } else if (payload.type === 'SURRENDER') {
          onFinish(true); // opponent surrendered → I win
        }
      })
      // Presence handshake so neither side's first action is dropped.
      .on('broadcast', { event: 'pvp_hello' }, () => {
        markOppReady();
        channelRef.current?.send({ type: 'broadcast', event: 'pvp_hello_ack', payload: {} });
      })
      .on('broadcast', { event: 'pvp_hello_ack' }, () => markOppReady())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current?.send({ type: 'broadcast', event: 'pvp_hello', payload: {} });
        }
      });

    channelRef.current = channel;
    return () => {
      oppReadyRef.current = false;
      pendingActionRef.current = null;
      supabaseStudent.removeChannel(channel);
    };
  }, [matchId]); // eslint-disable-line

  function handlePlayerAttack(abilityId: string) {
    sendAction({ type: 'ATTACK', abilityId });
  }

  function handleSurrender() {
    sendAction({ type: 'SURRENDER' });
    onFinish(false); // I surrendered → I lose
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
        onSurrender={handleSurrender}
        pvpMode
        onVictory={() => onFinish(true)}
        onDefeat={() => onFinish(false)}
        onFled={() => onFinish(false)}
      />
    </div>
  );
}
