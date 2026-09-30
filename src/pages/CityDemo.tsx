import { useCallback, useEffect, useRef, useState } from 'react';
import { addGlowSpots, type Placed, type Town } from '@/game/world/town';
import { hdOf, loadPrebuiltGround, loadWorldAssets, type WorldAssets } from '@/game/world/assets';
import { buildZone, ZONES } from '@/game/world/world';
import { ZONE_NAMES, type Exit, type ZoneId } from '@/game/world/zone';
import { biteDelay, meterFor, meterHit, RARITY_COLOR, RARITY_LABEL, rollFish, type Fish, type Meter } from '@/game/fishing';
import { boatArt, duckFrames } from '@/game/world/buildings-lago';
import { chickenFrames, cowFrames, cropArt, sheepFrames, soilArt } from '@/game/world/buildings-fazenda';
import { HENYARD, PASTURE } from '@/game/world/zone-fazenda';
import { actionAt, applyAction, CAN_SIZE, catchUp, CROP_BY_ID, CROPS, itemName, loadFarm, nextDay, saveFarm, type CropId, type FarmState } from '@/game/farm';
import { FarmPanel, iconOf } from '@/components/city/FarmPanel';
import { spawnCritters, stepCritters, type Critter, type CritterKind } from '@/game/world/critters';
import { drawWaterAnim, makeWaterAnim, type WaterAnim } from '@/game/world/water-anim';
import { drawAlert, drawOars, drawRod } from '@/game/world/player-acts';
import { fishIconUrl } from '@/game/world/fish-art';
import { FishHouse } from '@/components/city/FishHouse';
import { WorldMap } from '@/components/city/WorldMap';
import { play } from '@/game/sfx';
import { lampPower, lightHalo, timeOfDay } from '@/game/world/light';
import { TILE } from '@/game/world/buildings';
import { Pixmap } from '@/game/world/pixmap';
import {
  ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker,
} from '@/game/world/movement';
import { DEFAULT_LOOK, DEFAULT_PET, normalizeLook, type Look } from '@/game/world/outfit';
import { DIRS, loadLookFrames, loadPetFrames, plateCanvas, R, toCanvas, type Frames } from '@/game/world/sprites';
import { InteriorView, type Sala } from '@/components/city/InteriorView';
import { ROOM_BUILDING, ROOMS } from '@/game/interior/room';
import { addCatch, addItem, loadProgress, saveProgress, type Progress } from '@/game/progress';
import { DeckBuilder } from '@/components/duel/DeckBuilder';
import { LookEditor } from '@/components/city/LookEditor';
import { BUILDING_INFO, houseInfo, MURAL_TEXT, NPCS, type NpcDef } from '@/game/world/content';
import { useOccludesBackdrop } from '@/hooks/useOccludesBackdrop';
import { drawAmbient } from '@/game/world/ambient';
import { PLATE_NPC, PLATE_PLAYER } from '@/game/world/nameplate';
import { drawJob, jobBob, propsBehind } from '@/game/world/jobs';

/**
 * Protótipo jogável da Cidade WIT: andar pela cidade (setas/WASD ou toque),
 * conversar com moradores (espaço) e ver o que cada prédio vai ter.
 * Rota: /cidade-demo
 */

/** ?passeio=1: o boneco passeia sozinho (para medir desempenho e gravar vídeo). */
const TOUR: [number, number][] = [[31, 23], [16, 21], [16, 19], [10, 27], [16, 32], [16, 31], [46, 33], [46, 31], [57, 21], [51, 14], [48, 10], [7, 11], [7, 9], [26, 13], [31, 23], [31, 40], [14, 42], [14, 41], [31, 33]];
const WALK_MS = 230, RUN_MS = 125, BOAT_MS = 190;
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

interface Npc {
  def: NpcDef; w: Walker; frames: Frames | null; goal: Dir | null;
  /** Moradores com rota: caminho até a próxima parada, tempo parado e parada atual. */
  path: Dir[]; wait: number; stop: number; seed: number;
}

/** Onde e como o jogador chega numa área (vindo de outra). */
interface Arrival { tx: number; ty: number; dir: Dir }

/** Pesca em andamento: lançando, esperando, mordeu, minijogo. */
interface Fishing {
  phase: 'cast' | 'wait' | 'bite' | 'meter';
  t: number;
  tile: { tx: number; ty: number };
  biteAt: number;
  deep: boolean;
  catch?: { fish: Fish; cm: number };
  meter?: Meter;
}

type FishUi =
  | { kind: 'meter'; meter: Meter; t0: number }
  | { kind: 'catch'; fish: Fish; cm: number; first: boolean; record: boolean }
  | { kind: 'toast'; text: string };

const BASE = import.meta.env.BASE_URL;

