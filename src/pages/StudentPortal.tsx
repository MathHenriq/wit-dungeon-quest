import { useState, useEffect } from "react";
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
import { StudentTitleBadge, AttendanceCrown } from "@/components/StudentTitleBadge";
import { AincradBackground } from "@/components/ui/AincradBackground";
import { DungeonLoadingScreen } from "@/components/student/DungeonLoadingScreen";
import { DungeonEntrance } from "@/components/student/DungeonEntrance";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StudentNavigation, type StudentTab } from "@/components/student/StudentNavigation";
import { DirectorMap } from "@/components/student/DirectorMap";
import { OnboardingFlow } from "@/components/student/OnboardingFlow";
import { CharacterSheet } from "@/components/student/CharacterSheet";
import { ProgressRanking } from "@/components/student/ProgressRanking";
import { BossBattleTab, BattleScreen } from "@/components/student/BossBattle";
import { Guild } from "@/components/guild/Guild";
import { SkillTreeView } from "@/components/student/SkillTreeView";
import { DailyDungeon } from "@/components/student/DailyDungeon";
import { BattleDungeonView } from "@/components/student/BattleDungeonView";
import { BattleSkillsView } from "@/components/student/BattleSkillsView";
import { BattleInventoryView } from "@/components/student/BattleInventoryView";
import { BattlePvPView } from "@/components/student/BattlePvPView";
import { useBattleCharacter } from "@/hooks/useBattleCharacter";
import { TimeCapsule } from "@/components/student/TimeCapsule";
import { PvPArena } from "@/components/student/PvPArena";
import { PvpArena } from "@/components/pvp-arena/PvpArena";
import { TradingPanel } from "@/components/student/TradingPanel";
import { ClassWarBanner } from "@/components/student/ClassWarBanner";
import { CraftPanel } from "@/components/student/CraftPanel";
import { ChestSection } from "@/components/student/ChestSection";
import { AccessibilitySettings } from "@/components/student/AccessibilitySettings";
import { GameIcon } from "@/components/icons/GameIcon";
import {
  Sword,
  Shield,
  LogOut,
  CheckCircle,
  Clock,
  CalendarCheck,
  Loader2,
  ShoppingBag,
  Package,
  ChevronDown,
  Mail,
  Lock,
  Flame,
} from "lucide-react";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { ShopItem, InventoryItem } from "@/types";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Shop & Inventory helpers
// ─────────────────────────────────────────────

function ItemCard({ item }: { item: ShopItem }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
  return (
    <div className="w-full h-full rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <GameIcon id={meta.iconId} size={48} />
      )}
    </div>
  );
}

function AttrList({ item }: { item: ShopItem }) {
  const active = ATTRIBUTES.filter(a => (item[a.key] ?? 0) > 0);
  if (!active.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {active.map(a => (
        <span key={a.key} className="text-xs px-1.5 py-0.5 rounded text-cyan-400 font-medium flex items-center gap-1" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
          <GameIcon id={a.iconId} size={12} /> +{item[a.key]}
        </span>
      ))}
    </div>
  );
}

