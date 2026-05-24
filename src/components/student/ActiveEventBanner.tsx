// Patch 5.1 — Active event banner + detail modal.
//
// Banner: pulls list_active_events and shows the first one as a marquee strip
// inside StudentHeader. Click → opens a modal with the full event detail
// (description, exclusive cards, themed chests).

import { useCallback, useEffect, useState } from "react";
import { Sparkles, X, Calendar, Loader2 } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";

interface ActiveEvent {
  id: string;
  name: string;
  theme: string | null;
  description: string | null;
  banner_image_url: string | null;
  color_primary: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

interface EventDetail {
  event: ActiveEvent & { status: string };
  cards: Array<{ id: string; name: string; rarity: string | null; image_url: string | null; migrated_to_pool: boolean }>;
  chests: Array<{ id: string; chest_key: string | null; name: string; tier: number; cost_coins: number; cost_diamonds: number; description: string | null }>;
}

function timeLeft(endsAt: string | null): string {
  if (!endsAt) return "Sem data limite";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Encerrando…";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days >= 2) return `Termina em ${days}d ${hours}h`;
  if (days === 1) return `Termina em 1d ${hours}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `Termina em ${hours}h ${mins}m`;
}

export function ActiveEventBanner() {
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseStudent.rpc("list_active_events");
      if (cancelled || error || !data) return;
      setEvents(data as ActiveEvent[]);
    })();
    // Re-poll every 5 minutes — events come and go on the hour via cron.
    const id = setInterval(async () => {
      const { data } = await supabaseStudent.rpc("list_active_events");
      if (!cancelled && data) setEvents(data as ActiveEvent[]);
    }, 5 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const openDetail = useCallback(async (eventId: string) => {
    setLoadingDetail(true);
    const { data, error } = await supabaseStudent.rpc("get_event_detail", { p_event_id: eventId });
    setLoadingDetail(false);
    if (error || !data) return;
    setDetail(data as EventDetail);
  }, []);

  if (events.length === 0) return null;

  const evt = events[0]; // primary featured event
  const tone = evt.color_primary || "#f59e0b";

  return (
    <>
      <style>{CSS}</style>
      <button
        onClick={() => void openDetail(evt.id)}
        className="aeb-banner"
        style={{
          ['--tone' as string]: tone,
          backgroundImage: evt.banner_image_url ? `url(${evt.banner_image_url})` : undefined,
        } as React.CSSProperties}
        title={evt.description ?? evt.name}
      >
        <div className="aeb-overlay" />
        <Sparkles size={14} className="aeb-icon" />
        <span className="aeb-label">EVENTO ATIVO</span>
        <span className="aeb-name">{evt.name}</span>
        {evt.theme && <span className="aeb-theme">· {evt.theme}</span>}
        <span className="aeb-countdown">{timeLeft(evt.ends_at)}</span>
        {events.length > 1 && <span className="aeb-more">+{events.length - 1}</span>}
      </button>

      {detail && (
        <EventDetailModal detail={detail} onClose={() => setDetail(null)} />
      )}
      {loadingDetail && !detail && (
        <div className="aeb-loading"><Loader2 size={20} className="animate-spin" /></div>
      )}
    </>
  );
}

function EventDetailModal({ detail, onClose }: { detail: EventDetail; onClose: () => void }) {
  const e = detail.event;
  const tone = e.color_primary || "#f59e0b";
  return (
    <div className="aeb-modal-bg" onClick={onClose}>
      <div className="aeb-modal" onClick={ev => ev.stopPropagation()} style={{ ['--tone' as string]: tone } as React.CSSProperties}>
        <button className="aeb-modal-close" onClick={onClose}><X size={16} /></button>

        {e.banner_image_url && (
          <div className="aeb-modal-banner" style={{ backgroundImage: `url(${e.banner_image_url})` }} />
        )}

        <div className="aeb-modal-body">
          <div className="aeb-modal-head">
            <div className="aeb-modal-icon"><Sparkles size={18} /></div>
            <div style={{ flex: 1 }}>
              <div className="aeb-modal-theme">{e.theme ?? "Evento Especial"}</div>
              <h2 className="aeb-modal-title">{e.name}</h2>
            </div>
            <span className="aeb-modal-countdown">
              <Calendar size={12} /> {timeLeft(e.ends_at)}
            </span>
          </div>

          {e.description && <p className="aeb-modal-desc">{e.description}</p>}

          <FragmentProgressSection eventId={e.id} tone={e.color_primary || "#f59e0b"} />

          <section>
            <h3 className="aeb-section-title">Cartas Exclusivas <span className="aeb-count">({detail.cards.length})</span></h3>
            {detail.cards.length === 0 ? (
              <div className="aeb-empty">Nenhuma carta vinculada a este evento.</div>
            ) : (
              <div className="aeb-card-grid">
                {detail.cards.map(c => (
                  <div key={c.id} className="aeb-card" style={{ ['--rarity-tone' as string]: rarityColor(c.rarity) } as React.CSSProperties}>
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} />
                    ) : (
                      <div className="aeb-card-placeholder">{c.name.charAt(0)}</div>
                    )}
                    <div className="aeb-card-name">{c.name}</div>
                    <div className="aeb-card-rarity">{c.rarity}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="aeb-warn">
              <Sparkles size={11} /> Cartas exclusivas migram para o pool comum quando o evento termina.
            </div>
          </section>

          <section>
            <h3 className="aeb-section-title">Baús Temáticos <span className="aeb-count">({detail.chests.length})</span></h3>
            {detail.chests.length === 0 ? (
              <div className="aeb-empty">Nenhum baú temático.</div>
            ) : (
              <div className="aeb-chest-list">
                {detail.chests.map(ch => (
                  <div key={ch.id} className="aeb-chest">
                    <div>
                      <div className="aeb-chest-name">{ch.name}</div>
                      {ch.description && <div className="aeb-chest-desc">{ch.description}</div>}
                    </div>
                    <div className="aeb-chest-cost">
                      {ch.cost_coins > 0 && <span className="aeb-cost-coin">{ch.cost_coins} 🪙</span>}
                      {ch.cost_diamonds > 0 && <span className="aeb-cost-gem">{ch.cost_diamonds} 💎</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Patch 5.3: fragment progress bar with reward-ladder markers. ─────────────
const VAULT_THRESHOLDS = [
  { at: 50,   label: "Baú Comum",     tone: "#c8d0d8" },
  { at: 200,  label: "Baú Raro",      tone: "#60c8f8" },
  { at: 500,  label: "Baú Mítico",    tone: "#f05050" },
  { at: 1000, label: "Carta Lendária", tone: "#f5c84b" },
] as const;
const VAULT_MAX = 1000;

function FragmentProgressSection({ eventId, tone }: { eventId: string; tone: string }) {
  const [fragments, setFragments] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseStudent.rpc("get_my_event_fragments");
      if (cancelled || error || !data) return;
      const rows = data as Array<{ event_id: string; fragments: number }>;
      const row = rows.find(r => r.event_id === eventId);
      setFragments(row?.fragments ?? 0);
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  if (fragments === null) return null;

  const pct = Math.min(100, (fragments / VAULT_MAX) * 100);
  const nextThreshold = VAULT_THRESHOLDS.find(t => t.at > fragments) ?? VAULT_THRESHOLDS[VAULT_THRESHOLDS.length - 1];

  return (
    <section style={{ marginTop: 18 }}>
      <h3 className="aeb-section-title">Cofre do Evento</h3>
      <div style={{ marginBottom: 10, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        Fragmentos:{" "}
        <strong style={{ color: tone, fontFamily: "'Share Tech Mono', monospace", fontSize: 14 }}>
          {fragments} / {VAULT_MAX}
        </strong>
        {fragments < VAULT_MAX && (
          <span style={{ marginLeft: 12, fontSize: 11, opacity: 0.55 }}>
            Próximo: <strong style={{ color: nextThreshold.tone }}>{nextThreshold.label}</strong> em {nextThreshold.at} ({nextThreshold.at - fragments} faltam)
          </span>
        )}
      </div>

      <div style={{
        position: "relative", height: 14, borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, width: `${pct}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 80%, transparent), ${tone})`,
          boxShadow: `0 0 16px color-mix(in srgb, ${tone} 50%, transparent)`,
          transition: "width 0.4s ease",
        }} />
        {VAULT_THRESHOLDS.map(t => {
          const left = (t.at / VAULT_MAX) * 100;
          const reached = fragments >= t.at;
          return (
            <div key={t.at} title={`${t.at} — ${t.label}`} style={{
              position: "absolute", top: -4, bottom: -4, left: `calc(${left}% - 1px)`,
              width: 2,
              background: reached ? t.tone : "rgba(255,255,255,0.25)",
              boxShadow: reached ? `0 0 8px ${t.tone}` : undefined,
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "'Share Tech Mono', monospace" }}>
        {VAULT_THRESHOLDS.map(t => (
          <span key={t.at} style={{ color: fragments >= t.at ? t.tone : undefined }}>
            {t.at}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 10, opacity: 0.45, marginTop: 6 }}>
        Fragmentos caem em 30% das batalhas durante o evento (bosses garantem 5). O cofre abre automaticamente quando o evento termina.
      </div>
    </section>
  );
}

function rarityColor(r: string | null): string {
  switch ((r ?? "").toLowerCase()) {
    case "legendary": return "#f5c84b";
    case "epic":      return "#b57bee";
    case "rare":      return "#60c8f8";
    case "uncommon":  return "#4ade80";
    case "mythic":    return "#f05050";
    case "unknown":   return "#4b5563";
    default:          return "#c8d0d8";
  }
}

const CSS = `
@keyframes aeb-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes aeb-pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--tone), 0 0 12px color-mix(in srgb, var(--tone) 30%, transparent); }
  50%      { box-shadow: 0 0 0 1px var(--tone), 0 0 22px color-mix(in srgb, var(--tone) 50%, transparent); }
}

