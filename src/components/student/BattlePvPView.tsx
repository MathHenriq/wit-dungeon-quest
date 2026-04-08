import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpponentSelector } from '@/components/pvp/OpponentSelector';
import { Leaderboard } from '@/components/pvp/Leaderboard';
import { BattleScreen } from '@/components/battle/BattleScreen';
import type { BattleCharacter, Ability, ElementType } from '@/types/character';
import type { PvPOpponent } from '@/lib/pvp/matchmaking';
import { Loader2 } from 'lucide-react';

interface BattlePvPViewProps {
  character: BattleCharacter;
}

type View = 'selector' | 'loading' | 'battle' | 'leaderboard';

interface BattleSetup {
  opponent: BattleCharacter;
  opponentAbilities: Ability[];
}

// Fetch full character + abilities for an opponent by character id
async function fetchOpponentBattleData(opponentId: string): Promise<BattleSetup | null> {
  const [charRes, equippedRes, allAbilRes] = await Promise.all([
    supabase
      .from('characters')
      .select('*')
      .eq('id', opponentId)
      .single(),
    supabase
      .from('character_abilities')
      .select('ability_id, slot')
      .eq('character_id', opponentId)
      .order('slot', { ascending: true }),
    supabase
      .from('abilities')
      .select('*, elements:element_id(name, color_hex)')
      .order('element_id')
      .order('tier'),
  ]);

  if (charRes.error || !charRes.data) return null;

  const row = charRes.data as any;
  const opponent: BattleCharacter = {
    id:           row.id,
    userId:       row.user_id,
    name:         row.name         ?? 'Oponente',
    class:        row.class        ?? 'Guerreiro',
    level:        row.level        ?? 1,
    xp:           row.xp           ?? 0,
    hpCurrent:    row.hp_max       ?? 100, // start at full HP for PvP
    hpMax:        row.hp_max       ?? 100,
    energyMax:    row.energy_max   ?? 100,
    forca:        row.forca        ?? 10,
    inteligencia: row.inteligencia ?? 10,
    destreza:     row.destreza     ?? 10,
    carisma:      row.carisma      ?? 10,
    agilidade:    row.agilidade    ?? 10,
    resistencia:  row.resistencia  ?? 10,
    ptsFire:      row.pts_fire     ?? 0,
    ptsWater:     row.pts_water    ?? 0,
    ptsElectric:  row.pts_electric ?? 0,
    ptsGrass:     row.pts_grass    ?? 0,
    ptsIce:       row.pts_ice      ?? 0,
    ptsGround:    row.pts_ground   ?? 0,
    ptsFighting:  row.pts_fighting ?? 0,
    ptsSteel:     row.pts_steel    ?? 0,
    ptsPoison:    row.pts_poison   ?? 0,
    ptsDark:      row.pts_dark     ?? 0,
    ptsGhost:     row.pts_ghost    ?? 0,
    ptsFlying:    row.pts_flying   ?? 0,
    freePoints:   row.free_points  ?? 0,
    spriteNormal:      row.sprite_normal       ?? null,
    spritePixelFront:  row.sprite_pixel_front  ?? null,
    spritePixelBack:   row.sprite_pixel_back   ?? null,
    spritePixelAttack: row.sprite_pixel_attack ?? null,
  };

  const equippedIds = new Set((equippedRes.data ?? []).map((e: any) => e.ability_id));
  const allAbilities: Ability[] = (allAbilRes.data ?? []).map((r: any) => ({
    id:           r.id,
    name:         r.name,
    elementId:    r.element_id,
    elementName:  r.elements?.name as ElementType,
    tier:         r.tier as 1 | 2 | 3 | 4,
    damageType:   r.damage_type,
    baseDamage:   r.base_damage   ?? 0,
    energyCost:   r.energy_cost   ?? 0,
    accuracy:     r.accuracy      ?? 100,
    requirement:  r.requirement   ?? 0,
    effectType:   r.effect_type,
    effectChance: r.effect_chance,
    effectValue:  r.effect_value,
    description:  r.description   ?? '',
    elementColor: r.elements?.color_hex,
  }));

  const opponentAbilities = allAbilities.filter(a => equippedIds.has(a.id));

  return { opponent, opponentAbilities };
}

