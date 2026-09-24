import { useMemo, useState } from 'react';
import { TcgCard, TcgCardBack } from '@/components/tcg/TcgCard';
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { ELEMENT_PT, RARITY_PT, TYPE_PT } from '@/lib/tcg/labels';
import type { CardType, Element, Rarity } from '@/lib/tcg/types';

/** Vitrine do catálogo do TCG: para revisar texto, arte e moldura das cartas. */
export default function CardsDemo() {
  const [rarity, setRarity] = useState<Rarity | ''>('');
  const [type, setType] = useState<CardType | ''>('');
  const [element, setElement] = useState<Element | ''>('');
  // ?q=kamehameha abre já filtrado (útil para compartilhar uma carta).
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');

  const numero = useMemo(() => new Map(CATALOG.map((c, i) => [c.id, i + 1])), []);
  const cartas = useMemo(() => {
    const busca = q.trim().toLowerCase();
    return CATALOG.filter(c =>
      (!rarity || c.rarity === rarity)
      && (!type || c.type === type)
      && (!element || c.element === element)
      && (!busca || busca.split(',').some(b => {
        const t = b.trim();
        return c.id === t || c.name.toLowerCase().includes(t) || (c.anime ?? '').toLowerCase().includes(t);
      })));
  }, [rarity, type, element, q]);

  const select = 'bg-black/60 border border-white/20 rounded px-2 py-1 text-sm';

  return (
    <div className="min-h-screen bg-[#0f0f16] text-white px-4 py-6">
      <h1 className="font-['Cinzel'] text-2xl text-[#f4d58d] mb-4">Catálogo do TCG · {cartas.length} de {CATALOG.length}</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <input className={select} placeholder="Buscar nome ou obra" value={q} onChange={e => setQ(e.target.value)} />
        <select className={select} value={rarity} onChange={e => setRarity(e.target.value as Rarity | '')}>
          <option value="">Toda raridade</option>
          {Object.entries(RARITY_PT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={select} value={type} onChange={e => setType(e.target.value as CardType | '')}>
          <option value="">Todo tipo</option>
          {Object.entries(TYPE_PT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={select} value={element} onChange={e => setElement(e.target.value as Element | '')}>
          <option value="">Todo elemento</option>
          {Object.entries(ELEMENT_PT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
        {!rarity && !type && !element && !q && <TcgCardBack />}
        {cartas.map(c => <TcgCard key={c.id} card={c} number={numero.get(c.id)} total={CATALOG.length} />)}
      </div>
    </div>
  );
}
