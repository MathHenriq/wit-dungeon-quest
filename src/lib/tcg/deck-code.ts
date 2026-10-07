// Código do deck (PvP assíncrono, plano §12 fase 12): o aluno copia o código
// do deck dele e o colega cola na mesa livre da Arena; a IA joga com aquele
// deck exato. Funciona sem servidor (o código carrega o deck); quando o banco
// ligar, o mesmo duelo pode pegar o deck salvo do colega.
//
// Formato: "WIT1-" + base64url de "apelido|id1,id2,...|soma", onde a soma é
// uma conferência simples para pegar código digitado errado.
import type { CardDef } from './types';
import { CARD_BY_ID } from './cards/catalog';

export const DECK_CODE_PREFIX = 'WIT1-';

const sum = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 65521; return h.toString(36); };
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodeDeck(nick: string, ids: string[]): string {
  const body = `${nick.replace(/\|/g, ' ').slice(0, 20)}|${ids.join(',')}`;
  return DECK_CODE_PREFIX + b64(`${body}|${sum(body)}`);
}

export type DecodedDeck = { ok: true; nick: string; cards: CardDef[] } | { ok: false; reason: string };

export function decodeDeck(code: string): DecodedDeck {
  const c = code.trim();
  if (!c.startsWith(DECK_CODE_PREFIX)) return { ok: false, reason: 'Código não é de deck do WIT.' };
  let raw: string;
  try { raw = unb64(c.slice(DECK_CODE_PREFIX.length)); } catch { return { ok: false, reason: 'Código quebrado: copie de novo.' }; }
  const parts = raw.split('|');
  if (parts.length !== 3) return { ok: false, reason: 'Código quebrado: copie de novo.' };
  const [nick, list, check] = parts;
  if (sum(`${nick}|${list}`) !== check) return { ok: false, reason: 'Código com erro de digitação.' };
  const ids = list.split(',').filter(Boolean);
  const cards = ids.map(id => CARD_BY_ID.get(id)).filter((x): x is CardDef => !!x);
  if (cards.length !== ids.length) return { ok: false, reason: 'O deck tem carta que não existe mais.' };
  if (cards.length < 20) return { ok: false, reason: 'Deck incompleto (precisa de 20 cartas).' };
  return { ok: true, nick: nick || 'Colega', cards };
}
