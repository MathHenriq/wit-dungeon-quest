import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TcgCard, TcgCardBack, ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { AI_NAMES, planTurn } from '@/lib/tcg/ai';
import { canPlay, createGame, endTurn, IllegalPlay, playCard } from '@/lib/tcg/engine';
import { ELEMENT_PT, STATUS_PT, TYPE_PT_PLURAL } from '@/lib/tcg/labels';
import type { Foe } from '@/lib/tcg/opponents';
import type { CardDef, CardInstance, Element, GameState, PlayerState } from '@/lib/tcg/types';
import type { Look } from '@/game/world/outfit';
import { loadLookFrames, loadNpcFrames } from '@/game/world/sprites';
import { matOf, matStyle } from '@/game/playmats';
import { diffMoves, type Move } from './moves';
import './DuelView.css';

/**
 * Duelo de cartas contra um Desafiante (mesa ou chefe da Torre), no layout
 * aprovado em 30/09: o desafiante atrás da mesa inclinada, placas com retrato
 * e vida em gomos, mão em leque, carta em foco e botão de encerrar. O inimigo
 * joga sozinho, uma carta por vez. `onEnd` recebe se o aluno venceu.
 * Próximas etapas (docs/plano-wit2.md §5.5): arrastar, custos e compra
 * animados, conta do dano, animações do boneco, abertura e fim, som.
 */

const AI_STEP_MS = 950;

interface Props {
  foe: Foe;
  /** Sprite do NPC (public/game/sprites/npcs). */
  foeSprite: string;
  deck: CardDef[];
  look: Look;
  nick: string;
  onEnd: (won: boolean) => void;
  onQuit: () => void;
  /** Tela do resultado (moedas, carta), montada por quem chamou depois de `onEnd`. */
  result?: React.ReactNode;
  /** Tapete do aluno (src/game/playmats.ts); sem ele, o Clássico. */
  mat?: string;
}

/** Elemento do herói do aluno: o mais comum no deck (define fraquezas). */
function heroElement(deck: CardDef[]): Element {
  const n = new Map<Element, number>();
  for (const c of deck) n.set(c.element, (n.get(c.element) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Fighting';
}

// ─── ícones (desenhados, no lugar dos emojis) ───────────────────────────────
const ICON = {
  burn: <svg viewBox="0 0 16 16"><path fill="#ffb070" d="M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3-1-2 0-5 0-7z" /></svg>,
  poison: <svg viewBox="0 0 16 16"><path fill="#b98cff" d="M8 1c2 4 5 6 5 9a5 5 0 0 1-10 0c0-3 3-5 5-9z" /><circle cx="6.5" cy="10" r="1" fill="#1a0f24" /><circle cx="9.5" cy="10" r="1" fill="#1a0f24" /></svg>,
  bleed: <svg viewBox="0 0 16 16"><path fill="#ff5a6a" d="M8 1c2 4 5 6 5 9a5 5 0 0 1-10 0c0-3 3-5 5-9z" /></svg>,
  freeze: <svg viewBox="0 0 16 16"><path stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" d="M8 1v14M2 4.5l12 7M2 11.5l12-7" /></svg>,
  shield: <svg viewBox="0 0 16 16"><path fill="#cbd5e1" d="M8 1l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V3z" /></svg>,
  star: <svg viewBox="0 0 16 16"><path fill="#fde68a" d="M8 1l2 5 5 .5-4 3.5 1.2 5L8 12.5 3.8 15 5 10 1 6.5 6 6z" /></svg>,
  aura: <svg viewBox="0 0 16 16"><path fill="none" stroke="#7dd3fc" strokeWidth="2" d="M13 8a5 5 0 1 1-2-4" /><path fill="#7dd3fc" d="M10 1l4 3-4 2z" /></svg>,
  lock: <svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="1" fill="#f0abfc" /><path fill="none" stroke="#f0abfc" strokeWidth="2" d="M5 7V5a3 3 0 0 1 6 0v2" /></svg>,
  skip: <svg viewBox="0 0 16 16"><path fill="#d4d4d8" d="M2 3l7 5-7 5zM9 3l5 5-5 5z" /></svg>,
  sword: <svg viewBox="0 0 16 16"><path fill="#fff" d="M13 1h2v2L7 11l-2-2zM3 9l4 4-1.5 1.5L4 13l-2 2-1-1 2-2-1.5-1.5z" /></svg>,
};
const STATUS_COLOR = { burn: '#f97316', poison: '#a855f7', bleed: '#ef4444', freeze: '#67e8f9' } as const;

/** Rosto recortado do primeiro quadro (de frente) do boneco. */
function Face({ frame }: { frame: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !frame) return;
    c.width = 64; c.height = 64;
    const x = c.getContext('2d')!;
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 64, 64);
    const sw = frame.width * 0.62;
    x.drawImage(frame, frame.width * 0.19, frame.height * 0.2, sw, sw, 0, 0, 64, 64);
  }, [frame]);
  return <canvas ref={ref} />;
}

