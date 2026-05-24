import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { adminApi } from "@/hooks/useAdmin";
import type {
  AdminClassRow, AdminStudentRow, AdminTeacherRow, ShopItemLite, ActionLogRow,
} from "@/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Loader2, RefreshCw, Search, ShieldAlert, Trash2,
  KeyRound, UserPlus, X, Move, Coins, Gem, Sparkles, Pencil, Plus, Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTicketsTab } from "@/components/AdminTicketsTab";
import { AdminEventsTab } from "@/components/AdminEventsTab";
import { AdminRaidsTab } from "@/components/AdminRaidsTab";
import { AdminAuditTab } from "@/components/AdminAuditTab";
import { AdminWave11ClassesTab } from "@/components/AdminWave11ClassesTab";
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
          <TabsTrigger value="wave11classes">Classes (S2)</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="raids">Raids</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
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
            loading={loading} onChanged={load}
          />
        </TabsContent>

        <TabsContent value="wave11classes">
          <AdminWave11ClassesTab />
        </TabsContent>

        <TabsContent value="tickets">
          <AdminTicketsTab />
        </TabsContent>

        <TabsContent value="events">
          <AdminEventsTab />
        </TabsContent>

        <TabsContent value="raids">
          <AdminRaidsTab />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditTab />
        </TabsContent>

        <TabsContent value="logs">
          <LogsTab />
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
  const [spawnTarget, setSpawnTarget] = useState<AdminStudentRow | null>(null);
  const [currencyTarget, setCurrencyTarget] = useState<AdminStudentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudentRow | null>(null);
  const [titleTarget, setTitleTarget] = useState<AdminStudentRow | null>(null);

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

  async function performDelete(s: AdminStudentRow) {
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
      setDeleteTarget(null);
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
                        onClick={() => setSpawnTarget(s)}
                        style={{ ...btnBase, marginLeft: 4 }}
                        title="Spawnar carta no inventário"
                      >
                        <Sparkles size={12} />
                      </button>
                      <button
                        onClick={() => setCurrencyTarget(s)}
                        style={{ ...btnBase, marginLeft: 4 }}
                        title="Ajustar moedas/diamantes"
                      >
                        <Coins size={12} />
                      </button>
                      <button
                        onClick={() => setTitleTarget(s)}
                        style={{ ...btnBase, marginLeft: 4 }}
                        title="Conceder título"
                      >
                        <Award size={12} />
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
                        onClick={() => setDeleteTarget(s)}
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

      <SpawnCardModal
        target={spawnTarget}
        onClose={() => setSpawnTarget(null)}
      />

      <AdjustCurrencyModal
        target={currencyTarget}
        onClose={() => setCurrencyTarget(null)}
        onAdjusted={onChanged}
      />

      <ConfirmDeleteModal
        target={deleteTarget}
        kind="aluno"
        bullets={["a ficha do aluno", "o personagem (se houver)", "a conta de login"]}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && performDelete(deleteTarget)}
        busy={busyId === deleteTarget?.id}
      />

      <GrantTitleModal
        target={titleTarget}
        onClose={() => setTitleTarget(null)}
      />
    </div>
  );
}

