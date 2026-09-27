import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addGlowSpots, buildTown, type Placed } from '@/game/world/town';
import { lightHalo, timeOfDay } from '@/game/world/light';
import { TILE } from '@/game/world/buildings';
import { Pixmap } from '@/game/world/pixmap';
import {
  ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker,
} from '@/game/world/movement';
import { recolorBase, type Outfit } from '@/game/world/recolor';
import { BUILDING_INFO, HOUSE_INFO, MURAL_TEXT, NPCS } from '@/game/world/content';
import { useOccludesBackdrop } from '@/hooks/useOccludesBackdrop';

/**
 * Protótipo jogável da Cidade WIT: andar pela cidade (setas/WASD ou toque),
 * conversar com moradores (espaço) e ver o que cada prédio vai ter.
 * Rota: /cidade-demo
 */

const DIRS: Dir[] = ['south', 'west', 'east', 'north'];
/** ?passeio=1: o boneco passeia sozinho (para medir desempenho e gravar vídeo). */
const TOUR: [number, number][] = [[20, 17], [8, 16], [7, 15], [8, 26], [22, 26], [31, 26], [34, 16], [33, 15], [24, 9], [15, 9], [4, 8], [20, 12]];
const WALK_MS = 230, RUN_MS = 125;
/** Um dia inteiro do jogo dura 12 minutos (30 s por hora). */
const MS_PER_HOUR = 30_000;
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'north', ArrowDown: 'south', ArrowLeft: 'west', ArrowRight: 'east',
  w: 'north', s: 'south', a: 'west', d: 'east', W: 'north', S: 'south', A: 'west', D: 'east',
};

type Frames = { walk: Record<Dir, HTMLCanvasElement[]>; foot: Record<Dir, number> };

function toCanvas(pm: Pixmap): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = pm.w; c.height = pm.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(pm.data), pm.w, pm.h), 0, 0);
  return c;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function loadFrames(folder: string, outfit?: Outfit): Promise<Frames> {
  const prep = async (file: string) => {
    const img = await loadImage(`/game/sprites/${folder}/${file}.png`);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    if (outfit) {
      const d = ctx.getImageData(0, 0, c.width, c.height);
      recolorBase(d.data, c.width, outfit);
      ctx.putImageData(d, 0, 0);
    }
    return c;
  };
  // Só os quadros de caminhada: os "parados" da PixelLab têm outro tamanho e
  // faziam o boneco encolher e pular ao começar a andar.
  const walk = {} as Record<Dir, HTMLCanvasElement[]>;
  const foot = {} as Record<Dir, number>;
  await Promise.all(DIRS.map(async d => {
    walk[d] = await Promise.all([0, 1, 2, 3, 4, 5].map(k => prep(`andar-${d}-${k}`)));
    // linha dos pés = última linha opaca, pela mediana dos quadros
    const rows = walk[d].map(c => {
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > 128) return y;
      return c.height - 1;
    }).sort((a, b) => a - b);
    foot[d] = rows[rows.length >> 1];
  }));
  return { walk, foot };
}

interface Npc { def: (typeof NPCS)[number]; w: Walker; frames: Frames | null; goal: Dir | null }

