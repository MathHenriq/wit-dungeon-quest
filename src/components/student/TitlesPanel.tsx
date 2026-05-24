// Patch 8.2 — Collectible titles panel.
//
// Grid view of the full catalog with unlocked / locked state, grouped by
// category. The active title gets a green pill; clicking any unlocked title
// activates it via set_my_active_title (only one active per student,
// enforced server-side by trigger).
//
// Rarity visuals:
//   silver  — flat metallic outline
//   gold    — warm gradient + soft glow
//   purple  — neon mythic border + glow
//   holo    — animated rainbow gradient shimmer

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Award, Check, Lock, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { toast } from "sonner";

type Category = "combatente" | "colecionador" | "estudante" | "especial";
type Color    = "silver" | "gold" | "purple" | "holo";

interface TitleRow {
  title_id: string;
  key: string;
  name: string;
  description: string | null;
  category: Category;
  color: Color;
  condition_type: string;
  condition_value: number | null;
  unlocked: boolean;
  is_active: boolean;
  unlocked_at: string | null;
}

const CATEGORY_LABEL: Record<Category, string> = {
  combatente:   "Combatente",
  colecionador: "Colecionador",
  estudante:    "Estudante",
  especial:     "Especial",
};

export function TitlesPanel({ onClose }: { onClose?: () => void }) {
  const [rows, setRows] = useState<TitleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Fire condition check on open (cheap if nothing new).
    void supabaseStudent.rpc("check_my_title_conditions");
    const { data, error } = await supabaseStudent.rpc("get_my_titles");
    if (error) console.warn("[TitlesPanel]", error);
    setRows((data ?? []) as TitleRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function setActive(t: TitleRow | null) {
    if (acting) return;
    setActing(t?.title_id ?? "clear");
    const { data, error } = await supabaseStudent.rpc("set_my_active_title", { p_title_id: t?.title_id ?? null });
    setActing(null);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success(t ? `Título ativo: ${t.name}` : "Título removido");
    void load();
  }

  const grouped = useMemo(() => {
    const g: Record<Category, TitleRow[]> = { combatente: [], colecionador: [], estudante: [], especial: [] };
    for (const r of rows) g[r.category].push(r);
    return g;
  }, [rows]);

  const unlockedCount = rows.filter(r => r.unlocked).length;

  return (
    <section className="tp-section">
      <style>{CSS}</style>
      <div className="tp-header">
        <Award size={16} style={{ color: "#f5c84b" }} />
        <h3>Títulos</h3>
        <span className="tp-count">{unlockedCount} / {rows.length}</span>
        {onClose && <button className="tp-close" onClick={onClose}><X size={14} /></button>}
      </div>

      {loading ? (
        <div className="tp-loading"><Loader2 size={20} className="animate-spin" /></div>
      ) : (
        <>
          {/* Active title preview + clear */}
          {(() => {
            const active = rows.find(r => r.is_active);
            return active ? (
              <div className="tp-active-row">
                <div className="tp-active-label">ATIVO</div>
                <TitleChip row={active} large />
                <button className="tp-active-clear" onClick={() => setActive(null)}>Remover</button>
              </div>
            ) : null;
          })()}

          {(Object.keys(grouped) as Category[]).map(cat => {
            const arr = grouped[cat];
            if (arr.length === 0) return null;
            return (
              <div key={cat} className="tp-group">
                <h4>{CATEGORY_LABEL[cat]}</h4>
                <div className="tp-grid">
                  {arr.map(t => (
                    <button
                      key={t.title_id}
                      className={`tp-card tp-${t.color} ${t.unlocked ? "unlocked" : "locked"} ${t.is_active ? "active" : ""}`}
                      onClick={() => t.unlocked && !t.is_active && setActive(t)}
                      disabled={!t.unlocked || acting === t.title_id}
                      title={t.unlocked
                        ? (t.is_active ? "Título já ativo" : "Clique para ativar")
                        : `Bloqueado: ${conditionLabel(t)}`}
                    >
                      <div className="tp-card-head">
                        <span className="tp-card-name"><TitleChip row={t} inline /></span>
                        {t.is_active && <Check size={14} className="tp-card-active-mark" />}
                        {!t.unlocked && <Lock size={12} className="tp-card-lock" />}
                      </div>
                      <div className="tp-card-desc">{t.description}</div>
                      <div className="tp-card-cond">{conditionLabel(t)}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

function conditionLabel(t: TitleRow): string {
  const v = t.condition_value;
  switch (t.condition_type) {
    case "bosses_defeated":     return `Derrote ${v} bosses`;
    case "floor_reached":       return `Alcance o andar ${v}`;
    case "pvp_top1_count":      return v === 1 ? "Top 1 do PvP" : `Top 1 do PvP em ${v} semanas`;
    case "geral_top1_count":    return `Top 1 Geral em ${v} semanas`;
    case "sala_top1_count":     return `Top 1 da Sala em ${v} semanas`;
    case "raids_won":           return `Participe da vitória em ${v} raids`;
    case "unique_cards_owned":  return `Colecione ${v} cartas únicas`;
    case "rarity_count":        return `Possua ${v} cartas (raridade restrita)`;
    case "unknown_owned":       return `Possua ${v} carta(s) ???`;
    case "missions_completed":  return `Conclua ${v} missões`;
    case "tickets_used":        return `Use ${v} Ticket(s) de Criação`;
    case "vault_unlocks":       return `Atinja 1000 fragmentos num evento`;
    case "feed_appearances":    return `Apareça no Mural pelo menos ${v} vez(es)`;
    case "mythic_chest_opens":  return `Abra um baú com carta Mítica`;
    case "master_grant":        return `Concedido pelo professor`;
    case "streak_days":         return `Streak de ${v} dias (manual)`;
    case "cards_examined":      return `Examine ${v} cartas (manual)`;
    default:                    return t.condition_type;
  }
}

function TitleChip({ row, inline = false, large = false }:
  { row: TitleRow; inline?: boolean; large?: boolean }) {
  return (
    <span className={`tc tc-${row.color} ${inline ? "inline" : ""} ${large ? "large" : ""}`}>
      {row.name}
    </span>
  );
}

const CSS = `
@keyframes tp-holo {
  0%   { background-position:   0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes tp-glow-gold {
  0%, 100% { box-shadow: 0 0 0 1px #c9a44a, 0 0 14px rgba(245,200,75,0.35); }
  50%      { box-shadow: 0 0 0 1px #f5c84b, 0 0 24px rgba(245,200,75,0.55); }
}
@keyframes tp-glow-purple {
  0%, 100% { box-shadow: 0 0 0 1px #b57bee, 0 0 14px rgba(181,123,238,0.35); }
  50%      { box-shadow: 0 0 0 1px #d4adf7, 0 0 26px rgba(181,123,238,0.6); }
}

.tp-section {
  padding: 12px 14px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(245,200,75,0.05), rgba(124,58,237,0.05));
  border: 1px solid rgba(245,200,75,0.18);
  color: #e6f0ff; font-family: 'Exo 2', sans-serif;
}
.tp-header {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #f5c84b; margin-bottom: 10px;
}
.tp-header h3 { margin: 0; flex: 1; font: inherit; }
.tp-count {
  font-family: 'Share Tech Mono', monospace; font-size: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 1px 8px; border-radius: 999px;
  color: rgba(255,255,255,0.6);
}
.tp-close {
  background: transparent; border: none; cursor: pointer;
  color: rgba(255,255,255,0.5); padding: 2px;
}
.tp-loading { display: flex; justify-content: center; padding: 18px; color: #f5c84b; }

.tp-active-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; margin-bottom: 14px;
  border-radius: 10px;
  background: rgba(74,222,128,0.08);
  border: 1px solid rgba(74,222,128,0.35);
}
.tp-active-label {
  font-size: 9px; font-weight: 800; letter-spacing: 0.25em;
  color: #4ade80;
}
.tp-active-clear {
  margin-left: auto; padding: 4px 10px;
  font-family: inherit; font-size: 11px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px; color: rgba(255,255,255,0.75); cursor: pointer;
}

.tp-group { margin-top: 14px; }
.tp-group h4 {
  margin: 0 0 6px;
  font-size: 10.5px; font-weight: 800;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: rgba(255,255,255,0.55);
}

.tp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }

.tp-card {
  text-align: left;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: inherit; font: inherit;
  transition: all 0.18s ease;
  display: flex; flex-direction: column; gap: 4px;
}
.tp-card:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  transform: translateY(-1px);
}
.tp-card.locked { opacity: 0.55; cursor: not-allowed; }
.tp-card.unlocked { cursor: pointer; }
.tp-card.active {
  background: rgba(74,222,128,0.08);
  border-color: rgba(74,222,128,0.45);
}
.tp-card-head { display: flex; align-items: center; gap: 6px; }
.tp-card-name { flex: 1; min-width: 0; }
.tp-card-active-mark { color: #4ade80; flex-shrink: 0; }
.tp-card-lock { color: rgba(255,255,255,0.35); flex-shrink: 0; }
.tp-card-desc { font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1.35; }
.tp-card-cond {
  font-family: 'Share Tech Mono', monospace; font-size: 9.5px;
  color: rgba(255,255,255,0.4); margin-top: 2px;
  letter-spacing: 0.04em;
}

/* Title chips */
.tc {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.tc.large { font-size: 14px; padding: 4px 12px; letter-spacing: 0.08em; }

.tc-silver {
  background: linear-gradient(180deg, #d4d8de, #9aa0a8);
  color: #1e1e22;
  border: 1px solid #6b7280;
}
.tc-gold {
  background: linear-gradient(180deg, #fde68a, #d4a017);
  color: #1a1308;
  border: 1px solid #b8860b;
  animation: tp-glow-gold 3.2s ease-in-out infinite;
}
.tc-purple {
  background: linear-gradient(180deg, #c4a3f5, #6d28d9);
  color: #fff;
  border: 1px solid #b57bee;
  animation: tp-glow-purple 2.6s ease-in-out infinite;
}
.tc-holo {
  background: linear-gradient(110deg, #f87171, #fbbf24, #4ade80, #22d3ee, #c084fc, #f87171);
  background-size: 300% 300%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  border: 1px solid #b57bee;
  filter: drop-shadow(0 0 8px rgba(192,132,252,0.6));
  animation: tp-holo 4s linear infinite;
  font-weight: 800;
}
.tp-card.tp-gold.unlocked   { box-shadow: 0 0 0 1px rgba(245,200,75,0.4); }
.tp-card.tp-purple.unlocked { box-shadow: 0 0 0 1px rgba(181,123,238,0.4); }
.tp-card.tp-holo.unlocked   { box-shadow: 0 0 0 1px rgba(255,255,255,0.18); }
`;
