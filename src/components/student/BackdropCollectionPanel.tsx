// Patch 6.2 — Backdrop collection viewer for the student profile.
//
// Lists every backdrop the student has seen in battle, with a favorite toggle.
// Locked backdrops show only the silhouette of the tile (greyed) to hint at
// what's still ahead.

import { useEffect, useState } from "react";
import { Star, StarOff, Image as ImageIcon } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { toast } from "sonner";
import { BACKDROPS, BackdropPreview, type BackdropKey } from "@/components/battle/BattleBackdrop";

interface UnlockedRow {
  backdrop_key: BackdropKey;
  is_favorite: boolean;
  unlocked_at: string;
}

export function BackdropCollectionPanel() {
  const [rows, setRows] = useState<UnlockedRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabaseStudent.rpc("get_my_backdrops");
    setRows((data ?? []) as UnlockedRow[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function toggleFav(key: BackdropKey) {
    const { data, error } = await supabaseStudent.rpc("toggle_favorite_backdrop", { p_key: key });
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; is_favorite?: boolean };
    if (!r?.success) return;
    toast.success(r.is_favorite ? "Cenário favoritado" : "Removido dos favoritos");
    void load();
  }

  const unlockedKeys = new Set(rows.map(r => r.backdrop_key));
  const allKeys = (Object.keys(BACKDROPS) as BackdropKey[]).filter(k => k !== "default");

  return (
    <section className="bcp-section">
      <style>{CSS}</style>
      <div className="bcp-header">
        <ImageIcon size={14} /> Cenários de Batalha
        <span className="bcp-count">{rows.length}/{allKeys.length}</span>
      </div>

      {loading ? (
        <div className="bcp-loading">Carregando...</div>
      ) : (
        <div className="bcp-grid">
          {allKeys.map(k => {
            const meta = BACKDROPS[k];
            const owned = unlockedKeys.has(k);
            const row = rows.find(r => r.backdrop_key === k);
            return (
              <div key={k} className={`bcp-tile ${owned ? "" : "locked"}`}>
                <div className="bcp-preview-wrap">
                  {owned ? <BackdropPreview keyName={k} size={140} /> : (
                    <div className="bcp-preview-locked"><ImageIcon size={26} /></div>
                  )}
                </div>
                <div className="bcp-meta">
                  <div className="bcp-name" style={{ color: owned ? meta.tone : "rgba(255,255,255,0.4)" }}>
                    {owned ? meta.name : "???"}
                  </div>
                  <div className="bcp-blurb">{owned ? meta.blurb : "Use uma carta rara em batalha para revelar."}</div>
                </div>
                {owned && (
                  <button
                    className="bcp-fav"
                    onClick={() => void toggleFav(k)}
                    title={row?.is_favorite ? "Remover dos favoritos" : "Favoritar"}
                  >
                    {row?.is_favorite
                      ? <Star size={14} fill="#f5c84b" stroke="#f5c84b" />
                      : <StarOff size={14} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const CSS = `
.bcp-section {
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(34,211,238,0.05));
  border: 1px solid rgba(124,58,237,0.2);
  border-radius: 14px;
  color: #e6f0ff;
  font-family: 'Exo 2', sans-serif;
}
.bcp-header {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Cinzel', serif; font-size: 11.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #c4b5fd; margin-bottom: 10px;
}
.bcp-count {
  margin-left: auto;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 1px 8px; border-radius: 999px;
}
.bcp-loading { padding: 12px; opacity: 0.5; font-size: 12px; }
.bcp-grid {
  display: grid; gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.bcp-tile {
  position: relative;
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
}
.bcp-tile.locked { opacity: 0.65; }
.bcp-preview-wrap { width: 100%; display: flex; justify-content: center; }
.bcp-preview-locked {
  width: 140px; height: 91px;
  border-radius: 10px;
  background: repeating-linear-gradient(45deg, #1a1a24, #1a1a24 6px, #0f0f16 6px, #0f0f16 12px);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.25);
  border: 1px dashed rgba(255,255,255,0.08);
}
.bcp-meta { display: flex; flex-direction: column; gap: 2px; }
.bcp-name {
  font-family: 'Cinzel', serif; font-size: 12.5px; font-weight: 700;
}
.bcp-blurb {
  font-size: 10.5px; color: rgba(255,255,255,0.45);
  line-height: 1.35;
}
.bcp-fav {
  position: absolute; top: 6px; right: 6px;
  width: 26px; height: 26px; border-radius: 999px;
  background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.bcp-fav:hover { background: rgba(0,0,0,0.8); }
`;
