-- ═══════════════════════════════════════════════════════════════════════════
-- WIT 2: a virada (migração WIT 1 → WIT 2), PREPARADA E DESLIGADA.
--
-- A mesma regra de src/game/migration.ts (`migrateStudent`), no servidor:
--   item da loja antiga  → carta da Coleção 1 (wit2_shop_map, gerado do TS)
--   classe               → Caminho sugerido (wit2_class_path, gerado do TS)
--   moedas + diamantes   → moedas (1 diamante = 20)
--   materiais/consumíveis→ pó (metade do pó de uma carta da mesma raridade)
--   atributo + skill     → pontos do Grimório (1 a cada 10, no máximo 6)
--   nível                → Pacotes de Legado (1 Comum a cada 5, 1 Raro a cada 15, 1 Épico a cada 30)
--   títulos              → mantidos + Veterano (no progresso, em `legado`)
-- Idempotente: quem já passou fica em wit2_legacy e não ganha de novo.
-- Conta de teste fica de fora. Só o master chama. O botão no painel fica
-- desligado até o Matheus decidir o dia.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS public.wit2_shop_map (
  shop_name text PRIMARY KEY,
  card_id   text NOT NULL REFERENCES public.wit2_card_catalog(id)
);
CREATE TABLE IF NOT EXISTS public.wit2_class_path (
  ord     int  NOT NULL,       -- ordem dos Caminhos (o primeiro que bater ganha)
  word    text NOT NULL,
  path_id text NOT NULL,
  PRIMARY KEY (word)
);
CREATE TABLE IF NOT EXISTS public.wit2_legacy (
  student_id  uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  at          timestamptz NOT NULL DEFAULT now(),
  report      jsonb NOT NULL
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wit2_shop_map','wit2_class_path','wit2_legacy']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.wit2_legacy_packs(p_level int) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'comum', nullif(greatest(0, p_level) / 5, 0),
    'raro',  nullif(greatest(0, p_level) / 15, 0),
    'epico', nullif(greatest(0, p_level) / 30, 0)));
$$;

