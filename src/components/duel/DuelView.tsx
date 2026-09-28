import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TcgCard, TcgCardBack, ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { AI_NAMES, planTurn } from '@/lib/tcg/ai';
import { canPlay, createGame, endTurn, IllegalPlay, playCard } from '@/lib/tcg/engine';
import { ELEMENT_PT, STATUS_PT, TYPE_PT_PLURAL } from '@/lib/tcg/labels';
import type { Foe } from '@/lib/tcg/opponents';
import type { CardDef, CardInstance, Element, GameState, PlayerState } from '@/lib/tcg/types';
import type { Look } from '@/game/world/outfit';
import { loadLookFrames, loadNpcFrames } from '@/game/world/sprites';

/**
 * Duelo de cartas contra um Desafiante (mesa ou chefe da Torre). O aluno joga
 * tocando nas cartas da mão; o inimigo joga sozinho, uma carta por vez, para
 * dar tempo de ver o que aconteceu. `onEnd` recebe se o aluno venceu.
 */

const pixel = "font-['Press_Start_2P',monospace]";
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
}

/** Elemento do herói do aluno: o mais comum no deck (define fraquezas). */
function heroElement(deck: CardDef[]): Element {
  const n = new Map<Element, number>();
  for (const c of deck) n.set(c.element, (n.get(c.element) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Fighting';
}

/** Retrato: o primeiro quadro (de frente) do boneco. */
function Portrait({ frame, flip }: { frame: HTMLCanvasElement | null; flip?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !frame) return;
    c.width = frame.width; c.height = frame.height;
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(frame, 0, 0);
  }, [frame]);
  return (
    <div className="shrink-0 w-[52px] h-[64px] sm:w-[72px] sm:h-[88px] rounded-lg bg-black/35 border-2 border-white/20 overflow-hidden flex items-end justify-center">
      <canvas ref={ref} className="w-[64px] h-[80px] sm:w-[88px] sm:h-[110px] -mb-1" style={{ imageRendering: 'pixelated', transform: flip ? 'scaleX(-1)' : undefined }} />
    </div>
  );
}

function LifeBar({ p, hit }: { p: PlayerState; hit: number | null }) {
  const pct = Math.max(0, (p.life / p.maxLife) * 100);
  const color = pct > 50 ? '#56d364' : pct > 25 ? '#f0c040' : '#f0504a';
  return (
    <div className="relative w-full">
      <div className="h-3 sm:h-4 rounded-full bg-black/50 border border-white/25 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={`absolute right-1 -top-0.5 text-[9px] sm:text-[10px] text-white ${pixel}`} style={{ textShadow: '0 1px 0 #000' }}>{p.life}/{p.maxLife}</div>
      {hit !== null && hit !== 0 && (
        <div key={Math.random()} className={`absolute left-1/2 -top-6 text-[14px] ${pixel} animate-[duelhit_900ms_ease-out_forwards]`}
          style={{ color: hit < 0 ? '#ff6b6b' : '#7dff8a', textShadow: '0 2px 0 #000' }}>{hit > 0 ? `+${hit}` : hit}</div>
      )}
    </div>
  );
}

/** Status, escudos, bônus guardados, auras e travas de um lado. */
function Chips({ p }: { p: PlayerState }) {
  const chips: { t: string; c: string; tip: string }[] = [];
  const icon = { burn: '🔥', poison: '☠️', bleed: '🩸', freeze: '❄️' } as const;
  for (const s of p.statuses) chips.push({ t: `${icon[s.kind]}${s.value ? s.value : ''}·${s.turnsLeft}t`, c: '#3a1414', tip: `${STATUS_PT[s.kind]}${s.value ? ` ${s.value}/turno` : ''}, ${s.turnsLeft} turno(s)` });
  if (p.shields) chips.push({ t: `🛡${p.shields}`, c: '#14304a', tip: `Escudo: anula ${p.shields} dano(s)` });
  for (const m of p.modifiers) chips.push({ t: `✨${m.mult ? `×${m.mult}` : ''}${m.add ? `+${m.add}` : ''}`, c: '#3a3010', tip: `${m.label} (próximo ataque)` });
  for (const a of p.auras) chips.push({ t: `🔁${a.turnsLeft}`, c: '#10303a', tip: `${a.label}: mais ${a.turnsLeft} turno(s)` });
  for (const l of p.locks) chips.push({ t: `🔒${l.turnsLeft}`, c: '#301030', tip: `Não pode jogar ${TYPE_PT_PLURAL[l.cardType]} por ${l.turnsLeft} turno(s)` });
  if (p.skipNextDraw) chips.push({ t: '⏭', c: '#303030', tip: 'Pula a próxima compra' });
  return (
    <div className="flex flex-wrap gap-1 min-h-[18px]">
      {chips.map((c, i) => (
        <span key={i} title={c.tip} className="px-1.5 py-0.5 rounded text-[10px] text-white border border-white/20" style={{ background: c.c }}>{c.t}</span>
      ))}
    </div>
  );
}