function ShopSection({
  items,
  inventory,
  studentCoins,
  studentLevel,
  onPurchase,
}: {
  items: ShopItem[];
  inventory: InventoryItem[];
  studentCoins: number;
  studentLevel: number;
  onPurchase: (item: ShopItem) => Promise<void>;
}) {
  const [buying, setBuying] = useState<string | null>(null);

  const ownedItemIds = new Set(inventory.map(i => i.item_id));

  if (items.length === 0) {
    return (
      <div className="holo-panel text-center py-10 text-white/50">
        <ShoppingBag size={48} className="mx-auto mb-4 opacity-40" />
        <p>Nenhum item disponível na loja ainda</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title mb-4">
        <ShoppingBag size={14} />
        <span>Loja de Itens</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
          const isToken = item.category === "token";
          const alreadyOwned = !isToken && ownedItemIds.has(item.id);
          const cantAfford = studentCoins < item.cost;
          const belowLevel = studentLevel < item.min_level;
          const isBuying = buying === item.id;

          return (
            <div key={item.id} className="holo-panel flex flex-col gap-3">
              {/* Image */}
              <div className="h-36 rounded-lg overflow-hidden">
                <ItemCard item={item} />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{item.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                    <GameIcon id={meta.iconId} size={12} /> {meta.label}
                  </span>
                  {item.min_level > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white/40" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      Nv. {item.min_level}+
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-white/50 mt-1">{item.description}</p>
                )}
                <AttrList item={item} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-bold text-yellow-400 flex items-center gap-1 text-sm">
                  <GameIcon id="coin" size={16} /> {item.cost}
                </span>
                {alreadyOwned ? (
                  <span className="text-sm px-3 py-1 rounded-lg text-cyan-400 font-medium" style={{ background: 'rgba(0,229,255,0.08)' }}>
                    Equipado
                  </span>
                ) : belowLevel ? (
                  <span className="text-xs text-white/30">Nível insuficiente</span>
                ) : (
                  <button
                    disabled={cantAfford || isBuying}
                    onClick={async () => {
                      setBuying(item.id);
                      await onPurchase(item);
                      setBuying(null);
                    }}
                    className={`btn-cyber text-xs py-1.5 px-3 ${cantAfford ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {isBuying ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                    {cantAfford ? "Sem moedas" : "Comprar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventorySection({ inventory }: { inventory: InventoryItem[] }) {
  if (inventory.length === 0) {
    return (
      <div className="holo-panel text-center py-10 text-white/50">
        <Package size={48} className="mx-auto mb-4 opacity-40" />
        <p>Seu inventário está vazio</p>
        <p className="text-sm mt-1 text-white/30">Compre itens na Loja para equipá-los aqui.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title mb-4">
        <Package size={14} />
        <span>Meu Inventário ({inventory.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map(entry => {
          const item = entry.item;
          if (!item) return null;
          const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
          return (
            <div key={entry.id} className="holo-panel flex flex-col gap-3">
              <div className="h-32 rounded-lg overflow-hidden">
                <ItemCard item={item} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{item.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                    <GameIcon id={meta.iconId} size={12} /> {meta.label}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-white/50 mt-1">{item.description}</p>
                )}
                <AttrList item={item} />
                <p className="text-xs text-white/30 mt-2">
                  Adquirido em {new Date(entry.added_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-screens shown before an active session
// ─────────────────────────────────────────────

function LoginScreen({
  onGoogleLogin,
  onEmailLogin,
  onEmailSignUp,
}: {
  onGoogleLogin: () => void;
  onEmailLogin: (email: string, password: string) => Promise<{ error: unknown }>;
  onEmailSignUp: (email: string, password: string) => Promise<{ error: unknown }>;
}) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    onGoogleLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await onEmailLogin(email, password);
        if (error) toast.error("Email ou senha incorretos");
      } else {
        const { error } = await onEmailSignUp(email, password);
        if (error) {
          toast.error("Erro ao criar conta", { description: (error as { message?: string }).message });
        } else {
          toast.success("Conta criada! Agora selecione sua turma.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Video background — replaces AincradBackground on login */}
      <div className="login-video-background">
        <video autoPlay loop muted playsInline className="login-background-video">
          <source src="/videos/login-bg.mp4" type="video/mp4" />
        </video>
      </div>
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
          {/* Google login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {isGoogleLoading ? <Loader2 size={18} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {isGoogleLoading ? "Redirecionando..." : "Entrar com Google"}
          </button>

          {/* Email toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowEmailForm(v => !v)}
              className="w-full flex items-center justify-center gap-1 text-sm text-white/40 hover:text-white/70 transition-colors py-1"
            >
              <ChevronDown size={16} className={`transition-transform ${showEmailForm ? "rotate-180" : ""}`} />
              {showEmailForm ? "Ocultar" : "Usar email e senha"}
            </button>

            {showEmailForm && (
              <div className="mt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
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
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Senha" required minLength={6}
                      className="w-full px-4 py-3 pl-10 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="btn-cyber w-full justify-center">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Aguarde...</> : isLogin ? "Entrar" : "Criar conta"}
                  </button>
                </form>
              </div>
            )}
          </div>
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
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string; teacher_id?: string }[];
  onTeacherChange: (teacherId: string) => void;
  onRegister: (name: string, teacherId: string, classId: string) => Promise<void>;
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
    loginWithGoogle,
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

  // Lazy-load tab data on first visit
  useEffect(() => {
    if (authState !== "active") return;
    if (activeTab === "missions") {
      void ensureMissionsLoaded();
    }
    if (
      activeTab === "shop" ||
      activeTab === "inventory" ||
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
    return <LoginScreen onGoogleLogin={loginWithGoogle} onEmailLogin={loginWithEmail} onEmailSignUp={signUpWithEmail} />;
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

  // ── Director Map (fullscreen, replaces sidebar+content) ──
  if (isDirector) {
    return (
      <div className="relative min-h-screen">
        {/* BattleScreen renders at root level */}
        {activeBossId && student && (
          <BattleScreen
            key={battleKey}
            bossId={activeBossId}
            student={student}
            onExit={() => { setActiveBossId(null); setBossTabKey(k => k + 1); }}
            onRetry={() => setBattleKey(k => k + 1)}
          />
        )}

        {/* Dungeon Entrance animation */}
        {showEntrance && !entranceDone && (
          <DungeonEntrance
            studentId={student.id}
            studentName={student.character_name || student.name}
            level={student.level}
            characterClass={student.character_class}
            onComplete={() => {
              setShowEntrance(false);
              setEntranceDone(true);
            }}
          />
        )}

        <DirectorMap
          student={student}
          onNavigate={handleTabChange}
          onLogout={async () => { setIsLoggingOut(true); await logout(); }}
          onOpenAccessibility={() => setShowAccessibility(true)}
        />

        {showAccessibility && (
          <AccessibilitySettings onClose={() => setShowAccessibility(false)} />
        )}
      </div>
    );
  }

  // ── TAB LABELS ──
  const TAB_LABELS: Record<string, string> = {
    challenges: 'Quests', missions: 'Missões', bosses: 'Bosses',
    guild: 'Guilda', skills: 'Skills', shop: 'Loja', inventory: 'Mochila',
    ranking: 'Ranking', character: 'Herói', capsule: 'Cápsula', pvp: 'PvP Arena', trading: 'Trading',
  };

  // ── Shared overlays (boss battle + entrance + accessibility) ──
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
    </>
  );

  // ── Dungeon tab — BattleDungeonView is fully full-screen ──
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

  // ── PvP Arena tab — full-screen overlay ──
  if (activeTab === 'pvp') {
    return (
      <div className="fixed inset-0">
        {sharedOverlays}
        <PvpArena onBack={() => setActiveTab('director')} />
      </div>
    );
  }

  // ── Guild tab — full-screen overlay ──
  if (activeTab === 'guild') {
    return (
      <div className="fixed inset-0">
        {sharedOverlays}
        <Guild student={student} onBack={() => setActiveTab('director')} />
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
          <section className="holo-panel">
            <MissionBoard
              studentId={student.id}
              missions={missions}
              completions={missionCompletions}
              needsReturnMission={false}
              onCompletionRequested={refreshMissions}
            />
          </section>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <section>
            <div className="section-title">
              <span>Desafios da Semana</span>
            </div>
            {challenges.length === 0 ? (
              <div className="holo-panel text-center py-8 text-white/40">
                <Sword size={48} className="mx-auto mb-4 opacity-30" />
                <p>Nenhum desafio disponível no momento</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {challenges.map(challenge => {
                  const isCompletedUnique =
                    challenge.challenge_type === "unica" && isChallengeCompleted(challenge.id);
                  const isPending = isChallengePending(challenge.id);
                  return (
                    <div key={challenge.id} className="holo-panel relative overflow-hidden">
                      {(isPending || isCompletedUnique) && (
                        <div className="absolute top-3 right-3">
                          <div
                            className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                              isCompletedUnique
                                ? "text-cyan-400 bg-cyan-400/10"
                                : "text-green-400 bg-green-400/10"
                            }`}
                          >
                            {isCompletedUnique ? (
                              <><CheckCircle size={14} /><span>Concluído</span></>
                            ) : (
                              <><Clock size={14} /><span>Aguardando</span></>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
                          <GameIcon id="sword" size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {challenge.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                challenge.challenge_type === "unica"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-cyan-500/20 text-cyan-400"
                              }`}
                            >
                              {challenge.challenge_type === "unica" ? "Única" : "Repetível"}
                            </span>
                          </div>
                          {challenge.description && (
                            <p className="text-white/50 text-sm mb-3">{challenge.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold text-sm">
                              <GameIcon id="coin" size={16} />
                              <span>+{challenge.reward}</span>
                            </div>
                            {isCompletedUnique ? (
                              <button disabled className="btn-cyber opacity-60 cursor-not-allowed">
                                <CheckCircle size={14} /> Concluído
                              </button>
                            ) : isPending ? (
                              <button disabled className="btn-cyber opacity-60 cursor-not-allowed">
                                <Clock size={14} /> Aguardando
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChallengeRequest(challenge.id)}
                                className="btn-cyber"
                              >
                                Concluir desafio
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Shop Tab */}
        {activeTab === "shop" && (
          <>
            <ChestSection student={student} onCoinsChanged={refreshStudent} />
            <ShopSection
              items={shopItems}
              inventory={inventory}
              studentCoins={student.coins}
              studentLevel={student.level}
              onPurchase={async (item) => {
                const result = await purchaseItem(item.id);
                if (!result) return;
                if (!result.success) {
                  toast.error("Compra não realizada", { description: result.error });
                } else {
                  toast.success(`${item.name} adquirido!`);
                }
              }}
            />
            <div className="mt-6">
              <CraftPanel studentId={student.id} teacherId={student.teacher_id} onCoinsChanged={refreshStudent} />
            </div>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <InventorySection inventory={inventory} />
            {battleCharacter && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xl font-bold mb-4">⚔️ Itens de Batalha</h3>
                <BattleInventoryView characterId={battleCharacter.id} />
              </div>
            )}
          </div>
        )}

        {activeTab === "bosses" && (
          <BossBattleTab key={bossTabKey} student={student} onStartBoss={setActiveBossId} />
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          isLoadingCharacter ? (
            <div className="flex items-center justify-center h-64 text-white/60">
              <span className="animate-spin mr-3">⏳</span> Carregando habilidades...
            </div>
          ) : battleCharacter ? (
            <BattleSkillsView character={battleCharacter} />
          ) : (
            <div className="holo-panel text-center py-12 text-white/60">
              <p>Erro ao carregar sistema de habilidades</p>
            </div>
          )
        )}

        {/* Ranking Tab */}
        {activeTab === "ranking" && (
          <ProgressRanking student={student} classId={student.class_id} showClassicToggle />
        )}

        {/* Character Tab */}
        {activeTab === "character" && (
          <CharacterSheet student={student} inventory={inventory} onUpdate={refreshStudent} />
        )}

        {/* Time Capsule Tab */}
        {activeTab === "capsule" && (
          <div className="max-w-lg mx-auto">
            <TimeCapsule student={student} />
          </div>
        )}

        {/* PvP Arena Tab */}
        {activeTab === "pvp" && (
          isLoadingCharacter ? (
            <div className="flex items-center justify-center h-64 text-white/60">
              <span className="animate-spin mr-3">⏳</span> Carregando arena PvP...
            </div>
          ) : battleCharacter ? (
            <BattlePvPView character={battleCharacter} />
          ) : (
            <div className="holo-panel text-center py-12 text-white/60">
              <p>Erro ao carregar arena PvP</p>
            </div>
          )
        )}

        {/* Trading Tab */}
        {activeTab === "trading" && (
          <div className="max-w-lg mx-auto">
            <TradingPanel
              student={student}
              inventory={inventory}
              onInventoryChanged={refreshStudent}
            />
          </div>
        )}

        <div className="mt-8 text-center text-xs text-white/20">
          <p>Todas as solicitações são validadas pelo professor</p>
          <DeveloperSignature className="mt-4" />
        </div>
        </div>
      </div>
    </div>
  );
}
