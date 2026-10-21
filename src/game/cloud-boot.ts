// Entrada do aluno em /wit2: o jogo só abre depois de carregar do banco.
//  1. O navegador passa a ser deste aluno: se era de outro (ou de ninguém), as
//     chaves `wit.*` saem (nas máquinas da escola o progresso não passa de um
//     aluno para o outro; quem jogou antes desta versão começa do zero).
//  2. `wit2_load(p_session)`: assume a sessão (um computador por vez) e traz
//     tudo; o banco é a base do progresso, das chaves pequenas, da casa e das fotos.
//  3. Liga a sincronia (cloud.ts).
import { cloudLoadPhotos, fromServer, LOCAL_FIELD, newPacks, rpc, schedulePush, startSync, writeLocal, type ServerSnapshot } from './cloud';
import { fixCoins, loadProgress, newProgress, sanitizeProgress, storeProgress, type Progress } from './progress';
import { sanitizePhotos } from './photos';
import { reloadMuted } from './sfx';
import { dropStoryCache } from './story/runtime';

/** Dono do navegador (fica só aqui: não vai para o banco). */
export const OWNER_KEY = 'wit.dono';
const HOUSE_KEY = 'wit.casa';
const PHOTOS_KEY = 'wit.fotos';

/** Marca o navegador como deste aluno; se era de outro, apaga as chaves `wit.*`. Devolve se apagou. */
export function claimBrowser(studentId: string, st: Storage = localStorage): boolean {
  if (st.getItem(OWNER_KEY) === studentId) return false;
  const old: string[] = [];
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k && k.startsWith('wit.')) old.push(k); }
  for (const k of old) st.removeItem(k);
  st.setItem(OWNER_KEY, studentId);
  return true;
}

let news: [string, number][] = [];
/** Pacotes que chegaram de fora desde a última vez (o jogo avisa uma vez por entrada). */
export function takeBootNews(): [string, number][] {
  const n = news;
  news = [];
  return n;
}

const newSession = (): string => {
  try { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID(); } catch { /* sem crypto */ }
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${h()}${h()}-${h()}-4${h().slice(1)}-a${h().slice(1)}-${h()}${h()}${h()}`;
};

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => new Promise((ok, fail) => {
  const t = window.setTimeout(() => fail(new Error('o banco demorou para responder')), ms);
  p.then(v => { window.clearTimeout(t); ok(v); }, e => { window.clearTimeout(t); fail(e); });
});

let booting: { id: string; p: Promise<Progress> } | null = null;
/** Carrega o aluno do banco e liga a sincronia. Lança erro se o banco não responder. */
export function bootCloud(studentId: string): Promise<Progress> {
  // duas chamadas juntas (ou a volta para o /wit2 na mesma aba) não abrem duas sessões
  if (booting?.id === studentId) return booting.p;
  const p = boot(studentId);
  booting = { id: studentId, p };
  p.catch(() => { if (booting?.p === p) booting = null; });
  return p;
}

async function boot(studentId: string): Promise<Progress> {
  claimBrowser(studentId);
  const session = newSession();
  const s = await withTimeout(rpc<ServerSnapshot>('wit2_load', { p_session: session }), 20000);
  const progress = sanitizeProgress(fromServer(newProgress(), s));
  writeLocal(s.data?.[LOCAL_FIELD]);
  try {
    if (s.house) localStorage.setItem(HOUSE_KEY, JSON.stringify(s.house)); else localStorage.removeItem(HOUSE_KEY);
  } catch { /* sem armazenamento */ }
  storeProgress(progress);
  // módulos que guardam a chave na memória leem de novo
  reloadMuted();
  dropStoryCache();
  startSync({ session, version: s.version, coins: s.coins, current: loadProgress, fix: fixCoins });
  // pacotes novos: avisa no jogo e já manda que foram vistos (não avisa de novo em outro computador)
  news = newPacks(s);
  if (news.length) schedulePush();
  // o álbum (pesa mais) chega depois, sem segurar a entrada
  void cloudLoadPhotos().then(list => {
    if (!list) return;
    try {
      const photos = sanitizePhotos(list);
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
      window.dispatchEvent(new CustomEvent('wit-fotos', { detail: photos }));
    } catch { /* sem armazenamento */ }
  });
  return progress;
}
