-- ============================================================================
-- Segurança — 3/5: RLS
--
-- Antes desta migration:
--   * `students` tinha SELECT e UPDATE `true` para `anon`: qualquer pessoa com
--     a URL do site, sem login, lia nome/turma/escola dos 685 alunos e podia
--     alterar moedas e nível de qualquer um;
--   * dezenas de tabelas tinham escrita `true` para `anon` e `authenticated`
--     (trocas, PvP, guildas, pets, cápsulas do tempo...);
--   * cápsulas do tempo (mensagens privadas do aluno) eram públicas.
--
-- O portal do aluno consultava o banco como `anon` (cliente sem sessão). O
-- frontend agora usa a sessão do aluno em todas as consultas, então o papel
-- `anon` perde acesso a qualquer dado de aluno e as escritas passam a exigir
-- dono. Outros alunos são vistos só pela view `student_profiles` (nickname e
-- dados de jogo, nunca nome real, turma ou foto).
-- ============================================================================

BEGIN;

-- ─── Funções auxiliares (usadas pelas policies) ─────────────────────────────

CREATE OR REPLACE FUNCTION public.my_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.my_student_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teacher_id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_guild_officer(p_guild_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guild_members gm
    WHERE gm.guild_id = p_guild_id
      AND gm.student_id = public.my_student_id()
      AND gm.role IN ('lider', 'vice_lider')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_guild(p_guild_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guilds g
    WHERE g.id = p_guild_id AND g.teacher_id = public.get_teacher_id()
  )
$$;

-- Também reconhece o professor pelo teacher_id do aluno (não só pela turma):
-- alunos pendentes ficam visíveis para quem vai aprová-los.
CREATE OR REPLACE FUNCTION public.is_teacher_of_student(student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teachers t ON t.user_id = auth.uid()
    LEFT JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = is_teacher_of_student.student_id
      AND (s.teacher_id = t.id OR c.teacher_id = t.id)
  )
$$;

-- ─── 1. Nenhuma policy para `anon` em dados do app ──────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND 'anon' = ANY (roles)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── 2. Leitura "true" para `public` → só `authenticated` ───────────────────
-- Vale para toda tabela ligada a aluno/professor/turma. Catálogos do jogo
-- (itens, andares, inimigos...) continuam públicos: as demos pré-login usam.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.tablename, p.policyname
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.cmd = 'SELECT'
      AND p.roles = '{public}'
      AND p.qual = 'true'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = p.tablename
          AND c.column_name IN ('student_id', 'teacher_id', 'class_id', 'character_id',
                                'proposer_id', 'challenger_id', 'mentor_id', 'guild_id',
                                'raid_id', 'entity_id', 'trade_id', 'feed_item_id',
                                'event_id', 'user_id')
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                   r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── 3. Tabelas com tratamento próprio ──────────────────────────────────────

-- students — só a própria linha, o professor dos alunos e o admin.
DROP POLICY IF EXISTS "Authenticated students can read students"        ON public.students;
DROP POLICY IF EXISTS "Authenticated students can update own record"    ON public.students;
CREATE POLICY "Teachers read own students" ON public.students
  FOR SELECT TO authenticated USING (teacher_id = public.get_teacher_id());
CREATE POLICY "Admins read students" ON public.students
  FOR SELECT TO authenticated USING (public.is_caller_admin());

-- classes — nomes agora são códigos neutros; alunos precisam da lista para
-- o cadastro.
CREATE POLICY "Authenticated read groups" ON public.classes
  FOR SELECT TO authenticated USING (true);

-- teachers — a tabela tem user_id e is_admin. Aluno usa list_teachers_for_signup().
DROP POLICY IF EXISTS "Anyone can read teachers for login" ON public.teachers;
CREATE POLICY "Admins read teachers" ON public.teachers
  FOR SELECT TO authenticated USING (public.is_caller_admin());

-- time_capsules — mensagem privada do aluno: só ele e o professor.
DROP POLICY IF EXISTS "Anyone can read time_capsules"                   ON public.time_capsules;
DROP POLICY IF EXISTS "Students can read own time capsules"             ON public.time_capsules;
DROP POLICY IF EXISTS "Teachers can manage time capsules"               ON public.time_capsules;
DROP POLICY IF EXISTS "Authenticated students can insert time capsules" ON public.time_capsules;
DROP POLICY IF EXISTS "Authenticated students can update time capsules" ON public.time_capsules;
CREATE POLICY "Students manage own time_capsules" ON public.time_capsules
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- analytics_events — telemetria: aluno só grava a própria; leitura é do professor.
DROP POLICY IF EXISTS "Anyone can read analytics_events" ON public.analytics_events;
CREATE POLICY "Students insert own analytics_events" ON public.analytics_events
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());

