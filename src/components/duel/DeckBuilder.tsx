import { Symbol } from '@/components/Icon';
import { GrimoirePanel } from './GrimoirePanel';
import { deckSlots } from '@/game/grimoire';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TcgCard, ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { ELEMENT_PT, RARITY_PT, TYPE_PT } from '@/lib/tcg/labels';
import { maxCopies, RARITY_ORDER } from '@/lib/tcg/opponents';
import type { CardDef, CardType, Element } from '@/lib/tcg/types';
import { MatShop } from './MatShop';
import { checkDeck, DECK_SIZE, saveProgress, suggestDeck, type Progress } from '@/game/progress';
import { PxButton, PxTabs } from '@/components/pixel/Pixel';
import { play } from '@/game/sfx';
import './deckbook.css';

/**
 * Construtor de deck como um álbum de figurinhas: a coleção fica num livro
 * que se folheia de lado (2 páginas de 3 × 3; 1 página no celular). Tocar
 * numa carta do álbum põe no deck; embaixo, o deck fica em cartas
 * sobrepostas (como a mão do duelo): passar o mouse levanta, tocar tira.
 * Segurar (ou botão direito) abre a carta grande. Marcadores do livro filtram
 * por tipo e elemento. 3 decks salvos (4 com o Grimório).
 */

const TYPES: CardType[] = ['attack', 'challenger', 'equipment', 'trap', 'field'];
const TYPE_ICON: Record<CardType, string> = { attack: 'ataque', challenger: 'desafiante', equipment: 'equipamento', trap: 'armadilha', field: 'campo' };
const PER_PAGE = 9;

