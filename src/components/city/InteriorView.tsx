import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { decodeDeck, encodeDeck } from '@/lib/tcg/deck-code';
import { RoomRewards } from '@/components/packs/RoomRewards';
import { shownTitle } from '@/game/titles';
import { hasTalent } from '@/game/grimoire';
import { towerBoss } from '@/lib/tcg/bosses';
import { play } from '@/game/sfx';
import { PackShop } from '@/components/packs/PackShop';
import { ForgePanel } from '@/components/packs/ForgePanel';
import { buy, buyPrice } from '@/game/market';
import { itemDef, itemIcon, itemLabel } from '@/game/items';
import { Icon } from '@/components/Icon';
import {
  canPlace, catalogOf, footprint, HOUSE_CATS, HOUSE_FLOORS, HOUSE_START, HOUSE_WALLS, houseRoom, layerOf, nextFacing,
  RESIDENT_PREFIX, residentRoom, ROOMS, sanitizeHouse, seatLine, solidGrid, wanderTiles, spriteOf, spriteRect, TILE, towerRoom, type Exit, type Manifest, type Placed, type Room, type RoomNpc,
} from '@/game/interior/room';
import { ahead, DELTA, findPath, newWalker, pixelPos, tick, type Dir, type Walker } from '@/game/world/movement';
import { drawExitMark, drawHint } from '@/game/world/player-acts';
import { BOOK_TIPS, canSleep, houseActAt, STARS, TV_SHOWS, type HouseAct } from '@/game/interior/house-acts';
import { HousePanels, type HousePanel } from './HousePanels';
import { cut, loadAtlas, loadInteriorManifest, sprite } from './interior-atlas';
import { loopSong } from '@/components/work/synth';
import { CLOTH, MOLDE, type Look } from '@/game/world/outfit';
import { PLATE_NPC, PLATE_PLAYER } from '@/game/world/nameplate';
import { DuelView, type RemoteDuel } from '@/components/duel/DuelView';
import { DeckBuilder } from '@/components/duel/DeckBuilder';
import { DuelResult as DuelResultPanel } from '@/components/duel/DuelResult';
import { TcgCard } from '@/components/tcg/TcgCard';
import { AI_NAMES } from '@/lib/tcg/ai';
import { ELEMENT_PT } from '@/lib/tcg/labels';
import { REPLAY_SHARE, tableFoe, TABLES_FOR_BOSS, type Foe } from '@/lib/tcg/opponents';
import {
  activeDeckCards, applyDuel, bossUnlocked, canGoUp, loadProgress, saveProgress, tablesWon, winsOf, type DuelResult, type Progress,
} from '@/game/progress';
import { cloudBossCard, cloudEnabled } from '@/game/cloud';
import { guildHit, party, saveHouse, socialError, socialMe, socialOn } from '@/game/social';
import { ArcadeMaker } from '@/components/social/Arcade';
import { DungeonView } from '@/components/dungeon/DungeonView';
import { AssociationPanel, ASSOC_TABS, type AssocTab } from '@/components/dungeon/AssociationPanel';
import type { PortalMode } from '@/game/hunter';
import { buildMatch, joinTable, reportPvp, validDeck, WO_MS, type PvpAction, type PvpHello, type TableLink } from '@/game/pvp-online';
import { tabId } from '@/game/presence';
import { GuildPanel } from '@/components/social/GuildPanel';
import { TradeHub } from '@/components/social/TradeHub';
import { FurnitureShop } from './FurnitureShop';
import { plantKey, waterPlant } from '@/game/house-life';
import { today } from '@/game/life';
import { furniturePrice, ownsFurniture } from '@/game/furniture';
import { storyCtx, storyExtra, storyTalk, storyTick } from '@/game/story/runtime';
import { Caderno, StoryHud } from '@/components/story/StoryUi';
import {
  drawSeated, loadImage, loadLookFrames, loadNpcFrames, loadPetFrames, plateCanvas, R, type Frames,
} from '@/game/world/sprites';

/**
 * Interior de um prédio (Torre, Sua Casa): anda, conversa, sobe de andar e,
 * na casa, decora (pôr, mover, girar e pintar móveis). Aparece por cima da
 * cidade; `onExit` volta para ela.
 */

/** `visita`: a casa de um amigo (só olhar; vem do banco, wit2_visit). */
export type Sala = { kind: 'torre'; andar: number } | { kind: 'casa'; visita?: { layout: unknown; dono: string } } | { kind: 'sala'; id: string; title?: string };

const WALK_MS = 230, RUN_MS = 125;
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'north', ArrowDown: 'south', ArrowLeft: 'west', ArrowRight: 'east',
  w: 'north', s: 'south', a: 'west', d: 'east', W: 'north', S: 'south', A: 'west', D: 'east',
};
const HOUSE_KEY = 'wit.casa';
const pixelFont = "font-['Press_Start_2P',monospace]";
export { loadInteriorManifest } from './interior-atlas';

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

