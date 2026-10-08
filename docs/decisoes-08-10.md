# Decisões tomadas por mim na rodada de 08/10 (para o Matheus trocar se quiser)

Cada uma segue a proposta que já estava nos documentos. Para mudar, basta dizer qual.

| # | Decisão | O que eu fiz | Onde mudar |
|---|---|---|---|
| 1 | Teto de moedas ganhas por dia (fora da Torre e dos pacotes) | 2500 por dia. Uma tarde longa jogando dá cerca de 1500. Quem passa do teto tem o ganho cortado e é anotado como "suspeita" | `wit2_daily_cap()` na migração `_wit2_core` |
| 2 | Quem manda na Torre | O jogo (vai no JSON). O servidor só confere a carta do chefe contra o deck do andar e o ritmo de 1 carta a cada 60 s | `wit2_boss_card` |
| 3 | Coleção ao entrar no banco | Coleção inicial do servidor. A coleção que estava só no navegador não sobe; quem vem do WIT 1 recebe a migração | `wit2_ensure` |
| 4 | Lote próprio da fazenda | O campo já é de cada aluno (cada um tem o seu); não fiz um lote separado | `farm.ts` |
| 5 | Estações e chuva | Estação de 7 dias, chuva em 1 a cada 4 dias (no verão, 1 a cada 10), feira aos sábados com +50% | `farm.ts` |
| 6 | Preço dos móveis | De 60 a 760 moedas, pelo tipo e pelo tamanho; os da casa inicial são de graça | `furniture.ts` |
| 7 | Aviãozinho | A viagem pelo mapa continua grátis para todo mundo; com o avião ela vira um voo animado (cosmético) | `WorldMap.tsx` |
| 8 | Mural da turma | Só frases da lista e fotos do álbum do jogo; foto só aparece com aprovação do professor; até 6 postagens por dia | `_wit2_world.sql` |
| 9 | Evolução de carta | 3 cópias: 2 são gastas, mais metade do pó de forjar a carta; vira a versão "+" (10% mais força no efeito). A simulação dá +0,5 ponto de vitória em média, sem nenhuma "+" fora da faixa | `forge.ts` (`evolveCost`), `evolve.ts`, `wit2_evolve` |
| 10 | Troca de profissão | A 1ª escolha é livre; depois, 1 troca por dia. A experiência de cada profissão fica guardada | `life.ts` (`canChangeProfession`) |
| 11 | Efeito do pet no duelo | Todo pet faz a mesma coisa: o "faro", 1 vez por duelo no seu turno. Mostra a carta do topo do deck e você escolhe deixar ou mandar para o fundo. A IA não usa | `engine.ts` (`sniff`) |
| 12 | Florista, Inventor e Bibliotecária | Só proposta (abaixo), não entrou no jogo. Cada uma precisa de um prédio e de uma cena, que são arte do GPT | este arquivo |
| 13 | Tarefas de profissão que faltavam | Entraram as que não precisam de arte nem de servidor: Conserto dos postes (IoT, no mapa), Pesquisa de mercado (Comerciante, no mapa) e Compra e venda (Comerciante, tabela de preços). As outras esperam arte ou servidor (lista abaixo) | `fieldwork.ts`, `lessons2.ts` |
| 14 | Pacotes de Legado | 1 Comum a cada 5 níveis, 1 Raro a cada 15, 1 Épico a cada 30 (nível 20 = 4 Comuns + 1 Raro). Ficam guardados para abrir quando quiser | `legacyPacks` em `migration.ts` e `wit2_legacy_packs` (as duas juntas) |
| 15 | A virada | Fica pronta e desligada. Ela só roda pelo botão do master, e o botão só liga com `VIRADA_LIGADA = true`. Aplicar o banco não migra ninguém | `teacher-cloud.ts`, `_wit2_virada.sql` |

## Proposta: 3 profissões novas (decisão 12)

| Profissão | Lugar | Divertida | Ensina | No mapa |
|---|---|---|---|---|
| Florista | Floricultura na praça do Centro | Montar buquês com as flores da horta; o morador dá nota | Polinização: abelha leva o pólen, a flor vira fruto | Regar os canteiros da cidade |
| Inventor | Oficina do Inventor na Cidade WIT | Montar uma geringonça com peças da forja | Alavanca e roldana: menos força, mais caminho | Achar peças perdidas (sucata) |
| Bibliotecária | Biblioteca no Centro | Organizar a estante pela ordem alfabética, contra o relógio | Classificar por assunto, como na biblioteca de verdade | Devolver livros atrasados nas casas |

A experiência viria das ações que já existem. A Florista ganharia ao colher flores, o Inventor ao forjar e a Bibliotecária ao ler o Jornal WIT. O que falta para entrar é o prédio e a cena de cada uma, que ficam na lista do GPT.

## Tarefas de profissão que ainda esperam

- **Arte do GPT:** ordenha e tosa, encomenda de bolo decorado, drone até o farol, show com palco e plateia.
- **Servidor (entre alunos):** torneio do maior peixe, feira dos colegas, galeria com votos, murais pintados na cidade, correio entre alunos, ensinar o WIT-Bot (precisa de texto livre moderado pelo professor).
