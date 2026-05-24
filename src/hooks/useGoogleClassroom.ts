import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState: string;
  enrollmentCode?: string;
}

export interface ClassroomStudent {
  userId: string;
  fullName: string;
  emailAddress: string;
}

export interface ImportResult {
  className: string;
  studentsImported: number;
}

export interface ClassroomCoursework {
  id: string;
  title: string;
  description?: string;
  dueDate?: { year: number; month: number; day: number };
  maxPoints?: number;
  workType: string;
  state: string;
}

export interface ActivityLink {
  id: string;
  teacher_id: string;
  course_id: string;
  coursework_id: string;
  title: string;
  class_id: string | null;
  reward_coins: number;
  last_synced_at: string | null;
  created_at: string;
}

export interface SyncResult {
  rewarded: number;
  skipped: number;
  notFound: number;
}

async function classroomFetch(path: string, accessToken: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://classroom.googleapis.com/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (res.status === 401) throw new Error("TOKEN_EXPIRED");
    if (res.status === 403) throw new Error("PERMISSION_DENIED");
    if (!res.ok) throw new Error(`Classroom API error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function useGoogleClassroom(teacherId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importedCourseIds, setImportedCourseIds] = useState<Set<string>>(new Set());
  const [linkedActivities, setLinkedActivities] = useState<ActivityLink[]>([]);

  // Try to refresh the stored refresh_token via Edge Function. Returns the
  // new access_token on success, or null if the teacher needs to reconnect
  // (e.g. no refresh_token saved, or Google revoked it).
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!teacherId) return null;
    try {
      const { data, error } = await supabase.functions.invoke<{ ok: boolean; access_token?: string }>(
        "gsa-refresh-token",
        { body: { teacher_id: teacherId } },
      );
      if (error || !data?.access_token) return null;
      return data.access_token;
    } catch {
      return null;
    }
  }, [teacherId]);

  // Get the current Google access token — DB first (with auto-refresh when
  // stale), then live session as a fallback for the very first connect.
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (teacherId) {
      const { data } = await supabase
        .from("google_classroom_connections")
        .select("access_token, token_expires_at, refresh_token")
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (data) {
        const expiresAt = data.token_expires_at ? Date.parse(data.token_expires_at) : 0;
        const staleIn   = expiresAt - Date.now();
        // Refresh if expiring within 5 min and we have a refresh_token.
        if (data.refresh_token && (!expiresAt || staleIn < 5 * 60 * 1000)) {
          const fresh = await refreshAccessToken();
          if (fresh) return fresh;
        }
        if (data.access_token && staleIn > 0) return data.access_token;
      }
    }

    // First-connect path: read the freshly-issued provider_token from session.
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token ?? null;
  }, [teacherId, refreshAccessToken]);

  // Persist a freshly-issued token bundle. Called right after the OAuth
  // callback so we capture refresh_token + expires_at while they're still
  // present on the session object.
  const persistToken = useCallback(async (token: string, refreshToken?: string | null, expiresIn?: number | null) => {
    if (!teacherId) return;
    const payload: Record<string, unknown> = {
      teacher_id: teacherId,
      access_token: token,
      last_sync_at: new Date().toISOString(),
    };
    if (refreshToken) payload.refresh_token = refreshToken;
    if (typeof expiresIn === "number" && expiresIn > 0) {
      payload.token_expires_at = new Date(Date.now() + expiresIn * 1000).toISOString();
    }
    await supabase
      .from("google_classroom_connections")
      .upsert(payload);
  }, [teacherId]);

  // Wrap classroomFetch with a single retry-after-refresh on TOKEN_EXPIRED.
  // Every call site routes through this so we don't have to repeat the
  // try/refresh/retry dance.
  const apiCall = useCallback(async <T = unknown>(path: string): Promise<T> => {
    const token = await getAccessToken();
    if (!token) throw new Error("NO_TOKEN");
    try {
      return await classroomFetch(path, token) as T;
    } catch (err) {
      if (err instanceof Error && err.message === "TOKEN_EXPIRED") {
        const fresh = await refreshAccessToken();
        if (!fresh) throw new Error("NO_TOKEN");
        return await classroomFetch(path, fresh) as T;
      }
      throw err;
    }
  }, [getAccessToken, refreshAccessToken]);

  const loadLinkedActivities = useCallback(async () => {
    if (!teacherId) return;
    const { data } = await supabase
      .from("classroom_activity_links")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setLinkedActivities((data ?? []) as ActivityLink[]);
  }, [teacherId]);

  const scanImportedCourses = useCallback(async () => {
    if (!teacherId) return;
    const { data } = await supabase
      .from("classes")
      .select("description")
      .eq("teacher_id", teacherId)
      .like("description", "Importada do Google Classroom (ID: %)");

    if (data) {
      const ids = data
        .map(c => c.description?.match(/ID: ([^)]+)/)?.[1])
        .filter((id): id is string => !!id);
      setImportedCourseIds(new Set(ids));
    }
  }, [teacherId]);

  // Check if the token has Classroom scopes by attempting a lightweight API call
  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      // Drain the OAuth callback: if the session still carries provider_token
      // / provider_refresh_token (only available right after the redirect from
      // Google), capture them BEFORE doing anything else. This is the single
      // moment the refresh_token is exposed to the client.
      const { data: { session } } = await supabase.auth.getSession();
      const sessionWithProvider = session as (typeof session & {
        provider_token?: string | null;
        provider_refresh_token?: string | null;
        expires_in?: number | null;
      }) | null;
      if (teacherId && sessionWithProvider?.provider_token) {
        await persistToken(
          sessionWithProvider.provider_token,
          sessionWithProvider.provider_refresh_token ?? null,
          // Google access tokens last 3600s; Supabase's session.expires_in is
          // for the Supabase JWT, not provider. Use 3600 as a safe default.
          3600,
        );
      }

      const token = await getAccessToken();
      if (!token) { setIsConnected(false); return; }

      try {
        await classroomFetch("/courses?courseStates=ACTIVE&pageSize=1", token);
      } catch (err) {
        // Token went stale between fetch and use — refresh once and retry.
        if (err instanceof Error && err.message === "TOKEN_EXPIRED") {
          const fresh = await refreshAccessToken();
          if (!fresh) throw err;
          await classroomFetch("/courses?courseStates=ACTIVE&pageSize=1", fresh);
        } else {
          throw err;
        }
      }
      setIsConnected(true);

      void loadLinkedActivities();
      void scanImportedCourses();
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, persistToken, refreshAccessToken, loadLinkedActivities, scanImportedCourses, teacherId]);

  useEffect(() => {
    if (teacherId) checkConnection();
  }, [teacherId, checkConnection]);

  // Re-authenticate with Classroom scopes
  const connectClassroom = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: [
          "email",
          "profile",
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.rosters.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
        ].join(" "),
        redirectTo: `${window.location.origin}/professor`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const fetchCourses = useCallback(async () => {
    const data = await apiCall<{ courses?: ClassroomCourse[] }>("/courses?courseStates=ACTIVE");
    const list: ClassroomCourse[] = (data.courses ?? []).filter(
      (c: ClassroomCourse) => c.courseState === "ACTIVE"
    );
    setCourses(list);
    return list;
  }, [apiCall]);

  const fetchStudents = useCallback(async (courseId: string): Promise<ClassroomStudent[]> => {
    const data = await apiCall<{ students?: Array<{ userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }> }>(`/courses/${courseId}/students`);
    return (data.students ?? []).map((s) => ({
      userId: s.userId,
      fullName: s.profile?.name?.fullName ?? "Sem nome",
      emailAddress: s.profile?.emailAddress ?? "",
    }));
  }, [apiCall]);

  const importCourse = useCallback(async (course: ClassroomCourse, onStudentsStep?: () => void): Promise<ImportResult> => {
    if (!teacherId) throw new Error("Sem professor autenticado");
    setIsSyncing(true);
    const token = await getAccessToken();
    try {
      // 1. Create class in WIT Dungeon (use upsert to avoid duplicate key)
      const className = course.name + (course.section ? ` - ${course.section}` : "");

      // Check if class with same name already exists
      const { data: existing } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", teacherId)
        .eq("name", className)
        .maybeSingle();

      let newClass = existing;

      if (!existing) {
        const { data: inserted, error: classError } = await supabase
          .from("classes")
          .insert({
            name: className,
            teacher_id: teacherId,
            description: `Importada do Google Classroom (ID: ${course.id})`,
          })
          .select()
          .single();

        if (classError) throw classError;
        newClass = inserted;
      }

      // 2. Fetch students from Classroom
      onStudentsStep?.();
      const students = await fetchStudents(course.id);

      // 3. Insert students into WIT Dungeon (filtering existing ones)
      let studentsImported = 0;
      if (students.length > 0) {
        const { data: existingStudents } = await supabase
          .from("students")
          .select("classroom_user_id, name")
          .eq("class_id", newClass.id);

        const existingUserIds = new Set(existingStudents?.map(s => s.classroom_user_id).filter(Boolean));
        const existingNames = new Set(existingStudents?.map(s => s.name));

        const newStudents = students.filter(s =>
          !existingUserIds.has(s.userId) && !existingNames.has(s.fullName)
        );

        if (newStudents.length > 0) {
          const records = newStudents.map((s) => ({
            name: s.fullName,
            class_id: newClass.id,
            teacher_id: teacherId,
            status: "active",
            coins: 50,
            level: 1,
            presencas_consecutivas: 0,
            classroom_user_id: s.userId,
            classroom_email: s.emailAddress,
          }));
          const { error: studentsError } = await supabase.from("students").insert(records);
          if (studentsError) throw studentsError;
          studentsImported = newStudents.length;
        }
      }

      // 4. Update last_sync_at in connection table
      await persistToken(token!);

      setImportedCourseIds((prev) => new Set([...prev, course.id]));

      return { className, studentsImported };
    } finally {
      setIsSyncing(false);
    }
  }, [teacherId, fetchStudents, getAccessToken, persistToken]);

  const fetchCoursework = useCallback(async (courseId: string): Promise<ClassroomCoursework[]> => {
    const data = await apiCall<{ courseWork?: ClassroomCoursework[] }>(
      `/courses/${courseId}/courseWork?orderBy=updateTime%20desc&pageSize=20`
    );
    return ((data.courseWork ?? []) as ClassroomCoursework[]).filter(
      (cw) => cw.state === "PUBLISHED"
    );
  }, [apiCall]);

  const linkActivity = useCallback(async (
    course: ClassroomCourse,
    coursework: ClassroomCoursework,
    classId: string | null,
    rewardCoins: number
  ): Promise<void> => {
    if (!teacherId) throw new Error("NO_TEACHER");
    const { error } = await supabase
      .from("classroom_activity_links")
      .upsert({
        teacher_id: teacherId,
        course_id: course.id,
        coursework_id: coursework.id,
        title: coursework.title,
        class_id: classId,
        reward_coins: rewardCoins,
      });
    if (error) throw error;
    await loadLinkedActivities();
  }, [teacherId, loadLinkedActivities]);

  const unlinkActivity = useCallback(async (linkId: string): Promise<void> => {
    const { error } = await supabase
      .from("classroom_activity_links")
      .delete()
      .eq("id", linkId);
    if (error) throw error;
    await loadLinkedActivities();
  }, [loadLinkedActivities]);

  const syncActivity = useCallback(async (link: ActivityLink): Promise<SyncResult> => {
    const data = await apiCall<{ studentSubmissions?: Array<{ userId: string; state: string }> }>(
      `/courses/${link.course_id}/courseWork/${link.coursework_id}/studentSubmissions`
    );

    const submissions: Array<{ userId: string; state: string }> = data.studentSubmissions ?? [];
    let rewarded = 0;
    let skipped = 0;
    let notFound = 0;

    for (const sub of submissions) {
      if (sub.state !== "TURNED_IN" && sub.state !== "RETURNED") continue;

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("classroom_user_id", sub.userId)
        .eq("teacher_id", teacherId!)
        .maybeSingle();

      if (!student) { notFound++; continue; }

      const { data: awarded } = await supabase.rpc("award_classroom_activity", {
        p_link_id: link.id,
        p_student_id: student.id,
        p_submission_state: sub.state,
        p_reward_coins: link.reward_coins,
      });

      if (awarded) rewarded++;
      else skipped++;
    }

    await supabase
      .from("classroom_activity_links")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", link.id);

    await loadLinkedActivities();
    return { rewarded, skipped, notFound };
  }, [apiCall, teacherId, loadLinkedActivities]);

  return {
    isConnected,
    courses,
    isLoading,
    isSyncing,
    importedCourseIds,
    linkedActivities,
    checkConnection,
    connectClassroom,
    fetchCourses,
    fetchStudents,
    importCourse,
    fetchCoursework,
    loadLinkedActivities,
    linkActivity,
    unlinkActivity,
    syncActivity,
  };
}
