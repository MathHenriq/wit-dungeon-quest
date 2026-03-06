import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { TeacherMissionsPanel } from "@/components/TeacherMissionsPanel";
import { TeacherTitlesPanel } from "@/components/TeacherTitlesPanel";
import { TeacherRewardSettings } from "@/components/TeacherRewardSettings";
import { TitleType } from "@/components/StudentTitleBadge";
import { 
  Users, 
  BookOpen, 
  Clock, 
  LogOut, 
  Plus,
  Check,
  X,
  Coins,
  TrendingUp,
  Trash2,
  Shield,
  Sword,
  CalendarCheck,
  RotateCcw,
  Sparkles,
  Award
} from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  character_name: string | null;
  coins: number;
  level: number;
  class_id: string;
  teacher_id: string;
  presencas_consecutivas: number;
  profile_photo_url: string | null;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  is_active: boolean;
  challenge_type: "simples" | "unica";
}

interface StudentRequest {
  id: string;
  student_id: string;
  request_type: "challenge" | "item" | "attendance";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  student?: Student;
  challenge?: Challenge;
}

interface StudentMission {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  is_active: boolean;
  is_return_mission: boolean;
}

interface MissionCompletion {
  id: string;
  mission_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface StudentTitle {
  id: string;
  student_id: string;
  title_type: TitleType;
  expires_at: string;
}

export default function TeacherDashboard() {
  const { teacher, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"requests" | "classes" | "students" | "challenges" | "attendance" | "missions" | "titles" | "reward">("requests");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [missions, setMissions] = useState<StudentMission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDesc, setNewChallengeDesc] = useState("");
  const [newChallengeReward, setNewChallengeReward] = useState(10);
  const [newChallengeType, setNewChallengeType] = useState<"simples" | "unica">("simples");

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; warning?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !teacher) {
      navigate("/professor/login");
    }
  }, [authLoading, teacher, navigate]);

  useEffect(() => {
    if (teacher) {
      loadData();
    }
  }, [teacher]);

  const loadData = async () => {
    if (!teacher) return;
    setIsLoading(true);

    try {
      // ALL queries explicitly filter by teacher.id for strict isolation
      const [
        { data: classesData },
        { data: challengesData },
        { data: studentsData },
        { data: missionsData },
        { data: completionsData },
        { data: titlesData },
      ] = await Promise.all([
        supabase.from("classes").select("*").eq("teacher_id", teacher.id).order("name"),
        supabase.from("challenges").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }),
        supabase.from("students").select("*").eq("teacher_id", teacher.id).order("name"),
        supabase.from("student_missions").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }),
        supabase.from("mission_completions").select("*").order("created_at", { ascending: false }),
        supabase.from("student_titles").select("*").order("assigned_at", { ascending: false }),
      ]);

      setClasses(classesData || []);
      setChallenges(challengesData || []);
      setStudents(studentsData || []);
      setMissions((missionsData || []) as StudentMission[]);

      // Filter completions to only students belonging to this teacher
      const studentIds = new Set((studentsData || []).map(s => s.id));
      setMissionCompletions(
        ((completionsData || []) as MissionCompletion[]).filter(c => studentIds.has(c.student_id))
      );
      setStudentTitles(
        ((titlesData || []) as StudentTitle[]).filter(t => studentIds.has(t.student_id))
      );

      // Load pending requests filtered to this teacher's students
      const { data: requestsData } = await supabase
        .from("student_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Enrich with student + challenge data, filter to teacher's students
      const enrichedRequests = (requestsData || [])
        .filter(req => studentIds.has(req.student_id))
        .map(req => {
          const student = (studentsData || []).find(s => s.id === req.student_id);
          const challenge = (challengesData || []).find(c => c.id === req.challenge_id);
          return { ...req, student, challenge } as StudentRequest;
        })
        // Only show challenge and attendance requests (shop removed)
        .filter(req => req.request_type === "challenge" || req.request_type === "attendance");
      setRequests(enrichedRequests);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!teacher) return;

    const channel = supabase
      .channel("teacher-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, () => {
        loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacher]);

  const handleLogout = async () => {
    await signOut();
    navigate("/professor/login");
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !newClassName.trim()) return;

    const { error } = await supabase.from("classes").insert({
      teacher_id: teacher.id,
      name: newClassName.trim(),
    });

    if (error) {
      toast.error("Erro ao criar turma", { description: error.message });
    } else {
      toast.success("Turma criada!");
      setNewClassName("");
      loadData();
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !selectedClass || !newStudentName.trim()) return;

    const { error } = await supabase.from("students").insert({
      class_id: selectedClass,
      teacher_id: teacher.id,
      name: newStudentName.trim(),
    });

    if (error) {
      toast.error("Erro ao adicionar aluno", { description: error.message });
    } else {
      toast.success("Aluno adicionado!");
      setNewStudentName("");
      loadData();
    }
  };

  const addChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !newChallengeTitle.trim()) return;

    const { data, error } = await supabase.from("challenges").insert({
      teacher_id: teacher.id,
      title: newChallengeTitle.trim(),
      description: newChallengeDesc.trim() || null,
      reward: newChallengeReward,
      challenge_type: newChallengeType,
    }).select().single();

    if (error) {
      toast.error("Erro ao criar desafio", { description: error.message });
    } else {
      toast.success("Desafio criado com sucesso!");
      setNewChallengeTitle("");
      setNewChallengeDesc("");
      setNewChallengeReward(10);
      setNewChallengeType("simples");
      // Optimistic update + full reload
      if (data) {
        setChallenges(prev => [data as Challenge, ...prev]);
      }
      loadData();
    }
  };

  const approveRequest = async (request: StudentRequest) => {
    if (!teacher) return;

    const { error: updateError } = await supabase
      .from("student_requests")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        resolved_by: teacher.id,
      })
      .eq("id", request.id);

    if (updateError) {
      toast.error("Erro ao aprovar solicitação");
      return;
    }

    // Update student coins if it's a challenge
    if (request.request_type === "challenge" && request.challenge && request.student) {
      const { error: coinError } = await supabase
        .from("students")
        .update({ coins: request.student.coins + request.challenge.reward })
        .eq("id", request.student_id);
      
      if (coinError) {
        toast.error("Solicitação aprovada, mas erro ao atualizar recompensa");
        loadData();
        return;
      }
    }

    // Handle attendance approval
    if (request.request_type === "attendance" && request.student) {
      const { error: attendanceError } = await supabase
        .from("students")
        .update({ presencas_consecutivas: request.student.presencas_consecutivas + 1 })
        .eq("id", request.student_id);
      
      if (attendanceError) {
        toast.error("Solicitação aprovada, mas erro ao atualizar presença");
      }
    }

    toast.success("Solicitação aprovada!");
    loadData();
  };

  const rejectRequest = async (requestId: string) => {
    if (!teacher) return;

    const { error } = await supabase
      .from("student_requests")
      .update({
        status: "rejected",
        resolved_at: new Date().toISOString(),
        resolved_by: teacher.id,
      })
      .eq("id", requestId);

    if (error) {
      toast.error("Erro ao rejeitar solicitação");
    } else {
      toast.success("Solicitação rejeitada");
      loadData();
    }
  };

  const updateStudentCoins = async (studentId: string, newCoins: number) => {
    const { error } = await supabase
      .from("students")
      .update({ coins: Math.max(0, newCoins) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar recompensas");
    } else {
      toast.success("Recompensas atualizadas!");
      loadData();
    }
  };

  const updateStudentLevel = async (studentId: string, newLevel: number) => {
    const { error } = await supabase
      .from("students")
      .update({ level: Math.max(1, newLevel) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar nível");
    } else {
      toast.success("Nível atualizado!");
      loadData();
    }
  };

  const confirmAttendance = async (studentId: string, currentCount: number) => {
    const { error } = await supabase
      .from("students")
      .update({ presencas_consecutivas: currentCount + 1 })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao confirmar presença");
    } else {
      toast.success("Presença confirmada!");
      loadData();
    }
  };

  const resetAttendance = async (studentId: string) => {
    const { error } = await supabase
      .from("students")
      .update({ presencas_consecutivas: 0 })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao marcar falta");
    } else {
      toast.success("Presença zerada (falta marcada)");
      loadData();
    }
  };

  // Delete functions
  const openDeleteDialog = (type: string, id: string, name: string, warning?: string) => {
    setDeleteTarget({ type, id, name, warning });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    let error = null;

    try {
      switch (deleteTarget.type) {
        case "class": {
          const { error: e } = await supabase.from("classes").delete().eq("id", deleteTarget.id);
          error = e;
          break;
        }
        case "student": {
          const { error: e } = await supabase.from("students").delete().eq("id", deleteTarget.id);
          error = e;
          break;
        }
        case "challenge": {
          const { error: e } = await supabase.from("challenges").update({ is_active: false }).eq("id", deleteTarget.id);
          error = e;
          break;
        }
      }

      if (error) {
        toast.error("Erro ao excluir", { description: error.message });
      } else {
        toast.success(`${deleteTarget.name} excluído com sucesso!`);
        loadData();
      }
    } catch {
      toast.error("Erro inesperado ao excluir");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const getDeleteDialogTitle = () => {
    if (!deleteTarget) return "";
    const typeLabels: Record<string, string> = {
      class: "turma",
      student: "aluno",
      challenge: "desafio",
    };
    return `Excluir ${typeLabels[deleteTarget.type] || "item"}?`;
  };

  const getDeleteDialogDescription = () => {
    if (!deleteTarget) return "";
    return `Você está prestes a excluir "${deleteTarget.name}". Esta ação não pode ser desfeita.`;
  };

  const getStudentCountForClass = (classId: string) => {
    return students.filter(s => s.class_id === classId).length;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  const filteredStudents = selectedClass
    ? students.filter(s => s.class_id === selectedClass)
    : students;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-dungeon-dark text-primary-foreground py-4 px-4 md:px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Sword className="text-gold" size={24} />
              <Shield className="text-gold" size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gold">
                WIT Dungeon
              </h1>
              <p className="text-sm text-primary-foreground/70">
                Painel do Professor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-primary-foreground/80">
              {teacher?.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-fantasy text-center">
            <Users className="mx-auto text-primary mb-2" size={28} />
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-sm text-muted-foreground">Alunos</p>
          </div>
          <div className="card-fantasy text-center">
            <BookOpen className="mx-auto text-primary mb-2" size={28} />
            <p className="text-2xl font-bold">{classes.length}</p>
            <p className="text-sm text-muted-foreground">Turmas</p>
          </div>
          <div className="card-fantasy text-center">
            <Clock className="mx-auto text-gold mb-2" size={28} />
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </div>
          <div className="card-fantasy text-center">
            <Sword className="mx-auto text-destructive mb-2" size={28} />
            <p className="text-2xl font-bold">{challenges.filter(c => c.is_active).length}</p>
            <p className="text-sm text-muted-foreground">Desafios</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "requests", label: "Solicitações", icon: Clock },
            { id: "missions", label: "Missões", icon: Sparkles },
            { id: "titles", label: "Títulos", icon: Award },
            { id: "attendance", label: "Presença", icon: CalendarCheck },
            { id: "classes", label: "Turmas", icon: BookOpen },
            { id: "students", label: "Alunos", icon: Users },
            { id: "challenges", label: "Desafios", icon: Sword },
            { id: "reward", label: "Recompensa", icon: Coins },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "requests" && (
          <section>
            <h2 className="section-title">
              <Clock className="text-gold" />
              Solicitações Pendentes
            </h2>
            {requests.length === 0 ? (
              <div className="card-fantasy text-center py-8 text-muted-foreground">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(request => (
                  <div key={request.id} className="card-fantasy flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          request.request_type === "challenge" 
                            ? "bg-success/10 text-success" 
                            : "bg-primary/10 text-primary"
                        }`}>
                          {request.request_type === "challenge" ? "Desafio" : "Presença"}
                        </span>
                        <span className="font-semibold">
                          {request.student?.character_name || request.student?.name || "Aluno"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.request_type === "challenge" 
                          ? request.challenge?.title 
                          : "Solicitação de presença"}
                      </p>
                      {request.request_type === "challenge" && request.challenge && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gold-dark">
                          <Coins size={14} />
                          +{request.challenge.reward}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveRequest(request)}
                        className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                        title="Aprovar"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Rejeitar"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "classes" && (
          <section>
            <h2 className="section-title">
              <BookOpen className="text-gold" />
              Gerenciar Turmas
            </h2>
            
            <form onSubmit={addClass} className="card-fantasy mb-4 flex gap-3">
              <input
                type="text"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                placeholder="Nome da turma (ex: 7A)"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
              />
              <button type="submit" className="btn-fantasy flex items-center gap-2">
                <Plus size={18} />
                Criar
              </button>
            </form>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => {
                const studentCount = getStudentCountForClass(cls.id);
                return (
                  <div key={cls.id} className="card-fantasy">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-bold text-lg">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {studentCount} {studentCount === 1 ? 'aluno' : 'alunos'}
                        </p>
                      </div>
                      <button
                        onClick={() => openDeleteDialog(
                          "class",
                          cls.id,
                          cls.name,
                          studentCount > 0 ? `Esta turma possui ${studentCount} aluno(s) vinculado(s). Eles também serão removidos.` : undefined
                        )}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Excluir turma"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "students" && (
          <section>
            <h2 className="section-title">
              <Users className="text-gold" />
              Gerenciar Alunos
            </h2>

            <div className="card-fantasy mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedClass || ""}
                  onChange={e => setSelectedClass(e.target.value || null)}
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="">Todas as turmas</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>

                {selectedClass && (
                  <form onSubmit={addStudent} className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={e => setNewStudentName(e.target.value)}
                      placeholder="Nome do aluno"
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                    />
                    <button type="submit" className="btn-fantasy flex items-center gap-2">
                      <Plus size={18} />
                      Adicionar
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {filteredStudents.map(student => (
                <div key={student.id} className="card-fantasy">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ProfilePhoto
                        studentId={student.id}
                        currentPhotoUrl={student.profile_photo_url}
                        onUpdate={() => loadData()}
                        size="sm"
                        editable={false}
                      />
                      <div>
                        <h3 className="font-semibold">
                          {student.character_name || student.name}
                          {student.character_name && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({student.name})
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {classes.find(c => c.id === student.class_id)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Coins className="text-gold" size={18} />
                        <input
                          type="number"
                          value={student.coins}
                          onChange={e => updateStudentCoins(student.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded border border-border text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="text-primary" size={18} />
                        <input
                          type="number"
                          value={student.level}
                          onChange={e => updateStudentLevel(student.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 rounded border border-border text-center"
                          min={1}
                        />
                      </div>
                      <button
                        onClick={() => openDeleteDialog("student", student.id, student.character_name || student.name)}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Excluir aluno"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "challenges" && (
          <section>
            <h2 className="section-title">
              <Sword className="text-gold" />
              Gerenciar Desafios
            </h2>

            <form onSubmit={addChallenge} className="card-fantasy mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newChallengeTitle}
                  onChange={e => setNewChallengeTitle(e.target.value)}
                  placeholder="Título do desafio"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
                <div className="flex items-center gap-2">
                  <Coins className="text-gold" size={18} />
                  <input
                    type="number"
                    value={newChallengeReward}
                    onChange={e => setNewChallengeReward(parseInt(e.target.value) || 10)}
                    className="w-20 px-2 py-2 rounded-lg border-2 border-border bg-background text-center"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newChallengeDesc}
                  onChange={e => setNewChallengeDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
                <select
                  value={newChallengeType}
                  onChange={e => setNewChallengeType(e.target.value as "simples" | "unica")}
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="simples">Repetível</option>
                  <option value="unica">Única</option>
                </select>
                <button type="submit" className="btn-fantasy flex items-center gap-2">
                  <Plus size={18} />
                  Criar
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {challenges.filter(c => c.is_active).map(challenge => (
                <div key={challenge.id} className="card-fantasy flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        challenge.challenge_type === "unica" 
                          ? "bg-amber-500/20 text-amber-400" 
                          : "bg-primary/20 text-primary"
                      }`}>
                        {challenge.challenge_type === "unica" ? "Única" : "Repetível"}
                      </span>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gold-dark font-semibold">
                      <Coins size={18} />
                      +{challenge.reward}
                    </div>
                    <button
                      onClick={() => openDeleteDialog("challenge", challenge.id, challenge.title, "O desafio será removido da lista de desafios disponíveis.")}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Excluir desafio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <section>
            <h2 className="section-title">
              <CalendarCheck className="text-gold" />
              Controle de Presença
            </h2>

            <div className="card-fantasy mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedClass || ""}
                  onChange={e => setSelectedClass(e.target.value || null)}
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="">Todas as turmas</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="card-fantasy text-center py-8 text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map(student => (
                  <div key={student.id} className="card-fantasy">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <ProfilePhoto
                          studentId={student.id}
                          currentPhotoUrl={student.profile_photo_url}
                          onUpdate={() => loadData()}
                          size="sm"
                          editable={false}
                        />
                        <div>
                          <h3 className="font-semibold">
                            {student.character_name || student.name}
                            {student.character_name && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({student.name})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {classes.find(c => c.id === student.class_id)?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarCheck className="text-success" size={16} />
                            <span className="font-semibold text-success">
                              {student.presencas_consecutivas} {student.presencas_consecutivas === 1 ? 'aula consecutiva' : 'aulas consecutivas'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => confirmAttendance(student.id, student.presencas_consecutivas)}
                          className="px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-2 font-semibold"
                          title="Confirmar presença (+1)"
                        >
                          <Check size={18} />
                          Confirmar
                        </button>
                        <button
                          onClick={() => resetAttendance(student.id)}
                          className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-2 font-semibold"
                          title="Marcar falta (zerar)"
                        >
                          <RotateCcw size={18} />
                          Falta
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "missions" && teacher && (
          <section>
            <h2 className="section-title">
              <Sparkles className="text-gold" />
              Missões do Bom Aluno
            </h2>
            <div className="card-fantasy">
              <TeacherMissionsPanel
                teacherId={teacher.id}
                missions={missions}
                completions={missionCompletions}
                students={students}
                onDataChanged={loadData}
              />
            </div>
          </section>
        )}

        {activeTab === "titles" && teacher && (
          <section>
            <h2 className="section-title">
              <Award className="text-gold" />
              Títulos de Reconhecimento
            </h2>
            <div className="card-fantasy">
              <TeacherTitlesPanel
                teacherId={teacher.id}
                students={students}
                classes={classes}
                titles={studentTitles}
                onDataChanged={loadData}
              />
            </div>
          </section>
        )}

        {activeTab === "reward" && teacher && (
          <section>
            <h2 className="section-title">
              <Coins className="text-gold" />
              Configuração de Recompensa
            </h2>
            <div className="card-fantasy max-w-2xl">
              <TeacherRewardSettings teacherId={teacher.id} />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border text-center">
          <DeveloperSignature />
        </footer>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={getDeleteDialogTitle()}
        description={getDeleteDialogDescription()}
        warning={deleteTarget?.warning}
        isLoading={isDeleting}
      />
    </div>
  );
}
