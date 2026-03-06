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
  teacher_id: string;
}

interface TeacherData {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  challenge_type: "simples" | "unica";
}

interface StudentRequest {
  id: string;
  request_type: "challenge" | "item" | "attendance";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
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

interface RewardConfig {
  id: string;
  teacher_id: string;
  name: string;
  icon: string;
  unit_label_singular: string;
  unit_label_plural: string;
}

const DEFAULT_REWARD: Omit<RewardConfig, "id" | "teacher_id"> = {
  name: "Moedas",
  icon: "🪙",
  unit_label_singular: "moeda",
  unit_label_plural: "moedas",
};

const STORAGE_KEY = "wit_dungeon_student_session";

export function useStudentDB() {
  const [student, setStudent] = useState<Student | null>(null);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
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

    loadTeachers();
    loadClasses();
  }, []);

  const loadTeachers = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("id, name")
      .order("name");
    setTeachers(data || []);
  };

  const loadClasses = async (teacherId?: string) => {
    let query = supabase
      .from("classes")
      .select("id, name, teacher_id")
      .order("name");
    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }
    const { data } = await query;
    setClasses(data || []);
  };

  const loadClassesByTeacher = async (teacherId: string) => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, teacher_id")
      .eq("teacher_id", teacherId)
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

    // Load all data FILTERED BY TEACHER_ID for strict isolation
    const teacherId = studentData.teacher_id;
    await Promise.all([
      loadChallenges(teacherId),
      loadRequests(studentId),
      loadMissions(teacherId),
      loadMissionCompletions(studentId),
      loadStudentTitles(studentId),
      loadRewardConfig(teacherId),
    ]);

    setIsLoading(false);
  };

  const loadChallenges = async (teacherId: string) => {
    const { data } = await supabase
      .from("challenges")
      .select("id, title, description, reward, challenge_type")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setChallenges((data || []) as Challenge[]);
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

  const loadRewardConfig = async (teacherId: string) => {
    const { data } = await supabase
      .from("teacher_rewards")
      .select("*")
      .eq("teacher_id", teacherId)
      .maybeSingle();
    
    if (data) {
      setRewardConfig(data as RewardConfig);
    } else {
      setRewardConfig({
        id: "",
        teacher_id: teacherId,
        ...DEFAULT_REWARD,
      });
    }
  };

  const getRewardIcon = () => rewardConfig?.icon || DEFAULT_REWARD.icon;
  const getRewardName = () => rewardConfig?.name || DEFAULT_REWARD.name;
  const getRewardLabel = (amount: number) => {
    const config = rewardConfig || { ...DEFAULT_REWARD, id: "", teacher_id: "" };
    return amount === 1 ? config.unit_label_singular : config.unit_label_plural;
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

  const loginStudent = async (name: string, classId: string) => {
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

  const hasChallengeRequest = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge?.challenge_type === "unica") {
      // For unique challenges: block if any pending or approved request exists
      return requests.some(
        r => r.challenge_id === challengeId && (r.status === "pending" || r.status === "approved")
      );
    }
    // For simple/repeatable: only block if there's a pending request
    return requests.some(
      r => r.challenge_id === challengeId && r.status === "pending"
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
    teachers,
    classes,
    challenges,
    missions,
    missionCompletions,
    studentTitles,
    rewardConfig,
    requests,
    isLoading,
    loginStudent,
    requestChallenge,
    requestAttendance,
    hasChallengeRequest,
    hasAttendanceRequest,
    isChallengeCompleted: (challengeId: string) => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge?.challenge_type === "unica") {
        return requests.some(r => r.challenge_id === challengeId && r.status === "approved");
      }
      return false;
    },
    isChallengePending: (challengeId: string) => {
      return requests.some(r => r.challenge_id === challengeId && r.status === "pending");
    },
    logout,
    refreshStudent,
    refreshMissions,
    loadClassesByTeacher,
    getRewardIcon,
    getRewardName,
    getRewardLabel,
  };
}
