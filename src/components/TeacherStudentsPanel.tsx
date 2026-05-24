import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, Package, X, Loader2, Swords, Link2, Copy, Check, RotateCcw, KeyRound, Move, Ban, Sparkles, Clock } from "lucide-react";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "./ProfilePhoto";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { Student, Class, InventoryItem, AttrKey } from "@/types";
import { teacherApi } from "@/hooks/useAdmin";

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
  const [pwdTarget, setPwdTarget] = useState<Student | null>(null);
  const [moveTarget, setMoveTarget] = useState<Student | null>(null);
  const [xpTarget, setXpTarget] = useState<Student | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Student | null>(null);

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

  // Currency / level controls intentionally removed from the teacher panel.
  // Moedas, diamantes e cartas são prerrogativa do master (painel admin).
  // Nível é derivado de XP via auto_level_up trigger — use o modal de XP.

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      // Goes through the teacher_delete_student RPC: enforces ownership
      // server-side, cleans the linked character row, and writes the
      // action to the audit log so the master can see who deleted what.
      await teacherApi.deleteStudent(deleteTarget.id);
      toast.success(`Aluno "${deleteTarget.character_name || deleteTarget.name}" excluído!`);
      onDataChanged();
    } catch (err) {
      toast.error("Erro ao excluir aluno", { description: err instanceof Error ? err.message : String(err) });
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
                {/* Currency / diamonds intentionally NOT exposed here — those belong to the master panel only. */}
                {/* Level shown read-only; teachers adjust progression via the XP modal (Sparkles icon). */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }} title="Nível derivado de XP — use o botão XP para ajustar">
                  <TrendingUp className="text-cyan-400" size={14} />
                  <span className="w-12 text-center text-sm font-bold text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Lv {student.level}
                  </span>
                </div>
                {(student as Student & { suspended_until?: string | null }).suspended_until && (
                  <span
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(220,80,80,0.12)', border: '1px solid rgba(220,80,80,0.3)', color: 'rgb(255,180,180)' }}
                    title={`Suspenso até ${new Date(((student as Student & { suspended_until?: string }).suspended_until!)).toLocaleString('pt-BR')}`}
                  >
                    <Ban size={12} /> SUSPENSO
                  </span>
                )}
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
                <button
                  onClick={() => setXpTarget(student)}
                  className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                  title="Ajustar XP (recalcula o nível)"
                >
                  <Sparkles size={16} />
                </button>
                <InviteButton studentId={student.id} studentName={student.character_name || student.name} />
                <button
                  onClick={() => setMoveTarget(student)}
                  className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                  title="Mover para outra turma sua"
                >
                  <Move size={16} />
                </button>
                <button
                  onClick={() => setSuspendTarget(student)}
                  className="p-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                  title={(student as Student & { suspended_until?: string | null }).suspended_until ? "Gerenciar suspensão" : "Suspender acesso"}
                >
                  <Ban size={16} />
                </button>
                <button
                  onClick={() => setPwdTarget(student)}
                  disabled={!student.user_id}
                  className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={student.user_id ? "Redefinir senha do aluno" : "Aluno ainda sem login"}
                >
                  <KeyRound size={16} />
                </button>
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

      {pwdTarget && (
        <TeacherResetStudentPasswordModal
          target={pwdTarget}
          onClose={() => setPwdTarget(null)}
        />
      )}

      {moveTarget && (
        <TeacherMoveStudentModal
          target={moveTarget}
          ownClasses={classes}
          onClose={() => setMoveTarget(null)}
          onMoved={() => { setMoveTarget(null); onDataChanged(); }}
        />
      )}

      {xpTarget && (
        <TeacherAdjustXpModal
          target={xpTarget}
          onClose={() => setXpTarget(null)}
          onAdjusted={() => { setXpTarget(null); onDataChanged(); }}
        />
      )}

      {suspendTarget && (
        <TeacherSuspendStudentModal
          target={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onChanged={() => { setSuspendTarget(null); onDataChanged(); }}
        />
      )}

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

// ── Reset student password (teacher-scoped) ────────────────────
function TeacherResetStudentPasswordModal({
  target, onClose,
}: { target: Student; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (pwd.length < 6) { toast.error("Senha precisa ter pelo menos 6 caracteres."); return; }
    setBusy(true);
    try {
      await teacherApi.resetStudentPassword(target.id, pwd);
      toast.success(`Senha de ${target.character_name || target.name} redefinida.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound size={16} className="text-blue-400" />
            <span>Redefinir senha — {target.character_name || target.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A nova senha vale imediatamente. Anote e passe para o aluno.
        </p>
        <input
          type="text"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          placeholder="ex: Wit2026!"
          className="w-full px-3 py-2 rounded bg-secondary text-sm outline-none"
          autoFocus
        />
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full mt-3 py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-medium flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          {busy ? "Aplicando…" : "Redefinir"}
        </button>
      </div>
    </div>
  );
}

// ── Move student between own classes (teacher-scoped) ──────────
function TeacherMoveStudentModal({
  target, ownClasses, onClose, onMoved,
}: {
  target: Student;
  ownClasses: Class[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const [classId, setClassId] = useState(target.class_id ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!classId || classId === target.class_id) { onClose(); return; }
    setBusy(true);
    try {
      await teacherApi.moveStudentToOwnClass(target.id, classId);
      toast.success(`${target.character_name || target.name} movido(a) de turma.`);
      onMoved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <Move size={16} className="text-cyan-400" />
            <span>Mover de turma — {target.character_name || target.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Você só pode mover o aluno entre as suas próprias turmas.
        </p>
        <select
          value={classId}
          onChange={e => setClassId(e.target.value)}
          className="w-full px-3 py-2 rounded bg-secondary text-sm outline-none"
        >
          {ownClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full mt-3 py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-medium flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Move size={14} />}
          {busy ? "Movendo…" : "Mover"}
        </button>
      </div>
    </div>
  );
}

// ── Adjust XP (teacher-scoped). Level recomputes via auto_level_up trigger ──
function TeacherAdjustXpModal({
  target, onClose, onAdjusted,
}: { target: Student; onClose: () => void; onAdjusted: () => void }) {
  const [delta, setDelta] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const currentXp = (target as Student & { xp?: number }).xp ?? 0;

  async function submit() {
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) { toast.error("Informe um delta diferente de zero."); return; }
    if (!Number.isInteger(n)) { toast.error("Use apenas inteiros."); return; }
    setBusy(true);
    try {
      const newXp = await teacherApi.adjustXp(target.id, n);
      const sign = n > 0 ? "+" : "";
      toast.success(`${target.character_name || target.name}: ${sign}${n} XP → ${newXp}`);
      onAdjusted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} className="text-violet-400" />
            <span>Ajustar XP — {target.character_name || target.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={16} /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          XP atual: <strong>{currentXp}</strong>. Positivo soma, negativo desconta. O nível é recalculado automaticamente; não vai abaixo de zero.
        </p>
        <input
          type="number"
          value={delta}
          onChange={e => setDelta(e.target.value)}
          placeholder="ex: 100  ou  -50"
          className="w-full px-3 py-2 rounded bg-secondary text-sm outline-none"
          autoFocus
        />
        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full mt-3 py-2 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-medium flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy ? "Aplicando…" : "Aplicar ajuste"}
        </button>
      </div>
    </div>
  );
}

// ── Suspend / Unsuspend student (teacher-scoped) ─────────────
function TeacherSuspendStudentModal({
  target, onClose, onChanged,
}: { target: Student; onClose: () => void; onChanged: () => void }) {
  const suspendedUntilStr = (target as Student & { suspended_until?: string | null }).suspended_until ?? null;
  const isCurrentlySuspended = !!suspendedUntilStr && new Date(suspendedUntilStr).getTime() > Date.now();
  const [days, setDays] = useState<string>("3");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function suspend() {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 365) { toast.error("Dias entre 1 e 365."); return; }
    setBusy(true);
    try {
      const until = await teacherApi.suspendStudent(target.id, n, reason.trim());
      toast.success(`${target.character_name || target.name} suspenso até ${new Date(until).toLocaleDateString("pt-BR")}.`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  }

  async function unsuspend() {
    setBusy(true);
    try {
      await teacherApi.unsuspendStudent(target.id);
      toast.success("Suspensão removida.");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <Ban size={16} className="text-orange-400" />
            <span>Suspensão — {target.character_name || target.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={16} /></button>
        </div>

        {isCurrentlySuspended ? (
          <>
            <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(220,80,80,0.1)", border: "1px solid rgba(220,80,80,0.3)", color: "rgb(255,200,200)" }}>
              <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                <Clock size={14} /> Atualmente suspenso
              </div>
              <p className="text-xs">Até {new Date(suspendedUntilStr!).toLocaleString("pt-BR")}.</p>
              {(target as Student & { suspended_reason?: string | null }).suspended_reason && (
                <p className="text-xs italic mt-1">"{(target as Student & { suspended_reason?: string | null }).suspended_reason}"</p>
              )}
            </div>
            <button
              onClick={() => void unsuspend()}
              disabled={busy}
              className="w-full py-2 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm font-medium flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {busy ? "Removendo…" : "Remover suspensão agora"}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Enquanto suspenso, o aluno pode fazer login mas vê apenas a tela de "Acesso Suspenso" — não acessa o jogo.
            </p>
            <label className="text-xs text-muted-foreground block mb-1">Dias (1–365)</label>
            <input
              type="number" min={1} max={365}
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full px-3 py-2 rounded bg-secondary text-sm outline-none mb-3"
            />
            <label className="text-xs text-muted-foreground block mb-1">Motivo (opcional, visível ao aluno)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded bg-secondary text-sm outline-none resize-none"
              placeholder="ex: descumprimento de regras em sala"
            />
            <button
              onClick={() => void suspend()}
              disabled={busy}
              className="w-full mt-3 py-2 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-sm font-medium flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
              {busy ? "Aplicando…" : "Suspender"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
