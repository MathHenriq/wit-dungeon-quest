import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

export default function StudentPortal() {
  const {
    student,
    teachers,
    classes,
    challenges,
    missions,
    missionCompletions,
    studentTitles,
    isLoading,
    loginStudent,
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

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [activeTab, setActiveTab] = useState<"challenges" | "missions" | "character">("challenges");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter classes by selected teacher
  const filteredClasses = selectedTeacherId 
    ? classes.filter(c => c.teacher_id === selectedTeacherId)
    : [];

  const handleTeacherChange = async (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setClassId("");
    if (teacherId) {
      await loadClassesByTeacher(teacherId);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !classId || !selectedTeacherId) return;

    setIsSubmitting(true);
    const result = await loginStudent(name.trim(), classId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error("Erro", { description: result.error });
    } else {
      toast.success("Bem-vindo à Dungeon!", { icon: "⚔️" });
      if (result.needsCharacter) {
        setActiveTab("character");
      }
    }
  };

  const handleChallengeRequest = async (challengeId: string, title: string) => {
    const result = await requestChallenge(challengeId);
    if (result?.error) {
      toast.error("Erro ao solicitar", { description: result.error.message });
    } else {
      toast.success("Desafio solicitado!", {
        description: "Aguarde a validação do professor.",
        icon: "⚔️",
      });
    }
  };

  const handleAttendanceRequest = async () => {
    const alreadyRequested = hasAttendanceRequest();
    if (alreadyRequested) {
      toast.info("Já solicitado", { description: "Aguarde a confirmação do professor." });
      return;
    }

    const result = await requestAttendance();
    if (result?.error) {
      toast.error("Erro ao solicitar presença", { description: result.error.message });
    } else {
      toast.success("Presença solicitada!", {
        description: "Aguarde a confirmação do professor.",
        icon: "📋",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!student) {
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
            <h1 className="font-display text-4xl font-bold text-dungeon-dark mb-2">
              WIT Dungeon
            </h1>
            <p className="text-muted-foreground">
              Entre na masmorra do conhecimento!
            </p>
          </div>

          <div className="card-fantasy">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Professor *
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                >
                  <option value="">Selecione seu professor</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nenhum professor disponível. Aguarde.
                  </p>
                )}
              </div>

              {/* Class Selection */}
              {selectedTeacherId && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Turma *
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  >
                    <option value="">Selecione sua turma</option>
                    {filteredClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {filteredClasses.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Nenhuma turma disponível para este professor.
                    </p>
                  )}
                </div>
              )}

              {/* Name Input */}
              {selectedTeacherId && classId && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedTeacherId || !classId || !name.trim()}
                className="btn-fantasy w-full py-3 text-lg flex items-center justify-center gap-2"
              >
                <Sword size={20} />
                Entrar na Dungeon
              </button>
            </form>
          </div>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              ⚔️ Sistema de gamificação educacional ⚔️
            </p>
            <Link
              to="/professor/login"
              className="text-sm text-primary hover:underline"
            >
              Acesso do Professor →
            </Link>
            <DeveloperSignature className="mt-4" />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const displayName = student.character_name || student.name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-dungeon-dark text-primary-foreground py-4 px-4 md:px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <h1 className="font-display text-xl md:text-2xl font-bold text-gold">
                WIT Dungeon
              </h1>
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
                <p className="font-semibold text-primary-foreground">
                  {displayName}
                </p>
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

        {/* Mobile Level Display */}
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
                  🔥 {student.presencas_consecutivas} {student.presencas_consecutivas === 1 ? 'aula consecutiva' : 'aulas consecutivas'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Continue assim para manter sua sequência!
                </p>
              </div>
            </div>
            
            {hasAttendanceRequest() ? (
              <button
                disabled
                className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2"
              >
                <Clock size={18} />
                Aguardando confirmação
              </button>
            ) : (
              <button
                onClick={handleAttendanceRequest}
                className="btn-fantasy bg-success hover:bg-success/90 flex items-center gap-2"
              >
                <CalendarCheck size={18} />
                Marcar presença
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex-shrink-0 px-4 md:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "challenges"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Sword size={20} />
            <span>Desafios</span>
          </button>
          <button
            onClick={() => setActiveTab("missions")}
            className={`flex-shrink-0 px-4 md:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "missions"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Sparkles size={20} />
            <span>Missões</span>
          </button>
          <button
            onClick={() => setActiveTab("character")}
            className={`flex-shrink-0 px-4 md:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "character"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <UserCircle size={20} />
            <span>Meu Personagem</span>
          </button>
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
                {challenges.map((challenge) => {
                  const isCompletedUnique = challenge.challenge_type === "unica" && 
                    isChallengeCompleted(challenge.id);
                  const isPending = isChallengePending(challenge.id);
                  return (
                    <div key={challenge.id} className="card-fantasy relative overflow-hidden">
                      {(isPending || isCompletedUnique) && (
                        <div className="absolute top-3 right-3">
                          <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                            isCompletedUnique 
                              ? "text-primary bg-primary/10" 
                              : "text-success bg-success/10"
                          }`}>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              challenge.challenge_type === "unica" 
                                ? "bg-amber-500/20 text-amber-400" 
                                : "bg-primary/20 text-primary"
                            }`}>
                              {challenge.challenge_type === "unica" ? "Única" : "Repetível"}
                            </span>
                          </div>
                          {challenge.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {challenge.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-gold-dark font-semibold">
                              <span className="text-lg">{getRewardIcon()}</span>
                              <span>+{challenge.reward}</span>
                            </div>
                            
                            {isCompletedUnique ? (
                              <button
                                disabled
                                className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Concluído
                              </button>
                            ) : isPending ? (
                              <button
                                disabled
                                className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2"
                              >
                                <Clock size={16} />
                                Aguardando
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChallengeRequest(challenge.id, challenge.title)}
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

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>⚠️ Todas as solicitações são validadas pelo professor</p>
          <DeveloperSignature className="mt-4" />
        </div>
      </main>
    </div>
  );
}
