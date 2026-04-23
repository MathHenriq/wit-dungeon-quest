-- RPC to fetch a student's full battle data for PvP.
-- Uses SECURITY DEFINER so an opponent can read another player's character
-- without opening character reads to all authenticated users.

CREATE OR REPLACE FUNCTION public.get_pvp_opponent_data(p_student_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  UUID;
  v_char_id  UUID;
  v_char     json;
  v_abilities json;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.students
  WHERE id = p_student_id;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_char_id
  FROM public.characters
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_char_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(c.*) INTO v_char
  FROM public.characters c
  WHERE c.id = v_char_id;

  SELECT json_agg(
    json_build_object(
      'id',           a.id,
      'name',         a.name,
      'elementId',    a.element_id,
      'elementName',  e.name,
      'tier',         a.tier,
      'damageType',   a.damage_type,
      'baseDamage',   a.base_damage,
      'energyCost',   a.energy_cost,
      'accuracy',     a.accuracy,
      'requirement',  a.requirement,
      'effectType',   a.effect_type,
      'effectChance', a.effect_chance,
      'effectValue',  a.effect_value,
      'description',  a.description,
      'elementColor', e.color_hex
    ) ORDER BY ca.slot
  ) INTO v_abilities
  FROM public.character_abilities ca
  JOIN public.abilities a ON a.id = ca.ability_id
  JOIN public.elements  e ON e.id = a.element_id
  WHERE ca.character_id = v_char_id;

  RETURN json_build_object(
    'character',  v_char,
    'abilities',  COALESCE(v_abilities, '[]'::json)
  );
END;
$$;
