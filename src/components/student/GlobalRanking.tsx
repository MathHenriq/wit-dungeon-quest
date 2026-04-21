import { useState, useEffect, useRef } from "react";
import { Globe, Users2, Swords, Lock } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Student } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankEntry {
  id: string;
  name: string;
  character_name: string | null;
  character_class: string | null;
  profile_photo_url: string | null;
  level: number;
  coins: number;
  presencas_consecutivas: number;
}

interface GuildEntry {
  id: string;
  name: string;
  emblem_color: string;
  level: number;
  xp: number;
  member_count: number;
  wins: number;
}

type RankScope = "mundial" | "sala" | "guildas";

interface GlobalRankingProps {
  student: Student;
}

// ─── Design System ────────────────────────────────────────────────────────────

const REALMS = {
  mundial: {
    id: "mundial" as RankScope,
    label: "Mundial",
    sublabel: "Rank Global",
    Icon: Globe,
    primary:   "#f59e0b",
    dim:       "rgba(245,158,11,0.12)",
    border:    "rgba(245,158,11,0.22)",
    glow:      "rgba(245,158,11,0.28)",
    gradient:  "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, transparent 55%)",
    ring:      "rgba(245,158,11,0.55)",
  },
  sala: {
    id: "sala" as RankScope,
    label: "Sala",
    sublabel: "Rank da Turma",
    Icon: Users2,
    primary:   "#34d399",
    dim:       "rgba(52,211,153,0.12)",
    border:    "rgba(52,211,153,0.22)",
    glow:      "rgba(52,211,153,0.28)",
    gradient:  "linear-gradient(135deg, rgba(52,211,153,0.1) 0%, transparent 55%)",
    ring:      "rgba(52,211,153,0.55)",
  },
  guildas: {
    id: "guildas" as RankScope,
    label: "Guildas",
    sublabel: "Rank das Guildas",
    Icon: Swords,
    primary:   "#f87171",
    dim:       "rgba(248,113,113,0.12)",
    border:    "rgba(248,113,113,0.22)",
    glow:      "rgba(248,113,113,0.28)",
    gradient:  "linear-gradient(135deg, rgba(248,113,113,0.1) 0%, transparent 55%)",
    ring:      "rgba(248,113,113,0.55)",
  },
} as const;

const REALM_ORDER: RankScope[] = ["mundial", "sala", "guildas"];

