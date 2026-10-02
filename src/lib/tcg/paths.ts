/**
 * Os 8 Caminhos (docs/plano-wit2.md §5.3): o estilo de jogo que o aluno
 * escolhe no primeiro acesso e o deck inicial dele (20 Comuns e Incomuns).
 * Qualquer aluno usa qualquer carta: o Caminho é só o ponto de partida, sem
 * bônus de poder. Os decks saem do catálogo pelas mecânicas de cada carta
 * (nada montado à mão), com semente fixa: o mesmo Caminho dá sempre o mesmo deck.
 */
import { CATALOG } from './cards/catalog';
import { complexity, maxCopies, seeded } from './opponents';
import type { CardDef, Effect } from './types';
import FIXED from './cards/caminhos.json';

export type PathId = 'desafiante' | 'sabio' | 'louco' | 'guardiao' | 'alquimista' | 'ceifador' | 'trapaceiro' | 'forjador';

/** O que uma carta faz, em palavras de estilo de jogo. */
export type Mech = 'compra' | 'bonus' | 'combo' | 'vida' | 'forte' | 'rapido' | 'escudo' | 'cura' | 'armadura' | 'reflete'
  | 'status' | 'moer' | 'banir' | 'cemiterio' | 'armadilha' | 'trava' | 'roubo' | 'equipamento' | 'campo';

export function mechanics(c: CardDef): Set<Mech> {
  const m = new Set<Mech>();
  for (const k of c.cost ?? []) {
    if (k.kind === 'payLife') m.add('vida');
    if (k.kind === 'mill') m.add('moer');
    if (k.kind === 'banish') m.add('banir');
  }
  const walk = (es: Effect[] = []) => {
    for (const e of es) {
      switch (e.kind) {
        case 'draw': if ((e.target ?? 'self') === 'self') m.add('compra'); break;
        case 'bonus': m.add('bonus'); if (typeof e.add === 'object' && e.add.per === 'graveyard') m.add('cemiterio'); break;
        case 'conditional': if (e.if.kind === 'playedThisTurn') m.add('combo'); if (e.if.kind === 'graveyardCount') m.add('cemiterio'); walk(e.then); walk(e.else); break;
        case 'aura': m.add('bonus'); walk(e.effects); break;
        case 'shield': m.add('escudo'); break;
        case 'heal': if ((e.target ?? 'self') === 'self') m.add('cura'); break;
        case 'lifesteal': m.add('cura'); break;
        case 'status': if (e.status !== 'freeze') m.add('status'); else m.add('trava'); break;
        case 'mill': m.add('moer'); break;
        case 'recover': m.add('cemiterio'); break;
        case 'lock': m.add('trava'); break;
        case 'discardRandom': case 'destroy': case 'swapLife': m.add('roubo'); break;
        case 'pierce': m.add('forte'); break;
        case 'damage': if (typeof e.amount === 'object' && e.amount.per === 'graveyard') m.add('cemiterio'); break;
        default: break;
      }
    }
  };
  walk(c.effects);
  for (const p of c.passives ?? []) {
    if (p.kind === 'onTurnStart') walk(p.effects);
    if (p.kind === 'damageReduction') m.add('armadura');
  }
  if (c.type === 'trap') { m.add('armadilha'); if (c.trap?.reflect || c.trap?.negate) m.add('reflete'); walk(c.trap?.effects); }
  if (c.type === 'equipment') { m.add('equipamento'); if (c.slot === 'armor') m.add('armadura'); }
  if (c.type === 'field') m.add('campo');
  if (c.type === 'attack' && (c.damage ?? 0) >= 18) m.add('forte');
  if (c.type === 'attack' && !(c.cost ?? []).length && (c.damage ?? 0) > 0 && (c.damage ?? 0) <= 10) m.add('rapido');
  return m;
}

export interface PathDef {
  id: PathId; name: string; style: string; about: string;
  /** Mecânicas do Caminho e o peso de cada uma na escolha das cartas. */
  wants: Partial<Record<Mech, number>>;
  /** Fração mínima de Ataques (os decks que se defendem têm menos). */
  attackShare: number;
  /** Complexidade máxima das cartas (Ceifador e Trapaceiro precisam de custos e armadilhas). */
  maxComplexity: number;
  /** Raras do tema que podem entrar (quando há poucas Comuns e Incomuns com a mecânica). Raridade não é força. */
  rares?: number;
  /** Sugestão para quem vem do WIT 1 com esta classe. */
  fromClass: string[];
  color: string;
}

