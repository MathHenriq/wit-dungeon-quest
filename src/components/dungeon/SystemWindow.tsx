// Janela do SISTEMA (Solo Leveling): painel azul translúcido com borda que
// brilha, cabeçalho [SISTEMA] e letra pixel. Usada na masmorra e na Associação.
import type { ReactNode } from 'react';
import './dungeon.css';

export function SystemWindow({ title, sub, danger, onClose, wide, children }: { title: string; sub?: string; danger?: boolean; onClose?: () => void; wide?: boolean; children?: ReactNode }) {
  return (
    <div className={`sys-win ${danger ? 'danger' : ''} ${wide ? 'wide' : ''}`} onPointerDown={e => e.stopPropagation()}>
      <div className="sys-head"><span className="sys-tag">[SISTEMA]</span>{onClose && <button className="sys-x" onClick={onClose} aria-label="Fechar">X</button>}</div>
      <div className="sys-title">{title}</div>
      {sub && <div className="sys-sub">{sub}</div>}
      <div className="sys-body">{children}</div>
    </div>
  );
}
