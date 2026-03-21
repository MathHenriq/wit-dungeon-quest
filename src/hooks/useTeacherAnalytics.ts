import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsFilters {
  period: number;      // dias
  classId: string | null; // null = todas
}

export function useTeacherAnalytics(teacherId: string | undefined) {
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: 30, classId: null });
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [heatmap, setHeatmap] = useState<{ day_of_week: number; hour: number; count: number }[] | null>(null);
  const [dailyActivity, setDailyActivity] = useState<{ date: string; logins: number; missions: number; challenges: number; unique_students: number }[] | null>(null);
  const [riskScores, setRiskScores] = useState<{ student_id: string; student_name: string; class_id: string; level: number; days_since_last_login: number; logins_last_14_days: number; missions_last_14_days: number; streak_current: number; risk_score: number }[] | null>(null);
  const [classComparison, setClassComparison] = useState<{ class_id: string; class_name: string; student_count: number; avg_level: number; total_logins: number; total_missions: number; active_students: number; avg_streak: number }[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (!teacherId) return;
    setIsLoading(true);
    try {
      const [overviewRes, heatmapRes, dailyRes, riskRes, compRes] = await Promise.all([
        supabase.rpc("get_analytics_overview", { p_teacher_id: teacherId, p_days: filters.period }),
        supabase.rpc("get_engagement_heatmap", { p_teacher_id: teacherId, p_days: filters.period }),
        supabase.rpc("get_daily_activity", { p_teacher_id: teacherId, p_days: filters.period, p_class_id: filters.classId }),
        supabase.rpc("get_student_risk_scores", { p_teacher_id: teacherId }),
        supabase.rpc("get_class_comparison", { p_teacher_id: teacherId, p_days: filters.period }),
      ]);

      if (overviewRes.data)    setOverview(overviewRes.data as Record<string, number>);
      if (heatmapRes.data)     setHeatmap(heatmapRes.data as typeof heatmap);
      if (dailyRes.data)       setDailyActivity(dailyRes.data as typeof dailyActivity);
      if (riskRes.data)        setRiskScores(riskRes.data as typeof riskScores);
      if (compRes.data)        setClassComparison(compRes.data as typeof classComparison);
    } catch (err) {
      console.error("[useTeacherAnalytics] loadAll error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, filters]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadStudentDNA = async (studentId: string) => {
    const { data } = await supabase.rpc("get_student_dna", { p_student_id: studentId });
    return data as Record<string, number> | null;
  };

  const seedDemo = async () => {
    if (!teacherId) return;
    // Busca alunos e turmas do professor
    const { data: students } = await supabase
      .from("students")
      .select("id, class_id")
      .eq("teacher_id", teacherId)
      .eq("status", "active")
      .limit(30);

    if (!students || students.length === 0) return;

    const eventTypes = ["login", "mission_complete", "challenge_complete", "shop_purchase", "attendance", "session_start", "session_end", "page_view"];
    const events = [];
    const now = Date.now();

    for (let i = 0; i < 500; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      events.push({
        teacher_id: teacherId,
        student_id: student.id,
        class_id: student.class_id,
        event_type: eventType,
        event_data: eventType === "session_end" ? { duration_minutes: Math.floor(Math.random() * 60) + 5 } : {},
        created_at: createdAt,
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < events.length; i += 100) {
      await supabase.from("analytics_events").insert(events.slice(i, i + 100));
    }

    await loadAll();
  };

  return {
    filters,
    setFilters,
    overview,
    heatmap,
    dailyActivity,
    riskScores,
    classComparison,
    isLoading,
    loadStudentDNA,
    seedDemo,
    refresh: loadAll,
  };
}