.aeb-banner {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0)) ,
    color-mix(in srgb, var(--tone) 8%, rgba(20,20,30,0.85));
  background-size: cover;
  background-position: center;
  background-blend-mode: overlay;
  border: 1px solid color-mix(in srgb, var(--tone) 50%, transparent);
  color: #fff;
  font-family: 'Exo 2', sans-serif;
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
  position: relative; overflow: hidden;
  animation: aeb-pulse 3s ease-in-out infinite;
  transition: transform 0.15s ease;
}
.aeb-banner:hover { transform: translateY(-1px); }
.aeb-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: aeb-shimmer 5s linear infinite;
  pointer-events: none;
}
.aeb-icon  { color: var(--tone); position: relative; z-index: 1; }
.aeb-label {
  position: relative; z-index: 1;
  font-weight: 800; letter-spacing: 0.15em; font-size: 9.5px;
  color: var(--tone);
}
.aeb-name {
  position: relative; z-index: 1;
  font-weight: 700; color: #fff;
  max-width: 220px; overflow: hidden; text-overflow: ellipsis;
}
.aeb-theme    { position: relative; z-index: 1; opacity: 0.6; font-size: 10.5px; }
.aeb-countdown {
  position: relative; z-index: 1;
  margin-left: 8px; padding: 2px 8px; border-radius: 999px;
  background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1);
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; color: rgba(255,255,255,0.85);
}
.aeb-more {
  position: relative; z-index: 1;
  padding: 1px 6px; border-radius: 4px;
  background: var(--tone); color: #0a0a14;
  font-size: 9.5px; font-weight: 800;
}