-- student_requests — pedidos de presença/desafio.
CREATE POLICY "Students insert own requests" ON public.student_requests
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Students read own requests" ON public.student_requests
  FOR SELECT TO authenticated USING (student_id = public.my_student_id());

-- mission_completions — antes aceitava pedido em nome de qualquer aluno.
DROP POLICY IF EXISTS "Students can request mission completion" ON public.mission_completions;
CREATE POLICY "Students request own mission completion" ON public.mission_completions
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());

-- achievement_feed / reactions
CREATE POLICY "Students insert own achievement_feed" ON public.achievement_feed
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Students manage own achievement_reactions" ON public.achievement_reactions
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- boss_attempts
DROP POLICY IF EXISTS "Authenticated students can manage boss_attempts" ON public.boss_attempts;
CREATE POLICY "Students manage own boss_attempts" ON public.boss_attempts
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Teachers manage boss_attempts of own students" ON public.boss_attempts
  FOR ALL TO authenticated
  USING (public.is_teacher_of_student(student_id))
  WITH CHECK (public.is_teacher_of_student(student_id));

-- chest_openings — gravado só pelas RPCs de baú.
DROP POLICY IF EXISTS "Authenticated students can read own chest_openings" ON public.chest_openings;

-- class_wars — "Teachers can manage class wars" era ALL true para qualquer login.
DROP POLICY IF EXISTS "Teachers can manage class wars" ON public.class_wars;

-- daily_dungeon_attempts
DROP POLICY IF EXISTS "Authenticated students can insert dungeon attempts" ON public.daily_dungeon_attempts;
DROP POLICY IF EXISTS "Authenticated students can update dungeon attempts" ON public.daily_dungeon_attempts;
CREATE POLICY "Students insert own dungeon attempts" ON public.daily_dungeon_attempts
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Students update own dungeon attempts" ON public.daily_dungeon_attempts
  FOR UPDATE TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- guilds
DROP POLICY IF EXISTS "Authenticated students can delete guilds" ON public.guilds;
DROP POLICY IF EXISTS "Authenticated students can create guilds" ON public.guilds;
CREATE POLICY "Students create guild under own teacher" ON public.guilds
  FOR INSERT TO authenticated
  WITH CHECK (public.my_student_id() IS NOT NULL AND teacher_id = public.my_student_teacher_id());
CREATE POLICY "Officers update guild" ON public.guilds
  FOR UPDATE TO authenticated
  USING (public.is_guild_officer(id))
  WITH CHECK (public.is_guild_officer(id));
CREATE POLICY "Officers delete guild or last member deletes empty guild" ON public.guilds
  FOR DELETE TO authenticated
  USING (
    public.is_guild_officer(id)
    OR (teacher_id = public.my_student_teacher_id()
        AND NOT EXISTS (SELECT 1 FROM public.guild_members gm WHERE gm.guild_id = guilds.id))
  );

-- guild_members
DROP POLICY IF EXISTS "Authenticated students can manage guild_members" ON public.guild_members;
CREATE POLICY "Students join as self or officers add" ON public.guild_members
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.my_student_id() OR public.is_guild_officer(guild_id)
              OR public.is_teacher_of_guild(guild_id));
CREATE POLICY "Officers or teacher update members" ON public.guild_members
  FOR UPDATE TO authenticated
  USING (public.is_guild_officer(guild_id) OR public.is_teacher_of_guild(guild_id))
  WITH CHECK (public.is_guild_officer(guild_id) OR public.is_teacher_of_guild(guild_id));
