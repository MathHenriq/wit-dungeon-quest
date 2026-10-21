// História "Cartas Marcadas" (docs/historia.md): o motor. Funções puras: o
// jogo diz o que o aluno fez (falou com alguém, entrou numa porta, pisou num
// lugar, apertou ESPAÇO num bloco, ficou um tempo numa sala, respondeu o
// Caderno) e o motor devolve o estado novo e as falas. Os capítulos (dados)
// ficam em chapters.ts; ler e gravar no navegador, em runtime.ts.

/** Área do mundo (`cidade`, `lago`, `fazenda`, `wit`) ou sala (`sala:oficina`). `*` = qualquer área ao ar livre. */
export type Zona = string;

export interface Ctx {
  zona: Zona;
  /** Hora do relógio do jogo (0–24). */
  hour: number;
  /** Dia da fazenda (vira às 6h). */
  dia: number;
}

export const isNight = (h: number) => h >= 19 || h < 5;
export const isMorning = (h: number) => h >= 5 && h < 10;
const outdoor = (z: Zona) => !z.startsWith('sala:');

export interface Cond {
  noite?: boolean;
  /** Manhã de neblina no Lago (5h às 10h): a neblina aparece só quando o passo pede. */
  neblina?: boolean;
  /** Só de dia (fora da noite). */
  dia?: boolean;
  /** Só depois do dia guardado nesta marca (ex.: "no dia seguinte"). */
  depoisDe?: string;
}

interface Base {
  id: string;
  /** A linha do rastreador no alto da tela. */
  objetivo: string;
  /** Onde (aparece entre parênteses). */
  onde: string;
  quando?: Cond;
  /** O que aparece se o aluno chega antes da hora certa. */
  antes?: string[];
  /** Pistas que o passo dá ao terminar. */
  pistas?: string[];
  /** Marca guardada ao terminar (com o dia da fazenda). */
  marca?: string;
  /** Quanto o Alerta da Ordem sobe ao terminar. */
  alerta?: number;
  /** Dica a mais no Caderno. */
  dica?: string;
}

export type Passo = Base & (
  | { tipo: 'falar'; quem: string; falas: string[] }
  | { tipo: 'varios'; quem: string[]; precisa: number; falas: Record<string, string[]>; fim?: string[] }
  | { tipo: 'porta'; zona: Zona; predio: string; falas: string[] }
  | { tipo: 'lugar'; zona: Zona; area?: [number, number, number, number]; falas: string[] }
  | { tipo: 'pegar'; zona: Zona; tx: number; ty: number; falas: string[] }
  | { tipo: 'esperar'; zona: Zona; segundos: number; falas: string[] }
  | { tipo: 'pergunta'; pergunta: string; opcoes: string[]; certa: number; falas: string[]; erro: string }
  | { tipo: 'escolha'; quem: string; pergunta: string[]; opcoes: { texto: string; marca: string; falas: string[] }[] }
);

export interface Capitulo {
  id: string;
  ato: number;
  /** 0 = Prólogo. */
  num: number;
  titulo: string;
  /** O que o aluno descobriu (aparece no Caderno quando o capítulo acaba). */
  resumo: string;
  passos: Passo[];
}

export interface Historia {
  v: 1;
  /** Índice do passo atual na lista de todos os passos (= total quando acabou o que existe). */
  pos: number;
  /** Quem já falou no passo de "vários". */
  feitos: string[];
  pistas: string[];
  /** Marcas com o dia da fazenda em que aconteceram. */
  marcas: Record<string, number>;
  /** Alerta da Ordem, 0 a 5. */
  alerta: number;
  /** Tempo já esperado no passo de esperar (ms). */
  espera: number;
  /** Escondeu o rastreador até este dia da fazenda. */
  escondeAte?: number;
  /** Respostas erradas no Caderno (só para o professor ver). */
  erros: number;
}

export const ALERTA_MAX = 5;

export function newStory(): Historia {
  return { v: 1, pos: 0, feitos: [], pistas: [], marcas: {}, alerta: 0, espera: 0, erros: 0 };
}

// ─── os passos em ordem ───────────────────────────────────────────────────────

export interface Linha { cap: Capitulo; passo: Passo; i: number }

