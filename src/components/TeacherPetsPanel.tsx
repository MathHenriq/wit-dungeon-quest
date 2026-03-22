import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";
import type { PetType } from "@/types";

interface TeacherPetsPanelProps {
  teacherId: string;
}

interface StudentWithPet {
  id: string;
  name: string;
  character_name: string | null;
  pet_name: string;
  pet_stage: number;
  pet_xp: number;
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
};

const BONUS_OPTIONS = [
  { value: '', label: 'Nenhum bônus' },
  { value: 'xp', label: 'Bônus de XP' },
  { value: 'coins', label: 'Bônus de Moedas' },
  { value: 'streak_protection', label: 'Proteção de Sequência' },
];

export function TeacherPetsPanel({ teacherId }: TeacherPetsPanelProps) {
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedPet, setExpandedPet] = useState<string | null>(null);
  const [studentsPerPet, setStudentsPerPet] = useState<Record<string, StudentWithPet[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    stage1_name: 'Ovo',
    stage2_name: 'Filhote',
    stage3_name: 'Adulto',
    stage1_icon: 'egg',
    stage2_icon: 'star',
    stage3_icon: 'flame',
    bonus_type: '' as '' | 'xp' | 'coins' | 'streak_protection',
    bonus_value: 5,
    evolution_threshold_2: 50,
    evolution_threshold_3: 150,
  });

  useEffect(() => {
    loadPetTypes();
  }, [teacherId]);

  async function loadPetTypes() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('pet_types')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TeacherPetsPanel] loadPetTypes:', error);
      toast.error('Erro ao carregar tipos de pet');
    } else {
      setPetTypes((data || []) as unknown as PetType[]);
    }
    setIsLoading(false);
  }

  async function loadStudentsForPet(petTypeId: string) {
    if (studentsPerPet[petTypeId] !== undefined) {
      return;
    }
    setLoadingStudents(petTypeId);
    const { data, error } = await supabase
      .from('student_pets')
      .select('name, xp, current_stage, student:students(id, name, character_name)')
      .eq('pet_type_id', petTypeId)
      .eq('is_active', true);

    if (error) {
      console.error('[TeacherPetsPanel] loadStudentsForPet:', error);
      toast.error('Erro ao carregar alunos');
    } else {
      const list: StudentWithPet[] = (data || []).map((row) => {
        const s = row.student as unknown as { id: string; name: string; character_name: string | null };
        return {
          id: s?.id ?? '',
          name: s?.name ?? '',
          character_name: s?.character_name ?? null,
          pet_name: row.name as string,
          pet_stage: row.current_stage as number,
          pet_xp: row.xp as number,
        };
      });
      setStudentsPerPet(prev => ({ ...prev, [petTypeId]: list }));
    }
    setLoadingStudents(null);
  }

  function toggleExpand(petTypeId: string) {
    if (expandedPet === petTypeId) {
      setExpandedPet(null);
    } else {
      setExpandedPet(petTypeId);
      loadStudentsForPet(petTypeId);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    const { error } = await supabase.from('pet_types').insert({
      teacher_id: teacherId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.stage1_icon,
      stage1_name: form.stage1_name.trim(),
      stage2_name: form.stage2_name.trim(),
      stage3_name: form.stage3_name.trim(),
      stage1_icon: form.stage1_icon.trim(),
      stage2_icon: form.stage2_icon.trim(),
      stage3_icon: form.stage3_icon.trim(),
      bonus_type: form.bonus_type || null,
      bonus_value: form.bonus_type ? form.bonus_value : null,
      evolution_threshold_2: form.evolution_threshold_2,
      evolution_threshold_3: form.evolution_threshold_3,
    });

    if (error) {
      toast.error('Erro ao criar tipo de pet', { description: error.message });
    } else {
      toast.success('Tipo de pet criado!');
      setShowCreateForm(false);
      setForm({
        name: '',
        description: '',
        stage1_name: 'Ovo',
        stage2_name: 'Filhote',
        stage3_name: 'Adulto',
        stage1_icon: 'egg',
        stage2_icon: 'star',
        stage3_icon: 'flame',
        bonus_type: '',
        bonus_value: 5,
        evolution_threshold_2: 50,
        evolution_threshold_3: 150,
      });
      await loadPetTypes();
    }
    setIsSaving(false);
  }

  async function handleDelete(petTypeId: string) {
    if (!confirm('Excluir este tipo de pet? Todos os alunos que o adotaram perderão seus pets.')) return;
    setDeletingId(petTypeId);
    const { error } = await supabase.from('pet_types').delete().eq('id', petTypeId);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Tipo de pet excluído');
      await loadPetTypes();
    }
    setDeletingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-cyan-400" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameIcon id="heart" size={20} />
          <span className="text-white/60 text-sm">
            {petTypes.length} tipo{petTypes.length !== 1 ? 's' : ''} de pet
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="btn-cyber"
        >
          <Plus size={16} />
          Novo Tipo de Pet
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="holo-panel space-y-4" style={{ border: '1px solid rgba(0,229,255,0.2)' }}>
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Novo Tipo de Pet
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome do Pet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Dragão de Cristal"
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição opcional"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome Estágio 1</label>
                <input
                  type="text"
                  value={form.stage1_name}
                  onChange={e => setForm(f => ({ ...f, stage1_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome Estágio 2</label>
                <input
                  type="text"
                  value={form.stage2_name}
                  onChange={e => setForm(f => ({ ...f, stage2_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome Estágio 3</label>
                <input
                  type="text"
                  value={form.stage3_name}
                  onChange={e => setForm(f => ({ ...f, stage3_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Ícone E1</label>
                <input
                  type="text"
                  value={form.stage1_icon}
                  onChange={e => setForm(f => ({ ...f, stage1_icon: e.target.value }))}
                  placeholder="ex: egg"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Ícone E2</label>
                <input
                  type="text"
                  value={form.stage2_icon}
                  onChange={e => setForm(f => ({ ...f, stage2_icon: e.target.value }))}
                  placeholder="ex: star"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Ícone E3</label>
                <input
                  type="text"
                  value={form.stage3_icon}
                  onChange={e => setForm(f => ({ ...f, stage3_icon: e.target.value }))}
                  placeholder="ex: flame"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">XP para Evolução 2</label>
                <input
                  type="number"
                  min={1}
                  value={form.evolution_threshold_2}
                  onChange={e => setForm(f => ({ ...f, evolution_threshold_2: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">XP para Evolução 3</label>
                <input
                  type="number"
                  min={1}
                  value={form.evolution_threshold_3}
                  onChange={e => setForm(f => ({ ...f, evolution_threshold_3: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Tipo de Bônus</label>
                <select
                  value={form.bonus_type}
                  onChange={e => setForm(f => ({ ...f, bonus_type: e.target.value as typeof form.bonus_type }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                >
                  {BONUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {form.bonus_type && (
                <div>
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Valor do Bônus (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.bonus_value}
                    onChange={e => setForm(f => ({ ...f, bonus_value: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSaving} className="btn-cyber">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Criar Pet
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-white/50 hover:text-white/80 transition-colors text-sm"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pet Types List */}
      {petTypes.length === 0 ? (
        <div className="holo-panel text-center py-10">
          <GameIcon id="heart" size={48} />
          <p className="text-white/40 mt-3">Nenhum tipo de pet criado ainda</p>
          <p className="text-white/25 text-sm mt-1">Crie tipos de pet para que os alunos possam adotar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {petTypes.map(pet => {
            const isExpanded = expandedPet === pet.id;
            const students = studentsPerPet[pet.id] ?? [];
            const bonusLabel = BONUS_OPTIONS.find(o => o.value === pet.bonus_type)?.label ?? 'Nenhum';

            return (
              <div key={pet.id} className="holo-panel" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}
                  >
                    <GameIcon id="heart" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                        {pet.name}
                      </h3>
                      {pet.bonus_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-cyan-400" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)' }}>
                          {bonusLabel} +{pet.bonus_value}%
                        </span>
                      )}
                    </div>
                    {pet.description && (
                      <p className="text-white/50 text-sm mt-0.5">{pet.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <GameIcon id="star" size={12} />
                        <span>{pet.stage1_name}</span>
                        <span className="text-white/20">→</span>
                        <span>{pet.stage2_name} ({pet.evolution_threshold_2} XP)</span>
                        <span className="text-white/20">→</span>
                        <span>{pet.stage3_name} ({pet.evolution_threshold_3} XP)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleExpand(pet.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/90 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Users size={14} />
                      Ver Alunos
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      disabled={deletingId === pet.id}
                      className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      {deletingId === pet.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {loadingStudents === pet.id ? (
                      <div className="flex items-center gap-2 text-white/40 text-sm py-2">
                        <Loader2 size={14} className="animate-spin" /> Carregando alunos...
                      </div>
                    ) : students.length === 0 ? (
                      <p className="text-white/30 text-sm py-2">Nenhum aluno adotou este pet ainda</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
                          {students.length} aluno{students.length !== 1 ? 's' : ''} com este pet
                        </p>
                        {students.map(s => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-3 py-2 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <div>
                              <span className="text-sm font-medium text-white/80" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                {s.name}
                              </span>
                              {s.character_name && (
                                <span className="text-xs text-white/40 ml-2">({s.character_name})</span>
                              )}
                              <span className="text-xs text-white/40 ml-3">Pet: {s.pet_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <span className="text-cyan-400">E{s.pet_stage}</span>
                              <span>{s.pet_xp} XP</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
