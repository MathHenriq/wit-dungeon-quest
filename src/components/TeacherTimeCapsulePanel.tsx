import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Users, Lock, Unlock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  teacherId: string;
  classes: { id: string; name: string }[];
}

interface CapsuleStats {
  classId: string;
  className: string;
  totalStudents: number;
  sealedCount: number;
  openDate: string | null;
  isActive: boolean;
}

export function TeacherTimeCapsulePanel({ teacherId, classes }: Props) {
  const [stats, setStats] = useState<CapsuleStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDateInputs, setOpenDateInputs] = useState<Record<string, string>>({});
  const [activating, setActivating] = useState<string | null>(null);
  const [forceOpening, setForceOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: students } = await supabase
        .from('students')
        .select('id, class_id')
        .eq('teacher_id', teacherId)
        .eq('status', 'active');

      const { data: capsules } = await supabase
        .from('time_capsules')
        .select('student_id, sealed_at, open_date, opened, is_active')
        .eq('teacher_id', teacherId);

      const classStats: CapsuleStats[] = classes.map(cls => {
        const classStudents = (students ?? []).filter(s => s.class_id === cls.id);
        const classCapsules = (capsules ?? []).filter(c =>
          classStudents.some(s => s.id === c.student_id)
        );
        const sealedCapsules = classCapsules.filter(c => c.sealed_at);
        const firstCapsule = classCapsules[0];
        return {
          classId: cls.id,
          className: cls.name,
          totalStudents: classStudents.length,
          sealedCount: sealedCapsules.length,
          openDate: firstCapsule?.open_date ?? null,
          isActive: firstCapsule?.is_active ?? false,
        };
      });

      setStats(classStats);
      // Initialize open date inputs
      const inputs: Record<string, string> = {};
      for (const s of classStats) {
        inputs[s.classId] = s.openDate
          ? new Date(s.openDate).toISOString().slice(0, 10)
          : '';
      }
      setOpenDateInputs(inputs);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, classes]);

  useEffect(() => { load(); }, [load]);

  async function handleActivate(classId: string) {
    const openDate = openDateInputs[classId];
    if (!openDate) { toast.error('Defina uma data de abertura primeiro.'); return; }

    setActivating(classId);
    try {
      // Upsert activation: update existing or insert placeholder capsules for each student
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (!classStudents?.length) { toast.error('Nenhum aluno ativo nesta turma.'); return; }

      // Update existing capsules
      await supabase
        .from('time_capsules')
        .update({ open_date: openDate, is_active: true })
        .eq('teacher_id', teacherId)
        .in('student_id', classStudents.map(s => s.id));

      toast.success(`Cápsulas ativadas para ${stats.find(s => s.classId === classId)?.className}. Data de abertura: ${new Date(openDate).toLocaleDateString('pt-BR')}`);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao ativar cápsulas.');
    } finally {
      setActivating(null);
    }
  }

  async function handleForceOpen(classId: string) {
    const cls = stats.find(s => s.classId === classId);
    if (!cls) return;

    setForceOpening(classId);
    try {
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (!classStudents?.length) return;

      await supabase
        .from('time_capsules')
        .update({ opened: true, opened_at: new Date().toISOString() })
        .eq('teacher_id', teacherId)
        .in('student_id', classStudents.map(s => s.id))
        .not('sealed_at', 'is', null);

      toast.success(`Todas as cápsulas de "${cls.className}" foram abertas.`);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao abrir cápsulas.');
    } finally {
      setForceOpening(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ative cápsulas por turma. Os alunos as selam com uma mensagem ao futuro — serão abertas na data definida.
        </p>
        <button onClick={load} className="text-muted-foreground hover:text-foreground">
          <RefreshCw size={14} />
        </button>
      </div>

      {classes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma turma cadastrada.</p>
      )}

      {stats.map(cls => {
        const isReady = cls.openDate && new Date(cls.openDate) <= new Date();
        return (
          <div key={cls.classId} className="card-fantasy border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold" />
                <p className="font-semibold text-foreground">{cls.className}</p>
                {cls.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Ativa</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={13} />
                <span>{cls.sealedCount}/{cls.totalStudents} seladas</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: cls.totalStudents > 0 ? `${(cls.sealedCount / cls.totalStudents) * 100}%` : '0%' }}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data de abertura</p>
                <input
                  type="date"
                  value={openDateInputs[cls.classId] ?? ''}
                  onChange={e => setOpenDateInputs(prev => ({ ...prev, [cls.classId]: e.target.value }))}
                  className="bg-background border border-border rounded px-2 py-1 text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleActivate(cls.classId)}
                disabled={activating === cls.classId}
                className="bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 gap-1.5 text-xs"
              >
                {activating === cls.classId ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                {cls.isActive ? 'Atualizar' : 'Ativar cápsulas'}
              </Button>

              {isReady && cls.sealedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleForceOpen(cls.classId)}
                  disabled={forceOpening === cls.classId}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5 text-xs"
                >
                  {forceOpening === cls.classId ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                  Abrir todas as cápsulas
                </Button>
              )}
            </div>

            {cls.openDate && (
              <p className="text-xs text-muted-foreground">
                Abre em: <span className="text-foreground">{new Date(cls.openDate).toLocaleDateString('pt-BR')}</span>
                {isReady && <span className="text-amber-400 ml-2">— data atingida!</span>}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
