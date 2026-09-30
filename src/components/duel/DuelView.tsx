import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TcgCard, TcgCardBack, ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { AI_NAMES, planTurn } from '@/lib/tcg/ai';
import { canPlay, createGame, endTurn, IllegalPlay, playCard } from '@/lib/tcg/engine';
import { ELEMENT_PT, STATUS_PT, TYPE_PT_PLURAL } from '@/lib/tcg/labels';
import type { Foe } from '@/lib/tcg/opponents';
import type { CardDef, CardInstance, Element, GameState, PlayerState } from '@/lib/tcg/types';
import type { Look } from '@/game/world/outfit';
import { loadLookFrames, loadNpcFrames } from '@/game/world/sprites';
import { matOf, matStyle } from '@/game/playmats';
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
function Slot({ card, back, label, count, onOpen }: { card?: CardDef; back?: boolean; label: string; count?: string; onOpen?: () => void }) {
  const filled = !!card || back;
  return (
    <div className={`dv-slot dv-px ${filled ? 'filled' : ''}`} title={card?.name ?? label}>
      {!filled && label}
      {filled && <div className="dv-card">{back || !card ? <TcgCardBack /> : <TcgCard card={card} />}</div>}
      {onOpen && <button aria-label={card?.name ?? label} onClick={onOpen} />}
      {count && <span className="dv-count">{count}</span>}
    </div>
  );
}

/** Uma fileira da mesa: arma, armadura, 3 armadilhas; deck e cemitério na ponta. */
function Row({ side, p, hidden, open }: { side: 'op' | 'me'; p: PlayerState; hidden: boolean; open: (c: CardDef) => void }) {
  const top = p.graveyard[p.graveyard.length - 1];
  return (
    <div className={`dv-row ${side}`}>
      <Slot label="ARMA" card={p.weapon?.def} onOpen={p.weapon ? () => open(p.weapon!.def) : undefined} />
      <Slot label="ARMAD." card={p.armor?.def} onOpen={p.armor ? () => open(p.armor!.def) : undefined} />
      {[0, 1, 2].map(i => {
        const t = p.traps[i];
        return <Slot key={i} label="ARMADI­LHA" back={!!t && hidden} card={t && !hidden ? t.def : undefined}
          onOpen={t && !hidden ? () => open(t.def) : undefined} />;
      })}
      <div className="dv-gap" />
      <Slot label="DECK" back={p.deck.length > 0} count={`${p.deck.length}`} />
      <Slot label="CEMIT." card={top?.def} count={p.graveyard.length ? `${p.graveyard.length}` : undefined} onOpen={top ? () => open(top.def) : undefined} />
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
  const [shown, setShown] = useState<{ card: CardDef; by: 0 | 1; key: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<{ side: 0 | 1; v: number; key: number }[]>([]);
  const [frames, setFrames] = useState<[HTMLCanvasElement | null, HTMLCanvasElement | null]>([null, null]);
  const [showLog, setShowLog] = useState(false);
  const ended = useRef(false);
  const prevLife = useRef<[number, number]>([state.players[0].life, state.players[1].life]);

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
          if (card) { setShown({ card: card.def, by: 1, key: Date.now() }); setFocus(card.def); }
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
      if (card) setShown({ card: card.def, by: 0, key: Date.now() });
      window.setTimeout(() => setShown(s => (s?.by === 0 ? null : s)), 1100);
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
      <div className="dv-stage" style={{ ['--el' as string]: el.el, ['--el2' as string]: el.el2 }}>
        <div className="dv-bg" style={{ background: `radial-gradient(ellipse at 50% 40%, ${el.el2}66, transparent 70%), repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 .12cqw, transparent .12cqw 2.4cqw), repeating-linear-gradient(90deg, #6b4a2e 0 7cqw, #5e3f26 7cqw 7.12cqw, #684629 7.12cqw 14cqw)` }} />

        {/* desafiante atrás da mesa */}
        <div className="dv-foe">
          <Body frame={frames[1]} />
          {state.active === 1 && state.winner === null && <div className="dv-think"><i /><i /><i /></div>}
        </div>

        {/* mesa */}
        <div className="dv-table">
          <div className="dv-mat" style={matStyle(matOf(mat), import.meta.env.BASE_URL)}>
            <Row side="op" p={op} hidden open={c => setPreview({ card: c })} />
            <div className="dv-field">
              <Slot label="CAMPO" card={state.field?.card.def} onOpen={state.field ? () => setPreview({ card: state.field!.card.def }) : undefined} />
            </div>
            <Row side="me" p={me} hidden={false} open={c => setPreview({ card: c })} />
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
              <button key={c.uid}
                className={`c ${picking ? (pickable ? (sel ? 'pick' : '') : 'dim') : ok ? 'ok' : myTurn ? 'dim' : ''}`}
                style={{ left: `${left}%`, ['--y' as string]: `${drop + lift}%`, ['--r' as string]: `${rot}deg`, zIndex: i }}
                onMouseEnter={() => setFocus(c.def)}
                onContextMenu={e => { e.preventDefault(); setFocus(c.def); }}
                onClick={() => {
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
