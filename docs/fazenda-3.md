# Fazenda do Vale, 3ª onda — de "planta e colhe" a um jogo inteiro

> Escrito em 09/10/2026. Base: o código da branch `claude/masmorra` (`src/game/farm.ts`,
> `items.ts`, `life.ts`, `FarmPanel.tsx`) e a pesquisa em `docs/frentes-vida.md` §Fontes.
> Tudo com número é **(proposta)**: calibrar com `npx vite-node scripts/economia.ts`
> antes de virar regra. Referência máxima: Stardew Valley. Referência de Roblox que as
> crianças jogam hoje: Grow a Garden (mutações, clima, estoque que renova).

---

## 0. Onde estamos

| Já existe | Falta (o que deixa a fazenda "sem graça") |
|---|---|
| 7 plantas, estágios, regar, colher | Variedade: 7 plantas acabam em uma tarde |
| Estações de 7 dias, chuva, feira de sábado (+50%) | Clima que muda o jogo (só a chuva faz algo) |
| Adubo e qualidade normal/prata/ouro | Solo, rotação, gigantes, variedades raras |
| Ovos, leite e lã "uma vez por dia" (só apertar ESPAÇO) | **Bichos de verdade**: nome, carinho, fome, limpeza, filhote |
| Caixa de envio que paga no dia seguinte | **Quem compra o quê, e quando** (preço por época, compradores) |
| Irrigador (IoT), receitas simples na Casa da Fazenda | **Máquinas**: leite vira queijo, trigo vira farinha, algodão vira tecido |
| Prédios desenhados (silo, moinho, estufa, celeiro) | Os prédios não fazem nada ("em breve") |
| Rota do leite, encomendas, calendário da horta | Metas de meses: coleção, prêmios, sítio que cresce |

O dia da fazenda dura **12 minutos de jogo** (`DAY_MS`), e quem volta depois de um tempo
ganha **no máximo 1 dia** (`catchUp`). Isso é bom (ninguém perde nada por faltar), mas
faz um "ano" da fazenda caber em ~6 horas de jogo. A solução está no §1.

---

## 1. Dois relógios

| Relógio | Anda quando | O que usa |
|---|---|---|
| **Dia da fazenda** (12 min, como hoje) | o aluno está jogando | hortaliças, bichos, máquinas rápidas, estações |
| **Dia de verdade** (calendário) | sempre, mesmo fora do jogo | árvores, café, cacau, mel, seda, queijo curado, obras da carpintaria |

O ciclo curto dá o que fazer **hoje**. O ciclo longo dá o motivo para **voltar semana que
vem**: a muda de jabuticaba plantada na segunda dá fruto na outra segunda. Nada do ciclo
longo precisa de rega nem morre por falta do aluno.

---

## 2. A rotina da manhã (o "loop" de 10 a 20 minutos)

Painel **TAREFAS DO SÍTIO** (canto da tela, só na fazenda), que vai marcando o que já foi feito:

| Hora do jogo | Tarefa | O que acontece se esquecer |
|---|---|---|
| 6h | Abrir o galinheiro e o celeiro | Bichos ficam presos: menos carinho |
| Manhã | Pegar os ovos nos ninhos (cada galinha, o seu) | Nada se perde: ovo espera no ninho |
| Manhã | Encher o cocho (feno do silo) no inverno ou em dia de chuva | Bicho com fome não produz amanhã |
| Manhã | Ordenhar, tosar, escovar | Sem leite/lã hoje |
| Qualquer hora | Carinho em cada bicho (1 vez por dia) | Afeto não sobe |
| Dia sim, dia não | **Limpar o chiqueiro** e o estábulo (vassoura + água) | Porco triste não fuça trufa |
| Qualquer hora | Regar, colher, recolher das máquinas, cortar capim | Como hoje |
| 19h | Fechar o galinheiro | **Uma galinha foge**: aparece em algum canto do mapa e o aluno leva de volta (sem perda, só a caçada) |

Regras de ouro: **nada morre, nada se perde para sempre**. Esquecer custa a produção
do dia seguinte, nunca o bicho. Cada tarefa leva de 2 a 15 segundos; a graça é a
rotina, não o trabalho braçal. Mais tarde a tecnologia automatiza (§9), como o
Stardew faz com o comedouro automático.

---

## 3. Bichos

Cada bicho é **do aluno**, tem **nome** (dado por ele, com o mesmo filtro do apelido,
`nickOk`) e um **afeto de 0 a 5 corações**.

