-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: telas do professor (alunos, ficha, missões da sala) e o master.
--
-- Master: quem tem o e-mail na tabela wit2_masters vê as turmas de todos os
-- professores (o Matheus). A tabela nasce VAZIA: o e-mail entra à mão, no SQL
-- Editor, depois de aplicar (docs/sql/APLICAR.md). Nada de e-mail no repositório.
--
-- Missão da sala: o professor marca uma meta para a turma inteira (ex.: 200
-- duelos vencidos nesta semana). Conta pelos eventos 'stat:<contador>' que o
-- wit2_sync grava; batida a meta, cada aluno pega 1 pacote guardado.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_masters (
  email  text PRIMARY KEY CHECK (email = lower(email))
);
CREATE TABLE IF NOT EXISTS public.wit2_class_missions (
  id          bigserial PRIMARY KEY,
  teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (length(title) BETWEEN 3 AND 60),
  kind        text NOT NULL,
  target      int NOT NULL CHECK (target BETWEEN 1 AND 100000),
  pack_id     text NOT NULL REFERENCES public.wit2_pack_defs(id),
  starts      timestamptz NOT NULL DEFAULT now(),
  ends        timestamptz NOT NULL,
  CHECK (ends > starts)
);
CREATE TABLE IF NOT EXISTS public.wit2_mission_claims (
  mission_id  bigint NOT NULL REFERENCES public.wit2_class_missions(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (mission_id, student_id)
);
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_masters','wit2_class_missions','wit2_mission_claims']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- ═══ internas ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.wit2_is_master() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM wit2_masters WHERE email = lower(coalesce(auth.jwt()->>'email', '')));
$$;

-- de qual professor olhar: o próprio, ou (só o master) o escolhido
CREATE OR REPLACE FUNCTION public.wit2_teacher_scope(p_teacher uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id();
BEGIN
  IF p_teacher IS NOT NULL AND p_teacher IS DISTINCT FROM me THEN
    IF NOT wit2_is_master() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
    RETURN p_teacher;
  END IF;
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN me;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_mission_progress(p_mission bigint) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(sum(e.value), 0)::int
  FROM wit2_class_missions m
  JOIN students s ON s.teacher_id = m.teacher_id
  JOIN wit2_events e ON e.student_id = s.id AND e.kind = 'stat:' || m.kind AND e.at BETWEEN m.starts AND m.ends
  WHERE m.id = p_mission;
$$;

CREATE OR REPLACE FUNCTION public.wit2_mission_json(m wit2_class_missions) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('id', m.id, 'title', m.title, 'kind', m.kind, 'target', m.target, 'pack', m.pack_id,
    'starts', m.starts, 'ends', m.ends, 'progress', wit2_mission_progress(m.id), 'ativa', now() BETWEEN m.starts AND m.ends);
$$;

-- ═══ professor ═══════════════════════════════════════════════════════════════

-- o master escolhe de qual professor ver
CREATE OR REPLACE FUNCTION public.wit2_master_teachers() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_is_master() THEN RETURN '[]'::jsonb; END IF;
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.name,
      'alunos', (SELECT count(*) FROM students s WHERE s.teacher_id = t.id)) ORDER BY t.name) FROM teachers t), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_students(p_teacher uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid := wit2_teacher_scope(p_teacher);
BEGIN
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id', s.id, 'nome', coalesce(s.character_name, s.name),
      'apelido', (SELECT nick FROM wit2_profile WHERE student_id = s.id),
      'andar', coalesce((SELECT (data->>'towerMax')::int FROM wit2_progress WHERE student_id = s.id), 1),
      'moedas', coalesce((SELECT coins FROM wit2_wallet WHERE student_id = s.id), 0),
      'cartas', coalesce((SELECT sum(qty) FROM wit2_cards WHERE student_id = s.id), 0),
      'ultimo', (SELECT max(at) FROM wit2_events WHERE student_id = s.id),
      'suspeitas', (SELECT count(*) FROM wit2_events WHERE student_id = s.id AND kind = 'suspeita' AND at > now() - interval '7 days'),
      'presencas', (SELECT count(*) FROM wit2_attendance a WHERE a.student_id = s.id AND a.status <> 'faltou'))
    ORDER BY coalesce(s.character_name, s.name)) FROM students s WHERE s.teacher_id = tid), '[]'::jsonb);
END $$;

