import { useState } from "react";
import { Sword, Shield, Sparkles } from "lucide-react";

interface LoginFormProps {
  onSubmit: (data: { name: string; className: string; characterName: string }) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [characterName, setCharacterName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && className.trim()) {
      onSubmit({
        name: name.trim(),
        className: className.trim(),
        characterName: characterName.trim(),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dungeon-dark mb-4">
            <div className="flex items-center gap-1">
              <Sword className="text-gold" size={28} />
              <Shield className="text-gold" size={28} />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-dungeon-dark mb-2">
            WIT Dungeon
          </h1>
          <p className="text-muted-foreground">
            Entre na masmorra do conhecimento!
          </p>
        </div>

        {/* Form Card */}
        <div className="card-fantasy">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Seu Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome"
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Turma *
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ex: 7A, 8B, 9C"
                required
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nome do Personagem
                <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Escolha um nome épico!"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all pr-10"
                />
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-gold" size={20} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-fantasy w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              <Sword size={20} />
              Entrar na Dungeon
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ⚔️ Sistema de gamificação educacional ⚔️
        </p>
      </div>
    </div>
  );
}
