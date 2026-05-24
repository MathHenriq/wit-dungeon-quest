import { useState } from "react";
import { Search, Bell, ChevronRight, Home, X } from "lucide-react";
import type { StudentTab } from "@/components/student/StudentNavigation";
import { DailyCoinBar } from "@/components/student/DailyCoinBar";
import { ActiveEventBanner } from "@/components/student/ActiveEventBanner";

const TAB_LABELS: Record<StudentTab, string> = {
  challenges: "Quests",
  missions:   "Missões",
  bosses:     "Bosses",
  guild:      "Guilda",
  skills:     "Skills",
  shop:       "Loja",
  inventory:  "Mochila",
  ranking:    "Ranking",
  character:  "Herói",
  dungeon:    "Dungeon",
  capsule:    "Cápsula",
  pvp:        "PvP Arena",
  trading:    "Trading",
};

interface StudentHeaderProps {
  activeTab: StudentTab;
}

export function StudentHeader({ activeTab }: StudentHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const tabLabel = TAB_LABELS[activeTab] ?? activeTab;

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(8, 12, 22, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          minHeight: 52,
        }}
      >
        {/* ── Breadcrumb ─────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Home
            size={13}
            style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
          />
          <ChevronRight
            size={12}
            style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tabLabel}
          </span>
        </div>

        {/* ── Search ─────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {searchOpen ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(0,229,255,0.25)",
                width: 200,
              }}
            >
              <Search size={13} style={{ color: "rgba(0,229,255,0.6)", flexShrink: 0 }} />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "Exo 2, sans-serif",
                }}
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchValue(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              title="Buscar"
              style={{
                padding: "6px 8px",
                borderRadius: 7,
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Search size={15} />
              <span
                className="hidden sm:inline"
                style={{ fontSize: 12, fontFamily: "Exo 2, sans-serif" }}
              >
                Buscar
              </span>
              <kbd
                className="hidden sm:inline"
                style={{
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "Exo 2, sans-serif",
                }}
              >
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* ── Active event banner (Patch 5.1) ─────────────── */}
        <div className="hidden md:block">
          <ActiveEventBanner />
        </div>

        {/* ── Daily coin cap bar (Patch 2.3) ─────────────── */}
        <div className="hidden md:block">
          <DailyCoinBar compact />
        </div>

        {/* ── Notifications ─────────────── */}
        <button
          title="Notificações"
          style={{
            position: "relative",
            padding: 7,
            borderRadius: 7,
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.3)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Bell size={16} />
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#00e5ff",
              boxShadow: "0 0 6px rgba(0,229,255,0.7)",
              border: "1.5px solid rgba(8,12,22,1)",
            }}
          />
        </button>

        {/* ── Divider ─────────────── */}
        <div
          style={{
            width: 1,
            height: 20,
            background: "rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        />

        {/* ── Tab indicator pill ─────────────── */}
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(0,229,255,0.06)",
            border: "1px solid rgba(0,229,255,0.15)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: "rgba(0,229,255,0.7)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {tabLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
