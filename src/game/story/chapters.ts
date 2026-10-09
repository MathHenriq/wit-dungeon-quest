// "Cartas Marcadas" (docs/historia.md): os capítulos em dados. Cada passo diz
// onde o aluno vai, com quem fala e o que acontece. A ordem é a do roteiro e
// não muda: um passo só abre depois do anterior.
//
// Quem é quem (ids de src/game/world/content.ts e das salas de interior/room.ts):
//   passeio-2 = Mari · guia = Lia · loja = Duda · torre = Kaio · arena = Rex
//   padeiro = Dona Rosa · pipo = Pipo · tina = Tina · beto = Beto · joca = Seu Joca
//   lojista = Caio · passeio-1 = Enzo · passeio-3 = Gui · mural = Nico · musico = Toni
//   oficina.barista = Dona Ana · arena.recepcao = Rafa · amaro = Homem da Neblina
import type { Capitulo, Regra, Visivel } from './engine';
import { linhaDe } from './engine';

export const CAPITULOS: Capitulo[] = [
  {
    id: 'prologo', ato: 1, num: 0, titulo: 'Chegada',
    resumo: 'Uma carta em branco no bolso. A Mari desconfiava dos pacotinhos da Loja. Naquela noite, o farol apagado piscou. No dia seguinte, a Mari tinha sumido.',
    passos: [
      { id: 'pro-bolso', tipo: 'lugar', zona: '*', objetivo: 'Olhe o que tem no seu bolso', onde: 'qualquer lugar',
        pistas: ['carta-branca'],
        falas: [
          'Você põe a mão no bolso e acha uma carta.',
          'A frente está em branco. No verso, uma espiral.',
          'Você não lembra de onde ela veio. Na verdade... você não lembra de muita coisa de antes de chegar ao Vale.',
        ] },
      { id: 'pro-mari', tipo: 'falar', quem: 'passeio-2', objetivo: 'Converse com a menina de cabelo lilás', onde: 'Centro',
        falas: [
          'Mari: Ei! Você é novo, né? Eu sou a Mari.',
          'Mari: Posso te contar uma coisa? Tem algo esquisito nos pacotinhos da Loja.',
          'Mari: Toda carta nova aparece logo depois que alguém "viaja". E ninguém volta da viagem.',
          'Mari: Hoje à noite vou dar uma olhada nos fundos da Loja. Amanhã eu te conto!',
        ] },
      { id: 'pro-farol', tipo: 'lugar', zona: '*', quando: { noite: true }, marca: 'farol-piscou',
        objetivo: 'Espere a noite chegar', onde: 'ao ar livre',
        falas: [
          'Lá longe, no Lago Azul, uma luz pisca. Uma vez só.',
          'O farol. Dizem que está apagado há 40 anos.',
          'Por um segundo, a carta em branco no seu bolso ficou quente.',
        ] },
      { id: 'pro-sumiu', tipo: 'lugar', zona: 'cidade', quando: { depoisDe: 'farol-piscou', dia: true },
        objetivo: 'No dia seguinte, procure a Mari', onde: 'Centro',
        falas: [
          'A Mari disse que hoje contaria o que viu nos fundos da Loja.',
          'Mas ela não está na praça. Nem na Oficina. Nem em lugar nenhum.',
        ] },
    ],
  },
  {
    id: 'cap1', ato: 1, num: 1, titulo: 'A menina que ninguém lembra',
    resumo: 'A casa da Mari parece abandonada há anos e quase ninguém lembra dela. Só o Pipo, o Rex e a Dona Rosa, que não tomam o café da Dona Ana. No caderno da Mari: "Todo mundo que toma o café da Dona Ana fica esquecido. Vou falar com a guia."',
    passos: [
      { id: 'c1-casa', tipo: 'porta', zona: 'cidade', predio: 'casa-rosa', objetivo: 'Vá até a casa da Mari (a casa rosa, no alto do Centro)', onde: 'Centro',
        falas: [
          'A porta está destrancada.',
          'Lá dentro, tudo coberto de pó. Teias nos cantos. Como se ninguém morasse aqui há anos.',
          'Mas ontem a Mari estava aqui. Você tem certeza.',
        ] },
      { id: 'c1-perguntar', tipo: 'varios', precisa: 5, objetivo: 'Pergunte pela Mari aos moradores', onde: 'Centro',
        dica: 'Fale com quem passa: a guia, a vendedora, o guardião da Torre, o repositor, os estudantes, o músico, a Dona Ana.',
        quem: ['guia', 'loja', 'torre', 'lojista', 'passeio-1', 'passeio-3', 'mural', 'musico', 'oficina.barista'],
        falas: {
          guia: ['Lia: Mari? Não tem nenhuma Mari no Vale.', 'Lia: E olha que eu conheço TODO mundo aqui.'],
          loja: ['Duda: Quem? Nunca ouvi falar.', 'Duda: Olha, chegou pacotinho novo! Quer ver?'],
          torre: ['Kaio: Mari... não. Nenhuma Desafiante com esse nome subiu a Torre.', 'Kaio: Por que tanta pergunta?'],
          lojista: ['Caio: Mari? Hmm... não. Acho que não.'],
          'passeio-1': ['Enzo: Não conheço. Ela é de outra turma?'],
          'passeio-3': ['Gui: Cabelo lilás? Nunca vi ninguém assim por aqui.'],
          mural: ['Nico: Não tem nenhuma Mari no mural. Nem nunca teve.'],
          musico: ['Toni: Mari... Mari... não rima com nada que eu conheça.'],
          'oficina.barista': ['Dona Ana: Mari? Não conheço, querido.', 'Dona Ana: Aceita um cafezinho? É por conta da casa.'],
        },
        fim: ['Ninguém lembra dela. É como se a Mari nunca tivesse existido.'] },
      { id: 'c1-lembram', tipo: 'varios', precisa: 3, objetivo: 'Ache quem ainda lembra da Mari', onde: 'Lago, Arena e Padaria',
        dica: 'Tente quem você ainda não perguntou: a criança da praia do Lago, o campeão da Arena, a padeira.',
        quem: ['pipo', 'arena', 'padeiro'],
        falas: {
          pipo: ['Pipo: A Mari? Claro que eu lembro! Ela me ensinou a pular corda.', 'Pipo: Minha mãe não deixa eu tomar café, aí eu fico aqui na praia o dia todo.', 'Pipo: ...Por que todo mundo tá fingindo que ela não existe?'],
          arena: ['Rex: A do cabelo lilás? Lembro. Ela me venceu num duelo semana passada. Não espalha.', 'Rex: E não, eu não vou tomar o café da Dona Ana. Café é para fracos.'],
          padeiro: ['Dona Rosa: A Mari? Ela compra pão de queijo toda manhã. Hoje não veio.', 'Dona Rosa: Eu só tomo o meu chá de erva-doce. O café da Ana? Nunca provei.', 'Dona Rosa: Por quê, aconteceu alguma coisa com a menina?'],
        },
        fim: ['Três pessoas lembram. Todo o resto esqueceu.'] },
      { id: 'c1-mochila', tipo: 'pegar', zona: 'cidade', tx: 46, ty: 13, objetivo: 'Procure pistas atrás da Loja de Pacotinhos', onde: 'Centro',
        pistas: ['mochila-mari', 'caderno-mari'],
        falas: [
          'Atrás da Loja, escondida entre caixas vazias: uma mochila lilás. É da Mari!',
          'Dentro, um caderno. A última página diz:',
          '"Todo mundo que toma o café da Dona Ana fica esquecido. Vou falar com a guia."',
        ] },
      { id: 'c1-pergunta', tipo: 'pergunta', objetivo: 'Responda no Caderno: o que eles têm em comum?', onde: 'Caderno',
        pergunta: 'O Pipo, o Rex e a Dona Rosa lembram da Mari. O que os três têm em comum?',
        opcoes: ['Moram perto do Lago', 'Nenhum deles toma o café da Dona Ana', 'São da mesma guilda', 'Duelam na Arena'],
        certa: 1, erro: 'Não bate com o que eles disseram. Releia as falas no Caderno.',
        falas: ['É isso: quem toma o café da Dona Ana esquece.', 'Mas por que um café faria alguém esquecer?'] },
    ],
  },
  {
    id: 'cap2', ato: 1, num: 2, titulo: 'O café',
    resumo: 'Quem toma o café da Dona Ana não lembra do dia anterior. No lixo do café: pétalas roxas, de uma flor que só nasce em estufa. E a única estufa do Vale é a do Seu Joca, trancada há anos.',
    passos: [
      { id: 'c2-observar', tipo: 'esperar', zona: 'sala:oficina', segundos: 20, objetivo: 'Fique na Oficina de Cartas e observe o balcão da Dona Ana', onde: 'Oficina de Cartas',
        dica: 'Só ficar lá dentro um tempinho, de olho.',
        falas: [
          'Você fica num canto, de olho no balcão.',
          'Em pouco tempo, três clientes pedem café: o Caio, o Gui e o Enzo.',
          'A Dona Ana serve uma xícara roxinha, de cheiro doce. Eles bebem tudo.',
        ] },
      { id: 'c2-ontem', tipo: 'varios', precisa: 3, objetivo: 'Pergunte ao Caio, ao Gui e ao Enzo o que fizeram ontem', onde: 'Centro',
        quem: ['lojista', 'passeio-3', 'passeio-1'],
        falas: {
          lojista: ['Caio: Ontem? Eu... repus as caixas. Acho. Que estranho, não lembro direito.'],
          'passeio-3': ['Gui: Ontem eu fui... fui... Que pergunta difícil! Não sei.'],
          'passeio-1': ['Enzo: Eu tava na Torre? Ou no Lago? Minha cabeça tá meio vazia hoje.'],
        },
        fim: ['Os três tomaram o café. Nenhum lembra do dia de ontem.'] },
      { id: 'c2-lixo', tipo: 'pegar', zona: 'cidade', tx: 16, ty: 13, quando: { noite: true },
        objetivo: 'À noite, mexa no lixo atrás da Oficina de Cartas', onde: 'Centro',
        antes: ['Tem gente demais passando agora. Melhor voltar à noite.'],
        pistas: ['petalas'],
        falas: [
          'Você revira o lixo atrás da Oficina, olhando para os lados...',
          'Entre a borra de café: pétalas roxas, secas, com um cheiro doce.',
          'O mesmo cheiro do café da Dona Ana.',
        ] },
      { id: 'c2-tina', tipo: 'falar', quem: 'tina', objetivo: 'Mostre as pétalas para a Tina (barraca de sementes)', onde: 'Fazenda',
        falas: [
          'Tina: Deixa eu ver... Que cor estranha.',
          'Tina: Isso não nasce em canteiro, não. Só numa estufa bem quentinha.',
          'Tina: A única estufa do Vale é a da fazenda. A do Seu Joca. Trancada há anos.',
        ] },
    ],
  },
  {
    id: 'cap3', ato: 1, num: 3, titulo: 'O Homem da Neblina',
    resumo: 'Um homem de capa cinza avisou: "Não confie na guia". A Lia disse que ele era perigoso e achou uma pétala no armário do Rex. Mas o Rex treinava na hora do sumiço, e quem pegou a chave do armário dele foi a própria Lia.',
    passos: [
      { id: 'c3-cais', tipo: 'falar', quem: 'amaro', quando: { neblina: true },
        objetivo: 'Numa manhã de neblina (5h às 10h), vá até a ponta do cais do Lago Azul', onde: 'Lago Azul',
        pistas: ['bilhete-cais'],
        falas: [
          'Um homem de capa cinza, de costas, olhando a água.',
          'Homem: Não confie na guia.',
          'Ele enfia um bilhete na sua mão e some na neblina.',
          'No bilhete, a mesma frase: "Não confie na guia."',
        ] },
      { id: 'c3-lia', tipo: 'falar', quem: 'guia', objetivo: 'Conte para a Lia o que aconteceu', onde: 'Centro',
        pistas: ['petala-rex'],
        falas: [
          'Lia: Você foi no cais? Cuidado com aquele homem da neblina. Ele é perigoso, todo mundo sabe.',
          'Lia: Escuta, eu também ando investigando. E achei uma coisa.',
          'Lia: Uma pétala roxa no armário do Rex, na Arena. Será que foi ele que sumiu com a tal menina?',
        ] },
      { id: 'c3-rex', tipo: 'falar', quem: 'arena', objetivo: 'Pergunte ao Rex sobre a pétala', onde: 'Centro, na frente da Arena',
        falas: [
          'Rex: Pétala no MEU armário? Eu nem sei o que é isso!',
          'Rex: Na noite em que ela sumiu eu tava treinando na Arena até meia-noite.',
          'Rex: Pergunta para a Rafa, na recepção. Ela anota tudo.',
        ] },
      { id: 'c3-rafa', tipo: 'falar', quem: 'arena.recepcao', objetivo: 'Confira o caderno de treinos com a Rafa (recepção da Arena)', onde: 'Arena',
        pistas: ['chave-armario'],
        falas: [
          'Rafa: O caderno de treinos? Deixa eu ver...',
          'Rafa: Rex: das 20h à meia-noite, sem sair. Está anotado.',
          'Rafa: O armário dele? Engraçado... só uma pessoa pediu a chave emprestada esta semana.',
          'Rafa: A guia. A Lia.',
        ] },
      { id: 'c3-rex2', tipo: 'falar', quem: 'arena', objetivo: 'Conte ao Rex o que a Rafa disse', onde: 'Centro, na frente da Arena',
        marca: 'rex-aliado',
        falas: [
          'Rex: A LIA? A guia? Ela é a pessoa mais simpática do Vale...',
          'Rex: Alguém está brincando com a gente, novato.',
          'Rex: Pode contar comigo. Se precisar de um duelista, eu tô aqui.',
        ] },
    ],
  },
  {
    id: 'cap4', ato: 1, num: 4, titulo: 'A estufa',
    resumo: 'Com as vacas soltas, o Seu Joca largou o chaveiro. Na estufa trancada: canteiros da flor roxa, caixas com a espiral e um bilhete em código. O Seu Joca confessou: deve dinheiro ao Sir Téo, e "disseram que era chá calmante".',
    passos: [
      { id: 'c4-joca', tipo: 'falar', quem: 'joca', objetivo: 'Pergunte ao Seu Joca sobre a estufa', onde: 'Fazenda',
        falas: [
          'Seu Joca: A estufa? Tá quebrada. Fechada há anos. Não tem nada lá.',
          'Seu Joca: E a chave fica comigo. Sempre.',
          'Ele balança o chaveiro preso no cinto, sem tirar os olhos de você.',
        ] },
      { id: 'c4-beto', tipo: 'falar', quem: 'beto', objetivo: 'Peça ajuda ao Beto, o cuidador dos bichos', onde: 'Fazenda',
        marca: 'vacas-soltas',
        falas: [
          'Beto: Tirar o Seu Joca de perto do chaveiro? Fácil.',
          'Beto: As vacas adoram uma corridinha. Se eu esquecer a porteira aberta...',
          'Beto: Opa! Olha o Seu Joca correndo atrás delas! Vai, rápido!',
        ] },
      { id: 'c4-chave', tipo: 'pegar', zona: 'fazenda', tx: 31, ty: 13, objetivo: 'Pegue o chaveiro na varanda da Casa da Fazenda', onde: 'Fazenda',
        pistas: ['chave-estufa'],
        falas: [
          'No banco da varanda: o chaveiro do Seu Joca, esquecido na correria!',
          'Uma das chaves tem uma folhinha desenhada. Deve ser a da estufa.',
        ] },
      { id: 'c4-estufa', tipo: 'porta', zona: 'fazenda', predio: 'estufa', quando: { noite: true },
        objetivo: 'À noite, entre na estufa (canto direito da Fazenda)', onde: 'Fazenda',
        antes: ['Ainda está claro: o Seu Joca ia ver você. Volte à noite.'],
        pistas: ['flor-esquecimento', 'bilhete-espiral'], alerta: 1,
        falas: [
          'A chave gira. A porta range.',
          'Lá dentro, canteiros e mais canteiros de flores roxas, com o mesmo cheiro doce das pétalas.',
          'Num canto, caixas de madeira com uma espiral pintada. Igual à do verso da sua carta.',
          'Em cima das caixas, um bilhete com desenhos no lugar das letras. Você guarda o bilhete.',
        ] },
      { id: 'c4-flagra', tipo: 'escolha', quem: 'joca', objetivo: 'O Seu Joca viu a luz na estufa. Fale com ele', onde: 'Fazenda',
        pergunta: ['Seu Joca: Você... entrou na estufa?!', 'Seu Joca: Por favor. Não conta para ninguém.'],
        opcoes: [
          { texto: 'Contar para todo mundo', marca: 'joca-exposto', falas: [
            'Seu Joca: Então eu perco a fazenda...',
            'Seu Joca: Eu devo dinheiro ao Sir Téo. Ele mandou plantar. Disseram que era chá calmante, eu juro.',
            'Ele entra em casa e bate a porta.',
          ] },
          { texto: 'Guardar segredo', marca: 'joca-informante', falas: [
            'Seu Joca: Obrigado. De verdade.',
            'Seu Joca: Eu devo dinheiro ao Sir Téo. Ele mandou plantar. Disseram que era chá calmante...',
            'Seu Joca: Se eu souber de alguma coisa, te conto. Prometo.',
          ] },
        ] },
    ],
  },
  {
    id: 'cap5', ato: 1, num: 5, titulo: 'A carta da Mari',
    resumo: 'Saiu nos pacotinhos uma carta nova com o rosto da Mari: gente vira carta. Todas as pistas apontavam para a guia, e a Lia não negou. No cais, o Homem da Neblina contou quem é: Amaro, o faroleiro, que passou 40 anos dentro de uma carta e saiu na mesma noite em que você chegou.',
    passos: [
      { id: 'c5-duda', tipo: 'falar', quem: 'loja', objetivo: 'Veja a novidade da Loja de Pacotinhos', onde: 'Centro',
        pistas: ['carta-mari'],
        falas: [
          'Duda: Chegou carta NOVA na coleção! Olha que linda!',
          'Duda: "Garota do Cabelo Lilás". Saiu num pacotinho hoje cedo. Toma, de brinde.',
          'Você olha a carta. O rosto é o da Mari.',
          'No verso, a espiral.',
        ] },
      { id: 'c5-pergunta', tipo: 'pergunta', objetivo: 'Junte as pistas no Caderno', onde: 'Caderno',
        pergunta: 'Com quem a Mari ia falar na noite em que sumiu?',
        opcoes: ['Com a Duda', 'Com a guia, a Lia', 'Com o Rex', 'Com o Kaio'],
        certa: 1, erro: 'Releia o caderno da Mari e o que a Rafa disse na Arena.',
        falas: [
          'O caderno da Mari: "vou falar com a guia".',
          'A chave do armário do Rex: quem pediu foi a guia.',
          'O bilhete do cais: "não confie na guia".',
          'Tudo aponta para a Lia.',
        ] },
      { id: 'c5-lia', tipo: 'falar', quem: 'guia', objetivo: 'Confronte a Lia', onde: 'Centro',
        marca: 'lia-revelada', alerta: 1,
        falas: [
          'Lia: Oi! Achou alguma coisa hoje?',
          'Você mostra o caderno da Mari.',
          'Lia: ...',
          'Lia: Ah. Você não devia lembrar de nada disso.',
          'Lia: Que pena. Eu gostava de você.',
          'Ela vira as costas e vai embora, devagar, sorrindo.',
        ] },
      { id: 'c5-amaro', tipo: 'falar', quem: 'amaro', quando: { neblina: true }, marca: 'ato1',
        objetivo: 'Volte à ponta do cais numa manhã de neblina', onde: 'Lago Azul',
        falas: [
          'O homem da capa está lá de novo. Desta vez ele tira o capuz.',
          'Amaro: Meu nome é Amaro. Eu era o faroleiro.',
          'Amaro: Passei 40 anos dentro de uma carta.',
          'Amaro: Saí na noite em que o farol piscou...',
          'Amaro: ...a mesma noite em que você chegou ao Vale.',
          'FIM DO ATO 1. O Ato 2, "A Ordem do Verso", vem aí.',
        ] },
    ],
  },
];

