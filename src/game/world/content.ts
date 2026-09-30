// Textos da cidade: o que cada prédio vai ter e o que os moradores dizem.
import type { Dir } from './movement';
import type { Look } from './outfit';
import type { NpcJob } from './jobs';
import type { ZoneId } from './zone';

export const BUILDING_INFO: Record<string, { title: string; text: string }> = {
  torre: { title: 'Torre dos 100 Andares', text: 'A dungeon. Cada andar é um duelo de cartas; a cada 10 andares, um chefe que pode te dar uma carta do deck dele.' },
  centro: { title: 'Oficina de Cartas', text: 'Aqui não se compra nada: monte seu deck, complete o álbum, forje a carta que falta e troque duplicatas com os colegas.' },
  loja: { title: 'Loja de Pacotinhos', text: 'O único lugar que vende: pacotinhos de cartas, roupas, móveis e as Recompensas da Sala (tablet, VR, música na Alexa).' },
  arena: { title: 'Arena', text: 'Duelos PvP: contra a IA jogando com o deck de um colega, ou ao vivo.' },
  guildas: { title: 'Castelo das Guildas', text: 'Sua equipe, a meta de presença da semana e o chefe da guilda.' },
  'sua-casa': { title: 'Sua Casa', text: 'Personalize seu personagem e decore sua casa com móveis.' },
  // Lago Azul
  'casa-pesca': { title: 'Casa de Pesca', text: 'O quadro dos peixes do dia, a venda do que você pescou e o álbum de peixes do lago.' },
  'loja-iscas': { title: 'Loja de Iscas', text: 'Varas melhores e iscas para peixes raros chegam com a profissão de pescador (em breve).' },
  farol: { title: 'Farol', text: 'Lá de cima dá para ver o mundo todo.' },
  // Fazenda do Vale
  'casa-fazenda': { title: 'Casa da Fazenda', text: 'A casa do Seu Joca. Em breve: a cozinha onde as colheitas viram receitas.' },
  celeiro: { title: 'Celeiro', text: 'Onde as vacas e as ovelhas dormem. Em breve: comprar bichos e cuidar deles lá dentro.' },
  galinheiro: { title: 'Galinheiro', text: 'As galinhas botam ovos todo dia. Pegue no ninho, em frente à porta.' },
  estufa: { title: 'Estufa', text: 'Aqui dentro as plantas crescem o ano todo, faça chuva ou faça sol. (Em breve.)' },
  moinho: { title: 'Moinho', text: 'Transforma o trigo em farinha para a Padaria da Dona Rosa. (Em breve.)' },
  // Cidade WIT
  'lab-ia': { title: 'Laboratório de IA', text: 'Curso de Inteligência Artificial. Profissões: treinador de IA e cientista de dados. Em breve: rotular dados e treinar o WIT-Bot.' },
  'casa-iot': { title: 'Casa Inteligente', text: 'Curso de IoT (ambientes inteligentes). Profissões: técnico de IoT e instalador. Em breve: montar sensores e o irrigador automático da fazenda.' },
  estudio: { title: 'Estúdio de Comunicação', text: 'Curso de Comunicação Digital. Profissões: repórter, criador de conteúdo e locutor. Daqui sai o Jornal WIT do telão; em breve, a Rádio WIT.' },
  metaverso: { title: 'Metaverso', text: 'Curso de Metaverso. Profissões: arquiteto do metaverso e designer 3D. O portal leva à Sala Virtual (em breve).' },
  entregas: { title: 'Central de Entregas', text: 'Profissão: entregador. Os drones levam as encomendas entre os alunos (em breve).' },
  'oficina-games': { title: 'Oficina de Games', text: 'Curso de Oficina de Games. Profissões: desenvolvedor e testador de games. Em breve: fases criadas pelos alunos nos fliperamas.' },
  mercado: { title: 'Mercado Central', text: 'Profissão: comerciante. Em breve: a bolsa de preços, que sobem e descem com a oferta e a procura.' },
  'estudio-musica': { title: 'Estúdio de Música', text: 'Profissão: músico. Em breve: gravar discos que tocam na sua casa e na Rádio WIT.' },
  atelie: { title: 'Ateliê de Arte', text: 'Profissão: artista. Em breve: pintar quadros para decorar as casas.' },
  'casa-coworking': { title: 'Coworking WIT', text: 'Onde as equipes se juntam para os projetos. Em breve: missões em grupo.' },
};

