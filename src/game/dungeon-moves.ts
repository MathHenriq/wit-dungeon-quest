// Peças dos golpes de carta da masmorra e os estados que eles deixam.
//
// Cada carta de Ataque tem um KIT (dungeon-kits.ts): uma sequência de peças
// (projétil, tornado, raio, zona, chuva, investida, rajada, órbita, invocar,
// transformar, marca, armadilha, puxar, empurrar, prender, bênção, parar
// tiros, cinemática, golpe, área, cadeia). O motor (dungeon-cast.ts) executa
// as peças; aqui só os tipos, os estados e as REAÇÕES entre elementos.
//
// Reação não é fraqueza nem resistência (decisão de 30/09): o inimigo não tem
// elemento. O que conta é o ESTADO que ele já carrega quando o golpe chega
// (molhado + gelo congela, molhado + raio dá choque em cadeia...).
import type { Element } from '@/lib/tcg/types';

export type StatusId =
  | 'queimar' | 'chamaNegra' | 'veneno' | 'molhado' | 'congelado' | 'lento' | 'atordoado' | 'eletrizado'
  | 'marcado' | 'selado' | 'cego' | 'lama' | 'amaldicoado' | 'corte' | 'preso' | 'semente';

export const STATUS: Record<StatusId, { nome: string; about: string; cor: string }> = {
  queimar: { nome: 'Queimando', about: 'Perde vida por alguns segundos.', cor: '#ff7a2a' },
  chamaNegra: { nome: 'Chama negra', about: 'Não apaga até cair; passa para o vizinho.', cor: '#5a1a3a' },
  veneno: { nome: 'Envenenado', about: 'Perde vida; acumula até 5.', cor: '#a04ad8' },
  molhado: { nome: 'Molhado', about: 'Gelo congela, raio dá choque, terra vira lama.', cor: '#4aa8ff' },
  congelado: { nome: 'Congelado', about: 'Não anda nem ataca. Golpe pesado estilhaça.', cor: '#bff0ff' },
  lento: { nome: 'Lento', about: 'Anda e ataca devagar.', cor: '#8ad0ff' },
  atordoado: { nome: 'Atordoado', about: 'Não faz nada.', cor: '#ffe03a' },
  eletrizado: { nome: 'Eletrizado', about: 'No 3º raio, paralisa.', cor: '#fff07a' },
  marcado: { nome: 'Marcado', about: 'A marca explode quando acaba.', cor: '#ff5a8a' },
  selado: { nome: 'Selado', about: 'Não consegue atacar.', cor: '#c8a0ff' },
  cego: { nome: 'Cego', about: 'Erra os golpes.', cor: '#9a9aaa' },
  lama: { nome: 'Na lama', about: 'Quase não anda.', cor: '#8a6a3a' },
  amaldicoado: { nome: 'Amaldiçoado', about: 'Leva 30% a mais de dano.', cor: '#6a2a8a' },
  corte: { nome: 'Ferido', about: 'Perde vida pelo corte.', cor: '#e8e8f8' },
  preso: { nome: 'Preso', about: 'Não sai do lugar.', cor: '#3ac85a' },
  semente: { nome: 'Semente', about: 'Brota e prende. Fogo vira incêndio.', cor: '#7aff6a' },
};

/** O que um golpe faz em quem acerta. `d` é a fração do poder da carta. */
export interface Hit {
  d: number;
  /** Estado (e duração em segundos; `n` = acúmulos de veneno ou raio). */
  st?: StatusId; sd?: number; n?: number;
  st2?: StatusId; sd2?: number;
  /** Empurrão (blocos/s). */
  kb?: number;
  /** Puxa o atingido até o caçador. */
  pull?: boolean;
  /** Atravessa escudo (escudeiro, Blindado, armadura de gelo). */
  fura?: boolean;
  /** Tira o escudo e o modificador da elite por 5 s. */
  quebra?: boolean;
  /** Derruba na hora o inimigo comum abaixo dessa fração da vida. */
  abate?: number;
  /** Sempre crítico. */
  crit?: boolean;
  /** Um raio cai em quem acertar (fração do poder). */
  zap?: number;
  /** Corações de volta se derrotar com este golpe. */
  cura?: number;
  /** Mana de volta por acerto. */
  mana?: number;
  /** Mais dano com pouca vida (até ×(1 + low) com 1 coração). */
  low?: number;
  /** Multiplica contra inimigo pesado e chefe. */
  pesado?: number;
  /** Dano de postura (1 = normal). */
  postura?: number;
  /** Elemento deste golpe (padrão: o da carta). */
  el?: Element;
}

