-- ─── Parent Invites Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  used_by UUID REFERENCES public.parent_accounts(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);
CREATE INDEX IF NOT EXISTS idx_parent_invites_code ON public.parent_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_parent_invites_student ON public.parent_invites(student_id);
ALTER TABLE public.parent_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage invites"
  ON public.parent_invites FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Anyone can read invites by code"
  ON public.parent_invites FOR SELECT USING (true);

-- ─── RLS for parent_accounts ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_accounts'
      AND policyname = 'Anyone can insert parent_accounts'
  ) THEN
    CREATE POLICY "Anyone can insert parent_accounts"
      ON public.parent_accounts FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_accounts'
      AND policyname = 'Parents can read own account'
  ) THEN
    CREATE POLICY "Parents can read own account"
      ON public.parent_accounts FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── RLS for parent_student_links ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_student_links'
      AND policyname = 'Parents can insert links'
  ) THEN
    CREATE POLICY "Parents can insert links"
      ON public.parent_student_links FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_student_links'
      AND policyname = 'Parents can read own links'
  ) THEN
    CREATE POLICY "Parents can read own links"
      ON public.parent_student_links FOR SELECT TO authenticated
      USING (
        parent_id IN (
          SELECT id FROM parent_accounts WHERE user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_student_links'
      AND policyname = 'Parents can update own links'
  ) THEN
    CREATE POLICY "Parents can update own links"
      ON public.parent_student_links FOR UPDATE TO authenticated
      USING (
        parent_id IN (
          SELECT id FROM parent_accounts WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ─── parent_reports RLS ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_reports'
      AND policyname = 'Teachers can manage reports'
  ) THEN
    CREATE POLICY "Teachers can manage reports"
      ON public.parent_reports FOR ALL TO authenticated
      USING (teacher_id = get_teacher_id())
      WITH CHECK (teacher_id = get_teacher_id());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_reports'
      AND policyname = 'Anyone can read reports by id'
  ) THEN
    CREATE POLICY "Anyone can read reports by id"
      ON public.parent_reports FOR SELECT USING (true);
  END IF;
END $$;

-- ─── RPC: generate_parent_invite ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_parent_invite(p_student_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_part1 TEXT;
  v_part2 TEXT;
BEGIN
  IF NOT is_teacher_of_student(p_student_id) THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  v_part1 := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  v_part2 := upper(substr(md5(random()::text || clock_timestamp()::text), 5, 4));
  v_code  := v_part1 || '-' || v_part2;

  INSERT INTO parent_invites (student_id, teacher_id, invite_code)
  VALUES (p_student_id, get_teacher_id(), v_code);

  RETURN v_code;
END;
$$;
GRANT EXECUTE ON FUNCTION generate_parent_invite TO authenticated;

-- ─── RPC: redeem_parent_invite ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_parent_invite(p_invite_code TEXT, p_parent_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite  parent_invites%ROWTYPE;
  v_parent_id UUID;
BEGIN
  SELECT * INTO v_invite
  FROM parent_invites
  WHERE invite_code = p_invite_code
    AND used_by IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;

  -- Create or find parent account
  SELECT id INTO v_parent_id FROM parent_accounts WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO parent_accounts (user_id, email, name)
    VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      p_parent_name
    )
    RETURNING id INTO v_parent_id;
  END IF;

  -- Mark invite used
  UPDATE parent_invites
  SET used_by = v_parent_id, used_at = now()
  WHERE id = v_invite.id;

  -- Create verified link
  INSERT INTO parent_student_links (parent_id, student_id, invite_code, verified)
  VALUES (v_parent_id, v_invite.student_id, p_invite_code, true)
  ON CONFLICT (parent_id, student_id) DO UPDATE SET verified = true;

  RETURN jsonb_build_object('success', true, 'student_id', v_invite.student_id);
END;
$$;
GRANT EXECUTE ON FUNCTION redeem_parent_invite TO authenticated;

-- ─── RPC: get_parent_child_summary ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_parent_child_summary(p_student_id UUID, p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_start  TIMESTAMPTZ := now() - (p_days || ' days')::INTERVAL;
BEGIN
  -- Verify parent has verified link to this student
  IF NOT EXISTS (
    SELECT 1
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE psl.student_id = p_student_id
      AND pa.user_id = auth.uid()
      AND psl.verified = true
  ) THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  SELECT jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'name', st.name,
        'character_name', st.character_name,
        'level', st.level,
        'xp', COALESCE(st.xp, 0),
        'coins', st.coins,
        'streak_current', COALESCE(st.streak_current, 0),
        'streak_best', COALESCE(st.streak_best, 0),
        'presencas_consecutivas', st.presencas_consecutivas,
        'total_missions', COALESCE(st.total_missions_completed, 0),
        'total_bosses', COALESCE(st.total_boss_kills, 0),
        'class_name', (SELECT name FROM classes WHERE id = st.class_id),
        'character_class', st.character_class
      )
      FROM students st WHERE st.id = p_student_id
    ),
    'missions_completed', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', sm.title,
        'reward', sm.reward,
        'completed_at', mc.created_at
      )), '[]'::jsonb)
      FROM mission_completions mc
      JOIN student_missions sm ON sm.id = mc.mission_id
      WHERE mc.student_id = p_student_id
        AND mc.status = 'approved'
        AND mc.created_at >= v_start
    ),
    'bosses_faced', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'boss_name', bb.boss_name,
        'title', bb.title,
        'defeated', ba.boss_defeated,
        'score', round(ba.total_damage::numeric / NULLIF(bb.boss_hp, 0) * 100)
      )), '[]'::jsonb)
      FROM boss_attempts ba
      JOIN boss_battles bb ON bb.id = ba.boss_id
      WHERE ba.student_id = p_student_id
        AND ba.finished_at >= v_start
    ),
    'skills_completed', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', sn.name,
        'description', sn.description,
        'completed_at', sp.completed_at
      )), '[]'::jsonb)
      FROM student_skill_progress sp
      JOIN skill_nodes sn ON sn.id = sp.node_id
      WHERE sp.student_id = p_student_id
        AND sp.completed = true
        AND sp.completed_at >= v_start
    ),
    'achievements', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'message', af.message,
        'type', af.achievement_type,
        'created_at', af.created_at
      )), '[]'::jsonb)
      FROM achievement_feed af
      WHERE af.student_id = p_student_id
        AND af.created_at >= v_start
      ORDER BY af.created_at DESC
      LIMIT 10
    ),
    'login_count', (
      SELECT count(*)
      FROM analytics_events
      WHERE student_id = p_student_id
        AND event_type = 'login'
        AND created_at >= v_start
    ),
    'xp_events', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'day', date_trunc('day', ae.created_at)::date,
        'xp', COALESCE((ae.event_data->>'xp')::int, 0)
      )), '[]'::jsonb)
      FROM analytics_events ae
      WHERE ae.student_id = p_student_id
        AND ae.event_type IN ('mission_complete', 'boss_victory', 'challenge_complete')
        AND ae.created_at >= v_start
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION get_parent_child_summary TO authenticated;

