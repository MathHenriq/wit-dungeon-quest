// Patch 7.1 — Guild Boss Raid panel.
//
// Reads the active raid for the student's guild and renders:
//   • Boss sprite + HP bar (live via supabase realtime channel)
//   • Current phase + per-phase behavior badge
//   • Member contributions leaderboard
//   • "Atacar boss" button (caps server-side at max_attacks_per_member)
//
// Damage submitted is computed client-side from the student's level with a
// per-phase modifier. The server clamps to a hard cap so a tampered client
// can't one-shot the boss.

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sword, Shield, Skull, Flame, Clock, Crown } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { useOpenProfileCard } from "@/components/student/ProfileCard";
import { toast } from "sonner";

interface RaidRow {
  id: string;
  guild_id: string;
  boss_id: string;
  boss_name: string;
  boss_sprite: string | null;
  total_hp: number;
  current_hp: number;
  phase: 1 | 2 | 3 | 4;
  status: "active" | "defeated" | "expired";
  max_attacks_per_member: number;
  starts_at: string;
  ends_at: string;
}

interface ContribRow {
  student_id: string;
  student_name: string;
  damage_dealt: number;
  attacks_count: number;
}

interface DetailPayload {
  raid: RaidRow;
  contributions: ContribRow[];
}

const PHASE_LABELS: Record<number, { name: string; tone: string; icon: React.ElementType; desc: string }> = {
  1: { name: "Análise", tone: "#60c8f8", icon: Sword,  desc: "Boss em comportamento padrão. Aproveite para atacar com força total." },
  2: { name: "Maldição da Guilda", tone: "#b57bee", icon: Shield, desc: "Cada turno em batalha você perde 10% do HP. Use cura sabiamente." },
  3: { name: "Pele de Aço", tone: "#94a3b8", icon: Shield, desc: "30% de chance do boss bloquear seu ataque. Cartas com efeitos especiais valem mais." },
  4: { name: "Fúria Final", tone: "#f05050", icon: Flame,  desc: "Boss enfurecido — dobra dano causado em batalha. Ataque com cuidado!" },
};

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Encerrando…";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h/24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

interface Props {
  studentId: string;
  studentLevel: number;
  guildId: string | null;
}