const PODIUM = [
  { label: "1º", color: "#f59e0b", shadow: "rgba(245,158,11,0.5)", size: 60 },
  { label: "2º", color: "#94a3b8", shadow: "rgba(148,163,184,0.4)", size: 50 },
  { label: "3º", color: "#c2855a", shadow: "rgba(194,133,90,0.4)",  size: 46 },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .gr-root * { box-sizing: border-box; }

  @keyframes gr-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-7px); }
  }
  @keyframes gr-spin-cw {
    to { transform: rotate(360deg); }
  }
  @keyframes gr-spin-ccw {
    to { transform: rotate(-360deg); }
  }
  @keyframes gr-pulse-ring {
    0%,100% { opacity: 0.35; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.18); }
  }
  @keyframes gr-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes gr-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes gr-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes gr-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes gr-badge-pop {
    0%   { transform: scale(0.7); opacity: 0; }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes gr-scanlines {
    0%   { background-position: 0 0; }
    100% { background-position: 0 4px; }
  }
  @keyframes gr-aurora-drift-a {
    0%,100% { transform: translate(0px, 0px) scale(1);    opacity: 0.7; }
    30%      { transform: translate(35px, -25px) scale(1.18); opacity: 1; }
    65%      { transform: translate(-18px, 30px) scale(0.88); opacity: 0.55; }
  }
  @keyframes gr-aurora-drift-b {
    0%,100% { transform: translate(0px, 0px) scale(1);     opacity: 0.5; }
    35%      { transform: translate(-28px, 18px) scale(1.12); opacity: 0.75; }
    70%      { transform: translate(22px, -12px) scale(0.9);  opacity: 0.45; }
  }
  @keyframes gr-aurora-drift-c {
    0%,100% { transform: translate(0px, 0px) scale(1);    opacity: 0.35; }
    50%      { transform: translate(15px, -20px) scale(1.2); opacity: 0.6; }
  }
  @keyframes gr-particle-twinkle {
    0%,100% { opacity: 0.08; transform: scale(1); }
    50%      { opacity: 0.75; transform: scale(1.8); }
  }
  @keyframes gr-beam-scan {
    0%   { transform: translateY(-10%); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateY(110%); opacity: 0; }
  }
  @keyframes gr-grid-pan {
    0%   { background-position: 0 0; }
    100% { background-position: 28px 28px; }
  }
  .gr-aurora-a { animation: gr-aurora-drift-a 14s ease-in-out infinite; }
  .gr-aurora-b { animation: gr-aurora-drift-b 18s ease-in-out infinite; }
  .gr-aurora-c { animation: gr-aurora-drift-c 22s ease-in-out infinite; }
  .gr-beam     { animation: gr-beam-scan 9s linear infinite; }

  .gr-tab {
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  .gr-tab:hover { transform: translateY(-2px); }
  .gr-tab::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .gr-tab:hover::before { opacity: 1; }

  .gr-champion-card {
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s;
    position: relative;
    overflow: hidden;
  }
  .gr-champion-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  .gr-champion-card:hover { transform: translateY(-4px); }
  .gr-champion-card:hover::after { opacity: 1; }

  .gr-row {
    transition: background 0.15s, transform 0.15s;
    cursor: default;
  }
  .gr-row:hover {
    background: rgba(255,255,255,0.04) !important;
    transform: translateX(3px);
  }

  .gr-shimmer-text {
    background: linear-gradient(90deg, #888 0%, #fff 40%, #fff 60%, #888 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gr-shimmer 3s linear infinite;
  }

  .gr-vault-outer {
    animation: gr-spin-cw 8s linear infinite;
  }
  .gr-vault-mid {
    animation: gr-spin-ccw 5s linear infinite;
  }
  .gr-vault-pulse {
    animation: gr-pulse-ring 2s ease-in-out infinite;
  }
  .gr-vault-float {
    animation: gr-float 3s ease-in-out infinite;
  }
`;

// ─── Particles (fixed positions to avoid re-render churn) ────────────────────

const PARTICLES = [
  { x:  8, y: 12, s: 2.5, d: 0.0 }, { x: 22, y: 78, s: 1.5, d: 1.3 },
  { x: 38, y: 28, s: 3.5, d: 2.1 }, { x: 55, y: 62, s: 2.0, d: 0.7 },
  { x: 72, y: 18, s: 2.5, d: 1.9 }, { x: 85, y: 50, s: 1.5, d: 0.4 },
  { x: 12, y: 55, s: 4.0, d: 2.8 }, { x: 65, y: 85, s: 2.0, d: 1.1 },
  { x: 48, y: 42, s: 1.5, d: 3.2 }, { x: 92, y: 30, s: 3.0, d: 0.6 },
] as const;

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBackground({ realm }: { realm: typeof REALMS[RankScope] }) {
  const c = realm.primary;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, overflow: "hidden",
        borderRadius: "inherit", pointerEvents: "none", zIndex: 0,
      }}
    >
      {/* Blob A — top-right */}
      <div
        className="gr-aurora-a"
        style={{
          position: "absolute",
          width: "80%", height: "80%",
          top: "-30%", right: "-20%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c}1a 0%, ${c}08 40%, transparent 70%)`,
          filter: "blur(55px)",
          transition: "background 0.9s ease",
        }}
      />
      {/* Blob B — bottom-left */}
      <div
        className="gr-aurora-b"
        style={{
          position: "absolute",
          width: "70%", height: "70%",
          bottom: "-25%", left: "-18%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c}14 0%, ${c}06 45%, transparent 70%)`,
          filter: "blur(70px)",
          transition: "background 0.9s ease",
        }}
      />
      {/* Blob C — center accent */}
      <div
        className="gr-aurora-c"
        style={{
          position: "absolute",
          width: "50%", height: "50%",
          top: "25%", left: "25%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c}0a 0%, transparent 65%)`,
          filter: "blur(80px)",
          transition: "background 0.9s ease",
        }}
      />

      {/* Dot grid */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          animation: "gr-grid-pan 12s linear infinite",
          opacity: 0.7,
        }}
      />

      {/* Scanning beam */}
      <div
        className="gr-beam"
        style={{
          position: "absolute", left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${c}50 30%, ${c}80 50%, ${c}50 70%, transparent 100%)`,
          boxShadow: `0 0 12px ${c}40`,
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: p.s, height: p.s,
            left: `${p.x}%`, top: `${p.y}%`,
            borderRadius: "50%",
            background: c,
            boxShadow: `0 0 ${p.s * 3}px ${c}`,
            animation: `gr-particle-twinkle ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${p.d}s`,
            transition: "background 0.9s ease, box-shadow 0.9s ease",
          }}
        />
      ))}

      {/* Vignette edges */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Mystery Vault ────────────────────────────────────────────────────────────

function MysteryVault({ rank, realmColor }: { rank: number; realmColor: string }) {
  const colors = ["#f59e0b", "#94a3b8", "#c2855a"];
  const c = colors[rank];

  return (
    <div
      className="gr-vault-float"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        animationDelay: `${rank * 0.5}s`,
      }}
    >
      {/* Rings */}
      <div style={{ position: "relative", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Outer pulse glow */}
        <div
          className="gr-vault-pulse"
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c}20 0%, transparent 70%)`,
            animationDelay: `${rank * 0.4}s`,
          }}
        />

        {/* Ring 1 – spinning CW */}
        <div
          className="gr-vault-outer"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1.5px dashed ${c}60`,
          }}
        />

        {/* Ring 2 – spinning CCW */}
        <div
          className="gr-vault-mid"
          style={{
            position: "absolute",
            inset: 7,
            borderRadius: "50%",
            border: `1.5px solid ${c}40`,
          }}
        />

        {/* Center orb */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${c}25 0%, ${c}08 100%)`,
            border: `1px solid ${c}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 12px ${c}40, inset 0 0 8px ${c}15`,
          }}
        >
          <Lock size={11} style={{ color: c, opacity: 0.9 }} />
        </div>

        {/* Sparkle dots */}
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: c,
              top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 23}px)`,
              left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 23}px)`,
              opacity: 0.7,
              boxShadow: `0 0 4px ${c}`,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: c,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          opacity: 0.85,
        }}
      >
        Prêmio ✦
      </span>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name, photoUrl, size = 44, ringColor,
}: {
  name: string; photoUrl?: string | null; size?: number; ringColor?: string;
}) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: ringColor ? `2px solid ${ringColor}` : "2px solid rgba(255,255,255,0.1)",
        boxShadow: ringColor ? `0 0 14px ${ringColor}60` : "none",
        background: "rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: size * 0.38, color: ringColor || "rgba(255,255,255,0.5)", letterSpacing: 1,
        }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ─── Champion Card (Top 3) ────────────────────────────────────────────────────