| Sobe o afeto | Desce o afeto |
|---|---|
| Carinho (1 vez por dia) | Dormir com fome |
| Comer (pasto lá fora ou feno) | Ficar preso o dia todo |
| Lugar limpo | Chiqueiro/estábulo sujo |
| Sair no sol (primavera a outono) | Esquecido fora à noite |
| Escovar / petisco (cenoura, maçã) | — |

Afeto muda o produto: 0–2 corações = normal; 3–4 = **grande**; 5 = chance de **dourado**.

| Bicho | Mora | Produto | Cuidado especial | Libera (proposta) |
|---|---|---|---|---|
| Galinha | Galinheiro | Ovo (branco/caipira), ovo grande, **ovo dourado** (5 corações, raro) | Abrir e fechar a porta | Início |
| Pata | Galinheiro + lagoa | Ovo de pata, **pena** (moda: plumas) | Gosta de nadar | Galinheiro 2 |
| Coelha angorá | Galinheiro 3 | **Pelo de angorá** (tecido macio) | Escovar | Galinheiro 3 |
| Vaca | Celeiro | Leite, leite grande | Ordenhar, escovar | Celeiro 1 |
| Cabra | Celeiro | Leite de cabra | Pula a cerca quebrada (consertar) | Celeiro 2 |
| Ovelha | Celeiro | **Lã** a cada 3 dias | Tosar | Celeiro 2 |
| Porco | Celeiro 3 | **Trufa** (fuça no pasto em dia de sol) | **Limpar o chiqueiro**; poça de lama deixa feliz | Celeiro 3 |
| Abelhas | Colmeia (apiário) | **Mel** com sabor da flor mais perto (girassol, laranjeira, lavanda) e cera | Flores a até 5 blocos | Nível 12 |
| Bicho-da-seda | Sericultura | **Casulo → seda** (a peça mais nobre da moda) | Folha de amoreira todo dia | História, Ato 2 |
| Cavalo | Estábulo | Montaria (corre na grama, onde a bicicleta não vai) | Escovar, cenoura | Nível 15 |
| Peixes (tilápia, pacu, camarão) | Tanque | Peixe de criação | Ração | Nível 18 (liga com o Lago) |

**Filhotes:** a chocadeira transforma ovo fértil em pintinho em 3 dias; com 5 corações e
celeiro com espaço, "chegou um bezerrinho" (evento curto, sem detalhe). O filhote cresce em
5 dias da fazenda. Assim o aluno não precisa só comprar: ele **cria**.

**Pets ajudam** (os pets já existem): cachorro espanta corvos do campo; gato espanta os
ratos do silo.

> Ensina: porco rola na lama porque quase não sua — a lama é o "ar-condicionado" dele.

---

## 4. Silo, feno e silagem

O pedido do Matheus ("mais questões do silo") vira o centro do planejamento de inverno.

1. **Foice** (ferramenta nova) corta o capim do pasto. O capim rebrota em 4 dias.
2. Capim cortado vira **feno** e vai direto para o silo. Silo 1 guarda 240.
3. Primavera a outono: bicho solto come o pasto de graça. **Inverno e chuva: só feno.**
   O aluno precisa guardar antes: 6 bichos × 7 dias de inverno = 42 feno. É o primeiro
   "plano de verdade" que a fazenda pede.
4. **Silagem:** milho (a planta inteira) + capim, silo **vedado** por 3 dias → silagem.
   Uma silagem vale 2 dias de comida e dá +afeto. Se o aluno abrir antes, estraga
   (vira composto, não some).
5. **Sensor de umidade** (vem da Casa IoT): avisa quando a silagem está úmida demais
   para estragar. Ligação direta com o curso de IoT.
6. Sem gato: os ratos comem 1% do feno por dia. Com gato ou ratoeira, nada.

| Silo | Guarda | Custo (proposta) | Extra |
|---|---|---|---|
| Madeira | 240 | grátis com a foice | — |
| Metal | 480 | ~3 aulas | Mostra o nível de fora |
| Inteligente (IoT) | 720 | ~10 aulas | **Enche o cocho sozinho** às 6h |

> Ensina: silagem é capim fermentado sem ar, como o iogurte é leite fermentado. Por isso
> o silo tem que ficar vedado.

---

## 5. Plantas: de 7 para ~55

