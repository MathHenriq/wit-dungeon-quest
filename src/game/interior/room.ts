// Interiores: uma sala em grade (1 bloco = 16 px do mundo), com parede em
// cima, piso, móveis, tapetes, coisas penduradas na parede e personagens.
// Funções puras (testáveis sem navegador); o desenho fica em InteriorView.
//
// Os móveis vêm de public/game/interior/manifest.json (gerado por
// scripts/arte/importar-interiores.py): tamanho, camada, nome e pegada.
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
}

export type ExitKind = 'cidade' | 'subir';
export interface Exit { tx: number; ty: number; to: ExitKind }

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
    name: andar % 10 === 0 ? 'Campeão' : 'Mestre', title: `Chefe do Andar ${andar}`,
    lines: [`Andar ${andar}. Vença as 8 mesas e depois venha até mim.`, 'Quem me vence ganha uma carta do meu deck. (Os duelos chegam em breve.)'],
    talk: [[10, 4], [8, 5], [9, 5], [10, 5], [11, 5], [8, 6], [9, 6], [10, 6], [11, 6]],
    seated: true,
  });
  items.push({ id: 'escada', tx: 1, ty: 3 });
  items.push({ id: 'gongo', tx: 16, ty: 3 });
  items.push({ id: 'quadro-chaves', tx: 12, ty: WALL - 1 });
  items.push({ id: 'placa-andar', tx: 7, ty: 16 });
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
        lines: [FALAS[(andar + k) % FALAS.length], 'Sente-se! (Os duelos de cartas chegam em breve.)'],
        talk: [[tx + 1, ty - 1], [tx, ty], [tx + 1, ty], [tx + 2, ty], [tx, ty + 1], [tx + 1, ty + 1], [tx + 2, ty + 1]],
        seated: true,
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
