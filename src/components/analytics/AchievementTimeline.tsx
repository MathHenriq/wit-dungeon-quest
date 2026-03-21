import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Star, Shield, Flame, Crown } from "lucide-react";

interface FeedItem {
  id: string;
  student_id: string;
  achievement_type: string;
  message: string;
  created_at: string;
}

interface Props {
  teacherId: string;
  classId: string | null;
}

const ICONS: Record<string, React.ReactNode> = {
  level_up:        <Star size={16} className="text-gold" />,
  boss_defeated:   <Shield size={16} className="text-red-400" />,
  title_earned:    <Crown size={16} className="text-purple-400" />,
  streak_milestone:<Flame size={16} className="text-orange-400" />,
  skill_unlocked:  <Zap size={16} className="text-blue-400" />,
  pet_evolved:     <Star size={16} className="text-emerald-400" />,
};

export function AchievementTimeline({ teacherId, classId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("achievement_feed")
        .select("id, student_id, achievement_type, message, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (classId) {
        // Filter by students in this class
        const { data: studentIds } = await supabase
          .from("students")
          .select("id")
          .eq("class_id", classId);
        if (studentIds && studentIds.length > 0) {
          query = query.in("student_id", studentIds.map((s) => s.id));
        }
      }

      const { data } = await query;
      setItems((data ?? []) as FeedItem[]);
      setLoading(false);
    };
    load();
  }, [teacherId, classId]);

  return (
    <div className="card-fantasy">
      <h3 className="font-display text-lg text-gold mb-4">🏆 Timeline de Conquistas</h3>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <Trophy size={36} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Nenhuma conquista registrada ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">As conquistas aparecem aqui quando alunos sobem de nível, desbloqueiam títulos, etc.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
              <div className="mt-0.5 shrink-0">
                {ICONS[item.achievement_type] ?? <Star size={16} className="text-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
