// Joga o Prólogo e o Ato 1 da história ("Cartas Marcadas") pelo navegador, como
// o aluno: anda até as pessoas, fala, entra nas portas, mexe no lixo, responde o
// Caderno e escolhe. Tira print de cada momento e para no primeiro passo que
// não avançar.
//   node scripts/mapa/historia-robo.mjs <pasta> [url-base]   (com o vite rodando)
import { chromium } from 'playwright-core';
const OUT = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
if (!OUT) { console.error('uso: node scripts/mapa/historia-robo.mjs <pasta>'); process.exit(1); }
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(() => {
  if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({ coins: 100, fome: 95, caminho: 'desafiante' }));
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
let n = 0;
const shot = async name => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
const story = () => page.evaluate(() => JSON.parse(localStorage.getItem('wit.historia') ?? '{}'));
const wait = ms => page.waitForTimeout(ms);

async function go(query) {
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await wait(2200);
}
/** Fecha o balão de fala (ESPAÇO até sumir). */
async function closeDialog() {
  for (let i = 0; i < 12; i++) {
    const open = await page.evaluate(() => !!window.__city?.modal || !!window.__interior?.modal);
    if (!open) return;
    await page.keyboard.press(' '); await wait(160);
  }
}
async function tp(tx, ty, dir) {
  await page.evaluate(([tx, ty, dir]) => {
    const s = window.__city; s.player.tx = tx; s.player.ty = ty; s.player.dir = dir; s.player.from = null; s.path = []; s.held = []; s.dirty = true;
  }, [tx, ty, dir]);
  await wait(150);
}
/** Para do lado de um morador da cidade, de frente para ele, e aperta ESPAÇO. */
async function talk(id, name) {
  const at = await page.evaluate(id => {
    const s = window.__city, npc = s.npcs.find(nn => nn.def.id === id);
    if (!npc) return null;
    npc.wait = 1e9; npc.path = []; npc.w.from = null;
    return { tx: npc.w.tx, ty: npc.w.ty };
  }, id);
  if (!at) throw new Error(`morador ${id} não está nesta área`);
  for (const [dx, dy, dir] of [[0, 1, 'north'], [0, -1, 'south'], [1, 0, 'west'], [-1, 0, 'east']]) {
    await tp(at.tx + dx, at.ty + dy, dir);
    const before = (await story()).pos ?? 0;
    await page.keyboard.press(' '); await wait(250);
    const open = await page.evaluate(() => window.__city.modal);
    if (open) { if (name) await shot(name); await closeDialog(); return before; }
  }
  throw new Error(`não consegui falar com ${id}`);
}
async function door(tx, ty, name) {
  await tp(tx, ty + 1, 'north');
  await page.keyboard.down('ArrowUp'); await wait(260); await page.keyboard.up('ArrowUp'); await wait(500);
  if (name) await shot(name);
  await closeDialog();
}
async function spot(tx, ty, name) {
  await tp(tx, ty - 1, 'south');
  await page.keyboard.press(' '); await wait(300);
  if (name) await shot(name);
  await closeDialog();
}
async function expectPos(step) {
  const h = await story();
  console.log(`  ${step}: passo ${h.pos}, pistas ${h.pistas?.length ?? 0}, alerta ${h.alerta ?? 0}`);
}

try {
  // PRÓLOGO
  await go('?historia=zero&hora=8&pos=40,12');
  await shot('prologo-bolso'); await closeDialog(); await expectPos('bolso');
  await talk('passeio-2', 'prologo-mari'); await expectPos('mari');
  await go('?hora=20&pos=33,24');
  await shot('prologo-farol'); await closeDialog(); await expectPos('farol');
  // dia seguinte: o relógio passa das 6h (o dia da fazenda vira) e a Mari some
  await go('?hora=5.85&velocidade=30&pos=40,12');
  await wait(2500); await shot('prologo-sumiu'); await closeDialog(); await expectPos('sumiu');

  // CAPÍTULO 1
  await go('?hora=9&pos=48,10');
  await shot('cap1-hud');
  await door(48, 8, 'cap1-casa'); await expectPos('casa');
  for (const id of ['guia', 'loja', 'torre', 'lojista', 'mural']) await talk(id, id === 'guia' ? 'cap1-lia' : null);
  await expectPos('perguntou');
  await talk('arena', 'cap1-rex'); await talk('padeiro', 'cap1-rosa');
  await go('?zona=lago&hora=9&pos=22,28'); await talk('pipo', 'cap1-pipo'); await expectPos('lembram');
  await go('?hora=9&pos=46,11');
  await spot(46, 13, 'cap1-mochila'); await expectPos('mochila');
  await page.locator('.story-line').click(); await wait(400); await shot('cap1-caderno-pergunta');
  await page.getByRole('button', { name: 'Moram perto do Lago' }).click(); await wait(300); await shot('cap1-caderno-erro');
  await page.getByRole('button', { name: 'Nenhum deles toma o café da Dona Ana' }).click(); await wait(400);
  await shot('cap1-acertou'); await closeDialog(); await expectPos('pergunta');

  // CAPÍTULO 2
  await go('?sala=oficina&hora=10');
  await wait(21500); await shot('cap2-observou'); await closeDialog(); await expectPos('observou');
  await go('?hora=10&pos=40,20');
  for (const id of ['lojista', 'passeio-3', 'passeio-1']) await talk(id, id === 'passeio-1' ? 'cap2-enzo' : null);
  await expectPos('ontem');
  await go('?hora=13&pos=16,11'); await spot(16, 13, 'cap2-lixo-de-dia'); await expectPos('lixo de dia (não pode)');
  await go('?hora=21&pos=16,11'); await spot(16, 13, 'cap2-lixo-noite'); await expectPos('lixo');
  await go('?zona=fazenda&hora=10&pos=55,19'); await talk('tina', 'cap2-tina'); await expectPos('tina');

  // CAPÍTULO 3
  await go('?zona=lago&hora=7&pos=30,20');
  await shot('cap3-neblina');
  await talk('amaro', 'cap3-homem-da-neblina'); await expectPos('cais');
  await go('?hora=10&pos=33,24'); await talk('guia', 'cap3-lia');
  await talk('arena', 'cap3-rex'); await expectPos('rex');
  await go('?sala=arena&hora=10');
  await page.evaluate(() => { const S = window.__interior; S.player.tx = 13; S.player.ty = 4; S.player.dir = 'north'; S.player.from = null; S.held = []; S.path = []; });
  await wait(200); await page.keyboard.press(' '); await wait(300); await shot('cap3-rafa');
  for (let i = 0; i < 6; i++) { await page.keyboard.press(' '); await wait(150); }
  await expectPos('rafa');
  await go('?hora=10&pos=48,33'); await talk('arena', 'cap3-rex-aliado'); await expectPos('rex aliado');

  // CAPÍTULO 4
  await go('?zona=fazenda&hora=10&pos=30,30');
  await talk('joca', 'cap4-joca'); await talk('beto', 'cap4-beto');
  await go('?zona=fazenda&hora=10&pos=31,15'); await spot(31, 13, 'cap4-chaveiro'); await expectPos('chave');
  await go('?zona=fazenda&hora=12&pos=65,14'); await door(65, 11, 'cap4-estufa-de-dia'); await expectPos('estufa de dia (não pode)');
  await go('?zona=fazenda&hora=21&pos=65,14'); await door(65, 11, 'cap4-estufa-noite'); await expectPos('estufa');
  await go('?zona=fazenda&hora=10&pos=30,30');
  await talk('joca'); await wait(200);
  await shot('cap4-escolha');
  await page.getByRole('button', { name: 'Guardar segredo' }).click(); await wait(300);
  await shot('cap4-segredo'); await closeDialog(); await expectPos('escolha');

  // CAPÍTULO 5
  await go('?hora=10&pos=43,21'); await talk('loja', 'cap5-duda'); await expectPos('duda');
  await page.locator('.story-line').click(); await wait(300);
  await page.getByRole('button', { name: 'Desaparecidos' }).click(); await wait(300); await shot('cap5-desaparecidos');
  await page.getByRole('button', { name: 'História' }).click(); await wait(200);
  await page.getByRole('button', { name: 'Com a guia, a Lia' }).click(); await wait(400); await closeDialog(); await expectPos('pergunta 2');
  await go('?hora=10&pos=33,24'); await talk('guia', 'cap5-lia'); await expectPos('lia');
  await shot('cap5-alerta');
  await go('?zona=lago&hora=7&pos=30,20'); await talk('amaro', 'cap5-amaro');
  await go('?hora=11&pos=33,24'); await shot('fim-ato1'); await expectPos('fim');
  await talk('guia', 'fim-lia-doce');
} catch (e) {
  console.error('PAROU:', e.message);
  await shot('parou');
}
console.log('passo final:', (await story()).pos, '| erros do navegador:', errors.length ? errors.slice(0, 5) : 'nenhum');
await browser.close();
