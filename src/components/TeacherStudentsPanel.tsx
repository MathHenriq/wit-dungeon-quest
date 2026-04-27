import { useState, useEffect } from "react";
import { Plus, Trash2, Coins, TrendingUp, Package, X, Loader2, Swords, Link2, Copy, Check, RotateCcw } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "./ProfilePhoto";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { Student, Class, InventoryItem, AttrKey } from "@/types";

interface TeacherStudentsPanelProps {
  teacherId: string;
  students: Student[];
  classes: Class[];
  onDataChanged: () => void;
}

function StudentInventoryModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("student_inventory")
      .select("*, item:shop_items(*)")
      .eq("student_id", student.id)
      .order("added_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[StudentInventoryModal]", error);
        setInventory((data || []) as unknown as InventoryItem[]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[StudentInventoryModal] fetch error:", err);
        setIsLoading(false);
      });
  }, [student.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-primary" />
            <span className="font-semibold">
              Inventário de {student.character_name || student.name}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gold" size={28} />
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum item no inventário</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inventory.map(inv => {
                const item = inv.item;
                if (!item) return null;
                const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
                return (
                  <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-xl">{item.icon || meta.iconId}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                          <GameIcon id={meta.iconId} size={12} /> {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <GameIcon id="coin" size={12} /> {item.cost}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && inventory.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground text-right">
            {inventory.length} {inventory.length === 1 ? "item" : "itens"}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentAttributesModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>({
    attr_forca:        student.attr_forca        ?? 0,
    attr_destreza:     student.attr_destreza     ?? 0,
    attr_inteligencia: student.attr_inteligencia ?? 0,
    attr_carisma:      student.attr_carisma      ?? 0,
    attr_agilidade:    student.attr_agilidade    ?? 0,
    attr_resistencia:  student.attr_resistencia  ?? 0,
  });
  const [pontos, setPontos] = useState(student.pontos_disponiveis ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingAttrs, setIsResettingAttrs] = useState(false);
  const [resetAttrsConfirm, setResetAttrsConfirm] = useState(false);
  const [isResettingSkills, setIsResettingSkills] = useState(false);
  const [resetSkillsConfirm, setResetSkillsConfirm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ ...attrs, pontos_disponiveis: pontos })
        .eq("id", student.id);
      if (error) {
        toast.error("Erro ao salvar atributos", { description: error.message });
      } else {
        toast.success("Atributos atualizados!");
        onSaved();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset de ATRIBUTOS — devolve pontos gastos nos 6 atributos para pontos_disponiveis
  const handleResetAttrs = async () => {
    setIsResettingAttrs(true);
    try {
      const totalGasto =
        (attrs.attr_forca ?? 0) + (attrs.attr_destreza ?? 0) +
        (attrs.attr_inteligencia ?? 0) + (attrs.attr_carisma ?? 0) +
        (attrs.attr_agilidade ?? 0) + (attrs.attr_resistencia ?? 0);

      const novosPontos = pontos + totalGasto;
      const zerados: Record<AttrKey, number> = {
        attr_forca: 0, attr_destreza: 0, attr_inteligencia: 0,
        attr_carisma: 0, attr_agilidade: 0, attr_resistencia: 0,
      };

      const { error } = await supabase
        .from("students")
        .update({ ...zerados, pontos_disponiveis: novosPontos })
        .eq("id", student.id);

      if (error) throw error;

      setAttrs(zerados);
      setPontos(novosPontos);
      toast.success(`Pontos de atributo resetados! ${totalGasto} ponto(s) devolvido(s).`);
      setResetAttrsConfirm(false);
      onSaved();
    } catch (err: any) {
      toast.error("Erro ao resetar pontos de atributo", { description: err.message });
    } finally {
      setIsResettingAttrs(false);
    }
  };

  // Reset de HABILIDADE — via RPC SECURITY DEFINER porque authenticated
  // não tem GRANT direto na tabela characters
  const handleResetSkillPoints = async () => {
    if (!student.user_id) {
      toast.error("Aluno sem conta vinculada no jogo de batalha.", {
        description: "Somente alunos que fizeram login com Google possuem personagem de batalha.",
      });
      return;
    }
    setIsResettingSkills(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("teacher_reset_skill_points", {
        p_student_user_id: student.user_id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; points_returned?: number };
      if (!result.success) {
        if (result.error === "character_not_found") {
          toast.error("Personagem de batalha não encontrado.", {
            description: "O aluno ainda não acessou o sistema de batalha para criar um personagem.",
          });
        } else {
          toast.error("Erro ao resetar pontos de habilidade", { description: result.error });
        }
        return;
      }

      toast.success(`Pontos de habilidade resetados! ${result.points_returned ?? 0} ponto(s) devolvido(s).`);
      setResetSkillsConfirm(false);
    } catch (err: any) {
      toast.error("Erro ao resetar pontos de habilidade", { description: err.message });
    } finally {
      setIsResettingSkills(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-primary" />
            <span className="font-semibold">Atributos — {student.character_name || student.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* Pontos disponíveis */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-sm font-semibold flex items-center gap-2"><GameIcon id="star" size={16} /> Pontos disponíveis</span>
            <input
              type="number"
              value={pontos}
              min={0}
              onChange={e => setPontos(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 px-2 py-1 rounded text-center text-sm font-bold text-cyan-400"
              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}
            />
          </div>

          {/* Attribute rows */}
          {ATTRIBUTES.map(attr => (
            <div key={attr.key} className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border">
              <GameIcon id={attr.iconId} size={28} className="flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{attr.label}</p>
                <div className="h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(((attrs[attr.key] ?? 0) / 20) * 100, 100)}%` }} />
                </div>
              </div>
              <input
                type="number"
                value={attrs[attr.key] ?? 0}
                min={0}
                onChange={e => setAttrs(prev => ({ ...prev, [attr.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-16 px-2 py-1 rounded text-center text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none', fontFamily: 'Rajdhani, sans-serif' }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">

          {/* Reset pontos de ATRIBUTO */}
          {resetAttrsConfirm ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="flex-1 text-xs text-amber-400">Zera os 6 atributos e devolve os pontos gastos como pontos disponíveis. Confirmar?</span>
              <button onClick={() => setResetAttrsConfirm(false)} className="px-3 py-1 rounded text-xs border border-border hover:bg-secondary">Não</button>
              <button
                onClick={handleResetAttrs}
                disabled={isResettingAttrs}
                className="px-3 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 disabled:opacity-50"
              >
                {isResettingAttrs ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                {isResettingAttrs ? "Resetando..." : "Confirmar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetAttrsConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
            >
              <RotateCcw size={13} />
              Resetar pontos de atributo
            </button>
          )}

          {/* Reset pontos de HABILIDADE (personagem de batalha) */}
          {resetSkillsConfirm ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="flex-1 text-xs text-red-400">Zera os pontos elementais e os devolve como pontos livres no personagem de batalha. Confirmar?</span>
              <button onClick={() => setResetSkillsConfirm(false)} className="px-3 py-1 rounded text-xs border border-border hover:bg-secondary">Não</button>
              <button
                onClick={handleResetSkillPoints}
                disabled={isResettingSkills}
                className="px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 flex items-center gap-1 disabled:opacity-50"
              >
                {isResettingSkills ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                {isResettingSkills ? "Resetando..." : "Confirmar"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetSkillsConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
            >
              <RotateCcw size={13} />
              Resetar pontos de habilidade (batalha)
            </button>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={isSaving} className="btn-fantasy flex items-center gap-2 text-sm disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('generate_parent_invite', {
        p_student_id: studentId,
      });
      if (error) throw error;
      const link = `${window.location.origin}/pais/login?code=${data}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success(`Link copiado para ${studentName}! Cole no WhatsApp ou e-mail.`);
    } catch (err) {
      console.error('[InviteButton]', err);
      toast.error('Erro ao gerar convite para pais.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="p-2 rounded-lg transition-colors disabled:opacity-50"
      style={{
        background: copied ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
        color: copied ? '#6366f1' : '#818cf8',
      }}
      title="Gerar link para pais"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : copied ? (
        <Check size={16} />
      ) : (
        <Link2 size={16} />
      )}
    </button>
  );
}

export function TeacherStudentsPanel({ teacherId, students, classes, onDataChanged }: TeacherStudentsPanelProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inventoryStudent, setInventoryStudent] = useState<Student | null>(null);
  const [attrsStudent, setAttrsStudent] = useState<Student | null>(null);

  const filteredStudents = selectedClass
    ? students.filter(s => s.class_id === selectedClass)
    : students;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName.trim() || isAdding) return;

    const name = newStudentName.trim();
    setIsAdding(true);

    const timeout = setTimeout(() => {
      setIsAdding(false);
      toast.error("A operação demorou demais. Verifique sua conexão e tente novamente.");
    }, 10000);

    try {
      const { error } = await supabase.from("students").insert({
        class_id: selectedClass,
        teacher_id: teacherId,
        name,
      });
      clearTimeout(timeout);

      if (error) {
        toast.error("Erro ao adicionar aluno", { description: error.message });
      } else {
        toast.success("Aluno adicionado!");
        setNewStudentName("");
        onDataChanged();
      }
    } catch {
      clearTimeout(timeout);
      toast.error("Erro inesperado ao adicionar aluno.");
    } finally {
      clearTimeout(timeout);
      setIsAdding(false);
    }
  };

  const updateCoins = async (studentId: string, newCoins: number) => {
    const { error } = await supabase
      .from("students")
      .update({ coins: Math.max(0, newCoins) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar moedas");
    } else {
      toast.success("Moedas atualizadas!");
      onDataChanged();
    }
  };

  const updateDiamonds = async (studentId: string, newDiamonds: number) => {
    const { error } = await supabase
      .from("students")
      .update({ diamonds: Math.max(0, newDiamonds) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar diamantes");
    } else {
      toast.success("Diamantes atualizados!");
      onDataChanged();
    }
  };

  const updateLevel = async (studentId: string, newLevel: number) => {
    const { error } = await supabase
      .from("students")
      .update({ level: Math.max(1, newLevel) })
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao atualizar nível");
    } else {
      toast.success("Nível atualizado!");
      onDataChanged();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.from("students").delete().eq("id", deleteTarget.id);

      if (error) {
        toast.error("Erro ao excluir aluno", { description: error.message });
      } else {
        toast.success(`Aluno "${deleteTarget.character_name || deleteTarget.name}" excluído!`);
        onDataChanged();
      }
    } catch {
      toast.error("Erro inesperado ao excluir");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card-fantasy">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedClass || ""}
            onChange={e => setSelectedClass(e.target.value || null)}
            className="px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
          >
            <option value="">Todas as turmas</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          {selectedClass && (
            <form onSubmit={handleAdd} className="flex-1 flex gap-3">
              <input
                type="text"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="Nome do aluno"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
              />
              <button type="submit" disabled={isAdding} className="btn-fantasy flex items-center gap-2 disabled:opacity-50">
                <Plus size={18} />
                {isAdding ? "Adicionando..." : "Adicionar"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredStudents.map(student => (
          <div key={student.id} className="card-fantasy">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ProfilePhoto
                  studentId={student.id}
                  currentPhotoUrl={student.profile_photo_url}
                  onUpdate={onDataChanged}
                  size="sm"
                  editable={false}
                />
                <div>
                  <h3 className="font-semibold">
                    {student.character_name || student.name}
                    {student.character_name && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({student.name})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {classes.find(c => c.id === student.class_id)?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <Coins className="text-yellow-400" size={14} />
                  <input
                    type="number"
                    value={student.coins}
                    onChange={e => updateCoins(student.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-center text-sm font-bold text-yellow-400 bg-transparent outline-none"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.25)' }} title="Diamantes (ganhos em sala de aula)">
                  <GameIcon id="gem" size={14} />
                  <input
                    type="number"
                    value={student.diamonds ?? 0}
                    onChange={e => updateDiamonds(student.id, parseInt(e.target.value) || 0)}
                    className="w-14 text-center text-sm font-bold bg-transparent outline-none"
                    style={{ fontFamily: 'Rajdhani, sans-serif', color: '#63b3ed' }}
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <TrendingUp className="text-cyan-400" size={14} />
                  <input
                    type="number"
                    value={student.level}
                    onChange={e => updateLevel(student.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-sm font-bold text-cyan-400 bg-transparent outline-none"
                    min={1}
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  />
                </div>
                <button
                  onClick={() => setInventoryStudent(student)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Ver inventário"
                >
                  <Package size={16} />
                </button>
                <button
                  onClick={() => setAttrsStudent(student)}
                  className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                  title="Editar atributos"
                >
                  <Swords size={16} />
                </button>
                <InviteButton studentId={student.id} studentName={student.character_name || student.name} />
                <button
                  onClick={() => setDeleteTarget(student)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Excluir aluno"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir aluno?"
        description={`Você está prestes a excluir "${deleteTarget?.character_name || deleteTarget?.name}". Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />

      {inventoryStudent && (
        <StudentInventoryModal
          student={inventoryStudent}
          onClose={() => setInventoryStudent(null)}
        />
      )}

      {attrsStudent && (
        <StudentAttributesModal
          student={attrsStudent}
          onClose={() => setAttrsStudent(null)}
          onSaved={onDataChanged}
        />
      )}
    </div>
  );
}