export const LINHA = linhaDe(CAPITULOS);

/** Pistas do Caderno. */
export const PISTAS: Record<string, { nome: string; texto: string }> = {
  'carta-branca': { nome: 'Carta em Branco', texto: 'Estava no seu bolso quando você chegou. A frente é branca; no verso, uma espiral. Esquentou quando o farol piscou.' },
  'mochila-mari': { nome: 'Mochila da Mari', texto: 'Lilás, escondida entre caixas atrás da Loja de Pacotinhos.' },
  'caderno-mari': { nome: 'Caderno da Mari', texto: '"Todo mundo que toma o café da Dona Ana fica esquecido. Vou falar com a guia."' },
  petalas: { nome: 'Pétalas roxas', texto: 'Do lixo atrás do café da Dona Ana. Cheiro doce, igual ao do café. A Tina diz que só nascem em estufa.' },
  'bilhete-cais': { nome: 'Bilhete do cais', texto: '"Não confie na guia." Do homem de capa cinza que aparece com a neblina.' },
  'petala-rex': { nome: 'Pétala no armário do Rex', texto: 'Quem achou foi a Lia. Mas o Rex treinava na Arena na hora do sumiço.' },
  'chave-armario': { nome: 'Chave do armário', texto: 'A Rafa, da recepção da Arena: só a guia pediu a chave do armário do Rex emprestada.' },
  'chave-estufa': { nome: 'Chaveiro do Seu Joca', texto: 'Uma das chaves tem uma folhinha desenhada: a da estufa.' },
  'flor-esquecimento': { nome: 'Flor roxa da estufa', texto: 'Canteiros inteiros dentro da estufa trancada do Seu Joca. É ela que vai no café.' },
  'bilhete-espiral': { nome: 'Bilhete em código', texto: 'Desenhos de espiral no lugar das letras. Ainda não dá para ler.' },
  'carta-mari': { nome: 'Garota do Cabelo Lilás', texto: 'A "carta nova" da Loja. O rosto é o da Mari. No verso, a espiral.' },
};

