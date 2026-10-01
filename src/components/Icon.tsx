import { iconUrl, symbolUrl } from '@/game/icons';

/** Ícone pixel art do jogo (itens, moeda, fome...). `size` em px na tela. */
export function Icon({ id, size = 16, className = '', title }: { id: string; size?: number; className?: string; title?: string }) {
  return (
    <img src={iconUrl(id)} alt={title ?? ''} title={title} width={size} height={size} draggable={false}
      className={`inline-block align-middle [image-rendering:pixelated] ${className}`} style={{ width: size, height: size }} />
  );
}

/** Símbolo das cartas (elemento ou tipo), branco: a cor vem do fundo. */
export function Symbol({ id, size = 14, className = '' }: { id: string; size?: number; className?: string }) {
  return <img src={symbolUrl(id)} alt="" width={size} height={size} draggable={false} className={`inline-block align-middle ${className}`} style={{ width: size, height: size }} />;
}
