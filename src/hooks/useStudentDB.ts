import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { useTeacherReward } from "@/hooks/useTeacherReward";
import { supabaseRetry } from "@/lib/supabaseRetry";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { Student, Class, Teacher, Challenge, StudentRequest, Mission, MissionCompletion, StudentTitle, ShopItem, InventoryItem } from "@/types";

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
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { rewardConfig, getRewardIcon, getRewardName, getRewardLabel } =
    useTeacherReward(student?.teacher_id ?? null, supabaseAnon);

  const { trackLogin, trackSessionStart, trackSessionEnd, trackShopPurchase, trackAttendance } =
    useAnalytics();

  // Track session duration
  const sessionStartRef = useRef<number | null>(null);

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
      loadShopItems(teacherId),
      loadInventory(studentId),
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

  const loadShopItems = async (teacherId: string) => {
    const { data, error } = await supabaseAnon
      .from("shop_items")
      .select("*")
      .eq("is_active", true)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    if (error) { console.error("[useStudentDB] loadShopItems:", error); return; }
    setShopItems((data || []) as unknown as ShopItem[]);
  };

  const loadInventory = async (studentId: string) => {
    const { data, error } = await supabaseAnon
      .from("student_inventory")
      .select("*, item:shop_items(*)")
      .eq("student_id", studentId)
      .order("added_at", { ascending: false });
    if (error) { console.error("[useStudentDB] loadInventory:", error); return; }
    setInventory((data || []) as unknown as InventoryItem[]);
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

    // Fire-and-forget tracking
    sessionStartRef.current = Date.now();
    void trackLogin(typedStudent.teacher_id, typedStudent.id, typedStudent.class_id);
    void trackSessionStart(typedStudent.teacher_id, typedStudent.id, typedStudent.class_id);
    // Daily login pet XP (+3)
    void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: typedStudent.id, p_xp: 3 });
  }, []);

  // Subscribe to auth changes (handles initial session + OAuth redirect)
  useEffect(() => {
    loadTeachers();

    const { data: { subscription } } = supabaseStudent.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          await resolveSession(session?.user ?? null);
        } catch (err) {
          console.error("[useStudentDB] onAuthStateChange error:", err);
          setAuthState("unauthenticated");
        }
      }
    );

    // Safety net: if onAuthStateChange never fires (e.g. client stuck on
    // code exchange with wrong verifier), bail out after 8 s.
    const bailout = setTimeout(() => {
      setAuthState(prev => (prev === "loading" ? "unauthenticated" : prev));
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(bailout);
    };
  }, []);

  // Track session_end on tab close / page unload
  useEffect(() => {
    const handleUnload = () => {
      if (student && sessionStartRef.current) {
        const durationMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000);
        void trackSessionEnd(student.teacher_id, student.id, durationMinutes);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [student, trackSessionEnd]);

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
        redirectTo: window.location.origin + "/",
      },
    });
    if (error) {
      setError("Não foi possível iniciar o login com Google.");
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabaseStudent.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabaseStudent.auth.signUp({ email, password });
    return { error };
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
    // Track session end before clearing state
    if (student && sessionStartRef.current) {
      const durationMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000);
      void trackSessionEnd(student.teacher_id, student.id, durationMinutes);
      sessionStartRef.current = null;
    }
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

  const purchaseItem = async (itemId: string) => {
    if (!student) return { success: false, error: "Sem sessão" };

    const { data, error } = await supabaseStudent.rpc("purchase_item", {
      p_student_id: student.id,
      p_item_id: itemId,
    });

    if (error) {
      console.error("[useStudentDB] purchaseItem:", error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) return { success: false, error: result.error ?? "Erro desconhecido" };

    // Fire-and-forget tracking — find item name for event_data
    const item = shopItems.find(i => i.id === itemId);
    void trackShopPurchase(
      student.teacher_id, student.id, student.class_id,
      itemId, item?.price ?? 0, item?.name ?? ""
    );

    // Refresh coins (student row) and inventory
    await Promise.all([refreshStudent(), loadInventory(student.id)]);
    return { success: true };
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
      // Give pet XP for submitting a challenge (+8)
      void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: student.id, p_xp: 8 });
    }
    return { error };
  };

  const requestAttendance = async () => {
    if (!student) return;
    const { error } = await supabaseAnon.from("student_requests").insert({
      student_id: student.id,
      request_type: "attendance",
    });
    if (!error) {
      await loadRequests(student.id);
      void trackAttendance(student.teacher_id, student.id, student.class_id, student.presencas_consecutivas ?? 0);
      // Give pet XP for marking attendance (+3)
      void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: student.id, p_xp: 3 });
    }
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
    shopItems,
    inventory,
    rewardConfig,
    requests,
    isLoading,
    error,
    clearError,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    registerStudent,
    purchaseItem,
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