/** Cartas Seladas (página "Desaparecidos" do Caderno): gente que virou carta. */
export const SELADAS: { pista: string; nome: string; quem: string; npc: string; cor: string }[] = [
  { pista: 'carta-mari', nome: 'Garota do Cabelo Lilás', quem: 'Mari', npc: 'passeio-2', cor: '#9474d0' },
];

const LIA_DOCE = ['Lia: Bom dia! Bem-vindo ao Vale!', 'Lia: Precisa de ajuda com alguma coisa?'];

/** O que os moradores dizem fora dos passos, conforme a história anda. */
export const REGRAS_FALA: Regra[] = [
  { quem: 'pipo', de: 'c1-mochila', falas: ['Pipo: Você vai achar a Mari, né? Promete?'] },
  { quem: 'padeiro', de: 'c1-mochila', falas: ['Dona Rosa: Ainda nada da menina? Cuida bem dessa história, viu.'] },
  { quem: 'arena', de: 'c1-mochila', ate: 'c3-cais', falas: ['Rex: Achou a do cabelo lilás? Se precisar de um duelista, me chama.'] },
  { quem: 'arena', de: 'c3-rex2', falas: ['Rex: Tô de olho na guia. Qualquer coisa, me chama.'] },
  { quem: 'tina', de: 'c2-tina', falas: ['Tina: Ainda pensando naquelas pétalas... A estufa do Seu Joca fica no canto direito da fazenda.'] },
  { quem: 'joca', de: 'c4-joca', ate: 'c4-flagra', falas: ['Seu Joca: Já disse: não tem nada na estufa.'] },
  { quem: 'joca', de: 'c5-duda', marca: 'joca-informante', falas: ['Seu Joca: Psiu... o Sir Téo passou aqui ontem à noite. Levou duas caixas da estufa.'] },
  { quem: 'joca', de: 'c5-duda', marca: 'joca-exposto', falas: ['Seu Joca: Me deixa em paz.'] },
  { quem: 'beto', de: 'c4-chave', falas: ['Beto: Demorou três horas para juntar as vacas. Valeu a pena?'] },
  { quem: 'guia', de: 'c3-rex', ate: 'c5-lia', falas: ['Lia: E aí, foi falar com o Rex? Eu sabia que tinha algo errado com ele.'] },
  { quem: 'guia', de: 'c5-amaro', falas: LIA_DOCE },
  { quem: 'loja', de: 'c5-pergunta', falas: ['Duda: Gostou da carta nova? Logo logo chegam outras.'] },
];

/** Quem só aparece em certas partes da história. */
export const REGRAS_VISIVEL: Visivel[] = [
  // a Mari some na manhã seguinte ao farol piscar
  { quem: 'passeio-2', ate: 'pro-sumiu' },
  // o Homem da Neblina só aparece na neblina, quando a história pede
  { quem: 'amaro', soNoPasso: true },
];
