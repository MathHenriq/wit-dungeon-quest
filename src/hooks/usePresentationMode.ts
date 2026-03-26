import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Student } from "@/types";

export interface ClassWar {
  id: string;
  title: string;
  class_a_id: string;
  class_b_id: string;
  class_a_score: number;
  class_b_score: number;
  ends_at: string;
}

export interface LiveAchievement {
  id: string;
  student_name: string;
  character_name: string | null;
  achievement: string;
  created_at: string;
}

export type PresentationView = 'leaderboard' | 'classwar' | 'achievements' | 'stats';

export function usePresentationMode(teacherId: string, classId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [achievements, setAchievements] = useState<LiveAchievement[]>([]);
  const [classWar, setClassWar] = useState<ClassWar | null>(null);
  const [classNames, setClassNames] = useState<Record<string, string>>({});
  const [view, setView] = useState<PresentationView>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  const loadStudents = useCallback(async () => {
    let q = supabase
      .from('students')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .order('xp', { ascending: false });
    if (classId) q = q.eq('class_id', classId);
    const { data } = await q;
    setStudents((data ?? []) as Student[]);
  }, [teacherId, classId]);

  const loadClassWar = useCallback(async () => {
    const { data } = await supabase
      .from('class_wars')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setClassWar(data as ClassWar | null);
  }, [teacherId]);

  const loadClasses = useCallback(async () => {
    const { data } = await supabase.from('classes').select('id, name').eq('teacher_id', teacherId);
    const m: Record<string, string> = {};
    for (const c of data ?? []) m[c.id] = c.name;
    setClassNames(m);
  }, [teacherId]);

  const loadAchievements = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: studentIds } = await supabase
      .from('students')
      .select('id, name, character_name')
      .eq('teacher_id', teacherId);
    const ids = (studentIds ?? []).map(s => s.id);
    if (!ids.length) return;

    const { data } = await supabase
      .from('achievement_feed')
      .select('id, student_id, achievement, created_at')
      .in('student_id', ids)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    const nameMap: Record<string, { name: string; character_name: string | null }> = {};
    for (const s of studentIds ?? []) nameMap[s.id] = { name: s.name, character_name: s.character_name };

    setAchievements((data ?? []).map(a => ({
      id: a.id,
      student_name: nameMap[a.student_id]?.name ?? 'Aluno',
      character_name: nameMap[a.student_id]?.character_name ?? null,
      achievement: a.achievement,
      created_at: a.created_at,
    })));
  }, [teacherId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadStudents(), loadClassWar(), loadClasses(), loadAchievements()]);
      setIsLoading(false);
    };
    init();

    // Realtime subscriptions
    const channel = supabase
      .channel(`presentation-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => loadStudents())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'achievement_feed' }, (payload) => {
        const row = payload.new as { id: string; student_id: string; achievement: string; created_at: string };
        setAchievements(prev => [{
          id: row.id,
          student_name: 'Aluno',
          character_name: null,
          achievement: row.achievement,
          created_at: row.created_at,
        }, ...prev].slice(0, 20));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_wars' }, () => loadClassWar())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setOnlineCount(prev => prev);
      });

    // Presence to track online count
    const presenceChannel = supabase.channel(`presence-${teacherId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ teacher_id: teacherId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [teacherId, loadStudents, loadClassWar, loadClasses, loadAchievements]);

  return { students, achievements, classWar, classNames, view, setView, isLoading, onlineCount };
}