/** O boneco inteiro (o desafiante atrás da mesa). */
function Body({ frame }: { frame: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !frame) return;
    c.width = frame.width; c.height = frame.height;
    c.getContext('2d')!.drawImage(frame, 0, 0);
  }, [frame]);
  return <canvas ref={ref} />;
}

function Effects({ p }: { p: PlayerState }) {
  const fx: { icon: JSX.Element; t: string; c: string; tip: string }[] = [];
  for (const s of p.statuses) fx.push({ icon: ICON[s.kind], t: `${s.value ? `${s.value}·` : ''}${s.turnsLeft}T`, c: STATUS_COLOR[s.kind], tip: `${STATUS_PT[s.kind]}${s.value ? ` ${s.value}/turno` : ''}, ${s.turnsLeft} turno(s)` });
  if (p.shields) fx.push({ icon: ICON.shield, t: `${p.shields}`, c: '#cbd5e1', tip: `Escudo: anula ${p.shields} dano(s)` });
  for (const m of p.modifiers) fx.push({ icon: ICON.star, t: `${m.mult ? `×${m.mult}` : ''}${m.add ? `+${m.add}` : ''}`, c: '#fde68a', tip: `${m.label} (próximo ataque)` });
  for (const a of p.auras) fx.push({ icon: ICON.aura, t: `${a.turnsLeft}T`, c: '#7dd3fc', tip: `${a.label}: mais ${a.turnsLeft} turno(s)` });
  for (const l of p.locks) fx.push({ icon: ICON.lock, t: `${l.turnsLeft}T`, c: '#f0abfc', tip: `Não pode jogar ${TYPE_PT_PLURAL[l.cardType]} por ${l.turnsLeft} turno(s)` });
  if (p.skipNextDraw) fx.push({ icon: ICON.skip, t: '', c: '#d4d4d8', tip: 'Pula a próxima compra' });
  return (
    <div className="dv-fx dv-px">
      {fx.map((f, i) => <span key={i} title={f.tip} style={{ ['--c' as string]: f.c }}>{f.icon}{f.t}</span>)}
    </div>
  );
}

