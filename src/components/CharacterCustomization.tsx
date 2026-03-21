import { useState, useEffect } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import {
  Sparkles,
  Scroll,
  Heart,
  Eye,
  Brain,
  Save,
  Swords,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import type { Student, AttrKey } from "@/types";
import { ATTRIBUTES } from "@/types";

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

export function CharacterCustomization({ student, onUpdate }: CharacterCustomizationProps) {
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
        toast.success("Atributos salvos!", { icon: "⚔️" });
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
        toast.success("Personagem atualizado!", { icon: "⚔️" });
        onUpdate();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="card-fantasy p-0 overflow-hidden">
        {/* Banner image area */}
        <div className="relative h-36 bg-gradient-to-r from-dungeon-dark to-primary">
          {student.profile_photo_url && (
            <img
              src={student.profile_photo_url}
              alt="Banner"
              className="w-full h-full object-cover opacity-60"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Avatar + info row */}
        <div className="relative px-5 pb-4">
          {/* Avatar overlapping the banner */}
          <div className="absolute -top-12 left-5">
            <div className="ring-4 ring-background rounded-full">
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

          {/* Name / class offset to the right of the avatar */}
          <div className="pl-32 pt-2">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {characterName || student.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {race && characterClass
                ? `${race} • ${characterClass}`
                : "Configure seu personagem abaixo"}
            </p>
          </div>
        </div>
      </div>

      {/* Identity Section */}
      <div className="card-fantasy">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-gold" size={20} />
          <h3 className="font-display font-bold text-lg">Identidade</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Nome do Personagem
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Escolha um nome épico..."
              maxLength={60}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Raça
            </label>
            <select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold outline-none transition-all"
            >
              <option value="">Selecione uma raça...</option>
              {RACES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Classe
            </label>
            <select
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold outline-none transition-all"
            >
              <option value="">Selecione uma classe...</option>
              {CHARACTER_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Personalidade
            </label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold outline-none transition-all"
            >
              <option value="">Selecione um traço...</option>
              {PERSONALITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Motivation */}
      <div className="card-fantasy">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="text-destructive" size={20} />
          <h3 className="font-display font-bold text-lg">Motivação</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          O que move seu personagem? Por que ele está nessa jornada?
        </p>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Ex: Busca vingança pelo seu mestre caído, quer se tornar o maior mago do reino, deseja proteger os inocentes..."
          maxLength={500}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
          rows={3}
        />
      </div>

      {/* Lore / History */}
      <div className="card-fantasy">
        <div className="flex items-center gap-2 mb-4">
          <Scroll className="text-gold" size={20} />
          <h3 className="font-display font-bold text-lg">História</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Conte a história do seu personagem. De onde veio? O que já viveu?
        </p>
        <textarea
          value={lore}
          onChange={(e) => setLore(e.target.value)}
          placeholder="Ex: Nascido nas montanhas geladas do norte, foi criado por uma tribo de guerreiros nômades..."
          maxLength={1000}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
          rows={4}
        />
      </div>

      {/* Appearance */}
      <div className="card-fantasy">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="text-primary" size={20} />
          <h3 className="font-display font-bold text-lg">Aparência</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Descreva como seu personagem se parece.
        </p>
        <textarea
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          placeholder="Ex: Alto e magro, cabelos prateados caindo até os ombros, olhos violeta brilhantes, cicatriz no rosto..."
          maxLength={500}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all resize-none"
          rows={3}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-fantasy flex items-center gap-2 px-6 py-3"
        >
          <Save size={20} />
          {isSaving ? "Salvando..." : "Salvar Personagem"}
        </button>
      </div>

      {/* ── Attributes ─────────────────────────────── */}
      <div className="card-fantasy">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="text-gold" size={20} />
            <h3 className="font-display font-bold text-lg">Atributos do Personagem</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${pendingPoints > 0 ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
            ✨ {pendingPoints} {pendingPoints === 1 ? "ponto disponível" : "pontos disponíveis"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {ATTRIBUTES.map(attr => {
            const val = pendingAttrs[attr.key] ?? 0;
            const max = 20;
            return (
              <div key={attr.key} className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border">
                <span className="text-xl w-7 text-center flex-shrink-0">{attr.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{attr.label}</span>
                    <span className="text-sm font-bold text-primary">{val}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min((val / max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => removePoint(attr.key)}
                    disabled={val <= 0}
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all disabled:opacity-30 flex items-center justify-center"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => addPoint(attr.key)}
                    disabled={pendingPoints <= 0}
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all disabled:opacity-30 flex items-center justify-center"
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
              className="btn-fantasy flex items-center gap-2"
            >
              {isSavingAttrs ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSavingAttrs ? "Salvando..." : "Salvar Atributos"}
            </button>
          </div>
        )}

        {pendingPoints > 0 && (
          <p className="text-xs text-green-400 mt-2 text-center">
            Você tem {pendingPoints} {pendingPoints === 1 ? "ponto" : "pontos"} para distribuir! Use os botões + acima.
          </p>
        )}
      </div>

      {/* Info Note */}
      <div className="card-fantasy bg-secondary/50 border-dashed">
        <div className="flex items-start gap-3">
          <Brain className="text-muted-foreground flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-1">Nota importante</p>
            <p>
              Todas as opções acima são visuais e narrativas. Elas não afetam mecânicas do jogo automaticamente. 
              O professor pode decidir usar essas informações para criar habilidades ou bônus especiais para seu personagem!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