/** Modelos de casa (sprites em public/game/world). As 3 iniciais e as 7 que se compram. */
export const HOUSE_MODELS: { id: string; sprite: string; title: string; inicial: boolean; tilesW?: number }[] = [
  { id: 'modelo-chale', sprite: 'casa-chale', title: 'Chalé de Madeira', inicial: true },
  { id: 'modelo-tijolo', sprite: 'casa-tijolo', title: 'Casinha de Tijolo', inicial: true },
  { id: 'modelo-moderna', sprite: 'casa-moderna', title: 'Casa Moderna', inicial: true },
  { id: 'modelo-futurista', sprite: 'casa-futurista', title: 'Casa Futurista', inicial: false },
  { id: 'modelo-arvore', sprite: 'casa-arvore', title: 'Casa na Árvore', inicial: false },
  { id: 'modelo-gamer', sprite: 'casa-gamer', title: 'Casa Gamer', inicial: false },
  { id: 'modelo-japonesa', sprite: 'casa-japonesa', title: 'Casa Japonesa', inicial: false },
  { id: 'modelo-montanha', sprite: 'casa-montanha', title: 'Chalé de Montanha', inicial: false },
  { id: 'modelo-castelo', sprite: 'casa-castelo', title: 'Mini Castelo', inicial: false },
  { id: 'modelo-foguete', sprite: 'casa-foguete', title: 'Casa Foguete', inicial: false, tilesW: 4 },
];

/** Casas dos moradores do Bairro Novo (sprites em public/game/world). */
export const NPC_HOUSES: { id: string; sprite: string; title: string }[] = [
  { id: 'npc-padaria', sprite: 'casa-padaria', title: 'Padaria da Dona Rosa' },
  { id: 'npc-floricultura', sprite: 'casa-floricultura', title: 'Floricultura' },
  { id: 'npc-inventor', sprite: 'casa-inventor', title: 'Oficina do Inventor' },
  { id: 'npc-pescador', sprite: 'casa-pescador', title: 'Casa do Pescador' },
  { id: 'npc-musico', sprite: 'casa-musico', title: 'Casa do Músico' },
  { id: 'npc-fazendeiro', sprite: 'casa-fazendeiro', title: 'Casa do Fazendeiro' },
  { id: 'npc-bibliotecaria', sprite: 'casa-bibliotecaria', title: 'Casa da Bibliotecária' },
  { id: 'npc-artista', sprite: 'casa-artista', title: 'Ateliê da Artista' },
];

export function houseInfo(id: string, name: string): { title: string; text: string } {
  const npc = NPC_HOUSES.find(h => h.id === id);
  if (npc) return { title: npc.title, text: 'Casa de um morador do Bairro Novo. No futuro: entrar, conversar e ganhar missões.' };
  const m = HOUSE_MODELS.find(h => h.id === id);
  if (!m) return { title: name, text: HOUSE_INFO.text };
  return m.inicial
    ? { title: m.title, text: 'Casa inicial: um dos modelos que o aluno pode escolher ao começar.' }
    : { title: m.title, text: 'Modelo à venda: comprando na Loja, a sua casa vira esta.' };
}

export const HOUSE_INFO = { title: 'Casa de um morador', text: 'No futuro, a casa dos seus amigos: visite, veja a decoração e deixe um recado.' };

export interface NpcDef {
  id: string;
  tx: number;
  ty: number;
  dir: Dir;
  look: Look;
  /** Nome e título na plaquinha (aparece quando o jogador chega perto). */
  name: string;
  title: string;
  lines: string[];
  /** Trabalho na cidade (pescar, tocar, fazer pão...) ou passeio; sem isso, fica perto de casa. */
  job?: NpcJob;
  /** Área onde mora (sem isso, o Centro). */
  zona?: ZoneId;
}