function ChampionCard({
  entry, rank, isMe, realm, isFirst,
}: {
  entry: RankEntry; rank: number; isMe: boolean;
  realm: typeof REALMS[RankScope]; isFirst: boolean;
}) {
  const p = PODIUM[rank];
  const displayName = entry.character_name || entry.name;
  const firstName = displayName.split(" ")[0];

  return (
    <div
      className="gr-champion-card"
      style={{
        flex: isFirst ? "1.25" : "1",
        maxWidth: isFirst ? 160 : 128,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "14px 10px 12px",
        borderRadius: 16,
        background: isFirst
          ? `linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${isMe ? realm.border : p.color + "30"}`,
        boxShadow: isFirst
          ? `0 0 30px ${p.shadow}, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 4px 16px rgba(0,0,0,0.3)`,
        alignSelf: isFirst ? "flex-end" : "flex-end",
        marginBottom: isFirst ? 0 : rank === 1 ? 16 : 8,
        animation: "gr-slide-up 0.5s ease both",
        animationDelay: `${rank * 0.1}s`,
      }}
    >
      {/* Mystery Vault — top 3 get the reward */}
      <MysteryVault rank={rank} realmColor={realm.primary} />

      {/* Rank badge */}
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isFirst ? 36 : 28,
          lineHeight: 1,
          color: p.color,
          textShadow: `0 0 20px ${p.shadow}`,
          letterSpacing: "0.02em",
        }}
      >
        {p.label}
      </div>

      {/* Avatar */}
      <Avatar
        name={displayName}
        photoUrl={entry.profile_photo_url}
        size={p.size}
        ringColor={isMe ? realm.primary : p.color + "aa"}
      />

      {/* Name */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: isMe ? realm.primary : "rgba(255,255,255,0.9)",
          textAlign: "center",
          maxWidth: "100%",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textShadow: isMe ? `0 0 12px ${realm.glow}` : "none",
        }}
      >
        {firstName}{isMe ? " ★" : ""}
      </p>

      {/* Score */}
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isFirst ? 22 : 18,
            color: p.color,
            letterSpacing: "0.04em",
          }}
        >
          {entry.level}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          nível
        </span>
      </div>
    </div>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

