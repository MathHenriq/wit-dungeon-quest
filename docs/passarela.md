# Passarela WIT — o "Dress to Impress" do Vale

> Escrito em 09/10/2026. Pesquisa do Dress to Impress (DTI) em `docs/frentes-vida.md`
> §Fontes. Números são **(proposta)**. É a frente com **mais risco de arte**: nada aqui
> começa antes do protótipo da §10 ser aprovado ("ou fica bom de verdade, ou não fazemos").

---

## 1. O que é o Dress to Impress (e por que prende)

Jogo do Roblox, em rodadas:
1. No saguão aparece o **tema** da rodada (centenas de temas: "Praia", "Anos 2000",
   "Realeza", "Seu personagem favorito"...).
2. Todo mundo vai para o **camarim** e tem **~6 minutos** para montar o look: araras de
   roupa, cabelo, maquiagem, unhas, sapatos, acessórios, objetos na mão. Até 18 peças
   (24 com passe pago). Cada peça troca de cor e de estampa.
3. Acaba o tempo: **passarela**. Cada jogador desfila sozinho, com caminhadas e poses.
4. Os outros dão **1 a 5 estrelas**. Os 3 melhores sobem no **pódio**.
5. Todo mundo ganha **estrelas** (que sobem o **rank**: de "New Model" até "Fashion
   Goddess", com 150 mil estrelas) e **dinheiro** do jogo (compra peças, poses e
   caminhadas).
6. Extras: **modo livre** (sem tema, sem tempo), **VIP** pago, maquiagem personalizada
   paga, códigos com peças grátis, eventos de estação e uma **história misteriosa** (a
   "Lana Lore": diário escondido, códigos para decifrar, capítulos lançados em evento).

**Por que prende:** criatividade sem certo e errado; o tema muda toda rodada (nunca
repete); a nota vem de gente de verdade; o rank leva meses; a coleção de peças só cresce;
a história faz a comunidade investigar junto.

---

## 2. O que muda no WIT

| No DTI | Na Passarela WIT | Por quê |
|---|---|---|
| VIP e passes pagos | tudo se ganha jogando | regra do projeto: nada pago |
| Peças de todo tipo | **só peças adequadas**: nada curto demais, nada decotado; corpo único com proporção infantil | público infantil |
| Voto aberto, às vezes cruel | voto às cegas, nota aparada, júri de moradores, professor pode desligar o voto | proteger as crianças |
| Precisa de servidor cheio | também funciona com pouca gente (modo do dia e júri, §4) | a turma não está online junta fora da aula |
| Moda isolada | tecido da fazenda, joia do lago, costura em casa | as frentes se alimentam |
| Lore de terror | mistério com vilões, sem susto (Baile de Máscaras da Ordem, §9) | idade dos alunos |
| "Jogo de menina" | aberto a todos, com muita coisa que os meninos gostam (§5) | pedido do Matheus |

---

## 3. O lugar: Casa de Moda Estrela

Prédio novo no Centro, perto da Loja. Por dentro:

| Sala | O que tem |
|---|---|
| **Saguão** | **Lulu**, a apresentadora (a "Lana" do Vale); telão com o tema da próxima rodada e o contador; quadro das capas da revista |
| **Camarim** | araras por categoria, espelho grande, penteadeira (cabelo e maquiagem), estação de unhas, provador |
| **Passarela** | a pista, a plateia (os outros jogadores sentados), o pódio, a câmera |
| **Ateliê** | onde se criam peças (§8) — abre no rank Estilista |
| **Boutique** | compra de peças com moedas + **vitrine da turma** (peças criadas por alunos) |
| **Sala das Lendas** | só para rank alto: araras raras e a galeria dos looks campeões |

Moradores: **Madame Celeste** (dona da Casa de Moda), **Kiko** (assistente, um menino
que ama moda: mostra que moda é para todos), **Lulu** (apresentadora).

---

## 4. Modos de jogo

