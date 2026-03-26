import { useState, useEffect } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { Swords } from "lucide-react";

interface ClassWar {
  id: string;
  title: string;
  class_a_id: string;
  class_b_id: string;
  class_a_score: number;
  class_b_score: number;
  ends_at: string;
}

interface Props {
  classId: string;
  studentContribution?: number;
}

function timeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Encerrada';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function ClassWarBanner({ classId, studentContribution = 0 }: Props) {
  const [war, setWar] = useState<ClassWar | null>(null);
  const [classAName, setClassAName] = useState('');
  const [classBName, setClassBName] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAnon
        .from('class_wars')
        .select('*')
        .eq('status', 'active')
        .or(`class_a_id.eq.${classId},class_b_id.eq.${classId}`)
        .gte('ends_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return;
      const war = data as ClassWar;
      setWar(war);

      // Load class names
      const { data: classes } = await supabaseAnon
        .from('classes')
        .select('id, name')
        .in('id', [war.class_a_id, war.class_b_id]);
      const map: Record<string, string> = {};
      for (const c of classes ?? []) map[c.id] = c.name;
      setClassAName(map[war.class_a_id] ?? 'Turma A');
      setClassBName(map[war.class_b_id] ?? 'Turma B');
    };
    load();

    // Realtime
    const channel = supabaseAnon
      .channel(`classwar-banner-${classId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'class_wars' }, (payload) => {
        setWar(prev => prev && prev.id === payload.new.id ? payload.new as ClassWar : prev);
      })
      .subscribe();
    return () => { supabaseAnon.removeChannel(channel); };
  }, [classId]);

  if (!war) return null;

  const total = war.class_a_score + war.class_b_score;
  const myScore = classId === war.class_a_id ? war.class_a_score : war.class_b_score;
  const oppScore = classId === war.class_a_id ? war.class_b_score : war.class_a_score;
  const myName = classId === war.class_a_id ? classAName : classBName;
  const oppName = classId === war.class_a_id ? classBName : classAName;
  const myPct = total > 0 ? (myScore / total) * 100 : 50;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'linear-gradient(135deg, rgba(30,10,50,0.9) 0%, rgba(50,10,30,0.9) 100%)',
        border: '1px solid rgba(239,68,68,0.3)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={14} style={{ color: '#ef4444' }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
            Class War Ativa!
          </p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Termina em: {timeRemaining(war.ends_at)}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-xs font-bold uppercase" style={{ color: '#a78bfa' }}>{myName}</p>
          <p className="text-xl font-bold" style={{ color: '#a78bfa' }}>{myScore}</p>
        </div>
        <Swords size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
        <div className="text-center">
          <p className="text-xs font-bold uppercase" style={{ color: '#ef4444' }}>{oppName}</p>
          <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{oppScore}</p>
        </div>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${myPct}%`, background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span>Sua contribuição: <span style={{ color: '#a78bfa' }}>{studentContribution} pts</span></span>
        <span>Missões/Bosses/Desafios = pontos!</span>
      </div>
    </div>
  );
}
