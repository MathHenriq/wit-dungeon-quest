import React, { useState } from 'react';
import { toast } from 'sonner';
import { GuildEmblem } from './GuildEmblem';
import { EMBLEM_SYMBOLS, EMBLEM_COLORS, type EmblemSymbol, type EmblemColor } from './guild-types';

interface GuildCreateProps {
  onBack:   () => void;
  onCreate: (name: string, description?: string, emblem?: string, emblemColor?: string) => Promise<void>;
}

const SYMBOL_LABELS: Record<EmblemSymbol, string> = {
  shield:    'Escudo',
  sword:     'Espada',
  crown:     'Coroa',
  dragon:    'Dragão',
  wolf:      'Lobo',
  phoenix:   'Fênix',
  star:      'Estrela',
  rune:      'Runa',
  axe:       'Machado',
  bow:       'Arco',
  fire:      'Fogo',
  lightning: 'Raio',
  skull:     'Crânio',
  eye:       'Olho',
  hammer:    'Martelo',
  chalice:   'Cálice',
};

export function GuildCreate({ onBack, onCreate }: GuildCreateProps) {
  const [name,       setName]       = useState('');
  const [desc,       setDesc]       = useState('');
  const [emblem,     setEmblem]     = useState<EmblemSymbol>('shield');
  const [color,      setColor]      = useState<EmblemColor>('#825ADB');
  const [loading,    setLoading]    = useState(false);

  const valid = name.trim().length >= 3;

  const handleCreate = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), desc.trim() || undefined, emblem, color);
      toast.success('Guilda criada com sucesso!');
    } catch {
      toast.error('Erro ao criar guilda');
      setLoading(false);
    }
  };

  return (
    <div className="guild-create guild-animate">
      <div className="guild-section-hdr">Criar Nova Guilda</div>

      {/* Preview */}
      <div className="guild-create__preview">
        <GuildEmblem symbol={emblem} color={color} size="lg" />
        <div className="guild-create__preview-name">
          {name.trim() || 'Nome da Guilda'}
        </div>
      </div>

      {/* Name */}
      <div className="guild-form-section">
        <label className="guild-form-label">Nome da Guilda</label>
        <input
          className="guild-form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Ordem do Dragão"
          maxLength={30}
        />
      </div>

      {/* Description */}
      <div className="guild-form-section">
        <label className="guild-form-label">Descrição (opcional)</label>
        <textarea
          className="guild-form-textarea"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Descreva o propósito da sua guilda..."
          maxLength={200}
          rows={3}
        />
      </div>

      {/* Emblem symbol picker */}
      <div className="guild-form-section">
        <label className="guild-form-label">Emblema</label>
        <div className="guild-emblem-picker">
          {EMBLEM_SYMBOLS.map(sym => (
            <button
              key={sym}
              className={`guild-emblem-picker__btn${emblem === sym ? ' guild-emblem-picker__btn--active' : ''}`}
              onClick={() => setEmblem(sym)}
              title={SYMBOL_LABELS[sym]}
              type="button"
            >
              <GuildEmblem
                symbol={sym}
                color={emblem === sym ? color : 'rgba(255,255,255,0.3)'}
                size="sm"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="guild-form-section">
        <label className="guild-form-label">Cor do Emblema</label>
        <div className="guild-color-picker">
          {EMBLEM_COLORS.map(c => (
            <button
              key={c}
              className={`guild-color-picker__dot${color === c ? ' guild-color-picker__dot--active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              type="button"
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="guild-form-row">
        <button className="guild-btn-secondary" onClick={onBack}>
          Cancelar
        </button>
        <button
          className="guild-btn-primary"
          style={{ flex: 1 }}
          disabled={!valid || loading}
          onClick={handleCreate}
        >
          {loading ? 'Criando...' : 'Criar Guilda'}
        </button>
      </div>
    </div>
  );
}
