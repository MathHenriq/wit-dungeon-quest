import { useCallback, useEffect, useRef, useState } from 'react';
import { addGlowSpots, buildTown, type Placed, type Town } from '@/game/world/town';
import { hdOf, loadPrebuiltGround, loadWorldAssets } from '@/game/world/assets';
import { lightHalo, timeOfDay } from '@/game/world/light';
import { TILE } from '@/game/world/buildings';
import { Pixmap } from '@/game/world/pixmap';
import {
  ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker,
} from '@/game/world/movement';
import { DEFAULT_LOOK, DEFAULT_PET, normalizeLook, type Look } from '@/game/world/outfit';
import { DIRS, loadLookFrames, loadPetFrames, plateCanvas, R, toCanvas, type Frames } from '@/game/world/sprites';
import { InteriorView, type Sala } from '@/components/city/InteriorView';
import { ROOM_BUILDING, ROOMS } from '@/game/interior/room';
import { loadProgress } from '@/game/progress';
import { LookEditor } from '@/components/city/LookEditor';
import { BUILDING_INFO, houseInfo, MURAL_TEXT, NPCS } from '@/game/world/content';
import { useOccludesBackdrop } from '@/hooks/useOccludesBackdrop';
import { drawAmbient } from '@/game/world/ambient';
import { PLATE_NPC, PLATE_PLAYER } from '@/game/world/nameplate';

/**
 * Protótipo jogável da Cidade WIT: andar pela cidade (setas/WASD ou toque),
 * conversar com moradores (espaço) e ver o que cada prédio vai ter.
 * Rota: /cidade-demo
 */

/** ?passeio=1: o boneco passeia sozinho (para medir desempenho e gravar vídeo). */
const TOUR: [number, number][] = [[31, 23], [16, 21], [16, 19], [10, 27], [16, 32], [16, 31], [46, 33], [46, 31], [57, 21], [51, 14], [48, 10], [7, 11], [7, 9], [26, 13], [31, 23], [31, 40], [14, 42], [14, 41], [31, 33]];
const WALK_MS = 230, RUN_MS = 125;
/** Um dia inteiro do jogo dura 12 minutos (30 s por hora). */
const MS_PER_HOUR = 30_000;
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'north', ArrowDown: 'south', ArrowLeft: 'west', ArrowRight: 'east',
  w: 'north', s: 'south', a: 'west', d: 'east', W: 'north', S: 'south', A: 'west', D: 'east',
};

// R (sprites.ts): cada pixel do mundo (1 bloco = 16) vira R × R pixels da
// tela interna, onde a arte hd (2×) aparece com todo o detalhe. A lógica
// (posições, colisão, câmera) continua em pixels do mundo.

/** Canvas da arte em hd (a hd do sprite, ou a normal ampliada); um por arte (árvores iguais dividem). */
const hdCanvases = new WeakMap<Pixmap, HTMLCanvasElement>();
function toCanvasHd(pm: Pixmap): HTMLCanvasElement {
  let c = hdCanvases.get(pm);
  if (!c) { c = toCanvas(hdOf(pm)); hdCanvases.set(pm, c); }
  return c;
}

/**
 * Cópias escurecidas para a hora (personagens e o que fica na frente deles).
 * Cada arte é escurecida uma vez por tom e guardada: usar como fonte um canvas
 * que acabou de ser desenhado obriga a placa de vídeo a sincronizar, e isso
 * dezenas de vezes por quadro derrubava o FPS à noite. No entardecer o tom
 * muda aos poucos; para não recriar tudo de uma vez, no máximo `budget` por
 * quadro (os outros usam a cópia anterior até a vez deles).
 */
const tintCache = new WeakMap<HTMLCanvasElement, { key: string; c: HTMLCanvasElement }>();
const tintBudget = { left: 0 };
function tinted(src: HTMLCanvasElement, key: string, css: string): HTMLCanvasElement {
  const hit = tintCache.get(src);
  if (hit && (hit.key === key || tintBudget.left <= 0)) return hit.c;
  tintBudget.left--;
  const c = hit?.c ?? document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d')!;
  x.globalCompositeOperation = 'copy';
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = css;
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(src, 0, 0);
  tintCache.set(src, { key, c });
  return c;
}


