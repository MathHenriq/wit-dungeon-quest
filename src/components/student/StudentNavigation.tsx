import React, { useState } from "react";
import {
  Sword,
  ScrollText,
  Store,
  Trophy,
  User,
  Skull,
  Shield,
  Network,
  Zap,
  Clock,
  Swords,
  ArrowLeftRight,
  LogOut,
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Student } from "@/types";
import { GameIcon } from "@/components/icons/GameIcon";

export type StudentTab =
  | "director"
  | "challenges"
  | "missions"
  | "bosses"
  | "guild"
  | "skills"
  | "shop"
  | "ranking"
  | "character"
  | "dungeon"
  | "capsule"
  | "pvp"
  | "trading";

const NAV_ITEMS: {
  id: StudentTab;
  label: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  danger?: boolean;
}[] = [
  { id: "challenges", label: "Quests",   Icon: Sword },
  { id: "missions",   label: "Missões",  Icon: ScrollText },
  { id: "bosses",     label: "Bosses",   Icon: Skull,   danger: true },
  { id: "dungeon",    label: "Dungeon",  Icon: Zap },
  { id: "pvp",        label: "PvP",      Icon: Swords },
  { id: "guild",      label: "Guilda",   Icon: Shield },
  { id: "skills",     label: "Skills",   Icon: Network },
  { id: "shop",       label: "Loja",     Icon: Store },
  { id: "trading",    label: "Trading",  Icon: ArrowLeftRight },
  { id: "ranking",    label: "Rank",     Icon: Trophy },
  { id: "character",  label: "Herói",    Icon: User },
  { id: "capsule",    label: "Cápsula",  Icon: Clock },
];

interface StudentNavigationProps {
  activeTab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
  student: Student;
  onLogout: () => void;
  onOpenAccessibility?: () => void;
}

function Avatar({ student }: { student: Student }) {
  const initials = (student.character_name || student.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 44, height: 44 }}
    >
      {/* Glow ring */}
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, #00e5ff, #7c3aed, #00e5ff)",
          animation: "spin 4s linear infinite",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: "50%",
          background: "rgba(8, 12, 22, 1)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {student.profile_photo_url ? (
          <img
            src={student.profile_photo_url}
            alt={student.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "#00e5ff",
              letterSpacing: 1,
            }}
          >
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}

