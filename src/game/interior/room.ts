// Interiores: uma sala em grade (1 bloco = 16 px do mundo), com parede em
// cima, piso, móveis, tapetes, coisas penduradas na parede e personagens.
// Funções puras (testáveis sem navegador); o desenho fica em InteriorView.
//
// Os móveis vêm de public/game/interior/manifest.json (gerado por
// scripts/arte/importar-interiores.py): tamanho, camada, nome e pegada.
import { bossIdentity } from '@/lib/tcg/bosses';
import type { Dir } from '@/game/world/movement';

export const TILE = 16;

/** m = móvel no chão (bloqueia), t = tapete (por baixo), p = pendurado na parede. */
export type Layer = 'm' | 't' | 'p';

export interface ItemDef {
  w: number;
  h: number;
  cat: string;
  nome?: string;
  camada?: Layer;
  /** Pegada em blocos, [largura, fundo], com o móvel de frente. */
  pe?: [number, number];
  /** Tem tecido em cores-molde (dá para trocar a cor). */
  tecido?: boolean;
  /** Vista extra de outro item (ex.: "sofa-classico.lado"). */
  de?: string;
  vista?: string;
  /** Onde está no atlas (px hd): [x, y, w, h]. */
  a?: [number, number, number, number];
}
export type Manifest = Record<string, ItemDef>;

/**
 * Como o móvel está virado: de frente, de lado olhando para a direita, de
 * lado olhando para a esquerda (a vista de lado espelhada) ou de frente
 * espelhado (móvel que não tem vista de lado).
 */
export type Facing = 'frente' | 'direita' | 'esquerda' | 'espelho';

export interface Placed {
  id: string;
  tx: number;
  ty: number;
  facing?: Facing;
  /** Cor principal e do detalhe (móveis de tecido); chaves de CLOTH. */
  cor?: string;
  cor2?: string;
}

export interface RoomNpc {
  id: string;
  /** Folha em public/game/sprites/npcs. */
  sprite: string;
  tx: number;
  ty: number;
  dir: Dir;
  name: string;
  title: string;
  lines: string[];
  /** Blocos que, olhados pelo jogador, puxam conversa (a mesa na frente dele). */
  talk: [number, number][];
  /** Sentado atrás de uma mesa: desenhado por cima dela, um pouco mais baixo. */
  seated?: boolean;
  /** Vende alguma coisa (ids dos itens, src/game/items.ts). */
  shop?: string[];
  /** Abre uma tela própria ao conversar: loja de pacotinhos, forja. */
  action?: 'pacotes' | 'forja';
  /** Anda à toa dentro deste retângulo [x0, y0, x1, y1] (clientes do shopping). */
  wander?: [number, number, number, number];
  /** Aceita duelo: qual adversário da Torre ele é (ver src/lib/tcg/opponents.ts). */
  duel?: { kind: 'mesa'; andar: number; mesa: number; table: string } | { kind: 'chefe'; andar: number }
    /** Mesa da Arena: o nível acompanha o andar do aluno na Torre; não conta para a Torre. */
    | { kind: 'arena'; mesa: number; table: string };
}

/**
 * Para onde a saída leva: a cidade, o próximo andar da Torre ou outra sala
 * ("sala:treino"). Em bloco livre, vale pisar; em bloco ocupado (escada,
 * portal), vale esbarrar ou apertar o botão olhando para ele.
 */
export type ExitKind = 'cidade' | 'subir' | `sala:${string}`;
export interface Exit { tx: number; ty: number; to: ExitKind }

/** Ponto de conversa sem personagem (vitrine de loja, balcão, portal). */
export interface Talk {
  tiles: [number, number][]; lines: string[];
  /** Abre uma tela em vez de só falar: o elevador da Torre, sentar numa mesa vazia (PvP). */
  action?: 'elevador' | 'sentar' | 'pacotes';
  /** Mesa vazia: o bloco da cadeira (onde o aluno senta). */
  seat?: [number, number];
}
/** Faixa de outro piso por cima do piso da sala (tapete vermelho do castelo). */
export interface Patch { piso: string; tx: number; ty: number; w: number; h: number }

export interface Room {
  id: string;
  title: string;
  w: number;
  h: number;
  /** Quantas linhas de cima são parede. */
  wallRows: number;
  piso: string;
  parede: string;
  items: Placed[];
  npcs: RoomNpc[];
  spawn: { tx: number; ty: number; dir: Dir };
  /** Saídas: pisar na porta (cidade) ou esbarrar na escada (subir). */
  exits: Exit[];
  talks?: Talk[];
  patches?: Patch[];
  /** Onde aparece quem chega de outra sala (pelo id dela). */
  entries?: Record<string, { tx: number; ty: number; dir: Dir }>;
}

export function layerOf(m: Manifest, id: string): Layer {
  return m[id]?.camada ?? 'm';
}

/** Tem vista de lado ("<id>.lado")? */
export function hasSide(m: Manifest, id: string): boolean {
  return !!m[`${id}.lado`];
}

/** Pegada em blocos considerando para onde o móvel está virado. */
export function footprint(m: Manifest, p: Placed): [number, number] {
  const d = m[p.id];
  if (!d) return [1, 1];
  const layer = d.camada ?? 'm';
  if (layer === 't') return [Math.max(1, Math.round(d.w / TILE)), Math.max(1, Math.round(d.h / TILE))];
  if (layer === 'p') return [Math.max(1, Math.round(d.w / TILE)), 1];
  const [w, dd] = d.pe ?? [Math.max(1, Math.round(d.w / TILE)), Math.max(1, Math.round(d.h / TILE) - 1)];
  const side = (p.facing === 'direita' || p.facing === 'esquerda') && hasSide(m, p.id);
  return side ? [dd, w] : [w, dd];
}

