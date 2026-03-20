import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import {
  Sparkles,
  Scroll,
  Heart,
  Eye,
  Brain,
  Save
} from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types";

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
  }, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
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

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
    } else {
      toast.success("Personagem atualizado!", { icon: "⚔️" });
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Character Header with Profile Photo */}
      <div className="card-fantasy bg-gradient-to-r from-dungeon-dark to-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-4">
          <ProfilePhoto
            studentId={student.id}
            currentPhotoUrl={student.profile_photo_url || null}
            onUpdate={onUpdate}
            size="lg"
            editable={true}
          />
          <div>
            <h2 className="font-display text-2xl font-bold text-gold">
              {characterName || student.name}
            </h2>
            <p className="text-primary-foreground/80">
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
