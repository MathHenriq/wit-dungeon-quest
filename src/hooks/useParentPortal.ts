import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ParentChild {
  student_id: string;
  name: string;
  character_name: string | null;
  level: number;
  class_name: string;
}

interface MissionItem { title: string; reward: number; completed_at: string; }
interface BossItem { boss_name: string; title: string; defeated: boolean; score: number; }
interface SkillItem { name: string; description: string; completed_at: string; }
interface Achievement { message: string; type: string; created_at: string; }
interface XpEvent { day: string; xp: number; }

export interface ChildSummary {
  student: {
    name: string;
    character_name: string | null;
    level: number;
    xp: number;
    coins: number;
    streak_current: number;
    streak_best: number;
    presencas_consecutivas: number;
    total_missions: number;
    total_bosses: number;
    class_name: string;
    character_class: string | null;
  };
  missions_completed: MissionItem[];
  bosses_faced: BossItem[];
  skills_completed: SkillItem[];
  achievements: Achievement[];
  login_count: number;
  xp_events: XpEvent[];
}

export function useParentPortal() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>('');
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ChildSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const loadParent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pa } = await supabase
        .from('parent_accounts')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (!pa) return;

      setParentId(pa.id);
      setParentName((pa as { id: string; name: string }).name || user.email || '');

      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id, students(id, name, character_name, level, class_id, classes(name))')
        .eq('parent_id', pa.id)
        .eq('verified', true);

      const kids: ParentChild[] = ((links || []) as unknown[]).map((l: unknown) => {
        const link = l as { student_id: string; students: { name: string; character_name: string | null; level: number; classes: { name: string } | null } | null };
        return {
          student_id: link.student_id,
          name: link.students?.name ?? '',
          character_name: link.students?.character_name ?? null,
          level: link.students?.level ?? 1,
          class_name: link.students?.classes?.name ?? '',
        };
      });

      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId(prev => prev ?? kids[0].student_id);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async (studentId: string, days = 7) => {
    setIsSummaryLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('get_parent_child_summary', {
        p_student_id: studentId,
        p_days: days,
      });
      if (error) throw error;
      setSummary(data as ChildSummary);
    } catch (err) {
      console.error('[useParentPortal] loadSummary error:', err);
      setSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParent();
  }, [loadParent]);

  useEffect(() => {
    if (selectedChildId) {
      loadSummary(selectedChildId);
    }
  }, [selectedChildId, loadSummary]);

  const redeemInvite = async (code: string, name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('redeem_parent_invite', {
      p_invite_code: code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      p_parent_name: name,
    });
    if (error) throw error;
    return data as { success: boolean; error?: string; student_id?: string };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    parentId, parentName, children, selectedChildId, setSelectedChildId,
    summary, isLoading, isSummaryLoading,
    loadParent, loadSummary, redeemInvite, logout,
  };
}

export function generateSuggestedQuestions(summary: ChildSummary): string[] {
  const questions: string[] = [];

  summary.skills_completed?.forEach(skill => {
    questions.push(`"O que é ${skill.name}? Pode me explicar de um jeito simples?"`);
  });

  summary.bosses_faced?.filter(b => b.defeated).forEach(boss => {
    questions.push(`"O que o desafio '${boss.title || boss.boss_name}' testava? Foi difícil?"`);
  });

  summary.bosses_faced?.filter(b => !b.defeated).forEach(boss => {
    questions.push(`"Vi que o desafio '${boss.title || boss.boss_name}' foi difícil. O que faltou pra vencer?"`);
  });

  summary.missions_completed?.forEach(m => {
    questions.push(`"Pode me contar o que você fez na missão '${m.title}'?"`);
  });

  if (questions.length < 2) {
    questions.push('"O que você está aprendendo na aula esta semana?"');
    questions.push('"Tem algum desafio no sistema que está achando difícil?"');
    questions.push('"O que você mais gosta de fazer nas aulas?"');
  }

  return questions.slice(0, 5);
}
