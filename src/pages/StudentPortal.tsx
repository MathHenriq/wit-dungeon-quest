import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStudentDB } from "@/hooks/useStudentDB";
import { RewardDisplay } from "@/components/RewardDisplay";
import { LevelBadge } from "@/components/LevelBadge";
import { CharacterCustomization } from "@/components/CharacterCustomization";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { MissionBoard } from "@/components/MissionBoard";
import { StudentTitleBadge, AttendanceCrown } from "@/components/StudentTitleBadge";
import {
  Sword,
  Shield,
  LogOut,
  Scroll,
  CheckCircle,
  Clock,
  UserCircle,
  Sparkles,
  CalendarCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Sub-screens shown before an active session
// ─────────────────────────────────────────────

function LoginScreen({ onGoogleLogin }: { onGoogleLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dungeon-dark mb-4">
            <div className="flex items-center gap-1">
              <Sword className="text-gold" size={28} />
              <Shield className="text-gold" size={28} />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-dungeon-dark mb-2">WIT Dungeon</h1>
          <p className="text-muted-foreground">Entre na masmorra do conhecimento!</p>
        </div>

        <div className="card-fantasy">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Use sua conta Google da escola para acessar o portal do aluno.
          </p>

          <button
            onClick={onGoogleLogin}
            className="w-full py-3 px-4 rounded-lg border-2 border-border bg-background hover:bg-secondary transition-all flex items-center justify-center gap-3 font-semibold text-foreground"
          >
            {/* Google "G" logo */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Entrar com Google
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">⚔️ Sistema de gamificação educacional ⚔️</p>
          <Link to="/professor/login" className="text-sm text-primary hover:underline">
            Acesso do Professor →
          </Link>
          <DeveloperSignature className="mt-4" />
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dungeon-dark mb-4">
            <div className="flex items-center gap-1">
              <Sword className="text-gold" size={28} />
              <Shield className="text-gold" size={28} />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-dungeon-dark mb-2">Bem-vindo!</h1>
          <p className="text-muted-foreground">
            Primeira vez aqui? Diga-nos em qual turma você está.
          </p>
        </div>

        <div className="card-fantasy">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Seu Nome Completo *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como aparece na lista de chamada"
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Professor *</label>
              <select
                value={teacherId}
                onChange={e => handleTeacherSelect(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold outline-none transition-all"
              >
                <option value="">Selecione seu professor</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {teacherId && (
              <div>
                <label className="block text-sm font-semibold mb-2">Turma *</label>
                <select
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold outline-none transition-all"
                >
                  <option value="">Selecione sua turma</option>
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {filteredClasses.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nenhuma turma disponível para este professor.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !teacherId || !classId}
              className="btn-fantasy w-full py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Enviando...</>
              ) : (
                <><Sword size={20} /> Solicitar Acesso</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dungeon-dark mb-6">
          <Clock className="text-gold" size={36} />
        </div>

        {isRejected ? (
          <>
            <h1 className="font-display text-2xl font-bold mb-3 text-destructive">
              Solicitação não aprovada
            </h1>
            <p className="text-muted-foreground mb-2">
              Olá, <strong>{studentName}</strong>. Sua solicitação de acesso não foi aprovada.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Fale com seu professor para mais informações.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold mb-3">Aguardando Aprovação</h1>
            <p className="text-muted-foreground mb-2">
              Olá, <strong>{studentName}</strong>! Sua solicitação foi enviada.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Aguarde o professor liberar seu acesso. Esta página atualiza automaticamente
              assim que você for aprovado. ⚔️
            </p>
          </>
        )}

        <button
          onClick={onLogout}
          className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut size={16} /> Sair da conta
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
    loadClassesByTeacher,
    getRewardIcon,
  } = useStudentDB();

  const [activeTab, setActiveTab] = useState<"challenges" | "missions" | "character">("challenges");
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) { setLoadingTimedOut(false); return; }
    const t = setTimeout(() => setLoadingTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error, clearError]);

  // ── Loading ────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {loadingTimedOut ? (
            <>
              <p className="text-destructive font-semibold mb-2">Não foi possível conectar.</p>
              <p className="text-muted-foreground text-sm">Verifique sua conexão e recarregue a página.</p>
              <button onClick={() => window.location.reload()} className="btn-fantasy mt-4 px-6 py-2">
                Recarregar
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-display">Carregando...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Pre-session screens ────────────────────
  if (authState === "unauthenticated") {
    return <LoginScreen onGoogleLogin={loginWithGoogle} />;
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

  const handleChallengeRequest = async (challengeId: string) => {
    const result = await requestChallenge(challengeId);
    if (!result) return;
    if (result.error) {
      toast.error("Erro ao solicitar", { description: result.error.message });
    } else {
      toast.success("Desafio solicitado!", { description: "Aguarde a validação do professor.", icon: "⚔️" });
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
      toast.success("Presença solicitada!", { description: "Aguarde a confirmação do professor.", icon: "📋" });
    }
  };

  const displayName = student.character_name || student.name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-dungeon-dark text-primary-foreground py-4 px-4 md:px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <h1 className="font-display text-xl md:text-2xl font-bold text-gold">WIT Dungeon</h1>
            </div>

            <div className="flex items-center gap-3 bg-primary/20 rounded-lg px-4 py-2">
              <div className="relative">
                <ProfilePhoto
                  studentId={student.id}
                  currentPhotoUrl={student.profile_photo_url}
                  onUpdate={refreshStudent}
                  size="sm"
                  editable={false}
                />
                <div className="absolute -top-2 -right-2">
                  <AttendanceCrown consecutiveAttendance={student.presencas_consecutivas} />
                </div>
              </div>
              <div>
                <p className="font-semibold text-primary-foreground">{displayName}</p>
                <p className="text-sm text-primary-foreground/70">
                  {classes.find(c => c.id === student.class_id)?.name}
                </p>
                <StudentTitleBadge titles={studentTitles} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <RewardDisplay amount={student.coins} icon={getRewardIcon()} size="md" />
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-primary-foreground/70">Nível</span>
                <LevelBadge level={student.level} />
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="card-fantasy mb-6 bg-gradient-to-r from-dungeon-dark to-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <LevelBadge level={student.level} />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
                <Sparkles className="text-gold" size={24} />
                Bem-vindo, {displayName}!
              </h2>
              <p className="text-primary-foreground/80 mt-1">
                Complete desafios e conquiste recompensas épicas!
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Level */}
        <div className="md:hidden card-fantasy mb-4 flex items-center justify-center gap-3">
          <span className="text-muted-foreground">Seu Nível:</span>
          <LevelBadge level={student.level} />
        </div>

        {/* Attendance Banner */}
        <div className="card-fantasy mb-6 bg-gradient-to-r from-success/20 to-success/10 border-2 border-success/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CalendarCheck className="text-success" size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  🔥 {student.presencas_consecutivas}{" "}
                  {student.presencas_consecutivas === 1 ? "aula consecutiva" : "aulas consecutivas"}
                </p>
                <p className="text-sm text-muted-foreground">Continue assim para manter sua sequência!</p>
              </div>
            </div>

            {hasAttendanceRequest() ? (
              <button disabled className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2">
                <Clock size={18} /> Aguardando confirmação
              </button>
            ) : (
              <button
                onClick={handleAttendanceRequest}
                className="btn-fantasy bg-success hover:bg-success/90 flex items-center gap-2"
              >
                <CalendarCheck size={18} /> Marcar presença
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["challenges", "missions", "character"] as const).map(tab => {
            const labels = { challenges: "Desafios", missions: "Missões", character: "Meu Personagem" };
            const icons = { challenges: <Scroll size={20} />, missions: <Sparkles size={20} />, character: <UserCircle size={20} /> };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-4 md:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {icons[tab]}
                <span>{labels[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Missions Tab */}
        {activeTab === "missions" && (
          <section className="card-fantasy">
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
              <Scroll className="text-gold" />
              <span>Desafios da Semana</span>
            </div>
            {challenges.length === 0 ? (
              <div className="card-fantasy text-center py-8 text-muted-foreground">
                <Sword size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum desafio disponível no momento</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {challenges.map(challenge => {
                  const isCompletedUnique =
                    challenge.challenge_type === "unica" && isChallengeCompleted(challenge.id);
                  const isPending = isChallengePending(challenge.id);
                  return (
                    <div key={challenge.id} className="card-fantasy relative overflow-hidden">
                      {(isPending || isCompletedUnique) && (
                        <div className="absolute top-3 right-3">
                          <div
                            className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                              isCompletedUnique
                                ? "text-primary bg-primary/10"
                                : "text-success bg-success/10"
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
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sword className="text-primary" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-lg text-foreground">
                              {challenge.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                challenge.challenge_type === "unica"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {challenge.challenge_type === "unica" ? "Única" : "Repetível"}
                            </span>
                          </div>
                          {challenge.description && (
                            <p className="text-muted-foreground text-sm mb-3">{challenge.description}</p>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-gold-dark font-semibold">
                              <span className="text-lg">{getRewardIcon()}</span>
                              <span>+{challenge.reward}</span>
                            </div>
                            {isCompletedUnique ? (
                              <button disabled className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2">
                                <CheckCircle size={16} /> Concluído
                              </button>
                            ) : isPending ? (
                              <button disabled className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2">
                                <Clock size={16} /> Aguardando
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChallengeRequest(challenge.id)}
                                className="btn-fantasy flex items-center gap-2"
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

        {/* Character Tab */}
        {activeTab === "character" && (
          <CharacterCustomization student={student} onUpdate={refreshStudent} />
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>⚠️ Todas as solicitações são validadas pelo professor</p>
          <DeveloperSignature className="mt-4" />
        </div>
      </main>
    </div>
  );
}
