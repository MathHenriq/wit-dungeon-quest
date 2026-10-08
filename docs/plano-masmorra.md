# Masmorra (WIT Dungeon, atualização grande)

Pedido do Matheus em 08/10: masmorra como **parte de RPG** do jogo, com **inspiração total em
Solo Leveling** e o máximo possível do lado **Stardew Valley**. Ela vai numa **branch separada**
(`claude/masmorra`). A branch oficial (`claude/wonderful-pascal-xgm4zi`) continua sendo a que
vai para o ar. Se a masmorra não ficar pronta até domingo (11/10), lança o WIT Dungeon como está.

O que já existe e vira base: `src/game/dungeon.ts` (salas geradas com semente, porta trancada até
limpar, esquiva, chefe, recompensa com limite por dia; com testes) e
`src/components/dungeon/DungeonView.tsx` (canvas, teclado, toque). Hoje ele é de **tiro**
(estilo Soul Knight). O plano troca o tiro por **golpe corpo a corpo + habilidades de carta**.

## 1. O que o aluno vê

1. **Portal** na Cidade (praça do Centro ou atrás da Arena): um portal azul que pulsa, como os
   portões de Solo Leveling. Ao chegar perto, aparece a **janela do SISTEMA** (painel azul
   translúcido com borda brilhante, letra pixel): `[PORTAL DE RANK E] Recomendado: andar 1–10`.
2. **Saguão da Associação** (sala como a Arena, motor de interiores): lugares fixos.
   - **Portais**: um por rank (E, D, C, B, A, S), liberado pelo andar da Torre.
   - **Balcão de missões** do SISTEMA (missão diária: "derrote 10 goblins", "colete 5 cristais").
   - **Ferreiro** (a forja que já existe) para melhorar a arma com minério.
   - **Boticária**: poções com ervas da masmorra (cozinha que já existe, receitas novas).
   - **Baú do pet**: o que o pet trouxe vai para cá.
3. **Dentro do portal**: andares em sequência, como as **minas do Stardew**.
   - Cada andar é uma área com pedras, minério, ervas e inimigos.
   - A **escada** aparece embaixo de uma pedra ou ao limpar a sala.
   - A cada 5 andares há **elevador**: da próxima vez, começa dali.
   - No último andar fica o **chefe do portal**.
4. **Saída**: morrer devolve ao saguão, e o pet perde metade do que carrega. Sair pela escada de
   volta guarda tudo. A barriga (fome que já existe) cai com o tempo, como a energia do Stardew.

## 2. Combate (ação, sem turno)

- **Golpe básico**: tecla J ou botão A, na direção que o boneco olha, em arco curto. Usa a arma
  equipada no deck (Equipamento de arma: o dano base dela vale aqui).
- **Esquiva**: tecla K ou botão B. Rolamento de 3 blocos, com invencibilidade curta e recarga
  de 0,8 s.
- **Habilidades** (teclas 1 a 4 ou botões no canto): o aluno escolhe **até 4 cartas de Ataque**
  da coleção.
  - **Dano**: o da carta, escalado para o combate em tempo real.
  - **Recarga**: maior quanto mais rara a carta.
  - **Efeito**: o efeito simples da carta vale quando dá para traduzir (queimar, congelar,
    roubar vida).
  - A carta não é gasta; é a coleção do TCG dando poder no RPG.
- **Efeito visual**:
  - **Épica para cima**: efeito próprio (sprite do GPT). "Cipó de espinhos" faz um cipó de
    espinhos saindo do chão.
  - **Comum a Rara**: efeito genérico do elemento, feito por código (12 elementos:
    fogo = bola de fogo, água = jato, planta = folhas, etc.).
- **Fora da caixa de efeito**: cartas de cura e de suporte, como a **Semente dos Deuses**. Elas
  não viram habilidade de ataque. Podem virar **item de cura** de uso único (proposta).
- **Animações do boneco**:
  - **Agora, por código, com o boneco atual**: andar, golpe (3 quadros por direção), esquiva
    (rolar), apanhar (piscar vermelho), conjurar (braço erguido + brilho do elemento),
    cair/vencer.
  - **Depois, do GPT** (§2 da lista abaixo): poses de golpe e esquiva do `modelo-01` e, em
    seguida, dos outros modelos.

## 3. Inimigos

