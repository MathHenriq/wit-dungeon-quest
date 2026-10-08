# Rodada 08/10: banco + tudo que não depende do GPT

## Contexto
Os 7 blocos de ontem estão no ar (branch `claude/wonderful-pascal-xgm4zi`). O Matheus liberou
mexer no banco e pediu para seguir com tudo o que não depende do GPT. A arte ele gera quando só
faltar ela.

O que ele decidiu:
- **Banco:** ele conecta o conector do Supabase em claude.ai/customize/connectors e abre uma
  sessão nova. Nesta sessão eu deixo tudo pronto e testado num Postgres local; na sessão nova eu
  aplico e confiro no banco real.
- **Virada:** fica preparada, sem virar. O WIT 1 continua no ar.
- **Pós-lançamento:** entra tudo, inclusive a dungeon com arte provisória.

Toda decisão da lista §N segue a proposta que já está nos documentos e fica anotada em
`docs/decisoes-08-10.md`, para ele trocar.

Como os containers somem entre sessões, este plano vai versionado em `docs/plano-rodada-08-10.md`.

## Ciclo de cada bloco (igual ao de ontem)
1. Fazer.
2. Rodar `npm run typecheck`, `npm test` e `npm run test:build`.
3. Se mexeu no SQL, rodar `bash scripts/sql/testar-wit2.sh`.
4. Tirar print do que mudou na tela.
5. Atualizar o `CLAUDE.md`.
6. Commit e push.
7. Mandar um resumo curto e seguir para o próximo bloco.

---

## Bloco 1. Banco pronto para aplicar
- Passar `docs/sql/wit2-banco.sql` e `wit2-seed.sql` para
  `supabase/migrations/20261008xxxxxx_wit2_*.sql`, sem editar nenhuma migração antiga.
- Juntar as tabelas que os blocos 3 a 5 precisam, cada uma em migração própria e testada no
  Postgres local com `scripts/sql/stubs-supabase.sql`:

  | Tabela | Para quê |
  |---|---|
  | `wit2_trades` | trocas entre alunos |
  | `wit2_market_listings` | venda entre alunos |
  | `wit2_market_prices` | Mercado compartilhado |
  | `wit2_friends` | amizades |
  | `wit2_house` | casa salva no servidor, para as visitas |
  | `wit2_reports` | denúncias |
  | `wit2_guilds` e `wit2_guild_members` | guilda |
  | `wit2_pvp_matches` | PvP online |
  | `wit2_events_vote` | eventos com votação |
  | `wit2_lesson_card` | Carta da Aula |
  | `wit2_legacy` | virada |

- Seguir o padrão que já existe:
  - leitura por RLS com `can_act_for_student`;
  - escrita só por função `SECURITY DEFINER`;
  - `revoke` do público.
- Cada função recebe um teste em `scripts/sql/teste-wit2.sql`.
- Escrever `docs/sql/APLICAR.md` com a ordem e com as checagens para depois de aplicar
  (papéis `anon`, `authenticated`, aluno e professor), no modelo de `docs/LGPD_SEGURANCA.md`.
- **Na sessão nova, com o conector:**
  1. Aplicar as migrações.
  2. Rodar as checagens de papel no banco real.
  3. Ligar `VITE_WIT2_DB=1` no `.env` e na Vercel. Se a Vercel não estiver ao meu alcance, deixo
     o passo escrito para ele.
  4. Testar com 2 navegadores: presença, balão, PvP e troca.

## Bloco 2. Social (G)
- **Perfil ao clicar:** um cartão com apelido, título, Caminho, andar, 3 cartas favoritas e
  botões ADICIONAR AMIGO, DESAFIAR, TROCAR e DENUNCIAR.
  - O clique acerta o colega pelo bloco tocado, com `peers` no `CityDemo`.