Legenda: P primavera, V verão, O outono, I inverno · `r` = rebrota a cada N dias ·
`*` = já existe. Preços na mesma escala de hoje (`farm.ts`: abóbora vende 28).

### Hortaliças e grãos (dia da fazenda)

| Planta | Estações | Dias | Rebrota | Semente | Venda | Vira |
|---|---|---|---|---|---|---|
| Cenoura* | P O I | 3 | | 2 | 5 | bolo |
| Alface* | P O I | 3 | | 2 | 5 | salada |
| Morango* | P V | 4 | r2 | 5 | 6 | geleia |
| Tomate* | V O | 4 | r2 | 5 | 6 | molho, conserva |
| Milho* | V O | 5 | | 4 | 12 | fubá, pipoca, **silagem** |
| Girassol* | P V | 4 | | 3 | 9 | óleo, mel de girassol |
| Abóbora* | O I | 6 | | 8 | 28 | torta, **gigante** |
| Feijão | P V O | 4 | | 2 | 6 | **devolve força à terra** (leguminosa) |
| Amendoim | V | 5 | | 3 | 9 | paçoca (Festa Junina), leguminosa |
| Batata | P O | 5 | | 3 | 9 | |
| Alho | P I | 6 | | 4 | 14 | tempero |
| Couve-flor | P | 6 | | 8 | 26 | **gigante** |
| Ervilha | I P | 4 | r2 | 3 | 6 | leguminosa |
| Melancia | V | 7 | | 10 | 35 | suco, **gigante** |
| Pimenta | V | 4 | r2 | 4 | 7 | conserva |
| Maracujá | V O | 6 | r3 | 8 | 10 | suco (treliça) |
| Quiabo | V | 4 | r2 | 3 | 6 | |
| Batata-doce | O | 5 | | 3 | 10 | |
| Beterraba | O I | 5 | | 3 | 9 | **corante rosa** |
| Trigo | O I | 5 | | 2 | 7 | **farinha** (Moinho → Padaria) |
| Uva | O | 8 | r3 | 10 | 14 | suco, passas (treliça) |
| Berinjela | O | 5 | r2 | 4 | 8 | |
| Couve | I O | 3 | r2 | 2 | 4 | |
| Brócolis | I | 5 | | 4 | 12 | |
| Mandioca | P V O | 8 a 16 | | 4 | 14 → 30 | farinha, tapioca. **Quanto mais tempo na terra, maior a raiz** |
| Cana | O | 10 | r5 | 6 | 20 | açúcar, rapadura (Engenho) |
| Abacaxi | V | 14 | | 12 | 45 | suco |

### Matéria-prima da moda (liga Fazenda → Passarela)

| Planta | Estações | Dias | Vira |
|---|---|---|---|
| Algodão | V | 7 | fio → **tecido de algodão** |
| Urucum | V O | 6 | **corante vermelho** |
| Anil | O | 7 | **corante azul** |
| Cúrcuma | I | 7 | **corante amarelo** |
| Rosa | P V | 5 (r3) | buquê, corante rosa claro |
| Lavanda | P V | 6 (r4) | sachê, sabonete, mel de lavanda, corante lilás |

Com vermelho, azul e amarelo o aluno **mistura as outras cores** na Tinturaria (a lição
"misturar cores" do Artista já usa o modelo RYB das tintas).

### Árvores e perenes (dia de verdade)

Plantou a muda, ela leva **7 dias de verdade** para crescer e depois dá fruto todo dia
da fazenda na sua estação. Não precisa regar.

| Árvore | Estação do fruto | Detalhe |
|---|---|---|
| Laranjeira, limoeiro, pessegueiro, macieira | (frutas que já existem) | |
| Mangueira | V | |
| Jabuticabeira | P | **O fruto nasce no tronco.** Só dá uma semana por ano: raridade natural |
| Bananeira | todas | |
| Coqueiro | V (na praia do Lago) | |
| Amoreira | P V | Amora + **folha para o bicho-da-seda** |
| Açaizeiro | O | |
| Cafeeiro | P O I | 10 dias de verdade; grão → Torrador |
| Cacaueiro | estufa | 10 dias de verdade; → **chocolate** |

### Sementes antigas (vêm da história, §13)

Achadas no Banco de Sementes da Aurora. Começam com **1 semente** cada; o aluno
multiplica na Máquina de Sementes. Só existem no jogo assim.

