// Fases de fliperama feitas pelos alunos (Oficina de Games, mural da turma):
// uma grade pequena com chão, parede, moeda, espinho, início e saída. Para
// publicar, a fase precisa ter caminho do início até a saída e o próprio autor
// precisa vencer uma vez (como num editor de verdade). Regras puras.

export type Tile = '.' | '#' | 'o' | 'x' | 's' | 'e';
export interface Level { w: number; h: number; t: string }
export const TILES: { id: Tile; nome: string }[] = [
  { id: '.', nome: 'Chão' }, { id: '#', nome: 'Parede' }, { id: 'o', nome: 'Moeda' },
  { id: 'x', nome: 'Espinho' }, { id: 's', nome: 'Início' }, { id: 'e', nome: 'Saída' },
];
export const LEVEL_W = 12, LEVEL_H = 8;

/** Nomes prontos para a fase (sem texto livre). */
export const LEVEL_TITLES = [
  'Labirinto do Dragão', 'Caverna das Moedas', 'Corrida Espinhosa', 'Castelo Perdido', 'Jardim Secreto', 'Fuga da Torre',
  'Caminho do Herói', 'Desafio Impossível', 'Passeio Tranquilo', 'Ilha do Tesouro', 'Mina de Ouro', 'Templo Antigo',
  'Laboratório Maluco', 'Floresta Sombria', 'Ponte do Abismo', 'Cidade Neon',
];

export function emptyLevel(w = LEVEL_W, h = LEVEL_H): Level {
  const t = Array.from({ length: w * h }, (_, i) => {
    const x = i % w, y = Math.floor(i / w);
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return '#';
    if (x === 1 && y === 1) return 's';
    if (x === w - 2 && y === h - 2) return 'e';
    return '.';
  }).join('');
  return { w, h, t };
}

export const tileAt = (l: Level, x: number, y: number): Tile => (x < 0 || y < 0 || x >= l.w || y >= l.h ? '#' : l.t[y * l.w + x] as Tile);

/** Troca uma peça. Início e saída são únicos: pôr um novo apaga o anterior. */
export function setTile(l: Level, x: number, y: number, tile: Tile): Level {
  const a = l.t.split('');
  if (tile === 's' || tile === 'e') for (let i = 0; i < a.length; i++) if (a[i] === tile) a[i] = '.';
  a[y * l.w + x] = tile;
  return { ...l, t: a.join('') };
}

const find = (l: Level, tile: Tile) => { const i = l.t.indexOf(tile); return i < 0 ? null : { x: i % l.w, y: Math.floor(i / l.w) }; };

/** Mesmas regras do servidor (wit2_level_ok) e mais: tem caminho do início à saída sem pisar em espinho. */
export function checkLevel(l: Level): string | null {
  if (!Number.isInteger(l.w) || !Number.isInteger(l.h) || l.w < 6 || l.w > 16 || l.h < 5 || l.h > 10) return 'Tamanho inválido.';
  if (l.t.length !== l.w * l.h || !/^[.#oxse]+$/.test(l.t)) return 'Fase com peça desconhecida.';
  if (l.t.split('s').length !== 2) return 'Ponha 1 início.';
  if (l.t.split('e').length !== 2) return 'Ponha 1 saída.';
  const s = find(l, 's')!, e = find(l, 'e')!;
  const seen = new Set([`${s.x},${s.y}`]);
  const q = [s];
  while (q.length) {
    const c = q.pop()!;
    if (c.x === e.x && c.y === e.y) return null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, ny = c.y + dy, k = `${nx},${ny}`, t = tileAt(l, nx, ny);
      if (t === '#' || t === 'x' || seen.has(k)) continue;
      seen.add(k); q.push({ x: nx, y: ny });
    }
  }
  return 'Não tem caminho do início até a saída.';
}

export interface Play { x: number; y: number; coins: number; got: string; deaths: number; won: boolean }
export function startPlay(l: Level): Play { const s = find(l, 's') ?? { x: 1, y: 1 }; return { ...s, coins: 0, got: '', deaths: 0, won: false }; }
export const totalCoins = (l: Level) => l.t.split('o').length - 1;

/** Um passo: parede trava; espinho volta para o início (perde as moedas); saída vence. */
export function step(l: Level, p: Play, dx: number, dy: number): Play {
  if (p.won) return p;
  const nx = p.x + dx, ny = p.y + dy, t = tileAt(l, nx, ny);
  if (t === '#') return p;
  if (t === 'x') return { ...startPlay(l), deaths: p.deaths + 1 };
  const k = `${nx},${ny};`;
  let { coins, got } = p;
  if (t === 'o' && !got.includes(k)) { coins++; got += k; }
  return { ...p, x: nx, y: ny, coins, got, won: t === 'e' };
}