export function GuildRaidPanel({ studentId, studentLevel, guildId }: Props) {
  const [payload, setPayload] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const openProfile = useOpenProfileCard();

  const load = useCallback(async () => {
    if (!guildId) { setPayload(null); setLoading(false); return; }
    const { data, error } = await supabaseStudent.rpc("get_active_raid_for_guild", { p_guild_id: guildId });
    if (error) {
      console.warn("[GuildRaidPanel] load", error);
      setPayload(null);
    } else {
      setPayload(data as DetailPayload | null);
    }
    setLoading(false);
  }, [guildId]);

  useEffect(() => { void load(); }, [load]);

  // Realtime: subscribe to row updates on this raid + contribution inserts.
  useEffect(() => {
    if (!payload?.raid?.id) return;
    const raidId = payload.raid.id;
    const channel = supabaseStudent
      .channel(`raid-${raidId}`)
      .on('postgres_changes' as never, {
        event: 'UPDATE', schema: 'public', table: 'boss_raids',
        filter: `id=eq.${raidId}`,
      }, () => { void load(); })
      .on('postgres_changes' as never, {
        event: '*', schema: 'public', table: 'boss_raid_contributions',
        filter: `raid_id=eq.${raidId}`,
      }, () => { void load(); })
      .subscribe();
    return () => { void supabaseStudent.removeChannel(channel); };
  }, [payload?.raid?.id, load]);

  async function attack() {
    if (!payload?.raid) return;
    setAttacking(true);
    // Client damage roll: scales with level + per-phase modifier.
    const phaseMod = payload.raid.phase === 3 && Math.random() < 0.3
      ? 0 // 30% chance to be blocked by phase 3
      : payload.raid.phase === 4 ? 1.0 // phase 4 modifier applies to incoming damage IN battle, not raid HP
      : 1.0;
    const base = 200 + studentLevel * 50;
    const damage = Math.round(base * phaseMod * (0.85 + Math.random() * 0.3));
    const { data, error } = await supabaseStudent.rpc("attack_boss_raid", {
      p_raid_id: payload.raid.id,
      p_damage: damage,
    });
    setAttacking(false);
    if (error) { toast.error("Falha", { description: error.message }); return; }
    const r = data as { success: boolean; error?: string; damage: number; capped: boolean; killshot: boolean; phase: number };
    if (!r?.success) { toast.error(r?.error ?? "Erro"); return; }
    // Patch 8.4: count this attack toward the daily quest, regardless of damage.
    void supabaseStudent.rpc("increment_daily_counter", { p_type: "raid_attacks", p_amount: 1 });

    if (r.damage === 0) {
      toast.error("Boss bloqueou seu ataque!", { description: "Fase 3 — pele de aço." });
    } else {
      toast.success(`-${r.damage} HP no boss${r.capped ? " (limite aplicado)" : ""}`,
        { description: r.killshot ? "🎉 KILLSHOT!" : `Fase atual: ${r.phase}` });
    }
    void load();
  }

  if (!guildId) {
    return <div className="grp-empty">Junte-se a uma guilda para participar de raids.</div>;
  }
  if (loading) return <div className="grp-empty"><Loader2 className="animate-spin" size={20} /></div>;
  if (!payload?.raid) {
    return <div className="grp-empty">Nenhuma raid ativa para sua guilda no momento.</div>;
  }

  const raid = payload.raid;
  const phaseMeta = PHASE_LABELS[raid.phase] ?? PHASE_LABELS[1];
  const PhaseIcon = phaseMeta.icon;
  const hpPct = raid.total_hp > 0 ? (raid.current_hp / raid.total_hp) * 100 : 0;
  const myContrib = payload.contributions.find(c => c.student_id === studentId);
  const myAttacks = myContrib?.attacks_count ?? 0;
  const canAttack = raid.status === "active" && myAttacks < raid.max_attacks_per_member;

  return (
    <section className="grp-root" style={{ ['--phase-tone' as string]: phaseMeta.tone } as React.CSSProperties}>
      <style>{CSS}</style>

      <header className="grp-header">
        <div className="grp-boss-thumb">
          {raid.boss_sprite ? <img src={raid.boss_sprite} alt={raid.boss_name} /> : <Skull size={28} />}
        </div>
        <div className="grp-titles">
          <div className="grp-eyebrow">Raid de Guilda</div>
          <h2>{raid.boss_name}</h2>
          <div className="grp-meta">
            <span><Clock size={11} /> termina em {timeLeft(raid.ends_at)}</span>
            <span>·</span>
            <span className="grp-phase-pill"><PhaseIcon size={11} /> Fase {raid.phase} — {phaseMeta.name}</span>
          </div>
        </div>
      </header>

      {/* HP bar */}
      <div className="grp-hp">
        <div className="grp-hp-fill" style={{ width: `${hpPct}%` }} />
        <div className="grp-hp-text">
          <span>{raid.current_hp.toLocaleString("pt-BR")} / {raid.total_hp.toLocaleString("pt-BR")}</span>
          <span>{hpPct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Phase blurb */}
      <div className="grp-phase-blurb">{phaseMeta.desc}</div>

      {/* Attack control */}
      <div className="grp-attack-row">
        <div className="grp-attacks-left">
          <strong>{raid.max_attacks_per_member - myAttacks}</strong>/{raid.max_attacks_per_member}
          <span>ataques restantes</span>
        </div>
        <button
          className="grp-attack-btn"
          disabled={!canAttack || attacking}
          onClick={() => void attack()}
        >
          {attacking ? <><Loader2 size={14} className="animate-spin" /> Atacando…</> : <><Sword size={14} /> Atacar boss</>}
        </button>
      </div>

      {/* Contributions */}
      <div className="grp-contribs">
        <h4>Contribuições</h4>
        {payload.contributions.length === 0 ? (
          <div className="grp-contribs-empty">Ninguém atacou ainda. Seja o primeiro!</div>
        ) : (
          <div className="grp-contribs-list">
            {payload.contributions.map((c, i) => (
              <div
                key={c.student_id}
                className={`grp-contrib ${c.student_id === studentId ? "me" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => openProfile(c.student_id)}
              >
                <span className="grp-rank">{i === 0 ? <Crown size={12} /> : `#${i+1}`}</span>
                <span className="grp-name">{c.student_name}</span>
                <span className="grp-dmg">{c.damage_dealt.toLocaleString("pt-BR")}</span>
                <span className="grp-atk">{c.attacks_count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const CSS = `
.grp-empty { padding: 40px 16px; text-align: center; color: rgba(255,255,255,0.45); font-family: 'Exo 2', sans-serif; }

.grp-root {
  --phase-tone: #60c8f8;
  padding: 16px 18px 18px;
  background:
    radial-gradient(ellipse at top right, color-mix(in srgb, var(--phase-tone) 14%, transparent), transparent 60%),
    linear-gradient(180deg, #0c1220 0%, #060912 100%);
  border: 1px solid color-mix(in srgb, var(--phase-tone) 35%, rgba(255,255,255,0.08));
  border-radius: 14px;
  color: #e6f0ff;
  font-family: 'Exo 2', sans-serif;
}

.grp-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.grp-boss-thumb {
  width: 64px; height: 64px; border-radius: 12px;
  background: rgba(0,0,0,0.5);
  border: 1.5px solid var(--phase-tone);
  display: flex; align-items: center; justify-content: center;
  color: var(--phase-tone);
  flex-shrink: 0;
}
.grp-boss-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.grp-titles { flex: 1; min-width: 0; }
.grp-eyebrow {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--phase-tone); opacity: 0.85; margin-bottom: 2px;
}
.grp-titles h2 {
  margin: 0; font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700;
  color: #fff;
}
.grp-meta {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px;
}
.grp-meta span { display: inline-flex; align-items: center; gap: 4px; }
.grp-phase-pill {
  padding: 2px 8px; border-radius: 999px;
  background: color-mix(in srgb, var(--phase-tone) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--phase-tone) 45%, transparent);
  color: var(--phase-tone); font-weight: 700;
}

.grp-hp {
  position: relative; height: 22px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 8px;
}
.grp-hp-fill {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, #f05050, #f59e0b, #4ade80);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--phase-tone) 50%, transparent));
  transition: width 0.5s cubic-bezier(0.22,1,0.36,1);
}
.grp-hp-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px;
  font-family: 'Share Tech Mono', monospace; font-size: 11px; font-weight: 700;
  color: #fff;
  text-shadow: 0 0 4px rgba(0,0,0,0.85);
}

.grp-phase-blurb {
  margin: 6px 0 14px;
  font-size: 12px; color: rgba(255,255,255,0.65);
  line-height: 1.5;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid var(--phase-tone);
}

.grp-attack-row {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  padding: 10px 14px; border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}
.grp-attacks-left {
  flex: 1; display: flex; flex-direction: column;
}
.grp-attacks-left strong { font-family: 'Share Tech Mono', monospace; font-size: 18px; color: #fff; }
.grp-attacks-left span:last-child { font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em; text-transform: uppercase; }
.grp-attack-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 8px; cursor: pointer; border: none;
  background: linear-gradient(90deg, #f05050, #fbbf24);
  color: #0a0a14; font-family: inherit; font-weight: 800; font-size: 12px;
  letter-spacing: 0.12em; text-transform: uppercase;
  box-shadow: 0 8px 20px rgba(240,80,80,0.25);
  transition: transform 0.15s ease;
}
.grp-attack-btn:hover:not(:disabled) { transform: translateY(-1px); }
.grp-attack-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.grp-contribs h4 {
  margin: 0 0 8px; font-family: 'Cinzel', serif;
  font-size: 11.5px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--phase-tone);
}
.grp-contribs-empty { font-size: 12px; color: rgba(255,255,255,0.4); padding: 8px; }
.grp-contribs-list { display: flex; flex-direction: column; gap: 4px; }
.grp-contrib {
  display: grid; grid-template-columns: 36px 1fr auto 50px;
  align-items: center; gap: 10px;
  padding: 6px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.04);
  font-size: 12px;
}
.grp-contrib.me {
  background: rgba(74,222,128,0.08);
  border-color: rgba(74,222,128,0.35);
}
.grp-rank { font-family: 'Share Tech Mono', monospace; font-weight: 800; color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; }
.grp-name { color: #fff; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.grp-dmg  { font-family: 'Share Tech Mono', monospace; color: var(--phase-tone); font-weight: 800; }
.grp-atk  { font-family: 'Share Tech Mono', monospace; color: rgba(255,255,255,0.45); text-align: right; }
`;