CREATE POLICY "Self, officers or teacher remove members" ON public.guild_members
  FOR DELETE TO authenticated
  USING (student_id = public.my_student_id() OR public.is_guild_officer(guild_id)
         OR public.is_teacher_of_guild(guild_id));

-- guild_posts
DROP POLICY IF EXISTS "Authenticated students can manage guild_posts" ON public.guild_posts;
CREATE POLICY "Members post as self" ON public.guild_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = public.my_student_id()
    AND EXISTS (SELECT 1 FROM public.guild_members gm
                WHERE gm.guild_id = guild_posts.guild_id AND gm.student_id = public.my_student_id())
  );
CREATE POLICY "Authors edit own posts" ON public.guild_posts
  FOR UPDATE TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Authors, officers or teacher delete posts" ON public.guild_posts
  FOR DELETE TO authenticated
  USING (student_id = public.my_student_id() OR public.is_guild_officer(guild_id)
         OR public.is_teacher_of_guild(guild_id));

-- pvp_matches
DROP POLICY IF EXISTS "Authenticated students can insert pvp matches" ON public.pvp_matches;
DROP POLICY IF EXISTS "Authenticated students can update pvp matches" ON public.pvp_matches;
CREATE POLICY "Students challenge as self" ON public.pvp_matches
  FOR INSERT TO authenticated WITH CHECK (challenger_id = public.my_student_id());
CREATE POLICY "Participants update match" ON public.pvp_matches
  FOR UPDATE TO authenticated
  USING (public.my_student_id() IN (challenger_id, opponent_id))
  WITH CHECK (public.my_student_id() IN (challenger_id, opponent_id));

-- pvp_presence / pvp_student_stats — cada um só a própria linha.
DROP POLICY IF EXISTS "Auth students can delete own pvp_presence" ON public.pvp_presence;
DROP POLICY IF EXISTS "Auth students can upsert own pvp_presence" ON public.pvp_presence;
DROP POLICY IF EXISTS "Auth students can update own pvp_presence" ON public.pvp_presence;
CREATE POLICY "Students manage own pvp_presence" ON public.pvp_presence
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

DROP POLICY IF EXISTS "Auth students can upsert own pvp_student_stats" ON public.pvp_student_stats;
DROP POLICY IF EXISTS "Auth students can update own pvp_student_stats" ON public.pvp_student_stats;
CREATE POLICY "Students insert own pvp_student_stats" ON public.pvp_student_stats
  FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Students update own pvp_student_stats" ON public.pvp_student_stats
  FOR UPDATE TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- student_pets
DROP POLICY IF EXISTS "Authenticated students can manage student_pets" ON public.student_pets;
CREATE POLICY "Students manage own pets" ON public.student_pets
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Teachers manage pets of own students" ON public.student_pets
  FOR ALL TO authenticated
  USING (public.is_teacher_of_student(student_id))
  WITH CHECK (public.is_teacher_of_student(student_id));

-- trades / trade_items
DROP POLICY IF EXISTS "Authenticated students can insert trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated students can update trades" ON public.trades;
CREATE POLICY "Students propose trades as self" ON public.trades
  FOR INSERT TO authenticated WITH CHECK (proposer_id = public.my_student_id());
CREATE POLICY "Participants update trade" ON public.trades
  FOR UPDATE TO authenticated
  USING (public.my_student_id() IN (proposer_id, receiver_id))
  WITH CHECK (public.my_student_id() IN (proposer_id, receiver_id));

DROP POLICY IF EXISTS "Authenticated can insert trade_items" ON public.trade_items;
CREATE POLICY "Proposer adds items to own pending trade" ON public.trade_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trades t
    WHERE t.id = trade_items.trade_id
      AND t.proposer_id = public.my_student_id()
      AND t.status = 'pending'
  ));

-- student_inventory — aluno só equipa/desequipa o próprio item.
CREATE POLICY "Students update own inventory" ON public.student_inventory
  FOR UPDATE TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- student_crafts / student_skill_progress (tinham só policy anon ALL true)
CREATE POLICY "Students manage own crafts" ON public.student_crafts
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());
CREATE POLICY "Students manage own skill progress" ON public.student_skill_progress
  FOR ALL TO authenticated
  USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