const LOOK_KEY = 'wit.visual';
function savedLook(): Look {
  try { return normalizeLook(JSON.parse(localStorage.getItem(LOOK_KEY) ?? 'null')); } catch { return DEFAULT_LOOK; }
}

interface Npc { def: (typeof NPCS)[number]; w: Walker; frames: Frames | null; goal: Dir | null }

export default function CityDemo() {
  // a cidade cobre a tela inteira: o fundo 3D do app não precisa desenhar
  useOccludesBackdrop();
  const [town, setTown] = useState<Town | null>(null);
  useEffect(() => {
    let alive = true;
    // ?casa=modelo-gamer mostra a Sua Casa com outro modelo (as 3 iniciais e as 7 à venda)
    const casa = new URLSearchParams(window.location.search).get('casa') ?? undefined;
    Promise.all([loadWorldAssets(), loadPrebuiltGround()])
      .then(([a, g]) => { if (alive) setTown(buildTown(a, { casa, groundHd: g?.pix, groundKey: g?.key })); })
      .catch(err => { console.error('sprites da cidade', err); if (alive) setTown(buildTown(undefined, { casa })); });
    return () => { alive = false; };
  }, []);
  if (!town) {
    return <div className="fixed inset-0 bg-[#1b2a22] flex items-center justify-center text-white/80 text-xs font-['Press_Start_2P',monospace]">carregando a cidade...</div>;
  }
  return <CityView town={town} />;
}

function startTile(town: Town): { tx: number; ty: number } {
  const m = /^(\d+),(\d+)$/.exec(new URLSearchParams(window.location.search).get('pos') ?? '');
  if (m) {
    const tx = Number(m[1]), ty = Number(m[2]);
    if (!town.solid[ty]?.[tx]) return { tx, ty };
  }
  return town.spawn;
}