export type Look =
  | 'bola' | 'lamina' | 'lanca' | 'tubarao' | 'carta' | 'martelo' | 'estrela' | 'shuriken' | 'esfera' | 'dragao' | 'petala'
  | 'gota' | 'onda' | 'lua' | 'punho' | 'rocha' | 'neve' | 'agulha' | 'kunai' | 'espada' | 'inseto' | 'coracao' | 'cristal'
  | 'flecha' | 'raio' | 'meteoro' | 'mao' | 'sol' | 'areia' | 'raiz' | 'gelo' | 'sombra' | 'pilar' | 'tigre' | 'asas'
  | 'lagarto' | 'nuvem' | 'cratera' | 'ar' | 'decadencia' | 'teia' | 'fumaca' | 'vapor' | 'luz' | 'orbe';
export type Path = 'reto' | 'onda' | 'espiral' | 'volta' | 'persegue' | 'quica';
export type Where = 'eu' | 'alvo' | 'frente';
export type Summon = 'formiga' | 'mago' | 'sombra' | 'insetos' | 'diabo' | 'torreta' | 'clone';
export type Form = 'colosso' | 'tita' | 'demonio' | 'psiquico' | 'fera' | 'bankai' | 'adulto' | 'turbo' | 'nuvem' | 'veneno';
export type Cine = 'circulo' | 'carga' | 'esfera' | 'foco' | 'orbes' | 'ceu' | 'luz' | 'vento' | 'arco' | 'raiz' | 'nuvem';
export type BuffKind = 'escudo' | 'roubo' | 'critico' | 'pacto' | 'velocidade' | 'cura' | 'imune' | 'recarga' | 'eco';
export interface Zone { r: number; dur: number; tick: number; hit: Hit; look?: Look }

interface Base {
  /** Atraso em segundos depois de soltar a carta. */
  at?: number;
  /** Ângulo extra (radianos) em relação à mira. */
  off?: number;
}
export type Move = Base & (
  /** Tiro: reto, em onda, em espiral, que volta, que persegue ou que quica. */
  | { m: 'proj'; path?: Path; n?: number; spread?: number; speed: number; range: number; r: number; hit: Hit;
      pierce?: boolean; blast?: number; split?: number; bounce?: number; come?: boolean; moe?: number; abre?: Zone; charge?: number; rompe?: boolean; look?: Look }
  /** Anda reto girando em círculo em volta do caminho; puxa e acerta várias vezes. */
  | { m: 'tornado'; speed: number; range: number; r: number; spin: number; tick: number; hit: Hit; pull?: number; fim?: { r: number; hit: Hit }; look?: Look }
  /** Feixe que fica um tempo; pode varrer, abrir em cone, carregar (segurar) e puxar. */
  | { m: 'raio'; len: number; w: number; dur: number; tick: number; hit: Hit; sweep?: number; cone?: number; charge?: number; puxa?: number; look?: Look }
  /** Campo no chão (ou em volta do caçador, se `follow`). */
  | { m: 'zona'; where: Where; r: number; dur: number; tick: number; hit: Hit; follow?: boolean; slow?: number; cura?: number; esconde?: boolean; look?: Look }
  /** Golpes caindo do céu: nos inimigos, numa área, em fila ou num ponto. */
  | { m: 'chuva'; where: 'alvos' | 'area' | 'linha' | 'alvo'; n: number; every: number; r: number; hit: Hit; step?: number; spread?: number; look?: Look }
  /** O caçador atravessa batendo (ou some e aparece no alvo, `tele`). */
  | { m: 'investida'; len: number; w: number; hit: Hit; tele?: boolean; ticks?: number; rastro?: Zone; look?: Look }
  /** Vários golpes seguidos, parado e invencível. */
  | { m: 'rajada'; n: number; every: number; range: number; arc: number; hit: Hit; spin?: number; fim?: Hit; look?: Look }
  /** Lâminas girando em volta; `launch` dispara no fim; `come` apaga tiros. */
  | { m: 'orbita'; n: number; r: number; dur: number; speed: number; tick: number; hit: Hit; launch?: boolean; come?: boolean; look?: Look }
  /** Aliado por um tempo. */
  | { m: 'invocar'; kind: Summon; n?: number; dur: number; every: number; range: number; hit: Hit }
  /** Muda o caçador: tamanho, velocidade, dano e o que ele pode fazer. */
  | { m: 'transformar'; form: Form; dur: number; scale?: number; speed?: number; dmg?: number; noDodge?: boolean; noKnock?: boolean;
      stomp?: { r: number; every: number; hit: Hit }; aura?: { r: number; tick: number; hit: Hit }; fim?: { r: number; hit: Hit };
      tiro?: Hit; dashFree?: boolean; cansa?: number; paraTiros?: boolean; voa?: boolean; imuneStatus?: boolean }
  /** Marca os inimigos mais perto; a marca explode depois. */
  | { m: 'marca'; n: number; delay: number; r: number; hit: Hit; look?: Look }
  /** Minas no chão. */
  | { m: 'armadilha'; n: number; where: Where; r: number; arm: number; dur: number; hit: Hit; look?: Look }
  | { m: 'puxar'; where: Where; r: number; force: number; dur: number; hit?: Hit }
  | { m: 'empurrar'; r: number; force: number; hit: Hit }
  /** Prende (areia, raiz, gelo) e esmaga depois (`crush`, raio `cr`). */
  | { m: 'prender'; where: 'alvo' | 'area'; r: number; dur: number; crush?: Hit; cr?: number; look?: Look }
  | { m: 'buff'; what: BuffKind; v: number; dur?: number }
  /** Para, devolve ou apaga os tiros inimigos por perto. */
  | { m: 'parar_tiros'; r: number; mode: 'congela' | 'devolve' | 'apaga'; dur?: number }
  /** Mini cena: o tempo quase para, o círculo mágico abre, a câmera chega perto. */
  | { m: 'cinematica'; dur: number; style: Cine }
  | { m: 'golpe'; range: number; arc: number; hit: Hit; look?: Look }
  | { m: 'area'; where: Where; r: number; hit: Hit; look?: Look }
  /** Raio que pula de inimigo em inimigo. */
  | { m: 'cadeia'; n: number; range: number; hit: Hit }
);
export type MoveKind = Move['m'];