function LeaderRow({
  entry, rank, isMe, realm,
}: {
  entry: RankEntry; rank: number; isMe: boolean;
  realm: typeof REALMS[RankScope];
}) {
  const displayName = entry.character_name || entry.name;

  return (
    <div
      className="gr-row"
      style={{
        position: "relative",
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px",
        borderRadius: 12,
        background: isMe ? realm.dim : "rgba(255,255,255,0.02)",
        border: `1px solid ${isMe ? realm.border : "rgba(255,255,255,0.04)"}`,
        overflow: "hidden",
        animation: "gr-fade-in 0.4s ease both",
        animationDelay: `${Math.min(rank * 0.04, 0.4)}s`,
      }}
    >
      {/* Ghost rank number */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: 10, top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 48,
          color: isMe ? realm.primary : "rgba(255,255,255,0.04)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-0.02em",
        }}
      >
        {rank}
      </span>

      {/* Rank number */}
      <span
        style={{
          width: 24, textAlign: "center", flexShrink: 0,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 16, letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.25)",
        }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <Avatar
        name={displayName}
        photoUrl={entry.profile_photo_url}
        size={34}
        ringColor={isMe ? realm.primary : undefined}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700, fontSize: 13,
          color: isMe ? realm.primary : "rgba(255,255,255,0.85)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName}
          {isMe && (
            <span style={{
              marginLeft: 7, fontSize: 9, fontWeight: 800,
              padding: "2px 6px", borderRadius: 4,
              background: realm.dim, color: realm.primary,
              letterSpacing: "0.06em", textTransform: "uppercase",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              border: `1px solid ${realm.border}`,
            }}>
              você
            </span>
          )}
        </p>
        {entry.character_class && (
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 1 }}>
            {entry.character_class}
          </p>
        )}
      </div>

      {/* Score */}
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 16, letterSpacing: "0.04em",
          color: isMe ? realm.primary : "rgba(255,255,255,0.45)",
        }}>
          {entry.level}
        </p>
      </div>
    </div>
  );
}

// ─── Guild Row ────────────────────────────────────────────────────────────────

