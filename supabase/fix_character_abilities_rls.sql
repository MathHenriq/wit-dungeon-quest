-- Fix RLS for character_abilities
ALTER TABLE character_abilities ENABLE ROW LEVEL SECURITY;

-- Allow reading
DROP POLICY IF EXISTS "Enable read access for all" ON character_abilities;
CREATE POLICY "Enable read access for all" 
ON character_abilities FOR SELECT 
USING (true);

-- Allow inserting (equipping skills)
DROP POLICY IF EXISTS "Enable insert access for all" ON character_abilities;
CREATE POLICY "Enable insert access for all" 
ON character_abilities FOR INSERT 
WITH CHECK (true);

-- Allow updating
DROP POLICY IF EXISTS "Enable update access for all" ON character_abilities;
CREATE POLICY "Enable update access for all" 
ON character_abilities FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow deleting (unequipping skills)
DROP POLICY IF EXISTS "Enable delete access for all" ON character_abilities;
CREATE POLICY "Enable delete access for all" 
ON character_abilities FOR DELETE 
USING (true);
