-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: mural de postagens da turma, fases de fliperama feitas pelos alunos e
-- avisos (festa na casa).
--
-- Mural: frase pronta (sem texto livre) ou foto do álbum do jogo (retrato da
-- TELA do jogo, nunca câmera). Foto só aparece depois que o professor aprova.
-- Fase de fliperama: a grade que o aluno montou (validada aqui: tamanho e
-- peças conhecidas); aparece direto (não tem texto nem imagem).
-- Tudo limitado à turma do mesmo professor; até 6 postagens por dia.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_posts (
  id          bigserial PRIMARY KEY,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('frase','foto','fase')),
  frase       int CHECK (frase BETWEEN 0 AND 30),
  foto        text CHECK (foto IS NULL OR (foto LIKE 'data:image/jpeg;base64,%' AND length(foto) < 160000)),
  fase        jsonb CHECK (fase IS NULL OR octet_length(fase::text) < 4000),
  titulo      int CHECK (titulo BETWEEN 0 AND 30),   -- nome da fase: também da lista pronta
  approved    boolean NOT NULL DEFAULT false,
  hidden      boolean NOT NULL DEFAULT false,
  plays       int NOT NULL DEFAULT 0,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wit2_posts_class ON public.wit2_posts (teacher_id, at DESC);

CREATE TABLE IF NOT EXISTS public.wit2_notices (
  id          bigserial PRIMARY KEY,
  to_student  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('festa')),
  from_handle text NOT NULL,
  from_nick   text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now(),
  expires     timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS wit2_notices_to ON public.wit2_notices (to_student, expires);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_posts','wit2_notices']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- fase válida: {"w":12,"h":8,"t":"<w*h letras de . # o x s e>"} com 1 início (s) e 1 saída (e)
CREATE OR REPLACE FUNCTION public.wit2_level_ok(p jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_typeof(p) = 'object'
     AND (p->>'w') ~ '^[0-9]+$' AND (p->>'h') ~ '^[0-9]+$'
     AND (p->>'w')::int BETWEEN 6 AND 16 AND (p->>'h')::int BETWEEN 5 AND 10
     AND length(p->>'t') = (p->>'w')::int * (p->>'h')::int
     AND (p->>'t') ~ '^[.#oxse]+$'
     AND length(p->>'t') - length(replace(p->>'t', 's', '')) = 1
     AND length(p->>'t') - length(replace(p->>'t', 'e', '')) = 1;
$$;

CREATE OR REPLACE FUNCTION public.wit2_post(p_kind text, p_frase int, p_foto text, p_fase jsonb, p_titulo int) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF (SELECT muted_until > now() FROM wit2_profile WHERE student_id = me) THEN RAISE EXCEPTION 'silenciado'; END IF;
  IF (SELECT count(*) FROM wit2_posts WHERE student_id = me AND at > now() - interval '1 day') >= 6 THEN RAISE EXCEPTION 'postagens demais hoje'; END IF;
  IF p_kind = 'frase' AND p_frase IS NULL THEN RAISE EXCEPTION 'postagem inválida'; END IF;
  IF p_kind = 'foto' AND p_foto IS NULL THEN RAISE EXCEPTION 'postagem inválida'; END IF;
  IF p_kind = 'fase' AND NOT coalesce(wit2_level_ok(p_fase), false) THEN RAISE EXCEPTION 'fase inválida'; END IF;
  INSERT INTO wit2_posts (student_id, teacher_id, kind, frase, foto, fase, titulo, approved)
  VALUES (me, (SELECT teacher_id FROM students WHERE id = me), p_kind,
          CASE WHEN p_kind = 'frase' THEN p_frase END, CASE WHEN p_kind = 'foto' THEN p_foto END,
          CASE WHEN p_kind = 'fase' THEN p_fase END, CASE WHEN p_kind = 'fase' THEN p_titulo END,
          p_kind <> 'foto')
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- mural da turma (o que já pode aparecer) + as minhas (mesmo esperando aprovação)
CREATE OR REPLACE FUNCTION public.wit2_mural() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); tid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT teacher_id INTO tid FROM students WHERE id = me;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'frase', p.frase, 'foto', p.foto, 'fase', p.fase,
      'titulo', p.titulo, 'plays', p.plays, 'at', p.at, 'minha', p.student_id = me, 'esperando', NOT p.approved,
      'nick', (SELECT nick FROM wit2_profile WHERE student_id = p.student_id),
      'handle', (SELECT handle FROM wit2_profile WHERE student_id = p.student_id)) ORDER BY p.at DESC)
    FROM (SELECT * FROM wit2_posts WHERE teacher_id = tid AND NOT hidden AND (approved OR student_id = me)
          ORDER BY at DESC LIMIT 40) p), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_level_played(p_id bigint) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE wit2_posts SET plays = plays + 1 WHERE id = p_id AND kind = 'fase'
    AND teacher_id = (SELECT teacher_id FROM students WHERE id = my_student_id());
$$;

CREATE OR REPLACE FUNCTION public.wit2_post_delete(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wit2_posts SET hidden = true WHERE id = p_id AND student_id = my_student_id();
  RETURN FOUND;
END $$;

-- ── festa: avisa os amigos (vale 30 min) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.wit2_party() RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); n int := 0; f record; h text; nk text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT handle, nick INTO h, nk FROM wit2_profile WHERE student_id = me;
  IF h IS NULL THEN RAISE EXCEPTION 'sem perfil'; END IF;
  IF EXISTS (SELECT 1 FROM wit2_notices WHERE from_handle = h AND at > now() - interval '1 hour') THEN RAISE EXCEPTION 'uma festa por hora'; END IF;
  FOR f IN SELECT CASE WHEN a = me THEN b ELSE a END AS who FROM wit2_friends WHERE status = 'amigos' AND (a = me OR b = me) LOOP
    INSERT INTO wit2_notices (to_student, kind, from_handle, from_nick, expires) VALUES (f.who, 'festa', h, nk, now() + interval '30 minutes');
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_notices_mine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('kind', kind, 'handle', from_handle, 'nick', from_nick, 'at', at) ORDER BY at DESC)
    FROM wit2_notices WHERE to_student = me AND expires > now()), '[]'::jsonb);
END $$;

-- ── professor: fotos esperando aprovação e esconder postagem ─────────────────
CREATE OR REPLACE FUNCTION public.wit2_teacher_posts() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'frase', p.frase, 'foto', p.foto, 'at', p.at,
      'esperando', NOT p.approved, 'aluno', coalesce(s.character_name, s.name)) ORDER BY p.approved, p.at DESC)
    FROM (SELECT * FROM wit2_posts WHERE teacher_id = me AND NOT hidden ORDER BY at DESC LIMIT 60) p JOIN students s ON s.id = p.student_id), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_post_moderate(p_id bigint, p_ok boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wit2_posts SET approved = p_ok, hidden = NOT p_ok WHERE id = p_id AND teacher_id = get_teacher_id();
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.wit2_level_ok(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_post(text, int, text, jsonb, int), public.wit2_mural(), public.wit2_level_played(bigint), public.wit2_post_delete(bigint),
  public.wit2_party(), public.wit2_notices_mine(), public.wit2_teacher_posts(), public.wit2_teacher_post_moderate(bigint, boolean)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_post(text, int, text, jsonb, int), public.wit2_mural(), public.wit2_level_played(bigint), public.wit2_post_delete(bigint),
  public.wit2_party(), public.wit2_notices_mine(), public.wit2_teacher_posts(), public.wit2_teacher_post_moderate(bigint, boolean)
TO authenticated;

COMMIT;
