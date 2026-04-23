import { useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { useTeacherReward } from "@/hooks/useTeacherReward";
import { supabaseRetry } from "@/lib/supabaseRetry";
import { useAnalytics } from "@/hooks/useAnalytics";
import { applyOptimistic } from "@/utils/optimisticUpdate";
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

/**
 * Races a thenable against a timeout. Throws with a labelled message if the timeout fires first.
 * Works with Supabase query builders (which are thenables, not native Promises).
 */
function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[${label}] timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/** Promise.allSettled wrapper: runs all promises in parallel and logs failures without throwing. */
async function parallelLoad(label: string, promises: Promise<unknown>[]) {
  const results = await Promise.allSettled(promises);
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[useStudentDB] ${label}[${i}] failed:`, result.reason);
    }
  });
}

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

  // Ref to read authState synchronously inside auth listener (avoids stale closure)
  const authStateRef = useRef<StudentAuthState>("loading");
  // Prevents concurrent resolveSession calls (INITIAL_SESSION + SIGNED_IN firing together)
  const resolveInProgressRef = useRef(false);

  const { rewardConfig, getRewardIcon, getRewardName, getRewardLabel } =
    useTeacherReward(student?.teacher_id ?? null, supabaseAnon);

  const { trackLogin, trackSessionStart, trackSessionEnd, trackShopPurchase, trackAttendance } =
    useAnalytics();

  // Keep authStateRef in sync so the auth listener can read the latest value
  useEffect(() => { authStateRef.current = authState; }, [authState]);

  // Track session duration
  const sessionStartRef = useRef<number | null>(null);
  // Debounce timer for realtime student_requests batching
  const requestsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lazy-load guards: prevent re-fetching data that is already in state
  const missionsLoadedRef = useRef(false);
  const shopLoadedRef = useRef(false);

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

  // Load critical data needed immediately on login (default "challenges" tab + header)
  // Non-critical data (missions, shop, inventory) is loaded lazily on first tab visit.
  const loadAllStudentData = async (studentId: string, teacherId: string) => {
    await parallelLoad("loadAllStudentData", [
      loadChallenges(teacherId),
      loadRequests(studentId),
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
      missionsLoadedRef.current = false;
      shopLoadedRef.current = false;
      setAuthUser(null);
      setStudent(null);
      setAuthState("unauthenticated");
      return;
    }

    setAuthUser(user);

    // Look up student record — 8 s timeout so a hung query never leaves loading forever
    const { data: studentData, error } = await withTimeout(
      supabaseStudent.from("students").select("*").eq("user_id", user.id).maybeSingle(),
      8_000,
      "useStudentDB/resolveSession"
    );

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
      // Keep the record in state so registerStudent can detect it and UPDATE instead of INSERT
      setStudent(typedStudent);
      setAuthState("needs_registration");
      return;
    }

    // Active student — reset lazy-load flags for new session
    missionsLoadedRef.current = false;
    shopLoadedRef.current = false;
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
      async (event, session) => {
        const isIdentityEvent =
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT";

        // TOKEN_REFRESHED / USER_UPDATED while active — autoRefreshToken already handled it
        if (!isIdentityEvent && authStateRef.current === "active") return;

        // SIGNED_IN while already active fires on tab return after a silent token refresh.
        // Skip the full DB round-trip — the visibility handler (below) does the light check.
        if (event === "SIGNED_IN" && authStateRef.current === "active") {
          console.log("[useStudentDB] SIGNED_IN while active — skipping re-resolve (tab return)");
          return;
        }

        // Prevent concurrent lookups (e.g. INITIAL_SESSION + SIGNED_IN arriving together)
        if (resolveInProgressRef.current) return;
        resolveInProgressRef.current = true;

        try {
          await resolveSession(session?.user ?? null);
        } catch (err) {
          console.error("[useStudentDB] onAuthStateChange error:", err);
          setAuthState("unauthenticated");
        } finally {
          resolveInProgressRef.current = false;
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

  // When the tab returns to foreground, probe getSession() so the SDK refreshes the token
  // if it expired while the tab was backgrounded. This triggers TOKEN_REFRESHED (caught by
  // onAuthStateChange guard → no re-resolve) or SIGNED_OUT (which goes through normally).
  // We intentionally do NOT change authState/student here: getSession() can return null
  // briefly mid-refresh and would cause false sign-outs, breaking any in-progress screens.
  useEffect(() => {
    const onVisible = async () => {
      if (document.hidden) return;
      if (authStateRef.current !== "active") return;
      console.log("[useStudentDB] tab visible — probing session");
      try {
        await supabaseStudent.auth.getSession();
      } catch (err) {
        console.error("[useStudentDB] visibility session probe failed:", err);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Subscribe to realtime student updates while active
  useEffect(() => {
    if (!student || authState !== "active") return;

    const channel = supabaseAnon
      .channel(`student-updates-${student.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "students", filter: `id=eq.${student.id}` },
        (payload) => {
          try {
            if (payload.new) setStudent(payload.new as Student);
          } catch (err) {
            console.error("[Realtime] students handler error:", err);
          }
        }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "student_requests", filter: `student_id=eq.${student.id}` },
        () => {
          try {
            // Debounce: coalesce rapid-fire events into one fetch after 300ms of silence
            if (requestsDebounceRef.current) clearTimeout(requestsDebounceRef.current);
            requestsDebounceRef.current = setTimeout(() => {
              loadRequests(student.id).catch(err =>
                console.error("[Realtime] student_requests fetch error:", err)
              );
            }, 300);
          } catch (err) {
            console.error("[Realtime] student_requests handler error:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseAnon.removeChannel(channel);
      if (requestsDebounceRef.current) clearTimeout(requestsDebounceRef.current);
    };
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
        redirectTo: window.location.origin + "/login",
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

    // Rejected students already have a record with this user_id (UNIQUE constraint).
    // UPDATE it back to pending instead of trying to INSERT a duplicate.
    if (student?.status === "rejected") {
      const { error } = await supabaseStudent
        .from("students")
        .update({ name: name.trim(), teacher_id: teacherId, class_id: classId, status: "pending" })
        .eq("id", student.id);

      if (error) {
        console.error("[useStudentDB] registerStudent (re-register):", error);
        return { success: false, error: error.message };
      }
    } else {
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
    missionsLoadedRef.current = false;
    shopLoadedRef.current = false;
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

    const item = shopItems.find(i => i.id === itemId);

    // Optimistic: deduct cost immediately so the UI reflects the change at 0ms
    const revertCoins = item
      ? applyOptimistic(setStudent, prev => prev ? { ...prev, coins: prev.coins - item.cost } : prev)
      : () => {};

    const { data, error } = await supabaseStudent.rpc("purchase_item", {
      p_student_id: student.id,
      p_item_id: itemId,
    });

    if (error) {
      revertCoins();
      console.error("[useStudentDB] purchaseItem:", error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      revertCoins();
      return { success: false, error: result.error ?? "Erro desconhecido" };
    }

    // Fire-and-forget tracking — find item name for event_data
    void trackShopPurchase(
      student.teacher_id, student.id, student.class_id,
      itemId, item?.cost ?? 0, item?.name ?? ""
    );

    // Coins already updated optimistically — only reload inventory
    await loadInventory(student.id);
    return { success: true };
  };

  const requestChallenge = async (challengeId: string) => {
    if (!student) return;

    // Optimistic: add a temp request so the button disables instantly
    const tempId = `opt-${Date.now()}`;
    const optimisticReq: StudentRequest = {
      id: tempId,
      request_type: "challenge",
      challenge_id: challengeId,
      item_id: null,
      status: "pending",
    };
    setRequests(prev => [...prev, optimisticReq]);

    const { error } = await supabaseAnon.from("student_requests").insert({
      student_id: student.id,
      request_type: "challenge",
      challenge_id: challengeId,
    });

    if (error) {
      // Revert temp entry on failure
      setRequests(prev => prev.filter(r => r.id !== tempId));
      return { error };
    }

    // Realtime subscription will reconcile; loadRequests replaces the temp entry with the real row
    void loadRequests(student.id);
    void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: student.id, p_xp: 8 });
    return { error: null };
  };

  const requestAttendance = async () => {
    if (!student) return;

    // Optimistic: add a temp request so the button disables instantly
    const tempId = `opt-${Date.now()}`;
    const optimisticReq: StudentRequest = {
      id: tempId,
      request_type: "attendance",
      challenge_id: null,
      item_id: null,
      status: "pending",
    };
    setRequests(prev => [...prev, optimisticReq]);

    const { error } = await supabaseAnon.from("student_requests").insert({
      student_id: student.id,
      request_type: "attendance",
    });

    if (error) {
      setRequests(prev => prev.filter(r => r.id !== tempId));
      return { error };
    }

    void loadRequests(student.id);
    void trackAttendance(student.teacher_id, student.id, student.class_id, student.presencas_consecutivas ?? 0);
    void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: student.id, p_xp: 3 });
    return { error: null };
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
    missionsLoadedRef.current = true; // mark loaded so ensureMissionsLoaded won't double-fetch
    await parallelLoad("refreshMissions", [
      loadMissions(student.teacher_id),
      loadMissionCompletions(student.id),
    ]);
  };

  // ── Lazy loaders (called on first tab visit) ─────────────────────────────────

  // Loads missions + completions once; subsequent calls are no-ops until next login.
  const ensureMissionsLoaded = useCallback(async () => {
    if (!student || missionsLoadedRef.current) return;
    missionsLoadedRef.current = true;
    await parallelLoad("ensureMissionsLoaded", [
      loadMissions(student.teacher_id),
      loadMissionCompletions(student.id),
    ]);
  }, [student]);

  // Loads shop items + inventory once; covers shop, inventory, character, and trading tabs.
  const ensureShopLoaded = useCallback(async () => {
    if (!student || shopLoadedRef.current) return;
    shopLoadedRef.current = true;
    await parallelLoad("ensureShopLoaded", [
      loadShopItems(student.teacher_id),
      loadInventory(student.id),
    ]);
  }, [student]);

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
    ensureMissionsLoaded,
    ensureShopLoaded,
    loadClassesByTeacher,
    getRewardIcon,
    getRewardName,
    getRewardLabel,
  };
}
