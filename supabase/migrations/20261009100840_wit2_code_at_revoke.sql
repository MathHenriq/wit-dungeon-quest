-- wit2_code_at é interna (usada por wit2_class_code e wit2_join_code, que são SECURITY DEFINER);
-- ficou sem REVOKE na _wit2_core.sql e herdou EXECUTE de PUBLIC (a 2ª checagem do APLICAR.md dava false).
-- Aplicada no projeto em 09/10 com este nome e versão.
REVOKE ALL ON FUNCTION public.wit2_code_at(uuid, bigint) FROM PUBLIC, anon, authenticated;