/** Equipamento/armadilha/campo em miniatura (toque abre a carta). */
function Mini({ card, back, onOpen, label }: { card?: CardDef; back?: boolean; onOpen?: () => void; label?: string }) {
  return (
    <button onClick={onOpen} disabled={!onOpen} title={card?.name ?? label}
      className="w-[34px] sm:w-[46px] shrink-0 rounded-md transition-transform hover:scale-105 disabled:hover:scale-100">
      {back || !card ? <TcgCardBack /> : <TcgCard card={card} />}
    </button>
  );
}

function Side({ p, hand, foe, portrait, name, title, hit, onOpen, active }: {
  p: PlayerState; hand?: boolean; foe?: boolean; portrait: HTMLCanvasElement | null; name: string; title: string;
  hit: number | null; onOpen: (c: CardDef) => void; active: boolean;
}) {
  const el = ELEMENT_STYLE[p.element];
  return (
    <div className={`flex items-start gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-xl border-2 transition-colors ${active ? 'border-[#8cc63f] bg-black/45' : 'border-white/10 bg-black/30'}`}>
      <Portrait frame={portrait} flip={foe} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] sm:text-[11px] text-white truncate ${pixel}`}>{name}</span>
          <span className="text-[10px] text-white/60 truncate">{title}</span>
          <span className="ml-auto text-[12px]" title={`Herói de ${ELEMENT_PT[p.element]}`}>{el.icon}</span>
        </div>
        <LifeBar p={p} hit={hit} />
        <Chips p={p} />
      </div>
      <div className="flex items-end gap-1 shrink-0">
        {p.weapon && <Mini card={p.weapon.def} onOpen={() => onOpen(p.weapon!.def)} />}
        {p.armor && <Mini card={p.armor.def} onOpen={() => onOpen(p.armor!.def)} />}
        {p.traps.map(t => <Mini key={t.uid} back={foe} card={foe ? undefined : t.def} label="Armadilha virada" onOpen={foe ? undefined : () => onOpen(t.def)} />)}
        <div className={`flex flex-col items-center text-[9px] text-white/80 ml-1 ${pixel}`}>
          <span title="Cartas no deck">🂠{p.deck.length}</span>
          {hand && <span title="Cartas na mão" className="mt-1">✋{p.hand.length}</span>}
          <span title="Cemitério" className="mt-1">⚰{p.graveyard.length}</span>
        </div>
      </div>
    </div>
  );
}

export function DuelView({ foe, foeSprite, deck, look, nick, onEnd, onQuit, result }: Props) {
  const [state, setState] = useState<GameState>(() => createGame([
    { name: nick, element: heroElement(deck), deck },
    { name: foe.name, element: foe.element, deck: foe.deck, life: foe.life },
  ], { seed: (Date.now() & 0x7fffffff) || 1, firstPlayer: Math.random() < 0.5 ? 0 : 1 }));
  const [preview, setPreview] = useState<{ card: CardDef; uid?: string } | null>(null);
  const [picking, setPicking] = useState<{ uid: string; need: number; picked: string[]; filter: (c: CardInstance) => boolean } | null>(null);
  const [shown, setShown] = useState<{ card: CardDef; by: 0 | 1 } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<[number | null, number | null]>([null, null]);
  const [portraits, setPortraits] = useState<[HTMLCanvasElement | null, HTMLCanvasElement | null]>([null, null]);
  const [showLog, setShowLog] = useState(false);
  const ended = useRef(false);
  const prevLife = useRef<[number, number]>([state.players[0].life, state.players[1].life]);

  useEffect(() => {
    let alive = true;
    Promise.all([loadLookFrames(look).catch(() => null), loadNpcFrames(foeSprite).catch(() => null)]).then(([a, b]) => {
      if (alive) setPortraits([a?.walk.south[0] ?? null, b?.walk.south[0] ?? null]);
    });
    return () => { alive = false; };
  }, [look, foeSprite]);

  // números de dano/cura sobre a barra de vida
  useEffect(() => {
    const d: [number | null, number | null] = [state.players[0].life - prevLife.current[0], state.players[1].life - prevLife.current[1]];
    prevLife.current = [state.players[0].life, state.players[1].life];
    if (d[0] || d[1]) {
      setHits([d[0] || null, d[1] || null]);
      const t = window.setTimeout(() => setHits([null, null]), 900);
      return () => window.clearTimeout(t);
    }
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
          if (card) setShown({ card: card.def, by: 1 });
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
      if (card) setShown({ card: card.def, by: 0 });
      window.setTimeout(() => setShown(s => (s?.by === 0 ? null : s)), 900);
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

  const lastLog = useMemo(() => state.log.slice(-40), [state.log]);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6 }); }, [lastLog, showLog]);

  const bg = ELEMENT_STYLE[foe.element];
  return (
    <div className="absolute inset-0 z-30 flex flex-col text-white select-none overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 45%, ${bg.el2} 0%, #120c18 70%)` }}>
      <style>{`@keyframes duelhit{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}20%{opacity:1;transform:translate(-50%,0) scale(1.15)}100%{opacity:0;transform:translate(-50%,-18px) scale(1)}}
      @keyframes duelshow{0%{opacity:0;transform:scale(.6) translateY(20px)}15%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}`}</style>

      {/* inimigo */}
      <div className="p-2 sm:p-3">
        <Side p={op} hand foe portrait={portraits[1]} name={foe.name} title={`${foe.kind === 'chefe' ? 'Chefe' : 'Mesa'} · ${AI_NAMES[foe.ai]}`}
          hit={hits[1]} onOpen={c => setPreview({ card: c })} active={state.active === 1} />
        <div className="flex justify-center gap-0.5 mt-1 h-[26px] sm:h-[34px]">
          {op.hand.map(c => <div key={c.uid} className="w-[18px] sm:w-[24px]"><TcgCardBack /></div>)}
        </div>
      </div>

      {/* mesa: o tapete de jogo com o campo, a carta jogada e o log */}
      <div className="flex-1 min-h-0 relative px-2 sm:px-6 py-1">
        <div className="relative h-full w-full max-w-[980px] mx-auto rounded-2xl border-2 overflow-hidden flex items-center justify-center"
          style={{
            borderColor: `${bg.el}88`,
            background: `radial-gradient(ellipse at center, ${bg.el}26 0%, transparent 65%), repeating-linear-gradient(45deg, ${bg.el2}33 0 10px, transparent 10px 20px), #0d0a12cc`,
            boxShadow: `inset 0 0 40px ${bg.el2}`,
          }}>
          <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[40px] sm:text-[72px] ${pixel} pointer-events-none`} style={{ color: `${bg.el}14` }}>WIT</div>
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap ${pixel} ${myTurn ? 'bg-[#2f6b1e] border-2 border-[#8cc63f]' : 'bg-black/60 border-2 border-white/20'}`}>
            {state.winner !== null ? (state.winner === 0 ? 'VITÓRIA!' : 'DERROTA') : myTurn ? `SEU TURNO · ${Math.ceil(state.turn / 2)}` : `VEZ DE ${foe.name.toUpperCase()}...`}
          </div>
          <div className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <span className={`text-[7px] sm:text-[8px] text-white/60 ${pixel}`}>CAMPO</span>
            {state.field
              ? <Mini card={state.field.card.def} onOpen={() => setPreview({ card: state.field!.card.def })} />
              : <div className="w-[34px] sm:w-[46px] aspect-[5/7] rounded-md border-2 border-dashed border-white/20" />}
          </div>
          {shown ? (
            <div key={`${shown.card.id}-${state.log.length}`} className="w-[108px] sm:w-[160px] animate-[duelshow_300ms_ease-out] cursor-pointer" onClick={() => setPreview({ card: shown.card })}>
              <div className={`text-center text-[8px] mb-1 ${pixel} ${shown.by === 0 ? 'text-lime-300' : 'text-red-300'}`}>{shown.by === 0 ? 'VOCÊ JOGOU' : `${foe.name.toUpperCase()} JOGOU`}</div>
              <TcgCard card={shown.card} />
            </div>
          ) : (
            <div className="max-w-[min(80vw,520px)] text-center text-[12px] sm:text-[13px] text-white/85 leading-5 px-3">
              {state.log.filter(l => !l.text.startsWith('—')).slice(-2).map((l, i) => <div key={i}>{l.text}</div>)}
            </div>
          )}
          <button onClick={() => setShowLog(v => !v)} className={`absolute right-2 top-2 px-2 py-1 rounded bg-black/50 border border-white/25 text-[9px] ${pixel}`}>LOG</button>
          {showLog && (
            <div ref={logRef} className="absolute right-2 top-10 bottom-2 w-[min(80vw,360px)] overflow-y-auto rounded-lg bg-black/85 border border-white/20 p-2 text-[11px] leading-4 z-10">
              {lastLog.map((l, i) => (
                <div key={i} className={l.player === 0 ? 'text-lime-200' : l.player === 1 ? 'text-red-200' : 'text-yellow-200'}>{l.text}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* você */}
      <div className="p-2 sm:p-3 pt-0">
        <Side p={me} portrait={portraits[0]} name={nick} title="Desafiante" hit={hits[0]} onOpen={c => setPreview({ card: c })} active={myTurn} />
        {error && <div className="mt-1 text-center text-[11px] text-red-200">{error}</div>}
        {picking && (
          <div className={`mt-1 text-center text-[10px] text-yellow-200 ${pixel}`}>
            ESCOLHA {picking.need - picking.picked.length} CARTA(S) PARA DESCARTAR
            <button onClick={() => setPicking(null)} className="ml-2 px-2 py-1 rounded bg-white/15">CANCELAR</button>
          </div>
        )}
        <div className="mt-2 flex items-end justify-center" style={{ minHeight: 'clamp(110px, 29vh, 240px)' }}>
          {me.hand.map((c, i) => {
            const ok = myTurn && canPlay(state, c.uid).ok;
            const sel = picking?.picked.includes(c.uid);
            const pickable = picking ? picking.filter(c) : false;
            const n = me.hand.length;
            return (
              <button key={c.uid}
                onClick={() => {
                  if (picking) {
                    if (!pickable) return;
                    const picked = sel ? picking.picked.filter(x => x !== c.uid) : [...picking.picked, c.uid];
                    if (picked.length >= picking.need) { setPicking(null); doPlay(picking.uid, picked); } else setPicking({ ...picking, picked });
                    return;
                  }
                  setPreview({ card: c.def, uid: c.uid });
                }}
                className={`relative shrink-0 transition-transform duration-150 hover:-translate-y-3 hover:z-10 ${ok && !picking ? '' : picking ? (pickable ? '' : 'opacity-40') : 'opacity-60'}`}
                style={{ width: 'clamp(76px, min(15vw, 21vh), 168px)', marginLeft: i === 0 ? 0 : `calc(clamp(76px, min(15vw, 21vh), 168px) * ${n > 5 ? -0.32 : -0.06})`, transform: sel ? 'translateY(-14px)' : undefined }}>
                {ok && !picking && <div className="absolute -inset-1 rounded-[10%] border-2 border-[#8cc63f] pointer-events-none" />}
                {sel && <div className="absolute -inset-1 rounded-[10%] border-2 border-yellow-300 pointer-events-none" />}
                <TcgCard card={c.def} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button onClick={onQuit} className={`px-3 py-2 rounded-md bg-black/50 border-2 border-white/20 text-[9px] ${pixel}`}>DESISTIR</button>
          <span className="text-[10px] text-white/60 text-center hidden sm:block">Toque numa carta para ver e jogar · 1 Ataque por turno · mão máxima 7</span>
          <button disabled={!myTurn || !!picking} onClick={() => { setError(null); setState(endTurn(state)); }}
            className={`px-4 py-2 rounded-md text-[10px] ${pixel} ${myTurn ? 'bg-[#e8485a] border-2 border-white/60' : 'bg-white/10 border-2 border-white/10 text-white/40'}`}>ENCERRAR TURNO</button>
        </div>
      </div>

      {/* carta aberta */}
      {preview && (
        <div className="absolute inset-0 z-20 bg-black/65 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="w-[min(72vw,300px)]"><TcgCard card={preview.card} /></div>
            <div className="flex gap-2">
              {preview.uid && myTurn && (() => {
                const chk = canPlay(state, preview.uid);
                return chk.ok
                  ? <button onClick={() => tryPlay(preview.uid!)} className={`px-5 py-2.5 rounded-md bg-[#2f6b1e] border-2 border-[#8cc63f] text-[11px] ${pixel}`}>JOGAR</button>
                  : <span className="max-w-[260px] text-center text-[12px] text-red-200">{chk.ok === false ? chk.reason : ''}</span>;
              })()}
              <button onClick={() => setPreview(null)} className={`px-4 py-2.5 rounded-md bg-white/15 border-2 border-white/25 text-[11px] ${pixel}`}>FECHAR</button>
            </div>
          </div>
        </div>
      )}

      {result && <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-4">{result}</div>}
    </div>
  );
}

