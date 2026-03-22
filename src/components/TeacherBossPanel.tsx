import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";
import type { BossBattle, BossQuestion, BossAttempt } from "@/types";

interface TeacherBossPanelProps {
  teacherId: string;
  classes: { id: string; name: string }[];
  onDataChanged: () => void;
}

const DIFFICULTIES = [
  { value: 'easy', label: 'Fácil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Difícil' },
  { value: 'legendary', label: 'Lendário' },
];

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
};

function QuestionForm({ q, idx, onChange, onRemove }: {
  q: Partial<BossQuestion>; idx: number;
  onChange: (updated: Partial<BossQuestion>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-red-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Pergunta {idx + 1}
        </span>
        <button onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors"><X size={14} /></button>
      </div>

      <textarea
        value={q.question_text || ""}
        onChange={e => onChange({ ...q, question_text: e.target.value })}
        placeholder="Texto da pergunta..."
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm resize-none"
        style={inputStyle}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={q.question_type || "multiple_choice"}
          onChange={e => onChange({ ...q, question_type: e.target.value as BossQuestion['question_type'], options: null, correct_answer: "" })}
          className="px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="multiple_choice">Múltipla Escolha</option>
          <option value="true_false">V ou F</option>
          <option value="text">Resposta Aberta</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Dano:</span>
          <input
            type="number"
            value={q.damage || 10}
            min={1}
            onChange={e => onChange({ ...q, damage: parseInt(e.target.value) || 10 })}
            className="flex-1 px-2 py-2 rounded-lg text-sm text-center font-bold text-red-400"
            style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.2)' }}
          />
        </div>
      </div>

      {q.question_type === 'multiple_choice' && (
        <div className="space-y-2">
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <div key={letter} className="flex gap-2 items-center">
              <span className="text-xs text-white/40 w-5">{letter})</span>
              <input
                value={(q.options || [])[i] || ""}
                onChange={e => {
                  const opts = [...(q.options || ['', '', '', ''])];
                  opts[i] = e.target.value;
                  onChange({ ...q, options: opts });
                }}
                placeholder={`Opção ${letter}`}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => onChange({ ...q, correct_answer: letter })}
                className={`text-xs px-2 py-1.5 rounded-lg transition-all ${q.correct_answer === letter ? 'text-green-400' : 'text-white/20 hover:text-white/50'}`}
                style={{ background: q.correct_answer === letter ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${q.correct_answer === letter ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.08)'}` }}
              >
                {q.correct_answer === letter ? 'Correta' : 'Marcar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {q.question_type === 'true_false' && (
        <div className="flex gap-2">
          {['Verdadeiro', 'Falso'].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...q, correct_answer: v })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all`}
              style={{
                background: q.correct_answer === v ? (v === 'Verdadeiro' ? 'rgba(76,175,80,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.04)',
                border: `1px solid ${q.correct_answer === v ? (v === 'Verdadeiro' ? 'rgba(76,175,80,0.5)' : 'rgba(239,68,68,0.5)') : 'rgba(255,255,255,0.1)'}`,
                color: q.correct_answer === v ? (v === 'Verdadeiro' ? '#4caf50' : '#ef4444') : 'rgba(255,255,255,0.4)',
                fontFamily: 'Rajdhani, sans-serif',
              }}
            >{v}</button>
          ))}
        </div>
      )}

      {q.question_type === 'text' && (
        <input
          value={q.correct_answer || ""}
          onChange={e => onChange({ ...q, correct_answer: e.target.value })}
          placeholder="Resposta esperada (exata ou palavra-chave)"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        />
      )}
    </div>
  );
}

export function TeacherBossPanel({ teacherId, classes, onDataChanged }: TeacherBossPanelProps) {
  const [bosses, setBosses] = useState<BossBattle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedBoss, setExpandedBoss] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [bossName, setBossName] = useState("");
  const [bossTitle, setBossTitle] = useState("");
  const [bossDesc, setBossDesc] = useState("");
  const [bossHp, setBossHp] = useState(100);
  const [rewardCoins, setRewardCoins] = useState(20);
  const [rewardXp, setRewardXp] = useState(50);
  const [difficulty, setDifficulty] = useState<BossBattle['difficulty']>('normal');
  const [classId, setClassId] = useState<string>("");
  const [questions, setQuestions] = useState<Partial<BossQuestion>[]>([
    { question_type: 'multiple_choice', damage: 10, options: ['', '', '', ''], correct_answer: '' }
  ]);

  const loadBosses = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("boss_battles").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
    setBosses((data || []) as BossBattle[]);
    setIsLoading(false);
  };

  useEffect(() => { loadBosses(); }, [teacherId]);

  const totalPossibleDamage = questions.reduce((sum, q) => sum + (q.damage || 0), 0);

  const handleSave = async () => {
    if (!bossName.trim() || questions.length === 0) return;
    const validQuestions = questions.filter(q => q.question_text?.trim() && q.correct_answer?.trim());
    if (validQuestions.length === 0) {
      toast.error("Adicione pelo menos uma pergunta completa");
      return;
    }
    setIsSaving(true);
    try {
      const { data: boss, error: bossError } = await supabase.from("boss_battles").insert({
        teacher_id: teacherId,
        boss_name: bossName.trim(),
        title: bossTitle.trim() || bossName.trim(),
        description: bossDesc.trim() || null,
        boss_icon: 'dragon',
        boss_hp: bossHp,
        reward_coins: rewardCoins,
        reward_xp: rewardXp,
        difficulty,
        class_id: classId || null,
        is_active: false,
        time_limit_minutes: null,
      }).select().single();

      if (bossError || !boss) throw bossError;

      const questionsToInsert = validQuestions.map((q, i) => ({
        boss_id: boss.id,
        question_text: q.question_text!,
        question_type: q.question_type || 'multiple_choice',
        options: q.question_type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correct_answer!,
        damage: q.damage || 10,
        sort_order: i,
      }));

      await supabase.from("boss_questions").insert(questionsToInsert);

      toast.success("Boss criado! Ative-o para os alunos verem.");
      setShowCreate(false);
      resetForm();
      loadBosses();
    } catch (err: unknown) {
      toast.error("Erro ao salvar boss", { description: (err as { message?: string })?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setBossName(""); setBossTitle(""); setBossDesc(""); setBossHp(100);
    setRewardCoins(20); setRewardXp(50); setDifficulty('normal'); setClassId("");
    setQuestions([{ question_type: 'multiple_choice', damage: 10, options: ['', '', '', ''], correct_answer: '' }]);
  };

  const toggleActive = async (boss: BossBattle) => {
    const { error } = await supabase.from("boss_battles").update({ is_active: !boss.is_active }).eq("id", boss.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    loadBosses();
  };

  const deleteBoss = async (id: string) => {
    if (!confirm("Excluir este boss? Todas as tentativas serão perdidas.")) return;
    await supabase.from("boss_attempts").delete().eq("boss_id", id);
    await supabase.from("boss_questions").delete().eq("boss_id", id);
    await supabase.from("boss_battles").delete().eq("id", id);
    loadBosses();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="section-title">
          <span>Boss Battles</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-cyber text-xs gap-1">
          <Plus size={14} /> Criar Boss
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="holo-panel p-5 space-y-4" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 className="font-bold text-red-400 uppercase tracking-wider text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Novo Boss Battle
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Nome do Boss *</label>
              <input value={bossName} onChange={e => setBossName(e.target.value)} placeholder="Ex: Dragão dos Loops" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Título (assunto)</label>
              <input value={bossTitle} onChange={e => setBossTitle(e.target.value)} placeholder="Ex: Avaliação de Python" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
          </div>

          <textarea value={bossDesc} onChange={e => setBossDesc(e.target.value)} placeholder="Descrição (opcional)" rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={inputStyle} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">HP</label>
              <input type="number" value={bossHp} min={10} onChange={e => setBossHp(parseInt(e.target.value) || 100)} className="w-full px-3 py-2 rounded-lg text-sm text-center font-bold text-red-400" style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.2)' }} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Moedas</label>
              <input type="number" value={rewardCoins} min={0} onChange={e => setRewardCoins(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg text-sm text-center font-bold text-yellow-400" style={{ ...inputStyle, border: '1px solid rgba(255,215,0,0.2)' }} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">XP</label>
              <input type="number" value={rewardXp} min={0} onChange={e => setRewardXp(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg text-sm text-center font-bold text-cyan-400" style={{ ...inputStyle, border: '1px solid rgba(0,229,255,0.2)' }} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Dificuldade</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as BossBattle['difficulty'])} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Turma (opcional)</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
              <option value="">Todas as turmas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Perguntas ({questions.length})</span>
                <span className={`ml-3 text-xs ${totalPossibleDamage >= bossHp ? 'text-green-400' : 'text-yellow-400'}`}>
                  Dano possível: {totalPossibleDamage}/{bossHp} HP
                </span>
                {totalPossibleDamage < bossHp && (
                  <span className="ml-2 text-xs text-yellow-400/70">(boss imbatível!)</span>
                )}
              </div>
              <button
                onClick={() => setQuestions(prev => [...prev, { question_type: 'multiple_choice', damage: 10, options: ['', '', '', ''], correct_answer: '' }])}
                className="text-xs btn-cyber py-1 px-2"
              >
                <Plus size={12} /> Pergunta
              </button>
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionForm
                  key={i} q={q} idx={i}
                  onChange={updated => setQuestions(prev => prev.map((item, j) => j === i ? updated : item))}
                  onRemove={() => setQuestions(prev => prev.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => { setShowCreate(false); resetForm(); }} className="flex-1 py-2 rounded-lg text-white/40 text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancelar</button>
            <button onClick={handleSave} disabled={isSaving || !bossName.trim()} className="flex-1 btn-cyber justify-center" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Boss'}
            </button>
          </div>
        </div>
      )}

      {/* Boss list */}
      {isLoading ? (
        <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto text-red-400" /></div>
      ) : bosses.length === 0 ? (
        <div className="holo-panel text-center py-10 text-white/40">
          <GameIcon id="dragon" size={48} ringColor="rgba(255,255,255,0.2)" fillColor="rgba(255,255,255,0.2)" bgColor="rgba(255,255,255,0.03)" className="mx-auto mb-3" />
          <p>Nenhum boss criado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bosses.map(boss => (
            <div key={boss.id} className="holo-panel" style={{ borderColor: boss.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <GameIcon id="dragon" size={36} ringColor={boss.is_active ? "#ef4444" : "rgba(255,255,255,0.2)"} fillColor={boss.is_active ? "#ef4444" : "rgba(255,255,255,0.2)"} bgColor={boss.is_active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)"} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{boss.boss_name}</p>
                  <div className="text-xs text-white/30 flex gap-3">
                    <span>HP {boss.boss_hp}</span>
                    <span className="text-yellow-400">{boss.reward_coins} moedas</span>
                    <span className="text-cyan-400">+{boss.reward_xp} XP</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(boss)} className="p-2 rounded-lg transition-colors" style={{ background: boss.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${boss.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}` }} title={boss.is_active ? "Desativar" : "Ativar"}>
                    {boss.is_active ? <Eye size={14} className="text-red-400" /> : <EyeOff size={14} className="text-white/30" />}
                  </button>
                  <button onClick={() => setExpandedBoss(expandedBoss === boss.id ? null : boss.id)} className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {expandedBoss === boss.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => deleteBoss(boss.id)} className="p-2 rounded-lg text-red-400/40 hover:text-red-400 transition-colors" style={{ border: '1px solid rgba(239,68,68,0.1)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expandedBoss === boss.id && (
                <BossResultsExpanded bossId={boss.id} bossHp={boss.boss_hp} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Results sub-panel
function BossResultsExpanded({ bossId, bossHp }: { bossId: string; bossHp: number }) {
  const [attempts, setAttempts] = useState<(BossAttempt & { student: { name: string; character_name: string | null } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("boss_attempts")
        .select("*, student:students(name, character_name)")
        .eq("boss_id", bossId)
        .order("total_damage", { ascending: false });
      setAttempts((data || []) as unknown as (BossAttempt & { student: { name: string; character_name: string | null } })[]);
      setIsLoading(false);
    };
    load();
  }, [bossId]);

  if (isLoading) return <div className="mt-3 text-center text-white/30 text-xs">Carregando resultados...</div>;
  if (attempts.length === 0) return <div className="mt-3 text-center text-white/30 text-xs">Nenhuma tentativa ainda</div>;

  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.total_damage / bossHp) * 100, 0) / attempts.length) : 0;

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs text-white/40 mb-2">Média da turma: {avgScore}% · {attempts.length} tentativas · {attempts.filter(a => a.boss_defeated).length} derrotas</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {attempts.map(a => (
          <div key={a.id} className="flex items-center gap-2 text-xs">
            <span className="text-white/60 flex-1 truncate">{a.student?.character_name || a.student?.name}</span>
            <span className={a.boss_defeated ? 'text-yellow-400 font-bold' : 'text-white/40'}>{Math.round((a.total_damage / bossHp) * 100)}%</span>
            {a.boss_defeated && <span className="text-yellow-400">Derrotou</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