export function linhaDe(caps: Capitulo[]): Linha[] {
  const out: Linha[] = [];
  for (const cap of caps) for (const passo of cap.passos) out.push({ cap, passo, i: out.length });
  return out;
}

/** Posição de um passo pelo id (para regras "de tal passo em diante"). */
export function posOf(linha: Linha[], id: string): number {
  const i = linha.findIndex(l => l.passo.id === id);
  if (i < 0) throw new Error(`passo desconhecido: ${id}`);
  return i;
}

export const atual = (h: Historia, linha: Linha[]): Linha | null => linha[h.pos] ?? null;

function condOk(c: Cond | undefined, h: Historia, ctx: Ctx): boolean {
  if (!c) return true;
  if (c.noite && !isNight(ctx.hour)) return false;
  if (c.dia && isNight(ctx.hour)) return false;
  if (c.neblina && !(ctx.zona === 'lago' && isMorning(ctx.hour))) return false;
  if (c.depoisDe && !(h.marcas[c.depoisDe] !== undefined && ctx.dia > h.marcas[c.depoisDe])) return false;
  return true;
}

function avancar(h: Historia, p: Passo, ctx: Ctx): Historia {
  const pistas = [...h.pistas];
  for (const k of p.pistas ?? []) if (!pistas.includes(k)) pistas.push(k);
  const marcas = p.marca ? { ...h.marcas, [p.marca]: ctx.dia } : h.marcas;
  const alerta = Math.min(ALERTA_MAX, h.alerta + (p.alerta ?? 0));
  return { ...h, pos: h.pos + 1, feitos: [], espera: 0, pistas, marcas, alerta };
}

/** Resultado de uma ação: o estado novo (igual ao velho se nada mudou) e as falas (null = a história não tem nada a dizer). */
export interface Res {
  h: Historia;
  falas: string[] | null;
  /** O passo terminou agora. */
  avancou?: boolean;
  /** Abrir a escolha (passo de escolha). */
  escolha?: { pergunta: string[]; opcoes: string[] };
}

const nada = (h: Historia): Res => ({ h, falas: null });

/** O aluno falou com alguém (`quem` = id do morador da cidade ou `sala.id` do morador da sala). */
export function falar(h: Historia, linha: Linha[], quem: string, ctx: Ctx): Res {
  const l = atual(h, linha);
  if (!l) return nada(h);
  const p = l.passo;
  if (p.tipo === 'falar' && p.quem === quem) {
    if (!condOk(p.quando, h, ctx)) return { h, falas: p.antes ?? null };
    return { h: avancar(h, p, ctx), falas: p.falas, avancou: true };
  }
  if (p.tipo === 'varios' && p.quem.includes(quem)) {
    const falas = p.falas[quem] ?? null;
    if (h.feitos.includes(quem)) return { h, falas };
    const feitos = [...h.feitos, quem];
    if (feitos.length >= p.precisa) return { h: avancar(h, p, ctx), falas: [...(falas ?? []), ...(p.fim ?? [])], avancou: true };
    return { h: { ...h, feitos }, falas };
  }
  if (p.tipo === 'escolha' && p.quem === quem) {
    if (!condOk(p.quando, h, ctx)) return { h, falas: p.antes ?? null };
    return { h, falas: null, escolha: { pergunta: p.pergunta, opcoes: p.opcoes.map(o => o.texto) } };
  }
  return nada(h);
}

/** Escolheu a opção `i` do passo de escolha. */
export function escolher(h: Historia, linha: Linha[], i: number, ctx: Ctx): Res {
  const l = atual(h, linha);
  if (!l || l.passo.tipo !== 'escolha') return nada(h);
  const o = l.passo.opcoes[i];
  if (!o) return nada(h);
  const next = avancar(h, l.passo, ctx);
  return { h: { ...next, marcas: { ...next.marcas, [o.marca]: ctx.dia } }, falas: o.falas, avancou: true };
}

/** Respondeu a pergunta do Caderno. */
export function responder(h: Historia, linha: Linha[], i: number, ctx: Ctx): Res {
  const l = atual(h, linha);
  if (!l || l.passo.tipo !== 'pergunta') return nada(h);
  if (i !== l.passo.certa) return { h: { ...h, erros: h.erros + 1 }, falas: [l.passo.erro] };
  return { h: avancar(h, l.passo, ctx), falas: l.passo.falas, avancou: true };
}