/** Placa do jogador: retrato com moldura, apelido, título, vida em gomos e efeitos. */
function Plate({ side, p, face, nick, title, tone, turn }: {
  side: 'op' | 'me'; p: PlayerState; face: HTMLCanvasElement | null; nick: string; title: string; tone: string; turn: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (p.life / p.maxLife) * 100));
  const el = ELEMENT_STYLE[p.element];
  return (
    <div className={`dv-plate ${side} ${turn ? 'turn' : ''}`} style={{ ['--tone' as string]: tone }}>
      <div className="dv-por">
        <Face frame={face} />
        <span className="el" title={`Herói de ${ELEMENT_PT[p.element]}`} style={{ background: el.el }}>{el.icon}</span>
      </div>
      <div className="dv-info">
        <div className="dv-who dv-px">
          <span className="dv-nick">{nick.toUpperCase()}</span>
          <span className="dv-ttl">{title}</span>
          <span className="dv-hpn">{p.life}<small>/{p.maxLife}</small></span>
        </div>
        <div className="dv-bar">
          <div className="lost" style={{ width: `${pct}%` }} />
          <div className={`fill ${pct <= 25 ? 'low' : pct <= 50 ? 'mid' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <Effects p={p} />
      </div>
    </div>
  );
}

/** Uma vaga da mesa (vazia com o nome, ou com a carta). */
function Slot({ card, back, label, count, onOpen, zone }: { card?: CardDef; back?: boolean; label: string; count?: string; onOpen?: () => void; zone?: string }) {
  const filled = !!card || back;
  return (
    <div className={`dv-slot dv-px ${filled ? 'filled' : ''}`} title={card?.name ?? label} data-zone={zone}>
      {!filled && label}
      {filled && <div className="dv-card">{back || !card ? <TcgCardBack /> : <TcgCard card={card} />}</div>}
      {onOpen && <button aria-label={card?.name ?? label} onClick={onOpen} />}
      {count && <span className="dv-count">{count}</span>}
    </div>
  );
}

/** Uma fileira da mesa: arma, armadura, 3 armadilhas; deck e cemitério na ponta. `hold` = cartas ainda voando para o cemitério. */
function Row({ side, p, hidden, open, hold }: { side: 'op' | 'me'; p: PlayerState; hidden: boolean; open: (c: CardDef) => void; hold: number }) {
  const n = side === 'me' ? 0 : 1;
  const grave = p.graveyard.slice(0, Math.max(0, p.graveyard.length - hold));
  const top = grave[grave.length - 1];
  return (
    <div className={`dv-row ${side}`}>
      <Slot zone={`${n}-weapon`} label="ARMA" card={p.weapon?.def} onOpen={p.weapon ? () => open(p.weapon!.def) : undefined} />
      <Slot zone={`${n}-armor`} label="ARMAD." card={p.armor?.def} onOpen={p.armor ? () => open(p.armor!.def) : undefined} />
      {[0, 1, 2].map(i => {
        const t = p.traps[i];
        return <Slot key={i} zone={`${n}-trap${i}`} label="ARMADI­LHA" back={!!t && hidden} card={t && !hidden ? t.def : undefined}
          onOpen={t && !hidden ? () => open(t.def) : undefined} />;
      })}
      <div className="dv-gap" />
      <Slot zone={`${n}-deck`} label="DECK" back={p.deck.length > 0} count={`${p.deck.length}`} />
      <Slot zone={`${n}-grave`} label="CEMIT." card={top?.def} count={grave.length ? `${grave.length}` : undefined} onOpen={top ? () => open(top.def) : undefined} />
    </div>
  );
}

interface Rect { x: number; y: number; w: number; h: number }
interface FlightSpec {
  id: string; side: 0 | 1; uid: string; card: CardDef; from: Rect; to: Rect;
  delay: number; kind: 'fly' | 'dissolve'; flip: boolean; back: boolean; toGrave: boolean; toHand: boolean;
}

/** Uma carta voando de um lugar para outro (ou se desfazendo), por cima de tudo. */
function Flight({ f, onDone }: { f: FlightSpec; onDone: (f: FlightSpec) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    const { from, to } = f;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let a: Animation;
    if (f.kind === 'dissolve') {
      a = el.animate([
        { opacity: 1, transform: 'scale(1)', filter: 'brightness(1)' },
        { opacity: 0.9, transform: 'scale(1.12) rotate(-4deg)', filter: 'brightness(1.8) saturate(.4)', offset: 0.4 },
        { opacity: 0, transform: 'scale(1.35) rotate(6deg)', filter: 'brightness(2.6) saturate(0)' },
      ], { duration: reduce ? 1 : 700, delay: f.delay, easing: 'ease-in', fill: 'both' });
    } else {
      const dx = from.x - to.x, dy = from.y - to.y, sx = from.w / to.w, sy = from.h / to.h;
      const dur = reduce ? 1 : 480;
      a = el.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - to.h * 0.35}px) scale(${(sx + 1) / 2 * 1.08}) rotate(${dx > 0 ? -8 : 8}deg)`, offset: 0.55 },
        { transform: 'none' },
      ], { duration: dur, delay: f.delay, easing: 'cubic-bezier(.3,.7,.35,1)', fill: 'both' });
      if (f.flip && inner.current) inner.current.animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(180deg)', offset: 0.15 }, { transform: 'rotateY(0deg)' }], { duration: dur, delay: f.delay, fill: 'both' });
    }
    a.onfinish = () => onDone(f);
    return () => a.cancel();
    // cada voo anima uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className={`dv-flight ${f.kind}`} style={{ left: f.to.x, top: f.to.y, width: f.to.w, height: f.to.h }}>
      <div ref={inner} className="dv-flip">
        {f.back ? <div className="face"><TcgCardBack /></div> : <>
          <div className="face"><TcgCard card={f.card} /></div>
          {f.flip && <div className="face backside"><TcgCardBack /></div>}
        </>}
      </div>
    </div>
  );
}

