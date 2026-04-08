/**
 * SpriteUpload — lets the student upload front/back battle sprites
 * for their character. Saves URLs to the `characters` table.
 */

import { useState, useRef } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SpriteSlot {
  key:   'sprite_pixel_front' | 'sprite_pixel_back' | 'sprite_pixel_attack';
  label: string;
  hint:  string;
  flip?: boolean;  // mirror the preview (back sprite shown mirrored like in battle)
}

const SLOTS: SpriteSlot[] = [
  {
    key:   'sprite_pixel_front',
    label: 'Frente',
    hint:  'Sprite de frente — usado na visão do inimigo',
  },
  {
    key:   'sprite_pixel_back',
    label: 'Costas',
    hint:  'Sprite de costas — usado em batalha',
    flip:  true,
  },
  {
    key:   'sprite_pixel_attack',
    label: 'Ataque',
    hint:  'Sprite de ataque — animado ao usar habilidade',
    flip:  true,
  },
];

interface SpriteUploadProps {
  characterId: string;
  studentId:   string;
  initialUrls: {
    sprite_pixel_front?:  string | null;
    sprite_pixel_back?:   string | null;
    sprite_pixel_attack?: string | null;
  };
  onUpdate?: () => void;
}

export function SpriteUpload({ characterId, studentId, initialUrls, onUpdate }: SpriteUploadProps) {
  const [urls, setUrls] = useState({
    sprite_pixel_front:  initialUrls.sprite_pixel_front  ?? '',
    sprite_pixel_back:   initialUrls.sprite_pixel_back   ?? '',
    sprite_pixel_attack: initialUrls.sprite_pixel_attack ?? '',
  });
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadSprite = async (slot: SpriteSlot, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem (PNG, JPG, WebP, GIF).' });
      return;
    }

    setUploading(prev => ({ ...prev, [slot.key]: true }));
    try {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `sprites/${studentId}/${slot.key}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabaseStudent.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        toast.error('Erro no upload', { description: uploadErr.message });
        return;
      }

      const { data } = supabaseStudent.storage.from('profile-photos').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // Save to characters table
      const { error: dbErr } = await supabaseStudent
        .from('characters')
        .update({ [slot.key]: publicUrl })
        .eq('id', characterId);

      if (dbErr) {
        toast.error('Erro ao salvar sprite', { description: dbErr.message });
        return;
      }

      setUrls(prev => ({ ...prev, [slot.key]: publicUrl }));
      toast.success(`Sprite de ${slot.label} salvo!`, { icon: '🎨' });
      onUpdate?.();
    } catch (err) {
      toast.error('Erro no upload', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setUploading(prev => ({ ...prev, [slot.key]: false }));
    }
  };

  const clearSprite = async (slot: SpriteSlot) => {
    const { error } = await supabaseStudent
      .from('characters')
      .update({ [slot.key]: null })
      .eq('id', characterId);

    if (error) {
      toast.error('Erro ao remover sprite', { description: error.message });
      return;
    }

    setUrls(prev => ({ ...prev, [slot.key]: '' }));
    toast.success(`Sprite de ${slot.label} removido.`);
    onUpdate?.();
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Faça upload das imagens do seu personagem para batalha. Recomendado: PNG transparente, 128×128px ou maior.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {SLOTS.map(slot => {
          const url      = urls[slot.key];
          const isLoading = !!uploading[slot.key];

          return (
            <div key={slot.key} className="flex flex-col gap-2">
              {/* Label */}
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(0,229,255,0.8)', textTransform: 'uppercase' }}>
                {slot.label}
              </span>

              {/* Preview box */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  background: 'rgba(0,0,0,0.35)',
                  border: url ? '2px solid rgba(0,229,255,0.4)' : '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: isLoading ? 'wait' : 'pointer',
                }}
                onClick={() => !isLoading && fileInputRefs.current[slot.key]?.click()}
              >
                {isLoading ? (
                  <Loader2 size={28} style={{ color: 'rgba(0,229,255,0.6)', animation: 'spin 1s linear infinite' }} />
                ) : url ? (
                  <img
                    src={url}
                    alt={slot.label}
                    style={{
                      width: '85%',
                      height: '85%',
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                      transform: slot.flip ? 'scaleX(-1)' : undefined,
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                    <ImageIcon size={28} style={{ margin: '0 auto 4px' }} />
                    <span style={{ fontSize: '0.6rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>UPLOAD</span>
                  </div>
                )}

                {/* Upload icon overlay */}
                {!isLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,229,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                    className="sprite-hover-overlay"
                  >
                    <Upload size={20} style={{ color: '#67e8f9' }} />
                  </div>
                )}
              </div>

              {/* Remove button */}
              {url && !isLoading && (
                <button
                  onClick={() => clearSprite(slot)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 4,
                    color: 'rgba(239,68,68,0.7)',
                    padding: '3px 0',
                    cursor: 'pointer',
                    fontSize: '0.65rem',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 600,
                    letterSpacing: 1,
                    width: '100%',
                    transition: 'background 0.15s',
                  }}
                >
                  <X size={10} /> REMOVER
                </button>
              )}

              {/* Hint */}
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1.4 }}>
                {slot.hint}
              </span>

              {/* Hidden file input */}
              <input
                ref={el => { fileInputRefs.current[slot.key] = el; }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadSprite(slot, file);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        .sprite-hover-overlay { opacity: 0 !important; }
        div:hover > .sprite-hover-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
