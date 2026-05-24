// ============================================================
// Onda 11.9 — Aba "Classes (Season 2)" do painel master.
// Lista alunos com seu perfil Wave 11 + permite reset de classe
// e concessão manual de pontos.
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties, type FC } from 'react';
import { Loader2, RefreshCw, Search, X, KeyRound, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Estilos (espelham AdminPanel) ──────────────────────────────────────────

const card: CSSProperties = {
  background: 'rgba(20,20,28,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 16,
  color: 'rgba(255,255,255,0.9)',
};
const inputStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.9)',
  outline: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%',
};
const btnBase: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
  borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
  border: '1px solid transparent', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)',
};
const btnDanger: CSSProperties = {
  ...btnBase, background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.4)', color: 'rgb(255,160,160)',
};
const btnPrimary: CSSProperties = {
  ...btnBase, background: 'rgba(80,160,255,0.15)', border: '1px solid rgba(80,160,255,0.4)', color: 'rgb(160,200,255)',
};

// ─── Tipo da view ───────────────────────────────────────────────────────────

interface ClassRow {
  student_id:        string;
  student_name:      string;
  class_id:          string | null;
  class_name:        string | null;
  wave11_class:      string | null;
  primary_element:   string | null;
  secondary_element: string | null;
  chose_class_at:    string | null;
  available_points:  number;
  total_earned:      number;
  skills_unlocked:   number;
  elements_mastered: number;
}

const CLASS_OPTS = ['guerreiro','arqueiro','mago','assassino','monge','paladino','curandeiro','invocador','samurai','bardo','lanceiro','alquimista'];
const ELEMENT_OPTS = ['fire','water','grass','electric','ice','fighting','poison','ground','flying','ghost','steel','dark'];

// ─── Componente principal ────────────────────────────────────────────────────

export const AdminWave11ClassesTab: FC = () => {
  const [rows, setRows]       = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTurma,   setFilterTurma]   = useState<string>('all');
  const [filterClass,   setFilterClass]   = useState<string>('all');
  const [filterElement, setFilterElement] = useState<string>('all');
  const [search,        setSearch]        = useState('');

  const [resetTarget,  setResetTarget]    = useState<ClassRow | null>(null);
  const [grantTarget,  setGrantTarget]    = useState<ClassRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_wave11_classes_view' as never)
        .select('*')
        .order('student_name', { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as unknown as ClassRow[]);
    } catch (err) {
      toast.error('Falha ao carregar', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const turmas = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of rows) if (r.class_id && r.class_name) set.set(r.class_id, r.class_name);
    return Array.from(set.entries());
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterTurma   !== 'all' && r.class_id      !== filterTurma)   return false;
    if (filterClass   !== 'all' && r.wave11_class  !== filterClass)   return false;
    if (filterElement !== 'all' && r.primary_element !== filterElement) return false;
    if (search.trim() && !r.student_name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  }), [rows, filterTurma, filterClass, filterElement, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
      {/* Filtros */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, opacity: 0.5 }} />
            <input
              placeholder="Buscar aluno..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30 }}
            />
          </div>
          <select value={filterTurma} onChange={e => setFilterTurma(e.target.value)} style={inputStyle}>
            <option value="all">Todas as turmas</option>
            {turmas.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={inputStyle}>
            <option value="all">Todas as classes</option>
            {CLASS_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterElement} onChange={e => setFilterElement(e.target.value)} style={inputStyle}>
            <option value="all">Todos elementos</option>
            {ELEMENT_OPTS.map(el => <option key={el} value={el}>{el}</option>)}
          </select>
          <button onClick={() => void load()} style={btnBase} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
          {filtered.length} aluno{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Tabela */}
      <div style={card}>
        {loading && rows.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <Th>Aluno</Th>
                  <Th>Turma</Th>
                  <Th>Classe</Th>
                  <Th>Elemento Pri.</Th>
                  <Th>Elemento Sec.</Th>
                  <Th>Pontos (disp / total)</Th>
                  <Th>Skills</Th>
                  <Th>Mestria</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Td>{r.student_name}</Td>
                    <Td style={{ opacity: 0.7 }}>{r.class_name ?? '—'}</Td>
                    <Td>
                      {r.wave11_class
                        ? <span style={{ textTransform: 'capitalize' }}>{r.wave11_class}</span>
                        : <span style={{ opacity: 0.4 }}>não escolheu</span>}
                    </Td>
                    <Td style={{ textTransform: 'capitalize' }}>{r.primary_element ?? '—'}</Td>
                    <Td style={{ textTransform: 'capitalize' }}>{r.secondary_element ?? '—'}</Td>
                    <Td>{r.available_points} / {r.total_earned}</Td>
                    <Td>{r.skills_unlocked}</Td>
                    <Td>{r.elements_mastered}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setResetTarget(r)}
                          style={btnDanger}
                          disabled={!r.wave11_class}
                          title={r.wave11_class ? 'Resetar classe do aluno' : 'Aluno ainda não escolheu classe'}
                        >
                          <KeyRound size={12} /> Mudar classe
                        </button>
                        <button onClick={() => setGrantTarget(r)} style={btnPrimary}>
                          <Plus size={12} /> Pontos
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 24, textAlign: 'center', opacity: 0.5 }}>
                      Nenhum aluno encontrado com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetTarget && (
        <MasterChangeClassModal
          row={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => { setResetTarget(null); void load(); }}
        />
      )}
      {grantTarget && (
        <MasterGrantPointsModal
          row={grantTarget}
          onClose={() => setGrantTarget(null)}
          onDone={() => { setGrantTarget(null); void load(); }}
        />
      )}
    </div>
  );
};

