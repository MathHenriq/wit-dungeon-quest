import { describe, expect, it } from 'vitest';
import { kindLabel, MISSION_KINDS, missionPct, teacherStudents } from '../teacher-cloud';
import { readFileSync } from 'node:fs';

describe('telas do professor', () => {
  it('porcentagem da missão trava em 0..100', () => {
    expect(missionPct({ progress: 50, target: 200 })).toBe(25);
    expect(missionPct({ progress: 300, target: 200 })).toBe(100);
  });
  it('os tipos de missão são os mesmos contadores que o banco conta', () => {
    const sql = readFileSync('supabase/migrations/20261008120000_wit2_core.sql', 'utf8');
    const keys = sql.match(/SELECT ARRAY\[([^\]]+)\]\s*\$\$;/)![1].split(',').map(s => s.trim().replace(/'/g, ''));
    expect(MISSION_KINDS.map(k => k.id).sort()).toEqual(keys.sort());
    expect(kindLabel('peixes')).toMatch(/peixes/);
  });
  it('sem banco ligado: dados de demonstração', async () => {
    expect((await teacherStudents()).length).toBeGreaterThan(0);
  });
});
