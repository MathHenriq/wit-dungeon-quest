import { useCallback, useEffect, useRef, useState } from 'react';
import { cleanLake, CLEAN_PAY, lakeLuck } from '@/game/fishlog';
import { shownTitle } from '@/game/titles';
import { versoOf } from '@/game/grimoire';
import { addGlowSpots, type Placed, type Town } from '@/game/world/town';
import { hdOf, loadPrebuiltGround, loadWorldAssets, type WorldAssets } from '@/game/world/assets';
import { buildZone, ZONES } from '@/game/world/world';
import { ZONE_NAMES, type Exit, type ZoneId } from '@/game/world/zone';
import { biteDelay, meterFor, meterHit, RARITY_COLOR, RARITY_LABEL, rollFish, type Fish, type Meter } from '@/game/fishing';
import { boatArt, duckFrames } from '@/game/world/buildings-lago';
import { chickenFrames, cowFrames, cropArt, sheepFrames, soilArt } from '@/game/world/buildings-fazenda';
import { HENYARD, PASTURE } from '@/game/world/zone-fazenda';
import { actionAt, applyAction, CAN_SIZE, catchUp, CROP_BY_ID, CROPS, isFairDay, itemName, loadFarm, nextDay, rainOn, saveFarm, SEASON_NAME, seasonOf, type CropId, type FarmState } from '@/game/farm';
import { FarmPanel, iconOf } from '@/components/city/FarmPanel';
import { CoursesPanel } from '@/components/city/CoursesPanel';
import { droneFrames, gariBotFrames, litterArt, witBotFrames } from '@/game/world/buildings-wit';
import { PLAZA_WIT } from '@/game/world/zone-wit';
import { BOT_TIPS, headlines } from '@/game/news';
import { drawText, textWidth } from '@/game/world/font';
import { spawnCritters, spawnLitter, stepCritters, stepGari, type Critter, type CritterKind, type Litter } from '@/game/world/critters';
import { drawWaterAnim, makeWaterAnim, type WaterAnim } from '@/game/world/water-anim';
import { drawAlert, drawHint, drawOars, drawRod } from '@/game/world/player-acts';
import { fishIconUrl } from '@/game/world/fish-art';
import { FishHouse } from '@/components/city/FishHouse';
import { WorldMap } from '@/components/city/WorldMap';
import { play } from '@/game/sfx';
import { addPhoto, loadPhotos, MAX_PHOTOS, savePhotos, snap } from '@/game/photos';
import { lessonCardsMine } from '@/game/class-events';
import { cancelField, completeTarget, FIELD_BY_ID, fieldLeft, interviewLine, pendingByZone, surveyTable, targetsIn, wantOf, type FieldTarget } from '@/game/fieldwork';
import { publish } from '@/game/press';
import { PathChooser } from '@/components/city/PathChooser';
import { lampPower, lightHalo, timeOfDay } from '@/game/world/light';
import { TILE } from '@/game/world/buildings';
import { Pixmap } from '@/game/world/pixmap';
import {
  ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker,
} from '@/game/world/movement';
import { DEFAULT_LOOK, DEFAULT_PET, normalizeLook, type Look } from '@/game/world/outfit';
import { DIRS, drawSeated, loadLookFrames, loadPetFrames, plateCanvas, R, toCanvas, type Frames } from '@/game/world/sprites';
import { canRide, groundVehicle, ROAD_TERRAIN, type Vehicle } from '@/game/vehicles';
import { cloudEnabled, pullProgress } from '@/game/cloud';
import { FALA_MS, FALAS, joinZone, tabId, type PeerState, type ZoneLink } from '@/game/presence';
import { DEMO_PEOPLE, nickOk, noticesMine, setProfile, socialDemo, socialError, socialOn, visit } from '@/game/social';
import { ProfileCard } from '@/components/social/ProfileCard';
import { TradeHub } from '@/components/social/TradeHub';
import { Mural } from '@/components/social/Mural';
import { ArcadeMaker } from '@/components/social/Arcade';
import { Radio } from '@/components/city/Radio';
import { VehicleShop } from '@/components/city/VehicleShop';
import { poseFrames } from '@/game/world/model-sprite';
import { InteriorView, type Sala } from '@/components/city/InteriorView';
import { RESIDENT_PREFIX, ROOM_BUILDING, ROOMS } from '@/game/interior/room';
import { addCatch, addItem, loadProgress, saveProgress, type Progress } from '@/game/progress';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { PACK_BY_ID, type PackId } from '@/game/packs';
import { RARITY_ORDER as RANKS } from '@/lib/tcg/opponents';
import { canSize, doWork, fishLuck, FISH_XP, HUNGRY, irrigPlots, shipBonus, spendEnergy, today } from '@/game/life';
import { buy } from '@/game/market';
import { finishDelivery } from '@/game/deliveries';
import { PROF_BY_ID, profTitle, type MinigameId } from '@/game/professions';
import { WorkPanel } from '@/components/work/WorkPanel';
import { Backpack, DeliveryPanel, KitchenPanel, MarketPanel, type BagTab } from '@/components/work/LifePanels';
import { HungerBar } from '@/components/work/Shell';
import { Icon } from '@/components/Icon';
import { iconUrl } from '@/game/icons';
import { DeckBuilder } from '@/components/duel/DeckBuilder';
import { LookEditor } from '@/components/city/LookEditor';
import { BUILDING_INFO, houseInfo, isResidentHouse, MURAL_TEXT, NPCS, type NpcDef } from '@/game/world/content';
import { useOccludesBackdrop } from '@/hooks/useOccludesBackdrop';
import { drawAmbient } from '@/game/world/ambient';
import { PLATE_FALA, PLATE_NPC, PLATE_OTHER, PLATE_PLAYER } from '@/game/world/nameplate';
import { drawJob, jobBob, propsBehind } from '@/game/world/jobs';
import {
  storyArrive, storyChoose, storyCtx, storyDoor, storyExtra, storyFog, storyFromQuery, storyMarks, storyNewDay, storySpot,
  storyTalk, storyTick, storyVisible, STORY_EVENT,
} from '@/game/story/runtime';
import { Caderno, StoryChoice, StoryHud } from '@/components/story/StoryUi';

/**
 * Protótipo jogável da Cidade WIT: andar pela cidade (setas/WASD ou toque),
 * conversar com moradores (espaço) e ver o que cada prédio vai ter.
 * Rota: /cidade-demo
 */

/** ?passeio=1: o boneco passeia sozinho (para medir desempenho e gravar vídeo). */
const TOUR: [number, number][] = [[31, 23], [16, 21], [16, 19], [10, 27], [16, 32], [16, 31], [46, 33], [46, 31], [57, 21], [51, 14], [48, 10], [7, 11], [7, 9], [26, 13], [31, 23], [31, 40], [14, 42], [14, 41], [31, 33]];
const WALK_MS = 230, RUN_MS = 125, BOAT_MS = 190;
/** Portas onde se trabalha (minijogo da profissão); `?trabalho=<porta>` abre direto. */
const WORK_DOORS: Record<string, { game: MinigameId; also?: MinigameId[]; shop?: string[] }> = {
  'npc-padaria': { game: 'pao', also: ['fermento', 'forno'], shop: ['pao', 'bolo'] },
  'npc-musico': { game: 'compor', also: ['afinar', 'ritmo'] }, 'estudio-musica': { game: 'compor', also: ['afinar', 'ritmo'] },
  'npc-artista': { game: 'pixelart', also: ['cores', 'pintura'] }, atelie: { game: 'pixelart', also: ['cores', 'pintura'] },
  'lab-ia': { game: 'programar', also: ['acuracia', 'rotular'] },
  'casa-iot': { game: 'regras', also: ['circuito'] },
  metaverso: { game: 'coordenadas', also: ['sala3d', 'pares'] },
  estudio: { game: 'materia', also: ['boato', 'noticia'] },
  'oficina-games': { game: 'logica', also: ['teste-jogo'] },
  // sem porta própria: abre pela aba GRÁFICOS do Mercado (e por ?trabalho=analista)
  analista: { game: 'grafico', also: ['barraca', 'atacado'] },
  // calendário da horta: botão na barraca de sementes da Fazenda
  horta: { game: 'calendario' },
  // idem: botão MELHOR ROTA na Central de Entregas
  rota: { game: 'rota' },
};
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
/** Progresso para o laço de desenho, sem ler o navegador a cada quadro. */
let progressCache: Progress | null = null;
if (typeof window !== 'undefined') window.addEventListener('wit-progresso', e => { progressCache = (e as CustomEvent<Progress>).detail; });
const loadProgressCached = () => (progressCache ??= loadProgress());

