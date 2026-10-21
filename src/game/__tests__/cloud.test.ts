import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  cloudEnabled, coinDelta, collectLocal, flush, fromServer, newPacks, saveLocal, schedulePush, startSync, stopSync, syncState,
  SYNCED_KEYS, toServerJson, writeLocal,
} from '../cloud';
import { bootCloud, claimBrowser, takeBootNews } from '../cloud-boot';
import { loadProgress, newProgress } from '../progress';

// o banco de mentira: guarda as chamadas e responde o que cada teste mandar
type Answer = { data?: unknown; error?: { message: string } | null } | 'offline';
const net = vi.hoisted(() => ({
  calls: [] as { fn: string; args: Record<string, unknown> }[],
  answer: ((): Answer => ({ data: { ok: true } })) as (fn: string) => Answer,
}));
vi.mock('@/integrations/supabase/studentClient', () => ({
  supabaseStudent: {
    rpc: (fn: string, args: Record<string, unknown>) => {
      net.calls.push({ fn, args });
      const a = net.answer(fn);
      if (a === 'offline') return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({ data: a.data ?? null, error: a.error ?? null });
    },
  },
}));

beforeEach(() => { localStorage.clear(); net.calls.length = 0; });
afterEach(() => { stopSync(); });

describe('o que vai e o que volta', () => {
  it('sem entrar pelo /wit2 fica desligada (demonstração no navegador)', () => {
    expect(cloudEnabled()).toBe(false);
    saveLocal('wit.radio', '1');
    expect(localStorage.getItem('wit.radio')).toBe('1');
    expect(net.calls).toHaveLength(0);
  });
  it('o JSON enviado não leva moedas, cartas, pó nem pacotes (a Torre vai no JSON)', () => {
    const j = toServerJson({ ...newProgress(), coins: 999, pacotes: { raro: 2 } });
    for (const k of ['coins', 'collection', 'pacotes', 'po', 'semEpica', 'tickets']) expect(j).not.toHaveProperty(k);
    expect(j).toHaveProperty('fome');
    expect(j).toHaveProperty('towerMax');
    expect(j.pacotesVistos).toEqual({ raro: 2 });
  });
  it('moedas vão por diferença desde o último saldo conhecido', () => {
    expect(coinDelta(130, 100)).toBe(30);
    expect(coinDelta(70, 100)).toBe(-30);
  });
  it('ao entrar, o banco é a base: valores das tabelas, o resto do JSON, e o navegador não entra', () => {
    const m = fromServer(newProgress(), {
      coins: 300, po: { rare: 2 }, semEpica: 3, collection: { x: 1 }, pacotes: { raro: 1 },
      data: { fome: 80, towerMax: 4, andar: 9, _local: { 'wit.radio': '1' }, pacotesVistos: { raro: 1 } }, version: 2, tickets: [],
    });
    expect(m.coins).toBe(300);
    expect(m.fome).toBe(80);
    expect(m.pacotes).toEqual({ raro: 1 });
    expect(m.andar).toBe(4);   // nunca acima do andar liberado
    expect(m).not.toHaveProperty('_local');
    expect(m).not.toHaveProperty('pacotesVistos');
  });
  it('avisa só os pacotes que chegaram depois do último envio', () => {
    expect(newPacks({ pacotes: { comum: 3, raro: 1 }, data: { pacotesVistos: { comum: 1, raro: 1 } } })).toEqual([['comum', 2]]);
    expect(newPacks({ pacotes: { comum: 1 }, data: null })).toEqual([['comum', 1]]);
    expect(newPacks({ pacotes: { comum: 1 }, data: { pacotesVistos: { comum: 4 } } })).toEqual([]);
  });
  it('as chaves pequenas vão e voltam; a que o banco não tem sai do navegador', () => {
    localStorage.setItem('wit.fazenda', '{"day":3}');
    localStorage.setItem('wit.progresso', '{}');
    expect(collectLocal()).toEqual({ 'wit.fazenda': '{"day":3}' });
    writeLocal({ 'wit.radio': '1', 'wit.progresso': 'nada' });
    expect(localStorage.getItem('wit.radio')).toBe('1');
    expect(localStorage.getItem('wit.fazenda')).toBeNull();
    expect(localStorage.getItem('wit.progresso')).toBe('{}');   // o progresso não é chave pequena
  });
});