function CityView({ town }: { town: Town }) {
  const START = startTile(town);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panel, setPanel] = useState<{ title: string; text: string } | null>(null);
  const [dialog, setDialog] = useState<{ lines: string[]; i: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const [view, setView] = useState({ w: 320, h: 208, scale: 3 });
  const [clock, setClock] = useState(8);
  const [near, setNear] = useState<string | null>(null);
  const [look, setLook] = useState<Look>(savedLook);
  const [editing, setEditing] = useState(() => new URLSearchParams(window.location.search).has('visual'));
  // ?sala=torre&andar=5 ou ?sala=casa começa dentro (prints e testes)
  const [inside, setInside] = useState<Sala | null>(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('sala') === 'casa') return { kind: 'casa' };
    const sid = q.get('sala');
    if (sid && ROOMS[sid]) return { kind: 'sala', id: sid };
    if (q.get('sala') === 'torre') return { kind: 'torre', andar: Math.max(1, Math.min(100, Number(q.get('andar')) || 1)) };
    return null;
  });

  // estado do jogo fora do React (o laço de desenho lê direto)
  const g = useRef({
    // ?pos=tx,ty começa em outro lugar (para prints e testes)
    player: newWalker(START.tx, START.ty, 'north'),
    pet: newWalker(START.tx - 1, START.ty, 'east'),
    npcs: NPCS.map(def => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null, goal: null })) as Npc[],
    held: [] as Dir[],
    run: false,
    path: [] as Dir[],
    playerFrames: null as Frames | null,
    /** Apelido e título do jogador (na plaquinha). */
    nick: 'Você',
    playerTitle: 'Novato' as string | undefined,
    petFrames: null as Frames | null,
    /** Chão + todos os objetos já compostos (desenhado de uma vez). */
    scene: null as HTMLCanvasElement | null,
    objs: [] as { o: Placed; c: HTMLCanvasElement; n: HTMLCanvasElement | null }[],
    /** Objetos animados: ficam fora da cena pré-composta. */
    anims: [] as { o: Placed; cs: HTMLCanvasElement[]; ns: HTMLCanvasElement[] | null }[],
    /** Os ritmos (ms por quadro) diferentes entre os objetos animados. */
    animRates: [] as number[],
    /** Luzes fixas + halo numa imagem só, somada à cena à noite. */
    nightOverlay: null as HTMLCanvasElement | null,
    /**
     * Cena já escurecida e com as luzes somadas (o mapa inteiro, em hd), para
     * a hora `key`. Desenhar isso é uma passada só pela tela, em vez de três
     * (cena, escurecer, luzes). Quando a hora muda, a nova é montada em `back`
     * uma faixa por quadro e depois troca de lugar com a da frente.
     */
    lit: { front: null as HTMLCanvasElement | null, frontKey: '', back: null as HTMLCanvasElement | null, backKey: '', row: 0 },
    /** Hora do jogo (0–24). */
    hour: 8,
    clockSpeed: 1,
    modal: false,
    inside: false,
    dirty: true,
  });

  useEffect(() => { g.current.modal = !!panel || !!dialog || editing || !!inside; g.current.inside = !!inside; g.current.dirty = true; }, [panel, dialog, editing, inside]);

  // visual novo → repinta o boneco e guarda (só neste navegador por enquanto)
  const firstLook = useRef(true);
  useEffect(() => {
    try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch { /* sem armazenamento */ }
    g.current.nick = look.apelido || 'Você';
    g.current.dirty = true;
    if (firstLook.current) { firstLook.current = false; return; }
    let alive = true;
    loadLookFrames(look).then(f => { if (alive) { g.current.playerFrames = f; g.current.dirty = true; } }).catch(err => console.error('visual', err));
    loadPetFrames(look.pet ?? DEFAULT_PET).then(f => { if (alive) { g.current.petFrames = f; g.current.dirty = true; } }).catch(err => console.error('pet', err));
    return () => { alive = false; };
  }, [look]);

  // arte da cidade → canvas (uma vez)
  useEffect(() => {
    g.current.objs = town.objects.filter(o => !o.frames).map(o => ({ o, c: toCanvasHd(o.pix), n: o.night ? toCanvasHd(o.night) : null }));
    g.current.anims = town.objects.filter(o => o.frames).map(o => ({
      o, cs: o.frames!.map(toCanvasHd), ns: o.nightFrames ? o.nightFrames.map(toCanvasHd) : null,
    }));
    g.current.animRates = [...new Set(g.current.anims.map(a => a.o.frameMs ?? 500))];
    const scene = toCanvasHd(town.ground);
    const sctx = scene.getContext('2d')!;
    for (const { o, c } of g.current.objs) sctx.drawImage(c, o.x * R, o.y * R);
    g.current.scene = scene;
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
      const halo = lightHalo(src, 6, 1.2, 2);   // meia resolução: ampliado com suavização
      addGlowSpots(halo, town.glowSpots, 2);
      // as luzes nítidas em hd (janelas, LEDs), montadas com o canvas: na ordem
      // de desenho, cada objeto apaga a luz que está atrás dele e põe a sua
      const sharp = toCanvasHd(town.groundNight);
      const sh = sharp.getContext('2d')!;
      for (const { o, c, n } of g.current.objs) {
        sh.globalCompositeOperation = 'destination-out';
        sh.drawImage(c, o.x * R, o.y * R);
        if (n) { sh.globalCompositeOperation = 'source-over'; sh.drawImage(n, o.x * R, o.y * R); }
      }
      sh.globalCompositeOperation = 'source-over';
      for (const { o, ns } of g.current.anims) if (ns) sh.drawImage(ns[0], o.x * R, o.y * R);
      const ov = document.createElement('canvas');
      ov.width = sharp.width; ov.height = sharp.height;
      const octx = ov.getContext('2d')!;
      // somadas à cena escura: um pouco abaixo do máximo, senão o verde vira branco
      octx.globalAlpha = 0.8;
      octx.drawImage(sharp, 0, 0);
      octx.globalCompositeOperation = 'lighter';
      octx.globalAlpha = 0.45;
      octx.imageSmoothingEnabled = true;
      octx.drawImage(toCanvas(halo), 0, 0, sharp.width, sharp.height);
      g.current.nightOverlay = ov;
      g.current.dirty = true;
    }, 30);
    let alive = true;
    (async () => {
      const [pf, pet, ...npcFrames] = await Promise.all([
        loadLookFrames(look),
        loadPetFrames(look.pet ?? DEFAULT_PET),
        ...NPCS.map(n => loadLookFrames(n.look)),
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
      // escala do mundo sempre múltipla de R: a tela interna (hd) aparece em
      // número inteiro de pixels da tela, sem pixel torto (~320 × 180 visíveis)
      const scale = R * Math.max(1, Math.floor(Math.min(window.innerWidth / 480, window.innerHeight / 320)));
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
    if (g.current.modal) return;
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
      if (e.key === 'Escape') { setPanel(null); setDialog(null); setEditing(false); }
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
    let last = performance.now(), raf = 0;
    const petQueue: { tx: number; ty: number }[] = [];
    let npcTimer = 0;
    let lastAnimKey = '';
    let lastTodKey = -1, lastPulse = -1, lastHourShown = -1;
    let lastNearTile = { x: -1, y: -1 }, lastNear: string | null = null;
    const tour = new URLSearchParams(window.location.search).has('passeio');
    let tourIdx = 0;

    const onStepDone = () => {
      const s = g.current;
      const door = town.doors.find(d => d.tx === s.player.tx && d.ty === s.player.ty);
      if (door && s.player.dir === 'north') {
        s.path = []; s.held = [];
        // a Torre abre no andar mais alto já liberado
        if (door.building === 'torre') setInside({ kind: 'torre', andar: loadProgress().towerMax });
        else if (door.building === 'sua-casa') setInside({ kind: 'casa' });
        else if (Object.values(ROOM_BUILDING).includes(door.building)) {
          // a primeira sala de cada prédio (a Arena abre no saguão)
          const id = Object.keys(ROOM_BUILDING).find(k => ROOM_BUILDING[k] === door.building)!;
          setInside({ kind: 'sala', id });
        }
        else setPanel(BUILDING_INFO[door.building] ?? houseInfo(door.building, door.name));
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
      // (só o relógio de cada ritmo: com a fase, cada objeto troca de quadro junto com o seu ritmo)
      const animKey = s.animRates.map(ms => Math.floor(now / ms)).join(',');
      if (animKey !== lastAnimKey) { lastAnimKey = animKey; s.dirty = true; }
      // relógio do jogo: a luz muda aos poucos; à noite os pulsos correm nos circuitos
      s.hour = (s.hour + (dt * s.clockSpeed) / MS_PER_HOUR) % 24;
      const tod = timeOfDay(s.hour);
      const todKey = Math.round(s.hour * 30);
      if (todKey !== lastTodKey) { lastTodKey = todKey; s.dirty = true; }
      if (tod.light > 0) { const pk = Math.floor(now / 60); if (pk !== lastPulse) { lastPulse = pk; s.dirty = true; } }
      if (Math.floor(s.hour) !== lastHourShown) { lastHourShown = Math.floor(s.hour); setClock(s.hour); }
      // nome do lugar quando o jogador chega perto de uma porta
      if (p.tx !== lastNearTile.x || p.ty !== lastNearTile.y) {
        lastNearTile = { x: p.tx, y: p.ty };
        const d = town.doors.find(dd => Math.abs(dd.tx - p.tx) <= 2 && p.ty - dd.ty >= 0 && p.ty - dd.ty <= 3);
        const title = d ? (BUILDING_INFO[d.building]?.title ?? houseInfo(d.building, d.name).title) : null;
        if (title !== lastNear) { lastNear = title; setNear(title); }
      }

      // ── desenho: só quando algo mudou (e não enquanto se está num interior) ──
      if (!s.dirty || !s.scene || s.inside) { raf = requestAnimationFrame(loop); return; }
      s.dirty = false;
      const vw = cv.width / R, vh = cv.height / R;
      const pp = pixelPos(p, TILE);
      const mapW = town.ground.w, mapH = town.ground.h;
      let camX = Math.round(pp.x + 8 - vw / 2), camY = Math.round(pp.y + 8 - vh / 2);
      camX = mapW <= vw ? Math.round((mapW - vw) / 2) : Math.max(0, Math.min(mapW - vw, camX));
      camY = mapH <= vh ? Math.round((mapH - vh) / 2) : Math.max(0, Math.min(mapH - vh, camY));
      ctx.setTransform(R, 0, 0, R, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (mapW < vw || mapH < vh) {
        ctx.fillStyle = '#3f6e3a';
        ctx.fillRect(0, 0, vw, vh);
      }
      // só o pedaço visível (desenhar o mapa inteiro recortado custa caro no software)
      const sx = Math.max(0, camX), sy = Math.max(0, camY);
      const sw = Math.min(vw, mapW - sx), sh = Math.min(vh, mapH - sy);

      // ── hora do dia: cena escurecida + luzes (chão + objetos parados + halo) ──
      const white = tod.tint.every(v => v === 255);
      const lit = tod.light > 0 && !!s.nightOverlay;
      // tom e luz de meia em meia hora do jogo (15 s): a cena pronta só é
      // refeita quando mudam de verdade, e leva 32 quadros para ficar pronta
      const todQ = timeOfDay(Math.round(s.hour * 2) / 2);
      const q = todQ.tint.map(v => Math.min(255, (v >> 3) * 8 + 4));
      const lq = lit ? Math.round(todQ.light * 16) / 16 : 0;
      // de noite, só monta a cena pronta quando a camada de luzes já existe
      const waiting = todQ.light > 0 && !s.nightOverlay;
      const sceneKey = (white && !lit) || waiting ? '' : `${q.join(',')}|${lq}`;
      const L = s.lit;
      if (sceneKey && L.frontKey !== sceneKey) {
        // monta a nova em faixas (1/32 do mapa por quadro), sem travar
        if (L.backKey !== sceneKey) { L.backKey = sceneKey; L.row = 0; }
        if (!L.back) { L.back = document.createElement('canvas'); L.back.width = s.scene.width; L.back.height = s.scene.height; }
        // a primeira sai de uma vez (um quadro lento na entrada); as outras, em faixas
        const b = L.back.getContext('2d')!, H = s.scene.height, step = L.front ? Math.ceil(H / 32) : H;
        const y0 = L.row, hh = Math.min(step, H - y0);
        // (limpa só a faixa: o modo 'copy' apagaria o canvas inteiro)
        b.clearRect(0, y0, s.scene.width, hh);
        b.globalCompositeOperation = 'source-over';
        b.drawImage(s.scene, 0, y0, s.scene.width, hh, 0, y0, s.scene.width, hh);
        b.globalCompositeOperation = 'multiply';
        b.fillStyle = `rgb(${q[0]},${q[1]},${q[2]})`;
        b.fillRect(0, y0, s.scene.width, hh);
        if (lq > 0) {
          b.globalCompositeOperation = 'lighter';
          b.globalAlpha = lq;
          b.drawImage(s.nightOverlay!, 0, y0, s.scene.width, hh, 0, y0, s.scene.width, hh);
          b.globalAlpha = 1;
        }
        b.globalCompositeOperation = 'source-over';
        L.row += step;
        if (L.row >= H) { [L.front, L.back] = [L.back, L.front]; L.frontKey = sceneKey; L.backKey = ''; }
        s.dirty = true;
      }
      if (!sceneKey && !waiting) ctx.drawImage(s.scene, sx * R, sy * R, sw * R, sh * R, sx - camX, sy - camY, sw, sh);
      else if (L.front && sceneKey) ctx.drawImage(L.front, sx * R, sy * R, sw * R, sh * R, sx - camX, sy - camY, sw, sh);
      else {
        // primeira vez (a cena pronta ainda está sendo montada): do jeito direto
        ctx.drawImage(s.scene, sx * R, sy * R, sw * R, sh * R, sx - camX, sy - camY, sw, sh);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgb(${tod.tint[0]},${tod.tint[1]},${tod.tint[2]})`;
        ctx.fillRect(0, 0, vw, vh);
        if (lit) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = tod.light;
          ctx.drawImage(s.nightOverlay!, sx * R, sy * R, sw * R, sh * R, sx - camX, sy - camY, sw, sh);
          ctx.globalAlpha = 1;
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (lit) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = tod.light;
        // pulsos: pontinhos claros correndo da Torre para fora
        ctx.fillStyle = '#7ad84a';
        for (const path of town.circuits) {
          for (let k = 0; k < path.length; k += 90) {
            const [px, py] = path[(k + Math.floor(now / 22)) % path.length];
            ctx.fillRect(px - camX - 1, py - camY - 1, 2, 2);
          }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      // tom da hora arredondado (muda pouco a pouco no entardecer)
      const tintKey = q.join(','), tintCss = `rgb(${q[0]},${q[1]},${q[2]})`;
      tintBudget.left = 2;
      /** Desenha a arte escurecida para a hora atual (de dia, direto). */
      // toda arte em canvas está em hd: desenha na metade do tamanho (pixels do mundo)
      const put = (c: HTMLCanvasElement, x: number, y: number) => ctx.drawImage(white ? c : tinted(c, tintKey, tintCss), x, y, c.width / R, c.height / R);
      const nightOn = (n: HTMLCanvasElement | null | undefined, x: number, y: number) => {
        if (!lit || !n) return;
        ctx.globalAlpha = tod.light;
        ctx.drawImage(n, x, y, n.width / R, n.height / R);
        ctx.globalAlpha = 1;
      };

      // personagens + objetos animados + só os objetos parados que ficam na frente de alguém
      type D = { baseY: number; draw: () => void };
      const list: D[] = [];
      const people: { x: number; y: number; w: number; h: number; baseY: number }[] = [];
      const person = (w: Walker, fr: Frames | null) => {
        if (!fr) return;
        const pos = pixelPos(w, TILE);
        // cada passo usa metade dos quadros da caminhada (6 da PixelLab, 4 dos modelos)
        const n = fr.walk[w.dir].length;
        const frameMs = (w === s.player && s.run ? RUN_MS : WALK_MS) / (n / 2);
        const img = fr.walk[w.dir][w.anim > 0 ? Math.floor(w.anim / frameMs) % n : 0];
        const wx = Math.round(pos.x + 8 - fr.w / 2), wy = Math.round(pos.y + 15 - fr.foot[w.dir]);
        const x = wx - camX, y = wy - camY;
        if (x > vw || y > vh || x < -32 || y < -48) return;
        people.push({ x: wx, y: wy, w: fr.w, h: 40, baseY: pos.y + 16 });
        list.push({
          baseY: pos.y + 16,
          draw: () => {
            const tx = Math.round(pos.x / TILE), ty = Math.round(pos.y / TILE);
            const inGrass = town.terrain[ty]?.[tx] === 'mato';
            if (!inGrass) {
              ctx.fillStyle = 'rgba(30,50,60,0.3)';
              ctx.beginPath(); ctx.ellipse(x + fr.w / 2, y + fr.foot[w.dir], Math.min(7, fr.w / 3), 2.5, 0, 0, Math.PI * 2); ctx.fill();
            }
            // poeirinha nos pés de quem corre
            if (w === s.player && s.run && w.from) {
              const back = DELTA[w.dir];
              for (let k = 0; k < 3; k++) {
                const life = ((now / 260) + k / 3) % 1;
                const dx = -back[0] * (4 + life * 8) + (k - 1) * 2, dy = -back[1] * (4 + life * 8);
                ctx.fillStyle = `rgba(214,196,160,${0.55 * (1 - life)})`;
                const sz = Math.round((1 + life * 2) * 2) / 2;
                ctx.fillRect(Math.round((x + fr.w / 2 + dx - sz / 2) * 2) / 2, Math.round((y + fr.foot[w.dir] - 1 + dy - life * 3) * 2) / 2, sz, sz);
              }
            }
            put(img, x, y);
            // capim alto: a parte de baixo do bloco (o mato) é desenhada de novo por cima das pernas
            if (inGrass) {
              const src = sceneKey && L.front ? L.front : s.scene!;
              const gx = tx * TILE, gy = ty * TILE + 8;
              const sway = Math.floor(now / 180) % 2 && w.from ? R === 2 ? 0.5 : 1 : 0;
              ctx.drawImage(src, gx * R, gy * R, TILE * R, 8 * R, gx - camX + sway, gy - camY, TILE, 8);
            }
          },
        });
      };
      person(s.pet, s.petFrames);
      for (const n of s.npcs) person(n.w, n.frames);
      person(p, s.playerFrames);
      for (const { o, cs, ns } of s.anims) {
        const f = (Math.floor(now / (o.frameMs ?? 500)) + (o.phase ?? 0)) % cs.length;
        const c = cs[f];
        if (o.x > camX + vw || o.x + c.width / R < camX || o.y > camY + vh || o.y + c.height / R < camY) continue;
        list.push({ baseY: o.baseY, draw: () => { put(c, o.x - camX, o.y - camY); nightOn(ns?.[f % ns.length], o.x - camX, o.y - camY); } });
        people.push({ x: o.x, y: o.y, w: c.width / R, h: c.height / R, baseY: o.baseY });
      }
      // objeto parado que fica na frente de alguém (ou de algo que se mexe) é redesenhado por cima
      for (const { o, c, n } of s.objs) {
        const front = people.some(h => o.baseY > h.baseY
          && o.x < h.x + h.w && o.x + c.width / R > h.x && o.y < h.y + h.h && o.y + c.height / R > h.y);
        if (front) list.push({ baseY: o.baseY, draw: () => { put(c, o.x - camX, o.y - camY); nightOn(n, o.x - camX, o.y - camY); } });
      }
      list.sort((a, b) => a.baseY - b.baseY);
      for (const d of list) d.draw();
      // vida da cidade (fumaça, brilhos, borboletas, pássaros, nuvens, vaga-lumes)
      drawAmbient(ctx, town.fx, { now, camX, camY, vw, vh, tint: tod.tint, light: tod.light }, mapW, mapH);
      // plaquinhas: a do jogador sempre; a dos moradores quando o jogador chega perto
      // (a do jogador primeiro; a de quem estiver colado sobe até não cobrir)
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const plateAt = (w: Walker, c: HTMLCanvasElement) => {
        const pos = pixelPos(w, TILE);
        const pw = c.width / R, ph = c.height / R;
        const x = Math.round(pos.x + 8 - pw / 2 - camX);
        let y = Math.round(pos.y - 13 - ph - camY);
        for (let guard = 0; guard < 6; guard++) {
          const hit = placed.find(r => x < r.x + r.w && x + pw > r.x && y < r.y + r.h && y + ph > r.y);
          if (!hit) break;
          y = hit.y - ph - 1;
        }
        placed.push({ x, y, w: pw, h: ph });
        ctx.drawImage(c, x, y, pw, ph);
      };
      plateAt(p, plateCanvas(s.nick, s.playerTitle, PLATE_PLAYER));
      for (const n of s.npcs) {
        if (Math.abs(n.w.tx - p.tx) + Math.abs(n.w.ty - p.ty) <= 3) plateAt(n.w, plateCanvas(n.def.name, n.def.title, PLATE_NPC));
      }
      s.dirty = true;   // os efeitos se mexem todo quadro
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
    const cw = cv.width / R, ch = cv.height / R;
    const vx = ((e.clientX - rect.left) / rect.width) * cw;
    const vy = ((e.clientY - rect.top) / rect.height) * ch;
    const pp = pixelPos(s.player, TILE);
    const mapW = town.ground.w, mapH = town.ground.h;
    const camX = mapW <= cw ? Math.round((mapW - cw) / 2) : Math.max(0, Math.min(mapW - cw, Math.round(pp.x + 8 - cw / 2)));
    const camY = mapH <= ch ? Math.round((mapH - ch) / 2) : Math.max(0, Math.min(mapH - ch, Math.round(pp.y + 8 - ch / 2)));
    const tx = Math.floor((vx + camX) / TILE), ty = Math.floor((vy + camY) / TILE);
    // tocar num morador ou prédio: vai até o bloco livre mais perto e olha para ele
    const target = blocked(tx, ty)
      ? [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => ({ tx: tx + dx, ty: ty + dy })).find(t => !blocked(t.tx, t.ty))
      : { tx, ty };
    if (!target) return;
    s.path = findPath(s.player.tx, s.player.ty, target.tx, target.ty, blocked);
  };

  // saiu do interior: aparece na frente da porta, olhando para a rua
  const exitInterior = useCallback((from: Sala) => {
    const s = g.current;
    const id = from.kind === 'torre' ? 'torre' : from.kind === 'casa' ? 'sua-casa' : ROOM_BUILDING[from.id];
    const d = town.doors.find(dd => dd.building === id);
    if (d) {
      s.player = newWalker(d.tx, d.ty + 1, 'south');
      s.pet = newWalker(d.tx, d.ty, 'south');
    }
    s.held = []; s.path = [];
    setInside(null);
  }, [town]);

  const hold = (d: Dir | null) => { g.current.held = d ? [d] : []; g.current.path = []; };

  const pixelFont = "font-['Press_Start_2P',monospace]";
  return (
    <div className="fixed inset-0 bg-[#1b2a22] overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        width={view.w * R}
        height={view.h * R}
        onPointerDown={onTap}
        style={{ width: view.w * view.scale, height: view.h * view.scale, imageRendering: 'pixelated' }}
        className="block"
        aria-label="Cidade WIT"
      />
      <div className={`absolute top-2 left-2 px-3 py-2 rounded-md bg-black/55 text-white text-[10px] leading-4 ${pixelFont}`}>
        CIDADE WIT <span className="text-lime-300">· protótipo</span>
        <span className="ml-2 text-white/90">{String(Math.floor(clock)).padStart(2, '0')}:00 · {clock >= 6 && clock < 18.5 ? 'dia' : 'noite'}</span>
        {!touch && <div className="text-white/70 mt-1">SETAS/WASD andar · SHIFT correr · ESPAÇO falar · T hora</div>}
        {!ready && <div className="text-yellow-300 mt-1">carregando...</div>}
      </div>

      <button
        onClick={() => setEditing(true)}
        className={`absolute top-2 right-2 px-3 py-2 rounded-md bg-[#2f6b1e]/90 border-2 border-[#8cc63f] text-white text-[10px] ${pixelFont}`}
      >VISUAL</button>

      {editing && <LookEditor value={look} onChange={setLook} onClose={() => setEditing(false)} />}

      {near && !panel && !dialog && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border-2 border-[#8cc63f] bg-[#0e3a1e]/85 text-white text-[11px] ${pixelFont}`}>
          {near}
        </div>
      )}

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

      {touch && !editing && !inside && (
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
      {inside && <InteriorView sala={inside} look={look} pet={look.pet ?? DEFAULT_PET} onExit={exitInterior} />}
    </div>
  );
}
