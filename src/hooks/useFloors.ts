import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseStudent as studentSupabase } from '@/integrations/supabase/studentClient';
import { toast } from 'sonner';
import type { ElementType } from '@/types/character';
import type { GeneratedFloor, GeneratedEnemy } from '@/lib/ai/claudeService';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Floor {
  id:           string;
  floorNumber:  number;
  name:         string;
  theme:        string;
  levelMin:     number;
  levelMax:     number;
  lore:         string | null;
  createdAt:    string;
}

export interface FloorEnemy {
  id:                   string;
  floorId:              string;
  name:                 string;
  level:                number;
  isBoss:               boolean;
  lore:                 string | null;
  hpMax:                number;
  defFisica:            number;
  defMagica:            number;
  velocidade:           number;
  elementType:          ElementType;
  ability1:             string | null;
  ability2:             string | null;
  ability3:             string | null;
  ability4:             string | null;
  specialAbilityName?:  string | null;
  specialAbilityEffect?: string | null;
  specialTrigger?:      string | null;
  // Map position & icon (added by floor_map_positions migration)
  positionX:  number;
  positionY:  number;
  iconType:   string;
}

export interface FloorProgress {
  id:               string;
  characterId:      string;
  floorId:          string;
  enemiesDefeated:  number;
  bossDefeated:     boolean;
  completedAt:      string | null;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToFloor(r: any): Floor {
  return {
    id:          r.id,
    floorNumber: r.floor_number,
    name:        r.name,
    theme:       r.theme,
    levelMin:    r.level_min,
    levelMax:    r.level_max,
    lore:        r.lore ?? null,
    createdAt:   r.created_at,
  };
}

function rowToEnemy(r: any): FloorEnemy {
  return {
    id:                   r.id,
    floorId:              r.floor_id,
    name:                 r.name,
    level:                r.level,
    isBoss:               r.is_boss ?? false,
    lore:                 r.lore ?? null,
    hpMax:                r.hp_max,
    defFisica:            r.def_fisica,
    defMagica:            r.def_magica,
    velocidade:           r.velocidade,
    elementType:          r.element_type as ElementType,
    ability1:             r.ability_1 ?? null,
    ability2:             r.ability_2 ?? null,
    ability3:             r.ability_3 ?? null,
    ability4:             r.ability_4 ?? null,
    specialAbilityName:   r.special_ability_name  ?? null,
    specialAbilityEffect: r.special_ability_effect ?? null,
    specialTrigger:       r.special_trigger        ?? null,
    positionX:            r.position_x ?? 50,
    positionY:            r.position_y ?? 50,
    iconType:             r.icon_type  ?? 'skull',
  };
}

function rowToProgress(r: any): FloorProgress {
  return {
    id:              r.id,
    characterId:     r.character_id,
    floorId:         r.floor_id,
    enemiesDefeated: r.enemies_defeated ?? 0,
    bossDefeated:    r.boss_defeated    ?? false,
    completedAt:     r.completed_at     ?? null,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** All floors ordered by floor_number */
export function useFloors() {
  return useQuery({
    queryKey: ['floors'],
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .order('floor_number', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToFloor);
    },
  });
}

/** Enemies for a specific floor */
export function useFloorEnemies(floorId: string | null) {
  return useQuery({
    queryKey: ['floor_enemies', floorId],
    enabled:  !!floorId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enemies')
        .select('*')
        .eq('floor_id', floorId!)
        .order('is_boss', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToEnemy);
    },
  });
}

/** Progress records for a character (student side uses student client) */
export function useFloorProgress(characterId: string | null) {
  return useQuery({
    queryKey: ['floor_progress', characterId],
    enabled:  !!characterId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data, error } = await studentSupabase
        .from('character_progress')
        .select('*')
        .eq('character_id', characterId!);
      if (error) throw error;
      return (data ?? []).map(rowToProgress);
    },
  });
}

// ─── Publish floor (teacher) ──────────────────────────────────────────────────

interface PublishFloorInput {
  theme:       string;
  levelMin:    number;
  levelMax:    number;
  elements:    ElementType[];
  generated:   GeneratedFloor;
}