/** Sprite usado e se é desenhado espelhado. */
export function spriteOf(m: Manifest, p: Placed): { id: string; flip: boolean } {
  const side = (p.facing === 'direita' || p.facing === 'esquerda') && hasSide(m, p.id);
  if (side) return { id: `${p.id}.lado`, flip: p.facing === 'esquerda' };
  return { id: p.id, flip: p.facing === 'espelho' || p.facing === 'esquerda' };
}

/** Próxima posição ao girar: frente → direita → esquerda → frente (ou frente ↔ espelho). */
export function nextFacing(m: Manifest, p: Placed): Facing {
  const f = p.facing ?? 'frente';
  if (hasSide(m, p.id)) return f === 'frente' || f === 'espelho' ? 'direita' : f === 'direita' ? 'esquerda' : 'frente';
  return f === 'espelho' ? 'frente' : 'espelho';
}

/**
 * Retângulo do sprite em pixels do mundo: a base do desenho encosta na borda
 * de baixo da pegada, centrado na largura dela. Os da parede ficam na faixa
 * da parede, apoiados um pouco acima do rodapé.
 */
export function spriteRect(m: Manifest, room: Pick<Room, 'wallRows'>, p: Placed): { x: number; y: number; w: number; h: number; baseY: number } {
  const s = m[spriteOf(m, p).id] ?? m[p.id];
  const w = s?.w ?? TILE, h = s?.h ?? TILE;
  const [fw, fd] = footprint(m, p);
  const x = Math.round(p.tx * TILE + (fw * TILE - w) / 2);
  const layer = layerOf(m, p.id);
  if (layer === 'p') {
    const wallH = room.wallRows * TILE;
    const y = Math.max(2, Math.round(wallH - 8 - h));
    return { x, y, w, h, baseY: -1 };
  }
  if (layer === 't') {
    const y = Math.round(p.ty * TILE + (fd * TILE - h) / 2);
    return { x, y, w, h, baseY: -1 };
  }
  const baseY = (p.ty + fd) * TILE;
  return { x, y: baseY - h, w, h, baseY };
}

/** Blocos ocupados: parede, bordas e móveis do chão. */
export function solidGrid(m: Manifest, room: Room): boolean[][] {
  const g = Array.from({ length: room.h }, (_, y) => Array.from({ length: room.w }, () => y < room.wallRows));
  for (const p of room.items) {
    if (layerOf(m, p.id) !== 'm') continue;
    const [fw, fd] = footprint(m, p);
    for (let y = p.ty; y < p.ty + fd; y++) for (let x = p.tx; x < p.tx + fw; x++) if (g[y]?.[x] !== undefined) g[y][x] = true;
  }
  for (const n of room.npcs) if (g[n.ty]?.[n.tx] !== undefined) g[n.ty][n.tx] = true;
  return g;
}

/**
 * Cabe aqui? Móvel e tapete: dentro do piso; móvel não encosta em outro móvel
 * nem tampa uma saída ou o lugar de alguém. Da parede: dentro da parede, sem
 * sobrepor outro da parede.
 */
export function canPlace(m: Manifest, room: Room, p: Placed, ignore = -1): boolean {
  const layer = layerOf(m, p.id);
  const [fw, fd] = footprint(m, p);
  if (p.tx < 0 || p.tx + fw > room.w) return false;
  const others = room.items.filter((_, i) => i !== ignore);
  const overlaps = (q: Placed) => {
    const [qw, qd] = footprint(m, q);
    return p.tx < q.tx + qw && q.tx < p.tx + fw && p.ty < q.ty + qd && q.ty < p.ty + fd;
  };
  if (layer === 'p') {
    if (p.ty !== room.wallRows - 1) return false;
    return !others.some(q => layerOf(m, q.id) === 'p' && p.tx < q.tx + footprint(m, q)[0] && q.tx < p.tx + fw);
  }
  if (p.ty < room.wallRows || p.ty + fd > room.h) return false;
  if (layer === 't') return true;
  if (others.some(q => layerOf(m, q.id) === 'm' && overlaps(q))) return false;
  const inside = (x: number, y: number) => x >= p.tx && x < p.tx + fw && y >= p.ty && y < p.ty + fd;
  if (room.exits.some(e => inside(e.tx, e.ty) || inside(e.tx, e.ty - 1))) return false;
  if (inside(room.spawn.tx, room.spawn.ty)) return false;
  return !room.npcs.some(n => inside(n.tx, n.ty));
}

/** Gerador pequeno e determinístico (a mesma sala para o mesmo andar). */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

const NOMES = ['Kaio', 'Lia', 'Theo', 'Nina', 'Ravi', 'Bia', 'Enzo', 'Luna', 'Davi', 'Maya', 'Téo', 'Iris', 'Caio', 'Aya', 'Noah', 'Clara', 'Ian', 'Sofia', 'Leo', 'Duda'];
const FALAS = [
  'Cheguei até aqui sem perder nenhuma! Quer tentar?',
  'Meu deck é todo de um elemento só. Aguenta?',
  'Treinei a semana inteira pra este andar.',
  'Se ganhar de mim, a mesa é sua.',
  'Dizem que o chefe deste andar nunca perdeu...',
  'Embaralhei três vezes. Agora vai!',
  'Carta forte cobra sacrifício. Eu pago!',
  'Ei, você é novo por aqui, né?',
];
const MESAS_BASICAS = ['mesa-duelo-verde', 'mesa-duelo-vermelha', 'mesa-duelo-azul', 'mesa-duelo-roxa'];
const MESAS_ELEMENTO = ['mesa-fogo', 'mesa-agua', 'mesa-eletrico', 'mesa-planta', 'mesa-gelo', 'mesa-terra',
  'mesa-luta', 'mesa-metal', 'mesa-veneno', 'mesa-sombrio', 'mesa-fantasma', 'mesa-voador'];

