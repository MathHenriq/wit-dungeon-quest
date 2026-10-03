// Atlas dos móveis, pisos e paredes dos interiores (public/game/interior):
// carrega o manifest e a folha uma vez e recorta cada sprite num canvas.
// Usado pelos interiores e pelos cenários dos minijogos.
import type { Manifest } from '@/game/interior/room';
import { loadImage } from '@/game/world/sprites';

const BASE = () => `${import.meta.env.BASE_URL}game/interior`;

let manifestP: Promise<Manifest> | null = null;
export function loadInteriorManifest(): Promise<Manifest> {
  if (!manifestP) {
    manifestP = fetch(`${BASE()}/manifest.json`).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    manifestP.catch(() => { manifestP = null; });
  }
  return manifestP;
}

/** Todos os sprites dos interiores numa folha só (public/game/interior/atlas.png). */
let atlasP: Promise<HTMLImageElement> | null = null;
export function loadAtlas(): Promise<HTMLImageElement> {
  if (!atlasP) { atlasP = loadImage(`${BASE()}/atlas.png`); atlasP.catch(() => { atlasP = null; }); }
  return atlasP;
}
const cuts = new Map<string, HTMLCanvasElement>();
/** Recorte do atlas (um canvas por sprite, guardado). */
export function cut(m: Manifest, atlas: HTMLImageElement, id: string): HTMLCanvasElement | null {
  let c = cuts.get(id);
  if (c) return c;
  const a = m[id]?.a;
  if (!a) return null;
  c = document.createElement('canvas');
  c.width = a[2]; c.height = a[3];
  c.getContext('2d')!.drawImage(atlas, a[0], a[1], a[2], a[3], 0, 0, a[2], a[3]);
  cuts.set(id, c);
  return c;
}
export async function sprite(m: Manifest, id: string): Promise<HTMLCanvasElement> {
  const c = cut(m, await loadAtlas(), id);
  if (!c) throw new Error(`sprite ${id}`);
  return c;
}
