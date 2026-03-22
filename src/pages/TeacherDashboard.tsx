import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { TeacherMissionsPanel } from "@/components/TeacherMissionsPanel";
import { TeacherTitlesPanel } from "@/components/TeacherTitlesPanel";
import { TeacherRewardSettings } from "@/components/TeacherRewardSettings";
import { TeacherRequestsPanel } from "@/components/TeacherRequestsPanel";
import { TeacherClassesPanel } from "@/components/TeacherClassesPanel";
import { TeacherStudentsPanel } from "@/components/TeacherStudentsPanel";
import { TeacherChallengesPanel } from "@/components/TeacherChallengesPanel";
import { TeacherAttendancePanel } from "@/components/TeacherAttendancePanel";
import { TeacherPendingStudentsPanel } from "@/components/TeacherPendingStudentsPanel";
import { TeacherShopPanel } from "@/components/TeacherShopPanel";
import { GoogleClassroomSync } from "@/components/GoogleClassroomSync";
import { TeacherBossPanel } from "@/components/TeacherBossPanel";
import { TeacherGuildPanel } from "@/components/TeacherGuildPanel";
import type { Class, Student, Challenge, StudentRequest, Mission, MissionCompletion, StudentTitle, ShopItem } from "@/types";
import {
  Users,
  BookOpen,
  Clock,
  LogOut,
  Coins,
  Shield,
  Sword,
  CalendarCheck,
  Sparkles,
  Award,
  UserPlus,
  ShoppingBag,
  Loader2,
  BarChart3,
  GraduationCap,
  Swords,
  Users2,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { teacher, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"requests" | "pending" | "shop" | "classes" | "students" | "challenges" | "attendance" | "missions" | "titles" | "reward" | "classroom" | "bosses" | "guilds">("requests");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ref always points to the latest loadData, so realtime subscriptions never capture a stale version
  const loadDataRef = useRef(loadData);
  useEffect(() => { loadDataRef.current = loadData; });

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

  async function loadData() {
    if (!teacher) return;

    // Only show full-page spinner on first load
    if (!hasLoadedOnce) {
      setIsLoading(true);
    }

    try {
      // ALL queries explicitly filter by teacher.id for strict isolation
      const [
        { data: classesData, error: classesError },
        { data: challengesData, error: challengesError },
        { data: studentsData, error: studentsError },
        { data: missionsData, error: missionsError },
        { data: completionsData },
        { data: titlesData },
        { data: shopData },
      ] = await Promise.all([
        supabase.from("classes").select("*").eq("teacher_id", teacher.id).order("name"),
        supabase.from("challenges").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }),
        supabase.from("students").select("*").eq("teacher_id", teacher.id).order("name"),
        supabase.from("student_missions").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }),
        supabase.from("mission_completions").select("*").order("created_at", { ascending: false }),
        supabase.from("student_titles").select("*").order("assigned_at", { ascending: false }),
        supabase.from("shop_items").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }),
      ]);

      // Only update state if queries succeeded - never clear data on error
      if (!classesError && classesData) setClasses(classesData);
      if (!challengesError) setChallenges((challengesData || []) as Challenge[]);
      if (!studentsError && studentsData) setStudents(studentsData);
      if (!missionsError) setMissions((missionsData || []) as Mission[]);
      if (shopData) setShopItems(shopData as unknown as ShopItem[]);

      // Filter completions to only students belonging to this teacher
      const studentIds = new Set((studentsData || students).map(s => s.id));
      setMissionCompletions(
        ((completionsData || []) as MissionCompletion[]).filter(c => studentIds.has(c.student_id!))
      );
      setStudentTitles(
        ((titlesData || []) as StudentTitle[]).filter(t => studentIds.has(t.student_id!))
      );

      // Load pending requests filtered to this teacher's students
      const { data: requestsData } = await supabase
        .from("student_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Enrich with student + challenge data, filter to teacher's students
      const currentStudents = studentsData || students;
      const currentChallenges = (challengesData || challenges) as Challenge[];
      const enrichedRequests = (requestsData || [])
        .filter(req => studentIds.has(req.student_id!))
        .map(req => {
          const student = currentStudents.find(s => s.id === req.student_id);
          const challenge = currentChallenges.find(c => c.id === req.challenge_id);
          return { ...req, student, challenge } as StudentRequest;
        })
        .filter(req => req.request_type === "challenge" || req.request_type === "attendance");
      setRequests(enrichedRequests);

      setHasLoadedOnce(true);

    } catch (error) {
      console.error("Error loading data:", error);
      // Only show error toast, NEVER clear existing data
      if (hasLoadedOnce) {
        toast.error("Erro ao atualizar dados. Os dados exibidos podem estar desatualizados.");
      } else {
        toast.error("Erro ao carregar dados. Tente recarregar a página.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Subscribe to realtime updates
  useEffect(() => {
    if (!teacher) return;

    const channel = supabase
      .channel(`teacher-updates-${teacher.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, () => {
        loadDataRef.current();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        loadDataRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacher]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/professor/login");
  };

  if (authLoading || (isLoading && !hasLoadedOnce)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  const pendingStudents = students.filter(s => s.status === "pending");
  const activeStudents = students.filter(s => s.status !== "pending");

  const TABS = [
    { id: "requests",   label: "Solicitações", icon: Clock },
    { id: "pending",    label: "Pendentes",    icon: UserPlus, badge: pendingStudents.length },
    { id: "shop",       label: "Loja",          icon: ShoppingBag },
    { id: "missions",   label: "Missões",       icon: Sparkles },
    { id: "titles",     label: "Títulos",       icon: Award },
    { id: "attendance", label: "Presença",      icon: CalendarCheck },
    { id: "classes",    label: "Turmas",        icon: BookOpen },
    { id: "students",   label: "Alunos",        icon: Users },
    { id: "challenges", label: "Desafios",      icon: Sword },
    { id: "reward",     label: "Recompensa",    icon: Coins },
    { id: "classroom",  label: "Classroom",     icon: GraduationCap },
    { id: "bosses",     label: "Boss Battles",  icon: Swords },
    { id: "guilds",     label: "Guildas",       icon: Users2 },
  ] as const;

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
              <h1 className="font-display text-xl font-bold text-gold">WIT Dungeon</h1>
              <p className="text-sm text-primary-foreground/70">Painel do Professor</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-primary-foreground/80">{teacher?.name}</span>
            <button
              onClick={() => navigate("/professor/analytics")}
              className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 transition-colors"
              title="Analytics"
            >
              <BarChart3 size={20} className="text-gold" />
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors disabled:opacity-50"
              title="Sair"
            >
              {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-fantasy text-center">
            <Users className="mx-auto text-primary mb-2" size={28} />
            <p className="text-2xl font-bold">{activeStudents.length}</p>
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
          {TABS.map(({ id, label, icon: Icon, ...rest }) => {
            const badge = "badge" in rest ? (rest as { badge: number }).badge : 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "requests" && (
          <section>
            <h2 className="section-title">
              <Clock className="text-gold" />
              Solicitações Pendentes
            </h2>
            <TeacherRequestsPanel requests={requests} onDataChanged={loadData} />
          </section>
        )}

        {activeTab === "pending" && (
          <section>
            <h2 className="section-title">
              <UserPlus className="text-gold" />
              Alunos Aguardando Aprovação
            </h2>
            <div className="card-fantasy">
              <TeacherPendingStudentsPanel
                pendingStudents={pendingStudents}
                allStudents={activeStudents}
                classes={classes}
                onDataChanged={loadData}
              />
            </div>
          </section>
        )}

        {activeTab === "classes" && (
          <section>
            <h2 className="section-title">
              <BookOpen className="text-gold" />
              Gerenciar Turmas
            </h2>
            <TeacherClassesPanel
              teacherId={teacher!.id}
              classes={classes}
              students={students}
              onDataChanged={loadData}
            />
          </section>
        )}

        {activeTab === "students" && (
          <section>
            <h2 className="section-title">
              <Users className="text-gold" />
              Gerenciar Alunos
            </h2>
            <TeacherStudentsPanel
              teacherId={teacher!.id}
              students={activeStudents}
              classes={classes}
              onDataChanged={loadData}
            />
          </section>
        )}

        {activeTab === "challenges" && (
          <section>
            <h2 className="section-title">
              <Sword className="text-gold" />
              Gerenciar Desafios
            </h2>
            <TeacherChallengesPanel
              teacherId={teacher!.id}
              challenges={challenges}
              onDataChanged={loadData}
            />
          </section>
        )}

        {activeTab === "attendance" && (
          <section>
            <h2 className="section-title">
              <CalendarCheck className="text-gold" />
              Controle de Presença
            </h2>
            <TeacherAttendancePanel
              students={activeStudents}
              classes={classes}
              onDataChanged={loadData}
            />
          </section>
        )}

        {activeTab === "shop" && teacher && (
          <section>
            <h2 className="section-title">
              <ShoppingBag className="text-gold" />
              Loja de Itens
            </h2>
            <div className="card-fantasy">
              <TeacherShopPanel
                teacherId={teacher.id}
                items={shopItems}
                onDataChanged={loadData}
              />
            </div>
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

        {activeTab === "classroom" && teacher && (
          <section>
            <h2 className="section-title">
              <GraduationCap className="text-gold" />
              Google Classroom
            </h2>
            <div className="card-fantasy max-w-2xl">
              <GoogleClassroomSync teacherId={teacher.id} onDataChanged={loadData} />
            </div>
          </section>
        )}

        {activeTab === "bosses" && teacher && (
          <section>
            <h2 className="section-title">
              <Swords className="text-red-400" />
              Boss Battles
            </h2>
            <div className="card-fantasy">
              <TeacherBossPanel teacherId={teacher.id} classes={classes} onDataChanged={loadData} />
            </div>
          </section>
        )}

        {activeTab === "guilds" && teacher && (
          <section>
            <h2 className="section-title">
              <Users2 className="text-purple-400" />
              Guildas
            </h2>
            <div className="card-fantasy">
              <TeacherGuildPanel teacherId={teacher.id} students={students} classes={classes} />
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border text-center">
          <DeveloperSignature />
        </footer>
      </main>
    </div>
  );
}
