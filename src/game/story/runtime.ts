// A história no navegador: lê e grava `wit.historia`, chama o motor e avisa as
// telas (evento `wit-historia`) para o rastreador e os marcadores mudarem.
// As telas (cidade, salas) só chamam estas funções; a regra fica no motor.
import { loadFarm } from '../farm';
import {
  chegar, escolher, falar, falasExtra, marcas, neblina, newStory, novoDia, objetivo, pegar, porta, responder,
  sanitizeStory, tick, visivel, atual, type Ctx, type Historia, type Res,
} from './engine';
import { CAPITULOS, LINHA, REGRAS_FALA, REGRAS_VISIVEL } from './chapters';

const KEY = 'wit.historia';
export const STORY_EVENT = 'wit-historia';

let cache: Historia | null = null;

export function loadStory(): Historia {
  if (cache) return cache;
  try { cache = sanitizeStory(JSON.parse(localStorage.getItem(KEY) ?? 'null'), LINHA.length); }
  catch { cache = newStory(); }
  return cache;
}

export function saveStory(h: Historia): void {
  cache = h;
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch { /* sem armazenamento */ }
  try { window.dispatchEvent(new Event(STORY_EVENT)); } catch { /* fora do navegador */ }
}

/** ?historia=cap3 começa naquele capítulo (prints e testes); ?historia=zero recomeça. */
export function storyFromQuery(): void {
  try {
    const q = new URLSearchParams(window.location.search).get('historia');
    if (!q) return;
    if (q === 'zero') { saveStory(newStory()); return; }
    const cap = CAPITULOS.find(c => c.id === q);
    const passo = cap ? cap.passos[0].id : q;
    const pos = LINHA.findIndex(l => l.passo.id === passo);
    if (pos < 0) return;
    // as pistas dos passos anteriores vêm junto (como se tivesse jogado)
    const pistas = LINHA.slice(0, pos).flatMap(l => l.passo.pistas ?? []);
    const marcas = Object.fromEntries(LINHA.slice(0, pos).filter(l => l.passo.marca).map(l => [l.passo.marca!, 0]));
    saveStory({ ...newStory(), pos, pistas, marcas });
  } catch { /* fora do navegador */ }
}

const dia = () => { try { return loadFarm().day; } catch { return 1; } };
export const storyCtx = (zona: string, hour: number, day?: number): Ctx => ({ zona, hour, dia: day ?? dia() });

function apply(r: Res): Res {
  if (r.h !== loadStory()) saveStory(r.h);
  return r;
}

export const storyTalk = (quem: string, ctx: Ctx) => apply(falar(loadStory(), LINHA, quem, ctx));
export const storyChoose = (i: number, ctx: Ctx) => apply(escolher(loadStory(), LINHA, i, ctx));
export const storyAnswer = (i: number, ctx: Ctx) => apply(responder(loadStory(), LINHA, i, ctx));
export const storyDoor = (predio: string, ctx: Ctx) => apply(porta(loadStory(), LINHA, predio, ctx));
export const storyArrive = (ctx: Ctx, tx: number, ty: number) => apply(chegar(loadStory(), LINHA, ctx, tx, ty));
export const storySpot = (ctx: Ctx, tx: number, ty: number) => apply(pegar(loadStory(), LINHA, ctx, tx, ty));
export const storyTick = (ctx: Ctx, ms: number) => {
  const r = tick(loadStory(), LINHA, ctx, ms);
  // o tempo de espera muda a cada quadro: grava sem avisar as telas (só quando o passo termina)
  if (r.h !== loadStory()) { if (r.avancou) saveStory(r.h); else cache = r.h; }
  return r;
};
export const storyNewDay = () => { const h = loadStory(), n = novoDia(h); if (n !== h) saveStory(n); };

/** Fala do morador fora de um passo (null = a fala normal dele). */
export const storyExtra = (quem: string) => falasExtra(loadStory(), LINHA, REGRAS_FALA, quem);
export const storyVisible = (quem: string, ctx: Ctx) => visivel(loadStory(), LINHA, REGRAS_VISIVEL, quem, ctx);
export const storyMarks = (zona: string) => marcas(loadStory(), LINHA, zona);
export const storyFog = (ctx: Ctx) => neblina(loadStory(), LINHA, ctx);
export const storyGoal = () => objetivo(loadStory(), LINHA);
export const storyNow = () => atual(loadStory(), LINHA);

/** Esconde o rastreador até o dia seguinte da fazenda. */
export function hideStoryToday(): void {
  const h = loadStory();
  saveStory({ ...h, escondeAte: dia() });
}
export const storyHidden = () => { const h = loadStory(); return h.escondeAte !== undefined && h.escondeAte >= dia(); };