-- character_abilities — tinha INSERT/UPDATE/DELETE/SELECT `true` para todos.
-- Ficam só as policies students_*_own_char_abilities.
DROP POLICY IF EXISTS "Enable delete access for all" ON public.character_abilities;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.character_abilities;
DROP POLICY IF EXISTS "Enable read access for all"   ON public.character_abilities;
DROP POLICY IF EXISTS "Enable update access for all" ON public.character_abilities;

-- student_titles — leitura de títulos ativos só para logados.
DROP POLICY IF EXISTS "Read active titles" ON public.student_titles;
CREATE POLICY "Read active titles" ON public.student_titles
  FOR SELECT TO authenticated USING (expires_at > now());

-- ─── 4. Perfil público de aluno ─────────────────────────────────────────────
-- Único jeito de um aluno ver outro. `name` aqui é o nickname (nunca o nome
-- real); turma e professor só aparecem quando são os mesmos de quem consulta
-- (ranking da turma, trocas), e mesmo assim como UUID; foto não é exposta.
-- É uma view de dono (bypassa o RLS de `students`) de propósito: o RLS da
-- tabela não consegue esconder colunas, a view consegue.

CREATE OR REPLACE VIEW public.student_profiles
WITH (security_barrier = true)
AS
WITH me AS (
  SELECT class_id, teacher_id FROM public.students WHERE user_id = auth.uid() LIMIT 1
)
SELECT
  s.id,
  coalesce(nullif(btrim(s.character_name), ''), 'Aventureiro') AS name,
  s.character_name,
  s.character_class,
  s.race,
  NULL::text AS profile_photo_url,
  s.level,
  s.xp,
  s.coins,
  s.presencas_consecutivas,
  s.streak_current,
  s.streak_best,
  s.total_boss_kills,
  s.total_pvp_wins,
  s.total_missions_completed,
  s.total_crafts,
  s.is_mentor,
  s.active_banner_key,
  s.status,
  s.is_test_account,
  s.attr_forca,
  s.attr_destreza,
  s.attr_inteligencia,
  s.attr_carisma,
  s.attr_agilidade,
  s.attr_resistencia,
  CASE WHEN s.class_id   = (SELECT class_id   FROM me) THEN s.class_id   END AS class_id,
  CASE WHEN s.teacher_id = (SELECT teacher_id FROM me) THEN s.teacher_id END AS teacher_id
FROM public.students s
WHERE s.status = 'active';

REVOKE ALL ON public.student_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.student_profiles TO authenticated;

-- Views antigas marcadas pelo advisor como SECURITY DEFINER.
--
-- guild_ranking_global só devolve agregados por guilda (soma de XP, média de
-- nível); continua de dono para somar membros de outras turmas, mas sai do
-- alcance de `anon`.
REVOKE ALL ON public.guild_ranking_global FROM PUBLIC, anon;
GRANT SELECT ON public.guild_ranking_global TO authenticated;

-- master_wave11_classes_view devolvia nome do aluno + turma para qualquer
-- usuário logado. Agora só retorna linhas para o admin.
CREATE OR REPLACE VIEW public.master_wave11_classes_view AS
SELECT s.id AS student_id,
       s.name AS student_name,
       s.class_id,
       c.name AS class_name,
       scp.class_type AS wave11_class,
       scp.primary_element,
       scp.secondary_element,
       scp.chose_class_at,
       COALESCE(ssp.available_points, 0) AS available_points,
       COALESCE(ssp.total_earned, 0) AS total_earned,
       (SELECT count(*) FROM public.student_unlocked_skills sus WHERE sus.student_id = s.id) AS skills_unlocked,
       (SELECT count(*) FROM public.element_mastery_log eml WHERE eml.student_id = s.id) AS elements_mastered
FROM public.students s
LEFT JOIN public.classes c ON c.id = s.class_id
LEFT JOIN public.student_class_profile scp ON scp.student_id = s.id
LEFT JOIN public.student_skill_points ssp ON ssp.student_id = s.id
WHERE public.is_caller_admin();

REVOKE ALL ON public.master_wave11_classes_view FROM PUBLIC, anon;
GRANT SELECT ON public.master_wave11_classes_view TO authenticated;

COMMIT;