export function StudentNavigation({
  activeTab,
  onTabChange,
  student,
  onLogout,
  onOpenAccessibility,
}: StudentNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <>
      {/* ── MOBILE: bottom scrollable nav ─────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(8, 12, 22, 0.97)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(0, 229, 255, 0.1)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {NAV_ITEMS.map(({ id, label, Icon, danger }) => {
            const active = activeTab === id;
            const color = danger ? "#ef4444" : "#00e5ff";
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex-shrink-0 flex flex-col items-center gap-1 py-2.5 px-3 transition-all duration-200 relative"
                style={{
                  minWidth: 56,
                  color: active ? color : "rgba(255,255,255,0.3)",
                  background: active
                    ? danger
                      ? "rgba(239,68,68,0.07)"
                      : "rgba(0,229,255,0.06)"
                    : "transparent",
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 28,
                      height: 2,
                      borderRadius: 1,
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                    }}
                  />
                )}
                <Icon size={17} />
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── DESKTOP: full sidebar ─────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col"
        style={{
          width: sidebarWidth,
          background: "rgba(8, 12, 22, 0.97)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(0, 229, 255, 0.08)",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {/* ── Brand header ─────────────── */}
        <div
          style={{
            padding: collapsed ? "20px 0 16px" : "20px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0, color: "#00e5ff" }}
          >
            <polygon
              points="12,2 22,7 22,17 12,22 2,17 2,7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <polygon
              points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5"
              fill="rgba(0,229,255,0.12)"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          {!collapsed && (
            <span
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.18em",
                color: "#00e5ff",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                textShadow: "0 0 12px rgba(0,229,255,0.4)",
              }}
            >
              WIT Dungeon
            </span>
          )}
        </div>

        {/* ── Student identity ─────────────── */}
        <div
          style={{
            padding: collapsed ? "16px 0" : "16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "flex-start",
            flexShrink: 0,
          }}
        >
          <Avatar student={student} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.92)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {student.character_name || student.name}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: 4,
                    background: "rgba(0,229,255,0.1)",
                    border: "1px solid rgba(0,229,255,0.25)",
                    color: "#00e5ff",
                    letterSpacing: "0.04em",
                  }}
                >
                  Lv. {student.level}
                </span>
                {student.character_class && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.35)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 90,
                    }}
                  >
                    {student.character_class}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Nav items ─────────────── */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px 0",
            scrollbarWidth: "none",
          }}
        >
          {NAV_ITEMS.map(({ id, label, Icon, danger }) => {
            const active = activeTab === id;
            const color = danger ? "#ef4444" : "#00e5ff";
            const activeBg = danger
              ? "rgba(239,68,68,0.08)"
              : "rgba(0,229,255,0.08)";

            return (
              <NavButton
                key={id}
                id={id}
                label={label}
                Icon={Icon}
                active={active}
                color={color}
                activeBg={activeBg}
                collapsed={collapsed}
                onClick={() => onTabChange(id)}
              />
            );
          })}
        </nav>

        {/* ── Footer: stats + actions ─────────────── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: collapsed ? "12px 0" : "12px 12px",
            display: "flex",
            flexDirection: collapsed ? "column" : "row",
            alignItems: "center",
            gap: collapsed ? 8 : 6,
            justifyContent: collapsed ? "center" : "space-between",
            flexShrink: 0,
          }}
        >
          {/* Coins */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: collapsed ? "6px" : "5px 8px",
              borderRadius: 6,
              background: "rgba(255,215,0,0.07)",
              border: "1px solid rgba(255,215,0,0.15)",
              flexShrink: 0,
            }}
            title={`${student.coins.toLocaleString()} moedas`}
          >
            <GameIcon id="coin" size={14} />
            {!collapsed && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffd700",
                  letterSpacing: "0.02em",
                }}
              >
                {student.coins >= 1000
                  ? `${(student.coins / 1000).toFixed(1)}k`
                  : student.coins}
              </span>
            )}
          </div>

          {/* Streak */}
          {student.presencas_consecutivas > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: collapsed ? "6px" : "5px 8px",
                borderRadius: 6,
                background: "rgba(251,146,60,0.07)",
                border: "1px solid rgba(251,146,60,0.15)",
                flexShrink: 0,
              }}
              title={`${student.presencas_consecutivas} aulas consecutivas`}
            >
              <Flame size={13} style={{ color: "#fb923c" }} />
              {!collapsed && (
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}
                >
                  {student.presencas_consecutivas}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 4, marginLeft: collapsed ? 0 : "auto" }}>
            {onOpenAccessibility && (
              <button
                onClick={onOpenAccessibility}
                title="Acessibilidade"
                style={{
                  padding: 6,
                  borderRadius: 6,
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Settings size={14} />
              </button>
            )}
            <button
              onClick={onLogout}
              title="Sair"
              style={{
                padding: 6,
                borderRadius: 6,
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ── Collapse toggle ─────────────── */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expandir" : "Recolher"}
          style={{
            position: "absolute",
            top: "50%",
            right: -12,
            transform: "translateY(-50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(8,12,22,0.97)",
            border: "1px solid rgba(0,229,255,0.2)",
            color: "rgba(0,229,255,0.6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)";
            e.currentTarget.style.color = "#00e5ff";
            e.currentTarget.style.boxShadow = "0 0 8px rgba(0,229,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)";
            e.currentTarget.style.color = "rgba(0,229,255,0.6)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Spacer so content doesn't go under sidebar on desktop */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sidebar-nav-item-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          background: rgba(8,12,22,0.97);
          border: 1px solid rgba(0,229,255,0.2);
          z-index: 100;
        }
        .sidebar-nav-item:hover .sidebar-nav-item-tooltip {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

// ── Extracted NavButton to use hooks ────────────────────
function NavButton({
  id,
  label,
  Icon,
  active,
  color,
  activeBg,
  collapsed,
  onClick,
}: {
  id: string;
  label: string;
  Icon: React.FC<{ size?: number }>;
  active: boolean;
  color: string;
  activeBg: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className="sidebar-nav-item"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 11,
        padding: collapsed ? "10px 0" : "9px 16px",
        justifyContent: collapsed ? "center" : "flex-start",
        background:
          active
            ? activeBg
            : hovered
            ? "rgba(255,255,255,0.03)"
            : "transparent",
        color: active ? color : hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        textAlign: "left",
      }}
    >
      {/* Active left bar */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: active ? 22 : hovered ? 10 : 0,
          borderRadius: "0 2px 2px 0",
          background: color,
          boxShadow: active ? `0 0 8px ${color}` : "none",
          transition: "height 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s",
        }}
      />

      <Icon size={18} />

      {!collapsed && (
        <span
          style={{
            fontSize: 13,
            fontWeight: active ? 600 : 500,
            letterSpacing: "0.01em",
            fontFamily: "Exo 2, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}

      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="sidebar-nav-item-tooltip" style={{ color }}>
          {label}
        </span>
      )}
    </button>
  );
}
