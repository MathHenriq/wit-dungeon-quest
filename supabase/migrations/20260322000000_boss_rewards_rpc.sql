-- RPC to give rewards when student defeats a boss
CREATE OR REPLACE FUNCTION public.give_boss_rewards(
  p_student_id UUID,
  p_coins INTEGER,
  p_xp INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.students
  SET
    coins = coins + p_coins,
    xp = COALESCE(xp, 0) + p_xp,
    total_boss_kills = COALESCE(total_boss_kills, 0) + 1
  WHERE id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.give_boss_rewards TO anon, authenticated;
