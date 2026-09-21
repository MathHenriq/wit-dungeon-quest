#!/usr/bin/env node
/**
 * Teste de fumaça do build de produção.
 *
 * Por que isto existe: `vite build` e `vitest` podem passar os dois enquanto o
 * app sobe em branco no navegador. Foi o que aconteceu — uma configuração de
 * `manualChunks` fechou um ciclo entre chunks, o navegador tentou ler um
 * binding antes de ele existir (`Cannot access 'S' before initialization`) e o
 * app morreu antes do React montar. Nenhum teste de unidade pega isso, porque
 * o erro não está no código: está na ORDEM em que os pedaços são avaliados.
 *
 * Este script faz o que faltava: serve o `dist/` e abre as rotas públicas num
 * Chromium de verdade. Falha se a página ficar em branco ou se qualquer erro
 * chegar ao console.
 *
 * Uso:  node scripts/smoke-build.mjs        (espera um dist/ já construído)
 *       npm run test:build                  (constrói e depois roda este)
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = 'dist';
const PORTA = Number(process.env.SMOKE_PORT ?? 4178);
const ROTAS = ['/', '/login', '/professor/login', '/pais/login'];
const ESPERA_MS = Number(process.env.SMOKE_WAIT_MS ?? 6000);

const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

// Servidor estático com fallback de SPA — igual ao que a hospedagem faz.
const servidor = createServer(async (req, res) => {
  const caminho = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let alvo = join(DIST, normalize(caminho).replace(/^(\.\.[/\\])+/, ''));
  let achou = true;
  try {
    const s = await stat(alvo);
    if (s.isDirectory()) alvo = join(alvo, 'index.html');
  } catch {
    achou = false;
  }

  if (!achou) {
    // Fallback de SPA só para caminho SEM extensão, que é o que a hospedagem
    // real faz. Devolver index.html para um pedido de .js faz o navegador
    // tentar executar HTML e gritar `Unexpected token '<'` — um erro do
    // servidor de teste que apareceria como se fosse do jogo.
    // É o caso de /_vercel/speed-insights/script.js, que só existe na Vercel.
    if (extname(caminho)) {
      res.writeHead(404).end('nao encontrado');
      return;
    }
    alvo = join(DIST, 'index.html');
  }
  try {
    const corpo = await readFile(alvo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(alvo)] ?? 'application/octet-stream' });
    res.end(corpo);
  } catch {
    res.writeHead(404).end('nao encontrado');
  }
});

/**
 * Ruído esperado fora da hospedagem real, que não diz nada sobre o app:
 *  - falha de rede (este ambiente não alcança o Supabase nem o Google Fonts);
 *  - `/_vercel/...`, que só existe servido pela Vercel;
 *  - 404 genérico, que sem URL não dá para atribuir — os erros que importam
 *    (ReferenceError, TypeError, SyntaxError) chegam pelo `pageerror`.
 */
function ruidoEsperado(texto) {
  return /ERR_CERT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION|Failed to fetch|NetworkError|net::ERR_/i.test(texto)
    || /_vercel/i.test(texto)
    || /Failed to load resource/i.test(texto);
}

async function main() {
  try {
    await stat(join(DIST, 'index.html'));
  } catch {
    console.error(`✗ ${DIST}/index.html nao existe — rode o build antes.`);
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    console.error('✗ playwright-core nao instalado (devDependency).');
    process.exit(1);
  }

  await new Promise((r) => servidor.listen(PORTA, '127.0.0.1', r));

  const executavel = process.env.SMOKE_CHROMIUM
    ?? (await acharChromium())
    ?? undefined;

  const navegador = await chromium.launch({
    executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const falhas = [];

  for (const rota of ROTAS) {
    const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
    const problemas = [];
    pagina.on('pageerror', (e) => problemas.push(String(e).split('\n')[0]));
    pagina.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (!ruidoEsperado(t)) problemas.push(t.slice(0, 200));
    });

    await pagina.goto(`http://127.0.0.1:${PORTA}${rota}`, { waitUntil: 'load' });
    await pagina.waitForTimeout(ESPERA_MS);

    // "Pintou alguma coisa" = texto visível OU um canvas OU um <img>. O jogo
    // tem telas que são quase só canvas, então exigir texto daria falso
    // negativo.
    const pintou = await pagina.evaluate(() => {
      const texto = document.body.innerText.trim().length;
      const visual = document.querySelectorAll('canvas, img, svg').length;
      return { texto, visual };
    });

    const vazia = pintou.texto === 0 && pintou.visual === 0;
    const reais = problemas.filter((p) => !ruidoEsperado(p));

    if (vazia || reais.length > 0) {
      falhas.push({ rota, ...pintou, erros: [...new Set(reais)].slice(0, 3) });
      console.error(`✗ ${rota} — texto:${pintou.texto} visual:${pintou.visual}`);
      for (const e of new Set(reais)) console.error(`    ${e}`);
    } else {
      console.log(`✓ ${rota} — texto:${pintou.texto} visual:${pintou.visual}`);
    }
    await pagina.close();
  }

  await navegador.close();
  servidor.close();

  if (falhas.length > 0) {
    console.error(`\n✗ ${falhas.length} de ${ROTAS.length} rotas quebradas no build de producao.`);
    process.exit(1);
  }
  console.log(`\n✓ as ${ROTAS.length} rotas sobem sem erro no build de producao.`);
}

/** Acha o Chromium que o Playwright baixou, sem depender do pacote completo. */
async function acharChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base) return undefined;
  const { readdir } = await import('node:fs/promises');
  try {
    const dirs = await readdir(base);
    for (const d of dirs.filter((x) => x.startsWith('chromium-')).sort().reverse()) {
      const p = join(base, d, 'chrome-linux', 'chrome');
      try { await stat(p); return p; } catch { /* tenta o proximo */ }
    }
  } catch { /* sem diretorio de navegadores */ }
  return undefined;
}

main().catch((e) => {
  console.error('✗ teste de fumaca falhou:', e);
  servidor.close();
  process.exit(1);
});