export function DuelView({ foe, foeSprite, deck, look, nick, onEnd, onQuit, result, mat }: Props) {
  const [state, setState] = useState<GameState>(() => createGame([
    { name: nick, element: heroElement(deck), deck },
    { name: foe.name, element: foe.element, deck: foe.deck, life: foe.life },
  ], { seed: (Date.now() & 0x7fffffff) || 1, firstPlayer: Math.random() < 0.5 ? 0 : 1 }));
  const [preview, setPreview] = useState<{ card: CardDef; uid?: string } | null>(null);
  const [focus, setFocus] = useState<CardDef | null>(null);
  const [picking, setPicking] = useState<{ uid: string; need: number; picked: string[]; filter: (c: CardInstance) => boolean } | null>(null);
  const [shown, setShown] = useState<{ card: CardDef; by: 0 | 1; key: number; uid: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<{ side: 0 | 1; v: number; key: number }[]>([]);
  const [frames, setFrames] = useState<[HTMLCanvasElement | null, HTMLCanvasElement | null]>([null, null]);
  const [showLog, setShowLog] = useState(false);
  const [flights, setFlights] = useState<FlightSpec[]>([]);
  const [hold, setHold] = useState<[number, number]>([0, 0]);
  const [hiddenUids, setHiddenUids] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<{ uid: string; x: number; y: number; over: boolean; tilt: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const handRects = useRef(new Map<string, Rect>());
  const prevState = useRef(state);
  const playedUid = useRef<string | undefined>(undefined);
  const dragRef = useRef<{ uid: string; x0: number; y0: number; moved: boolean; lastX: number } | null>(null);
  const suppressClick = useRef(false);
  const ended = useRef(false);
  const prevLife = useRef<[number, number]>([state.players[0].life, state.players[1].life]);

  // ── cartas voando: compara o estado novo com o anterior e anima cada carta que mudou de lugar ──
  const stageBox = () => stageRef.current!.getBoundingClientRect();
  const rel = (r: DOMRect): Rect => { const sr = stageBox(); return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }; };
  const zoneRect = (side: 0 | 1, zone: string): Rect | null => {
    const el = stageRef.current?.querySelector(`[data-zone="${side}-${zone}"]`);
    return el ? rel(el.getBoundingClientRect()) : null;
  };
  useLayoutEffect(() => {
    const prev = prevState.current;
    prevState.current = state;
    const stage = stageRef.current;
    if (!stage || prev === state) return;
    const sr = stageBox();
    const W = sr.width, H = sr.height;
    const center: Rect = { x: W * 0.44, y: H * 0.27 + W * 0.012, w: W * 0.12, h: W * 0.12 * 1.4 };
    const opHand = (() => { const el = stage.querySelector('.dv-ophand'); const r = el ? rel(el.getBoundingClientRect()) : { x: W * 0.02, y: H * 0.19, w: W * 0.06, h: W * 0.03 }; return { x: r.x, y: r.y, w: W * 0.04, h: W * 0.056 }; })();
    const nowHand = new Map<string, Rect>();
    stage.querySelectorAll<HTMLElement>('.dv-hand .c[data-uid]').forEach(el => nowHand.set(el.dataset.uid!, rel(el.getBoundingClientRect())));
    const moves: Move[] = diffMoves(prev, state, playedUid.current);
    playedUid.current = undefined;
    const add: FlightSpec[] = [];
    const count = { cost: 0, mill: 0, draw: 0, ban: 0 };
    for (const m of moves) {
      const where = (z: string, arriving: boolean): Rect | null => {
        if (z === 'center') return center;
        if (z === 'hand') return m.side === 1 ? opHand : (arriving ? nowHand.get(m.uid) : handRects.current.get(m.uid)) ?? null;
        if (z === 'banish') return zoneRect(m.side, 'grave');
        return zoneRect(m.side, z);
      };
      // a carta jogada que vai para a vaga dela (arma, armadilha, campo) já aparece lá
      if (m.from === 'center' && m.to !== 'grave') continue;
      const from = where(m.from, false), to = where(m.to, true);
      if (!from || !to) continue;
      let delay = 0, kind: FlightSpec['kind'] = 'fly', flip = false, back = false;
      if (m.to === 'banish') { kind = 'dissolve'; delay = 120 + count.ban++ * 110; }
      else if (m.from === 'center') delay = 900;
      else if (m.from === 'deck' && m.to === 'hand') { delay = 200 + count.draw++ * 170; flip = m.side === 0; back = m.side === 1; }
      else if (m.from === 'deck') { delay = 180 + count.mill++ * 120; flip = true; }
      else delay = count.cost++ * 100;
      add.push({ id: `${m.uid}-${Date.now()}`, side: m.side, uid: m.uid, card: m.card, from, to, delay, kind, flip, back, toGrave: m.to === 'grave', toHand: m.to === 'hand' && m.side === 0 });
      if (m.from === 'center') window.setTimeout(() => setShown(s0 => (s0?.uid === m.uid ? null : s0)), 900);
    }
    handRects.current = nowHand;
    if (!add.length) return;
    setFlights(f => [...f, ...add]);
    const g: [number, number] = [0, 0];
    for (const f of add) if (f.toGrave) g[f.side]++;
    if (g[0] || g[1]) setHold(h => [h[0] + g[0], h[1] + g[1]]);
    const arriving = add.filter(f => f.toHand).map(f => f.uid);
    if (arriving.length) setHiddenUids(h => new Set([...h, ...arriving]));
    // só quando o estado do jogo muda (rel e zoneRect leem o DOM na hora)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const flightDone = useCallback((f: FlightSpec) => {
    setFlights(list => list.filter(x => x.id !== f.id));
    if (f.toGrave) setHold(h => (f.side === 0 ? [Math.max(0, h[0] - 1), h[1]] : [h[0], Math.max(0, h[1] - 1)]));
    if (f.toHand) setHiddenUids(h => { const n = new Set(h); n.delete(f.uid); return n; });
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([loadLookFrames(look).catch(() => null), loadNpcFrames(foeSprite).catch(() => null)]).then(([a, b]) => {
      if (alive) setFrames([a?.walk.south[0] ?? null, b?.walk.south[0] ?? null]);
    });
    return () => { alive = false; };
  }, [look, foeSprite]);

  // número do golpe (ou da cura) em cima de quem mudou de vida
  useEffect(() => {
    const d = [state.players[0].life - prevLife.current[0], state.players[1].life - prevLife.current[1]];
    prevLife.current = [state.players[0].life, state.players[1].life];
    const now = Date.now();
    const add = ([0, 1] as const).filter(i => d[i]).map(i => ({ side: i, v: d[i], key: now + i }));
    if (!add.length) return;
    setHits(h => [...h, ...add]);
    const t = window.setTimeout(() => setHits(h => h.filter(x => !add.includes(x))), 1000);
    return () => window.clearTimeout(t);
  }, [state]);

  // fim da partida
  useEffect(() => {
    if (state.winner !== null && !ended.current) {
      ended.current = true;
      const t = window.setTimeout(() => onEnd(state.winner === 0), 900);
      return () => window.clearTimeout(t);
    }
  }, [state.winner, onEnd]);

  // turno do inimigo: uma carta por vez
  useEffect(() => {
    if (state.active !== 1 || state.winner !== null) return;
    let alive = true;
    const plan = planTurn(state, foe.ai, foe.andar * 131 + state.turn);
    let s = state, k = 0;
    const step = () => {
      if (!alive) return;
      if (k < plan.length && s.winner === null) {
        const uid = plan[k++];
        const card = s.players[1].hand.find(c => c.uid === uid);
        try {
          const next = playCard(s, uid);
          if (card) { setShown({ card: card.def, by: 1, key: Date.now(), uid }); setFocus(card.def); playedUid.current = uid; }
          s = next;
          setState(s);
        } catch (e) { if (!(e instanceof IllegalPlay)) throw e; }
        window.setTimeout(step, AI_STEP_MS);
        return;
      }
      setShown(null);
      if (s.winner === null) setState(endTurn(s));
    };
    const t = window.setTimeout(step, 700);
    return () => { alive = false; window.clearTimeout(t); };
    // só quando o turno passa para o inimigo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.active, state.turn]);

  const myTurn = state.active === 0 && state.winner === null;
  const me = state.players[0], op = state.players[1];

  const doPlay = useCallback((uid: string, discard?: string[]) => {
    try {
      const card = state.players[0].hand.find(c => c.uid === uid);
      const next = playCard(state, uid, discard ? { discard } : {});
      if (card) setShown({ card: card.def, by: 0, key: Date.now(), uid });
      playedUid.current = uid;
      window.setTimeout(() => setShown(s => (s?.uid === uid ? null : s)), 1400);
      setState(next);
      setError(null);
    } catch (e) {
      if (e instanceof IllegalPlay) setError(e.message); else throw e;
    }
  }, [state]);

  const tryPlay = (uid: string) => {
    const card = me.hand.find(c => c.uid === uid);
    if (!card) return;
    const check = canPlay(state, uid);
    if (check.ok === false) { setError(check.reason); return; }
    const disc = card.def.cost?.find(k => k.kind === 'discard');
    setPreview(null);
    if (disc && disc.kind === 'discard') {
      const f = disc.filter;
      setPicking({
        uid, need: disc.count, picked: [],
        filter: c => c.uid !== uid && (!f || ((!f.type || c.def.type === f.type) && (!f.element || c.def.element === f.element))),
      });
      return;
    }
    doPlay(uid);
  };

  const playable = useMemo(() => new Set(myTurn ? me.hand.filter(c => canPlay(state, c.uid).ok).map(c => c.uid) : []), [state, myTurn, me.hand]);
  const endTurnNow = useCallback(() => {
    if (!myTurn || picking) return;
    setError(null);
    setState(endTurn(state));
  }, [myTurn, picking, state]);

  // espaço encerra o turno
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== ' ' || preview || result) return;
      e.preventDefault();
      endTurnNow();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [endTurnNow, preview, result]);

  const lastLog = useMemo(() => state.log.slice(-40), [state.log]);
  const news = useMemo(() => state.log.filter(l => !l.text.startsWith('—')).slice(-2), [state.log]);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6 }); }, [lastLog, showLog]);

  const el = ELEMENT_STYLE[foe.element];
  const n = me.hand.length;
  return (
    <div className="dv-root">
      <div ref={stageRef} className="dv-stage" style={{ ['--el' as string]: el.el, ['--el2' as string]: el.el2 }}>
        <div className="dv-bg" style={{ background: `radial-gradient(ellipse at 50% 40%, ${el.el2}66, transparent 70%), repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 .12cqw, transparent .12cqw 2.4cqw), repeating-linear-gradient(90deg, #6b4a2e 0 7cqw, #5e3f26 7cqw 7.12cqw, #684629 7.12cqw 14cqw)` }} />

        {/* desafiante atrás da mesa */}
        <div className="dv-foe">
          <Body frame={frames[1]} />
          {state.active === 1 && state.winner === null && <div className="dv-think"><i /><i /><i /></div>}
        </div>

        {/* mesa */}
        <div className={`dv-table ${drag ? (drag.over ? (playable.has(drag.uid) ? 'drop-ok' : 'drop-no') : 'dragging') : ''}`}>
          <div className="dv-mat" style={matStyle(matOf(mat), import.meta.env.BASE_URL)}>
            <Row side="op" p={op} hidden open={c => setPreview({ card: c })} hold={hold[1]} />
            <div className="dv-field">
              <Slot label="CAMPO" card={state.field?.card.def} onOpen={state.field ? () => setPreview({ card: state.field!.card.def }) : undefined} />
            </div>
            <Row side="me" p={me} hidden={false} open={c => setPreview({ card: c })} hold={hold[0]} />
          </div>
        </div>

        {/* carta jogada */}
        {shown && (
          <div key={shown.key} className="dv-played" onClick={() => setPreview({ card: shown.card })}>
            <div className="who dv-px" style={{ color: shown.by === 0 ? '#bef264' : '#fca5a5' }}>{shown.by === 0 ? 'VOCÊ JOGOU' : `${foe.name.toUpperCase()} JOGOU`}</div>
            <TcgCard card={shown.card} />
          </div>
        )}

        {/* o que acabou de acontecer (a conta do dano entra aqui) */}
        <div className="dv-news" aria-live="polite">
          {news.map((l, i) => <div key={state.log.length - news.length + i}>{l.text}</div>)}
        </div>

        {/* números de golpe e cura */}
        {hits.map(h => (
          <div key={h.key} className="dv-hit dv-px" style={h.side === 1
            ? { left: '53%', top: '6%', color: '#fff', ['--c' as string]: h.v < 0 ? '#b91c1c' : '#15803d' }
            : { left: '14%', bottom: '17%', color: '#fff', ['--c' as string]: h.v < 0 ? '#b91c1c' : '#15803d' }}>
            {h.v > 0 ? `+${h.v}` : h.v}
          </div>
        ))}

        <Plate side="op" p={op} face={frames[1]} nick={foe.name} title={`${foe.kind === 'chefe' ? 'CHEFE' : 'MESA'} · ${AI_NAMES[foe.ai].toUpperCase()}`}
          tone={el.el} turn={state.active === 1 && state.winner === null} />
        <div className="dv-ophand" title={`${op.hand.length} carta(s) na mão`}>
          {op.hand.map((c, i) => <div key={c.uid} style={{ ['--r' as string]: `${(i - (op.hand.length - 1) / 2) * 5}deg` }}><TcgCardBack /></div>)}
        </div>
        <Plate side="me" p={me} face={frames[0]} nick={nick} title="DESAFIANTE" tone="#8cc63f" turn={myTurn} />

        {/* carta em foco */}
        <div className="dv-focus">
          <div className="t dv-px">CARTA EM FOCO</div>
          {focus ? <TcgCard card={focus} /> : <div className="hint">Passe o mouse (ou segure o dedo) numa carta para vê-la aqui</div>}
        </div>

        {/* mão em leque */}
        {picking && (
          <div className="dv-banner dv-px">ESCOLHA {picking.need - picking.picked.length} CARTA(S) PARA DESCARTAR
            <button onClick={() => setPicking(null)}>CANCELAR</button></div>
        )}
        {!picking && error && <div className="dv-banner err" onClick={() => setError(null)}>{error}</div>}
        <div className="dv-hand">
          {me.hand.map((c, i) => {
            const ok = playable.has(c.uid);
            const sel = picking?.picked.includes(c.uid);
            const pickable = picking ? picking.filter(c) : false;
            const mid = (n - 1) / 2, off = i - mid;
            const spread = Math.min(16, 81 / Math.max(1, n - 1));
            const left = 41 + off * spread;
            const rot = off * (n > 5 ? 5 : 6), drop = Math.abs(off) * Math.abs(off) * 1.4;
            const lift = sel ? -22 : 0;
            return (
              <button key={c.uid} data-uid={c.uid}
                className={`c ${picking ? (pickable ? (sel ? 'pick' : '') : 'dim') : ok ? 'ok' : myTurn ? 'dim' : ''} ${drag?.uid === c.uid || hiddenUids.has(c.uid) ? 'away' : ''}`}
                style={{ left: `${left}%`, ['--y' as string]: `${drop + lift}%`, ['--r' as string]: `${rot}deg`, zIndex: i }}
                onMouseEnter={() => setFocus(c.def)}
                onPointerDown={e => {
                  if (!myTurn || picking || e.button > 0) return;
                  dragRef.current = { uid: c.uid, x0: e.clientX, y0: e.clientY, moved: false, lastX: e.clientX };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={e => {
                  const d = dragRef.current;
                  if (!d || d.uid !== c.uid) return;
                  if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 10) return;
                  d.moved = true;
                  const sr = stageBox();
                  const x = e.clientX - sr.left, y = e.clientY - sr.top;
                  const over = y < sr.height * 0.74 && x > sr.width * 0.1 && x < sr.width * 0.88;
                  const tilt = Math.max(-14, Math.min(14, (e.clientX - d.lastX) * 1.2));
                  d.lastX = e.clientX;
                  setDrag({ uid: c.uid, x, y, over, tilt });
                  setFocus(c.def);
                }}
                onPointerUp={() => {
                  const d = dragRef.current;
                  dragRef.current = null;
                  if (!d?.moved) return;
                  suppressClick.current = true;
                  const wasOver = drag?.over;
                  setDrag(null);
                  if (wasOver) tryPlay(c.uid);
                }}
                onPointerCancel={() => { dragRef.current = null; setDrag(null); }}
                onContextMenu={e => { e.preventDefault(); setFocus(c.def); }}
                onClick={() => {
                  if (suppressClick.current) { suppressClick.current = false; return; }
                  if (picking) {
                    if (!pickable) return;
                    const picked = sel ? picking.picked.filter(x => x !== c.uid) : [...picking.picked, c.uid];
                    if (picked.length >= picking.need) { setPicking(null); doPlay(picking.uid, picked); } else setPicking({ ...picking, picked });
                    return;
                  }
                  setFocus(c.def);
                  setPreview({ card: c.def, uid: c.uid });
                }}>
                <TcgCard card={c.def} />
              </button>
            );
          })}
        </div>

        {/* carta sendo arrastada */}
        {drag && (() => {
          const c = me.hand.find(x => x.uid === drag.uid);
          return c && (
            <div className={`dv-ghost ${drag.over ? (playable.has(c.uid) ? 'ok' : 'no') : ''}`} style={{ left: drag.x, top: drag.y, ['--tilt' as string]: `${drag.tilt}deg` }}>
              <TcgCard card={c.def} />
              {drag.over && <div className="tag dv-px">{playable.has(c.uid) ? 'SOLTE PARA JOGAR' : 'NÃO DÁ AGORA'}</div>}
            </div>
          );
        })()}

        {/* cartas voando (descarte, cemitério, compra, banimento) */}
        {flights.map(f => <Flight key={f.id} f={f} onDone={flightDone} />)}

        {/* encerrar turno */}
        <div className={`dv-end ${myTurn && playable.size === 0 ? 'idle' : ''}`}>
          <div className={`turnno dv-px ${state.active === 1 ? 'foe' : ''}`}>
            {state.winner !== null ? (state.winner === 0 ? 'VITÓRIA!' : 'DERROTA') : myTurn ? `SEU TURNO · ${Math.ceil(state.turn / 2)}` : `VEZ DE ${foe.name.toUpperCase()}`}
          </div>
          <button disabled={!myTurn || !!picking} onClick={endTurnNow}>
            <div className="face dv-px">{ICON.sword}<span>ENCERRAR<br />TURNO</span></div>
          </button>
          <div className="key"><kbd>ESPAÇO</kbd></div>
        </div>

        <div className="dv-tools dv-px">
          <button onClick={() => setShowLog(v => !v)}>LOG</button>
          <button onClick={onQuit}>SAIR</button>
        </div>
        {showLog && (
          <div ref={logRef} className="dv-log">
            {lastLog.map((l, i) => (
              <div key={i} style={{ color: l.player === 0 ? '#d9f99d' : l.player === 1 ? '#fecaca' : '#fef08a' }}>{l.text}</div>
            ))}
          </div>
        )}

        {/* carta aberta */}
        {preview && (
          <div className="dv-modal" onClick={() => setPreview(null)}>
            <div className="box" onClick={e => e.stopPropagation()}>
              <div className="card"><TcgCard card={preview.card} /></div>
              <div className="btns dv-px">
                {preview.uid && myTurn && (() => {
                  const chk = canPlay(state, preview.uid);
                  return chk.ok
                    ? <button className="dv-btn go" onClick={() => tryPlay(preview.uid!)}>JOGAR</button>
                    : <span className="why">{chk.ok === false ? chk.reason : ''}</span>;
                })()}
                <button className="dv-btn" onClick={() => setPreview(null)}>FECHAR</button>
              </div>
            </div>
          </div>
        )}

        {result && <div className="dv-result">{result}</div>}
      </div>

      <div className="dv-rotate dv-px">
        <svg viewBox="0 0 64 64"><rect x="20" y="6" width="24" height="52" rx="4" fill="none" stroke="#8cc63f" strokeWidth="4" /><circle cx="32" cy="50" r="2.5" fill="#8cc63f" /></svg>
        GIRE O CELULAR<br />PARA DUELAR
      </div>
    </div>
  );
}
