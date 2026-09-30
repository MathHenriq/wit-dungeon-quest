// Lista da arte do mundo novo (Lago, Fazenda, Cidade WIT) que ainda é feita
// por código e deve virar arte do GPT (docs/prompts-mundo.md). Cada nome é o
// sprite que o jogo procura: quando `scripts/arte/importar-gpt.py` gera um
// sprite com esse nome, ele entra sozinho no lugar da arte por código.
// `npx vite-node scripts/arte/falta-arte.ts` mostra o que ainda falta.
import { FISH } from '../fishing';
import { CROPS } from '../farm';

export type ArtArea = 'lago' | 'fazenda' | 'wit';

export interface ArtPiece {
  /** Nome do sprite no jogo (public/game/world/<nome>.png). */
  name: string;
  area: ArtArea;
  /** Imagem do GPT de onde ele sai (public/Novos assets/mundo/<área>/<arquivo>.png). */
  file: string;
  what: string;
}

const piece = (area: ArtArea, file: string, names: [string, string][]): ArtPiece[] =>
  names.map(([name, what]) => ({ name, area, file, what }));

/** Estágios desenhados de cada planta (colunas da folha plantacoes.png). */
export const CROP_STAGES = 5;
/** Ordem das plantas nas linhas da folha plantacoes.png. */
export const CROP_ROWS = ['cenoura', 'milho', 'tomate', 'morango', 'abobora', 'alface', 'girassol'] as const;