- **Amizades:** pedir e aceitar, com lista na mochila (aba AMIGOS).
- **Visitas:** a Sua Casa do amigo abre só para ver, a partir da `wit2_house`. A casa passa a
  salvar no servidor também.
- **Balão:** continua só com frases prontas, sem texto livre. A denúncia fica no cartão de
  perfil e cai na fila do professor.
- **Guilda nova:**
  - entrar por código;
  - meta de presença da semana;
  - chefe compartilhado, com vida comum que todos derrubam com vitórias da semana;
  - mentoria: o veterano ganha bônus quando o novato sobe de andar;
  - sede: o Castelo mostra as 4 mesas da guilda do aluno.

## Bloco 3. Trocas, venda e Mercado compartilhado (F.4, F.5, D.4)
- **Troca:** carta por carta ou carta por moedas, nas mesas de troca da Oficina e pelo cartão de
  perfil.
  - Oferta, aceite e cancelamento são feitos por função do servidor, de forma atômica.
  - Sem o banco, aparece a mensagem "precisa estar online".
- **Venda:** o aluno anuncia a duplicata com preço dentro de uma faixa por raridade, para evitar
  golpe entre crianças. A aba VITRINE fica na Oficina.
- **Mercado:** os preços passam a ser um só no servidor. A função `market.ts` é a mesma,
  rodando lá.

## Bloco 4. PvP online em tempo real (H)
- A mesa LIVRE da Arena tem um botão ESPERAR ONLINE. O colega que senta na frente entra na partida.
- Cada lado manda só a jogada pelo canal Realtime `wit2-pvp-<id>`. Os dois rodam o mesmo motor
  com a mesma semente, porque o `engine.ts` é puro e o RNG tem semente. O servidor guarda o
  resultado em `wit2_pvp_matches`.
- Se alguém cair, há 60 s de espera e depois vitória por W.O.
- Teste: reproduzir uma partida a partir da lista de jogadas dá o mesmo estado nos dois lados.

## Bloco 5. Professor (J)
- **Aula de hoje de verdade:**
  - presença;
  - código;
  - entrega em lote;
  - aviso no jogo, como faixa "Seu professor mandou X" ao abrir.
- **Telas novas:**
  - Alunos: lista, ficha com progresso e o histórico de eventos;
  - Missões da sala: o professor cria uma meta da turma e ela aparece no mural do jogo;
  - Denúncias: ver, resolver e silenciar o balão do aluno.
- **Permissão de master pelo e-mail:** uma lista no banco, sem mexer nas RPCs de segurança que
  já existem.
- **Fotos da turma:** ficam fora. São dado pessoal, e o LGPD é da outra sessão; entram na lista
  de decisões dele.

## Bloco 6. Mundo e casa (E)
- **Avião:** viagem rápida entre pistas. Ganha uma tela de voo por código e sai do mapa-múndi.
- **Interiores das casas novas** (Lago, Fazenda, Cidade WIT): uma função por sala em `room.ts`
  com o atlas de 395 móveis. O teste de sala garante que dá para chegar em tudo.
- **Loja de móveis no shopping:** o catálogo vem do `manifest.json` do atlas, com preço por
  categoria.
- **Fazenda, segunda onda:**
  - estações a cada 7 dias, com plantas por estação;
  - chuva como efeito de partícula, que rega sozinha;
  - adubo;
  - qualidade da colheita;
  - feira de sábado;
  - lote próprio.
  - Apicultura e máquinas usam móveis do atlas que sirvam; se nada servir, viram item da lista
    de GPT.
- **Mural de postagens:** frases prontas e fotos do álbum, moderado pelo professor.
- **Sala Virtual do Metaverso:** uma sala que o aluno monta com blocos e coordenadas, ligada à
  lição de coordenadas 3D.
- **Fases de fliperama feitas pelos alunos:** editor em grade, com a fase compartilhada pelo
  servidor.