.aeb-loading {
  position: fixed; top: 16px; right: 16px; z-index: 70;
  background: rgba(20,20,30,0.9); padding: 8px; border-radius: 8px;
}

/* Modal */
.aeb-modal-bg {
  position: fixed; inset: 0; z-index: 90;
  background: rgba(0,0,0,0.82); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.aeb-modal {
  position: relative; width: 100%; max-width: 720px;
  max-height: 92vh; overflow: hidden;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #0c1220 0%, #060912 100%);
  border: 1px solid color-mix(in srgb, var(--tone) 40%, rgba(255,255,255,0.08));
  border-radius: 16px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 60px color-mix(in srgb, var(--tone) 18%, transparent);
  color: #e6f0ff;
  font-family: 'Exo 2', sans-serif;
}
.aeb-modal-close {
  position: absolute; top: 12px; right: 12px; z-index: 5;
  width: 32px; height: 32px; border-radius: 999px;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.aeb-modal-banner {
  height: 180px; flex-shrink: 0;
  background-size: cover; background-position: center;
  border-bottom: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
  position: relative;
}
.aeb-modal-banner::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(6,9,18,0.95) 100%);
}
.aeb-modal-body { padding: 20px 22px 24px; overflow-y: auto; flex: 1; }
.aeb-modal-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.aeb-modal-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--tone) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent);
  color: var(--tone);
}
.aeb-modal-theme {
  font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--tone); opacity: 0.85; margin-bottom: 2px;
}
.aeb-modal-title {
  margin: 0; font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700;
  color: #fff; line-height: 1.2;
}
.aeb-modal-countdown {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12);
  font-family: 'Share Tech Mono', monospace; font-size: 10.5px;
}
.aeb-modal-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.7); margin: 6px 0 18px; }
.aeb-section-title {
  font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--tone); margin: 18px 0 8px;
}
.aeb-count { color: rgba(255,255,255,0.4); font-size: 11px; }
.aeb-empty { font-size: 12px; color: rgba(255,255,255,0.4); padding: 8px 0; }
.aeb-warn {
  margin-top: 8px; padding: 8px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12);
  font-size: 11px; color: rgba(255,255,255,0.6); display: inline-flex; align-items: center; gap: 6px;
}
.aeb-card-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;
}
.aeb-card {
  --rarity-tone: #c8d0d8;
  padding: 8px; border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--rarity-tone);
  display: flex; flex-direction: column; align-items: center; text-align: center;
  box-shadow: 0 0 14px color-mix(in srgb, var(--rarity-tone) 20%, transparent);
}
.aeb-card img { width: 64px; height: 64px; object-fit: contain; margin-bottom: 6px; }
.aeb-card-placeholder {
  width: 64px; height: 64px; border-radius: 8px;
  background: color-mix(in srgb, var(--rarity-tone) 18%, rgba(0,0,0,0.5));
  display: flex; align-items: center; justify-content: center;
  color: var(--rarity-tone); font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700;
  margin-bottom: 6px;
}
.aeb-card-name {
  font-size: 11px; font-weight: 700; color: #fff;
  overflow: hidden; text-overflow: ellipsis; max-width: 100%;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-height: 1.25;
}
.aeb-card-rarity {
  font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--rarity-tone); margin-top: 2px;
}
.aeb-chest-list { display: flex; flex-direction: column; gap: 6px; }
.aeb-chest {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
}
.aeb-chest-name { font-size: 13px; font-weight: 700; color: #fff; }
.aeb-chest-desc { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
.aeb-chest-cost { display: flex; gap: 6px; font-family: 'Share Tech Mono', monospace; font-size: 12px; }
.aeb-cost-coin { color: #fbbf24; }
.aeb-cost-gem  { color: #63b3ed; }
`;
