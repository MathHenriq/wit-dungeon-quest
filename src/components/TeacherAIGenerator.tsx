import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  generateFromCurriculum, getApiKey, setApiKey,
  type GenerationRequest, type GeneratedContent, type GeneratedMission,
  type GeneratedBoss, type GeneratedChallenge, type GeneratedSkillNode,
  type Difficulty,
} from "@/lib/aiGenerator";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, Save, Key, Eye, EyeOff, CheckCircle, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { toast } from "sonner";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Difícil' },
  { value: 'legendary', label: 'Lendário' },
];

interface Props {
  teacherId: string;
  classes: { id: string; name: string }[];
  onDataChanged?: () => void;
}

export function TeacherAIGenerator({ teacherId, classes, onDataChanged }: Props) {
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!getApiKey());

  const [content, setContent] = useState('');
  const [generateMissions, setGenerateMissions] = useState(true);
  const [generateBoss, setGenerateBoss] = useState(true);
  const [generateChallenges, setGenerateChallenges] = useState(true);
  const [generateSkillNodes, setGenerateSkillNodes] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);

  // Editable previews
  const [editedMissions, setEditedMissions] = useState<GeneratedMission[]>([]);
  const [editedBoss, setEditedBoss] = useState<GeneratedBoss | null>(null);
  const [editedChallenges, setEditedChallenges] = useState<GeneratedChallenge[]>([]);
  const [editedSkillNodes, setEditedSkillNodes] = useState<GeneratedSkillNode[]>([]);

  const [expandedBossQ, setExpandedBossQ] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  function handleSaveKey(val: string) {
    setApiKeyState(val);
    setApiKey(val);
  }

  async function handleGenerate() {
    if (!content.trim()) { toast.error('Cole o conteúdo da aula primeiro.'); return; }
    if (!apiKey) { toast.error('Configure a API key da Anthropic.'); setShowKeyInput(true); return; }
    if (!generateMissions && !generateBoss && !generateChallenges && !generateSkillNodes) {
      toast.error('Selecione pelo menos um tipo de conteúdo para gerar.');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setSavedItems([]);
    try {
      const req: GenerationRequest = { content, generateMissions, generateBoss, generateChallenges, generateSkillNodes, difficulty };
      const generated = await generateFromCurriculum(req);
      setResult(generated);
      setEditedMissions(generated.missions ?? []);
      setEditedBoss(generated.boss ?? null);
      setEditedChallenges(generated.challenges ?? []);
      setEditedSkillNodes(generated.skill_nodes ?? []);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao gerar conteúdo.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveAll() {
    if (!result) return;
    setIsSaving(true);
    const saved: string[] = [];
    try {
      if (editedMissions.length > 0) {
        const rows = editedMissions.map(m => ({
          teacher_id: teacherId,
          class_id: classId || null,
          title: m.title,
          description: m.description,
          reward: m.reward,
          is_active: true,
        }));
        const { error } = await supabase.from('student_missions').insert(rows);
        if (error) throw new Error(`Missões: ${error.message}`);
        saved.push(`${editedMissions.length} missões`);
      }

      if (editedBoss) {
        const { data: bossData, error: bossErr } = await supabase
          .from('boss_battles')
          .insert({
            teacher_id: teacherId,
            class_id: classId || null,
            title: editedBoss.title,
            boss_name: editedBoss.boss_name,
            boss_hp: editedBoss.boss_hp,
            reward_coins: editedBoss.reward_coins,
            reward_xp: editedBoss.reward_xp,
            difficulty: difficulty === 'legendary' ? 'legendary' : difficulty,
            is_active: true,
          })
          .select('id')
          .single();
        if (bossErr || !bossData) throw new Error(`Boss: ${bossErr?.message}`);

        const questions = editedBoss.questions.map((q, i) => ({
          boss_id: bossData.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          damage: q.damage,
          order_index: i,
        }));
        const { error: qErr } = await supabase.from('boss_questions').insert(questions);
        if (qErr) throw new Error(`Perguntas do boss: ${qErr.message}`);
        saved.push('1 boss battle');
      }

      if (editedChallenges.length > 0) {
        const rows = editedChallenges.map(c => ({
          teacher_id: teacherId,
          class_id: classId || null,
          title: c.title,
          description: c.description,
          reward: c.reward,
          challenge_type: c.challenge_type,
          is_active: true,
        }));
        const { error } = await supabase.from('challenges').insert(rows);
        if (error) throw new Error(`Desafios: ${error.message}`);
        saved.push(`${editedChallenges.length} desafios`);
      }

      if (editedSkillNodes.length > 0) {
        const rows = editedSkillNodes.map(n => ({
          teacher_id: teacherId,
          name: n.name,
          description: n.description,
        }));
        const { error } = await supabase.from('skill_nodes').insert(rows);
        if (error) throw new Error(`Skill nodes: ${error.message}`);
        saved.push(`${editedSkillNodes.length} skill nodes`);
      }

      setSavedItems(saved);
      toast.success(`Salvo: ${saved.join(', ')}`);
      onDataChanged?.();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* API Key */}
      <div className="card-fantasy border-gold/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gold flex items-center gap-2">
            <Key size={15} /> API Key da Anthropic
          </p>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowKeyInput(v => !v)}>
            {showKeyInput ? 'Ocultar' : 'Configurar'}
          </button>
        </div>
        {showKeyInput && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => handleSaveKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm pr-10 font-mono"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              A key fica salva apenas neste dispositivo (localStorage). Nunca é enviada ao banco.
            </p>
          </div>
        )}
        {apiKey && !showKeyInput && (
          <p className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle size={12} /> Key configurada
          </p>
        )}
      </div>

      {/* Conteúdo da aula */}
      <div className="card-fantasy">
        <label className="text-sm font-semibold text-foreground block mb-2">
          Cole o conteúdo da aula ou tópicos abordados:
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          placeholder="Ex: Hoje abordamos Redes Neurais: Perceptron simples, Funções de ativação (ReLU, Sigmoid), Forward propagation..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
        />
      </div>

      {/* Opções */}
      <div className="card-fantasy grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground mb-2">O que gerar:</p>
          {[
            { key: 'generateMissions', label: 'Missões (3-5)', value: generateMissions, set: setGenerateMissions },
            { key: 'generateBoss', label: 'Boss Battle (1 boss + perguntas)', value: generateBoss, set: setGenerateBoss },
            { key: 'generateChallenges', label: 'Desafios rápidos (3-5)', value: generateChallenges, set: setGenerateChallenges },
            { key: 'generateSkillNodes', label: 'Skill nodes (3-6 tópicos)', value: generateSkillNodes, set: setGenerateSkillNodes },
          ].map(({ key, label, value, set }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={e => set(e.target.checked)}
                className="w-4 h-4 accent-gold"
              />
              <span className="text-sm text-muted-foreground">{label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Dificuldade base:</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              {DIFFICULTY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {classes.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1">Turma:</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Todas as turmas —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 font-bold gap-2"
      >
        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {isGenerating ? 'Gerando conteúdo com IA...' : 'Gerar com IA'}
      </Button>

      {/* Preview editável */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-t border-gold/20 pt-4">
            <Sparkles size={16} className="text-gold" />
            <p className="text-sm font-bold text-gold uppercase tracking-widest">Resultado — Revise antes de salvar</p>
          </div>

          {/* Missões */}
          {editedMissions.length > 0 && (
            <div className="card-fantasy space-y-2">
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-2">Missões ({editedMissions.length})</p>
              {editedMissions.map((m, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Pencil size={13} className="text-muted-foreground mt-1.5 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <input
                      value={m.title}
                      onChange={e => setEditedMissions(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      className="sm:col-span-2 bg-background border border-border rounded px-2 py-1 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">+</span>
                      <input
                        type="number"
                        value={m.reward}
                        onChange={e => setEditedMissions(prev => prev.map((x, j) => j === i ? { ...x, reward: Number(e.target.value) } : x))}
                        className="w-16 bg-background border border-border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">moedas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Boss */}
          {editedBoss && (
            <div className="card-fantasy space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Boss Battle</p>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  onClick={() => setExpandedBossQ(v => !v)}
                >
                  {expandedBossQ ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expandedBossQ ? 'Ocultar perguntas' : `Ver ${editedBoss.questions.length} perguntas`}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Nome do Boss</p>
                  <input
                    value={editedBoss.boss_name}
                    onChange={e => setEditedBoss(b => b ? { ...b, boss_name: e.target.value } : b)}
                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">HP</p>
                  <input
                    type="number"
                    value={editedBoss.boss_hp}
                    onChange={e => setEditedBoss(b => b ? { ...b, boss_hp: Number(e.target.value) } : b)}
                    className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
              {expandedBossQ && (
                <div className="space-y-2 mt-2">
                  {editedBoss.questions.map((q, i) => (
                    <div key={i} className="bg-background/40 rounded p-2 text-xs">
                      <input
                        value={q.question_text}
                        onChange={e => setEditedBoss(b => b ? {
                          ...b,
                          questions: b.questions.map((x, j) => j === i ? { ...x, question_text: e.target.value } : x)
                        } : b)}
                        className="w-full bg-background border border-border rounded px-2 py-1 mb-1"
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-muted-foreground">Correta:</span>
                        <input
                          value={q.correct_answer}
                          onChange={e => setEditedBoss(b => b ? {
                            ...b,
                            questions: b.questions.map((x, j) => j === i ? { ...x, correct_answer: e.target.value } : x)
                          } : b)}
                          className="w-12 bg-background border border-border rounded px-2 py-0.5"
                        />
                        <span className="text-muted-foreground ml-2">Dano:</span>
                        <input
                          type="number"
                          value={q.damage}
                          onChange={e => setEditedBoss(b => b ? {
                            ...b,
                            questions: b.questions.map((x, j) => j === i ? { ...x, damage: Number(e.target.value) } : x)
                          } : b)}
                          className="w-14 bg-background border border-border rounded px-2 py-0.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Desafios */}
          {editedChallenges.length > 0 && (
            <div className="card-fantasy space-y-2">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Desafios ({editedChallenges.length})</p>
              {editedChallenges.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Pencil size={13} className="text-muted-foreground mt-1.5 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <input
                      value={c.title}
                      onChange={e => setEditedChallenges(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      className="sm:col-span-2 bg-background border border-border rounded px-2 py-1 text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">+</span>
                      <input
                        type="number"
                        value={c.reward}
                        onChange={e => setEditedChallenges(prev => prev.map((x, j) => j === i ? { ...x, reward: Number(e.target.value) } : x))}
                        className="w-16 bg-background border border-border rounded px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">moedas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skill nodes */}
          {editedSkillNodes.length > 0 && (
            <div className="card-fantasy space-y-2">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Skill Nodes ({editedSkillNodes.length})</p>
              {editedSkillNodes.map((n, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Pencil size={13} className="text-muted-foreground flex-shrink-0" />
                  <input
                    value={n.name}
                    onChange={e => setEditedSkillNodes(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          {savedItems.length === 0 ? (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex-1 bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30 font-bold gap-2"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Salvando...' : 'Salvar tudo'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
              >
                <RefreshCw size={14} /> Refazer
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-sm text-green-400">Salvo com sucesso: {savedItems.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
