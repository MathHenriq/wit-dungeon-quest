import { useState } from "react";
import { Plus, Trash2, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Challenge } from "@/types";

interface TeacherChallengesPanelProps {
  teacherId: string;
  challenges: Challenge[];
  onDataChanged: () => void;
}

export function TeacherChallengesPanel({ teacherId, challenges, onDataChanged }: TeacherChallengesPanelProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newReward, setNewReward] = useState(10);
  const [newType, setNewType] = useState<"simples" | "unica">("simples");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isAdding) return;

    setIsAdding(true);

    const timeout = setTimeout(() => {
      setIsAdding(false);
      toast.error("A operação demorou demais. Verifique sua conexão e tente novamente.");
    }, 10000);

    try {
      const { error } = await supabase.from("challenges").insert({
        teacher_id: teacherId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        reward: newReward,
        challenge_type: newType,
      });
      clearTimeout(timeout);

      if (error) {
        toast.error("Erro ao criar desafio", { description: error.message });
      } else {
        toast.success("Desafio criado com sucesso!");
        setNewTitle("");
        setNewDesc("");
        setNewReward(10);
        setNewType("simples");
        onDataChanged();
      }
    } catch {
      clearTimeout(timeout);
      toast.error("Erro inesperado ao criar desafio.");
    } finally {
      clearTimeout(timeout);
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_active: false })
        .eq("id", deleteTarget.id);

      if (error) {
        toast.error("Erro ao excluir desafio", { description: error.message });
      } else {
        toast.success(`Desafio "${deleteTarget.title}" excluído!`);
        onDataChanged();
      }
    } catch {
      toast.error("Erro inesperado ao excluir");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const activeChallenges = challenges.filter(c => c.is_active);

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="card-fantasy space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Título do desafio"
            className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
          />
          <div className="flex items-center gap-2">
            <Coins className="text-gold" size={18} />
            <input
              type="number"
              value={newReward}
              onChange={e => setNewReward(parseInt(e.target.value) || 10)}
              className="w-20 px-2 py-2 rounded-lg border-2 border-border bg-background text-center"
              min={1}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as "simples" | "unica")}
            className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
          >
            <option value="simples">Repetível</option>
            <option value="unica">Única</option>
          </select>
          <button type="submit" disabled={isAdding} className="btn-fantasy flex items-center gap-2 disabled:opacity-50">
            <Plus size={18} />
            {isAdding ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {activeChallenges.map(challenge => (
          <div key={challenge.id} className="card-fantasy flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{challenge.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  challenge.challenge_type === "unica"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-primary/20 text-primary"
                }`}>
                  {challenge.challenge_type === "unica" ? "Única" : "Repetível"}
                </span>
              </div>
              {challenge.description && (
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gold-dark font-semibold">
                <Coins size={18} />
                +{challenge.reward}
              </div>
              <button
                onClick={() => setDeleteTarget(challenge)}
                className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                title="Excluir desafio"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir desafio?"
        description={`Você está prestes a excluir "${deleteTarget?.title}". O desafio será removido da lista de desafios disponíveis.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