export default function CityDemo() {
  // a cidade cobre a tela inteira: o fundo 3D do app não precisa desenhar
  useOccludesBackdrop();
  const town = useMemo(() => buildTown(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panel, setPanel] = useState<{ title: string; text: string } | null>(null);
  const [dialog, setDialog] = useState<{ lines: string[]; i: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const [view, setView] = useState({ w: 320, h: 208, scale: 3 });
  const [clock, setClock] = useState(8);

  // estado do jogo fora do React (o laço de desenho lê direto)
  const g = useRef({
    player: newWalker(town.spawn.tx, town.spawn.ty, 'north'),
    pet: newWalker(town.spawn.tx - 1, town.spawn.ty, 'east'),
    npcs: NPCS.map(def => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null, goal: null })) as Npc[],
    held: [] as Dir[],
    run: false,
    path: [] as Dir[],
    playerFrames: null as Frames | null,
    petFrames: null as Frames | null,
    /** Chão + todos os objetos já compostos (desenhado de uma vez). */
    scene: null as HTMLCanvasElement | null,
    objs: [] as { o: Placed; c: HTMLCanvasElement; n: HTMLCanvasElement | null }[],
    /** Objetos animados: ficam fora da cena pré-composta. */
    anims: [] as { o: Placed; cs: HTMLCanvasElement[]; ns: HTMLCanvasElement[] | null }[],
    /** Luzes fixas da cidade e o halo delas (tamanho do mapa). */
    lights: null as HTMLCanvasElement | null,
    halo: null as HTMLCanvasElement | null,
    /** Hora do jogo (0–24). */
    hour: 8,
    clockSpeed: 1,
    modal: false,
    dirty: true,
  });

  useEffect(() => { g.current.modal = !!panel || !!dialog; g.current.dirty = true; }, [panel, dialog]);

  // arte da cidade → canvas (uma vez)
  useEffect(() => {
    g.current.objs = town.objects.filter(o => !o.frames).map(o => ({ o, c: toCanvas(o.pix), n: o.night ? toCanvas(o.night) : null }));
    g.current.anims = town.objects.filter(o => o.frames).map(o => ({
      o, cs: o.frames!.map(toCanvas), ns: o.nightFrames ? o.nightFrames.map(toCanvas) : null,
    }));
    const scene = toCanvas(town.ground);
    const sctx = scene.getContext('2d')!;
    for (const { o, c } of g.current.objs) sctx.drawImage(c, o.x, o.y);
    g.current.scene = scene;
    g.current.lights = toCanvas(town.lights);
    const qs = new URLSearchParams(window.location.search);
    const h = qs.get('hora'), v = Number(qs.get('velocidade'));
    if (h !== null && !Number.isNaN(Number(h))) { g.current.hour = Number(h) % 24; setClock(g.current.hour); }
    // ?velocidade=N: o relógio corre N vezes mais rápido (para vídeo e testes)
    if (v > 0) g.current.clockSpeed = v;
    // halo das luzes: calculado uma vez, depois do primeiro quadro
    const haloTimer = window.setTimeout(() => {
      const src = new Pixmap(town.lights.w, town.lights.h);
      src.data.set(town.lights.data);
      for (const o of town.objects) if (o.frames && o.night) src.blit(o.night, o.x, o.y);
      const halo = lightHalo(src, 6, 1.2, 2);   // meia resolução: desenhado ampliado
      addGlowSpots(halo, town.glowSpots, 2);
      g.current.halo = toCanvas(halo);
      g.current.dirty = true;
    }, 30);
    let alive = true;
    (async () => {
      const [pf, pet, ...npcFrames] = await Promise.all([
        loadFrames('base'),
        loadFrames('pets/raposa-chama'),
        ...NPCS.map(n => loadFrames('base', n.outfit)),
      ]);
      if (!alive) return;
      g.current.playerFrames = pf;
      g.current.petFrames = pet;
      g.current.npcs.forEach((n, i) => { n.frames = npcFrames[i]; });
      g.current.dirty = true;
      setReady(true);
    })().catch(err => console.error('sprites', err));
    return () => { alive = false; window.clearTimeout(haloTimer); };
  }, [town]);

  // tamanho da tela → escala inteira (pixel perfeito)
  useEffect(() => {
    const fit = () => {
      const scale = Math.max(2, Math.min(4, Math.floor(Math.min(window.innerWidth / 300, window.innerHeight / 200))));
      setView({ w: Math.ceil(window.innerWidth / scale), h: Math.ceil(window.innerHeight / scale), scale });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const blocked = useCallback((tx: number, ty: number) => {
    if (tx < 0 || ty < 0 || ty >= town.solid.length || tx >= town.solid[0].length) return true;
    if (town.solid[ty][tx]) return true;
    return g.current.npcs.some(n => n.w.tx === tx && n.w.ty === ty);
  }, [town]);

  const interact = useCallback(() => {
    const s = g.current;
    if (dialog) {
      if (dialog.i + 1 < dialog.lines.length) setDialog({ ...dialog, i: dialog.i + 1 });
      else setDialog(null);
      return;
    }
    if (panel) { setPanel(null); return; }
    const f = ahead(s.player);
    const npc = s.npcs.find(n => n.w.tx === f.tx && n.w.ty === f.ty);
    if (npc) {
      const back: Record<Dir, Dir> = { north: 'south', south: 'north', west: 'east', east: 'west' };
      npc.w.dir = back[s.player.dir];
      setDialog({ lines: npc.def.lines, i: 0 });
      return;
    }
    const mural = town.objects.find(o => o.id === 'mural');
    if (mural && f.ty === 12 && f.tx >= 14 && f.tx <= 16) setDialog({ lines: MURAL_TEXT, i: 0 });
  }, [dialog, panel, town]);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (d) {
        e.preventDefault();
        if (!g.current.held.includes(d)) g.current.held.unshift(d);
        g.current.path = [];
      }
      if (e.key === 'Shift') g.current.run = true;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); interact(); }
      if (e.key === 'Escape') { setPanel(null); setDialog(null); }
      // T: avança 2 horas (para ver o dia e a noite sem esperar)
      if (e.key === 't' || e.key === 'T') { g.current.hour = (g.current.hour + 2) % 24; g.current.dirty = true; }
    };
    const up = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (d) g.current.held = g.current.held.filter(x => x !== d);
      if (e.key === 'Shift') g.current.run = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [interact]);

  // laço de jogo
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    let last = performance.now(), raf = 0, petQueue: { tx: number; ty: number }[] = [];
    let npcTimer = 0;
    let lastAnimKey = '';
    let lastTodKey = -1, lastPulse = -1, lastHourShown = -1;
    const lightsFrame = document.createElement('canvas');
    const lf = lightsFrame.getContext('2d')!;
    const tour = new URLSearchParams(window.location.search).has('passeio');
    let tourIdx = 0;

    const onStepDone = () => {
      const s = g.current;
      const door = town.doors.find(d => d.tx === s.player.tx && d.ty === s.player.ty);
      if (door && s.player.dir === 'north') {
        s.path = []; s.held = [];
        setPanel(BUILDING_INFO[door.building] ?? HOUSE_INFO);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(50, now - last); last = now;
      const s = g.current;
      const p = s.player;
      if (tour && !s.modal && !p.from && !s.path.length && !s.held.length) {
        const [tx, ty] = TOUR[tourIdx++ % TOUR.length];
        s.path = findPath(p.tx, p.ty, tx, ty, blocked);
      }
      const ms = s.run ? RUN_MS : WALK_MS;
      const pet = s.pet;
      // jogador: sem pausa entre blocos; toque rápido só vira
      tick(p, dt, {
        msPerTile: ms,
        blocked,
        fromPath: !s.held.length,
        want: () => (s.modal ? null : s.held[0] ?? s.path[0] ?? null),
        onStep: from => { petQueue.push(from); if (!s.held.length) s.path.shift(); s.dirty = true; },
        onArrive: onStepDone,
      });
      if (!p.from && !s.held.length && s.path.length && blocked(p.tx + DELTA[s.path[0]][0], p.ty + DELTA[s.path[0]][1])) s.path = [];
      // pet: segue exatamente os blocos que o jogador deixou
      tick(pet, dt, {
        msPerTile: ms,
        blocked: () => false,
        fromPath: true,
        want: () => {
          const tgt = petQueue[0];
          if (!tgt) return null;
          const dx = tgt.tx - pet.tx, dy = tgt.ty - pet.ty;
          if (Math.abs(dx) + Math.abs(dy) !== 1) { pet.tx = tgt.tx; pet.ty = tgt.ty; petQueue.shift(); return null; }
          return dx > 0 ? 'east' : dx < 0 ? 'west' : dy > 0 ? 'south' : 'north';
        },
        onStep: () => { petQueue.shift(); },
      });
      if (p.from || pet.from) s.dirty = true;
      // moradores olham em volta e dão uns passinhos perto de casa
      npcTimer += dt;
      if (npcTimer > 1600) {
        npcTimer = 0;
        const n = s.npcs[Math.floor(Math.random() * s.npcs.length)];
        if (!s.modal && !n.w.from) {
          const home = n.w.tx === n.def.tx && n.w.ty === n.def.ty;
          const back: Dir = n.def.tx > n.w.tx ? 'east' : n.def.tx < n.w.tx ? 'west' : n.def.ty > n.w.ty ? 'south' : 'north';
          if (home && Math.random() < 0.5) n.goal = DIRS[Math.floor(Math.random() * 4)];
          else if (!home) n.goal = back;
          else n.w.dir = DIRS[Math.floor(Math.random() * 4)];
          s.dirty = true;
        }
      }
      for (const n of s.npcs) {
        const occupied = (tx: number, ty: number) => blocked(tx, ty)
          || (p.tx === tx && p.ty === ty) || (pet.tx === tx && pet.ty === ty)
          || town.doors.some(d => d.tx === tx && d.ty === ty);
        tick(n.w, dt, {
          msPerTile: WALK_MS * 1.4,
          blocked: occupied,
          fromPath: true,
          want: () => { const gd = n.goal; n.goal = null; return gd; },
        });
        if (n.w.from) s.dirty = true;
      }
      // quadros de animação dos objetos
      const animKey = s.anims.map(a => Math.floor(now / (a.o.frameMs ?? 500)) % a.cs.length).join(',');
      if (animKey !== lastAnimKey) { lastAnimKey = animKey; s.dirty = true; }
      // relógio do jogo: a luz muda aos poucos; à noite os pulsos correm nos circuitos
      s.hour = (s.hour + (dt * s.clockSpeed) / MS_PER_HOUR) % 24;
      const tod = timeOfDay(s.hour);
      const todKey = Math.round(s.hour * 30);
      if (todKey !== lastTodKey) { lastTodKey = todKey; s.dirty = true; }
      if (tod.light > 0) { const pk = Math.floor(now / 60); if (pk !== lastPulse) { lastPulse = pk; s.dirty = true; } }
      if (Math.floor(s.hour) !== lastHourShown) { lastHourShown = Math.floor(s.hour); setClock(s.hour); }

      // ── desenho: só quando algo mudou ──
      if (!s.dirty || !s.scene) { raf = requestAnimationFrame(loop); return; }
      s.dirty = false;
      const vw = cv.width, vh = cv.height;
      const pp = pixelPos(p, TILE);
      const mapW = town.ground.w, mapH = town.ground.h;
      let camX = Math.round(pp.x + 8 - vw / 2), camY = Math.round(pp.y + 8 - vh / 2);
      camX = mapW <= vw ? Math.round((mapW - vw) / 2) : Math.max(0, Math.min(mapW - vw, camX));
      camY = mapH <= vh ? Math.round((mapH - vh) / 2) : Math.max(0, Math.min(mapH - vh, camY));
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#3f6e3a';
      ctx.fillRect(0, 0, vw, vh);
      ctx.drawImage(s.scene, -camX, -camY);

      // personagens + só os objetos que ficam na frente de algum deles
      type D = { baseY: number; draw: () => void };
      const list: D[] = [];
      const people: { x: number; y: number; baseY: number; img: HTMLCanvasElement; sx: number; sy: number }[] = [];
      const person = (w: Walker, fr: Frames | null) => {
        if (!fr) return;
        const pos = pixelPos(w, TILE);
        const frameMs = (w === s.player && s.run ? RUN_MS : WALK_MS) / 3;
        const img = fr.walk[w.dir][w.anim > 0 ? Math.floor(w.anim / frameMs) % 6 : 0];
        const wx = Math.round(pos.x - 8), wy = Math.round(pos.y + 15 - fr.foot[w.dir]);
        const x = wx - camX, y = wy - camY;
        if (x > vw || y > vh || x < -32 || y < -32) return;
        people.push({ x: wx, y: wy, baseY: pos.y + 16, img, sx: x, sy: y });
        list.push({
          baseY: pos.y + 16,
          draw: () => {
            ctx.fillStyle = 'rgba(40,80,60,0.28)';
            ctx.beginPath(); ctx.ellipse(x + 16, y + fr.foot[w.dir], 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.drawImage(img, x, y);
          },
        });
      };
      person(s.pet, s.petFrames);
      for (const n of s.npcs) person(n.w, n.frames);
      person(p, s.playerFrames);
      for (const { o, cs } of s.anims) {
        const c = cs[Math.floor(now / (o.frameMs ?? 500)) % cs.length];
        if (o.x > camX + vw || o.x + c.width < camX || o.y > camY + vh || o.y + c.height < camY) continue;
        list.push({ baseY: o.baseY, draw: () => ctx.drawImage(c, o.x - camX, o.y - camY) });
      }
      const frontLit: { o: Placed; n: HTMLCanvasElement }[] = [];
      for (const { o, c, n } of s.objs) {
        const front = people.some(h => o.baseY > h.baseY
          && o.x < h.x + 32 && o.x + c.width > h.x && o.y < h.y + 32 && o.y + c.height > h.y);
        if (front) {
          list.push({ baseY: o.baseY, draw: () => ctx.drawImage(c, o.x - camX, o.y - camY) });
          if (n) frontLit.push({ o, n });
        }
      }
      list.sort((a, b) => a.baseY - b.baseY);
      for (const d of list) d.draw();

      // ── hora do dia: escurece tudo, acende as luzes por cima, soma o halo ──
      const white = tod.tint.every(v => v === 255);
      if (!white) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgb(${tod.tint[0]},${tod.tint[1]},${tod.tint[2]})`;
        ctx.fillRect(0, 0, vw, vh);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (tod.light > 0 && s.lights) {
        if (lightsFrame.width !== vw || lightsFrame.height !== vh) { lightsFrame.width = vw; lightsFrame.height = vh; }
        lf.imageSmoothingEnabled = false;
        lf.globalCompositeOperation = 'source-over';
        lf.clearRect(0, 0, vw, vh);
        lf.drawImage(s.lights, -camX, -camY);
        for (const { o, ns } of s.anims) {
          if (!ns) continue;
          lf.drawImage(ns[Math.floor(now / (o.frameMs ?? 500)) % ns.length], o.x - camX, o.y - camY);
        }
        // pulsos: pontinhos claros correndo da Torre para fora
        lf.fillStyle = '#eaffc8';
        for (const path of town.circuits) {
          for (let k = 0; k < path.length; k += 90) {
            const idx = (k + Math.floor(now / 22)) % path.length;
            const [px, py] = path[idx];
            lf.fillRect(px - camX - 1, py - camY - 1, 2, 2);
          }
        }
        // quem está na frente tapa as luzes de trás; objetos na frente das pessoas acendem de novo
        lf.globalCompositeOperation = 'destination-out';
        for (const h of people) lf.drawImage(h.img, h.sx, h.sy);
        lf.globalCompositeOperation = 'source-over';
        for (const { o, n } of frontLit) lf.drawImage(n, o.x - camX, o.y - camY);
        ctx.globalAlpha = tod.light;
        ctx.drawImage(lightsFrame, 0, 0);
        if (s.halo) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = tod.light * 0.6;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(s.halo, -camX, -camY, s.halo.width * 2, s.halo.height * 2);
          ctx.imageSmoothingEnabled = false;
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [town, blocked, view]);

  useEffect(() => { g.current.dirty = true; }, [view, ready]);

  // toque no mapa → anda até lá
  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = g.current;
    if (s.modal) { interact(); return; }
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * cv.width;
    const vy = ((e.clientY - rect.top) / rect.height) * cv.height;
    const pp = pixelPos(s.player, TILE);
    const mapW = town.ground.w, mapH = town.ground.h;
    const camX = mapW <= cv.width ? Math.round((mapW - cv.width) / 2) : Math.max(0, Math.min(mapW - cv.width, Math.round(pp.x + 8 - cv.width / 2)));
    const camY = mapH <= cv.height ? Math.round((mapH - cv.height) / 2) : Math.max(0, Math.min(mapH - cv.height, Math.round(pp.y + 8 - cv.height / 2)));
    const tx = Math.floor((vx + camX) / TILE), ty = Math.floor((vy + camY) / TILE);
    // tocar num morador ou prédio: vai até o bloco livre mais perto e olha para ele
    const target = blocked(tx, ty)
      ? [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy })).find(t => !blocked(t.tx, t.ty))
      : { tx, ty };
    if (!target) return;
    s.path = findPath(s.player.tx, s.player.ty, target.tx, target.ty, blocked);
  };

  const hold = (d: Dir | null) => { g.current.held = d ? [d] : []; g.current.path = []; };

  const pixelFont = "font-['Press_Start_2P',monospace]";
  return (
    <div className="fixed inset-0 bg-[#1b2a22] overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        width={view.w}
        height={view.h}
        onPointerDown={onTap}
        style={{ width: view.w * view.scale, height: view.h * view.scale, imageRendering: 'pixelated' }}
        className="block"
        aria-label="Cidade WIT"
      />
      <div className={`absolute top-2 left-2 px-3 py-2 rounded-md bg-black/55 text-white text-[10px] leading-4 ${pixelFont}`}>
        CIDADE WIT <span className="text-lime-300">· protótipo</span>
        <span className="ml-2 text-white/90">{clock >= 6 && clock < 18.5 ? '☀' : '☾'} {String(Math.floor(clock)).padStart(2, '0')}:00</span>
        {!touch && <div className="text-white/70 mt-1">SETAS/WASD andar · SHIFT correr · ESPAÇO falar · T hora</div>}
        {!ready && <div className="text-yellow-300 mt-1">carregando...</div>}
      </div>

      {dialog && (
        <div onPointerDown={interact} className={`absolute left-1/2 -translate-x-1/2 bottom-4 w-[min(92vw,640px)] rounded-xl border-4 border-[#4a4660] bg-white px-5 py-4 text-[#2e2a40] text-[12px] leading-6 shadow-lg ${pixelFont}`}>
          {dialog.lines[dialog.i]}
          <span className="float-right animate-pulse">▼</span>
        </div>
      )}

      {panel && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40" onPointerDown={() => setPanel(null)}>
          <div className={`w-[min(90vw,440px)] rounded-xl border-4 border-[#4a4660] bg-white p-5 text-[#2e2a40] ${pixelFont}`}>
            <div className="text-[13px] mb-3 text-[#3c56b0]">{panel.title}</div>
            <div className="text-[11px] leading-6">{panel.text}</div>
            <div className="mt-4 text-[10px] text-[#b0487a]">EM BREVE · toque para sair</div>
          </div>
        </div>
      )}

      {touch && (
        <>
          <div className="absolute left-4 bottom-6 grid grid-cols-3 gap-1 opacity-80">
            {([[null, 'north', null], ['west', null, 'east'], [null, 'south', null]] as (Dir | null)[][]).flat().map((d, i) => d ? (
              <button
                key={i}
                aria-label={d}
                className="w-14 h-14 rounded-lg bg-black/45 border-2 border-white/40 text-white text-xl"
                onPointerDown={e => { e.preventDefault(); hold(d); }}
                onPointerUp={() => hold(null)}
                onPointerLeave={() => hold(null)}
              >{{ north: '▲', south: '▼', west: '◀', east: '▶' }[d]}</button>
            ) : <div key={i} />)}
          </div>
          <button
            aria-label="falar"
            className={`absolute right-6 bottom-10 w-16 h-16 rounded-full bg-[#e8485a] border-4 border-white/60 text-white text-sm ${pixelFont}`}
            onPointerDown={e => { e.preventDefault(); interact(); }}
          >A</button>
        </>
      )}
    </div>
  );
}