| Inimigo | Comportamento | Andares |
|---|---|---|
| Goblin | corre e golpeia de perto | E em diante |
| Goblin arqueiro | mantém distância e atira flecha (linha avisada antes) | E em diante |
| Goblin xamã | cura goblins por perto; prioridade do jogador | D em diante |
| Slime | pula e se divide em 2 pequenos | E |
| Morcego | voa em zigue-zague, ignora pedras | D em diante |
| Lobo sombrio | avança em linha reta depois de rosnar (sinal) | C em diante |
| Golem de pedra | lento, muita vida, onda de choque em área | B em diante |
| **Chefe do portal** | 3 fases por vida (66%, 33%), ataques avisados no chão | último andar |

Todo ataque inimigo tem **aviso** (área vermelha no chão ou brilho), para a esquiva ter sentido.
O público é infantil: inimigo some em fumaça, sem sangue.

## 4. Pet coletor (a parte Stardew)

- O pet segue o aluno e **pega sozinho** o que cai: minério, ervas, cristais de mana, moedas.
- **Mochila do pet** com capacidade por tipo. Cada pet tem uma **afinidade**: capacidade maior
  (2×) para um tipo e coleta mais rápida dele.
  - Raposa-chama: **cristais** (brilho).
  - Pintinho-broto: **ervas**.
  - Pets novos (lista do GPT, ~50): cada um com uma afinidade entre minério, ervas, cristais,
    peles/ossos e moedas.
- Mochila cheia → o pet avisa (balão) e para de pegar aquele tipo.
- **Para que servem os itens**:
  - minério → melhorar arma no ferreiro;
  - ervas → poções;
  - cristais → pó da forja (raridade pelo rank do portal);
  - peles e ossos → vender no Mercado (oferta e procura que já existe);
  - moedas → limite diário como hoje (`DUNGEON_PAID`).

## 5. Progresso (a parte Solo Leveling)

- **Rank de Caçador** (E → S): sobe com XP da masmorra. Cada rank dá mais vida, um espaço de
  habilidade a mais (começa com 2, chega a 4) e libera o portal do rank.
- **Janela do SISTEMA**:
  - aviso de subir de nível;
  - missão diária ("[MISSÃO DIÁRIA] Derrote 10 goblins: 3/10");
  - recompensa em tom de sistema.
- **Recompensas, dentro das regras do TCG**: carta só vem de chefe ou de pacotinho. O **chefe do
  portal** dá 1 carta do deck dele (como o chefe da Torre), repetível, com limite de vezes
  pagas por dia.
- **Arise** (homenagem a Solo Leveling): chefe derrotado 3 vezes vira **sombra** que acompanha o
  aluno por um andar (um ajudante que bate junto).

## 6. Técnica

- **Lógica pura** em `src/game/dungeon.ts` (+ testes), com estado JSON, semente e passo fixo:
  - golpe, esquiva, habilidades, inimigos com aviso, coleta do pet, escada, elevador.
  - O motor de tiro atual vira o do arqueiro e das habilidades de projétil.
- **Habilidades**: `src/game/dungeon-skills.ts` traduz `Card` → `{ dano, recarga, forma (arco,
  linha, área, projétil), efeito }`. A tradução é por regra, não à mão, para cobrir as 350 cartas.
  Tem teste para toda carta de ataque.
- **Efeitos**:
  - `src/game/dungeon-vfx.ts`: efeitos por elemento em código;
  - sprite por carta em `public/game/efeitos/<id>.png`: folha de 6 quadros 96 × 96, fundo
    magenta. Importador novo `scripts/arte/importar-efeitos.py --folha revisao.png`, com a
    mesma regra de revisão de imagem dos outros (público infantil).
  - Enquanto o sprite não existir, usa o efeito do elemento.
- **Saguão**: sala nova em `interior/room.ts` (motor de interiores, como a Arena).
- **Salvamento**: `progress.masmorra` (rank, XP, elevadores, mochila do pet, missões). Com o
  banco ligado, entra no JSON com versão (`wit2_sync`), igual à Torre.
- **Celular**: joystick à esquerda, botões A, B e habilidades à direita, como no `DungeonView`
  atual.

## 7. Calendário (até domingo, 11/10)

| Dia | Entrega na branch `claude/masmorra` |
|---|---|
| Sex 09/10 | combate corpo a corpo + esquiva + goblins (3 tipos) com aviso; saguão; animações por código |
| Sáb 10/10 | pet coletor com afinidade e mochila; minério/ervas/cristais; escada, elevador; ferreiro e poções |
| Dom 11/10 | habilidades de carta com efeito por elemento; chefe com fases; SISTEMA (rank, missão); prints e decisão de lançar |
| Depois | sprites do GPT (efeitos das 67 cartas, poses de golpe e esquiva, inimigos, pets) |