export interface Kit {
  card: string;
  /** O que a carta faz na masmorra (aparece no Códex). */
  about: string;
  moves: Move[];
  /** Recarga própria (senão, a da raridade). */
  cd?: number;
  /** Custo: escudo (sem escudo, coração) ou coração. */
  custo?: 'escudo' | 'coracao';
  mana?: number;
}

export const MOVE_NAME: Record<MoveKind, string> = {
  proj: 'projétil', tornado: 'tornado', raio: 'raio', zona: 'zona no chão', chuva: 'cai do céu', investida: 'investida', rajada: 'rajada',
  orbita: 'órbita', invocar: 'invocação', transformar: 'transformação', marca: 'marca', armadilha: 'armadilha', puxar: 'vórtice',
  empurrar: 'onda de choque', prender: 'prende', buff: 'bênção', parar_tiros: 'para tiros', cinematica: 'cena especial', golpe: 'golpe',
  area: 'explosão', cadeia: 'cadeia',
};

// ─── estados e reações ──────────────────────────────────────────────────────

export interface St { t: number; v: number; n: number }
export type Bag = Partial<Record<StatusId, St>>;

export type ReactionId = 'congelou' | 'choque' | 'incendio' | 'derreteu' | 'toxica' | 'espalhou' | 'lama' | 'vapor' | 'paralisou' | 'estilhacou';
export const REACTIONS: Record<ReactionId, { nome: string; about: string }> = {
  congelou: { nome: 'CONGELOU!', about: 'Molhado + gelo: congela por mais tempo.' },
  choque: { nome: 'CHOQUE EM CADEIA!', about: 'Molhado + raio: dano dobrado e pula para os vizinhos.' },
  incendio: { nome: 'INCÊNDIO!', about: 'Semente + fogo: o fogo espalha para quem está perto.' },
  derreteu: { nome: 'DERRETEU!', about: 'Congelado + fogo: dano extra e tira o gelo.' },
  toxica: { nome: 'EXPLOSÃO TÓXICA!', about: 'Veneno + fogo: explode o veneno em volta.' },
  espalhou: { nome: 'ESPALHOU!', about: 'Vento em quem tem estado: passa para os vizinhos.' },
  lama: { nome: 'LAMA!', about: 'Molhado + terra: quase não anda.' },
  vapor: { nome: 'VAPOR!', about: 'Queimando + água: apaga e cega.' },
  paralisou: { nome: 'PARALISOU!', about: 'Três raios seguidos: paralisa.' },
  estilhacou: { nome: 'ESTILHAÇOU!', about: 'Congelado + golpe pesado: quebra o gelo com dano enorme.' },
};
/** Estados que o vento espalha. */
export const SPREADS: StatusId[] = ['queimar', 'veneno', 'molhado', 'eletrizado', 'lento', 'semente', 'amaldicoado', 'cego'];
/** Estado que cada elemento costuma deixar (só para os rótulos do Códex e a cor). */
export const EL_STATUS: Partial<Record<Element, StatusId>> = {
  Fire: 'queimar', Water: 'molhado', Ice: 'lento', Electric: 'eletrizado', Poison: 'veneno', Ground: 'lama', Grass: 'semente',
  Dark: 'amaldicoado', Ghost: 'cego', Steel: 'corte',
};

export interface Reaction {
  id?: ReactionId;
  /** Multiplica o dano deste golpe. */
  mult: number;
  /** Espalha estes estados (com a força atual) para quem está perto. */
  spread?: { st: StatusId; s: St }[];
  /** Choque: pula para os vizinhos. */
  chain?: boolean;
  /** Explosão tóxica: acúmulos de veneno que explodem. */
  burst?: number;
}

