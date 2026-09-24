/**
 * Tipos do motor de TCG do WIT Dungeon 2.
 *
 * Regra de ouro deste módulo: TUDO é dado puro — nenhuma função mora dentro
 * de uma carta ou do estado. Isso tem três consequências que valem o esforço:
 *
 *  1. O estado inteiro de uma partida é JSON. Dá para salvar, mandar pela rede
 *     no PvP e reproduzir uma partida do começo ao fim.
 *  2. O texto de uma carta é gerado a partir do efeito (ver `describe.ts`), então
 *     o texto nunca mente sobre o que a carta faz.
 *  3. Cada combo vira um teste automático sem precisar simular a interface.
 *
 * As regras que este módulo implementa estão em `docs/regras-tcg.md`.
 */

import type { ElementType } from '@/types/character';

export type Element = ElementType;

export type CardType = 'attack' | 'challenger' | 'equipment' | 'trap' | 'field';

export type Rarity =
  | 'common' | 'uncommon' | 'rare' | 'epic'
  | 'legendary' | 'mythic' | 'unknown';

/** Seleciona cartas por tipo e/ou elemento. Campo omitido = qualquer. */
export interface CardFilter {
  type?: CardType;
  element?: Element;
}

/** Quem é afetado, do ponto de vista de quem jogou a carta. */
export type Side = 'self' | 'opponent';

// ─── Custos (sacrifício, estilo Yu-Gi-Oh) ────────────────────────────────────

export type Cost =
  /** Descartar cartas da mão (fora a própria carta) para o cemitério. */
  | { kind: 'discard'; count: number; filter?: CardFilter }
  /** Mandar as cartas do topo do próprio deck para o cemitério. */
  | { kind: 'mill'; count: number }
  /** Perder vida. Não é possível pagar com a própria vida até zerar. */
  | { kind: 'payLife'; amount: number }
  /** Remover do jogo cartas do próprio cemitério. */
  | { kind: 'banish'; count: number; filter?: CardFilter }
  /** Não comprar carta no próximo turno. */
  | { kind: 'skipDraw' };

// ─── Quantidades que escalam ─────────────────────────────────────────────────

/**
 * Um número fixo, ou "X por cada carta em algum lugar".
 * Ex.: `{ per: 'graveyard', filter: { element: 'Fire' }, each: 5 }`
 *      = +5 para cada carta de Fogo no seu cemitério.
 */
export type Amount =
  | number
  | {
      /**
       * graveyard/banished/hand: conta cartas.
       * round: rodadas da partida (1 rodada = 1 turno de cada jogador).
       * lifeLost: vida que o dono já perdeu (vida máxima − vida atual).
       * damageTaken: dano que o dono recebeu desde o fim do último turno dele.
       */
      per: 'graveyard' | 'banished' | 'hand' | 'round' | 'lifeLost' | 'damageTaken';
      owner?: Side;
      filter?: CardFilter;
      /** Quanto vale cada unidade. Pode ser fração (0.5 = metade); o total é arredondado para baixo. */
      each: number;
      base?: number;
      /** Teto do valor final. */
      max?: number;
    };

// ─── Condições ───────────────────────────────────────────────────────────────

export type StatusKind = 'burn' | 'poison' | 'bleed' | 'freeze';

export type Condition =
  /** Outras cartas jogadas por você neste turno (a própria carta não conta). */
  | { kind: 'playedThisTurn'; filter: CardFilter; min?: number }
  | { kind: 'graveyardCount'; min: number; owner?: Side; filter?: CardFilter }
  | { kind: 'lifeAtMost'; amount: number; owner?: Side }
  | { kind: 'lifeAtLeast'; amount: number; owner?: Side }
  | { kind: 'hasStatus'; status: StatusKind; owner?: Side };

// ─── Modificadores pendentes: o coração dos combos ───────────────────────────

/**
 * Um efeito que fica ESPERANDO até ser consumido por uma carta compatível.
 *
 * "Seu próximo ataque de Fogo causa o dobro" é:
 *   { match: { type: 'attack', element: 'Fire' }, mult: 2, uses: 1 }
 *
 * Ele não expira no fim do turno: fica na fila até um ataque de Fogo aparecer.
 * Um ataque de Água no meio do caminho não o consome.
 */
export interface ModifierSpec {
  match: CardFilter;
  add?: number;
  mult?: number;
  /** Quantos ataques consome. Omitido = 1. */
  uses?: number;
  /** Expira depois de N turnos do dono, mesmo sem ser usado. Omitido = nunca. */
  turns?: number;
  /** Nome curto que aparece na conta do dano ("Fúria Ígnea"). */
  label: string;
}

// ─── Efeitos ─────────────────────────────────────────────────────────────────

