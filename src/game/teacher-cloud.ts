// Telas do professor ligadas ao banco (supabase/migrations/*_wit2_teacher.sql e
// _wit2_social.sql). Sem o banco ligado, devolvem dados de demonstração para a
// tela /professor/aula-demo continuar mostrando como fica.
import { cloudEnabled, rpc, rpcTeacher } from './cloud';
import type { PackId } from './packs';

export interface StudentRow { id: string; nome: string; apelido: string | null; andar: number; moedas: number; cartas: number; ultimo: string | null; suspeitas: number; presencas: number }
export interface StudentCard {
  andar: number; profissao: string | null; caminho: string | null; stats: Record<string, number>; moedas: number;
  porRaridade: Record<string, number>; aulas: { dia: string; status: string }[]; eventos: { kind: string; value: number; at: string }[];
}
export interface Mission { id: number; title: string; kind: MissionKind; target: number; pack: PackId; starts: string; ends: string; progress: number; ativa: boolean; pegaram?: number; peguei?: boolean }
export interface TeacherOpt { id: string; nome: string; alunos: number }

/** Contadores do jogo que a missão da sala pode usar (iguais a wit2_stat_keys). */
export const MISSION_KINDS = [
  { id: 'mesas', label: 'mesas da Torre vencidas' },
  { id: 'peixes', label: 'peixes pescados' },
  { id: 'colheitas', label: 'colheitas na fazenda' },
  { id: 'entregas', label: 'entregas feitas' },
  { id: 'minijogos', label: 'minijogos jogados' },
  { id: 'vendas', label: 'itens vendidos no Mercado' },
  { id: 'pvpVitorias', label: 'vitórias no PvP' },
] as const;
export type MissionKind = typeof MISSION_KINDS[number]['id'];
export const kindLabel = (k: string) => MISSION_KINDS.find(m => m.id === k)?.label ?? k;

/** Quanto falta, em %, travado em 0..100. */
export const missionPct = (m: Pick<Mission, 'progress' | 'target'>) => Math.max(0, Math.min(100, Math.round((m.progress / m.target) * 100)));

// ─── demonstração ────────────────────────────────────────────────────────────
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const DEMO_STUDENTS: StudentRow[] = [
  { id: 'd1', nome: 'Ana Souza', apelido: 'Aninha', andar: 7, moedas: 840, cartas: 61, ultimo: ago(2), suspeitas: 0, presencas: 9 },
  { id: 'd2', nome: 'Beto Lima', apelido: 'Betão', andar: 12, moedas: 2310, cartas: 88, ultimo: ago(20), suspeitas: 0, presencas: 8 },
  { id: 'd3', nome: 'Caio Reis', apelido: 'CaioGamer', andar: 3, moedas: 120, cartas: 34, ultimo: ago(150), suspeitas: 2, presencas: 4 },
  { id: 'd4', nome: 'Duda Alves', apelido: 'Duda', andar: 9, moedas: 1500, cartas: 70, ultimo: ago(1), suspeitas: 0, presencas: 10 },
];
const DEMO_CARD: StudentCard = {
  andar: 7, profissao: 'pescador', caminho: 'sabio', stats: { mesas: 41, peixes: 63, entregas: 12, minijogos: 30 }, moedas: 840,
  porRaridade: { common: 30, uncommon: 18, rare: 9, epic: 3, legendary: 1 },
  aulas: [{ dia: '2026-10-07', status: 'foi_bem' }, { dia: '2026-10-03', status: 'presente' }, { dia: '2026-09-30', status: 'excepcional' }],
  eventos: [{ kind: 'stat:mesas', value: 3, at: ago(2) }, { kind: 'pacote:raro', value: 1, at: ago(3) }, { kind: 'troca', value: 1, at: ago(26) }, { kind: 'chefe', value: 7, at: ago(30) }],
};
const DEMO_MISSIONS: Mission[] = [
  { id: 1, title: 'Juntos: 200 mesas na semana', kind: 'mesas', target: 200, pack: 'incomum', starts: ago(72), ends: ago(-96), progress: 137, ativa: true, pegaram: 0 },
  { id: 2, title: 'Festival da pesca', kind: 'peixes', target: 150, pack: 'comum', starts: ago(200), ends: ago(30), progress: 162, ativa: false, pegaram: 14 },
];

const live = () => cloudEnabled();
export const teacherStudents = (teacher?: string) => (live() ? rpcTeacher<StudentRow[]>('wit2_teacher_students', { p_teacher: teacher ?? null }) : Promise.resolve(DEMO_STUDENTS));
export const teacherStudent = (id: string) => (live() ? rpcTeacher<StudentCard>('wit2_teacher_student', { p_student: id }) : Promise.resolve(DEMO_CARD));
export const teacherMissions = (teacher?: string) => (live() ? rpcTeacher<Mission[]>('wit2_teacher_missions', { p_teacher: teacher ?? null }) : Promise.resolve(DEMO_MISSIONS));
export const createMission = (title: string, kind: MissionKind, target: number, pack: PackId, days: number) =>
  (live() ? rpcTeacher<number>('wit2_teacher_mission_create', { p_title: title, p_kind: kind, p_target: target, p_pack: pack, p_days: days }) : Promise.resolve(3));
export const endMission = (id: number) => (live() ? rpcTeacher<boolean>('wit2_teacher_mission_end', { p_id: id }) : Promise.resolve(true));
/** A virada WIT 1 → WIT 2 (só o master). Desligada: o botão só liga quando o Matheus decidir o dia. */
export const VIRADA_LIGADA = false;
export interface MigrateStatus { alunos: number; migrados: number; teste: number; itensSemCarta: string[] }
export const migrateStatus = () => (live() ? rpcTeacher<MigrateStatus>('wit2_migrate_status') : Promise.resolve<MigrateStatus>({ alunos: 112, migrados: 0, teste: 3, itensSemCarta: ['Poção Pequena', 'Bandeira da Guilda'] }));
export const migrateAll = () => {
  if (!VIRADA_LIGADA) return Promise.reject(new Error('A virada está desligada.'));
  return rpcTeacher<{ migrados: number; falhas: { aluno: string; erro: string }[] }>('wit2_migrate_all');
};
export const masterTeachers = () => (live() ? rpcTeacher<TeacherOpt[]>('wit2_master_teachers') : Promise.resolve<TeacherOpt[]>([]));

// aluno: missões da sala
export const myClassMissions = () => (live() ? rpc<Mission[]>('wit2_class_missions_mine').catch(() => [] as Mission[]) : Promise.resolve<Mission[]>([]));
export const claimMission = (id: number) => rpc<boolean>('wit2_mission_claim', { p_id: id });
