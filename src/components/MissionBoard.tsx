import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Mission, MissionCompletion, Challenge } from "@/types";
import type { GuildMission } from "./guild/guild-types";
import "./MissionBoard.css";

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */
interface MissionBoardProps {
  studentId: string;
  teacherId: string;
  missions: Mission[];
  completions: MissionCompletion[];
  needsReturnMission: boolean;
  onCompletionRequested: () => void;
  // Challenges (optional — passed from the challenges tab)
  challenges?: Challenge[];
  isChallengeCompleted?: (id: string) => boolean;
  isChallengePending?: (id: string) => boolean;
  onChallengeRequest?: (id: string) => void;
  // Navigation
  onBack?: () => void;
  // Which tab to open by default
  initialTab?: Tab;
}

type Tab = "desafios" | "missoes" | "guilda";

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */
const DIFF_LABELS = { easy: "Fácil", normal: "Normal", hard: "Difícil" } as const;

const TAB_CONFIG: { id: Tab; label: string; icon: string }[] = [
  { id: "desafios", label: "Desafios",  icon: "⚔️" },
  { id: "missoes",  label: "Missões",   icon: "📜" },
  { id: "guilda",   label: "Guilda",    icon: "🛡️" },
];

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export function MissionBoard({
  studentId,
  teacherId,
  missions,
  completions,
  needsReturnMission,
  onCompletionRequested,
  challenges = [],
  isChallengeCompleted = () => false,
  isChallengePending   = () => false,
  onChallengeRequest   = () => {},
  onBack,
  initialTab = "desafios",
}: MissionBoardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [guildMissions, setGuildMissions] = useState<GuildMission[]>([]);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Fetch real guild missions from DB
  useEffect(() => {
    if (!teacherId) return;
    supabaseStudent
      .from("guild_missions")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!mountedRef.current) return;
        setGuildMissions((data ?? []).map(row => ({
          id:           row.id,
          title:        row.title,
          description:  row.description ?? "",
          difficulty:   row.difficulty as "easy" | "normal" | "hard",
          reward_xp:    row.reward_xp,
          reward_coins: row.reward_coins,
          required:     row.required,
          current:      0,
          progress:     0,
          deadline:     row.deadline_days ? `${row.deadline_days} dias` : "Sem prazo",
          completed:    false,
        })));
      });
  }, [teacherId]);

  // Reset to initialTab if it changes (when user switches portal tabs)
  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  const getMissionStatus = (missionId: string) =>
    completions.find((c) => c.mission_id === missionId)?.status ?? null;

  const handleRequestCompletion = async (mission: Mission) => {
    if (getMissionStatus(mission.id) === "pending") {
      toast.info("Já solicitado", { description: "Aguarde a validação do professor." });
      return;
    }
    setRequesting(mission.id);
    try {
      const { error } = await supabase.from("mission_completions").insert({
        mission_id: mission.id,
        student_id: studentId,
      });
      if (error) {
        toast.error("Erro ao solicitar", { description: error.message });
      } else {
        toast.success("Missão solicitada!", {
          description: "Aguarde a validação do professor.",
          icon: "⚔️",
        });
        onCompletionRequested();
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      if (mountedRef.current) setRequesting(null);
    }
  };

  const returnMissions  = missions.filter((m) => m.is_return_mission);
  const regularMissions = missions.filter((m) => !m.is_return_mission);

  const approvedCount = completions.filter((c) => c.status === "approved").length;
  const pendingMissions = completions.filter((c) => c.status === "pending").length;
  const pendingChallenges = challenges.filter((c) => isChallengePending(c.id)).length;
  const pendingCount  = pendingMissions + pendingChallenges;
  const guildActive   = guildMissions.filter((m) => !m.completed).length;

  return (
    <div className="mb-scroll-wrapper">
      {/* Back button — floats above the parchment */}
      {onBack && (
        <button className="mb-back-btn" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          HUB
        </button>
      )}

      <div className="mb-parchment">

        {/* Corner flourishes */}
        <div className="mb-corner mb-corner--tl">❧</div>
        <div className="mb-corner mb-corner--tr">❧</div>
        <div className="mb-corner mb-corner--bl">❧</div>
        <div className="mb-corner mb-corner--br">❧</div>

        {/* Torn top edge */}
        <div className="mb-torn-top" />

        {/* Header */}
        <div className="mb-header">
          {/* Left: stats */}
          <div style={{ minWidth: 56, textAlign: "left" }}>
            <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 11, color: "var(--ink-fade)", fontStyle: "italic", lineHeight: 1.6 }}>
              <div>✅ {approvedCount} concluídas</div>
              <div>⏳ {pendingCount} pendentes</div>
            </div>
          </div>

          {/* Center: title */}
          <div className="mb-title-block">
            <div className="mb-title-latin">Tabula Missionum</div>
            <div className="mb-title-main">Quadro de Missões</div>
            <div className="mb-title-sub">Que os bravos façam jus às suas honras</div>
          </div>

          {/* Right: wax seal */}
          <div className="mb-wax-seal">
            <div className="mb-wax-seal-circle">
              <span className="mb-wax-seal-icon">⚔️</span>
            </div>
          </div>
        </div>

        {/* Ornament */}
        <div className="mb-ornament-bar">
          <div className="mb-ornament-line" />
          <span className="mb-ornament-symbol">✦ ✦ ✦</span>
          <div className="mb-ornament-line" />
        </div>

        {/* Tabs */}
        <div className="mb-tabs">
          {TAB_CONFIG.map((tab) => {
            const badge =
              tab.id === "guilda"   ? guildActive         :
              tab.id === "missoes"  ? regularMissions.length :
              challenges.length;
            return (
              <button
                key={tab.id}
                className={`mb-tab${activeTab === tab.id ? " mb-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mb-tab-dot" />
                {tab.icon} {tab.label}
                {badge > 0 && (
                  <span style={{
                    marginLeft: 5,
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    opacity: 0.7,
                    border: "1px solid currentColor",
                    borderRadius: 2,
                    padding: "0 4px",
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-divider mb-divider--heavy mb-divider--deco" />

        {/* Content */}
        <div className="mb-content">

          {/* ── TAB: DESAFIOS ────────────────────────────────── */}
          {activeTab === "desafios" && (
            <>
              <div className="mb-section-header">
                <span className="mb-section-icon">⚔️</span>
                <span className="mb-section-title">Desafios da Semana</span>
                <span className="mb-section-count">{challenges.length} desafios</span>
              </div>

              {challenges.length === 0 ? (
                <div className="mb-empty">
                  <div className="mb-empty-icon">⚔️</div>
                  <div className="mb-empty-text">
                    Nenhum desafio proclamado pelo mestre esta semana.
                  </div>
                </div>
              ) : (
                <div className="mb-mission-list">
                  {challenges.map((c) => (
                    <ChallengeRow
                      key={c.id}
                      challenge={c}
                      isCompleted={isChallengeCompleted(c.id)}
                      isPending={isChallengePending(c.id)}
                      onRequest={() => onChallengeRequest(c.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB: MISSÕES ─────────────────────────────────── */}
          {activeTab === "missoes" && (
            <>
              {/* Return mission notice */}
              {needsReturnMission && returnMissions.length > 0 && (
                <div className="mb-return-notice">
                  <span className="mb-return-notice-icon">🔄</span>
                  <div>
                    <div className="mb-return-notice-text" style={{ fontStyle: "normal", fontWeight: "bold", marginBottom: 4 }}>
                      Missão de Retorno
                    </div>
                    <div className="mb-return-notice-text">
                      Bem-vindo de volta, aventureiro. Complete uma missão de retorno para se reintegrar à turma.
                    </div>
                  </div>
                </div>
              )}

              {needsReturnMission && returnMissions.length > 0 && (
                <>
                  <div className="mb-section-header">
                    <span className="mb-section-icon">🔄</span>
                    <span className="mb-section-title">Missões de Retorno</span>
                    <span className="mb-section-count">{returnMissions.length} disponíveis</span>
                  </div>
                  <div className="mb-mission-list">
                    {returnMissions.map((m) => (
                      <MissionRow
                        key={m.id}
                        mission={m}
                        status={getMissionStatus(m.id)}
                        isRequesting={requesting === m.id}
                        onRequest={() => handleRequestCompletion(m)}
                      />
                    ))}
                  </div>
                  <div className="mb-divider" style={{ margin: "12px 0" }} />
                </>
              )}

              <div className="mb-section-header">
                <span className="mb-section-icon">📜</span>
                <span className="mb-section-title">Missões do Bom Aluno</span>
                <span className="mb-section-count">{regularMissions.length} missões</span>
              </div>

              {regularMissions.length === 0 ? (
                <div className="mb-empty">
                  <div className="mb-empty-icon">📜</div>
                  <div className="mb-empty-text">Nenhuma missão proclamada pelo mestre</div>
                </div>
              ) : (
                <div className="mb-mission-list">
                  {regularMissions.map((m) => (
                    <MissionRow
                      key={m.id}
                      mission={m}
                      status={getMissionStatus(m.id)}
                      isRequesting={requesting === m.id}
                      onRequest={() => handleRequestCompletion(m)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TAB: GUILDA ──────────────────────────────────── */}
          {activeTab === "guilda" && (
            <>
              <div className="mb-section-header">
                <span className="mb-section-icon">🛡️</span>
                <span className="mb-section-title">Missões da Guilda</span>
                <span className="mb-section-count">Cooperativas</span>
              </div>

              {guildMissions.filter((m) => !m.completed).length === 0 ? (
                <div className="mb-empty">
                  <div className="mb-empty-icon">🛡️</div>
                  <div className="mb-empty-text">Nenhuma missão de guilda ativa no momento.</div>
                </div>
              ) : (
                <div className="mb-mission-list">
                  {guildMissions.filter((m) => !m.completed).map((m) => (
                    <GuildMissionRow key={m.id} mission={m} />
                  ))}
                </div>
              )}

              {guildMissions.filter((m) => m.completed).length > 0 && (
                <>
                  <div className="mb-divider" style={{ margin: "14px 0" }} />
                  <div className="mb-section-header">
                    <span className="mb-section-icon">🏆</span>
                    <span className="mb-section-title">Glórias Conquistadas</span>
                  </div>
                  <div className="mb-mission-list">
                    {guildMissions.filter((m) => m.completed).map((m) => (
                      <GuildMissionRow key={m.id} mission={m} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* Hover hint */}
        <div className="mb-hover-hint">
          ✦ Passe o cursor sobre uma missão para marcá-la ✦
        </div>

        {/* Footer ornament */}
        <div className="mb-ornament-bar">
          <div className="mb-ornament-line" />
          <span className="mb-ornament-symbol">— ✦ —</span>
          <div className="mb-ornament-line" />
        </div>

        {/* Footer quote */}
        <div className="mb-footer-quote">
          "A glória não vem àqueles que esperam, mas àqueles que agem."
        </div>

        {/* Torn bottom edge */}
        <div className="mb-torn-bottom" />

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ChallengeRow — weekly challenge card
   ═══════════════════════════════════════════════════════════════ */
interface ChallengeRowProps {
  challenge: Challenge;
  isCompleted: boolean;
  isPending: boolean;
  onRequest: () => void;
}

function ChallengeRow({ challenge, isCompleted, isPending, onRequest }: ChallengeRowProps) {
  const isUnica = challenge.challenge_type === "unica";
  const canRequest = !isCompleted && !isPending;

  return (
    <div
      className={`mb-mission-row${isCompleted ? " mb-mission-row--struck" : " mb-mission-row--can-strike"}`}
    >
      <div className="mb-strike-line" />

      {/* Checkbox */}
      <div className={`mb-checkbox${
        isCompleted ? " mb-checkbox--approved" :
        isPending   ? " mb-checkbox--pending"  : ""
      }`}>
        {isCompleted ? "✓" : isPending ? "…" : ""}
      </div>

      {/* Body */}
      <div className="mb-mission-body">
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="mb-mission-title">
            <span style={{ color: "var(--ink-red)", marginRight: 4, fontSize: 12 }}>⚔</span>
            {challenge.title}
          </span>
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 2,
            textTransform: "uppercase" as const,
            color: isUnica ? "#7a5a10" : "#1a5a7a",
            background: isUnica ? "rgba(201,130,12,0.12)" : "rgba(12,130,201,0.12)",
            border: `1px solid ${isUnica ? "rgba(201,130,12,0.3)" : "rgba(12,130,201,0.3)"}`,
          }}>
            {isUnica ? "Única" : "Repetível"}
          </span>
        </div>
        {challenge.description && (
          <div className="mb-mission-desc">{challenge.description}</div>
        )}
      </div>

      {/* Meta */}
      <div className="mb-mission-meta">
        <div className="mb-reward">+{challenge.reward} 🪙</div>
        {isCompleted && <span className="mb-status-badge mb-status-badge--approved">Concluído</span>}
        {isPending   && <span className="mb-status-badge mb-status-badge--pending">Aguardando</span>}
        {canRequest  && (
          <button className="mb-btn-request" onClick={onRequest}>
            Realizar
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MissionRow — individual student mission
   ═══════════════════════════════════════════════════════════════ */
interface MissionRowProps {
  mission: Mission;
  status: "pending" | "approved" | "rejected" | null;
  isRequesting: boolean;
  onRequest: () => void;
}

function MissionRow({ mission, status, isRequesting, onRequest }: MissionRowProps) {
  const canRequest = status !== "pending" && status !== "approved";
  const isApproved = status === "approved";
  const isPending  = status === "pending";

  return (
    <div
      className={`mb-mission-row${isApproved ? " mb-mission-row--struck" : " mb-mission-row--can-strike"}`}
    >
      <div className="mb-strike-line" />

      <div className={`mb-checkbox${
        isApproved ? " mb-checkbox--approved" :
        isPending  ? " mb-checkbox--pending"  :
        status === "rejected" ? " mb-checkbox--rejected" : ""
      }`}>
        {isApproved ? "✓" : isPending ? "…" : status === "rejected" ? "✗" : ""}
      </div>

      <div className="mb-mission-body">
        <div className="mb-mission-title">{mission.title}</div>
        {mission.description && (
          <div className="mb-mission-desc">{mission.description}</div>
        )}
      </div>

      <div className="mb-mission-meta">
        <div className="mb-reward">+{mission.reward} 🪙</div>
        {isPending  && <span className="mb-status-badge mb-status-badge--pending">Aguardando</span>}
        {isApproved && <span className="mb-status-badge mb-status-badge--approved">Concluída</span>}
        {status === "rejected" && (
          <span className="mb-status-badge mb-status-badge--rejected">Não validada</span>
        )}
        {canRequest && (
          <button
            className="mb-btn-request"
            onClick={onRequest}
            disabled={isRequesting}
          >
            {isRequesting ? "..." : "Realizar"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GuildMissionRow — cooperative guild mission
   ═══════════════════════════════════════════════════════════════ */
function GuildMissionRow({ mission }: { mission: GuildMission }) {
  const prog = Math.min(mission.progress, 100);
  const fillClass = mission.completed
    ? "mb-guild-progress-fill mb-guild-progress-fill--complete"
    : `mb-guild-progress-fill mb-guild-progress-fill--${mission.difficulty}`;

  return (
    <div
      className={`mb-mission-row${mission.completed ? " mb-mission-row--struck" : " mb-mission-row--can-strike"}`}
    >
      <div className="mb-strike-line" />

      <div className={`mb-checkbox${mission.completed ? " mb-checkbox--approved" : ""}`}>
        {mission.completed ? "✓" : ""}
      </div>

      <div className="mb-mission-body">
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="mb-mission-title">{mission.title}</span>
          <span className={`mb-diff mb-diff--${mission.difficulty}`}>
            {DIFF_LABELS[mission.difficulty]}
          </span>
        </div>
        <div className="mb-mission-desc">{mission.description}</div>
        {!mission.completed && (
          <>
            <div className="mb-guild-progress">
              <div className={fillClass} style={{ width: `${prog}%` }} />
            </div>
            <div className="mb-guild-participants">
              {mission.current}/{mission.required} participantes · {prog}%
            </div>
          </>
        )}
      </div>

      <div className="mb-mission-meta">
        <div className="mb-reward">+{mission.reward_xp} ✨</div>
        <div className="mb-reward" style={{ fontSize: 11 }}>+{mission.reward_coins} 🪙</div>
        {mission.completed ? (
          <span className="mb-status-badge mb-status-badge--approved">Concluída</span>
        ) : (
          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: 10, color: "var(--ink-fade)", fontStyle: "italic" }}>
            ⏳ {mission.deadline}
          </span>
        )}
      </div>
    </div>
  );
}