// =====================================================
// GRANT TITLE MODAL (master-only)
// =====================================================
function GrantTitleModal({ target, onClose }: { target: AdminStudentRow | null; onClose: () => void }) {
  const [titles, setTitles] = useState<Array<{ key: string; name: string; description: string | null; color: string }>>([]);
  const [titleKey, setTitleKey] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("title_catalog")
        .select("key, name, description, color")
        .eq("condition_type", "master_grant")
        .eq("is_active", true)
        .order("name");
      if (cancelled) return;
      if (error) {
        toast.error("Erro ao carregar títulos", { description: error.message });
        setTitles([]);
      } else {
        const rows = (data ?? []) as Array<{ key: string; name: string; description: string | null; color: string }>;
        setTitles(rows);
        if (rows.length > 0) setTitleKey(rows[0].key);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [target?.id]);

  async function handleGrant() {
    if (!target || !titleKey) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("master_grant_title", {
      p_student_id: target.id,
      p_title_key:  titleKey,
    });
    setBusy(false);
    if (error) {
      toast.error("Erro ao conceder título", { description: error.message });
      return;
    }
    const res = data as { success: boolean; error?: string; already_owned?: boolean; title?: { name: string } };
    if (!res?.success) {
      toast.error(res?.error ?? "Não foi possível conceder.");
      return;
    }
    if (res.already_owned) {
      toast.info(`${target.name} já possui "${res.title?.name}".`);
    } else {
      toast.success(`Título "${res.title?.name}" concedido a ${target.name}.`);
    }
    onClose();
  }

  return (
    <Modal open={!!target} onClose={onClose} title={`Conceder título — ${target?.name ?? ""}`}>
      {loading ? (
        <div style={{ padding: 24, textAlign: "center" }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : titles.length === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 13 }}>
          Nenhum título com <code>condition_type = 'master_grant'</code> ativo no catálogo.
        </div>
      ) : (
        <>
          <label style={{ fontSize: 12, opacity: 0.7, display: "block", marginBottom: 6 }}>Título</label>
          <select
            value={titleKey}
            onChange={(e) => setTitleKey(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            {titles.map(t => (
              <option key={t.key} value={t.key}>{t.name} ({t.color})</option>
            ))}
          </select>
          {(() => {
            const t = titles.find(x => x.key === titleKey);
            return t?.description ? (
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>{t.description}</div>
            ) : null;
          })()}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={btnBase} disabled={busy}>Cancelar</button>
            <button onClick={() => void handleGrant()} style={btnPrimary} disabled={busy || !titleKey}>
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />}
              Conceder
            </button>
          </div>
        </>
      )}
    </Modal>
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
  const [deleteTarget, setDeleteTarget] = useState<AdminTeacherRow | null>(null);
  const [editTarget, setEditTarget] = useState<AdminTeacherRow | null>(null);

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

  async function performDelete(t: AdminTeacherRow) {
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
      setDeleteTarget(null);
    }
  }

  async function toggleAdmin(t: AdminTeacherRow) {
    if (t.user_id === currentUserId && t.is_admin) {
      toast.error("Você não pode tirar seu próprio admin.");
      return;
    }
    setBusyId(t.id);
    try {
      await adminApi.setTeacherAdmin(t.id, !t.is_admin);
      toast.success(`${t.name}: admin ${!t.is_admin ? "ativado" : "removido"}.`);
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
                    <td style={td}>
                      <button
                        onClick={() => void toggleAdmin(t)}
                        disabled={busyId === t.id || (isSelf && t.is_admin)}
                        style={{
                          ...btnBase,
                          padding: "2px 8px", fontSize: 11,
                          background: t.is_admin ? "rgba(220,80,80,0.18)" : "rgba(255,255,255,0.04)",
                          color: t.is_admin ? "rgb(255,180,180)" : "rgba(255,255,255,0.6)",
                          opacity: (isSelf && t.is_admin) ? 0.5 : 1,
                        }}
                        title={isSelf && t.is_admin ? "Não pode remover o próprio admin" : "Alternar admin"}
                      >
                        {t.is_admin ? "✓ admin" : "tornar admin"}
                      </button>
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setEditTarget(t)}
                        style={btnBase}
                        title="Editar nome"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setPwdTarget(t)}
                        style={{ ...btnBase, marginLeft: 4 }}
                        disabled={!t.user_id}
                        title={t.user_id ? "Redefinir senha" : "Sem login"}
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
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

      <EditTeacherModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => { setEditTarget(null); await onChanged(); }}
      />

      <ConfirmDeleteModal
        target={deleteTarget}
        kind="professor"
        bullets={
          deleteTarget
            ? [
                `${classCount(deleteTarget.id)} turma(s)`,
                `${studentCount(deleteTarget.id)} aluno(s) e seus personagens`,
                "o login do professor",
              ]
            : []
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && performDelete(deleteTarget)}
        busy={busyId === deleteTarget?.id}
      />
    </div>
  );
}

// =====================================================
// CLASSES TAB (full CRUD)
// =====================================================
function ClassesTab({
  classes, teachers, students, loading, onChanged,
}: {
  classes: AdminClassRow[];
  teachers: AdminTeacherRow[];
  students: AdminStudentRow[];
  loading: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminClassRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClassRow | null>(null);
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
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
          <input
            placeholder="Buscar turma ou professor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30 }}
          />
        </div>
        <button onClick={() => setCreateOpen(true)} style={btnPrimary}>
          <Plus size={14} /> Nova turma
        </button>
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
                <th style={th}>Bioma</th>
                <th style={th}>Alunos</th>
                <th style={th}>Criada em</th>
                <th style={th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const studentCount = students.filter(s => s.class_id === c.id).length;
                return (
                  <tr key={c.id} style={trStyle}>
                    <td style={td}>{c.name}</td>
                    <td style={td}>{teacherById.get(c.teacher_id)?.name ?? "—"}</td>
                    <td style={td}>{c.biome ?? "—"}</td>
                    <td style={td}>{studentCount}</td>
                    <td style={{ ...td, fontSize: 12, opacity: 0.7 }}>
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditTarget(c)} style={btnBase} title="Editar">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        style={{ ...btnDanger, marginLeft: 4 }}
                        title="Deletar turma"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateOrEditClassModal
        open={createOpen || !!editTarget}
        target={editTarget}
        teachers={teachers}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onDone={async () => { setCreateOpen(false); setEditTarget(null); await onChanged(); }}
      />

      <DeleteClassModal
        target={deleteTarget}
        classes={classes}
        students={students}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => { setDeleteTarget(null); await onChanged(); }}
      />
    </div>
  );
}