/** Faixa de andares: muda o piso, o trono e a decoração. */
export function towerBand(andar: number): 'dojo' | 'pedra' | 'real' {
  return andar <= 30 ? 'dojo' : andar <= 70 ? 'pedra' : 'real';
}

function throneFor(andar: number): string {
  if (andar >= 100) return 'trono-nuvem';
  if (andar > 90) return 'trono-cristal';
  if (andar > 70) return 'trono-ouro';
  if (andar > 50) return 'trono-dragao';
  if (andar > 30) return 'trono-pedra';
  return 'trono-madeira';
}

/**
 * Um andar da Torre: 8 mesas de duelo, cada uma com um desafiante atrás, e o
 * chefe no alto, atrás da mesa dele, com o trono e a escada para o próximo
 * andar. A porta de baixo volta para a cidade.
 */
export function towerRoom(andar: number): Room {
  andar = Math.max(1, Math.min(100, Math.round(andar)));
  const W = 20, H = 18, WALL = 3;
  const r = rng(andar * 7919);
  const band = towerBand(andar);
  const items: Placed[] = [];
  const npcs: RoomNpc[] = [];
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  // baralhos embaralhados: as mesas do andar não se repetem
  const shuffled = <T,>(a: T[]) => a.map(v => [r(), v] as const).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const basicas = shuffled(MESAS_BASICAS), elementos = shuffled(MESAS_ELEMENTO);
  // chefe: trono, ele e a mesa dele no meio, em cima
  items.push({ id: throneFor(andar), tx: 9, ty: 3 });
  items.push({ id: 'mesa-chefe', tx: 8, ty: 5 });
  npcs.push({
    id: 'chefe', sprite: andar % 10 === 0 ? 'npc-desafiante-12' : 'npc-desafiante-11', tx: 10, ty: 4, dir: 'south',
    name: bossIdentity(andar).name, title: `Chefe do Andar ${andar}`,
    lines: [`Andar ${andar}. ${bossIdentity(andar).line}`, 'Quem me vence ganha uma carta do meu deck e sobe para o próximo andar.'],
    talk: [[10, 4], [8, 5], [9, 5], [10, 5], [11, 5], [8, 6], [9, 6], [10, 6], [11, 6]],
    seated: true,
    duel: { kind: 'chefe', andar },
  });
  items.push({ id: 'escada', tx: 1, ty: 3 });
  items.push({ id: 'gongo', tx: 16, ty: 3 });
  items.push({ id: 'quadro-chaves', tx: 12, ty: WALL - 1 });
  items.push({ id: 'placa-andar', tx: 7, ty: 16 });
  // elevador: painel na parede do canto direito (escolhe o andar)
  items.push({ id: 'painel-led', tx: 18, ty: WALL - 1 });
  // 8 mesas em 2 fileiras de 4 (o corredor do meio fica livre até o chefe)
  const cols = [1, 5, 12, 16], rows = [9, 13];
  let k = 0;
  for (const ty of rows) {
    for (const tx of cols) {
      k++;
      const mesa = band === 'dojo' && r() < 0.5 && basicas.length ? basicas.pop()! : elementos.pop() ?? pick(MESAS_ELEMENTO);
      items.push({ id: mesa, tx, ty });
      const nome = NOMES[(andar * 3 + k * 7) % NOMES.length];
      const sprite = `npc-desafiante-${String(((andar + k * 3) % 10) + 1).padStart(2, '0')}`;
      npcs.push({
        id: `mesa-${k}`, sprite, tx: tx + 1, ty: ty - 1, dir: 'south', name: nome, title: `Andar ${andar} · Mesa ${k}`,
        lines: [FALAS[(andar + k) % FALAS.length]],
        talk: [[tx + 1, ty - 1], [tx, ty], [tx + 1, ty], [tx + 2, ty], [tx, ty + 1], [tx + 1, ty + 1], [tx + 2, ty + 1]],
        seated: true,
        duel: { kind: 'mesa', andar, mesa: k, table: mesa },
      });
    }
  }
  // decoração da faixa
  if (band === 'dojo') {
    items.push({ id: 'estandarte-espadas', tx: 4, ty: 3 }, { id: 'estandarte-copas', tx: 6, ty: 3 },
      { id: 'estandarte-ouros', tx: 13, ty: 3 }, { id: 'estandarte-paus', tx: 15, ty: 3 });
    items.push({ id: 'pergaminho', tx: 5, ty: WALL - 1 }, { id: 'porta-papel', tx: 15, ty: WALL - 1 });
    items.push({ id: 'lanterna-papel', tx: 0, ty: 8 }, { id: 'lanterna-papel', tx: 19, ty: 8 });
    items.push({ id: 'bonsai', tx: 0, ty: 16 }, { id: 'boneco-treino', tx: 19, ty: 16 });
    items.push({ id: 'barril-agua', tx: 19, ty: 12 }, { id: 'almofadas', tx: 1, ty: 16 });
    items.push({ id: 'tatame', tx: 8, ty: 10 }, { id: 'tatame', tx: 10, ty: 10 });
  } else if (band === 'pedra') {
    items.push({ id: 'pilar-carta', tx: 4, ty: 3 }, { id: 'pilar-carta', tx: 15, ty: 3 });
    items.push({ id: 'tocha', tx: 6, ty: 3 }, { id: 'tocha', tx: 13, ty: 3 });
    items.push({ id: 'braseiro', tx: 0, ty: 8 }, { id: 'braseiro', tx: 18, ty: 8 });
    items.push({ id: 'estatua-campeao', tx: 0, ty: 16 }, { id: 'coluna-quebrada', tx: 19, ty: 16 });
    items.push({ id: 'banco-pedra', tx: 1, ty: 16 }, { id: 'tabua-pedra', tx: 17, ty: 16 });
  } else {
    items.push({ id: 'pilar-ouro', tx: 4, ty: 3 }, { id: 'pilar-ouro', tx: 15, ty: 3 });
    items.push({ id: 'estandarte-real', tx: 6, ty: 3 }, { id: 'estandarte-real', tx: 13, ty: 3 });
    items.push({ id: 'lustre-cristal', tx: 5, ty: WALL - 1 }, { id: 'lustre-cristal', tx: 15, ty: WALL - 1 });
    items.push({ id: 'vitrine-trofeus', tx: 0, ty: 16 }, { id: 'estatua-carta-alada', tx: 18, ty: 16 });
    items.push({ id: 'banco-veludo', tx: 2, ty: 16 }, { id: 'cordao-veludo', tx: 16, ty: 16 });
  }
  return {
    id: `torre-${andar}`, title: `Torre · Andar ${andar}`,
    w: W, h: H, wallRows: WALL,
    piso: band === 'dojo' ? 'piso-torre-piso-1' : band === 'pedra' ? 'piso-torre-piso-2' : 'piso-torre-piso-3',
    parede: 'parede-torre-parede',
    items, npcs,
    spawn: { tx: 10, ty: 16, dir: 'north' },
    exits: [{ tx: 9, ty: 17, to: 'cidade' }, { tx: 10, ty: 17, to: 'cidade' }, { tx: 2, ty: 4, to: 'subir' }],
    talks: [{ tiles: [[18, 2], [19, 2], [18, 3], [19, 3]], lines: ['Elevador da Torre.'], action: 'elevador' }],
    entries: { elevador: { tx: 18, ty: 5, dir: 'south' } },
  };
}

