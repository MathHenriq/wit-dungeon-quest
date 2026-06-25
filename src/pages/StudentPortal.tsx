import { lazy, Suspense, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
// UI transformation: new sidebar layout
import { Link } from "react-router-dom";
import { useStudentDB } from "@/hooks/useStudentDB";
import { RewardDisplay } from "@/components/RewardDisplay";
import { LevelBadge } from "@/components/LevelBadge";
import { CharacterCustomization } from "@/components/CharacterCustomization";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { MissionBoard } from "@/components/MissionBoard";
import { ClassRanking } from "@/components/ClassRanking";
import { WeeklyRankingsScreen } from "@/components/student/WeeklyRankingsScreen";
import { SchoolFeedScreen } from "@/components/student/SchoolFeedScreen";
import { CreationTicketsPanel } from "@/components/student/CreationTicketsPanel";
import { ProfileCardOpenerProvider } from "@/components/student/ProfileCard";
import { StudentTitleBadge, AttendanceCrown } from "@/components/StudentTitleBadge";
import { AincradBackground } from "@/components/ui/AincradBackground";
import { DungeonLoadingScreen } from "@/components/student/DungeonLoadingScreen";
import { DungeonEntrance } from "@/components/student/DungeonEntrance";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentNavigation, type StudentTab } from "@/components/student/StudentNavigation";
import { DirectorMap } from "@/components/student/DirectorMap";
import { OnboardingFlow } from "@/components/student/OnboardingFlow";
// Onda 11.4 — segundo gate (após o legacy character_name): exige class_type da Season 2.
// Aliasado para não colidir com a função local ClassSelectionScreen (subcomponente do onboarding legacy).
import { ClassSelectionScreen as Wave11ClassSelectionScreen } from "@/pages/ClassSelectionScreen";
import { useClassProfile } from "@/hooks/useClassProfile";
// Onda 11.8 — terceiro gate: tutorial de combate.
import { Wave11TutorialBattleScreen } from "@/pages/Wave11TutorialBattleScreen";
import { VaultOpeningModal } from "@/components/student/VaultOpeningModal";
// Lazy: HeroScreen (~600 lines + Inventory/Tickets/Backdrop/Title panels) and
// ShopScreen (~1500 lines + ForgePanel/CraftPanel/ChestSection) are only
// reached after the student picks those tabs. Splitting them keeps the
// initial StudentPortal chunk lean.
const HeroScreen = lazy(() =>
  import("@/components/student/HeroScreen").then(m => ({ default: m.HeroScreen }))
);
const ShopScreen = lazy(() =>
  import("@/components/student/ShopScreen").then(m => ({ default: m.ShopScreen }))
);
import { ProgressRanking } from "@/components/student/ProgressRanking";
import { BossBattleTab, BattleScreen } from "@/components/student/BossBattle";
import { Guild } from "@/components/guild/Guild";
import { SkillTreeView } from "@/components/student/SkillTreeView";
import { DailyDungeon } from "@/components/student/DailyDungeon";
import { BattleDungeonView } from "@/components/student/BattleDungeonView";
import { BattleSkillsView } from "@/components/student/BattleSkillsView";
import { SkillTreePage } from "@/components/student/SkillTreePage";
import { useBattleCharacter } from "@/hooks/useBattleCharacter";
import { TimeCapsule } from "@/components/student/TimeCapsule";
import { PvpArena } from "@/components/pvp-arena/PvpArena";
import { PvpChallengeProvider } from "@/contexts/PvpChallengeContext";
import { TradingPanel } from "@/components/student/TradingPanel";
import { TradingScreen } from "@/components/student/TradingScreen";
import { ClassWarBanner } from "@/components/student/ClassWarBanner";
import { AccessibilitySettings } from "@/components/student/AccessibilitySettings";
import { GameIcon } from "@/components/icons/GameIcon";
import { describeLoginError, describeSignUpError, validateEmail, validatePassword } from "@/lib/authErrors";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import {
  Sword,
  Shield,
  LogOut,
  CheckCircle,
  Clock,
  CalendarCheck,
  Loader2,
  Mail,
  Lock,
  Flame,
  Eye,
  EyeOff,
} from "lucide-react";
import type { InventoryItem } from "@/types";
import { toast } from "sonner";


