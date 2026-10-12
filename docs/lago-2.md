# Lago Azul 2 — pesca, mergulho, gemas e o fundo do lago

> Escrito em 09/10/2026. Base: `src/game/{fishing,fishlog}.ts`, `FishHouse.tsx`,
> `zone-lago.ts`, `dungeon.ts` (branch `claude/masmorra`). Números são **(proposta)**.
> Referências: Stardew (pesca, praia, museu), Fisch (Roblox: varas, iscas, mutações,
> avaliador, bestiário), Animal Crossing (mergulho pelas bolhas), Dave the Diver
> (oxigênio, peso da bolsa, profundidade).

---

## 0. Onde estamos

| Já existe | Falta |
|---|---|
| 16 peixes por raridade, água funda, noite | Estação, clima, isca e lugar mudarem o peixe |
| Minijogo da agulha | Vara, isca e anzol (equipamento que melhora) |
| Barquinho, ilha do farol | Algo para fazer na ilha e no farol |
| Casa de Pesca: quadro do dia, venda, álbum com recorde | Avaliador, troféu, torneio |
| Diário do lago com gráficos; limpeza do lago | Meta de longo prazo da limpeza |
| Loja de Iscas (prédio desenhado, "em breve") | A loja funcionar |
| — | **Mergulho, minério e gemas** (a ideia do Matheus) |
| — | **Museu** para onde vão as coisas raras |

---

## 1. Mergulho (a novidade principal)

### Como se começa
**Escola de Mergulho do Marinho** (o barqueiro, que já existe, vira instrutor). Três
lições curtas antes da licença, cada uma com um quiz de 3 perguntas:
1. **Oxigênio:** o cilindro dura um tempo; subir antes de acabar.
2. **Pressão:** a cada 10 metros de água, a pressão aumenta como se o ar inteiro da
   Terra estivesse em cima de você de novo (1 atmosfera). Por isso se desce devagar.
3. **Sinais:** os 4 sinais de mão (ok, subir, descer, problema).

Passou: **Licença de Mergulho Bronze**. As próximas (Prata, Ouro, Mestre) liberam mais
fundo.

### Onde se mergulha
Todo dia aparecem **bolhas** em 3 a 5 pontos do lago (como as sombras e bolhas do Animal
Crossing). O aluno vai de barco até a bolha e aperta MERGULHAR.

### Como é lá embaixo
Uma cena própria, **Fundo do Lago**, vista de cima como a masmorra. O mergulho
**reaproveita o motor da masmorra** (`dungeon.ts`: salas geradas com semente, pedras e
veios que quebram, pet que cata) **sem combate**: o perigo é o oxigênio, não o inimigo.

| Camada | Profundidade | Licença | Escuro? | O que tem |
|---|---|---|---|---|
| Raso | 0–5 m | Bronze | não | conchas, caramujos, pedrinhas, moedas antigas, garrafas |
| Médio | 5–15 m | Bronze | pouco | mexilhões (pérolas), plantas aquáticas, ruínas, veios de cobre e quartzo |
| Fundo | 15–30 m | Prata | sim (lanterna) | veios de ferro, prata e gemas, fósseis, artefatos da escola antiga |
| Fossa | 30 m+ | Mestre + história | muito | gemas raríssimas, **Lascas do Cristal-Mãe** (de onde a Aurora fazia as cartas, §9) |

- Cada mergulho é uma sequência de 3 a 6 salas, cada uma mais funda.
- **Barra de oxigênio**; **bolsões de ar** nas rochas repõem um pouco.
- **Bolsa com peso** (Dave the Diver): pedra pesa; o aluno escolhe o que leva.
- Correntezas empurram; algas enroscam (aperta rápido para soltar).
- **Oxigênio acabou:** o Marinho puxa o aluno para o barco. Perde metade da bolsa, nunca
  a vida nem o equipamento. Público infantil: susto sim, castigo não.
- Peixes nadam nas salas: a **câmera** (tecla F, já existe) fotografa para o álbum
  "Vida Submersa".

