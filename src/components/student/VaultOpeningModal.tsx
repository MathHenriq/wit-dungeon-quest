// Patch 5.3 — Cinematic Event Vault opening.
//
// When the student logs in after an event ended, we check unread vault
// openings (get_my_unread_vaults). For each, we show a full-screen modal
// with a brief sequence: locked door → glow → reveal rewards one by one.
// On close, mark_vault_shown is called so it doesn't replay.

import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, Sparkles, Crown, Package, Gift, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";

interface VaultReward {
  threshold: number;
  kind: "chest_grant" | "chest_grant_fallback" | "card";
  chest_key?: string;
  card_name?: string;
  card_id?: string;
}

interface UnreadVault {
  opening_id: string;
  event_id: string;
  event_name: string;
  color_primary: string | null;
  fragments_total: number;
  rewards: VaultReward[];
  opened_at: string;
}

const CHEST_LABEL: Record<string, string> = {
  global_common: "Baú Comum",
  global_rare:   "Baú Raro",
  global_mythic: "Baú Mítico",
};
const CHEST_TONE: Record<string, string> = {
  global_common: "#c8d0d8",
  global_rare:   "#60c8f8",
  global_mythic: "#f05050",
};

export function VaultOpeningModal() {
  const [queue, setQueue] = useState<UnreadVault[]>([]);
  const [phase, setPhase] = useState<"locked" | "opening" | "revealing">("locked");
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseStudent.rpc("get_my_unread_vaults");
      if (cancelled || error || !data) return;
      setQueue((data as UnreadVault[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  const current = queue[0];
  const tone = current?.color_primary || "#f5c84b";

  useEffect(() => {
    if (!current) return;
    setPhase("locked");
    setRevealedCount(0);
    const t1 = setTimeout(() => setPhase("opening"), 1500);
    const t2 = setTimeout(() => setPhase("revealing"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [current?.opening_id]);

  useEffect(() => {
    if (phase !== "revealing" || !current) return;
    // Stagger reveal of each reward.
    const handles: number[] = [];
    current.rewards.forEach((_, i) => {
      handles.push(window.setTimeout(() => setRevealedCount(c => Math.max(c, i + 1)), 400 + i * 600));
    });
    return () => { handles.forEach(window.clearTimeout); };
  }, [phase, current]);

  async function dismiss() {
    if (!current) return;
    await supabaseStudent.rpc("mark_vault_shown", { p_opening_id: current.opening_id });
    setQueue(q => q.slice(1));
  }

  if (!current) return null;

  return (
    <div className="vault-bg" style={{ ['--tone' as string]: tone } as React.CSSProperties}>
      <style>{VAULT_CSS}</style>
      <button className="vault-close" onClick={dismiss} aria-label="Fechar">
        <X size={18} />
      </button>

      <div className="vault-stage">
        <div className="vault-title">
          <span className="vault-event">{current.event_name}</span>
          <h1>O Cofre do Evento se Abre</h1>
          <div className="vault-frag">
            <Sparkles size={14} /> {current.fragments_total} fragmento(s) acumulado(s)
          </div>
        </div>

        <div className={`vault-door vault-${phase}`}>
          <div className="vault-door-glow" />
          <div className="vault-door-icon">
            {phase === "locked" ? <Lock size={92} /> : <Unlock size={92} />}
          </div>
          <div className="vault-door-rays" aria-hidden />
        </div>

        <div className="vault-rewards">
          {current.rewards.length === 0 ? (
            <div className="vault-empty">
              Você não atingiu nenhuma marca de recompensa. Reúna mais fragmentos no próximo evento!
            </div>
          ) : (
            <div className="vault-reward-grid">
              {current.rewards.map((r, i) => (
                <div
                  key={`${r.threshold}-${i}`}
                  className={`vault-reward ${i < revealedCount ? "show" : ""}`}
                  style={{ ['--r-tone' as string]: r.kind === "card" ? "#f5c84b" : (CHEST_TONE[r.chest_key ?? ""] ?? "#c8d0d8") } as React.CSSProperties}
                >
                  <div className="vault-reward-icon">
                    {r.kind === "card" ? <Crown size={26} /> : <Package size={26} />}
                  </div>
                  <div className="vault-reward-body">
                    <div className="vault-reward-th">≥ {r.threshold} fragmentos</div>
                    <div className="vault-reward-name">
                      {r.kind === "card"
                        ? (r.card_name ?? "Carta Lendária")
                        : (CHEST_LABEL[r.chest_key ?? ""] ?? r.chest_key)}
                    </div>
                  </div>
                  <Gift size={16} className="vault-reward-tick" />
                </div>
              ))}
            </div>
          )}
        </div>

        {phase === "revealing" && revealedCount >= current.rewards.length && (
          <button className="vault-claim" onClick={dismiss}>
            Coletar todas as recompensas
          </button>
        )}
      </div>
    </div>
  );
}

const VAULT_CSS = `
@keyframes vault-shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-4px, 2px); }
  40% { transform: translate(4px, -2px); }
  60% { transform: translate(-3px, 1px); }
  80% { transform: translate(3px, -1px); }
}
@keyframes vault-glow-pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50%      { opacity: 0.9; transform: scale(1.15); }
}
@keyframes vault-burst {
  0%   { opacity: 0; transform: scale(0.4); }
  40%  { opacity: 1; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(2); }
}
@keyframes vault-reward-in {
  from { opacity: 0; transform: translateY(20px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes vault-ray {
  0%   { opacity: 0; transform: rotate(var(--rot)) scaleY(0.3); }
  50%  { opacity: 0.6; transform: rotate(var(--rot)) scaleY(1.4); }
  100% { opacity: 0; transform: rotate(var(--rot)) scaleY(0.3); }
}

.vault-bg {
  position: fixed; inset: 0; z-index: 95;
  background: radial-gradient(ellipse at center,
    color-mix(in srgb, var(--tone) 20%, rgba(6,9,18,0.96)) 0%,
    rgba(6,9,18,0.98) 70%);
  backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center;
  padding: 28px;
  font-family: 'Exo 2', sans-serif; color: #e6f0ff;
  animation: vault-reward-in 0.4s ease both;
}
.vault-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 999px;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.vault-stage {
  width: 100%; max-width: 640px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24px;
}
.vault-title { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.vault-event {
  font-size: 10.5px; letter-spacing: 0.3em; text-transform: uppercase;
  color: var(--tone); font-weight: 800;
}
.vault-title h1 {
  margin: 0; font-family: 'Cinzel', serif; font-size: 28px; font-weight: 700;
  letter-spacing: 0.06em;
  background: linear-gradient(90deg, var(--tone), #fff, var(--tone));
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vault-shake 0.4s ease infinite alternate;
}
.vault-frag {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Share Tech Mono', monospace; font-size: 12px;
  color: rgba(255,255,255,0.55);
}

.vault-door {
  position: relative;
  width: 200px; height: 200px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, color-mix(in srgb, var(--tone) 22%, transparent), transparent 70%),
    linear-gradient(180deg, #0b0f1c, #04060a);
  border: 3px solid color-mix(in srgb, var(--tone) 60%, transparent);
  box-shadow:
    inset 0 0 50px color-mix(in srgb, var(--tone) 28%, transparent),
    0 0 60px color-mix(in srgb, var(--tone) 25%, transparent);
}
.vault-locked    .vault-door-icon { color: rgba(255,255,255,0.4); }
.vault-opening   { animation: vault-shake 0.12s ease infinite; }
.vault-revealing .vault-door-icon { color: var(--tone); }
.vault-door-glow {
  position: absolute; inset: -20px; border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--tone) 70%, transparent), transparent 60%);
  filter: blur(8px);
  opacity: 0.3;
  animation: vault-glow-pulse 2s ease-in-out infinite;
}
.vault-opening   .vault-door-glow { animation-duration: 0.7s; opacity: 0.7; }
.vault-revealing .vault-door-glow { opacity: 0.85; }
.vault-door-icon { position: relative; z-index: 2; }
.vault-door-rays {
  position: absolute; inset: 0; z-index: 1;
  pointer-events: none;
  opacity: 0;
}
.vault-revealing .vault-door-rays {
  opacity: 1;
  background:
    conic-gradient(from 0deg,
      transparent 0deg,
      color-mix(in srgb, var(--tone) 50%, transparent) 5deg,
      transparent 10deg,
      color-mix(in srgb, var(--tone) 50%, transparent) 50deg,
      transparent 60deg,
      color-mix(in srgb, var(--tone) 50%, transparent) 110deg,
      transparent 120deg,
      color-mix(in srgb, var(--tone) 50%, transparent) 200deg,
      transparent 210deg,
      color-mix(in srgb, var(--tone) 50%, transparent) 280deg,
      transparent 290deg,
      transparent 360deg);
  mask-image: radial-gradient(circle at center, transparent 38%, black 42%, black 58%, transparent 64%);
  -webkit-mask-image: radial-gradient(circle at center, transparent 38%, black 42%, black 58%, transparent 64%);
  animation: vault-glow-pulse 1.8s ease-in-out infinite;
}

.vault-rewards { width: 100%; min-height: 100px; }
.vault-empty {
  font-size: 13px; color: rgba(255,255,255,0.45);
  padding: 16px; text-align: center;
}
.vault-reward-grid {
  display: grid; gap: 8px;
  grid-template-columns: 1fr;
}
.vault-reward {
  --r-tone: #c8d0d8;
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid color-mix(in srgb, var(--r-tone) 50%, rgba(255,255,255,0.1));
  border-radius: 12px;
  text-align: left;
  opacity: 0;
  box-shadow: 0 0 20px color-mix(in srgb, var(--r-tone) 18%, transparent);
}
.vault-reward.show {
  animation: vault-reward-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
  opacity: 1;
}
.vault-reward-icon {
  flex-shrink: 0;
  width: 44px; height: 44px; border-radius: 10px;
  background: color-mix(in srgb, var(--r-tone) 18%, transparent);
  color: var(--r-tone);
  display: flex; align-items: center; justify-content: center;
}
.vault-reward-body { flex: 1; min-width: 0; }
.vault-reward-th {
  font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
  color: rgba(255,255,255,0.45);
}
.vault-reward-name {
  font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700;
  color: var(--r-tone);
}
.vault-reward-tick { color: var(--r-tone); opacity: 0.7; }

.vault-claim {
  padding: 12px 22px; border-radius: 10px; border: none;
  background: linear-gradient(90deg, var(--tone), color-mix(in srgb, var(--tone) 50%, #fff));
  color: #0a0a14; font-weight: 800;
  font-family: 'Exo 2', sans-serif; font-size: 13px;
  letter-spacing: 0.15em; text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--tone) 35%, transparent);
  transition: transform 0.15s ease;
}
.vault-claim:hover { transform: translateY(-1px); }
`;
