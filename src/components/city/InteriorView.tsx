import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  canPlace, catalogOf, footprint, HOUSE_CATS, HOUSE_FLOORS, HOUSE_START, HOUSE_WALLS, houseRoom, layerOf, nextFacing,
  sanitizeHouse, solidGrid, spriteOf, spriteRect, TILE, towerRoom, type Manifest, type Placed, type Room, type RoomNpc,
} from '@/game/interior/room';
import { ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker } from '@/game/world/movement';
import { CLOTH, MOLDE, type Look } from '@/game/world/outfit';
import { PLATE_NPC, PLATE_PLAYER } from '@/game/world/nameplate';
import {
  loadImage, loadLookFrames, loadNpcFrames, loadPetFrames, plateCanvas, R, type Frames,
} from '@/game/world/sprites';

/**
 * Interior de um prédio (Torre, Sua Casa): anda, conversa, sobe de andar e,
 * na casa, decora (pôr, mover, girar e pintar móveis). Aparece por cima da
 * cidade; `onExit` volta para ela.
 */

export type Sala = { kind: 'torre'; andar: number } | { kind: 'casa' };

const WALK_MS = 230, RUN_MS = 125;
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'north', ArrowDown: 'south', ArrowLeft: 'west', ArrowRight: 'east',
  w: 'north', s: 'south', a: 'west', d: 'east', W: 'north', S: 'south', A: 'west', D: 'east',
};
const BASE = () => `${import.meta.env.BASE_URL}game/interior`;
const HOUSE_KEY = 'wit.casa';
const pixelFont = "font-['Press_Start_2P',monospace]";

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
function loadAtlas(): Promise<HTMLImageElement> {
  if (!atlasP) { atlasP = loadImage(`${BASE()}/atlas.png`); atlasP.catch(() => { atlasP = null; }); }
  return atlasP;
}
const cuts = new Map<string, HTMLCanvasElement>();
/** Recorte do atlas (um canvas por sprite, guardado). */
function cut(m: Manifest, atlas: HTMLImageElement, id: string): HTMLCanvasElement | null {
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
async function sprite(m: Manifest, id: string): Promise<HTMLCanvasElement> {
  const c = cut(m, await loadAtlas(), id);
  if (!c) throw new Error(`sprite ${id}`);
  return c;
}

/** Miniatura de um sprite (catálogo do modo DECORAR). */
function Thumb({ m, id, fill }: { m: Manifest; id: string; fill?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    sprite(m, id).then(src => {
      const c = ref.current;
      if (!alive || !c) return;
      c.width = src.width; c.height = src.height;
      c.getContext('2d')!.drawImage(src, 0, 0);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [m, id]);
  return <canvas ref={ref} className={fill ? 'w-full h-full object-cover' : 'max-w-full max-h-[52px] object-contain'} style={{ imageRendering: 'pixelated' }} />;
}

/** Móvel de tecido na cor escolhida (tons-molde → rampa), guardado por combinação. */
const painted = new Map<string, HTMLCanvasElement>();
function paint(img: HTMLCanvasElement, key: string, cor?: string, cor2?: string): HTMLCanvasElement {
  if (!cor && !cor2) return img;
  const k = `${key}|${cor}|${cor2}`;
  let c = painted.get(k);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height);
  const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const map = new Map<number, number[]>();
  const add = (from: readonly string[], to?: readonly string[]) => to && from.forEach((f, i) => { const [r, g, b] = rgb(f); map.set((r << 16) | (g << 8) | b, rgb(to[i])); });
  add(MOLDE.hair, cor ? CLOTH[cor] : undefined);
  add(MOLDE.top, cor2 ? CLOTH[cor2] : undefined);
  for (let i = 0; i < d.data.length; i += 4) {
    if (!d.data[i + 3]) continue;
    const to = map.get((d.data[i] << 16) | (d.data[i + 1] << 8) | d.data[i + 2]);
    if (to) { d.data[i] = to[0]; d.data[i + 1] = to[1]; d.data[i + 2] = to[2]; }
  }
  x.putImageData(d, 0, 0);
  painted.set(k, c);
  return c;
}

function savedHouse(m: Manifest): { items: Placed[]; piso: string; parede: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(HOUSE_KEY) ?? 'null');
    const items = sanitizeHouse(m, raw?.items);
    if (items) {
      return {
        items,
        piso: HOUSE_FLOORS.includes(raw.piso) ? raw.piso : HOUSE_FLOORS[0],
        parede: HOUSE_WALLS.includes(raw.parede) ? raw.parede : HOUSE_WALLS[0],
      };
    }
  } catch { /* sem armazenamento */ }
  return { items: HOUSE_START, piso: HOUSE_FLOORS[0], parede: HOUSE_WALLS[0] };
}