export type Effect =
  /** Dano direto (não é ataque: não usa modificadores de ataque nem dispara armadilha de ataque). */
  | { kind: 'damage'; amount: Amount; target?: Side }
  | { kind: 'heal'; amount: Amount; target?: Side }
  | { kind: 'draw'; count: number; target?: Side }
  /** O alvo descarta cartas aleatórias da mão. */
  | { kind: 'discardRandom'; count: number; target?: Side }
  /** Manda as cartas do topo do deck do alvo para o cemitério. */
  | { kind: 'mill'; count: number; target?: Side }
  | { kind: 'addModifier'; spec: ModifierSpec; target?: Side }
  | { kind: 'status'; status: StatusKind; value?: number; turns: number; target?: Side }
  /** O alvo não pode jogar cartas deste tipo por N turnos dele. */
  | { kind: 'lock'; cardType: CardType; turns: number; target?: Side }
  /** Anula as próximas N instâncias de dano que o alvo receberia. */
  | { kind: 'shield'; count: number; target?: Side }
  | { kind: 'destroy'; what: 'weapon' | 'armor' | 'field' | 'trap'; target?: Side }
  /** Devolve cartas do próprio cemitério para a mão (as mais recentes primeiro). */
  | { kind: 'recover'; count: number; filter?: CardFilter }
  /** Só dentro de uma carta de Ataque: muda o dano DESTE ataque antes da conta. */
  | { kind: 'bonus'; add?: Amount; mult?: number; label: string }
  | { kind: 'conditional'; if: Condition; then: Effect[]; else?: Effect[] }
  /** Por N turnos seus, no início de cada um, estes efeitos acontecem de novo (invocações, regeneração). */
  | { kind: 'aura'; turns: number; effects: Effect[]; label: string }
  /** Troca a vida atual dos dois jogadores (limitada à vida máxima de cada um). */
  | { kind: 'swapLife' }
  /** Só dentro de Ataque: recupera uma fração do dano que este ataque causou. */
  | { kind: 'lifesteal'; ratio: number }
  /** Remove status e travas (statuses) e/ou bônus guardados (modifiers) do alvo. */
  | { kind: 'purge'; what: 'statuses' | 'modifiers' | 'all'; target?: Side }
  /** Só dentro de Ataque: não dispara Armadilhas e ignora redução de dano e escudo. */
  | { kind: 'pierce' };

// ─── Passivos (equipamento e campo) ──────────────────────────────────────────

export type Passive =
  /** Seus ataques compatíveis ganham +add e/ou ×mult. */
  | { kind: 'attackBonus'; match: CardFilter; add?: number; mult?: number; label: string }
  /** Dano recebido é reduzido em `amount` (mínimo 0). */
  | { kind: 'damageReduction'; amount: number; label: string }
  /** Efeitos que acontecem no início de cada turno do dono. */
  | { kind: 'onTurnStart'; effects: Effect[] };

// ─── Armadilhas ──────────────────────────────────────────────────────────────

export type TrapTrigger =
  /** Quando o inimigo joga uma carta de Ataque contra você. */
  | 'opponentAttack'
  /** Quando o inimigo joga qualquer carta compatível com o filtro. */
  | 'opponentPlays';

export interface TrapSpec {
  trigger: TrapTrigger;
  filter?: CardFilter;
  /** Anula a carta que disparou a armadilha. */
  negate?: boolean;
  /** Efeitos da armadilha, do ponto de vista de quem a baixou. */
  effects?: Effect[];
  /** O ataque que disparou a armadilha acerta quem atacou, com todos os bônus dele. */
  reflect?: boolean;
  /** Só dispara se esta condição valer (do ponto de vista de quem baixou). */
  condition?: Condition;
}

// ─── A carta ─────────────────────────────────────────────────────────────────

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  element: Element;
  rarity: Rarity;
  /** Dano base (só para Ataque). */
  damage?: number;
  cost?: Cost[];
  effects?: Effect[];
  /** Equipamento: em qual espaço entra. */
  slot?: 'weapon' | 'armor';
  /** Equipamento e Campo. Passivos de Campo valem para os DOIS jogadores. */
  passives?: Passive[];
  trap?: TrapSpec;
  /** Texto de ambientação, sem efeito de jogo. */
  flavor?: string;
  /** Obra de origem, para a arte e para busca. Sem efeito de jogo. */
  anime?: string;
}

export interface CardInstance {
  uid: string;
  def: CardDef;
}

// ─── Estado da partida ───────────────────────────────────────────────────────

export interface ActiveModifier extends ModifierSpec {
  usesLeft: number;
  turnsLeft?: number;
  source: string;
}

export interface ActiveStatus {
  kind: StatusKind;
  value: number;
  turnsLeft: number;
}

export interface Aura {
  label: string;
  effects: Effect[];
  turnsLeft: number;
  source: CardInstance;
}

export interface Lock {
  cardType: CardType;
  turnsLeft: number;
}

export interface PlayerState {
  name: string;
  /** Elemento do herói: define fraquezas e resistências contra ataques. */
  element: Element;
  life: number;
  maxLife: number;
  deck: CardInstance[];
  hand: CardInstance[];
  graveyard: CardInstance[];
  banished: CardInstance[];
  weapon: CardInstance | null;
  armor: CardInstance | null;
  /** Armadilhas baixadas, viradas para baixo. Máximo 3. */
  traps: CardInstance[];
  modifiers: ActiveModifier[];
  auras: Aura[];
  statuses: ActiveStatus[];
  locks: Lock[];
  shields: number;
  /** Dano recebido desde o fim do último turno deste jogador. */
  damageTaken: number;
  skipNextDraw: boolean;
  /** Quantas compras com o deck vazio já aconteceram (dano de fadiga). */
  fatigue: number;
  attacksThisTurn: number;
  /** Cartas jogadas neste turno, para condições do tipo "se jogou Vento neste turno". */
  playedThisTurn: CardDef[];
}

export interface LogEntry {
  turn: number;
  player: 0 | 1 | null;
  text: string;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  active: 0 | 1;
  /** Turno global, começando em 1. */
  turn: number;
  firstPlayer: 0 | 1;
  field: { card: CardInstance; owner: 0 | 1 } | null;
  winner: 0 | 1 | null;
  log: LogEntry[];
  /** Estado do gerador aleatório com semente: a mesma semente gera a mesma partida. */
  rng: number;
  nextUid: number;
}

/** Escolhas do jogador ao pagar custos. Omitidas = o motor escolhe. */
export interface PlayChoices {
  discard?: string[];
  banish?: string[];
}