- **Música da cidade:** trilha por área e hora no `synth.ts`, com botão de mudo.
- **Casa:** festa (convidar amigos), plantas que crescem e estante de troféus com as conquistas.

## Bloco 7. TCG e profissões (C, D)
- **Evolução de cartas:**
  - 3 cópias e pó viram a versão "+" com 10% mais força;
  - a força entra pelo efeito, não pelo texto;
  - o texto continua saindo de `describeCard`;
  - toda carta passa pela simulação `tcg-simular.ts`.
- **Efeito dos pets no duelo:** pequeno e cosmético-tático (ex.: 1 espiada no topo por duelo),
  testado no motor.
- **Profissões:**
  - as 5 tarefas por profissão de `docs/profissoes-tarefas.md` que ainda faltam;
  - regra de troca de profissão: guarda o XP e há espera de 1 dia;
  - Florista, Inventor e Bibliotecária, com prédios do atlas e anotadas como proposta.
- **Telas de lições refeitas** no kit pixel (`PxPanel` e `GameStage`).

## Bloco 8. Virada preparada, sem virar (L)
- Pacotes de Legado pela proposta de `migration.ts`.
- `migrateStudent` portado para uma função no servidor, `wit2_migrate_student`, que é
  idempotente.
- Teste com cópia dos dados num Postgres local.
- Botão de virada só no painel master, desligado.
- Medir o desempenho no celular com a arte nova (`npm run perf`) e corrigir o que cair.
- Comercial: um vídeo com `video-cidade.mjs` e prints do duelo, para ele revisar.

## Bloco 9. Pós-lançamento (M), tudo
- **Eventos com votação:** os alunos votam no tema da próxima coleção; o professor abre e fecha
  a votação.
- **Carta da Aula:** uma carta especial da semana, entregue pelo professor com a presença.
- **Minigames na casa:** fliperama e quebra-cabeça nos móveis que já existem (`house-acts.ts`).
- **Tapetes animados:** brilho e partículas por código no tapete do duelo.
- **Dungeon estilo Soul Knight:**
  - salas geradas;
  - tiro e esquiva;
  - inimigos e chefe que dão cartas;
  - arte provisória com sprites que já existem (NPCs, pets, móveis);
  - os prompts do GPT da dungeon vão para `docs/PROMPTS-GPT.md` (§O).

## Fica para o GPT (lista no fim, para ele gerar de uma vez)
- Veículos com o boneco.
- Poses dos modelos 03 a 10.
- Tapete Monstrinhos.
- Cerca da Fazenda.
- Pet dragãozinho.
- Cerca de 50 pets.
- Roupas e cabelo em camadas.
- Cerca de 100 desafiantes.
- Arte da dungeon e o que surgir nos blocos 6 e 7.

## Arquivos principais
- **Banco:**
  - `supabase/migrations/20261008*_wit2_*.sql`
  - `scripts/sql/{stubs-supabase,teste-wit2}.sql`
  - `src/game/cloud.ts`
  - `src/game/presence.ts`
- **Cidade e salas:**
  - `src/pages/CityDemo.tsx`
  - `src/components/city/InteriorView.tsx`
  - `src/game/interior/room.ts`
  - `src/game/farm.ts`
  - `src/components/city/*`
- **Duelo e cartas:**
  - `src/lib/tcg/{engine,types,describe}.ts`
  - `src/components/duel/*`
- **Professor:** `src/pages/TeacherLessonDemo.tsx` (vira a tela de verdade) e `src/game/lesson.ts`.
- **Lógica nova** em arquivos puros com testes:
  - `src/game/{social,trades,guild,pvp-online,dungeon,evolution,seasons}.ts`

## Verificação
- Em cada bloco: typecheck, testes, `test:build`, testes de SQL locais e prints.
- **Multijogador:** sem o banco real, o teste é por unidade (presença, replay do PvP, trocas
  atômicas no Postgres local). O teste com 2 navegadores fica para a sessão com o conector.
