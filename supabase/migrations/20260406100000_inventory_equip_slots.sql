-- Add equipped tracking to student_inventory
-- Allows students to equip/unequip items and persist state across sessions

ALTER TABLE student_inventory
  ADD COLUMN IF NOT EXISTS is_equipped   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS equipped_slot TEXT;

-- Fast lookup: all equipped items for a student
CREATE INDEX IF NOT EXISTS idx_student_inventory_equipped
  ON student_inventory(student_id, is_equipped)
  WHERE is_equipped = true;

-- Allow anon role (students) to UPDATE their own equipped status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_inventory' AND policyname = 'Students can update equip status'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Students can update equip status"
        ON student_inventory FOR UPDATE TO anon
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;
