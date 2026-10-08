-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: eventos da turma.
--
-- Votação: o professor abre uma votação com 2 a 4 temas da lista pronta
-- (src/game/class-events.ts, VOTE_THEMES; sem texto livre) e fecha quando
-- quiser (ou ela fecha sozinha no prazo). Cada aluno tem 1 voto e pode trocar
-- enquanto está aberta.
-- Carta da Aula: o professor escolhe uma carta (base, de Comum a Rara) para a
-- aula; quem não faltou ganha 1 cópia, uma vez por aula.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_votes (
  id          bigserial PRIMARY KEY,
  teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  options     text[] NOT NULL CHECK (cardinality(options) BETWEEN 2 AND 4),
  opened_at   timestamptz NOT NULL DEFAULT now(),
  ends        timestamptz NOT NULL,
  closed      boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS wit2_votes_teacher ON public.wit2_votes (teacher_id, opened_at DESC);
CREATE TABLE IF NOT EXISTS public.wit2_vote_ballots (
  vote_id     bigint NOT NULL REFERENCES public.wit2_votes(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  choice      text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vote_id, student_id)
);
CREATE TABLE IF NOT EXISTS public.wit2_lesson_card (
  lesson_id   uuid PRIMARY KEY REFERENCES public.wit2_lessons(id) ON DELETE CASCADE,
  card_id     text NOT NULL REFERENCES public.wit2_card_catalog(id)
);
CREATE TABLE IF NOT EXISTS public.wit2_lesson_card_given (
  lesson_id   uuid NOT NULL REFERENCES public.wit2_lessons(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  card_id     text NOT NULL,
  PRIMARY KEY (lesson_id, student_id)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_votes','wit2_vote_ballots','wit2_lesson_card','wit2_lesson_card_given']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- votação em jsonb (com a contagem de cada tema)
CREATE OR REPLACE FUNCTION public.wit2_vote_json(p_vote bigint, p_me uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object('id', v.id, 'options', to_jsonb(v.options), 'ends', v.ends,
    'aberta', NOT v.closed AND v.ends > now(),
    'votos', (SELECT coalesce(jsonb_object_agg(choice, n), '{}'::jsonb) FROM (SELECT choice, count(*) AS n FROM wit2_vote_ballots WHERE vote_id = v.id GROUP BY choice) c),
    'total', (SELECT count(*) FROM wit2_vote_ballots WHERE vote_id = v.id),
    'meu', (SELECT choice FROM wit2_vote_ballots WHERE vote_id = v.id AND student_id = p_me))
  FROM wit2_votes v WHERE v.id = p_vote;
$$;

-- ── professor ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.wit2_teacher_vote_open(p_options text[], p_days int) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF cardinality(p_options) NOT BETWEEN 2 AND 4 OR EXISTS (SELECT 1 FROM unnest(p_options) o WHERE o !~ '^[a-z-]{2,24}$')
     OR (SELECT count(DISTINCT o) FROM unnest(p_options) o) <> cardinality(p_options) THEN
    RAISE EXCEPTION 'votação inválida';
  END IF;
  -- uma aberta por vez: abrir outra fecha a anterior
  UPDATE wit2_votes SET closed = true WHERE teacher_id = me AND NOT closed;
  INSERT INTO wit2_votes (teacher_id, options, ends) VALUES (me, p_options, now() + make_interval(days => greatest(1, least(14, p_days))))
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_vote_close(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wit2_votes SET closed = true WHERE id = p_id AND teacher_id = get_teacher_id();
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_votes() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(wit2_vote_json(id, NULL) ORDER BY opened_at DESC)
    FROM (SELECT id, opened_at FROM wit2_votes WHERE teacher_id = me ORDER BY opened_at DESC LIMIT 10) v), '[]'::jsonb);
END $$;

-- Carta da Aula: grava a carta e entrega a quem não faltou (uma vez por aula e aluno)
CREATE OR REPLACE FUNCTION public.wit2_teacher_lesson_card(p_lesson uuid, p_card text) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); r record; n int := 0; v_card text;
BEGIN
  IF me IS NULL OR NOT EXISTS (SELECT 1 FROM wit2_lessons WHERE id = p_lesson AND teacher_id = me) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM wit2_card_catalog WHERE id = p_card AND base AND rarity IN ('common','uncommon','rare')) THEN
    RAISE EXCEPTION 'carta inválida para a aula';
  END IF;
  -- depois de entregar a alguém, a carta da aula não muda mais
  SELECT card_id INTO v_card FROM wit2_lesson_card WHERE lesson_id = p_lesson;
  IF v_card IS NULL THEN
    INSERT INTO wit2_lesson_card (lesson_id, card_id) VALUES (p_lesson, p_card);
    v_card := p_card;
  ELSIF v_card <> p_card AND NOT EXISTS (SELECT 1 FROM wit2_lesson_card_given WHERE lesson_id = p_lesson) THEN
    UPDATE wit2_lesson_card SET card_id = p_card WHERE lesson_id = p_lesson;
    v_card := p_card;
  END IF;
  FOR r IN SELECT a.student_id FROM wit2_attendance a WHERE a.lesson_id = p_lesson AND a.status <> 'faltou'
           AND NOT EXISTS (SELECT 1 FROM wit2_lesson_card_given g WHERE g.lesson_id = p_lesson AND g.student_id = a.student_id) LOOP
    PERFORM wit2_ensure(r.student_id);
    PERFORM wit2_add_card(r.student_id, v_card, 1);
    INSERT INTO wit2_lesson_card_given (lesson_id, student_id, card_id) VALUES (p_lesson, r.student_id, v_card);
    PERFORM wit2_event(r.student_id, 'carta-aula', 1);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- ── aluno ───────────────────────────────────────────────────────────────────
-- a votação mais recente da turma (aberta ou o resultado da última) e a Carta da Aula que ganhou e ainda não viu
CREATE OR REPLACE FUNCTION public.wit2_vote_current() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT v.id INTO v_id FROM wit2_votes v JOIN students s ON s.teacher_id = v.teacher_id
    WHERE s.id = me ORDER BY v.opened_at DESC LIMIT 1;
  RETURN CASE WHEN v_id IS NULL THEN NULL ELSE wit2_vote_json(v_id, me) END;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_vote_cast(p_vote bigint, p_choice text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM wit2_votes v JOIN students s ON s.teacher_id = v.teacher_id
                 WHERE v.id = p_vote AND s.id = me AND NOT v.closed AND v.ends > now() AND p_choice = ANY (v.options)) THEN
    RAISE EXCEPTION 'votação fechada';
  END IF;
  INSERT INTO wit2_vote_ballots (vote_id, student_id, choice) VALUES (p_vote, me, p_choice)
    ON CONFLICT (vote_id, student_id) DO UPDATE SET choice = EXCLUDED.choice, at = now();
  RETURN wit2_vote_json(p_vote, me);
END $$;

-- Cartas da Aula que o aluno ganhou (as 5 últimas), para o aviso no jogo
CREATE OR REPLACE FUNCTION public.wit2_lesson_cards_mine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('card', g.card_id, 'day', l.day) ORDER BY l.day DESC)
    FROM (SELECT * FROM wit2_lesson_card_given WHERE student_id = me) g JOIN wit2_lessons l ON l.id = g.lesson_id
    WHERE l.day > current_date - 30), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.wit2_vote_json(bigint, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_teacher_vote_open(text[], int), public.wit2_teacher_vote_close(bigint), public.wit2_teacher_votes(),
  public.wit2_teacher_lesson_card(uuid, text), public.wit2_vote_current(), public.wit2_vote_cast(bigint, text), public.wit2_lesson_cards_mine()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_teacher_vote_open(text[], int), public.wit2_teacher_vote_close(bigint), public.wit2_teacher_votes(),
  public.wit2_teacher_lesson_card(uuid, text), public.wit2_vote_current(), public.wit2_vote_cast(bigint, text), public.wit2_lesson_cards_mine()
TO authenticated;

COMMIT;
