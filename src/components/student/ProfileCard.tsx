// Patch 8.3 — Profile card composite + opener overlay + customizer.
//
// Exports:
//   • ProfileCard         — renders the 4-element composite from a payload.
//   • useProfileCardOpener() — `{ openCardFor(studentId), overlay }`.
//   • BannersPanel        — picker in HeroScreen.
//
// Frame is auto-derived server-side from the student's current weekly rank.

import { useCallback, useEffect, useState, createContext, useContext, useMemo } from "react";
import { Loader2, Shield, Award, Crown, Star, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────────
export type FrameKey = "default" | "bronze" | "silver" | "gold" | "holo";
type TitleColor = "silver" | "gold" | "purple" | "holo";

interface BannerImageData {
  bg?: string;
  tone?: string;
  ornament?: string;
}

export interface ProfileCardPayload {
  student: {
    id: string;
    name: string;
    character_name: string | null;
    level: number;
    character_class: string | null;
    profile_photo_url: string | null;
  };
  banner: {
    key: string;
    name: string;
    rarity: string;
    image_data: BannerImageData;
  };
  frame: FrameKey;
  title: { title_id: string; name: string; color: TitleColor } | null;
  guild: { id: string; name: string; emblem: string; level: number } | null;
}

// ── ProfileCard composite ───────────────────────────────────────────────────
export function ProfileCard({ data, compact = false }: { data: ProfileCardPayload; compact?: boolean }) {
  const banner = data.banner.image_data;
  const tone   = banner.tone || "#475569";
  const init = (data.student.character_name || data.student.name || "?")
    .split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();

  return (
    <div className={`pc-root pc-${data.frame} ${compact ? "compact" : ""}`}
         style={{
           ['--tone' as string]: tone,
           background: banner.bg || "linear-gradient(180deg,#0d1424,#060912)",
         } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <Ornament name={banner.ornament || "none"} />

      <div className="pc-avatar-wrap">
        <div className="pc-frame" />
        <div className="pc-avatar">
          {data.student.profile_photo_url
            ? <img src={data.student.profile_photo_url} alt="" />
            : <span className="pc-avatar-initials">{init}</span>}
        </div>
        {data.frame !== "default" && (
          <span className="pc-frame-badge">
            {data.frame === "gold"   && <Crown size={12} />}
            {data.frame === "silver" && <Star size={12} />}
            {data.frame === "bronze" && <Award size={12} />}
            {data.frame === "holo"   && <Crown size={12} />}
            <span>{
              data.frame === "gold"   ? "TOP 1"   :
              data.frame === "silver" ? "TOP 10"  :
              data.frame === "bronze" ? "TOP 50"  : "LENDA"
            }</span>
          </span>
        )}
      </div>

      <div className="pc-info">
        <div className="pc-name">{data.student.character_name || data.student.name}</div>
        {data.title && (
          <div className={`pc-title pc-title-${data.title.color}`}>{data.title.name}</div>
        )}
        <div className="pc-meta">
          <span className="pc-lvl">Nv. {data.student.level}</span>
          {data.student.character_class && <span className="pc-cls">{data.student.character_class}</span>}
          {data.guild && (
            <span className="pc-guild" title={`Guilda ${data.guild.name} · Lv. ${data.guild.level}`}>
              <Shield size={11} /> {data.guild.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Ornament({ name }: { name: string }) {
  if (name === "sand") {
    return <div className="pc-orn pc-orn-sand">
      {Array.from({ length: 10 }).map((_, i) => <div key={i} className="pc-grain" style={{ left: `${(i*9.7)%100}%` }} />)}
    </div>;
  }
  if (name === "leaves") {
    return <div className="pc-orn pc-orn-leaves" />;
  }
  if (name === "bubbles") {
    return <div className="pc-orn pc-orn-bubbles">
      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="pc-bubble" style={{ left: `${(i*12)%100}%`, animationDelay: `${(i*0.4)%3}s` }} />)}
    </div>;
  }
  if (name === "sparks") {
    return <div className="pc-orn pc-orn-sparks">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="pc-spark" style={{ left: `${(i*8.3)%100}%`, animationDelay: `${(i*0.3)%2}s` }} />)}
    </div>;
  }
  if (name === "runes") {
    return <div className="pc-orn pc-orn-runes">
      {['✦','✶','✷','✸','✹'].map((s, i) => <span key={i} style={{ left: `${10+i*18}%`, top: `${15+(i%2)*60}%` }}>{s}</span>)}
    </div>;
  }
  if (name === "laurels") {
    return <div className="pc-orn pc-orn-laurels" />;
  }
  if (name === "aurora") {
    return <div className="pc-orn pc-orn-aurora" />;
  }
  if (name === "glitch") {
    return <div className="pc-orn pc-orn-glitch" />;
  }
  if (name === "prism") {
    return <div className="pc-orn pc-orn-prism" />;
  }
  return null;
}

// ── Overlay opener hook ────────────────────────────────────────────────────
interface OpenerContext { open: (studentId: string) => void }
const ProfileCardOpenerCtx = createContext<OpenerContext | null>(null);

export function useProfileCardOpener() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const open = useCallback((id: string) => setStudentId(id), []);
  const overlay = studentId ? <ProfileCardModal studentId={studentId} onClose={() => setStudentId(null)} /> : null;
  return { open, overlay };
}

export function ProfileCardOpenerProvider({ children }: { children: React.ReactNode }) {
  const { open, overlay } = useProfileCardOpener();
  return (
    <ProfileCardOpenerCtx.Provider value={useMemo(() => ({ open }), [open])}>
      {children}
      {overlay}
    </ProfileCardOpenerCtx.Provider>
  );
}

export function useOpenProfileCard() {
  const ctx = useContext(ProfileCardOpenerCtx);
  return ctx?.open ?? (() => undefined);
}

function ProfileCardModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [data, setData] = useState<ProfileCardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: payload, error } = await supabaseStudent.rpc("get_profile_card", { p_student_id: studentId });
      if (cancelled) return;
      if (error) console.warn(error);
      setData(payload as ProfileCardPayload | null);
      setLoading(false);

      // Patch 8.4: count this as a profile visit if it's not the caller's own card.
      const { data: me } = await supabaseStudent.auth.getUser();
      const myStudent = me?.user
        ? (await supabaseStudent.from("students").select("id").eq("user_id", me.user.id).maybeSingle()).data
        : null;
      if (myStudent && (myStudent as { id: string }).id !== studentId) {
        void supabaseStudent.rpc("increment_daily_counter", { p_type: "profile_visits", p_amount: 1 });
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  return (
    <div className="pcm-bg" onClick={onClose}>
      <div className="pcm-shell" onClick={e => e.stopPropagation()}>
        <button className="pcm-close" onClick={onClose}><X size={16} /></button>
        {loading ? (
          <div className="pcm-load"><Loader2 className="animate-spin" /></div>
        ) : data ? (
          <ProfileCard data={data} />
        ) : (
          <div className="pcm-empty">Perfil indisponível.</div>
        )}
      </div>
    </div>
  );
}

// ── Banners panel (customizer) ─────────────────────────────────────────────
interface CatalogRow {
  banner_id: string;
  key: string;
  name: string;
  description: string | null;
  rarity: string;
  image_data: BannerImageData;
  unlocked: boolean;
  is_active: boolean;
  condition_label: string;
}

export function BannersPanel() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Fire detection sweep on open (cheap if nothing new).
    void supabaseStudent.rpc("check_my_banner_conditions");
    const { data } = await supabaseStudent.rpc("get_my_banner_catalog");
    setRows((data ?? []) as CatalogRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function setActive(key: string) {
    if (acting) return;
    setActing(key);
    const { data, error } = await supabaseStudent.rpc("set_my_active_banner", { p_banner_key: key });
    setActing(null);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    toast.success("Banner aplicado");
    void load();
  }

  return (
    <section className="bp-section">
      <style>{CSS}</style>
      <div className="bp-header">
        <Crown size={14} style={{ color: "#f5c84b" }} />
        <h3>Banners do Perfil</h3>
        <span className="bp-count">{rows.filter(r => r.unlocked).length} / {rows.length}</span>
      </div>
      {loading ? (
        <div className="bp-load"><Loader2 size={18} className="animate-spin" /></div>
      ) : (
        <div className="bp-grid">
          {rows.map(r => (
            <button
              key={r.key}
              className={`bp-card ${r.unlocked ? "" : "locked"} ${r.is_active ? "active" : ""}`}
              onClick={() => r.unlocked && !r.is_active && setActive(r.key)}
              disabled={!r.unlocked || acting === r.key}
            >
              <div className="bp-prev" style={{ background: r.image_data.bg }}>
                <Ornament name={r.image_data.ornament || "none"} />
                {!r.unlocked && <div className="bp-lock">🔒</div>}
                {r.is_active && <div className="bp-active-flag">ATIVO</div>}
              </div>
              <div className="bp-card-body">
                <div className="bp-name">{r.name}</div>
                <div className="bp-cond">{r.unlocked ? (r.description ?? "—") : r.condition_label}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const CSS = `
/* ── Profile card composite ── */
.pc-root {
  --tone: #475569;
  position: relative;
  width: 320px; min-height: 360px;
  border-radius: 18px;
  overflow: hidden;
  font-family: 'Exo 2', sans-serif;
  color: #fff;
  isolation: isolate;
}
.pc-root::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.65) 100%);
}
.pc-root.compact { width: 240px; min-height: 280px; }

.pc-avatar-wrap {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: center;
  padding: 32px 20px 14px;
}
.pc-avatar {
  position: relative; z-index: 2;
  width: 120px; height: 120px; border-radius: 50%;
  overflow: hidden;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  border: 3px solid rgba(255,255,255,0.7);
}
.pc-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pc-avatar-initials { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 700; }

.pc-frame {
  position: absolute;
  width: 140px; height: 140px; border-radius: 50%;
  z-index: 1;
}
.pc-default .pc-frame { display: none; }
.pc-bronze  .pc-frame { background: conic-gradient(from 0deg, #b87333, #f7a070, #b87333); filter: drop-shadow(0 0 12px rgba(184,115,51,0.6)); }
.pc-silver  .pc-frame { background: conic-gradient(from 0deg, #c0c0c0, #f4f6fa, #c0c0c0); filter: drop-shadow(0 0 14px rgba(192,192,192,0.6)); }
.pc-gold    .pc-frame { background: conic-gradient(from 0deg, #f5c84b, #fff3a0, #f5c84b); filter: drop-shadow(0 0 18px rgba(245,200,75,0.75)); animation: pc-spin 8s linear infinite; }
@keyframes pc-holo-spin {
  0%   { background-position:   0% 50%; transform: rotate(0deg); }
  100% { background-position: 200% 50%; transform: rotate(360deg); }
}
@keyframes pc-spin {
  to { transform: rotate(360deg); }
}
.pc-holo    .pc-frame {
  background: conic-gradient(from 0deg,
    #f87171, #fbbf24, #4ade80, #22d3ee, #c084fc, #f87171);
  filter: drop-shadow(0 0 18px rgba(192,132,252,0.7));
  animation: pc-spin 5s linear infinite;
}

.pc-frame-badge {
  position: absolute; bottom: -2px; right: 50%;
  transform: translateX(60px);
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 999px;
  background: rgba(0,0,0,0.75);
  border: 1px solid currentColor;
  font-family: 'Share Tech Mono', monospace; font-size: 9.5px; font-weight: 700;
  letter-spacing: 0.1em;
  z-index: 3;
}
.pc-bronze .pc-frame-badge { color: #f7a070; }
.pc-silver .pc-frame-badge { color: #e2e8f0; }
.pc-gold   .pc-frame-badge { color: #f5c84b; }
.pc-holo   .pc-frame-badge { color: #c084fc; }

.pc-info {
  position: relative; z-index: 2;
  padding: 0 20px 22px; text-align: center;
}
.pc-name {
  font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700;
  letter-spacing: 0.08em; line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  margin-bottom: 6px;
}
.pc-title {
  display: inline-block;
  margin: 4px 0 8px; padding: 2px 10px;
  border-radius: 6px;
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em;
}
.pc-title-silver { background: linear-gradient(180deg,#d4d8de,#9aa0a8); color: #1e1e22; border: 1px solid #6b7280; }
.pc-title-gold   { background: linear-gradient(180deg,#fde68a,#d4a017); color: #1a1308; border: 1px solid #b8860b; }
.pc-title-purple { background: linear-gradient(180deg,#c4a3f5,#6d28d9); color: #fff; border: 1px solid #b57bee; }
.pc-title-holo {
  background: linear-gradient(110deg,#f87171,#fbbf24,#4ade80,#22d3ee,#c084fc,#f87171);
  background-size: 300% 300%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  border: 1px solid #b57bee;
  animation: pc-holo-spin 4s linear infinite;
}

.pc-meta {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; flex-wrap: wrap;
  font-size: 11px; color: rgba(255,255,255,0.78);
}
.pc-lvl { font-family: 'Share Tech Mono', monospace; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.18); }
.pc-cls { opacity: 0.7; }
.pc-guild { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.18); }

/* ── Ornaments ── */
.pc-orn { position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
@keyframes pc-grain-fall {
  0%   { transform: translateY(-10%); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateY(110%); opacity: 0; }
}
.pc-grain {
  position: absolute; top: 0; width: 2px; height: 8px;
  background: rgba(245,158,11,0.6);
  animation: pc-grain-fall 4s linear infinite;
}
.pc-orn-leaves {
  background: radial-gradient(ellipse at 20% 80%, rgba(74,222,128,0.18), transparent 35%),
              radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.18), transparent 35%);
}
@keyframes pc-bubble-rise {
  0%   { transform: translateY(0); opacity: 0; }
  30%  { opacity: 0.8; }
  100% { transform: translateY(-300px); opacity: 0; }
}
.pc-bubble {
  position: absolute; bottom: -10px;
  width: 8px; height: 8px; border-radius: 50%;
  background: radial-gradient(circle, rgba(56,189,248,0.6), rgba(56,189,248,0.1));
  animation: pc-bubble-rise 6s ease-in infinite;
}
@keyframes pc-spark-rise {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-200px); opacity: 0; }
}
.pc-spark {
  position: absolute; bottom: 30%;
  width: 3px; height: 3px; border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 8px #f59e0b;
  animation: pc-spark-rise 3s ease-out infinite;
}
.pc-orn-runes span {
  position: absolute;
  color: rgba(196,168,231,0.6);
  font-size: 22px;
  text-shadow: 0 0 12px #7c3aed;
  font-family: 'Cinzel', serif;
}
.pc-orn-laurels {
  background:
    radial-gradient(ellipse at 50% 100%, rgba(245,200,75,0.18), transparent 45%),
    repeating-radial-gradient(circle at 50% 110%, rgba(245,200,75,0.07) 0 8px, transparent 8px 16px);
}
@keyframes pc-aurora-flow {
  0%, 100% { transform: translateX(-10%); }
  50%      { transform: translateX(10%); }
}
.pc-orn-aurora {
  background: linear-gradient(180deg, transparent 30%, rgba(34,211,238,0.25) 50%, transparent 70%);
  filter: blur(20px);
  animation: pc-aurora-flow 8s ease-in-out infinite;
  mix-blend-mode: screen;
}
.pc-orn-glitch {
  background:
    repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.05) 2px 3px),
    repeating-linear-gradient(90deg, transparent 0 14px, rgba(148,163,184,0.05) 14px 15px);
  mix-blend-mode: overlay;
}
@keyframes pc-prism {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
}
.pc-orn-prism {
  background: linear-gradient(110deg, rgba(248,113,113,0.2), rgba(251,191,36,0.2), rgba(74,222,128,0.2), rgba(34,211,238,0.2), rgba(192,132,252,0.2));
  background-size: 300% 300%;
  animation: pc-prism 6s linear infinite;
  mix-blend-mode: screen;
}

/* ── Modal ── */
.pcm-bg {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(0,0,0,0.78); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.pcm-shell { position: relative; }
.pcm-close {
  position: absolute; top: -10px; right: -10px; z-index: 5;
  width: 32px; height: 32px; border-radius: 999px;
  background: rgba(0,0,0,0.85); border: 1px solid rgba(255,255,255,0.2);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pcm-load, .pcm-empty {
  width: 320px; min-height: 360px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(20,20,30,0.85); border-radius: 18px;
  color: rgba(255,255,255,0.7);
}

/* ── BannersPanel customizer ── */
.bp-section {
  padding: 12px 14px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(245,200,75,0.05), rgba(124,58,237,0.05));
  border: 1px solid rgba(245,200,75,0.18);
  color: #e6f0ff; font-family: 'Exo 2', sans-serif;
}
.bp-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: #f5c84b;
}
.bp-header h3 { margin: 0; flex: 1; font: inherit; }
.bp-count {
  font-family: 'Share Tech Mono', monospace; font-size: 10px;
  padding: 1px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
}
.bp-load { display: flex; justify-content: center; padding: 16px; color: #f5c84b; }

.bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.bp-card {
  text-align: left; padding: 0; border-radius: 10px; cursor: pointer; border: none;
  background: rgba(255,255,255,0.04);
  color: inherit; font: inherit;
  overflow: hidden;
  transition: transform 0.15s ease;
}
.bp-card:hover:not(:disabled) { transform: translateY(-1px); }
.bp-card.locked { opacity: 0.55; cursor: not-allowed; }
.bp-card.active { box-shadow: 0 0 0 2px #4ade80; }
.bp-prev {
  position: relative; height: 70px;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
}
.bp-lock { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22px; color: rgba(255,255,255,0.5); }
.bp-active-flag {
  position: absolute; top: 6px; right: 6px;
  padding: 1px 6px; border-radius: 999px;
  background: rgba(74,222,128,0.25); border: 1px solid #4ade80;
  font-size: 8.5px; font-weight: 800; letter-spacing: 0.18em; color: #4ade80;
}
.bp-card-body { padding: 8px 10px 10px; }
.bp-name { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700; color: #fff; }
.bp-cond { font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 2px; line-height: 1.35; }
`;
