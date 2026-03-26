import { useState, useEffect } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import type { Student } from "@/types";
import { Loader2, Lock, Unlock, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  student: Student;
}

interface Capsule {
  id: string;
  message: string | null;
  goals: string | null;
  snapshot_data: Record<string, unknown> | null;
  sealed_at: string | null;
  open_date: string | null;
  opened: boolean;
  is_active: boolean;
}

function StatBar({ label, before, after }: { label: string; before: number; after: number }) {
  const max = Math.max(before, after, 1);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span className="text-white/80">
          <span className="text-white/40">{before}</span>
          <span className="mx-1 text-cyan-400">→</span>
          <span className="text-cyan-400 font-bold">{after}</span>
        </span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${(before / max) * 100}%`, background: 'rgba(255,255,255,0.2)' }}
        />
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
          style={{ width: `${(after / max) * 100}%`, background: 'rgba(0,229,255,0.7)', boxShadow: '0 0 6px rgba(0,229,255,0.4)' }}
        />
      </div>
    </div>
  );
}

export function TimeCapsule({ student }: Props) {
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [goals, setGoals] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [openDate, setOpenDate] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load capsule — use anon client so it works for both auth types
        const client = student.user_id ? supabaseStudent : supabaseAnon;
        const { data } = await (client as typeof supabaseAnon)
          .from('time_capsules')
          .select('*')
          .eq('student_id', student.id)
          .maybeSingle();

        if (data) {
          const c = data as Capsule;
          setCapsule(c);
          if (c.open_date) setOpenDate(new Date(c.open_date));
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [student]);

  async function handleSeal() {
    if (!message.trim()) { toast.error('Escreva uma mensagem para o futuro.'); return; }
    setIsSealing(true);
    try {
      const snapshot = {
        level: student.level,
        xp: (student as { xp?: number }).xp ?? 0,
        coins: student.coins ?? 0,
        streak_current: student.presencas_consecutivas ?? 0,
        total_missions: (student as { total_missions_completed?: number }).total_missions_completed ?? 0,
        total_bosses: (student as { total_boss_kills?: number }).total_boss_kills ?? 0,
        character_class: student.character_class,
        character_name: student.character_name,
      };

      const row = {
        student_id: student.id,
        teacher_id: student.teacher_id,
        message: message.trim(),
        goals: goals.trim() || null,
        snapshot_data: snapshot,
        sealed_at: new Date().toISOString(),
        open_date: openDate?.toISOString() ?? null,
        opened: false,
        is_active: true,
      };

      const client = student.user_id ? supabaseStudent : supabaseAnon;
      if (capsule) {
        await (client as typeof supabaseAnon)
          .from('time_capsules')
          .update(row)
          .eq('id', capsule.id);
      } else {
        await (client as typeof supabaseAnon)
          .from('time_capsules')
          .insert(row);
      }

      toast.success('Cápsula selada! Ela será aberta na data definida.');
      // Reload
      const { data } = await (client as typeof supabaseAnon)
        .from('time_capsules')
        .select('*')
        .eq('student_id', student.id)
        .maybeSingle();
      if (data) setCapsule(data as Capsule);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao selar cápsula.');
    } finally {
      setIsSealing(false);
    }
  }

  async function handleOpen() {
    if (!capsule) return;
    setIsOpening(true);
    try {
      const client = student.user_id ? supabaseStudent : supabaseAnon;
      await (client as typeof supabaseAnon)
        .from('time_capsules')
        .update({ opened: true, opened_at: new Date().toISOString() })
        .eq('id', capsule.id);
      setCapsule(prev => prev ? { ...prev, opened: true } : prev);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao abrir cápsula.');
    } finally {
      setIsOpening(false);
    }
  }

  const canOpen = capsule?.open_date
    ? new Date(capsule.open_date) <= new Date()
    : false;

  const daysUntilOpen = capsule?.open_date
    ? Math.max(0, Math.ceil((new Date(capsule.open_date).getTime() - Date.now()) / 86400000))
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin" style={{ color: '#00e5ff' }} size={28} />
      </div>
    );
  }

  const cardStyle = {
    background: 'rgba(10,14,26,0.7)',
    border: '1px solid rgba(0,229,255,0.12)',
    borderRadius: '16px',
    padding: '24px',
  };

  // ── Estado 4: Aberta ──
  if (capsule?.opened && capsule.sealed_at) {
    const snap = capsule.snapshot_data as Record<string, number & string> | null;
    const before = snap ?? {};
    return (
      <div style={cardStyle} className="space-y-5">
        <div className="text-center">
          <Unlock size={32} className="mx-auto mb-2" style={{ color: '#ffd700' }} />
          <h3 className="font-display text-xl font-bold" style={{ color: '#ffd700' }}>Cápsula do Tempo — Aberta</h3>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Selada em {new Date(capsule.sealed_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {capsule.message && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#00e5ff' }}>Sua mensagem:</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>"{capsule.message}"</p>
          </div>
        )}

        {capsule.goals && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#a78bfa' }}>Seus objetivos:</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>"{capsule.goals}"</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            — Evolução —
          </p>
          <div className="space-y-3">
            <StatBar label="Nível" before={Number(before.level ?? 0)} after={student.level} />
            <StatBar label="XP" before={Number(before.xp ?? 0)} after={(student as { xp?: number }).xp ?? 0} />
            <StatBar label="Moedas" before={Number(before.coins ?? 0)} after={student.coins ?? 0} />
            <StatBar label="Bosses" before={Number(before.total_bosses ?? 0)} after={(student as { total_boss_kills?: number }).total_boss_kills ?? 0} />
            <StatBar label="Missões" before={Number(before.total_missions ?? 0)} after={(student as { total_missions_completed?: number }).total_missions_completed ?? 0} />
          </div>
        </div>

        <p className="text-center text-sm font-bold" style={{ color: '#00e5ff' }}>
          Você cresceu incrivelmente!
        </p>
      </div>
    );
  }

  // ── Estado 3: Pronta pra abrir ──
  if (capsule?.sealed_at && canOpen && !capsule.opened) {
    return (
      <div style={{ ...cardStyle, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.04)' }} className="text-center space-y-5">
        <div>
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid rgba(255,215,0,0.4)', animation: 'pulse 2s infinite' }}>
            <Unlock size={36} style={{ color: '#ffd700' }} />
          </div>
          <h3 className="font-display text-xl font-bold" style={{ color: '#ffd700' }}>Sua Cápsula Está Pronta!</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>A hora chegou — veja como você evoluiu.</p>
        </div>
        <button
          onClick={handleOpen}
          disabled={isOpening}
          className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.5)', color: '#ffd700' }}
        >
          {isOpening ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
          {isOpening ? 'Abrindo...' : 'Abrir Cápsula'}
        </button>
      </div>
    );
  }

  // ── Estado 2: Selada (aguardando) ──
  if (capsule?.sealed_at && !capsule.opened) {
    return (
      <div style={cardStyle} className="text-center space-y-5">
        <div>
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <Lock size={36} style={{ color: 'rgba(0,229,255,0.6)' }} />
          </div>
          <h3 className="font-display text-lg font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Cápsula Selada</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Sua cápsula está segura.</p>
        </div>
        {capsule.open_date && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Abre em</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {new Date(capsule.open_date).toLocaleDateString('pt-BR')}
            </p>
            {daysUntilOpen !== null && daysUntilOpen > 0 && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Faltam {daysUntilOpen} {daysUntilOpen === 1 ? 'dia' : 'dias'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Estado 1: Não selada ──
  // Check if capsule feature is active for this student
  const isActive = capsule?.is_active ?? false;

  if (!isActive && !capsule) {
    return (
      <div style={cardStyle} className="text-center py-8">
        <Clock size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          A Cápsula do Tempo ainda não foi ativada pelo professor.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle} className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <Clock size={28} style={{ color: '#a78bfa' }} />
        </div>
        <h3 className="font-display text-lg font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Cápsula do Tempo</h3>
        {openDate && (
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Será aberta em {openDate.toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="rounded-xl p-3" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)' }}>
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Snapshot atual:</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Lv. {student.level} · {student.coins ?? 0} moedas · {(student as { total_boss_kills?: number }).total_boss_kills ?? 0} bosses · Streak {student.presencas_consecutivas ?? 0}
        </p>
      </div>

      <div>
        <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Mensagem para o seu eu do futuro: *
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder='Ex: "Quero chegar ao Level 20 e derrotar todos os bosses!"'
          className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
          }}
        />
      </div>

      <div>
        <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Meus objetivos: (opcional)
        </label>
        <textarea
          value={goals}
          onChange={e => setGoals(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder='Ex: "Aprender Python avançado e Machine Learning"'
          className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
          }}
        />
      </div>

      <button
        onClick={handleSeal}
        disabled={isSealing}
        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        style={{
          background: 'rgba(139,92,246,0.2)',
          border: '1px solid rgba(139,92,246,0.4)',
          color: '#a78bfa',
        }}
      >
        {isSealing ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
        {isSealing ? 'Selando...' : 'Selar Cápsula'}
      </button>
      <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Não poderá ser editada depois do selo.
      </p>
    </div>
  );
}