const has = (b: Bag, s: StatusId) => (b[s]?.t ?? 0) > 0;
/** Põe um estado (renova o tempo; veneno e raio acumulam). Devolve se paralisou. */
export function addStatus(b: Bag, st: StatusId, dur: number, v = 0, n = 1): boolean {
  const cur = b[st];
  if (st === 'veneno') { b.veneno = { t: Math.max(cur?.t ?? 0, dur), v: Math.max(cur?.v ?? 0, v), n: Math.min(5, (cur && cur.t > 0 ? cur.n : 0) + n) }; return false; }
  if (st === 'eletrizado') {
    const k = (cur && cur.t > 0 ? cur.n : 0) + n;
    if (k >= 3) { delete b.eletrizado; b.atordoado = { t: Math.max(b.atordoado?.t ?? 0, 1.2), v: 0, n: 1 }; return true; }
    b.eletrizado = { t: Math.max(cur?.t ?? 0, dur), v, n: k };
    return false;
  }
  if (st === 'chamaNegra') { b.chamaNegra = { t: 9999, v: Math.max(cur?.v ?? 0, v), n: 1 }; return false; }
  b[st] = { t: Math.max(cur?.t ?? 0, dur), v: Math.max(cur?.v ?? 0, v), n: 1 };
  return false;
}

/**
 * O golpe chega: confere as reações com o que o alvo já tem, tira o que a
 * reação gasta e põe o estado novo. `v` é o valor do estado (dano por segundo,
 * ou o dano da marca); `heavy` = golpe pesado (estilhaça o gelo).
 */
export function react(b: Bag, el: Element, st: StatusId | undefined, heavy: boolean): Reaction {
  const fire = el === 'Fire' || st === 'queimar' || st === 'chamaNegra';
  const ice = el === 'Ice' || st === 'congelado' || st === 'lento';
  const zap = el === 'Electric' || st === 'eletrizado';
  const water = el === 'Water' || st === 'molhado';
  const earth = el === 'Ground' || st === 'lama';
  if (has(b, 'congelado') && heavy) { delete b.congelado; return { id: 'estilhacou', mult: 1.8 }; }
  if (has(b, 'congelado') && fire) { delete b.congelado; addStatus(b, 'molhado', 3); return { id: 'derreteu', mult: 1.6 }; }
  if (has(b, 'molhado') && ice) { delete b.molhado; addStatus(b, 'congelado', 2.5); return { id: 'congelou', mult: 1.1 }; }
  if (has(b, 'molhado') && zap) { delete b.molhado; return { id: 'choque', mult: 2, chain: true }; }
  if (has(b, 'semente') && fire) {
    const s = { t: 4, v: Math.max(b.queimar?.v ?? 0, 4), n: 1 };
    delete b.semente; addStatus(b, 'queimar', s.t, s.v);
    return { id: 'incendio', mult: 1.2, spread: [{ st: 'queimar', s }] };
  }
  if (has(b, 'veneno') && fire) { const n = b.veneno!.n; delete b.veneno; return { id: 'toxica', mult: 1.2, burst: n }; }
  if (has(b, 'queimar') && water) { delete b.queimar; addStatus(b, 'cego', 2); return { id: 'vapor', mult: 1 }; }
  if (has(b, 'molhado') && earth) { delete b.molhado; addStatus(b, 'lama', 3); return { id: 'lama', mult: 1.1 }; }
  if (el === 'Flying') {
    const spread = SPREADS.filter(s => has(b, s)).map(s => ({ st: s, s: { ...b[s]! } }));
    if (spread.length) return { id: 'espalhou', mult: 1, spread };
  }
  return { mult: 1 };
}

/** Velocidade que sobra com os estados (1 = normal, 0 = parado). */
export function speedOf(b: Bag): number {
  if (has(b, 'congelado') || has(b, 'atordoado') || has(b, 'preso')) return 0;
  return (has(b, 'lama') ? 0.35 : has(b, 'lento') ? 0.5 : 1) * (has(b, 'molhado') ? 0.85 : 1);
}
export const canAct = (b: Bag) => !has(b, 'congelado') && !has(b, 'atordoado');
export const canAttack = (b: Bag) => canAct(b) && !has(b, 'selado');
export const hasSt = has;
/** Dano por segundo dos estados que machucam. */
export const dotOf = (b: Bag) =>
  (has(b, 'queimar') ? b.queimar!.v : 0) + (has(b, 'chamaNegra') ? b.chamaNegra!.v : 0) + (has(b, 'corte') ? b.corte!.v : 0) + (has(b, 'veneno') ? b.veneno!.v * b.veneno!.n : 0);
