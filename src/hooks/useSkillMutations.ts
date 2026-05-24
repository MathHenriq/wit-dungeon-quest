// ============================================================
// Onda 11.5 — mutations da árvore de skills (unlock + reset).
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { toast } from 'sonner';
import type { ElementType } from '@/lib/skills/skillsRegistry';

interface UnlockArgs {
  skillId:       string;
  cost:          number;
  prerequisites: string[];
}

interface UnlockResult {
  success:           boolean;
  error?:            string;
  missing?:          string;
  spent?:            number;
  available_points?: number;
  skill_id?:         string;
}

interface ResetArgs {
  element:        ElementType;
  /** Soma exata dos custos das skills atualmente desbloqueadas (do skillsRegistry). */
  totalSpent:     number;
}

interface ResetResult {
  success:           boolean;
  error?:            string;
  refund?:           number;
  skills_removed?:   number;
  cooldown_ends_at?: string;
}

export function useUnlockSkill(studentId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillId, cost, prerequisites }: UnlockArgs): Promise<UnlockResult> => {
      const { data, error } = await supabaseStudent.rpc(
        'unlock_skill' as never,
        { p_skill_id: skillId, p_cost: cost, p_prerequisites: prerequisites } as never,
      );
      if (error) throw error;
      return data as unknown as UnlockResult;
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error('Não foi possível desbloquear', { description: humanizeError(res.error) });
        return;
      }
      toast.success('Skill desbloqueada!');
      qc.invalidateQueries({ queryKey: ['skills', 'unlocked', studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'pool',     studentId] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Falha ao desbloquear', { description: msg });
    },
  });
}

export function useResetElement(studentId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ element, totalSpent }: ResetArgs): Promise<ResetResult> => {
      const { data, error } = await supabaseStudent.rpc(
        'reset_skill_element' as never,
        { p_element: element, p_total_spent_override: totalSpent } as never,
      );
      if (error) throw error;
      return data as unknown as ResetResult;
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error('Reset bloqueado', { description: humanizeError(res.error) });
        return;
      }
      toast.success(`Elemento resetado — +${res.refund ?? 0} pontos devolvidos`);
      qc.invalidateQueries({ queryKey: ['skills', 'unlocked',     studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'pool',         studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'classProfile', studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'mastery',      studentId] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Falha ao resetar', { description: msg });
    },
  });
}

// ─── Onda 11.8 — flag de tutorial ───────────────────────────────────────────

export function useCompleteTutorial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; error?: string }> => {
      const { data, error } = await supabaseStudent.rpc('complete_my_tutorial' as never);
      if (error) throw error;
      return data as unknown as { success: boolean; error?: string };
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error('Não foi possível concluir o tutorial', { description: humanizeError(res.error) });
        return;
      }
      // Invalida a query do aluno em todos os formatos possíveis (paranoia útil
      // porque diferentes hooks usam chaves diferentes pra "student").
      qc.invalidateQueries({ predicate: q => {
        const k = q.queryKey[0];
        return k === 'student' || k === 'students' || k === 'studentDB' || k === 'me';
      } });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Falha ao salvar progresso', { description: msg });
    },
  });
}

// ─── Onda 11.7 — check mastery + swap de elemento ───────────────────────────

import type { ElementType as RegistryElement } from '@/lib/skills/skillsRegistry';

interface CheckMasteryResult {
  success:         boolean;
  error?:          string;
  newly_mastered?: string[];
}

/** Dispara o check no servidor — idempotente. Cria pending_rewards + action_log
 *  para cada elemento recém-dominado e devolve a lista (front mostra o modal). */
export function useCheckElementMastery(studentId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CheckMasteryResult> => {
      if (!studentId) return { success: false, error: 'no_student' };
      const { data, error } = await supabaseStudent.rpc(
        'check_element_mastery' as never,
        { p_student_id: studentId } as never,
      );
      if (error) throw error;
      return data as unknown as CheckMasteryResult;
    },
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['skills', 'mastery', studentId] });
      }
    },
  });
}