// =====================================================
// LOGS TAB
// =====================================================
function LogsTab() {
  const [logs, setLogs] = useState<ActionLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      setLogs(await adminApi.listLogs(500));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return logs.filter(l => {
      if (roleFilter && l.actor_role !== roleFilter) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        (l.actor_name ?? "").toLowerCase().includes(q) ||
        (l.target_label ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, filter, roleFilter]);

  return (
    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 11, opacity: 0.5 }} />
          <input
            placeholder="Buscar por ação, ator ou alvo…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30 }}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: 200 }}>
          <option value="">Todos os papéis</option>
          <option value="admin">Admin</option>
          <option value="teacher">Professor</option>
          <option value="student">Aluno</option>
          <option value="system">Sistema</option>
        </select>
        <button onClick={() => void load()} style={btnBase}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recarregar
        </button>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase" }}>
                <th style={th}>Quando</th>
                <th style={th}>Ator</th>
                <th style={th}>Papel</th>
                <th style={th}>Ação</th>
                <th style={th}>Alvo</th>
                <th style={th}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={trStyle}>
                  <td style={{ ...td, whiteSpace: "nowrap", fontSize: 11, opacity: 0.7 }}>
                    {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                  </td>
                  <td style={td}>{l.actor_name ?? <span style={{ opacity: 0.4 }}>—</span>}</td>
                  <td style={td}>
                    <span style={rolePill(l.actor_role)}>{l.actor_role}</span>
                  </td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{l.action}</td>
                  <td style={td}>
                    {l.target_label ?? <span style={{ opacity: 0.4 }}>—</span>}
                    {l.target_table && (
                      <div style={{ fontSize: 10, opacity: 0.4 }}>{l.target_table}</div>
                    )}
                  </td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 10, opacity: 0.7, maxWidth: 320 }}>
                    {Object.keys(l.payload).length > 0
                      ? <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify(l.payload)}</pre>
                      : <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, opacity: 0.5, textAlign: "center", padding: 24 }}>Nenhum log encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function rolePill(role: string): React.CSSProperties {
  const map: Record<string, [string, string]> = {
    admin:   ["rgba(220,80,80,0.15)",  "rgb(255,170,170)"],
    teacher: ["rgba(80,160,255,0.15)", "rgb(170,200,255)"],
    student: ["rgba(60,180,90,0.15)",  "rgb(150,230,180)"],
    system:  ["rgba(180,180,180,0.1)", "rgba(220,220,220,0.7)"],
  };
  const [bg, fg] = map[role] ?? ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.7)"];
  return { background: bg, color: fg, padding: "2px 8px", borderRadius: 999, fontSize: 10, display: "inline-block" };
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