| Modo | Como funciona | Quando |
|---|---|---|
| **Desfile ao vivo** | 4 a 12 jogadores na mesma sala; tema; 5 min no camarim; 15 s de passarela cada; voto; pódio | quando há gente online (tempo real por Supabase, que já existe) |
| **Desfile da Aula** | o professor abre pelo painel; a turma toda joga junto; **o professor escolhe o tema ligado à aula** ("Cientista de IA", "Repórter do Jornal WIT"); dá para projetar no telão da sala | na aula: o momento mais forte |
| **Desfile do Dia** | tema do dia igual para a turma; cada um manda 1 look; quem entra vota em 5 looks sorteados, às cegas; resultado no dia seguinte | sempre (funciona com pouca gente) |
| **Júri do Vale** | 3 jurados moradores dão a nota por regras (§6); dá menos estrelas que o voto de gente | sozinho, a qualquer hora; é o treino |
| **Provador livre** | sem tema, sem tempo; salvar até 5 looks | sempre |
| **Clientes** | um morador pede um look com **orçamento** e ocasião: "Seu Joca vai ao casamento da sobrinha. Elegante, até 800 moedas em peças" | profissão nova: **Estilista** |
| **Relâmpago** | 90 segundos | para quem tem pressa |
| **Desfile de Guilda** | a equipe desfila com looks que combinam entre si | semanal |
| **Desfiles de festa** | Carnaval (fantasia), Festa Junina (caipira), Dia do Saci/Halloween (folclore), Primavera, Natal | datas do ano |

### Temas
Lista fechada, curada (sem texto livre), ~150 no lançamento, por exemplo:
- **Do jogo:** "Desfile Elemental: Fogo" (os 12 elementos das cartas), "Vestido como uma
  carta" (cosplay de uma carta do TCG), "Look para enfrentar o andar 100", "Pescador(a)
  de Lendários", "Fazenda Chique", "Mergulho de Gala".
- **Do WIT:** "Cientista de IA", "Repórter do Jornal WIT", "Programador(a) de Games",
  "Astronauta do Metaverso".
- **Da vida:** escola, esporte, praia (sem biquíni: bermuda, camiseta, chapéu), inverno,
  aniversário, pijama, chuva, profissão dos sonhos, super-herói(na), realeza, futuro.
- **Moda:** anos 20, 60, 80, 2000, monocromático, cores opostas, "tudo estampado",
  esportivo chique, festa no castelo.
- **Brasil:** Festa Junina, Carnaval, folclore (Saci, Curupira, Iara), chita.

---

## 5. O camarim (as peças)

### Categorias
Cabelo (corte + cor + enfeite) · rosto (olhos, sobrancelha, maquiagem leve, **pintura
facial** de festa e de time, adesivos, sardas) · pele (os 6 tons que já existem) · parte
de cima · parte de baixo · vestidos e macacões · casacos · sapatos · meias · cabeça ·
rosto (óculos, máscara de festa) · pescoço · mãos (unhas, luvas, pulseiras) · bolsas e
mochilas · **na mão** (buquê, guarda-chuva, raquete, violão, troféu, **uma carta do
TCG**, o peixe recorde) · capas e asas de fantasia · **efeitos raros** (brilho, pétalas,
faíscas).

- Limite de peças: 12 no começo, 18 no rank alto (como o DTI).
- **Cor e estampa por código:** cada peça aceita 2 cores + 1 estampa (listras, bolinhas,
  xadrez, xadrez escocês, floral, oncinha, camuflado, estrelas, corações, degradê,
  glitter, chita). 300 peças × cores × estampas = milhares de looks **sem arte nova**.
- Algumas peças têm versão (manga curta/longa, cabelo preso/solto, capuz em cima/embaixo).

### Representatividade
Cabelos crespo, cacheado, black power, tranças, coque, raspado; óculos; aparelho nos
dentes; lenço e véu; cadeira de rodas como opção de passarela (desfila igual).

### Para todo mundo
As araras são por **estilo**, não por gênero: fofo, esportivo, elegante, rock,
streetwear, fantasia, uniforme, festa, tradicional. Streetwear, tênis, boné, camisa de
time, armadura, astronauta, cavaleiro, gamer e cosplay de carta puxam os meninos sem
precisar de uma "seção de menino".