| Semente | O que tem de especial |
|---|---|
| Milho-Arco-Íris | Grãos coloridos (existe de verdade: milho "Glass Gem") |
| Melancia-Estrela | Corte em estrela |
| Abóbora-Lua | Brilha à noite; pode virar gigante |
| Rosa-Aurora | Muda de cor a cada estação |
| Trigo-Dourado | Farinha de ouro (pão de festa) |
| Flor-de-Cristal | Só nasce perto de uma Lasca do Cristal-Mãe (Lago) |

> Ensina: **sementes crioulas** — agricultores guardam as próprias sementes há gerações
> para não perder variedades antigas. O Banco de Sementes é isso.

---

## 6. Terra, qualidade, gigantes e variedades

### Terra e rotação
Cada canteiro tem **força da terra** de 0 a 3 (a cor do solo mostra).
- Colher qualquer planta: −1. Colher **leguminosa** (feijão, ervilha, amendoim): **+1**.
- **Composto** da composteira: +1.
- Força 0: a colheita não passa de prata.

### Qualidade: normal → prata → ouro → **diamante**
Hoje: sempre regada = prata; e adubada = ouro (`qualityOf`). Novo topo:
**diamante** = ouro + força da terra 3 + adubo de composto. Rende 3.

### Gigantes (Stardew)
Couve-flor, melancia, abóbora e Abóbora-Lua plantadas em **3×3**, todas prontas e
cuidadas: 1% por dia de virar **uma planta gigante**. Rende 15 a 21 de uma vez e um
troféu para a casa. É o "uau" que a criança mostra para o colega.

### Variedades raras (as "mutações" do Grow a Garden)
Aparecem na colheita conforme o clima do dia. Um item tem no máximo 2.

| Variedade | Quando | Preço | Visual |
|---|---|---|---|
| Orvalhada | colhida em manhã de chuva | ×1,5 | gotinhas |
| Polinizada | colmeia a até 5 blocos | +1 na colheita | abelhinha |
| Eletrizada | tempestade com raio (para-raios IoT ajuda) | ×3 | faíscas azuis |
| Cristalizada | geada de inverno | ×2 | gelo brilhante |
| Lunar | lua cheia | ×3 | brilho prateado |
| Arco-Íris | arco-íris depois da chuva | ×5 | cores passando |
| Dourada | 1 em 500, qualquer dia | ×10 | ouro |

Álbum **VARIEDADES** com cada planta × cada variedade. A primeira Dourada de cada planta
na turma ganha "Descoberta por <apelido>" (o mesmo esquema das cartas Lendárias).
**Variedade de valor alto é sorteada no servidor** (ver §12).

---

## 7. Clima

| Clima | Efeito |
|---|---|
| Sol | normal |
| Chuva (existe) | rega tudo; Orvalhada |
| Tempestade | rega tudo; raio pode Eletrizar uma planta |
| Onda de calor (verão) | a terra seca ao meio-dia: regar de novo ou irrigador |
| Geada (inverno) | Cristalizada |
| Arco-íris (depois da chuva, raro) | Arco-Íris |
| Lua cheia (a cada 7 dias) | Lunar; bichos mais felizes à noite |
| Neblina | dia da história: o Sr. Neblina aparece (§13) |

**Previsão de 2 dias** na TV da casa e na estação do tempo da Cidade WIT (que já existe).
Saber o clima de amanhã muda o que plantar hoje.

---

## 8. Comprar e vender: a época certa e a pessoa certa

### Preço muda com a época
- Na **safra** (a estação da planta) todo mundo tem: preço ×0,8.
- Na **entressafra**: ×1,5. Quem **guardou** ganha.
- A turma vendendo muito derruba o preço (o Mercado já faz isso em `market.ts`).

### Guardar ou vender agora?
- **Armazém** (galpão): guarda os que não estragam (milho, trigo, feijão, abóbora, mandioca,
  farinha, açúcar).
- Os que estragam (alface, morango, leite, ovo) têm **validade** em dias. A
  **Câmara fria** (Casa IoT) segura a validade.
- Essa é a decisão econômica do jogo inteiro: vender barato hoje ou guardar e arriscar.

### Quem compra (cada um paga mais pelo que precisa)

