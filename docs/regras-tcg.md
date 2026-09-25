# Regras do TCG — WIT Dungeon 2

> Versão de trabalho. Tudo marcado **[aberto]** ainda precisa de decisão.

## Partida

- **Desafiante** contra **Desafiante**. O Desafiante é o jogador, com o personagem do aluno como herói. Inimigos também são Desafiantes.
- Vence quem zerar a vida do outro.
- Deck vazio não é derrota imediata: a cada compra que não puder ser feita, o jogador toma dano crescente (5, 10, 15…).
- Vida: **150** para todos.
- **Não existe teto de dano.** Se um aluno montar um combo que dá 120, o jogo está funcionando.

## Deck, mão e cemitério

- Deck de **20 cartas**. Meta de **500 cartas** no catálogo até o lançamento.
- Com deck de 20, custos de "moer o próprio deck" são pequenos (1–2 cartas).
- Até 2 cópias da mesma carta. Lendária ou acima: 1 cópia.
- Mão inicial de 5. Compra 1 por turno. Mão máxima de 7: o excesso vai para o cemitério no fim do turno.
- Quem começa **não ataca no primeiro turno**. Pokémon e Yu-Gi-Oh fazem isso para equilibrar.
- **Cemitério:** para onde vão as cartas usadas, descartadas ou destruídas. É um recurso: algumas cartas usam o cemitério como combustível.

## Sem energia: o custo é o sacrifício

Não existe energia. Como no Yu-Gi-Oh, **as cartas fortes cobram um preço**:

| Custo | Exemplo |
|---|---|
| Descartar da mão | "Descarte 2 cartas: cause 30 de dano." |
| Moer o próprio deck | "Mande as 3 cartas do topo do seu deck para o cemitério: anule o próximo dano." |
| Pagar vida | "Perca 20 de vida: compre 3 cartas." |
| Banir do cemitério | "Remova do jogo 3 cartas de Fogo do seu cemitério: próximo ataque de Fogo ×2." |
| Pular a compra | "Não compre carta no próximo turno: seu Equipamento fica indestrutível." |

**Diretriz de design:** a maioria das cartas raras para cima tem um lado bom **e** um preço. É isso que faz o aluno avaliar a carta em vez de escolher pela arte.

## Tipos de carta

| Tipo | Referência | Regra |
|---|---|---|
| **Ataque** | ataque do Pokémon | Causa dano. **1 por turno.** |
| **Desafiante** | Treinador (Pokémon) / Mágica (YGO) | Buff, cura, compra, preparação de combo. Sem limite por turno. |
| **Equipamento** | Ferramenta / Mágica de Equipamento | Fica no herói com efeito contínuo. 1 arma + 1 armadura. |
| **Armadilha** | Armadilha (YGO) | Baixada virada. Dispara no turno do inimigo quando a condição acontece. Até 3 baixadas. |
| **Campo** | Estádio / Mágica de Campo | Muda regras para os dois lados. 1 em jogo; uma nova substitui a anterior. |

**Evolução de cartas:** fica para depois do básico.

## Elementos

12 elementos, com a tabela de fraqueza que já existe no código. Ataque contra fraqueza causa ×2, contra resistência ×½.

| Elemento | Forte contra (×2) | Fraco contra (×½) | Não afeta |
|---|---|---|---|
| Fogo | Planta, Gelo, Aço | Fogo, Água | — |
| Água | Fogo, Terra | Água, Planta | — |
| Elétrico | Água, Vento | Elétrico, Planta | Terra |
| Planta | Água, Terra | Fogo, Planta, Aço, Veneno, Vento | — |
| Gelo | Planta, Terra, Vento | Fogo, Água, Gelo, Aço | — |
| Terra | Fogo, Elétrico, Aço, Veneno | Planta | Vento |
| Luta | Gelo, Aço, Sombra | Veneno, Vento | Fantasma |
| Aço | Gelo | Fogo, Água, Aço | — |
| Veneno | Planta | Terra, Veneno, Fantasma | Aço |
| Sombra | Fantasma | Luta, Sombra | — |
| Fantasma | Sombra, Fantasma | — | Luta |
| Vento | Planta, Luta | Elétrico, Aço | — |

