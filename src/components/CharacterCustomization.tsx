import { useState, useEffect } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { SpriteUpload } from "@/components/SpriteUpload";
import {
  Save,
  Swords,
  Loader2,
  Plus,
  Minus,
  User,
  BookOpen,
  Sparkles,
  Eye,
  Sword,
} from "lucide-react";
import { toast } from "sonner";
import type { Student, AttrKey } from "@/types";
import { ATTRIBUTES } from "@/types";
import { GameIcon } from "@/components/icons/GameIcon";
import { useQuery } from "@tanstack/react-query";

interface CharacterCustomizationProps {
  student: Student;
  onUpdate: () => void;
}

const RACES = [
  "Humano",
  "Elfo",
  "Anão",
  "Orc",
  "Goblin",
  "Android",
  "Criatura IA",
  "Vampiro",
  "Lobisomem",
  "Fada",
  "Dragão",
  "Demônio",
  "Anjo",
  "Sereia",
  "Centauro",
  "Outro",
];

const CHARACTER_CLASSES = [
  "Guerreiro",
  "Mago",
  "Arqueiro",
  "Ladino",
  "Paladino",
  "Monge",
  "Druida",
  "Bardo",
  "Estrategista",
  "Hacker",
  "Artífice",
  "Invocador",
  "Necromante",
  "Alquimista",
  "Outro",
];

const PERSONALITIES = [
  "Corajoso",
  "Curioso",
  "Estratégico",
  "Sábio",
  "Impulsivo",
  "Cauteloso",
  "Carismático",
  "Misterioso",
  "Gentil",
  "Determinado",
  "Brincalhão",
  "Protetor",
];

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
  width: '100%',
};

