// Patch 5.5 — Skin selector for a single card.
//
// Lists every skin defined for the base shop_item:
//   • Unlocked + equipped → highlighted, button "Remover".
//   • Unlocked → button "Equipar".
//   • Locked → shows unlock condition + (for mastery) progress (X/threshold).
// All skins purely cosmetic — gameplay never references this table.

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles, Lock, Check, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { toast } from "sonner";

interface SkinRow {
  skin_id: string;
  name: string;
  description: string | null;
  unlock_condition: "event" | "mastery" | "achievement" | "admin_grant";
  unlock_payload: Record<string, unknown>;
  visual_data: Record<string, unknown> & { image_url?: string; frame_style?: string };
  unlocked: boolean;
  equipped: boolean;
  usage_count: number;
}

interface Props {
  baseCardId: string;
  baseCardImage?: string | null;
  onChange?: () => void;
  onClose?: () => void;
}

export function CardSkinSelector({ baseCardId, baseCardImage, onChange, onClose }: Props) {
  const [rows, setRows] = useState<SkinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseStudent.rpc("get_card_skins_for", { p_base_card_id: baseCardId });
    if (error) {
      console.warn("[CardSkinSelector] load", error);
      setRows([]);
    } else {
      setRows((data ?? []) as SkinRow[]);
    }
    setLoading(false);
  }, [baseCardId]);

  useEffect(() => { void load(); }, [load]);

  async function setEquipped(skin: SkinRow, equip: boolean) {
    setActing(skin.skin_id);
    const fn = equip ? "equip_skin" : "unequip_skin";
    const { data, error } = await supabaseStudent.rpc(fn, { p_skin_id: skin.skin_id });
    setActing(null);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success(equip ? `Skin equipada: ${skin.name}` : `Skin removida: ${skin.name}`);
    await load();
    onChange?.();
  }

  return (
    <div className="card-skin-selector">
      <style>{CSS}</style>
      <div className="css-header">
        <Sparkles size={14} />
        <h4>Skins desta carta</h4>
        {onClose && <button className="css-close" onClick={onClose}><X size={14} /></button>}
      </div>

      {loading ? (
        <div className="css-loading"><Loader2 size={18} className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="css-empty">Esta carta ainda não tem skins disponíveis.</div>
      ) : (
        <div className="css-grid">
          {/* Default skin tile — always available */}
          <div className={`css-skin ${rows.every(r => !r.equipped) ? "equipped" : ""}`}>
            <div className="css-skin-art">
              {baseCardImage ? <img src={baseCardImage} alt="Original" /> : <div className="css-skin-ph">?</div>}
            </div>
            <div className="css-skin-info">
              <div className="css-skin-name">Original</div>
              <div className="css-skin-sub">Visual padrão</div>
              {rows.every(r => !r.equipped) ? (
                <div className="css-pill equipped"><Check size={10} /> Equipada</div>
              ) : (
                <button
                  className="css-btn"
                  onClick={async () => {
                    const equipped = rows.find(r => r.equipped);
                    if (equipped) await setEquipped(equipped, false);
                  }}
                >Usar original</button>
              )}
            </div>
          </div>

          {rows.map(s => {
            const masteryThreshold = Number(s.unlock_payload?.["mastery_threshold"] ?? 100);
            const masteryProgress = Math.min(100, (s.usage_count / Math.max(1, masteryThreshold)) * 100);
            const visualImg = (s.visual_data?.image_url as string | undefined) ?? baseCardImage ?? null;
            return (
              <div key={s.skin_id} className={`css-skin ${s.equipped ? "equipped" : ""} ${!s.unlocked ? "locked" : ""}`}>
                <div className="css-skin-art">
                  {visualImg ? <img src={visualImg} alt={s.name} /> : <div className="css-skin-ph">{s.name.charAt(0)}</div>}
                  {!s.unlocked && <div className="css-skin-lock"><Lock size={20} /></div>}
                </div>
                <div className="css-skin-info">
                  <div className="css-skin-name">{s.name}</div>
                  <div className="css-skin-sub">
                    {s.unlock_condition === "mastery"
                      ? `Mestria ≥ ${masteryThreshold}`
                      : s.unlock_condition === "event"     ? "Evento"
                      : s.unlock_condition === "achievement" ? "Conquista"
                      : "Concessão"}
                  </div>
                  {s.description && <div className="css-skin-desc">{s.description}</div>}

                  {!s.unlocked && s.unlock_condition === "mastery" && (
                    <>
                      <div className="css-bar"><div style={{ width: `${masteryProgress}%` }} /></div>
                      <div className="css-bar-label">{s.usage_count} / {masteryThreshold} usos</div>
                    </>
                  )}

                  {s.unlocked && !s.equipped && (
                    <button className="css-btn primary" onClick={() => setEquipped(s, true)} disabled={acting === s.skin_id}>
                      {acting === s.skin_id ? <Loader2 size={12} className="animate-spin" /> : "Equipar"}
                    </button>
                  )}
                  {s.equipped && (
                    <div className="css-pill equipped"><Check size={10} /> Equipada</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CSS = `
.card-skin-selector {
  padding: 12px 14px; margin-top: 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  font-family: 'Exo 2', sans-serif;
  color: #e6f0ff;
}
.css-header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; color: #f5c84b; }
.css-header h4 {
  flex: 1; margin: 0;
  font-family: 'Cinzel', serif; font-size: 11.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
}
.css-close { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; }
.css-loading { display: flex; justify-content: center; padding: 16px; color: #f5c84b; }
.css-empty { font-size: 12px; opacity: 0.45; padding: 12px 4px; }

.css-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.css-skin {
  display: flex; gap: 10px; padding: 8px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  transition: all 0.18s ease;
}
.css-skin.equipped {
  background: rgba(74,222,128,0.06);
  border-color: rgba(74,222,128,0.45);
  box-shadow: 0 0 14px rgba(74,222,128,0.18);
}
.css-skin.locked { opacity: 0.75; }
.css-skin-art {
  position: relative;
  width: 60px; height: 60px; flex-shrink: 0;
  border-radius: 8px; overflow: hidden;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
}
.css-skin-art img { width: 100%; height: 100%; object-fit: contain; }
.css-skin-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: 22px; color: rgba(255,255,255,0.4);
}
.css-skin.locked .css-skin-art img { filter: grayscale(0.85) brightness(0.55); }
.css-skin-lock {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.7);
}
.css-skin-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.css-skin-name { font-size: 12.5px; font-weight: 700; color: #fff; }
.css-skin-sub {
  font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.css-skin-desc { font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1.4; }
.css-bar {
  height: 5px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.05);
  margin-top: 4px;
}
.css-bar > div {
  height: 100%; background: linear-gradient(90deg, #fbbf24, #f5c84b);
  transition: width 0.3s ease;
}
.css-bar-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; color: rgba(255,255,255,0.4);
}
.css-btn {
  margin-top: 4px; padding: 4px 10px; border-radius: 6px; cursor: pointer;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.85);
  font-family: inherit; font-size: 11px; font-weight: 700;
  letter-spacing: 0.05em;
}
.css-btn.primary {
  background: rgba(74,222,128,0.18);
  border-color: rgba(74,222,128,0.5);
  color: #4ade80;
}
.css-btn:hover { filter: brightness(1.15); }
.css-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px;
  font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
}
.css-pill.equipped {
  background: rgba(74,222,128,0.18); color: #4ade80;
  border: 1px solid rgba(74,222,128,0.45);
}
`;