### Raridade das peças (como as cartas)
| Raridade | De onde |
|---|---|
| Comum | araras (já liberadas) |
| Incomum | Boutique (moedas) |
| Rara | prêmios de desfile, festas do ano |
| Épica | feitas no Ateliê com tecido e corante da fazenda |
| Lendária | história, chefes da Torre (os acessórios de chefe já existem: `boss-prizes.ts`) |
| Joia | ourives do Lago (gemas de verdade; brilham na passarela) |
| **De grife** | criadas por um aluno, com o apelido dele na etiqueta |

---

## 6. Nota, voto e cuidado com as crianças

- Voto de 1 a 5 estrelas. A nota final é a **média sem a maior e a menor** (um voto de
  raiva não derruba ninguém) + um pouco do júri de moradores.
- **Ninguém vê quem deu quanto.** Só a média.
- Quem dá 1 estrela para todo mundo perde peso no voto, sem saber.
- Não dá para votar em si mesmo nem no próprio grupo de amigos repetidamente.
- **O professor pode desligar o voto da turma** e deixar só o júri (se perceber
  perseguição). Liga na aba do professor que já existe.
- Todo mundo que desfila ganha alguma coisa; o pódio ganha mais.

### O júri de moradores (as regras que dão nota sem gente)
| Jurado | Olha | Regra |
|---|---|---|
| Madame Celeste | **tema** | cada peça tem etiquetas (praia, inverno, elegante, esportivo, fofo, festa...); o tema pede algumas; conta quantas batem |
| Kiko | **cores** | cores vizinhas (análogas), opostas (complementares) ou de 3 pontas (tríade) no círculo de cores somam; misturar 6 cores sem ligação tira |
| Lulu | **acabamento** | look completo (cabeça aos pés), acessório, pose combinando com o tema |

Os jurados **explicam** a nota ("O azul e o laranja são cores opostas: combinação forte!").
Ensina teoria das cores jogando.

---

## 7. Progressão

### Rank (estrelas acumuladas)
| Rank | Estrelas | Quando (2 aulas por semana) | Libera |
|---|---|---|---|
| Novata(o) | 0 | — | araras básicas, 6 poses |
| Modelo | 50 | 1ª semana | 2ª caminhada, 14 peças |
| Modelo de Revista | 300 | 1 mês | maquiagem completa, Relâmpago |
| Top Model | 800 | 3 meses | 16 peças, poses raras |
| **Estilista** | 1.500 | 5 meses | **Ateliê** (criar peças), profissão Estilista |
| Diretor(a) Criativo(a) | 2.500 | 8 meses | 18 peças, Sala das Lendas |
| Ícone da Moda | 4.000 | 1 ano | efeitos raros de entrada |
| Lenda da Passarela | 6.000 | 1 ano e meio | título e moldura de perfil únicos |

Um desfile dá de 3 a 15 estrelas (a média recebida × um fator da colocação).

### Moedas
Moeda é a mesma do jogo (decidido: uma moeda só). Desfile paga pouco e tem limite de
desfiles pagos por dia, como os minijogos (`PAID_PER_DAY`), para não passar a Torre.

### Coleções
- **Closet** (% das peças)
- **Galeria** dos looks premiados
- **Capas de revista**: o look campeão da semana na turma vira capa da "Revista do Vale",
  que aparece no telão do Jornal WIT e no mural da praça
- Poses e caminhadas (~40 poses, 8 caminhadas)

---

## 8. Ateliê: de modelo a estilista (o jogo de longo prazo)

No rank Estilista o aluno **cria peças**:
1. Molde (camiseta, vestido, saia, calça, jaqueta, capa, chapéu...).
2. **Tecido** do tear da fazenda: algodão, lã, angorá, **seda** (a mais nobre).
3. **Cor** da tinturaria da fazenda (vermelho do urucum, azul do anil, amarelo da
   cúrcuma, misturados: a lição "misturar cores" já usa o modelo das tintas).