## Combos

- Fila de **efeitos pendentes**: "seu próximo ataque de Fogo ×2" espera até ser consumido pela próxima carta de Fogo.
- Gatilhos:
  - ao jogar
  - início do turno
  - ao receber dano
  - próxima carta de tipo X
  - próxima carta de elemento X
  - quando uma carta vai para o cemitério
- Os status existentes continuam: queimar, congelar, veneno, paralisar etc.
- **Cada combo documentado vira um teste automático.** Se uma interação quebrar, o teste avisa.

## Mecânicas das cartas

| Mecânica | O que faz |
|---|---|
| **Queimadura / Veneno / Sangramento** | Dano no início do turno de quem sofre. Veneno e Sangramento acumulam; Queimadura renova. |
| **Congelado** | Não pode jogar Ataque enquanto durar. |
| **Trava** | O alvo não pode jogar um tipo de carta por N turnos. |
| **Escudo** | Anula a próxima instância de dano. |
| **Bônus guardado** | "Seu próximo Ataque de Fogo causa o dobro" fica esperando até ser usado. |
| **Aura** | Um efeito que se repete no início dos seus próximos N turnos (invocações, regeneração). |
| **Inevitável** | O ataque não ativa Armadilhas e ignora redução de dano e escudo. |
| **Refletir** | Armadilha: o ataque inimigo acerta quem atacou, com todos os bônus dele. |
| **Roubo de vida** | Recupera parte do dano que o ataque causou. |
| **Escala** | Dano que cresce com o cemitério, a mão, as rodadas, a vida perdida ou o dano recebido. |

O catálogo completo, com o texto de cada carta, está em [`cartas-tcg.md`](cartas-tcg.md).

## Como se ganha carta

Só existem **duas** formas (decidido):

1. **Conquistando.** Cada chefe tem um deck temático; derrotá-lo dá uma carta do deck dele. É repetível: duplicatas alimentam a troca e a venda entre alunos.
2. **Abrindo pacotinhos.** Os baús viram pacotinhos de cartas.

Não existe mais loja de cartas. O deck inicial do aluno também sai de pacotinhos (comuns e incomuns, com trava de jogabilidade: elemento da classe + cartas baratas suficientes).

### Pacotinho (proposta, **[aberto]**)

5 cartas por pacotinho:

| Posição | Conteúdo |
|---|---|
| 1–3 | Comum |
| 4 | Incomum |
| 5 | Rara ou melhor: Rara 70% · Épica 20% · Lendária 7% · Mítica 2,5% · Desconhecida 0,5% |

## Raridade

Raridade é **chance de sair no pacotinho**, não força. Quem equilibra a carta é o custo. A simulação de 15 mil partidas confirma: a taxa média de vitória por raridade fica entre 49% e 53%.

| Raridade | Cartas (de 300) |
|---|---|
| Comum | 105 |
| Incomum | 72 |
| Rara | 54 |
| Épica | 36 |
| Lendária | 20 |
| Mítica | 9 |
| Desconhecida | 4 |

## Inimigos

Inimigos são Desafiantes com deck e IA próprios. Visualmente, o personagem aparece **segurando ou jogando cartas**: o Naruto com cartas na mão, o Goku lançando uma carta.

Regra do projeto: **ou fica bom de verdade, ou não fazemos.** O teste de viabilidade vem antes de qualquer produção em escala.

## Visual das cartas (decidido)

- **Comum até Épica:** moldura normal. A cor da moldura indica o elemento, a arte fica numa janela, e o texto vai numa caixa abaixo.
- **Lendária, Mítica e Desconhecida:** full art. A arte ocupa a carta inteira e o texto fica sobre um degradê escuro, com borda dourada e brilho foil.
- A moldura, o texto e o brilho são feitos **em código** (HTML/CSS). Só a ilustração é imagem.
- Ilustrações geradas por script com o Animagine XL 4.0: Hugging Face para chefes e lendárias (mais fiel), AI Horde para volume. Tudo gratuito.
- Possível camada extra de colecionismo: a mesma arte numa versão normal e numa versão alternativa full art mais rara.
