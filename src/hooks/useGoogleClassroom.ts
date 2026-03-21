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

  // Get the current Google access token — session first, then DB fallback
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) return session.provider_token;

    // Fallback: use stored token from DB (valid ~1h from last connect)
    if (!teacherId) return null;
    const { data } = await supabase
      .from("google_classroom_connections")
      .select("access_token")
      .eq("teacher_id", teacherId)
      .maybeSingle();
    return data?.access_token ?? null;
  }, [teacherId]);

  // Save a working token to DB so it survives session changes
  const persistToken = useCallback(async (token: string) => {
    if (!teacherId) return;
    await supabase
      .from("google_classroom_connections")
      .upsert({
        teacher_id: teacherId,
        access_token: token,
        last_sync_at: new Date().toISOString(),
      });
  }, [teacherId]);

  const loadLinkedActivities = useCallback(async () => {
    if (!teacherId) return;
    const { data } = await supabase
      .from("classroom_activity_links")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setLinkedActivities((data ?? []) as ActivityLink[]);
  }, [teacherId]);

  // Check if the token has Classroom scopes by attempting a lightweight API call
  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) { setIsConnected(false); return; }

      await classroomFetch("/courses?courseStates=ACTIVE&pageSize=1", token);
      setIsConnected(true);

      // Persist the working token so it survives re-logins
      void persistToken(token);
      void loadLinkedActivities();
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, persistToken, loadLinkedActivities]);

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
    const token = await getAccessToken();
    if (!token) throw new Error("NO_TOKEN");

    const data = await classroomFetch("/courses?courseStates=ACTIVE", token);
    const list: ClassroomCourse[] = (data.courses ?? []).filter(
      (c: ClassroomCourse) => c.courseState === "ACTIVE"
    );
    setCourses(list);
    return list;
  }, [getAccessToken]);

  const fetchStudents = useCallback(async (courseId: string): Promise<ClassroomStudent[]> => {
    const token = await getAccessToken();
    if (!token) throw new Error("NO_TOKEN");

    const data = await classroomFetch(`/courses/${courseId}/students`, token);
    return (data.students ?? []).map((s: { userId: string; profile?: { name?: { fullName?: string }; emailAddress?: string } }) => ({
      userId: s.userId,
      fullName: s.profile?.name?.fullName ?? "Sem nome",
      emailAddress: s.profile?.emailAddress ?? "",
    }));
  }, [getAccessToken]);

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

      // 3. Insert students into WIT Dungeon
      if (students.length > 0) {
        const records = students.map((s) => ({
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
      }

      // 4. Update last_sync_at in connection table
      await persistToken(token!);

      setImportedCourseIds((prev) => new Set([...prev, course.id]));

      return { className, studentsImported: students.length };
    } finally {
      setIsSyncing(false);
    }
  }, [teacherId, fetchStudents, getAccessToken, persistToken]);

  const fetchCoursework = useCallback(async (courseId: string): Promise<ClassroomCoursework[]> => {
    const token = await getAccessToken();
    if (!token) throw new Error("NO_TOKEN");
    const data = await classroomFetch(
      `/courses/${courseId}/courseWork?orderBy=updateTime%20desc&pageSize=20`,
      token
    );
    return ((data.courseWork ?? []) as ClassroomCoursework[]).filter(
      (cw) => cw.state === "PUBLISHED"
    );
  }, [getAccessToken]);

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
    const token = await getAccessToken();
    if (!token) throw new Error("NO_TOKEN");

    const data = await classroomFetch(
      `/courses/${link.course_id}/courseWork/${link.coursework_id}/studentSubmissions`,
      token
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
  }, [getAccessToken, teacherId, loadLinkedActivities]);

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
