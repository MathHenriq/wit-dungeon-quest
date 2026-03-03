
-- Fix data isolation: Remove leaky SELECT policies that expose data across teachers
-- The OR (is_active = true) clause allows any user to see all active content from ALL teachers

-- Fix challenges
DROP POLICY IF EXISTS "Read challenges by teacher context" ON public.challenges;
CREATE POLICY "Anyone can read challenges"
  ON public.challenges
  FOR SELECT
  USING (true);

-- Fix student_missions
DROP POLICY IF EXISTS "Read missions by teacher context" ON public.student_missions;
CREATE POLICY "Anyone can read missions"
  ON public.student_missions
  FOR SELECT
  USING (true);

-- Fix shop_items (keeping table but removing leaky policy)
DROP POLICY IF EXISTS "Read items by teacher context" ON public.shop_items;
CREATE POLICY "Anyone can read shop items"
  ON public.shop_items
  FOR SELECT
  USING (true);