function GuildLeaderRow({ entry, rank, isMe }: { entry: GuildEntry; rank: number; isMe: boolean }) {
  const realm = REALMS.guildas;
  return (
    <div
      className="gr-row"
      style={{
        position: "relative",
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", borderRadius: 12,
        background: isMe ? realm.dim : "rgba(255,255,255,0.02)",
        border: `1px solid ${isMe ? realm.border : "rgba(255,255,255,0.04)"}`,
        overflow: "hidden",
        animation: "gr-fade-in 0.4s ease both",
        animationDelay: `${Math.min(rank * 0.04, 0.4)}s`,
      }}
    >
      <span aria-hidden style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 48,
        color: isMe ? realm.primary : "rgba(255,255,255,0.04)",
        lineHeight: 1, pointerEvents: "none", userSelect: "none",
      }}>
        {rank}
      </span>
      <span style={{
        width: 24, textAlign: "center", flexShrink: 0,
        fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
        color: "rgba(255,255,255,0.25)",
      }}>
        {rank}
      </span>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: `radial-gradient(circle, ${entry.emblem_color}20, transparent)`,
        border: `2px solid ${entry.emblem_color}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Swords size={14} style={{ color: entry.emblem_color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13,
          color: isMe ? realm.primary : "rgba(255,255,255,0.85)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {entry.name}
        </p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 1 }}>
          {entry.member_count} membros · {entry.wins} vitórias
        </p>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
          color: isMe ? realm.primary : "rgba(255,255,255,0.45)",
        }}>
          {entry.xp}
        </p>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.08em" }}>XP</p>
      </div>
    </div>
  );
}

// ─── Guild Champion Card ──────────────────────────────────────────────────────

function GuildChampionCard({ entry, rank, isFirst }: { entry: GuildEntry; rank: number; isFirst: boolean }) {
  const p = PODIUM[rank];
  const realm = REALMS.guildas;

  return (
    <div
      className="gr-champion-card"
      style={{
        flex: isFirst ? "1.25" : "1",
        maxWidth: isFirst ? 160 : 128,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "14px 10px 12px", borderRadius: 16,
        background: isFirst
          ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${p.color}30`,
        boxShadow: isFirst
          ? `0 0 30px ${p.shadow}, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
        alignSelf: "flex-end",
        marginBottom: isFirst ? 0 : rank === 1 ? 16 : 8,
        animation: "gr-slide-up 0.5s ease both",
        animationDelay: `${rank * 0.1}s`,
      }}
    >
      <MysteryVault rank={rank} realmColor={realm.primary} />

      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: isFirst ? 36 : 28, lineHeight: 1,
        color: p.color, textShadow: `0 0 20px ${p.shadow}`,
      }}>
        {p.label}
      </div>

      <div style={{
        width: p.size, height: p.size, borderRadius: "50%",
        background: `radial-gradient(circle, ${entry.emblem_color}25, transparent)`,
        border: `2px solid ${entry.emblem_color}70`,
        boxShadow: `0 0 16px ${entry.emblem_color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Swords size={isFirst ? 24 : 18} style={{ color: entry.emblem_color }} />
      </div>

      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
        fontSize: 10, textAlign: "center",
        color: "rgba(255,255,255,0.85)",
        maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {entry.name}
      </p>

      <div style={{ textAlign: "center" }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: isFirst ? 22 : 18,
          color: p.color, letterSpacing: "0.04em",
        }}>
          {entry.xp}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginLeft: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>XP</span>
      </div>
    </div>
  );
}

// ─── Top 3 Showcase ───────────────────────────────────────────────────────────

