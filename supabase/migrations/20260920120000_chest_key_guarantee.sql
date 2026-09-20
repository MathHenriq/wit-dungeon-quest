-- ============================================================
-- chest_key: backfill + garantia no banco
--
-- Contexto
--   O overload legado open_chest(uuid, uuid) foi removido. Hoje as RPCs
--   open_chest / open_chest_v2 identificam o bau por chest_key, entao
--   qualquer chest_types com chest_key NULL simplesmente nao abre — o aluno
--   ve "Erro ao abrir o bau" sem explicacao nenhuma.
--
--   A migration 20260625120000 ja tinha feito um backfill, mas ela corrigiu
--   apenas as linhas que existiam naquele momento. Dois baus do professor
--   master continuam com chest_key NULL e ativos na loja ("Bau Lendario" e
--   "Bau fraco"), ou seja, vendidos e impossiveis de abrir.
--
-- O que muda
--   1. Backfill de novo, agora para QUALQUER linha sem chest_key (inclusive
--      baus de evento, que a migration anterior nao cobria).
--   2. Trigger BEFORE INSERT/UPDATE que preenche chest_key sozinho quando vier
--      nulo. E o que impede o problema de voltar: nao depende mais de cada
--      tela de cadastro lembrar de mandar o campo.
--
-- Idempotente: rodar de novo nao faz nada.
-- ============================================================

-- ─── 1. Backfill ────────────────────────────────────────────────────────────
UPDATE public.chest_types
SET chest_key = 'tchest_' || id::text
WHERE chest_key IS NULL;

-- ─── 2. Garantia para novas linhas ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_chest_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.chest_key IS NULL OR btrim(NEW.chest_key) = '' THEN
    -- NEW.id ja esta preenchido aqui: a coluna tem DEFAULT gen_random_uuid(),
    -- que o Postgres aplica antes dos triggers BEFORE.
    NEW.chest_key := 'tchest_' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_chest_key ON public.chest_types;
CREATE TRIGGER trg_ensure_chest_key
  BEFORE INSERT OR UPDATE ON public.chest_types
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_chest_key();

NOTIFY pgrst, 'reload schema';