### Equipamento

| Peça | Faz | De onde |
|---|---|---|
| Máscara e snorkel | mergulho no raso | Escola (grátis) |
| Nadadeiras | nada mais rápido | Loja de Iscas |
| Cilindro (3 tamanhos) | 60 s → 120 s → 240 s de oxigênio | Loja de Iscas |
| Roupa de neoprene | mergulhar no inverno (água fria) | Loja de Iscas |
| Lanterna | enxerga no Fundo | Inventor Gaspar |
| Picareta de mergulho (cobre → cristal) | quebra veios mais duros | Inventor Gaspar |
| Bolsa (3 tamanhos) | carrega mais peso | Ateliê / Loja |
| Computador de mergulho (IoT) | mostra a profundidade e **apita perto de gema** | Casa IoT |
| Propulsor | anda rápido | Casa IoT |
| Traje de Profundidade | entra na Fossa | Inventor Gaspar, só pela história |

---

## 2. Minérios e gemas (extremamente raros, alguns muito caros)

Gemas **brasileiras de verdade**, com onde existem no Brasil: a criança aprende
geografia sem perceber. A chance é **por veio quebrado**; um mergulho quebra ~6 veios,
uma hora de mergulho ~90.

| Pedra | Chance por veio | Camada | Bruta → lapidada (moedas) | Curiosidade real |
|---|---|---|---|---|
| Quartzo | 1 em 4 | Médio | 3 → 8 | o mineral mais comum da crosta |
| Ágata | 1 em 10 | Médio | 6 → 18 | Rio Grande do Sul |
| Ametista | 1 em 20 | Médio | 10 → 30 | Ametista do Sul (RS) tem até o nome |
| Citrino | 1 em 30 | Médio | 12 → 35 | quartzo amarelo |
| Granada | 1 em 40 | Fundo | 15 → 45 | também aparece no garimpo |
| Turmalina verde | 1 em 80 | Fundo | 25 → 80 | Minas Gerais |
| Turmalina rosa | 1 em 120 | Fundo | 35 → 110 | Minas Gerais |
| Turmalina melancia | 1 em 400 | Fundo | 80 → 250 | rosa por dentro, verde por fora |
| Água-marinha | 1 em 600 | Fundo | 100 → 320 | Teófilo Otoni (MG) |
| Topázio Imperial | 1 em 800 | Fundo | 130 → 420 | quase só existe na região de Ouro Preto (MG) |
| Esmeralda | 1 em 1.000 | Fundo | 160 → 500 | Bahia e Minas Gerais |
| Opala | 1 em 1.500 | Fossa | 200 → 650 | Pedro II (PI); brilho de arco-íris |
| Alexandrita | 1 em 2.500 | Fossa | 300 → 900 | **muda de cor: verde de dia, vermelha à noite** (no jogo muda junto com o relógio) |
| Diamante | 1 em 5.000 | Fossa | 500 → 1.600 | Diamantina (MG) tem até o nome |
| **Turmalina Paraíba** | 1 em 8.000 | Fossa | 700 → **2.400** | azul-neon; achada na Paraíba no fim dos anos 1980; das gemas mais caras do mundo |
| Lasca do Cristal-Mãe | só pela história; depois 1 em 20.000 | Fossa | não se vende | a peça da história (§9) |
| **Coração do Lago** | 1 por turma, uma vez | Fossa, fim do Ato 3 | não se vende | troféu único com o apelido de quem achou |

**Metais** (para ferramentas e joias): cobre (Médio), ferro (Fundo), prata (Fundo),
ouro (Fundo e garimpo). A masmorra também dá `minerio:*`: as duas fontes servem.

**Pérolas de água doce** (existem de verdade, em mexilhões de rio): abrir o mexilhão dá
pérola branca 1 em 50, rosa 1 em 500, **negra 1 em 5.000**.

### Por que isso não quebra a economia
- Uma Turmalina Paraíba lapidada (2.400) vale ~4 aulas inteiras de moedas: é o
  "extremamente caro" que o Matheus pediu.