interface SwapArgs {
  newElement:    RegistryElement;
  removeElement: RegistryElement | null;   // null = ocupa slot vago (1º secundário)
  refund:        number;                   // 0 quando removeElement é null
}

interface SwapResult {
  success:           boolean;
  error?:            string;
  mode?:             'add_secondary' | 'swap';
  slot?:             'primary' | 'secondary';
  primary_element?:  string;
  secondary_element?: string;
  removed?:          string;
  skills_removed?:   number;
  refund?:           number;
}

export function useSwapElement(studentId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ newElement, removeElement, refund }: SwapArgs): Promise<SwapResult> => {
      const { data, error } = await supabaseStudent.rpc(
        'swap_secondary_element' as never,
        {
          p_new_element:    newElement,
          p_remove_element: removeElement,
          p_refund:         refund,
        } as never,
      );
      if (error) throw error;
      return data as unknown as SwapResult;
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error('Não foi possível trocar', { description: humanizeError(res.error) });
        return;
      }
      if (res.mode === 'add_secondary') {
        toast.success('Elemento secundário adicionado!');
      } else {
        toast.success(`Elementos atualizados — +${res.refund ?? 0} pontos devolvidos`);
      }
      qc.invalidateQueries({ queryKey: ['skills', 'classProfile', studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'unlocked',     studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'pool',         studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'mastery',      studentId] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Falha ao trocar elemento', { description: msg });
    },
  });
}

// ─── Onda 11.6 — gasto de ponto em atributo ─────────────────────────────────

import type { AttributeType } from '@/lib/skills/skillsRegistry';

interface SpendAttrResult {
  success:             boolean;
  error?:              string;
  attribute?:          AttributeType;
  new_value?:          number;
  available_points?:   number;
  unlocked_evolutions?: string[];
}

export function useSpendAttributePoint(studentId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attribute: AttributeType): Promise<SpendAttrResult> => {
      const { data, error } = await supabaseStudent.rpc(
        'spend_attribute_point' as never,
        { p_attribute: attribute } as never,
      );
      if (error) throw error;
      return data as unknown as SpendAttrResult;
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error('Não foi possível investir', { description: humanizeError(res.error) });
        return;
      }
      // Toast de evolução desbloqueada é responsabilidade do componente
      // (ele tem o nome humanizado da passiva); aqui só invalidamos.
      qc.invalidateQueries({ queryKey: ['skills', 'attributes', studentId] });
      qc.invalidateQueries({ queryKey: ['skills', 'pool',       studentId] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Falha ao investir ponto', { description: msg });
    },
  });
}

function humanizeError(code: string | undefined): string {
  switch (code) {
    case 'prerequisite_missing':   return 'Pré-requisitos ainda não desbloqueados.';
    case 'not_enough_points':      return 'Pontos insuficientes.';
    case 'already_unlocked':       return 'Skill já desbloqueada.';
    case 'invalid_cost':           return 'Custo inválido.';
    case 'invalid_attribute':      return 'Atributo inválido.';
    case 'invalid_element':        return 'Elemento inválido.';
    case 'element_not_mastered':   return 'Elemento ainda não foi dominado.';
    case 'secondary_already_chosen': return 'Você já escolheu um elemento secundário — não dá pra resetar.';
    case 'cooldown_active':        return 'Cooldown de 7 dias ainda ativo.';
    case 'no_skills_to_reset':     return 'Nenhuma skill desbloqueada neste elemento.';
    case 'student_not_found':      return 'Aluno não encontrado.';
    case 'class_not_chosen':       return 'Você precisa escolher classe e elemento primeiro.';
    case 'new_already_active':     return 'Este elemento já é um dos seus ativos.';
    case 'remove_required':        return 'Slot ocupado — escolha qual elemento abandonar.';
    case 'remove_not_active':      return 'Você não tem esse elemento ativo no momento.';
    default:                       return code ?? 'erro desconhecido';
  }
}