| Quem | Onde | Compra com bônus | Quando |
|---|---|---|---|
| Caixa de envio / Cooperativa (Seu Joca) | Fazenda | tudo, preço base | sempre (paga no dia seguinte) |
| Feira de sábado (existe) | Fazenda | tudo +50% | dia 6 da semana |
| Mercado Central | Centro | tudo, preço que sobe e desce | sempre |
| Dona Rosa | Padaria | trigo, farinha, fubá, ovo, leite, cenoura +30% | dia de fornada grande |
| Dona Ana | Doces e Café (Oficina) | morango, cacau, chocolate, café, mel, leite, frutas +30% | sempre |
| Dona Íris | Floricultura | flores +50% | véspera de Dia das Mães e Namorados |
| Madame Celeste | Casa de Moda | algodão, lã, angorá, seda, penas, corantes +40% | sempre |
| Seu Bento do Caminhão | aparece na fazenda | produtos de máquina +25% | 2 dias por semana |

### Quem vende sementes
- **Barraca da Tina** (existe): sementes da estação. O estoque **renova a cada dia da
  fazenda**, com uma semente rara sorteada (5%). Nos 2 últimos dias da estação:
  **pré-venda** das sementes da próxima com 30% de desconto (comprar antes é mais barato).
- **Caminhão do Seu Bento** (mascate, como a carroça do Stardew): sementes de outras
  regiões, mudas de árvore, adubo especial, às vezes uma semente antiga.

### Quadro de pedidos
No celeiro, 3 pedidos por semana com prazo: "Dona Rosa: 10 trigos de prata até sábado —
paga o dobro". Ligado às encomendas que já existem (`deliveries.ts`).

---

## 9. Máquinas (o que transforma a fazenda num negócio)

| Máquina | Entra | Sai | Tempo | Libera |
|---|---|---|---|---|
| Composteira | mato, cascas, colheita estragada, esterco do chiqueiro | composto (adubo bom) | 2 dias | Início |
| Minhocário | composto | **minhocas (isca do Lago)** + húmus | 2 dias | Nível 3 |
| Chocadeira | ovo fértil | pintinho / patinho | 3 dias | Galinheiro 2 |
| Moinho (prédio) | trigo, milho, mandioca | farinha, fubá, polvilho | 1 dia | História (Guardiã Brisa) |
| Tacho de doce | fruta + açúcar | geleia, doce | 1 dia | Nível 6 |
| Prensa de suco | fruta, legume | suco | ½ dia | Nível 8 |
| Queijeira | leite | queijo (curar na adega da casa: vale mais a cada semana, até 3) | 1 dia | Nível 10 |
| Fiandeira + Tear | algodão, lã, angorá, casulo | **tecido** de algodão, lã, angorá, seda | 1 dia | Nível 10 |
| Tinturaria | tecido + corante | **tecido colorido** (mistura de cores) | ½ dia | Nível 11 |
| Colmeia | — | mel com sabor + cera | 3 dias de verdade | Nível 12 |
| Engenho | cana | açúcar, rapadura, melado | 1 dia | Nível 12 |
| Torrador | grão de café | café | ½ dia | Nível 14 |
| Fábrica de chocolate | cacau + açúcar + leite | chocolate, bombom | 1 dia | Estufa |
| Prensa de óleo | girassol | óleo | 1 dia | Nível 9 |
| Defumador | peixe | peixe defumado | 1 dia | Nível 18 |
| Conserveira | legumes | conserva | 2 dias | Nível 7 |
| Desidratador | fruta, cogumelo | fruta seca | 1 dia | Nível 8 |
| Fábrica de velas | cera | vela (decoração da casa) | 1 dia | Nível 13 |
| Saboaria | óleo + lavanda ou rosa | sabonete (presente) | 1 dia | Nível 13 |
| Máquina de Sementes | uma colheita | 1 a 3 sementes dela | 1 dia | Nível 20 |

Produto de máquina vale **2 a 3 vezes** a matéria-prima. É aí que o aluno sente que
"montou um negócio".

### Automação (a tecnologia do WIT paga de volta)
| Peça (Casa IoT) | Faz |
|---|---|
| Irrigador (existe) | rega 8 canteiros |
| Sensor de umidade | avisa silagem e terra seca |
| Silo inteligente | enche o cocho às 6h |
| Bebedouro automático | bichos nunca ficam com sede |
| Para-raios | mais chance de Eletrizada |
| Câmara fria | segura a validade |
| Drone de colheita (nível 25) | colhe 1 fileira por dia |

---

## 10. Ferramentas e o sítio que cresce

