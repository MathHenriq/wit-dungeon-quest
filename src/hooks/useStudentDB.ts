import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  character_name: string | null;
  coins: number;
  level: number;
  class_id: string;
  teacher_id: string;
  race: string | null;
  character_class: string | null;
  motivation: string | null;
  lore: string | null;
  appearance: string | null;
  personality: string | null;
  presencas_consecutivas: number;
  profile_photo_url: string | null;
}

interface ClassData {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward: number;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  min_level: number;
  item_type: string;
  icon: string;
  image_url: string | null;
}

interface StudentRequest {
  id: string;
  request_type: "challenge" | "item" | "attendance";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
}

interface InventoryItem {
  id: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    image_url: string | null;
    item_type: string;
  };
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  is_return_mission: boolean;
}

interface MissionCompletion {
  id: string;
  mission_id: string;
  status: "pending" | "approved" | "rejected";
}

interface StudentTitle {
  id: string;
  title_type: "helper_of_week" | "presence_guardian" | "attitude_example";
  expires_at: string;
}

const STORAGE_KEY = "wit_dungeon_student_session";

export function useStudentDB() {
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved session
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadStudent(parsed.studentId);
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }

    // Load available classes
    loadClasses();
  }, []);

  const loadClasses = async (teacherId?: string) => {
    let query = supabase
      .from("classes")
      .select("id, name")
      .order("name");
    
    // If teacher_id provided, filter by it (for student context)
    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }
    
    const { data } = await query;
    setClasses(data || []);
  };

  const loadStudent = async (studentId: string) => {
    setIsLoading(true);

    const { data: studentData, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (error || !studentData) {
      localStorage.removeItem(STORAGE_KEY);
      setStudent(null);
      setIsLoading(false);
      return;
    }

    setStudent(studentData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ studentId }));

    // Load challenges, shop items, requests, inventory, missions, and titles
    // FILTER BY TEACHER_ID for ecosystem isolation
    const teacherId = studentData.teacher_id;
    await Promise.all([
      loadChallenges(teacherId),
      loadShopItems(teacherId),
      loadRequests(studentId),
      loadInventory(studentId),
      loadMissions(teacherId),
      loadMissionCompletions(studentId),
      loadStudentTitles(studentId),
    ]);

    setIsLoading(false);
  };

  const loadInventory = async (studentId: string) => {
    const { data } = await supabase
      .from("student_inventory")
      .select(`
        id,
        item:shop_items (
          id,
          name,
          description,
          icon,
          image_url,
          item_type
        )
      `)
      .eq("student_id", studentId);
    
    // Filter out entries where item is null (if shop item was deleted)
    const validItems = (data || []).filter(inv => inv.item !== null) as InventoryItem[];
    setInventory(validItems);
  };

  const loadChallenges = async (teacherId: string) => {
    const { data } = await supabase
      .from("challenges")
      .select("id, title, description, reward")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setChallenges(data || []);
  };

  const loadShopItems = async (teacherId: string) => {
    const { data } = await supabase
      .from("shop_items")
      .select("id, name, description, cost, min_level, item_type, icon, image_url")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("cost");
    setShopItems(data || []);
  };

  const loadRequests = async (studentId: string) => {
    const { data } = await supabase
      .from("student_requests")
      .select("id, request_type, challenge_id, item_id, status")
      .eq("student_id", studentId);
    setRequests((data || []) as StudentRequest[]);
  };

  const loadMissions = async (teacherId: string) => {
    const { data } = await supabase
      .from("student_missions")
      .select("id, title, description, reward, is_return_mission")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setMissions((data || []) as Mission[]);
  };

  const loadMissionCompletions = async (studentId: string) => {
    const { data } = await supabase
      .from("mission_completions")
      .select("id, mission_id, status")
      .eq("student_id", studentId);
    setMissionCompletions((data || []) as MissionCompletion[]);
  };

  const loadStudentTitles = async (studentId: string) => {
    const { data } = await supabase
      .from("student_titles")
      .select("id, title_type, expires_at")
      .eq("student_id", studentId)
      .gt("expires_at", new Date().toISOString());
    setStudentTitles((data || []) as StudentTitle[]);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!student) return;

    const channel = supabase
      .channel("student-updates")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "students", filter: `id=eq.${student.id}` }, 
        (payload) => {
          if (payload.new) {
            setStudent(payload.new as Student);
          }
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "student_requests", filter: `student_id=eq.${student.id}` },
        () => {
          loadRequests(student.id);
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "student_inventory", filter: `student_id=eq.${student.id}` },
        () => {
          loadInventory(student.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student?.id]);

  const loginStudent = async (name: string, classId: string) => {
    // Try to find existing student by name + class
    const { data: existingStudent, error: findError } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classId)
      .ilike("name", name.trim())
      .maybeSingle();

    if (findError) {
      console.error("Error finding student:", findError);
      return { success: false, error: "Erro ao buscar aluno. Tente novamente." };
    }

    if (existingStudent) {
      await loadStudent(existingStudent.id);
      return { success: true, needsCharacter: !existingStudent.character_name };
    }

    // Student not found - they need to be added by teacher first
    return { 
      success: false, 
      error: "Aluno não encontrado. Peça ao professor para adicionar você à turma." 
    };
  };

  const requestChallenge = async (challengeId: string) => {
    if (!student) return;

    const { error } = await supabase.from("student_requests").insert({
      student_id: student.id,
      request_type: "challenge",
      challenge_id: challengeId,
    });

    if (!error) {
      await loadRequests(student.id);
    }

    return { error };
  };

  const requestItem = async (itemId: string) => {
    if (!student) return;

    const { error } = await supabase.from("student_requests").insert({
      student_id: student.id,
      request_type: "item",
      item_id: itemId,
    });

    if (!error) {
      await loadRequests(student.id);
    }

    return { error };
  };

  const hasChallengeRequest = (challengeId: string) => {
    return requests.some(
      r => r.challenge_id === challengeId && (r.status === "pending" || r.status === "approved")
    );
  };

  const hasItemRequest = (itemId: string) => {
    return requests.some(
      r => r.item_id === itemId && r.status === "pending"
    );
  };

  const hasAttendanceRequest = () => {
    return requests.some(
      r => r.request_type === "attendance" && r.status === "pending"
    );
  };

  const requestAttendance = async () => {
    if (!student) return;

    const { error } = await supabase.from("student_requests").insert({
      student_id: student.id,
      request_type: "attendance",
    });

    if (!error) {
      await loadRequests(student.id);
    }

    return { error };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStudent(null);
    setRequests([]);
    setInventory([]);
    setMissions([]);
    setMissionCompletions([]);
    setStudentTitles([]);
  };

  const refreshStudent = async () => {
    if (student) {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("id", student.id)
        .maybeSingle();
      if (data) setStudent(data);
    }
  };

  const refreshMissions = async () => {
    if (student) {
      await Promise.all([
        loadMissions(student.teacher_id),
        loadMissionCompletions(student.id),
      ]);
    }
  };

  return {
    student,
    classes,
    challenges,
    shopItems,
    inventory,
    missions,
    missionCompletions,
    studentTitles,
    isLoading,
    loginStudent,
    requestChallenge,
    requestItem,
    requestAttendance,
    hasChallengeRequest,
    hasItemRequest,
    hasAttendanceRequest,
    logout,
    refreshStudent,
    refreshMissions,
  };
}