export const NPCS: NpcDef[] = [
  { id: 'guia', name: 'Lia', title: 'Guia da Cidade', tx: 33, ty: 23, dir: 'west', look: { modelo: 'modelo-05', pele: 'pele-2', cabelo: 'loiro', cima: 'verde', baixo: 'jeans' },
    lines: ['Bem-vindo à Cidade WIT!', 'Aqui tudo gira em torno das cartas. Explore os prédios!'] },
  { id: 'torre', name: 'Kaio', title: 'Guardião da Torre', tx: 34, ty: 15, dir: 'west', look: { modelo: 'modelo-08', pele: 'pele-4', cabelo: 'preto', cima: 'marinho', baixo: 'preto' },
    lines: ['Dizem que no andar 100 mora um chefe que ninguém venceu...', 'Será que você consegue?'] },
  { id: 'loja', name: 'Duda', title: 'Vendedora', tx: 43, ty: 19, dir: 'south', look: { modelo: 'modelo-03', pele: 'pele-1', cabelo: 'rosa', cima: 'amarelo', baixo: 'jeans' },
    lines: ['Chegaram pacotinhos novos na Loja!', 'Mas os melhores você ganha indo bem na aula.'] },
  { id: 'arena', name: 'Rex', title: 'Campeão da Arena', tx: 49, ty: 31, dir: 'north', look: { modelo: 'modelo-09', pele: 'pele-5', cabelo: 'preto', cima: 'vermelho', baixo: 'preto' },
    lines: ['Quer duelar? A Arena abre em breve.', 'Treine seu deck na Torre enquanto isso!'] },
  { id: 'guildas', name: 'Nina', title: 'Mestre de Guilda', tx: 19, ty: 31, dir: 'north', look: { modelo: 'modelo-06', pele: 'pele-6', cabelo: 'preto', cima: 'roxo', baixo: 'caqui' },
    lines: ['Na guilda, cada presença conta para a meta da equipe.', 'Faltou? A equipe inteira sente!'] },
  { id: 'mural', name: 'Téo', title: 'Mensageiro', tx: 27, ty: 17, dir: 'west', look: { modelo: 'modelo-07', pele: 'pele-3', cabelo: 'ruivo', cima: 'laranja', baixo: 'jeans' },
    lines: ['O mural mostra os avisos do professor e as missões da semana.'] },
  // moradores trabalhando e passeando (a base das profissões)
  { id: 'pescador-1', name: 'Seu Zé', title: 'Pescador', tx: 10, ty: 37, dir: 'west', job: { kind: 'pescar' },
    look: { modelo: 'modelo-04', pele: 'pele-4', cabelo: 'preto', cima: 'marinho', baixo: 'caqui', acc: { cabeca: { id: 'chapeu', cor: 'amarelo' } } },
    lines: ['Shhh... assim você espanta os peixes!', 'Quando as profissões abrirem, eu te ensino a pescar.'] },
  { id: 'pescador-2', name: 'Bia', title: 'Pescadora', tx: 7, ty: 34, dir: 'south', job: { kind: 'pescar' },
    look: { modelo: 'modelo-10', pele: 'pele-2', cabelo: 'ruivo', cima: 'verde', baixo: 'jeans' },
    lines: ['Hoje o lago está cheio de peixe!', 'O Seu Zé diz que o segredo é paciência.'] },
  { id: 'musico', name: 'Toni', title: 'Músico', tx: 58, ty: 19, dir: 'south', job: { kind: 'musica' },
    look: { modelo: 'modelo-02', pele: 'pele-5', cabelo: 'preto', cima: 'roxo', baixo: 'preto', acc: { cabeca: { id: 'fone', cor: 'preto' } } },
    lines: ['♪ Lá lá lá... ♪', 'Estou gravando um disco! Um dia ele vai tocar na sua casa.'] },
  { id: 'padeiro', name: 'Dona Rosa', title: 'Padeira', tx: 5, ty: 19, dir: 'south', job: { kind: 'padeiro', route: [[5, 19, 'south'], [10, 20, 'east'], [4, 19, 'south']], pause: [2500, 5000] },
    look: { modelo: 'modelo-06', pele: 'pele-3', cabelo: 'castanho', cima: 'branco', baixo: 'caqui', acc: { cabeca: { id: 'bandana', cor: 'vermelho' } } },
    lines: ['Pão quentinho saindo do forno!', 'Saco vazio não para em pé: sem comer, ninguém corre!'] },
  { id: 'fazendeira', name: 'Dona Cida', title: 'Fazendeira', tx: 58, ty: 38, dir: 'south', job: { kind: 'regar', route: [[58, 38, 'east'], [60, 38, 'west'], [59, 37, 'south'], [61, 39, 'west']], pause: [2500, 4500] },
    look: { modelo: 'modelo-03', pele: 'pele-4', cabelo: 'preto', cima: 'amarelo', baixo: 'jeans', acc: { cabeca: { id: 'chapeu', cor: 'verde' } } },
    lines: ['Essas cenouras vão virar bolo na padaria!', 'Planta regada, planta feliz.'] },
  { id: 'lojista', name: 'Caio', title: 'Repositor', tx: 48, ty: 19, dir: 'north', job: { kind: 'arrumar', route: [[52, 21, 'east'], [48, 19, 'north']], pause: [1500, 3000] },
    look: { modelo: 'modelo-09', pele: 'pele-1', cabelo: 'loiro', cima: 'vermelho', baixo: 'preto' },
    lines: ['Chegou caixa nova de pacotinhos!', 'Não sobra tempo nem para abrir um...'] },
  { id: 'passeio-1', name: 'Léo', title: 'Estudante', tx: 20, ty: 21, dir: 'east', job: { kind: 'passear', route: [[20, 21, 'east'], [44, 21, 'south'], [31, 33, 'west'], [10, 42, 'north']], pause: [1500, 6000] },
    look: { modelo: 'modelo-07', pele: 'pele-6', cabelo: 'preto', cima: 'laranja', baixo: 'jeans', acc: { corpo: { id: 'mochila', cor: 'marinho' } } },
    lines: ['Tô indo para a Torre, quer vir?', 'Já passei do andar 5!'] },
  { id: 'passeio-2', name: 'Mari', title: 'Estudante', tx: 40, ty: 11, dir: 'west', job: { kind: 'passear', route: [[40, 11, 'west'], [12, 11, 'south'], [22, 32, 'east']], pause: [2000, 6000] },
    look: { modelo: 'modelo-05', pele: 'pele-2', cabelo: 'lilas', cima: 'rosa', baixo: 'branco', acc: { cabeca: { id: 'laco', cor: 'rosa' } } },
    lines: ['Troquei minha carta repetida ontem!', 'A Oficina de Cartas é o melhor lugar da cidade.'] },
  { id: 'passeio-3', name: 'Gui', title: 'Estudante', tx: 50, ty: 42, dir: 'west', job: { kind: 'passear', route: [[50, 42, 'west'], [31, 43, 'north'], [57, 33, 'south']], pause: [2000, 5000] },
    look: { modelo: 'modelo-08', pele: 'pele-3', cabelo: 'azul', cima: 'verde', baixo: 'preto', acc: { rosto: { id: 'oculos', cor: 'preto' } } },
    lines: ['Você viu o pescador pegando um peixe?', 'Um dia quero ter uma bicicleta!'] },
];

