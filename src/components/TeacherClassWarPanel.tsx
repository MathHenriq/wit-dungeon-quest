import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Swords, Loader2, Plus, X, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  teacherId: string;
  classes: { id: string; name: string }[];
}

interface ClassWar {
  id: string;
  title: string;
  class_a_id: string;
  class_b_id: string;
  class_a_score: number;
  class_b_score: number;
  winner_class_id: string | null;
  status: 'pending' | 'active' | 'finished';
  reward_coins: number;
  starts_at: string;
  ends_at: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function daysRemaining(ends: string) {
  const diff = new Date(ends).getTime() - Date.now();
  if (diff <= 0) return 'Encerrada';
  const days = Math.ceil(diff / 86400000);
  return `${days} dia${days !== 1 ? 's' : ''}`;
}

export function TeacherClassWarPanel({ teacherId, classes }: Props) {
  const [wars, setWars] = useState<ClassWar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [finalizing, setFinalizing] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [classAId, setClassAId] = useState(classes[0]?.id ?? '');
  const [classBId, setClassBId] = useState(classes[1]?.id ?? '');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [rewardCoins, setRewardCoins] = useState(15);
  const [isCreating, setIsCreating] = useState(false);

  const classMap: Record<string, string> = {};
  for (const c of classes) classMap[c.id] = c.name;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('class_wars')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      setWars((data ?? []) as ClassWar[]);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!title.trim()) { toast.error('Defina um título.'); return; }
    if (classAId === classBId) { toast.error('Selecione turmas diferentes.'); return; }
    if (new Date(endsAt) <= new Date(startsAt)) { toast.error('Data de fim deve ser após o início.'); return; }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('class_wars').insert({
        teacher_id: teacherId,
        title: title.trim(),
        class_a_id: classAId,
        class_b_id: classBId,
        class_a_score: 0,
        class_b_score: 0,
        status: 'active',
        reward_coins: rewardCoins,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt + 'T23:59:59').toISOString(),
      });
      if (error) throw error;
      toast.success('Guerra criada!');
      setShowForm(false);
      setTitle('');
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao criar guerra.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleFinalize(warId: string) {
    setFinalizing(warId);
    try {
      const { data, error } = await supabase.rpc('finalize_class_war', { p_war_id: warId });
      if (error) throw error;
      const result = data as { success: boolean; winner_class_id?: string };
      if (!result.success) { toast.error('Erro ao encerrar guerra.'); return; }
      const winnerName = result.winner_class_id ? classMap[result.winner_class_id] : 'Empate';
      toast.success(`Guerra encerrada! Vencedor: ${winnerName}`);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro.');
    } finally {
      setFinalizing(null);
    }
  }

  const activeWars = wars.filter(w => w.status === 'active');
  const finishedWars = wars.filter(w => w.status === 'finished');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Crie eventos de competição entre turmas. Atividades dos alunos geram pontos para a turma.
        </p>
        {classes.length >= 2 && (
          <Button size="sm" onClick={() => setShowForm(v => !v)}
            className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 gap-1.5 text-xs">
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Cancelar' : 'Criar Guerra'}
          </Button>
        )}
      </div>

      {classes.length < 2 && (
        <p className="text-sm text-amber-400 text-center py-4">Você precisa de pelo menos 2 turmas para criar uma guerra.</p>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card-fantasy border border-red-500/20 space-y-3">
          <p className="text-sm font-bold text-red-400">Nova Class War</p>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Batalha das Turmas"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Turma A</label>
              <select value={classAId} onChange={e => setClassAId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Turma B</label>
              <select value={classBId} onChange={e => setClassBId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Início</label>
              <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fim</label>
              <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Recompensa</label>
              <input type="number" value={rewardCoins} onChange={e => setRewardCoins(Number(e.target.value))} min={1}
                className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs" />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={isCreating}
            className="w-full bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 gap-2">
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
            {isCreating ? 'Criando...' : 'Criar Guerra'}
          </Button>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gold" size={24} /></div>}

      {/* Active wars */}
      {activeWars.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400">Guerras Ativas</p>
          {activeWars.map(war => {
            const total = war.class_a_score + war.class_b_score;
            const pctA = total > 0 ? (war.class_a_score / total) * 100 : 50;
            const isExpired = new Date(war.ends_at) <= new Date();
            return (
              <div key={war.id} className="card-fantasy border border-red-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-foreground">{war.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {isExpired ? <span className="text-amber-400">Prazo encerrado</span> : daysRemaining(war.ends_at)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{classMap[war.class_a_id] ?? '?'}</p>
                    <p className="text-2xl font-bold text-foreground">{war.class_a_score}</p>
                  </div>
                  <Swords size={20} className="text-red-400" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{classMap[war.class_b_id] ?? '?'}</p>
                    <p className="text-2xl font-bold text-foreground">{war.class_b_score}</p>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden bg-red-900/30">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-700"
                    style={{ width: `${pctA}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(war.starts_at)} — {formatDate(war.ends_at)}</span>
                  <span>Recompensa: {war.reward_coins} moedas por aluno</span>
                </div>

                <Button size="sm" onClick={() => handleFinalize(war.id)} disabled={finalizing === war.id}
                  className="w-full bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 gap-1.5 text-xs">
                  {finalizing === war.id ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                  Encerrar e Premiar Vencedores
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Finished wars */}
      {finishedWars.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Histórico</p>
          {finishedWars.slice(0, 5).map(war => (
            <div key={war.id} className="flex items-center justify-between text-xs p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-foreground/70">{war.title}</span>
              <span className="text-muted-foreground">
                {war.class_a_score} x {war.class_b_score}
                {war.winner_class_id && (
                  <span className="text-amber-400 ml-2">Vencedor: {classMap[war.winner_class_id] ?? '?'}</span>
                )}
                {!war.winner_class_id && <span className="text-cyan-400 ml-2">Empate</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && wars.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma guerra criada ainda.</p>
      )}
    </div>
  );
}
