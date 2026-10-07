# WIT 2: desenho do banco (proposta para aprovar)

> **07/10: o SQL está escrito e testado, mas NÃO aplicado.**
> `docs/sql/wit2-banco.sql` (tabelas, RLS, funções) + `docs/sql/wit2-seed.sql`
> (catálogo gerado por `npx vite-node scripts/sql/wit2-seed.ts`). Teste num
> Postgres local com dublês do Supabase: `bash scripts/sql/testar-wit2.sh`
> (22 verificações). O jogo já tem a camada `src/game/cloud.ts`, desligada; liga
> com `VITE_WIT2_DB=1` depois de aplicar. Ficou fora de `supabase/migrations`
> de propósito, para não subir num deploy sem o OK.

> **Só desenho.** Nada aqui foi aplicado no Supabase. RPC, LGPD e segurança
> só mudam com pedido explícito do Matheus (ver `CLAUDE.md` e
> `docs/LGPD_SEGURANCA.md`). Hoje o WIT 2 guarda tudo no navegador
> (`wit.progresso`, `wit.fazenda`, `wit.fotos`, casa); este documento diz
> onde cada coisa vai morar quando ligar no banco.

## 1. Princípios

1. **Moeda, carta e pacote só mudam no servidor.** Nunca "lê, soma e grava"
   no navegador (plano §7.5). O navegador pede; uma função (RPC) confere e grava.
2. **O sorteio do pacotinho é no servidor** (senão dá para "rolar de novo"
   recarregando a página). A função devolve as 5 cartas; a tela só anima.
3. **O resto do progresso é um JSON por aluno** (visual, casa, fazenda,
   diário do lago, músicas, profissões, missões...). Ele não vale dinheiro, e
   um JSON evita 30 tabelas pequenas. Gravado com número de versão para não
   perder nada quando o aluno joga em dois aparelhos.
4. **Só nickname aparece para outros alunos.** Nada novo de dado pessoal: sem
   foto real, sem turma, sem escola. As fotos da câmera do jogo (`wit.fotos`)
   ficam **só no aparelho** (são prints do jogo; não sobem).
5. **Uma tabela de eventos enxuta** para as métricas do Matheus (plano §9),
   em vez de tabelas de diárias pré-geradas.

## 2. Tabelas

| Tabela | Colunas principais | Quem lê | Quem escreve |
|---|---|---|---|
| `wit2_wallet` | `student_id` (pk), `coins`, `po` (jsonb por raridade), `sem_epica`, `updated_at` | o aluno, o professor dele | só RPC |
| `wit2_cards` | `student_id`, `card_id`, `qty` (pk: aluno + carta) | o aluno, o professor dele; outros alunos só via view de troca | só RPC |
| `wit2_packs` | `student_id`, `pack_id`, `qty` (pacotes fechados guardados) | o aluno, o professor | só RPC |
| `wit2_tower` | `student_id` (pk), `tower_max`, `andar`, `wins` (jsonb `foeId → vezes`) | o aluno, o professor | só RPC |
| `wit2_decks` | `student_id`, `slot` (0–3), `cards` (text[] de 20), `active` | o aluno | o aluno (RPC confere se ele tem as cartas) |
| `wit2_progress` | `student_id` (pk), `data` (jsonb), `version` (int), `updated_at` | o aluno | o aluno (`wit2_save_progress`, com versão) |
| `wit2_lessons` | `id`, `teacher_id`, `day` (date), `delivered_at`, `default_packs` (jsonb) | o professor | o professor (RPC) |
| `wit2_attendance` | `lesson_id`, `student_id`, `status` (`faltou`/`presente`/`foi_bem`/`excepcional`), `pack_id`, `via_code` (bool) | o professor; o aluno vê só as próprias linhas | só RPC |
| `wit2_events` | `id`, `student_id`, `kind` (texto curto), `value` (int), `at` | professor (dos alunos dele), master | só RPC / trigger |