/** Decoração inicial da Sua Casa (o aluno muda tudo no modo DECORAR). */
export const HOUSE_START: Placed[] = [
  { id: 'janela-cortina', tx: 2, ty: 2 },
  { id: 'relogio-parede', tx: 6, ty: 2 },
  { id: 'janela-cortina', tx: 10, ty: 2 },
  { id: 'cama-solteiro', tx: 1, ty: 3, cor: 'verde', cor2: 'amarelo' },
  { id: 'mesinha-abajur', tx: 2, ty: 3 },
  { id: 'guarda-roupa', tx: 4, ty: 3 },
  { id: 'estante', tx: 8, ty: 3 },
  { id: 'costela-adao', tx: 12, ty: 3 },
  { id: 'tapete-tranca', tx: 5, ty: 6, cor: 'laranja', cor2: 'amarelo' },
  { id: 'sofa-classico', tx: 5, ty: 8, cor: 'verde', cor2: 'amarelo' },
  { id: 'mesa-centro', tx: 5, ty: 6 },
  { id: 'tv-rack', tx: 5, ty: 4 },
  { id: 'poltrona', tx: 8, ty: 7, facing: 'esquerda', cor: 'marinho', cor2: 'amarelo' },
  { id: 'luminaria-chao', tx: 12, ty: 7 },
  { id: 'caminha-pet', tx: 1, ty: 8 },
  { id: 'capacho', tx: 6, ty: 10 },
];

export function houseRoom(items: Placed[] = HOUSE_START): Room {
  return {
    id: 'casa', title: 'Sua Casa',
    w: 14, h: 11, wallRows: 3,
    piso: 'piso-casa-piso', parede: 'parede-casa-parede',
    items: items.map(p => ({ ...p })),
    npcs: [],
    spawn: { tx: 6, ty: 9, dir: 'north' },
    exits: [{ tx: 6, ty: 10, to: 'cidade' }, { tx: 7, ty: 10, to: 'cidade' }],
  };
}

/** Pisos e paredes que a casa pode usar (trocados no modo DECORAR). */
export const HOUSE_FLOORS = ['piso-casa-piso', 'piso-casa-piso-2', 'piso-casa-piso-3', 'piso-casa-piso-4'];
export const HOUSE_WALLS = ['parede-casa-parede', 'parede-casa-parede-2', 'parede-casa-parede-3', 'parede-casa-parede-4'];

/** Categorias do catálogo de móveis da casa, na ordem das abas. */
export const HOUSE_CATS: { id: string; nome: string }[] = [
  { id: 'sofa', nome: 'Sofás' }, { id: 'poltrona', nome: 'Cadeiras' }, { id: 'cama', nome: 'Camas' },
  { id: 'mesa', nome: 'Mesas' }, { id: 'armario', nome: 'Armários' }, { id: 'tapete', nome: 'Tapetes' },
  { id: 'planta', nome: 'Plantas' }, { id: 'luz', nome: 'Luzes' }, { id: 'eletronico', nome: 'Eletrônicos' },
  { id: 'parede', nome: 'Parede' }, { id: 'cozinha', nome: 'Cozinha' }, { id: 'banheiro', nome: 'Banheiro' },
  { id: 'gamer', nome: 'Gamer' }, { id: 'extra', nome: 'Extras' },
];

/** Itens de uma categoria (só as vistas principais). */
export function catalogOf(m: Manifest, cat: string): string[] {
  return Object.keys(m).filter(id => m[id].cat === cat && !m[id].de).sort((a, b) => (m[a].nome ?? a).localeCompare(m[b].nome ?? b, 'pt'));
}

