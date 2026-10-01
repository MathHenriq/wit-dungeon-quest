# Profissões: 5 tarefas cada (proposta para aprovar)

Pedido do Matheus (01/10): cada profissão com **no mínimo 5 tarefas**. Regras:

- **uma divertida de verdade** (dá vontade de repetir);
- **uma que ensina algo da área** (IA programa bloquinhos, Comunicação escreve matéria...);
- **uma que faz andar pelo mapa** (conhecer o mundo enquanto trabalha);
- o resto: produção (o que vende) e social (com os colegas).

Os minijogos atuais (forno, ritmo, pintura, rótulos, circuito, pares, notícia,
bugs) foram reprovados como estão: **visual feio e sem graça**. Eles só voltam
com a arte do GPT (`docs/prompts-lote2.md`) e com a mecânica nova abaixo.
Nada de emoji: ícones e cenas são imagens.

Legenda: [existe] = a lógica já está pronta; [arte] = precisa de arte do GPT; [servidor] = precisa do servidor (entre alunos).

---

## Pescador (Lago Azul)
1. **Pescar** (divertida) — já existe: boia, fisgada, agulha. [existe] Melhorar: peixe puxando a linha (barra de tensão), peixe raro com briga mais longa. [arte] peixes do GPT.
2. **Diário do lago** (ensina: coleta de dados) — cada peixe pescado vai para uma tabela (hora, lugar, tamanho). Missão: descobrir "que horas aparece mais bagre?" olhando o gráfico do próprio diário.
3. **Peixe fresco** (explora) — encomenda: levar 3 peixes para a Padaria, a Casa do Pescador e a Casa da Lúcia antes de estragar.
4. **Limpeza do lago** (produção/ecologia) — pescar lixo (bota, lata) rende moedas da prefeitura e deixa o lago com mais peixe raro no dia.
5. **Torneio da semana** (social) [servidor] — maior peixe da turma na semana ganha título e aparece no quadro da Casa de Pesca.

## Fazendeiro (Fazenda do Vale)
1. **Plantar, regar, colher** (produção) — já existe. [existe]
2. **Hora da ordenha e da tosa** (divertida) — minijogo curtinho: escovar a ovelha até a lã ficar fofa; ordenha no ritmo. [arte]
3. **Calendário da horta** (ensina) — cada planta tem estação e tempo; montar o plano do mês para colher tudo junto no dia da feira.
4. **Rota do leite** (explora) — entregar leite e ovos em 4 casas do Centro e do Lago de manhã.
5. **Feira do sábado** (social) [servidor] — barraca na praça; os colegas compram.

## Padeiro (Padaria da Dona Rosa)
1. **Fazer pão de verdade** (divertida) [arte] — cena da bancada: pôr farinha, ovo, fermento e água na tigela (arrastando), misturar girando, **sovar** (arrastar a massa várias vezes), modelar (escolher o formato: bisnaga, trança, pão de forma), esperar crescer e tirar do forno na hora. O pão sai do jeito que você fez (formato e ponto) e aparece na mochila com a cara dele.
2. **Receita na medida** (ensina: frações) — a receita pede "1/2 xícara", "3/4 de colher": encher o copo medidor na marca certa.
3. **Cesta da manhã** (explora) — levar pães para 5 moradores marcados no mapa antes das 9h do jogo.
4. **Encomenda de bolo** (produção) — bolo de aniversário com cobertura e confeitos que você decora; o morador dá nota.
5. **Por que a massa cresce?** (ensina: ciência) — mini-experimento: massa com e sem fermento, quente e fria; ver qual cresce.

## Músico (Estúdio de Música)
1. **Compor** (divertida + ensina ritmo) — **sequenciador**: escolhe o instrumento (teclado, bateria, violão, flauta, xilofone), grade de 8 ou 16 tempos × notas, aperta TOCAR e ouve de verdade (som gerado no navegador). A música vira um **disco** com o nome que você der.
2. **Show na praça** (divertida) — o minijogo de ritmo, mas tocando **a música de um colega ou a sua**, com plateia de moradores. [arte] palco e plateia.
3. **Entregar discos** (explora) — encomendas de discos para casas pelo mapa (a casa X quer o disco Y).
4. **Afinar** (ensina: altura do som) — ouvir duas notas e dizer qual é mais aguda; girar a tarraxa até as duas soarem iguais.
5. **Rádio WIT** (social) [servidor] — as músicas dos alunos tocam no rádio da cidade (e no telão aparece o nome de quem fez).

## Artista (Ateliê de Arte)
1. **Pixel art livre** (divertida) — editor 16×16 com paleta; o desenho vira um quadro que pendura na sua casa ou vende.
2. **Pintar de memória** (desafio) — o atual, com a arte nova. [arte]
3. **Murais da cidade** (explora) — muros marcados no mapa; você pinta (o seu desenho aparece no muro para todos [servidor]).
4. **Mistura de cores** (ensina) — primárias e secundárias: chegar na cor pedida misturando tintas.
5. **Galeria** (social) [servidor] — exposição semanal; os colegas votam.