Cada dia termina com typecheck, testes, `test:build`, prints e push na branch da masmorra. A
branch oficial só recebe a masmorra quando o Matheus aprovar pelos prints.

## 8. Lista do GPT da masmorra (gerar quando só faltar arte)

1. **Efeitos das 67 cartas de Ataque Épica+**: tabela abaixo. Uma folha por carta, 6 quadros
   em linha, 96 × 96 cada, fundo magenta #FF00FF, pixel art no estilo do jogo, sem texto, sem
   sangue. O prompt-modelo vai em `docs/PROMPTS-GPT.md` §P.
2. **Boneco**: `modelo-01` com golpe (3 quadros × 4 direções), esquiva (4 quadros × 4
   direções), conjurar (2 quadros). Depois os modelos 02–10.
3. **Inimigos**: goblin, goblin arqueiro, goblin xamã, slime, morcego, lobo sombrio, golem
   (4 direções × 2 quadros de andar + 2 de ataque) e 6 chefes de portal (um por rank).
4. **Lugares**: portal azul (4 quadros), chão e paredes da masmorra por rank, pedras, veios de
   minério, ervas, escada, elevador; saguão da Associação (balcões, quadro de missões).
5. **Pets**: os ~50 da lista, cada um com o ícone da afinidade.

### Cartas de Ataque Épica+ (67), na ordem de geração

Fora: cartas de cura e suporte (ex.: Semente dos Deuses, que é Incomum e Desafiante). As 18
Desafiantes Épica+ que causam dano ficam como **segunda leva opcional**.