/** Casa salva: descarta itens que não existem mais e os que não cabem. */
export function sanitizeHouse(m: Manifest, items: unknown): Placed[] | null {
  if (!Array.isArray(items)) return null;
  const room = houseRoom([]);
  const out: Placed[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const q = raw as Record<string, unknown>;
    if (typeof q.id !== 'string' || !m[q.id] || m[q.id].de) continue;
    if (!Number.isInteger(q.tx) || !Number.isInteger(q.ty)) continue;
    const p: Placed = { id: q.id, tx: q.tx as number, ty: q.ty as number };
    if (q.facing === 'direita' || q.facing === 'esquerda' || q.facing === 'espelho') p.facing = q.facing;
    if (typeof q.cor === 'string') p.cor = q.cor;
    if (typeof q.cor2 === 'string') p.cor2 = q.cor2;
    room.items = out;
    if (canPlace(m, room, p)) out.push(p);
  }
  return out;
}

// ── Salas dos prédios da cidade ──

const npc = (id: string, sprite: string, tx: number, ty: number, name: string, title: string, lines: string[], extra: Partial<RoomNpc> = {}): RoomNpc =>
  ({ id, sprite, tx, ty, dir: 'south', name, title, lines, talk: [[tx, ty]], ...extra });

/** Blocos de uma pegada (para puxar conversa pela mesa ou pelo balcão). */
const area = (tx: number, ty: number, w: number, h: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) out.push([x, y]);
  return out;
};
/** Desafiante sentado atrás de uma mesa 3 × 2 cujo canto é (tx, ty). */
const seatedAt = (id: string, sprite: string, tx: number, ty: number, name: string, title: string, lines: string[]): RoomNpc =>
  npc(id, sprite, tx + 1, ty - 1, name, title, lines, { talk: [[tx + 1, ty - 1], ...area(tx, ty, 3, 2)], seated: true });

/**
 * Arena, saguão: salão grande de campeonato. As mesas de duelo são como as da
 * Torre (cadeira alta atrás, o jogador senta de verdade). Metade tem um
 * desafiante esperando (dá para duelar); a outra metade está vazia, com a
 * plaquinha LIVRE: o aluno senta e espera outro aluno sentar na frente (PvP).
 * Recepção, placar e telão na parede; o portal leva ao Salão de Treino.
 */
export const ARENA_TABLES: { tx: number; ty: number; table: string; npc?: { sprite: string; name: string } }[] = [
  { tx: 2, ty: 7, table: 'mesa-duelo-azul', npc: { sprite: 'npc-desafiante-04', name: 'Nina' } },
  { tx: 8, ty: 7, table: 'mesa-duelo-verde' },
  { tx: 17, ty: 7, table: 'mesa-duelo-vermelha', npc: { sprite: 'npc-desafiante-08', name: 'Maya' } },
  { tx: 23, ty: 7, table: 'mesa-duelo-roxa' },
  { tx: 2, ty: 11, table: 'mesa-duelo-vermelha' },
  { tx: 8, ty: 11, table: 'mesa-duelo-roxa', npc: { sprite: 'npc-desafiante-05', name: 'Theo' } },
  { tx: 17, ty: 11, table: 'mesa-duelo-azul' },
  { tx: 23, ty: 11, table: 'mesa-duelo-verde', npc: { sprite: 'npc-desafiante-01', name: 'Kaio' } },
  { tx: 2, ty: 15, table: 'mesa-duelo-verde', npc: { sprite: 'npc-desafiante-03', name: 'Lia' } },
  { tx: 8, ty: 15, table: 'mesa-duelo-azul' },
  { tx: 17, ty: 15, table: 'mesa-duelo-roxa' },
  { tx: 23, ty: 15, table: 'mesa-duelo-vermelha', npc: { sprite: 'npc-desafiante-07', name: 'Duda' } },
];

export function arenaRoom(): Room {
  const W = 28, H = 20, WALL = 3;
  const items: Placed[] = [
    { id: 'placar-ranking', tx: 2, ty: 3 }, { id: 'trofeu-pedestal', tx: 7, ty: 3 },
    { id: 'recepcao', tx: 12, ty: 4 }, { id: 'trofeu-pedestal', tx: 18, ty: 3 }, { id: 'telao', tx: 20, ty: 3 },
    { id: 'refletor', tx: 0, ty: 3 }, { id: 'refletor', tx: 27, ty: 3 },
    { id: 'portal-azul', tx: 24, ty: 3 },
    { id: 'planta-saguao', tx: 0, ty: 18 }, { id: 'maquina-bebidas', tx: 27, ty: 7 }, { id: 'bebedouro', tx: 27, ty: 10 },
    { id: 'banco-espera', tx: 6, ty: 18 }, { id: 'banco-espera', tx: 19, ty: 18 }, { id: 'planta-saguao', tx: 27, ty: 18 },
  ];
  const npcs: RoomNpc[] = [
    npc('recepcao', 'npc-desafiante-10', 13, 3, 'Rafa', 'Recepção da Arena', [
      'Bem-vinda à Arena! Mesa com alguém sentado: pode desafiar. Mesa LIVRE: sente e espere um colega.',
      'O portal azul leva ao Salão de Treino dos Rank S. Só entra quem tem coragem!',
    ], { talk: [[13, 3], ...area(12, 4, 3, 1)], seated: true }),
  ];
  const talks: Talk[] = [
    { tiles: area(2, 3, 3, 1), lines: ['Placar do ranking: os melhores da semana aparecem aqui.'] },
    { tiles: area(20, 3, 3, 1), lines: ['No telão passam os duelos ao vivo (em breve).'] },
  ];
  ARENA_TABLES.forEach((t, k) => {
    items.push({ id: t.table, tx: t.tx, ty: t.ty });
    if (t.npc) {
      npcs.push({
        ...seatedAt(`arena-${k + 1}`, t.npc.sprite, t.tx, t.ty, t.npc.name, 'Esperando desafio', ['Estou esperando um desafiante. Quer duelar?']),
        duel: { kind: 'arena', mesa: k + 1, table: t.table },
      });
    } else {
      talks.push({ tiles: area(t.tx, t.ty, 3, 2), lines: ['Mesa livre.'], action: 'sentar', seat: [t.tx + 1, t.ty - 1] });
    }
  });
  return {
    id: 'arena', title: 'Arena · Saguão', w: W, h: H, wallRows: WALL,
    piso: 'piso-arena-piso-1', parede: 'parede-arena-parede-1', items, npcs, talks,
    spawn: { tx: 13, ty: 18, dir: 'north' },
    exits: [{ tx: 13, ty: 19, to: 'cidade' }, { tx: 14, ty: 19, to: 'cidade' }, ...[24, 25, 26].map(tx => ({ tx, ty: 4, to: 'sala:treino' as const }))],
    entries: { treino: { tx: 25, ty: 5, dir: 'south' } },
  };
}

