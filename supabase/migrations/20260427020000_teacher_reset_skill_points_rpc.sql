-- ─────────────────────────────────────────────────────────────────────────────
-- RPC para professor resetar pontos de habilidade (pts_* → free_points)
-- Roda como SECURITY DEFINER para acessar characters sem precisar de GRANT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION teacher_reset_skill_points(
  p_student_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_char   RECORD;
  v_total  INTEGER;
BEGIN
  SELECT id, free_points,
    pts_fire, pts_water, pts_electric, pts_grass, pts_ice, pts_ground,
    pts_fighting, pts_steel, pts_poison, pts_dark, pts_ghost, pts_flying
  INTO v_char
  FROM characters
  WHERE user_id = p_student_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
  END IF;

  v_total :=
    COALESCE(v_char.pts_fire,     0) + COALESCE(v_char.pts_water,    0) +
    COALESCE(v_char.pts_electric, 0) + COALESCE(v_char.pts_grass,    0) +
    COALESCE(v_char.pts_ice,      0) + COALESCE(v_char.pts_ground,   0) +
    COALESCE(v_char.pts_fighting, 0) + COALESCE(v_char.pts_steel,    0) +
    COALESCE(v_char.pts_poison,   0) + COALESCE(v_char.pts_dark,     0) +
    COALESCE(v_char.pts_ghost,    0) + COALESCE(v_char.pts_flying,   0);

  UPDATE characters
  SET
    free_points  = COALESCE(free_points, 0) + v_total,
    pts_fire     = 0, pts_water    = 0, pts_electric = 0, pts_grass   = 0,
    pts_ice      = 0, pts_ground   = 0, pts_fighting = 0, pts_steel   = 0,
    pts_poison   = 0, pts_dark     = 0, pts_ghost    = 0, pts_flying  = 0,
    updated_at   = NOW()
  WHERE id = v_char.id;

  RETURN jsonb_build_object('success', true, 'points_returned', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION teacher_reset_skill_points TO authenticated;
