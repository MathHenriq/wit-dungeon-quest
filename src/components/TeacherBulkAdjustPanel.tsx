import { useMemo, useState, useEffect } from "react";
import {
  Coins, Gem, TrendingUp, Star, Search, Loader2, RotateCcw, Check, Plus, Minus,
  Equal, Package, X, Filter, Save, AlertCircle, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ATTRIBUTES } from "@/types";
import type { Student, Class, AttrKey, ShopItem } from "@/types";

interface TeacherBulkAdjustPanelProps {
  teacherId: string;
  students: Student[];
  classes: Class[];
  shopItems: ShopItem[];
  onDataChanged: () => void;
}

// Editable numeric fields per student
type EditableKey = "coins" | "diamonds" | "level" | "pontos_disponiveis" | AttrKey;
const NUMERIC_FIELDS: { key: EditableKey; min: number }[] = [
  { key: "coins",              min: 0 },
  { key: "diamonds",           min: 0 },
  { key: "level",              min: 1 },
  { key: "pontos_disponiveis", min: 0 },
  { key: "attr_forca",         min: 0 },
  { key: "attr_destreza",      min: 0 },
  { key: "attr_inteligencia",  min: 0 },
  { key: "attr_carisma",       min: 0 },
  { key: "attr_agilidade",     min: 0 },
  { key: "attr_resistencia",   min: 0 },
];

type Drafts = Record<string, Partial<Record<EditableKey, number>>>;

function readField(s: Student, key: EditableKey): number {
  const v = (s as unknown as Record<string, number | null | undefined>)[key];
  if (key === "level")  return v ?? 1;
  return v ?? 0;
}

function clampField(key: EditableKey, val: number): number {
  const meta = NUMERIC_FIELDS.find(f => f.key === key)!;
  return Math.max(meta.min, Math.floor(val) || 0);
}