-- ─── RPC: generate_parent_report ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_parent_report(
  p_student_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_type TEXT DEFAULT 'weekly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id   UUID;
  v_data JSONB;
  v_s    TIMESTAMPTZ := p_period_start::TIMESTAMPTZ;
  v_e    TIMESTAMPTZ := (p_period_end + 1)::TIMESTAMPTZ;
BEGIN
  v_data := jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'name', st.name,
        'character_name', st.character_name,
        'level', st.level,
        'xp', COALESCE(st.xp, 0),
        'coins', st.coins,
        'streak_current', COALESCE(st.streak_current, 0),
        'presencas_consecutivas', st.presencas_consecutivas,
        'character_class', st.character_class,
        'class_name', (SELECT name FROM classes WHERE id = st.class_id)
      )
      FROM students st WHERE st.id = p_student_id
    ),
    'topics_learned', (
      SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
        'name', sn.name,
        'description', sn.description
      )), '[]'::jsonb)
      FROM student_skill_progress sp
      JOIN skill_nodes sn ON sn.id = sp.node_id
      WHERE sp.student_id = p_student_id
        AND sp.completed = true
        AND sp.completed_at BETWEEN v_s AND v_e
    ),
    'missions_completed', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', sm.title,
        'description', sm.description
      )), '[]'::jsonb)
      FROM mission_completions mc
      JOIN student_missions sm ON sm.id = mc.mission_id
      WHERE mc.student_id = p_student_id
        AND mc.status = 'approved'
        AND mc.created_at BETWEEN v_s AND v_e
    ),
    'bosses_faced', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', bb.boss_name,
        'title', bb.title,
        'defeated', ba.boss_defeated,
        'score', round(ba.total_damage::numeric / NULLIF(bb.boss_hp, 0) * 100)
      )), '[]'::jsonb)
      FROM boss_attempts ba
      JOIN boss_battles bb ON bb.id = ba.boss_id
      WHERE ba.student_id = p_student_id
        AND ba.finished_at BETWEEN v_s AND v_e
    ),
    'login_count', (
      SELECT count(*)
      FROM analytics_events
      WHERE student_id = p_student_id
        AND event_type = 'login'
        AND created_at BETWEEN v_s AND v_e
    )
  );

  INSERT INTO parent_reports (student_id, teacher_id, report_type, period_start, period_end, report_data)
  VALUES (p_student_id, get_teacher_id(), p_type, p_period_start, p_period_end, v_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION generate_parent_report TO authenticated;
