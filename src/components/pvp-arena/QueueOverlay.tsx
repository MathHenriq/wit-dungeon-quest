import React, { useEffect, useState } from 'react';

interface QueueOverlayProps {
  onCancel: () => void;
}

export function QueueOverlay({ onCancel }: QueueOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="queue-overlay">
      <div className="queue-spinner" />
      <div className="queue-overlay-title">Buscando Oponente</div>
      <div className="queue-overlay-sub">{mm}:{ss} em fila</div>
      <button className="queue-cancel-btn" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}
