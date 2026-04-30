-- ============================================================
-- REPAIR DUNGEON PROGRESS: Backfill and Floor 6 Fix
-- ============================================================

DO $$
DECLARE
    floor_rec RECORD;
    character_rec RECORD;
    enemy_id UUID;
    i INTEGER;
BEGIN
    -- ── Phase 1: Backfill floor_enemy_defeats for legacy users ──
    -- This ensures that users who have "enemies_defeated > 0" but empty maps
    -- get their maps "cleaned" (enemies marked as defeated).
    
    FOR character_rec IN 
        SELECT cp.character_id, cp.floor_id, cp.enemies_defeated, cp.boss_defeated
        FROM public.character_progress cp
    LOOP
        -- 1. Backfill normal enemies
        IF character_rec.enemies_defeated > 0 THEN
            -- Find first N normal enemies of this floor
            i := 0;
            FOR enemy_id IN 
                SELECT id FROM public.enemies 
                WHERE floor_id = character_rec.floor_id 
                AND is_boss = false 
                ORDER BY name ASC, id ASC
            LOOP
                EXIT WHEN i >= character_rec.enemies_defeated;
                
                INSERT INTO public.floor_enemy_defeats (character_id, enemy_id)
                VALUES (character_rec.character_id, enemy_id)
                ON CONFLICT DO NOTHING;
                
                i := i + 1;
            END LOOP;
        END IF;

        -- 2. Backfill boss
        IF character_rec.boss_defeated THEN
            FOR enemy_id IN 
                SELECT id FROM public.enemies 
                WHERE floor_id = character_rec.floor_id 
                AND is_boss = true
            LOOP
                INSERT INTO public.floor_enemy_defeats (character_id, enemy_id)
                VALUES (character_rec.character_id, enemy_id)
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;

    -- ── Phase 2: Robust Floor 6 Position Fix ──
    -- We'll use a direct update for Floor 6 to ensure they are spread.
    
    FOR floor_rec IN SELECT id FROM public.floors WHERE floor_number = 6 LOOP
        i := 0;
        FOR enemy_id IN 
            SELECT id FROM public.enemies 
            WHERE floor_id = floor_rec.id 
            ORDER BY is_boss ASC, name ASC, id ASC 
        LOOP
            UPDATE public.enemies 
            SET position_x = CASE 
                WHEN i = 0 THEN 25 
                WHEN i = 1 THEN 55 
                WHEN i = 2 THEN 35 
                WHEN i = 3 THEN 65 
                WHEN i = 4 THEN 45 
                WHEN is_boss THEN 80
                ELSE 50 + (i * 5)
            END,
            position_y = CASE 
                WHEN i = 0 THEN 75 
                WHEN i = 1 THEN 65 
                WHEN i = 2 THEN 40 
                WHEN i = 3 THEN 35 
                WHEN i = 4 THEN 20 
                WHEN is_boss THEN 50
                ELSE 50 - (i * 3)
            END,
            icon_type = CASE WHEN is_boss THEN 'boss' ELSE 'skull' END
            WHERE id = enemy_id;
            
            i := i + 1;
        END LOOP;
    END LOOP;
END $$;
