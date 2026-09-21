import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type {
  AttributeType,
  ClassType,
  ElementType,
} from './skillsRegistry';
import { CLASS_ATTRIBUTES, ELEMENT_EFFECTIVENESS } from './skillsRegistry';
import { getActiveEvolutions, type Evolution } from './evolutionsRegistry';

// Precisa do client com sessão (supabaseStudent), não do anônimo — caso
// contrário o RLS owner-only de student_class_profile / student_attribute_points
// retorna 0 linhas mesmo o aluno estando logado.
// As tabelas da Onda 11 (student_class_profile, student_attribute_points,
// student_skill_points, student_unlocked_skills, element_mastery_log) ja
// constam nos tipos gerados, entao o cast `as any` que existia aqui — e que
// desligava a verificacao de TODAS as queries deste modulo — saiu.
const db = supabaseStudent;

export interface ClassProfile {
  studentId: string;
  classType: ClassType | null;
  primaryElement: ElementType | null;
  secondaryElement: ElementType | null;
  choseClassAt: string | null;
  isVeteranOnboarded: boolean;
}

export type AttributePoints = Record<AttributeType, number>;

const EMPTY_ATTRIBUTES: AttributePoints = {
  forca: 0,
  destreza: 0,
  inteligencia: 0,
  carisma: 0,
  agilidade: 0,
  resistencia: 0,
};

// As colunas class_type / primary_element / secondary_element sao texto livre
// no banco. Enquanto este modulo usava `as any`, um valor fora do dominio
// chegava intacto ao motor de batalha e silenciosamente zerava a afinidade de
// classe. Os dominios vem das proprias tabelas do registry, entao nao ha lista
// duplicada para sair de sincronia.
function toClassType(raw: string | null | undefined): ClassType | null {
  return raw && raw in CLASS_ATTRIBUTES ? (raw as ClassType) : null;
}

function toElementType(raw: string | null | undefined): ElementType | null {
  return raw && raw in ELEMENT_EFFECTIVENESS ? (raw as ElementType) : null;
}

export async function getClassProfile(studentId: string): Promise<ClassProfile | null> {
  const { data, error } = await db
    .from('student_class_profile')
    .select('student_id, class_type, primary_element, secondary_element, chose_class_at, is_veteran_onboarded')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    studentId:          data.student_id,
    classType:          toClassType(data.class_type),
    primaryElement:     toElementType(data.primary_element),
    secondaryElement:   toElementType(data.secondary_element),
    choseClassAt:       data.chose_class_at ?? null,
    isVeteranOnboarded: !!data.is_veteran_onboarded,
  };
}

export async function getStudentAttributes(studentId: string): Promise<AttributePoints> {
  const { data, error } = await db
    .from('student_attribute_points')
    .select('forca, destreza, inteligencia, carisma, agilidade, resistencia')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ...EMPTY_ATTRIBUTES };

  return {
    forca:        data.forca        ?? 0,
    destreza:     data.destreza     ?? 0,
    inteligencia: data.inteligencia ?? 0,
    carisma:      data.carisma      ?? 0,
    agilidade:    data.agilidade    ?? 0,
    resistencia:  data.resistencia  ?? 0,
  };
}

export async function getUnlockedSkillIds(studentId: string): Promise<string[]> {
  const { data, error } = await db
    .from('student_unlocked_skills')
    .select('skill_id')
    .eq('student_id', studentId);

  if (error) throw error;
  return (data ?? []).map((row: { skill_id: string }) => row.skill_id);
}

export async function getActiveEvolutionsForStudent(studentId: string): Promise<Evolution[]> {
  const attrs = await getStudentAttributes(studentId);
  return getActiveEvolutions(attrs);
}

// Onda 11.5 — pool de pontos disponível / total ganho
export interface SkillPoints {
  available: number;
  total:     number;
}

export async function getSkillPoints(studentId: string): Promise<SkillPoints> {
  const { data, error } = await db
    .from('student_skill_points')
    .select('available_points, total_earned')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return {
    available: data?.available_points ?? 0,
    total:     data?.total_earned     ?? 0,
  };
}

// Onda 11.5 — quais elementos o aluno já dominou (libera secundário)
export async function getMasteredElements(studentId: string): Promise<string[]> {
  const { data, error } = await db
    .from('element_mastery_log')
    .select('element')
    .eq('student_id', studentId);
  if (error) throw error;
  return (data ?? []).map((r: { element: string }) => r.element);
}
