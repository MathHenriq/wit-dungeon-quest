import type { BattleCharacter, Ability } from '@/types/character';
import { BattleEngine, type BattleContext, type BattleEnemy } from '@/lib/battle/BattleEngine';
import { supabase } from '@/integrations/supabase/client';
import { calculateRatingChange } from './matchmaking';

export interface PvPBattleResult {
  winnerId: string;
  winnerName: string;
  player1HpRemaining: number;
  player2HpRemaining: number;
  totalTurns: number;
  durationSeconds: number;
  ratingChanges: {
    player1: number;
    player2: number;
  };
}

// Converte BattleCharacter para BattleEnemy (usado como "oponente" no engine)
function characterToEnemy(char: BattleCharacter, abilities: Ability[]): BattleEnemy {
  return {
    id:          char.id,
    name:        char.name,
    level:       char.level,
    hpCurrent:   char.hpCurrent,
    hpMax:       char.hpMax,
    defFisica:   Math.floor(char.resistencia / 2),
    defMagica:   Math.floor(char.inteligencia / 2),
    velocidade:  char.agilidade,
    elementType: 'Fire',   // PvP ignora type effectiveness — valor neutro
    abilities,
    spriteUrl:   char.spriteNormal ?? undefined
  };
}

export class PvPBattle {
  private engine: BattleEngine;
  private player1: BattleCharacter;
  private player2: BattleCharacter;
  private startTime: number;

  constructor(
    player1: BattleCharacter,
    player1Abilities: Ability[],
    player2: BattleCharacter,
    player2Abilities: Ability[]
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.startTime = Date.now();

    // Player 1 atua como "player", Player 2 como "enemy"
    this.engine = new BattleEngine(
      player1,
      characterToEnemy(player2, player2Abilities),
      player1Abilities
    );
  }

  start(): BattleContext {
    return this.engine.start();
  }

  playerAttack(abilityId: string): BattleContext {
    return this.engine.playerAttack(abilityId);
  }

  enemyTurn(): BattleContext {
    return this.engine.enemyTurn();
  }

  useItem(effect: 'heal' | 'energy' | 'cure' | 'revive', value: number): BattleContext {
    return this.engine.useItem(effect, value);
  }

  flee(): BattleContext {
    return this.engine.flee();
  }

  getContext(): BattleContext {
    return this.engine.getContext();
  }

  async finalizeBattle(): Promise<PvPBattleResult> {
    const ctx = this.engine.getContext();
    const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const isPlayer1Winner = ctx.phase === 'VICTORY';
    const winnerId   = isPlayer1Winner ? this.player1.id : this.player2.id;
    const winnerName = isPlayer1Winner ? this.player1.name : this.player2.name;

    // Buscar ratings atuais
    const { data: statsRows } = await supabase
      .from('pvp_stats')
      .select('character_id, rating')
      .in('character_id', [this.player1.id, this.player2.id]);

    const p1Rating = statsRows?.find(s => s.character_id === this.player1.id)?.rating ?? 1000;
    const p2Rating = statsRows?.find(s => s.character_id === this.player2.id)?.rating ?? 1000;

    const { winnerChange, loserChange } = calculateRatingChange(
      isPlayer1Winner ? p1Rating : p2Rating,
      isPlayer1Winner ? p2Rating : p1Rating
    );

    const ratingChanges = {
      player1: isPlayer1Winner ? winnerChange : loserChange,
      player2: isPlayer1Winner ? loserChange : winnerChange
    };

    // Salvar partida
    const { data: match } = await supabase
      .from('pvp_matches')
      .insert({
        player1_id:          this.player1.id,
        player2_id:          this.player2.id,
        winner_id:           winnerId,
        player1_hp_remaining: ctx.player.hpCurrent,
        player2_hp_remaining: ctx.enemy.hpCurrent,
        turns_total:         ctx.turn,
        duration_seconds:    durationSeconds
      })
      .select('id')
      .single();

    await Promise.all([
      this.updateStats(this.player1.id, isPlayer1Winner,  ratingChanges.player1, match?.id),
      this.updateStats(this.player2.id, !isPlayer1Winner, ratingChanges.player2, match?.id)
    ]);

    return {
      winnerId,
      winnerName,
      player1HpRemaining: ctx.player.hpCurrent,
      player2HpRemaining: ctx.enemy.hpCurrent,
      totalTurns:         ctx.turn,
      durationSeconds,
      ratingChanges
    };
  }

  private async updateStats(
    characterId: string,
    isWinner: boolean,
    ratingChange: number,
    matchId?: string
  ): Promise<void> {
    const { data: current } = await supabase
      .from('pvp_stats')
      .select('*')
      .eq('character_id', characterId)
      .single();

    const base = current ?? {
      wins: 0, losses: 0, rating: 1000,
      highest_rating: 1000, win_streak: 0, best_win_streak: 0
    };

    const newRating    = (base.rating ?? 1000) + ratingChange;
    const newStreak    = isWinner ? (base.win_streak ?? 0) + 1 : 0;
    const bestStreak   = Math.max(base.best_win_streak ?? 0, newStreak);
    const highestRating = Math.max(base.highest_rating ?? 1000, newRating);

    await supabase.from('pvp_stats').upsert({
      character_id:    characterId,
      wins:            (base.wins ?? 0) + (isWinner ? 1 : 0),
      losses:          (base.losses ?? 0) + (isWinner ? 0 : 1),
      rating:          newRating,
      highest_rating:  highestRating,
      win_streak:      newStreak,
      best_win_streak: bestStreak,
      updated_at:      new Date().toISOString()
    });

    if (matchId) {
      await supabase.from('pvp_rating_history').insert({
        character_id: characterId,
        old_rating:   base.rating ?? 1000,
        new_rating:   newRating,
        rating_change: ratingChange,
        match_id:     matchId
      });
    }
  }
}
