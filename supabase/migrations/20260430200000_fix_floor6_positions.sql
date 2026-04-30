-- ============================================================
-- FIX FLOOR 6: Spread bunched-up enemies
-- Enemies were likely published without map coordinates (default 50,50)
-- ============================================================

DO $$
DECLARE
    f_id INTEGER;
    e_record RECORD;
    i INTEGER := 0;
    -- Predefined spread coordinates (X, Y)
    -- Aiming for a natural flow from bottom-left to top-right
    coords_x FLOAT[] := ARRAY[25, 55, 35, 65, 45, 80];
    coords_y FLOAT[] := ARRAY[75, 65, 40, 35, 20, 50];
BEGIN
    -- 1. Find the floor ID for floor_number = 6
    SELECT id INTO f_id FROM public.floors WHERE floor_number = 6;

    IF f_id IS NOT NULL THEN
        -- 2. Update enemies in a deterministic order (bosses last)
        FOR e_record IN 
            SELECT id FROM public.enemies 
            WHERE floor_id = f_id 
            ORDER BY is_boss ASC, name ASC 
        LOOP
            UPDATE public.enemies 
            SET position_x = coords_x[(i % 6) + 1],
                position_y = coords_y[(i % 6) + 1]
            WHERE id = e_record.id;
            
            i := i + 1;
        END LOOP;
    END IF;
END $$;