| # | Carta | id | Raridade | Elemento | Obra |
|---|---|---|---|---|---|
| 1 | Black Flash | `black-flash` | Épica | Fighting | Jujutsu Kaisen |
| 2 | Dragão das Chamas Negras | `dragao-das-chamas-negras` | Épica | Dark | Yu Yu Hakusho |
| 3 | Espada Demoníaca Ragnarok | `espada-demoniaca-ragnarok` | Épica | Dark | Soul Eater |
| 4 | Espada Z | `espada-z` | Épica | Steel | Dragon Ball |
| 5 | Final Flash | `final-flash` | Épica | Electric | Dragon Ball |
| 6 | Fogo Infernal | `fogo-infernal` | Épica | Fire | Mushoku Tensei |
| 7 | Foice da Morte | `foice-da-morte` | Épica | Ghost | Soul Eater |
| 8 | Funeral do Deserto | `funeral-do-deserto` | Épica | Ground | Naruto |
| 9 | Fúria de Kamish | `furia-de-kamish` | Épica | Fire | Solo Leveling |
| 10 | Gáe Bolg | `gae-bolg` | Épica | Steel | Fate/stay night |
| 11 | Golpe Conquistador | `golpe-conquistador` | Épica | Fighting | One Piece |
| 12 | Hakka no Togame | `hakka-no-togame` | Épica | Ice | Bleach |
| 13 | Hinokami Kagura | `hinokami-kagura` | Épica | Fire | Demon Slayer |
| 14 | Howitzer Impact | `howitzer-impact` | Épica | Fire | My Hero Academia |
| 15 | Kagune Liberado | `kagune-liberado` | Épica | Dark | Tokyo Ghoul |
| 16 | Kamehameha | `kamehameha` | Épica | Water | Dragon Ball |
| 17 | Katana Parte-Alma | `katana-parte-alma` | Épica | Steel | Jujutsu Kaisen |
| 18 | Konjiki Ashisogi Jizō | `konjiki-ashisogi-jizo` | Épica | Poison | Bleach |
| 19 | Lança Invertida do Céu | `lanca-invertida-do-ceu` | Épica | Steel | Jujutsu Kaisen |
| 20 | Mil Tubarões | `mil-tubaroes` | Épica | Water | Naruto |
| 21 | Mjölnir | `mjolnir` | Épica | Electric | Record of Ragnarok |
| 22 | Murasame | `murasame` | Épica | Poison | Akame ga Kill |
| 23 | Punho Divergente | `punho-divergente` | Épica | Fighting | Jujutsu Kaisen |
| 24 | Punho Kaiju | `punho-kaiju` | Épica | Fighting | Kaiju No. 8 |
| 25 | Railgun | `railgun` | Épica | Electric | Toaru Kagaku no Railgun |
| 26 | Rasenshuriken | `rasenshuriken` | Épica | Flying | Naruto |
| 27 | Rhitta | `rhitta` | Épica | Fire | Seven Deadly Sins |
| 28 | Senbonzakura | `senbonzakura` | Épica | Grass | Bleach |
| 29 | Smash do One For All | `smash-do-one-for-all` | Épica | Fighting | My Hero Academia |
| 30 | Turbo | `turbo` | Épica | Ghost | Dandadan |
| 31 | United States of Smash | `united-states-of-smash` | Épica | Fighting | My Hero Academia |
| 32 | Ataque Giratório | `ataque-giratorio` | Lendária | Flying | Attack on Titan |
| 33 | Beru, o Rei Formiga | `beru-o-rei-formiga` | Lendária | Poison | Solo Leveling |
| 34 | Big Bang Attack | `big-bang-attack` | Lendária | Electric | Dragon Ball |
| 35 | Buda de Mil Mãos | `buda-de-mil-maos` | Lendária | Grass | Naruto |
| 36 | Buraikan | `buraikan` | Lendária | Water | One Piece |
| 37 | Contrato com o Diabo | `contrato-com-o-diabo` | Lendária | Dark | Chainsaw Man |
| 38 | Enuma Elish | `enuma-elish` | Lendária | Flying | Fate |
| 39 | Excalibur | `excalibur` | Lendária | Steel | Fate |
| 40 | Genki Dama | `genki-dama` | Lendária | Flying | Dragon Ball |
| 41 | Kamui Raikiri | `kamui-raikiri` | Lendária | Electric | Naruto |
| 42 | Kirin | `kirin` | Lendária | Electric | Naruto |
| 43 | Kong Gun | `kong-gun` | Lendária | Fighting | One Piece |
| 44 | Makankosappo | `makankosappo` | Lendária | Dark | Dragon Ball |
| 45 | Matadora de Dragões | `matadora-de-dragoes` | Lendária | Steel | Berserk |
| 46 | Névoa Obscura | `nevoa-obscura` | Lendária | Flying | Demon Slayer |
| 47 | Nona Forma: Rengoku | `nona-forma-rengoku` | Lendária | Fire | Demon Slayer |
| 48 | Raigo | `raigo` | Lendária | Electric | One Piece |
| 49 | Red Hawk | `red-hawk` | Lendária | Fire | One Piece |
| 50 | Reigan | `reigan` | Lendária | Ghost | Yu Yu Hakusho |
| 51 | Sessenta e Quatro Palmas | `sessenta-e-quatro-palmas` | Lendária | Fighting | Naruto |
| 52 | Star Burst Stream | `star-burst-stream` | Lendária | Steel | Sword Art Online |
| 53 | Tensa Zangetsu | `tensa-zangetsu` | Lendária | Dark | Bleach |
| 54 | Titã de Ataque | `tita-de-ataque` | Lendária | Fighting | Attack on Titan |
| 55 | Zoltraak | `zoltraak` | Lendária | Dark | Frieren |
| 56 | Amaterasu | `amaterasu` | Mítica | Fire | Naruto |
| 57 | Bajrang Gun | `bajrang-gun` | Mítica | Fighting | One Piece |
| 58 | Décima Terceira Forma | `decima-terceira-forma` | Mítica | Fire | Demon Slayer |
| 59 | Fuga | `fuga` | Mítica | Fire | Jujutsu Kaisen |
| 60 | Gon Adulto | `gon-adulto` | Mítica | Fighting | Hunter x Hunter |
| 61 | Modo Demônio | `modo-demonio` | Mítica | Dark | Black Clover |
| 62 | Sanzen Sekai | `sanzen-sekai` | Mítica | Steel | One Piece |
| 63 | Tengai Shinsei | `tengai-shinsei` | Mítica | Ground | Naruto |
| 64 | Titã Colossal | `tita-colossal` | Mítica | Fire | Attack on Titan |
| 65 | Vazio Roxo | `vazio-roxo` | Mítica | Ghost | Jujutsu Kaisen |
| 66 | Modo 100% | `modo-100` | Desconhecida | Ghost | Mob Psycho 100 |
| 67 | Soco Sério | `soco-serio` | Desconhecida | Fighting | One Punch Man |