### Ferramentas com melhoria (o minério vem do Lago e da Masmorra)
Enxada, regador, foice, balde, tesoura, escova. Melhoria: **cobre → ferro → ouro →
cristal**, com minério + moedas na oficina do Inventor Gaspar (Bairro Novo).
Regador de cobre rega 3 em linha; ferro, 5; ouro, 3×3; cristal, 5×5 (segurar o botão).

### Construções (Carpintaria da Dandara, a "Robin" do Vale)
A obra leva **1 a 3 dias de verdade**: o aluno vê o andaime e espera (a espera faz parte).

| Prédio | Nível 1 | Nível 2 | Nível 3 |
|---|---|---|---|
| Galinheiro | 4 aves (já existe) | 8 + chocadeira | 12 + comedouro automático |
| Celeiro | 4 bichos | 8 + cabra e ovelha | 12 + porco + ordenhadeira |
| Silo | 240 | 480 | 720 inteligente |
| Estábulo | cavalo | | |
| Apiário | 2 colmeias | 4 | 8 |
| Tanque de peixes | 1 | 2 | 3 |
| Estufa | restaurada pela história | ampliada | |
| Armazém | 200 itens | 500 | câmara fria |

### O lote
O campo de cada aluno começa como hoje e cresce em 3 expansões (mais canteiros e um
pasto). A fazenda continua sendo uma só no mapa; cada aluno vê o seu lote, os seus bichos
e as suas máquinas (como o campo já funciona, decisão 4 de `decisoes-08-10.md`).

---

## 11. Progressão: o que fazer por meses

### Nível do Sítio (1 a 30)
Separado do cargo de Fazendeiro: o cargo dá bônus; o sítio dá desbloqueios. XP de toda
ação da fazenda.

| Nível | Libera |
|---|---|
| 1 | Galinhas, composteira, 10 plantas |
| 3 | Minhocário, foice, silo |
| 5 | Celeiro, vacas |
| 7–9 | Conserveira, prensas, desidratador |
| 10 | Queijeira, tear, expansão 1 do lote |
| 12 | Apiário, engenho |
| 15 | Estábulo e cavalo, expansão 2 |
| 18 | Tanque de peixes, defumador |
| 20 | Máquina de Sementes, expansão 3 |
| 25 | Drone de colheita |
| 30 | Título **Mestre do Vale**, chapéu de palha dourado |

### Coleções (o "Livro da Fazenda")
- Plantas × qualidade (55 × 4)
- Variedades raras (álbum)
- Bichos com 5 corações (todos os tipos)
- Produtos de máquina (todos)
- Insetos da fazenda (borboletas, joaninhas e vaga-lumes já voam no mapa: rede pega,
  vão para o Museu)
- Prêmios da Feira

### Quanto dura (proposta, para conferir com alunos)
| | Aluno que joga 2 aulas por semana |
|---|---|
| 1ª semana | galinhas com nome, 15 plantas, primeiro queijo |
| 1º mês | celeiro, silo cheio para o inverno, primeira gigante |
| 3 meses | tear e tinturaria (vendendo tecido para a moda), apiário, árvores dando fruto |
| 6 meses | estábulo, tanque, sementes antigas, nível 20 |
| 1 ano | Mestre do Vale, álbuns completos |

---

## 12. Economia e segurança

- **As cartas continuam no centro.** A fazenda rende moedas por hora na mesma faixa da
  pesca (~340/h hoje, `docs/economia.md`). Máquinas aumentam o lucro, mas o teto de
  ganho do dia (`wit2_daily_cap`, 2500) vale para tudo.
- **O progresso hoje mora no navegador** (`wit.fazenda`, `wit.progresso`). Qualquer coisa
  rara e valiosa (Dourada, gigante, ovo dourado) precisa ser **sorteada no servidor**,
  como já é com a carta do chefe (`wit2_boss_card`) e a masmorra (`wit2_dungeon_claim`).
  Senão um aluno edita o navegador e "acha" 50 Douradas.
- "Descoberta por" e prêmios da Feira: só no servidor.

---

## 13. Ligações com a história (resumo; roteiro em `docs/historia.md`)