- Mas ela sai **1 vez a cada ~90 horas de mergulho**. Na média, ela soma ~25 moedas por
  hora ao mergulho; quem sustenta a hora (~340, igual à pesca) são as pedras comuns.
- **Toda pedra a partir da Esmeralda é sorteada no servidor** (como a carta do chefe).
  O progresso hoje fica no navegador; sem isso, um aluno edita e vira milionário.
- O teto do dia (2500) continua valendo. A Paraíba cabe nele com folga.

### Quando alguém acha uma rara
- Manchete no **Jornal WIT** do telão (já existe): "<apelido> achou uma Turmalina
  Paraíba no fundo do Lago Azul!" (só para a turma, como o resto do social).
- A primeira de cada pedra na turma vai para o Museu com a plaquinha "Descoberta por".

---

## 3. Lapidação e joias

**Dona Jade, a Lapidária** (casa nova no Lago). Pedra bruta vale pouco; lapidada vale
3 vezes.

**Minijogo da lapidação:** escolher o corte (redondo, oval, gota, coração, retangular) e
polir as faces girando a pedra; quanto mais **simétrico**, melhor a nota (C, B, A, S),
que multiplica o preço (×1 a ×1,5). Ensina simetria e faces sem dizer que é geometria.

**Ourives** (Dona Jade também): pedra lapidada + metal = **joia** para a Passarela:
colar, brinco, anel, tiara, broche, pulseira. Joia com gema rara **brilha na passarela**
(`docs/passarela.md`). Também: geodo de ametista e luminária de cristal para a casa.

---

## 4. Pesca 2.0

### Equipamento (Loja de Iscas, que hoje é "em breve")

| Vara | Faz | Como |
|---|---|---|
| Bambu | a de hoje | grátis |
| Fibra de vidro | faixa verde maior | moedas |
| Carbono | faixa maior + mais sorte | moedas + nível de pescador |
| Vara do Farol | pode fisgar os lendários | história (Seu Tião) |
| Vara de Cristal | mais chance de mutação | Lascas + Inventor |

| Isca | Atrai | De onde |
|---|---|---|
| Minhoca | peixes comuns, mais mordida | **minhocário da fazenda** |
| Massa | tilápia, carpa | farinha da fazenda |
| Camarão | traíra, tucunaré | covo |
| Fruta | **pacu** (o texto do pacu já diz que ele gosta de fruta) | pomar |
| Isca brilhante | peixes da noite | Loja |
| Isca artificial | dourado, tucunaré | Inventor |

### Peixes: de 16 para ~50
Cada peixe passa a ter **estação, clima, horário e lugar**. Lugares novos: rio que desce
da fazenda, cachoeira, lagoa da fazenda, em volta da ilha, debaixo do gelo (inverno) e o
tanque de criação. Mais peixes brasileiros: lambari-do-rabo-vermelho, piranha (pequena,
morde a linha), cascudo, mandi, jundiá, curimbatá, piraputanga, matrinxã, aruanã,
tambaqui, pintado, pirarara, arraia de rio, poraquê (peixe-elétrico: só em tempestade).

### Os 6 lendários (um por estação + 2 secretos)
| Lendário | Quando | Liga com a história |
|---|---|---|
| Dourado-Rei | verão, sol, água funda | |
| Pirarucu Ancião | outono, chuva | nada em volta da escola afundada |
| Peixe-Lua | inverno, debaixo do gelo | |
| Tucunaré-Relâmpago | tempestade | |
| Peixe-Cristal (existe) | noite | tem uma Lasca na barriga (Ato 1) |
| **Koi Dourada** (existe) | ? | **era a carpa da Aurora**, de 1926. Carpas koi vivem muito: uma famosa no Japão teria passado de 200 anos. Pegou e soltou: uma Página do Diário da Aurora |

### Mutações de peixe (Fisch)
Albino, Gigante (≥95% do tamanho máximo), Dourado, Cristalino (perto de Lasca),
Eletrizado (tempestade). Vale mais e vai para o álbum.

