# Aplicar o banco do WIT 2

Aprovado pelo Matheus em 08/10. As migrações ficam em `supabase/migrations/2026100812*_wit2_*.sql`
e são testadas num Postgres local com `bash scripts/sql/testar-wit2.sh`. O teste usa dublês das
funções de segurança que já existem: `my_student_id`, `can_act_for_student`, `get_teacher_id` e
`can_act_for_teacher`.

## Ordem

1. **Antes de tudo:** `bash scripts/sql/testar-wit2.sh` tem de passar.
2. **Aplicar todas as `*_wit2_*.sql` em ordem de nome.** Use o conector do Supabase
   (`apply_migration`, uma por vez, com o mesmo nome do arquivo) ou
   `npx supabase db push --linked`.
   - Nenhuma delas muda tabela, função ou política do WIT 1.
3. **Rodar as checagens abaixo no SQL Editor (ou pelo `execute_sql` do conector).** Todas têm
   de dar `true`.
4. **Master:** colocar o e-mail do Matheus na lista. Assim ele vê as turmas de todos os
   professores nas abas Alunos e Missões. O e-mail não fica no repositório: rode à mão no SQL
   Editor:
   `INSERT INTO public.wit2_masters (email) VALUES (lower('<e-mail do Matheus>'));`
5. **Ligar a chave:** `VITE_WIT2_DB=1` no `.env` local e nas variáveis da Vercel (Production e
   Preview), depois um novo deploy.
6. **Testar com 2 navegadores (dois alunos de teste):**
   - os dois veem um ao outro andando na mesma área, com balão;
   - o PvP abre;
   - o pacote abre e as moedas batem nos dois aparelhos.

## Checagens depois de aplicar

```sql
-- tabelas do WIT 2 com RLS ligado
SELECT bool_and(relrowsecurity) FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relname LIKE 'wit2\_%' AND relkind = 'r';

-- anon não executa nenhuma função do WIT 2
SELECT bool_and(NOT has_function_privilege('anon', p.oid, 'EXECUTE'))
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'wit2\_%';

-- funções internas fechadas também para quem está logado
SELECT bool_and(NOT has_function_privilege('authenticated', p.oid, 'EXECUTE'))
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN ('wit2_ensure','wit2_event','wit2_draw_pack','wit2_weighted','wit2_add_card','wit2_daily_cap');

-- ninguém logado escreve direto nas tabelas de valor
SELECT bool_and(NOT has_table_privilege('authenticated', c.oid, 'INSERT')
            AND NOT has_table_privilege('authenticated', c.oid, 'UPDATE'))
FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN ('wit2_wallet','wit2_cards','wit2_packs','wit2_progress','wit2_tickets');

-- catálogo carregado: 350 cartas, 6 pacotes, 100 chefes, 8 Caminhos
SELECT (SELECT count(*) FROM wit2_card_catalog) = 350
   AND (SELECT count(*) FROM wit2_pack_defs) = 6
   AND (SELECT count(DISTINCT andar) FROM wit2_boss_cards) = 100
   AND (SELECT count(DISTINCT path_id) FROM wit2_path_cards) = 8;
```

## Desfazer (só se der errado no mesmo dia)

```sql
-- apaga só o que é do WIT 2; o WIT 1 não é tocado
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT p.oid::regprocedure AS f FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'wit2\_%'
  LOOP EXECUTE 'DROP FUNCTION ' || r.f || ' CASCADE'; END LOOP;
  FOR r IN SELECT relname FROM pg_class
           WHERE relnamespace = 'public'::regnamespace AND relname LIKE 'wit2\_%' AND relkind = 'r'
  LOOP EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.relname); END LOOP;
END $$;
```

Depois de desfazer, apague também as linhas `2026100812*_wit2_*` de
`supabase_migrations.schema_migrations`.