export function DeckBuilder({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [slot, setSlot] = useState(progress.activeDeck);
  const [decks, setDecks] = useState<string[][]>(() => progress.decks.map(d => [...d]));
  const [type, setType] = useState<CardType | ''>('');
  const [element, setElement] = useState<Element | ''>('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CardDef | null>(null);
  const [saved, setSaved] = useState(false);
  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<{ dir: 1 | -1; key: number } | null>(null);
  const [pop, setPop] = useState<{ id: string; key: number } | null>(null);
  const [tab, setTab] = useState<'deck' | 'tapetes' | 'grimorio'>(() => { const q = new URLSearchParams(window.location.search); return q.has('tapetes') ? 'tapetes' : q.has('grimorio') ? 'grimorio' : 'deck'; });
  const [one, setOne] = useState(() => typeof window !== 'undefined' && window.innerWidth < 760);
  useEffect(() => { const on = () => setOne(window.innerWidth < 760); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on); }, []);

  const deck = decks[slot];
  const inDeck = (id: string) => deck.filter(x => x === id).length;
  const check = checkDeck(deck, progress.collection);
  const setDeck = (d: string[]) => { setDecks(ds => ds.map((x, i) => (i === slot ? d : x))); setSaved(false); };

  // o álbum: agrupado por elemento (as cores ficam juntas), depois raridade e nome
  const owned = useMemo(() => Object.entries(progress.collection)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ c: CARD_BY_ID.get(id)!, n }))
    .filter(x => x.c)
    .sort((a, b) => a.c.element.localeCompare(b.c.element) || RARITY_ORDER.indexOf(b.c.rarity) - RARITY_ORDER.indexOf(a.c.rarity) || a.c.name.localeCompare(b.c.name, 'pt')), [progress.collection]);
  const shown = owned.filter(({ c }) =>
    (!type || c.type === type) && (!element || c.element === element)
    && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  const elements = [...new Set(owned.map(x => x.c.element))];
  const perSpread = one ? PER_PAGE : PER_PAGE * 2;
  const spreads = Math.max(1, Math.ceil(shown.length / perSpread));
  const sp = Math.min(spread, spreads - 1);
  useEffect(() => { setSpread(0); }, [type, element, q, one]);

  const flip = (dir: 1 | -1) => {
    const n = sp + dir;
    if (n < 0 || n >= spreads) return;
    setSpread(n); setTurn({ dir, key: Date.now() }); play('flip');
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (tab !== 'deck' || open) return;
      if (e.key === 'ArrowRight') flip(1);
      if (e.key === 'ArrowLeft') flip(-1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  const canAdd = (c: CardDef) => deck.length < DECK_SIZE && inDeck(c.id) < Math.min(maxCopies(c), progress.collection[c.id] ?? 0);
  const add = (c: CardDef) => {
    if (!canAdd(c)) { play('lose'); return; }
    setDeck([...deck, c.id]); setPop({ id: c.id, key: Date.now() }); play('card');
  };
  const removeAt = (i: number) => { setDeck(deck.filter((_, k) => k !== i)); play('drop'); };
  const remove = (id: string) => { const i = deck.lastIndexOf(id); if (i >= 0) removeAt(i); };
  const save = () => {
    const next: Progress = { ...progress, decks, activeDeck: check.ok ? slot : progress.activeDeck };
    saveProgress(next);
    setSaved(true); play('coin');
  };

  // o deck embaixo: em ordem de tipo, depois nome (com o índice real para tirar)
  const tray = deck.map((id, i) => ({ c: CARD_BY_ID.get(id), i })).filter((x): x is { c: CardDef; i: number } => !!x.c)
    .sort((a, b) => TYPES.indexOf(a.c.type) - TYPES.indexOf(b.c.type) || a.c.name.localeCompare(b.c.name, 'pt'));
  const defs = tray.map(x => x.c);

  // segurar = abrir a carta grande (no celular, sem botão direito)
  const hold = useRef<number | null>(null);
  const pressProps = (c: CardDef, onTap: () => void) => ({
    onPointerDown: () => { hold.current = window.setTimeout(() => { hold.current = -1; setOpen(c); }, 450); },
    onPointerUp: () => { if (hold.current !== -1) { if (hold.current) window.clearTimeout(hold.current); onTap(); } hold.current = null; },
    onPointerLeave: () => { if (hold.current && hold.current !== -1) window.clearTimeout(hold.current); hold.current = null; },
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); setOpen(c); },
  });
  // arrastar a página para o lado também folheia
  const swipe = useRef<number | null>(null);

  const page = (k: number) => {
    const items = shown.slice((sp * (one ? 1 : 2) + k) * PER_PAGE, (sp * (one ? 1 : 2) + k + 1) * PER_PAGE);
    const num = sp * (one ? 1 : 2) + k + 1;
    return (
      <div className={`bk-page ${k === 0 && !one ? 'left' : 'right'}`}>
        <div className="bk-grid">
          {Array.from({ length: PER_PAGE }, (_, i) => {
            const it = items[i];
            if (!it) return <div key={i} className="bk-pocket empty" />;
            const { c, n } = it, k2 = inDeck(c.id), max = Math.min(n, maxCopies(c)), full = k2 >= max;
            return (
              <div key={c.id} className={`bk-pocket ${full ? 'full' : ''} ${pop?.id === c.id ? 'pop' : ''}`} {...pressProps(c, () => add(c))}>
                <div key={pop?.id === c.id ? pop.key : 0} className="bk-card"><TcgCard card={c} /></div>
                <span className={`bk-count ${k2 ? 'on' : ''}`}>{k2}/{max}</span>
              </div>
            );
          })}
        </div>
        <div className="bk-num">{num}</div>
      </div>
    );
  };

  return (
    <div className="dk-root px">
      {/* topo */}
      <div className="dk-top">
        <PxTabs<'deck' | 'tapetes' | 'grimorio'> tabs={[['deck', 'MEU DECK', 'pacote'], ['tapetes', 'TAPETES', 'quadro'], ['grimorio', 'GRIMÓRIO', 'livro']]} value={tab} onChange={setTab} color="#5a3a8a" />
        {tab === 'deck' && (
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: deckSlots(progress) }, (_, i) => (
              <PxButton key={i} color={slot === i ? '#2f6b1e' : '#4a4458'} onClick={() => setSlot(i)}>{progress.activeDeck === i ? '> ' : ''}DECK {i + 1}</PxButton>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-1.5 flex-wrap">
          {tab === 'deck' && <>
            <PxButton color="#3c56b0" onClick={() => setDeck(suggestDeck(progress.collection))}>SUGERIR</PxButton>
            <PxButton color="#6a5a8a" onClick={() => setDeck([])}>LIMPAR</PxButton>
            <PxButton color={check.ok ? '#2f8a2a' : '#6a6478'} onClick={save}>{saved ? 'SALVO!' : check.ok ? 'SALVAR E USAR' : 'SALVAR'}</PxButton>
          </>}
          <PxButton color="#b8433a" onClick={onClose}>FECHAR</PxButton>
        </div>
      </div>

      {tab === 'tapetes' && <div className="dk-scroll"><MatShop progress={progress} /></div>}
      {tab === 'grimorio' && <div className="dk-scroll"><GrimoirePanel progress={progress} /></div>}
      {tab === 'deck' && <>
        {/* o álbum */}
        <div className="bk-area">
          <button className="bk-arrow prev" disabled={sp === 0} onClick={() => flip(-1)} aria-label="Página anterior" />
          <div className="bk-book"
            onPointerDown={e => { swipe.current = e.clientX; }}
            onPointerUp={e => { if (swipe.current !== null && Math.abs(e.clientX - swipe.current) > 70) flip(e.clientX < swipe.current ? 1 : -1); swipe.current = null; }}>
            {/* marcadores: tipos em cima, elementos na lateral */}
            <div className="bk-marks top">
              <button className={`bk-mark ${!type ? 'on' : ''}`} onClick={() => setType('')}>TODAS</button>
              {TYPES.map(t => (
                <button key={t} className={`bk-mark ${type === t ? 'on' : ''}`} onClick={() => setType(type === t ? '' : t)} title={TYPE_PT[t]}>
                  <Symbol id={TYPE_ICON[t]} size={12} /> <span className="lb">{TYPE_PT[t].toUpperCase()}</span>
                </button>
              ))}
              <input className="bk-search" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} placeholder="BUSCAR" />
            </div>
            <div className="bk-marks side">
              {elements.map(e => (
                <button key={e} className={`bk-mark el ${element === e ? 'on' : ''}`} style={{ background: ELEMENT_STYLE[e].el2 }} title={ELEMENT_PT[e]}
                  onClick={() => setElement(element === e ? '' : e)}><Symbol id={ELEMENT_STYLE[e].icon} size={14} /></button>
              ))}
            </div>
            <div key={turn?.key ?? 0} className={`bk-spread ${one ? 'one' : ''} ${turn ? (turn.dir > 0 ? 'turn-next' : 'turn-prev') : ''}`}>
              {page(0)}
              {!one && page(1)}
              {!one && <div className="bk-spine" />}
            </div>
            {!shown.length && <div className="bk-empty">Nenhuma carta com esse filtro.</div>}
          </div>
          <button className="bk-arrow next" disabled={sp >= spreads - 1} onClick={() => flip(1)} aria-label="Próxima página" />
        </div>
        <div className="bk-hint">{shown.length} cartas · páginas {sp * (one ? 1 : 2) + 1}{one ? '' : `-${sp * 2 + 2}`} de {Math.max(1, Math.ceil(shown.length / PER_PAGE))} · toque para pôr no deck · segure para ver grande · setas ou arraste para folhear</div>

        {/* o deck: cartas sobrepostas */}
        <div className="dk-tray">
          <div className="dk-info">
            <div className={`dk-n ${deck.length === DECK_SIZE ? 'ok' : ''}`}>{deck.length}<small>/{DECK_SIZE}</small></div>
            <div className="dk-types">
              {TYPES.map(t => <span key={t} title={TYPE_PT[t]}><Symbol id={TYPE_ICON[t]} size={12} />{defs.filter(c => c.type === t).length}</span>)}
            </div>
            {[...check.problems.slice(0, 1), ...check.warnings.slice(0, 1)].map((m, i) => (
              <div key={i} className={`dk-warn ${i < Math.min(1, check.problems.length) ? 'bad' : ''}`}>{m}</div>
            ))}
          </div>
          <div className="dk-fan" style={{ ['--n' as string]: Math.max(tray.length, 1) }}>
            {tray.map(({ c, i }, k) => (
              <button key={`${c.id}-${i}`} className="dk-c" style={{ zIndex: k, ['--i' as string]: k }} title={`Tirar ${c.name}`} {...pressProps(c, () => removeAt(i))}>
                <TcgCard card={c} />
                <span className="dk-x">TIRAR</span>
              </button>
            ))}
            {!deck.length && <div className="dk-empty">Seu deck está vazio. Toque nas cartas do álbum para pôr aqui, ou use SUGERIR.</div>}
          </div>
        </div>
      </>}

      {open && (
        <div className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="w-[min(72vw,300px)]"><TcgCard card={open} /></div>
            <div className="text-[9px] text-white/80">
              {RARITY_PT[open.rarity].toUpperCase()} · VOCÊ TEM {progress.collection[open.id] ?? 0} · NO DECK {inDeck(open.id)}
            </div>
            <div className="flex gap-2">
              <PxButton color="#6a5a8a" onClick={() => remove(open.id)} disabled={!inDeck(open.id)}>TIRAR</PxButton>
              <PxButton color="#2f8a2a" onClick={() => add(open)} disabled={!canAdd(open)}>PÔR NO DECK</PxButton>
              <PxButton color="#4a4458" onClick={() => setOpen(null)}>FECHAR</PxButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
