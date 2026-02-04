import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { TeacherMissionsPanel } from "@/components/TeacherMissionsPanel";
import { TeacherTitlesPanel } from "@/components/TeacherTitlesPanel";
import { TitleType } from "@/components/StudentTitleBadge";
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
  Sword,
  Image,
  Link as LinkIcon,
  CalendarCheck,
  RotateCcw,
  Package,
  Minus,
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
  image_url: string | null;
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
  shop_item?: ShopItem;
}

interface InventoryRecord {
  id: string;
  student_id: string;
  item_id: string;
  item?: ShopItem;
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

  const [activeTab, setActiveTab] = useState<"requests" | "classes" | "students" | "challenges" | "shop" | "attendance" | "inventory" | "missions" | "titles">("requests");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [missions, setMissions] = useState<StudentMission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudentForInventory, setSelectedStudentForInventory] = useState<string | null>(null);
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
  const [newItemImage, setNewItemImage] = useState("");
  const [isCreatingItem, setIsCreatingItem] = useState(false);

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; warning?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizeHttpUrl = (value: string): string | null => {
    if (!value || typeof value !== "string") return null;
    let trimmed = value.trim();

    // Common copy/paste cases
    if (trimmed.startsWith("//")) trimmed = `https:${trimmed}`;
    if (/^www\./i.test(trimmed)) trimmed = `https://${trimmed}`;

    // Replace spaces (URL() rejects them). This keeps the UX forgiving.
    const candidate = trimmed.replace(/\s+/g, "%20");

    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url.toString();
    } catch {
      return null;
    }
  };

  const withTimeout = async <T,>(promiseLike: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
    });
    try {
      // supabase-js returns thenables (Postgrest builders), not real Promises.
      // Promise.resolve() safely converts thenables into proper Promises.
      const promise = Promise.resolve(promiseLike as any) as Promise<T>;
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const mapItemTypeToDb = (value: string) => {
    // Normalize UI values/labels to what the backend expects.
    // Must never block creation.
    const normalized = value?.toString().trim().toLowerCase();
    switch (normalized) {
      case "weapon":
      case "arma":
        return "weapon";
      case "armor":
      case "armadura":
        return "armor";
      case "consumable":
      case "consumível":
      case "consumivel":
        return "consumable";
      default:
        return "item";
    }
  };

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

      // Load shop items (keep ALL for enrichment, but only show active in shop list)
      const { data: itemsData } = await supabase
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false });
      const allItems = (itemsData || []) as ShopItem[];
      setShopItems(allItems.filter((i) => i.is_active));

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
         const shop_item = allItems?.find(i => i.id === req.item_id);
        return { ...req, student, challenge, shop_item } as StudentRequest;
      });
      setRequests(enrichedRequests);

      // Load inventory records
      const { data: inventoryData } = await supabase
        .from("student_inventory")
        .select("*")
        .order("added_at", { ascending: false });
      
      // Enrich inventory with item data
      const enrichedInventory = (inventoryData || []).map(inv => {
        const item = allItems?.find(i => i.id === inv.item_id);
        return { ...inv, item } as InventoryRecord;
      });
      setInventoryRecords(enrichedInventory);

      // Load missions
      const { data: missionsData } = await supabase
        .from("student_missions")
        .select("*")
        .order("created_at", { ascending: false });
      setMissions((missionsData || []) as StudentMission[]);

      // Load mission completions (pending)
      const { data: completionsData } = await supabase
        .from("mission_completions")
        .select("*")
        .order("created_at", { ascending: false });
      setMissionCompletions((completionsData || []) as MissionCompletion[]);

      // Load student titles
      const { data: titlesData } = await supabase
        .from("student_titles")
        .select("*")
        .order("assigned_at", { ascending: false });
      setStudentTitles((titlesData || []) as StudentTitle[]);

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

    const name = newItemName.trim();
    const description = newItemDesc.trim();
    const imageUrl = newItemImage.trim();
    const icon = newItemIcon.trim() || "⚔️";
    const dbItemType = mapItemTypeToDb(newItemType);
    const minLevel = Number.isFinite(newItemLevel) && newItemLevel >= 1 ? newItemLevel : 1;

    console.log("[addShopItem] submit", { name, cost: newItemCost, type: newItemType, imageUrl });

    if (!teacher) {
      toast.error("Sessão do professor não carregada", {
        description: "Recarregue a página e tente novamente.",
      });
      return;
    }

    // Required-field validation (only name and cost block creation)
    if (!name) {
      toast.error("Preencha os campos obrigatórios", { description: "Informe o nome do item." });
      return;
    }
    if (!Number.isFinite(newItemCost) || newItemCost < 1) {
      toast.error("Preencha os campos obrigatórios", { description: "Informe um custo válido (mínimo 1)." });
      return;
    }
    // Image URL is OPTIONAL — normalize and validate; warn if invalid but still create item
    let finalImageUrl: string | null = null;
    let imageWarning = false;
    if (imageUrl) {
      const normalized = normalizeHttpUrl(imageUrl);
      if (normalized) {
        finalImageUrl = normalized;
      } else {
        // URL provided but invalid — we'll warn user after creation
        imageWarning = true;
        console.warn("[addShopItem] Invalid image URL ignored:", imageUrl);
      }
    }

    setIsCreatingItem(true);

    try {
      // Resolve teacher_id from backend to avoid mismatches
      const { data: teacherIdFromDb, error: teacherIdError } = await withTimeout<{ data: unknown; error: any }>(
        supabase.rpc("get_teacher_id") as any,
        10000,
        "get_teacher_id"
      );
      if (teacherIdError) {
        console.error("get_teacher_id error:", teacherIdError);
      }
      const teacherId = (!teacherIdError && teacherIdFromDb) ? String(teacherIdFromDb) : teacher.id;

      // 1) Try creating with image_url (when valid)
      // 2) If ANY error happens and an image was provided, retry WITHOUT image_url
      // This guarantees the item is created even if only the image field caused the failure.

      type InsertResult = { data: ShopItem | null; error: any };
      const insertAttempt = async (image_url: string | null): Promise<InsertResult> =>
        withTimeout<InsertResult>(
          supabase
            .from("shop_items")
            .insert({
              teacher_id: teacherId,
              name,
              description: description || null,
              cost: newItemCost,
              min_level: minLevel,
              item_type: dbItemType,
              icon,
              image_url,
            })
            .select("*")
            .single() as any,
          15000,
          "insert_shop_item"
        );

      let created: ShopItem | null = null;
      let error: any = null;

      try {
        const res = await insertAttempt(finalImageUrl);
        created = res.data ?? null;
        error = res.error;
      } catch (err) {
        error = err;
      }

      const shouldRetryWithoutImage = Boolean(imageUrl) && Boolean(finalImageUrl);

      if (error) {
        console.error("[addShopItem] insert error:", error);

        if (shouldRetryWithoutImage) {
          try {
            // Mark as warning because the image was dropped
            imageWarning = true;
            finalImageUrl = null;
            const res2 = await insertAttempt(null);
            created = res2.data ?? null;
            error = res2.error;
          } catch (err2) {
            error = err2;
          }
        }

        if (error) {
          const msg = typeof error?.message === "string" ? error.message : "Falha ao criar item.";
          toast.error("Erro ao criar item", {
            description:
              msg.includes("timeout")
                ? "A criação demorou demais e foi cancelada. Tente novamente."
                : msg,
          });
          return;
        }
      }

      if (!created) {
        console.error("[addShopItem] insert returned no row (unexpected)");
        toast.error("Erro ao criar item", { description: "Não foi possível confirmar a criação do item." });
        return;
      }

      if (imageWarning) {
        toast.warning("Item criado, mas a URL da imagem é inválida", {
          description: "A URL deve começar com http:// ou https://. Edite o item para corrigir.",
        });
      } else {
        toast.success("Item criado com sucesso!");
      }

      // Update list immediately (avoid depending solely on loadData)
      setShopItems((prev) => [created as ShopItem, ...prev]);

      setNewItemName("");
      setNewItemDesc("");
      setNewItemCost(10);
      setNewItemLevel(1);
      setNewItemImage("");
      // Keep data in sync in the background
      loadData();
    } catch (err) {
      console.error("addShopItem unexpected error:", err);
      toast.error("Erro inesperado", { description: "Não foi possível criar o item. Tente novamente." });
    } finally {
      setIsCreatingItem(false);
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

    // Or deduct coins and add item to inventory if it's an item purchase
    if (request.request_type === "item" && request.shop_item && request.student) {
      await supabase
        .from("students")
        .update({ coins: request.student.coins - request.shop_item.cost })
        .eq("id", request.student_id);
      
      // Add item to student's inventory
      await supabase.from("student_inventory").insert({
        student_id: request.student_id,
        item_id: request.shop_item.id,
        added_by: teacher.id,
      });
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

  const addItemToInventory = async (studentId: string, itemId: string) => {
    if (!teacher) return;

    const { error } = await supabase.from("student_inventory").insert({
      student_id: studentId,
      item_id: itemId,
      added_by: teacher.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Item já está no inventário do aluno");
      } else {
        toast.error("Erro ao adicionar item", { description: error.message });
      }
    } else {
      toast.success("Item adicionado ao inventário!");
      loadData();
    }
  };

  const removeItemFromInventory = async (inventoryId: string) => {
    const { error } = await supabase
      .from("student_inventory")
      .delete()
      .eq("id", inventoryId);

    if (error) {
      toast.error("Erro ao remover item", { description: error.message });
    } else {
      toast.success("Item removido do inventário");
      loadData();
    }
  };

  const getStudentInventory = (studentId: string) => {
    return inventoryRecords.filter(inv => inv.student_id === studentId);
  };

  const studentHasItem = (studentId: string, itemId: string) => {
    return inventoryRecords.some(inv => inv.student_id === studentId && inv.item_id === itemId);
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
        case "class":
          const { error: classError } = await supabase
            .from("classes")
            .delete()
            .eq("id", deleteTarget.id);
          error = classError;
          break;
        
        case "student":
          const { error: studentError } = await supabase
            .from("students")
            .delete()
            .eq("id", deleteTarget.id);
          error = studentError;
          break;
        
        case "challenge":
          // Soft delete - just deactivate
          const { error: challengeError } = await supabase
            .from("challenges")
            .update({ is_active: false })
            .eq("id", deleteTarget.id);
          error = challengeError;
          break;
        
        case "item":
          // Soft delete - just deactivate (preserves items in inventories)
          const { error: itemError } = await supabase
            .from("shop_items")
            .update({ is_active: false })
            .eq("id", deleteTarget.id);
          error = itemError;
          break;
      }

      if (error) {
        toast.error("Erro ao excluir", { description: error.message });
      } else {
        toast.success(`${deleteTarget.name} excluído com sucesso!`);
        if (deleteTarget.type === "item") {
          // Remove immediately from the teacher list to avoid UI pollution
          setShopItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        }
        loadData();
      }
    } catch (e) {
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
      item: "item",
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
            { id: "inventory", label: "Inventário", icon: Package },
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
              {classes.map(cls => {
                const studentCount = getStudentCountForClass(cls.id);
                return (
                  <div key={cls.id} className="card-fantasy">
                    <div className="flex items-start justify-between">
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
                  <option value="consumable">Consumível</option>
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
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={newItemIcon}
                  onChange={e => setNewItemIcon(e.target.value)}
                  placeholder="Ícone"
                  className="w-16 px-2 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none text-center text-2xl"
                />
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <LinkIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={newItemImage}
                    onChange={e => setNewItemImage(e.target.value)}
                    placeholder="URL da imagem (opcional)"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingItem}
                  className="btn-fantasy flex items-center gap-2"
                >
                  <Plus size={18} />
                  Criar Item
                </button>
              </div>
              {newItemImage && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Image size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <img 
                    src={newItemImage} 
                    alt="Preview" 
                    className="h-12 w-12 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </form>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.map(item => (
                <div key={item.id} className="card-fantasy overflow-hidden">
                  {/* Item Image/Icon Header */}
                  <div className="relative -mx-5 -mt-5 mb-3 aspect-video bg-gradient-to-b from-dungeon-dark/20 to-dungeon-dark/5 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.item-icon-fallback');
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`item-icon-fallback absolute inset-0 flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
                      <span className="text-5xl drop-shadow-md">{item.icon}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {item.item_type === "weapon" ? "Arma" : item.item_type === "armor" ? "Armadura" : "Habilidade"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="flex items-center gap-1 text-gold-dark font-semibold">
                      <Coins size={14} />
                      {item.cost}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Nível {item.min_level}</span>
                      <button
                        onClick={() => openDeleteDialog("item", item.id, item.name, "O item será removido da loja. Itens já adquiridos permanecerão nos inventários.")}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Excluir item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <section>
            <h2 className="section-title">
              <Package className="text-gold" />
              Gerenciar Inventário dos Alunos
            </h2>

            <div className="card-fantasy mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedClass || ""}
                  onChange={e => {
                    setSelectedClass(e.target.value || null);
                    setSelectedStudentForInventory(null);
                  }}
                  className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="">Todas as turmas</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStudentForInventory || ""}
                  onChange={e => setSelectedStudentForInventory(e.target.value || null)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                >
                  <option value="">Selecione um aluno...</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.character_name || s.name}
                      {s.character_name ? ` (${s.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudentForInventory ? (
              <div className="space-y-6">
                {/* Selected student info */}
                {(() => {
                  const selectedStudent = students.find(s => s.id === selectedStudentForInventory);
                  const studentInv = getStudentInventory(selectedStudentForInventory);
                  
                  if (!selectedStudent) return null;

                  return (
                    <>
                      <div className="card-fantasy bg-gradient-to-r from-dungeon-dark/10 to-primary/10">
                        <div className="flex items-center gap-4">
                          <ProfilePhoto
                            studentId={selectedStudent.id}
                            currentPhotoUrl={selectedStudent.profile_photo_url}
                            onUpdate={() => loadData()}
                            size="lg"
                            editable={false}
                          />
                          <div>
                            <h3 className="font-display text-xl font-bold">
                              {selectedStudent.character_name || selectedStudent.name}
                            </h3>
                            <p className="text-muted-foreground">
                              {classes.find(c => c.id === selectedStudent.class_id)?.name}
                            </p>
                            <p className="text-sm text-gold font-semibold mt-1">
                              {studentInv.length} {studentInv.length === 1 ? 'item' : 'itens'} no inventário
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Current Inventory */}
                      <div>
                        <h4 className="font-semibold mb-3">Inventário atual:</h4>
                        {studentInv.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Nenhum item no inventário</p>
                        ) : (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {studentInv.map(inv => (
                              <div key={inv.id} className="card-fantasy flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {inv.item?.image_url ? (
                                    <img
                                      src={inv.item.image_url}
                                      alt={inv.item.name}
                                      className="w-12 h-12 rounded-lg object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-3xl">{inv.item?.icon || "📦"}</span>
                                  )}
                                  <div>
                                    <p className="font-semibold">{inv.item?.name || "Item"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {inv.item?.item_type === "weapon" ? "Arma" : 
                                       inv.item?.item_type === "armor" ? "Armadura" : "Habilidade"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeItemFromInventory(inv.id)}
                                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  title="Remover do inventário"
                                >
                                  <Minus size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Adicionar item ao inventário:</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {shopItems.filter(item => !studentHasItem(selectedStudentForInventory, item.id)).map(item => (
                            <div key={item.id} className="card-fantasy flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-3xl">{item.icon}</span>
                                )}
                                <div>
                                  <p className="font-semibold">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.item_type === "weapon" ? "Arma" : 
                                     item.item_type === "armor" ? "Armadura" : "Habilidade"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => addItemToInventory(selectedStudentForInventory, item.id)}
                                className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                                title="Adicionar ao inventário"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          ))}
                          {shopItems.filter(item => !studentHasItem(selectedStudentForInventory, item.id)).length === 0 && (
                            <p className="text-muted-foreground text-sm col-span-full">
                              O aluno já possui todos os itens disponíveis na loja
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="card-fantasy text-center py-8 text-muted-foreground">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>Selecione um aluno para gerenciar o inventário</p>
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