**O que vai em `wit2_progress.data`** (é o `Progress` de hoje menos as
colunas acima): `fome`, `itens`, `profissao`, `xp`, `stats`, `jogos`,
`missoes`, `mercado`, `entrega`, `campo`, `musicas`, `materias`, `jornal`,
`jornalDia`, `diario`, `diarioDia`, `recordes`, `grimorio`, `verso`,
`titulo`, `caminho`, `caminhoSugerido`, `legado`, `mat`, `mats`. A
fazenda (`wit.fazenda`) e a casa entram também, em chaves próprias.

> Itens que valem moeda no Mercado (peixes, pães, discos) ficam no JSON por
> enquanto: o preço é baixo e a venda paga em moeda passa pela RPC
> `wit2_sell`, que confere o que o aluno diz ter contra um teto diário.

## 3. Funções (RPC)

Todas com `security definer`, conferindo quem chama (`my_student_id()` /
`can_act_for_teacher`), como as do WIT 1.

| Função | Faz | Confere |
|---|---|---|
| `wit2_buy_pack(p_pack)` | tira moedas, sorteia o pacote (regras de `packs.ts` + garantia) e grava as cartas | saldo; preço vem do servidor |
| `wit2_open_saved_pack(p_pack)` | abre um pacote guardado | se tem |
| `wit2_forge(p_card)` / `wit2_disenchant(p_card, p_n)` | pó ↔ carta (`forge.ts`) | só duplicata; pó suficiente |
| `wit2_duel_result(p_foe, p_won, p_turns, p_log_hash)` | moedas e carta do chefe (`applyDuel`) | foe existe e está liberado; vitória rápida demais vira suspeita (registra evento, não paga); teto de moedas por hora |
| `wit2_save_deck(p_slot, p_cards)` | grava o deck | 20 cartas, cópias, se tem as cartas |
| `wit2_save_progress(p_data, p_version)` | grava o JSON | versão igual à do banco (senão devolve a do banco para juntar); tamanho máximo 200 KB |
| `wit2_sell(p_item, p_n)` | vende no Mercado | teto diário de moedas do Mercado |
| `wit2_teacher_lesson(p_day)` | cria/abre a aula do dia e devolve a lista dos alunos do professor **numa consulta só** | professor |
| `wit2_teacher_deliver(p_lesson, p_rows jsonb)` | grava presença e desempenho de todos e entrega os pacotes, **numa transação** | professor; aluno é dele; uma entrega por aula (refazer = corrigir) |
| `wit2_class_code(p_lesson)` / `wit2_join_code(p_code)` | código de 4 dígitos que troca a cada 30 s; o aluno digita e a presença marca sozinha | código atual ou o anterior (tolerância de 30 s) |

## 4. Aula de hoje (o que a tela do professor faz)

1. Abre com a lista dos alunos dele (`wit2_teacher_lesson`).
2. Opcional: código no projetor; quem digita entra como "presente".
3. Um toque por aluno: faltou → presente → foi bem → excepcional.
4. Pacote padrão: presente = Comum · foi bem = Raro · excepcional = Épico
   (plano §4.2). O professor troca o pacote de um aluno quando quiser.
5. **ENTREGAR** grava tudo de uma vez (`wit2_teacher_deliver`).
6. O aluno recebe o aviso no jogo e o pacote aparece em MEUS PACOTES.

A regra pura (status, pacote padrão, resumo da entrega, código) está em
`src/game/lesson.ts`, e a tela de demonstração com dados de mentira em
`/professor/aula-demo`.

## 5. Migração (dia da virada)

`src/game/migration.ts` (`migrateStudent`) converte um aluno do WIT 1 sem
tocar no banco: quem rodar a virada lê `students`, `student_inventory` +
`shop_items` (nome do item), `student_inventory_materials`, consumíveis,
pontos e `student_titles`, chama a função e grava o resultado nas tabelas
acima. Conta de teste (`is_test_account`) fica de fora. O relatório lista os
itens que não viraram carta, para conferir antes.

## 6. Em aberto (decidir com o Matheus)

- Pacotes de Legado por nível: proposta em `legacyPacks` (1 Comum a cada 5
  níveis, 1 Raro a cada 15, 1 Épico a cada 30).
- Teto de moedas por hora no duelo e no Mercado (números saem da simulação
  `scripts/tcg-torre.ts`).
- Quanto tempo guardar `wit2_events` (sugestão: 1 ano, resumido por semana
  depois disso).
