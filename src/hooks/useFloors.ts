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
  /** Patch 2.0: bosses pós-andar 25 podem ter um segundo elemento. */
  elementTypeSecondary: ElementType | null;
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
    id:          String(r.id),
    floorNumber: Number(r.floor_number ?? r.floorNumber ?? 1),
    name:        r.name,
    theme:       r.theme,
    levelMin:    r.level_min ?? r.levelMin ?? 1,
    levelMax:    r.level_max ?? r.levelMax ?? 1,
    lore:        r.lore ?? null,
    createdAt:   r.created_at ?? r.createdAt,
  };
}

function rowToEnemy(r: any, index: number = 0): FloorEnemy {
  // Fallback coordinates if the database has them bunched at 50,50
  const isDefault = (r.position_x === 50 || r.position_x === null) && 
                    (r.position_y === 50 || r.position_y === null);
  
  const fallbackCoords = [
    { x: 20, y: 80 }, { x: 50, y: 70 }, { x: 30, y: 40 },
    { x: 60, y: 30 }, { x: 40, y: 20 }, { x: 70, y: 15 },
    { x: 25, y: 60 }, { x: 55, y: 50 }, { x: 35, y: 30 },
    { x: 65, y: 20 }
  ];

  const posX = isDefault ? (r.is_boss ? 85 : (fallbackCoords[index % 10]?.x ?? 50)) : (r.position_x ?? 50);
  const posY = isDefault ? (r.is_boss ? 50 : (fallbackCoords[index % 10]?.y ?? 50)) : (r.position_y ?? 50);

  return {
    id:                   String(r.id),
    floorId:              String(r.floor_id),
    name:                 r.name,
    level:                r.level,
    isBoss:               r.is_boss ?? false,
    lore:                 r.lore ?? null,
    hpMax:                r.hp_max,
    defFisica:            r.def_fisica,
    defMagica:            r.def_magica,
    velocidade:           r.velocidade,
    elementType:          r.element_type as ElementType,
    elementTypeSecondary: (r.element_type_secondary ?? null) as ElementType | null,
    ability1:             r.ability_1 ?? null,
    ability2:             r.ability_2 ?? null,
    ability3:             r.ability_3 ?? null,
    ability4:             r.ability_4 ?? null,
    specialAbilityName:   r.special_ability_name  ?? null,
    specialAbilityEffect: r.special_ability_effect ?? null,
    specialTrigger:       r.special_trigger        ?? null,
    positionX:            posX,
    positionY:            posY,
    iconType:             r.icon_type ?? (r.is_boss ? 'boss' : 'skull'),
  };
}

function rowToProgress(r: any): FloorProgress {
  // character_progress uses a composite PK (character_id, floor_id) — there is
  // no surrogate `id` column. We synthesize one for FloorProgress consumers.
  return {
    id:              `${r.character_id}-${r.floor_id}`,
    characterId:     String(r.character_id),
    floorId:         String(r.floor_id),
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
      const { data, error } = await studentSupabase
        .from('floors')
        .select('id, floor_number, name, theme, level_min, level_max, lore, created_at')
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
      const { data, error } = await studentSupabase
        .from('enemies')
        .select('id, floor_id, name, level, is_boss, lore, hp_max, def_fisica, def_magica, velocidade, element_type, element_type_secondary, ability_1, ability_2, ability_3, ability_4, special_ability_name, special_ability_effect, special_trigger, position_x, position_y, icon_type')
        .eq('floor_id', floorId!)
        .order('is_boss', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row, i) => rowToEnemy(row, i));
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
        .select('character_id, floor_id, enemies_defeated, boss_defeated, completed_at')
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

      // Coordinates to spread enemies on the map
      const normalCoords = [
        { x: 25, y: 75 },
        { x: 55, y: 65 },
        { x: 35, y: 40 },
        { x: 65, y: 35 },
        { x: 45, y: 20 },
      ];

      // Helper: build enemy insert row
      const buildRow = (e: GeneratedEnemy, isBoss: boolean, index: number, extra?: Record<string, unknown>) => ({
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
        position_x:  isBoss ? 80 : (normalCoords[index]?.x ?? 50),
        position_y:  isBoss ? 50 : (normalCoords[index]?.y ?? 50),
        icon_type:   isBoss ? 'boss' : 'skull',
        ...extra,
      });

      // 3. Insert normal enemies
      const enemyRows = generated.enemies.map((e, i) => buildRow(e, false, i));
      const { error: enemiesErr } = await supabase.from('enemies').insert(enemyRows);
      if (enemiesErr) throw enemiesErr;

      // 4. Insert boss
      const { error: bossErr } = await supabase.from('enemies').insert(
        buildRow(generated.boss, true, 0, {
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

/** Records a single enemy defeat and updates floor progress summary. */
export function useRecordEnemyDefeat() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, floorId, enemyId, isBoss }: RecordDefeatInput & { enemyId: string }) => {
      // SECURITY DEFINER RPC. The previous client-side direct-INSERT path
      // failed silently for some users because of an RLS quirk on
      // floor_enemy_defeats — the throw aborted the progress upsert and
      // boss_defeated never flipped, so the next floor stayed locked.
      const { data, error } = await studentSupabase.rpc('record_enemy_defeat' as never, {
        p_character_id: characterId,
        p_floor_id:     Number(floorId),
        p_enemy_id:     enemyId,
        p_is_boss:      isBoss,
      } as never);

      if (error) throw error;
      const res = data as { success?: boolean; error?: string } | null;
      if (!res?.success) throw new Error(res?.error ?? 'record_enemy_defeat_failed');

      return { characterId, floorId, enemyId };
    },
    onSuccess: (_data, { characterId, floorId }) => {
      // Invalidate all related queries to refresh the UI
      qc.invalidateQueries({ queryKey: ['enemy_defeats', characterId, floorId] });
      qc.invalidateQueries({ queryKey: ['floor_progress', characterId] });
    },
  });
}
