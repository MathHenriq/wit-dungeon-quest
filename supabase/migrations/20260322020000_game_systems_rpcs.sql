-- ============================================================
-- GAME SYSTEMS RPCS — WIT Dungeon Quest
-- Migration: 20260322020000_game_systems_rpcs.sql
-- ============================================================

-- RPC: dar XP ao pet
CREATE OR REPLACE FUNCTION public.give_pet_xp(p_student_id UUID, p_xp INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pet student_pets%ROWTYPE;
  v_pet_type pet_types%ROWTYPE;
  v_new_xp INTEGER;
  v_new_stage INTEGER;
  v_evolved BOOLEAN := false;
BEGIN
  SELECT * INTO v_pet FROM student_pets WHERE student_id = p_student_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false); END IF;
  SELECT * INTO v_pet_type FROM pet_types WHERE id = v_pet.pet_type_id;
  v_new_xp := v_pet.xp + p_xp;
  v_new_stage := v_pet.current_stage;
  IF v_new_stage = 1 AND v_new_xp >= v_pet_type.evolution_threshold_2 THEN
    v_new_stage := 2; v_evolved := true;
  ELSIF v_new_stage = 2 AND v_new_xp >= v_pet_type.evolution_threshold_3 THEN
    v_new_stage := 3; v_evolved := true;
  END IF;
  UPDATE student_pets SET xp = v_new_xp, current_stage = v_new_stage WHERE id = v_pet.id;
  RETURN jsonb_build_object('success', true, 'evolved', v_evolved, 'new_stage', v_new_stage, 'new_xp', v_new_xp);
END; $$;
GRANT EXECUTE ON FUNCTION give_pet_xp TO anon, authenticated;

-- RPC: criar mentoria
CREATE OR REPLACE FUNCTION public.create_mentorship(p_mentor_id UUID, p_mentee_id UUID, p_teacher_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.mentorships (mentor_id, mentee_id, teacher_id)
  VALUES (p_mentor_id, p_mentee_id, p_teacher_id);
  UPDATE public.students SET is_mentor = true WHERE id = p_mentor_id;
END; $$;
GRANT EXECUTE ON FUNCTION create_mentorship TO authenticated;

-- RPC: completar skill node
CREATE OR REPLACE FUNCTION public.complete_skill_node(p_student_id UUID, p_node_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_node skill_nodes%ROWTYPE;
  v_parent_completed BOOLEAN;
BEGIN
  SELECT * INTO v_node FROM skill_nodes WHERE id = p_node_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Node not found'); END IF;
  IF v_node.parent_node_id IS NOT NULL THEN
    SELECT completed INTO v_parent_completed
    FROM student_skill_progress
    WHERE student_id = p_student_id AND node_id = v_node.parent_node_id;
    IF NOT COALESCE(v_parent_completed, false) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Parent not completed');
    END IF;
  END IF;
  INSERT INTO student_skill_progress (student_id, node_id, completed, completed_at)
  VALUES (p_student_id, p_node_id, true, now())
  ON CONFLICT (student_id, node_id) DO UPDATE SET completed = true, completed_at = now();
  IF v_node.reward_coins > 0 THEN
    UPDATE students SET coins = coins + v_node.reward_coins WHERE id = p_student_id;
  END IF;
  RETURN jsonb_build_object('success', true, 'reward_coins', v_node.reward_coins);
END; $$;
GRANT EXECUTE ON FUNCTION complete_skill_node TO anon, authenticated;

-- RPC: craftar item
CREATE OR REPLACE FUNCTION public.craft_item(p_student_id UUID, p_recipe_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_recipe craft_recipes%ROWTYPE;
  v_ingredient UUID;
  v_all_completed BOOLEAN := true;
BEGIN
  SELECT * INTO v_recipe FROM craft_recipes WHERE id = p_recipe_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Recipe not found'); END IF;
  FOR v_ingredient IN SELECT jsonb_array_elements_text(v_recipe.ingredient_nodes)::UUID LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_skill_progress
      WHERE student_id = p_student_id AND node_id = v_ingredient AND completed = true
    ) THEN v_all_completed := false; EXIT; END IF;
  END LOOP;
  IF NOT v_all_completed THEN RETURN jsonb_build_object('success', false, 'error', 'Missing ingredients'); END IF;
  IF EXISTS (SELECT 1 FROM student_crafts WHERE student_id = p_student_id AND recipe_id = p_recipe_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already crafted');
  END IF;
  INSERT INTO student_crafts (student_id, recipe_id) VALUES (p_student_id, p_recipe_id);
  UPDATE students SET
    total_crafts = COALESCE(total_crafts, 0) + 1,
    coins = coins + COALESCE(v_recipe.result_coins, 0),
    xp = COALESCE(xp, 0) + COALESCE(v_recipe.result_xp, 0)
  WHERE id = p_student_id;
  IF v_recipe.result_item_id IS NOT NULL THEN
    INSERT INTO student_inventory (student_id, item_id) VALUES (p_student_id, v_recipe.result_item_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('success', true, 'reward_coins', v_recipe.result_coins, 'reward_xp', v_recipe.result_xp);
END; $$;
GRANT EXECUTE ON FUNCTION craft_item TO anon, authenticated;

-- Policies for anon (student) inserts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_pets' AND policyname='Students can insert student_pets') THEN
    CREATE POLICY "Students can insert student_pets" ON public.student_pets FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_pets' AND policyname='Students can update own student_pets') THEN
    CREATE POLICY "Students can update own student_pets" ON public.student_pets FOR UPDATE TO anon USING (true);
  END IF;
END $$;