export function BattlePvPView({ character }: BattlePvPViewProps) {
  const [view, setView] = useState<View>('selector');
  const [battleSetup, setBattleSetup] = useState<BattleSetup | null>(null);
  const [pendingOpponent, setPendingOpponent] = useState<PvPOpponent | null>(null);

  // Fetch player's equipped abilities
  const { data: equippedSlots = [] } = useQuery({
    queryKey: ['battle', 'equipped', character.id],
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async () => {
      const { data } = await supabase
        .from('character_abilities')
        .select('ability_id, slot')
        .eq('character_id', character.id)
        .order('slot', { ascending: true });
      return (data ?? []) as { ability_id: string; slot: number }[];
    },
  });

  const { data: allAbilities = [] } = useQuery({
    queryKey: ['battle', 'abilities'],
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: async (): Promise<Ability[]> => {
      const { data } = await supabase
        .from('abilities')
        .select('*, elements:element_id(name, color_hex)')
        .order('element_id')
        .order('tier');
      return (data ?? []).map((r: any) => ({
        id:           r.id,
        name:         r.name,
        elementId:    r.element_id,
        elementName:  r.elements?.name as ElementType,
        tier:         r.tier as 1 | 2 | 3 | 4,
        damageType:   r.damage_type,
        baseDamage:   r.base_damage   ?? 0,
        energyCost:   r.energy_cost   ?? 0,
        accuracy:     r.accuracy      ?? 100,
        requirement:  r.requirement   ?? 0,
        effectType:   r.effect_type,
        effectChance: r.effect_chance,
        effectValue:  r.effect_value,
        description:  r.description   ?? '',
        elementColor: r.elements?.color_hex,
      }));
    },
  });

  const equippedAbilityIds = new Set(equippedSlots.map(s => s.ability_id));
  const playerAbilities = allAbilities.filter(a => equippedAbilityIds.has(a.id));

  async function handleSelectOpponent(opponent: PvPOpponent) {
    setPendingOpponent(opponent);
    setView('loading');

    const setup = await fetchOpponentBattleData(opponent.id);
    if (!setup) {
      setView('selector');
      return;
    }
    setBattleSetup(setup);
    setView('battle');
  }

  // ── Leaderboard ──
  if (view === 'leaderboard') {
    return (
      <div>
        <button
          onClick={() => setView('selector')}
          className="mb-4 px-4 py-2 rounded"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          ← Voltar
        </button>
        <Leaderboard />
      </div>
    );
  }

  // ── Loading opponent data ──
  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin" style={{ color: '#a78bfa' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
          Preparando batalha contra {pendingOpponent?.name}…
        </p>
      </div>
    );
  }

  // ── Battle ──
  if (view === 'battle' && battleSetup) {
    const enemy = {
      id:          battleSetup.opponent.id,
      name:        battleSetup.opponent.name,
      level:       battleSetup.opponent.level,
      hpCurrent:   battleSetup.opponent.hpMax,
      hpMax:       battleSetup.opponent.hpMax,
      defFisica:   Math.floor(battleSetup.opponent.resistencia / 2),
      defMagica:   Math.floor(battleSetup.opponent.inteligencia / 2),
      velocidade:  battleSetup.opponent.agilidade,
      elementType: 'Fire' as const,
      abilities:   battleSetup.opponentAbilities,
      spriteUrl:   battleSetup.opponent.spritePixelFront ?? battleSetup.opponent.spriteNormal ?? undefined,
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#020611' }}>
        <BattleScreen
          player={character}
          enemy={enemy}
          equippedAbilities={playerAbilities}
          onVictory={() => setView('selector')}
          onDefeat={() => setView('selector')}
          onFled={() => setView('selector')}
        />
      </div>
    );
  }

  // ── Selector ──
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold" style={{ color: '#a78bfa' }}>⚔️ Arena PvP</h2>
        <button
          onClick={() => setView('leaderboard')}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}
        >
          🏆 Ver Ranking
        </button>
      </div>

      <OpponentSelector
        character={character}
        onSelectOpponent={handleSelectOpponent}
      />
    </div>
  );
}
