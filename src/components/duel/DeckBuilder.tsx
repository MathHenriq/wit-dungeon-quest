import { useMemo, useState } from 'react';
import { TcgCard, ELEMENT_STYLE } from '@/components/tcg/TcgCard';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { ELEMENT_PT, RARITY_PT, TYPE_PT } from '@/lib/tcg/labels';
import { maxCopies, RARITY_ORDER } from '@/lib/tcg/opponents';
import type { CardDef, CardType, Element } from '@/lib/tcg/types';
import { checkDeck, DECK_SIZE, DECK_SLOTS, saveProgress, suggestDeck, type Progress } from '@/game/progress';

/**
 * Construtor de deck: a coleção do aluno (com filtros) de um lado e o deck de
 * 20 cartas do outro. Contagem por tipo e elemento, avisos, sugestão
 * automática e 3 decks salvos (o ativo é o que vai para os duelos).
 */

const pixel = "font-['Press_Start_2P',monospace]";
const TYPES: CardType[] = ['attack', 'challenger', 'equipment', 'trap', 'field'];
const TYPE_ICON: Record<CardType, string> = { attack: '⚔️', challenger: '✨', equipment: '🛡️', trap: '🪤', field: '🏟️' };

export function DeckBuilder({ progress, onClose }: { progress: Progress; onClose: () => void }) {
  const [slot, setSlot] = useState(progress.activeDeck);
  const [decks, setDecks] = useState<string[][]>(() => progress.decks.map(d => [...d]));
  const [type, setType] = useState<CardType | ''>('');
  const [element, setElement] = useState<Element | ''>('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CardDef | null>(null);
  const [saved, setSaved] = useState(false);

  const deck = decks[slot];
  const inDeck = (id: string) => deck.filter(x => x === id).length;
  const check = checkDeck(deck, progress.collection);
  const setDeck = (d: string[]) => { setDecks(ds => ds.map((x, i) => (i === slot ? d : x))); setSaved(false); };

  const owned = useMemo(() => Object.entries(progress.collection)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ c: CARD_BY_ID.get(id)!, n }))
    .filter(x => x.c)
    .sort((a, b) => RARITY_ORDER.indexOf(b.c.rarity) - RARITY_ORDER.indexOf(a.c.rarity) || a.c.name.localeCompare(b.c.name, 'pt')), [progress.collection]);
  const shown = owned.filter(({ c }) =>
    (!type || c.type === type) && (!element || c.element === element)
    && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  const elements = [...new Set(owned.map(x => x.c.element))];

  const add = (c: CardDef) => {
    if (deck.length >= DECK_SIZE || inDeck(c.id) >= Math.min(maxCopies(c), progress.collection[c.id] ?? 0)) return;
    setDeck([...deck, c.id]);
  };
  const remove = (id: string) => { const i = deck.lastIndexOf(id); if (i >= 0) setDeck(deck.filter((_, k) => k !== i)); };
  const save = () => {
    const next: Progress = { ...progress, decks, activeDeck: check.ok ? slot : progress.activeDeck };
    saveProgress(next);
    setSaved(true);
  };

  const defs = deck.map(id => CARD_BY_ID.get(id)).filter((c): c is CardDef => !!c);
  const grouped = [...new Set(deck)].map(id => ({ c: CARD_BY_ID.get(id)!, n: inDeck(id) }))
    .filter(x => x.c)
    .sort((a, b) => TYPES.indexOf(a.c.type) - TYPES.indexOf(b.c.type) || a.c.name.localeCompare(b.c.name, 'pt'));
  const canAdd = (c: CardDef) => deck.length < DECK_SIZE && inDeck(c.id) < Math.min(maxCopies(c), progress.collection[c.id] ?? 0);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#15101c] text-white">
      {/* topo */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b-2 border-white/10">
        <span className={`text-[12px] text-lime-300 ${pixel}`}>MEU DECK</span>
        <div className="flex gap-1">
          {Array.from({ length: DECK_SLOTS }, (_, i) => (
            <button key={i} onClick={() => setSlot(i)}
              className={`px-2 py-1.5 rounded text-[9px] border-2 ${pixel} ${slot === i ? 'bg-[#2f6b1e] border-[#8cc63f]' : 'bg-white/5 border-white/15'}`}>
              {progress.activeDeck === i ? '★ ' : ''}DECK {i + 1}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => setDeck(suggestDeck(progress.collection))} className={`px-2.5 py-1.5 rounded bg-[#3c56b0] text-[9px] ${pixel}`}>SUGERIR</button>
          <button onClick={() => setDeck([])} className={`px-2.5 py-1.5 rounded bg-white/10 text-[9px] ${pixel}`}>LIMPAR</button>
          <button onClick={save} className={`px-2.5 py-1.5 rounded text-[9px] ${pixel} ${check.ok ? 'bg-[#2f6b1e] border-2 border-[#8cc63f]' : 'bg-white/10'}`}>
            {saved ? 'SALVO!' : check.ok ? 'SALVAR E USAR' : 'SALVAR'}
          </button>
          <button onClick={onClose} className={`px-2.5 py-1.5 rounded bg-[#e8485a] text-[9px] ${pixel}`}>FECHAR</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* o deck */}
        <div className="md:w-[320px] shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-white/10 p-3 flex flex-col gap-2 max-h-[42vh] md:max-h-none">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] ${pixel} ${deck.length === DECK_SIZE ? 'text-lime-300' : 'text-yellow-200'}`}>{deck.length}/{DECK_SIZE}</span>
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-[#8cc63f]" style={{ width: `${(deck.length / DECK_SIZE) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1 text-[10px]">
            {TYPES.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/10" title={TYPE_PT[t]}>{TYPE_ICON[t]} {defs.filter(c => c.type === t).length}</span>)}
            <span className="mx-1 text-white/30">|</span>
            {[...new Set(defs.map(c => c.element))].map(e => (
              <span key={e} className="px-1.5 py-0.5 rounded" style={{ background: `${ELEMENT_STYLE[e].el2}` }} title={ELEMENT_PT[e]}>
                {ELEMENT_STYLE[e].icon} {defs.filter(c => c.element === e).length}
              </span>
            ))}
          </div>
          {[...check.problems.slice(0, 2), ...check.warnings].map((m, i) => (
            <div key={i} className={`text-[11px] leading-4 ${i < Math.min(2, check.problems.length) ? 'text-red-300' : 'text-yellow-200'}`}>{m}</div>
          ))}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1">
            {grouped.map(({ c, n }) => (
              <div key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-[12px]" style={{ background: `${ELEMENT_STYLE[c.element].el2}cc` }}>
                <span title={TYPE_PT[c.type]}>{TYPE_ICON[c.type]}</span>
                <button onClick={() => setOpen(c)} className="flex-1 min-w-0 text-left truncate">{c.name}</button>
                {c.type === 'attack' && <span className="text-white/70 text-[11px]">{c.damage}</span>}
                <span className={`text-[10px] ${pixel}`}>×{n}</span>
                <button onClick={() => remove(c.id)} aria-label={`tirar ${c.name}`} className="w-6 h-6 rounded bg-black/40 text-[12px]">−</button>
              </div>
            ))}
            {!deck.length && <div className="text-[12px] text-white/50 leading-5">Toque nas cartas da coleção para pôr no deck, ou use SUGERIR.</div>}
          </div>
        </div>

        {/* a coleção */}
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} placeholder="Buscar carta"
              className="px-2 py-1.5 rounded bg-white/10 border border-white/15 text-[12px] w-[140px]" />
            <button onClick={() => setType('')} className={`px-2 py-1 rounded text-[11px] ${!type ? 'bg-white/25' : 'bg-white/5'}`}>Todas</button>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(type === t ? '' : t)} className={`px-2 py-1 rounded text-[11px] ${type === t ? 'bg-white/25' : 'bg-white/5'}`}>{TYPE_ICON[t]} {TYPE_PT[t]}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {elements.map(e => (
              <button key={e} onClick={() => setElement(element === e ? '' : e)} title={ELEMENT_PT[e]}
                className={`px-2 py-1 rounded text-[12px] border ${element === e ? 'border-white' : 'border-transparent'}`} style={{ background: ELEMENT_STYLE[e].el2 }}>
                {ELEMENT_STYLE[e].icon}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-white/50 self-center">{owned.length} cartas diferentes na coleção</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto grid gap-2 pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
            {shown.map(({ c, n }) => {
              const k = inDeck(c.id);
              return (
                <div key={c.id} className="relative">
                  <button onClick={() => setOpen(c)} className={`w-full transition-transform hover:-translate-y-1 ${canAdd(c) ? '' : 'opacity-60'}`}>
                    <TcgCard card={c} />
                  </button>
                  <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] ${pixel} ${k ? 'bg-[#2f6b1e] border border-[#8cc63f]' : 'bg-black/70'}`}>
                    {k}/{Math.min(n, maxCopies(c))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => remove(c.id)} disabled={!k} className="flex-1 py-1 rounded bg-white/10 disabled:opacity-30 text-[13px]">−</button>
                    <button onClick={() => add(c)} disabled={!canAdd(c)} className="flex-1 py-1 rounded bg-[#2f6b1e] disabled:opacity-30 text-[13px]">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute inset-0 z-10 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="w-[min(72vw,300px)]"><TcgCard card={open} /></div>
            <div className={`text-[9px] text-white/70 ${pixel}`}>
              {RARITY_PT[open.rarity].toUpperCase()} · VOCÊ TEM {progress.collection[open.id] ?? 0} · NO DECK {inDeck(open.id)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => remove(open.id)} disabled={!inDeck(open.id)} className={`px-4 py-2.5 rounded-md bg-white/15 disabled:opacity-30 text-[10px] ${pixel}`}>TIRAR</button>
              <button onClick={() => add(open)} disabled={!canAdd(open)} className={`px-4 py-2.5 rounded-md bg-[#2f6b1e] border-2 border-[#8cc63f] disabled:opacity-30 text-[10px] ${pixel}`}>PÔR NO DECK</button>
              <button onClick={() => setOpen(null)} className={`px-4 py-2.5 rounded-md bg-white/10 text-[10px] ${pixel}`}>FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
