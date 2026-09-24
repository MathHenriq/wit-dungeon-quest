# Regras do TCG — WIT Dungeon 2

> Versão de trabalho. Tudo marcado **[aberto]** ainda precisa de decisão.

## Partida

- **Desafiante** contra **Desafiante**. O Desafiante é o jogador, com o personagem do aluno como herói. Inimigos também são Desafiantes.
- Vence quem zerar a vida do outro, ou quem fizer o outro precisar comprar carta com o deck vazio (regra do Yu-Gi-Oh).
- Vida: entre 100 e 250 **[aberto — proposta: 150]**.
- **Não existe teto de dano.** Se um aluno montar um combo que dá 120, o jogo está funcionando.

## Deck, mão e cemitério

- Deck de **30 cartas [aberto]**. Subi de 20 porque várias cartas vão cobrar "mande cartas do deck para o cemitério", e com 20 o jogo acabaria por falta de carta.
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

## Como se ganha carta

1. **Deck inicial** aleatório: comuns + incomuns, com trava de jogabilidade (elemento da classe + 1 sorteado, cartas baratas suficientes).
2. **Chefes:** cada chefe tem um deck temático. Derrotá-lo dá uma carta do deck dele. **É repetível**: cartas duplicadas alimentam troca e venda entre alunos.
3. **Baús.**
4. **Loja.**

As funções de **troca** e **venda** ficam, porque são o destino natural das duplicatas.

## Inimigos

Inimigos são Desafiantes com deck e IA próprios. Visualmente, o personagem aparece **segurando ou jogando cartas**: o Naruto com cartas na mão, o Goku lançando uma carta.

Regra do projeto: **ou fica bom de verdade, ou não fazemos.** O teste de viabilidade vem antes de qualquer produção em escala.
