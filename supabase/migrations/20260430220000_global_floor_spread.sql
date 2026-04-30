-- ============================================================
-- GLOBAL FLOOR SPREAD: Fix clustering on all floors
-- ============================================================

DO $$
DECLARE
    f_id INTEGER;
    e_id UUID;
    i INTEGER;
    -- Spread coordinates (X, Y)
    coords_x FLOAT[] := ARRAY[20, 50, 30, 60, 40, 70, 25, 55, 35, 65];
    coords_y FLOAT[] := ARRAY[80, 70, 40, 30, 20, 15, 60, 50, 30, 20];
BEGIN
    -- Loop through all floors that have enemies clustered at (50, 50)
    FOR f_id IN 
        SELECT floor_id 
        FROM public.enemies 
        WHERE position_x = 50 AND position_y = 50
        GROUP BY floor_id
        HAVING COUNT(*) > 1
    LOOP
        i := 0;
        -- Spread normal enemies first
        FOR e_id IN 
            SELECT id FROM public.enemies 
            WHERE floor_id = f_id AND is_boss = false
            ORDER BY name ASC, id ASC
        LOOP
            UPDATE public.enemies 
            SET position_x = coords_x[(i % 10) + 1],
                position_y = coords_y[(i % 10) + 1]
            WHERE id = e_id;
            i := i + 1;
        END LOOP;

        -- Fix boss position (always at the end/right)
        UPDATE public.enemies 
        SET position_x = 85,
            position_y = 50,
            icon_type = 'boss'
        WHERE floor_id = f_id AND is_boss = true;
    END LOOP;
END $$;
