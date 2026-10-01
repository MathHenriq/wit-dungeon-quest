// Prints das profissões, minijogos, mochila, mercado, cozinha, entregas e missões.
//   node scripts/mapa/prints-trabalho.mjs <pasta> [url-base]   (com o vite rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
// um aluno com coisas na mochila, um pouco de fome e experiência
const SAVE = {
  coins: 120, itens: { pao: 2, ovo: 3, leite: 2, 'colheita:cenoura': 3, 'colheita:abobora': 1, 'peixe:tilapia': 4, 'peixe:dourado': 1, sensor: 3, disco: 1, 'fruta:maca': 4, 'semente:milho': 5 },
  profissao: 'tecnico-iot', xp: { 'tecnico-iot': 150, pescador: 60, fazendeiro: 30 }, stats: { peixes: 9, colheitas: 5 }, fome: 38,
};
async function open(name, query, viewport = { width: 1280, height: 720 }, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  await ctx.addInitScript(s => { if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', s); }, JSON.stringify(SAVE));
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const shot = n => page.screenshot({ path: `${S}/${name}-${n}.png` });
  return { page, ctx, shot };
}
const click = (page, text) => page.getByRole('button', { name: text }).first().click();

for (const [door, zona] of [['npc-padaria', 'cidade'], ['estudio-musica', 'wit'], ['atelie', 'wit'], ['lab-ia', 'wit'], ['casa-iot', 'wit'], ['metaverso', 'wit'], ['estudio', 'wit'], ['oficina-games', 'wit']]) {
  const { ctx, shot, page } = await open(door, `?zona=${zona}&trabalho=${door}`);
  await shot('1-intro');
  await click(page, 'TRABALHAR');
  await page.waitForTimeout(door === 'atelie' ? 300 : 1800);
  await shot('2-jogo');
  await ctx.close();
}
{
  const { ctx, shot, page } = await open('mochila', '?mochila');
  await shot('1-itens');
  await click(page, 'MONTAR IRRIGADOR'); await page.waitForTimeout(300); await shot('2-irrigador');
  await click(page, /^PROFISSÕES/); await page.waitForTimeout(200); await shot('3-profissoes');
  await click(page, /^MISSÕES/); await page.waitForTimeout(200); await shot('4-missoes');
  await ctx.close();
}
for (const loja of ['mercado', 'cozinha', 'entregas']) {
  const { ctx, shot, page } = await open(loja, `?zona=${loja === 'cozinha' ? 'fazenda' : 'wit'}&loja=${loja}`);
  await shot('1');
  if (loja === 'entregas') { await click(page, 'PEGAR ENCOMENDA'); await page.waitForTimeout(300); await shot('2-pegou'); await page.keyboard.press('Escape'); await page.waitForTimeout(400); await shot('3-hud'); }
  await ctx.close();
}
{
  const { ctx, shot } = await open('celular', '?zona=wit&trabalho=casa-iot', { width: 390, height: 844 }, true);
  await shot('iot');
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sem erros');
