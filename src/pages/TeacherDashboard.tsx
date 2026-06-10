import { useState, useEffect, useRef, useMemo } from "react";
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
import { TeacherGuildMissionsPanel } from "@/components/TeacherGuildMissionsPanel";
import { TeacherPetsPanel } from "@/components/TeacherPetsPanel";
import { TeacherSkillTreePanel } from "@/components/TeacherSkillTreePanel";
import { TeacherCraftPanel } from "@/components/TeacherCraftPanel";
import { TeacherChestPanel } from "@/components/TeacherChestPanel";
import { TeacherAIGenerator } from "@/components/TeacherAIGenerator";
import { TeacherTimeCapsulePanel } from "@/components/TeacherTimeCapsulePanel";
import { TeacherClassWarPanel } from "@/components/TeacherClassWarPanel";
import { TeacherBulkAdjustPanel } from "@/components/TeacherBulkAdjustPanel";
import { TeacherCardProposalsPanel } from "@/components/TeacherCardProposalsPanel";
import type { Class, Student, Challenge, StudentRequest, Mission, MissionCompletion, StudentTitle, ShopItem } from "@/types";
import {
  Users, BookOpen, Clock, LogOut, Coins, Shield, Sword, CalendarCheck,
  Sparkles, Award, UserPlus, ShoppingBag, Loader2, BarChart3, GraduationCap,
  Swords, Users2, Heart, Network, Hammer, Package, BrainCircuit,
  Swords as SwordsIcon, Monitor, Search, Menu, X, ChevronRight, Settings2,
  ShieldAlert, Crown,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

type TabId =
  | "bulk" | "requests" | "pending" | "shop" | "classes" | "students" | "challenges"
  | "attendance" | "missions" | "titles" | "reward" | "classroom" | "bosses"
  | "guilds" | "guild-missions" | "pets" | "skills" | "craft" | "chests" | "ia"
  | "capsule" | "classwar" | "cards";

interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: number;
  accent?: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function TeacherDashboard() {
  const { teacher, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState<TabId>("requests");
  const [classes,      setClasses]      = useState<Class[]>([]);
  const [students,     setStudents]     = useState<Student[]>([]);
  const [challenges,   setChallenges]   = useState<Challenge[]>([]);
  const [requests,     setRequests]     = useState<StudentRequest[]>([]);
  const [missions,     setMissions]     = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [shopItems,    setShopItems]    = useState<ShopItem[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [navSearch,    setNavSearch]    = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadDataRef = useRef(loadData);
  useEffect(() => { loadDataRef.current = loadData; });

  useEffect(() => {
    if (!authLoading && !teacher) navigate("/professor/login");
  }, [authLoading, teacher, navigate]);

  useEffect(() => {
    if (teacher) loadData();
  }, [teacher]);

  async function loadData() {
    if (!teacher) return;
    if (!hasLoadedOnce) setIsLoading(true);

    try {
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

      if (!classesError && classesData) setClasses(classesData);
      if (!challengesError) setChallenges((challengesData || []) as Challenge[]);
      if (!studentsError && studentsData) setStudents(studentsData);
      if (!missionsError) setMissions((missionsData || []) as Mission[]);
      if (shopData) setShopItems(shopData as unknown as ShopItem[]);

      const studentIds = new Set((studentsData || students).map(s => s.id));
      setMissionCompletions(((completionsData || []) as MissionCompletion[]).filter(c => studentIds.has(c.student_id!)));
      setStudentTitles(((titlesData || []) as StudentTitle[]).filter(t => studentIds.has(t.student_id!)));

      const { data: requestsData } = await supabase
        .from("student_requests").select("*").eq("status", "pending").order("created_at", { ascending: false });

      const currentStudents   = studentsData || students;
      const currentChallenges = (challengesData || challenges) as Challenge[];
      const enrichedRequests  = (requestsData || [])
        .filter(req => studentIds.has(req.student_id!))
        .map(req => {
          const student   = currentStudents.find(s => s.id === req.student_id);
          const challenge = currentChallenges.find(c => c.id === req.challenge_id);
          return { ...req, student, challenge } as StudentRequest;
        })
        .filter(req => req.request_type === "challenge" || req.request_type === "attendance");
      setRequests(enrichedRequests);

      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Error loading data:", error);
      if (hasLoadedOnce) {
        toast.error("Erro ao atualizar dados. Os dados exibidos podem estar desatualizados.");
      } else {
        toast.error("Erro ao carregar dados. Tente recarregar a página.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!teacher) return;
    const channel = supabase
      .channel(`teacher-updates-${teacher.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, () => loadDataRef.current())
      .on("postgres_changes", { event: "*", schema: "public", table: "students" },         () => loadDataRef.current())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teacher]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/professor/login");
  };

  const pendingStudents = useMemo(() => students.filter(s => s.status === "pending"), [students]);
  const activeStudents  = useMemo(() => students.filter(s => s.status !== "pending"), [students]);

  const NAV_GROUPS: NavGroup[] = useMemo(() => [
    {
      label: "Gestão",
      items: [
        { id: "requests",   label: "Solicitações",  icon: Clock,         description: "Aprovar ou recusar pedidos pendentes dos alunos (desafios e presença)", badge: requests.length, accent: "gold" },
        { id: "pending",    label: "Pendentes",     icon: UserPlus,      description: "Alunos que se cadastraram e aguardam aprovação para entrar na turma",     badge: pendingStudents.length, accent: "gold" },
        { id: "students",   label: "Alunos",        icon: Users,         description: "Lista de alunos: editar moedas, nível, atributos e ver inventário individual" },
        { id: "bulk",       label: "Ajustes em Lote", icon: Settings2,   description: "Ajuste retroativo: edite moedas, nível, pontos e itens de vários alunos de uma vez", accent: "cyan" },
        { id: "classes",    label: "Turmas",        icon: BookOpen,      description: "Criar, renomear ou excluir turmas" },
        { id: "attendance", label: "Presença",      icon: CalendarCheck, description: "Marcar presença em massa por dia/turma" },
      ],
    },
    {
      label: "Conteúdo",
      items: [
        { id: "missions",   label: "Missões",   icon: Sparkles, description: "Missões do bom aluno — aprovar conclusões e dar recompensas" },
        { id: "challenges", label: "Desafios",  icon: Sword,    description: "Tarefas pontuais que valem moedas quando aprovadas" },
        { id: "bosses",     label: "Bosses",    icon: Swords,   description: "Batalhas de boss em grupo com perguntas que dão dano" },
        { id: "skills",     label: "Skills",    icon: Network,  description: "Árvores de habilidade para os alunos progredirem" },
        { id: "craft",      label: "Craft",     icon: Hammer,   description: "Receitas que combinam itens em recompensas" },
      ],
    },
    {
      label: "Economia",
      items: [
        { id: "shop",   label: "Loja",       icon: ShoppingBag, description: "Itens disponíveis para os alunos comprarem com moedas" },
        { id: "cards",  label: "Cartas dos Campeões", icon: Crown, description: "Aprovar ou recusar cartas propostas pelos Top 1 da semana", accent: "gold" },
        { id: "chests", label: "Baús",       icon: Package,     description: "Baús com drops aleatórios — definir tier, custo e taxas de drop" },
        { id: "reward", label: "Recompensa", icon: Coins,       description: "Configurar quanto vale uma presença / missão padrão" },
        { id: "pets",   label: "Pets",       icon: Heart,       description: "Pets adotáveis pelos alunos com bônus passivos" },
      ],
    },
    {
      label: "Social",
      items: [
        { id: "guilds",         label: "Guildas",            icon: Users2, description: "Grupos de alunos com mural compartilhado" },
        { id: "guild-missions", label: "Missões de Guilda",  icon: Shield, description: "Missões cooperativas entre membros de uma guilda" },
        { id: "titles",         label: "Títulos",            icon: Award,  description: "Distinções temporárias (ex: Ajudante da Semana)" },
      ],
    },
    {
      label: "IA & Extras",
      items: [
        { id: "ia",       label: "Gerador IA", icon: BrainCircuit, description: "Gera missões, desafios e itens automaticamente com IA" },
        { id: "capsule",  label: "Cápsulas",   icon: Clock,        description: "Mensagens com data programada para os alunos" },
        { id: "classwar", label: "Class War",  icon: SwordsIcon,   description: "Disputa entre turmas por pontuação acumulada" },
      ],
    },
    {
      label: "Integrações",
      items: [
        { id: "classroom", label: "Classroom", icon: GraduationCap, description: "Sincronizar turmas e alunos do Google Classroom" },
      ],
    },
  ], [requests.length, pendingStudents.length]);

  const filteredGroups = useMemo(() => {
    const q = navSearch.trim().toLowerCase();
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS
      .map(g => ({ ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [NAV_GROUPS, navSearch]);

  const activeItem: NavItem | undefined = useMemo(() => {
    for (const g of NAV_GROUPS) for (const i of g.items) if (i.id === activeTab) return i;
    return undefined;
  }, [NAV_GROUPS, activeTab]);

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

  // ─── Layout ─────────────────────────────────────────────────────────────────

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="flex items-center gap-1">
          <Sword className="text-gold" size={18} />
          <Shield className="text-gold" size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-gold leading-tight truncate">WIT Dungeon</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Painel do Professor</p>
        </div>
      </div>

      {/* Admin shortcut — only visible to is_admin teachers */}
      {teacher?.is_admin && (
        <div className="px-3 pt-3">
          <button
            onClick={() => navigate("/professor/admin")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-red-500/15 to-red-500/5 border border-red-500/40 hover:border-red-500/70 hover:from-red-500/25 transition-all group"
          >
            <ShieldAlert size={16} className="text-red-400 group-hover:text-red-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-300 group-hover:text-red-200">Painel Admin</span>
            <ChevronRight size={14} className="ml-auto text-red-400/60 group-hover:text-red-300" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/40 border border-border focus-within:border-cyan-400/50">
          <Search size={13} className="text-muted-foreground" />
          <input
            type="text"
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            placeholder="Buscar seção..."
            className="bg-transparent text-xs outline-none flex-1 placeholder:text-muted-foreground/60"
          />
          {navSearch && (
            <button onClick={() => setNavSearch("")} className="text-muted-foreground hover:text-foreground">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {filteredGroups.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Nada encontrado</p>
        )}
        {filteredGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  active={activeTab === item.id}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          <span className="text-foreground/80">{teacher?.name}</span>
        </div>
        <FooterBtn icon={Monitor}   label="Modo Apresentação" onClick={() => navigate("/professor/apresentacao")} accent="purple" />
        <FooterBtn icon={BarChart3} label="Analytics"          onClick={() => navigate("/professor/analytics")}    accent="gold" />
        <FooterBtn icon={isLoggingOut ? Loader2 : LogOut} label={isLoggingOut ? "Saindo..." : "Sair"}
                   onClick={handleLogout} disabled={isLoggingOut} accent="red"
                   spinIcon={isLoggingOut} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/40 backdrop-blur-sm sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (drawer) */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="relative flex flex-col w-72 max-w-[85vw] border-r border-border bg-card h-full" onClick={e => e.stopPropagation()}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/85 backdrop-blur-md flex items-center gap-3 px-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-1.5 rounded hover:bg-secondary"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          {activeItem && (
            <>
              <activeItem.icon size={16} className="text-cyan-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-semibold leading-tight truncate">{activeItem.label}</h1>
                <p className="text-[11px] text-muted-foreground leading-tight truncate hidden sm:block">{activeItem.description}</p>
              </div>
            </>
          )}
          {/* Quick stats */}
          <div className="hidden lg:flex items-center gap-1 ml-auto">
            <StatChip icon={Users}   label="Alunos"     value={activeStudents.length}                                      tone="cyan" />
            <StatChip icon={BookOpen} label="Turmas"     value={classes.length}                                            tone="cyan" />
            <StatChip icon={Clock}    label="Pendentes" value={requests.length}                                            tone={requests.length > 0 ? "gold" : "muted"} />
            <StatChip icon={Sword}    label="Desafios"   value={challenges.filter(c => c.is_active).length}                tone="muted" />
          </div>
        </header>

        {/* Mobile description */}
        {activeItem && (
          <div className="sm:hidden px-4 py-2 border-b border-border bg-card/30 text-[11px] text-muted-foreground">
            {activeItem.description}
          </div>
        )}

        <main className="flex-1 overflow-x-hidden px-4 sm:px-6 py-5 max-w-[1400px] w-full mx-auto">
          {/* Mobile stats */}
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <MiniStat icon={Users}    label="Alunos"     value={activeStudents.length}                       tone="cyan" />
            <MiniStat icon={BookOpen} label="Turmas"     value={classes.length}                              tone="cyan" />
            <MiniStat icon={Clock}    label="Pendentes" value={requests.length}                              tone={requests.length > 0 ? "gold" : "muted"} />
            <MiniStat icon={Sword}    label="Desafios"   value={challenges.filter(c => c.is_active).length}  tone="muted" />
          </div>

          {/* Tab content (logic untouched — only the wrapper changes) */}
          {activeTab === "bulk" && teacher && (
            <TeacherBulkAdjustPanel
              teacherId={teacher.id}
              students={activeStudents}
              classes={classes}
              shopItems={shopItems}
              onDataChanged={loadData}
            />
          )}

          {activeTab === "requests" && (
            <TeacherRequestsPanel requests={requests} onDataChanged={loadData} />
          )}

          {activeTab === "pending" && (
            <div className="card-fantasy">
              <TeacherPendingStudentsPanel
                pendingStudents={pendingStudents}
                allStudents={activeStudents}
                classes={classes}
                onDataChanged={loadData}
              />
            </div>
          )}

          {activeTab === "classes" && (
            <TeacherClassesPanel teacherId={teacher!.id} classes={classes} students={students} onDataChanged={loadData} />
          )}

          {activeTab === "students" && (
            <TeacherStudentsPanel teacherId={teacher!.id} students={activeStudents} classes={classes} onDataChanged={loadData} />
          )}

          {activeTab === "challenges" && (
            <TeacherChallengesPanel teacherId={teacher!.id} challenges={challenges} onDataChanged={loadData} />
          )}

          {activeTab === "attendance" && (
            <TeacherAttendancePanel students={activeStudents} classes={classes} onDataChanged={loadData} />
          )}

          {activeTab === "shop" && teacher && (
            <div className="card-fantasy">
              <TeacherShopPanel teacherId={teacher.id} items={shopItems} onDataChanged={loadData} />
            </div>
          )}

          {activeTab === "missions" && teacher && (
            <div className="card-fantasy">
              <TeacherMissionsPanel
                teacherId={teacher.id}
                missions={missions}
                completions={missionCompletions}
                students={students}
                onDataChanged={loadData}
              />
            </div>
          )}

          {activeTab === "titles" && teacher && (
            <div className="card-fantasy">
              <TeacherTitlesPanel teacherId={teacher.id} students={students} classes={classes} titles={studentTitles} onDataChanged={loadData} />
            </div>
          )}

          {activeTab === "reward" && teacher && (
            <div className="card-fantasy max-w-2xl">
              <TeacherRewardSettings teacherId={teacher.id} />
            </div>
          )}

          {activeTab === "classroom" && teacher && (
            <div className="card-fantasy max-w-2xl">
              <GoogleClassroomSync teacherId={teacher.id} onDataChanged={loadData} />
            </div>
          )}

          {activeTab === "bosses" && teacher && (
            <div className="card-fantasy">
              <TeacherBossPanel teacherId={teacher.id} classes={classes} onDataChanged={loadData} />
            </div>
          )}

          {activeTab === "guilds" && teacher && (
            <div className="card-fantasy">
              <TeacherGuildPanel teacherId={teacher.id} students={students} classes={classes} />
            </div>
          )}

          {activeTab === "guild-missions" && teacher && (
            <div className="card-fantasy">
              <TeacherGuildMissionsPanel teacherId={teacher.id} />
            </div>
          )}

          {activeTab === "chests" && teacher && (
            <TeacherChestPanel teacherId={teacher.id} />
          )}

          {activeTab === "pets" && teacher && (
            <TeacherPetsPanel teacherId={teacher.id} />
          )}

          {activeTab === "skills" && teacher && (
            <TeacherSkillTreePanel teacherId={teacher.id} />
          )}

          {activeTab === "craft" && teacher && (
            <TeacherCraftPanel teacherId={teacher.id} shopItems={shopItems} />
          )}

          {activeTab === "ia" && teacher && (
            <div className="card-fantasy max-w-3xl">
              <TeacherAIGenerator teacherId={teacher.id} classes={classes} onDataChanged={loadData} />
            </div>
          )}

          {activeTab === "capsule" && teacher && (
            <div className="card-fantasy max-w-3xl">
              <TeacherTimeCapsulePanel teacherId={teacher.id} classes={classes} />
            </div>
          )}

          {activeTab === "classwar" && teacher && (
            <div className="card-fantasy max-w-3xl">
              <TeacherClassWarPanel teacherId={teacher.id} classes={classes} />
            </div>
          )}

          {activeTab === "cards" && teacher && (
            <TeacherCardProposalsPanel teacherId={teacher.id} />
          )}

          <footer className="mt-10 pt-4 border-t border-border text-center">
            <DeveloperSignature />
          </footer>
        </main>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function NavItemButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const accentColor = item.accent === "gold"   ? "#facc15"
                    : item.accent === "cyan"   ? "#22d3ee"
                    : "currentColor";

  return (
    <button
      onClick={onClick}
      title={item.description}
      className={`group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-all relative ${
        active
          ? "bg-cyan-400/10 text-cyan-100"
          : "text-foreground/75 hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-cyan-400" />
      )}
      <Icon size={14} style={{ color: active ? "#22d3ee" : accentColor }} className="flex-shrink-0" />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
          style={{
            background: item.accent === "gold" ? "rgba(250,204,21,0.18)" : "rgba(34,211,238,0.18)",
            color:      item.accent === "gold" ? "#fde047"               : "#67e8f9",
          }}
        >
          {item.badge}
        </span>
      )}
      {active && <ChevronRight size={11} className="text-cyan-400/60" />}
    </button>
  );
}

function FooterBtn({
  icon: Icon, label, onClick, disabled, accent, spinIcon,
}: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; accent?: "purple" | "gold" | "red"; spinIcon?: boolean }) {
  const colors = {
    purple: { bg: "rgba(168,85,247,0.08)", hover: "rgba(168,85,247,0.15)", text: "#c4b5fd" },
    gold:   { bg: "rgba(250,204,21,0.08)", hover: "rgba(250,204,21,0.15)", text: "#fde047" },
    red:    { bg: "rgba(239,68,68,0.08)",  hover: "rgba(239,68,68,0.15)",  text: "#fca5a5" },
  };
  const c = colors[accent || "purple"];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50"
      style={{ background: c.bg, color: c.text }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={e => { e.currentTarget.style.background = c.bg; }}
    >
      <Icon size={13} className={spinIcon ? "animate-spin" : ""} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatChip({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: "cyan" | "gold" | "muted" }) {
  const styles = {
    cyan:   { color: "#67e8f9", bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)" },
    gold:   { color: "#fde047", bg: "rgba(250,204,21,0.1)",   border: "rgba(250,204,21,0.3)" },
    muted:  { color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" },
  };
  const s = styles[tone];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
         style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <Icon size={11} />
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: "cyan" | "gold" | "muted" }) {
  const styles = {
    cyan:   { color: "#67e8f9", bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.18)" },
    gold:   { color: "#fde047", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)" },
    muted:  { color: "#94a3b8", bg: "rgba(148,163,184,0.04)", border: "rgba(148,163,184,0.12)" },
  };
  const s = styles[tone];
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-md"
         style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <Icon size={16} style={{ color: s.color }} />
      <div className="min-w-0">
        <p className="text-base font-bold leading-none" style={{ color: s.color }}>{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
