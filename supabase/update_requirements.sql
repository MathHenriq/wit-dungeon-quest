-- ============================================================
-- Atualiza coluna `requirement` de todas as 156 habilidades
-- Tier 1:  5–12  (aleatório)
-- Tier 2: 18–25  (aleatório)
-- Tier 3: 35–45  (aleatório)
-- Tier 4: 60     (fixo)
-- ============================================================

UPDATE abilities
SET requirement = CASE
  WHEN tier = 1 THEN floor(random() * 8  + 5 )::integer   -- 5  a 12
  WHEN tier = 2 THEN floor(random() * 8  + 18)::integer   -- 18 a 25
  WHEN tier = 3 THEN floor(random() * 11 + 35)::integer   -- 35 a 45
  WHEN tier = 4 THEN 60
END;

-- Verificação: contagem por tier com min/max do requirement gerado
SELECT
  tier,
  count(*)        AS total_habilidades,
  min(requirement) AS req_min,
  max(requirement) AS req_max
FROM abilities
GROUP BY tier
ORDER BY tier;
