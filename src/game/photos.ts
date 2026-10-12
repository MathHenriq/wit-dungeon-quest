// Álbum de fotos do repórter: a câmera tira um retrato pequeno da tela (JPEG)
// e guarda as 8 mais novas no navegador (fora do progresso: imagem pesa).
// As fotos passam no telão da Cidade WIT e vão nas matérias do jornalzinho.

export interface Photo { id: string; data: string; zona: string; lugar: string; hora: number; t: number }

export const MAX_PHOTOS = 8;
export const PHOTO_W = 240;
const KEY = 'wit.fotos';

/** Põe a foto na frente e deixa as MAX_PHOTOS mais novas. */
export function addPhoto(list: Photo[], ph: Photo, max = MAX_PHOTOS): Photo[] {
  return [ph, ...list.filter(p => p.id !== ph.id)].slice(0, max);
}

export function sanitizePhotos(raw: unknown): Photo[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Photo => !!p && typeof p.id === 'string' && typeof p.data === 'string' && p.data.startsWith('data:image/'))
    .map(p => ({ id: p.id.slice(0, 20), data: p.data, zona: String(p.zona ?? '').slice(0, 20), lugar: String(p.lugar ?? '').slice(0, 40), hora: Number(p.hora) || 0, t: Number(p.t) || 0 }))
    .slice(0, MAX_PHOTOS);
}

export function loadPhotos(): Photo[] {
  try { return sanitizePhotos(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { return []; }
}

export function savePhotos(list: Photo[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('wit-fotos', { detail: list }));
    return true;
  } catch { return false; }
}

/** Tira a foto de um canvas: reduz para PHOTO_W de largura e grava em JPEG. */
export function snap(src: HTMLCanvasElement, meta: Omit<Photo, 'id' | 'data' | 't'>): Photo | null {
  const w = PHOTO_W, h = Math.round((src.height / src.width) * w);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(src, 0, 0, w, h);
  try {
    const t = Date.now();
    return { id: `f${t.toString(36)}`, data: c.toDataURL('image/jpeg', 0.72), t, ...meta };
  } catch { return null; }
}