function ChampionShowcase({
  top3, currentId, realm, loading,
}: {
  top3: RankEntry[]; currentId: string;
  realm: typeof REALMS[RankScope]; loading: boolean;
}) {
  if (loading) return <LoadingSpinner color={realm.primary} />;
  if (top3.length === 0) return <EmptyState realm={realm} />;

  // Order: 2nd | 1st | 3rd
  const order: [number, number][] = [[1, 1], [0, 0], [2, 2]];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, padding: "0 0 4px" }}>
      {order.map(([arrIdx, rankIdx]) => {
        const entry = top3[arrIdx];
        if (!entry) return <div key={rankIdx} style={{ flex: 1, maxWidth: 128 }} />;
        return (
          <ChampionCard
            key={entry.id}
            entry={entry}
            rank={rankIdx}
            isMe={entry.id === currentId}
            realm={realm}
            isFirst={rankIdx === 0}
          />
        );
      })}
    </div>
  );
}

function GuildChampionShowcase({ top3, loading }: { top3: GuildEntry[]; loading: boolean }) {
  const realm = REALMS.guildas;
  if (loading) return <LoadingSpinner color={realm.primary} />;
  if (top3.length === 0) return <EmptyState realm={realm} />;

  const order: [number, number][] = [[1, 1], [0, 0], [2, 2]];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, padding: "0 0 4px" }}>
      {order.map(([arrIdx, rankIdx]) => {
        const entry = top3[arrIdx];
        if (!entry) return <div key={rankIdx} style={{ flex: 1, maxWidth: 128 }} />;
        return (
          <GuildChampionCard key={entry.id} entry={entry} rank={rankIdx} isFirst={rankIdx === 0} />
        );
      })}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function LoadingSpinner({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: `2px solid ${color}20`,
        borderTop: `2px solid ${color}`,
        animation: "gr-spin 0.7s linear infinite",
      }} />
    </div>
  );
}

