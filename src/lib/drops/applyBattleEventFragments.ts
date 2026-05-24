// Patch 5.3 — call apply_battle_event_fragments after a kill.
// Server-side rolls 30% (or guaranteed 5 for bosses) per active event.
// Returns the drops so the UI can show "+1 Fragmento" toasts.

import { supabaseStudent } from '@/integrations/supabase/studentClient';

export interface EventFragmentDrop {
  eventId:   string;
  eventName: string;
  amount:    number;
}

interface RpcDrop { event_id: string; event_name: string; amount: number }

export async function applyBattleEventFragments(isBoss: boolean): Promise<EventFragmentDrop[]> {
  const { data, error } = await supabaseStudent.rpc('apply_battle_event_fragments', { p_is_boss: isBoss });
  if (error) {
    console.warn('[applyBattleEventFragments] error', error);
    return [];
  }
  const drops = ((data as { drops?: RpcDrop[] } | null)?.drops ?? []) as RpcDrop[];
  return drops.map(d => ({ eventId: d.event_id, eventName: d.event_name, amount: d.amount }));
}