export const PATHS: PathDef[] = [
  { id: 'desafiante', name: 'O Desafiante', style: 'Equilibrado, bom para começar', about: 'Um pouco de tudo: ataque, defesa e alguns truques. Bom para aprender o jogo.',
    wants: { rapido: 2, forte: 1.5, escudo: 1, cura: 1, compra: 1, bonus: 1, equipamento: 1 }, attackShare: 0.55, maxComplexity: 2, fromClass: ['guerreiro', 'warrior'], color: '#e8a020' },
  { id: 'sabio', name: 'O Sábio', style: 'Estratégia: prepara e explode', about: 'Compra cartas, guarda bônus e solta um combo enorme na hora certa.',
    wants: { compra: 3, bonus: 3, combo: 2.5 }, attackShare: 0.45, maxComplexity: 3, fromClass: ['mago', 'mage'], color: '#3a78c8' },
  { id: 'louco', name: 'O Louco', style: 'Tudo ou nada: paga vida para bater forte', about: 'Paga com a própria vida para dar golpes enormes. Rápido e arriscado.',
    wants: { vida: 3.5, forte: 2.5, rapido: 1.5 }, attackShare: 0.65, maxComplexity: 3, fromClass: ['berserker', 'barbaro'], color: '#e8485a' },
  { id: 'guardiao', name: 'O Guardião', style: 'Aguenta tudo e vira o jogo', about: 'Escudo, cura, armadura e armadilha que devolve o golpe. Ganha no cansaço.',
    wants: { escudo: 3, cura: 3, armadura: 2.5, reflete: 2.5 }, attackShare: 0.4, maxComplexity: 3, fromClass: ['paladino', 'clerigo', 'tanque'], color: '#3a9a5a' },
  { id: 'alquimista', name: 'O Alquimista', style: 'Dano que corrói aos poucos', about: 'Queimadura, veneno e sangramento: o dano continua turno após turno.',
    wants: { status: 4 }, attackShare: 0.5, maxComplexity: 3, fromClass: ['alquimista', 'druida'], color: '#8a5ae8' },
  { id: 'ceifador', name: 'O Ceifador', style: 'O cemitério é a arma', about: 'Manda cartas para o cemitério e bate mais forte a cada uma que está lá.',
    wants: { moer: 3, cemiterio: 3.5, banir: 2 }, attackShare: 0.5, maxComplexity: 4, rares: 4, fromClass: ['necromante'], color: '#4a4660' },
  { id: 'trapaceiro', name: 'O Trapaceiro', style: 'Pega o oponente desprevenido', about: 'Armadilhas viradas, travas e roubo: o oponente nunca sabe o que vem.',
    wants: { armadilha: 3.5, trava: 3, roubo: 2.5 }, attackShare: 0.4, maxComplexity: 4, fromClass: ['espiao', 'ladino', 'assassino'], color: '#c84a6a' },
  { id: 'forjador', name: 'O Forjador', style: 'Monta o arsenal', about: 'Equipa arma, armadura e campo, e cada ataque sai mais forte.',
    wants: { equipamento: 4, campo: 3, armadura: 1 }, attackShare: 0.5, maxComplexity: 3, fromClass: ['ferreiro', 'arqueiro', 'cavaleiro'], color: '#c8762a' },
];
export const PATH_BY_ID = new Map(PATHS.map(p => [p.id, p]));

const STARTER_POOL = CATALOG.filter(c => c.rarity === 'common' || c.rarity === 'uncommon');

/** Quanto a carta combina com o Caminho (0 = nada a ver). */
export function fit(c: CardDef, p: PathDef): number {
  const m = mechanics(c);
  let s = 0;
  for (const [k, w] of Object.entries(p.wants)) if (m.has(k as Mech)) s += w as number;
  return s;
}

/**
 * O deck inicial do Caminho: os Ataques e as outras cartas que mais combinam
 * com o estilo (sorteados entre os que combinam, com semente), até 2 cópias,
 * no máximo 2 armadilhas fora do Trapaceiro e 1 campo fora do Forjador.
 */
