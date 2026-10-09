# Sua Casa 2 — casa que se compra, se troca, tem andares e vida

> Escrito em 09/10/2026. Base: `src/game/{furniture,house-life}.ts`,
> `interior/{room,house-acts}.ts`, `world/{content,town}.ts`, `city/{HousePanels,FurnitureShop}.tsx`
> (branch `claude/masmorra`). Números são **(proposta)**. Referências: Stardew (reformas
> com a carpinteira, porão, correio), Animal Crossing (nota da casa, móvel por unidade,
> vitrine que muda todo dia), Bloxburg e Adopt Me (Roblox: casas de vários andares,
> tarefas da casa, festas).

---

## 0. Diagnóstico (respostas diretas)

**"Onde eu troco ou compro outra casa?"** Não existe. Os 10 modelos de casa
(`HOUSE_MODELS`: 3 iniciais e 7 "à venda") têm desenho de fachada, e o mapa já sabe
trocar a fachada (`town.ts` lê `opts.casa`), mas **não há tela de compra, nem campo no
progresso que guarde a casa escolhida, nem interior diferente**. Por dentro, toda casa é
o mesmo cômodo de 14×11 (`houseRoom`). Também não há segundo andar.

**"Tem muito móvel disponível."** São ~150 móveis em 14 categorias. Os 16 da casa inicial
são de graça, e a regra atual é **"comprou uma vez, põe quantas cópias quiser"**
(`furniture.ts`). Com 3 compras o aluno enche a casa de sofás iguais: por isso parece
que já tem tudo e a loja não tem graça.

**"Entra, decora um pouquinho e acabou."** Os móveis já fazem coisas (25 ações em
`house-acts.ts`: dormir, cozinhar, TV, aquário...), mas nada disso tem **meta**: não há
nota, coleção, visita que conte, nem motivo para voltar amanhã.

---

## 1. Móvel vira coisa que se tem (por unidade)

- Cada móvel tem **quantidade**. Colocar gasta 1; tirar devolve ao baú. Quer 2 cadeiras?
  Compra 2.
- **Kit inicial com escolha:** no primeiro acesso o aluno escolhe **1 de 3 estilos**
  (Rústico, Moderno, Fofo). Cada estilo dá ~12 peças: cama, sofá ou poltrona, mesa,
  2 cadeiras, armário, tapete, luz, planta, janela, relógio. Assim cada essencial tem só
  **2 ou 3 opções de graça**, como o Matheus pediu; o resto se conquista.
- **Quem já jogou não perde nada:** ganha 1 unidade de cada móvel que está colocado e de
  cada um que comprou (`progress.moveis` vira `Record<id, quantidade>`).

### De onde vem móvel (cada fonte dá um motivo para jogar outra parte do jogo)

| Fonte | O que dá |
|---|---|
| **Loja de Móveis: vitrine do dia** | 8 móveis sorteados por dia + 4 básicos fixos. Viu e não comprou? Amanhã é outra vitrine. É o motivo de passar na loja todo dia (Animal Crossing) |
| **Catálogo** | o que o aluno já teve pode ser **encomendado** de novo (chega no dia seguinte) |
| **Carpintaria** | móveis feitos com madeira, pedra, tecido e minério (receitas) |
| Fazenda | vasos com plantas da horta, velas, sabonete, cesto de ovos dourados, troféu da Feira |
| Lago | aquário maior, peixe na placa (recorde), geodo de ametista, luminária de cristal |
| Torre e Masmorra | troféu de chefe a cada 10 andares (já previsto), espada na parede |
| Festas do ano | móveis exclusivos da estação (fogueira junina, árvore de Natal, abóbora de Halloween) |
| História | móveis únicos: Relógio do Farol, Espelho da Geada, Baú da Aurora |
| Ateliê de Arte | quadros pintados por alunos (o cavalete já faz pixel art) |
| Caminhão do Seu Bento | móveis raros de "outras cidades" |

