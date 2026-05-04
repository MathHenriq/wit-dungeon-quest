import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/hooks/useAdmin";
import type {
  AdminClassRow, AdminStudentRow, AdminTeacherRow,
} from "@/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, RefreshCw, Search, ShieldAlert, Trash2,
  KeyRound, UserPlus, X, Move,
} from "lucide-react";
import { toast } from "sonner";

// ---------- styling helpers ----------
const card: React.CSSProperties = {
  background: "rgba(20,20,28,0.7)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 16,
  color: "rgba(255,255,255,0.9)",
};
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)",
  outline: "none",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  width: "100%",
};
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid transparent",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.85)",
};
const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "rgba(220,50,50,0.15)",
  border: "1px solid rgba(220,50,50,0.4)",
  color: "rgb(255,160,160)",
};
const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "rgba(80,160,255,0.15)",
  border: "1px solid rgba(80,160,255,0.4)",
  color: "rgb(160,200,255)",
};

// ---------- modal shell ----------
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card, width: 480, maxWidth: "90vw", maxHeight: "85vh", overflow: "auto",
          background: "rgba(15,15,22,0.97)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ ...btnBase, padding: 4 }} aria-label="Fechar">
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- main page ----------
export default function AdminPanel() {
  const { teacher, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
  const [classes,  setClasses]  = useState<AdminClassRow[]>([]);
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // gate: must be admin
  useEffect(() => {
    if (authLoading) return;
    if (!teacher) { navigate("/professor/login"); return; }
    if (!teacher.is_admin) { navigate("/professor"); return; }
    void load();
  }, [authLoading, teacher?.is_admin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.list();
      setTeachers(data.teachers);
      setClasses(data.classes);
      setStudents(data.students);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast.error(`Falha ao carregar: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (!teacher && !error)) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "white" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px 32px", color: "white" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/professor")} style={btnBase}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={20} /> Painel de Administração
            </h1>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>
              Operações globais — afetam toda a base. Use com cuidado.
            </p>
          </div>
        </div>
        <button onClick={() => void load()} style={btnBase}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </header>

      {error && (
        <div style={{ ...card, borderColor: "rgba(220,50,50,0.4)", marginBottom: 16, color: "rgb(255,180,180)" }}>
          Erro: {error}
        </div>
      )}

      <Tabs defaultValue="students">
        <TabsList style={{ background: "rgba(255,255,255,0.04)" }}>
          <TabsTrigger value="students">Alunos ({students.length})</TabsTrigger>
          <TabsTrigger value="teachers">Professores ({teachers.length})</TabsTrigger>
          <TabsTrigger value="classes">Turmas ({classes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentsTab
            students={students} classes={classes} teachers={teachers}
            loading={loading} onChanged={load}
          />
        </TabsContent>

        <TabsContent value="teachers">
          <TeachersTab
            teachers={teachers} classes={classes} students={students}
            currentUserId={teacher?.user_id ?? null}
            loading={loading} onChanged={load}
          />
        </TabsContent>

        <TabsContent value="classes">
          <ClassesTab
            classes={classes} teachers={teachers} students={students}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// STUDENTS TAB
// =====================================================
function StudentsTab({
  students, classes, teachers, loading, onChanged,
}: {
  students: AdminStudentRow[];
  classes: AdminClassRow[];
  teachers: AdminTeacherRow[];
  loading: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<AdminStudentRow | null>(null);
  const [moveTarget, setMoveTarget] = useState<AdminStudentRow | null>(null);

  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const classById   = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      if (classFilter && s.class_id !== classFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter]);

  async function onDelete(s: AdminStudentRow) {
    if (!confirm(
      `Deletar "${s.name}" PERMANENTEMENTE?\n\nIsso remove:\n  • a ficha do aluno\n  • o personagem (se houver)\n  • a conta de login\n\nEssa ação NÃO pode ser desfeita.`,
    )) return;
    setBusyId(s.id);
    try {
      const r = await adminApi.deleteStudent(s.id);
      if (r.warning) toast.warning(r.warning);
      else toast.success(`${s.name} deletado.`);
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
          <input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30 }}
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          style={{ ...inputStyle, width: 240 }}
        >
          <option value="">Todas as turmas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setCreateOpen(true)} style={btnPrimary}>
          <UserPlus size={14} /> Criar aluno
        </button>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={th}>Nome</th>
                <th style={th}>Turma / Professor</th>
                <th style={th}>E-mail</th>
                <th style={th}>Status</th>
                <th style={th}>Lvl</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const klass = classById.get(s.class_id);
                const teacherName = klass ? teacherById.get(klass.teacher_id)?.name ?? "—" : "—";
                return (
                  <tr key={s.id} style={trStyle}>
                    <td style={td}>{s.name}</td>
                    <td style={td}>
                      <div style={{ fontSize: 13 }}>{klass?.name ?? "—"}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{teacherName}</div>
                    </td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{s.email ?? "—"}</td>
                    <td style={td}>
                      <span style={statusPill(s.status)}>{s.status}</span>
                    </td>
                    <td style={td}>{s.level}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setMoveTarget(s)}
                        style={btnBase}
                        title="Mudar de turma"
                      >
                        <Move size={12} />
                      </button>
                      <button
                        onClick={() => setPwdTarget(s)}
                        style={{ ...btnBase, marginLeft: 4 }}
                        disabled={!s.user_id}
                        title={s.user_id ? "Redefinir senha" : "Sem login"}
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        onClick={() => void onDelete(s)}
                        disabled={busyId === s.id}
                        style={{ ...btnDanger, marginLeft: 4 }}
                        title="Deletar"
                      >
                        {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, opacity: 0.5, textAlign: "center", padding: 24 }}>Nenhum aluno encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateStudentModal
        open={createOpen}
        classes={classes}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => { setCreateOpen(false); await onChanged(); }}
      />

      <ResetPasswordModal
        target={pwdTarget}
        kind="aluno"
        onClose={() => setPwdTarget(null)}
      />

      <MoveClassModal
        target={moveTarget}
        classes={classes}
        onClose={() => setMoveTarget(null)}
        onMoved={async () => { setMoveTarget(null); await onChanged(); }}
      />
    </div>
  );
}

// =====================================================
// TEACHERS TAB
// =====================================================
function TeachersTab({
  teachers, classes, students, currentUserId, loading, onChanged,
}: {
  teachers: AdminTeacherRow[];
  classes: AdminClassRow[];
  students: AdminStudentRow[];
  currentUserId: string | null;
  loading: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pwdTarget, setPwdTarget] = useState<AdminTeacherRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) || (t.email ?? "").toLowerCase().includes(q),
    );
  }, [teachers, search]);

  function classCount(teacherId: string) {
    return classes.filter(c => c.teacher_id === teacherId).length;
  }
  function studentCount(teacherId: string) {
    return students.filter(s => s.teacher_id === teacherId).length;
  }

  async function onDelete(t: AdminTeacherRow) {
    const cc = classCount(t.id), sc = studentCount(t.id);
    if (!confirm(
      `Deletar professor(a) "${t.name}" PERMANENTEMENTE?\n\nIsso remove em cascata:\n  • ${cc} turma(s)\n  • ${sc} aluno(s) e seus personagens\n  • o login do professor\n\nEssa ação NÃO pode ser desfeita.`,
    )) return;
    setBusyId(t.id);
    try {
      const r = await adminApi.deleteTeacher(t.id);
      if (r.warning) toast.warning(r.warning);
      else toast.success(`${t.name} deletado.`);
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ marginBottom: 12, position: "relative", maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
        <input
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 30 }}
        />
      </div>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={th}>Nome</th>
                <th style={th}>E-mail</th>
                <th style={th}>Turmas</th>
                <th style={th}>Alunos</th>
                <th style={th}>Admin?</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const isSelf = t.user_id === currentUserId;
                return (
                  <tr key={t.id} style={trStyle}>
                    <td style={td}>{t.name}{isSelf && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.6 }}>(você)</span>}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{t.email ?? "—"}</td>
                    <td style={td}>{classCount(t.id)}</td>
                    <td style={td}>{studentCount(t.id)}</td>
                    <td style={td}>{t.is_admin ? "✓" : ""}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setPwdTarget(t)}
                        style={btnBase}
                        disabled={!t.user_id}
                        title={t.user_id ? "Redefinir senha" : "Sem login"}
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        onClick={() => void onDelete(t)}
                        disabled={busyId === t.id || isSelf}
                        style={{ ...btnDanger, marginLeft: 4, opacity: isSelf ? 0.4 : 1 }}
                        title={isSelf ? "Não pode deletar a si mesmo" : "Deletar"}
                      >
                        {busyId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ResetPasswordModal target={pwdTarget} kind="professor" onClose={() => setPwdTarget(null)} />
    </div>
  );
}

// =====================================================
// CLASSES TAB (read-only listing for now)
// =====================================================
function ClassesTab({
  classes, teachers, students, loading,
}: {
  classes: AdminClassRow[];
  teachers: AdminTeacherRow[];
  students: AdminStudentRow[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (teacherById.get(c.teacher_id)?.name ?? "").toLowerCase().includes(q),
    );
  }, [classes, search, teacherById]);

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ marginBottom: 12, position: "relative", maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
        <input
          placeholder="Buscar turma ou professor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 30 }}
        />
      </div>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase" }}>
                <th style={th}>Turma</th>
                <th style={th}>Professor</th>
                <th style={th}>Alunos</th>
                <th style={th}>Criada em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={trStyle}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{teacherById.get(c.teacher_id)?.name ?? "—"}</td>
                  <td style={td}>{students.filter(s => s.class_id === c.id).length}</td>
                  <td style={{ ...td, fontSize: 12, opacity: 0.7 }}>
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =====================================================
// MODALS
// =====================================================
function CreateStudentModal({
  open, classes, onClose, onCreated,
}: {
  open: boolean; classes: AdminClassRow[];
  onClose: () => void; onCreated: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setName(""); setEmail(""); setPassword(""); setClassId(""); }
  }, [open]);

  async function submit() {
    if (!name.trim() || !email.trim() || !password || !classId) {
      toast.error("Preencha todos os campos."); return;
    }
    setBusy(true);
    try {
      await adminApi.createStudent({ class_id: classId, name, email, password });
      toast.success(`Aluno ${name} criado.`);
      await onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Criar aluno (manual)">
      <div style={{ display: "grid", gap: 10 }}>
        <Field label="Nome completo">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Senha (mínimo 6)">
          <input type="text" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Turma">
          <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
            <option value="">— escolha —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center", marginTop: 8 }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          {busy ? "Criando…" : "Criar aluno"}
        </button>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({
  target, kind, onClose,
}: {
  target: { id: string; name: string; user_id: string | null } | null;
  kind: "aluno" | "professor";
  onClose: () => void;
}) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setPwd(""); }, [target]);

  if (!target) return null;

  async function submit() {
    if (!target!.user_id) return;
    if (pwd.length < 6) { toast.error("Senha precisa ter pelo menos 6 caracteres."); return; }
    setBusy(true);
    try {
      await adminApi.resetPassword(target!.user_id, pwd);
      toast.success(`Senha do ${kind} ${target!.name} redefinida.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Redefinir senha — ${target.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          A nova senha vai funcionar imediatamente. Anote e passe para o {kind}.
        </p>
        <Field label="Nova senha">
          <input
            type="text" value={pwd} onChange={e => setPwd(e.target.value)} style={inputStyle}
            placeholder="ex: Wit2026!"
          />
        </Field>
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          {busy ? "Aplicando…" : "Redefinir"}
        </button>
      </div>
    </Modal>
  );
}

function MoveClassModal({
  target, classes, onClose, onMoved,
}: {
  target: AdminStudentRow | null;
  classes: AdminClassRow[];
  onClose: () => void;
  onMoved: () => void | Promise<void>;
}) {
  const [classId, setClassId] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setClassId(target.class_id); }, [target]);

  if (!target) return null;

  async function submit() {
    if (!classId || classId === target!.class_id) { onClose(); return; }
    setBusy(true);
    try {
      await adminApi.moveStudentToClass(target!.id, classId);
      toast.success(`${target!.name} movido(a) de turma.`);
      await onMoved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Mover de turma — ${target.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        <Field label="Nova turma">
          <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Move size={14} />}
          {busy ? "Movendo…" : "Mover"}
        </button>
      </div>
    </Modal>
  );
}

// ---------- tiny helpers ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      {children}
    </label>
  );
}

const th: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px", verticalAlign: "top" };
const trStyle: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.04)" };

function statusPill(status: string): React.CSSProperties {
  const map: Record<string, [string, string]> = {
    active:   ["rgba(60,180,90,0.15)", "rgb(140,230,170)"],
    pending:  ["rgba(220,180,40,0.15)", "rgb(255,220,140)"],
    rejected: ["rgba(220,80,80,0.15)", "rgb(255,160,160)"],
  };
  const [bg, fg] = map[status] ?? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.7)"];
  return {
    background: bg, color: fg, padding: "2px 8px", borderRadius: 999,
    fontSize: 11, fontWeight: 500, display: "inline-block",
  };
}