/** Salão de Treino Rank S: escuro, portões de rank e uma mesa de runas no meio. */
export function trainingRoom(): Room {
  const items: Placed[] = [
    { id: 'portao-e', tx: 0, ty: 3 }, { id: 'portao-d', tx: 3, ty: 3 }, { id: 'portao-c', tx: 6, ty: 3 },
    { id: 'portao-b', tx: 9, ty: 3 }, { id: 'portao-a', tx: 12, ty: 3 }, { id: 'portao-s', tx: 15, ty: 3 },
    { id: 'plataforma-runas', tx: 7, ty: 8 }, { id: 'mesa-runas', tx: 7, ty: 11 },
    { id: 'pilar-cristal', tx: 1, ty: 7 }, { id: 'pilar-cristal', tx: 16, ty: 7 },
    { id: 'braseiro-azul', tx: 1, ty: 11 }, { id: 'braseiro-azul', tx: 16, ty: 11 },
    { id: 'boneco-cristal', tx: 3, ty: 8 }, { id: 'boneco-cristal', tx: 13, ty: 8 },
    { id: 'orbe-luz', tx: 4, ty: 12 }, { id: 'orbe-luz', tx: 13, ty: 12 },
    { id: 'quadro-rank', tx: 0, ty: 14 }, { id: 'rack-capas', tx: 15, ty: 14 },
    { id: 'estandarte-escuro', tx: 5, ty: 6 }, { id: 'estandarte-escuro', tx: 12, ty: 6 },
  ];
  return {
    id: 'treino', title: 'Arena · Salão de Treino Rank S', w: 18, h: 16, wallRows: 3,
    piso: 'piso-arena-piso-2', parede: 'parede-arena-parede-2', items,
    npcs: [
      seatedAt('rank-s', 'npc-desafiante-06', 7, 11, 'Sombra', 'Rank S', [
        'Aqui treinam os Rank S antes das expedições.',
        'Cada portão é um rank, do E ao S. Ganhe no seu rank para abrir o próximo. (Em breve.)',
      ]),
    ],
    talks: [
      { tiles: area(0, 3, 18, 2), lines: ['Um portão de rank. Ainda está selado.'] },
      { tiles: area(7, 8, 3, 2), lines: ['A plataforma de runas vibra quando alguém duela aqui.'] },
    ],
    spawn: { tx: 8, ty: 14, dir: 'north' },
    exits: [{ tx: 8, ty: 15, to: 'sala:arena' }, { tx: 9, ty: 15, to: 'sala:arena' }],
  };
}

