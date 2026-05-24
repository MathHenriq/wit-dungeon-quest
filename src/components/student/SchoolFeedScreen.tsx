// Patch 8.1 — Mural de Feitos da Escola.
//
// Auto-feed of notable in-school achievements. Read-only by design — no
// comments, no replies, only a silent eye-counter so kids can ack without
// any conversational surface that could enable bullying.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Eye, Users, Shield, Globe2, Crown, Skull, Mountain, Sparkles } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { useOpenProfileCard } from "@/components/student/ProfileCard";

type FilterKey = "class" | "guild" | "school";
type EventType = "chest_open_rare" | "first_obtained" | "raid_defeated" | "floor_milestone";

interface FeedRow {
  id: string;
  event_type: EventType;
  event_data: Record<string, unknown>;
  views_count: number;
  created_at: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  guild_id: string | null;
  guild_name: string | null;
  viewed_by_me: boolean;
}

const FILTERS: { key: FilterKey; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { key: "class",  label: "Minha turma",  Icon: Users },
  { key: "guild",  label: "Minha guilda", Icon: Shield },
  { key: "school", label: "Escola",       Icon: Globe2 },
];

const RARITY_TONE: Record<string, string> = {
  common: "#c8d0d8", uncommon: "#4ade80", rare: "#60c8f8",
  epic:   "#b57bee", legendary: "#f5c84b",
  mythic: "#f05050", unknown:   "#94a3b8",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "agora há pouco";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

function buildMessage(row: FeedRow): { title: string; body: string; tone: string; Icon: React.FC<{ size?: number }> } {
  const d = row.event_data;
  switch (row.event_type) {
    case "chest_open_rare": {
      const itemName  = String(d.item_name ?? "uma carta rara");
      const rarity    = String(d.rarity ?? "mythic");
      const source    = d.source_anime ? ` [${String(d.source_anime)}]` : "";
      const tone      = RARITY_TONE[rarity] ?? "#f05050";
      const r = rarity === "unknown" ? "???" : rarity.charAt(0).toUpperCase() + rarity.slice(1);
      return {
        title: `${row.student_name} invocou ${itemName}!`,
        body: `Carta ${r}${source}`,
        tone, Icon: Sparkles,
      };
    }
    case "first_obtained": {
      const itemName  = String(d.item_name ?? "uma carta");
      const rarity    = String(d.rarity ?? "legendary");
      const source    = d.source_anime ? ` [${String(d.source_anime)}]` : "";
      const tone      = RARITY_TONE[rarity] ?? "#f5c84b";
      return {
        title: `Primeira aparição: ${row.student_name} obteve ${itemName}!`,
        body: `Ninguém na escola tinha essa carta antes${source}.`,
        tone, Icon: Crown,
      };
    }
    case "raid_defeated": {
      const boss   = String(d.boss_name ?? "Boss");
      const guild  = String(d.guild_name ?? row.guild_name ?? "uma guilda");
      return {
        title: `${guild} derrotou ${boss}!`,
        body: `Top contribuidor: ${row.student_name}.`,
        tone: "#f05050", Icon: Skull,
      };
    }
    case "floor_milestone": {
      const f = Number(d.floor ?? 0);
      return {
        title: `${row.student_name} alcançou o andar ${f}!`,
        body: `Marco da escola — ninguém havia conquistado antes.`,
        tone: "#22d3ee", Icon: Mountain,
      };
    }
  }
}

export function SchoolFeedScreen() {
  const [filter, setFilter] = useState<FilterKey>("class");
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const openProfile = useOpenProfileCard();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseStudent.rpc("get_school_feed", {
      p_filter: filter, p_limit: 50, p_offset: 0,
    });
    if (error) { console.warn("[SchoolFeedScreen]", error); setRows([]); }
    else setRows((data ?? []) as FeedRow[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  // Realtime: new events on the same channel.
  useEffect(() => {
    const channel = supabaseStudent
      .channel("school-feed")
      .on('postgres_changes' as never, {
        event: 'INSERT', schema: 'public', table: 'school_feed_events',
      }, () => { void load(); })
      .on('postgres_changes' as never, {
        event: 'UPDATE', schema: 'public', table: 'school_feed_events',
      }, () => { void load(); })
      .subscribe();
    return () => { void supabaseStudent.removeChannel(channel); };
  }, [load]);

  async function markViewed(row: FeedRow) {
    if (row.viewed_by_me) return;
    // Optimistic: bump locally for snappy feedback.
    setRows(prev => prev.map(r => r.id === row.id
      ? { ...r, views_count: r.views_count + 1, viewed_by_me: true }
      : r));
    await supabaseStudent.rpc("view_feed_event", { p_event_id: row.id });
    // Patch 8.4: count toward the "feed_views" daily quest.
    void supabaseStudent.rpc("increment_daily_counter", { p_type: "feed_views", p_amount: 1 });
  }

  const counts = useMemo(() => rows.length, [rows]);

  return (
    <div className="sfs-root">
      <style>{CSS}</style>
      <header className="sfs-header">
        <div className="sfs-title">
          <Sparkles size={20} style={{ color: "#f5c84b" }} />
          <h1>Mural de Feitos</h1>
        </div>
        <p className="sfs-sub">
          Conquistas notáveis da escola. Sem comentários — só um piscar de olho silencioso.
        </p>
        <div className="sfs-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`sfs-filter ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              <f.Icon size={13} /> {f.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="sfs-loading"><Loader2 size={24} className="animate-spin" /></div>
      ) : counts === 0 ? (
        <div className="sfs-empty">
          Nenhum feito recente neste filtro. Quando alguém invocar uma carta lendária ou derrotar um boss, aparece aqui.
        </div>
      ) : (
        <ul className="sfs-list">
          {rows.map(row => {
            const meta = buildMessage(row);
            return (
              <li
                key={row.id}
                className="sfs-item"
                style={{ ['--tone' as string]: meta.tone, cursor: "pointer" } as React.CSSProperties}
                onClick={() => openProfile(row.student_id)}
              >
                <div className="sfs-item-icon">
                  <meta.Icon size={20} />
                </div>
                <div className="sfs-item-body">
                  <div className="sfs-item-title">{meta.title}</div>
                  <div className="sfs-item-sub">{meta.body}</div>
                  <div className="sfs-item-meta">
                    <span>{timeAgo(row.created_at)}</span>
                    {row.guild_name && filter !== "guild" && <span>· {row.guild_name}</span>}
                  </div>
                </div>
                <button
                  className={`sfs-eye ${row.viewed_by_me ? "viewed" : ""}`}
                  onClick={(e) => { e.stopPropagation(); void markViewed(row); }}
                  title={row.viewed_by_me ? "Você já viu" : "Marcar como visto"}
                  disabled={row.viewed_by_me}
                >
                  <Eye size={14} />
                  <span>{row.views_count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const CSS = `
.sfs-root {
  max-width: 760px; margin: 0 auto;
  padding: 16px 12px 80px;
  font-family: 'Exo 2', sans-serif; color: #e6f0ff;
}
.sfs-header { margin-bottom: 16px; }
.sfs-title { display: flex; align-items: center; gap: 10px; }
.sfs-title h1 {
  margin: 0; font-family: 'Cinzel', serif;
  font-size: 22px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  background: linear-gradient(90deg, #f5c84b, #fbeaa0, #f5c84b);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.sfs-sub { margin: 6px 0 14px; font-size: 12.5px; color: rgba(255,255,255,0.55); }

.sfs-filters {
  display: inline-flex; gap: 4px; padding: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
}
.sfs-filter {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 7px; cursor: pointer; border: none;
  background: transparent; color: rgba(255,255,255,0.45);
  font-family: inherit; font-size: 12px; font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}
.sfs-filter:hover { color: rgba(255,255,255,0.8); }
.sfs-filter.active {
  background: rgba(245,200,75,0.18);
  color: #f5c84b;
  box-shadow: inset 0 0 0 1px rgba(245,200,75,0.4);
}

.sfs-loading { display: flex; justify-content: center; padding: 48px; color: #f5c84b; }
.sfs-empty {
  padding: 48px 24px; text-align: center;
  font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.55;
}

.sfs-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
@keyframes sfs-border-glow {
  0%, 100% { box-shadow: 0 0 0 1px var(--tone), 0 0 14px color-mix(in srgb, var(--tone) 22%, transparent); }
  50%      { box-shadow: 0 0 0 1px var(--tone), 0 0 24px color-mix(in srgb, var(--tone) 45%, transparent); }
}
.sfs-item {
  --tone: #888;
  position: relative;
  display: grid; grid-template-columns: 44px 1fr auto;
  align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  background: rgba(10,14,26,0.6);
  backdrop-filter: blur(10px);
  border: 1px solid color-mix(in srgb, var(--tone) 45%, rgba(255,255,255,0.08));
  animation: sfs-border-glow 3s ease-in-out infinite;
}
.sfs-item-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--tone) 16%, transparent);
  color: var(--tone);
  flex-shrink: 0;
}
.sfs-item-body { min-width: 0; }
.sfs-item-title {
  font-size: 13.5px; font-weight: 700; color: #fff;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  line-height: 1.3;
}
.sfs-item-sub {
  margin-top: 2px;
  font-size: 11.5px; color: color-mix(in srgb, var(--tone) 80%, #fff);
  line-height: 1.35;
}
.sfs-item-meta {
  margin-top: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; color: rgba(255,255,255,0.4);
  letter-spacing: 0.05em;
  display: flex; gap: 4px;
}

.sfs-eye {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px; cursor: pointer;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.55);
  font-family: 'Share Tech Mono', monospace; font-size: 11px; font-weight: 700;
  transition: all 0.15s ease;
}
.sfs-eye:hover:not(:disabled) {
  background: color-mix(in srgb, var(--tone) 18%, transparent);
  border-color: var(--tone);
  color: var(--tone);
}
.sfs-eye.viewed {
  background: color-mix(in srgb, var(--tone) 20%, transparent);
  border-color: var(--tone);
  color: var(--tone);
  cursor: default;
}
.sfs-eye:disabled { cursor: default; }
`;
