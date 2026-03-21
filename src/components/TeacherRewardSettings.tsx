import { useState, useEffect } from "react";
import { useTeacherReward } from "@/hooks/useTeacherReward";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TeacherRewardSettingsProps {
  teacherId: string;
}

const PRESETS = [
  { name: "Moedas",    icon: "🪙", singular: "moeda",    plural: "moedas"    },
  { name: "Estrelas",  icon: "⭐", singular: "estrela",  plural: "estrelas"  },
  { name: "Gemas",     icon: "💎", singular: "gema",     plural: "gemas"     },
  { name: "XP",        icon: "✨", singular: "XP",       plural: "XP"        },
  { name: "Pontos",    icon: "🔥", singular: "ponto",    plural: "pontos"    },
  { name: "Cristais",  icon: "🔮", singular: "cristal",  plural: "cristais"  },
  { name: "Troféus",   icon: "🏆", singular: "troféu",   plural: "troféus"   },
  { name: "Sementes",  icon: "🌱", singular: "semente",  plural: "sementes"  },
  { name: "Relâmpagos",icon: "⚡", singular: "relâmpago",plural: "relâmpagos"},
  { name: "Corações",  icon: "❤️", singular: "coração",  plural: "corações"  },
  { name: "Setas",     icon: "🏹", singular: "seta",     plural: "setas"     },
  { name: "Escudos",   icon: "🛡️", singular: "escudo",   plural: "escudos"   },
];

const EXTRA_ICONS = ["🎯","🎖️","🦁","🐉","🦋","🍀","🧿","🎪","🧩","🪄","🦄","🌙"];

export function TeacherRewardSettings({ teacherId }: TeacherRewardSettingsProps) {
  const { rewardConfig, isLoading, saveRewardConfig, DEFAULT_REWARD } = useTeacherReward(teacherId);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [singularLabel, setSingularLabel] = useState("");
  const [pluralLabel, setPluralLabel] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (rewardConfig) {
      setName(rewardConfig.name);
      setIcon(rewardConfig.icon);
      setSingularLabel(rewardConfig.unit_label_singular);
      setPluralLabel(rewardConfig.unit_label_plural);
      const matched = PRESETS.find(p => p.name === rewardConfig.name && p.icon === rewardConfig.icon);
      setActivePreset(matched ? matched.name : null);
    }
  }, [rewardConfig]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setSingularLabel(preset.singular);
    setPluralLabel(preset.plural);
    setCustomIcon("");
    setActivePreset(preset.name);
  };

  const handleCustomIcon = (val: string) => {
    setCustomIcon(val);
    setIcon(val);
    setActivePreset(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !icon.trim()) {
      toast.error("Preencha nome e ícone da recompensa");
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveRewardConfig({
        name: name.trim(),
        icon: icon.trim(),
        unit_label_singular: singularLabel.trim() || name.toLowerCase(),
        unit_label_plural: pluralLabel.trim() || `${name.toLowerCase()}s`,
      });
      if (result.error) {
        toast.error("Erro ao salvar", { description: result.error.message });
      } else {
        toast.success(`Recompensa "${name}" configurada! ${icon}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    applyPreset({ name: DEFAULT_REWARD.name, icon: DEFAULT_REWARD.icon, singular: DEFAULT_REWARD.unit_label_singular, plural: DEFAULT_REWARD.unit_label_plural });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* Live preview */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-dungeon-dark/5 border border-border">
        <div className="text-5xl">{icon || "🪙"}</div>
        <div>
          <p className="font-display font-bold text-lg">{name || "Moedas"}</p>
          <p className="text-muted-foreground text-sm">
            Alunos ganham <strong>10 {pluralLabel || "moedas"}</strong> por desafio aprovado
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xl">{icon || "🪙"}</span>
            <span className="font-bold text-gold-dark">250</span>
            <span className="text-xs text-muted-foreground ml-1">{pluralLabel || "moedas"} no saldo</span>
          </div>
        </div>
      </div>

      {/* Preset grid */}
      <div>
        <label className="block text-sm font-semibold mb-3">Escolha um tema</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                activePreset === preset.name
                  ? "border-gold bg-gold/10 shadow-md"
                  : "border-border hover:border-gold/40 bg-card/50"
              }`}
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-xs font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customization */}
      <div className="space-y-4 border-t border-border pt-4">
        <p className="text-sm font-semibold text-muted-foreground">Personalizar</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Nome da recompensa</label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value); setActivePreset(null); }}
              placeholder="Ex: Moedas, Estrelas, XP..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Ícone extra (emoji)</label>
            <div className="flex gap-2">
              <Input
                value={customIcon}
                onChange={e => handleCustomIcon(e.target.value)}
                placeholder="Digite um emoji"
                maxLength={4}
                className="w-28"
              />
              <div className="flex gap-1 flex-wrap">
                {EXTRA_ICONS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleCustomIcon(e)}
                    className={`w-8 h-8 text-lg rounded-lg border transition-all hover:scale-110 ${
                      icon === e && !activePreset ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Singular (1 unidade)</label>
            <Input
              value={singularLabel}
              onChange={e => setSingularLabel(e.target.value)}
              placeholder="Ex: moeda, estrela"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Plural (várias)</label>
            <Input
              value={pluralLabel}
              onChange={e => setPluralLabel(e.target.value)}
              placeholder="Ex: moedas, estrelas"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? <><Loader2 size={16} className="animate-spin mr-2" />Salvando...</> : <><Save size={16} className="mr-2" />Salvar</>}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw size={16} className="mr-2" />
          Padrão
        </Button>
      </div>
    </form>
  );
}
