-- Equip the test "kunai_throw" item on student "Aluno" (test account).
-- Ensures only this single item is flagged is_equipped = true.

DO $$
DECLARE
  v_student_id UUID := 'b885bf0e-7319-4d9a-9b2f-9fd215218b37';   -- Aluno
  v_item_id    UUID := '6e70147a-bb81-4b7f-935c-d4558f0adec1';   -- Espadinha (kunai_throw)
BEGIN
  -- Unequip everything Aluno has
  UPDATE public.student_inventory
     SET is_equipped = false, equipped_slot = NULL
   WHERE student_id = v_student_id;

  -- Make sure the item is in Aluno's inventory (insert if missing)
  INSERT INTO public.student_inventory (student_id, item_id, is_equipped, equipped_slot)
  VALUES (v_student_id, v_item_id, true, 'weapon')
  ON CONFLICT DO NOTHING;

  -- If the row already existed, flip it to equipped
  UPDATE public.student_inventory
     SET is_equipped = true, equipped_slot = 'weapon'
   WHERE student_id = v_student_id
     AND item_id    = v_item_id;
END $$;
