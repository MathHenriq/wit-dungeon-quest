#!/usr/bin/env node
/**
 * Perfil de fluidez de uma tela do jogo, no build de produção.
 *
 * Existe porque medir aqui é fácil de fazer errado. A primeira rodada deste
 * trabalho otimizou o que parecia caro (re-renders do React) e o perfil
 * mostrou, depois, que o JavaScript estava ocioso: o custo real era pintura —
 * nove cenários de batalha montados ao mesmo tempo e um punhado de painéis com
 * `backdrop-filter`. Adivinhar custou uma rodada inteira.
 *
 * O que ele mede, por tela:
 *   - quadros por segundo e quantos passam de 32 ms (o olho percebe)
 *   - quantos elementos têm animação CSS rodando, e quais repintam
 *   - quantos têm backdrop-filter, e quanto de área ocupam
 *   - quanto de CPU é JavaScript (se for pouco, o problema é pintura)
 *
 * Uso:
 *   npm run build && node scripts/perf.mjs /battle-demo
 *   node scripts/perf.mjs /login,/battle-demo      (várias de uma vez)
 *   CPU=1 node scripts/perf.mjs /battle-demo       (sem estrangular a CPU)
 *
 * Leia os números como COMPARAÇÃO, não como verdade absoluta: este ambiente
 * costuma rodar em SwiftShader (sem GPU), onde blur e composição custam bem
 * mais que num Chromebook real. O script avisa quando é o caso. Para decidir
 * qualquer coisa, meça os dois lados com o mesmo arnês, mais de uma vez.
 *
 * Telas atrás de login não são alcançáveis por aqui sem credencial — para
 * medir o hub ou a loja, entre com um aluno de teste e aponte o script para a
 * rota resultante.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = 'dist';
const PORTA = Number(process.env.PERF_PORT ?? 4310);
const SEGUNDOS = Number(process.env.PERF_SECONDS ?? 8);
const ESPERA_MS = Number(process.env.PERF_WAIT_MS ?? 7000);
/** 4× aproxima um Chromebook de escola. CPU=1 desliga o estrangulamento. */
const CPU = Number(process.env.CPU ?? 4);

const TIPOS = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.gif':'image/gif', '.mp4':'video/mp4',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.ico':'image/x-icon',
};

const servidor = createServer(async (req, res) => {
  const caminho = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let alvo = join(DIST, normalize(caminho).replace(/^(\.\.[/\\])+/, ''));
  let achou = true;
  try { const s = await stat(alvo); if (s.isDirectory()) alvo = join(alvo, 'index.html'); }
  catch { achou = false; }
  if (!achou) {
    if (extname(caminho)) { res.writeHead(404).end('nao encontrado'); return; }
    alvo = join(DIST, 'index.html');
  }
  try {
    res.writeHead(200, { 'Content-Type': TIPOS[extname(alvo)] ?? 'application/octet-stream' });
    res.end(await readFile(alvo));
  } catch { res.writeHead(404).end('nao encontrado'); }
});

async function acharChromium() {
  if (process.env.PERF_CHROMIUM) return process.env.PERF_CHROMIUM;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base) return undefined;
  const { readdir } = await import('node:fs/promises');
  try {
    const dirs = await readdir(base);
    for (const d of dirs.filter(x => x.startsWith('chromium-')).sort().reverse()) {
      const p = join(base, d, 'chrome-linux', 'chrome');
      try { await stat(p); return p; } catch { /* próximo */ }
    }
  } catch { /* sem diretório */ }
  return undefined;
}

