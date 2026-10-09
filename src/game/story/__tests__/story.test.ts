import { describe, expect, it } from 'vitest';
import {
  chegar, escolher, falar, falasExtra, marcas, neblina, newStory, novoDia, objetivo, pegar, porta, posOf, responder,
  sanitizeStory, tick, visivel, type Ctx, type Historia,
} from '../engine';
import { CAPITULOS, LINHA, PISTAS, REGRAS_FALA, REGRAS_VISIVEL, SELADAS } from '../chapters';
import { buildZone, ZONES } from '../../world/world';
import { NPCS } from '../../world/content';
import { ROOMS } from '../../interior/room';

const dia = (zona: string, hour = 12, d = 1): Ctx => ({ zona, hour, dia: d });
const at = (id: string): Historia => ({ ...newStory(), pos: posOf(LINHA, id) });

describe('motor da história', () => {
  it('começa no bolso: a carta em branco aparece ao ar livre, não dentro de sala', () => {
    const h = newStory();
    expect(tick(h, LINHA, dia('sala:oficina'), 16).h.pos).toBe(0);
    const r = tick(h, LINHA, dia('cidade'), 16);
    expect(r.avancou).toBe(true);
    expect(r.h.pistas).toContain('carta-branca');
  });

  it('falar com a pessoa certa avança; com outra pessoa não muda nada', () => {
    const h = at('pro-mari');
    expect(falar(h, LINHA, 'guia', dia('cidade')).h).toBe(h);
    const r = falar(h, LINHA, 'passeio-2', dia('cidade'));
    expect(r.h.pos).toBe(h.pos + 1);
    expect(r.falas?.[0]).toMatch(/^Mari:/);
  });

  it('o farol só pisca à noite; a Mari some no dia seguinte (não na mesma noite)', () => {
    let h = at('pro-farol');
    expect(tick(h, LINHA, dia('lago', 14, 3), 16).avancou).toBeFalsy();
    h = tick(h, LINHA, dia('lago', 20, 3), 16).h;
    expect(h.marcas['farol-piscou']).toBe(3);
    // mesma noite, mesmo dia: ainda não
    expect(tick(h, LINHA, dia('cidade', 9, 3), 16).avancou).toBeFalsy();
    // dia seguinte, de manhã, no Centro: sumiu
    const r = tick(h, LINHA, dia('cidade', 9, 4), 16);
    expect(r.avancou).toBe(true);
    expect(visivel(r.h, LINHA, REGRAS_VISIVEL, 'passeio-2', dia('cidade'))).toBe(false);
    expect(visivel(at('pro-mari'), LINHA, REGRAS_VISIVEL, 'passeio-2', dia('cidade'))).toBe(true);
  });

  it('passo de vários: cada um conta uma vez, e acaba no número pedido', () => {
    let h = at('c1-perguntar');
    h = falar(h, LINHA, 'guia', dia('cidade')).h;
    h = falar(h, LINHA, 'guia', dia('cidade')).h;   // repetido não conta
    expect(h.feitos).toEqual(['guia']);
    expect(objetivo(h, LINHA)?.conta).toBe('1/5');
    for (const q of ['loja', 'torre', 'lojista']) h = falar(h, LINHA, q, dia('cidade')).h;
    const r = falar(h, LINHA, 'mural', dia('cidade'));
    expect(r.avancou).toBe(true);
    expect(r.falas?.at(-1)).toMatch(/nunca tivesse existido/);
    expect(r.h.feitos).toEqual([]);
  });

  it('pegar só funciona no bloco certo e na hora certa (o lixo é de noite)', () => {
    const h = at('c2-lixo');
    expect(pegar(h, LINHA, dia('cidade', 12), 16, 13).falas?.[0]).toMatch(/voltar à noite/);
    expect(pegar(h, LINHA, dia('cidade', 12), 16, 13).h.pos).toBe(h.pos);
    expect(pegar(h, LINHA, dia('cidade', 21), 15, 13).h.pos).toBe(h.pos);
    const r = pegar(h, LINHA, dia('cidade', 21), 16, 13);
    expect(r.avancou).toBe(true);
    expect(r.h.pistas).toContain('petalas');
  });

  it('a porta da estufa segura de dia e abre de noite; o Alerta sobe', () => {
    const h = at('c4-estufa');
    const dia1 = porta(h, LINHA, 'estufa', dia('fazenda', 10));
    expect(dia1.falas?.[0]).toMatch(/Volte à noite/);
    expect(dia1.h.pos).toBe(h.pos);
    expect(porta(h, LINHA, 'estufa', dia('cidade', 22)).falas).toBeNull();
    const r = porta(h, LINHA, 'estufa', dia('fazenda', 22));
    expect(r.avancou).toBe(true);
    expect(r.h.alerta).toBe(1);
  });

  it('esperar na Oficina: conta o tempo só lá dentro', () => {
    let h = at('c2-observar');
    h = tick(h, LINHA, dia('cidade'), 15_000).h;
    expect(h.espera).toBe(0);
    h = tick(h, LINHA, dia('sala:oficina'), 15_000).h;
    expect(objetivo(h, LINHA)?.conta).toBe('75%');
    expect(tick(h, LINHA, dia('sala:oficina'), 5_000).avancou).toBe(true);
  });

  it('pergunta do Caderno: errar conta e não avança; acertar avança', () => {
    const h = at('c1-pergunta');
    const err = responder(h, LINHA, 0, dia('cidade'));
    expect(err.h.pos).toBe(h.pos);
    expect(err.h.erros).toBe(1);
    expect(responder(h, LINHA, 1, dia('cidade')).avancou).toBe(true);
  });

  it('escolha do Seu Joca guarda a marca escolhida e muda a fala dele depois', () => {
    const h = at('c4-flagra');
    const ask = falar(h, LINHA, 'joca', dia('fazenda'));
    expect(ask.escolha?.opcoes).toHaveLength(2);
    expect(ask.h).toBe(h);
    const r = escolher(h, LINHA, 1, dia('fazenda', 12, 7));
    expect(r.h.marcas['joca-informante']).toBe(7);
    const depois = { ...r.h, pos: posOf(LINHA, 'c5-pergunta') };
    expect(falasExtra(depois, LINHA, REGRAS_FALA, 'joca')?.[0]).toMatch(/Psiu/);
    const exposto = { ...depois, marcas: { 'joca-exposto': 1 } };
    expect(falasExtra(exposto, LINHA, REGRAS_FALA, 'joca')?.[0]).toMatch(/Me deixa em paz/);
  });

  it('o Homem da Neblina só aparece de manhã, no Lago, quando a história chama', () => {
    const h = at('c3-cais');
    expect(visivel(h, LINHA, REGRAS_VISIVEL, 'amaro', dia('lago', 7))).toBe(true);
    expect(visivel(h, LINHA, REGRAS_VISIVEL, 'amaro', dia('lago', 14))).toBe(false);
    expect(visivel(at('c3-lia'), LINHA, REGRAS_VISIVEL, 'amaro', dia('lago', 7))).toBe(false);
    expect(neblina(h, LINHA, dia('lago', 7))).toBe(true);
    expect(neblina(h, LINHA, dia('cidade', 7))).toBe(false);
  });

  it('marcadores: "!" em quem falta falar e brilho no bloco de pegar', () => {
    let h = at('c1-lembram');
    h = falar(h, LINHA, 'pipo', dia('lago')).h;
    expect(marcas(h, LINHA, 'cidade').quem).toEqual(['arena', 'padeiro']);
    expect(marcas(at('c1-mochila'), LINHA, 'cidade').blocos).toEqual([[46, 13]]);
    expect(marcas(at('c1-mochila'), LINHA, 'lago').blocos).toEqual([]);
    expect(marcas(at('c1-casa'), LINHA, 'cidade').portas).toEqual(['casa-rosa']);
  });

  it('novo dia baixa o Alerta da Ordem', () => {
    expect(novoDia({ ...newStory(), alerta: 2 }).alerta).toBe(1);
    expect(novoDia(newStory()).alerta).toBe(0);
  });

  it('o que veio do navegador é limpo', () => {
    const h = sanitizeStory({ pos: 9999, alerta: 99, pistas: ['ok', 5], marcas: { a: 1, 'b c': 2 } }, LINHA.length);
    expect(h.pos).toBe(LINHA.length);
    expect(h.alerta).toBe(5);
    expect(h.pistas).toEqual(['ok']);
    expect(h.marcas).toEqual({ a: 1 });
    expect(sanitizeStory('lixo', 10).pos).toBe(0);
  });
});