function buildRoom(m: Manifest, sala: Sala): Room {
  if (sala.kind === 'torre') return towerRoom(sala.andar);
  const h = savedHouse(m);
  return { ...houseRoom(h.items), piso: h.piso, parede: h.parede };
}

export function InteriorView({ sala, look, pet, onExit }: { sala: Sala; look: Look; pet: string; onExit: () => void }) {
  const [m, setM] = useState<Manifest | null>(null);
  useEffect(() => {
    let alive = true;
    loadInteriorManifest().then(x => { if (alive) setM(x); }).catch(err => console.error('interior', err));
    return () => { alive = false; };
  }, []);
  if (!m) return <div className={`absolute inset-0 bg-[#1a1420] flex items-center justify-center text-white/80 text-xs ${pixelFont}`}>entrando...</div>;
  return <Inside m={m} sala={sala} look={look} pet={pet} onExit={onExit} />;
}

interface Npc { def: RoomNpc; w: Walker; frames: Frames | null }
type Holding = { p: Placed; from: Placed | null };

function Inside({ m, sala: sala0, look, pet, onExit }: { m: Manifest; sala: Sala; look: Look; pet: string; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sala, setSala] = useState(sala0);
  const [room, setRoom] = useState<Room>(() => buildRoom(m, sala0));
  const [dialog, setDialog] = useState<{ lines: string[]; i: number } | null>(null);
  const [view, setView] = useState({ w: 320, h: 208, scale: 4 });
  const [decor, setDecor] = useState(false);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [cat, setCat] = useState(HOUSE_CATS[0].id);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  const solid = useMemo(() => solidGrid(m, room), [m, room]);
  const g = useRef({
    player: newWalker(room.spawn.tx, room.spawn.ty, room.spawn.dir),
    pet: newWalker(room.spawn.tx, Math.min(room.h - 1, room.spawn.ty + 1), 'north'),
    npcs: [] as Npc[],
    held: [] as Dir[],
    path: [] as Dir[],
    run: false,
    playerFrames: null as Frames | null,
    petFrames: null as Frames | null,
    imgs: new Map<string, HTMLCanvasElement>(),
    scene: null as HTMLCanvasElement | null,
    hover: null as { tx: number; ty: number } | null,
    modal: false,
    leaving: false,
  });
  const S = g.current;
  S.modal = !!dialog || decor;

  // personagens
  useEffect(() => {
    let alive = true;
    Promise.all([loadLookFrames(look), loadPetFrames(pet).catch(() => null)]).then(([pf, pt]) => {
      if (!alive) return;
      S.playerFrames = pf; S.petFrames = pt;
    }).catch(err => console.error('interior: boneco', err));
    return () => { alive = false; };
  }, [look, pet, S]);

  // sala nova: NPCs, sprites e cena de fundo
  useEffect(() => {
    let alive = true;
    S.npcs = room.npcs.map(def => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null }));
    const sprites = new Set<string>([room.piso, room.parede, ...room.items.map(p => spriteOf(m, p).id)]);
    Promise.all([...sprites].map(id => sprite(m, id).then(img => [id, img] as const).catch(() => null))).then(list => {
      if (!alive) return;
      for (const x of list) if (x) S.imgs.set(x[0], x[1]);
      S.scene = buildScene(m, room, S.imgs);
    });
    S.npcs.forEach(n => {
      loadNpcFrames(n.def.sprite).then(f => { n.frames = f; }).catch(err => console.error('npc', n.def.sprite, err));
    });
    return () => { alive = false; };
  }, [m, room, S]);

  // casa: guarda cada mudança
  useEffect(() => {
    if (room.id !== 'casa') return;
    try { localStorage.setItem(HOUSE_KEY, JSON.stringify({ items: room.items, piso: room.piso, parede: room.parede })); } catch { /* sem armazenamento */ }
  }, [room]);

  // tela → escala inteira; decorando, a sala inteira tem de caber acima do painel
  // (ali a escala pode ser meia: 1 pixel hd = 1 pixel da tela)
  useEffect(() => {
    const fit = () => {
      let k = Math.max(1, Math.floor(Math.min(window.innerWidth / 400, window.innerHeight / 270)));
      if (decor) {
        const fitK = Math.min(window.innerWidth / ((room.w + 1) * TILE), (window.innerHeight * 0.6) / ((room.h + 1) * TILE)) / R;
        k = fitK >= 1 ? Math.min(k, Math.floor(fitK)) : 0.5;
      }
      const scale = R * k;
      setView({ w: Math.ceil(window.innerWidth / scale), h: Math.ceil(window.innerHeight / scale), scale });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [decor, room.w, room.h]);

  const blocked = useCallback((tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || tx >= room.w || ty >= room.h) return !room.exits.some(e => e.tx === tx && e.ty === ty && e.to === 'cidade');
    return solid[ty][tx];
  }, [room, solid]);

  const goUp = useCallback(() => {
    if (sala.kind !== 'torre') return;
    const andar = Math.min(100, sala.andar + 1);
    if (andar === sala.andar) { setDialog({ lines: ['Este é o topo da Torre: o andar 100!'], i: 0 }); return; }
    const next = { kind: 'torre' as const, andar };
    const r = towerRoom(andar);
    S.player = newWalker(r.spawn.tx, r.spawn.ty, 'north');
    S.pet = newWalker(r.spawn.tx, r.spawn.ty, 'north');
    S.held = []; S.path = [];
    setSala(next);
    setRoom(r);
  }, [sala, S]);

  const interact = useCallback(() => {
    if (dialog) {
      if (dialog.i + 1 < dialog.lines.length) setDialog({ ...dialog, i: dialog.i + 1 });
      else setDialog(null);
      return;
    }
    if (S.modal) return;
    const f = ahead(S.player);
    const npc = S.npcs.find(n => n.def.talk.some(([x, y]) => x === f.tx && y === f.ty));
    if (npc) {
      const back: Record<Dir, Dir> = { north: 'south', south: 'north', west: 'east', east: 'west' };
      if (Math.abs(npc.w.tx - S.player.tx) + Math.abs(npc.w.ty - S.player.ty) === 1) npc.w.dir = back[S.player.dir];
      setDialog({ lines: [`${npc.def.name}: ${npc.def.lines[0]}`, ...npc.def.lines.slice(1)], i: 0 });
      return;
    }
    if (room.exits.some(e => e.to === 'subir' && e.tx === f.tx && e.ty === f.ty)) goUp();
  }, [dialog, room, S, goUp]);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const d = KEY_DIR[e.key];
      if (d && !decor) {
        e.preventDefault();
        if (!S.held.includes(d)) S.held.unshift(d);
        S.path = [];
      }
      if (e.key === 'Shift') S.run = true;
      if (!decor && (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z')) { e.preventDefault(); interact(); }
      if (decor && (e.key === 'r' || e.key === 'R') && holding) {
        setHolding({ ...holding, p: { ...holding.p, facing: nextFacing(m, holding.p) } });
      }
      if (e.key === 'Escape') {
        if (holding) cancelHold(); else if (decor) setDecor(false); else setDialog(null);
      }
    };
    const up = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (d) S.held = S.held.filter(x => x !== d);
      if (e.key === 'Shift') S.run = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });

  // laço
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    let last = performance.now(), raf = 0;
    const petQueue: { tx: number; ty: number }[] = [];
    const loop = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      const p = S.player, pt = S.pet;
      const ms = S.run ? RUN_MS : WALK_MS;
      tick(p, dt, {
        msPerTile: ms, blocked, fromPath: !S.held.length,
        want: () => (S.modal || S.leaving ? null : S.held[0] ?? S.path[0] ?? null),
        onStep: from => { petQueue.push(from); if (!S.held.length) S.path.shift(); },
        onArrive: () => {
          if (room.exits.some(e => e.to === 'cidade' && e.tx === p.tx && e.ty === p.ty) && !S.leaving) {
            S.leaving = true; S.held = []; S.path = [];
            onExit();
          }
        },
      });
      // esbarrou na escada: sobe
      if (!p.from && S.held[0] === 'north' && !S.modal) {
        const f = ahead(p);
        if (room.exits.some(e => e.to === 'subir' && e.tx === f.tx && e.ty === f.ty)) { S.held = []; goUp(); }
      }
      tick(pt, dt, {
        msPerTile: ms, blocked: () => false, fromPath: true,
        want: () => {
          const tgt = petQueue[0];
          if (!tgt) return null;
          const dx = tgt.tx - pt.tx, dy = tgt.ty - pt.ty;
          if (Math.abs(dx) + Math.abs(dy) !== 1) { pt.tx = tgt.tx; pt.ty = tgt.ty; petQueue.shift(); return null; }
          return dx > 0 ? 'east' : dx < 0 ? 'west' : dy > 0 ? 'south' : 'north';
        },
        onStep: () => { petQueue.shift(); },
      });

      // ── desenho ──
      const vw = cv.width / R, vh = cv.height / R;
      const W = room.w * TILE, H = room.h * TILE;
      const pp = pixelPos(p, TILE);
      let camX = Math.round(pp.x + 8 - vw / 2), camY = Math.round(pp.y + 8 - vh / 2);
      // decorando: a sala inteira parada, centrada
      if (S.modal && decor) { camX = Math.round((W - vw) / 2); camY = Math.round((H - vh * 0.6) / 2); }
      else {
        camX = W + 32 <= vw ? Math.round((W - vw) / 2) : Math.max(-16, Math.min(W + 16 - vw, camX));
        camY = H + 32 <= vh ? Math.round((H - vh) / 2) : Math.max(-16, Math.min(H + 16 - vh, camY));
      }
      ctx.setTransform(R, 0, 0, R, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#17121c';
      ctx.fillRect(0, 0, vw, vh);
      if (S.scene) ctx.drawImage(S.scene, -camX - 8, -camY - 8, S.scene.width / R, S.scene.height / R);

      type D = { baseY: number; draw: () => void };
      const list: D[] = [];
      const drawItem = (q: Placed, alpha = 1) => {
        const s = spriteOf(m, q), img = S.imgs.get(s.id);
        if (!img) { sprite(m, s.id).then(i => S.imgs.set(s.id, i)).catch(() => undefined); return; }
        const r = spriteRect(m, room, q);
        const src = m[q.id]?.tecido ? paint(img, s.id, q.cor, q.cor2) : img;
        ctx.globalAlpha = alpha;
        if (s.flip) {
          ctx.save();
          ctx.translate(r.x - camX + r.w, r.y - camY);
          ctx.scale(-1, 1);
          ctx.drawImage(src, 0, 0, r.w, r.h);
          ctx.restore();
        } else ctx.drawImage(src, r.x - camX, r.y - camY, r.w, r.h);
        ctx.globalAlpha = 1;
      };
      for (const q of room.items) {
        if (layerOf(m, q.id) !== 'm') continue;
        list.push({ baseY: spriteRect(m, room, q).baseY, draw: () => drawItem(q) });
      }
      const person = (w: Walker, fr: Frames | null, clipY: number | null = null) => {
        const seated = clipY !== null;
        if (!fr) return;
        const pos = pixelPos(w, TILE);
        const n = fr.walk[w.dir].length;
        const frameMs = (w === p && S.run ? RUN_MS : WALK_MS) / (n / 2);
        const img = fr.walk[w.dir][w.anim > 0 ? Math.floor(w.anim / frameMs) % n : 0];
        // sentado: um pouco mais baixo (na cadeira) e por cima da mesa que está na frente
        const sit = seated ? 3 : 0;
        const x = Math.round(pos.x + 8 - fr.w / 2) - camX, y = Math.round(pos.y + 15 - fr.foot[w.dir]) - camY + sit;
        list.push({
          baseY: pos.y + 16 - 0.5 + (seated ? 2 * TILE + 1 : 0),
          draw: () => {
            if (!seated) {
              ctx.fillStyle = 'rgba(20,14,20,0.3)';
              ctx.beginPath(); ctx.ellipse(x + fr.w / 2, y + fr.foot[w.dir], Math.min(7, fr.w / 3), 2.5, 0, 0, Math.PI * 2); ctx.fill();
            }
            if (seated) {
              // só do tampo da mesa para cima (as pernas ficam atrás dela)
              ctx.save();
              ctx.beginPath(); ctx.rect(x - 4, y - 8, fr.w + 8, clipY! - camY - (y - 8)); ctx.clip();
              ctx.drawImage(img, x, y, img.width / R, img.height / R);
              ctx.restore();
            } else ctx.drawImage(img, x, y, img.width / R, img.height / R);
          },
        });
      };
      if (!decor) { person(pt, S.petFrames); person(p, S.playerFrames); }
      for (const n of S.npcs) {
        let clip: number | null = null;
        if (n.def.seated && n.w.tx === n.def.tx && n.w.ty === n.def.ty) {
          // a mesa logo abaixo dele: corta no começo do tampo
          const mesa = room.items.find(q => {
            if (layerOf(m, q.id) !== 'm') return false;
            const [fw, fd] = footprint(m, q);
            return n.def.tx >= q.tx && n.def.tx < q.tx + fw && n.def.ty + 1 >= q.ty && n.def.ty + 1 < q.ty + fd;
          });
          if (mesa) clip = mesa.ty * TILE - 8;
        }
        person(n.w, n.frames, clip);
      }
      list.sort((a, b) => a.baseY - b.baseY);
      for (const d of list) d.draw();

      // decorando: o móvel na mão segue o cursor, verde se cabe e vermelho se não
      if (decor && holding && S.hover) {
        const q = { ...holding.p, tx: S.hover.tx, ty: layerOf(m, holding.p.id) === 'p' ? room.wallRows - 1 : S.hover.ty };
        const [fw, fd] = footprint(m, q);
        const ok = canPlace(m, room, q);
        ctx.fillStyle = ok ? 'rgba(120,230,90,0.35)' : 'rgba(240,70,70,0.4)';
        const fy = layerOf(m, q.id) === 'p' ? 0 : q.ty * TILE;
        ctx.fillRect(q.tx * TILE - camX, fy - camY, fw * TILE, (layerOf(m, q.id) === 'p' ? room.wallRows : fd) * TILE);
        drawItem(q, 0.85);
      }

      // plaquinhas
      if (!decor) {
        const plate = (w: Walker, c: HTMLCanvasElement, dy = 0) => {
          const pos = pixelPos(w, TILE);
          const pw = c.width / R, ph = c.height / R;
          ctx.drawImage(c, Math.round(pos.x + 8 - pw / 2 - camX), Math.round(pos.y - 13 - ph - camY + dy), pw, ph);
        };
        for (const n of S.npcs) {
          if (Math.abs(n.w.tx - p.tx) + Math.abs(n.w.ty - p.ty) <= 3) plate(n.w, plateCanvas(n.def.name, n.def.title, PLATE_NPC));
        }
        plate(p, plateCanvas(look.apelido || 'Você', 'Novato', PLATE_PLAYER));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [m, room, blocked, view, decor, holding, look, S, onExit, goUp]);

  // ── toque / clique ──
  const toTile = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const vw = cv.width / R, vh = cv.height / R;
    const vx = ((e.clientX - rect.left) / rect.width) * vw, vy = ((e.clientY - rect.top) / rect.height) * vh;
    const W = room.w * TILE, H = room.h * TILE;
    let camX: number, camY: number;
    if (decor) { camX = Math.round((W - vw) / 2); camY = Math.round((H - vh * 0.6) / 2); } else {
      const pp = pixelPos(S.player, TILE);
      camX = W + 32 <= vw ? Math.round((W - vw) / 2) : Math.max(-16, Math.min(W + 16 - vw, Math.round(pp.x + 8 - vw / 2)));
      camY = H + 32 <= vh ? Math.round((H - vh) / 2) : Math.max(-16, Math.min(H + 16 - vh, Math.round(pp.y + 8 - vh / 2)));
    }
    return { x: vx + camX, y: vy + camY, tx: Math.floor((vx + camX) / TILE), ty: Math.floor((vy + camY) / TILE) };
  };

  const placeAt = (tx: number, ty: number) => {
    if (!holding) return;
    // mira pelo meio da pegada, não pelo canto
    const [fw, fd] = footprint(m, holding.p);
    const layer = layerOf(m, holding.p.id);
    return { ...holding.p, tx: tx - Math.floor((fw - 1) / 2), ty: layer === 'p' ? room.wallRows - 1 : ty - (fd - 1) };
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!decor || !holding) return;
    const t = toTile(e);
    const q = placeAt(t.tx, t.ty)!;
    S.hover = { tx: q.tx, ty: q.ty };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const t = toTile(e);
    if (decor) {
      if (holding) {
        const q = placeAt(t.tx, t.ty)!;
        S.hover = { tx: q.tx, ty: q.ty };
        if (canPlace(m, room, q)) {
          setRoom({ ...room, items: [...room.items, q] });
          setHolding(null);
        }
        return;
      }
      // pega o que foi tocado (o da frente primeiro: móvel, depois parede, depois tapete)
      const order = room.items.map((q, i) => ({ q, i, r: spriteRect(m, room, q) }))
        .filter(({ r }) => t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h)
        .sort((a, b) => {
          const la = layerOf(m, a.q.id), lb = layerOf(m, b.q.id);
          const rank = (l: string) => (l === 'm' ? 0 : l === 'p' ? 1 : 2);
          return rank(la) - rank(lb) || b.r.baseY - a.r.baseY;
        });
      const hit = order[0];
      if (hit) {
        setRoom({ ...room, items: room.items.filter((_, i) => i !== hit.i) });
        setHolding({ p: hit.q, from: hit.q });
        S.hover = { tx: hit.q.tx, ty: hit.q.ty };
      }
      return;
    }
    if (S.modal) { interact(); return; }
    const target = blocked(t.tx, t.ty)
      ? [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ tx: t.tx + dx, ty: t.ty + dy })).find(q => !blocked(q.tx, q.ty))
      : { tx: t.tx, ty: t.ty };
    if (target) S.path = findPath(S.player.tx, S.player.ty, target.tx, target.ty, blocked);
  };

  function cancelHold() {
    if (holding?.from) setRoom(r => ({ ...r, items: [...r.items, holding.from!] }));
    setHolding(null);
  }

  const pick = (id: string) => {
    if (holding?.from) cancelHold();
    const p: Placed = { id, tx: 0, ty: room.wallRows };
    if (m[id].tecido) { p.cor = 'verde'; p.cor2 = 'amarelo'; }
    setHolding({ p, from: null });
    S.hover = { tx: Math.floor(room.w / 2) - 1, ty: layerOf(m, id) === 'p' ? room.wallRows - 1 : Math.floor(room.h / 2) };
  };

  const hold = (d: Dir | null) => { S.held = d ? [d] : []; S.path = []; };
  const title = sala.kind === 'torre' ? `TORRE · ANDAR ${sala.andar}` : 'SUA CASA';
  const items = decor ? catalogOf(m, cat) : [];

  return (
    <div className="absolute inset-0 bg-[#17121c] overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        width={view.w * R}
        height={view.h * R}
        onPointerDown={onDown}
        onPointerMove={onMove}
        style={{ width: view.w * view.scale, height: view.h * view.scale, imageRendering: 'pixelated' }}
        className="block"
        aria-label={title}
      />
      <div className={`absolute top-2 left-2 px-3 py-2 rounded-md bg-black/55 text-white text-[10px] leading-4 ${pixelFont}`}>
        {title}
        {!touch && !decor && <div className="text-white/70 mt-1">ESPAÇO falar · porta embaixo: sair{sala.kind === 'torre' ? ' · escada: subir' : ''}</div>}
        {decor && <div className="text-lime-300 mt-1">{holding ? 'toque para pôr · R gira · ESC devolve' : 'escolha um móvel ou toque num para mover'}</div>}
      </div>

      {room.id === 'casa' && (
        <button
          onClick={() => { if (decor) { cancelHold(); setDecor(false); } else { setDialog(null); setDecor(true); } }}
          className={`absolute top-2 right-2 px-3 py-2 rounded-md bg-[#2f6b1e]/90 border-2 border-[#8cc63f] text-white text-[10px] ${pixelFont}`}
        >{decor ? 'PRONTO' : 'DECORAR'}</button>
      )}

      {dialog && (
        <div onPointerDown={interact} className={`absolute left-1/2 -translate-x-1/2 bottom-4 w-[min(92vw,640px)] rounded-xl border-4 border-[#4a4660] bg-white px-5 py-4 text-[#2e2a40] text-[12px] leading-6 shadow-lg ${pixelFont}`}>
          {dialog.lines[dialog.i]}
          <span className="float-right animate-pulse">▼</span>
        </div>
      )}

      {decor && (
        <div className={`absolute left-0 right-0 bottom-0 h-[40%] bg-[#f4efe4] border-t-4 border-[#5a4630] flex flex-col ${pixelFont}`}>
          <div className="flex gap-1 overflow-x-auto px-2 pt-2 pb-1 shrink-0">
            {[...HOUSE_CATS, { id: 'piso', nome: 'Piso' }, { id: 'parede-fundo', nome: 'Papel de parede' }].map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`shrink-0 px-2 py-1.5 rounded text-[9px] border-2 ${cat === c.id ? 'bg-[#5a4630] text-white border-[#5a4630]' : 'bg-white text-[#5a4630] border-[#5a4630]/40'}`}>{c.nome}</button>
            ))}
          </div>
          {holding && (
            <div className="flex flex-wrap items-center gap-2 px-2 py-1 border-b-2 border-[#5a4630]/20 text-[9px] text-[#5a4630] shrink-0">
              <span className="truncate max-w-[40vw]">{m[holding.p.id]?.nome}</span>
              <button onClick={() => setHolding({ ...holding, p: { ...holding.p, facing: nextFacing(m, holding.p) } })}
                className="px-2 py-1 rounded bg-[#2f6b1e] text-white">GIRAR</button>
              <button onClick={() => { setHolding(null); }} className="px-2 py-1 rounded bg-[#b03a3a] text-white">GUARDAR</button>
              {m[holding.p.id]?.tecido && (['cor', 'cor2'] as const).map(k => (
                <span key={k} className="flex items-center gap-1">
                  {k === 'cor' ? 'cor' : 'detalhe'}
                  {Object.entries(CLOTH).map(([id, r]) => (
                    <button key={id} aria-label={`${k} ${id}`} onClick={() => setHolding({ ...holding, p: { ...holding.p, [k]: id } })}
                      className={`w-5 h-5 rounded border-2 ${holding.p[k] === id ? 'border-black' : 'border-black/20'}`}
                      style={{ background: `linear-gradient(135deg, ${r[3]} 0 30%, ${r[2]} 30% 70%, ${r[1]} 70%)` }} />
                  ))}
                </span>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))' }}>
            {cat === 'piso' || cat === 'parede-fundo'
              ? (cat === 'piso' ? HOUSE_FLOORS : HOUSE_WALLS).map(id => (
                <button key={id} onClick={() => setRoom({ ...room, [cat === 'piso' ? 'piso' : 'parede']: id })}
                  className={`h-[76px] rounded border-2 bg-white overflow-hidden ${room.piso === id || room.parede === id ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}>
                  <Thumb m={m} id={id} fill />
                </button>
              ))
              : items.map(id => (
                <button key={id} onClick={() => pick(id)} title={m[id].nome}
                  className={`h-[76px] rounded border-2 bg-white flex flex-col items-center justify-end p-1 ${holding?.p.id === id ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'}`}>
                  <Thumb m={m} id={id} />
                  <span className="text-[7px] leading-3 text-[#5a4630] truncate w-full text-center">{m[id].nome}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {touch && !decor && (
        <>
          <div className="absolute left-4 bottom-6 grid grid-cols-3 gap-1 opacity-80">
            {([[null, 'north', null], ['west', null, 'east'], [null, 'south', null]] as (Dir | null)[][]).flat().map((d, i) => d ? (
              <button key={i} aria-label={d} className="w-14 h-14 rounded-lg bg-black/45 border-2 border-white/40 text-white text-xl"
                onPointerDown={e => { e.preventDefault(); hold(d); }} onPointerUp={() => hold(null)} onPointerLeave={() => hold(null)}
              >{{ north: '▲', south: '▼', west: '◀', east: '▶' }[d]}</button>
            ) : <div key={i} />)}
          </div>
          <button aria-label="falar" className={`absolute right-6 bottom-10 w-16 h-16 rounded-full bg-[#e8485a] border-4 border-white/60 text-white text-sm ${pixelFont}`}
            onPointerDown={e => { e.preventDefault(); interact(); }}>A</button>
        </>
      )}
    </div>
  );
}

/**
 * Fundo pronto da sala (em hd, com 8 px de moldura escura em volta): piso,
 * parede, rodapé, tapetes, coisas da parede e a porta de saída.
 */
function buildScene(m: Manifest, room: Room, imgs: Map<string, HTMLCanvasElement>): HTMLCanvasElement {
  const P = 8;
  const W = room.w * TILE, H = room.h * TILE;
  const c = document.createElement('canvas');
  c.width = (W + P * 2) * R; c.height = (H + P * 2) * R;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.setTransform(R, 0, 0, R, P * R, P * R);
  // moldura (as paredes de lado e de baixo, vistas de cima)
  x.fillStyle = '#2b2230';
  x.fillRect(-P, -P, W + 2 * P, H + 2 * P);
  x.fillStyle = '#3d3144';
  x.fillRect(-P + 2, -P + 2, W + 2 * P - 4, H + 2 * P - 4);
  // piso repetido
  const piso = imgs.get(room.piso);
  const wallH = room.wallRows * TILE;
  if (piso) {
    const tw = m[room.piso]?.w ?? 64, th = m[room.piso]?.h ?? 64;
    x.save();
    x.beginPath(); x.rect(0, wallH, W, H - wallH); x.clip();
    for (let yy = wallH; yy < H; yy += th) for (let xx = 0; xx < W; xx += tw) x.drawImage(piso, xx, yy, tw, th);
    x.restore();
  } else { x.fillStyle = '#8a6a44'; x.fillRect(0, wallH, W, H - wallH); }
  // parede repetida
  const par = imgs.get(room.parede);
  if (par) {
    const pw = m[room.parede]?.w ?? 144;
    x.save();
    x.beginPath(); x.rect(0, 0, W, wallH); x.clip();
    for (let xx = 0; xx < W; xx += pw) x.drawImage(par, xx, 0, pw, wallH);
    x.restore();
  }
  // sombra da parede no piso
  const grad = x.createLinearGradient(0, wallH, 0, wallH + 10);
  grad.addColorStop(0, 'rgba(20,10,20,0.35)'); grad.addColorStop(1, 'rgba(20,10,20,0)');
  x.fillStyle = grad; x.fillRect(0, wallH, W, 10);
  // porta(s) para a cidade: abertura na moldura de baixo, com luz de fora
  for (const e of room.exits) {
    if (e.to !== 'cidade') continue;
    x.fillStyle = '#1b140f';
    x.fillRect(e.tx * TILE, H - 3, TILE, P + 3);
    x.fillStyle = 'rgba(255,236,170,0.35)';
    x.fillRect(e.tx * TILE + 2, H - 1, TILE - 4, P + 1);
  }
  // tapetes e coisas da parede (não mudam de lugar enquanto se anda)
  const flat = room.items.filter(p => layerOf(m, p.id) !== 'm')
    .sort((a, b) => (layerOf(m, a.id) === 't' ? 0 : 1) - (layerOf(m, b.id) === 't' ? 0 : 1));
  for (const p of flat) {
    const s = spriteOf(m, p), img = imgs.get(s.id);
    if (!img) continue;
    const r = spriteRect(m, room, p);
    const src = m[p.id]?.tecido ? paint(img, s.id, p.cor, p.cor2) : img;
    if (s.flip) {
      x.save(); x.translate(r.x + r.w, r.y); x.scale(-1, 1); x.drawImage(src, 0, 0, r.w, r.h); x.restore();
    } else x.drawImage(src, r.x, r.y, r.w, r.h);
  }
  return c;
}
