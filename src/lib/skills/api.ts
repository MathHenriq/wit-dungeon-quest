import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type {
  AttributeType,
  ClassType,
  ElementType,
} from './skillsRegistry';
import { getActiveEvolutions, type Evolution } from './evolutionsRegistry';

// Precisa do client com sessão (supabaseStudent), não do anônimo — caso
// contrário o RLS owner-only de student_class_profile / student_attribute_points
// retorna 0 linhas mesmo o aluno estando logado.
// Database types não foram regenerados ainda para as 6 tabelas da Onda 11.
// Usamos cast pontual em vez de poluir o client global.
const db = supabaseStudent as any;

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
    classType:          data.class_type ?? null,
    primaryElement:     data.primary_element ?? null,
    secondaryElement:   data.secondary_element ?? null,
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