### Conjuntos
~15 conjuntos com nome (Quarto Gamer, Cozinha da Vó, Sala Japonesa, Quarto Kawaii, Casa
de Praia, Laboratório WIT, Castelo, Espaço Sideral, Jardim de Inverno, Festa Junina...).
Conjunto completo num cômodo dá pontos na nota (§4) e um título ("Decorador(a)
Gamer").

---

## 2. Casas que se compram e se trocam

### Imobiliária da Dandara (a carpinteira do Vale, a "Robin" do Stardew)
Fica no Centro (prédio novo) e faz três coisas: **vender casa**, **trocar fachada** e
**reformar**. Obra leva 1 a 3 dias de verdade (andaime na frente da casa).

Separamos **tamanho** (o que tem dentro) de **fachada** (o desenho de fora). Assim os 10
desenhos que já existem servem para qualquer tamanho, e o aluno combina.

| Tamanho | Dentro | Preço (proposta) | Em aulas de 90 min |
|---|---|---|---|
| Quarto (o de hoje) | 1 cômodo 14×11 | grátis | — |
| Casa | sala + quarto | 4.000 | ~7 |
| Sobrado | 2 andares, 2 cômodos em cada, **escada** | 12.000 | ~22 |
| Casarão | 2 andares + **porão** + **quintal** | 25.000 | ~45 |
| Mansão | 3 andares + porão + quintal + **garagem** | 50.000 | ~90 |

| Fachada | Preço |
|---|---|
| Chalé, Tijolo, Moderna (as 3 iniciais) | grátis |
| Futurista, Japonesa, Montanha | 1.500 a 3.000 |
| Gamer, Mini Castelo | 5.000 |
| **Casa na Árvore** e **Casa Foguete** | especiais: interior próprio (escada de corda; 3 andares redondos com cabine) |

**Pagar:** à vista com 10% de desconto ou em 10 parcelas semanais sem juros, descontadas
das moedas toda segunda. Se faltar dinheiro, aparece um aviso e a parcela espera: **a
casa nunca é tomada**. Ensina a conta "à vista ou parcelado?" sem assustar.

### Andares
- A **escada** é um móvel especial que o aluno põe onde quiser; ela liga um andar ao
  outro (o motor dos interiores já tem saída `subir` na Torre, `room.ts`).
- Cada andar tem o seu piso e a sua parede.
- **Porão:** adega para curar queijo e doce (vale mais a cada semana), despensa.
- **Sótão** (fachadas com telhado alto): onde a história esconde o **Baú da Aurora**
  (`docs/historia.md`, Ato 2).

### Reformas (sem trocar de casa)
Cozinha completa, banheiro, varanda, cômodo extra, **quintal** (horta pequena, flores,
árvore, piscina no verão, casinha de passarinho), **garagem** (os veículos que o aluno
comprou ficam expostos; pintar o carro).

---

## 3. Coisas para fazer em casa

### Tarefas da casa (Bloxburg, curtinhas)
Arrumar a cama, lavar a louça, tirar o lixo, estender a roupa no varal, regar as plantas,
dar comida ao pet, tirar o pó. Cada uma é um minijogo de 5 a 15 segundos. Casa
arrumada no dia dá o **bônus Casa Arrumada**: +10% de experiência nas profissões e a fome
desce mais devagar. **Robô aspirador** (feito na Casa IoT) faz 2 tarefas sozinho: a
tecnologia paga de volta.

### Cozinha de verdade
- **Livro de receitas** (~60; hoje são 7 em `life.ts`), com ingredientes da fazenda e do
  lago.
- **Programa de culinária na TV** (a TV já existe): toda semana uma receita nova (o "Queen
  of Sauce" do Stardew). Perdeu? Reprise no sábado.
- Receitas também chegam por **carta** de moradores amigos.
- Comida dá **efeito** na vida, nunca no duelo: sorte na pesca, +oxigênio no mergulho,
  andar mais rápido na fazenda, mais tempo no desfile relâmpago.

### Closet e penteadeira (liga com a Passarela)
Guarda as roupas, salva looks, troca o visual (o guarda-roupa já abre o VISUAL). **Máquina
de costura**: transforma tecido da fazenda em peças (`docs/passarela.md`).

### Parede das conquistas
Carta favorita **emoldurada** (o TCG dentro de casa), peixe na placa, geodo, troféus de
chefe, medalhas das festas, fotos do álbum em porta-retrato, prêmio do desfile.

### Correio
A caixa de correio na frente da casa (já desenhada no mapa) passa a receber **cartas**:
receitas, presentes de aniversário dos moradores, convites de festa, e as cartas da
**história**. É o canal principal da lore: o aluno abre a porta e tem carta nova.

### Calendário na parede
Aniversários dos moradores, festas do ano, dia da feira.

### Pet de casa
Comida, carinho, brincar (bolinha). Pet feliz aprende truques (sentar, rolar, dar a
pata) que ele mostra na cidade.

### Visita de morador
Moradores com 6 corações ou mais (§ amizade em `docs/historia.md`) batem na porta de vez
em quando, sentam no sofá e conversam: cena curta, às vezes com presente.

---

## 4. Nota da Casa (o motivo de decorar)

Toda semana a **Associação de Decoração do Vale** (Dona Íris, a florista) avalia a casa e
dá de 1 a 5 estrelas, como o Happy Home do Animal Crossing.

| Conta ponto | Exemplo de dica que ela dá |
|---|---|
| Variedade e quantidade de móveis | "A sala está vazia perto da janela." |
| Conjuntos completos | "Falta só a luminária para o Quarto Gamer." |
| **Cores que combinam** (piso, parede, móveis: cores vizinhas ou opostas no círculo de cores) | "O sofá verde ficaria lindo com um tapete vermelho, que é a cor oposta." |
| Plantas e luz | "Uma luz perto do sofá deixa a sala aconchegante." |
| Móveis que funcionam | |
| Peças raras (gema, troféu, carta emoldurada) | |
| Casa arrumada (tarefas do dia) | |

- Estrelas dão um prêmio pequeno toda semana e um **selo na porta** que aparece no mapa.
- **Casa da Semana** da turma: os colegas visitam e dão estrelas, como no desfile (mesmo
  sistema de voto da Passarela, sem mostrar quem votou).
- Ensina o círculo de cores (cores análogas e complementares) aplicando, não decorando.

---

## 5. Festa 2.0

Hoje o botão FESTA só avisa os amigos por 30 minutos. Passa a ter:

| Parte | Como |
|---|---|
| Tema | aniversário, pijama, junina, Halloween, jogos, piscina (com quintal) |
| Convites | lista de amigos; chega no correio deles |
| Comida | o que o aluno cozinhou fica na mesa; convidados comem |
| Música | discos compostos pelos alunos (o toca-discos já toca) |
| Brincadeiras | **dança das cadeiras** com as cadeiras que estão na casa, batata quente, pista de dança (emotes no ritmo) |
| Nota da festa | convidados dão estrelas; festa boa dá prêmio ao dono e aos convidados |
| Moradores | amigos com muitos corações também aparecem |

Precisa do servidor (os colegas já se veem em tempo real por `presence.ts`; hoje a
visita é "só para ver").

---

## 6. Para meninas e para meninos (sem separar)

Nada é "de menina" ou "de menino" no catálogo. Mas há o que puxa cada gosto:
- **Quarto Kawaii, penteadeira, closet, jardim, festa do pijama, nota de decoração.**
- **Garagem com os veículos, sala gamer com PC que se melhora com peças da Casa IoT,
  parede de troféus de chefe, Casa Foguete e Mini Castelo, carta lendária emoldurada.**

---

## 7. Progressão

| Trilha | Degraus |
|---|---|
| Casa | Quarto → Casa → Sobrado → Casarão → Mansão |
| Fachadas | 10 (2 especiais) |
| Catálogo | % dos móveis que já teve |
| Conjuntos | 15 |
| Nota | estrelas acumuladas → nível de Decorador(a) |
| Receitas | 60 |

| Quando | Aluno de 2 aulas por semana |
|---|---|
| 1ª semana | kit inicial, primeiros móveis da vitrine, 1ª nota (2 estrelas) |
| 1º mês | Casa de 2 cômodos, 1 conjunto completo, primeira festa |
| 3 meses | Sobrado com escada, nota 4, 20 receitas |
| 6 meses | Casarão com porão e quintal |
| 1 ano | Mansão (para os persistentes), catálogo quase completo |

---

## 8. O que a casa ensina

Orçamento e "à vista ou parcelado?" · círculo de cores · área e perímetro (a **planta
baixa** no modo DECORAR mostra os metros quadrados de cada cômodo) · automação (robô
aspirador, luz inteligente) · cozinhar com o que se produziu.

---

## 9. Ordem de construção

| Onda | Entrega | Arte nova |
|---|---|---|
| C1 | Móvel por unidade, kit inicial com 3 estilos, migração, vitrine do dia, catálogo | nenhuma (usa o atlas) |
| C2 | Imobiliária: comprar tamanho e fachada, Casa de 2 cômodos, parcelas | prédio da imobiliária, porta entre cômodos |
| C3 | Sobrado: escada e andares; porão; reformas | escada, piso de porão |
| C4 | Nota da Casa, Casa da Semana, correio, calendário, tarefas da casa | caixa de correio aberta, varal, pia com louça |
| C5 | Festa 2.0 (servidor), visitas de moradores, quintal, garagem | quintal, piscina |

Código: `houseRoom` vira `houseFloors(tamanho): Room[]`; `Placed` ganha o andar;
`progress.casa = { tamanho, fachada, andares }`; `town.ts` já recebe a fachada por
`opts.casa`; `sanitizeHouse` por andar; a casa já é salva no banco (decisão de 08/10).