describe('capítulos (dados)', () => {
  const towns = Object.fromEntries(ZONES.map(z => [z, buildZone(z)]));
  const cityIds = new Set(NPCS.map(n => n.id));
  const roomIds = new Set(Object.entries(ROOMS).flatMap(([id, mk]) => mk().npcs.map(n => `${id}.${n.id}`)));

  it('ids de passo únicos e o Ato 1 inteiro (Prólogo + 5 capítulos)', () => {
    const ids = LINHA.map(l => l.passo.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CAPITULOS.filter(c => c.ato === 1).map(c => c.num)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('todo morador citado existe (na cidade ou numa sala)', () => {
    const quem = LINHA.flatMap(l => (l.passo.tipo === 'falar' || l.passo.tipo === 'escolha' ? [l.passo.quem] : l.passo.tipo === 'varios' ? l.passo.quem : []));
    for (const q of [...quem, ...REGRAS_FALA.map(r => r.quem), ...REGRAS_VISIVEL.map(r => r.quem)]) {
      expect(cityIds.has(q) || roomIds.has(q), q).toBe(true);
    }
  });

  it('portas e blocos de pegar existem no mapa e dá para chegar perto', () => {
    for (const { passo: p } of LINHA) {
      if (p.tipo === 'porta') expect(towns[p.zona].doors.some(d => d.building === p.predio), `${p.id}: porta ${p.predio}`).toBe(true);
      if (p.tipo === 'pegar') {
        const t = towns[p.zona];
        const livre = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => t.solid[p.ty + dy]?.[p.tx + dx] === false);
        expect(livre, `${p.id}: bloco ${p.tx},${p.ty}`).toBe(true);
      }
      if (p.tipo === 'varios') expect(p.precisa).toBeLessThanOrEqual(p.quem.length);
      if (p.tipo === 'pergunta') expect(p.opcoes[p.certa], p.id).toBeTruthy();
    }
  });

  it('toda pista dada tem texto no Caderno, e toda carta selada é uma pista', () => {
    for (const k of LINHA.flatMap(l => l.passo.pistas ?? [])) expect(PISTAS[k], k).toBeTruthy();
    for (const s of SELADAS) expect(PISTAS[s.pista], s.pista).toBeTruthy();
  });

  it('dá para jogar o Ato 1 inteiro do começo ao fim', () => {
    let h = newStory(), d = 1;
    for (const { passo: p } of LINHA) {
      const before = h.pos;
      const hour = p.quando?.noite ? 21 : p.quando?.neblina ? 7 : 12;
      if (p.quando?.depoisDe) d++;
      const zona = p.tipo === 'falar' && p.quando?.neblina ? 'lago' : 'zona' in p ? (p.zona === '*' ? 'cidade' : p.zona) : 'cidade';
      const c = dia(zona, hour, d);
      if (p.tipo === 'falar') h = falar(h, LINHA, p.quem, c).h;
      if (p.tipo === 'varios') for (const q of p.quem.slice(0, p.precisa)) h = falar(h, LINHA, q, c).h;
      if (p.tipo === 'porta') h = porta(h, LINHA, p.predio, c).h;
      if (p.tipo === 'lugar') h = p.area ? chegar(h, LINHA, c, p.area[0], p.area[1]).h : tick(h, LINHA, c, 16).h;
      if (p.tipo === 'pegar') h = pegar(h, LINHA, c, p.tx, p.ty).h;
      if (p.tipo === 'esperar') h = tick(h, LINHA, c, p.segundos * 1000).h;
      if (p.tipo === 'pergunta') h = responder(h, LINHA, p.certa, c).h;
      if (p.tipo === 'escolha') h = escolher(h, LINHA, 0, c).h;
      expect(h.pos, `travou em ${p.id}`).toBe(before + 1);
    }
    expect(h.marcas.ato1).toBeDefined();
    expect(objetivo(h, LINHA)).toBeNull();
  });
});