describe('um navegador, um aluno', () => {
  it('navegador de outro aluno (ou de ninguém): apaga as chaves wit.* e marca o dono', () => {
    localStorage.setItem('wit.progresso', '{"coins":5}');
    localStorage.setItem('wit.dono', 'aluno-a');
    localStorage.setItem('wit-accessibility', '{}');
    expect(claimBrowser('aluno-b')).toBe(true);
    expect(localStorage.getItem('wit.progresso')).toBeNull();
    expect(localStorage.getItem('wit-accessibility')).toBe('{}');
    expect(localStorage.getItem('wit.dono')).toBe('aluno-b');
    localStorage.setItem('wit.fazenda', '{}');
    expect(claimBrowser('aluno-b')).toBe(false);
    expect(localStorage.getItem('wit.fazenda')).toBe('{}');
  });
  it('ao entrar: carrega do banco, põe as chaves pequenas e a casa, avisa os pacotes uma vez e liga a sincronia', async () => {
    localStorage.setItem('wit.dono', 'outro');
    localStorage.setItem('wit.progresso', JSON.stringify({ ...newProgress(), coins: 999 }));
    net.answer = fn => fn === 'wit2_load'
      ? { data: { coins: 40, po: {}, semEpica: 0, collection: {}, pacotes: { comum: 2 }, version: 7, tickets: [], house: { items: [] },
          data: { fome: 33, _local: { 'wit.radio': '1' }, pacotesVistos: { comum: 1 } } } }
      : fn === 'wit2_photos_get' ? { data: [] } : { data: { ok: true, coins: 40, version: 8 } };
    const p = await bootCloud('eu');
    expect(p.coins).toBe(40);
    expect(p.fome).toBe(33);
    expect(loadProgress().coins).toBe(40);
    expect(localStorage.getItem('wit.radio')).toBe('1');
    expect(JSON.parse(localStorage.getItem('wit.casa')!)).toEqual({ items: [] });
    expect(localStorage.getItem('wit.dono')).toBe('eu');
    expect(cloudEnabled()).toBe(true);
    expect(takeBootNews()).toEqual([['comum', 1]]);
    expect(takeBootNews()).toEqual([]);
    expect(typeof net.calls.find(c => c.fn === 'wit2_load')!.args.p_session).toBe('string');
  });
});

describe('sincronia', () => {
  const start = (coins: number, current: () => ReturnType<typeof newProgress>, fix: (n: number) => void = () => undefined) =>
    startSync({ session: 's1', version: 3, coins, current, fix });
  const syncs = () => net.calls.filter(c => c.fn === 'wit2_sync');

  it('manda o progresso com a sessão, a diferença de moedas e as chaves pequenas', async () => {
    net.answer = () => ({ data: { ok: true, coins: 130, version: 4 } });
    start(100, () => ({ ...newProgress(), coins: 130 }));
    saveLocal('wit.radio', '1');
    expect(syncState()).toBe('salvando');
    await flush();
    const c = syncs()[0];
    expect(c.args.p_session).toBe('s1');
    expect(c.args.p_coins_delta).toBe(30);
    expect(c.args.p_version).toBe(3);
    expect((c.args.p_data as Record<string, unknown>)._local).toEqual({ 'wit.radio': '1' });
    expect(syncState()).toBe('salvo');
  });
  it('gravar a mesma coisa de novo não manda nada', async () => {
    net.answer = () => ({ data: { ok: true, coins: 0, version: 4 } });
    localStorage.setItem('wit.radio', '1');
    start(0, () => newProgress());
    saveLocal('wit.radio', '1');
    await flush();
    expect(syncs()).toHaveLength(0);
  });
  it('o servidor cortou moedas (teto do dia): corrige o navegador pela diferença', async () => {
    let fixed = 0;
    net.answer = () => ({ data: { ok: true, coins: 110, version: 4 } });
    start(100, () => ({ ...newProgress(), coins: 130 }), n => { fixed = n; });
    schedulePush();
    await flush();
    expect(fixed).toBe(-20);
  });
  it('outro computador abriu o jogo: para de gravar e pede para recarregar', async () => {
    net.answer = () => ({ data: { ok: false, sessao: true } });
    start(100, () => ({ ...newProgress(), coins: 100 }));
    schedulePush();
    await flush();
    expect(syncState()).toBe('outra-sessao');
    net.calls.length = 0;
    schedulePush();
    saveLocal('wit.radio', '0');
    await flush();
    expect(syncs()).toHaveLength(0);
  });
  it('sem rede: avisa, tenta de novo e a diferença de moedas vai no envio seguinte', async () => {
    net.answer = () => 'offline';
    let p = { ...newProgress(), coins: 120 };
    start(100, () => p);
    schedulePush();
    await flush();
    expect(syncState()).toBe('sem-rede');
    net.answer = () => ({ data: { ok: true, coins: 150, version: 4 } });
    p = { ...p, coins: 150 };
    await flush();   // a tentativa seguinte (sem esperar o relógio)
    expect(syncs().at(-1)!.args.p_coins_delta).toBe(50);
    expect(syncState()).toBe('salvo');
  });
});

describe('teste de guarda: toda chave wit.* do navegador vai para o banco', () => {
  // o progresso, a casa e as fotos têm lugar próprio no banco; o resto é deste aparelho de propósito
  const OWN = ['wit.progresso', 'wit.casa', 'wit.fotos'];
  const DEVICE = ['wit.dono', 'wit.tab', 'wit.aula-demo'];
  const files = (dir: string): string[] => readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : files(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
  it('cada chave escrita no código está em SYNCED_KEYS ou nas listas conhecidas', () => {
    const known = new Set<string>([...SYNCED_KEYS, ...OWN, ...DEVICE]);
    const found = new Map<string, string>();
    for (const f of files(join(__dirname, '..', '..'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/['"`](wit\.[A-Za-z0-9_.-]+)['"`]/g)) found.set(m[1], f);
    }
    expect(found.size).toBeGreaterThan(8);
    for (const [k, f] of found) expect(known.has(k), `${k} (${f}) não vai para o banco: ponha em SYNCED_KEYS ou explique`).toBe(true);
  });
});