### Avaliador e troféus
Seu Tião mede e pesa: **certificado de recorde**. Recorde vira **peixe na placa** para a
parede da casa (troféu).

### Piracema
No verão do jogo é **piracema** (no Brasil, de novembro a fevereiro, os peixes sobem os
rios para desovar e a pesca de várias espécies é proibida). Peixes marcados "em
piracema" precisam ser **devolvidos**: o aluno ganha pontos de **Pescador Consciente**
(título e isca especial). Ensina a lei de verdade, e soltar vira recompensa, não perda.

### Covos e tanque
- **Covo** (armadilha de camarão): coloca na margem, volta no dia seguinte.
- **Tanque de criação** (na fazenda, `docs/fazenda-3.md` §3): tilápia, pacu e camarão
  criados com ração.

---

## 5. Outras atividades do lago

| Atividade | Como é | Ensina / liga |
|---|---|---|
| **Garimpo com bateia** | na beira do rio: girar a bateia, a terra sai, o ouro fica no fundo | densidade (ouro é mais pesado); primeira fonte de ouro, sem licença |
| **Praia** | conchas, pedras, madeira trazida pela água, garrafas; depois de tempestade aparece mais | garrafa com mensagem = página do Diário da Aurora |
| **Caiaque** | corrida contra o relógio por boias; recorde da turma | |
| **Barco melhor** | remo → motor elétrico (IoT) → **barco de fundo de vidro** (vê o fundo e acha bolhas melhores) → **mini-submarino** (Ato 3) | |
| **Observar bichos** | capivara, garça, martim-pescador, ariranha, tartaruga, jacaré-de-papo-amarelo, libélula; foto vai para o álbum | fauna brasileira |
| **Farol** | subir, ver o Vale todo; na história, acender | Ato 1 |
| **Projeto Lago Limpo** | a limpeza que já existe vira **meta da turma**: cada lixo conta; nas metas, a água fica mais azul no mapa e peixes raros voltam | ecologia; o lixo vai para a reciclagem e vira material |
| **Patinação** | no inverno a borda do lago congela: minijogo de patinar | |
| **Festival das Lanternas** | uma noite por ano: lanternas na água, os Peixes-Cristal sobem e brilham | fim do Ato 1 |
| **Torneio de pesca** | sábado; maior peixe da semana na turma (precisa do servidor) | |

---

## 6. Museu do Vale

Prédio novo no Centro. **Seu Amadeu, o curador** (como o Gunther do Stardew), recebe:
pedras, fósseis, artefatos da escola antiga, insetos da fazenda e fotos de bichos. Cada
peça tem um texto curto (muitos contam a história).

| Doações | Prêmio (proposta) |
|---|---|
| 10 | Pacotinho Comum + mesa de vidro para a casa |
| 25 | Semente antiga + título **Pesquisador(a)** |
| 50 | Pacotinho Raro + luminária de cristal |
| 75 | Traje de Profundidade (adianta a Fossa) |
| 100 (tudo) | título **Curador(a) do Vale** + estátua na casa |

O Museu é para onde convergem Lago, Fazenda (insetos) e história: é a "coleção das
coleções".

---

## 7. Progressão

| Trilha | Degraus |
|---|---|
| Licença de mergulho | Bronze → Prata → Ouro → Mestre (cada uma pede mergulhos e um teste) |
| Cargo de Pescador | já existe (bônus de sorte e venda) |
| Álbum de peixes | ~50 + 6 lendários + mutações |
| Coleção de pedras | 16 gemas × bruta/lapidada + metais + pérolas |
| Museu | 100 doações |
| Recordes | maior de cada peixe, na turma |

| Quando | Aluno de 2 aulas por semana |
|---|---|
| 1ª semana | vara de fibra, isca de minhoca, licença Bronze, primeira ametista |
| 1º mês | Prata, primeiras joias, 25 peixes, 10 no Museu |
| 3 meses | Ouro, um lendário, Topázio ou Esmeralda (com sorte) |
| 6 meses | Mestre, Fossa (com a história), 50 no Museu |
| 1 ano | álbum completo; Paraíba só para os persistentes |