/** Moradores das outras áreas. */
NPCS.push(
  // Lago Azul
  { id: 'tiao', zona: 'lago', name: 'Seu Tião', title: 'Dono da Casa de Pesca', tx: 10, ty: 18, dir: 'west',
    look: { modelo: 'modelo-04', pele: 'pele-5', cabelo: 'castanho', cima: 'marinho', baixo: 'caqui', acc: { cabeca: { id: 'chapeu', cor: 'marinho' } } },
    lines: ['Bem-vindo ao Lago Azul!', 'Pescou alguma coisa? Traga na Casa de Pesca que eu compro.', 'No quadro eu anoto o que o pessoal pegou hoje.'] },
  { id: 'nando', zona: 'lago', name: 'Nando', title: 'Pescador', tx: 41, ty: 15, dir: 'south', job: { kind: 'pescar' },
    look: { modelo: 'modelo-09', pele: 'pele-3', cabelo: 'castanho', cima: 'verde', baixo: 'jeans', acc: { cabeca: { id: 'chapeu', cor: 'caqui' } } },
    lines: ['Longe da margem, a água é funda: é lá que vivem o Dourado e o Tucunaré.', 'Do barquinho dá para pescar no meio do lago!'] },
  { id: 'lucia', zona: 'lago', name: 'Lúcia', title: 'Pescadora', tx: 40, ty: 36, dir: 'north', job: { kind: 'pescar' },
    look: { modelo: 'modelo-10', pele: 'pele-6', cabelo: 'preto', cima: 'amarelo', baixo: 'caqui' },
    lines: ['Dizem que à noite aparece um peixe que brilha...', 'Eu nunca vi. Mas também nunca fiquei até tarde!'] },
  { id: 'marinho', zona: 'lago', name: 'Marinho', title: 'Barqueiro', tx: 26, ty: 22, dir: 'east',
    look: { modelo: 'modelo-08', pele: 'pele-2', cabelo: 'ruivo', cima: 'branco', baixo: 'marinho', acc: { cabeca: { id: 'bandana', cor: 'vermelho' } } },
    lines: ['O barquinho está no fim do cais. Pode usar!', 'De frente para o barco, aperte ESPAÇO. Para descer, encoste na terra.'] },
  { id: 'pipo', zona: 'lago', name: 'Pipo', title: 'Estudante', tx: 22, ty: 30, dir: 'south', job: { kind: 'passear', route: [[22, 30, 'south'], [34, 39, 'east'], [50, 40, 'north'], [23, 25, 'west']], pause: [2500, 6000] },
    look: { modelo: 'modelo-07', pele: 'pele-4', cabelo: 'loiro', cima: 'laranja', baixo: 'jeans' },
    lines: ['Fiz um castelo de areia! Não pisa, hein!', 'O farol fica numa ilha. Só dá para ir de barco.'] },
  // Fazenda do Vale
  { id: 'joca', zona: 'fazenda', name: 'Seu Joca', title: 'Fazendeiro', tx: 25, ty: 33, dir: 'north', job: { kind: 'regar', route: [[25, 33, 'north'], [33, 33, 'north'], [38, 35, 'south'], [28, 37, 'north']], pause: [2500, 4500] },
    look: { modelo: 'modelo-04', pele: 'pele-4', cabelo: 'castanho', cima: 'vermelho', baixo: 'jeans', acc: { cabeca: { id: 'chapeu', cor: 'caqui' } } },
    lines: ['Planta regada todo dia cresce um pouquinho por dia.', 'Quer lucro? Abóbora demora, mas vale muito!', 'O campo cercado ali em cima é de vocês, alunos.'] },
  { id: 'tina', zona: 'fazenda', name: 'Tina', title: 'Vendedora de Sementes', tx: 55, ty: 16, dir: 'south',
    look: { modelo: 'modelo-03', pele: 'pele-2', cabelo: 'ruivo', cima: 'verde', baixo: 'caqui', acc: { cabeca: { id: 'bandana', cor: 'amarelo' } } },
    lines: ['Sementes fresquinhas! Fale com a barraca para comprar.', 'Morango e tomate dão de novo depois de colher.'] },
  { id: 'beto', zona: 'fazenda', name: 'Beto', title: 'Cuidador dos Bichos', tx: 6, ty: 15, dir: 'east', job: { kind: 'passear', route: [[6, 15, 'east'], [16, 17, 'west'], [10, 22, 'north']], pause: [3000, 6000] },
    look: { modelo: 'modelo-09', pele: 'pele-5', cabelo: 'preto', cima: 'amarelo', baixo: 'jeans' },
    lines: ['De frente para a vaca, aperte ESPAÇO: leite fresquinho!', 'A ovelha dá lã uma vez por dia.', 'Os ovos ficam no galinheiro, é só pegar.'] },
  { id: 'lala', zona: 'fazenda', name: 'Lalá', title: 'Estudante', tx: 20, ty: 36, dir: 'west',
    look: { modelo: 'modelo-05', pele: 'pele-3', cabelo: 'castanho', cima: 'rosa', baixo: 'jeans', acc: { cabeca: { id: 'laco', cor: 'amarelo' } } },
    lines: ['Os patinhos da lagoa são meus amigos!', 'Dá para pescar na lagoa também. E encher o regador!'] },
  // Cidade WIT
  { id: 'professor', zona: 'wit', name: 'Professor', title: 'Núcleo WIT', tx: 33, ty: 13, dir: 'south',
    look: { modelo: 'modelo-08', pele: 'pele-3', cabelo: 'preto', cima: 'verde', baixo: 'jeans', acc: { rosto: { id: 'oculos', cor: 'preto' } } },
    lines: ['Bem-vindo à Cidade WIT!', 'Aqui ficam os cursos do Núcleo: IA, IoT, Metaverso, Comunicação Digital e Oficina de Games.', 'Entre no Núcleo para ver as profissões de cada curso.'] },
  { id: 'monitora-ia', zona: 'wit', name: 'Ana', title: 'Monitora de IA', tx: 16, ty: 13, dir: 'south',
    look: { modelo: 'modelo-06', pele: 'pele-5', cabelo: 'preto', cima: 'marinho', baixo: 'preto', acc: { cabeca: { id: 'fone', cor: 'marinho' } } },
    lines: ['O WIT-Bot anda pela praça. Fale com ele!', 'Ele aprendeu a conversar com os exemplos que a gente deu.'] },
  { id: 'monitor-games', zona: 'wit', name: 'Davi', title: 'Monitor de Games', tx: 11, ty: 35, dir: 'north', job: { kind: 'passear', route: [[11, 35, 'north'], [20, 36, 'west'], [15, 35, 'north']], pause: [3000, 6000] },
    look: { modelo: 'modelo-02', pele: 'pele-2', cabelo: 'azul', cima: 'roxo', baixo: 'preto', acc: { rosto: { id: 'oculos-sol', cor: 'preto' } } },
    lines: ['Os fliperamas vão rodar os jogos que vocês criarem!', 'Já pensou num chefe feito por você na Torre?'] },
  { id: 'reporter', zona: 'wit', name: 'Rita', title: 'Repórter', tx: 38, ty: 20, dir: 'north', job: { kind: 'passear', route: [[38, 20, 'north'], [46, 13, 'south'], [30, 26, 'west']], pause: [3000, 6000] },
    look: { modelo: 'modelo-05', pele: 'pele-6', cabelo: 'ruivo', cima: 'vermelho', baixo: 'jeans', acc: { corpo: { id: 'bolsa', cor: 'marinho' } } },
    lines: ['Olha o telão: é o Jornal WIT! Quem faz somos nós, do Estúdio.', 'Pescou um peixe raro? Pode sair na manchete amanhã!'] },
  { id: 'entregador', zona: 'wit', name: 'Léo Drone', title: 'Entregador', tx: 60, ty: 13, dir: 'south',
    look: { modelo: 'modelo-09', pele: 'pele-4', cabelo: 'castanho', cima: 'amarelo', baixo: 'marinho', acc: { cabeca: { id: 'viseira', cor: 'amarelo' } } },
    lines: ['Os drones voam sozinhos pela cidade levando encomendas.', 'Em breve dá para mandar presentes para os colegas!'] },
  { id: 'estudante-wit', zona: 'wit', name: 'Bela', title: 'Estudante', tx: 26, ty: 36, dir: 'east', job: { kind: 'passear', route: [[26, 36, 'east'], [50, 36, 'north'], [36, 22, 'west'], [9, 20, 'south']], pause: [2000, 5000] },
    look: { modelo: 'modelo-10', pele: 'pele-1', cabelo: 'lilas', cima: 'rosa', baixo: 'branco' },
    lines: ['Eu quero fazer o curso de Metaverso!', 'Dizem que o portal roxo leva para uma sala virtual...'] },
);

export const MURAL_TEXT = ['MURAL DA CIDADE', 'Avisos do professor e missões da semana aparecem aqui.'];
