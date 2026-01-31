import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  character_name: string | null;
  coins: number;
  level: number;
  class_id: string;
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
}

interface StudentRequest {
  id: string;
  request_type: "challenge" | "item";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
}

const STORAGE_KEY = "wit_dungeon_student_session";

export function useStudentDB() {
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
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

  const loadClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .order("name");
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

    // Load challenges and shop items
    await Promise.all([
      loadChallenges(),
      loadShopItems(),
      loadRequests(studentId),
    ]);

    setIsLoading(false);
  };

  const loadChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("id, title, description, reward")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setChallenges(data || []);
  };

  const loadShopItems = async () => {
    const { data } = await supabase
      .from("shop_items")
      .select("id, name, description, cost, min_level, item_type, icon")
      .eq("is_active", true)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student?.id]);

  const loginStudent = async (name: string, classId: string, characterName?: string) => {
    // Try to find existing student
    let { data: existingStudent } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classId)
      .eq("name", name)
      .maybeSingle();

    if (existingStudent) {
      // Update character name if provided and different
      if (characterName && characterName !== existingStudent.character_name) {
        await supabase
          .from("students")
          .update({ character_name: characterName })
          .eq("id", existingStudent.id);
        existingStudent.character_name = characterName;
      }
      await loadStudent(existingStudent.id);
      return { success: true };
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

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStudent(null);
    setRequests([]);
  };

  return {
    student,
    classes,
    challenges,
    shopItems,
    isLoading,
    loginStudent,
    requestChallenge,
    requestItem,
    hasChallengeRequest,
    hasItemRequest,
    logout,
  };
}
