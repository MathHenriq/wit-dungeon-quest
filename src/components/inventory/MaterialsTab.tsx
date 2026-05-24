// Patch 3.1 — Materials inventory tab.
//
// Shows the student's stockpile of crafting materials. Quantity comes from
// the get_my_materials() RPC which joins the catalog with the per-student
// stockpile. Items the student doesn't have are filtered out by default
// (toggle "Mostrar todos" to see the full catalog in grey).

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';

export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'epic';

interface MaterialRow {
  material_id: string;
  name:        string;
  description: string;
  rarity:      MaterialRarity;
  theme:       string;
  icon_url:    string | null;
  quantity:    number;
}

const RARITY_META: Record<MaterialRarity, { label: string; color: string; bg: string; border: string }> = {
  common:   { label: 'Comum',    color: '#c8d0d8', bg: 'rgba(200,208,216,0.06)', border: 'rgba(200,208,216,0.30)' },
  uncommon: { label: 'Incomum',  color: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.35)'  },
  rare:     { label: 'Rara',     color: '#60c8f8', bg: 'rgba(96,200,248,0.07)',  border: 'rgba(96,200,248,0.40)'  },
  epic:     { label: 'Épica',    color: '#b57bee', bg: 'rgba(181,123,238,0.08)', border: 'rgba(181,123,238,0.45)' },
};

const RARITY_ORDER: MaterialRarity[] = ['common', 'uncommon', 'rare', 'epic'];

function useMyMaterials() {
  return useQuery<MaterialRow[]>({
    queryKey: ['my-materials'],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabaseStudent.rpc('get_my_materials');
      if (error) throw error;
      return (data ?? []) as MaterialRow[];
    },
  });
}

export function MaterialsTab() {
  const { data: rows = [], isLoading, error } = useMyMaterials();
  const [showAll, setShowAll]         = useState(false);
  const [rarityFilter, setRarityFilter] = useState<'all' | MaterialRarity>('all');
  const [themeFilter,  setThemeFilter]  = useState<'all' | string>('all');

  // Themes are dynamic — derive from the catalog so future additions appear automatically.
  const themes = useMemo(() => {
    const set = new Set(rows.map(r => r.theme));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (!showAll && r.quantity <= 0) return false;
    if (rarityFilter !== 'all' && r.rarity !== rarityFilter) return false;
    if (themeFilter  !== 'all' && r.theme  !== themeFilter)  return false;
    return true;
  }), [rows, showAll, rarityFilter, themeFilter]);

  if (isLoading) {
    return <div style={emptyStyle}>Carregando materiais…</div>;
  }
  if (error) {
    return <div style={emptyStyle}>Falha ao carregar materiais.</div>;
  }

  const ownedCount = rows.filter(r => r.quantity > 0).length;

  return (
    <div style={{ padding: '4px 0 24px' }}>
      {/* Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 4px 14px',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '1.5px',
        color: 'rgba(200,216,240,0.55)',
      }}>
        <span style={{ opacity: 0.7 }}>RARIDADE</span>
        <select
          value={rarityFilter}
          onChange={e => setRarityFilter(e.target.value as 'all' | MaterialRarity)}
          style={selectStyle}
        >
          <option value="all">todas</option>
          {RARITY_ORDER.map(r => (
            <option key={r} value={r}>{RARITY_META[r].label}</option>
          ))}
        </select>

        <span style={{ opacity: 0.7, marginLeft: 6 }}>TEMA</span>
        <select
          value={themeFilter}
          onChange={e => setThemeFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">todos</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={e => setShowAll(e.target.checked)}
            style={{ accentColor: '#38d9e8' }}
          />
          Mostrar todos
        </label>

        <span style={{ opacity: 0.5, marginLeft: 4 }}>
          {ownedCount} / {rows.length} obtidos
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={emptyStyle}>
          {showAll
            ? 'Nenhum material no catálogo com esses filtros.'
            : 'Você ainda não tem nenhum material. Derrote inimigos pra começar a estocar.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {filtered.map(m => <MaterialCard key={m.material_id} m={m} />)}
        </div>
      )}
    </div>
  );
}

function MaterialCard({ m }: { m: MaterialRow }) {
  const meta  = RARITY_META[m.rarity];
  const owned = m.quantity > 0;

  return (
    <div
      title={m.description}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: owned ? meta.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${owned ? meta.border : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        opacity: owned ? 1 : 0.45,
        cursor: 'help',
      }}
    >
      {/* Rarity dot */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${meta.color}1c`,
        border: `1px solid ${meta.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700,
        color: meta.color, letterSpacing: '1px',
      }}>
        {m.theme.slice(0, 3).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13, fontWeight: 600,
          color: owned ? '#e2e8f0' : 'rgba(200,216,240,0.55)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {m.name}
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.5px',
          color: meta.color, marginTop: 2,
        }}>
          {meta.label.toUpperCase()} · {m.theme}
        </div>
      </div>

      {/* Quantity badge */}
      <div style={{
        minWidth: 30, height: 22, borderRadius: 6, padding: '0 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: owned ? meta.color + '24' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${owned ? meta.color + '50' : 'rgba(255,255,255,0.08)'}`,
        fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 800,
        color: owned ? '#e2e8f0' : 'rgba(200,216,240,0.4)',
      }}>
        ×{m.quantity}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'rgba(200,216,240,0.85)',
  padding: '3px 8px',
  fontSize: 10,
  fontFamily: "'Share Tech Mono', monospace",
  letterSpacing: '1px',
  outline: 'none',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
  fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
  color: 'rgba(200,216,240,0.45)',
};