---

## 8. O que o lago ensina

Pressão e profundidade · densidade (bateia) · geologia e geografia do Brasil (onde está
cada gema) · simetria (lapidação) · ecologia (piracema, lixo, água limpa) · fauna
brasileira · leitura de dados (o Diário do Lago já tem gráficos).

---

## 9. Ligações com a história (roteiro em `docs/historia.md`)

- **O farol** pisca na primeira noite do aluno: é quando ele e o faroleiro Amaro saem das
  cartas. Acender o farol de novo é o que liberta os encartados (Cap. 12).
- **O Homem da Neblina** (Amaro) aparece no fim do cais em manhãs de neblina (Cap. 3).
- **O Bagre Velho** engoliu a chave da cripta do Castelo: só morde à noite, com isca de
  queijo (Cap. 8).
- **O fundo do lago** esconde a escola da Aurora, que o Teodoro afundou: lá crescem a
  **Flor-da-Lembrança** (o antídoto do chá) e está a **foto rasgada de 1926** (Cap. 10).
- **O Cristal-Mãe**: o farol precisa de uma Lasca para acender (Cap. 12).
- **Garrafas na praia, barriga de peixe, mergulho**: Páginas do Diário da Aurora.
- **Mistério paralelo, o Monstro do Lago Azul:** uma sombra enorme vista à noite. Fotos
  borradas, pegadas de óleo na areia. No Ato 2 se descobre que é o **mini-submarino da
  Ordem** indo até a escola afundada.

---

## 10. Mais coisas para fazer (rodada 2, 09/10)

### Pesca de outros jeitos
| Jeito | Como |
|---|---|
| **Tarrafa** (rede de arremesso) | girar e soltar na hora certa; a rede abre em círculo e pega vários peixinhos de isca |
| **Arremesso** | força e direção: da margem, alcançar a água funda |
| **Pesca no gelo** | inverno: furar o gelo da borda e pescar o Peixe-Lua |
| **Pesca noturna com lanterna** | peixes que só sobem com luz |
| **Pesque e solte** | pontos por peixe devolvido; ranking da turma |

### Peixes de aquário e cruzamento
Betta, guppy, acará-disco e neon (peixes da Amazônia). Criados num **tanque** em casa ou
no lago; o filhote mistura as cores dos pais; raros como o **betta dragão** e o **guppy
dourado**. Vender ao Aquário e a colegas. É a "flor de cruzamento" do lago: meta de meses.

### Aquário Público do Vale
Prédio novo no lago. A turma **doa peixes vivos**; quando a turma bate metas, o aquário
ganha tanques novos (o tanque dos lendários, o túnel de vidro). O nome de quem doou cada
peixe fica na placa.

### Praia
| Atividade | Como |
|---|---|
| **Detector de metais** (feito na Casa IoT) | varrer a areia: moedas antigas, anéis, chaves, cápsulas do tempo e **broches da Ordem** (história) |
| **Concurso de castelo de areia** | montar com blocos de areia; voto da turma (o castelo de areia já está desenhado no mapa) |
| **Vôlei de praia** | 2 contra 2 com amigos |
| **Natação** | corrida até a boia |
| **Salto do píer** | manobras no ar, nota dos amigos |
| **Stand-up e pedalinho de cisne** | passeio com um amigo |
| **Quiosque da praia** | no fim de semana o aluno assume o quiosque: clientes pedem peixe assado, pastel, suco, açaí; ele prepara contra o relógio com o que tem da fazenda e do lago |

### A ilha
**Acampamento:** a barraca e a fogueira já estão desenhadas. Dormir na ilha, contar
histórias na fogueira (os boatos da história), ver a **chuva de meteoros** (evento).

### Barcos
Barco **personalizado** (cor, nome, vela, adesivos). **Regata** da turma (evento). Barco
maior com amigo: um pilota, o outro pesca.

