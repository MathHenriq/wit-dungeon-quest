import { useState, useEffect, useCallback } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { useTeacherReward } from "@/hooks/useTeacherReward";
import { supabaseRetry } from "@/lib/supabaseRetry";
import type { Student, Class, Teacher, Challenge, StudentRequest, Mission, MissionCompletion, StudentTitle } from "@/types";

const STORAGE_KEY = "wit_dungeon_student_session";

export function useStudentDB() {
  const [student, setStudent] = useState<Student | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    rewardConfig,
    getRewardIcon,
    getRewardName,
    getRewardLabel,
  } = useTeacherReward(student?.teacher_id ?? null, supabaseAnon);

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
  }, []);

  const loadTeachers = async () => {
    const { data, error } = await supabaseRetry(() =>
      supabaseAnon.from("teachers").select("id, name").order("name")
    );
    if (error) {
      console.error("[useStudentDB] loadTeachers falhou:", error);
      setError("Não foi possível carregar a lista de professores.");
      return;
    }
    setTeachers(data || []);
  };

  const loadClasses = async (teacherId?: string) => {
    let query = supabaseAnon
      .from("classes")
      .select("id, name, teacher_id")
      .order("name");
    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[useStudentDB] loadClasses falhou:", error);
      setError("Não foi possível carregar as turmas.");
      return;
    }
    setClasses(data || []);
  };

  const loadClassesByTeacher = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("classes")
      .select("id, name, teacher_id")
      .eq("teacher_id", teacherId)
      .order("name");
    if (error) {
      console.error("[useStudentDB] loadClassesByTeacher falhou:", error);
      setError("Não foi possível carregar as turmas do professor.");
      return;
    }
    setClasses(data || []);
  };

  const loadStudent = async (studentId: string) => {
    setIsLoading(true);

    const { data: studentData, error } = await supabaseAnon
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (error) {
      console.error("[useStudentDB] loadStudent falhou:", error);
      setError("Não foi possível carregar os dados do aluno.");
      localStorage.removeItem(STORAGE_KEY);
      setStudent(null);
      setIsLoading(false);
      return;
    }

    if (!studentData) {
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
    ]);

    setIsLoading(false);
  };

  const loadChallenges = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("challenges")
      .select("id, title, description, reward, challenge_type")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[useStudentDB] loadChallenges falhou:", error);
      setError("Não foi possível carregar os desafios.");
      return;
    }
    setChallenges((data || []) as Challenge[]);
  };

  const loadRequests = async (studentId: string) => {
    const { data, error } = await supabaseAnon
      .from("student_requests")
      .select("id, request_type, challenge_id, item_id, status")
      .eq("student_id", studentId);
    if (error) {
      console.error("[useStudentDB] loadRequests falhou:", error);
      setError("Não foi possível carregar as solicitações do aluno.");
      return;
    }
    setRequests((data || []) as StudentRequest[]);
  };

  const loadMissions = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("student_missions")
      .select("id, title, description, reward, is_return_mission")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[useStudentDB] loadMissions falhou:", error);
      setError("Não foi possível carregar as missões.");
      return;
    }
    setMissions((data || []) as Mission[]);
  };

  const loadMissionCompletions = async (studentId: string) => {
    const { data, error } = await supabaseAnon
      .from("mission_completions")
      .select("id, mission_id, status")
      .eq("student_id", studentId);
    if (error) {
      console.error("[useStudentDB] loadMissionCompletions falhou:", error);
      setError("Não foi possível carregar o histórico de missões.");
      return;
    }
    setMissionCompletions((data || []) as MissionCompletion[]);
  };

  const loadStudentTitles = async (studentId: string) => {
    const { data, error } = await supabaseAnon
      .from("student_titles")
      .select("id, title_type, expires_at")
      .eq("student_id", studentId)
      .gt("expires_at", new Date().toISOString());
    if (error) {
      console.error("[useStudentDB] loadStudentTitles falhou:", error);
      setError("Não foi possível carregar os títulos do aluno.");
      return;
    }
    setStudentTitles((data || []) as StudentTitle[]);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!student) return;

    const channelName = `student-updates-${student.id}`;
    const channel = supabaseAnon
      .channel(channelName)
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
      supabaseAnon.removeChannel(channel);
    };
  }, [student?.id]);

  const loginStudent = async (name: string, classId: string) => {
    const { data: existingStudent, error: findError } = await supabaseAnon
      .from("students")
      .select("*")
      .eq("class_id", classId)
      .ilike("name", name.trim())
      .maybeSingle();

    if (findError) {
      console.error("[useStudentDB] loginStudent falhou:", findError);
      setError("Erro ao buscar aluno. Tente novamente.");
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

    const { error } = await supabaseAnon.from("student_requests").insert({
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

    const { error } = await supabaseAnon.from("student_requests").insert({
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
      const { data, error } = await supabaseAnon
        .from("students")
        .select("*")
        .eq("id", student.id)
        .maybeSingle();
      if (error) {
        console.error("[useStudentDB] refreshStudent falhou:", error);
        setError("Não foi possível atualizar os dados do aluno.");
        return;
      }
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

  const clearError = useCallback(() => setError(null), []);

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
    error,
    clearError,
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
