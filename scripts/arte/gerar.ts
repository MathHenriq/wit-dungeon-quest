/**
 * Gera as ilustrações das cartas pelo AI Horde (gratuito, sem conta).
 *
 *   npx vite-node scripts/arte/gerar.ts                  # todas as que faltam
 *   npx vite-node scripts/arte/gerar.ts -- --ids kamehameha,sharingan --force
 *   npx vite-node scripts/arte/gerar.ts -- --limit 10 --paralelo 3
 *
 * Saída bruta em `arte/bruto/<id>.webp` (+ `.json` com semente e servidor).
 * Depois rode `python3 scripts/arte/processar.py` para gerar as versões finais
 * em `public/cards/art/`.
 *
 * Formato: Comum até Épica têm moldura com a arte numa janela → paisagem.
 * Lendária para cima são full art → retrato.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CATALOG } from '../../src/lib/tcg/cards/catalog';
import { FULL_ART_RARITIES } from '../../src/lib/tcg/labels';
import type { CardDef } from '../../src/lib/tcg/types';
import { ART_PROMPTS } from './prompts';

const API = 'https://aihorde.net/api/v2';
const HEADERS = {
  'Content-Type': 'application/json',
  apikey: process.env.HORDE_API_KEY ?? '0000000000',
  'Client-Agent': 'wit-dungeon:2.0:github.com/mathhenriq',
  // Sem um User-Agent de navegador, o Cloudflare do Horde recusa (erro 1010).
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
};
const OUT = 'arte/bruto';

/**
 * Cada família de modelo tem as próprias tags de qualidade. Illustrious e
 * NoobAI foram treinados no Danbooru inteiro e reconhecem muito mais
 * personagens que o Animagine do Horde (que é uma versão antiga).
 */
const PRESETS = {
  'Animagine XL': {
    quality: 'masterpiece, high score, great score, absurdres',
    negative: 'lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry',
  },
  illustrious: {
    quality: 'masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest',
    negative: 'worst quality, low quality, bad quality, lowres, bad anatomy, bad hands, extra digits, fewer digits, jpeg artifacts, signature, watermark, username, blurry, text',
  },
} as const;
// Público: alunos do ensino fundamental. Tudo que puxa para sensual fica de fora.
const EXTRA_NEGATIVE = 'nsfw, nude, suggestive, cleavage, large breasts, revealing clothes, underwear, panties, bikini, swimsuit, bare legs, thighs, thighhighs, garter straps, bare shoulders, skirt lift, from below, upskirt, seductive pose, frame, border, card';

// ─── Argumentos ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const ids = opt('ids')?.split(',');
const force = flag('force');
const limit = Number(opt('limit') ?? Infinity);
const paralelo = Number(opt('paralelo') ?? 3);
const modelo = opt('modelo') ?? 'noobEvo';
const preset = modelo === 'Animagine XL' ? PRESETS['Animagine XL'] : PRESETS.illustrious;
const out = opt('saida') ?? OUT;

// ─── Horde ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function horde<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: HEADERS });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${body.slice(0, 200)}`);
  return JSON.parse(body) as T;
}

function promptFor(card: CardDef): string {
  const tags = ART_PROMPTS[card.id];
  if (!tags) throw new Error(`Sem prompt para ${card.id}`);
  return `${tags}, ${preset.quality} ### ${preset.negative}, ${EXTRA_NEGATIVE}`;
}

interface Resultado { seed: string; worker: string; model: string }

// O Horde aceita no máximo 2 envios por segundo: os trabalhadores entram em fila aqui.
let ultimoEnvio = 0;
async function vez(): Promise<void> {
  const agora = Date.now();
  const espera = Math.max(0, ultimoEnvio + 1500 - agora);
  ultimoEnvio = agora + espera;
  if (espera) await sleep(espera);
}

async function gerar(card: CardDef, seed: string): Promise<Resultado> {
  const retrato = FULL_ART_RARITIES.has(card.rarity);
  await vez();
  const { id } = await horde<{ id: string }>('/generate/async', {
    method: 'POST',
    body: JSON.stringify({
      prompt: promptFor(card),
      params: {
        sampler_name: 'k_euler_a', cfg_scale: 5, steps: 28, clip_skip: 2, n: 1, seed,
        width: retrato ? 832 : 1216, height: retrato ? 1216 : 832,
      },
      models: [modelo],
      nsfw: false, censor_nsfw: true, trusted_workers: true, r2: true,
    }),
  });

  const inicio = Date.now();
  for (;;) {
    await sleep(8000);
    const st = await horde<{ done: boolean; faulted?: boolean; is_possible?: boolean }>(`/generate/check/${id}`);
    if (st.faulted || st.is_possible === false) throw new Error('pedido recusado pelo Horde');
    if (st.done) break;
    if (Date.now() - inicio > 20 * 60_000) throw new Error('tempo esgotado');
  }

  const { generations } = await horde<{ generations: { img: string; seed: string; worker_name: string; model: string; censored: boolean }[] }>(`/generate/status/${id}`);
  const g = generations[0];
  if (!g || g.censored) throw new Error('imagem censurada pelo filtro');
  const img = await fetch(g.img, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
  if (!img.ok) throw new Error(`download ${img.status}`);
  writeFileSync(`${out}/${card.id}.webp`, Buffer.from(await img.arrayBuffer()));
  return { seed: g.seed, worker: g.worker_name, model: g.model };
}

// ─── Fila ────────────────────────────────────────────────────────────────────

mkdirSync(out, { recursive: true });

const fila = CATALOG
  .filter(c => !ids || ids.includes(c.id))
  .filter(c => force || !existsSync(`${out}/${c.id}.webp`))
  .slice(0, limit);

console.log(`${fila.length} carta(s) na fila, ${paralelo} em paralelo.`);
let feitas = 0;
let falhas = 0;

async function trabalhador(): Promise<void> {
  for (let card = fila.shift(); card; card = fila.shift()) {
    const metaPath = `${out}/${card.id}.json`;
    const anterior = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) as { seeds?: string[] } : {};
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      // Semente nova a cada geração: rodar de novo com --force dá outra versão.
      const seed = String(Math.floor(Math.random() * 2 ** 31));
      const t0 = Date.now();
      try {
        const r = await gerar(card, seed);
        writeFileSync(metaPath, JSON.stringify({
          id: card.id, ...r, prompt: ART_PROMPTS[card.id],
          seeds: [...(anterior.seeds ?? []), r.seed], geradoEm: new Date().toISOString(),
        }, null, 2));
        feitas++;
        console.log(`✓ ${card.id} (${Math.round((Date.now() - t0) / 1000)}s, ${r.worker})`);
        break;
      } catch (e) {
        console.log(`✗ ${card.id} tentativa ${tentativa}: ${(e as Error).message}`);
        if (tentativa === 3) falhas++;
        await sleep(15_000);
      }
    }
  }
}

await Promise.all(Array.from({ length: paralelo }, trabalhador));
console.log(`\nPronto: ${feitas} geradas, ${falhas} falharam.`);
