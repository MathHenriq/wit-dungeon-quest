import { useState, useRef } from "react";
import { Camera, Link as LinkIcon, Upload, Save, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ProfilePhotoProps {
  studentId: string;
  currentPhotoUrl: string | null;
  onUpdate: () => void;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  /** Client used for file uploads (pass supabaseStudent for student-side edits) */
  uploadClient?: SupabaseClient;
}

export function ProfilePhoto({
  studentId,
  currentPhotoUrl,
  onUpdate,
  size = "md",
  editable = false,
  uploadClient,
}: ProfilePhotoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState<"url" | "upload">("upload");
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Locally applied URL — updated immediately after save so avatar reflects change
  // without waiting for parent re-render cycle
  const [appliedUrl, setAppliedUrl] = useState<string | null>(currentPhotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync prop → local display when parent refreshes student data
  const prevCurrentPhotoUrl = useRef(currentPhotoUrl);
  if (prevCurrentPhotoUrl.current !== currentPhotoUrl) {
    prevCurrentPhotoUrl.current = currentPhotoUrl;
    setAppliedUrl(currentPhotoUrl);
  }

  const client = uploadClient ?? supabase;

  const displayUrl = appliedUrl;

  const sizeClasses = { sm: "w-10 h-10", md: "w-16 h-16", lg: "w-24 h-24" };
  const iconSizes = { sm: 16, md: 24, lg: 36 };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo inválido", { description: "Selecione uma imagem." });
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${studentId}/${Date.now()}.${ext}`;

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite atingido. Verifique se o bucket 'profile-photos' foi criado no Supabase.")), 12000)
      );

      const { error: uploadErr } = await Promise.race([
        client.storage.from("profile-photos").upload(path, file, { upsert: true }),
        timeout,
      ]);

      if (uploadErr) {
        toast.error("Erro no upload", { description: uploadErr.message });
        return;
      }

      const { data } = client.storage.from("profile-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err) {
      toast.error("Erro no upload", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmed = photoUrl.trim();

    if (trimmed && tab === "url") {
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
    // Use uploadClient (supabaseStudent) when available so the student's JWT is sent;
    // fall back to teacher supabase for teacher-side edits
    const { data: updatedRows, error } = await client
      .from("students")
      .update({ profile_photo_url: trimmed || null })
      .eq("id", studentId)
      .select("id");
    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar foto", { description: error.message });
    } else if (!updatedRows || updatedRows.length === 0) {
      // RLS silently blocked the update (0 rows affected, no error)
      console.error("[ProfilePhoto] UPDATE retornou 0 linhas — possível bloqueio de RLS. studentId:", studentId);
      toast.error("Sem permissão para salvar", {
        description: "Não foi possível atualizar a foto. Verifique as políticas de segurança do Supabase (RLS).",
      });
    } else {
      toast.success("Foto de perfil atualizada!", { icon: "📸" });
      setAppliedUrl(trimmed || null); // update avatar immediately
      setIsEditing(false);
      onUpdate();
    }
  };

  const closeModal = () => {
    setIsEditing(false);
    setPhotoUrl(currentPhotoUrl || "");
  };

  return (
    <>
      {/* Edit modal — rendered as a portal-like overlay, independent of the avatar position */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeModal}
        >
          <div
            className="bg-background rounded-xl shadow-xl w-full max-w-sm space-y-4 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Camera className="text-gold" size={20} />
              <h4 className="font-display font-bold">Foto de Perfil</h4>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <User className="text-muted-foreground" size={36} />
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("upload")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === "upload" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                <Upload size={14} /> Enviar arquivo
              </button>
              <button
                type="button"
                onClick={() => setTab("url")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === "url" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                <LinkIcon size={14} /> URL
              </button>
            </div>

            {tab === "upload" ? (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {isUploading
                    ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    : <><Upload size={16} /> Clique para selecionar imagem</>}
                </button>
                {photoUrl && !isUploading && (
                  <p className="text-xs text-green-500 text-center">✓ Imagem carregada</p>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <LinkIcon size={16} />
                </div>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="Cole a URL da sua foto..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-border bg-background focus:border-gold outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading || !photoUrl.trim()}
                className="btn-fantasy flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center overflow-hidden`}>
          {displayUrl ? (
            <img
              key={displayUrl}
              src={displayUrl}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.parentElement?.querySelector(".photo-fallback");
                if (fallback) fallback.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`photo-fallback flex items-center justify-center ${displayUrl ? "hidden" : ""}`}>
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
    </>
  );
}
