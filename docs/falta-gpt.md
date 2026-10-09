# O que falta do GPT (lista para gerar de uma vez) — 08/10

Tudo o que não depende de arte já está no jogo. Esta lista é só o que
espera imagem. Os prompts estão em `docs/PROMPTS-GPT.md` (seção indicada) e
o importador de cada um está na própria seção. Toda imagem é revisada uma
por uma antes de subir (público infantil).

## Prioridade 1: aparece toda hora

| O quê | Quantas | Prompt | Até lá, o jogo usa |
|---|---|---|---|
| Masmorra nova (branch `claude/masmorra`): inimigos (+7 novos da §9), chefes E–S, boneco em combate, armas, lugares, perigos e salas novas (§9), saguão, ícones, sombras, efeitos das 67 cartas | ~105 folhas | `docs/gpt-masmorra.md` (importador `importar-masmorra.py`) | pets como monstros, desafiante como chefe, armas e efeitos desenhados em código |
| Veículos com o boneco montado (anexar `modelo-01.png`) | 4 folhas + avião | §N | só o rastro do veículo |
| Poses dos modelos 03 a 10 (sentar, carregar, emotes) | 8 folhas | §A | a pose do modelo 01 adaptada |
| Ícones definitivos | 4 folhas (127 ícones) | §G | ícones CC0 provisórios |

## Prioridade 2: coleção e personalização

| O quê | Quantas | Prompt | Até lá, o jogo usa |
|---|---|---|---|
| Desafiantes novos (mesas e chefes da Torre) | ~100 | `docs/prompts-personagem.md` | os 13 desafiantes que já existem, repetidos |
| Pets novos | ~50 | `docs/prompts-interiores.md` | os 30 pets atuais |
| Pet dragãozinho (refazer: o atual parece o Spyro) | 1 | `docs/prompts-interiores.md` | fora do jogo |
| Roupas e cabelos em camadas | ~30 | `docs/prompts-personagem.md` | troca de cor nas cores-molde |
| Tapete Monstrinhos | 1 | seção dos tapetes | aparece como EM BREVE |

## Prioridade 3: mundo e profissões

| O quê | Quantas | Prompt | Até lá, o jogo usa |
|---|---|---|---|
| Cerca vertical da Fazenda | 1 | Fazenda | cerca por código |
| Cenas das tarefas que esperam arte: ordenha e tosa, bolo decorado, drone até o farol, show com palco e plateia | 4 cenas | §H (pedir no mesmo estilo) | a tarefa não aparece |
| Florista, Inventor e Bibliotecária: prédio e cena de cada um (proposta, decisão 12) | 6 | a escrever quando o Matheus aprovar | não existem |