/** Entrou (ou tentou entrar) pela porta de um prédio. Falas não nulas = a história segura o aluno do lado de fora. */
export function porta(h: Historia, linha: Linha[], predio: string, ctx: Ctx): Res {
  const l = atual(h, linha);
  if (!l || l.passo.tipo !== 'porta' || l.passo.predio !== predio || l.passo.zona !== ctx.zona) return nada(h);
  if (!condOk(l.passo.quando, h, ctx)) return { h, falas: l.passo.antes ?? null };
  return { h: avancar(h, l.passo, ctx), falas: l.passo.falas, avancou: true };
}

const zonaBate = (want: Zona, ctx: Ctx) => want === ctx.zona || (want === '*' && outdoor(ctx.zona));

/** Chegou num bloco (a cada passo do boneco). */
export function chegar(h: Historia, linha: Linha[], ctx: Ctx, tx: number, ty: number): Res {
  const l = atual(h, linha);
  if (!l || l.passo.tipo !== 'lugar' || !zonaBate(l.passo.zona, ctx)) return nada(h);
  const a = l.passo.area;
  if (a && !(tx >= a[0] && tx <= a[2] && ty >= a[1] && ty <= a[3])) return nada(h);
  if (!condOk(l.passo.quando, h, ctx)) return nada(h);
  return { h: avancar(h, l.passo, ctx), falas: l.passo.falas, avancou: true };
}

/** Apertou ESPAÇO de frente para (ou em cima de) um bloco. */
export function pegar(h: Historia, linha: Linha[], ctx: Ctx, tx: number, ty: number): Res {
  const l = atual(h, linha);
  if (!l || l.passo.tipo !== 'pegar' || l.passo.zona !== ctx.zona || l.passo.tx !== tx || l.passo.ty !== ty) return nada(h);
  if (!condOk(l.passo.quando, h, ctx)) return { h, falas: l.passo.antes ?? null };
  return { h: avancar(h, l.passo, ctx), falas: l.passo.falas, avancou: true };
}

/**
 * O tempo passou (`ms` de jogo de verdade): conta o passo de esperar e cumpre
 * os passos de "lugar" sem área (ex.: estar ao ar livre à noite).
 */
export function tick(h: Historia, linha: Linha[], ctx: Ctx, ms: number): Res {
  const l = atual(h, linha);
  if (!l) return nada(h);
  const p = l.passo;
  if (p.tipo === 'lugar' && !p.area && zonaBate(p.zona, ctx) && condOk(p.quando, h, ctx)) {
    return { h: avancar(h, p, ctx), falas: p.falas, avancou: true };
  }
  if (p.tipo === 'esperar' && p.zona === ctx.zona && condOk(p.quando, h, ctx)) {
    const espera = h.espera + ms;
    if (espera >= p.segundos * 1000) return { h: avancar(h, p, ctx), falas: p.falas, avancou: true };
    return { h: { ...h, espera }, falas: null };
  }
  return nada(h);
}

/** O dia da fazenda virou: o Alerta da Ordem baixa 1 (agir normal acalma a Ordem). */
export function novoDia(h: Historia): Historia {
  return h.alerta > 0 ? { ...h, alerta: h.alerta - 1 } : h;
}

// ─── o que o jogo desenha ─────────────────────────────────────────────────────

/** Quem ganha "!" e quais blocos brilham nesta área agora. */
export function marcas(h: Historia, linha: Linha[], zona: Zona): { quem: string[]; blocos: [number, number][]; portas: string[] } {
  const l = atual(h, linha);
  const out = { quem: [] as string[], blocos: [] as [number, number][], portas: [] as string[] };
  if (!l) return out;
  const p = l.passo;
  if (p.tipo === 'falar' || p.tipo === 'escolha') out.quem.push(p.quem);
  if (p.tipo === 'varios') out.quem.push(...p.quem.filter(q => !h.feitos.includes(q)));
  if (p.tipo === 'pegar' && p.zona === zona) out.blocos.push([p.tx, p.ty]);
  if (p.tipo === 'lugar' && p.zona === zona && p.area) out.blocos.push([Math.round((p.area[0] + p.area[2]) / 2), Math.round((p.area[1] + p.area[3]) / 2)]);
  if (p.tipo === 'porta' && p.zona === zona) out.portas.push(p.predio);
  return out;
}

