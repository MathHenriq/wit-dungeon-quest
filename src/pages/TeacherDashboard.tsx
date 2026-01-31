import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  BookOpen, 
  ShoppingBag, 
  Clock, 
  LogOut, 
  Plus,
  Check,
  X,
  Coins,
  TrendingUp,
  Trash2,
  Shield,
  Sword
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
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  is_active: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  min_level: number;
  item_type: string;
  icon: string;
  is_active: boolean;
}

interface StudentRequest {
  id: string;
  student_id: string;
  request_type: "challenge" | "item";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  student?: Student;
  challenge?: Challenge;
  shop_item?: ShopItem;
}

export default function TeacherDashboard() {
  const { teacher, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"requests" | "classes" | "students" | "challenges" | "shop">("requests");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDesc, setNewChallengeDesc] = useState("");
  const [newChallengeReward, setNewChallengeReward] = useState(10);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemCost, setNewItemCost] = useState(10);
  const [newItemLevel, setNewItemLevel] = useState(1);
  const [newItemType, setNewItemType] = useState("weapon");
  const [newItemIcon, setNewItemIcon] = useState("⚔️");

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
      // Load classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      setClasses(classesData || []);

      // Load challenges
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });
      setChallenges(challengesData || []);

      // Load shop items
      const { data: itemsData } = await supabase
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false });
      setShopItems(itemsData || []);

      // Load students
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("name");
      setStudents(studentsData || []);

      // Load pending requests with related data
      const { data: requestsData } = await supabase
        .from("student_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      // Enrich requests with student, challenge, and item data
      const enrichedRequests = (requestsData || []).map(req => {
        const student = studentsData?.find(s => s.id === req.student_id);
        const challenge = challengesData?.find(c => c.id === req.challenge_id);
        const shop_item = itemsData?.find(i => i.id === req.item_id);
        return { ...req, student, challenge, shop_item } as StudentRequest;
      });
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
    if (!selectedClass || !newStudentName.trim()) return;

    const { error } = await supabase.from("students").insert({
      class_id: selectedClass,
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

    const { error } = await supabase.from("challenges").insert({
      teacher_id: teacher.id,
      title: newChallengeTitle.trim(),
      description: newChallengeDesc.trim() || null,
      reward: newChallengeReward,
    });

    if (error) {
      toast.error("Erro ao criar desafio", { description: error.message });
    } else {
      toast.success("Desafio criado!");
      setNewChallengeTitle("");
      setNewChallengeDesc("");
      setNewChallengeReward(10);
      loadData();
    }
  };

  const addShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !newItemName.trim()) return;

    const { error } = await supabase.from("shop_items").insert({
      teacher_id: teacher.id,
      name: newItemName.trim(),
      description: newItemDesc.trim() || null,
      cost: newItemCost,
      min_level: newItemLevel,
      item_type: newItemType,
      icon: newItemIcon,
    });

    if (error) {
      toast.error("Erro ao criar item", { description: error.message });
    } else {
      toast.success("Item criado!");
      setNewItemName("");
      setNewItemDesc("");
      setNewItemCost(10);
      setNewItemLevel(1);
      loadData();
    }
  };

  const approveRequest = async (request: StudentRequest) => {
    if (!teacher) return;

    // First approve the request
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

    // Then update student coins if it's a challenge
    if (request.request_type === "challenge" && request.challenge && request.student) {
      await supabase
        .from("students")
        .update({ coins: request.student.coins + request.challenge.reward })
        .eq("id", request.student_id);
    }

    // Or deduct coins if it's an item purchase
    if (request.request_type === "item" && request.shop_item && request.student) {
      await supabase
        .from("students")
        .update({ coins: request.student.coins - request.shop_item.cost })
        .eq("id", request.student_id);
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
      toast.error("Erro ao atualizar moedas");
    } else {
      toast.success("Moedas atualizadas!");
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
            { id: "classes", label: "Turmas", icon: BookOpen },
            { id: "students", label: "Alunos", icon: Users },
            { id: "challenges", label: "Desafios", icon: Sword },
            { id: "shop", label: "Loja", icon: ShoppingBag },
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
                          {request.request_type === "challenge" ? "Desafio" : "Item"}
                        </span>
                        <span className="font-semibold">
                          {request.student?.character_name || request.student?.name || "Aluno"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.request_type === "challenge" 
                          ? request.challenge?.title 
                          : request.shop_item?.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gold-dark">
                        <Coins size={14} />
                        {request.request_type === "challenge" 
                          ? `+${request.challenge?.reward}` 
                          : `-${request.shop_item?.cost}`}
                      </div>
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
              {classes.map(cls => (
                <div key={cls.id} className="card-fantasy">
                  <h3 className="font-display font-bold text-lg">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {students.filter(s => s.class_id === cls.id).length} alunos
                  </p>
                </div>
              ))}
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
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newChallengeDesc}
                  onChange={e => setNewChallengeDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
                <button type="submit" className="btn-fantasy flex items-center gap-2">
                  <Plus size={18} />
                  Criar
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {challenges.map(challenge => (
                <div key={challenge.id} className="card-fantasy flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{challenge.title}</h3>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gold-dark font-semibold">
                    <Coins size={18} />
                    +{challenge.reward}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "shop" && (
          <section>
            <h2 className="section-title">
              <ShoppingBag className="text-gold" />
              Gerenciar Loja
            </h2>

            <form onSubmit={addShopItem} className="card-fantasy mb-4 space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="Nome do item"
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
                <select
                  value={newItemType}
                  onChange={e => setNewItemType(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="weapon">Arma</option>
                  <option value="armor">Armadura</option>
                  <option value="ability">Habilidade</option>
                </select>
                <div className="flex items-center gap-2">
                  <Coins className="text-gold flex-shrink-0" size={18} />
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={e => setNewItemCost(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-2 rounded-lg border-2 border-border bg-background text-center"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Nível</span>
                  <input
                    type="number"
                    value={newItemLevel}
                    onChange={e => setNewItemLevel(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-2 rounded-lg border-2 border-border bg-background text-center"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newItemIcon}
                  onChange={e => setNewItemIcon(e.target.value)}
                  placeholder="Ícone (emoji)"
                  className="w-20 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none text-center text-2xl"
                />
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
                <button type="submit" className="btn-fantasy flex items-center gap-2">
                  <Plus size={18} />
                  Criar
                </button>
              </div>
            </form>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.map(item => (
                <div key={item.id} className="card-fantasy">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {item.item_type === "weapon" ? "Arma" : item.item_type === "armor" ? "Armadura" : "Habilidade"}
                    </span>
                  </div>
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gold-dark font-semibold">
                      <Coins size={14} />
                      {item.cost}
                    </span>
                    <span className="text-muted-foreground">Nível {item.min_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