export interface DeckKnobs {
  /** Soma na fração de Ataques do Caminho. */ attackDelta?: number;
  /** Preferência por Ataques de dano alto (negativo = baixo). */ power?: number;
  /** Peso do tema (1 = normal; menor dilui o estilo). */ theme?: number;
  /** Máximo de cartas do tema (o resto é carta comum de qualquer estilo). */ cap?: number;
  seed?: number;
}

const BY_ID = new Map(CATALOG.map(c => [c.id, c]));

/**
 * O deck inicial do Caminho. Vem da lista fixa (`cards/caminhos.json`, gerada
 * e balanceada por `scripts/tcg-caminhos.ts --ajustar`); sem ela, é gerado.
 */
export function pathDeck(id: PathId): CardDef[] {
  const fixed = (FIXED as Record<string, string[]>)[id];
  if (fixed?.length === 20 && fixed.every(c => BY_ID.has(c))) return fixed.map(c => BY_ID.get(c)!);
  return generatePathDeck(id);
}

export function generatePathDeck(id: PathId, k: DeckKnobs = {}): CardDef[] {
  const p = PATH_BY_ID.get(id)!;
  const r = seeded(9001 + PATHS.indexOf(p) * 131 + (k.seed ?? 0) * 7);
  const rares = CATALOG.filter(c => c.rarity === 'rare' && fit(c, p) >= 2 && complexity(c) <= p.maxComplexity).slice(0, p.rares ?? 0);
  const pool = [...STARTER_POOL, ...rares].filter(c => complexity(c) <= p.maxComplexity);
  const deck: CardDef[] = [];
  const copies = new Map<string, number>();
  const cap1 = (c: CardDef) => (c.rarity === 'rare' ? 1 : maxCopies(c));
  const capType = (t: CardDef['type']) => (t === 'trap' ? (id === 'trapaceiro' ? 6 : id === 'guardiao' ? 3 : 2) : t === 'field' ? (id === 'forjador' ? 2 : 1) : t === 'equipment' ? (id === 'forjador' ? 7 : 2) : 99);
  const pick = (cands: CardDef[], minFit: number) => {
    const onTheme = deck.filter(d => fit(d, p) > 0).length;
    const free = cands.filter(c => (fit(c, p) === 0 || onTheme < (k.cap ?? 20)) && (copies.get(c.id) ?? 0) < cap1(c) && deck.filter(d => d.type === c.type).length < capType(c.type) && fit(c, p) >= minFit);
    if (!free.length) return false;
    const dmg = (c: CardDef) => (c.type === 'attack' ? Math.max(0.3, (c.damage ?? 0) / 12) ** (k.power ?? 0) : 1);
    const w = (c: CardDef) => (1 + fit(c, p) * (k.theme ?? 1)) ** 2 * (c.rarity === 'common' ? 1.2 : 1) * dmg(c);
    const total = free.reduce((s, c) => s + w(c), 0);
    let x = r() * total;
    const c = free.find(cc => (x -= w(cc)) <= 0) ?? free[free.length - 1];
    deck.push(c); copies.set(c.id, (copies.get(c.id) ?? 0) + 1);
    return true;
  };
  const attacks = pool.filter(c => c.type === 'attack');
  const needAtk = Math.round(20 * Math.max(0.3, Math.min(0.8, p.attackShare + (k.attackDelta ?? 0))));
  // primeiro os que têm a cara do Caminho, depois qualquer um para completar
  const others = pool.filter(c => c.type !== 'attack');
  while (deck.filter(c => c.type === 'attack').length < needAtk && (pick(attacks, 1) || pick(attacks, 0)));
  // o resto: primeiro as outras cartas do tema, depois qualquer uma
  while (deck.length < 20 && (pick(others, 1) || pick(attacks, 1) || pick(others, 0) || pick(pool, 0)));
  return deck.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'attack' ? -1 : b.type === 'attack' ? 1 : a.type.localeCompare(b.type)));
}

/** Sugestão de Caminho para quem vem do WIT 1 (pela classe antiga). */
export function suggestPath(oldClass?: string | null): PathId {
  const k = (oldClass ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return PATHS.find(p => p.fromClass.some(c => k.includes(c)))?.id ?? 'desafiante';
}