function EmptyState({ realm }: { realm: typeof REALMS[RankScope] }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)" }}>
      <realm.Icon size={32} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
      <p style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nenhum resultado encontrado</p>
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "20px 0 16px",
    }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${color}25)` }} />
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 10, letterSpacing: "0.2em",
        color: `${color}60`, whiteSpace: "nowrap",
      }}>
        DEMAIS AVENTUREIROS
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}25, transparent)` }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GlobalRanking({ student }: GlobalRankingProps) {
  const [activeScope, setActiveScope] = useState<RankScope>("sala");
  const [classEntries,  setClassEntries]  = useState<RankEntry[]>([]);
  const [worldEntries,  setWorldEntries]  = useState<RankEntry[]>([]);
  const [guildEntries,  setGuildEntries]  = useState<GuildEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef({ class: false, world: false, guild: false });

  const SELECT = "id, name, character_name, character_class, profile_photo_url, level, coins, presencas_consecutivas";

  useEffect(() => {
    if (loadedRef.current.class) return;
    loadedRef.current.class = true;
    supabaseStudent.from("students").select(SELECT)
      .eq("class_id", student.class_id).eq("status", "active")
      .then(({ data }) => { setClassEntries((data || []) as RankEntry[]); setLoading(false); });
  }, [student.class_id]);

  useEffect(() => {
    if (loadedRef.current.world) return;
    loadedRef.current.world = true;
    supabaseStudent.from("students").select(SELECT)
      .eq("status", "active").limit(100)
      .then(({ data }) => setWorldEntries((data || []) as RankEntry[]));
  }, []);

  useEffect(() => {
    if (loadedRef.current.guild) return;
    loadedRef.current.guild = true;
    supabaseStudent.from("guilds")
      .select("id, name, emblem_color, level, xp, member_count, wins")
      .eq("teacher_id", student.teacher_id).limit(50)
      .then(({ data, error }) => {
        setGuildEntries(!error && data ? (data as GuildEntry[]) : []);
      });
  }, [student.teacher_id]);

  // Switch loading state on tab change
  useEffect(() => {
    const map: Record<RankScope, RankEntry[] | GuildEntry[]> = {
      sala: classEntries, mundial: worldEntries, guildas: guildEntries,
    };
    setLoading(map[activeScope].length === 0);
  }, [activeScope, classEntries, worldEntries, guildEntries]);

  const realm = REALMS[activeScope];

  const activeEntries = (): RankEntry[] => {
    if (activeScope === "sala") return classEntries;
    if (activeScope === "mundial") return worldEntries;
    return [];
  };

  const sortedEntries = [...activeEntries()].sort((a, b) => b.level - a.level);
  const sortedGuilds  = [...guildEntries].sort((a, b) => b.xp - a.xp);

  const myRank = sortedEntries.findIndex(s => s.id === student.id) + 1;
  const me = sortedEntries.find(s => s.id === student.id);

  return (
    <div className="gr-root" style={{ paddingBottom: 80, position: "relative" }}>
      <style>{CSS}</style>

      {/* ── Ambient background — fills the whole component ─────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          overflow: "hidden", pointerEvents: "none", zIndex: 0,
          borderRadius: 4,
        }}
      >
        {/* Large aurora — top right */}
        <div
          className="gr-aurora-a"
          style={{
            position: "absolute",
            width: "120%", height: "60%",
            top: "-20%", right: "-30%",
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${realm.primary}18 0%, ${realm.primary}06 45%, transparent 70%)`,
            filter: "blur(70px)",
            transition: "background 1s ease",
          }}
        />
        {/* Large aurora — bottom left */}
        <div
          className="gr-aurora-b"
          style={{
            position: "absolute",
            width: "100%", height: "55%",
            bottom: "5%", left: "-25%",
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${realm.primary}10 0%, ${realm.primary}04 50%, transparent 70%)`,
            filter: "blur(80px)",
            transition: "background 1s ease",
          }}
        />
        {/* Dot grid — subtle */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            animation: "gr-grid-pan 18s linear infinite",
          }}
        />
        {/* Ambient particles */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: p.s, height: p.s,
              left: `${p.x}%`, top: `${p.y}%`,
              borderRadius: "50%",
              background: realm.primary,
              boxShadow: `0 0 ${p.s * 4}px ${realm.primary}`,
              animation: `gr-particle-twinkle ${3.5 + (i % 3) * 0.8}s ease-in-out infinite`,
              animationDelay: `${p.d}s`,
              transition: "background 1s ease, box-shadow 1s ease",
            }}
          />
        ))}
      </div>

      {/* ── All content sits above the background ─────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── Realm Tabs ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {REALM_ORDER.map((scope) => {
          const r = REALMS[scope];
          const active = activeScope === scope;
          return (
            <button
              key={scope}
              className="gr-tab"
              onClick={() => setActiveScope(scope)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${active ? r.border : "rgba(255,255,255,0.06)"}`,
                background: active ? r.gradient : "rgba(255,255,255,0.02)",
                boxShadow: active ? `0 0 20px ${r.glow}, inset 0 0 20px ${r.dim}` : "none",
                display: "flex", alignItems: "center", gap: 10,
                textAlign: "left",
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: active ? r.dim : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? r.border : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 12px ${r.glow}` : "none",
                transition: "all 0.22s",
              }}>
                <r.Icon size={16} style={{ color: active ? r.primary : "rgba(255,255,255,0.3)", transition: "color 0.22s" }} />
              </div>
              <div>
                <p style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 14, letterSpacing: "0.06em",
                  color: active ? r.primary : "rgba(255,255,255,0.55)",
                  lineHeight: 1, transition: "color 0.22s",
                }}>
                  {r.label}
                </p>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 9, fontWeight: 500,
                  color: active ? `${r.primary}80` : "rgba(255,255,255,0.2)",
                  marginTop: 2, transition: "color 0.22s",
                }}>
                  {r.sublabel}
                </p>
              </div>
              {active && (
                <div style={{
                  marginLeft: "auto", flexShrink: 0,
                  width: 6, height: 6, borderRadius: "50%",
                  background: r.primary,
                  boxShadow: `0 0 8px ${r.primary}`,
                  animation: "gr-pulse-ring 1.5s ease-in-out infinite",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Arena Panel ──────────────────────────────────────────────── */}
      <div
        key={activeScope}
        style={{
          position: "relative",
          background: "rgba(8,10,20,0.6)",
          border: `1px solid ${realm.border}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 0 50px ${realm.glow}20, 0 8px 32px rgba(0,0,0,0.5)`,
          animation: "gr-fade-in 0.3s ease",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Panel inner aurora */}
        <AuroraBackground realm={realm} />
        {/* Panel content — sits above AuroraBackground */}
        <div style={{ position: "relative", zIndex: 1 }}>

        {/* Panel header bar */}
        <div style={{
          padding: "14px 18px",
          background: realm.gradient,
          borderBottom: `1px solid ${realm.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <realm.Icon size={15} style={{ color: realm.primary }} />
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16, letterSpacing: "0.12em",
              color: realm.primary,
              textShadow: `0 0 16px ${realm.glow}`,
            }}>
              {realm.sublabel.toUpperCase()}
            </span>
          </div>
          {/* Live dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: realm.primary,
              animation: "gr-pulse-ring 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
              color: `${realm.primary}80`, textTransform: "uppercase",
            }}>
              Ao vivo
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 14px" }}>

          {/* ── Reward info strip ─── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 13px", borderRadius: 10, marginBottom: 20,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Lock size={12} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11, color: "rgba(255,255,255,0.4)",
              lineHeight: 1.4,
            }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>Top 3</span> recebe um{" "}
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>Prêmio Selado</span> ao fim da temporada
            </p>
          </div>

          <>
          {/* ── Champions ─── */}
          {activeScope === "guildas" ? (
            <GuildChampionShowcase top3={sortedGuilds.slice(0, 3)} loading={loading} />
          ) : (
            <ChampionShowcase
              top3={sortedEntries.slice(0, 3)}
              currentId={student.id}
              realm={realm}
              loading={loading}
            />
          )}

          {/* ── Rest of list ─── */}
          {!loading && (
            <>
              {activeScope === "guildas" ? (
                sortedGuilds.length > 3 && (
                  <>
                    <Divider color={realm.primary} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {sortedGuilds.slice(3).map((e, i) => (
                        <GuildLeaderRow key={e.id} entry={e} rank={i + 4} isMe={false} />
                      ))}
                    </div>
                  </>
                )
              ) : (
                sortedEntries.length > 3 && (
                  <>
                    <Divider color={realm.primary} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {sortedEntries.slice(3).map((e, i) => (
                        <LeaderRow
                          key={e.id} entry={e} rank={i + 4}
                          isMe={e.id === student.id} realm={realm}
                        />
                      ))}
                    </div>
                  </>
                )
              )}

              {/* ── My position footer ─── */}
              {activeScope !== "guildas" && me && myRank > 3 && (
                <div style={{
                  marginTop: 16, padding: "11px 14px", borderRadius: 12,
                  background: realm.dim, border: `1px solid ${realm.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11, color: "rgba(255,255,255,0.45)",
                  }}>
                    Sua posição
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 20,
                      color: realm.primary, letterSpacing: "0.04em",
                    }}>
                      {myRank}º
                    </span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
                      color: `${realm.primary}80`,
                    }}>
                      · Nv. {me.level}
                    </span>
                  </div>
                </div>
              )}

              {/* Count */}
              <p style={{
                textAlign: "center", marginTop: 16,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, color: "rgba(255,255,255,0.18)",
                letterSpacing: "0.06em",
              }}>
                {activeScope === "guildas"
                  ? `${sortedGuilds.length} guilda${sortedGuilds.length !== 1 ? "s" : ""}`
                  : `${sortedEntries.length} aventureiro${sortedEntries.length !== 1 ? "s" : ""}`
                }
              </p>
            </>
          )}
          </>
        </div>
        </div>{/* end panel content zIndex wrapper */}
      </div>{/* end arena panel */}

      </div>{/* end content zIndex wrapper */}
    </div>
  );
}