/** Loja de Pacotinhos: um shopping com 8 lojas, cada uma com o que vende bem claro. */
export function shopRoom(): Room {
  // shopping: a loja de pacotinhos fica bem na frente de quem entra, com tapete,
  // pacotinhos gigantes e torres de pacotes; as outras lojas nas paredes, com
  // corredores largos; clientes passeando.
  const W = 32, H = 24;
  const stores: [string, number, number, string][] = [
    ['loja-pets', 1, 3, 'Ovos de pet: choque e ganhe um companheiro que te segue pela cidade.'],
    ['loja-roupas', 9, 3, 'Roupas e acessórios para o seu visual.'],
    ['loja-moveis', 17, 3, 'Móveis, tapetes e papéis de parede para a Sua Casa.'],
    ['loja-acessorios', 25, 3, 'Capinhas, fichários e tapetes de jogo para o seu deck.'],
    ['loja-eventos', 1, 11, 'Pacotinhos especiais de evento aparecem aqui na época certa.'],
    ['loja-premios', 25, 11, 'Recompensas da Sala: troque moedas por tempo de tablet, VR ou música na Alexa.'],
    ['loja-informacoes', 1, 18, 'Perdido? A loja de pacotinhos é a do meio, com o tapete. As moedas vêm das aulas e dos duelos.'],
  ];
  const items: Placed[] = [];
  const talks: Talk[] = [];
  for (const [id, tx, ty, text] of stores) {
    items.push({ id, tx, ty });
    talks.push({ tiles: area(tx, ty, 6, 3), lines: [text, 'Esta loja abre em breve.'] });
  }
  // a estrela: a loja de pacotinhos no meio, de frente para a porta
  items.push({ id: 'loja-pacotinhos', tx: 13, ty: 12 });
  talks.push({ tiles: area(13, 12, 6, 3), lines: ['Loja de Pacotinhos'], action: 'pacotes' });
  items.push(
    { id: 'tapete-pacotinho', tx: 15, ty: 15 }, { id: 'tapete-pacotinho', tx: 15, ty: 18 },
    { id: 'pacotinho-gigante', tx: 10, ty: 13 }, { id: 'pacotinho-gigante', tx: 20, ty: 13 },
    { id: 'torre-pacotinhos', tx: 12, ty: 16 }, { id: 'torre-pacotinhos', tx: 19, ty: 16 },
    { id: 'vitrine-lendaria', tx: 10, ty: 10 }, { id: 'vitrine-rara', tx: 21, ty: 10 },
    { id: 'fonte-loja', tx: 15, ty: 7 }, { id: 'banco-loja', tx: 11, ty: 7 }, { id: 'banco-loja', tx: 19, ty: 7 },
    { id: 'palmeira-loja', tx: 8, ty: 9 }, { id: 'palmeira-loja', tx: 23, ty: 9 },
    { id: 'baloes', tx: 9, ty: 15 }, { id: 'baloes', tx: 22, ty: 15 },
    { id: 'mapa-loja', tx: 25, ty: 18 }, { id: 'banco-loja', tx: 27, ty: 21 }, { id: 'palmeira-loja', tx: 31, ty: 21 },
    { id: 'cesto-pacotinhos', tx: 8, ty: 20 }, { id: 'cesto-pacotinhos', tx: 22, ty: 20 },
  );
  talks.push({ tiles: [[25, 18]], lines: ['Mapa do shopping: no meio, os pacotinhos; em cima, pets, roupas, móveis e acessórios; dos lados, eventos e prêmios.'] });
  talks.push({ tiles: area(10, 10, 2, 1), lines: ['Uma carta Lendária girando na vitrine... quem sabe no próximo pacotinho?'] });
  talks.push({ tiles: area(12, 16, 1, 1), lines: ['Torre de pacotinhos: Comum, Incomum, Rara, Épica, Lendária e Mítica.'], action: 'pacotes' });
  talks.push({ tiles: area(19, 16, 1, 1), lines: ['Torre de pacotinhos.'], action: 'pacotes' });
  const npcs: RoomNpc[] = [
    npc('cliente-1', 'npc-desafiante-02', 6, 9, 'Lia', 'Fazendo compras', ['Juntei moedas a semana inteira para um Pacotinho Raro!'], { wander: [3, 7, 12, 10] }),
    npc('cliente-2', 'npc-desafiante-07', 24, 16, 'Duda', 'Fazendo compras', ['Saiu uma Épica no meu último pacotinho!!'], { wander: [21, 15, 30, 21] }),
    npc('cliente-3', 'npc-desafiante-05', 16, 9, 'Theo', 'Olhando as vitrines', ['Será que hoje sai uma Mítica?'], { wander: [12, 6, 21, 10] }),
    npc('cliente-4', 'npc-desafiante-12', 4, 21, 'Rafa', 'Passeando', ['Esse shopping é enorme!'], { wander: [2, 21, 11, 22] }),
  ];
  return {
    id: 'loja', title: 'Loja de Pacotinhos', w: W, h: H, wallRows: 3,
    piso: 'piso-loja-piso', parede: 'parede-loja-parede', items, npcs, talks,
    spawn: { tx: 15, ty: 22, dir: 'north' },
    exits: [{ tx: 15, ty: 23, to: 'cidade' }, { tx: 16, ty: 23, to: 'cidade' }],
  };
}

/** Oficina de Cartas: café aconchegante de trocas, com a forja num canto. */
export function workshopRoom(): Room {
  const items: Placed[] = [
    { id: 'estante-albuns', tx: 0, ty: 3 }, { id: 'balcao-cafe', tx: 3, ty: 4 }, { id: 'vitrine-doces', tx: 6, ty: 4 },
    { id: 'lareira-oficina', tx: 9, ty: 3 }, { id: 'estante-albuns-alta', tx: 12, ty: 3 },
    { id: 'forja', tx: 15, ty: 3 }, { id: 'bigorna', tx: 17, ty: 4 }, { id: 'bancada', tx: 15, ty: 6 }, { id: 'potes-po', tx: 18, ty: 7 },
    { id: 'atril', tx: 15, ty: 9 },
    { id: 'mesa-feltro-verde', tx: 1, ty: 8 }, { id: 'mesa-feltro-vermelho', tx: 6, ty: 8 },
    { id: 'mesa-troca-longa', tx: 1, ty: 12 }, { id: 'mesa-troca-redonda', tx: 7, ty: 12 },
    { id: 'sofa-oficina', tx: 11, ty: 11 }, { id: 'mesa-sofa-baixa', tx: 15, ty: 12 },
    { id: 'poltrona-oficina', tx: 10, ty: 8 }, { id: 'gato-almofada', tx: 11, ty: 4 }, { id: 'arranhador', tx: 19, ty: 10 },
    { id: 'vitrola', tx: 0, ty: 15 }, { id: 'luminaria-oficina', tx: 19, ty: 15 }, { id: 'mural-ofertas', tx: 13, ty: 15 },
    { id: 'planta-pendurada-oficina', tx: 7, ty: 2 }, { id: 'moldura-rara', tx: 5, ty: 15 },
  ];
  return {
    id: 'oficina', title: 'Oficina de Cartas', w: 20, h: 17, wallRows: 3,
    piso: 'piso-oficina-piso', parede: 'parede-oficina-parede', items,
    npcs: [
      npc('barista', 'npc-desafiante-09', 4, 3, 'Dona Ana', 'Doces e Café', [
        'Um docinho para pensar melhor nas trocas? Tudo fresquinho!',
      ], { talk: [[4, 3], ...area(3, 4, 3, 1), ...area(6, 5, 2, 1)], seated: true, shop: ['rosquinha', 'cupcake', 'chocolate', 'sorvete', 'picole', 'pirulito'] }),
      npc('ferreiro', 'npc-desafiante-03', 17, 3, 'Prof. Ian', 'Forja de Cartas', [
        'Carta repetida vira pó da raridade dela; com o pó, eu forjo a carta que falta no seu álbum.',
      ], { talk: [[17, 3], ...area(15, 3, 4, 2), ...area(15, 6, 2, 1)], action: 'forja' }),
      seatedAt('troca-1', 'npc-desafiante-02', 1, 8, 'Lia', 'Trocando cartas', ['Tenho duas repetidas de Fogo. Troca por uma de Água?']),
      seatedAt('troca-2', 'npc-desafiante-10', 7, 12, 'Duda', 'Montando o deck', ['Deck de 20 cartas... escolher é a parte mais difícil!']),
    ],
    talks: [
      { tiles: area(15, 9, 2, 1), lines: ['O álbum aberto mostra quais cartas você já tem e quais faltam. (Em breve.)'] },
      { tiles: area(13, 15, 2, 1), lines: ['Mural de ofertas: "Troco Mítica por 3 Raras!" (ofertas dos colegas em breve).'] },
      // mesas de troca vazias: senta e espera um colega (vê a coleção dele e pede troca)
      { tiles: area(6, 8, 3, 2), lines: ['Mesa de trocas livre.'], action: 'sentar', seat: [7, 7] },
      { tiles: area(1, 12, 4, 2), lines: ['Mesa de trocas livre.'], action: 'sentar', seat: [2, 11] },
    ],
    spawn: { tx: 10, ty: 15, dir: 'north' },
    exits: [{ tx: 9, ty: 16, to: 'cidade' }, { tx: 10, ty: 16, to: 'cidade' }],
  };
}