-- Caminho pela classe antiga (sem acento, minúscula, contém a palavra); padrão: desafiante
CREATE OR REPLACE FUNCTION public.wit2_path_of_class(p_class text) RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce((SELECT path_id FROM wit2_class_path
    WHERE position(word IN translate(lower(coalesce(p_class, '')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')) > 0
    ORDER BY ord LIMIT 1), 'desafiante');
$$;

-- Migra um aluno (interna; sem permissão para o público)
CREATE OR REPLACE FUNCTION public.wit2_migrate_one(p_student uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s record; v_cards int := 0; v_unknown jsonb; v_po jsonb := '{}'::jsonb; v_coins int; v_talent int;
  v_titles jsonb; v_packs jsonb; v_path text; v_report jsonb; r record; v_cons int;
BEGIN
  SELECT report INTO v_report FROM wit2_legacy WHERE student_id = p_student;
  IF FOUND THEN RETURN v_report || '{"ja": true}'::jsonb; END IF;
  SELECT * INTO s FROM students WHERE id = p_student FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'aluno não existe'; END IF;
  IF s.is_test_account THEN RETURN '{"pulado": "conta de teste"}'::jsonb; END IF;

  PERFORM wit2_ensure(p_student);

  -- cartas: o item da loja vira a carta da Coleção 1
  FOR r IN SELECT m.card_id FROM student_inventory i JOIN shop_items it ON it.id = i.item_id
           JOIN wit2_shop_map m ON m.shop_name = btrim(it.name) WHERE i.student_id = p_student LOOP
    PERFORM wit2_add_card(p_student, r.card_id, 1);
    v_cards := v_cards + 1;
  END LOOP;
  SELECT coalesce(jsonb_agg(DISTINCT it.name), '[]'::jsonb) INTO v_unknown
    FROM student_inventory i JOIN shop_items it ON it.id = i.item_id
    WHERE i.student_id = p_student AND NOT EXISTS (SELECT 1 FROM wit2_shop_map m WHERE m.shop_name = btrim(it.name));

  -- pó: materiais pela raridade e consumíveis como pó comum
  FOR r IN SELECT mt.rarity::text AS rarity, sum(round(d.gives / 2.0 * greatest(0, im.quantity)))::int AS v
           FROM student_inventory_materials im JOIN materials mt ON mt.id = im.material_id
           JOIN wit2_dust_rules d ON d.rarity = mt.rarity::text
           WHERE im.student_id = p_student GROUP BY 1 LOOP
    IF r.v > 0 THEN v_po := v_po || jsonb_build_object(r.rarity, r.v); END IF;
  END LOOP;
  SELECT coalesce(sum(greatest(0, quantity)), 0) INTO v_cons FROM student_consumables WHERE student_id = p_student;
  IF v_cons > 0 THEN
    v_po := v_po || jsonb_build_object('common', coalesce((v_po->>'common')::int, 0)
      + round((SELECT gives FROM wit2_dust_rules WHERE rarity = 'common') / 2.0 * v_cons)::int);
  END IF;
  UPDATE wit2_wallet w SET po = (SELECT coalesce(jsonb_object_agg(k, coalesce((w.po->>k)::int, 0) + coalesce((v_po->>k)::int, 0)), '{}'::jsonb)
      FROM (SELECT jsonb_object_keys(w.po) UNION SELECT jsonb_object_keys(v_po)) x(k))
    WHERE w.student_id = p_student;

  -- moedas (1 diamante = 20) e pontos do Grimório
  v_coins := greatest(0, round(s.coins))::int + greatest(0, round(s.diamonds))::int * 20;
  UPDATE wit2_wallet SET coins = coins + v_coins WHERE student_id = p_student;
  SELECT least(6, (coalesce((SELECT forca + destreza + inteligencia + carisma + agilidade + resistencia FROM student_attribute_points WHERE student_id = p_student), 0)
                 + coalesce((SELECT total_earned FROM student_skill_points WHERE student_id = p_student), 0)) / 10) INTO v_talent;

  -- títulos, pacotes de legado, Caminho sugerido
  SELECT jsonb_agg(DISTINCT t) INTO v_titles FROM (
    SELECT 'veterano' AS t
    UNION SELECT CASE title_type::text WHEN 'helper_of_week' THEN 'ajudante-semana' WHEN 'presence_guardian' THEN 'guardiao-presenca'
                                        WHEN 'attitude_example' THEN 'exemplo-atitude' END
      FROM student_titles WHERE student_id = p_student) x WHERE t IS NOT NULL;
  v_packs := wit2_legacy_packs(s.level);
  FOR r IN SELECT key, value::int AS n FROM jsonb_each_text(v_packs) LOOP
    INSERT INTO wit2_packs (student_id, pack_id, qty) VALUES (p_student, r.key, r.n)
      ON CONFLICT (student_id, pack_id) DO UPDATE SET qty = wit2_packs.qty + EXCLUDED.qty;
  END LOOP;
  v_path := wit2_path_of_class(s.character_class);
  UPDATE wit2_progress SET data = data || jsonb_build_object(
      'legado', jsonb_build_object('nivel', greatest(1, s.level), 'xp', greatest(0, s.xp), 'titulos', v_titles, 'pontos', v_talent),
      'caminhoSugerido', v_path),
    version = version + 1, updated_at = now()
    WHERE student_id = p_student;

  v_report := jsonb_build_object('cards', v_cards, 'unknownItems', v_unknown, 'coins', v_coins, 'packs', v_packs,
    'dust', v_po, 'talentPoints', v_talent, 'titles', v_titles, 'path', v_path);
  INSERT INTO wit2_legacy (student_id, report) VALUES (p_student, v_report);
  PERFORM wit2_event(p_student, 'virada', v_coins);
  RETURN v_report;
END $$;

-- master: um aluno
CREATE OR REPLACE FUNCTION public.wit2_migrate_student(p_student uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_is_master() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN wit2_migrate_one(p_student);
END $$;

-- master: como está a virada (quantos faltam, quantos já passaram, contas de teste)
CREATE OR REPLACE FUNCTION public.wit2_migrate_status() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT wit2_is_master() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'alunos', (SELECT count(*) FROM students WHERE NOT is_test_account),
    'migrados', (SELECT count(*) FROM wit2_legacy),
    'teste', (SELECT count(*) FROM students WHERE is_test_account),
    'itensSemCarta', (SELECT coalesce(jsonb_agg(DISTINCT it.name), '[]'::jsonb) FROM student_inventory i JOIN shop_items it ON it.id = i.item_id
                       WHERE NOT EXISTS (SELECT 1 FROM wit2_shop_map m WHERE m.shop_name = btrim(it.name))));
END $$;

-- master: todos de uma vez (o botão da virada). Cada aluno numa subtransação:
-- um erro não para os outros, e rodar de novo só pega quem faltou.
CREATE OR REPLACE FUNCTION public.wit2_migrate_all() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; ok int := 0; falhas jsonb := '[]'::jsonb;
BEGIN
  IF NOT wit2_is_master() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  FOR r IN SELECT id FROM students s WHERE NOT is_test_account AND NOT EXISTS (SELECT 1 FROM wit2_legacy l WHERE l.student_id = s.id) LOOP
    BEGIN
      PERFORM wit2_migrate_one(r.id);
      ok := ok + 1;
    EXCEPTION WHEN others THEN
      falhas := falhas || jsonb_build_object('aluno', r.id, 'erro', SQLERRM);
    END;
  END LOOP;
  RETURN jsonb_build_object('migrados', ok, 'falhas', falhas);
END $$;

REVOKE ALL ON FUNCTION public.wit2_migrate_one(uuid), public.wit2_legacy_packs(int), public.wit2_path_of_class(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wit2_migrate_student(uuid), public.wit2_migrate_status(), public.wit2_migrate_all() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wit2_migrate_student(uuid), public.wit2_migrate_status(), public.wit2_migrate_all() TO authenticated;

COMMIT;