export function CharacterCustomization({ student, onUpdate }: CharacterCustomizationProps) {
  // Fetch battle character to get id + sprite URLs (using studentClient for RLS)
  const { data: battleCharacter } = useQuery({
    queryKey: ['character-sprites', student.user_id],
    enabled: !!student.user_id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabaseStudent
        .from('characters')
        .select('id, sprite_pixel_front, sprite_pixel_back, sprite_pixel_attack')
        .eq('user_id', student.user_id!)
        .maybeSingle();
      return data ?? null;
    },
  });

  const [characterName, setCharacterName] = useState(student.character_name || "");
  const [race, setRace] = useState(student.race || "");
  const [characterClass, setCharacterClass] = useState(student.character_class || "");
  const [motivation, setMotivation] = useState(student.motivation || "");
  const [lore, setLore] = useState(student.lore || "");
  const [appearance, setAppearance] = useState(student.appearance || "");
  const [personality, setPersonality] = useState(student.personality || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAttrs, setIsSavingAttrs] = useState(false);

  // Local copy of attributes for pending distribution
  const [pendingAttrs, setPendingAttrs] = useState<Record<AttrKey, number>>(() => ({
    attr_forca:        student.attr_forca        ?? 0,
    attr_destreza:     student.attr_destreza     ?? 0,
    attr_inteligencia: student.attr_inteligencia ?? 0,
    attr_carisma:      student.attr_carisma      ?? 0,
    attr_agilidade:    student.attr_agilidade    ?? 0,
    attr_resistencia:  student.attr_resistencia  ?? 0,
  }));
  const [pendingPoints, setPendingPoints] = useState(student.pontos_disponiveis ?? 0);

  // Only reset form fields when a different student is loaded, not on every field update
  // (avoids losing unsaved edits when realtime updates coins/level)
  useEffect(() => {
    setCharacterName(student.character_name || "");
    setRace(student.race || "");
    setCharacterClass(student.character_class || "");
    setMotivation(student.motivation || "");
    setLore(student.lore || "");
    setAppearance(student.appearance || "");
    setPersonality(student.personality || "");
    setPendingAttrs({
      attr_forca:        student.attr_forca        ?? 0,
      attr_destreza:     student.attr_destreza     ?? 0,
      attr_inteligencia: student.attr_inteligencia ?? 0,
      attr_carisma:      student.attr_carisma      ?? 0,
      attr_agilidade:    student.attr_agilidade    ?? 0,
      attr_resistencia:  student.attr_resistencia  ?? 0,
    });
    setPendingPoints(student.pontos_disponiveis ?? 0);
  }, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPoint = (key: AttrKey) => {
    if (pendingPoints <= 0) return;
    setPendingAttrs(prev => ({ ...prev, [key]: prev[key] + 1 }));
    setPendingPoints(p => p - 1);
  };

  const removePoint = (key: AttrKey) => {
    if ((pendingAttrs[key] ?? 0) <= 0) return;
    setPendingAttrs(prev => ({ ...prev, [key]: prev[key] - 1 }));
    setPendingPoints(p => p + 1);
  };

  const handleSaveAttrs = async () => {
    setIsSavingAttrs(true);
    try {
      const { error } = await supabaseStudent
        .from("students")
        .update({ ...pendingAttrs, pontos_disponiveis: pendingPoints })
        .eq("id", student.id);
      if (error) {
        toast.error("Erro ao salvar atributos", { description: error.message });
      } else {
        toast.success("Atributos salvos!");
        onUpdate();
      }
    } finally {
      setIsSavingAttrs(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabaseStudent
        .from("students")
        .update({
          character_name: characterName.trim() || null,
          race: race || null,
          character_class: characterClass || null,
          motivation: motivation.trim() || null,
          lore: lore.trim() || null,
          appearance: appearance.trim() || null,
          personality: personality || null,
        })
        .eq("id", student.id);

      if (error) {
        toast.error("Erro ao salvar", { description: error.message });
      } else {
        toast.success("Personagem atualizado!");
        onUpdate();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="holo-panel p-0 overflow-hidden">
        {/* Banner image area */}
        <div className="relative h-36" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(124,77,255,0.08))' }}>
          {student.profile_photo_url && (
            <img
              src={student.profile_photo_url}
              alt="Banner"
              className="w-full h-full object-cover opacity-40"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Avatar + info row */}
        <div className="relative px-5 pb-4">
          <div className="absolute -top-12 left-5">
            <div className="ring-2 ring-cyan-400/30 rounded-full" style={{ boxShadow: '0 0 20px rgba(0,229,255,0.15)' }}>
              <ProfilePhoto
                studentId={student.id}
                currentPhotoUrl={student.profile_photo_url || null}
                onUpdate={onUpdate}
                size="lg"
                editable={true}
                uploadClient={supabaseStudent}
              />
            </div>
          </div>

          <div className="pl-32 pt-2">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {characterName || student.name}
            </h2>
            <p className="text-white/40 text-sm">
              {race && characterClass
                ? `${race} • ${characterClass}`
                : "Configure seu personagem abaixo"}
            </p>
          </div>
        </div>
      </div>

      {/* Identity Section */}
      <div className="holo-panel">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-cyan-400" size={18} />
          <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>IDENTIDADE</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">
              Nome do Personagem
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Escolha um nome épico..."
              maxLength={60}
              className="px-4 py-3 rounded-lg text-sm transition-colors"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">
              Raca
            </label>
            <select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm transition-colors"
              style={inputStyle}
            >
              <option value="">Selecione uma raca...</option>
              {RACES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">
              Classe
            </label>
            <select
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm transition-colors"
              style={inputStyle}
            >
              <option value="">Selecione uma classe...</option>
              {CHARACTER_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">
              Personalidade
            </label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="px-4 py-3 rounded-lg text-sm transition-colors"
              style={inputStyle}
            >
              <option value="">Selecione um traco...</option>
              {PERSONALITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Motivation */}
      <div className="holo-panel">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-cyan-400" size={18} />
          <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>MOTIVACAO</h3>
        </div>
        <p className="text-sm text-white/40 mb-3">
          O que move seu personagem? Por que ele esta nessa jornada?
        </p>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Ex: Busca vinganca pelo seu mestre caido, quer se tornar o maior mago do reino..."
          maxLength={500}
          className="px-4 py-3 rounded-lg text-sm resize-none transition-colors"
          style={{ ...inputStyle, width: '100%' }}
          rows={3}
          onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Lore / History */}
      <div className="holo-panel">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-cyan-400" size={18} />
          <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>HISTORIA</h3>
        </div>
        <p className="text-sm text-white/40 mb-3">
          Conte a historia do seu personagem. De onde veio? O que ja viveu?
        </p>
        <textarea
          value={lore}
          onChange={(e) => setLore(e.target.value)}
          placeholder="Ex: Nascido nas montanhas geladas do norte, foi criado por uma tribo de guerreiros nomades..."
          maxLength={1000}
          className="px-4 py-3 rounded-lg text-sm resize-none transition-colors"
          style={{ ...inputStyle, width: '100%' }}
          rows={4}
          onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Appearance */}
      <div className="holo-panel">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="text-cyan-400" size={18} />
          <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>APARENCIA</h3>
        </div>
        <p className="text-sm text-white/40 mb-3">
          Descreva como seu personagem se parece.
        </p>
        <textarea
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          placeholder="Ex: Alto e magro, cabelos prateados caindo ate os ombros, olhos violeta brilhantes..."
          maxLength={500}
          className="px-4 py-3 rounded-lg text-sm resize-none transition-colors"
          style={{ ...inputStyle, width: '100%' }}
          rows={3}
          onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Battle Sprites */}
      {battleCharacter && (
        <div className="holo-panel">
          <div className="flex items-center gap-2 mb-4">
            <Sword className="text-cyan-400" size={18} />
            <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>SPRITES DE BATALHA</h3>
          </div>
          <SpriteUpload
            characterId={battleCharacter.id}
            studentId={student.id}
            initialUrls={{
              sprite_pixel_front:  battleCharacter.sprite_pixel_front,
              sprite_pixel_back:   battleCharacter.sprite_pixel_back,
              sprite_pixel_attack: battleCharacter.sprite_pixel_attack,
            }}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-cyber"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Salvando..." : "Salvar Personagem"}
        </button>
      </div>

      {/* Attributes */}
      <div className="holo-panel">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="text-cyan-400" size={18} />
            <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', fontSize: '1rem' }}>ATRIBUTOS</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${pendingPoints > 0 ? "text-green-400" : "text-white/30"}`}
            style={{ background: pendingPoints > 0 ? 'rgba(76,175,80,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${pendingPoints > 0 ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
            <Sparkles size={14} />
            {pendingPoints} {pendingPoints === 1 ? "ponto disponivel" : "pontos disponiveis"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {ATTRIBUTES.map(attr => {
            const val = pendingAttrs[attr.key] ?? 0;
            const max = 20;
            return (
              <div key={attr.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <GameIcon id={attr.iconId} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white/80">{attr.label}</span>
                    <span className="text-sm font-bold text-cyan-400">{val}</span>
                  </div>
                  <div className="cyber-progress">
                    <div
                      className="cyber-progress-bar"
                      style={{ width: `${Math.min((val / max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => removePoint(attr.key)}
                    disabled={val <= 0}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => { if (val > 0) (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => addPoint(attr.key)}
                    disabled={pendingPoints <= 0}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => { if (pendingPoints > 0) (e.target as HTMLElement).style.background = 'rgba(0,229,255,0.15)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save attrs button — only shown when there are unsaved changes */}
        {(Object.entries(pendingAttrs).some(([k, v]) => v !== (student[k as AttrKey] ?? 0)) ||
          pendingPoints !== (student.pontos_disponiveis ?? 0)) && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveAttrs}
              disabled={isSavingAttrs}
              className="btn-cyber"
            >
              {isSavingAttrs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSavingAttrs ? "Salvando..." : "Salvar Atributos"}
            </button>
          </div>
        )}

        {pendingPoints > 0 && (
          <p className="text-xs text-green-400 mt-2 text-center">
            Voce tem {pendingPoints} {pendingPoints === 1 ? "ponto" : "pontos"} para distribuir! Use os botoes + acima.
          </p>
        )}
      </div>

      {/* Info Note */}
      <div className="holo-panel" style={{ borderStyle: 'dashed' }}>
        <div className="flex items-start gap-3">
          <Sparkles className="text-white/30 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-white/40">
            <p className="font-semibold mb-1 text-white/60">Nota importante</p>
            <p>
              Todas as opcoes acima sao visuais e narrativas. Elas nao afetam mecanicas do jogo automaticamente.
              O professor pode decidir usar essas informacoes para criar habilidades ou bonus especiais para seu personagem!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
