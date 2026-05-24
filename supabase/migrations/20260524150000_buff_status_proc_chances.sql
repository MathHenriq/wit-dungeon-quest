-- ═══════════════════════════════════════════════════════════════════════════
-- Patch 2.0: Status effects (paralisia, sangramento, etc.) pareciam não
-- funcionar para alunos de nível baixo:
--
--   - effect_chance baixa (10-25%) era multiplicada por
--   - block_chance ainda menor (paralyze 25%, freeze 50%)
--   - Total efetivo: ~2.5% de bloqueio por ataque
--
-- O engine já recebeu boost (paralyze 25→50%, freeze 50→70%, confuse 33→45%,
-- duração paralyze/freeze 2→3 turnos).
--
-- Esta migration eleva as effect_chance no DB pra status crowd-control
-- e DoT (paralyze, freeze, stun, bleed) ficarem visivelmente impactantes
-- desde os primeiros andares.
-- ═══════════════════════════════════════════════════════════════════════════

-- Suma +0.15 nas chances baixas (≤ 0.40), mantendo cap em 0.70.
-- Não toca em chances já altas (electric_13 = 1.00 etc).
UPDATE public.abilities
SET effect_chance = LEAST(0.70, effect_chance + 0.15)
WHERE effect_type IN ('paralyze','freeze','stun','bleed','burn','poison','sleep','confuse')
  AND effect_chance IS NOT NULL
  AND effect_chance <= 0.40;

-- Floor mínimo: nenhuma proc de crowd-control fica abaixo de 0.20.
UPDATE public.abilities
SET effect_chance = 0.20
WHERE effect_type IN ('paralyze','freeze','stun','bleed','burn','poison','sleep','confuse')
  AND effect_chance IS NOT NULL
  AND effect_chance < 0.20;

NOTIFY pgrst, 'reload schema';
