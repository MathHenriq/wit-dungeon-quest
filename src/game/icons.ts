// Ícones pixel art (nada de emoji): public/game/icons/itens/<id>.png (32×32) e
// os símbolos das cartas em public/game/icons/simbolos/<id>.svg. Créditos em
// public/game/icons/CREDITOS.md; o GPT pode trocar qualquer um pelo mesmo nome.
const BASE = import.meta.env.BASE_URL;

export const iconUrl = (id: string) => `${BASE}game/icons/itens/${id.replace(':', '_')}.png`;
export const symbolUrl = (id: string) => `${BASE}game/icons/simbolos/${id}.svg`;