/** Castelo das Guildas: salão medieval com o trono, as 4 mesas das guildas e o tapete vermelho. */
export function castleRoom(): Room {
  const items: Placed[] = [
    { id: 'lareira-pedra', tx: 1, ty: 3 }, { id: 'estandarte-azul', tx: 5, ty: 3 }, { id: 'estandarte-vermelho', tx: 7, ty: 3 },
    { id: 'trono-guilda', tx: 10, ty: 3 },
    { id: 'estandarte-verde', tx: 14, ty: 3 }, { id: 'estandarte-roxo', tx: 16, ty: 3 }, { id: 'ranking-guildas', tx: 18, ty: 3 },
    { id: 'mesa-guilda-azul', tx: 2, ty: 7 }, { id: 'mesa-guilda-vermelha', tx: 2, ty: 12 },
    { id: 'mesa-guilda-verde', tx: 17, ty: 7 }, { id: 'mesa-guilda-roxa', tx: 17, ty: 12 },
    { id: 'mesa-redonda-mapa', tx: 7, ty: 8 }, { id: 'mesa-banquete', tx: 14, ty: 9 },
    { id: 'armadura', tx: 0, ty: 16 }, { id: 'armadura', tx: 21, ty: 16 },
    { id: 'bau-pacotinhos', tx: 5, ty: 16 }, { id: 'barris', tx: 15, ty: 16 }, { id: 'vaso-flores', tx: 18, ty: 16 },
    { id: 'lustre-ferro', tx: 4, ty: 2 }, { id: 'quadro-missoes', tx: 14, ty: 2 },
  ];
  return {
    id: 'castelo', title: 'Castelo das Guildas', w: 22, h: 18, wallRows: 3,
    piso: 'piso-castelo-piso', parede: 'parede-castelo-parede', items,
    patches: [{ piso: 'piso-castelo-tapete', tx: 10, ty: 5, w: 2, h: 13 }],
    npcs: [
      npc('rei', 'npc-desafiante-07', 11, 5, 'Sir Téo', 'Mestre das Guildas', [
        'Bem-vindo ao Castelo! Cada guilda é uma equipe da turma.',
        'Juntos vocês cumprem a meta de presença da semana e enfrentam o chefe da guilda. (Em breve.)',
      ]),
      npc('guilda-azul', 'npc-desafiante-05', 5, 8, 'Caio', 'Guilda Azul', ['A Guilda Azul está a 2 presenças da meta da semana!']),
      npc('guilda-verde', 'npc-desafiante-08', 16, 8, 'Iris', 'Guilda Verde', ['Estamos juntando pacotinhos no baú da guilda.']),
    ],
    talks: [
      { tiles: area(18, 3, 3, 1), lines: ['Ranking das guildas da semana (em breve).'] },
      { tiles: area(7, 8, 3, 2), lines: ['Um mapa com as missões da guilda marcadas.'] },
      { tiles: area(5, 16, 3, 1), lines: ['O baú da guilda: as recompensas coletivas ficam guardadas aqui.'] },
    ],
    spawn: { tx: 10, ty: 16, dir: 'north' },
    exits: [{ tx: 10, ty: 17, to: 'cidade' }, { tx: 11, ty: 17, to: 'cidade' }],
  };
}

/** Salas por id (as dos prédios da cidade). */
export const ROOMS: Record<string, () => Room> = {
  arena: arenaRoom, treino: trainingRoom, loja: shopRoom, oficina: workshopRoom, castelo: castleRoom,
};
/** Qual porta da cidade leva a cada sala (ids de town.ts). */
export const ROOM_BUILDING: Record<string, string> = {
  arena: 'arena', treino: 'arena', loja: 'loja', oficina: 'centro', castelo: 'guildas',
};
