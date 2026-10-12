// O que cada móvel da Sua Casa faz quando o aluno para na frente e aperta
// ESPAÇO. Regras puras (pelo nome do sprite); as telas ficam na InteriorView.
import type { Manifest, Placed, Room } from './room';
import { footprint, layerOf, spriteOf } from './room';
import { FISH_BY_ID } from '../fishing';
import type { Progress } from '../progress';

export type HouseAct =
  | 'dormir' | 'sentar' | 'cozinhar' | 'comer' | 'computador' | 'tv' | 'musica' | 'violao' | 'fliperama'
  | 'pintar' | 'quadros' | 'livros' | 'trofeus' | 'aquario' | 'telescopio' | 'visual' | 'pet-cama' | 'pet-comida'
  | 'luz' | 'relogio' | 'mural' | 'banho' | 'brinquedos' | 'quebra' | 'planta' | 'janela';

/** Nome do sprite → ação e o que aparece no aviso. A primeira regra que casa vale. */
const RULES: [RegExp, HouseAct, string][] = [
  [/^(cama-|beliche|futon|sofa-cama)/, 'dormir', 'DORMIR'],
  [/^(sofa-|namoradeira|poltrona|cadeira|pufe)/, 'sentar', 'SENTAR'],
  [/^(fogao|micro-ondas|ilha-cozinha|pia-bancada)/, 'cozinhar', 'COZINHAR'],
  [/^(geladeira|frigobar|fruteira|mesa-jantar|mesa-dois|mesa-quadrada|mesa-cha)/, 'comer', 'COMER'],
  [/^(pc-gamer|mesa-streamer|escrivaninha)/, 'computador', 'COMPUTADOR'],
  [/^tv-rack/, 'tv', 'VER TV'],
  [/^(toca-discos|caixa-som|vitrola)/, 'musica', 'TOCAR DISCO'],
  [/^violao/, 'violao', 'TOCAR'],
  [/^fliperama/, 'fliperama', 'JOGAR'],
  [/^cavalete/, 'pintar', 'PINTAR'],
  [/^quadro-/, 'quadros', 'VER'],
  [/^(estante|escadinha-livros|cama-estante)/, 'livros', 'LER'],
  [/^prateleira-trofeus/, 'trofeus', 'TROFÉUS'],
  [/^aquario/, 'aquario', 'VER PEIXES'],
  [/^telescopio/, 'telescopio', 'OLHAR'],
  [/^(guarda-roupa|comoda|pia-espelho|cesto-roupa)/, 'visual', 'TROCAR ROUPA'],
  [/^caminha-pet/, 'pet-cama', 'CHAMAR O PET'],
  [/^potes-pet/, 'pet-comida', 'DAR COMIDA'],
  [/^(abajur|luminaria|lampada|luz-|candelabro|lanterna|pisca-pisca|lareira|painel-led)/, 'luz', 'LUZ'],
  [/^relogio/, 'relogio', 'VER HORA'],
  [/^mural-cortica/, 'mural', 'MISSÕES'],
  [/^(banheira|chuveiro)/, 'banho', 'BANHO'],
  [/^bau-brinquedos/, 'quebra', 'QUEBRA-CABEÇA'],
  [/^pelucias/, 'brinquedos', 'BRINCAR'],
  [/^(bonsai|cacto|costela-adao|limoeiro|palmeira|planta-|suculentas|vaso-)/, 'planta', 'REGAR'],
  [/^janela/, 'janela', 'OLHAR'],
];

export function actOf(id: string): { act: HouseAct; label: string } | null {
  const base = id.replace(/\.(lado|costas)$/, '');
  const r = RULES.find(([re]) => re.test(base));
  return r ? { act: r[1], label: r[2] } : null;
}

/**
 * O móvel em que o aluno está de frente: o do chão que ocupa o bloco, ou o da
 * parede quando o bloco é a última fileira da parede.
 */
export function itemAt(m: Manifest, room: Room, tx: number, ty: number): Placed | undefined {
  for (let i = room.items.length - 1; i >= 0; i--) {
    const q = room.items[i], layer = layerOf(m, q.id);
    if (layer === 't') continue;
    const [fw, fd] = footprint(m, q);
    if (layer === 'p') { if (ty === room.wallRows - 1 && tx >= q.tx && tx < q.tx + fw) return q; continue; }
    if (tx >= q.tx && tx < q.tx + fw && ty >= q.ty && ty < q.ty + fd) return q;
  }
  return undefined;
}

/** A ação do móvel na frente do aluno (ou nada). */
export function houseActAt(m: Manifest, room: Room, tx: number, ty: number): { act: HouseAct; label: string; item: Placed } | null {
  const q = itemAt(m, room, tx, ty);
  const a = q && actOf(spriteOf(m, q).id);
  return a && q ? { ...a, item: q } : null;
}

// ─── regras de cada ação ─────────────────────────────────────────────────

/** Só dá para dormir de noite (19h às 5h): a cama passa o relógio para as 6h e vira o dia da fazenda. */
export const canSleep = (hour: number) => hour >= 19 || hour < 5;

/** Os peixes diferentes que o aluno já pescou (nadam no aquário), do maior recorde para o menor. */
export function aquariumFish(p: Progress): string[] {
  const best = new Map<string, number>();
  for (const e of p.diario ?? []) if (FISH_BY_ID.has(e.f)) best.set(e.f, Math.max(best.get(e.f) ?? 0, e.cm));
  return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 8);
}

/** Dicas de cartas e combos que os livros da estante contam (uma por vez, em ordem). */
export const BOOK_TIPS = [
  'Livro "Combos": Ataques do mesmo elemento costumam ter bônus quando você joga outra carta daquele elemento no mesmo turno.',
  'Livro "Sem energia": carta forte cobra um preço (descartar, pagar vida, mandar cartas do deck ao cemitério). Pague quando o golpe valer a pena.',
  'Livro "Armadilhas": até 3 viradas na mesa. Elas disparam sozinhas na hora certa: o inimigo não vê o que é.',
  'Livro "Equipamentos": 1 arma e 1 armadura ficam na mesa e ajudam o turno inteiro. Colocar cedo rende mais.',
  'Livro "Cemitério": algumas cartas ficam mais fortes com cartas no cemitério. O Ceifador vive disso.',
  'Livro "Deck de 20": com 20 cartas, cada cópia conta. 2 cópias das melhores deixam o deck mais certeiro.',
  'Livro "Campo": só 1 Campo na mesa. Um Campo novo tira o anterior, seu ou do inimigo.',
];

/** Constelações que dá para ver no telescópio (à noite). */
export const STARS = [
  'Cruzeiro do Sul: 4 estrelas em cruz. Ele aponta para o sul e ajudava os navegantes a se localizar.',
  'Três Marias: 3 estrelas em fila, no cinturão de Órion. Aparecem bem no verão.',
  'Escorpião: estrelas em forma de gancho, com a estrela vermelha Antares no coração.',
  'Plêiades: um aglomerado de estrelinhas azuis bem juntinhas, como um pacotinho de brilho.',
];

/** Programação da TV (repete): notícias do jogo entram pelo Jornal WIT. */
export const TV_SHOWS = [
  'Desenho: "O Desafiante" luta contra um chefe da Torre e vence com uma armadilha!',
  'Programa de culinária: hoje, pão de forma com fermento e água morna.',
  'Documentário: como os sensores da Casa Inteligente economizam água na horta.',
  'Clima: amanhã faz sol na Fazenda do Vale. Bom dia para regar!',
];
