// DailyCoinBar — Patch 2.3
//
// HUD strip that shows the student how many coins they've earned today
// against the diminishing-returns thresholds (500 → 75 %, 750 → 50 %).
// Pure read view; the actual cap is enforced server-side by the
// apply_daily_coin_cap RPC. Hovering shows a tooltip with the policy.
//
// Visual: very compact (fits in the header), glassmorphism dark, color
// shifts between green / amber / red as the student crosses zones.

import { useQuery } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GameIcon } from '@/components/icons/GameIcon';

interface DailySummary {
  earned_today: number;
  cap_zone: 'green' | 'yellow' | 'red';
  next_threshold: number | null;
  current_multiplier: number;
}

const ZONE_COLOR: Record<DailySummary['cap_zone'], { bar: string; bg: string; text: string }> = {
  green:  { bar: '#4ade80', bg: 'rgba(74,222,128,0.10)',  text: '#4ade80' },
  yellow: { bar: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  text: '#fbbf24' },
  red:    { bar: '#f87171', bg: 'rgba(248,113,113,0.10)', text: '#f87171' },
};

export function useDailyCoinsSummary() {
  return useQuery<DailySummary | null>({
    queryKey: ['daily-coins-summary'],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabaseStudent.rpc('get_daily_coins_summary');
      if (error) {
        console.warn('[DailyCoinBar] get_daily_coins_summary error:', error);
        return null;
      }
      return data as DailySummary;
    },
  });
}

interface Props {
  /** Optional compact mode for tight headers. */
  compact?: boolean;
}

export function DailyCoinBar({ compact = false }: Props) {
  const { data } = useDailyCoinsSummary();
  if (!data) return null;

  const earned = data.earned_today;
  const zone   = data.cap_zone;
  const color  = ZONE_COLOR[zone];
  const mult   = data.current_multiplier;

  // Progress bar: % toward the NEXT threshold (500 → 750 → cap).
  // After 750 there's no further threshold, so we just peg the bar at 100 %.
  let pct = 0;
  let label = '';
  if (data.next_threshold === 500) {
    pct = Math.min(100, (earned / 500) * 100);
    label = `${earned} / 500`;
  } else if (data.next_threshold === 750) {
    pct = Math.min(100, ((earned - 500) / (750 - 500)) * 100);
    label = `${earned} / 750`;
  } else {
    pct = 100;
    label = `${earned}+ (cap)`;
  }

  const tooltip =
    'Cap diário: ganhos integrais até 500. ' +
    '500–750 → drops em 75%. Acima de 750 → drops em 50%. ' +
    'Reseta à meia-noite (BRT).';

  return (
    <div
      title={tooltip}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: compact ? '4px 8px' : '6px 10px',
        background: color.bg,
        border: `1px solid ${color.bar}55`,
        borderRadius: 8,
        minWidth: compact ? 140 : 180,
        cursor: 'help',
      }}
    >
      <GameIcon id="coin" size={compact ? 14 : 16} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6,
          fontFamily: "'Share Tech Mono', monospace", fontSize: compact ? 9 : 10,
          letterSpacing: '1px', color: color.text,
        }}>
          <span style={{ opacity: 0.85 }}>HOJE</span>
          <span style={{ fontWeight: 700 }}>
            {label}
            {mult < 1 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>· ×{mult.toFixed(2)}</span>
            )}
          </span>
        </div>
        <div style={{
          marginTop: 3, height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: color.bar,
            transition: 'width .4s ease, background .25s ease',
            borderRadius: 'inherit',
          }} />
        </div>
      </div>
    </div>
  );
}