function savedHouse(m: Manifest, from?: unknown): { items: Placed[]; piso: string; parede: string } {
  try {
    const raw = (from ?? JSON.parse(localStorage.getItem(HOUSE_KEY) ?? 'null')) as { items?: unknown; piso: string; parede: string } | null;
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

type DuelSpec = NonNullable<RoomNpc['duel']>;
/** O adversário de uma mesa (Torre ou Arena). Na Arena o nível acompanha o andar do aluno e a vitória não conta para a Torre. */
function foeFor(d: DuelSpec, name: string, p: Progress): Foe {
  if (d.kind === 'chefe') return towerBoss(d.andar);
  if (d.kind === 'arena') return { ...tableFoe(Math.max(1, p.towerMax), d.mesa + 100, d.table, name), id: foeIdOf(d) };
  return tableFoe(d.andar, d.mesa, d.table, name);
}
const foeIdOf = (d: DuelSpec) => (d.kind === 'chefe' ? `torre-${d.andar}-chefe` : d.kind === 'arena' ? `arena-${d.mesa}` : `torre-${d.andar}-mesa-${d.mesa}`);

function buildRoom(m: Manifest, sala: Sala): Room {
  if (sala.kind === 'torre') return towerRoom(sala.andar);
  if (sala.kind === 'sala' && sala.id.startsWith(RESIDENT_PREFIX)) return residentRoom(m, sala.id.slice(RESIDENT_PREFIX.length), sala.title ?? 'Casa');
  if (sala.kind === 'sala') return (ROOMS[sala.id] ?? ROOMS.arena)();
  const h = savedHouse(m, sala.visita?.layout ?? undefined);
  const r = { ...houseRoom(h.items), piso: h.piso, parede: h.parede };
  return sala.visita ? { ...r, title: `Casa de ${sala.visita.dono}` } : r;
}

/** O que a casa pede para a cidade fazer (o relógio e o visual moram lá). */
export interface HouseHooks { hour: () => number; onSleep: () => void; onVisual: () => void }

export function InteriorView({ sala, look, pet, onExit, house }: { sala: Sala; look: Look; pet: string; onExit: (from: Sala) => void; house?: HouseHooks }) {
  const [m, setM] = useState<Manifest | null>(null);
  useEffect(() => {
    let alive = true;
    loadInteriorManifest().then(x => { if (alive) setM(x); }).catch(err => console.error('interior', err));
    return () => { alive = false; };
  }, []);
  if (!m) return <div className={`absolute inset-0 bg-[#1a1420] flex items-center justify-center text-white/80 text-xs ${pixelFont}`}>entrando...</div>;
  return <Inside m={m} sala={sala} look={look} pet={pet} onExit={onExit} house={house} />;
}

interface Npc {
  def: RoomNpc; w: Walker; frames: Frames | null;
  /** quem passeia: caminho, espera até o próximo passeio e os blocos em que pode parar */
  path: Dir[]; wait: number; spots?: [number, number][];
}
type Holding = { p: Placed; from: Placed | null };

function Inside({ m, sala: sala0, look, pet, onExit, house }: { m: Manifest; sala: Sala; look: Look; pet: string; onExit: (from: Sala) => void; house?: HouseHooks }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sala, setSala] = useState(sala0);
  const [room, setRoom] = useState<Room>(() => buildRoom(m, sala0));
  const [dialog, setDialog] = useState<{ lines: string[]; i: number } | null>(null);
  const [view, setView] = useState({ w: 320, h: 208, scale: 4 });
  const [decor, setDecor] = useState(false);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [cat, setCat] = useState(HOUSE_CATS[0].id);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [ask, setAsk] = useState<{ npc: RoomNpc; foe: Foe } | null>(null);
  const [duel, setDuel] = useState<{ foe: Foe; sprite: string; result?: DuelResult; remote?: RemoteDuel; online?: { key: string; foeHandle?: string } } | null>(null);
  /** PvP online: esperando na mesa, o canal da mesa e se o colega saiu (W.O.). */
  const [online, setOnline] = useState<'off' | 'esperando'>('off');
  const tableLink = useRef<TableLink | null>(null);
  const [foeAway, setFoeAway] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  /** Elevador da Torre aberto (escolher o andar). */
  const [lift, setLift] = useState(false);
  /** Sentado esperando outro aluno (PvP). */
  const [waiting, setWaiting] = useState(false);
  const [pvpCode, setPvpCode] = useState('');
  const [pvpMsg, setPvpMsg] = useState<string | null>(null);
  /** Balcão de quem vende (Dona Ana). */
  const [shopOf, setShopOf] = useState<RoomNpc | null>(null);
  const [shopMsg, setShopMsg] = useState<string | null>(null);
  /** Loja de pacotinhos ou forja abertas (?painel=pacotes|forja abre direto). */
  const [panelOpen, setPanelOpen] = useState<'pacotes' | 'forja' | 'recompensas' | 'guilda' | 'trocas' | 'moveis' | null>(() => {
    const q = new URLSearchParams(window.location.search).get('painel');
    return q === 'pacotes' || q === 'forja' || q === 'recompensas' || q === 'guilda' || q === 'trocas' || q === 'moveis' ? q : null;
  });
  /** Fliperama da casa: criar fase (ou jogar o caça-bugs). */
  const [arcade, setArcade] = useState(false);
  /** História: o Caderno aberto (a sala é a "área" `sala:<id>` para a história). */
  const [caderno, setCaderno] = useState(false);
  const zonaSala = sala.kind === 'sala' ? `sala:${sala.id}` : sala.kind === 'casa' ? 'sala:casa' : 'sala:torre';
  const sctx = useCallback(() => storyCtx(zonaSala, house?.hour() ?? 12), [zonaSala, house]);
  /** Masmorra (telão da Arena; ?masmorra abre direto). */
  /** Masmorra: o portal escolhido (rank 0…5) ou nada. `?masmorra=2` abre o portal C direto. */
  const [dungeon, setDungeon] = useState<number | null>(() => { const q = new URLSearchParams(window.location.search); return q.has('masmorra') ? Math.max(0, Math.min(5, Number(q.get('masmorra')) || 0)) : null; });
  /** Associação dos Caçadores (portões da Associação e telão da Arena; `?associacao=armas` abre direto). */
  const [assoc, setAssoc] = useState<AssocTab | null>(() => { const q = new URLSearchParams(window.location.search).get('associacao'); return q === null ? null : (ASSOC_TABS.includes(q as AssocTab) ? q as AssocTab : 'portais'); });
  const [dungeonMode, setDungeonMode] = useState<PortalMode>({});
  const covered = useRef(false);
  const [partyMsg, setPartyMsg] = useState<string | null>(null);
  /** Tela aberta por um móvel da casa (computador, cozinha, aquário...). */
  const [housePanel, setHousePanel] = useState<HousePanel | null>(() => (new URLSearchParams(window.location.search).get('painel') === 'quebra' ? { kind: 'quebra' } : null));
  /** Luzes da casa apagadas (a sala escurece). */
  const [lightsOff, setLightsOff] = useState(false);
  // casa (a sua e as dos moradores) à noite: um pouco mais escura, como lá fora
  const homey = sala0.kind === 'casa' || (sala0.kind === 'sala' && sala0.id.startsWith(RESIDENT_PREFIX));
  const [night, setNight] = useState(() => homey && canSleep(house?.hour() ?? 12));
  useEffect(() => {
    if (!homey) return;
    const t = window.setInterval(() => setNight(canSleep(house?.hour() ?? 12)), 5000);
    return () => window.clearInterval(t);
  }, [homey, house]);
  const music = useRef<{ stop: () => void; k: number } | null>(null);
  const book = useRef(0);
  /** Faixa grande "ANDAR N" ao chegar num andar. */
  const [floorBanner, setFloorBanner] = useState<number | null>(sala0.kind === 'torre' ? sala0.andar : null);
  // ?duelo=3 (ou chefe) abre o convite da mesa 3 do andar (prints e testes)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('duelo');
    const npc = q && room.npcs.find(n => n.id === (q === 'chefe' ? 'chefe' : `mesa-${q}`));
    const d = npc ? npc.duel : undefined;
    if (!npc || !d) return;
    const foe = foeFor(d, npc.name, loadProgress());
    // &jogar pula o convite e já abre o duelo (medir desempenho, prints)
    if (new URLSearchParams(window.location.search).has('jogar')) setDuel({ foe, sprite: npc.sprite });
    else setAsk({ npc, foe });
    // só ao abrir a sala
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const on = (e: Event) => setProgress((e as CustomEvent<Progress>).detail);
    window.addEventListener('wit-progresso', on);
    return () => window.removeEventListener('wit-progresso', on);
  }, []);
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
    progress: null as unknown as Progress,
    /** Sentado numa mesa vazia esperando um desafiante (PvP): a cadeira e de onde veio. */
    sit: null as { tx: number; ty: number; from: { tx: number; ty: number; dir: Dir } } | null,
  });
  const S = g.current;
  if (import.meta.env.DEV) (window as unknown as { __interior: unknown }).__interior = S;
  S.modal = !!dialog || decor || !!ask || !!duel || deckOpen || lift || !!shopOf || !!panelOpen || !!housePanel || caderno;
  // duelo ou masmorra cobrem a tela toda: a sala para de desenhar por baixo
  covered.current = !!duel || dungeon !== null;
  // senta na mesa online: o primeiro colega que sentar na mesma mesa vira o adversário
  const waitOnline = async () => {
    const me = socialMe();
    if (!cloudEnabled() || !me?.sala || !S.sit) { setPvpMsg('O duelo online precisa estar online (com o banco ligado). Use o código do deck enquanto isso.'); return; }
    const deckIds = (progress.decks[progress.activeDeck] ?? []).slice(0, 20);
    if (deckIds.length !== 20) { setPvpMsg('Monte um deck de 20 cartas antes.'); return; }
    const listeners = new Set<(a: PvpAction) => void>();
    const hello: PvpHello = { tab: tabId(), handle: me.handle, nick: look.apelido || 'Desafiante', look, deck: deckIds };
    setOnline('esperando'); setPvpMsg(null);
    const link = await joinTable(me.sala, `${room.id}-${S.sit.tx}-${S.sit.ty}`, hello, {
      onStart: (st, iAmHost) => {
        const initial = buildMatch(st, iAmHost);
        const other = iAmHost ? st.guest : st.host;
        if (!initial) { setPvpMsg('O deck do colega não é válido.'); leaveTable(); return; }
        const remote: RemoteDuel = { initial, send: a => tableLink.current?.send(a), subscribe: fn => { listeners.add(fn); return () => { listeners.delete(fn); }; } };
        const deck = validDeck(other.deck)!;
        const counts = new Map<string, number>();
        for (const c of deck) counts.set(c.element, (counts.get(c.element) ?? 0) + 1);
        const element = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] as Foe['element'];
        setDuel({ sprite: 'npc-desafiante-07', foe: { id: `online-${st.key}`, name: other.nick, kind: 'mesa', andar: progress.andar, element, life: 150, ai: 3, deck, coins: 0 }, remote, online: { key: st.key, foeHandle: other.handle } });
      },
      onAction: a => listeners.forEach(f => f(a)),
      onAway: away => setFoeAway(away),
    });
    if (!link) { setOnline('off'); return; }
    tableLink.current = link;
  };
  const leaveTable = () => { tableLink.current?.leave(); tableLink.current = null; setOnline('off'); setFoeAway(false); };
  const standUp = () => {
    const st = S.sit;
    if (!st) return;
    leaveTable();
    S.sit = null; setWaiting(false);
    S.player = newWalker(st.from.tx, st.from.ty, st.from.dir);
  };
  // W.O.: o colega saiu da mesa no meio do duelo e não voltou em 1 minuto
  useEffect(() => {
    if (!foeAway || !duel?.online || duel.result) return;
    const t = window.setTimeout(() => {
      const cur = loadProgress();
      const next = { ...cur, stats: { ...cur.stats, pvpVitorias: (cur.stats.pvpVitorias ?? 0) + 1 } };
      saveProgress(next); setProgress(next);
      void reportPvp(duel.online!.key, duel.online!.foeHandle, true);
      setDuel(d => (d ? { ...d, result: { won: true, coins: 0, firstWin: false } } : d));
      leaveTable();
    }, WO_MS);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foeAway, duel?.online, duel?.result]);
  S.progress = progress;
  // ?sentar=1 (prints e testes): senta na 1ª mesa livre da sala ao abrir
  useEffect(() => {
    const k = Number(new URLSearchParams(window.location.search).get('sentar'));
    const t = k ? (room.talks ?? []).filter(x => x.action === 'sentar' && x.seat)[k - 1] : undefined;
    if (!t?.seat) return;
    S.sit = { tx: t.seat[0], ty: t.seat[1], from: { tx: S.player.tx, ty: S.player.ty, dir: S.player.dir } };
    S.player = newWalker(t.seat[0], t.seat[1], 'south');
    setWaiting(true);
  }, [room, S]);

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
    S.npcs = room.npcs.map((def, i) => ({ def, w: newWalker(def.tx, def.ty, def.dir), frames: null, path: [], wait: 600 + i * 900 }));
    const sprites = new Set<string>([room.piso, room.parede, ...(room.patches ?? []).map(p => p.piso), ...room.items.map(p => spriteOf(m, p).id)]);
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

  // casa: guarda cada mudança (no navegador e, com o banco ligado, para as visitas dos amigos)
  const visiting = sala.kind === 'casa' && !!sala.visita;
  useEffect(() => {
    if (room.id !== 'casa' || visiting) return;
    const layout = { items: room.items, piso: room.piso, parede: room.parede };
    try { localStorage.setItem(HOUSE_KEY, JSON.stringify(layout)); } catch { /* sem armazenamento */ }
    const t = window.setTimeout(() => { void saveHouse(layout); }, 3000);
    return () => window.clearTimeout(t);
  }, [room, visiting]);

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
    return solid[ty][tx] || S.npcs.some(n => n.def.wander && n.w.tx === tx && n.w.ty === ty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, solid]);

  // andar da Torre: guarda onde o aluno está (a Torre abre nele) e mostra a faixa grande
  useEffect(() => {
    if (sala.kind !== 'torre') return;
    const p = loadProgress();
    if (p.andar !== sala.andar && sala.andar <= p.towerMax) saveProgress({ ...p, andar: sala.andar });
    setFloorBanner(sala.andar);
    const t = window.setTimeout(() => setFloorBanner(null), 1900);
    return () => window.clearTimeout(t);
  }, [sala]);

  /** Elevador: vai direto para um andar já liberado. */
  const goFloor = (andar: number) => {
    setLift(false);
    if (sala.kind !== 'torre' || andar === sala.andar) return;
    play('drop');
    enter({ kind: 'torre', andar }, towerRoom(andar), 'elevador');
  };

  /** Troca de sala (sobe um andar, entra pelo portal...), aparecendo na entrada certa. */
  const enter = useCallback((next: Sala, r: Room, fromId: string) => {
    const at = r.entries?.[fromId] ?? r.spawn;
    S.player = newWalker(at.tx, at.ty, at.dir);
    S.pet = newWalker(at.tx, at.ty, at.dir);
    S.held = []; S.path = [];
    setSala(next);
    setRoom(r);
  }, [S]);

  const takeExit = useCallback((e: Exit) => {
    if (e.to === 'cidade') {
      if (S.leaving) return;
      S.leaving = true; S.held = []; S.path = [];
      onExit(sala);
      return;
    }
    if (e.to === 'subir') {
      if (sala.kind !== 'torre') return;
      if (!canGoUp(progress, sala.andar)) {
        S.held = [];
        setDialog({ lines: ['A escada está fechada. Vença o chefe deste andar para subir.'], i: 0 });
        return;
      }
      const andar = Math.min(100, sala.andar + 1);
      if (andar === sala.andar) { S.held = []; setDialog({ lines: ['Este é o topo da Torre: o andar 100!'], i: 0 }); return; }
      enter({ kind: 'torre', andar }, towerRoom(andar), room.id);
      return;
    }
    const id = e.to.slice(5);
    if (ROOMS[id]) enter({ kind: 'sala', id }, ROOMS[id](), room.id);
  }, [sala, room, S, enter, onExit, progress]);

  // um móvel da casa em uso (house-acts.ts)
  const furniture = (act: HouseAct, item: Placed) => {
    S.held = [];
    const say = (...lines: string[]) => setDialog({ lines, i: 0 });
    const hour = house?.hour() ?? 12;
    play('click');
    switch (act) {
      case 'dormir':
        if (!canSleep(hour)) { say('Ainda não está com sono. Dá para dormir de noite (depois das 19h).'); return; }
        house?.onSleep(); setLightsOff(false); play('win');
        say('Zzz... Você dormiu a noite toda.', 'Bom dia! São 6h. As plantas regadas da fazenda cresceram.'); return;
      case 'sentar': {
        // senta no móvel: vai para o bloco dele (a frente do sofá cobre as pernas)
        S.sit = { tx: item.tx, ty: item.ty, from: { tx: S.player.tx, ty: S.player.ty, dir: S.player.dir } };
        S.player = newWalker(item.tx, item.ty, 'south'); S.path = [];
        play('drop'); return;
      }
      case 'cozinhar': setHousePanel({ kind: 'cozinha' }); return;
      case 'comer': setHousePanel({ kind: 'mochila', start: 'mochila' }); return;
      case 'computador': setHousePanel({ kind: 'pc' }); return;
      case 'tv': {
        const j = loadProgress().jornal;
        say('Você liga a TV...', TV_SHOWS[Math.floor(Date.now() / 60_000) % TV_SHOWS.length], j?.text ? `Jornal WIT: ${j.text}` : 'Jornal WIT: hoje ainda não tem matéria de aluno. Que tal escrever uma no Estúdio?');
        return;
      }
      case 'musica': {
        const songs = loadProgress().musicas;
        music.current?.stop();
        if (!songs.length) { music.current = null; say('Nenhum disco ainda. Componha uma música no Estúdio de Música (Cidade WIT) e ela toca aqui!'); return; }
        const k = ((music.current?.k ?? -1) + 1) % songs.length, song = songs[k];
        music.current = { stop: loopSong(() => song, () => undefined), k };
        say(`Tocando "${song.nome}"...`, 'Use o toca-discos de novo para trocar de música (ESC ou sair da casa para parar).');
        return;
      }
      case 'violao': setHousePanel({ kind: 'work', game: 'afinar' }); return;
      case 'fliperama': setArcade(true); return;
      case 'pintar': setHousePanel({ kind: 'work', game: 'pixelart' }); return;
      case 'quadros': setHousePanel({ kind: 'quadros' }); return;
      case 'livros': say(BOOK_TIPS[book.current++ % BOOK_TIPS.length]); return;
      case 'trofeus': setHousePanel({ kind: 'mochila', start: 'titulos' }); return;
      case 'aquario': setHousePanel({ kind: 'aquario' }); return;
      case 'telescopio':
        say(canSleep(hour) ? `Você olha pelo telescópio... ${STARS[Math.floor(hour) % STARS.length]}` : 'De dia não dá para ver estrelas. Volte à noite!'); return;
      case 'visual': house?.onVisual(); return;
      case 'pet-cama': S.pet = newWalker(item.tx, item.ty, 'south'); say('Seu pet deita na caminha e se enrola, feliz.'); return;
      case 'pet-comida': play('coin'); say('Nhac, nhac! Seu pet comeu tudo e abanou o rabo.'); return;
      case 'luz': setLightsOff(o => !o); return;
      case 'relogio': say(`O relógio marca ${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}.`); return;
      case 'mural': setHousePanel({ kind: 'mochila', start: 'missoes' }); return;
      case 'banho': say('Banho tomado! Cheirosinho e pronto para a aula.'); return;
      case 'quebra': setHousePanel({ kind: 'quebra' }); return;
      case 'brinquedos': say(['Você monta uma torre de blocos... e ela cai. De novo!', 'Abraço apertado na pelúcia preferida.', 'Achou uma carta perdida no fundo do baú! (Era só uma figurinha.)'][book.current++ % 3]); return;
      case 'planta': {
        const r = waterPlant(loadProgress(), plantKey(item.id, item.tx, item.ty), today());
        if (r.progress !== progress) { saveProgress(r.progress); setProgress(r.progress); }
        play(r.fruit ? 'coin' : 'drop');
        say(r.text); return;
      }
      case 'janela': say(canSleep(hour) ? 'Lá fora, as luzes da cidade piscam e os vaga-lumes passeiam.' : 'Lá fora, a cidade está cheia de gente indo trabalhar.'); return;
    }
  };
  useEffect(() => () => music.current?.stop(), []);

  const interact = useCallback(() => {
    if (dialog) {
      if (dialog.i + 1 < dialog.lines.length) setDialog({ ...dialog, i: dialog.i + 1 });
      else setDialog(null);
      return;
    }
    if (S.modal) return;
    const f = ahead(S.player);
    const npc = S.npcs.find(n => (n.def.wander ? n.w.tx === f.tx && n.w.ty === f.ty : n.def.talk.some(([x, y]) => x === f.tx && y === f.ty)));
    if (npc) {
      const back: Record<Dir, Dir> = { north: 'south', south: 'north', west: 'east', east: 'west' };
      if (Math.abs(npc.w.tx - S.player.tx) + Math.abs(npc.w.ty - S.player.ty) === 1) npc.w.dir = back[S.player.dir];
      // história: o passo com este morador vem antes do duelo, da loja e do painel
      const key = sala.kind === 'sala' ? `${sala.id}.${npc.def.id}` : null;
      if (key) {
        const st = storyTalk(key, sctx());
        if (st.falas) { setDialog({ lines: st.falas, i: 0 }); return; }
      }
      const d = npc.def.duel;
      if (d) {
        if (d.kind === 'chefe' && !bossUnlocked(progress, d.andar)) {
          const falta = TABLES_FOR_BOSS - tablesWon(progress, d.andar);
          setDialog({ lines: [`${npc.def.name}: ${npc.def.lines[0]}`, `Vença mais ${falta} mesa(s) deste andar e volte aqui.`], i: 0 });
          return;
        }
        const foe = foeFor(d, npc.def.name, progress);
        setAsk({ npc: npc.def, foe });
        return;
      }
      if (npc.def.shop) { S.held = []; setShopMsg(null); setShopOf(npc.def); return; }
      if (npc.def.action) { S.held = []; setPanelOpen(npc.def.action); return; }
      const extra = key ? storyExtra(key) : null;
      setDialog({ lines: extra ?? [`${npc.def.name}: ${npc.def.lines[0]}`, ...npc.def.lines.slice(1)], i: 0 });
      return;
    }
    const talk = room.talks?.find(t => t.tiles.some(([x, y]) => x === f.tx && y === f.ty));
    const exit = room.exits.find(e => e.tx === f.tx && e.ty === f.ty && solid[e.ty]?.[e.tx]);
    // olhando para a escada ou o portal: usa (a conversa do portal fica para quem olha de lado)
    if (exit) { takeExit(exit); return; }
    if (sala.kind === 'casa' && !sala.visita) {
      const h = houseActAt(m, room, f.tx, f.ty);
      if (h) { furniture(h.act, h.item); return; }
    }
    if (talk?.action === 'elevador') { S.held = []; setLift(true); return; }
    if (talk?.action === 'pacotes') { S.held = []; setPanelOpen('pacotes'); return; }
    if (talk?.action === 'recompensas') { S.held = []; setPanelOpen('recompensas'); return; }
    if (talk?.action === 'trocas') { S.held = []; setPanelOpen('trocas'); return; }
    if (talk?.action === 'moveis') { S.held = []; setPanelOpen('moveis'); return; }
    if (talk?.action === 'masmorra') { S.held = []; setAssoc('portais'); return; }
    if (talk?.action === 'associacao') { S.held = []; setAssoc(talk.tab ?? 'portais'); return; }
    if (talk?.action === 'sentar' && talk.seat) {
      // senta na cadeira da mesa vazia e espera um colega sentar na frente
      S.sit = { tx: talk.seat[0], ty: talk.seat[1], from: { tx: S.player.tx, ty: S.player.ty, dir: S.player.dir } };
      S.player = newWalker(talk.seat[0], talk.seat[1], 'south');
      S.held = []; S.path = [];
      play('drop'); setWaiting(true);
      return;
    }
    if (talk) setDialog({ lines: talk.lines, i: 0 });
  }, [dialog, room, S, solid, takeExit, progress, sala, m, sctx]);

  // o tempo da história nesta sala (ex.: ficar observando o balcão), só com nada aberto
  useEffect(() => {
    if (dialog || caderno || duel || ask || shopOf || panelOpen || decor) return;
    const id = window.setInterval(() => {
      if (S.modal) return;
      const r = storyTick(sctx(), 500);
      if (r.falas) setDialog({ lines: r.falas, i: 0 });
    }, 500);
    return () => window.clearInterval(id);
  }, [dialog, caderno, duel, ask, shopOf, panelOpen, decor, sctx, S]);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const d = KEY_DIR[e.key];
      if (d && S.sit) { e.preventDefault(); standUp(); return; }
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
      if (covered.current) { last = now; raf = requestAnimationFrame(loop); return; }
      const dt = Math.min(50, now - last); last = now;
      const p = S.player, pt = S.pet;
      const ms = S.run ? RUN_MS : WALK_MS;
      tick(p, dt, {
        msPerTile: ms, blocked, fromPath: !S.held.length,
        want: () => (S.modal || S.leaving ? null : S.held[0] ?? S.path[0] ?? null),
        onStep: from => { petQueue.push(from); if (!S.held.length) S.path.shift(); },
        onArrive: () => {
          // pisou numa saída livre (porta)
          const e = room.exits.find(x => x.tx === p.tx && x.ty === p.ty && !solid[x.ty]?.[x.tx]);
          if (e) takeExit(e);
        },
      });
      // esbarrou numa saída ocupada (escada, portal)
      if (!p.from && S.held.length && !S.modal) {
        const f = ahead(p);
        const e = room.exits.find(x => x.tx === f.tx && x.ty === f.ty && solid[x.ty]?.[x.tx]);
        if (e && S.held[0] === p.dir) { S.held = []; takeExit(e); }
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
      // clientes passeando (andam devagar até um bloco livre do retângulo deles e esperam)
      for (const n of S.npcs) {
        if (!n.def.wander) continue;
        n.wait -= dt;
        const occupied = (x: number, y: number) => blocked(x, y) && !(n.w.tx === x && n.w.ty === y) || (p.tx === x && p.ty === y);
        tick(n.w, dt, {
          msPerTile: WALK_MS * 1.6, blocked: occupied, fromPath: true,
          want: () => {
            if (S.modal) return null;
            if (n.path.length) return n.path[0];
            if (n.wait > 0) return null;
            n.wait = 1800 + Math.random() * 3500;
            // só para onde dá para ver (não atrás de vitrine ou planta)
            const spots = n.spots ??= wanderTiles(m, room, n.def);
            const goal = spots[Math.floor(Math.random() * spots.length)];
            if (goal && !occupied(goal[0], goal[1])) n.path = findPath(n.w.tx, n.w.ty, goal[0], goal[1], occupied).slice(0, 8);
            return null;
          },
          onStep: () => { n.path.shift(); },
        });
      }

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
      // seat: a linha do tampo da mesa à frente (quem senta aparece até a cintura, por cima da mesa)
      const person = (w: Walker, fr: Frames | null, seat: { cut: number; baseY: number } | null = null) => {
        if (!fr) return;
        const pos = pixelPos(w, TILE);
        const n = fr.walk[w.dir].length;
        const frameMs = (w === p && S.run ? RUN_MS : WALK_MS) / (n / 2);
        const img = fr.walk[w.dir][seat ? 0 : w.anim > 0 ? Math.floor(w.anim / frameMs) % n : 0];
        const x = Math.round(pos.x + 8 - fr.w / 2) - camX, y = Math.round(pos.y + 15 - fr.foot[w.dir]) - camY;
        if (seat) {
          list.push({ baseY: seat.baseY + 0.5, draw: () => drawSeated(ctx, img, x, Math.round(seat.cut) - camY, fr.waist[w.dir]) });
          return;
        }
        list.push({
          baseY: pos.y + 16 - 0.5,
          draw: () => {
            ctx.fillStyle = 'rgba(20,14,20,0.3)';
            ctx.beginPath(); ctx.ellipse(x + fr.w / 2, y + fr.foot[w.dir], Math.min(7, fr.w / 3), 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.drawImage(img, x, y, img.width / R, img.height / R);
          },
        });
      };
      if (!decor) {
        if (!S.sit) person(pt, S.petFrames);
        // sentado na mesa vazia: igual aos desafiantes, até a cintura atrás do tampo
        person(p, S.playerFrames, S.sit ? seatLine(m, room, S.sit.tx, S.sit.ty) : null);
      }
      // mesas vazias: plaquinha LIVRE em cima da cadeira
      for (const t of room.talks ?? []) if (t.action === 'sentar' && t.seat && !(S.sit && S.sit.tx === t.seat[0] && S.sit.ty === t.seat[1])) {
        const cx = (t.seat[0] + 0.5) * TILE - camX, y = t.seat[1] * TILE - camY - 4;
        if (cx > -30 && cx < vw + 30 && y > -10 && y < vh + 10) list.push({ baseY: 1e9, draw: () => drawExitMark(ctx, cx, y, 'LIVRE', now) });
      }
      for (const n of S.npcs) {
        // sentado no lugar dele com uma mesa à frente: até a cintura; atrás de balcão: de pé
        const seat = n.def.seated && n.w.tx === n.def.tx && n.w.ty === n.def.ty ? seatLine(m, room, n.def.tx, n.def.ty) : null;
        person(n.w, n.frames, seat);
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
        // sentado, o boneco sobe ou desce até o tampo: a plaquinha acompanha
        const seatDy = (w: Walker, fr: Frames | null, seat: { cut: number } | null) =>
          seat && fr ? Math.round(seat.cut) - fr.waist[w.dir] - (pixelPos(w, TILE).y + 15 - fr.foot[w.dir]) : 0;
        const plate = (w: Walker, c: HTMLCanvasElement, dy = 0) => {
          const pos = pixelPos(w, TILE);
          const pw = c.width / R, ph = c.height / R;
          ctx.drawImage(c, Math.round(pos.x + 8 - pw / 2 - camX), Math.round(pos.y - 13 - ph - camY + dy), pw, ph);
        };
        for (const n of S.npcs) {
          if (Math.abs(n.w.tx - p.tx) + Math.abs(n.w.ty - p.ty) <= 3) {
            const d = n.def.duel;
            const won = d ? winsOf(S.progress, foeIdOf(d)) > 0 : false;
            const seat = n.def.seated && n.w.tx === n.def.tx && n.w.ty === n.def.ty ? seatLine(m, room, n.def.tx, n.def.ty) : null;
            plate(n.w, plateCanvas(n.def.name, won ? `${n.def.title} - VENCIDO` : n.def.title, PLATE_NPC), seatDy(n.w, n.frames, seat));
          }
        }
        plate(p, plateCanvas(look.apelido || 'Você', shownTitle(loadProgress()), PLATE_PLAYER),
          seatDy(p, S.playerFrames, S.sit ? seatLine(m, room, S.sit.tx, S.sit.ty) : null));
        // portas e passagens: placa piscando (uma por grupo)
        const groups = new Map<string, { x0: number; x1: number; ty: number }>();
        for (const e of room.exits) {
          const k = `${e.to}|${e.ty}`, g0 = groups.get(k);
          if (g0) { g0.x0 = Math.min(g0.x0, e.tx); g0.x1 = Math.max(g0.x1, e.tx); } else groups.set(k, { x0: e.tx, x1: e.tx, ty: e.ty });
        }
        for (const [k, g0] of groups) {
          const to = k.split('|')[0];
          const label = to === 'cidade' ? 'SAIR' : to === 'subir' ? 'SUBIR' : to === 'descer' ? 'DESCER' : 'ENTRAR';
          const cx = ((g0.x0 + g0.x1 + 1) / 2) * TILE - camX, y = g0.ty * TILE - camY - (to === 'cidade' ? 4 : 10);
          if (cx > -20 && cx < vw + 20 && y > -10 && y < vh + 10) drawExitMark(ctx, cx, y, label, now);
        }
        // elevador da Torre: placa como a da escada
        for (const t of room.talks ?? []) if (t.action === 'elevador') {
          const xs = t.tiles.map(([x]) => x), ty = Math.min(...t.tiles.map(([, y]) => y));
          const cx = ((Math.min(...xs) + Math.max(...xs) + 1) / 2) * TILE - camX, y = ty * TILE - camY - 6;
          if (cx > -30 && cx < vw + 30 && y > -10 && y < vh + 10) drawExitMark(ctx, cx, y, 'ELEVADOR', now);
        }
        // tem algo para usar na frente: aviso do botão em cima da cabeça
        if (!p.from && !S.modal && !S.sit) {
          const f = ahead(p);
          const can = S.npcs.some(n => (n.def.wander ? n.w.tx === f.tx && n.w.ty === f.ty : n.def.talk.some(([x, y]) => x === f.tx && y === f.ty)))
            || room.talks?.some(t => t.tiles.some(([x, y]) => x === f.tx && y === f.ty))
            || room.exits.some(e => e.tx === f.tx && e.ty === f.ty && solid[e.ty]?.[e.tx]);
          const ha = !can && sala.kind === 'casa' && !decor ? houseActAt(m, room, f.tx, f.ty) : null;
          if (can || ha) { const pos = pixelPos(p, TILE); drawHint(ctx, pos.x + 25 - camX, pos.y - 6 - camY, `${touch ? 'A' : 'ESPAÇO'}${ha ? ` ${ha.label}` : ''}`, now); }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [m, room, solid, blocked, view, decor, holding, look, S, takeExit, touch]);

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
  const title = sala.kind === 'torre' ? `TORRE · ANDAR ${sala.andar}` : room.title.toUpperCase();
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
        {title}{room.id.startsWith('torre') ? <span className="ml-2 text-yellow-200 inline-flex items-center gap-1"><Icon id="moeda" size={12} /> {progress.coins}</span> : null}
        {!touch && !decor && <div className="text-white/70 mt-1">ESPAÇO falar · porta embaixo: sair{sala.kind === 'torre' ? ' · escada: subir · painel: elevador' : ''}{room.id === 'arena' ? ' · portal: Associação dos Caçadores' : ''}</div>}
        {decor && <div className="text-lime-300 mt-1">{holding ? 'toque para pôr · R gira · ESC devolve' : 'escolha um móvel ou toque num para mover'}</div>}
      </div>

      {room.id.startsWith('torre') && (
        <button onClick={() => setDeckOpen(true)}
          className={`absolute top-2 right-2 px-3 py-2 rounded-md bg-[#3c56b0]/90 border-2 border-[#8fb0ff] text-white text-[10px] ${pixelFont}`}>DECK</button>
      )}
      {deckOpen && <DeckBuilder progress={progress} onClose={() => setDeckOpen(false)} />}

      {sala.kind === 'torre' && (
        <div className={`absolute top-14 right-2 rounded-md border-2 border-[#8cc63f] bg-[#0e1a14]/90 px-3 py-1.5 text-center ${pixelFont}`}>
          <div className="text-[7px] text-[#b8ff7a]">ANDAR</div>
          <div className="text-[20px] leading-6 text-white">{sala.andar}</div>
          <div className="text-[6px] text-white/60">DE {progress.towerMax}</div>
        </div>
      )}
      {floorBanner !== null && (
        <div key={floorBanner} className={`absolute top-[26%] left-1/2 -translate-x-1/2 pointer-events-none text-center wit-floor-in ${pixelFont}`}>
          <div className="text-[11px] text-[#b8ff7a] tracking-[0.3em]">TORRE DOS 100 ANDARES</div>
          <div className="text-[44px] leading-[56px] text-white [text-shadow:0_4px_0_#2e2a40,0_0_18px_#8cc63f]">ANDAR {floorBanner}</div>
        </div>
      )}
      <style>{`.wit-floor-in{animation:wit-floor 1.9s ease-out both}@keyframes wit-floor{0%{opacity:0;transform:translate(-50%,-14px) scale(1.15)}12%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0}}`}</style>
      {waiting && (
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-4 w-[min(92vw,560px)] rounded-xl border-4 border-[#8cc63f] bg-[#10202a]/95 p-4 text-white ${pixelFont}`}>
          <div className="text-[11px] text-[#b8ff7a]">{room.id === 'oficina' ? 'MESA DE TROCAS · ESPERANDO UM COLEGA' : 'MESA LIVRE · ESPERANDO UM DESAFIANTE'}<span className="animate-pulse">...</span></div>
          <div className="text-[8px] leading-5 text-white/80 mt-2">{room.id === 'oficina'
            ? 'Quando um colega sentar na sua frente, vocês veem a coleção um do outro e podem pedir uma troca. (Liga quando o servidor da turma estiver pronto.)'
            : 'Desafie um colega agora: ele copia o código do deck dele e você cola aqui. A IA joga com o deck exato dele. Para ser desafiado, passe o SEU código.'}</div>
          {room.id !== 'oficina' && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <button onClick={() => { const c = encodeDeck(look.apelido || 'Colega', progress.decks[progress.activeDeck] ?? []); navigator.clipboard?.writeText(c).catch(() => undefined); setPvpMsg('Seu código foi copiado. Mande para o colega!'); }}
                className="px-3 py-2 rounded bg-[#3a78c8] text-[9px]">COPIAR MEU CÓDIGO</button>
              <input value={pvpCode} onChange={e => setPvpCode(e.target.value)} placeholder="cole o código do colega" className="flex-1 min-w-[160px] px-2 py-2 rounded bg-white text-[#2e2a40] text-[9px]" />
              <button onClick={() => {
                const d = decodeDeck(pvpCode);
                if ('reason' in d) { setPvpMsg(d.reason); return; }
                const counts = new Map<string, number>();
                for (const c of d.cards) counts.set(c.element, (counts.get(c.element) ?? 0) + 1);
                const element = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] as Foe['element'];
                setDuel({ sprite: 'npc-desafiante-07', foe: { id: `pvp-${d.nick}`, name: d.nick, kind: 'mesa', andar: progress.andar, element, life: 150, ai: 3, deck: d.cards, coins: 0 } });
                setPvpMsg(null); setPvpCode('');
              }} className="px-3 py-2 rounded bg-[#e8485a] text-[9px]">DESAFIAR</button>
            </div>
          )}
          {room.id !== 'oficina' && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {online === 'off'
                ? <button onClick={() => void waitOnline()} className="px-3 py-2 rounded bg-[#3a9a5a] text-[9px]">ESPERAR ONLINE</button>
                : <span className="text-[8px] text-[#b8ff7a]">Esperando um colega sentar nesta mesa<span className="animate-pulse">...</span></span>}
              <span className="text-[7px] text-white/60">Duelo ao vivo: cada um joga do seu aparelho.</span>
            </div>
          )}
          {pvpMsg && <div className="mt-2 text-[8px] text-[#ffd84a]">{pvpMsg}</div>}
          <button onClick={standUp} className="mt-3 px-3 py-2 rounded bg-[#4a4660] text-[9px]">LEVANTAR</button>
        </div>
      )}
      {lightsOff ? <div className="hs-dark" /> : night && <div className="hs-night" />}
      {housePanel && (
        <HousePanels panel={housePanel} progress={progress} nick={look.apelido || 'Você'} onClose={() => setHousePanel(null)}
          onOpen={setHousePanel} onDeck={() => { setHousePanel(null); setDeckOpen(true); }} />
      )}
      {panelOpen === 'pacotes' && <PackShop progress={progress} onClose={() => setPanelOpen(null)} />}
      {panelOpen === 'recompensas' && <RoomRewards progress={progress} onClose={() => setPanelOpen(null)} />}
      {panelOpen === 'forja' && <ForgePanel progress={progress} onClose={() => setPanelOpen(null)} />}
      {panelOpen === 'guilda' && <GuildPanel onClose={() => setPanelOpen(null)} />}
      {assoc && dungeon === null && <AssociationPanel tab={assoc} onClose={() => setAssoc(null)} onEnter={(r, m) => { setDungeonMode(m ?? {}); setDungeon(r); }} />}
      {dungeon !== null && <DungeonView look={look} rank={dungeon} mode={dungeonMode} onClose={() => setDungeon(null)} />}
      {arcade && <ArcadeMaker onClose={() => setArcade(false)} onClassic={() => { setArcade(false); setHousePanel({ kind: 'work', game: 'teste-jogo' }); }} />}
      {panelOpen === 'moveis' && m && <FurnitureShop m={m} onClose={() => { setPanelOpen(null); setProgress(loadProgress()); }} />}
      {panelOpen === 'trocas' && <TradeHub onClose={() => { setPanelOpen(null); setProgress(loadProgress()); }} />}
      {shopOf && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-3" onPointerDown={() => setShopOf(null)}>
          <div onPointerDown={e => e.stopPropagation()} className={`w-[min(94vw,480px)] rounded-xl border-4 border-[#c8762a] bg-[#f4efe2] p-4 text-[#2e2a40] ${pixelFont}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-[#c8762a]">{shopOf.name.toUpperCase()} · {shopOf.title.toUpperCase()}</div>
              <span className="text-[10px] text-[#8a6a1a] inline-flex items-center gap-1 ml-auto mr-2"><Icon id="moeda" size={14} /> {progress.coins}</span>
              <button onClick={() => setShopOf(null)} className="px-2 py-1 rounded bg-[#4a4660] text-white text-[10px]">SAIR</button>
            </div>
            <div className="text-[8px] leading-4 text-[#5a5470] mb-2">{shopOf.lines[0]} Doce enche um pouco a barriga.</div>
            {shopOf.shop!.map(id => (
              <div key={id} className="flex items-center gap-2 py-1.5 border-b border-[#e0d8c4]">
                <Icon id={itemIcon(id)} size={30} />
                <div className="flex-1 text-[9px]">{itemLabel(id)} <span className="text-[7px] text-[#5a5470]">· +{itemDef(id)?.food ?? 0} barriga · tem {progress.itens[id] ?? 0}</span></div>
                <button onClick={() => {
                  const r0 = buy(loadProgress(), id);
                  if ('reason' in r0) { setShopMsg(r0.reason); return; }
                  saveProgress(r0.progress); play('coin'); setShopMsg(`+1 ${itemLabel(id)} na mochila`);
                }} className="px-2 py-1.5 rounded bg-[#c8762a] text-white text-[8px] inline-flex items-center gap-1">{buyPrice(id)} <Icon id="moeda" size={10} /></button>
              </div>
            ))}
            {shopMsg && <div className="mt-2 text-[9px] text-[#3a9a5a]">{shopMsg}</div>}
          </div>
        </div>
      )}
      {lift && sala.kind === 'torre' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-3" onPointerDown={() => setLift(false)}>
          <div onPointerDown={e => e.stopPropagation()} className={`w-[min(94vw,560px)] max-h-[90vh] overflow-auto rounded-xl border-4 border-[#8a94a8] bg-[#1e2430] p-4 text-white ${pixelFont}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] text-[#b8ff7a]">ELEVADOR</div>
              <button onClick={() => setLift(false)} className="px-2 py-1 rounded bg-[#4a4660] text-[10px]">SAIR</button>
            </div>
            <div className="text-[9px] leading-5 text-white/80 mb-3">Para qual andar você quer ir? Os andares acima do {progress.towerMax} abrem quando você vence o chefe do andar de baixo.</div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: 100 }, (_, i) => i + 1).map(n => {
                const open = n <= progress.towerMax, here = n === sala.andar;
                return (
                  <button key={n} disabled={!open} onClick={() => goFloor(n)}
                    className={`h-9 rounded border-2 text-[10px] ${here ? 'bg-[#8cc63f] border-white text-[#10202a]' : open ? 'bg-[#2e3a4e] border-[#6a7a94] hover:bg-[#3e4e66]' : 'bg-[#15181e] border-[#262a32] text-white/20'}`}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {room.id === 'casa' && !visiting && socialOn() && !decor && (
        <button onClick={() => { party().then(n => setPartyMsg(n ? `Convite enviado para ${n} amigo${n > 1 ? 's' : ''}! Eles veem ao abrir o jogo.` : 'Você ainda não tem amigos para convidar.')).catch(e => setPartyMsg(socialError(e))); }}
          className={`absolute top-2 right-[110px] px-3 py-2 rounded-md bg-[#c84a8a]/90 border-2 border-[#ffb0d8] text-white text-[10px] ${pixelFont}`}>FESTA</button>
      )}
      {partyMsg && <div onClick={() => setPartyMsg(null)} className={`absolute top-14 right-2 max-w-[320px] px-3 py-2 rounded-md bg-black/70 text-white text-[8px] leading-4 ${pixelFont}`}>{partyMsg}</div>}
      {room.id === 'casa' && !visiting && (
        <button
          onClick={() => { if (decor) { cancelHold(); setDecor(false); } else { setDialog(null); setDecor(true); } }}
          className={`absolute top-2 right-2 px-3 py-2 rounded-md bg-[#2f6b1e]/90 border-2 border-[#8cc63f] text-white text-[10px] ${pixelFont}`}
        >{decor ? 'PRONTO' : 'DECORAR'}</button>
      )}

      {ask && (() => {
        const before = winsOf(progress, ask.foe.id);
        const coins = before ? Math.max(1, Math.round(ask.foe.coins * REPLAY_SHARE)) : ask.foe.coins;
        return (
          <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center bg-black/45 p-3" onPointerDown={() => setAsk(null)}>
            <div onPointerDown={e => e.stopPropagation()} className={`w-[min(94vw,520px)] rounded-xl border-4 border-[#4a4660] bg-white p-4 text-[#2e2a40] ${pixelFont}`}>
              <div className="text-[12px] text-[#3c56b0]">{ask.npc.name}</div>
              <div className="text-[9px] text-[#7a7090] mt-1">{ask.npc.title}</div>
              <div className="text-[11px] leading-5 mt-3">{ask.npc.lines[0]}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-[9px] leading-4 text-[#4a4660]">
                <span>DECK DE {ELEMENT_PT[ask.foe.element].toUpperCase()}</span>
                <span>VIDA: {ask.foe.life}</span>
                <span>DECK: {ask.foe.deck.length} CARTAS</span>
                <span>IA: {AI_NAMES[ask.foe.ai].toUpperCase()}</span>
                <span className="col-span-2 text-[#2f6b1e]">PRÊMIO: {coins} MOEDAS{before ? ' (REVANCHE)' : ''}{ask.foe.kind === 'chefe' ? ' + 1 CARTA DO DECK' : ''}</span>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setAsk(null)} className="px-3 py-2 rounded-md bg-[#e4e0ec] text-[10px]">AGORA NÃO</button>
                <button onClick={() => setDeckOpen(true)} className="px-3 py-2 rounded-md bg-[#3c56b0] text-white text-[10px]">DECK</button>
                <button onClick={() => { setDuel({ foe: ask.foe, sprite: ask.npc.sprite }); setAsk(null); }}
                  className="px-4 py-2 rounded-md bg-[#e8485a] text-white text-[10px] border-2 border-[#b02a3a]">DUELAR!</button>
              </div>
            </div>
          </div>
        );
      })()}

      {duel && (
        <DuelView
          foe={duel.foe}
          foeSprite={duel.sprite}
          deck={activeDeckCards(progress)}
          look={look}
          mat={new URLSearchParams(window.location.search).get('tapete') ?? progress.mat}
          talents={{ novaMao: hasTalent(progress, 'nova-mao'), espiar: hasTalent(progress, 'espiar') }}
          nick={look.apelido || 'Você'}
          remote={duel.remote ? { ...duel.remote, away: foeAway } : undefined}
          onQuit={() => { if (duel.online) leaveTable(); setDuel(null); }}
          onEnd={won => {
            // duelo contra um colega (código do deck ou online): não rende moedas, conta no placar de PvP
            if (duel.foe.id.startsWith('pvp-') || duel.online) {
              const next = { ...progress, stats: { ...progress.stats, [won ? 'pvpVitorias' : 'pvpDerrotas']: (progress.stats[won ? 'pvpVitorias' : 'pvpDerrotas'] ?? 0) + 1 } };
              saveProgress(next); setProgress(next);
              if (duel.online) { void reportPvp(duel.online.key, duel.online.foeHandle, won); leaveTable(); }
              setDuel(d => (d ? { ...d, result: { won, coins: 0, firstWin: false } } : d));
              return;
            }
            const { progress: next, result } = applyDuel(progress, duel.foe, won, Math.random());
            if (next !== progress) { saveProgress(next); setProgress(next); }
            // vitória na Torre também bate no chefe da guilda da semana
            if (won && duel.foe.id.startsWith('torre-')) void guildHit();
            // com o banco ligado, o servidor confere a carta do chefe e diz quantas o aluno tem
            const won1 = result.card, andar = duel.foe.andar;
            if (won1 && cloudEnabled()) void cloudBossCard(andar, won1.id).then(n => {
              const cur = loadProgress();
              const qty = n ?? Math.max(0, (cur.collection[won1.id] ?? 1) - 1);
              const fixed = { ...cur, collection: { ...cur.collection, [won1.id]: qty } };
              saveProgress(fixed); setProgress(fixed);
            });
            setDuel(d => (d ? { ...d, result } : d));
          }}
          result={duel.result && <DuelResultPanel result={duel.result} coinsNow={progress.coins} onBack={() => setDuel(null)} />}
        />
      )}

      {!duel && !panelOpen && !decor && !shopOf && <StoryHud onOpen={() => setCaderno(true)} />}
      {caderno && <Caderno ctx={sctx} onClose={() => setCaderno(false)} onLines={l => setDialog({ lines: l, i: 0 })} />}

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
              : items.map(id => {
                // ainda não comprado: aparece com o preço (compra na Loja de Móveis, no shopping)
                const own = ownsFurniture(progress, id);
                return (
                  <button key={id} onClick={() => (own ? pick(id) : setDialog({ lines: [`${m[id].nome ?? id}: ${furniturePrice(m, id)} moedas na Loja de Móveis (shopping).`], i: 0 }))} title={m[id].nome}
                    className={`relative h-[76px] rounded border-2 bg-white flex flex-col items-center justify-end p-1 ${holding?.p.id === id ? 'border-[#2f6b1e] ring-2 ring-[#8cc63f]' : 'border-black/15'} ${own ? '' : 'opacity-60'}`}>
                    <Thumb m={m} id={id} />
                    <span className="text-[7px] leading-3 text-[#5a4630] truncate w-full text-center">{own ? m[id].nome : `${furniturePrice(m, id)} moedas`}</span>
                    {!own && <span className="absolute top-1 right-1"><Icon id="cadeado" size={12} /></span>}
                  </button>
                );
              })}
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
  // faixas de outro piso (tapete vermelho do castelo)
  for (const pa of room.patches ?? []) {
    const img = imgs.get(pa.piso);
    if (!img) continue;
    const tw = m[pa.piso]?.w ?? 64, th = m[pa.piso]?.h ?? 64;
    x.save();
    x.beginPath(); x.rect(pa.tx * TILE, pa.ty * TILE, pa.w * TILE, pa.h * TILE); x.clip();
    for (let yy = pa.ty * TILE; yy < (pa.ty + pa.h) * TILE; yy += th) for (let xx = pa.tx * TILE; xx < (pa.tx + pa.w) * TILE; xx += tw) x.drawImage(img, xx, yy, tw, th);
    x.restore();
  }
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
