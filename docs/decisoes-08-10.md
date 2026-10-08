# Decisões tomadas por mim na rodada de 08/10 (para o Matheus trocar se quiser)

Cada uma segue a proposta que já estava nos documentos. Para mudar, basta dizer qual.

| # | Decisão | O que eu fiz | Onde mudar |
|---|---|---|---|
| 1 | Teto de moedas ganhas por dia (fora da Torre e dos pacotes) | 2500 por dia. Uma tarde longa jogando dá cerca de 1500. Quem passa do teto tem o ganho cortado e é anotado como "suspeita" | `wit2_daily_cap()` na migração `_wit2_core` |
| 2 | Quem manda na Torre | O jogo (vai no JSON). O servidor só confere a carta do chefe contra o deck do andar e o ritmo de 1 carta a cada 60 s | `wit2_boss_card` |
| 3 | Coleção ao entrar no banco | Coleção inicial do servidor. A coleção que estava só no navegador não sobe; quem vem do WIT 1 recebe a migração | `wit2_ensure` |