export function TeacherBulkAdjustPanel({ teacherId, students, classes, shopItems, onDataChanged }: TeacherBulkAdjustPanelProps) {
  const [filterClass, setFilterClass] = useState<string>("");
  const [search,      setSearch]      = useState("");
  const [drafts,      setDrafts]      = useState<Drafts>({});
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [isSaving,    setIsSaving]    = useState(false);

  // Bulk action popover state
  const [bulkOp, setBulkOp] = useState<null | { field: EditableKey; mode: "delta" | "set" }>(null);
  const [bulkValue, setBulkValue] = useState<string>("");

  // Inventory action state
  const [inventoryOp, setInventoryOp] = useState<null | "give" | "remove">(null);
  const [pickedItem,  setPickedItem]  = useState<string>("");
  const [isApplyingInv, setIsApplyingInv] = useState(false);

  // Inventory counts per student (lazy)
  const [invCounts, setInvCounts] = useState<Record<string, number>>({});
  const [invDetailsFor, setInvDetailsFor] = useState<Student | null>(null);

  useEffect(() => {
    if (students.length === 0) return;
    supabase
      .from("student_inventory")
      .select("student_id")
      .in("student_id", students.map(s => s.id))
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((row: { student_id: string }) => {
          counts[row.student_id] = (counts[row.student_id] || 0) + 1;
        });
        setInvCounts(counts);
      });
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      if (filterClass && s.class_id !== filterClass) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.character_name || "").toLowerCase().includes(q)
      );
    });
  }, [students, filterClass, search]);

  // Helpers
  const getValue = (s: Student, key: EditableKey): number => {
    const draft = drafts[s.id]?.[key];
    if (draft !== undefined) return draft;
    return readField(s, key);
  };
  const isDirty = (s: Student, key: EditableKey): boolean => {
    const draft = drafts[s.id]?.[key];
    return draft !== undefined && draft !== readField(s, key);
  };
  const studentIsDirty = (s: Student): boolean => {
    const d = drafts[s.id];
    if (!d) return false;
    return Object.entries(d).some(([k, v]) => v !== readField(s, k as EditableKey));
  };

  const setDraft = (studentId: string, key: EditableKey, val: number) => {
    setDrafts(prev => {
      const row  = { ...(prev[studentId] || {}) };
      row[key]   = clampField(key, val);
      return { ...prev, [studentId]: row };
    });
  };

  const dirtyCount = useMemo(
    () => students.filter(studentIsDirty).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drafts, students]
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
  const someFilteredSelected = filtered.some(s => selected.has(s.id));
  const toggleAll = () => {
    setSelected(prev => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach(s => next.delete(s.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach(s => next.add(s.id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Apply a bulk numeric op to selected students (drafts only — saved on "Apply")
  const applyBulkOp = () => {
    if (!bulkOp) return;
    const num = parseInt(bulkValue, 10);
    if (isNaN(num)) {
      toast.error("Digite um número válido");
      return;
    }
    if (selected.size === 0) {
      toast.error("Selecione ao menos um aluno");
      return;
    }
    setDrafts(prev => {
      const next = { ...prev };
      students.forEach(s => {
        if (!selected.has(s.id)) return;
        const current = next[s.id]?.[bulkOp.field] ?? readField(s, bulkOp.field);
        const newVal  = bulkOp.mode === "delta" ? current + num : num;
        next[s.id] = { ...(next[s.id] || {}), [bulkOp.field]: clampField(bulkOp.field, newVal) };
      });
      return next;
    });
    toast.success(`${selected.size} aluno(s) ajustado(s) (não salvo ainda)`);
    setBulkOp(null);
    setBulkValue("");
  };

  // Save all dirty drafts
  const handleSave = async () => {
    const dirtyStudents = students.filter(studentIsDirty);
    if (dirtyStudents.length === 0) return;

    setIsSaving(true);
    let successes = 0;
    const failures: string[] = [];

    await Promise.all(dirtyStudents.map(async (s) => {
      const d = drafts[s.id]!;
      // Build payload of only changed fields
      const payload: Record<string, number> = {};
      (Object.keys(d) as EditableKey[]).forEach(k => {
        if (d[k] !== readField(s, k)) payload[k] = d[k]!;
      });
      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase
        .from("students")
        .update(payload)
        .eq("id", s.id)
        .eq("teacher_id", teacherId);

      if (error) {
        failures.push(s.character_name || s.name);
      } else {
        successes++;
      }
    }));

    setIsSaving(false);

    if (failures.length === 0) {
      toast.success(`${successes} aluno(s) atualizado(s)`);
      setDrafts({});
      onDataChanged();
    } else {
      toast.error(`Erro em ${failures.length} aluno(s)`, { description: failures.slice(0, 3).join(", ") });
      onDataChanged();
    }
  };

  const discardChanges = () => {
    setDrafts({});
    toast.info("Alterações descartadas");
  };

  // Inventory bulk give/remove
  const applyInventoryOp = async () => {
    if (!inventoryOp || !pickedItem) return;
    if (selected.size === 0) {
      toast.error("Selecione ao menos um aluno");
      return;
    }
    setIsApplyingInv(true);
    const ids = Array.from(selected);
    try {
      if (inventoryOp === "give") {
        const rows = ids.map(student_id => ({ student_id, item_id: pickedItem }));
        const { error } = await supabase.from("student_inventory").insert(rows);
        if (error) throw error;
        toast.success(`Item entregue a ${ids.length} aluno(s)`);
      } else {
        // Remove ALL copies of the chosen item from each selected student
        const { error } = await supabase
          .from("student_inventory")
          .delete()
          .eq("item_id", pickedItem)
          .in("student_id", ids);
        if (error) throw error;
        toast.success(`Item removido de ${ids.length} aluno(s)`);
      }
      setInventoryOp(null);
      setPickedItem("");
      onDataChanged();
      // refresh local counts
      const { data } = await supabase
        .from("student_inventory")
        .select("student_id")
        .in("student_id", students.map(s => s.id));
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { student_id: string }) => {
        counts[row.student_id] = (counts[row.student_id] || 0) + 1;
      });
      setInvCounts(counts);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao aplicar operação de inventário");
    } finally {
      setIsApplyingInv(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Helper banner */}
      <div className="flex items-start gap-2 p-3 rounded-md text-xs text-cyan-200/80"
           style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.18)" }}>
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-cyan-400" />
        <div className="leading-relaxed">
          Edite valores diretamente nas células ou selecione vários alunos e use as ações em massa.
          As alterações ficam <b>pendentes</b> até você clicar em <b>Aplicar</b> — pode descartar a qualquer momento.
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/70 border border-border min-w-[200px]">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1"
          >
            <option value="">Todas as turmas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/70 border border-border flex-1 min-w-[200px]">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar aluno..."
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} de {students.length} • {selected.size} selecionado(s)
        </div>
      </div>

      {/* Bulk action toolbar (only when selection exists) */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md"
             style={{ background: "rgba(124,77,255,0.08)", border: "1px solid rgba(124,77,255,0.25)" }}>
          <span className="text-xs font-semibold text-purple-300 mr-1">
            Ações para {selected.size} aluno(s):
          </span>
          <BulkButton icon={Coins}      label="Moedas"    color="text-yellow-400" onClick={() => { setBulkOp({ field: "coins",              mode: "delta" }); setBulkValue(""); }} />
          <BulkButton icon={Gem}        label="Diamantes" color="text-sky-400"    onClick={() => { setBulkOp({ field: "diamonds",           mode: "delta" }); setBulkValue(""); }} />
          <BulkButton icon={TrendingUp} label="Nível"     color="text-cyan-400"   onClick={() => { setBulkOp({ field: "level",              mode: "delta" }); setBulkValue(""); }} />
          <BulkButton icon={Star}       label="Pts"     color="text-amber-400"  onClick={() => { setBulkOp({ field: "pontos_disponiveis", mode: "delta" }); setBulkValue(""); }} />
          <div className="w-px h-5 bg-border mx-1" />
          <BulkButton icon={Plus}    label="Dar item"     color="text-green-400" onClick={() => { setInventoryOp("give");   setPickedItem(""); }} />
          <BulkButton icon={Minus}   label="Remover item" color="text-red-400"   onClick={() => { setInventoryOp("remove"); setPickedItem(""); }} />
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Save bar (only when dirty) */}
      {dirtyCount > 0 && (
        <div className="flex items-center justify-between p-2.5 rounded-md sticky top-0 z-10"
             style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", backdropFilter: "blur(8px)" }}>
          <span className="text-sm font-semibold text-yellow-300 flex items-center gap-2">
            <AlertCircle size={14} />
            {dirtyCount} aluno(s) com alterações pendentes
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={discardChanges}
              disabled={isSaving}
              className="text-xs px-3 py-1.5 rounded border border-border hover:bg-secondary transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw size={12} /> Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "rgba(74,222,128,0.18)", border: "1px solid rgba(74,222,128,0.5)", color: "#86efac" }}
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? "Aplicando..." : `Aplicar ${dirtyCount} alteraç${dirtyCount === 1 ? "ão" : "ões"}`}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border bg-card/40">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-card/60">
              <th className="px-2 py-2 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={el => { if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected; }}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="px-2 py-2 sticky left-0 bg-card/60 z-[1]">Aluno</th>
              <th className="px-2 py-2"><span className="inline-flex items-center gap-1"><Coins size={12} className="text-yellow-400" /> Moedas</span></th>
              <th className="px-2 py-2"><span className="inline-flex items-center gap-1"><Gem size={12} className="text-sky-400" /> Diam.</span></th>
              <th className="px-2 py-2"><span className="inline-flex items-center gap-1"><TrendingUp size={12} className="text-cyan-400" /> Nível</span></th>
              <th className="px-2 py-2"><span className="inline-flex items-center gap-1"><Star size={12} className="text-amber-400" /> Pts</span></th>
              {ATTRIBUTES.map(a => (
                <th key={a.key} className="px-2 py-2 text-center" title={a.label}>
                  {a.label.slice(0, 3)}
                </th>
              ))}
              <th className="px-2 py-2"><span className="inline-flex items-center gap-1"><Package size={12} /> Itens</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={13} className="text-center py-10 text-muted-foreground text-sm">
                Nenhum aluno encontrado.
              </td></tr>
            )}
            {filtered.map(s => {
              const dirty = studentIsDirty(s);
              const cls   = classes.find(c => c.id === s.class_id);
              return (
                <tr key={s.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    style={dirty ? { background: "rgba(255,215,0,0.04)" } : undefined}>
                  <td className="px-2 py-1.5">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="cursor-pointer" />
                  </td>
                  <td className="px-2 py-1.5 sticky left-0 bg-card/40 z-[1] min-w-[160px]"
                      style={dirty ? { background: "rgba(255,215,0,0.04)" } : undefined}>
                    <div className="flex items-center gap-2">
                      {dirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" title="Alterações pendentes" />}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.character_name || s.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {cls?.name}{s.character_name ? ` • ${s.name}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  {NUMERIC_FIELDS.slice(0, 4).map(f => (
                    <td key={f.key} className="px-2 py-1.5">
                      <NumberCell
                        value={getValue(s, f.key)}
                        dirty={isDirty(s, f.key)}
                        min={f.min}
                        onChange={v => setDraft(s.id, f.key, v)}
                      />
                    </td>
                  ))}
                  {ATTRIBUTES.map(a => (
                    <td key={a.key} className="px-1 py-1.5">
                      <NumberCell
                        value={getValue(s, a.key)}
                        dirty={isDirty(s, a.key)}
                        min={0}
                        compact
                        onChange={v => setDraft(s.id, a.key, v)}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => setInvDetailsFor(s)}
                      className="text-xs px-2 py-1 rounded bg-secondary/60 hover:bg-secondary border border-border flex items-center gap-1.5"
                    >
                      <Package size={11} /> {invCounts[s.id] ?? 0}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk numeric op popover */}
      {bulkOp && (
        <Modal title={`Ajustar ${labelFor(bulkOp.field)} de ${selected.size} aluno(s)`} onClose={() => setBulkOp(null)}>
          <div className="space-y-3">
            <div className="flex gap-1 p-1 rounded bg-secondary/40">
              <ModeBtn active={bulkOp.mode === "delta"} onClick={() => setBulkOp({ ...bulkOp, mode: "delta" })}>
                <Plus size={12} /> <Minus size={12} /> Somar / subtrair
              </ModeBtn>
              <ModeBtn active={bulkOp.mode === "set"} onClick={() => setBulkOp({ ...bulkOp, mode: "set" })}>
                <Equal size={12} /> Definir valor
              </ModeBtn>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {bulkOp.mode === "delta" ? "Valor a somar (use negativo para subtrair)" : "Novo valor absoluto"}
              </label>
              <input
                type="number"
                autoFocus
                value={bulkValue}
                onChange={e => setBulkValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") applyBulkOp(); }}
                placeholder={bulkOp.mode === "delta" ? "+10  ou  -5" : "Ex: 100"}
                className="w-full px-3 py-2 rounded bg-background border border-border outline-none focus:border-cyan-400 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setBulkOp(null)} className="text-sm px-3 py-1.5 rounded border border-border hover:bg-secondary">Cancelar</button>
              <button onClick={applyBulkOp} className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold flex items-center gap-1.5">
                <Check size={14} /> Aplicar (pendente)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inventory op modal */}
      {inventoryOp && (
        <Modal
          title={inventoryOp === "give" ? `Dar item para ${selected.size} aluno(s)` : `Remover item de ${selected.size} aluno(s)`}
          onClose={() => setInventoryOp(null)}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Selecione o item</label>
              <select
                value={pickedItem}
                onChange={e => setPickedItem(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-border outline-none focus:border-cyan-400 text-sm"
              >
                <option value="">— escolher —</option>
                {shopItems.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.cost} moedas)
                  </option>
                ))}
              </select>
            </div>
            {inventoryOp === "remove" && pickedItem && (
              <p className="text-xs text-amber-300/80 flex items-start gap-2">
                <AlertCircle size={12} className="mt-0.5" />
                Isso remove <b>todas as cópias</b> deste item dos alunos selecionados.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setInventoryOp(null)} className="text-sm px-3 py-1.5 rounded border border-border hover:bg-secondary">Cancelar</button>
              <button
                onClick={applyInventoryOp}
                disabled={!pickedItem || isApplyingInv}
                className="text-sm px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 disabled:opacity-50"
                style={{
                  background: inventoryOp === "give" ? "rgba(74,222,128,0.18)" : "rgba(239,68,68,0.18)",
                  border: `1px solid ${inventoryOp === "give" ? "rgba(74,222,128,0.5)" : "rgba(239,68,68,0.5)"}`,
                  color: inventoryOp === "give" ? "#86efac" : "#fca5a5",
                }}
              >
                {isApplyingInv ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {isApplyingInv ? "Aplicando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Per-student inventory details */}
      {invDetailsFor && (
        <StudentInventoryDetails
          student={invDetailsFor}
          onClose={() => setInvDetailsFor(null)}
          onChanged={() => {
            // refresh count for this student
            supabase.from("student_inventory").select("id", { count: "exact", head: true }).eq("student_id", invDetailsFor.id)
              .then(({ count }) => {
                setInvCounts(prev => ({ ...prev, [invDetailsFor.id]: count ?? 0 }));
              });
            onDataChanged();
          }}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function NumberCell({
  value, dirty, min, compact, onChange,
}: { value: number; dirty: boolean; min: number; compact?: boolean; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      onChange={e => onChange(parseInt(e.target.value, 10))}
      className={`${compact ? "w-12" : "w-16"} px-1.5 py-1 rounded text-center text-sm font-semibold bg-background outline-none transition-colors`}
      style={{
        border: `1px solid ${dirty ? "rgba(255,215,0,0.6)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: dirty ? "0 0 0 2px rgba(255,215,0,0.1)" : undefined,
        fontFamily: "Rajdhani, sans-serif",
      }}
    />
  );
}

function BulkButton({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded bg-card/70 border border-border hover:bg-secondary transition-colors flex items-center gap-1.5"
    >
      <Icon size={12} className={color} />
      {label}
      <ChevronDown size={10} className="opacity-60" />
    </button>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
      style={{
        background: active ? "rgba(0,229,255,0.18)" : "transparent",
        color: active ? "#67e8f9" : "rgb(148, 163, 184)",
        border: `1px solid ${active ? "rgba(0,229,255,0.4)" : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function StudentInventoryDetails({ student, onClose, onChanged }: { student: Student; onClose: () => void; onChanged: () => void }) {
  const [items,     setItems]     = useState<Array<{ id: string; item: ShopItem | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    supabase
      .from("student_inventory")
      .select("id, item:shop_items(*)")
      .eq("student_id", student.id)
      .order("added_at", { ascending: false })
      .then(({ data }) => {
        setItems((data || []) as unknown as Array<{ id: string; item: ShopItem | null }>);
        setIsLoading(false);
      });
  };
  useEffect(load, [student.id]);

  const removeItem = async (invId: string) => {
    setRemovingId(invId);
    const { error } = await supabase.from("student_inventory").delete().eq("id", invId);
    setRemovingId(null);
    if (error) {
      toast.error("Erro ao remover item");
    } else {
      toast.success("Item removido");
      load();
      onChanged();
    }
  };

  return (
    <Modal title={`Inventário — ${student.character_name || student.name}`} onClose={onClose}>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-cyan-400" size={24} /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Inventário vazio</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-1.5">
          {items.map(inv => {
            if (!inv.item) return null;
            return (
              <div key={inv.id} className="flex items-center justify-between gap-2 p-2 rounded bg-card/50 border border-border">
                <span className="text-sm truncate">{inv.item.name}</span>
                <button
                  onClick={() => removeItem(inv.id)}
                  disabled={removingId === inv.id}
                  className="p-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  title="Remover esta cópia"
                >
                  {removingId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function labelFor(field: EditableKey): string {
  const map: Record<EditableKey, string> = {
    coins: "moedas",
    diamonds: "diamantes",
    level: "nível",
    pontos_disponiveis: "pontos disponíveis",
    attr_forca: "Força",
    attr_destreza: "Destreza",
    attr_inteligencia: "Inteligência",
    attr_carisma: "Carisma",
    attr_agilidade: "Agilidade",
    attr_resistencia: "Resistência",
  };
  return map[field];
}