/** A linha do rastreador. */
export function objetivo(h: Historia, linha: Linha[]): { cap: string; texto: string; onde: string; conta?: string } | null {
  const l = atual(h, linha);
  if (!l) return null;
  const p = l.passo;
  const cap = l.cap.num === 0 ? 'Prólogo' : `Cap. ${l.cap.num}`;
  const conta = p.tipo === 'varios' ? `${h.feitos.length}/${p.precisa}` : p.tipo === 'esperar' && h.espera > 0 ? `${Math.min(99, Math.floor((h.espera / (p.segundos * 1000)) * 100))}%` : undefined;
  return { cap, texto: p.objetivo, onde: p.onde, conta };
}

/** A neblina do Lago aparece quando a história pede (passo com `neblina`) e é de manhã no Lago. */
export function neblina(h: Historia, linha: Linha[], ctx: Ctx): boolean {
  const l = atual(h, linha);
  return !!l?.passo.quando?.neblina && ctx.zona === 'lago' && isMorning(ctx.hour);
}

// ─── quem aparece e o que diz fora dos passos ─────────────────────────────────

export interface Regra {
  quem: string;
  /** Do passo `de` (inclusive) até antes do passo `ate`. */
  de?: string;
  ate?: string;
  /** Só com esta marca (ou sem ela, com `!`). */
  marca?: string;
  falas: string[];
}

export interface Visivel {
  quem: string;
  /** Aparece só do passo `de` até antes do `ate` (sem nenhum dos dois: sempre). */
  de?: string;
  ate?: string;
  /** Só quando o passo atual é com ele e a condição dele bate. */
  soNoPasso?: boolean;
}

function dentro(h: Historia, linha: Linha[], de?: string, ate?: string): boolean {
  if (de && h.pos < posOf(linha, de)) return false;
  if (ate && h.pos >= posOf(linha, ate)) return false;
  return true;
}

/** Falas do morador fora de um passo (a última regra que vale ganha). */
export function falasExtra(h: Historia, linha: Linha[], regras: Regra[], quem: string): string[] | null {
  let out: string[] | null = null;
  for (const r of regras) {
    if (r.quem !== quem || !dentro(h, linha, r.de, r.ate)) continue;
    if (r.marca) {
      const neg = r.marca.startsWith('!'), k = neg ? r.marca.slice(1) : r.marca;
      if ((h.marcas[k] !== undefined) === neg) continue;
    }
    out = r.falas;
  }
  return out;
}

/** O morador aparece no mapa agora? (Quem não tem regra, sempre aparece.) */
export function visivel(h: Historia, linha: Linha[], regras: Visivel[], quem: string, ctx: Ctx): boolean {
  const rs = regras.filter(r => r.quem === quem);
  if (!rs.length) return true;
  return rs.some(r => {
    if (!dentro(h, linha, r.de, r.ate)) return false;
    if (!r.soNoPasso) return true;
    const l = atual(h, linha);
    if (!l) return false;
    const p = l.passo;
    const comEle = (p.tipo === 'falar' || p.tipo === 'escolha') ? p.quem === quem : p.tipo === 'varios' && p.quem.includes(quem);
    return comEle && condOk(p.quando, h, ctx);
  });
}

/** Lê o que veio do navegador; descarta o que não faz sentido. */
export function sanitizeStory(raw: unknown, total: number): Historia {
  const base = newStory();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const int = (v: unknown, d: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length < 40).slice(0, 200) : []);
  const marcas: Record<string, number> = {};
  if (r.marcas && typeof r.marcas === 'object') for (const [k, v] of Object.entries(r.marcas as Record<string, unknown>)) if (/^[a-zA-Z0-9-]{1,30}$/.test(k) && typeof v === 'number') marcas[k] = Math.floor(v);
  return {
    v: 1,
    pos: int(r.pos, 0, 0, total),
    feitos: strs(r.feitos),
    pistas: strs(r.pistas),
    marcas,
    alerta: int(r.alerta, 0, 0, ALERTA_MAX),
    espera: int(r.espera, 0, 0, 3_600_000),
    escondeAte: typeof r.escondeAte === 'number' ? Math.floor(r.escondeAte) : undefined,
    erros: int(r.erros, 0, 0, 9999),
  };
}
