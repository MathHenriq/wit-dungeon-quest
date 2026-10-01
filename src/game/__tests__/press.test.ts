import { describe, expect, it } from 'vitest';
import { buyPaper, edition, LIDE, lideHits, lideText, pautas, pressEvents, publish } from '../press';
import { addPhoto, sanitizePhotos, type Photo } from '../photos';
import { newProgress, sanitizeProgress } from '../progress';

describe('matéria (lide)', () => {
  it('cada pauta tem a resposta certa entre as opções, sem repetir, e a fala cita os fatos', () => {
    for (let seed = 1; seed < 40; seed++) {
      const ps = pautas(20_400 + seed, seed, 7);
      expect(ps).toHaveLength(3);
      expect(new Set(ps.map(p => p.event.id)).size).toBe(3);
      for (const p of ps) for (const s of LIDE) {
        expect(p.options[s]).toContain(p.event[s]);
        expect(new Set(p.options[s]).size).toBe(p.options[s].length);
        expect(p.options[s].length).toBeGreaterThanOrEqual(2);
      }
    }
    // a testemunha conta o que aconteceu (o aluno tira o lide da fala)
    for (const e of pressEvents(20_400, 7)) expect(e.fala.toLowerCase()).toContain(e.onde.replace(/^(no|na|nas|nos) /, '').toLowerCase());
  });
  it('conta as partes certas e monta a frase', () => {
    const p = pautas(20_400, 3, 5)[0];
    const right = { quem: p.event.quem, oque: p.event.oque, onde: p.event.onde, quando: p.event.quando };
    expect(lideHits(p, right)).toBe(4);
    expect(lideHits(p, { ...right, onde: 'em Marte' })).toBe(3);
    expect(lideText({ quem: 'a turma', oque: 'fez algo', onde: 'na praça', quando: 'ontem' })).toBe('A turma fez algo na praça, ontem.');
  });
});

describe('jornalzinho', () => {
  it('custa 1 moeda por dia e mostra as matérias do aluno primeiro', () => {
    let p = { ...newProgress(), coins: 3 };
    const r = buyPaper(p, 100);
    expect('progress' in r && r.progress.coins).toBe(2);
    p = (r as { progress: typeof p }).progress;
    expect('progress' in buyPaper(p, 100) && (buyPaper(p, 100) as { progress: typeof p }).progress.coins).toBe(2);
    expect('reason' in buyPaper({ ...p, coins: 0 }, 101)).toBe(true);
    p = publish(p, 100, 'O robô catou o lixo.', 'f1');
    const ed = edition(100, p, 90);
    expect(ed.manchete).toBe('O robô catou o lixo.');
    expect(ed.materias[0]).toMatchObject({ foto: 'f1', minha: true });
    expect(ed.numero).toBe(10);
    expect(edition(20_727, p).numero).toBe(1);
    // sobrevive ao salvar
    const back = sanitizeProgress(JSON.parse(JSON.stringify(p)));
    expect(back.materias[0].text).toBe('O robô catou o lixo.');
    expect(back.jornalDia).toBe(100);
  });
});

describe('álbum de fotos', () => {
  const ph = (id: string): Photo => ({ id, data: 'data:image/jpeg;base64,AA', zona: 'wit', lugar: 'x', hora: 1, t: 1 });
  it('guarda as 8 mais novas e descarta lixo', () => {
    let l: Photo[] = [];
    for (let k = 0; k < 10; k++) l = addPhoto(l, ph(`f${k}`));
    expect(l).toHaveLength(8);
    expect(l[0].id).toBe('f9');
    expect(sanitizePhotos([ph('a'), { id: 'b', data: 'javascript:1' }, null])).toHaveLength(1);
  });
});