| Capítulo | O que acontece na fazenda |
|---|---|
| Ato 1 · Terra Cansada | Seu Joca diz que a terra está fraca; o **Sr. Neblina** quer comprar o Vale. As **Cestas da Cooperativa** (como o Centro Comunitário do Stardew) consertam o Vale aos poucos |
| Ato 1 · A Guardiã da Estufa | Duelo (ou prova) com a Guardiã Ipê; a carta dela vai para o Seu Joca e **a estufa volta a funcionar** |
| Ato 2 · O Moinho | Guardiã Brisa; o moinho volta a girar: farinha e fubá |
| Ato 2 · O Banco de Sementes | Guardião Barro, debaixo do silo velho: as **sementes antigas** |
| Ato 2 · O Homem que Não Molha | Numa feira de sábado com chuva, o Sr. Neblina some — ele é um holograma |

### Cestas da Cooperativa (a espinha dorsal do Ato 1)
Doar colheitas e produtos completa cestas; cada grupo de cestas conserta algo no Vale.

| Grupo | Exemplo de cesta | Conserta |
|---|---|---|
| Primavera | 5 cenouras, 5 alfaces, 3 morangos, 1 couve-flor | a ponte para a ilha do farol |
| Verão | 3 milhos, 1 melancia, 5 tomates, 1 girassol de ouro | o moinho (com a Guardiã Brisa) |
| Outono | 1 abóbora de ouro, 5 trigos, 3 uvas | o armazém |
| Inverno | 5 couves, 3 brócolis, 1 queijo | o caminho de trem do Seu Bento |
| Bichos | ovo grande, leite grande, lã, pena | o celeiro velho |
| Lago | 3 peixes de rio, 1 pérola, 1 minério | o cais do farol |

---

## 14. Festas da fazenda (datas de verdade, para a turma toda)

| Festa | Quando | O que tem |
|---|---|---|
| Caça aos Ovos | Páscoa | ovos coloridos escondidos pela fazenda; quem acha mais ganha |
| Festa das Flores | início da primavera (set) | concurso de arranjo + desfile de primavera (Passarela) |
| Festa Junina | junho | quadrilha (emotes no ritmo), concurso de pamonha/canjica/paçoca, **Desfile Caipira**, **correio elegante** (frases prontas para amigos) |
| Feira Agropecuária | outubro/novembro | júri: maior abóbora, galinha mais bonita, melhor queijo, melhor mel; ranking da turma |
| Amigo Secreto | dezembro | cada aluno tira um colega e um morador para presentear |

---

## 15. Multijogador

- Visitar a fazenda do amigo e **regar para ele** (+amizade, como no Stardew).
- **Mutirão**: colher junto na mesma área dá +10% por amigo presente (até +30%), como o
  "Team Harvest" do Grow a Garden.
- **Silo da turma**: meta coletiva da semana ("a turma junta 2000 feno") na aba Missões
  da sala do professor, que já existe.

---

## 16. O que a fazenda ensina

| Tema | Onde aparece |
|---|---|
| Ciclo de vida das plantas, estações | plantas por estação, árvores |
| Rotação de culturas, leguminosas fixam nitrogênio | força da terra |
| Compostagem e reaproveitamento | composteira, esterco |
| Polinização | colmeia + variedade Polinizada |
| Fermentação | silagem, queijo, iogurte |
| Controle biológico | joaninhas contra pulgão |
| Oferta e procura, safra e entressafra | preços, armazém, validade |
| Dados | gráfico de produção e lucro por estação no "Caderno da Fazenda" (`Charts.tsx` já desenha) |
| Tecnologia aplicada | irrigação, sensores, silo inteligente (IoT) |

---

## 17. Ordem de construção

| Onda | Entrega | Arte nova |
|---|---|---|
| 3a | Bichos com nome e afeto, tarefas do sítio, galinha que foge, chiqueiro, silo + foice + feno | porco, pata, coelha, cocho, chiqueiro sujo/limpo, foice |
| 3b | 25 plantas novas, força da terra, preço por época, armazém, validade, compradores, pré-venda, quadro de pedidos | ícones das plantas e estágios |
| 3c | Máquinas (composteira, queijeira, tear, tinturaria, moinho...), ferramentas com melhoria, Carpintaria | máquinas, andaime |
| 3d | Clima novo, variedades, gigantes, Feira, árvores de dia de verdade, sementes antigas | efeitos das variedades, plantas gigantes |

Código: estende `farm.ts` (`animals`, `silo`, `machines`, `plots[].forca`, variedades)
mantendo as funções puras e os testes; `sanitizeFarm` aceita o formato antigo.
Prompts de arte vão para `docs/PROMPTS-GPT.md` quando a onda for aprovada.