// =====================================================
// SPAWN CARD MODAL
// =====================================================
function SpawnCardModal({
  target, onClose,
}: {
  target: AdminStudentRow | null;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ShopItemLite[]>([]);
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) return;
    setSearch(""); setPickedId("");
    setLoading(true);
    adminApi.listShopItems()
      .then(setItems)
      .catch(e => toast.error(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [target]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 80);
    return items
      .filter(i => i.name.toLowerCase().includes(q) || i.item_type.toLowerCase().includes(q))
      .slice(0, 80);
  }, [items, search]);

  if (!target) return null;

  async function submit() {
    if (!pickedId) { toast.error("Escolha uma carta."); return; }
    setBusy(true);
    try {
      await adminApi.spawnCard(target!.id, pickedId);
      const item = items.find(i => i.id === pickedId);
      toast.success(`"${item?.name ?? "Carta"}" spawnada para ${target!.name}.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Spawnar carta — ${target.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          A carta entra no inventário do aluno imediatamente. Se ele já tem essa carta, nada muda.
        </p>
        <Field label="Buscar carta">
          <input
            placeholder="Nome ou tipo (weapon, armor…)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
          {loading ? (
            <div style={{ padding: 16, textAlign: "center" }}><Loader2 className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", opacity: 0.5, fontSize: 12 }}>Nenhuma carta encontrada.</div>
          ) : (
            filtered.map(i => (
              <button
                key={i.id}
                type="button"
                onClick={() => setPickedId(i.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "8px 12px", textAlign: "left",
                  background: pickedId === i.id ? "rgba(80,160,255,0.18)" : "transparent",
                  border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.85)", cursor: "pointer", fontSize: 13,
                }}
              >
                <span>
                  <span style={{ fontWeight: 500 }}>{i.name}</span>
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.5 }}>{i.item_type}</span>
                </span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>lvl {i.min_level} · {i.cost}c</span>
              </button>
            ))
          )}
        </div>
        <button onClick={() => void submit()} disabled={busy || !pickedId} style={{ ...btnPrimary, justifyContent: "center" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy ? "Spawnando…" : "Spawnar carta"}
        </button>
      </div>
    </Modal>
  );
}

// =====================================================
// ADJUST CURRENCY MODAL
// =====================================================
function AdjustCurrencyModal({
  target, onClose, onAdjusted,
}: {
  target: AdminStudentRow | null;
  onClose: () => void;
  onAdjusted: () => void | Promise<void>;
}) {
  const [currency, setCurrency] = useState<"coins" | "diamonds">("coins");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (target) { setCurrency("coins"); setAmount(""); } }, [target]);

  if (!target) return null;

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) { toast.error("Informe um valor diferente de zero."); return; }
    if (!Number.isInteger(n)) { toast.error("Use apenas números inteiros."); return; }
    setBusy(true);
    try {
      const newBal = await adminApi.adjustCurrency(target!.id, n, currency);
      const sign = n > 0 ? "+" : "";
      toast.success(`${target!.name}: ${sign}${n} ${currency} → saldo ${newBal}.`);
      await onAdjusted();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Ajustar economia — ${target.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          Use valor positivo para creditar, negativo para debitar. O saldo nunca fica abaixo de zero.
        </p>
        <Field label="Moeda">
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setCurrency("coins")}
              style={{
                ...btnBase, flex: 1, justifyContent: "center",
                background: currency === "coins" ? "rgba(255,200,80,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${currency === "coins" ? "rgba(255,200,80,0.5)" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <Coins size={14} /> Moedas
            </button>
            <button
              type="button"
              onClick={() => setCurrency("diamonds")}
              style={{
                ...btnBase, flex: 1, justifyContent: "center",
                background: currency === "diamonds" ? "rgba(120,200,255,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${currency === "diamonds" ? "rgba(120,200,255,0.5)" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <Gem size={14} /> Diamantes
            </button>
          </div>
        </Field>
        <Field label="Valor (positivo = creditar, negativo = debitar)">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={inputStyle}
            placeholder="ex: 50  ou  -25"
          />
        </Field>
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : currency === "coins" ? <Coins size={14} /> : <Gem size={14} />}
          {busy ? "Aplicando…" : "Aplicar ajuste"}
        </button>
      </div>
    </Modal>
  );
}

// =====================================================
// CONFIRM DELETE MODAL (typed-name double confirmation)
// =====================================================
function ConfirmDeleteModal({
  target, kind, bullets, onClose, onConfirm, busy,
}: {
  target: { id: string; name: string } | null;
  kind: "aluno" | "professor";
  bullets: string[];
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const [typed, setTyped] = useState("");
  useEffect(() => { if (target) setTyped(""); }, [target]);

  if (!target) return null;
  const matches = typed.trim().toLowerCase() === target.name.trim().toLowerCase();

  return (
    <Modal open onClose={busy ? () => undefined : onClose} title={`Deletar ${kind} — ${target.name}`}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{
          background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.4)",
          borderRadius: 8, padding: 12, color: "rgb(255,200,200)", fontSize: 13,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Esta ação é IRREVERSÍVEL.</div>
          <div style={{ marginBottom: 6 }}>Será removido em cascata:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
        <Field label={`Para confirmar, digite o nome: "${target.name}"`}>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            style={inputStyle}
            placeholder={target.name}
            autoFocus
          />
        </Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy} style={btnBase}>Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={!matches || busy}
            style={{ ...btnDanger, opacity: matches && !busy ? 1 : 0.4 }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {busy ? "Deletando…" : "Deletar permanentemente"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================
// CREATE / EDIT CLASS MODAL
// =====================================================
function CreateOrEditClassModal({
  open, target, teachers, onClose, onDone,
}: {
  open: boolean;
  target: AdminClassRow | null;
  teachers: AdminTeacherRow[];
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [biome, setBiome] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(target?.name ?? "");
      setBiome(target?.biome ?? "");
      setTeacherId(target?.teacher_id ?? "");
    }
  }, [open, target]);

  if (!open) return null;
  const isEdit = !!target;

  async function submit() {
    if (!name.trim()) { toast.error("Nome da turma é obrigatório."); return; }
    if (!isEdit && !teacherId) { toast.error("Selecione o professor."); return; }
    setBusy(true);
    try {
      if (isEdit) {
        await adminApi.updateClass(target!.id, name.trim(), biome.trim() || null);
        toast.success(`Turma "${name.trim()}" atualizada.`);
      } else {
        await adminApi.createClass(teacherId, name.trim(), biome.trim() || null);
        toast.success(`Turma "${name.trim()}" criada.`);
      }
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? `Editar turma — ${target!.name}` : "Nova turma"}>
      <div style={{ display: "grid", gap: 10 }}>
        <Field label="Nome">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoFocus />
        </Field>
        <Field label="Bioma (opcional)">
          <input value={biome} onChange={e => setBiome(e.target.value)} style={inputStyle} placeholder="ex: floresta, vulcão…" />
        </Field>
        {!isEdit && (
          <Field label="Professor">
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
              <option value="">— escolha —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        )}
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center", marginTop: 8 }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : isEdit ? <Pencil size={14} /> : <Plus size={14} />}
          {busy ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar turma"}
        </button>
      </div>
    </Modal>
  );
}

// =====================================================
// DELETE CLASS MODAL (forces reassign-or-block on students)
// =====================================================
function DeleteClassModal({
  target, classes, students, onClose, onDeleted,
}: {
  target: AdminClassRow | null;
  classes: AdminClassRow[];
  students: AdminStudentRow[];
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  const [reassignTo, setReassignTo] = useState<string>("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (target) { setReassignTo(""); setTyped(""); } }, [target]);

  if (!target) return null;
  const studentCount = students.filter(s => s.class_id === target.id).length;
  const otherClasses = classes.filter(c => c.id !== target.id);
  const matches = typed.trim().toLowerCase() === target.name.trim().toLowerCase();
  const needsReassign = studentCount > 0;
  const canDelete = matches && (!needsReassign || !!reassignTo);

  async function submit() {
    setBusy(true);
    try {
      const moved = await adminApi.deleteClass(target!.id, needsReassign ? reassignTo : null);
      if (moved > 0) toast.success(`Turma deletada. ${moved} aluno(s) reatribuído(s).`);
      else toast.success("Turma deletada.");
      await onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={busy ? () => undefined : onClose} title={`Deletar turma — ${target.name}`}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{
          background: "rgba(220,50,50,0.1)", border: "1px solid rgba(220,50,50,0.4)",
          borderRadius: 8, padding: 12, color: "rgb(255,200,200)", fontSize: 13,
        }}>
          {needsReassign
            ? `Esta turma tem ${studentCount} aluno(s). Escolha para qual turma movê-los antes de deletar.`
            : "Esta turma não tem alunos — pode ser deletada com segurança."}
        </div>
        {needsReassign && (
          <Field label="Mover alunos para">
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={inputStyle}>
              <option value="">— escolha uma turma destino —</option>
              {otherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label={`Para confirmar, digite o nome: "${target.name}"`}>
          <input value={typed} onChange={e => setTyped(e.target.value)} style={inputStyle} placeholder={target.name} />
        </Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy} style={btnBase}>Cancelar</button>
          <button
            onClick={() => void submit()}
            disabled={!canDelete || busy}
            style={{ ...btnDanger, opacity: canDelete && !busy ? 1 : 0.4 }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {busy ? "Deletando…" : "Deletar turma"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================
// EDIT TEACHER MODAL
// =====================================================
function EditTeacherModal({
  target, onClose, onSaved,
}: {
  target: AdminTeacherRow | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (target) setName(target.name ?? ""); }, [target]);

  if (!target) return null;

  async function submit() {
    if (!name.trim()) { toast.error("Nome obrigatório."); return; }
    setBusy(true);
    try {
      await adminApi.updateTeacher(target!.id, name.trim());
      toast.success("Professor atualizado.");
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <Modal open onClose={onClose} title={`Editar professor — ${target.name}`}>
      <div style={{ display: "grid", gap: 10 }}>
        <Field label="Nome">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoFocus />
        </Field>
        <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
          Para mudar e-mail, use o painel do Supabase Auth — ele afeta o login do professor.
        </p>
        <button onClick={() => void submit()} disabled={busy} style={{ ...btnPrimary, justifyContent: "center" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
          {busy ? "Salvando…" : "Salvar"}
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
