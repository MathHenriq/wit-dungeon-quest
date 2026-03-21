import { useCallback, useRef } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";

interface TrackEventParams {
  event_type: string;
  student_id?: string;
  teacher_id: string;
  class_id?: string;
  event_data?: Record<string, unknown>;
}

export function useAnalytics() {
  const lastEventRef = useRef<Record<string, number>>({});

  const track = useCallback(async ({
    event_type,
    student_id,
    teacher_id,
    class_id,
    event_data = {},
  }: TrackEventParams) => {
    // Debounce: same event_type + student_id within 2 seconds = skip
    const key = `${event_type}-${student_id || "none"}`;
    const now = Date.now();
    if (lastEventRef.current[key] && now - lastEventRef.current[key] < 2000) {
      return;
    }
    lastEventRef.current[key] = now;

    try {
      await supabaseAnon.from("analytics_events").insert({
        event_type,
        student_id: student_id || null,
        teacher_id,
        class_id: class_id || null,
        event_data,
      });
    } catch (err) {
      console.error("[useAnalytics] track error:", err);
      // Analytics nunca deve quebrar o app — falha silenciosa
    }
  }, []);

  const trackLogin = useCallback(
    (teacherId: string, studentId: string, classId: string) =>
      track({ event_type: "login", teacher_id: teacherId, student_id: studentId, class_id: classId }),
    [track]
  );

  const trackMissionComplete = useCallback(
    (teacherId: string, studentId: string, classId: string, missionId: string, reward: number) =>
      track({ event_type: "mission_complete", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { mission_id: missionId, reward } }),
    [track]
  );

  const trackChallengeComplete = useCallback(
    (teacherId: string, studentId: string, classId: string, challengeId: string, reward: number) =>
      track({ event_type: "challenge_complete", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { challenge_id: challengeId, reward } }),
    [track]
  );

  const trackShopPurchase = useCallback(
    (teacherId: string, studentId: string, classId: string, itemId: string, cost: number, itemName: string) =>
      track({ event_type: "shop_purchase", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { item_id: itemId, cost, item_name: itemName } }),
    [track]
  );

  const trackLevelUp = useCallback(
    (teacherId: string, studentId: string, classId: string, newLevel: number) =>
      track({ event_type: "level_up", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { new_level: newLevel } }),
    [track]
  );

  const trackAttendance = useCallback(
    (teacherId: string, studentId: string, classId: string, streak: number) =>
      track({ event_type: "attendance", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { streak } }),
    [track]
  );

  const trackBossAttempt = useCallback(
    (teacherId: string, studentId: string, classId: string, bossId: string, defeated: boolean, score: number) =>
      track({ event_type: defeated ? "boss_victory" : "boss_attempt", teacher_id: teacherId, student_id: studentId, class_id: classId, event_data: { boss_id: bossId, defeated, score } }),
    [track]
  );

  const trackPageView = useCallback(
    (teacherId: string, studentId: string, page: string) =>
      track({ event_type: "page_view", teacher_id: teacherId, student_id: studentId, event_data: { page } }),
    [track]
  );

  const trackSessionStart = useCallback(
    (teacherId: string, studentId: string, classId: string) =>
      track({ event_type: "session_start", teacher_id: teacherId, student_id: studentId, class_id: classId }),
    [track]
  );

  const trackSessionEnd = useCallback(
    (teacherId: string, studentId: string, durationMinutes: number) =>
      track({ event_type: "session_end", teacher_id: teacherId, student_id: studentId, event_data: { duration_minutes: durationMinutes } }),
    [track]
  );

  return {
    track,
    trackLogin,
    trackMissionComplete,
    trackChallengeComplete,
    trackShopPurchase,
    trackLevelUp,
    trackAttendance,
    trackBossAttempt,
    trackPageView,
    trackSessionStart,
    trackSessionEnd,
  };
}
