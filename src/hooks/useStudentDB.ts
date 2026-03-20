import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { useTeacherReward } from "@/hooks/useTeacherReward";
import { supabaseRetry } from "@/lib/supabaseRetry";
import type { Student, Class, Teacher, Challenge, StudentRequest, Mission, MissionCompletion, StudentTitle } from "@/types";

// Auth state machine:
//   loading           → determining if there's an active session
//   unauthenticated   → no Google session; show sign-in button
//   needs_registration → Google auth ok but no student record yet; show class-selection form
//   pending           → student record exists but teacher hasn't approved yet
//   active            → full access
export type StudentAuthState =
  | "loading"
  | "unauthenticated"
  | "needs_registration"
  | "pending"
  | "active";

export function useStudentDB() {
  const [authState, setAuthState] = useState<StudentAuthState>("loading");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionCompletions, setMissionCompletions] = useState<MissionCompletion[]>([]);
  const [studentTitles, setStudentTitles] = useState<StudentTitle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { rewardConfig, getRewardIcon, getRewardName, getRewardLabel } =
    useTeacherReward(student?.teacher_id ?? null, supabaseAnon);

  // Derived: still loading
  const isLoading = authState === "loading";

  // Load public data needed for the registration form (teachers/classes)
  const loadTeachers = async () => {
    const { data, error } = await supabaseRetry(() =>
      supabaseAnon.from("teachers").select("id, name").order("name")
    );
    if (error) {
      console.error("[useStudentDB] loadTeachers:", error);
      setError("Não foi possível carregar a lista de professores.");
      return;
    }
    setTeachers(data || []);
  };

  const loadClassesByTeacher = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("classes")
      .select("id, name, teacher_id")
      .eq("teacher_id", teacherId)
      .order("name");
    if (error) {
      console.error("[useStudentDB] loadClassesByTeacher:", error);
      setError("Não foi possível carregar as turmas.");
      return;
    }
    setClasses(data || []);
  };

  // Load all student-specific data after auth confirms an active student
  const loadAllStudentData = async (studentId: string, teacherId: string) => {
    await Promise.all([
      loadChallenges(teacherId),
      loadRequests(studentId),
      loadMissions(teacherId),
      loadMissionCompletions(studentId),
      loadStudentTitles(studentId),
    ]);
  };

  const loadChallenges = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("challenges")
      .select("id, title, description, reward, challenge_type")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[useStudentDB] loadChallenges:", error);
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
      console.error("[useStudentDB] loadRequests:", error);
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
      console.error("[useStudentDB] loadMissions:", error);
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
      console.error("[useStudentDB] loadMissionCompletions:", error);
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
      console.error("[useStudentDB] loadStudentTitles:", error);
      return;
    }
    setStudentTitles((data || []) as StudentTitle[]);
  };

  // Resolve auth state from a Supabase session (called on auth change and mount)
  const resolveSession = useCallback(async (user: User | null) => {
    if (!user) {
      setAuthUser(null);
      setStudent(null);
      setAuthState("unauthenticated");
      return;
    }

    setAuthUser(user);

    // Look up student record by the Google auth user id
    const { data: studentData, error } = await supabaseStudent
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[useStudentDB] resolveSession lookup:", error);
      setAuthState("needs_registration");
      return;
    }

    if (!studentData) {
      setAuthState("needs_registration");
      return;
    }

    const typedStudent = studentData as unknown as Student;

    if (typedStudent.status === "pending") {
      setStudent(typedStudent);
      setAuthState("pending");
      return;
    }

    if (typedStudent.status === "rejected") {
      setStudent(typedStudent);
      setAuthState("pending"); // show "pending" screen with rejection message
      return;
    }

    // Active student
    setStudent(typedStudent);
    await loadAllStudentData(typedStudent.id, typedStudent.teacher_id);
    setAuthState("active");
  }, []);

  // Subscribe to auth changes (handles initial session + OAuth redirect)
  useEffect(() => {
    loadTeachers();

    const { data: { subscription } } = supabaseStudent.auth.onAuthStateChange(
      async (_event, session) => {
        await resolveSession(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to realtime student updates while active
  useEffect(() => {
    if (!student || authState !== "active") return;

    const channel = supabaseAnon
      .channel(`student-updates-${student.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "students", filter: `id=eq.${student.id}` },
        (payload) => {
          if (payload.new) setStudent(payload.new as Student);
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "student_requests", filter: `student_id=eq.${student.id}` },
        () => { loadRequests(student.id); }
      )
      .subscribe();

    return () => { supabaseAnon.removeChannel(channel); };
  }, [student?.id, authState]);

  // Listen for approval while in "pending" state (teacher approves → student gets access)
  useEffect(() => {
    if (!student || authState !== "pending") return;

    const channel = supabaseAnon
      .channel(`pending-student-${student.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "students", filter: `id=eq.${student.id}` },
        async (payload) => {
          const updated = payload.new as Student;
          if (updated.status === "active") {
            setStudent(updated);
            await loadAllStudentData(updated.id, updated.teacher_id);
            setAuthState("active");
          }
        }
      )
      .subscribe();

    return () => { supabaseAnon.removeChannel(channel); };
  }, [student?.id, authState]);

  // ── Auth actions ────────────────────────────────────────────────────────────

  const loginWithGoogle = async () => {
    const { error } = await supabaseStudent.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/aluno`,
      },
    });
    if (error) {
      setError("Não foi possível iniciar o login com Google.");
    }
  };

  const registerStudent = async (name: string, teacherId: string, classId: string) => {
    if (!authUser) return { success: false, error: "Não autenticado." };

    const { error } = await supabaseStudent.from("students").insert({
      name: name.trim(),
      teacher_id: teacherId,
      class_id: classId,
      user_id: authUser.id,
      status: "pending",
      coins: 0,
      level: 1,
      presencas_consecutivas: 0,
    });

    if (error) {
      console.error("[useStudentDB] registerStudent:", error);
      return { success: false, error: error.message };
    }

    // Re-resolve to enter "pending" state
    await resolveSession(authUser);
    return { success: true };
  };

  const logout = async () => {
    await supabaseStudent.auth.signOut();
    setStudent(null);
    setAuthUser(null);
    setRequests([]);
    setMissions([]);
    setMissionCompletions([]);
    setStudentTitles([]);
    setAuthState("unauthenticated");
  };

  // ── Student actions ─────────────────────────────────────────────────────────

  const requestChallenge = async (challengeId: string) => {
    if (!student) return;
    const { error } = await supabaseAnon.from("student_requests").insert({
      student_id: student.id,
      request_type: "challenge",
      challenge_id: challengeId,
    });
    if (!error) await loadRequests(student.id);
    return { error };
  };

  const requestAttendance = async () => {
    if (!student) return;
    const { error } = await supabaseAnon.from("student_requests").insert({
      student_id: student.id,
      request_type: "attendance",
    });
    if (!error) await loadRequests(student.id);
    return { error };
  };

  const hasChallengeRequest = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge?.challenge_type === "unica") {
      return requests.some(
        r => r.challenge_id === challengeId && (r.status === "pending" || r.status === "approved")
      );
    }
    return requests.some(r => r.challenge_id === challengeId && r.status === "pending");
  };

  const hasAttendanceRequest = () =>
    requests.some(r => r.request_type === "attendance" && r.status === "pending");

  const refreshStudent = async () => {
    if (!student) return;
    const { data } = await supabaseAnon
      .from("students")
      .select("*")
      .eq("id", student.id)
      .maybeSingle();
    if (data) setStudent(data as unknown as Student);
  };

  const refreshMissions = async () => {
    if (!student) return;
    await Promise.all([
      loadMissions(student.teacher_id),
      loadMissionCompletions(student.id),
    ]);
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    authState,
    authUser,
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
    loginWithGoogle,
    registerStudent,
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
    isChallengePending: (challengeId: string) =>
      requests.some(r => r.challenge_id === challengeId && r.status === "pending"),
    logout,
    refreshStudent,
    refreshMissions,
    loadClassesByTeacher,
    getRewardIcon,
    getRewardName,
    getRewardLabel,
  };
}