// ─────────────────────────────────────────────
// Sub-screens shown before an active session
// ─────────────────────────────────────────────

function LoginScreen({
  onEmailLogin,
  onEmailSignUp,
}: {
  onEmailLogin: (email: string, password: string) => Promise<{ error: unknown }>;
  onEmailSignUp: (email: string, password: string) => Promise<{ error: unknown }>;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset confirm-password state when switching tabs.
  useEffect(() => {
    setConfirmPassword("");
    setConfirmTouched(false);
    setShowConfirmPwd(false);
  }, [isLogin]);

  const passwordsMismatch = !isLogin && confirmTouched && confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) { toast.error(emailError); return; }
    const passwordError = validatePassword(password);
    if (passwordError) { toast.error(passwordError); return; }

    if (!isLogin) {
      if (!confirmPassword) { toast.error("Confirme a senha."); return; }
      if (confirmPassword !== password) { toast.error("As senhas não coincidem."); return; }
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await onEmailLogin(email, password);
        if (error) {
          // Drill down on invalid_credentials: ask the DB whether the email even
          // exists, so we can show "Email não cadastrado" vs "Senha incorreta".
          const e = error as { code?: string };
          if (e?.code === "invalid_credentials") {
            try {
              const { data: exists } = await supabaseStudent.rpc("auth_email_exists", { p_email: email.trim() });
              if (exists === false) {
                toast.error("Email não cadastrado.");
                return;
              }
              if (exists === true) {
                toast.error("Senha incorreta.");
                return;
              }
            } catch { /* fall through to generic */ }
          }
          toast.error(describeLoginError(error as Parameters<typeof describeLoginError>[0]));
        }
      } else {
        const { error } = await onEmailSignUp(email, password);
        if (error) {
          toast.error(describeSignUpError(error as Parameters<typeof describeSignUpError>[0]));
        } else {
          toast.success("Conta criada! Agora escolha sua turma.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* MP4 background video. CSS aurora fica como fallback (até carregar / sem suporte). */}
      <div className="login-video-background" aria-hidden="true" />
      <video
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'blur(14px) brightness(0.55)' }}
        src="/videos/login-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 bg-black/40" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-cyan-400">
              <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="none" stroke="currentColor" strokeWidth="2" className="animate-glow-breathe"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-cyan-400 text-glow-cyan" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '6px' }}>
            WIT DUNGEON
          </h1>
          <p className="text-white/40 text-sm mt-2" style={{ fontFamily: 'Exo 2, sans-serif' }}>
            Entre na masmorra do conhecimento
          </p>
        </div>

        {/* Panel */}
        <div className="holo-panel-accent p-6 space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsLogin(true)}
              className="flex-1 py-2 rounded-lg font-semibold transition-all text-sm"
              style={{ background: isLogin ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)', color: isLogin ? '#00e5ff' : 'rgba(255,255,255,0.4)', border: `1px solid ${isLogin ? 'rgba(0,229,255,0.3)' : 'transparent'}` }}>
              Entrar
            </button>
            <button type="button" onClick={() => setIsLogin(false)}
              className="flex-1 py-2 rounded-lg font-semibold transition-all text-sm"
              style={{ background: !isLogin ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)', color: !isLogin ? '#00e5ff' : 'rgba(255,255,255,0.4)', border: `1px solid ${!isLogin ? 'rgba(0,229,255,0.3)' : 'transparent'}` }}>
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" required
                className="w-full px-4 py-3 pl-10 rounded-lg text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Senha" required minLength={6}
                className="w-full px-4 py-3 pl-10 pr-10 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {!isLogin && (
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    placeholder="Confirmar senha"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-lg text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${passwordsMismatch ? 'rgba(220,80,80,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      color: 'rgba(255,255,255,0.85)',
                      outline: 'none',
                    }}
                    onFocus={e => { if (!passwordsMismatch) e.target.style.borderColor = 'rgba(0,229,255,0.4)'; }}
                  />
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(s => !s)}
                    aria-label={showConfirmPwd ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p
                    className="text-xs mt-1.5 ml-1"
                    style={{ color: 'rgb(255,160,160)', fontFamily: 'Exo 2, sans-serif', letterSpacing: '0.3px' }}
                  >
                    As senhas não coincidem.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || passwordsMismatch || (!isLogin && confirmPassword.length === 0)}
              className="btn-cyber w-full justify-center"
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4 space-y-2">
          <p className="text-white/25 text-xs flex items-center justify-center gap-3">
            <Link to="/professor/login" className="hover:text-cyan-400 transition-colors">
              Acesso do Professor
            </Link>
            <span className="opacity-40">·</span>
            <Link to="/pais/login" className="hover:text-cyan-400 transition-colors">
              Portal dos Pais
            </Link>
          </p>
          <DeveloperSignature className="text-center" />
        </div>
      </div>
    </div>
  );
}