-- ficha do aluno: números, presença e os últimos 60 eventos
CREATE OR REPLACE FUNCTION public.wit2_teacher_student(p_student uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid := (SELECT teacher_id FROM students WHERE id = p_student); d jsonb;
BEGIN
  PERFORM wit2_teacher_scope(tid);
  IF tid IS DISTINCT FROM get_teacher_id() AND NOT wit2_is_master() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT data INTO d FROM wit2_progress WHERE student_id = p_student;
  RETURN jsonb_build_object(
    'andar', coalesce((d->>'towerMax')::int, 1), 'profissao', d->>'profissao', 'caminho', (SELECT caminho FROM wit2_wallet WHERE student_id = p_student),
    'stats', coalesce(d->'stats', '{}'::jsonb),
    'moedas', coalesce((SELECT coins FROM wit2_wallet WHERE student_id = p_student), 0),
    'porRaridade', coalesce((SELECT jsonb_object_agg(rarity, n) FROM (SELECT c.rarity, sum(w.qty) AS n FROM wit2_cards w JOIN wit2_card_catalog c ON c.id = w.card_id WHERE w.student_id = p_student GROUP BY c.rarity) x), '{}'::jsonb),
    'aulas', coalesce((SELECT jsonb_agg(jsonb_build_object('dia', l.day, 'status', a.status) ORDER BY l.day DESC)
      FROM wit2_attendance a JOIN wit2_lessons l ON l.id = a.lesson_id WHERE a.student_id = p_student), '[]'::jsonb),
    'eventos', coalesce((SELECT jsonb_agg(jsonb_build_object('kind', kind, 'value', value, 'at', at) ORDER BY at DESC)
      FROM (SELECT * FROM wit2_events WHERE student_id = p_student ORDER BY at DESC LIMIT 60) e), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_mission_create(p_title text, p_kind text, p_target int, p_pack text, p_days int) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := get_teacher_id(); v_id bigint;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF NOT p_kind = ANY (wit2_stat_keys()) OR p_days NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'missão inválida'; END IF;
  IF (SELECT count(*) FROM wit2_class_missions WHERE teacher_id = me AND ends > now()) >= 5 THEN RAISE EXCEPTION 'missões demais'; END IF;
  INSERT INTO wit2_class_missions (teacher_id, title, kind, target, pack_id, ends)
    VALUES (me, btrim(p_title), p_kind, p_target, p_pack, now() + make_interval(days => p_days)) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_missions(p_teacher uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid := wit2_teacher_scope(p_teacher);
BEGIN
  RETURN coalesce((SELECT jsonb_agg(wit2_mission_json(m) || jsonb_build_object('pegaram', (SELECT count(*) FROM wit2_mission_claims c WHERE c.mission_id = m.id)) ORDER BY m.ends DESC)
    FROM wit2_class_missions m WHERE m.teacher_id = tid AND m.ends > now() - interval '30 days'), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_teacher_mission_end(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE wit2_class_missions SET ends = greatest(starts + interval '1 second', now()) WHERE id = p_id AND teacher_id = get_teacher_id() AND ends > now();
  RETURN FOUND;
END $$;

-- ═══ aluno ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.wit2_class_missions_mine() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN coalesce((SELECT jsonb_agg(wit2_mission_json(m) || jsonb_build_object('peguei', EXISTS (SELECT 1 FROM wit2_mission_claims c WHERE c.mission_id = m.id AND c.student_id = me))
      ORDER BY m.ends)
    FROM wit2_class_missions m JOIN students s ON s.teacher_id = m.teacher_id
    WHERE s.id = me AND m.ends > now() - interval '3 days'), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.wit2_mission_claim(p_id bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := my_student_id(); m wit2_class_missions%ROWTYPE;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  SELECT x.* INTO m FROM wit2_class_missions x JOIN students s ON s.teacher_id = x.teacher_id WHERE x.id = p_id AND s.id = me;
  IF m.id IS NULL THEN RAISE EXCEPTION 'missão não encontrada'; END IF;
  IF wit2_mission_progress(m.id) < m.target THEN RAISE EXCEPTION 'a turma ainda não chegou lá'; END IF;
  INSERT INTO wit2_mission_claims (mission_id, student_id) VALUES (m.id, me) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM wit2_ensure(me);
  INSERT INTO wit2_packs (student_id, pack_id, qty) VALUES (me, m.pack_id, 1)
    ON CONFLICT (student_id, pack_id) DO UPDATE SET qty = wit2_packs.qty + 1;
  PERFORM wit2_event(me, 'missao', 1);
  RETURN true;
END $$;

-- ── quem pode chamar o quê ───────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.wit2_teacher_scope(uuid), public.wit2_mission_progress(bigint), public.wit2_mission_json(wit2_class_missions)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION
  public.wit2_is_master(), public.wit2_master_teachers(), public.wit2_teacher_students(uuid), public.wit2_teacher_student(uuid),
  public.wit2_teacher_mission_create(text, text, int, text, int), public.wit2_teacher_missions(uuid), public.wit2_teacher_mission_end(bigint),
  public.wit2_class_missions_mine(), public.wit2_mission_claim(bigint)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.wit2_is_master(), public.wit2_master_teachers(), public.wit2_teacher_students(uuid), public.wit2_teacher_student(uuid),
  public.wit2_teacher_mission_create(text, text, int, text, int), public.wit2_teacher_missions(uuid), public.wit2_teacher_mission_end(bigint),
  public.wit2_class_missions_mine(), public.wit2_mission_claim(bigint)
TO authenticated;

COMMIT;