/** Roda dentro da página: mede quadros e inventaria o que custa pintura. */
function coletor(segundos) {
  return new Promise((resolve) => {
    const q = [];
    let ant = performance.now();
    const fim = ant + segundos * 1000;

    function tick(agora) {
      q.push(agora - ant);
      ant = agora;
      if (agora < fim) { requestAnimationFrame(tick); return; }

      const ord = [...q].sort((a, b) => a - b);
      const COMPOSITE = new Set(['transform', 'opacity', 'translate', 'rotate', 'scale']);

      // Quais propriedades cada @keyframes anima — separa o que é barato
      // (compositor) do que obriga a repintar.
      const propsPorNome = {};
      for (const sh of document.styleSheets) {
        let regras; try { regras = sh.cssRules; } catch { continue; }
        for (const r of regras ?? []) {
          if (r.type !== CSSRule.KEYFRAMES_RULE) continue;
          const set = new Set();
          for (const k of r.cssRules) for (const pr of k.style) set.add(pr);
          propsPorNome[r.name] = [...set];
        }
      }

      let animados = 0, repintam = 0, comBlur = 0, areaBlur = 0;
      for (const e of document.querySelectorAll('*')) {
        const cs = getComputedStyle(e);
        if (cs.animationName && cs.animationName !== 'none') {
          for (const nome of cs.animationName.split(',').map(x => x.trim())) {
            animados++;
            const props = propsPorNome[nome] ?? [];
            if (props.length && !props.every(p => COMPOSITE.has(p))) repintam++;
          }
        }
        const bf = cs.backdropFilter || cs.webkitBackdropFilter;
        if (bf && bf !== 'none') {
          comBlur++;
          const r = e.getBoundingClientRect();
          areaBlur += r.width * r.height;
        }
      }

      resolve({
        fps: +(q.length / segundos).toFixed(1),
        medioMs: +(q.reduce((a, b) => a + b, 0) / q.length).toFixed(2),
        p95Ms: +ord[Math.floor(ord.length * 0.95)].toFixed(2),
        travadas: q.filter(d => d > 32).length,
        nos: document.querySelectorAll('*').length,
        animados, repintam, comBlur,
        areaBlurPct: +(100 * areaBlur / (innerWidth * innerHeight)).toFixed(0),
      });
    }
    requestAnimationFrame(tick);
  });
}

async function main() {
  const rotas = (process.argv[2] ?? '/battle-demo').split(',').map(r => r.trim()).filter(Boolean);

  try { await stat(join(DIST, 'index.html')); }
  catch { console.error(`✗ ${DIST}/index.html nao existe — rode o build antes.`); process.exit(1); }

  let chromium;
  try { ({ chromium } = await import('playwright-core')); }
  catch { console.error('✗ playwright-core nao instalado (devDependency).'); process.exit(1); }

  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const navegador = await chromium.launch({
    executablePath: await acharChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // Avisa se não há GPU — muda como os números devem ser lidos.
  {
    const p = await navegador.newPage();
    await p.goto('about:blank');
    const r = await p.evaluate(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'sem webgl';
      const d = gl.getExtension('WEBGL_debug_renderer_info');
      return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    await p.close();
    if (/swiftshader|llvmpipe|software/i.test(String(r))) {
      console.log(`\n⚠  renderizando por SOFTWARE (${String(r).slice(0, 48)}…)`);
      console.log('   blur e composicao custam MAIS aqui que num Chromebook real.');
      console.log('   use os numeros para comparar lados, nao como valor absoluto.');
    }
    console.log(`\nCPU estrangulada em ${CPU}×  ·  janela de ${SEGUNDOS}s  ·  1366×768`);
  }

  const cab = ['rota', 'fps', 'medio', 'p95', 'travad.', 'nos', 'anim', 'repint', 'blur', '%tela'];
  console.log('\n' + cab[0].padEnd(20) + cab.slice(1).map(c => c.padStart(8)).join(''));
  console.log('-'.repeat(20 + 8 * 9));

  for (const rota of rotas) {
    const p = await navegador.newPage({ viewport: { width: 1366, height: 768 } });
    const cdp = await p.context().newCDPSession(p);
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await p.goto(`http://127.0.0.1:${PORTA}${rota}`, { waitUntil: 'load' });
    await p.waitForTimeout(ESPERA_MS);
    const m = await p.evaluate(coletor, SEGUNDOS);
    console.log(
      rota.slice(0, 20).padEnd(20) +
      [m.fps, m.medioMs, m.p95Ms, m.travadas, m.nos, m.animados, m.repintam, m.comBlur, m.areaBlurPct]
        .map(v => String(v).padStart(8)).join(''),
    );
    await p.close();
  }

  console.log(`
  fps       quadros por segundo (60 é o teto)
  travad.   quadros acima de 32 ms — os que o olho percebe como engasgo
  anim      elementos com animação CSS rodando AGORA
  repint    destes, os que animam propriedade que obriga a repintar
            (background, box-shadow, filter…) — os caros
  blur      elementos com backdrop-filter  ·  %tela quanto da tela cobrem
`);

  await navegador.close();
  servidor.close();
}

main().catch(e => { console.error('✗ perf falhou:', e); servidor.close(); process.exit(1); });