### Resgate de bichos
Uma tartaruga presa numa rede velha, uma garça com linha no pé: soltar com cuidado
(minijogo), levar ao centro da Lúcia, devolver ao lago depois. **Álbum de resgates.**

### Peixe marcado
A Lúcia põe anel em peixes. O aluno solta um marcado e, dias depois, chega carta: "seu
peixe foi pescado pelo <colega> do outro lado do lago, 12 cm maior".

### Lixo vira material
O lixo pescado (bota, lata, que já existem) vai para a reciclagem: plástico e alumínio
viram peças para o Inventor e móveis de material reciclado.

### Mergulho noturno
Peixes que brilham, mais chance de Lascas, fundo azul-escuro com pontos de luz.

---

## 11. Visual: o que ajustar

Prints de hoje em `docs/prints-frentes/lago-*-antes.webp`.

| O que se vê hoje | Ajuste |
|---|---|
| A água é igual do píer até o meio do lago | **degradê de profundidade**: raso turquesa com areia aparecendo no fundo, médio azul, fundo azul-escuro. A "água funda" da pesca passa a ser visível |
| Margem com recorte limpo, sem vida | espuma na beira, areia molhada mais escura, pedras e juncos, taboas e vitórias-régias (já existem) espalhadas |
| Peixe invisível até morder | **sombras de cardume** e bolhas onde há peixe (como as bolhas do Stardew); peixe pulando |
| A vila do lago é uma praça de areia vazia, com **postes tecnológicos do WIT** e banco de praça da cidade | **vila de pescadores**: deck de madeira, redes penduradas, barcos virados na areia, covos, baldes, palafitas coloridas, coqueiros, lampião de madeira |
| Píer curto | píer comprido com barcos amarrados, pescadores sentados na ponta |
| Farol pouco presente | o farol como **marco visível de longe** (silhueta no horizonte), luz que gira quando aceso |
| Lago igual o ano todo | borda congelada no inverno, flores aquáticas na primavera |
| Barra de cima com instruções e "protótipo" | igual à fazenda: relógio no canto, dicas só no primeiro acesso |

Mesmo processo da fazenda: guia de estilo da área (azul-turquesa, areia, madeira de barco,
corda), folha de revisão (`folha-mundo.ts ... lago`), objetos novos pelo GPT, prints antes
e depois para aprovar.

---

## 12. Ordem de construção

| Onda | Entrega | Arte nova |
|---|---|---|
| L1 | Loja de Iscas funcionando, varas, iscas, peixes com estação/clima/lugar (~30), avaliador e troféu, covo | ícones de vara e isca, peixes novos |
| L2 | Escola de Mergulho, bolhas, Fundo do Lago (motor da masmorra sem inimigos), Raso e Médio, pérolas, quartzo a citrino | chão e paredes do fundo, veios, mexilhão, roupa de mergulho no boneco |
| L3 | Fundo, lanterna, gemas, Dona Jade (lapidação, joias), garimpo, Museu | casa da Jade, museu, gemas |
| L4 | Fossa, lendários, piracema, Lago Limpo da turma, Festival das Lanternas | Fossa, Lascas, lanternas |
| Lv | **Visual** (§11): profundidade da água, margem viva, cardumes, vila de pescadores, píer, farol de marco | água em degradê, objetos da vila |
| L5 | Tarrafa, arremesso, pesque e solte, detector de metais, castelo de areia, quiosque, resgate | tarrafa, detector, quiosque |
| L6 | Peixes de aquário e cruzamento, Aquário Público, esportes de praia, acampamento, barco personalizado e regata, peixe marcado | aquário, barcos |

Código: `fishing.ts` ganha `seasons`, `weather`, `places`, `bait` em cada peixe (o
`fishWeight` já é o lugar certo); mergulho em `src/game/dive.ts` usando `generate` e
`Breakable` da masmorra; pedras em `src/game/gems.ts`; sorteio das raras por uma função
nova no banco (`wit2_dive_claim`, no molde de `wit2_dungeon_claim`).
