import React, { useState } from 'react';
import { toast } from 'sonner';

interface GuildCreateProps {
  onBack: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export function GuildCreate({ onBack, onCreate }: GuildCreateProps) {
  const [name, setName]     = useState('');
  const [desc, setDesc]     = useState('');
  const [loading, setLoading] = useState(false);

  const valid = name.trim().length >= 3;

  const handleCreate = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), desc.trim() || undefined);
      toast.success('Guilda criada com sucesso!');
    } catch {
      toast.error('Erro ao criar guilda');
      setLoading(false);
    }
  };

  return (
    <div className="guild-create guild-animate">
      <div className="guild-section-hdr">Criar Nova Guilda</div>

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
