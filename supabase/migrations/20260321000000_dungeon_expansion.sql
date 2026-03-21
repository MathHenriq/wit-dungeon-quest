-- ============================================================
-- DUNGEON EXPANSION — WIT Dungeon Quest
-- Migration: 20260321000000_dungeon_expansion.sql
-- Adds all new tables for: analytics, guilds, pets, boss battles,
-- PvP, skill trees, time capsules, class wars, mentorships,
-- achievement feed, craft, parent portal, lore tips
-- ============================================================

-- ============================================================
-- 1. ANALYTICS EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id UUID        REFERENCES public.students(id) ON DELETE SET NULL,
  class_id   UUID        REFERENCES public.classes(id)  ON DELETE SET NULL,
  event_type TEXT        NOT NULL,
  event_data JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_teacher  ON public.analytics_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_student  ON public.analytics_events(student_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_class    ON public.analytics_events(class_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type     ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created  ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read analytics_events"
  ON public.analytics_events FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own analytics_events"
  ON public.analytics_events FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- ============================================================
-- 2. GUILDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guilds (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  emblem      TEXT        NOT NULL DEFAULT '⚔️',
  description TEXT,
  level       INTEGER     NOT NULL DEFAULT 1,
  xp          INTEGER     NOT NULL DEFAULT 0,
  max_members INTEGER     NOT NULL DEFAULT 6,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, name)
);

CREATE INDEX IF NOT EXISTS idx_guilds_teacher ON public.guilds(teacher_id);

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guilds"
  ON public.guilds FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own guilds"
  ON public.guilds FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Guild members

CREATE TABLE IF NOT EXISTS public.guild_members (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id   UUID        NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild   ON public.guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_student ON public.guild_members(student_id);

ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guild_members"
  ON public.guild_members FOR SELECT USING (true);

CREATE POLICY "Students can manage own guild_members"
  ON public.guild_members FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Guild posts

CREATE TABLE IF NOT EXISTS public.guild_posts (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id   UUID        NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  post_type  TEXT        NOT NULL DEFAULT 'message',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guild_posts_guild   ON public.guild_posts(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_posts_student ON public.guild_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_guild_posts_created ON public.guild_posts(created_at);

ALTER TABLE public.guild_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read guild_posts"
  ON public.guild_posts FOR SELECT USING (true);

CREATE POLICY "Students can manage own guild_posts"
  ON public.guild_posts FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 3. PETS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pet_types (
  id                    UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id            UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  icon                  TEXT        NOT NULL DEFAULT '🐾',
  description           TEXT,
  stage1_name           TEXT        NOT NULL DEFAULT 'Filhote',
  stage2_name           TEXT        NOT NULL DEFAULT 'Jovem',
  stage3_name           TEXT        NOT NULL DEFAULT 'Adulto',
  stage1_icon           TEXT        NOT NULL DEFAULT '🥚',
  stage2_icon           TEXT        NOT NULL DEFAULT '🐣',
  stage3_icon           TEXT        NOT NULL DEFAULT '🐉',
  bonus_type            TEXT                 DEFAULT 'xp',
  bonus_value           INTEGER              DEFAULT 5,
  evolution_threshold_2 INTEGER     NOT NULL DEFAULT 100,
  evolution_threshold_3 INTEGER     NOT NULL DEFAULT 300,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_types_teacher ON public.pet_types(teacher_id);

ALTER TABLE public.pet_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pet_types"
  ON public.pet_types FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own pet_types"
  ON public.pet_types FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Student pets

CREATE TABLE IF NOT EXISTS public.student_pets (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pet_type_id  UUID        NOT NULL REFERENCES public.pet_types(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL DEFAULT 'Sem Nome',
  xp           INTEGER     NOT NULL DEFAULT 0,
  current_stage INTEGER    NOT NULL DEFAULT 1,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  adopted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_pets_student ON public.student_pets(student_id);

ALTER TABLE public.student_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student_pets"
  ON public.student_pets FOR SELECT USING (true);

CREATE POLICY "Students can manage own student_pets"
  ON public.student_pets FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 4. BOSS BATTLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.boss_battles (
  id                   UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id           UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id             UUID        REFERENCES public.classes(id) ON DELETE SET NULL,
  title                TEXT        NOT NULL,
  description          TEXT,
  boss_name            TEXT        NOT NULL DEFAULT 'Dragão das Sombras',
  boss_icon            TEXT        NOT NULL DEFAULT '🐉',
  boss_hp              INTEGER     NOT NULL DEFAULT 100,
  reward_coins         INTEGER     NOT NULL DEFAULT 20,
  reward_xp            INTEGER     NOT NULL DEFAULT 50,
  difficulty           TEXT        NOT NULL DEFAULT 'normal',
  is_active            BOOLEAN     NOT NULL DEFAULT false,
  time_limit_minutes   INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boss_battles_teacher ON public.boss_battles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_class   ON public.boss_battles(class_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_active  ON public.boss_battles(is_active);

ALTER TABLE public.boss_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read boss_battles"
  ON public.boss_battles FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own boss_battles"
  ON public.boss_battles FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Boss questions

CREATE TABLE IF NOT EXISTS public.boss_questions (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_id        UUID        NOT NULL REFERENCES public.boss_battles(id) ON DELETE CASCADE,
  question_text  TEXT        NOT NULL,
  question_type  TEXT        NOT NULL DEFAULT 'multiple_choice',
  options        JSONB,
  correct_answer TEXT        NOT NULL,
  damage         INTEGER     NOT NULL DEFAULT 10,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boss_questions_boss ON public.boss_questions(boss_id);

ALTER TABLE public.boss_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read boss_questions"
  ON public.boss_questions FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own boss_questions"
  ON public.boss_questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boss_battles bb
    WHERE bb.id = boss_questions.boss_id
      AND bb.teacher_id = get_teacher_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boss_battles bb
    WHERE bb.id = boss_questions.boss_id
      AND bb.teacher_id = get_teacher_id()
  ));

-- Boss attempts

CREATE TABLE IF NOT EXISTS public.boss_attempts (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_id       UUID        NOT NULL REFERENCES public.boss_battles(id) ON DELETE CASCADE,
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers       JSONB       NOT NULL DEFAULT '[]',
  total_damage  INTEGER     NOT NULL DEFAULT 0,
  boss_defeated BOOLEAN     NOT NULL DEFAULT false,
  coins_earned  INTEGER     NOT NULL DEFAULT 0,
  xp_earned     INTEGER     NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_boss_attempts_boss    ON public.boss_attempts(boss_id);
CREATE INDEX IF NOT EXISTS idx_boss_attempts_student ON public.boss_attempts(student_id);

ALTER TABLE public.boss_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read boss_attempts"
  ON public.boss_attempts FOR SELECT USING (true);

CREATE POLICY "Students can manage own boss_attempts"
  ON public.boss_attempts FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 5. PVP MATCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pvp_matches (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id       UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  challenger_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  opponent_id      UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  winner_id        UUID        REFERENCES public.students(id),
  status           TEXT        NOT NULL DEFAULT 'pending',
  challenger_score INTEGER     NOT NULL DEFAULT 0,
  opponent_score   INTEGER     NOT NULL DEFAULT 0,
  questions        JSONB                DEFAULT '[]',
  reward_coins     INTEGER     NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pvp_matches_teacher    ON public.pvp_matches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_challenger ON public.pvp_matches(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_opponent   ON public.pvp_matches(opponent_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_status     ON public.pvp_matches(status);

ALTER TABLE public.pvp_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pvp_matches"
  ON public.pvp_matches FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own pvp_matches"
  ON public.pvp_matches FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Students can manage own pvp_matches"
  ON public.pvp_matches FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 6. SKILL TREES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.skill_trees (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  icon        TEXT                 DEFAULT '🌳',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_trees_teacher ON public.skill_trees(teacher_id);

ALTER TABLE public.skill_trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read skill_trees"
  ON public.skill_trees FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own skill_trees"
  ON public.skill_trees FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Skill nodes

CREATE TABLE IF NOT EXISTS public.skill_nodes (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id        UUID        NOT NULL REFERENCES public.skill_trees(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  description    TEXT,
  icon           TEXT                 DEFAULT '✨',
  parent_node_id UUID        REFERENCES public.skill_nodes(id) ON DELETE SET NULL,
  reward_coins   INTEGER              DEFAULT 10,
  reward_title   TEXT,
  position_x     INTEGER     NOT NULL DEFAULT 0,
  position_y     INTEGER     NOT NULL DEFAULT 0,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_nodes_tree   ON public.skill_nodes(tree_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_parent ON public.skill_nodes(parent_node_id);

ALTER TABLE public.skill_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read skill_nodes"
  ON public.skill_nodes FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own skill_nodes"
  ON public.skill_nodes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.skill_trees st
    WHERE st.id = skill_nodes.tree_id
      AND st.teacher_id = get_teacher_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.skill_trees st
    WHERE st.id = skill_nodes.tree_id
      AND st.teacher_id = get_teacher_id()
  ));

-- Student skill progress

CREATE TABLE IF NOT EXISTS public.student_skill_progress (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  node_id      UUID        NOT NULL REFERENCES public.skill_nodes(id) ON DELETE CASCADE,
  completed    BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_student_skill_progress_student ON public.student_skill_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_node    ON public.student_skill_progress(node_id);

ALTER TABLE public.student_skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student_skill_progress"
  ON public.student_skill_progress FOR SELECT USING (true);

CREATE POLICY "Students can manage own student_skill_progress"
  ON public.student_skill_progress FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 7. TIME CAPSULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.time_capsules (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id    UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  message       TEXT,
  goals         TEXT,
  snapshot_data JSONB       NOT NULL DEFAULT '{}',
  sealed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  open_date     TIMESTAMPTZ NOT NULL,
  opened        BOOLEAN     NOT NULL DEFAULT false,
  opened_at     TIMESTAMPTZ,
  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_time_capsules_student   ON public.time_capsules(student_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_teacher   ON public.time_capsules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_open_date ON public.time_capsules(open_date);

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read time_capsules"
  ON public.time_capsules FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own time_capsules"
  ON public.time_capsules FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Students can manage own time_capsules"
  ON public.time_capsules FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 8. CLASS WARS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.class_wars (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id      UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  class_a_id      UUID        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_b_id      UUID        NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_a_score   INTEGER     NOT NULL DEFAULT 0,
  class_b_score   INTEGER     NOT NULL DEFAULT 0,
  winner_class_id UUID        REFERENCES public.classes(id),
  status          TEXT        NOT NULL DEFAULT 'active',
  reward_coins    INTEGER     NOT NULL DEFAULT 15,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_wars_teacher  ON public.class_wars(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_wars_class_a  ON public.class_wars(class_a_id);
CREATE INDEX IF NOT EXISTS idx_class_wars_class_b  ON public.class_wars(class_b_id);
CREATE INDEX IF NOT EXISTS idx_class_wars_status   ON public.class_wars(status);

ALTER TABLE public.class_wars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class_wars"
  ON public.class_wars FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own class_wars"
  ON public.class_wars FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- ============================================================
-- 9. MENTORSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mentorships (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mentee_id    UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id   UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(mentee_id)
);

CREATE INDEX IF NOT EXISTS idx_mentorships_mentor  ON public.mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee  ON public.mentorships(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_teacher ON public.mentorships(teacher_id);

ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mentorships"
  ON public.mentorships FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own mentorships"
  ON public.mentorships FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- ============================================================
-- 10. ACHIEVEMENT FEED & REACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.achievement_feed (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id       UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id       UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  achievement_type TEXT        NOT NULL,
  achievement_data JSONB       NOT NULL DEFAULT '{}',
  message          TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievement_feed_student   ON public.achievement_feed(student_id);
CREATE INDEX IF NOT EXISTS idx_achievement_feed_teacher   ON public.achievement_feed(teacher_id);
CREATE INDEX IF NOT EXISTS idx_achievement_feed_created   ON public.achievement_feed(created_at);

ALTER TABLE public.achievement_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievement_feed"
  ON public.achievement_feed FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own achievement_feed"
  ON public.achievement_feed FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Students can insert achievement_feed"
  ON public.achievement_feed FOR INSERT TO anon
  WITH CHECK (true);

-- Achievement reactions

CREATE TABLE IF NOT EXISTS public.achievement_reactions (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_item_id UUID        NOT NULL REFERENCES public.achievement_feed(id) ON DELETE CASCADE,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reaction     TEXT        NOT NULL DEFAULT '⚔️',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_reactions_feed    ON public.achievement_reactions(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_achievement_reactions_student ON public.achievement_reactions(student_id);

ALTER TABLE public.achievement_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievement_reactions"
  ON public.achievement_reactions FOR SELECT USING (true);

CREATE POLICY "Students can manage own achievement_reactions"
  ON public.achievement_reactions FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 11. CRAFT RECIPES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.craft_recipes (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id       UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  icon             TEXT                 DEFAULT '⚗️',
  result_item_id   UUID        REFERENCES public.shop_items(id) ON DELETE SET NULL,
  result_coins     INTEGER              DEFAULT 0,
  result_xp        INTEGER              DEFAULT 0,
  ingredient_nodes JSONB       NOT NULL DEFAULT '[]',
  rarity           TEXT        NOT NULL DEFAULT 'common',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_craft_recipes_teacher ON public.craft_recipes(teacher_id);

ALTER TABLE public.craft_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read craft_recipes"
  ON public.craft_recipes FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own craft_recipes"
  ON public.craft_recipes FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- Student crafts

CREATE TABLE IF NOT EXISTS public.student_crafts (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recipe_id  UUID        NOT NULL REFERENCES public.craft_recipes(id) ON DELETE CASCADE,
  crafted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_crafts_student ON public.student_crafts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_crafts_recipe  ON public.student_crafts(recipe_id);

ALTER TABLE public.student_crafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student_crafts"
  ON public.student_crafts FOR SELECT USING (true);

CREATE POLICY "Students can manage own student_crafts"
  ON public.student_crafts FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ============================================================
-- 12. PARENT PORTAL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_accounts (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_accounts_user ON public.parent_accounts(user_id);

ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parent_accounts"
  ON public.parent_accounts FOR SELECT USING (true);

CREATE POLICY "Parents can manage own parent_accounts"
  ON public.parent_accounts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Parent-student links

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id   UUID        NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  verified    BOOLEAN     NOT NULL DEFAULT false,
  invite_code TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent  ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON public.parent_student_links(student_id);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parent_student_links"
  ON public.parent_student_links FOR SELECT USING (true);

CREATE POLICY "Parents can manage own parent_student_links"
  ON public.parent_student_links FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_accounts pa
    WHERE pa.id = parent_student_links.parent_id
      AND pa.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parent_accounts pa
    WHERE pa.id = parent_student_links.parent_id
      AND pa.user_id = auth.uid()
  ));

-- Parent reports

CREATE TABLE IF NOT EXISTS public.parent_reports (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id   UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  report_type  TEXT        NOT NULL DEFAULT 'weekly',
  period_start DATE        NOT NULL,
  period_end   DATE        NOT NULL,
  report_data  JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_reports_student ON public.parent_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_teacher ON public.parent_reports(teacher_id);

ALTER TABLE public.parent_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parent_reports"
  ON public.parent_reports FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own parent_reports"
  ON public.parent_reports FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- ============================================================
-- 13. LORE TIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lore_tips (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  tip_type   TEXT        NOT NULL DEFAULT 'lore',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lore_tips_teacher ON public.lore_tips(teacher_id);

ALTER TABLE public.lore_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lore_tips"
  ON public.lore_tips FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own lore_tips"
  ON public.lore_tips FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());

-- ============================================================
-- 14. NOVAS COLUNAS EM students
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS xp                       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_current           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_best              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_activity     DATE,
  ADD COLUMN IF NOT EXISTS diamonds                 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_boss_kills         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pvp_wins           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_missions_completed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_crafts             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_mentor                BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentor_xp                INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 15. NOVAS COLUNAS EM classes
-- ============================================================

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS biome       TEXT DEFAULT 'castle',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================
-- 16. NOVA COLUNA EM shop_items
-- ============================================================

ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

-- ============================================================
-- 17. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guild_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievement_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievement_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boss_attempts;