4. Estampa, botões, laços, **pérolas e gemas do lago**.
5. Nome escolhido numa lista pronta + o apelido: "Jaqueta Aurora — por <apelido>".

A peça pode ser usada, vendida na **vitrine da turma** (como as cartas já são vendidas
em `trades.ts`) ou dada de presente. Como toda peça é montada com partes aprovadas, não
existe peça inadequada. **Brechó:** trocar duas peças repetidas por uma nova
(reaproveitar, moda sustentável).

---

## 9. Passarela e história

- **O Baile de Máscaras da Ordem** (Cap. 9) acontece na Casa de Moda. Para entrar, o
  aluno deduz pelas fotos o traje dos membros (capa roxa, máscara dourada, broche de
  espiral, luvas pretas) e monta o disfarce no camarim. Traje errado: barrado na porta.
  Depois do Ato 3, a capa vira troféu e peça Lendária.
- **Pista falsa:** todo mundo desconfia da **Lulu** (óculos escuros sempre, vai a todo
  baile). É inocente: é fotossensível, igual a muita gente de verdade.
- A Casa de Moda guarda **moldes de 1926** no sótão: roupas da turma da Aurora para
  recriar no Ateliê (peças Lendárias).
- Roteiro completo: `docs/historia.md`.

---

## 10. Arte e técnica: o risco (e a fase 0)

O boneco do mapa (64 px) não serve para moda. A Passarela precisa de um **boneco grande**
(~512 px de altura) de frente, com peças que encaixam.

**Proposta técnica (recorte em camadas, como animação de recorte):**
- Um corpo base com proporção infantil, dividido em segmentos (tronco, braços, antebraços,
  pernas, canelas, cabeça).
- Cada peça desenhada **no mesmo molde**, em tons de cinza, dividida pelos mesmos
  segmentos (a manga segue o braço). A **cor e a estampa entram por código** (o mesmo
  princípio das rampas de cor que o boneco do mapa já usa em `outfit.ts`).
- **Poses** = girar os segmentos. **Caminhada** = boneco vindo em direção à câmera, com
  balanço e escala.
- Para desempenho: o look é desenhado **uma vez** num canvas e vira imagem para a
  passarela; nada de `mix-blend-mode` ou `backdrop-filter`.
- O boneco do mapa herda as cores principais do look e um acessório, para a moda
  aparecer na cidade.

**Fase 0 (antes de qualquer outra coisa):** 1 corpo, 20 peças, 3 poses, 4 estampas, uma
passarela curta. Testar duas origens de arte: (a) peças geradas na pipeline do GPT já
usada no projeto, sobre o molde; (b) peças desenhadas em vetor por código. **O Matheus
vê os prints e decide.** Se não ficar bonito, para aqui.

---

## 11. O que a Passarela ensina

Teoria das cores (análogas, complementares, tríade) · proporção e silhueta · história da
moda (temas por década) · cultura brasileira (chita, Festa Junina, folclore) ·
orçamento (clientes) · moda sustentável (brechó, reaproveitar) · profissões da moda
(estilista, modelista, costureira, fotógrafa, maquiadora).

---

## 12. Ordem de construção

| Onda | Entrega |
|---|---|
| M0 | Protótipo de arte (§10) e aprovação |
| M1 | Casa de Moda (prédio e salas), camarim com 80 peças, cor e estampa, Provador livre, Júri do Vale |
| M2 | Desfile do Dia (voto assíncrono), rank, Boutique, poses e caminhadas |
| M3 | Desfile ao vivo e **Desfile da Aula** (painel do professor) |
| M4 | Ateliê (tecido e corante da fazenda, joias do lago), vitrine da turma, capas de revista |
| M5 | Clientes (profissão Estilista), desfiles de festa, traje da Ordem para o Baile de Máscaras |

Código: `src/game/fashion/` (peças, etiquetas, júri, rank: funções puras com testes),
`src/components/fashion/` (camarim, passarela); banco: voto e "de grife" no servidor
(nova migração `_wit2_moda.sql`), seguindo o molde de trocas e eventos.
