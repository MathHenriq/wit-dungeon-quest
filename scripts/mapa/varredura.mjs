// Varredura: abre cada tela do jogo (as mesmas URLs de teste do CLAUDE.md),
// junta erros do navegador e tira um print de cada. Precisa do vite em 127.0.0.1:5199.
//   node scripts/mapa/varredura.mjs <pasta> [filtro]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2] ?? 'varredura', filtro = process.argv[3] ?? '';
mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:5199';
const C = '/cidade-demo?';
const URLS = [
  // cidade e áreas, dia e noite
  ['centro-dia', `${C}hora=10`], ['centro-noite', `${C}hora=22`], ['centro-tarde', `${C}hora=18`],
  ['lago', `${C}zona=lago&hora=11`], ['lago-noite', `${C}zona=lago&hora=23`], ['fazenda', `${C}zona=fazenda&hora=9`], ['fazenda-noite', `${C}zona=fazenda&hora=21`],
  ['wit', `${C}zona=wit&hora=12`], ['wit-noite', `${C}zona=wit&hora=22`],
  ['sentar-1', `${C}sentar=1`], ['mapa', `${C}mapa`], ['visual', `${C}visual`], ['mochila', `${C}mochila`], ['amigos', `${C}amigos&social=demo`],
  ['deck', `${C}deck`], ['tapetes', `${C}tapetes`], ['grimorio', `${C}grimorio`], ['veiculos', `${C}veiculos`], ['caminho', `${C}caminho`],
  ['mural', `${C}mural&social=demo`], ['fase', `${C}fase`],
  ['loja-mercado', `${C}loja=mercado`], ['loja-entregas', `${C}loja=entregas`], ['loja-cozinha', `${C}loja=cozinha`], ['pesca-diario', `${C}pesca=diario`],
  // salas
  ...[1, 30, 90].map(a => [`torre-${a}`, `${C}sala=torre&andar=${a}`]),
  ...['casa', 'arena', 'treino', 'loja', 'oficina', 'castelo', 'morador:casa-nando'].map(s => [`sala-${s.replace(':', '-')}`, `${C}sala=${s}`]),
  ['casa-noite', `${C}sala=casa&hora=22`],
  ['painel-pacotes', `${C}sala=loja&painel=pacotes`], ['painel-recompensas', `${C}sala=loja&painel=recompensas`], ['painel-moveis', `${C}sala=loja&painel=moveis`],
  ['painel-forja', `${C}sala=oficina&painel=forja`], ['painel-trocas', `${C}sala=oficina&painel=trocas&social=demo`], ['painel-guilda', `${C}sala=castelo&painel=guilda&social=demo`],
  ['quebra', `${C}sala=casa&painel=quebra`], ['masmorra', `${C}sala=arena&masmorra`],
  ['convite-mesa', `${C}sala=torre&andar=1&duelo=3`], ['convite-chefe', `${C}sala=torre&andar=1&duelo=chefe`],
  ['duelo', `${C}sala=torre&andar=1&duelo=3&jogar&comeca=eu`], ['duelo-chefe', `${C}sala=torre&andar=12&duelo=chefe&jogar&comeca=ele`],
  // trabalhos
  ...['npc-padaria', 'npc-musico', 'npc-artista', 'lab-ia', 'casa-iot', 'metaverso', 'estudio', 'oficina-games', 'analista', 'horta', 'rota'].map(t => [`trabalho-${t}`, `${C}trabalho=${t}`]),
  // outras páginas
  ['cartas', '/cartas-demo'], ['pvp-host', '/pvp-demo?lado=host'],
  ...['', 'alunos', 'missoes', 'resgates', 'mural', 'eventos', 'denuncias', 'relatorio', 'virada'].map(a => [`prof-${a || 'aula'}`, `/professor/aula-demo${a ? `?aba=${a}` : ''}`]),
].filter(([n]) => n.includes(filtro));

const IGNORE = /ERR_CERT|net::ERR|Failed to load resource|favicon|supabase|Download the React DevTools|React Router Future Flag|AudioContext was not allowed|GPU stall/i;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const report = [];
for (const [name, url] of URLS) {
  const [vw, vh] = (process.env.TELA ?? '1280x760').split('x').map(Number);
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, hasTouch: !!process.env.TELA, isMobile: !!process.env.TELA });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(`pageerror: ${e.message}`));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  try {
    await pg.goto(base + url, { waitUntil: 'networkidle', timeout: 30000 });
    await pg.waitForTimeout(name.startsWith('duelo') ? 12000 : 3000);
    const body = await pg.evaluate(() => document.body.innerText.slice(0, 400));
    if (/algo deu errado|something went wrong|error boundary/i.test(body)) errs.push('TELA DE ERRO: ' + body.slice(0, 200));
    await pg.screenshot({ path: `${out}/${name}.png` });
  } catch (e) { errs.push(`falhou: ${e.message.slice(0, 200)}`); }
  report.push({ name, url, errs: [...new Set(errs)] });
  console.log(`${errs.length ? 'X' : 'ok'} ${name}${errs.length ? `\n   ${[...new Set(errs)].slice(0, 4).join('\n   ')}` : ''}`);
  await ctx.close();
}
writeFileSync(`${out}/relatorio.json`, JSON.stringify(report, null, 2));
await b.close();