const Th: FC<{ children: React.ReactNode }> = ({ children }) => (
  <th style={{ padding: '8px 10px', fontWeight: 600, opacity: 0.7 }}>{children}</th>
);
const Td: FC<{ children: React.ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <td style={{ padding: '8px 10px', ...style }}>{children}</td>
);

// ─── Modal: mudar classe (confirmação dupla com nome) ───────────────────────

const MasterChangeClassModal: FC<{
  row:     ClassRow;
  onClose: () => void;
  onDone:  () => void;
}> = ({ row, onClose, onDone }) => {
  const [typed, setTyped]       = useState('');
  const [submitting, setSubmit] = useState(false);

  const expected = row.student_name.trim();
  const canConfirm = typed.trim().toLowerCase() === expected.toLowerCase();

  async function handleSubmit() {
    setSubmit(true);
    try {
      const { data, error } = await supabase.rpc('master_reset_class' as never, {
        p_student_id: row.student_id,
      } as never);
      if (error) throw error;
      const res = data as unknown as { success: boolean; removed_skills?: number };
      toast.success(`Classe resetada — ${res.removed_skills ?? 0} skills removidas`);
      onDone();
    } catch (err) {
      toast.error('Falha ao resetar', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmit(false);
    }
  }

  return (
    <ModalShell title="Resetar classe do aluno" onClose={onClose}>
      <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>
        Esta ação reseta TODOS os pontos de skill de <strong>{row.student_name}</strong> e o
        redireciona pra escolha de classe no próximo login.<br />
        <span style={{ color: 'rgb(255,200,140)' }}>Atributos e evoluções são preservados.</span>
      </p>
      <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12, opacity: 0.75 }}>
        <li>{row.skills_unlocked} skills serão apagadas</li>
        <li>{row.elements_mastered} elemento(s) dominado(s) perderão a mestria</li>
        <li>Pool de pontos voltará pra {row.total_earned} (total ganho)</li>
      </ul>
      <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
        Para confirmar, digite o nome exato do aluno:{' '}
        <strong style={{ color: 'rgb(255,200,140)' }}>{expected}</strong>
      </p>
      <input
        value={typed}
        onChange={e => setTyped(e.target.value)}
        placeholder={expected}
        style={{ ...inputStyle, marginTop: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={btnBase} disabled={submitting}>Cancelar</button>
        <button
          onClick={handleSubmit}
          disabled={!canConfirm || submitting}
          style={canConfirm && !submitting ? btnDanger : { ...btnDanger, opacity: 0.4, cursor: 'not-allowed' }}
        >
          {submitting ? 'Resetando...' : 'Confirmar reset'}
        </button>
      </div>
    </ModalShell>
  );
};

// ─── Modal: conceder pontos ─────────────────────────────────────────────────

const MasterGrantPointsModal: FC<{
  row:     ClassRow;
  onClose: () => void;
  onDone:  () => void;
}> = ({ row, onClose, onDone }) => {
  const [amount, setAmount]   = useState<number>(1);
  const [submitting, setSubmit] = useState(false);

  async function handleSubmit() {
    if (amount === 0) return;
    setSubmit(true);
    try {
      const { data, error } = await supabase.rpc('master_grant_skill_points' as never, {
        p_student_id: row.student_id,
        p_points:     amount,
      } as never);
      if (error) throw error;
      const res = data as unknown as { available_points?: number };
      toast.success(`Aluno agora tem ${res.available_points ?? '?'} pontos disponíveis`);
      onDone();
    } catch (err) {
      toast.error('Falha ao conceder', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmit(false);
    }
  }

  return (
    <ModalShell title={`Conceder pontos — ${row.student_name}`} onClose={onClose}>
      <p style={{ fontSize: 13, opacity: 0.85 }}>
        Pool atual: <strong>{row.available_points}</strong> disponíveis · {row.total_earned} total ganho.
      </p>
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
        Use valores negativos para descontar (não fica abaixo de 0).
      </p>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(parseInt(e.target.value || '0', 10) || 0)}
        style={{ ...inputStyle, marginTop: 10 }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={btnBase} disabled={submitting}>Cancelar</button>
        <button
          onClick={handleSubmit}
          disabled={amount === 0 || submitting}
          style={amount !== 0 && !submitting ? btnPrimary : { ...btnPrimary, opacity: 0.4, cursor: 'not-allowed' }}
        >
          {submitting ? 'Aplicando...' : amount > 0 ? `Conceder +${amount}` : `Descontar ${amount}`}
        </button>
      </div>
    </ModalShell>
  );
};

// ─── Modal shell (espelhado de AdminPanel) ──────────────────────────────────

const ModalShell: FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
    }}
    onClick={onClose}
  >
    <div
      style={{
        ...card, width: 480, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto',
        background: 'rgba(15,15,22,0.97)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <button onClick={onClose} style={{ ...btnBase, padding: 4 }} aria-label="Fechar">
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default AdminWave11ClassesTab;
