import { useState, useEffect } from "react";
import { useTeacherReward, RewardConfig } from "@/hooks/useTeacherReward";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RewardDisplay } from "@/components/RewardDisplay";
import { Sparkles, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TeacherRewardSettingsProps {
  teacherId: string;
}

const EMOJI_SUGGESTIONS = ["🪙", "⭐", "💎", "🏆", "✨", "🔥", "💰", "🎯", "⚡", "🌟"];

export function TeacherRewardSettings({ teacherId }: TeacherRewardSettingsProps) {
  const { rewardConfig, isLoading, saveRewardConfig, DEFAULT_REWARD } = useTeacherReward(teacherId);
  
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [singularLabel, setSingularLabel] = useState("");
  const [pluralLabel, setPluralLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync form with loaded config
  useEffect(() => {
    if (rewardConfig) {
      setName(rewardConfig.name);
      setIcon(rewardConfig.icon);
      setSingularLabel(rewardConfig.unit_label_singular);
      setPluralLabel(rewardConfig.unit_label_plural);
    }
  }, [rewardConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !icon.trim()) {
      toast.error("Preencha nome e ícone da recompensa");
      return;
    }

    setIsSaving(true);
    const result = await saveRewardConfig({
      name: name.trim(),
      icon: icon.trim(),
      unit_label_singular: singularLabel.trim() || name.toLowerCase(),
      unit_label_plural: pluralLabel.trim() || `${name.toLowerCase()}s`,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error("Erro ao salvar", { description: result.error.message });
    } else {
      toast.success("Recompensa configurada!", { icon: icon });
    }
  };

  const handleReset = () => {
    setName(DEFAULT_REWARD.name);
    setIcon(DEFAULT_REWARD.icon);
    setSingularLabel(DEFAULT_REWARD.unit_label_singular);
    setPluralLabel(DEFAULT_REWARD.unit_label_plural);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xl font-display font-bold">
        <Sparkles className="text-gold" />
        Configurar Recompensa
      </div>

      <p className="text-muted-foreground text-sm">
        Personalize o tipo de recompensa que seus alunos receberão. 
        Esta é apenas uma representação visual - os valores numéricos funcionam da mesma forma.
      </p>

      {/* Preview */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
        <div className="flex items-center gap-4 flex-wrap">
          <RewardDisplay amount={50} icon={icon || "🪙"} size="lg" />
          <span className="text-muted-foreground">
            +10 {pluralLabel || "moedas"} por desafio
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Nome da Recompensa *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Moedas, Estrelas, XP, Pontos..."
            required
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Ícone (emoji) *
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {EMOJI_SUGGESTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                  icon === emoji 
                    ? "border-gold bg-gold/10" 
                    : "border-border hover:border-gold/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Ou digite um emoji"
            maxLength={4}
          />
        </div>

        {/* Labels */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Singular (1 unidade)
            </label>
            <Input
              value={singularLabel}
              onChange={(e) => setSingularLabel(e.target.value)}
              placeholder="Ex: moeda, estrela, ponto"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Plural (várias unidades)
            </label>
            <Input
              value={pluralLabel}
              onChange={(e) => setPluralLabel(e.target.value)}
              placeholder="Ex: moedas, estrelas, pontos"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving} className="flex-1">
            <Save size={18} className="mr-2" />
            {isSaving ? "Salvando..." : "Salvar Configuração"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw size={18} className="mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </form>
    </div>
  );
}
