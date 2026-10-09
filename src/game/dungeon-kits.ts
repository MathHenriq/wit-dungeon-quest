// Os golpes de cada carta de Ataque na masmorra (168 cartas, feitos à mão).
// Uma linha por carta: as peças (dungeon-moves.ts), os números e a frase do
// Códex. Comum até Rara: 1 ou 2 peças. Épica para cima: a mecânica do anime
// (o Titã fica gigante, o Zoltraak tem a cena do círculo mágico, o Kamehameha
// carrega segurando a tecla...). Teste: toda carta de Ataque tem kit e não há
// dois kits iguais (src/game/__tests__/dungeon-kits.test.ts).
//
// `d` é a fração do PODER da carta (18 + dano da carta × 2,2); os estados
// gostam de combinar (molhado + gelo congela, semente + fogo espalha...).
import type { Hit, Kit, Move } from './dungeon-moves';

const H = (d: number, o: Omit<Hit, 'd'> = {}): Hit => ({ d, ...o });
const k = (card: string, about: string, moves: Move[], o: Omit<Kit, 'card' | 'about' | 'moves'> = {}): Kit => ({ card, about, moves, ...o });

export const KITS: Kit[] = [
  // ─── Comuns ───────────────────────────────────────────────────────────────
  k('excalibur-de-arthur', 'Um corte de luz elétrica em linha reta à frente.', [
    { m: 'raio', len: 5, w: 0.6, dur: 0.15, tick: 1, hit: H(1, { st: 'eletrizado', sd: 3 }), look: 'luz' }]),
  k('descarga-de-um-milhao-de-volts', 'Descarga em volta do caçador: eletriza todo mundo perto.', [
    { m: 'area', where: 'eu', r: 2.6, hit: H(0.9, { st: 'eletrizado', sd: 3 }), look: 'raio' }]),
  k('chidori-senbon', 'Leque de 5 agulhas de raio.', [
    { m: 'proj', n: 5, spread: 0.6, speed: 14, range: 8, r: 0.15, hit: H(0.35, { st: 'eletrizado', sd: 3 }), look: 'agulha' }]),
  k('furia-berserker', 'Golpe de fúria: quanto menos vida, mais forte.', [
    { m: 'golpe', range: 1.8, arc: 2.4, hit: H(0.9, { low: 1.2, kb: 4 }), look: 'punho' }]),
  k('gomu-gomu-no-mi', 'O braço estica, soca longe e volta socando de novo.', [
    { m: 'proj', path: 'volta', speed: 14, range: 6, r: 0.4, hit: H(0.8, { kb: 6 }), pierce: true, look: 'punho' }]),
  k('ora-ora-ora', '8 socos seguidos, parado e invencível.', [
    { m: 'rajada', n: 8, every: 0.07, range: 1.6, arc: 1.2, hit: H(0.18, { kb: 0.5 }), fim: H(0.4, { kb: 5 }), look: 'punho' }]),
  k('jajanken', 'Carrega um instante e solta o soco: atordoa.', [
    { m: 'golpe', at: 0.3, range: 1.6, arc: 1, hit: H(1.6, { st: 'atordoado', sd: 1, kb: 8 }), look: 'punho' }]),
  k('folha-furacao', 'Chute giratório: acerta em volta inteira.', [
    { m: 'golpe', range: 1.7, arc: 6.3, hit: H(0.9, { kb: 6 }), look: 'ar' }]),
  k('soco-normal', 'Um soco normal. Quebra a postura.', [
    { m: 'golpe', range: 1.3, arc: 0.8, hit: H(1.3, { kb: 7, postura: 2 }), look: 'punho' }]),
  k('explosion-rush', 'Avança voando de explosões e explode no fim.', [
    { m: 'investida', len: 4, w: 0.8, hit: H(0.7, { st: 'queimar', sd: 3 }) },
    { m: 'area', where: 'eu', r: 1.4, hit: H(0.5, { st: 'queimar', sd: 3 }), look: 'bola' }]),
  k('mera-mera-no-mi', 'Punho de fogo que atravessa e deixa queimando.', [
    { m: 'proj', speed: 11, range: 8, r: 0.5, hit: H(0.7, { st: 'queimar', sd: 4 }), pierce: true, look: 'punho' }]),
  k('bola-de-fogo', 'Bola de fogo que explode e queima.', [
    { m: 'proj', speed: 9, range: 8, r: 0.4, blast: 1.5, hit: H(1, { st: 'queimar', sd: 3 }), look: 'bola' }]),
  k('ataque-rapido', 'Investida rápida que empurra.', [
    { m: 'investida', len: 3.5, w: 0.6, hit: H(0.7, { kb: 3 }) }]),
  k('chute-direto', 'Chute forte: joga o inimigo longe (bater na parede machuca).', [
    { m: 'golpe', range: 1.9, arc: 0.7, hit: H(1.1, { kb: 9 }), look: 'ar' }]),
  k('respiracao-do-vento', '3 lâminas de vento que atravessam.', [
    { m: 'proj', n: 3, spread: 0.5, speed: 13, range: 8, r: 0.25, hit: H(0.5), pierce: true, look: 'lamina' }]),
  k('sekki', 'Marca o inimigo; a marca explode e cega.', [
    { m: 'marca', n: 1, delay: 0.8, r: 1.3, hit: H(1, { st: 'cego', sd: 2.5 }) }]),
  k('turbo-vovo', 'Disparada fantasma: atravessa cegando e corre mais por 2 s.', [
    { m: 'investida', len: 6, w: 0.5, hit: H(0.6, { st: 'cego', sd: 2 }) },
    { m: 'buff', what: 'velocidade', v: 1.3, dur: 2 }]),
  k('estrela-verde', 'Estrela que quica 3 vezes nas paredes e planta sementes.', [
    { m: 'proj', path: 'quica', bounce: 3, speed: 10, range: 14, r: 0.35, hit: H(0.55, { st: 'semente', sd: 2.5 }), pierce: true, look: 'estrela' }]),
  k('lanca-de-madeira', 'Lança de madeira que prende quem acerta.', [
    { m: 'proj', speed: 13, range: 9, r: 0.25, hit: H(0.6, { st: 'preso', sd: 0.8 }), pierce: true, look: 'lanca' }]),
  k('caixao-de-areia', 'A areia prende o alvo e esmaga.', [
    { m: 'prender', where: 'alvo', r: 0.8, dur: 1, crush: H(1.2, { st: 'lama', sd: 3 }), look: 'areia' }]),
  k('punho-de-rocha', 'Punho de pedra lento e pesado: atordoa.', [
    { m: 'proj', speed: 8, range: 6, r: 0.55, hit: H(1, { st: 'atordoado', sd: 0.6, kb: 6, postura: 2 }), look: 'rocha' }]),
  k('ice-make', '3 lanças de gelo que deixam lento.', [
    { m: 'proj', n: 3, spread: 0.25, speed: 12, range: 8, r: 0.25, hit: H(0.45, { st: 'lento', sd: 2 }), look: 'gelo' }]),
  k('estacas-de-gelo', 'Estacas de gelo brotam em fila à frente.', [
    { m: 'chuva', where: 'linha', n: 5, every: 0.08, r: 0.7, step: 1.3, hit: H(0.45, { st: 'lento', sd: 2.5 }), look: 'gelo' }]),
  k('ice-make-aguia', '3 águias de gelo que perseguem.', [
    { m: 'proj', path: 'persegue', n: 3, spread: 0.8, speed: 9, range: 10, r: 0.3, hit: H(0.4, { st: 'lento', sd: 2 }), look: 'asas' }]),
  k('bola-de-neve', 'Bola de neve grande que congela.', [
    { m: 'proj', speed: 10, range: 8, r: 0.45, hit: H(0.7, { st: 'congelado', sd: 1.2 }), look: 'neve' }]),
  k('ferrao-de-borboleta', 'Estocada rápida: 2 de veneno de uma vez.', [
    { m: 'golpe', range: 2.2, arc: 0.4, hit: H(0.5, { st: 'veneno', sd: 4, n: 2 }), look: 'agulha' }]),
  k('picada-de-vespa', 'Ferrão que persegue o inimigo mais perto.', [
    { m: 'proj', path: 'persegue', speed: 12, range: 10, r: 0.2, hit: H(0.4, { st: 'veneno', sd: 4 }), look: 'agulha' }]),
  k('ferroada-de-escorpiao', 'A cauda fisga e puxa o inimigo até você.', [
    { m: 'proj', path: 'volta', speed: 12, range: 5, r: 0.3, hit: H(0.7, { st: 'veneno', sd: 4, pull: true }), look: 'agulha' }]),
  k('enma', 'Corte largo que deixa ferido.', [
    { m: 'golpe', range: 2.2, arc: 2, hit: H(1, { st: 'corte', sd: 3 }), look: 'lamina' }]),
  k('foice-tripla', '3 cortes de foice seguidos.', [
    { m: 'rajada', n: 3, every: 0.12, range: 1.9, arc: 2, hit: H(0.35, { st: 'corte', sd: 3 }), look: 'lamina' }]),
  k('matadora-de-cavaleiros', 'Corte que atravessa escudo e quebra a postura.', [
    { m: 'golpe', range: 1.8, arc: 1.2, hit: H(1.1, { fura: true, st: 'corte', sd: 3, postura: 2 }), look: 'espada' }]),
  k('espadinha', 'Espada arremessada que atravessa.', [
    { m: 'proj', speed: 14, range: 8, r: 0.2, hit: H(0.55), pierce: true, look: 'espada' }]),
  k('pequena-espada', 'Uma espadinha gira em volta por 4 s.', [
    { m: 'orbita', n: 1, r: 1.2, dur: 4, speed: 6, tick: 0.3, hit: H(0.3), look: 'espada' }]),
  k('esferas-de-aco', '3 esferas de aço que quicam 2 vezes.', [
    { m: 'proj', path: 'quica', n: 3, spread: 0.4, bounce: 2, speed: 11, range: 12, r: 0.25, hit: H(0.35, { kb: 2 }), look: 'esfera' }]),
  k('shuriken-gigante', 'Shuriken enorme que vai, atravessa e volta.', [
    { m: 'proj', path: 'volta', speed: 10, range: 7, r: 0.55, hit: H(0.55, { st: 'corte', sd: 3 }), pierce: true, look: 'shuriken' }]),
  k('respiracao-da-agua', 'Onda de água que serpenteia e molha.', [
    { m: 'proj', path: 'onda', speed: 9, range: 7, r: 0.4, hit: H(0.6, { st: 'molhado', sd: 4 }), pierce: true, look: 'onda' }]),
  k('roda-dagua', 'Rola para a frente numa roda de água.', [
    { m: 'investida', len: 3, w: 1, hit: H(0.8, { st: 'molhado', sd: 4, kb: 3 }), look: 'onda' }]),
  k('tiro-de-tubarao', 'Tubarão que persegue; se derrotar, cura 1 coração.', [
    { m: 'proj', path: 'persegue', speed: 10, range: 9, r: 0.4, hit: H(0.8, { st: 'molhado', sd: 4, cura: 1 }), look: 'tubarao' }]),
  k('chicote-dagua', 'Chicote de água que puxa quem pega.', [
    { m: 'raio', len: 4, w: 0.35, dur: 0.2, tick: 1, hit: H(0.6, { st: 'molhado', sd: 4, pull: true }), look: 'onda' }]),

  // ─── Incomuns ─────────────────────────────────────────────────────────────
  k('black-divider', 'Espada antimagia: corta, fura escudo e apaga os tiros em volta.', [
    { m: 'golpe', range: 2.2, arc: 1.6, hit: H(1.2, { fura: true, st: 'amaldicoado', sd: 3 }), look: 'espada' },
    { m: 'parar_tiros', r: 2.5, mode: 'apaga' }]),
  k('corte-antimagia', 'Corte voador que come os tiros inimigos no caminho.', [
    { m: 'proj', speed: 12, range: 9, r: 0.5, hit: H(0.9, { fura: true }), pierce: true, come: true, look: 'lua' }]),
  k('getsuga-tensho', 'Meia-lua negra que atravessa e amaldiçoa.', [
    { m: 'proj', speed: 11, range: 9, r: 0.7, hit: H(1, { st: 'amaldicoado', sd: 3 }), pierce: true, look: 'lua' }]),
  k('ioios-do-killua', '2 ioiôs de raio que vão e voltam.', [
    { m: 'proj', path: 'volta', n: 2, spread: 0.5, speed: 12, range: 5, r: 0.35, hit: H(0.5, { st: 'eletrizado', sd: 3 }), pierce: true, look: 'esfera' }]),
  k('kunai-do-deus-do-trovao', 'Joga a kunai e aparece no alvo com um golpe.', [
    { m: 'proj', speed: 16, range: 9, r: 0.2, hit: H(0.4), look: 'kunai' },
    { m: 'investida', at: 0.35, len: 9, w: 1, tele: true, hit: H(0.8, { st: 'eletrizado', sd: 3 }) }]),
  k('lancas-trovao', '3 lanças de trovão caem nos inimigos.', [
    { m: 'chuva', where: 'alvos', n: 3, every: 0.15, r: 0.8, hit: H(0.7, { st: 'eletrizado', sd: 3 }), look: 'raio' }]),
  k('raikiri', 'Investida com a mão de raio: fura escudo.', [
    { m: 'investida', len: 4.5, w: 0.5, hit: H(1.2, { st: 'eletrizado', sd: 3, fura: true }), look: 'raio' }]),
  k('nuvem-brincalhona', 'Sobe na nuvem por 4 s: mais rápido, voa sobre perigos e esbarra machucando.', [
    { m: 'transformar', form: 'nuvem', dur: 4, speed: 1.7, noKnock: true, voa: true, aura: { r: 0.9, tick: 0.3, hit: H(0.3, { kb: 4 }) } }]),
  k('punho-de-ferro', 'Soco de ferro: o braço vira escudo (+1 escudo).', [
    { m: 'golpe', range: 1.4, arc: 1, hit: H(1.3, { postura: 1.5 }), look: 'punho' },
    { m: 'buff', what: 'escudo', v: 1 }]),
  k('lotus-primario', 'Joga o inimigo para o alto e crava no chão.', [
    { m: 'prender', where: 'alvo', r: 0.8, dur: 0.4, crush: H(1.4, { st: 'atordoado', sd: 1.2 }), look: 'ar' }], { custo: 'escudo' }),
  k('socos-normais-consecutivos', '12 socos normais seguidos.', [
    { m: 'rajada', n: 12, every: 0.06, range: 1.5, arc: 1, hit: H(0.14, { kb: 0.3 }), look: 'punho' }]),
  k('alquimia-das-chamas', 'Estalo de dedos: a explosão nasce em cima do alvo.', [
    { m: 'area', where: 'alvo', r: 1.5, hit: H(1, { st: 'queimar', sd: 4 }), look: 'bola' }]),
  k('magia-de-roswaal', '4 bolas de fogo giram em volta e disparam.', [
    { m: 'orbita', n: 4, r: 1.3, dur: 3, speed: 4, tick: 0.4, hit: H(0.45, { st: 'queimar', sd: 3 }), launch: true, look: 'bola' }]),
  k('diable-jambe', 'Chute em chamas que joga longe.', [
    { m: 'golpe', range: 1.8, arc: 1.4, hit: H(1, { st: 'queimar', sd: 3, kb: 8 }), look: 'ar' }]),
  k('sol-nascente', 'Um sol pequeno queima o chão do alvo.', [
    { m: 'zona', where: 'alvo', r: 1.6, dur: 3, tick: 0.5, hit: H(0.25, { st: 'queimar', sd: 3 }), look: 'sol' }]),
  k('cartas-do-hisoka', 'Leque de 4 cartas afiadas que atravessam.', [
    { m: 'proj', n: 4, spread: 0.7, speed: 14, range: 9, r: 0.18, hit: H(0.3, { st: 'corte', sd: 2 }), pierce: true, look: 'carta' }]),
  k('tatsumaki', 'Tornado de vento que puxa e espalha os estados.', [
    { m: 'tornado', speed: 4, range: 8, r: 1.1, spin: 0.6, tick: 0.25, hit: H(0.22), pull: 3, look: 'ar' }]),
  k('floresta-nativa', 'A floresta cresce em volta: planta sementes; ficar dentro cura 1 coração.', [
    { m: 'zona', where: 'eu', r: 2.5, dur: 4, tick: 0.5, hit: H(0.2, { st: 'semente', sd: 2.5 }), slow: 0.6, cura: 1, look: 'raiz' }]),
  k('chicote-de-videira', 'Chicote de cipó que varre a frente.', [
    { m: 'raio', len: 4.5, w: 0.4, dur: 0.3, tick: 0.08, sweep: 2, hit: H(0.4, { st: 'semente', sd: 2.5 }), look: 'raiz' }]),
  k('sables', 'Tempestade de areia: anda girando e cega.', [
    { m: 'tornado', speed: 3, range: 7, r: 1, spin: 0.4, tick: 0.3, hit: H(0.2, { st: 'cego', sd: 2 }), look: 'areia' }]),
  k('espinhos-de-pedra', '6 espinhos de pedra brotam em fila.', [
    { m: 'chuva', where: 'linha', n: 6, every: 0.06, r: 0.7, step: 1.2, hit: H(0.55, { st: 'atordoado', sd: 0.4 }), look: 'rocha' }]),
  k('partisan-de-gelo', 'Lança de gelo veloz que congela e atravessa.', [
    { m: 'proj', speed: 15, range: 10, r: 0.3, hit: H(0.8, { st: 'congelado', sd: 1 }), pierce: true, look: 'lanca' }], { mana: 10 }),
  k('primeira-danca-tsukishiro', 'Pilar de gelo sobe do chão do alvo e congela.', [
    { m: 'area', where: 'alvo', r: 1.8, hit: H(1, { st: 'congelado', sd: 1.5 }), look: 'pilar' }]),
  k('hidra', 'Hidra de 3 cabeças: 3 mordidas que perseguem.', [
    { m: 'proj', path: 'persegue', n: 3, spread: 1, speed: 8, range: 9, r: 0.3, hit: H(0.35, { st: 'veneno', sd: 4 }), look: 'dragao' }]),
  k('ashisogi-jizo', 'Lâmina venenosa: envenena e paralisa as pernas (lento).', [
    { m: 'golpe', range: 2, arc: 1.6, hit: H(0.7, { st: 'veneno', sd: 4, n: 2, st2: 'lento', sd2: 2 }), look: 'lamina' }]),
  k('kunai', '2 kunais que ferem.', [
    { m: 'proj', n: 2, spread: 0.15, speed: 15, range: 8, r: 0.18, hit: H(0.45, { st: 'corte', sd: 3 }), look: 'kunai' }]),
  k('laminas-de-aco-ultraduro', '3 lâminas giram em volta e comem os tiros que chegam.', [
    { m: 'orbita', n: 3, r: 1.1, dur: 4, speed: 5, tick: 0.3, hit: H(0.3), come: true, look: 'lamina' }]),
  k('oni-giri', 'Atravessa com 3 espadas.', [
    { m: 'investida', len: 4, w: 0.9, hit: H(1.1, { st: 'corte', sd: 3 }), look: 'espada' }]),
  k('dragao-dagua', 'Dragão de água serpenteando: molha e empurra.', [
    { m: 'proj', path: 'onda', speed: 8, range: 10, r: 0.7, hit: H(0.8, { st: 'molhado', sd: 4, kb: 3 }), pierce: true, look: 'dragao' }]),
  k('karate-tritao', 'Golpe que passa por dentro do escudo.', [
    { m: 'area', where: 'frente', r: 1.3, hit: H(1, { fura: true, st: 'molhado', sd: 4, kb: 6 }), look: 'onda' }]),

  // ─── Raras ────────────────────────────────────────────────────────────────
  k('mago-negro', 'Chama um mago sombrio que atira por 8 s.', [
    { m: 'invocar', kind: 'mago', dur: 8, every: 1.2, range: 7, hit: H(0.4, { st: 'amaldicoado', sd: 2 }) }]),
  k('disaster', 'Área amaldiçoada: quem fica dentro não consegue atacar.', [
    { m: 'zona', where: 'alvo', r: 2, dur: 4, tick: 0.5, hit: H(0.12, { st: 'selado', sd: 1, st2: 'amaldicoado', sd2: 2 }), look: 'sombra' }]),
  k('kagune-rinkaku', '4 chicotadas de cristal; derrotar cura 1 coração.', [
    { m: 'rajada', n: 4, every: 0.1, range: 2.6, arc: 1, hit: H(0.3, { cura: 1 }), look: 'cristal' }]),
  k('toque-de-decadencia', 'O toque desfaz: prende, esmaga e amaldiçoa em volta.', [
    { m: 'prender', where: 'alvo', r: 0.8, dur: 0.6, crush: H(1.4, { fura: true, st: 'amaldicoado', sd: 4 }), cr: 2, look: 'decadencia' }]),
  k('dark-shadow', 'Sombra que briga do seu lado por 6 s.', [
    { m: 'invocar', kind: 'sombra', dur: 6, every: 0.7, range: 2, hit: H(0.45) }]),
  k('corte-dimensional', 'O corte aparece um instante depois, longo e furando tudo.', [
    { m: 'raio', at: 0.3, len: 9, w: 0.25, dur: 0.1, tick: 1, hit: H(1.4, { fura: true, st: 'amaldicoado', sd: 3 }), look: 'lamina' }]),
  k('primeira-forma-relampago', 'Relâmpago: a investida mais longa e rápida.', [
    { m: 'investida', len: 7, w: 0.6, hit: H(1.5, { st: 'eletrizado', sd: 3 }), look: 'raio' }]),
  k('chidori', 'Corre com o raio na mão: eletriza 2 vezes de uma vez.', [
    { m: 'investida', len: 4, w: 0.7, hit: H(1.2, { st: 'eletrizado', sd: 3, n: 2 }), look: 'raio' }]),
  k('chicote-negro', 'Chicote negro que puxa, atordoa e sela.', [
    { m: 'raio', len: 6, w: 0.3, dur: 0.2, tick: 1, hit: H(0.7, { pull: true, st: 'atordoado', sd: 1, st2: 'selado', sd2: 3 }), look: 'sombra' }]),
  k('espirito-da-besta', 'Vira fera por 6 s: mais rápido e mais forte de perto.', [
    { m: 'transformar', form: 'fera', dur: 6, speed: 1.3, dmg: 1.4 }], { custo: 'escudo' }),
  k('corte-do-dragao', 'Corte enorme que solta uma onda cortante.', [
    { m: 'golpe', range: 2.5, arc: 2.6, hit: H(1.3, { kb: 6 }), look: 'lamina' },
    { m: 'proj', at: 0.1, speed: 10, range: 5, r: 0.6, hit: H(0.5), pierce: true, look: 'lua' }]),
  k('hamon-overdrive', 'Soco de energia do sol: se acertar, cura 1 coração.', [
    { m: 'golpe', range: 1.5, arc: 1.2, hit: H(0.9, { st: 'queimar', sd: 3 }), look: 'sol' },
    { m: 'buff', what: 'roubo', v: 1 }]),
  k('rugido-do-dragao-de-fogo', 'Rugido de fogo em cone por meio segundo.', [
    { m: 'raio', len: 6, w: 0.5, cone: 2.4, dur: 0.5, tick: 0.1, hit: H(0.35, { st: 'queimar', sd: 3 }), look: 'bola' }]),
  k('adolla-burst', 'Aura de fogo em volta do caçador por 4 s.', [
    { m: 'zona', where: 'eu', follow: true, r: 2, dur: 4, tick: 0.4, hit: H(0.25, { st: 'queimar', sd: 3 }), look: 'bola' }]),
  k('lua-carmesim-de-benimaru', 'Bola de fogo lenta e enorme que explode longe.', [
    { m: 'proj', speed: 7, range: 8, r: 0.9, blast: 2.2, hit: H(1, { st: 'queimar', sd: 3 }), look: 'lua' }]),
  k('sol-cruel', 'Um sol forte fica pulsando em cima do alvo.', [
    { m: 'zona', where: 'alvo', r: 2.4, dur: 4, tick: 0.6, hit: H(0.4, { st: 'queimar', sd: 3 }), look: 'sol' }]),
  k('rasengan', 'Esfera que gruda no primeiro inimigo, mói e arremessa.', [
    { m: 'proj', speed: 9, range: 3, r: 0.5, moe: 0.6, hit: H(0.25, { kb: 9 }), look: 'esfera' }]),
  k('amor-puro', 'Marca 3 inimigos com corações que explodem cegando.', [
    { m: 'marca', n: 3, delay: 1.2, r: 1.1, hit: H(0.8, { st: 'cego', sd: 2.5 }), look: 'coracao' }], { custo: 'escudo' }),
  k('nascimento-das-arvores', 'Árvores brotam em volta, prendem e esmagam; se acertar, cura 1.', [
    { m: 'prender', where: 'area', r: 2.6, dur: 1.5, crush: H(0.6, { st: 'semente', sd: 2.5 }), look: 'raiz' },
    { m: 'buff', what: 'roubo', v: 1 }]),
  k('gura-gura-no-mi', 'Terremoto: onda de choque que joga longe e atordoa.', [
    { m: 'empurrar', r: 3.5, force: 10, hit: H(0.7, { st: 'atordoado', sd: 0.8 }) }]),
  k('gideon', '5 pedregulhos caem em volta do alvo.', [
    { m: 'chuva', where: 'area', n: 5, every: 0.2, r: 1.1, spread: 2.5, hit: H(0.8, { st: 'atordoado', sd: 0.5 }), look: 'rocha' }]),
  k('machado-e-mangual', 'O mangual gira em volta e joga longe.', [
    { m: 'orbita', n: 1, r: 1.8, dur: 2.5, speed: 7, tick: 0.4, hit: H(0.7, { kb: 6 }), look: 'martelo' }]),
  k('metade-gelo-metade-fogo', 'Gelo em fila e logo fogo por cima: DERRETE.', [
    { m: 'chuva', where: 'linha', n: 4, every: 0.06, r: 0.7, step: 1.3, hit: H(0.35, { st: 'congelado', sd: 1.2, el: 'Ice' }), look: 'gelo' },
    { m: 'proj', at: 0.45, speed: 12, range: 7, r: 0.5, hit: H(0.7, { st: 'queimar', sd: 3, el: 'Fire' }), pierce: true, look: 'bola' }]),
  k('adaga-de-baruka', 'Some e aparece atrás do alvo com a adaga de gelo.', [
    { m: 'investida', len: 8, w: 1, tele: true, hit: H(1.3, { st: 'corte', sd: 3, st2: 'lento', sd2: 2 }), look: 'gelo' }]),
  k('lotus-de-gelo', 'Flor de gelo em volta: congela e deixa o chão escorregando.', [
    { m: 'area', where: 'eu', r: 2.2, hit: H(0.8, { st: 'congelado', sd: 1.5 }), look: 'gelo' },
    { m: 'zona', where: 'eu', r: 2.2, dur: 2, tick: 0.5, hit: H(0.05, { st: 'lento', sd: 1 }), slow: 0.5, look: 'gelo' }]),
  k('presa-venenosa-de-kasaka', 'Bote de cobra: 3 de veneno de uma vez.', [
    { m: 'investida', len: 2.5, w: 0.5, hit: H(0.8, { st: 'veneno', sd: 4, n: 3 }) }]),
  k('demonio-do-veneno', 'Vira demônio do veneno por 5 s: aura que envenena e veneno não pega em você.', [
    { m: 'transformar', form: 'veneno', dur: 5, imuneStatus: true, aura: { r: 1.5, tick: 0.5, hit: H(0.2, { st: 'veneno', sd: 4 }) } }], { custo: 'escudo' }),
  k('mil-insetos', '6 insetos picam os inimigos por 5 s.', [
    { m: 'invocar', kind: 'insetos', n: 6, dur: 5, every: 0.5, range: 1.2, hit: H(0.1, { st: 'veneno', sd: 4 }) }]),
  k('braco-canhao', 'Segure para carregar o canhão do braço; solta um raio que fura escudo.', [
    { m: 'raio', len: 9, w: 0.5, dur: 0.2, tick: 1, charge: 1.2, hit: H(1.2, { fura: true, kb: 4 }), look: 'luz' }]),
  k('espada-do-cavaleiro-da-caveira', 'Corte que fere e devolve os tiros em volta.', [
    { m: 'golpe', range: 2.2, arc: 2.2, hit: H(1, { st: 'corte', sd: 3 }), look: 'espada' },
    { m: 'parar_tiros', r: 2, mode: 'devolve' }]),
  k('samehada', 'A espada-tubarão rouba mana a cada acerto.', [
    { m: 'golpe', range: 2, arc: 1.6, hit: H(0.7, { st: 'molhado', sd: 4, mana: 15 }), look: 'tubarao' }]),
  k('cinco-tubaroes-famintos', '5 tubarões caçam; quem derrotar cura 1 coração.', [
    { m: 'proj', path: 'persegue', n: 5, spread: 1.4, speed: 9, range: 10, r: 0.3, hit: H(0.35, { st: 'molhado', sd: 4, cura: 1 }), look: 'tubarao' }]),

  // ─── Épicas ───────────────────────────────────────────────────────────────
  k('espada-demoniaca-ragnarok', 'Onda negra gigante que fere, amaldiçoa e cura quem derrotar.', [
    { m: 'proj', speed: 10, range: 10, r: 1.1, hit: H(1.2, { st: 'corte', sd: 3, st2: 'amaldicoado', sd2: 3, cura: 1 }), pierce: true, look: 'lua' }]),
  k('dragao-das-chamas-negras', 'Dragão de fogo negro que avança enrolando em espiral.', [
    { m: 'proj', path: 'espiral', speed: 8, range: 11, r: 0.8, hit: H(0.9, { st: 'queimar', sd: 4, st2: 'amaldicoado', sd2: 3 }), pierce: true, look: 'dragao' }], { custo: 'escudo' }),
  k('kagune-liberado', '4 tentáculos de cristal em leque; derrotar cura.', [
    { m: 'raio', off: -0.6, len: 3.5, w: 0.35, dur: 0.15, tick: 1, hit: H(0.6, { st: 'corte', sd: 3, cura: 1 }), look: 'cristal' },
    { m: 'raio', at: 0.08, off: -0.2, len: 3.8, w: 0.35, dur: 0.15, tick: 1, hit: H(0.6, { st: 'corte', sd: 3, cura: 1 }), look: 'cristal' },
    { m: 'raio', at: 0.16, off: 0.2, len: 3.8, w: 0.35, dur: 0.15, tick: 1, hit: H(0.6, { st: 'corte', sd: 3, cura: 1 }), look: 'cristal' },
    { m: 'raio', at: 0.24, off: 0.6, len: 3.5, w: 0.35, dur: 0.15, tick: 1, hit: H(0.6, { st: 'corte', sd: 3, cura: 1 }), look: 'cristal' }], { custo: 'escudo' }),
  k('mjolnir', 'O martelo vai, volta e chama um raio em cada um que acerta.', [
    { m: 'proj', path: 'volta', speed: 11, range: 7, r: 0.5, hit: H(0.8, { st: 'eletrizado', sd: 3, zap: 0.5, kb: 3 }), pierce: true, look: 'martelo' }]),
  k('final-flash', 'Junta energia (cena) e solta um feixe gigante.', [
    { m: 'cinematica', dur: 0.5, style: 'carga' },
    { m: 'raio', at: 0.5, len: 12, w: 1.4, dur: 0.6, tick: 0.1, hit: H(0.45, { st: 'eletrizado', sd: 3 }), look: 'luz' }]),
  k('railgun', 'Moeda disparada: linha finíssima de dano enorme.', [
    { m: 'raio', len: 14, w: 0.22, dur: 0.08, tick: 1, hit: H(2.2, { fura: true, kb: 4 }), look: 'raio' }]),
  k('golpe-conquistador', 'Haki do Rei: atordoa e sela em volta; os fracos (até 25%) caem na hora.', [
    { m: 'area', where: 'eu', r: 3.5, hit: H(0.6, { st: 'atordoado', sd: 1.5, st2: 'selado', sd2: 3, abate: 0.25 }), look: 'cratera' }]),
  k('smash-do-one-for-all', 'Soco que solta um vendaval gigante.', [
    { m: 'golpe', range: 1.5, arc: 1.2, hit: H(1.2, { kb: 10 }), look: 'punho' },
    { m: 'proj', at: 0.05, speed: 14, range: 7, r: 1.2, hit: H(0.5, { kb: 9, el: 'Flying' }), pierce: true, look: 'ar' }], { custo: 'escudo' }),
  k('black-flash', 'Golpe sempre crítico; depois os 2 próximos golpes da arma também.', [
    { m: 'golpe', range: 1.4, arc: 0.9, hit: H(1.2, { crit: true, kb: 7 }), look: 'punho' },
    { m: 'buff', what: 'critico', v: 2 }]),
  k('united-states-of-smash', 'Cena e soco duplo para baixo: cratera que joga todos longe.', [
    { m: 'cinematica', dur: 0.35, style: 'foco' },
    { m: 'area', at: 0.35, where: 'frente', r: 2.8, hit: H(1.8, { kb: 12, st: 'atordoado', sd: 1, postura: 3 }), look: 'cratera' }], { custo: 'escudo' }),
  k('punho-kaiju', 'Um punho gigante desce do céu em cima do alvo.', [
    { m: 'chuva', where: 'alvo', n: 1, every: 0.5, r: 2, hit: H(1.6, { kb: 6, st: 'atordoado', sd: 1 }), look: 'punho' }], { custo: 'escudo' }),
  k('punho-divergente', 'Soco e, meio segundo depois, o segundo impacto no mesmo lugar.', [
    { m: 'golpe', range: 1.5, arc: 1.1, hit: H(0.7, { kb: 2 }), look: 'punho' },
    { m: 'area', at: 0.45, where: 'frente', r: 1.3, hit: H(0.9, { kb: 6 }), look: 'onda' }]),
  k('hinokami-kagura', 'Dança do sol: 6 cortes de fogo girando em círculo.', [
    { m: 'rajada', n: 6, every: 0.1, range: 2, arc: 1.4, spin: 1.05, hit: H(0.4, { st: 'queimar', sd: 3 }), look: 'sol' }]),
  k('rhitta', 'O machado do sol: corte enorme e uma explosão solar.', [
    { m: 'golpe', range: 2.4, arc: 2.2, hit: H(1.4, { st: 'queimar', sd: 3 }), look: 'lamina' },
    { m: 'area', at: 0.2, where: 'frente', r: 2.5, hit: H(0.8, { st: 'queimar', sd: 3 }), look: 'sol' }]),
  k('furia-de-kamish', 'Feixe de fogo em forma de cabeça de lagarto.', [
    { m: 'raio', len: 10, w: 1, dur: 0.4, tick: 0.1, hit: H(0.4, { st: 'queimar', sd: 3 }), look: 'lagarto' }], { custo: 'escudo' }),
  k('fogo-infernal', 'Pilar de fogo no alvo e o chão continua queimando.', [
    { m: 'area', where: 'alvo', r: 1.5, hit: H(0.8, { st: 'queimar', sd: 4 }), look: 'pilar' },
    { m: 'zona', where: 'alvo', r: 1.5, dur: 3, tick: 0.3, hit: H(0.3, { st: 'queimar', sd: 4 }), look: 'bola' }]),
  k('howitzer-impact', 'Tornado de fogo: anda girando em círculos, queima quem pega e explode no fim.', [
    { m: 'tornado', speed: 5, range: 7, r: 0.9, spin: 0.7, tick: 0.2, hit: H(0.25, { st: 'queimar', sd: 3 }), pull: 2, fim: { r: 2.4, hit: H(1, { st: 'queimar', sd: 4, kb: 6 }) }, look: 'bola' }]),
  k('rasenshuriken', 'Shuriken de vento: ao bater, abre uma esfera de lâminas que acerta muitas vezes.', [
    { m: 'proj', speed: 9, range: 9, r: 0.5, hit: H(0.6), abre: { r: 2.2, dur: 1.2, tick: 0.1, hit: H(0.15, { st: 'corte', sd: 3 }) }, look: 'shuriken' }], { custo: 'escudo' }),
  k('foice-da-morte', 'Foice larga que cega; os fracos (até 15%) caem na hora.', [
    { m: 'golpe', range: 2.8, arc: 3.4, hit: H(1.3, { st: 'cego', sd: 2.5, abate: 0.15 }), look: 'lamina' }], { custo: 'escudo' }),
  k('turbo', 'Modo turbo por 4 s: muito rápido e a esquiva não tem recarga.', [
    { m: 'transformar', form: 'turbo', dur: 4, speed: 1.8, dashFree: true }]),
  k('senbonzakura', 'Mil pétalas giram em volta e depois disparam nos inimigos.', [
    { m: 'orbita', n: 12, r: 1.4, dur: 2.5, speed: 5, tick: 0.2, hit: H(0.12, { st: 'corte', sd: 3 }), launch: true, look: 'petala' }]),
  k('funeral-do-deserto', 'A areia fecha o alvo num caixão e esmaga depois de 1 s.', [
    { m: 'prender', where: 'alvo', r: 1.4, dur: 1, crush: H(2, { st: 'lama', sd: 3 }), cr: 1.4, look: 'areia' }]),
  k('hakka-no-togame', 'Geada se espalha e vira flores de gelo que congelam tudo.', [
    { m: 'zona', where: 'alvo', r: 2.6, dur: 1.2, tick: 0.3, hit: H(0.15, { st: 'lento', sd: 1.5 }), look: 'gelo' },
    { m: 'area', at: 1.2, where: 'alvo', r: 2.6, hit: H(1.2, { st: 'congelado', sd: 2.5 }), look: 'gelo' }]),
  k('murasame', 'Um corte basta: envenena e derruba quem está abaixo de 30%.', [
    { m: 'golpe', range: 2, arc: 1.4, hit: H(0.9, { st: 'veneno', sd: 4, n: 2, abate: 0.3 }), look: 'lamina' }]),
  k('konjiki-ashisogi-jizo', 'Auréola dourada solta uma nuvem de veneno que deixa lento e cego.', [
    { m: 'zona', where: 'alvo', r: 2.8, dur: 4, tick: 0.5, hit: H(0.1, { st: 'veneno', sd: 4, st2: 'cego', sd2: 1 }), slow: 0.5, look: 'fumaca' }]),
  k('lanca-invertida-do-ceu', 'Lança que quebra escudos e bênçãos dos inimigos e apaga tiros.', [
    { m: 'proj', speed: 13, range: 8, r: 0.4, hit: H(1, { fura: true, quebra: true }), come: true, look: 'lanca' }]),
  k('katana-parte-alma', 'Corte reto que marca a alma: a marca explode depois.', [
    { m: 'raio', len: 6, w: 0.3, dur: 0.1, tick: 1, hit: H(1.4, { fura: true, st: 'marcado', sd: 0.8 }), look: 'lamina' }]),
  k('gae-bolg', 'Lança que persegue, não erra e se divide em 6 pontas.', [
    { m: 'proj', path: 'persegue', speed: 14, range: 14, r: 0.35, split: 6, hit: H(1.5, { fura: true }), look: 'lanca' }]),
  k('espada-z', 'Corte de luz em leque e as outras cartas recarregam 1,5 s.', [
    { m: 'golpe', range: 2.4, arc: 2.8, hit: H(1.2), look: 'luz' },
    { m: 'proj', n: 3, spread: 0.8, speed: 12, range: 6, r: 0.4, hit: H(0.4), pierce: true, look: 'luz' },
    { m: 'buff', what: 'recarga', v: 1.5 }]),
  k('kamehameha', 'Segure para carregar: quanto mais carrega, mais grosso o feixe.', [
    { m: 'raio', len: 12, w: 1, dur: 0.7, tick: 0.1, charge: 1.6, hit: H(0.35, { st: 'molhado', sd: 4, kb: 2 }), look: 'luz' }]),
  k('mil-tubaroes', 'Onda de 9 tubarões serpenteando; derrotar cura.', [
    { m: 'proj', path: 'onda', n: 9, spread: 1.2, speed: 8, range: 9, r: 0.3, hit: H(0.3, { st: 'molhado', sd: 4, cura: 1 }), look: 'tubarao' }]),

  // ─── Lendárias ────────────────────────────────────────────────────────────
  k('tensa-zangetsu', 'Bankai por 6 s: mais rápido e cada golpe da arma solta uma meia-lua negra.', [
    { m: 'transformar', form: 'bankai', dur: 6, speed: 1.5, dmg: 1.3, tiro: H(0.35, { st: 'amaldicoado', sd: 2 }) }]),
  k('contrato-com-o-diabo', 'Paga 1 CORAÇÃO: +80% de dano por 10 s e um diabo de sombra luta junto.', [
    { m: 'buff', what: 'pacto', v: 1.8, dur: 10 },
    { m: 'invocar', kind: 'diabo', dur: 10, every: 1, range: 2, hit: H(0.5, { st: 'amaldicoado', sd: 3 }) }], { custo: 'coracao', cd: 22 }),
  k('zoltraak', 'Cena: o tempo para e o círculo mágico abre. Três feixes que atravessam tudo e furam escudo.', [
    { m: 'cinematica', dur: 0.6, style: 'circulo' },
    { m: 'raio', at: 0.6, len: 14, w: 0.55, dur: 0.35, tick: 0.07, hit: H(0.5, { fura: true, quebra: true }), look: 'luz' },
    { m: 'raio', at: 0.72, off: -0.14, len: 14, w: 0.4, dur: 0.3, tick: 0.07, hit: H(0.35, { fura: true }), look: 'luz' },
    { m: 'raio', at: 0.84, off: 0.14, len: 14, w: 0.4, dur: 0.3, tick: 0.07, hit: H(0.35, { fura: true }), look: 'luz' }]),
  k('makankosappo', 'Segure para carregar: broca de luz finíssima em espiral, fura escudo.', [
    { m: 'raio', len: 14, w: 0.25, dur: 0.25, tick: 0.05, charge: 1.2, hit: H(0.6, { fura: true, postura: 2 }), look: 'luz' }]),
  k('big-bang-attack', 'Esfera de energia lenta com explosão enorme.', [
    { m: 'proj', speed: 7, range: 9, r: 0.7, blast: 3, hit: H(1.6, { st: 'eletrizado', sd: 3, kb: 6 }), look: 'esfera' }]),
  k('raigo', 'Cabeça de dragão de raio que persegue mordendo; cada mordida chama um raio.', [
    { m: 'proj', path: 'persegue', speed: 11, range: 12, r: 0.9, hit: H(1, { st: 'eletrizado', sd: 3, n: 2, zap: 0.5 }), pierce: true, look: 'dragao' }]),
  k('kirin', 'Cena: as nuvens fecham. Um dragão de raio cai no alvo.', [
    { m: 'cinematica', dur: 0.5, style: 'nuvem' },
    { m: 'chuva', at: 0.5, where: 'alvo', n: 1, every: 0.4, r: 2.5, hit: H(2.4, { fura: true, st: 'eletrizado', sd: 3 }), look: 'raio' }]),
  k('kamui-raikiri', 'Some num portal, aparece no alvo com o raio; o portal engole os tiros em volta.', [
    { m: 'parar_tiros', r: 3, mode: 'apaga' },
    { m: 'investida', at: 0.1, len: 9, w: 1, tele: true, hit: H(1.6, { fura: true, st: 'eletrizado', sd: 3 }), look: 'raio' }]),
  k('sessenta-e-quatro-palmas', '32 palmas seguidas: quem leva fica SELADO (não ataca).', [
    { m: 'rajada', n: 32, every: 0.03, range: 1.6, arc: 1.6, hit: H(0.07, { st: 'selado', sd: 3 }), fim: H(0.5, { kb: 8 }), look: 'mao' }]),
  k('kong-gun', 'Cena e o punho gigante: soco enorme e anel de choque.', [
    { m: 'cinematica', dur: 0.3, style: 'foco' },
    { m: 'area', at: 0.3, where: 'frente', r: 2, hit: H(2, { kb: 14, postura: 3 }), look: 'punho' },
    { m: 'empurrar', at: 0.35, r: 3.5, force: 8, hit: H(0.4) }], { custo: 'escudo' }),
  k('tita-de-ataque', 'Vira titã por 6 s: maior, mais forte de perto, pisadas que empurram.', [
    { m: 'transformar', form: 'tita', dur: 6, scale: 1.7, speed: 1.15, dmg: 1.5, noKnock: true, stomp: { r: 1.5, every: 0.6, hit: H(0.35, { kb: 5 }) } }], { custo: 'escudo' }),
  k('red-hawk', 'Soco de fogo com asas: avança e explode.', [
    { m: 'investida', len: 3, w: 1, hit: H(1.4, { st: 'queimar', sd: 4 }), look: 'asas' },
    { m: 'area', where: 'eu', r: 2, hit: H(0.6, { st: 'queimar', sd: 3 }), look: 'asas' }]),
  k('nona-forma-rengoku', 'Tigre de fogo: avança longe e deixa um rastro em chamas.', [
    { m: 'investida', len: 6, w: 1.3, hit: H(1.8, { st: 'queimar', sd: 4, kb: 6 }), rastro: { r: 0.9, dur: 2, tick: 0.3, hit: H(0.2, { st: 'queimar', sd: 3 }) }, look: 'tigre' }]),
  k('enuma-elish', 'Cena do vento e a broca vermelha: feixe enorme que puxa todos para dentro.', [
    { m: 'cinematica', dur: 0.5, style: 'vento' },
    { m: 'raio', at: 0.5, len: 13, w: 1.6, dur: 0.8, tick: 0.08, puxa: 4, hit: H(0.35, { fura: true }), look: 'ar' }]),
  k('genki-dama', 'Cena: a esfera cresce em cima da cabeça. Arremesso lento com área enorme.', [
    { m: 'cinematica', dur: 0.9, style: 'esfera' },
    { m: 'proj', at: 0.9, speed: 4, range: 10, r: 1.4, blast: 4, hit: H(3, { kb: 8, postura: 4 }), look: 'esfera' }], { cd: 16 }),
  k('nevoa-obscura', 'Névoa em volta: os inimigos dentro ficam cegos e perdem você de vista.', [
    { m: 'zona', where: 'eu', r: 3.5, dur: 5, tick: 0.5, hit: H(0.05, { st: 'cego', sd: 1 }), esconde: true, look: 'fumaca' }]),
  k('ataque-giratorio', 'Avança girando: cada um no caminho leva até 4 cortes.', [
    { m: 'investida', len: 5, w: 1.2, ticks: 4, hit: H(0.5, { st: 'corte', sd: 3 }), look: 'ar' }]),
  k('reigan', 'Segure para carregar o tiro do dedo: atravessa e cresce com a carga.', [
    { m: 'proj', speed: 18, range: 14, r: 0.3, charge: 1.2, hit: H(1.4, { st: 'cego', sd: 2 }), pierce: true, look: 'orbe' }]),
  k('buda-de-mil-maos', 'Cena das raízes: 12 mãos gigantes caem; +2 escudos e cura 1.', [
    { m: 'cinematica', dur: 0.4, style: 'raiz' },
    { m: 'chuva', at: 0.4, where: 'area', n: 12, every: 0.06, r: 1, spread: 3, hit: H(0.5, { st: 'semente', sd: 2.5 }), look: 'mao' },
    { m: 'buff', what: 'escudo', v: 2 },
    { m: 'buff', what: 'cura', v: 1 }]),
  k('beru-o-rei-formiga', 'ARISE: Beru, a formiga sombra, luta 15 s; quem ele derrota cura você.', [
    { m: 'invocar', kind: 'formiga', dur: 15, every: 0.6, range: 1.6, hit: H(0.55, { st: 'veneno', sd: 4, cura: 1 }) }]),
  k('matadora-de-dragoes', 'Espadona: dois golpes enormes, ida e volta; dobra contra os grandes.', [
    { m: 'golpe', at: 0.25, range: 3, arc: 3.4, hit: H(2.2, { kb: 10, postura: 4, fura: true, pesado: 1.5 }), look: 'espada' },
    { m: 'golpe', at: 0.7, off: 0.4, range: 3, arc: 3.4, hit: H(1.4, { kb: 8, postura: 3, pesado: 1.5 }), look: 'espada' }]),
  k('excalibur', 'Cena da luz e o feixe dourado que varre a sala.', [
    { m: 'cinematica', dur: 0.5, style: 'luz' },
    { m: 'raio', at: 0.5, len: 12, w: 1.2, dur: 0.5, tick: 0.1, sweep: 1.2, hit: H(0.45), look: 'luz' }]),
  k('star-burst-stream', '16 golpes com as duas espadas, invencível.', [
    { m: 'rajada', n: 16, every: 0.06, range: 1.8, arc: 1.5, hit: H(0.3, { st: 'corte', sd: 3 }), fim: H(0.6, { kb: 9 }), look: 'espada' }]),
  k('buraikan', 'Redemoinho de água subindo: puxa forte, molha e cura 1.', [
    { m: 'tornado', speed: 2, range: 4, r: 1.6, spin: 0.2, tick: 0.2, pull: 6, hit: H(0.25, { st: 'molhado', sd: 4 }), look: 'onda' },
    { m: 'buff', what: 'cura', v: 1 }]),

  // ─── Míticas e Desconhecidas ──────────────────────────────────────────────
  k('modo-demonio', 'Modo demônio por 8 s: mais rápido, mais forte, aura que amaldiçoa e estados não pegam.', [
    { m: 'parar_tiros', r: 3, mode: 'apaga' },
    { m: 'transformar', form: 'demonio', dur: 8, speed: 1.25, dmg: 1.6, imuneStatus: true, aura: { r: 1.8, tick: 0.5, hit: H(0.2, { st: 'amaldicoado', sd: 2 }) } }], { custo: 'escudo' }),
  k('bajrang-gun', 'Cena do céu: um punho dourado cai como meteoro.', [
    { m: 'cinematica', dur: 0.4, style: 'ceu' },
    { m: 'chuva', at: 0.4, where: 'alvo', n: 1, every: 0.6, r: 3.2, hit: H(3, { kb: 12, st: 'atordoado', sd: 2, postura: 5 }), look: 'punho' }]),
  k('gon-adulto', 'Vira adulto por 6 s: dano dobrado. Depois fica cansado (lento).', [
    { m: 'transformar', form: 'adulto', dur: 6, scale: 1.3, speed: 1.2, dmg: 2, cansa: 3 }], { custo: 'escudo' }),
  k('amaterasu', 'Chama negra no alvo: não apaga até ele cair e passa para o vizinho.', [
    { m: 'area', where: 'alvo', r: 0.9, hit: H(0.4, { st: 'chamaNegra', sd: 99 }), look: 'bola' }], { custo: 'escudo' }),
  k('decima-terceira-forma', '12 cortes de fogo um depois do outro fecham um círculo de chamas.', [
    { m: 'rajada', n: 12, every: 0.08, range: 2.4, arc: 0.9, spin: 0.52, hit: H(0.35, { st: 'queimar', sd: 3 }), look: 'sol' },
    { m: 'area', at: 1, where: 'eu', r: 2.6, hit: H(1.2, { st: 'queimar', sd: 4, fura: true }), look: 'sol' }]),
  k('tita-colossal', 'Vira o Titã Colossal por 8 s: gigante, pisadas de fogo, não é empurrado; sem esquiva. No fim, explosão de vapor.', [
    { m: 'transformar', form: 'colosso', dur: 8, scale: 2.2, speed: 0.8, dmg: 1.8, noDodge: true, noKnock: true,
      stomp: { r: 1.8, every: 0.55, hit: H(0.4, { st: 'queimar', sd: 3, kb: 6 }) },
      aura: { r: 2.2, tick: 0.5, hit: H(0.15, { st: 'queimar', sd: 3 }) },
      fim: { r: 3.5, hit: H(1.5, { st: 'queimar', sd: 4, kb: 10 }) } }], { custo: 'escudo', cd: 18 }),
  k('fuga', 'Cena do arco de fogo: a flecha explode numa cúpula de chamas.', [
    { m: 'cinematica', dur: 0.4, style: 'arco' },
    { m: 'proj', at: 0.4, speed: 16, range: 10, r: 0.35, hit: H(1.2, { st: 'queimar', sd: 4 }), abre: { r: 3, dur: 2.5, tick: 0.25, hit: H(0.25, { st: 'queimar', sd: 3 }) }, look: 'flecha' }]),
  k('vazio-roxo', 'Cena: a orbe vermelha e a azul se juntam. A esfera roxa apaga tudo em linha reta.', [
    { m: 'cinematica', dur: 0.7, style: 'orbes' },
    { m: 'proj', at: 0.7, speed: 6, range: 14, r: 1.6, hit: H(2.2, { fura: true, quebra: true }), pierce: true, come: true, rompe: true, look: 'esfera' }], { cd: 16 }),
  k('tengai-shinsei', 'Cena do céu: um meteoro cai no alvo e deixa o chão em lama.', [
    { m: 'cinematica', dur: 0.5, style: 'ceu' },
    { m: 'chuva', at: 0.5, where: 'alvo', n: 1, every: 0.7, r: 3.6, hit: H(3.2, { kb: 8, st: 'atordoado', sd: 1.5 }), look: 'meteoro' },
    { m: 'zona', at: 1.3, where: 'alvo', r: 3, dur: 3, tick: 0.5, hit: H(0.05, { st: 'lama', sd: 1 }), look: 'areia' }], { cd: 16 }),
  k('sanzen-sekai', 'Três mil mundos: atravessa com 3 cortes e deixa um tornado de lâminas.', [
    { m: 'investida', len: 5, w: 1.4, ticks: 3, hit: H(0.6, { st: 'corte', sd: 3 }), look: 'lamina' },
    { m: 'tornado', at: 0.2, speed: 3, range: 4, r: 1.2, spin: 0.3, tick: 0.15, hit: H(0.2, { st: 'corte', sd: 3 }), look: 'lamina' }], { custo: 'escudo' }),
  k('soco-serio', 'Cena e um soco sério: derruba todo inimigo comum à frente; chefe leva dano enorme.', [
    { m: 'cinematica', dur: 0.5, style: 'foco' },
    { m: 'golpe', at: 0.5, range: 9, arc: 1.4, hit: H(4, { abate: 1, fura: true, kb: 15, postura: 8 }), look: 'punho' }], { cd: 25 }),
  k('modo-100', 'Modo 100%: explosão psíquica e, por 6 s, ondas que empurram; os tiros param perto de você.', [
    { m: 'empurrar', r: 4, force: 12, hit: H(1) },
    { m: 'transformar', form: 'psiquico', dur: 6, dmg: 1.2, paraTiros: true, aura: { r: 2.5, tick: 1, hit: H(0.6, { kb: 6 }) } }]),
];

export const KIT_BY_CARD = new Map(KITS.map(x => [x.card, x]));
/** O kit da carta (a versão evoluída `id+` usa o kit da base). */
export const kitOf = (card: string): Kit | undefined => KIT_BY_CARD.get(card.replace(/\+$/, ''));
/** Assinatura do kit (peças + números) para o teste de "nunca iguais". */
export const kitSignature = (x: Kit) => JSON.stringify(x.moves);