export const WORLD_ART: ArtPiece[] = [
  // ── Lago ──
  ...piece('lago', 'casa-pesca', [['casa-pesca', 'Casa de Pesca']]),
  ...piece('lago', 'farol', [['farol', 'Farol']]),
  ...piece('lago', 'lago-objetos', [
    ['barco-norte', 'barquinho virado para cima'], ['barco-leste', 'barquinho virado para a direita'], ['barco-sul', 'barquinho virado para baixo'],
    ['banca-peixe', 'banca de peixe'], ['caixotes', 'caixotes de peixe'], ['vara-barril', 'vara encostada no barril'],
    ['boia', 'boia no poste'], ['vitoria-regia', 'vitórias-régias'],
  ]),
  ...piece('lago', 'lago-objetos-2', [
    ['pier-vertical', 'pedaço de píer (tábuas em pé)'], ['pier-horizontal', 'pedaço de píer (tábuas deitadas)'], ['ponte', 'ponte de madeira'],
    ['fogueira', 'fogueira'], ['guarda-sol', 'guarda-sol com toalha'], ['castelo-areia', 'castelo de areia'],
    ['barraca-camping', 'barraca de acampamento'], ['barril', 'barril'], ['varal-peixe', 'varal de peixe'], ['pedras-margem', 'pedras da margem'],
    ['pato', 'pato nadando'],
  ]),
  ...piece('lago', 'peixes', FISH.map(f => [`peixe-${f.id}`, `ícone: ${f.name}`] as [string, string])),
  ...piece('lago', 'casinhas-lago', [['loja-iscas', 'Loja de Iscas'], ['casa-nando', 'casa do pescador Nando'], ['casa-lucia', 'casa da pescadora Lúcia'], ['casa-marinho', 'casa do barqueiro']]),
  // ── Fazenda ──
  ...piece('fazenda', 'casa-fazenda', [['casa-fazenda', 'Casa da Fazenda']]),
  ...piece('fazenda', 'celeiro', [['celeiro', 'Celeiro']]),
  ...piece('fazenda', 'galinheiro', [['galinheiro', 'Galinheiro']]),
  ...piece('fazenda', 'estufa', [['estufa', 'Estufa']]),
  ...piece('fazenda', 'moinho', [['moinho', 'Moinho (sem as pás)']]),
  ...piece('fazenda', 'moinho-pas', [['moinho-pas', 'as pás do moinho (o jogo gira)']]),
  ...piece('fazenda', 'fazenda-objetos', [
    ['silo', 'silo'], ['poco', 'poço'], ['caixa-envio', 'caixa de envio'], ['espantalho', 'espantalho'],
    ['feno', 'fardo de feno'], ['barraca-sementes', 'barraca de sementes'], ['carrinho', 'carrinho de mão'], ['cocho', 'cocho'],
    ['lenha', 'lenha'], ['porteira', 'porteira'], ['colmeia', 'colmeia'], ['mesa-piquenique', 'mesa de piquenique'],
  ]),
  ...piece('fazenda', 'terra', [['terra-seca', 'terra arada seca'], ['terra-molhada', 'terra arada molhada'], ['cerca-em-pe', 'cerca vista de lado (em pé)']]),
  ...piece('fazenda', 'plantacoes', CROP_ROWS.flatMap(c => Array.from({ length: CROP_STAGES }, (_, k) => [`planta-${c}-${k}`, `${CROPS.find(x => x.id === c)!.name}, estágio ${k + 1} de ${CROP_STAGES}`] as [string, string]))),
  ...piece('fazenda', 'animais', [
    ['galinha-esq', 'galinha (esquerda)'], ['galinha-dir', 'galinha (direita)'],
    ['vaca-esq', 'vaca (esquerda)'], ['vaca-dir', 'vaca (direita)'],
    ['ovelha-esq', 'ovelha (esquerda)'], ['ovelha-dir', 'ovelha (direita)'],
  ]),
  // ── Cidade WIT ──
  ...piece('wit', 'nucleo-wit', [['nucleo-wit', 'Núcleo WIT']]),
  ...piece('wit', 'lab-ia', [['lab-ia', 'Laboratório de IA']]),
  ...piece('wit', 'casa-iot', [['casa-iot', 'Casa Inteligente (IoT)']]),
  ...piece('wit', 'metaverso', [['metaverso', 'Metaverso']]),
  ...piece('wit', 'estudio-comunicacao', [['estudio-comunicacao', 'Estúdio de Comunicação']]),
  ...piece('wit', 'oficina-games', [['oficina-games', 'Oficina de Games']]),
  ...piece('wit', 'mercado-central', [['mercado-central', 'Mercado Central']]),
  ...piece('wit', 'central-entregas', [['central-entregas', 'Central de Entregas']]),
  ...piece('wit', 'wit-objetos', [
    ['telao', 'telão (tela escura lisa)'], ['drone', 'drone com caixa'], ['robo-frente', 'WIT-Bot de frente'], ['robo-costas', 'WIT-Bot de costas'],
    ['arvore-solar', 'árvore solar'], ['poste-inteligente', 'poste inteligente'], ['semaforo', 'semáforo'], ['patinetes', 'estação de patinetes'],
    ['fliperama', 'fliperama'], ['totem-holo', 'totem do holograma'], ['banco-solar', 'banco com placa solar'], ['reciclagem', 'lixeiras de reciclagem'],
  ]),
  ...piece('wit', 'wit-objetos-2', [['quadra', 'quadra de esportes (chão)'], ['cesta', 'cesta de basquete'], ['canteiro-iot', 'canteiro com sensor'], ['estacao-tempo', 'estação do tempo']]),
  ...piece('wit', 'casinhas-wit', [
    ['casa-coworking', 'Coworking WIT'], ['estudio-musica', 'Estúdio de Música'], ['atelie', 'Ateliê de Arte'],
    ['moradia-1', 'moradia 1'], ['moradia-2', 'moradia 2'], ['moradia-3', 'moradia 3'], ['moradia-4', 'moradia 4'],
  ]),
];

/** Quais peças ainda não têm sprite (os nomes que existem no manifest dos sprites). */
export function missingArt(have: Iterable<string>): ArtPiece[] {
  const s = new Set(have);
  return WORLD_ART.filter(p => !s.has(p.name));
}