export default function CityDemo() {
  // a cidade cobre a tela inteira: o fundo 3D do app não precisa desenhar
  useOccludesBackdrop();
  const [world, setWorld] = useState<{ town: Town; start?: Arrival; hour: number; n: number } | null>(null);
  const [fade, setFade] = useState(false);
  const assets = useRef<WorldAssets | null | undefined>(undefined);
  const load = useCallback(async (zone: ZoneId, start: Arrival | undefined, hour: number) => {
    // ?casa=modelo-gamer mostra a Sua Casa com outro modelo (as 3 iniciais e as 7 à venda)
    const casa = new URLSearchParams(window.location.search).get('casa') ?? undefined;
    if (assets.current === undefined) {
      assets.current = await loadWorldAssets().catch(err => { console.error('sprites da cidade', err); return null; });
    }
    const A = assets.current ?? undefined;
    const g = A ? await loadPrebuiltGround(`${BASE}game/world/${zone}`) : undefined;
    const town = buildZone(zone, A, { casa, groundHd: g?.pix, groundKey: g?.key });
    setWorld(w => ({ town, start, hour, n: (w?.n ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const z = q.get('zona') as ZoneId | null;
    void load(z && ZONES.includes(z) ? z : 'cidade', undefined, 8);
  }, [load]);
  // troca de área: escurece, monta a outra (com o chão pronto dela) e clareia
  const travel = useCallback((to: ZoneId, at: Arrival | undefined, hour: number) => {
    setFade(true);
    window.setTimeout(() => { void load(to, at, hour).then(() => window.setTimeout(() => setFade(false), 60)); }, 280);
  }, [load]);
  if (!world) {
    return <div className="fixed inset-0 bg-[#1b2a22] flex items-center justify-center text-white/80 text-xs font-['Press_Start_2P',monospace]">carregando a cidade...</div>;
  }
  return (
    <>
      <CityView key={world.n} town={world.town} start={world.start} startHour={world.hour} onTravel={travel} />
      <div className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-300 z-50" style={{ opacity: fade ? 1 : 0 }} />
    </>
  );
}

function startTile(town: Town): { tx: number; ty: number } {
  const m = /^(\d+),(\d+)$/.exec(new URLSearchParams(window.location.search).get('pos') ?? '');
  if (m) {
    const tx = Number(m[1]), ty = Number(m[2]);
    if (!town.solid[ty]?.[tx]) return { tx, ty };
  }
  return town.spawn;
}

function CityView({ town, start, startHour, onTravel }: {
  town: Town;
  start?: Arrival;
  startHour: number;
  onTravel: (to: ZoneId, at: Arrival | undefined, hour: number) => void;
}) {
  const START = start ?? { ...startTile(town), dir: 'north' as Dir };
  // moradores desta área
  const [npcDefs] = useState(() => NPCS.filter(n => (n.zona ?? 'cidade') === town.id));
  const firstQuery = useRef(!start);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panel, setPanel] = useState<{ title: string; text: string } | null>(null);
  const [dialog, setDialog] = useState<{ lines: string[]; i: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const [view, setView] = useState({ w: 320, h: 208, scale: 3 });
  const [clock, setClock] = useState(startHour);
  const [banner, setBanner] = useState<string | null>(town.name);
  const [mapOpen, setMapOpen] = useState(false);
  const [fishHouse, setFishHouse] = useState<'quadro' | 'vender' | null>(null);
  const [fishUi, setFishUi] = useState<FishUi | null>(null);
  const [farmPanel, setFarmPanel] = useState<'sementes' | 'envio' | null>(null);
  /** Só para redesenhar a barra da fazenda (semente escolhida, água). */
  const [, setFarmHud] = useState(0);
  const fields = town.spots.filter(sp => sp.kind === 'campo').map(sp => ({ x0: sp.tx, y0: sp.ty, x1: sp.data!.x1 as number, y1: sp.data!.y1 as number }));
  useEffect(() => { const t = window.setTimeout(() => setBanner(null), 2600); return () => window.clearTimeout(t); }, []);
  const [near, setNear] = useState<string | null>(null);
  const [look, setLook] = useState<Look>(savedLook);
  const [editing, setEditing] = useState(() => new URLSearchParams(window.location.search).has('visual'));
  // ?sala=torre&andar=5 ou ?sala=casa começa dentro (prints e testes)
  const [deckOpen, setDeckOpen] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  useEffect(() => {
    const on = (e: Event) => setProgress((e as CustomEvent<Progress>).detail);
    window.addEventListener('wit-progresso', on);
    return () => window.removeEventListener('wit-progresso', on);
  }, []);
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
    player: newWalker(START.tx, START.ty, START.dir),
    pet: newWalker(START.tx - DELTA[START.dir][0], START.ty - DELTA[START.dir][1], START.dir),
    npcs: npcDefs.map((def, i) => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null, goal: null, path: [], wait: 800 + i * 700, stop: 0, seed: (i * 0.618034) % 1 })) as Npc[],
    /** Navegando no barquinho (e onde ele fica amarrado quando não está). */
    sailing: false,
    boat: ((): { tx: number; ty: number; dir: Dir } | null => {
      const sp = town.spots.find(p => p.kind === 'barco');
      return sp ? { tx: sp.tx, ty: sp.ty, dir: (sp.data?.dir as Dir) ?? 'east' } : null;
    })(),
    boatCanvases: null as Record<Dir, HTMLCanvasElement> | null,
    fish: null as Fishing | null,
    critters: [] as Critter[],
    critterCanvases: {} as Partial<Record<CritterKind, { west: HTMLCanvasElement[]; east: HTMLCanvasElement[] }>>,
    /** Fazenda (guardada no navegador): campos, caixa de envio, regador. */
    farm: loadFarm(Date.now(), town.id === 'fazenda' ? (() => { const sp = town.spots.find(p => p.kind === 'campo'); return sp ? { x0: sp.tx, y0: sp.ty } : undefined; })() : undefined) as FarmState,
    seed: null as CropId | null,
    soil: null as { dry: HTMLCanvasElement; wet: HTMLCanvasElement } | null,
    cropCanvas: new Map<string, HTMLCanvasElement>(),
    /** Ferramenta em uso (animação curta): enxada, regador, semente, colheita. */
    act: null as { kind: 'arar' | 'regar' | 'plantar' | 'colher' | 'encher'; t: number; tx: number; ty: number; icon?: string } | null,
    water: null as WaterAnim | null,
    /** Já saiu pela borda (espera a outra área montar). */
    leaving: false,
    held: [] as Dir[],
    run: false,
    /** Sentado num banco: o bloco do banco e de onde veio (para levantar). */
    seat: null as { tx: number; ty: number; dx: number; from: { tx: number; ty: number } } | null,
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
    /** Cúpula acesa de cada poste (os postes acendem um a um, fora da camada da noite). */
    lampNights: [] as (HTMLCanvasElement | null)[],
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
    /** Hora do jogo (0–24); continua a mesma ao trocar de área. */
    hour: startHour,
    hourSeen: startHour,
    clockSpeed: 1,
    modal: false,
    inside: false,
    dirty: true,
  });

  useEffect(() => {
    g.current.modal = !!panel || !!dialog || editing || !!inside || deckOpen || mapOpen || !!fishHouse || fishUi?.kind === 'catch' || !!farmPanel;
    g.current.inside = !!inside; g.current.dirty = true;
  }, [panel, dialog, editing, inside, deckOpen, mapOpen, fishHouse, fishUi, farmPanel]);

  // fazenda: se ficou fora um dia (12 min) ou mais, vira um dia ao chegar
  useEffect(() => {
    const cu = catchUp(g.current.farm, Date.now());
    if (!cu) return;
    g.current.farm = cu.farm; saveFarm(cu.farm);
    if (cu.paid) { const pr = loadProgress(); saveProgress({ ...pr, coins: pr.coins + cu.paid }); }
    if (cu.paid || town.id === 'fazenda') setFishUi({ kind: 'toast', text: `☀ Dia ${cu.farm.day} na fazenda!${cu.paid ? ` A caixa de envio pagou ${cu.paid} moedas.` : ''}` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    g.current.lampNights = town.lamps.map(l => (l.night ? toCanvasHd(l.night) : null));
    g.current.animRates = [...new Set(g.current.anims.map(a => a.o.frameMs ?? 500))];
    const scene = toCanvasHd(town.ground);
    const sctx = scene.getContext('2d')!;
    for (const { o, c } of g.current.objs) sctx.drawImage(c, o.x * R, o.y * R);
    g.current.scene = scene;
    if (g.current.boat || town.spots.some(p => p.kind === 'barco')) {
      g.current.boatCanvases = { north: toCanvasHd(boatArt('north')), south: toCanvasHd(boatArt('south')), east: toCanvasHd(boatArt('east')), west: toCanvasHd(boatArt('west')) };
    }
    const cc = g.current.critterCanvases;
    if (town.id === 'lago') {
      g.current.critters = spawnCritters(town, 'pato', 6, { x0: 0, y0: 0, x1: town.solid[0].length, y1: town.solid.length }, 7);
      cc.pato = { west: duckFrames('west').map(toCanvasHd), east: duckFrames('east').map(toCanvasHd) };
    }
    if (town.id === 'fazenda') {
      const pen = (r: typeof PASTURE) => ({ x0: r.x0, y0: r.y0, x1: r.x1 + 1, y1: r.y1 + 1 });
      g.current.critters = [
        ...spawnCritters(town, 'vaca', 3, pen(PASTURE), 3), ...spawnCritters(town, 'ovelha', 3, pen(PASTURE), 5),
        ...spawnCritters(town, 'galinha', 6, pen(HENYARD), 9),
        ...spawnCritters(town, 'pato', 3, { x0: 0, y0: 28, x1: 22, y1: 44 }, 11),
      ];
      cc.vaca = { west: cowFrames(-1).map(toCanvasHd), east: cowFrames(1).map(toCanvasHd) };
      cc.ovelha = { west: sheepFrames(-1).map(toCanvasHd), east: sheepFrames(1).map(toCanvasHd) };
      cc.galinha = { west: chickenFrames(-1).map(toCanvasHd), east: chickenFrames(1).map(toCanvasHd) };
      cc.pato = { west: duckFrames('west').map(toCanvasHd), east: duckFrames('east').map(toCanvasHd) };
      g.current.soil = { dry: toCanvasHd(soilArt(false)), wet: toCanvasHd(soilArt(true)) };
    }
    g.current.water = makeWaterAnim(town);
    const qs = new URLSearchParams(window.location.search);
    const h = qs.get('hora'), v = Number(qs.get('velocidade'));
    if (firstQuery.current && h !== null && !Number.isNaN(Number(h))) { g.current.hour = Number(h) % 24; setClock(g.current.hour); }
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
        ...npcDefs.map(n => loadLookFrames(normalizeLook(n.look))),
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

  const inMap = (tx: number, ty: number) => tx >= 0 && ty >= 0 && ty < town.solid.length && tx < town.solid[0].length;
  /** Água aberta (onde o barco anda): água que não é cais nem ponte. */
  const openWater = useCallback((tx: number, ty: number) => town.terrain[ty]?.[tx] === 'agua' && !!town.solid[ty]?.[tx], [town]);
  const npcAt = (tx: number, ty: number) => g.current.npcs.some(n => n.w.tx === tx && n.w.ty === ty);
  const boatAt = (tx: number, ty: number) => !!g.current.boat && g.current.boat.tx === tx && g.current.boat.ty === ty;
  /** Onde o jogador não pode ir (a pé ou de barco). */
  const blocked = useCallback((tx: number, ty: number) => {
    if (!inMap(tx, ty)) return true;
    if (g.current.sailing) return !openWater(tx, ty) || npcAt(tx, ty);
    if (town.solid[ty][tx]) return true;
    return npcAt(tx, ty);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [town, openWater]);

  const toast = (text: string) => setFishUi({ kind: 'toast', text });
  useEffect(() => {
    if (fishUi?.kind !== 'toast') return;
    const t = window.setTimeout(() => setFishUi(u => (u?.kind === 'toast' ? null : u)), 1800);
    return () => window.clearTimeout(t);
  }, [fishUi]);

  /** Quantos blocos de água em volta (água funda = longe da margem). */
  const deepAt = (tx: number, ty: number) => {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (town.terrain[ty + dy]?.[tx + dx] !== 'agua') return false;
    return true;
  };

  /** Espaço durante a pesca: puxar cedo, fisgar ou acertar a faixa. */
  const fishPress = useCallback(() => {
    const s = g.current, f = s.fish;
    if (!f) return;
    const now = performance.now();
    if (f.phase === 'cast' || f.phase === 'wait') { s.fish = null; toast('Puxou cedo demais... Espere a boia afundar!'); return; }
    if (f.phase === 'bite') {
      const night = s.hour >= 19 || s.hour < 5;
      const c = rollFish({ deep: f.deep, night, boat: s.sailing }, Math.random(), Math.random());
      f.catch = c; f.meter = meterFor(c.fish, Math.random()); f.phase = 'meter'; f.t = now;
      setFishUi({ kind: 'meter', meter: f.meter, t0: now });
      play('flip');
      return;
    }
    if (f.phase === 'meter' && f.meter && f.catch) {
      const hit = meterHit(f.meter, now - f.t);
      s.fish = null;
      if (!hit) { play('lose'); toast('Escapou! Aperte quando a agulha estiver no verde.'); return; }
      const r = addCatch(loadProgress(), f.catch.fish.id, f.catch.cm);
      saveProgress(r.progress);
      play(f.catch.fish.rarity === 'lendario' || f.catch.fish.rarity === 'epico' ? 'win' : 'coin');
      setFishUi({ kind: 'catch', fish: f.catch.fish, cm: f.catch.cm, first: r.first, record: r.record });
    }
  }, []);

  /** Troca a semente escolhida entre as que o aluno tem. */
  const cycleSeed = (d: number) => {
    const s = g.current, pr = loadProgress();
    const owned = CROPS.filter(c => (pr.itens[`semente:${c.id}`] ?? 0) > 0).map(c => c.id);
    if (!owned.length) { s.seed = null; setFarmHud(n => n + 1); return; }
    const i = s.seed ? owned.indexOf(s.seed) : -1;
    s.seed = owned[(i + d + owned.length) % owned.length];
    play('click'); setFarmHud(n => n + 1);
  };

  const fillCan = () => {
    const s = g.current;
    s.farm = applyAction(s.farm, 0, 0, { kind: 'encher' }).farm; saveFarm(s.farm);
    const f = ahead(s.player);
    s.act = { kind: 'encher', t: performance.now(), tx: f.tx, ty: f.ty };
    play('draw'); toast(`Regador cheio! 💧 ${CAN_SIZE}/${CAN_SIZE}`);
    setFarmHud(n => n + 1);
  };

  const interact = useCallback(() => {
    const s = g.current;
    if (fishUi?.kind === 'catch') { setFishUi(null); return; }
    if (s.fish) { fishPress(); return; }
    if (dialog) {
      if (dialog.i + 1 < dialog.lines.length) setDialog({ ...dialog, i: dialog.i + 1 });
      else setDialog(null);
      return;
    }
    if (panel) { setPanel(null); return; }
    if (g.current.modal) return;
    const p = s.player;
    const f = ahead(p);
    const npc = s.npcs.find(n => n.w.tx === f.tx && n.w.ty === f.ty);
    if (npc) {
      const back: Record<Dir, Dir> = { north: 'south', south: 'north', west: 'east', east: 'west' };
      npc.w.dir = back[p.dir];
      setDialog({ lines: npc.def.lines, i: 0 });
      return;
    }
    const startFishing = () => {
      const now = performance.now();
      const deep = deepAt(f.tx, f.ty);
      const night = s.hour >= 19 || s.hour < 5;
      s.fish = { phase: 'cast', t: now, tile: { tx: f.tx, ty: f.ty }, biteAt: now + 450 + biteDelay(Math.random(), { deep, night }), deep };
      s.held = []; s.path = [];
      play('draw');
    };
    if (p.from) return;
    // no barco: desce se estiver de frente para a terra; senão, pesca
    if (s.sailing) {
      if (inMap(f.tx, f.ty) && !town.solid[f.ty][f.tx] && !npcAt(f.tx, f.ty)) {
        s.sailing = false;
        s.boat = { tx: p.tx, ty: p.ty, dir: p.dir };
        p.tx = f.tx; p.ty = f.ty;
        s.pet = newWalker(f.tx, f.ty, p.dir);
        s.dirty = true;
        play('drop');
        return;
      }
      if (openWater(f.tx, f.ty)) startFishing();
      return;
    }
    // embarca no barquinho
    if (boatAt(f.tx, f.ty)) {
      const b = s.boat!;
      s.sailing = true;
      p.tx = b.tx; p.ty = b.ty;
      s.boat = null; s.path = []; s.held = [];
      s.dirty = true;
      play('drop');
      return;
    }
    // objetos com que se fala de frente
    const spot = town.spots.find(sp => sp.tx === f.tx && sp.ty === f.ty && sp.kind !== 'cais' && sp.kind !== 'ponte');
    if (spot) {
      const lines = spot.data?.lines as string[] | undefined;
      switch (spot.kind) {
        case 'placa': if (lines) { setDialog({ lines, i: 0 }); return; } break;
        case 'mural': setDialog({ lines: MURAL_TEXT, i: 0 }); return;
        case 'correio':
          setDialog({ lines: spot.data?.own ? ['Sua caixa de correio. Nenhuma carta nova.', 'Em breve: recados dos colegas e do professor chegam aqui.'] : ['A caixa de correio de um morador. Não é sua!'], i: 0 });
          return;
        case 'fonte': play('coin'); setDialog({ lines: ['Você jogou uma moedinha imaginária na fonte e fez um pedido...', '✨ Tomara que venha uma carta Mítica no próximo pacotinho!'], i: 0 }); return;
        case 'maquina': setDialog({ lines: ['Máquina de sucos: uva, laranja e maracujá.', 'Quando a fome chegar ao jogo, um suco daqui vai ajudar.'], i: 0 }); return;
        case 'banca': setFishHouse('vender'); return;
        case 'castelo-areia': setDialog({ lines: ['Um castelo de areia caprichado, com bandeirinha e tudo.', 'Melhor não pisar!'], i: 0 }); return;
        case 'fogueira': setDialog({ lines: ['A fogueira do acampamento estala e esquenta.', 'À noite, os vaga-lumes aparecem por aqui.'], i: 0 }); return;
        case 'sementes': setFarmPanel('sementes'); return;
        case 'caixa-envio': setFarmPanel('envio'); return;
        case 'poco': fillCan(); return;
        case 'ninho': {
          const fm = s.farm;
          if (fm.eggsDay >= fm.day) { toast('Você já pegou os ovos de hoje. Volte amanhã!'); return; }
          const n = s.critters.filter(c => c.kind === 'galinha').length || 4;
          s.farm = { ...fm, eggsDay: fm.day }; saveFarm(s.farm);
          saveProgress(addItem(loadProgress(), 'ovo', n));
          s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: '🥚' };
          play('coin'); toast(`+${n} ovos! Venda na caixa de envio.`);
          return;
        }
        case 'fruta': {
          const tree = `arvore-${spot.data!.tree as string}`, fm = s.farm;
          if ((fm.milked[tree] ?? 0) >= fm.day) { toast('Esta árvore já deu fruta hoje.'); return; }
          const fruit = `fruta:${spot.data!.fruit as string}`;
          s.farm = { ...fm, milked: { ...fm.milked, [tree]: fm.day } }; saveFarm(s.farm);
          saveProgress(addItem(loadProgress(), fruit, 3));
          s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: iconOf(fruit) };
          play('coin'); toast(`+3 ${itemName(fruit)}!`);
          return;
        }
      }
    }
    // bicho na frente: tirar leite, tosar, fazer carinho
    const critter = s.critters.find(c => Math.floor(c.x / TILE) === f.tx && Math.floor((c.y - 4) / TILE) === f.ty && c.kind !== 'pato');
    if (critter) {
      const id = `${critter.kind}-${s.critters.indexOf(critter)}`, fm = s.farm;
      if (critter.kind === 'galinha') { play('click'); toast('Có-có-có! 🐔'); return; }
      if ((fm.milked[id] ?? 0) >= fm.day) { toast(critter.kind === 'vaca' ? 'Esta vaca já deu leite hoje. 🐄' : 'Esta ovelha já foi tosada hoje. 🐑'); return; }
      const item = critter.kind === 'vaca' ? 'leite' : 'la';
      s.farm = { ...fm, milked: { ...fm.milked, [id]: fm.day } }; saveFarm(s.farm);
      saveProgress(addItem(loadProgress(), item, 1));
      critter.wait = 3000; critter.gx = critter.x; critter.gy = critter.y;
      s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: iconOf(item) };
      play('coin'); toast(critter.kind === 'vaca' ? '+1 Leite! 🥛' : '+1 Lã! 🧶');
      return;
    }
    // campo: a ação certa para o bloco (arar, plantar, regar, colher)
    if (fields.some(fd => f.tx >= fd.x0 && f.tx <= fd.x1 && f.ty >= fd.y0 && f.ty <= fd.y1) && !town.solid[f.ty][f.tx] && !npcAt(f.tx, f.ty)) {
      const pr = loadProgress();
      const seeds = s.seed ? pr.itens[`semente:${s.seed}`] ?? 0 : 0;
      const a = actionAt(s.farm, f.tx, f.ty, s.seed, seeds);
      if (a.kind === 'nada') { toast(a.why); return; }
      const r = applyAction(s.farm, f.tx, f.ty, a);
      s.farm = r.farm; saveFarm(r.farm);
      if (a.kind === 'plantar') saveProgress(addItem(pr, `semente:${a.crop}`, -1));
      if (r.harvested) saveProgress(addItem(pr, `colheita:${r.harvested}`, 1));
      s.act = { kind: a.kind === 'colher' ? 'colher' : a.kind === 'plantar' ? 'plantar' : a.kind === 'regar' ? 'regar' : 'arar', t: performance.now(), tx: f.tx, ty: f.ty, icon: r.harvested ? iconOf(r.harvested) : undefined };
      play(a.kind === 'colher' ? 'coin' : a.kind === 'regar' ? 'draw' : 'drop');
      s.dirty = true; setFarmHud(n => n + 1);
      return;
    }
    // banco: senta (qualquer seta levanta)
    if (!s.seat) {
      const bench = town.objects.find(o => o.id.startsWith('banco') && f.ty === Math.floor((o.baseY - 1) / TILE)
        && f.tx >= Math.floor(o.x / TILE) && f.tx < Math.ceil((o.x + o.pix.w) / TILE));
      if (bench) {
        s.seat = { tx: f.tx, ty: f.ty, dx: Math.round(bench.x + bench.pix.w / 2 - (f.tx * TILE + 8)), from: { tx: p.tx, ty: p.ty } };
        p.tx = f.tx; p.ty = f.ty; p.dir = 'south'; s.path = []; s.held = [];
        s.dirty = true;
        return;
      }
    }
    // de frente para a água: na fazenda, enche o regador (se não estiver cheio); senão, pesca
    if (openWater(f.tx, f.ty)) {
      if (town.id === 'fazenda' && s.farm.water < CAN_SIZE) { fillCan(); return; }
      startFishing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, panel, town, fishUi, fishPress, openWater]);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (d && g.current.seat) {
        // levanta e volta para onde estava
        e.preventDefault();
        const st = g.current.seat; g.current.seat = null;
        g.current.player.tx = st.from.tx; g.current.player.ty = st.from.ty; g.current.player.dir = d;
        g.current.dirty = true;
        return;
      }
      if (d) {
        e.preventDefault();
        // andar recolhe a linha
        if (g.current.fish && g.current.fish.phase !== 'meter') { g.current.fish = null; g.current.dirty = true; }
        if (!g.current.held.includes(d)) g.current.held.unshift(d);
        g.current.path = [];
      }
      if (e.key === 'Shift') g.current.run = true;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); interact(); }
      if (e.key === 'Escape') { setPanel(null); setDialog(null); setEditing(false); setDeckOpen(false); setMapOpen(false); setFishHouse(null); }
      if ((e.key === 'm' || e.key === 'M') && !g.current.inside) setMapOpen(o => !o);
      // T: avança 2 horas (para ver o dia e a noite sem esperar)
      if (e.key === 't' || e.key === 'T') { g.current.hour = (g.current.hour + 2) % 24; g.current.dirty = true; }
      // Q / E: troca a semente escolhida (fazenda)
      if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') cycleSeed(e.key.toLowerCase() === 'e' ? 1 : -1);
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
    let wasSailing = false;

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
        else if (door.building === 'casa-pesca') setFishHouse('quadro');
        else if (door.building === 'farol') { setDialog({ lines: ['Você sobe a escada em caracol do farol...', 'Lá de cima dá para ver o mundo todo!'], i: 0 }); window.setTimeout(() => setMapOpen(true), 50); s.player.ty += 1; s.player.dir = 'south'; }
        else setPanel(BUILDING_INFO[door.building] ?? houseInfo(door.building, door.name));
        return;
      }
      // saída pela borda: passa para a área do lado
      if (s.sailing || s.leaving) return;
      const ex = town.exits.find((e: Exit) => s.player.tx >= e.x0 && s.player.tx <= e.x1 && s.player.ty >= e.y0 && s.player.ty <= e.y1);
      if (!ex) return;
      s.path = []; s.held = [];
      if (!ZONES.includes(ex.to)) {
        // área ainda em obras: volta um passo
        const back = DELTA[s.player.dir];
        s.player.tx -= back[0]; s.player.ty -= back[1];
        s.player.dir = ({ north: 'south', south: 'north', west: 'east', east: 'west' } as const)[s.player.dir];
        setDialog({ lines: [`${ZONE_NAMES[ex.to]}: em obras!`, 'Esta parte do mundo abre em breve.'], i: 0 });
        return;
      }
      s.leaving = true;
      const off = ex.keep === 'y' ? s.player.ty - ex.y0 : s.player.tx - ex.x0;
      const at = ex.keep === 'y' ? { tx: ex.at.tx, ty: ex.at.ty + off } : { tx: ex.at.tx + off, ty: ex.at.ty };
      onTravel(ex.to, { ...at, dir: ex.dir }, s.hour);
    };

    // 6h: vira o dia da fazenda (planta regada cresce, caixa de envio paga)
    const newDay = () => {
      const s = g.current;
      const r = nextDay(s.farm, Date.now());
      s.farm = r.farm; saveFarm(r.farm);
      if (r.paid) { const pr = loadProgress(); saveProgress({ ...pr, coins: pr.coins + r.paid }); play('coin'); }
      if (r.paid || town.id === 'fazenda') setFishUi({ kind: 'toast', text: `☀ Dia ${r.farm.day}!${r.paid ? ` A caixa de envio pagou ${r.paid} moedas.` : ''}${r.grown ? ` ${r.grown} planta${r.grown > 1 ? 's' : ''} cresce${r.grown > 1 ? 'ram' : 'u'}.` : ''}` });
      setFarmHud(n => n + 1);
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
      if (s.sailing !== wasSailing) { wasSailing = s.sailing; petQueue.length = 0; }
      tick(p, dt, {
        msPerTile: s.sailing ? BOAT_MS : ms,
        blocked,
        fromPath: !s.held.length,
        want: () => (s.modal || s.fish || (s.act && now - s.act.t < 350) ? null : s.held[0] ?? s.path[0] ?? null),
        onStep: from => { if (!s.sailing) petQueue.push(from); if (!s.held.length) s.path.shift(); s.dirty = true; },
        onArrive: onStepDone,
      });
      // pesca: a boia cai, espera, o peixe morde; sem resposta, ele foge
      const fi = s.fish;
      cv.dataset.pesca = fi?.phase ?? '';   // (para os testes de navegador)
      if (fi) {
        s.dirty = true;
        if (fi.phase === 'cast' && now - fi.t > 450) { fi.phase = 'wait'; fi.t = now; play('drop'); }
        else if (fi.phase === 'wait' && now >= fi.biteAt) { fi.phase = 'bite'; fi.t = now; play('trap'); }
        else if (fi.phase === 'bite' && now - fi.t > 1300) { s.fish = null; setFishUi({ kind: 'toast', text: 'O peixe fugiu... Aperte ESPAÇO assim que a boia afundar!' }); }
        else if (fi.phase === 'meter' && now - fi.t > 6000) { s.fish = null; setFishUi({ kind: 'toast', text: 'Escapou!' }); }
      }
      // bichos soltos (patos no lago)
      if (s.critters.length && stepCritters(s.critters, dt, town, Math.random)) s.dirty = true;
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
        if (n && !s.modal && !n.w.from && !n.def.job) {
          const home = n.w.tx === n.def.tx && n.w.ty === n.def.ty;
          const back: Dir = n.def.tx > n.w.tx ? 'east' : n.def.tx < n.w.tx ? 'west' : n.def.ty > n.w.ty ? 'south' : 'north';
          if (home && Math.random() < 0.5) n.goal = DIRS[Math.floor(Math.random() * 4)];
          else if (!home) n.goal = back;
          else n.w.dir = DIRS[Math.floor(Math.random() * 4)];
          s.dirty = true;
        }
      }
      for (const n of s.npcs) {
        const occupied = (tx: number, ty: number) => !inMap(tx, ty) || town.solid[ty][tx] || npcAt(tx, ty)
          || (p.tx === tx && p.ty === ty) || (!s.sailing && pet.tx === tx && pet.ty === ty)
          || town.doors.some(d => d.tx === tx && d.ty === ty);
        const route = n.def.job?.route;
        if (route && !s.modal && !n.w.from && !n.path.length) {
          // chegou: fica um tempo na parada, olhando para o trabalho; depois vai para a próxima
          if (n.wait > 0) n.wait -= dt;
          else {
            n.stop = (n.stop + 1) % route.length;
            const [gx, gy] = route[n.stop];
            n.path = findPath(n.w.tx, n.w.ty, gx, gy, (x, y) => x < 0 || y < 0 || y >= town.solid.length || x >= town.solid[0].length || town.solid[y][x] || town.doors.some(d => d.tx === x && d.ty === y));
            if (!n.path.length) n.wait = 3000;
          }
        }
        tick(n.w, dt, {
          msPerTile: WALK_MS * 1.4,
          blocked: occupied,
          fromPath: true,
          want: () => {
            if (route) return s.modal ? null : n.path[0] ?? null;
            const gd = n.goal; n.goal = null; return gd;
          },
          onStep: () => { if (route) n.path.shift(); },
          onArrive: () => {
            if (!route || n.path.length) return;
            const [, , face] = route[n.stop];
            const [a, b] = n.def.job?.pause ?? [2000, 4000];
            n.w.dir = face; n.wait = a + Math.random() * (b - a); s.dirty = true;
          },
        });
        if (n.w.from) s.dirty = true;
      }
      // quadros de animação dos objetos
      // (só o relógio de cada ritmo: com a fase, cada objeto troca de quadro junto com o seu ritmo)
      const animKey = s.animRates.map(ms => Math.floor(now / ms)).join(',');
      if (animKey !== lastAnimKey) { lastAnimKey = animKey; s.dirty = true; }
      // relógio do jogo: a luz muda aos poucos; à noite os pulsos correm nos circuitos
      s.hour = (s.hour + (dt * s.clockSpeed) / MS_PER_HOUR) % 24;
      if (s.hourSeen < 6 && s.hour >= 6) newDay();
      s.hourSeen = s.hour;
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
      // ondas do lago grande (desenhadas na hora, por cima da água da cena)
      if (s.water) drawWaterAnim(ctx, s.water, now, camX, camY, vw, vh, R, 0.85 * ((q[0] + q[1] + q[2]) / 765) ** 1.5);
      // terra arada da fazenda (seca ou molhada), no chão
      if (s.soil) {
        const shade = white ? null : `rgb(${q[0]},${q[1]},${q[2]})`;
        for (const [k, pl] of Object.entries(s.farm.plots)) {
          const [tx, ty] = k.split(',').map(Number);
          const x = tx * TILE - camX, y = ty * TILE - camY;
          if (x < -TILE || x > vw || y < -TILE || y > vh) continue;
          const c = pl.wet ? s.soil.wet : s.soil.dry;
          ctx.drawImage(shade ? tinted(c, q.join(','), shade) : c, x, y, TILE, TILE);
        }
      }
      // postes: cada um acende na sua hora (pisca antes de firmar); poça de luz no chão
      const lampsOn = lit ? town.lamps.map((l, i) => ({ l, i, on: lampPower(s.hour, l.seed) }))
        .filter(({ l, on }) => on > 0 && l.bulb[0] > camX - 40 && l.bulb[0] < camX + vw + 40 && l.bulb[1] > camY - 60 && l.bulb[1] < camY + vh + 60) : [];
      if (lampsOn.length) {
        ctx.globalCompositeOperation = 'lighter';
        const k = Math.min(1, tod.light * 1.3);
        for (const { l } of lampsOn) {
          const [gx, gy] = [l.ground[0] - camX, l.ground[1] - camY];
          ctx.save();
          ctx.translate(gx, gy); ctx.scale(1, 0.55);
          const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
          gr.addColorStop(0, `rgba(255,206,130,${0.42 * k})`);
          gr.addColorStop(0.6, `rgba(255,170,90,${0.16 * k})`);
          gr.addColorStop(1, 'rgba(255,170,90,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(-30, -30, 60, 60);
          ctx.restore();
          // facho da lâmpada até o chão
          const [bx, by] = [l.bulb[0] - camX, l.bulb[1] - camY];
          const cone = ctx.createLinearGradient(0, by, 0, gy);
          cone.addColorStop(0, `rgba(255,220,150,${0.2 * k})`);
          cone.addColorStop(1, 'rgba(255,200,130,0)');
          ctx.fillStyle = cone;
          ctx.beginPath(); ctx.moveTo(bx - 3, by + 2); ctx.lineTo(bx + 3, by + 2); ctx.lineTo(bx + 14, gy); ctx.lineTo(bx - 14, gy); ctx.closePath(); ctx.fill();
        }
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
      const person = (w: Walker, fr: Frames | null, bob = 0) => {
        if (!fr) return;
        const pos = pixelPos(w, TILE);
        // cada passo usa metade dos quadros da caminhada (6 da PixelLab, 4 dos modelos)
        const n = fr.walk[w.dir].length;
        const frameMs = (w === s.player && s.run ? RUN_MS : WALK_MS) / (n / 2);
        const img = fr.walk[w.dir][w.anim > 0 ? Math.floor(w.anim / frameMs) % n : 0];
        const wx = Math.round(pos.x + 8 - fr.w / 2), wy = Math.round(pos.y + 15 - fr.foot[w.dir]);
        const x = wx - camX, y = wy - camY + bob;
        if (x > vw || y > vh || x < -32 || y < -48) return;
        people.push({ x: wx, y: wy, w: fr.w, h: 40, baseY: pos.y + 16 });
        list.push({
          baseY: pos.y + 16,
          draw: () => {
            const tx = Math.round(pos.x / TILE), ty = Math.round(pos.y / TILE);
            if (w === s.player && s.sailing && s.boatCanvases) {
              // no barco: o casco, o boneco da cintura para cima, os remos
              const bc = s.boatCanvases[w.dir], bob = Math.sin(now / 420) * 0.6;
              const bxc = pos.x + 8 - camX, byc = pos.y + 9 - camY + bob;
              put(bc, Math.round(bxc - bc.width / R / 2), Math.round(byc - bc.height / R / 2));
              drawOars(ctx, bxc, byc, w.dir, !!w.from, now);
              const CUT = 13, src = white ? img : tinted(img, tintKey, tintCss);
              ctx.drawImage(src, 0, 0, src.width, src.height - CUT * R, x, y + bob - 2, src.width / R, src.height / R - CUT);
              return;
            }
            const inGrass = town.terrain[ty]?.[tx] === 'mato';
            if (!inGrass && !(w === s.player && s.seat)) {
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
            if (w === s.player && s.seat) {
              // sentado: as pernas somem atrás do assento e o corpo desce um pouco
              const CUT = 6, src = white ? img : tinted(img, tintKey, tintCss);
              ctx.drawImage(src, 0, 0, src.width, src.height - CUT * R, x + s.seat.dx, y + 2, src.width / R, src.height / R - CUT);
            } else put(img, x, y);
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
      if (!s.sailing) person(s.pet, s.petFrames);
      // barquinho amarrado
      if (s.boat && s.boatCanvases) {
        const b = s.boat, bc = s.boatCanvases[b.dir];
        const bx = b.tx * TILE + 8 - camX, by = b.ty * TILE + 9 - camY + Math.sin(now / 520) * 0.6;
        if (bx > -40 && bx < vw + 40 && by > -40 && by < vh + 40) {
          list.push({ baseY: b.ty * TILE + 12, draw: () => put(bc, Math.round(bx - bc.width / R / 2), Math.round(by - bc.height / R / 2)) });
          people.push({ x: b.tx * TILE - 8, y: b.ty * TILE - 6, w: 32, h: 28, baseY: b.ty * TILE + 12 });
        }
      }
      // bichos soltos: patos, galinhas, vacas, ovelhas
      for (const c of s.critters) {
        const set = s.critterCanvases[c.kind];
        const cx = c.x - camX, cy = c.y - camY;
        if (!set || cx < -30 || cx > vw + 30 || cy < -30 || cy > vh + 30) continue;
        const frames = c.face > 0 ? set.east : set.west;
        const moving = Math.hypot(c.gx - c.x, c.gy - c.y) > 0.5;
        const fc = frames[c.kind === 'pato' ? Math.floor(now / 450 + c.seed * 4) % frames.length : moving ? Math.floor(now / 220) % frames.length : c.kind === 'galinha' && Math.sin(now / 700 + c.seed * 20) > 0.6 ? 1 : 0];
        const bobY = c.kind === 'pato' ? Math.round(Math.sin(now / 500 + c.seed * 9) * 2) / 2 : 0;
        list.push({
          baseY: c.y,
          draw: () => {
            if (c.kind !== 'pato') { ctx.fillStyle = 'rgba(30,50,60,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, fc.width / R / 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }
            put(fc, Math.round(cx - fc.width / R / 2), Math.round(cy - fc.height / R + (c.kind === 'pato' ? 3 : 2) + bobY));
          },
        });
      }
      // plantações da fazenda (as mais embaixo passam na frente)
      if (s.soil) for (const [k, pl] of Object.entries(s.farm.plots)) {
        if (!pl.crop) continue;
        const [tx, ty] = k.split(',').map(Number);
        const x = tx * TILE - camX, y = ty * TILE - camY;
        if (x < -20 || x > vw + 4 || y < -20 || y > vh + 40) continue;
        const crop = CROP_BY_ID.get(pl.crop)!;
        const ck = `${pl.crop}|${pl.stage}`;
        let cc = s.cropCanvas.get(ck);
        if (!cc) { cc = toCanvasHd(cropArt(pl.crop, pl.stage, crop.days)); s.cropCanvas.set(ck, cc); }
        const img = cc;
        list.push({ baseY: ty * TILE + 14, draw: () => put(img, x, y + TILE - img.height / R) });
        if (img.height / R > TILE + 8) people.push({ x: tx * TILE, y: ty * TILE + TILE - img.height / R, w: TILE, h: img.height / R, baseY: ty * TILE + 14 });
      }
      // ferramenta em uso: regador pingando, poeira da enxada, semente, o que colheu subindo
      if (s.act && s.playerFrames) {
        const a = s.act, age = now - a.t, pos = pixelPos(p, TILE);
        const cx = pos.x + 8 - camX, fy = pos.y + 15 - camY;
        const tx = a.tx * TILE + 8 - camX, ty = a.ty * TILE + 8 - camY;
        list.push({
          baseY: pos.y + 16 + (p.dir === 'north' ? -0.02 : 0.02),
          draw: () => {
            if (a.kind === 'regar' || a.kind === 'encher') drawJob(ctx, 'regar', cx, fy, p.dir, { now, moving: false, stop: 0, seed: 0 });
            if (a.kind === 'arar') {
              const k = Math.min(1, age / 250);
              ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(cx + 3, fy - 12); ctx.lineTo(cx + 3 + (tx - cx) * k * 0.8, fy - 12 + (ty - fy + 12) * k * 0.8); ctx.stroke();
              for (let q = 0; q < 5; q++) {
                const life = Math.min(1, age / 500);
                ctx.fillStyle = `rgba(150,110,70,${0.8 * (1 - life)})`;
                ctx.fillRect(tx - 4 + q * 2, ty + 2 - life * (4 + q), 1.5, 1.5);
              }
            }
            if (a.kind === 'plantar') for (let q = 0; q < 4; q++) {
              const life = Math.min(1, age / 450);
              ctx.fillStyle = '#f0e0b0';
              ctx.fillRect(tx - 3 + q * 2, ty - 8 + life * 10, 1, 1);
            }
            if (a.kind === 'colher' && a.icon) {
              const life = Math.min(1, age / 700);
              ctx.globalAlpha = 1 - Math.max(0, life - 0.6) / 0.4;
              ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
              ctx.fillText(a.icon, cx, fy - 28 - life * 10);
              ctx.globalAlpha = 1;
            }
          },
        });
        if (age > 700) s.act = null;
      }
      // vara de pesca, linha e boia
      if (s.fish && s.playerFrames) {
        const fi = s.fish, pos = pixelPos(p, TILE);
        const cx = pos.x + 8 - camX, fy = pos.y + 15 - camY + (s.sailing ? -2 : 0);
        const bx = fi.tile.tx * TILE + 8 - camX, by = fi.tile.ty * TILE + 8 - camY;
        const k = Math.min(1, (now - fi.t) / 450);
        list.push({ baseY: pos.y + 16 + (p.dir === 'north' ? -0.02 : 0.02), draw: () => drawRod(ctx, cx, fy, p.dir, bx, by, fi.phase, k, now) });
      }
      for (const n of s.npcs) {
        const job = n.def.job;
        if (!job) { person(n.w, n.frames); continue; }
        const st = { now, moving: !!n.w.from || n.path.length > 0, stop: n.stop, seed: n.seed };
        person(n.w, n.frames, jobBob(job.kind, st));
        if (!n.frames || job.kind === 'passear') continue;
        const pos = pixelPos(n.w, TILE);
        const cx = pos.x + 8 - camX, fy = pos.y + 15 - camY;
        if (cx < -40 || cx > vw + 40 || fy < -40 || fy > vh + 40) continue;
        const dir = n.w.dir;
        list.push({ baseY: pos.y + 16 + (propsBehind(dir) ? -0.01 : 0.01), draw: () => drawJob(ctx, job.kind, cx, fy, dir, st) });
      }
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

      // lâmpada dos postes acesos: a cúpula clara e um brilho em volta
      if (lampsOn.length) {
        const k = Math.min(1, tod.light * 1.3);
        for (const { l, i } of lampsOn) {
          const n = s.lampNights[i];
          if (n) ctx.drawImage(n, l.x - camX, l.y - camY, n.width / R, n.height / R);
          const [bx, by] = [l.bulb[0] - camX, l.bulb[1] - camY];
          ctx.globalCompositeOperation = 'lighter';
          const gr = ctx.createRadialGradient(bx, by, 0, bx, by, 13);
          gr.addColorStop(0, `rgba(255,236,190,${0.75 * k})`);
          gr.addColorStop(0.35, `rgba(255,200,120,${0.3 * k})`);
          gr.addColorStop(1, 'rgba(255,190,110,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(bx - 13, by - 13, 26, 26);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
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
      // o peixe mordeu: "!" do lado da cabeça, por cima de tudo
      if (s.fish?.phase === 'bite') {
        const pos = pixelPos(p, TILE);
        drawAlert(ctx, pos.x + 20 - camX, pos.y - 14 - camY, now);
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
    if (s.seat) { s.player.tx = s.seat.from.tx; s.player.ty = s.seat.from.ty; s.seat = null; s.dirty = true; }
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
        {town.name.toUpperCase()} <span className="text-lime-300 hidden sm:inline">· protótipo</span>
        <span className="ml-2 text-white/90">{String(Math.floor(clock)).padStart(2, '0')}:00 · {clock >= 6 && clock < 18.5 ? 'dia' : 'noite'}</span>
        {!touch && <div className="text-white/70 mt-1">SETAS/WASD andar · SHIFT correr · ESPAÇO falar/pescar{town.id === 'fazenda' ? '/plantar · Q E semente' : ''} · M mapa · T hora</div>}
        {!ready && <div className="text-yellow-300 mt-1">carregando...</div>}
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <span className={`px-2 py-2 rounded-md bg-black/55 text-yellow-200 text-[10px] ${pixelFont}`} title="Moedas">🪙 {progress.coins}</span>
        <button onClick={() => setMapOpen(true)}
          className={`px-3 py-2 rounded-md bg-[#8a5a2e]/90 border-2 border-[#e8c690] text-white text-[10px] ${pixelFont}`}>MAPA</button>
        <button onClick={() => setDeckOpen(true)}
          className={`px-3 py-2 rounded-md bg-[#3c56b0]/90 border-2 border-[#8fb0ff] text-white text-[10px] ${pixelFont}`}>DECK</button>
        <button
          onClick={() => setEditing(true)}
          className={`px-3 py-2 rounded-md bg-[#2f6b1e]/90 border-2 border-[#8cc63f] text-white text-[10px] ${pixelFont}`}
        >VISUAL</button>
      </div>

      {editing && <LookEditor value={look} onChange={setLook} onClose={() => setEditing(false)} />}

      {banner && (
        <div className={`absolute top-[22%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg border-4 border-[#e8c690] bg-[#2e2a40]/90 text-[#fff4d0] text-[14px] tracking-wider pointer-events-none ${pixelFont}`}>
          {banner.toUpperCase()}
        </div>
      )}

      {fishUi?.kind === 'meter' && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[min(80vw,360px)] rounded-lg border-4 border-[#2e2a40] bg-white/95 p-3 ${pixelFont}`}>
          <div className="text-[10px] text-center text-[#2e2a40] mb-2">FISGOU! APERTE NO VERDE!</div>
          <div className="relative h-5 rounded bg-[#e8485a]/30 overflow-hidden border-2 border-[#2e2a40]">
            <div className="absolute inset-y-0 bg-[#3ac46a]" style={{ left: `${fishUi.meter.zone[0] * 100}%`, width: `${(fishUi.meter.zone[1] - fishUi.meter.zone[0]) * 100}%` }} />
            <div className="absolute inset-y-[-2px] w-1.5 bg-[#2e2a40]" style={{ animation: `wit-needle ${fishUi.meter.period}ms linear infinite` }} />
          </div>
          <style>{`@keyframes wit-needle { 0% { left: 0% } 50% { left: calc(100% - 6px) } 100% { left: 0% } }`}</style>
        </div>
      )}
      {fishUi?.kind === 'catch' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35" onPointerDown={() => setFishUi(null)}>
          <div className={`w-[min(86vw,340px)] rounded-xl border-4 bg-[#f4efe2] p-4 text-center text-[#2e2a40] ${pixelFont}`} style={{ borderColor: RARITY_COLOR[fishUi.fish.rarity] }}>
            <div className="text-[10px] text-[#5a5470]">{fishUi.fish.rarity === 'lixo' ? 'VOCÊ PESCOU... ' : 'VOCÊ PESCOU!'}</div>
            <img src={fishIconUrl(fishUi.fish, 3)} alt="" className="mx-auto my-2 w-[144px] h-[96px] [image-rendering:pixelated]" />
            <div className="text-[13px]">{fishUi.fish.name}</div>
            <div className="text-[9px] mt-1" style={{ color: RARITY_COLOR[fishUi.fish.rarity] }}>{RARITY_LABEL[fishUi.fish.rarity]} · {fishUi.cm} cm</div>
            {fishUi.first && <div className="text-[9px] mt-2 text-[#3a9a5a]">NOVO NO ÁLBUM!</div>}
            {fishUi.record && <div className="text-[9px] mt-2 text-[#e8a020]">NOVO RECORDE!</div>}
            <div className="text-[8px] leading-4 mt-2 text-[#5a5470]">{fishUi.fish.about}</div>
            <div className="text-[8px] mt-3 text-[#b0487a]">{fishUi.fish.price ? `Vale ${fishUi.fish.price} 🪙 na Casa de Pesca` : 'Leve para o lixo da Casa de Pesca'} · toque para continuar</div>
          </div>
        </div>
      )}
      {fishUi?.kind === 'toast' && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-[22%] px-4 py-2 rounded-lg bg-black/70 text-white text-[10px] pointer-events-none ${pixelFont}`}>{fishUi.text}</div>
      )}
      {fishHouse && <FishHouse progress={progress} start={fishHouse} onClose={() => setFishHouse(null)} />}
      {farmPanel && <FarmPanel mode={farmPanel} progress={progress} onClose={() => { setFarmPanel(null); g.current.farm = loadFarm(); setFarmHud(n => n + 1); }} />}
      {town.id === 'fazenda' && !inside && (() => {
        const s = g.current;
        const owned = CROPS.filter(c => (progress.itens[`semente:${c.id}`] ?? 0) > 0);
        if (s.seed && !owned.some(c => c.id === s.seed)) s.seed = null;
        if (!s.seed && owned.length) s.seed = owned[0].id;
        const crop = s.seed ? CROP_BY_ID.get(s.seed)! : null;
        return (
          <div className={`absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#2e2a40]/85 border-2 border-[#e8c690] text-white text-[9px] ${pixelFont}`}>
            <button onClick={() => cycleSeed(-1)} className="px-1.5 py-1 rounded bg-white/15" aria-label="semente anterior">◀</button>
            <span className="min-w-[132px] text-center">{crop ? <>{iconOf(crop.id)} {crop.name} ×{progress.itens[`semente:${crop.id}`] ?? 0}</> : 'sem sementes'}</span>
            <button onClick={() => cycleSeed(1)} className="px-1.5 py-1 rounded bg-white/15" aria-label="próxima semente">▶</button>
            <span className="ml-2 text-[#8ad0ff]">💧 {s.farm.water}/{CAN_SIZE}</span>
            <span className="ml-2 text-[#e8c690]">DIA {s.farm.day}</span>
          </div>
        );
      })()}
      {mapOpen && (
        <WorldMap zone={town.id} pos={{ tx: g.current.player.tx, ty: g.current.player.ty }} size={{ w: town.solid[0].length, h: town.solid.length }}
          ready={ZONES} onClose={() => setMapOpen(false)}
          onTravel={to => { setMapOpen(false); g.current.leaving = true; onTravel(to, undefined, g.current.hour); }} />
      )}

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
      {deckOpen && <DeckBuilder progress={progress} onClose={() => setDeckOpen(false)} />}
      {inside && <InteriorView sala={inside} look={look} pet={look.pet ?? DEFAULT_PET} onExit={exitInterior} />}
    </div>
  );
}