## Treinador de IA (Laboratório de IA)
1. **Robô gari** (divertida) — treina o robozinho que **recolhe lixo do chão na Cidade WIT**: separar exemplos (reciclável, orgânico, não é lixo). Quanto melhor o treino, mais ele acerta pela rua. Quem falar com ele ouve: "Fui treinado pelos alunos de IA para ajudar o mundo!". [arte] robô e lixos.
2. **Programar em blocos** (ensina: programação) — blocos bem simples (ANDE 2, VIRE À DIREITA, PEGUE, REPITA 3×) para levar o robô até o lixo num tabuleiro. Fases curtas, divertidas, cada vez com um bloco novo.
3. **Caça aos dados** (explora) — andar pelo mapa "fotografando" exemplos (flores, árvores, bichos) para o conjunto de dados.
4. **Teste do modelo** (ensina: acurácia) — o modelo erra alguns; você conta acertos e vê a porcentagem subir ao trocar exemplos ruins.
5. **Ensinar o WIT-Bot** (social) — escrever respostas para perguntas dos moradores; as aprovadas pelo professor viram falas do WIT-Bot.

## Técnico de IoT (Casa Inteligente)
1. **Circuito** (desafio) — o atual com arte nova. [arte]
2. **Regra SE/ENTÃO** (ensina: lógica) — "SE umidade < 30% ENTÃO liga o regador": montar regras com blocos e ver a horta funcionando.
3. **Instalar sensores** (explora) — levar sensores até pontos marcados (postes, horta, lago) pelo mapa.
4. **Conserto noturno** (divertida) — à noite, postes queimados piscam pela cidade; achar e consertar antes do tempo.
5. **Casa inteligente** (produção) — irrigador, lâmpada que acende sozinha, campainha: itens para a sua casa e a fazenda.

## Arquiteto do Metaverso (Metaverso)
1. **Montar sala virtual** (divertida) — editor isométrico de blocos; a sala vira um lugar que os colegas visitam [servidor].
2. **Coordenadas X, Y, Z** (ensina) — pôr o objeto no ponto pedido (x=3, y=2, z=1).
3. **Escanear a cidade** (explora) — "escanear" prédios do mapa para a biblioteca 3D.
4. **Pares 3D** (memória) — o atual com arte nova. [arte]
5. **Evento da semana** (social) [servidor] — decorar o salão virtual do evento.

## Repórter (Estúdio de Comunicação)
1. **Fotógrafo da cidade** (divertida + explora) — câmera no mapa: enquadrar, foto com moldura; as melhores vão para o **telão do Estúdio de Comunicação**.
2. **Escrever a matéria** (ensina) — montar a notícia em blocos (quem, o quê, onde, quando), conferir os fatos (pescaria do dia, andar da Torre, preços do Mercado) e escolher a manchete.
3. **Jornalzinho WIT** (produção) — as matérias da semana viram um jornalzinho que **qualquer um compra por 1 moeda** na casinha de Comunicação.
4. **Entrevista** (explora) — entrevistar 3 moradores marcados; as respostas viram a matéria.
5. **Fato ou boato?** (ensina) — checar manchetes falsas e verdadeiras com as pistas do próprio jogo.

## Desenvolvedor de Games (Oficina de Games)
1. **Criar fase** (divertida) — editor de fase simples (chão, espinho, moeda, bandeira); a fase vai para o fliperama e os colegas jogam [servidor].
2. **Lógica do jogo** (ensina) — regras com blocos: "SE encostar no espinho ENTÃO perde 1 vida".
3. **Caça-bugs no mapa** (explora) — "glitches" escondidos pelo mundo (um poste piscando estranho, um bloco fora do lugar).
4. **Testar jogos** (desafio) — o atual com arte nova. [arte]
5. **Torneio do fliperama** (social) [servidor] — recorde da semana.

## Entregador (Central de Entregas)
1. **Entregas** — já existe. [existe]
2. **Melhor rota** (ensina) — 3 entregas, escolher a ordem; o jogo mostra a distância de cada rota.
3. **Drone** (divertida) — pilotar o drone até a ilha do farol desviando de pássaros.
4. **Expressa** (desafio) — prazo curto, corrida pela cidade.
5. **Correio entre alunos** (social) [servidor] — levar cartas de um colega para a caixa de correio de outro.

## Comerciante (Mercado Central)
1. **Mercado** — já existe (oferta e procura). [existe]
2. **Ler o gráfico** (ensina: análise de dados) — gráfico de linha do preço de cada item nos últimos dias; prever se amanhã sobe ou desce e ganhar bônus se acertar.
3. **Compra e venda** (desafio) — comprar barato num lugar (Casa de Pesca, barraca da fazenda) e vender caro no Mercado.
4. **Minha barraca** (divertida) — você define o preço; os moradores compram mais se estiver barato e menos se estiver caro (vê a curva da procura na prática).
5. **Pesquisa de mercado** (explora) — perguntar a moradores pelo mapa o que eles querem comprar; a resposta mexe na procura do dia.

---

**Ordem sugerida:** Padeiro (pão de verdade) e Músico (compor) primeiro, porque
o Matheus citou os dois; depois IA (robô gari + blocos) e Comunicação (fotos +
jornalzinho). Cada um só entra com print aprovado.
