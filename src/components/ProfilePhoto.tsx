import { useState } from "react";
import { Camera, Link as LinkIcon, Save, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfilePhotoProps {
  studentId: string;
  currentPhotoUrl: string | null;
  onUpdate: () => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

export function ProfilePhoto({ 
  studentId, 
  currentPhotoUrl, 
  onUpdate, 
  size = "md",
  editable = false 
}: ProfilePhotoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 36,
  };

  const handleSave = async () => {
    const trimmed = photoUrl.trim();

    if (trimmed) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          toast.error("URL inválida", { description: "Use uma URL que comece com https://" });
          return;
        }
      } catch {
        toast.error("URL inválida", { description: "Insira uma URL de imagem válida." });
        return;
      }
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("students")
      .update({ profile_photo_url: trimmed || null })
      .eq("id", studentId);

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar foto", { description: error.message });
    } else {
      toast.success("Foto de perfil atualizada!", { icon: "📸" });
      setIsEditing(false);
      onUpdate();
    }
  };

  if (isEditing) {
    return (
      <div className="card-fantasy space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="text-gold" size={20} />
          <h4 className="font-display font-bold">Foto de Perfil</h4>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`${sizeClasses.lg} rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0`}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <User className="text-muted-foreground" size={iconSizes.lg} />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <LinkIcon size={16} />
              </div>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Cole a URL da sua foto..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use uma URL de imagem (ex: https://exemplo.com/foto.jpg)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setIsEditing(false);
              setPhotoUrl(currentPhotoUrl || "");
            }}
            className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-fantasy flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center overflow-hidden`}>
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.photo-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`photo-fallback flex items-center justify-center ${currentPhotoUrl ? 'hidden' : ''}`}>
          <User className="text-muted-foreground" size={iconSizes[size]} />
        </div>
      </div>
      
      {editable && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Alterar foto"
        >
          <Camera className="text-white" size={iconSizes[size] * 0.7} />
        </button>
      )}
    </div>
  );
}