/** Ícones dos itens já carregados (para desenhar no canvas: colheita subindo). */
const iconImages = new Map<string, HTMLImageElement>();
function iconImage(id: string): HTMLImageElement {
  let im = iconImages.get(id);
  if (!im) { im = new Image(); im.src = iconUrl(id); iconImages.set(id, im); }
  return im;
}
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
  // ?historia=cap3 começa a história naquele capítulo (prints e testes)
  useState(() => { storyFromQuery(); return 0; });
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
  /** História: o Caderno aberto e a escolha de um passo. */
  const [caderno, setCaderno] = useState(false);
  const [choice, setChoice] = useState<{ pergunta: string[]; opcoes: string[] } | null>(null);
  const [ready, setReady] = useState(false);
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const [view, setView] = useState({ w: 320, h: 208, scale: 3 });
  const [clock, setClock] = useState(startHour);
  const [banner, setBanner] = useState<string | null>(town.name);
  const [mapOpen, setMapOpen] = useState(() => new URLSearchParams(window.location.search).has('mapa'));
  const [vehicleShop, setVehicleShop] = useState(() => new URLSearchParams(window.location.search).has('veiculos'));
  // ?pesca=diario abre a Casa de Pesca numa aba (prints e testes)
  const [fishHouse, setFishHouse] = useState<'quadro' | 'vender' | 'diario' | null>(() => {
    const q = new URLSearchParams(window.location.search).get('pesca');
    return q === 'quadro' || q === 'vender' || q === 'diario' ? q : null;
  });
  const [fishUi, setFishUi] = useState<FishUi | null>(null);
  const [farmPanel, setFarmPanel] = useState<'sementes' | 'envio' | null>(null);
  const [courses, setCourses] = useState(false);
  /** Trabalho num prédio (minijogo), mochila, mercado, cozinha, entregas. */
  const [work, setWork] = useState<{ game: MinigameId; also?: MinigameId[]; shop?: string[] } | null>(() => {
    const w = new URLSearchParams(window.location.search).get('trabalho');
    return w && WORK_DOORS[w] ? WORK_DOORS[w] : null;
  });
  const [bag, setBag] = useState<BagTab | null>(() => { const q = new URLSearchParams(window.location.search); return q.has('amigos') ? 'amigos' : q.has('mochila') ? 'mochila' : null; });
  const [shopUi, setShopUi] = useState<'mercado' | 'cozinha' | 'entregas' | null>(() => {
    const q = new URLSearchParams(window.location.search).get('loja');
    return q === 'mercado' || q === 'cozinha' || q === 'entregas' ? q : null;
  });
  /** Só para redesenhar a barra da fazenda (semente escolhida, água). */
  const [, setFarmHud] = useState(0);
  const fields = town.spots.filter(sp => sp.kind === 'campo').map(sp => ({ x0: sp.tx, y0: sp.ty, x1: sp.data!.x1 as number, y1: sp.data!.y1 as number }));
  useEffect(() => { const t = window.setTimeout(() => setBanner(null), 2600); return () => window.clearTimeout(t); }, []);
  const [near, setNear] = useState<string | null>(null);
  const [look, setLook] = useState<Look>(savedLook);
  const [editing, setEditing] = useState(() => new URLSearchParams(window.location.search).has('visual'));
  // ?sala=torre&andar=5 ou ?sala=casa começa dentro (prints e testes)
  const [deckOpen, setDeckOpen] = useState(() => { const q = new URLSearchParams(window.location.search); return q.has('tapetes') || q.has('grimorio') || q.has('deck'); });
  const [progress, setProgress] = useState<Progress>(loadProgress);
  // verso das cartas (Grimório): vale para todas as cartas viradas do jogo
  useEffect(() => { document.documentElement.dataset.verso = versoOf(progress); }, [progress]);
  // primeiro acesso: escolher o Caminho. ?caminho força a tela; em navegador
  // automatizado (prints e testes) ela só abre com ?caminho, para não tapar a cidade
  const [pathOpen, setPathOpen] = useState(() => new URLSearchParams(window.location.search).has('caminho') || (!loadProgress().caminho && !navigator.webdriver));
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
    // ?sala=morador:casa-nando abre a casa de um morador (prints)
    if (sid?.startsWith(RESIDENT_PREFIX)) return { kind: 'sala', id: sid, title: houseInfo(sid.slice(RESIDENT_PREFIX.length), 'Casa').title };
    if (q.get('sala') === 'torre') return { kind: 'torre', andar: Math.max(1, Math.min(100, Number(q.get('andar')) || 1)) };
    return null;
  });

  // estado do jogo fora do React (o laço de desenho lê direto)
  const g = useRef({
    // ?pos=tx,ty começa em outro lugar (para prints e testes)
    player: newWalker(START.tx, START.ty, START.dir),
    pet: newWalker(START.tx - DELTA[START.dir][0], START.ty - DELTA[START.dir][1], START.dir),
    npcs: [] as Npc[],
    /** Todos os moradores da área; `npcs` são os que aparecem agora (a história esconde alguns). */
    allNpcs: npcDefs.map((def, i) => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null, goal: null, path: [], wait: 800 + i * 700, stop: 0, seed: (i * 0.618034) % 1 })) as Npc[],
    /** O que a história marca nesta área ("!" nos moradores, brilho nos blocos, portas). */
    story: { quem: [] as string[], blocos: [] as [number, number][], portas: [] as string[], fog: false },
    /** Navegando no barquinho (e onde ele fica amarrado quando não está). */
    sailing: false,
    boat: ((): { tx: number; ty: number; dir: Dir } | null => {
      const sp = town.spots.find(p => p.kind === 'barco');
      return sp ? { tx: sp.tx, ty: sp.ty, dir: (sp.data?.dir as Dir) ?? 'east' } : null;
    })(),
    boatCanvases: null as Record<Dir, HTMLCanvasElement> | null,
    fish: null as Fishing | null,
    critters: [] as Critter[],
    /** Lixo no chão da Cidade WIT e o brilho de quando alguém cata. */
    litter: [] as Litter[],
    litterCanvases: null as HTMLCanvasElement[] | null,
    litterAt: 0,
    pops: [] as { x: number; y: number; t: number }[],
    /** Trabalho de campo: os pontos que faltam nesta área (refeitos quando o progresso muda). */
    field: { key: '', targets: [] as FieldTarget[] },
    critterCanvases: {} as Partial<Record<CritterKind, { west: HTMLCanvasElement[]; east: HTMLCanvasElement[] }>>,
    /** Fazenda (guardada no navegador): campos, caixa de envio, regador. */
    farm: loadFarm(Date.now(), town.id === 'fazenda' ? (() => { const sp = town.spots.find(p => p.kind === 'campo'); return sp ? { x0: sp.tx, y0: sp.ty } : undefined; })() : undefined) as FarmState,
    seed: null as CropId | null,
    soil: null as { dry: HTMLCanvasElement; wet: HTMLCanvasElement } | null,
    cropCanvas: new Map<string, HTMLCanvasElement>(),
    /** Jornal WIT: a faixa de manchetes (canvas) e o cabeçalho do telão. */
    news: null as { strip: HTMLCanvasElement; head: HTMLCanvasElement } | null,
    /** Fotos do álbum que passam no telão, entre as manchetes. */
    telaoPhotos: [] as { im: HTMLImageElement; lugar: string }[],
    /** Número do andar na telinha da Torre (refeito quando o andar muda). */
    floorSign: null as { n: number; c: HTMLCanvasElement } | null,
    /** Drones de entrega voando (Cidade WIT). */
    drones: [] as { x: number; y: number; tx: number; ty: number; seed: number }[],
    droneCanvases: null as HTMLCanvasElement[] | null,
    /** Ferramenta em uso (animação curta): enxada, regador, semente, colheita. */
    act: null as { kind: 'arar' | 'regar' | 'plantar' | 'colher' | 'encher'; t: number; tx: number; ty: number; icon?: string } | null,
    water: null as WaterAnim | null,
    /** Já saiu pela borda (espera a outra área montar). */
    leaving: false,
    held: [] as Dir[],
    run: false,
    /** Barriga vazia: não corre. Caminhada acumulada (s) para gastar a barriga. */
    starving: false,
    hungerAcc: 0,
    /** Sentado num banco: o bloco do banco e de onde veio (para levantar). */
    seat: null as { tx: number; ty: number; dx: number; from: { tx: number; ty: number } } | null,
    path: [] as Dir[],
    playerFrames: null as Frames | null,
    /** Emotes do modelo (4 linhas: acenar, dançar, chorar, joinha) e o que está tocando. */
    emotes: null as HTMLCanvasElement[][] | null,
    emote: null as { row: number; t0: number } | null,
    /** Montado num veículo (tecla V): mais rápido em rua, calçada e terra. */
    riding: null as Vehicle | null,
    /** Apelido e título do jogador (na plaquinha). */
    nick: 'Você',
    playerTitle: 'Novato' as string | undefined,
    /** Colegas na mesma área (só com o banco ligado): andam até o bloco que avisaram. */
    peers: new Map<string, { st: PeerState; w: Walker; path: Dir[]; frames: Frames | null }>(),
    link: null as ZoneLink | null,
    /** O professor silenciou o balão (denúncia). */
    muted: false,
    /** Balão do jogador (frase pronta) e quando apareceu. */
    fala: null as { i: number; t: number } | null,
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
    g.current.modal = !!panel || !!dialog || editing || !!inside || deckOpen || mapOpen || !!fishHouse || fishUi?.kind === 'catch' || !!farmPanel || courses || !!work || !!bag || !!shopUi || pathOpen || vehicleShop || caderno || !!choice;
    g.current.inside = !!inside; g.current.dirty = true;
  }, [panel, dialog, editing, inside, deckOpen, mapOpen, fishHouse, fishUi, farmPanel, courses, work, bag, shopUi, vehicleShop, caderno, choice, pathOpen]);

  // história (src/game/story): quem aparece nesta área, os marcadores e a neblina
  const sctx = useCallback(() => storyCtx(town.id, g.current.hour, g.current.farm.day), [town]);
  const refreshStory = useCallback(() => {
    const s = g.current;
    const c = storyCtx(town.id, s.hour, s.farm.day);
    s.npcs = s.allNpcs.filter(n => storyVisible(n.def.id, c));
    s.story = { ...storyMarks(town.id), fog: storyFog(c) };
    s.dirty = true;
  }, [town]);
  useEffect(() => {
    refreshStory();
    window.addEventListener(STORY_EVENT, refreshStory);
    return () => window.removeEventListener(STORY_EVENT, refreshStory);
  }, [refreshStory]);
  // o tempo da história (esperar, a noite, o dia seguinte): só com nada aberto na tela
  useEffect(() => {
    if (dialog || panel || choice || caderno || inside || pathOpen) return;
    const id = window.setInterval(() => {
      const s = g.current;
      if (s.modal || s.fish) return;
      const r = storyTick(sctx(), 500);
      if (r.falas) { s.path = []; s.held = []; setDialog({ lines: r.falas, i: 0 }); }
    }, 500);
    return () => window.clearInterval(id);
  }, [dialog, panel, choice, caderno, inside, pathOpen, sctx]);

  // título do cargo na plaquinha; com fome não corre
  useEffect(() => {
    g.current.playerTitle = shownTitle(progress, progress.profissao ? profTitle(progress.profissao, progress.xp[progress.profissao] ?? 0) : undefined);
    g.current.starving = progress.fome <= 0;
    g.current.dirty = true;
  }, [progress]);
  // relógio da entrega (só enquanto tem uma)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!progress.entrega) return;
    const t = window.setInterval(() => setTick(n => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [progress.entrega]);

  // fazenda: se ficou fora um dia (12 min) ou mais, vira um dia ao chegar
  useEffect(() => {
    const cu = catchUp(g.current.farm, Date.now(), irrigPlots(loadProgress()));
    if (!cu) return;
    g.current.farm = cu.farm; saveFarm(cu.farm);
    if (cu.paid) { const pr = loadProgress(); cu.paid = Math.round(cu.paid * shipBonus(pr)); saveProgress({ ...pr, coins: pr.coins + cu.paid }); }
    if (cu.paid || town.id === 'fazenda') setFishUi({ kind: 'toast', text: `Dia ${cu.farm.day} na fazenda!${cu.paid ? ` A caixa de envio pagou ${cu.paid} moedas.` : ''}` });
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

  // banco do WIT 2 (só com VITE_WIT2_DB=1): ao abrir, traz moedas, cartas e Torre do servidor
  useEffect(() => {
    if (!cloudEnabled()) return;
    const before = loadProgress();
    pullProgress(before).then(p => {
      saveProgress(p); setProgress(p);
      // o professor mandou pacotes (aula, missão da sala) desde a última vez: avisa
      const got = Object.entries(p.pacotes).filter(([id, n]) => n > (before.pacotes[id] ?? 0));
      const packsText = got.length ? `Seu professor mandou ${got.map(([id, n]) => `${n - (before.pacotes[id] ?? 0)} ${PACK_BY_ID.get(id as PackId)?.name ?? id}`).join(' e ')}! Abra em MEUS PACOTES, na Loja.` : '';
      if (packsText) setFishUi({ kind: 'toast', text: packsText });
      // Carta da Aula nova (avisa uma vez)
      void lessonCardsMine().then(list => {
        const seen = (() => { try { return localStorage.getItem('wit.cartaAula') ?? ''; } catch { return ''; } })();
        const c = list[0];
        if (!c || `${c.day}:${c.card}` === seen) return;
        try { localStorage.setItem('wit.cartaAula', `${c.day}:${c.card}`); } catch { /* sem armazenamento */ }
        const text = `Carta da Aula: ${CARD_BY_ID.get(c.card)?.name ?? c.card} entrou no seu álbum!`;
        setFishUi({ kind: 'toast', text: packsText ? `${packsText} ${text}` : text });
      });
    }).catch(err => console.error('banco', err));
  }, []);

  // convite de festa de um amigo (vale 30 min)
  useEffect(() => {
    void noticesMine().then(list => {
      const f = list.find(n => n.kind === 'festa');
      if (f) setFishUi({ kind: 'toast', text: `${f.nick} está dando uma festa em casa! Visite pela MOCHILA, aba AMIGOS.` });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cidade compartilhada (só com VITE_WIT2_DB=1): publica o perfil (apelido,
  // visual, título), entra no canal da turma e cada colega da área vira um boneco.
  // ?social=demo põe 2 colegas de mentira perto (prints do cartão de perfil).
  useEffect(() => {
    if (!socialOn()) return;
    const s = g.current;
    const wall = (x: number, y: number) => y < 0 || x < 0 || y >= town.solid.length || x >= town.solid[0].length || town.solid[y][x];
    if (socialDemo()) {
      DEMO_PEOPLE.forEach((pp, i) => {
        const st: PeerState = { id: pp.handle, handle: pp.handle, nick: pp.nick, title: pp.title ?? undefined, look: normalizeLook(pp.look), tx: s.player.tx + 2 + i, ty: s.player.ty + (i ? 1 : 0), dir: 'west' };
        const peer = { st, w: newWalker(st.tx, st.ty, st.dir), path: [] as Dir[], frames: null as Frames | null };
        s.peers.set(st.id, peer);
        loadLookFrames(st.look).then(f => { peer.frames = f; s.dirty = true; }).catch(() => undefined);
      });
      s.peers.get('demo-lia')!.st.fala = { i: 1, t: Date.now() + 3_600_000 };
      return () => { s.peers.clear(); };
    }
    let alive = true;
    const pr = loadProgress();
    const favs = Object.keys(pr.collection).sort((a, b) => RANKS.indexOf(CARD_BY_ID.get(b)?.rarity ?? 'common') - RANKS.indexOf(CARD_BY_ID.get(a)?.rarity ?? 'common')).slice(0, 3);
    const nick = nickOk(s.nick) ? s.nick : 'Desafiante';
    setProfile(nick, s.playerTitle, look, favs).then(meP => {
      if (!alive) return;
      s.muted = meP.muted;
      setMuted(meP.muted);
      const me: PeerState = { id: tabId(), handle: meP.handle, nick, title: s.playerTitle, look, tx: s.player.tx, ty: s.player.ty, dir: s.player.dir };
      return joinZone(town.id, me, list => {
      const seen = new Set<string>();
      for (const st of list) {
        seen.add(st.id);
        const cur = s.peers.get(st.id);
        if (!cur) {
          const peer = { st, w: newWalker(st.tx, st.ty, st.dir), path: [] as Dir[], frames: null as Frames | null };
          s.peers.set(st.id, peer);
          loadLookFrames(normalizeLook(st.look)).then(f => { peer.frames = f; s.dirty = true; }).catch(() => undefined);
        } else {
          cur.st = st;
          const path = findPath(cur.w.tx, cur.w.ty, st.tx, st.ty, wall, 1500);
          // longe demais ou sem caminho: aparece direto no bloco
          if ((!path.length && (cur.w.tx !== st.tx || cur.w.ty !== st.ty)) || path.length > 24) { cur.w = newWalker(st.tx, st.ty, st.dir); cur.path = []; }
          else cur.path = path;
        }
      }
      for (const id of [...s.peers.keys()]) if (!seen.has(id)) s.peers.delete(id);
      s.dirty = true;
    }, meP.sala);
    }).then(link => { if (alive) s.link = link ?? null; else link?.leave(); }).catch(err => console.error('presença', err));
    return () => { alive = false; s.link?.leave(); s.link = null; s.peers.clear(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // emotes (só os modelos que já têm a folha do GPT)
  useEffect(() => {
    let alive = true;
    poseFrames(look, 'emotes').then(f => { if (alive) g.current.emotes = f; }).catch(() => undefined);
    return () => { alive = false; };
  }, [look]);
  const toggleRide = useCallback(() => {
    const s = g.current;
    if (s.sailing) return;
    if (s.riding) { s.riding = null; s.dirty = true; setFishUi({ kind: 'toast', text: 'Desceu do veículo.' }); return; }
    const pr = loadProgress(), v = groundVehicle(pr);
    if (!v) { setFishUi({ kind: 'toast', text: 'Sem veículo: compre na estação da praça da Cidade WIT.' }); return; }
    const ok = canRide(pr, v, town.terrain[s.player.ty]?.[s.player.tx]);
    if ('reason' in ok) { setFishUi({ kind: 'toast', text: ok.reason }); return; }
    s.riding = v; s.dirty = true; play('super');
    setFishUi({ kind: 'toast', text: `${v.name}: mais rápido na rua. V para descer.` });
  }, [town]);
  const [falaOpen, setFalaOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  /** Cartão de perfil de um colega (tocou nele). */
  const [card, setCard] = useState<string | null>(null);
  /** Mural da turma e o editor de fases do fliperama. */
  const [mural, setMural] = useState(() => new URLSearchParams(window.location.search).has('mural'));
  const [maker, setMaker] = useState(() => new URLSearchParams(window.location.search).has('fase'));
  /** Central de trocas aberta pelo cartão (com quem). */
  const [tradeWith, setTradeWith] = useState<string | null>(null);
  const say = useCallback((i: number) => {
    const s = g.current;
    s.fala = { i, t: Date.now() }; s.dirty = true;
    s.link?.say(i);
    setFalaOpen(false);
  }, []);
  const emote = useCallback((row?: number) => {
    const s = g.current;
    if (!s.emotes || s.inside || s.modal || s.player.from) return;
    s.emote = { row: row ?? ((s.emote?.row ?? -1) + 1) % 4, t0: performance.now() };
    s.dirty = true;
  }, []);

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
    if (town.id === 'wit') {
      const home = { x0: PLAZA_WIT.x0, y0: PLAZA_WIT.y0 + 5, x1: PLAZA_WIT.x1 + 1, y1: PLAZA_WIT.y1 + 1 };
      g.current.critters = spawnCritters(town, 'robo', 1, home, 13);
      cc.robo = { west: witBotFrames(-1).map(toCanvasHd), east: witBotFrames(1).map(toCanvasHd) };
      // robô gari (treinado pelo Lab de IA): roda a praça e as ruas catando lixo
      const street = { x0: Math.max(1, PLAZA_WIT.x0 - 8), y0: PLAZA_WIT.y0, x1: Math.min(town.solid[0].length - 1, PLAZA_WIT.x1 + 9), y1: Math.min(town.solid.length - 1, PLAZA_WIT.y1 + 10) };
      g.current.critters.push(...spawnCritters(town, 'gari', 1, home, 29).map(c => ({ ...c, home: street, picked: 0, goal: null })));
      cc.gari = { west: gariBotFrames(-1).map(toCanvasHd), east: gariBotFrames(1).map(toCanvasHd) };
      g.current.litter = spawnLitter(town, street, 6, Math.random);
      g.current.litterCanvases = litterArt().map(toCanvasHd);
      g.current.droneCanvases = droneFrames().map(toCanvasHd);
      const W = town.ground.w, H = town.ground.h;
      g.current.drones = [0, 1, 2, 3].map(k => ({ x: (k * 0.29 % 1) * W, y: (k * 0.53 % 1) * H, tx: ((k + 2) * 0.37 % 1) * W, ty: ((k + 1) * 0.61 % 1) * H, seed: k / 4 }));
      // o telão: manchetes numa faixa, com a fonte da cidade em dobro
      const lines = headlines(Math.floor(Date.now() / 86_400_000), loadProgress());
      const text = lines.join('   -   ') + '   -   ';
      const tw = textWidth(text) + 2, k = 2;
      const pm = new Pixmap(tw, 9);
      drawText(pm, text, 1, 1, { fill: [220, 255, 190], fillBottom: [150, 230, 90], shadow: [20, 60, 30] });
      const strip = document.createElement('canvas');
      strip.width = tw * k; strip.height = 9 * k;
      const sctx2 = strip.getContext('2d')!;
      sctx2.imageSmoothingEnabled = false;
      sctx2.drawImage(toCanvas(pm), 0, 0, tw * k, 9 * k);
      const hp = new Pixmap(textWidth('JORNAL WIT') + 2, 9);
      drawText(hp, 'JORNAL WIT', 1, 1, { fill: [255, 255, 255], fillBottom: [220, 240, 255], shadow: [30, 60, 20] });
      g.current.news = { strip, head: toCanvas(hp) };
      g.current.telaoPhotos = loadPhotos().slice(0, 4).map(ph => { const im = new Image(); im.src = ph.data; return { im, lugar: ph.lugar }; });
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
      g.current.allNpcs.forEach((n, i) => { n.frames = npcFrames[i]; });
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
      const c = rollFish({ deep: f.deep, night, boat: s.sailing, luck: fishLuck(loadProgress()) + lakeLuck(loadProgress(), today()) }, Math.random(), Math.random());
      f.catch = c; f.meter = meterFor(c.fish, Math.random()); f.phase = 'meter'; f.t = now;
      setFishUi({ kind: 'meter', meter: f.meter, t0: now });
      play('flip');
      return;
    }
    if (f.phase === 'meter' && f.meter && f.catch) {
      const hit = meterHit(f.meter, now - f.t);
      s.fish = null;
      if (!hit) { play('lose'); toast('Escapou! Aperte quando a agulha estiver no verde.'); return; }
      const r = addCatch(loadProgress(), f.catch.fish.id, f.catch.cm, { h: Math.floor(s.hour), w: s.sailing ? 'barco' : f.deep ? 'funda' : 'margem', d: today() });
      let w = doWork(r.progress, 'pescador', 'peixes', FISH_XP[f.catch.fish.rarity] ?? 1);
      // limpeza do lago: a prefeitura paga pelo lixo tirado da água; 3 no dia deixam o lago com mais peixe raro
      if (f.catch.fish.rarity === 'lixo') {
        const cl = cleanLake(w.progress, today());
        w = { ...w, progress: cl.progress };
        window.setTimeout(() => toast(cl.luckNow ? `Lago limpo! +${CLEAN_PAY} moedas da prefeitura. Hoje sai mais peixe raro.` : `+${CLEAN_PAY} moedas da prefeitura pelo lixo tirado do lago (${cl.n}/3 hoje).`), 1800);
      }
      saveProgress(w.progress);
      if (w.levelUp) window.setTimeout(() => toast(`Pescador subiu para o nível ${w.levelUp}!`), 2500);
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
    const size = canSize(loadProgress());
    s.farm = applyAction(s.farm, 0, 0, { kind: 'encher', size }).farm; saveFarm(s.farm);
    const f = ahead(s.player);
    s.act = { kind: 'encher', t: performance.now(), tx: f.tx, ty: f.ty };
    play('draw'); toast(`Regador cheio! ${size}/${size}`);
    setFarmHud(n => n + 1);
  };

  // para os scripts de print (só no vite de desenvolvimento)
  if (import.meta.env.DEV) (window as unknown as { __city: unknown }).__city = g.current;
  /** Pontos do trabalho de campo que faltam nesta área. */
  const fieldNow = (): FieldTarget[] => {
    const s = g.current, c = loadProgressCached().campo;
    const key = c ? `${c.job}|${c.seed}|${c.feitos.join(',')}` : '';
    if (key !== s.field.key) s.field = { key, targets: c ? targetsIn(town, c).filter(t => !c.feitos.includes(t.i)) : [] };
    return s.field.targets;
  };
  /** Cumpre um ponto do trabalho de campo; devolve o que mostrar (null = nada aconteceu). */
  const doTarget = (t: FieldTarget, x: number, y: number): string[] | null => {
    const pr = loadProgress(), c = pr.campo, job = c && FIELD_BY_ID.get(c.job);
    if (!c || !job) return null;
    const r = completeTarget(pr, t.i, Date.now());
    if ('reason' in r) {
      if (fieldLeft(pr, Date.now()) !== null && fieldLeft(pr, Date.now())! <= 0) saveProgress(cancelField(pr));
      return [r.reason];
    }
    let next = r.progress;
    // a entrevista vira matéria do jornalzinho quando a última pessoa responde
    if (r.done && job.id === 'entrevista') next = publish(next, Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000), `Entrevista: moradores do Centro, do Lago e da Fazenda contam o que pensam da cidade. "${interviewLine(c.seed, t.i)}"`);
    saveProgress(next);
    g.current.pops.push({ x, y, t: performance.now() }); g.current.dirty = true;
    play(r.done ? 'win' : 'coin');
    if (!r.done) return [`${r.line} (${c.feitos.length + 1}/${job.zones.length})`];
    return [r.line, r.done.coins ? `${job.name.toUpperCase()}: TRABALHO COMPLETO! +${r.done.coins} moedas` : `${job.name.toUpperCase()}: TRABALHO COMPLETO! Hoje os trabalhos de campo já renderam 2 vezes: este valeu experiência.`, ...(r.done.levelUp ? [`${PROF_BY_ID.get(job.prof)!.name} subiu para o nível ${r.done.levelUp}!`] : []), ...(job.id === 'entrevista' ? ['A matéria com as entrevistas saiu no jornalzinho do Estúdio.'] : []),
      ...(job.id === 'pesquisa' ? [`Resultado da pesquisa: ${surveyTable(c.seed, job.zones.length).map(([w, n]) => `${w} ${n}`).join(', ')}. O mais pedido é o que mais vende!`] : [])];
  };

  /** Câmera do repórter: retrato da tela (sem os botões), guardado no álbum. */
  const [flash, setFlash] = useState(false);
  const takePhoto = () => {
    const cv = canvasRef.current, s = g.current;
    if (!cv || s.modal || s.inside) return;
    const p = s.player;
    let near: { name: string; d: number } | null = null;
    for (const d of town.doors) {
      const dd = Math.abs(d.tx - p.tx) + Math.abs(d.ty - p.ty);
      if (dd <= 10 && (!near || dd < near.d)) near = { name: d.name, d: dd };
    }
    const ph = snap(cv, { zona: town.id, lugar: near ? `${near.name}, ${town.name}` : town.name, hora: Math.floor(s.hour) });
    if (!ph) { toast('A câmera falhou.'); return; }
    const list = addPhoto(loadPhotos(), ph);
    if (!savePhotos(list)) { toast('Sem espaço para mais fotos.'); return; }
    if (town.id === 'wit') g.current.telaoPhotos = list.slice(0, 4).map(x => { const im = new Image(); im.src = x.data; return { im, lugar: x.lugar }; });
    setFlash(true); window.setTimeout(() => setFlash(false), 70);
    play('click');
    toast(list.length >= MAX_PHOTOS ? `Foto tirada! Álbum cheio (${MAX_PHOTOS}): a mais velha saiu.` : `Foto tirada! Álbum ${list.length}/${MAX_PHOTOS}. Ela passa no telão da Cidade WIT.`);
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
      // história: o passo com este morador (ou a escolha)
      const st = storyTalk(npc.def.id, sctx());
      if (st.escolha) { setChoice(st.escolha); return; }
      if (st.falas) { setDialog({ lines: st.falas, i: 0 }); return; }
      // entrevista do trabalho de campo
      const ft = fieldNow().find(t => t.npc === npc.def.id);
      const c = loadProgress().campo;
      if (ft && c) {
        const lines = doTarget(ft, npc.w.tx * TILE + 8, npc.w.ty * TILE);
        const said = c.job === 'pesquisa' ? `Eu queria comprar ${wantOf(c.seed, ft.i)}.` : interviewLine(c.seed, ft.i);
        setDialog({ lines: [`${npc.def.name}: "${said}"`, ...(lines ?? [])], i: 0 });
        return;
      }
      setDialog({ lines: storyExtra(npc.def.id) ?? npc.def.lines, i: 0 });
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
    // história: pegar alguma coisa no bloco da frente (ou no que está pisando)
    if (!s.sailing) {
      const c = sctx();
      const r = storySpot(c, f.tx, f.ty);
      const r2 = r.falas ? r : storySpot(c, p.tx, p.ty);
      if (r2.falas) { setDialog({ lines: r2.falas, i: 0 }); return; }
    }
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
        case 'mural': setMural(true); return;
        case 'correio':
          setDialog({ lines: spot.data?.own ? ['Sua caixa de correio. Nenhuma carta nova.', 'Em breve: recados dos colegas e do professor chegam aqui.'] : ['A caixa de correio de um morador. Não é sua!'], i: 0 });
          return;
        case 'fonte': play('coin'); setDialog({ lines: ['Você jogou uma moedinha imaginária na fonte e fez um pedido...', 'Tomara que venha uma carta Mítica no próximo pacotinho!'], i: 0 }); return;
        case 'maquina': {
          const r = buy(loadProgress(), 'suco');
          if ('reason' in r) { toast(`Máquina de sucos: ${r.reason}`); return; }
          saveProgress(r.progress); play('coin'); toast('Saiu um suco! Está na mochila.');
          return;
        }
        case 'banca': setFishHouse('vender'); return;
        case 'castelo-areia': setDialog({ lines: ['Um castelo de areia caprichado, com bandeirinha e tudo.', 'Melhor não pisar!'], i: 0 }); return;
        case 'fogueira': setDialog({ lines: ['A fogueira do acampamento estala e esquenta.', 'À noite, os vaga-lumes aparecem por aqui.'], i: 0 }); return;
        case 'sementes': setFarmPanel('sementes'); return;
        case 'telao': setDialog({ lines: ['JORNAL WIT', ...headlines(Math.floor(Date.now() / 86_400_000), loadProgress()).slice(0, 5)], i: 0 }); return;
        case 'holograma': play('super'); setDialog({ lines: ['O holograma do W gira em cima da praça.', 'Quem fez foi a turma de Metaverso: é um modelo 3D projetado com luz.'], i: 0 }); return;
        case 'canteiro-iot': setDialog({ lines: ['Canteiro inteligente: o sensor mede a umidade da terra.', `Umidade agora: ${55 + Math.round(Math.sin(Date.now() / 60000) * 20)}%. Quando fica seca, o aspersor liga sozinho.`, 'Monte 3 sensores na Casa Inteligente e vire um irrigador para a sua fazenda (MOCHILA).'], i: 0 }); return;
        case 'estacao-tempo': {
          const hh = String(Math.floor(s.hour)).padStart(2, '0');
          setDialog({ lines: [`Estação do tempo WIT · ${hh}h`, `Temperatura: ${22 + Math.round(Math.sin((s.hour - 9) / 24 * Math.PI * 2) * 6)}°C · Vento: fraco · Céu: ${s.hour >= 6 && s.hour < 18.5 ? 'sol' : 'estrelado'}.`, 'Os dados vão para o telão e para a turma de IoT.'], i: 0 });
          return;
        }
        case 'patinetes': setVehicleShop(true); return;
        case 'fliperama': play('super'); setWork({ game: 'teste-jogo' }); return;
        case 'quadra': setDialog({ lines: ['A cesta está baixinha, do seu tamanho.', 'Bora um basquete? Os campeonatos entre guildas chegam em breve!'], i: 0 }); return;
        case 'caixa-envio': setFarmPanel('envio'); return;
        case 'poco': fillCan(); return;
        case 'ninho': {
          const fm = s.farm;
          if (fm.eggsDay >= fm.day) { toast('Você já pegou os ovos de hoje. Volte amanhã!'); return; }
          const n = s.critters.filter(c => c.kind === 'galinha').length || 4;
          s.farm = { ...fm, eggsDay: fm.day }; saveFarm(s.farm);
          saveProgress(doWork(addItem(loadProgress(), 'ovo', n), 'fazendeiro', 'bichos', 3).progress);
          s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: 'ovo' };
          play('coin'); toast(`+${n} ovos! Venda na caixa de envio.`);
          return;
        }
        case 'fruta': {
          const tree = `arvore-${spot.data!.tree as string}`, fm = s.farm;
          if ((fm.milked[tree] ?? 0) >= fm.day) { toast('Esta árvore já deu fruta hoje.'); return; }
          const fruit = `fruta:${spot.data!.fruit as string}`;
          s.farm = { ...fm, milked: { ...fm.milked, [tree]: fm.day } }; saveFarm(s.farm);
          saveProgress(doWork(addItem(loadProgress(), fruit, 3), 'fazendeiro', 'bichos', 2).progress);
          s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: iconOf(fruit) };
          play('coin'); toast(`+3 ${itemName(fruit)}!`);
          return;
        }
      }
    }
    // bicho na frente: tirar leite, tosar, fazer carinho (ou o WIT-Bot conversando)
    const critter = s.critters.find(c => Math.floor(c.x / TILE) === f.tx && Math.floor((c.y - 4) / TILE) === f.ty && c.kind !== 'pato');
    if (critter?.kind === 'gari') {
      critter.wait = 4000; critter.gx = critter.x; critter.gy = critter.y; critter.goal = null;
      critter.face = p.tx * TILE + 8 > critter.x ? 1 : -1;
      play('click');
      setDialog({ lines: [
        'Bip bop! Fui treinado pelos alunos de IA para ajudar o mundo!',
        `Hoje já catei ${critter.picked ?? 0} ${critter.picked === 1 ? 'lixo' : 'lixos'}. Eu vejo o lixo, ando até ele e pego com a pinça.`,
        'Quer me ensinar a andar? No Laboratório de IA tem o trabalho PROGRAMAR ROBÔ.',
      ], i: 0 });
      return;
    }
    // lixo na frente: o jogador também cata
    const trash = s.litter.find(l => Math.floor(l.x / TILE) === f.tx && Math.floor(l.y / TILE) === f.ty);
    if (trash) {
      s.litter.splice(s.litter.indexOf(trash), 1);
      s.pops.push({ x: trash.x, y: trash.y, t: performance.now() });
      play('coin'); toast('Lixo no lixo! O robô gari agradece.');
      return;
    }
    if (critter?.kind === 'robo') {
      critter.wait = 5000; critter.gx = critter.x; critter.gy = critter.y;
      critter.face = p.tx * TILE + 8 > critter.x ? 1 : -1;
      const k = Math.floor(Date.now() / 7000) % BOT_TIPS.length;
      play('click');
      setDialog({ lines: [BOT_TIPS[k], BOT_TIPS[(k + 1) % BOT_TIPS.length]], i: 0 });
      return;
    }
    if (critter) {
      const id = `${critter.kind}-${s.critters.indexOf(critter)}`, fm = s.farm;
      if (critter.kind === 'galinha') { play('click'); toast('Có-có-có!'); return; }
      if ((fm.milked[id] ?? 0) >= fm.day) { toast(critter.kind === 'vaca' ? 'Esta vaca já deu leite hoje.' : 'Esta ovelha já foi tosada hoje.'); return; }
      const item = critter.kind === 'vaca' ? 'leite' : 'la';
      s.farm = { ...fm, milked: { ...fm.milked, [id]: fm.day } }; saveFarm(s.farm);
      saveProgress(doWork(addItem(loadProgress(), item, 1), 'fazendeiro', 'bichos', 3).progress);
      critter.wait = 3000; critter.gx = critter.x; critter.gy = critter.y;
      s.act = { kind: 'colher', t: performance.now(), tx: f.tx, ty: f.ty, icon: iconOf(item) };
      play('coin'); toast(critter.kind === 'vaca' ? '+1 Leite!' : '+1 Lã!');
      return;
    }
    // campo: a ação certa para o bloco (arar, plantar, regar, colher)
    if (fields.some(fd => f.tx >= fd.x0 && f.tx <= fd.x1 && f.ty >= fd.y0 && f.ty <= fd.y1) && !town.solid[f.ty][f.tx] && !npcAt(f.tx, f.ty)) {
      const pr = loadProgress();
      const seeds = s.seed ? pr.itens[`semente:${s.seed}`] ?? 0 : 0;
      const a = actionAt(s.farm, f.tx, f.ty, s.seed, seeds, pr.itens.adubo ?? 0);
      if (a.kind === 'nada') { toast(a.why); return; }
      const r = applyAction(s.farm, f.tx, f.ty, a, rainOn(s.farm.day));
      s.farm = r.farm; saveFarm(r.farm);
      const after = a.kind === 'plantar' ? addItem(pr, `semente:${a.crop}`, -1) : a.kind === 'adubar' ? addItem(pr, 'adubo', -1)
        : r.harvested ? addItem(pr, `colheita:${r.harvested}`, r.amount ?? 1) : pr;
      if (a.kind === 'adubar') toast('Adubado! Regue todo dia e a colheita sai de ouro.');
      if (r.quality === 'ouro') toast(`Colheita de ouro! +${r.amount} ${CROP_BY_ID.get(r.harvested!)!.name}`);
      const w = doWork(after, 'fazendeiro', a.kind === 'colher' ? 'colheitas' : a.kind === 'regar' ? 'regas' : null, a.kind === 'colher' ? 5 : 1);
      saveProgress(w.progress);
      if (w.levelUp) toast(`Fazendeiro subiu para o nível ${w.levelUp}!`);
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
      if (town.id === 'fazenda' && s.farm.water < canSize(loadProgress())) { fillCan(); return; }
      startFishing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, panel, town, fishUi, fishPress, openWater]);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // digitando (nome da música, apelido): as teclas são do campo de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
      if (e.key === 'Escape') { setPanel(null); setDialog(null); setEditing(false); setDeckOpen(false); setMapOpen(false); setFishHouse(null); setFarmPanel(null); setCourses(false); setWork(null); setBag(null); setShopUi(null); }
      // I: mochila
      if ((e.key === 'i' || e.key === 'I') && !g.current.inside && !g.current.modal) setBag('mochila');
      if ((e.key === 'm' || e.key === 'M') && !g.current.inside) setMapOpen(o => !o);
      // F: foto
      if ((e.key === 'f' || e.key === 'F') && !g.current.inside && !g.current.modal) takePhoto();
      if (e.key >= '1' && e.key <= '4' && !g.current.inside && !g.current.modal) emote(+e.key - 1);
      if ((e.key === 'v' || e.key === 'V') && !g.current.inside && !g.current.modal) toggleRide();
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
      const sa = storyArrive(storyCtx(town.id, s.hour, s.farm.day), s.player.tx, s.player.ty);
      if (sa.falas) { s.path = []; s.held = []; setDialog({ lines: sa.falas, i: 0 }); return; }
      const door = town.doors.find(d => d.tx === s.player.tx && d.ty === s.player.ty);
      if (door && s.player.dir === 'north') {
        s.path = []; s.held = [];
        // história: a porta pode contar uma coisa (e segurar o aluno do lado de fora)
        const sd = storyDoor(door.building, storyCtx(town.id, s.hour, s.farm.day));
        if (sd.falas) { setDialog({ lines: sd.falas, i: 0 }); s.player.ty += 1; s.player.dir = 'south'; return; }
        // entrega para esta porta: entrega e não entra
        const pe = loadProgress();
        if (pe.entrega && pe.entrega.zona === town.id && pe.entrega.porta === door.building) {
          const fin = finishDelivery(pe, Date.now())!;
          if ('reason' in fin) { setDialog({ lines: [`${door.name}: ${fin.reason}`], i: 0 }); s.player.ty += 1; s.player.dir = 'south'; return; }
          saveProgress(fin.progress); play('coin');
          const who = pe.entrega.prof ? PROF_BY_ID.get(pe.entrega.prof)!.name : 'Entregador';
          setDialog({ lines: [fin.unpaid ? `Entregue em ${door.name}! Hoje as entregas já renderam o máximo: esta valeu só experiência.` : `Entregue em ${door.name}! +${fin.coins} moedas${fin.late ? ' (atrasada: metade)' : ''}.`, ...(fin.levelUp ? [`${who} subiu para o nível ${fin.levelUp}!`] : []), pe.entrega.prof ? 'Tem mais encomendas no seu local de trabalho.' : 'Pegue outra na Central de Entregas (Cidade WIT).'], i: 0 });
          s.player.ty += 1; s.player.dir = 'south';
          return;
        }
        if (WORK_DOORS[door.building]) { setWork(WORK_DOORS[door.building]); s.player.ty += 1; s.player.dir = 'south'; return; }
        if (door.building === 'mercado' || door.building === 'casa-fazenda' || door.building === 'entregas') {
          setShopUi(door.building === 'mercado' ? 'mercado' : door.building === 'casa-fazenda' ? 'cozinha' : 'entregas');
          s.player.ty += 1; s.player.dir = 'south';
          return;
        }
        // a Torre abre no andar mais alto já liberado
        if (door.building === 'torre') { const pt = loadProgress(); setInside({ kind: 'torre', andar: Math.min(pt.andar, pt.towerMax) }); }
        else if (door.building === 'sua-casa') setInside({ kind: 'casa' });
        else if (Object.values(ROOM_BUILDING).includes(door.building)) {
          // a primeira sala de cada prédio (a Arena abre no saguão)
          const id = Object.keys(ROOM_BUILDING).find(k => ROOM_BUILDING[k] === door.building)!;
          setInside({ kind: 'sala', id });
        }
        else if (door.building === 'casa-pesca') setFishHouse('quadro');
        else if (door.building === 'nucleo-wit') setCourses(true);
        else if (door.building === 'farol') { setDialog({ lines: ['Você sobe a escada em caracol do farol...', 'Lá de cima dá para ver o mundo todo!'], i: 0 }); window.setTimeout(() => setMapOpen(true), 50); s.player.ty += 1; s.player.dir = 'south'; }
        // casa de morador: entra (móveis do kit, cada casa do seu jeito)
        else if (!BUILDING_INFO[door.building] && isResidentHouse(door.building)) setInside({ kind: 'sala', id: `${RESIDENT_PREFIX}${door.building}`, title: houseInfo(door.building, door.name).title });
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
      const r = nextDay(s.farm, Date.now(), rainOn(s.farm.day + 1), irrigPlots(loadProgress()));
      s.farm = r.farm; saveFarm(r.farm);
      storyNewDay();
      if (r.paid) { const pr = loadProgress(); r.paid = Math.round(r.paid * shipBonus(pr)); saveProgress({ ...pr, coins: pr.coins + r.paid }); play('coin'); }
      if (r.paid || town.id === 'fazenda') setFishUi({ kind: 'toast', text: `Dia ${r.farm.day}!${r.paid ? ` A caixa de envio pagou ${r.paid} moedas.` : ''}${r.grown ? ` ${r.grown} planta${r.grown > 1 ? 's' : ''} cresce${r.grown > 1 ? 'ram' : 'u'}.` : ''}` });
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
      const running = s.run && !s.starving;
      const onRoad = ROAD_TERRAIN.has(town.terrain[p.ty]?.[p.tx] ?? '');
      if (s.riding && (s.inside || s.sailing)) s.riding = null;
      const ms = s.riding && onRoad ? s.riding.msPerTile : running ? RUN_MS : WALK_MS;
      // a barriga esvazia andando (a pé); guarda a cada ~5 s de caminhada
      if (p.from && !s.sailing && !s.modal) {
        s.hungerAcc += (dt / 1000) * (s.riding && onRoad ? s.riding.hunger : running ? 2 : 1);
        if (s.hungerAcc >= 5) {
          const pr = loadProgress();
          const was = pr.fome;
          const next = spendEnergy(pr, s.hungerAcc, false);
          s.hungerAcc = 0;
          if (next !== pr) saveProgress(next);
          if (was > HUNGRY && next.fome <= HUNGRY) toast('Barriga roncando... Coma algo (MOCHILA).');
          if (was > 0 && next.fome <= 0) toast('Com fome você não consegue correr. Coma algo!');
        }
      }
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
      s.link?.move(p.tx, p.ty, p.dir);
      for (const peer of s.peers.values()) {
        tick(peer.w, dt, {
          msPerTile: WALK_MS, blocked: () => false, fromPath: true,
          want: () => peer.path[0] ?? null,
          onStep: () => { peer.path.shift(); },
          onArrive: () => { if (!peer.path.length) peer.w.dir = peer.st.dir; },
        });
        if (peer.w.from) s.dirty = true;
      }
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
      // robô gari e o lixo (alguém sempre joga mais um no chão...)
      for (const c of s.critters) if (c.kind === 'gari') {
        const r = stepGari(c, s.litter, dt, town, Math.random);
        if (r.moved || r.picked) s.dirty = true;
        if (r.picked) s.pops.push({ x: r.picked.x, y: r.picked.y, t: now });
        if (s.litter.length < 6 && now - s.litterAt > 18000) { s.litterAt = now; s.litter.push(...spawnLitter(town, c.home, 1, Math.random)); s.dirty = true; }
      }
      if (s.pops.length) { s.pops = s.pops.filter(p => now - p.t < 600); s.dirty = true; }
      // drones: voam em linha reta até um ponto e escolhem outro
      for (const d of s.drones) {
        const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy), v = (32 * dt) / 1000;
        if (dist < v) { d.tx = Math.random() * town.ground.w; d.ty = 40 + Math.random() * (town.ground.h - 80); }
        else { d.x += (dx / dist) * v; d.y += (dy / dist) * v; }
      }
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
      const animKey = s.animRates.map(ms => Math.floor(now / ms)).join(',') + (s.field.targets.length ? `|${Math.floor(now / 90)}` : '');
      if (animKey !== lastAnimKey) { lastAnimKey = animKey; s.dirty = true; }
      // relógio do jogo: a luz muda aos poucos; à noite os pulsos correm nos circuitos
      s.hour = (s.hour + (dt * s.clockSpeed) / MS_PER_HOUR) % 24;
      if (s.hourSeen < 6 && s.hour >= 6) newDay();
      s.hourSeen = s.hour;
      const tod = timeOfDay(s.hour);
      const todKey = Math.round(s.hour * 30);
      if (todKey !== lastTodKey) { lastTodKey = todKey; s.dirty = true; }
      if (tod.light > 0) { const pk = Math.floor(now / 60); if (pk !== lastPulse) { lastPulse = pk; s.dirty = true; } }
      if (Math.floor(s.hour) !== lastHourShown) { lastHourShown = Math.floor(s.hour); setClock(s.hour); refreshStory(); }
      // nome do lugar quando o jogador chega perto de uma porta
      if (p.tx !== lastNearTile.x || p.ty !== lastNearTile.y) {
        lastNearTile = { x: p.tx, y: p.ty };
        // pisou num ponto do trabalho de campo
        const ft = fieldNow().find(t => !t.npc && t.tx === p.tx && t.ty === p.ty);
        if (ft) {
          const lines = doTarget(ft, p.tx * TILE + 8, p.ty * TILE + 8);
          if (lines) { if (lines.length > 1) setDialog({ lines, i: 0 }); else toast(lines[0]); }
        }
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
      // poste inteligente (IoT): fraquinho à noite, acende forte quando alguém chega perto
      const ppx = pixelPos(p, TILE);
      const smartOn = (l: (typeof town.lamps)[number], on: number) => {
        if (!l.smart || on <= 0) return on;
        const d = Math.hypot(l.ground[0] - ppx.x - 8, l.ground[1] - ppx.y - 8);
        return on * (0.28 + 0.72 * Math.max(0, Math.min(1, 1 - (d - 28) / 56)));
      };
      const lampsOn = lit ? town.lamps.map((l, i) => ({ l, i, on: smartOn(l, lampPower(s.hour, l.seed)) }))
        .filter(({ l, on }) => on > 0 && l.bulb[0] > camX - 40 && l.bulb[0] < camX + vw + 40 && l.bulb[1] > camY - 60 && l.bulb[1] < camY + vh + 60) : [];
      if (lampsOn.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (const { l, on } of lampsOn) {
          const k = Math.min(1, tod.light * 1.3) * (l.smart ? on : 1);
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
        const frameMs = (w === s.player && s.run && !s.starving ? RUN_MS : WALK_MS) / (n / 2);
        let img = fr.walk[w.dir][w.anim > 0 ? Math.floor(w.anim / frameMs) % n : 0];
        // emote: 4 voltas da animação, parado; andar cancela
        if (w === s.player && s.emote && s.emotes) {
          const k = Math.floor((performance.now() - s.emote.t0) / 170);
          if (k < 16 && !w.from) { img = s.emotes[s.emote.row][k % 4]; s.dirty = true; } else s.emote = null;
        }
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
              // sentado dentro do barco: metade de trás do casco, o boneco da cintura
              // para cima com a cintura no meio do casco e a metade da frente por cima
              const bc = s.boatCanvases[w.dir], bob = Math.sin(now / 420) * 0.6;
              const bxc = pos.x + 8 - camX, byc = pos.y + 9 - camY + bob;
              const bw = bc.width / R, bh = bc.height / R, bx0 = Math.round(bxc - bw / 2), by0 = Math.round(byc - bh / 2);
              const half = Math.round(bc.height / 2);
              ctx.drawImage(bc, 0, 0, bc.width, half, bx0, by0, bw, half / R);
              drawOars(ctx, bxc, byc, w.dir, !!w.from, now);
              // cintura logo abaixo da borda da frente do casco (que vem por cima)
              const src = white ? img : tinted(img, tintKey, tintCss);
              drawSeated(ctx, src, Math.round(bxc - fr.w / 2), Math.round(byc + 1), fr.waist[w.dir]);
              ctx.drawImage(bc, 0, half, bc.width, bc.height - half, bx0, by0 + half / R, bw, (bc.height - half) / R);
              return;
            }
            const inGrass = town.terrain[ty]?.[tx] === 'mato';
            if (!inGrass && !(w === s.player && s.seat)) {
              ctx.fillStyle = 'rgba(30,50,60,0.3)';
              ctx.beginPath(); ctx.ellipse(x + fr.w / 2, y + fr.foot[w.dir], Math.min(7, fr.w / 3), 2.5, 0, 0, Math.PI * 2); ctx.fill();
            }
            // poeirinha nos pés de quem corre
            if (w === s.player && ((s.run && !s.starving) || s.riding) && w.from) {
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
              // sentado (até o GPT fazer o quadro de sentar): o tronco inteiro, o quadril
              // desce 2 px até o assento e só as pernas encolhem para a frente
              const src = white ? img : tinted(img, tintKey, tintCss), wst = fr.waist[w.dir];
              const sx = x + s.seat.dx, legs = src.height / R - wst, LEG = 3, sy = y + 2;
              ctx.drawImage(src, 0, 0, src.width, wst * R, sx, sy, src.width / R, wst);
              ctx.drawImage(src, 0, wst * R, src.width, legs * R, sx, sy + wst, src.width / R, LEG);
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
        const fc = frames[c.kind === 'gari' ? (moving ? Math.floor(now / 160) % 2 : c.wait > 300 && c.wait < 1000 ? 2 : 0)
          : c.kind === 'pato' ? Math.floor(now / 450 + c.seed * 4) % frames.length : moving ? Math.floor(now / 220) % frames.length : c.kind === 'galinha' && Math.sin(now / 700 + c.seed * 20) > 0.6 ? 1 : 0];
        const bobY = c.kind === 'pato' ? Math.round(Math.sin(now / 500 + c.seed * 9) * 2) / 2 : 0;
        list.push({
          baseY: c.y,
          draw: () => {
            if (c.kind !== 'pato') { ctx.fillStyle = 'rgba(30,50,60,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, fc.width / R / 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }
            put(fc, Math.round(cx - fc.width / R / 2), Math.round(cy - fc.height / R + (c.kind === 'pato' ? 3 : 2) + bobY));
          },
        });
      }
      // lixo no chão e o brilho de quando é catado
      if (s.litterCanvases) for (const l of s.litter) {
        const lc = s.litterCanvases[l.kind], lx = l.x - camX, ly = l.y - camY;
        if (lx < -10 || lx > vw + 10 || ly < -10 || ly > vh + 10) continue;
        list.push({ baseY: l.y - 4, draw: () => put(lc, Math.round(lx - lc.width / R / 2), Math.round(ly - lc.height / R / 2)) });
      }
      // pontos do trabalho de campo: losango pulando (ou o bug piscando, só de perto)
      const fjob = s.field.targets.length ? FIELD_BY_ID.get(loadProgressCached().campo?.job ?? '') : undefined;
      if (fjob) for (const t of s.field.targets) {
        let wx = t.tx * TILE + 8, wy = t.ty * TILE + 8;
        if (t.npc) { const n = s.npcs.find(nn => nn.def.id === t.npc); if (!n) continue; const np = pixelPos(n.w, TILE); wx = np.x + 8; wy = np.y + 8; }
        if (fjob.hidden && Math.abs(t.tx - p.tx) + Math.abs(t.ty - p.ty) > 6) continue;
        const mx = wx - camX, my = wy - camY;
        if (mx < -20 || mx > vw + 20 || my < -40 || my > vh + 20) continue;
        list.push({ baseY: wy + 30, draw: () => {
          if (fjob.hidden) {
            // bug: blocos coloridos fora do lugar, piscando
            const jit = Math.floor(now / 110);
            if (jit % 7 !== 0) { ctx.strokeStyle = '#ff3ad0'; ctx.lineWidth = 1; ctx.strokeRect(mx - 8 + (jit % 3) - 1, my - 8, 16, 16); }
            for (let k = 0; k < 9; k++) {
              if (Math.sin(now / 70 + k * 2.1) < -0.3) continue;
              ctx.fillStyle = ['#ff3ad0', '#3affd8', '#fff23a'][k % 3];
              ctx.fillRect(mx - 8 + ((k * 5 + jit) % 13), my - 8 + ((k * 7 + jit * 3) % 13), 4 + (k % 2) * 2, 2 + (k % 3));
            }
            return;
          }
          const bob = Math.sin(now / 220) * 2.5, top = my - (t.npc ? 34 : 18) + bob;
          if (!t.npc) { ctx.strokeStyle = fjob.color; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 300); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(mx, my + 4, 7, 3.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
          ctx.fillStyle = fjob.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(mx, top - 6); ctx.lineTo(mx + 5, top); ctx.lineTo(mx, top + 6); ctx.lineTo(mx - 5, top); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.fillRect(mx - 1, top - 1, 2, 2);
        } });
      }
      // história: "!" em quem tem passo, brilho no bloco de pegar, "!" na porta
      {
        const bang = (x: number, y: number) => {
          ctx.fillStyle = '#2e2a40'; ctx.fillRect(x - 4, y - 11, 8, 14);
          ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 3, y - 10, 6, 12);
          ctx.fillStyle = '#2e2a40'; ctx.fillRect(x - 1, y - 8, 2, 6); ctx.fillRect(x - 1, y - 1, 2, 2);
        };
        const bob = Math.sin(now / 220) * 2;
        for (const id of s.story.quem) {
          const n = s.npcs.find(nn => nn.def.id === id);
          if (!n) continue;
          const np = pixelPos(n.w, TILE), mx = np.x + 8 - camX, my = np.y - 28 - camY + bob;
          if (mx < -20 || mx > vw + 20 || my < -20 || my > vh + 40) continue;
          list.push({ baseY: np.y + 40, draw: () => bang(mx, my) });
        }
        for (const [tx, ty] of s.story.blocos) {
          const cx = tx * TILE + 8 - camX, cy = ty * TILE + 8 - camY;
          if (cx < -20 || cx > vw + 20 || cy < -20 || cy > vh + 20) continue;
          list.push({ baseY: ty * TILE + 30, draw: () => {
            const k = 0.5 + 0.5 * Math.sin(now / 250);
            ctx.strokeStyle = '#ffd84a'; ctx.globalAlpha = 0.45 + 0.35 * k; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(cx, cy + 4, 7, 3.5, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 0.7 + 0.3 * k; ctx.fillStyle = '#fff4b0';
            ctx.fillRect(cx - 0.5, cy - 6 - k * 2, 1, 12 + k * 4); ctx.fillRect(cx - 6 - k * 2, cy - 0.5, 12 + k * 4, 1); ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
            ctx.globalAlpha = 1;
          } });
        }
        for (const b of s.story.portas) {
          const d = town.doors.find(dd => dd.building === b);
          if (!d) continue;
          const mx = d.tx * TILE + 8 - camX, my = d.ty * TILE - 30 - camY + bob;
          if (mx < -20 || mx > vw + 20 || my < -20 || my > vh + 40) continue;
          list.push({ baseY: d.ty * TILE + 60, draw: () => bang(mx, my) });
        }
      }
      for (const pp of s.pops) {
        const k = (now - pp.t) / 600, px = pp.x - camX, py = pp.y - camY;
        list.push({ baseY: pp.y + 20, draw: () => {
          ctx.strokeStyle = `rgba(160,255,120,${1 - k})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(px, py, 2 + k * 7, 0, Math.PI * 2); ctx.stroke();
          for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2 + k; ctx.fillStyle = `rgba(230,255,200,${1 - k})`; ctx.fillRect(px + Math.cos(an) * (3 + k * 9) - 0.5, py + Math.sin(an) * (3 + k * 9) - 0.5 - k * 4, 1, 1); }
        } });
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
              const im = iconImage(a.icon);
              if (im.complete && im.naturalWidth) ctx.drawImage(im, cx - 8, fy - 38 - life * 10, 16, 16);
              ctx.globalAlpha = 1;
            }
          },
        });
        if (age > 700) s.act = null;
      }
      // telinha da Torre: o andar em que o aluno está (acesa, não escurece)
      const ts = town.towerScreen;
      if (ts) {
        const n = loadProgressCached().andar;
        if (s.floorSign?.n !== n) {
          const t = String(n), pm = new Pixmap(textWidth(t) + 2, 9);
          drawText(pm, t, 1, 1, { fill: [184, 255, 122], shadow: [30, 70, 20] });
          s.floorSign = { n, c: toCanvas(pm) };
        }
        const fc = s.floorSign.c, x = ts.x - camX, y = ts.y - camY;
        if (x < vw && x + ts.w > 0 && y < vh && y + ts.h > 0) list.push({
          baseY: ts.baseY + 0.01,
          draw: () => {
            // a tela da arte é baixinha: abre um painel do tamanho do número, centrado nela
            const pw = Math.max(ts.w, fc.width + 4), ph = fc.height + 1;
            const px = Math.round(x + ts.w / 2 - pw / 2), py = Math.round(y + ts.h / 2 - ph / 2);
            ctx.fillStyle = '#2e3a34'; ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
            ctx.fillStyle = '#0c1a10'; ctx.fillRect(px, py, pw, ph);
            ctx.drawImage(fc, Math.round(px + (pw - fc.width) / 2), py + 1);
          },
        });
      }
      // telão do Jornal WIT: cabeçalho e manchetes correndo (acende à noite: não escurece)
      if (s.news && town.screens) for (const sc of town.screens) {
        const x = sc.x - camX, y = sc.y - camY;
        if (x > vw || x + sc.w < 0 || y > vh || y + sc.h < 0) continue;
        const nw = s.news;
        list.push({
          baseY: sc.baseY + 0.01,
          draw: () => {
            ctx.fillStyle = '#0e1a24'; ctx.fillRect(x, y, sc.w, sc.h);
            ctx.fillStyle = '#5a9a2a'; ctx.fillRect(x, y, sc.w, 6);
            ctx.drawImage(nw.head, x + 2, y + 0.5, nw.head.width / 2, nw.head.height / 2);
            const hh = Math.floor(s.hour), mm = Math.floor((s.hour % 1) * 60);
            ctx.fillStyle = '#e8ffd8'; ctx.font = '4px monospace'; ctx.textAlign = 'right';
            ctx.fillText(`${String(hh).padStart(2, '0')}:${String(mm - (mm % 10)).padStart(2, '0')}`, x + sc.w - 2, y + 4.5);
            // faixa: 9 px de fonte em dobro = 9 px do mundo; anda 20 px por segundo
            const sw = nw.strip.width / R, off = (now / 50) % sw;
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 1, y + 7, sc.w - 2, sc.h - 8); ctx.clip();
            // a cada 16 s, 6 s de foto do álbum (as fotos dos alunos no telão)
            const pics = s.telaoPhotos.filter(t => t.im.complete && t.im.naturalWidth);
            const pic = pics.length && now % 16000 > 10000 ? pics[Math.floor(now / 16000) % pics.length] : null;
            if (pic) {
              const bw = sc.w - 2, bh = sc.h - 8, sc2 = Math.max(bw / pic.im.naturalWidth, bh / pic.im.naturalHeight);
              const iw = pic.im.naturalWidth * sc2, ih = pic.im.naturalHeight * sc2;
              ctx.drawImage(pic.im, x + 1 + (bw - iw) / 2, y + 7 + (bh - ih) / 2, iw, ih);
              ctx.fillStyle = 'rgba(10,20,30,0.7)'; ctx.fillRect(x + 1, y + sc.h - 6, sc.w - 2, 5);
              ctx.fillStyle = '#e8ffd8'; ctx.font = '4px monospace'; ctx.textAlign = 'left';
              ctx.fillText(`FOTO: ${pic.lugar}`.slice(0, 48), x + 3, y + sc.h - 2.2);
            } else
            for (let k = -1; k <= Math.ceil(sc.w / sw); k++) ctx.drawImage(nw.strip, x - off + k * sw, y + 9 + (sc.h - 16) / 2 - 4.5, sw, nw.strip.height / R);
            // linhas de "tela" e o brilho de cima
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let yy = 8; yy < sc.h; yy += 1.5) ctx.fillRect(x, y + yy, sc.w, 0.5);
            ctx.restore();
          },
        });
      }
      // sombra dos drones no chão
      if (s.droneCanvases) for (const d of s.drones) {
        const x = d.x - camX, y = d.y - camY + 30;
        if (x < -20 || x > vw + 20 || y < -20 || y > vh + 20) continue;
        ctx.fillStyle = 'rgba(20,30,40,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
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
      for (const peer of s.peers.values()) person(peer.w, peer.frames);
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
        for (const { l, i, on } of lampsOn) {
          const k = Math.min(1, tod.light * 1.3) * (l.smart ? on : 1);
          const n = s.lampNights[i];
          if (n) { ctx.globalAlpha = l.smart ? Math.max(0.35, on) : 1; ctx.drawImage(n, l.x - camX, l.y - camY, n.width / R, n.height / R); ctx.globalAlpha = 1; }
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
      // chuva (o mesmo dia da fazenda para o mundo todo): céu mais escuro e pingos caindo
      if (rainOn(s.farm.day)) {
        ctx.fillStyle = 'rgba(30,40,70,0.18)'; ctx.fillRect(0, 0, vw, vh);
        ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < 140; i++) {
          const sx = ((i * 97.13 + now * 0.05) % (vw + 40)) - 20;
          const sy = ((i * 53.71 + now * 0.32 + (i % 7) * 41) % (vh + 30)) - 15;
          ctx.moveTo(sx, sy); ctx.lineTo(sx - 2, sy + 7);
        }
        ctx.stroke();
        s.dirty = true;
      }
      // neblina da história (manhã no Lago, quando o passo pede): véu claro e faixas passando
      if (s.story.fog) {
        ctx.fillStyle = 'rgba(214,222,232,0.42)'; ctx.fillRect(0, 0, vw, vh);
        for (let i = 0; i < 5; i++) {
          const y = ((i * 61 + now * 0.004 * (i % 2 ? 1 : -1)) % (vh + 40)) - 20;
          ctx.fillStyle = 'rgba(236,240,246,0.22)'; ctx.fillRect(0, y, vw, 18 + (i % 3) * 8);
        }
        s.dirty = true;
      }
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
      if (s.fala && Date.now() - s.fala.t < FALA_MS) { plateAt(p, plateCanvas(FALAS[s.fala.i], undefined, PLATE_FALA)); s.dirty = true; }
      for (const n of s.npcs) {
        if (Math.abs(n.w.tx - p.tx) + Math.abs(n.w.ty - p.ty) <= 3) plateAt(n.w, plateCanvas(n.def.name, n.def.title, PLATE_NPC));
      }
      for (const peer of s.peers.values()) {
        plateAt(peer.w, plateCanvas(peer.st.nick, peer.st.title, PLATE_OTHER));
        const f = peer.st.fala;
        if (f && Math.abs(Date.now() - f.t) < FALA_MS) { plateAt(peer.w, plateCanvas(FALAS[f.i], undefined, PLATE_FALA)); s.dirty = true; }
      }
      // drones voando por cima de tudo
      if (s.droneCanvases) for (const d of s.drones) {
        const x = d.x - camX, y = d.y - camY - Math.sin(now / 400 + d.seed * 9);
        if (x < -20 || x > vw + 20 || y < -20 || y > vh + 20) continue;
        const c = s.droneCanvases[Math.floor(now / 60) % 2];
        ctx.drawImage(white ? c : tinted(c, tintKey, tintCss), Math.round(x - c.width / R / 2), Math.round(y - c.height / R / 2), c.width / R, c.height / R);
        if (lit) { ctx.fillStyle = `rgba(80,255,140,${0.8 * tod.light})`; ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 1, 1, 1); }
      }
      // tem algo para usar na frente: aviso do botão em cima da cabeça
      if (!p.from && !s.modal && !s.fish && !s.seat && !s.act) {
        const f = ahead(p);
        const inF = fields.some(fd => f.tx >= fd.x0 && f.tx <= fd.x1 && f.ty >= fd.y0 && f.ty <= fd.y1);
        const can = s.npcs.some(n => n.w.tx === f.tx && n.w.ty === f.ty)
          || town.spots.some(sp => sp.tx === f.tx && sp.ty === f.ty && sp.kind !== 'cais' && sp.kind !== 'ponte' && sp.kind !== 'campo' && sp.kind !== 'barco')
          || (!!s.boat && s.boat.tx === f.tx && s.boat.ty === f.ty)
          || s.critters.some(c => c.kind !== 'pato' && Math.floor(c.x / TILE) === f.tx && Math.floor((c.y - 4) / TILE) === f.ty)
          || s.litter.some(l => Math.floor(l.x / TILE) === f.tx && Math.floor(l.y / TILE) === f.ty)
          || (inF && !town.solid[f.ty]?.[f.tx])
          || (s.sailing ? !!town.terrain[f.ty] && !town.solid[f.ty]?.[f.tx] : openWater(f.tx, f.ty))
          || town.objects.some(o => o.id.startsWith('banco') && f.ty === Math.floor((o.baseY - 1) / TILE) && f.tx >= Math.floor(o.x / TILE) && f.tx < Math.ceil((o.x + o.pix.w) / TILE));
        if (can) { const pos = pixelPos(p, TILE); drawHint(ctx, pos.x + 25 - camX, pos.y - 6 - camY + (s.sailing ? 2 : 0), touch ? 'A' : 'ESPAÇO', now); }
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
    // tocar num colega (ou na cabeça dele, um bloco acima): abre o cartão de perfil
    for (const peer of s.peers.values()) {
      if (peer.st.handle && peer.w.tx === tx && (peer.w.ty === ty || peer.w.ty === ty + 1)) { setCard(peer.st.handle); return; }
    }
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
    const id = from.kind === 'torre' ? 'torre' : from.kind === 'casa' ? 'sua-casa' : from.id.startsWith(RESIDENT_PREFIX) ? from.id.slice(RESIDENT_PREFIX.length) : ROOM_BUILDING[from.id];
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
        {!touch && <div className="text-white/70 mt-1">SETAS/WASD andar · SHIFT correr · ESPAÇO falar/pescar{town.id === 'fazenda' ? '/plantar · Q E semente' : ''} · M mapa · F foto · 1-4 emote · T hora</div>}
        {!ready && <div className="text-yellow-300 mt-1">carregando...</div>}
      </div>
      {!inside && !pathOpen && <StoryHud onOpen={() => setCaderno(true)} />}

      <div className="absolute top-2 right-2 flex flex-wrap justify-end items-center gap-1.5 max-w-[calc(100vw-150px)] sm:max-w-none">
        <span className={`px-2 py-1.5 rounded-md bg-black/55 text-[10px] ${pixelFont}`}><HungerBar v={progress.fome} compact /></span>
        <span className={`px-2 py-2 rounded-md bg-black/55 text-yellow-200 text-[10px] flex items-center gap-1 ${pixelFont}`} title="Moedas"><Icon id="moeda" size={14} /> {progress.coins}</span>
        <button onClick={() => setBag('mochila')}
          className={`px-3 py-2 rounded-md bg-[#6a4a2e]/90 border-2 border-[#e8c690] text-white text-[10px] ${pixelFont}`}>MOCHILA</button>
        <button onClick={takePhoto} title="Tirar foto (F)"
          className={`px-3 py-2 rounded-md bg-[#c84a6a]/90 border-2 border-[#ffb0c4] text-white text-[10px] ${pixelFont}`}>FOTO</button>
        <span className="relative">
          <button onClick={() => setFalaOpen(o => !o)} title={muted ? 'O professor desligou o seu balão por uns dias' : 'Falar uma frase'} disabled={muted}
            className={`px-3 py-2 rounded-md bg-[#2a7a8a]/90 border-2 border-[#90e0f0] text-white text-[10px] ${pixelFont}`}>FALAR</button>
          {falaOpen && (
            <span className="absolute right-0 top-full mt-1 z-20 flex flex-col gap-1 p-1.5 rounded-md bg-[#1c2a30]/95 border-2 border-[#90e0f0] w-40">
              {FALAS.map((t, i) => (
                <button key={t} onClick={() => say(i)}
                  className={`text-left px-2 py-1 rounded bg-white/10 hover:bg-white/25 text-white text-[10px] ${pixelFont}`}>{t}</button>
              ))}
            </span>
          )}
        </span>
        <button onClick={() => emote()} title="Emote (teclas 1 a 4)"
          className={`px-3 py-2 rounded-md bg-[#b0721e]/90 border-2 border-[#f0c870] text-white text-[10px] ${pixelFont}`}>EMOTE</button>
        <Radio className={`px-3 py-2 rounded-md bg-[#6a2a8a]/90 border-2 border-[#d0a0f0] text-white text-[10px] ${pixelFont}`} zone={town.id} hour={Math.floor(clock)} />
        <button onClick={() => setMapOpen(true)}
          className={`px-3 py-2 rounded-md bg-[#8a5a2e]/90 border-2 border-[#e8c690] text-white text-[10px] ${pixelFont}`}>MAPA</button>
        <button onClick={() => setDeckOpen(true)}
          className={`px-3 py-2 rounded-md bg-[#3c56b0]/90 border-2 border-[#8fb0ff] text-white text-[10px] ${pixelFont}`}>DECK</button>
        <button
          onClick={() => setEditing(true)}
          className={`px-3 py-2 rounded-md bg-[#2f6b1e]/90 border-2 border-[#8cc63f] text-white text-[10px] ${pixelFont}`}
        >VISUAL</button>
      </div>

      <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-300" style={{ opacity: flash ? 0.85 : 0 }} />

      {editing && !inside && <LookEditor value={look} onChange={setLook} onClose={() => setEditing(false)} />}
      {card && <ProfileCard handle={card} onClose={() => setCard(null)}
        onChallenge={() => { setCard(null); setBag(null); setInside({ kind: 'sala', id: 'arena' }); setFishUi({ kind: 'toast', text: 'Sente numa mesa LIVRE e troquem os códigos do deck.' }); }}
        onTrade={() => { setTradeWith(card); setCard(null); setBag(null); }} />}
      {tradeWith && <TradeHub target={tradeWith} onClose={() => setTradeWith(null)} />}
      {mural && <Mural onClose={() => setMural(false)} onMissions={() => { setMural(false); setBag('missoes'); }} onMaker={() => { setMural(false); setMaker(true); }} />}
      {maker && <ArcadeMaker onClose={() => setMaker(false)} />}

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
            <div className="text-[8px] mt-3 text-[#b0487a]">{fishUi.fish.price ? `Vale ${fishUi.fish.price} moedas na Casa de Pesca` : 'Leve para o lixo da Casa de Pesca'} · toque para continuar</div>
          </div>
        </div>
      )}
      {fishUi?.kind === 'toast' && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-[22%] px-4 py-2 rounded-lg bg-black/70 text-white text-[10px] pointer-events-none ${pixelFont}`}>{fishUi.text}</div>
      )}
      {progress.campo && !inside && (() => {
        const job = FIELD_BY_ID.get(progress.campo.job);
        if (!job) return null;
        const left = fieldLeft(progress, Date.now());
        const here = pendingByZone(progress.campo)[town.id];
        return (
          <div className={`absolute ${progress.entrega ? 'top-40 sm:top-28' : 'top-24 sm:top-14'} right-2 px-3 py-2 rounded-md border-2 border-white/50 text-white text-[9px] leading-4 max-w-[240px] ${pixelFont}`} style={{ background: `${job.color}e6` }}>
            {job.name.toUpperCase()} {progress.campo.feitos.length}/{job.zones.length}{left !== null && ` · ${left > 0 ? `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}` : 'PRAZO!'}`}<br />
            <span className="text-white/85">{here ? `Aqui: ${here} ${job.hidden ? '(procure!)' : '(marcados)'}` : 'Aqui: nenhum'} · {Object.entries(pendingByZone(progress.campo)).filter(([z]) => z !== town.id).map(([z, n]) => `${ZONE_NAMES[z as ZoneId]} ${n}`).join(', ') || 'só aqui'}</span>
          </div>
        );
      })()}
      {progress.entrega && !inside && (
        <div className={`absolute top-24 sm:top-14 right-2 px-3 py-2 rounded-md bg-[#2a8a8a]/90 border-2 border-white/50 text-white text-[9px] leading-4 ${pixelFont}`}>
          <Icon id="pacote" size={14} /> {progress.entrega.nome}<br />
          <span className={progress.entrega.ate < Date.now() ? 'text-[#ffb0b0]' : 'text-[#c8fff0]'}>
            {progress.entrega.ate < Date.now() ? 'ATRASADA' : `${Math.floor((progress.entrega.ate - Date.now()) / 60000)}:${String(Math.floor(((progress.entrega.ate - Date.now()) % 60000) / 1000)).padStart(2, '0')}`}
            {progress.entrega.zona !== town.id && ` · ${ZONE_NAMES[progress.entrega.zona as ZoneId] ?? ''}`}
          </span>
        </div>
      )}
      {work && <WorkPanel game={work.game} also={work.also} shop={work.shop} progress={progress} nick={look.apelido || 'Você'} onClose={() => setWork(null)} />}
      {bag && <Backpack progress={progress} start={bag} onClose={() => { setBag(null); g.current.farm = loadFarm(); setFarmHud(n => n + 1); }}
        onCard={h => setCard(h)}
        onVisit={(h, nick) => {
          // casa de um amigo: só olhar (layout vem do banco)
          visit(h).then(v => { setBag(null); setInside({ kind: 'casa', visita: { layout: v.layout, dono: nick } }); })
            .catch(e => setFishUi({ kind: 'toast', text: socialError(e) }));
        }} />}
      {shopUi === 'mercado' && <MarketPanel progress={progress} onClose={() => setShopUi(null)} onWork={() => { setShopUi(null); setWork({ game: 'grafico' }); }} />}
      {shopUi === 'cozinha' && <KitchenPanel progress={progress} onClose={() => setShopUi(null)} />}
      {shopUi === 'entregas' && <DeliveryPanel progress={progress} zone={town.id} onClose={() => setShopUi(null)} onWork={() => { setShopUi(null); setWork({ game: 'rota' }); }} />}
      {fishHouse && <FishHouse progress={progress} start={fishHouse} onClose={() => setFishHouse(null)} />}
      {courses && <CoursesPanel progress={progress} onClose={() => setCourses(false)} />}
      {farmPanel && <FarmPanel mode={farmPanel} progress={progress} onWork={() => { setFarmPanel(null); setWork({ game: 'calendario' }); }} onClose={() => { setFarmPanel(null); g.current.farm = loadFarm(); setFarmHud(n => n + 1); }} />}
      {town.id === 'fazenda' && !inside && (() => {
        const s = g.current;
        const owned = CROPS.filter(c => (progress.itens[`semente:${c.id}`] ?? 0) > 0);
        if (s.seed && !owned.some(c => c.id === s.seed)) s.seed = null;
        if (!s.seed && owned.length) s.seed = owned[0].id;
        const crop = s.seed ? CROP_BY_ID.get(s.seed)! : null;
        return (
          <div className={`absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#2e2a40]/85 border-2 border-[#e8c690] text-white text-[9px] ${pixelFont}`}>
            <button onClick={() => cycleSeed(-1)} className="px-1.5 py-1 rounded bg-white/15" aria-label="semente anterior">◀</button>
            <span className="min-w-[132px] text-center">{crop ? <><Icon id={iconOf(crop.id)} size={16} /> {crop.name} ×{progress.itens[`semente:${crop.id}`] ?? 0}</> : 'sem sementes'}</span>
            <button onClick={() => cycleSeed(1)} className="px-1.5 py-1 rounded bg-white/15" aria-label="próxima semente">▶</button>
            <span className="ml-2 text-[#8ad0ff] flex items-center gap-1"><Icon id="agua" size={14} /> {s.farm.water}/{canSize(progress)}</span>{s.farm.irrig > 0 && <span className="ml-2">IRRIGADOR ×{s.farm.irrig}</span>}
            <span className="ml-2 text-[#e8c690]">{SEASON_NAME[seasonOf(s.farm.day)].toUpperCase()} · DIA {s.farm.day}</span>
            {(progress.itens.adubo ?? 0) > 0 && <span className="ml-2 flex items-center gap-1"><Icon id="folha" size={14} /> {progress.itens.adubo}</span>}
            {rainOn(s.farm.day) && <span className="ml-2 text-[#8ad0ff]">CHUVA</span>}
            {isFairDay(s.farm.day) && <span className="ml-2 text-[#ffd84a]">FEIRA</span>}
          </div>
        );
      })()}
      {vehicleShop && <VehicleShop onClose={() => setVehicleShop(false)} onChange={() => setProgress(loadProgress())} />}
      {mapOpen && (
        <WorldMap zone={town.id} pos={{ tx: g.current.player.tx, ty: g.current.player.ty }} size={{ w: town.solid[0].length, h: town.solid.length }} plane={progress.veiculos.includes('aviao')}
          ready={ZONES} pending={progress.campo ? pendingByZone(progress.campo) : undefined} onClose={() => setMapOpen(false)}
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
      {pathOpen && <PathChooser onDone={() => setPathOpen(false)} />}
      {deckOpen && <DeckBuilder progress={progress} onClose={() => setDeckOpen(false)} />}
      {inside && (
        <InteriorView sala={inside} look={look} pet={look.pet ?? DEFAULT_PET} onExit={exitInterior}
          house={{
            hour: () => g.current.hour,
            // dormir: o relógio passa para as 6h (o dia da fazenda vira no laço)
            onSleep: () => { g.current.hour = 5.995; g.current.hourSeen = 5.99; setClock(5.995); },
            onVisual: () => setEditing(true),
          }} />
      )}
      {inside && editing && <LookEditor value={look} onChange={setLook} onClose={() => setEditing(false)} />}
      {caderno && !inside && <Caderno ctx={sctx} onClose={() => setCaderno(false)} onLines={l => setDialog({ lines: l, i: 0 })} />}
      {choice && !inside && (
        <StoryChoice pergunta={choice.pergunta} opcoes={choice.opcoes} onPick={i => {
          const r = storyChoose(i, sctx());
          setChoice(null);
          if (r.falas) setDialog({ lines: r.falas, i: 0 });
        }} />
      )}
    </div>
  );
}
