import { describe, expect, it } from 'vitest';
import { atRisk, codeOk, delivery, lessonCode, nextStatus, packOf } from '../lesson';

describe('aula de hoje', () => {
  it('um toque passa pelos 4 estados; pacote padrão e trocado', () => {
    expect(nextStatus('faltou')).toBe('presente');
    expect(nextStatus('excepcional')).toBe('faltou');
    expect(packOf({ studentId: 'a', status: 'foi_bem' })).toBe('raro');
    expect(packOf({ studentId: 'a', status: 'foi_bem', pack: 'mitico' })).toBe('mitico');
    expect(packOf({ studentId: 'a', status: 'faltou', pack: 'mitico' })).toBeNull();
  });
  it('a entrega resume a aula', () => {
    const d = delivery([
      { studentId: 'a', status: 'faltou' }, { studentId: 'b', status: 'presente' },
      { studentId: 'c', status: 'excepcional' }, { studentId: 'd', status: 'presente', pack: null },
    ]);
    expect(d.grants).toEqual([{ studentId: 'b', pack: 'comum' }, { studentId: 'c', pack: 'epico' }]);
    expect(d.present).toBe(3);
    expect(d.rate).toBe(0.75);
    expect(d.packs).toEqual({ comum: 1, epico: 1 });
  });
  it('código de 4 dígitos troca a cada 30 s e aceita o anterior', () => {
    const t = 1_000_000_020_000;
    const c = lessonCode('aula-7', t);
    expect(c).toMatch(/^\d{4}$/);
    expect(codeOk('aula-7', c, t + 25_000)).toBe(true);
    expect(codeOk('aula-7', c, t + 65_000)).toBe(false);
    expect(lessonCode('aula-8', t)).not.toBe(c);
  });
  it('em risco: 2 faltas seguidas nas últimas aulas', () => {
    expect(atRisk([['presente', 'faltou'], ['faltou', 'faltou'], ['faltou', 'presente']])).toEqual([0]);
  });
});

describe('relatório do professor', () => {
  it('presença por aula e por aluno, retorno depois da falta, desempenho e CSV', async () => {
    const { lessonsCsv, performanceMix, presenceByLesson, returnAfterAbsence, studentRates } = await import('../lesson');
    // 3 aulas, 2 alunos
    const h = [['presente', 'faltou'], ['foi_bem', 'faltou'], ['excepcional', 'presente']] as const;
    const hist = h.map(a => [...a]);
    expect(presenceByLesson(hist)).toEqual([0.5, 0.5, 1]);
    expect(studentRates(hist)).toEqual([1, 1 / 3]);
    expect(returnAfterAbsence(hist)).toBe(2);
    expect(performanceMix(hist)).toEqual({ presente: 2, foi_bem: 1, excepcional: 1 });
    const csv = lessonsCsv(['Ana', 'Beto, o "B"'], hist, ['01/10', '02/10', '03/10']).split('\n');
    expect(csv[0]).toBe('aluno,01/10,02/10,03/10,presenca');
    expect(csv[2]).toBe('"Beto, o ""B""",faltou,faltou,presente,0.33');
  });
});