export function usePublishFloor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ theme, levelMin, levelMax, elements, generated }: PublishFloorInput) => {
      // 1. Get next floor number
      const { data: lastFloor } = await supabase
        .from('floors')
        .select('floor_number')
        .order('floor_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextNumber = (lastFloor?.floor_number ?? 0) + 1;

      // 2. Insert floor
      const { data: floor, error: floorErr } = await supabase
        .from('floors')
        .insert({
          floor_number: nextNumber,
          name:         theme,
          theme,
          level_min:    levelMin,
          level_max:    levelMax,
          lore:         generated.floorLore,
        })
        .select()
        .single();

      if (floorErr) throw floorErr;

      const primaryElement = elements[0];

      // Helper: build enemy insert row
      const buildRow = (e: GeneratedEnemy, isBoss: boolean, extra?: Record<string, unknown>) => ({
        floor_id:    floor.id,
        name:        e.name,
        level:       e.level,
        is_boss:     isBoss,
        lore:        e.lore,
        hp_max:      e.hpMax,
        def_fisica:  e.defFisica,
        def_magica:  e.defMagica,
        velocidade:  e.velocidade,
        element_type: primaryElement,
        ability_1:   e.abilities[0] ?? null,
        ability_2:   e.abilities[1] ?? null,
        ability_3:   e.abilities[2] ?? null,
        ability_4:   e.abilities[3] ?? null,
        ...extra,
      });

      // 3. Insert normal enemies
      const enemyRows = generated.enemies.map(e => buildRow(e, false));
      const { error: enemiesErr } = await supabase.from('enemies').insert(enemyRows);
      if (enemiesErr) throw enemiesErr;

      // 4. Insert boss
      const { error: bossErr } = await supabase.from('enemies').insert(
        buildRow(generated.boss, true, {
          special_ability_name:   generated.boss.specialAbilityName,
          special_ability_effect: generated.boss.specialAbilityEffect,
          special_trigger:        generated.boss.specialTrigger,
        }),
      );
      if (bossErr) throw bossErr;

      return { floorNumber: nextNumber, floorName: theme };
    },
    onSuccess: ({ floorNumber, floorName }) => {
      toast.success(`Andar ${floorNumber} — "${floorName}" publicado!`);
      qc.invalidateQueries({ queryKey: ['floors'] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao publicar: ${err.message}`);
    },
  });
}

// ─── Per-enemy defeat tracking ───────────────────────────────────────────────

/** Returns the Set of enemy UUIDs already defeated by this character on this floor. */
export function useEnemyDefeats(characterId: string | null, floorId: string | null) {
  return useQuery({
    queryKey: ['enemy_defeats', characterId, floorId],
    enabled:  !!characterId && !!floorId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      // Join through enemies to filter by floor
      const { data, error } = await studentSupabase
        .from('floor_enemy_defeats')
        .select('enemy_id, enemies!inner(floor_id)')
        .eq('character_id', characterId!)
        .eq('enemies.floor_id', Number(floorId));
      if (error) throw error;
      return new Set<string>((data ?? []).map((r: any) => r.enemy_id));
    },
  });
}

/** Records a single enemy defeat in floor_enemy_defeats. */
export function useRecordEnemyDefeatById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ characterId, enemyId }: { characterId: string; enemyId: string }) => {
      const { error } = await studentSupabase
        .from('floor_enemy_defeats')
        .upsert({ character_id: characterId, enemy_id: enemyId }, { onConflict: 'character_id,enemy_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enemy_defeats'] });
    },
  });
}

// ─── Record enemy defeat (student) ───────────────────────────────────────────

interface RecordDefeatInput {
  characterId: string;
  floorId:     string;
  isBoss:      boolean;
}

export function useRecordEnemyDefeat() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, floorId, isBoss }: RecordDefeatInput) => {
      // Upsert progress row
      const { data: existing } = await studentSupabase
        .from('character_progress')
        .select('*')
        .eq('character_id', characterId)
        .eq('floor_id', floorId)
        .maybeSingle();

      if (!existing) {
        await studentSupabase.from('character_progress').insert({
          character_id:      characterId,
          floor_id:          floorId,
          enemies_defeated:  isBoss ? 0 : 1,
          boss_defeated:     isBoss,
          completed_at:      isBoss ? new Date().toISOString() : null,
        });
      } else {
        await studentSupabase
          .from('character_progress')
          .update({
            enemies_defeated: isBoss
              ? existing.enemies_defeated
              : (existing.enemies_defeated ?? 0) + 1,
            boss_defeated:  isBoss || existing.boss_defeated,
            completed_at:   isBoss && !existing.boss_defeated
              ? new Date().toISOString()
              : existing.completed_at,
          })
          .eq('id', existing.id);
      }
    },
    onSuccess: (_data, { characterId }) => {
      qc.invalidateQueries({ queryKey: ['floor_progress', characterId] });
    },
  });
}