function ClassSelectionScreen({
  teachers,
  classes,
  onTeacherChange,
  onRegister,
  onBack,
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string; teacher_id?: string }[];
  onTeacherChange: (teacherId: string) => void;
  onRegister: (name: string, teacherId: string, classId: string) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClasses = classes.filter(c => c.teacher_id === teacherId);

  const handleTeacherSelect = (id: string) => {
    setTeacherId(id);
    setClassId("");
    if (id) onTeacherChange(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teacherId || !classId) return;
    setIsSubmitting(true);
    await onRegister(name.trim(), teacherId, classId);
    setIsSubmitting(false);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)',
    outline: 'none',
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AincradBackground scene="default" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '4px' }}>BEM-VINDO</h1>
          <p className="text-white/40 text-sm">
            Primeira vez aqui? Diga-nos em qual turma você está.
          </p>
        </div>

        <div className="holo-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 text-white/60 uppercase tracking-wider">Seu Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como aparece na lista de chamada"
                required
                className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-white/60 uppercase tracking-wider">Professor</label>
              <select
                value={teacherId}
                onChange={e => handleTeacherSelect(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                style={inputStyle}
              >
                <option value="">Selecione seu professor</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {teacherId && (
              <div>
                <label className="block text-xs font-semibold mb-2 text-white/60 uppercase tracking-wider">Turma</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                  style={inputStyle}
                >
                  <option value="">Selecione sua turma</option>
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {filteredClasses.length === 0 && (
                  <p className="text-sm text-white/30 mt-1">
                    Nenhuma turma disponível para este professor.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !teacherId || !classId}
              className="btn-cyber w-full justify-center py-3"
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Enviando...</>
              ) : (
                <><Sword size={20} /> Solicitar Acesso</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/25 mt-4">
          Sua solicitação será analisada pelo professor antes de liberar o acesso.
        </p>

        <div className="text-center mt-3">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}
          >
            ← Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingScreen({
  studentName,
  isRejected,
  onLogout,
}: {
  studentName: string;
  isRejected: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AincradBackground scene="default" />
      <div className="relative z-10 holo-panel max-w-sm w-full text-center p-8">
        <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-4 animate-spin-slow">
          <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="none" stroke="hsl(187 100% 50%)" strokeWidth="1.5"/>
        </svg>

        {isRejected ? (
          <>
            <h2 className="text-xl font-bold text-red-400 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>
              NAO APROVADO
            </h2>
            <p className="text-white/50 text-sm mb-2">
              Olá, <strong className="text-white/70">{studentName}</strong>. Sua solicitação de acesso não foi aprovada.
            </p>
            <p className="text-white/30 text-xs">Fale com seu professor para mais informações.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>
              AGUARDANDO APROVACAO
            </h2>
            <p className="text-white/50 text-sm mb-2">
              Olá, <strong className="text-white/70">{studentName}</strong>! Sua solicitação foi enviada.
            </p>
            <p className="text-white/30 text-xs">Aguarde o professor liberar seu acesso.</p>
          </>
        )}

        <button onClick={onLogout} className="btn-cyber mt-6 mx-auto">
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Suspended screen — blocks dashboard while suspended_until > now()
// ─────────────────────────────────────────────
function SuspendedScreen({
  studentName, suspendedUntil, reason, onLogout,
}: {
  studentName: string;
  suspendedUntil: string;
  reason: string | null;
  onLogout: () => void;
}) {
  const until = new Date(suspendedUntil);
  const untilLabel = until.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const remainingMs = until.getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AincradBackground scene="default" />
      <div className="relative z-10 holo-panel max-w-sm w-full text-center p-8" style={{ borderColor: "rgba(220,80,80,0.3)" }}>
        <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-4">
          <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" fill="none" stroke="rgb(255,160,160)" strokeWidth="1.5"/>
          <line x1="35" y1="35" x2="65" y2="65" stroke="rgb(255,160,160)" strokeWidth="2" />
          <line x1="65" y1="35" x2="35" y2="65" stroke="rgb(255,160,160)" strokeWidth="2" />
        </svg>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "2px", color: "rgb(255,180,180)" }}>
          ACESSO SUSPENSO
        </h2>
        <p className="text-white/60 text-sm mb-2">
          Olá, <strong className="text-white/80">{studentName}</strong>. Seu acesso foi suspenso pelo professor.
        </p>
        <p className="text-white/70 text-sm mb-2">
          Liberação em <strong>{remainingDays}</strong> dia(s) — <span className="text-white/50">{untilLabel}</span>.
        </p>
        {reason && (
          <p className="text-white/50 text-xs italic mt-3 mb-1">"{reason}"</p>
        )}
        <button onClick={onLogout} className="btn-cyber mt-6 mx-auto">
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function StudentPortal() {
  const {
    authState,
    authUser,
    student,
    teachers,
    classes,
    challenges,
    missions,
    missionCompletions,
    studentTitles,
    isLoading,
    error,
    clearError,
    loginWithEmail,
    signUpWithEmail,
    registerStudent,
    requestChallenge,
    requestAttendance,
    hasChallengeRequest,
    hasAttendanceRequest,
    isChallengeCompleted,
    isChallengePending,
    logout,
    refreshStudent,
    refreshInventory,
    refreshMissions,
    ensureMissionsLoaded,
    ensureShopLoaded,
    loadClassesByTeacher,
    getRewardIcon,
    shopItems,
    inventory,
    purchaseItem,
  } = useStudentDB();

  const { data: battleCharacter, isLoading: isLoadingCharacter } = useBattleCharacter(authUser?.id);

  // Onda 11.4 — usado pelo gate de classe pós-login (abaixo do gate legacy).
  const { data: classProfile, isLoading: isLoadingClassProfile, refetch: refetchClassProfile } = useClassProfile(student?.id ?? null);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StudentTab>("director");

  const handleTabChange = (tab: StudentTab) => {
    setActiveTab(tab);
  };
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEntrance, setShowEntrance] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [activeBossId, setActiveBossId] = useState<string | null>(null);
  const [battleKey, setBattleKey] = useState(0);
  const [bossTabKey, setBossTabKey] = useState(0);

  useEffect(() => {
    if (!isLoading) { setLoadingTimedOut(false); return; }
    const t = setTimeout(() => setLoadingTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error, clearError]);

  useEffect(() => {
    if (authState === "active" && student && !entranceDone) {
      setShowEntrance(true);
    }
  }, [authState, student, entranceDone]);

  // Patch 4.3: pending weekly rewards inbox — one toast per row, then claim
  // them all so they don't fire again on next login.
  useEffect(() => {
    if (authState !== "active" || !student) return;
    let cancelled = false;
    (async () => {
      // Patch 5.4: re-check event missions on login (catches floor_reached /
      // card_obtained progress that happened while offline).
      void supabaseStudent.rpc("check_my_event_missions");
      // Patch 8.2: title conditions sweep on login (cheap when nothing new).
      void supabaseStudent.rpc("check_my_title_conditions");
      // Patch 8.3: banner conditions sweep on login.
      void supabaseStudent.rpc("check_my_banner_conditions");
      // Patch 8.4: ensure today's daily quests exist + bump login counter.
      void supabaseStudent.rpc("ensure_my_daily_quests");
      void supabaseStudent.rpc("increment_daily_counter", { p_type: "login", p_amount: 1 });
      void supabaseStudent.rpc("increment_daily_counter", { p_type: "login_streak", p_amount: 1 });
      const { data, error } = await supabaseStudent.rpc("get_my_pending_rewards");
      if (cancelled || error || !data) return;
      const rows = data as Array<{ id: string; kind: string; title: string; body: string | null }>;
      if (rows.length === 0) return;
      rows.forEach((r, i) => {
        setTimeout(() => toast.success(r.title, { description: r.body ?? undefined, duration: 8000 }), i * 700);
      });
      await supabaseStudent.rpc("claim_my_pending_rewards", { p_ids: null });
    })();
    return () => { cancelled = true; };
  }, [authState, student?.id]);

  // Lazy-load tab data on first visit
  useEffect(() => {
    if (authState !== "active") return;
    if (activeTab === "missions") {
      void ensureMissionsLoaded();
    }
    if (
      activeTab === "shop" ||
      activeTab === "character" ||
      activeTab === "trading"
    ) {
      void ensureShopLoaded();
    }
  }, [activeTab, authState, ensureMissionsLoaded, ensureShopLoaded]);

  // ── Loading ────────────────────────────────
  if (isLoading) {
    if (loadingTimedOut) {
      return (
        <div className="min-h-screen relative flex items-center justify-center">
          <AincradBackground scene="default" />
          <div className="relative z-10 text-center p-8">
            <p className="text-red-400 font-semibold mb-2">Não foi possível conectar.</p>
            <p className="text-white/40 text-sm">Verifique sua conexão e recarregue a página.</p>
            <button onClick={() => window.location.reload()} className="btn-cyber mt-4">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return <DungeonLoadingScreen />;
  }

  // ── Pre-session screens ────────────────────
  if (authState === "unauthenticated") {
    return <LoginScreen onEmailLogin={loginWithEmail} onEmailSignUp={signUpWithEmail} />;
  }

  if (authState === "needs_registration") {
    return (
      <ClassSelectionScreen
        teachers={teachers}
        classes={classes}
        onTeacherChange={loadClassesByTeacher}
        onRegister={async (name, teacherId, classId) => {
          const result = await registerStudent(name, teacherId, classId);
          if (!result.success) {
            toast.error("Erro ao solicitar acesso", { description: result.error });
          } else {
            toast.success("Solicitação enviada! Aguarde a aprovação do professor.");
          }
        }}
        onBack={logout}
      />
    );
  }

  if (authState === "suspended" && student) {
    return (
      <SuspendedScreen
        studentName={student.character_name || student.name}
        suspendedUntil={student.suspended_until ?? new Date().toISOString()}
        reason={student.suspended_reason ?? null}
        onLogout={logout}
      />
    );
  }

  if (authState === "pending" || !student) {
    return (
      <PendingScreen
        studentName={student?.name ?? ""}
        isRejected={student?.status === "rejected"}
        onLogout={logout}
      />
    );
  }

  // ── Active dashboard ───────────────────────

  if (!student.character_name) {
    return <OnboardingFlow student={student} onComplete={refreshStudent} />;
  }

  // Onda 11.4 — gate da Season 2: exige class_type preenchido.
  // Aguarda o fetch terminar para não piscar a tela enquanto carrega.
  if (!isLoadingClassProfile && !classProfile?.classType) {
    return (
      <Wave11ClassSelectionScreen
        student={student}
        onComplete={() => { void refetchClassProfile(); void refreshStudent(); }}
      />
    );
  }

  // Onda 11.8 — gate do tutorial de combate (apenas após class_type definido).
  if (
    !isLoadingClassProfile
    && classProfile?.classType
    && !((student as unknown as { tutorial_completed?: boolean }).tutorial_completed)
  ) {
    return (
      <Wave11TutorialBattleScreen
        student={student}
        onComplete={() => { void refreshStudent(); }}
      />
    );
  }

  const handleChallengeRequest = async (challengeId: string) => {
    const result = await requestChallenge(challengeId);
    if (!result) return;
    if (result.error) {
      toast.error("Erro ao solicitar", { description: result.error.message });
    } else {
      toast.success("Desafio solicitado! Aguarde a validação do professor.");
    }
  };

  const handleAttendanceRequest = async () => {
    if (hasAttendanceRequest()) {
      toast.info("Já solicitado", { description: "Aguarde a confirmação do professor." });
      return;
    }
    const result = await requestAttendance();
    if (!result) return;
    if (result.error) {
      toast.error("Erro ao solicitar presença", { description: result.error.message });
    } else {
      toast.success("Presença solicitada! Aguarde a confirmação do professor.");
    }
  };

  const isDirector = activeTab === 'director';
  const bgScene = activeTab === 'challenges' ? 'quests' : activeTab === 'bosses' ? 'quests' : activeTab === 'skills' ? 'quests' : activeTab === 'ranking' ? 'ranking' : activeTab === 'shop' ? 'shop' : activeTab === 'character' ? 'character' : activeTab === 'guild' ? 'home' : 'home';

  const TAB_LABELS: Record<string, string> = {
    challenges: 'Quests', missions: 'Missões', bosses: 'Bosses',
    guild: 'Guilda', skills: 'Skills', shop: 'Loja',
    ranking: 'Ranking', character: 'Herói', capsule: 'Cápsula', pvp: 'PvP Arena', trading: 'Trading', mural: 'Mural', cards: 'Cartas',
  };

  const sharedOverlays = (
    <>
      {activeBossId && student && (
        <BattleScreen
          key={battleKey}
          bossId={activeBossId}
          student={student}
          onExit={() => { setActiveBossId(null); setBossTabKey(k => k + 1); }}
          onRetry={() => setBattleKey(k => k + 1)}
        />
      )}
      {showEntrance && !entranceDone && (
        <DungeonEntrance
          studentId={student.id}
          studentName={student.character_name || student.name}
          level={student.level}
          characterClass={student.character_class}
          onComplete={() => { setShowEntrance(false); setEntranceDone(true); }}
        />
      )}
      {showAccessibility && (
        <AccessibilitySettings onClose={() => setShowAccessibility(false)} />
      )}
      {/* Patch 5.3: cinematic vault openings auto-detect unread vaults on mount */}
      <VaultOpeningModal />
    </>
  );

  function getTabContent(): JSX.Element {
    if (isDirector) {
      return (
        <div className="relative min-h-screen">
          {sharedOverlays}
          <DirectorMap
            student={student}
            onNavigate={handleTabChange}
            onLogout={async () => { setIsLoggingOut(true); await logout(); }}
            onOpenAccessibility={() => setShowAccessibility(true)}
          />
        </div>
      );
    }

    if (activeTab === 'dungeon') {
      return (
        <div className="fixed inset-0 bg-[#020611]">
          {sharedOverlays}
          {isLoadingCharacter ? (
            <div className="flex items-center justify-center h-full text-white/60">
              <Loader2 className="animate-spin mr-3" size={24} /> Carregando personagem...
            </div>
          ) : battleCharacter ? (
            <BattleDungeonView
              character={battleCharacter}
              studentId={student.id}
              teacherId={student.teacher_id}
              classId={student.class_id}
              onRewardApplied={refreshStudent}
              onBack={() => setActiveTab('director')}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/60">
              <p>Não foi possível carregar o personagem. Tente recarregar a página.</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'skills') {
      return (
        <div className="fixed inset-0">
          {sharedOverlays}
          {isLoadingCharacter ? (
            <div className="flex items-center justify-center h-full text-white/60 bg-[#020611]">
              <Loader2 className="animate-spin mr-3" size={24} /> Carregando habilidades...
            </div>
          ) : battleCharacter ? (
            <SkillTreePage character={battleCharacter} studentId={student.id} onBack={() => setActiveTab('director')} />
          ) : (
            <div className="flex items-center justify-center h-full text-white/60 bg-[#020611]">
              <p>Erro ao carregar sistema de habilidades</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'pvp') {
      return (
        <div className="fixed inset-0">
          {sharedOverlays}
          <PvpArena student={student} onBack={() => setActiveTab('director')} />
        </div>
      );
    }

    if (activeTab === 'character') {
      return (
        // No overflow-y here — HeroScreen owns its own scroll container so
        // the inner wheel events behave predictably (a single scrollable
        // ancestor, not two stacked ones competing).
        <div className="fixed inset-0" style={{ background: '#04060a' }}>
          {sharedOverlays}
          <Suspense fallback={<DungeonLoadingScreen />}>
            <HeroScreen student={student} inventory={inventory} onUpdate={async () => { await Promise.all([refreshStudent(), refreshInventory()]); }} onBack={() => setActiveTab('director')} />
          </Suspense>
        </div>
      );
    }

    if (activeTab === 'guild') {
      return (
        <div className="fixed inset-0">
          {sharedOverlays}
          <Guild student={student} onBack={() => setActiveTab('director')} />
        </div>
      );
    }

    if (activeTab === 'trading') {
      return (
        <div className="fixed inset-0">
          {sharedOverlays}
          <TradingScreen
            student={student}
            inventory={inventory}
            onBack={() => setActiveTab('director')}
            onInventoryChanged={async () => { await Promise.all([refreshStudent(), refreshInventory()]); }}
          />
        </div>
      );
    }

    if (activeTab === 'shop') {
      return (
        <div className="fixed inset-0">
          {sharedOverlays}
          <Suspense fallback={<DungeonLoadingScreen />}>
          <ShopScreen
            items={shopItems}
            inventory={inventory}
            student={student}
            onPurchase={async (item) => {
              const result = await purchaseItem(item.id);
              if (!result) return;
              if (!result.success) {
                toast.error("Compra não realizada", { description: result.error });
              } else {
                toast.success(`${item.name} adquirido!`);
              }
            }}
            onPurchaseWithDiamonds={async (item) => {
              const result = await purchaseItem(item.id, true);
              if (!result) return;
              if (!result.success) {
                toast.error("Compra não realizada", { description: result.error });
              } else {
                toast.success(`${item.name} adquirido com diamantes!`);
              }
            }}
            onCoinsChanged={refreshStudent}
            onBack={() => setActiveTab('director')}
          />
          </Suspense>
        </div>
      );
    }

    if (activeTab === 'missions' || activeTab === 'challenges') {
      return (
        <div className="fixed inset-0 overflow-y-auto" style={{ background: '#1a0c04' }}>
          <AincradBackground scene="quests" />
          {sharedOverlays}
          <MissionBoard
            studentId={student.id}
            teacherId={student.teacher_id}
            missions={missions}
            completions={missionCompletions}
            needsReturnMission={false}
            onCompletionRequested={refreshMissions}
            challenges={challenges}
            isChallengeCompleted={(id) => challenges.find(c => c.id === id)?.challenge_type === "unica" && isChallengeCompleted(id)}
            isChallengePending={isChallengePending}
            onChallengeRequest={handleChallengeRequest}
            onBack={() => setActiveTab('director')}
            initialTab={activeTab === 'challenges' ? 'desafios' : 'missoes'}
          />
        </div>
      );
    }

    // ── All other tabs — full-screen with top bar ──
    return (
    <div className="fixed inset-0 bg-[#020611] z-30 overflow-hidden">
      <AincradBackground scene={bgScene} />
      {sharedOverlays}

      {/* Top navigation bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-5 py-3"
        style={{
          background: 'rgba(2,6,17,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(0,229,255,0.08)',
        }}
      >
        <button
          onClick={() => setActiveTab('director')}
          className="flex items-center gap-2 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors font-mono tracking-widest shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          HUB
        </button>
        <span
          className="flex-1 text-center text-sm font-bold tracking-[0.18em] text-white/80 uppercase"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          {TAB_LABELS[activeTab] ?? activeTab}
        </span>
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <GameIcon id="coin" size={13} />
            <span className="text-yellow-400 font-bold font-mono">{student.coins >= 1000 ? `${(student.coins/1000).toFixed(1)}k` : student.coins}</span>
          </div>
          {student.presencas_consecutivas > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={12} className="text-orange-400" />
              <span className="text-orange-400 font-bold font-mono">{student.presencas_consecutivas}</span>
            </div>
          )}
          <button
            onClick={async () => { setIsLoggingOut(true); await logout(); }}
            className="ml-1 text-white/20 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="overflow-y-auto h-full pt-14 pb-8">
        <div className="relative z-10 max-w-4xl mx-auto px-5 py-6">

        {/* Attendance Banner */}
        <div className="holo-panel mb-6 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
                <CalendarCheck className="text-cyan-400" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <Flame size={14} className="text-orange-400" />
                  {student.presencas_consecutivas}{" "}
                  {student.presencas_consecutivas === 1 ? "aula consecutiva" : "aulas consecutivas"}
                </p>
                <p className="text-xs text-white/40">Continue assim para manter sua sequência!</p>
              </div>
            </div>

            {hasAttendanceRequest() ? (
              <button disabled className="btn-cyber opacity-60 cursor-not-allowed">
                <Clock size={14} /> Aguardando confirmação
              </button>
            ) : (
              <button onClick={handleAttendanceRequest} className="btn-cyber">
                <CalendarCheck size={14} /> Marcar presença
              </button>
            )}
          </div>
        </div>

        {/* Class War Banner — shown on missions/challenges tab */}
        {(activeTab === 'missions' || activeTab === 'challenges') && student.class_id && (
          <ClassWarBanner classId={student.class_id} />
        )}

        {/* Missions Tab */}
        {activeTab === "missions" && (
          <MissionBoard
            studentId={student.id}
            missions={missions}
            completions={missionCompletions}
            needsReturnMission={false}
            onCompletionRequested={refreshMissions}
            challenges={challenges}
            isChallengeCompleted={(id) => challenges.find(c => c.id === id)?.challenge_type === "unica" && isChallengeCompleted(id)}
            isChallengePending={isChallengePending}
            onChallengeRequest={handleChallengeRequest}
            initialTab="missoes"
          />
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <MissionBoard
            studentId={student.id}
            missions={missions}
            completions={missionCompletions}
            needsReturnMission={false}
            onCompletionRequested={refreshMissions}
            challenges={challenges}
            isChallengeCompleted={(id) => challenges.find(c => c.id === id)?.challenge_type === "unica" && isChallengeCompleted(id)}
            isChallengePending={isChallengePending}
            onChallengeRequest={handleChallengeRequest}
            initialTab="desafios"
          />
        )}

        {/* Shop Tab — handled as full-screen ShopScreen overlay above */}
        {/* Inventory Tab — now embedded in HeroScreen (MOCHILA button) */}

        {activeTab === "bosses" && (
          <BossBattleTab key={bossTabKey} student={student} onStartBoss={setActiveBossId} />
        )}

        {/* Skills Tab — now handled as full-screen overlay above */}

        {/* Ranking Tab */}
        {activeTab === "ranking" && (
          <WeeklyRankingsScreen student={student} />
        )}

        {/* Patch 8.1: Mural de Feitos da Escola */}
        {activeTab === "mural" && (
          <SchoolFeedScreen />
        )}

        {/* Top-1 weekly card tickets */}
        {activeTab === "cards" && (
          <CreationTicketsPanel />
        )}

        {/* Time Capsule Tab */}
        {activeTab === "capsule" && (
          <div className="max-w-lg mx-auto">
            <TimeCapsule student={student} />
          </div>
        )}

        {/* Trading Tab — handled as full-screen TradingScreen overlay above */}

        <div className="mt-8 text-center text-xs text-white/20">
          <p>Todas as solicitações são validadas pelo professor</p>
          <DeveloperSignature className="mt-4" />
        </div>
        </div>
      </div>
    </div>
    );
  } // end getTabContent

  return (
    <ProfileCardOpenerProvider>
      <PvpChallengeProvider student={student} isInBattle={!!activeBossId}>
        {getTabContent()}
      </PvpChallengeProvider>
    </ProfileCardOpenerProvider>
  );
}
