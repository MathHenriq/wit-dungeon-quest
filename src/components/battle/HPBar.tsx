import { motion } from 'framer-motion';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HPBarProps {
  label:      string;
  current:    number;
  max:        number;
  /** Render energy bar below HP */
  energy?:    number;
  energyMax?: number;
  /** Flip layout to the right side (enemy) */
  flip?:      boolean;
  /** Status badge to show (e.g. "burn", "freeze") */
  status?:    string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 0.5) return '#22c55e'; // green-500
  if (pct > 0.25) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

function hpGlow(pct: number): string {
  if (pct > 0.5) return 'rgba(34,197,94,0.5)';
  if (pct > 0.25) return 'rgba(234,179,8,0.5)';
  return 'rgba(239,68,68,0.5)';
}

const STATUS_ICONS: Record<string, string> = {
  burn:     '🔥', poison:   '☠️', freeze:   '❄️',
  paralyze: '⚡', sleep:    '💤', confuse:  '😵',
  blind:    '🙈', stun:     '💫', bleed:    '🩸',
  curse:    '💀', wet:      '💧', fear:     '😨',
  atk_up:   '⬆️', def_up:  '🛡️', speed_up: '💨',
  atk_down: '⬇️', def_down:'🔽', speed_down:'🐢',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HPBar({ label, current, max, energy, energyMax, flip, status }: HPBarProps) {
  const hpPct    = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const energyPct = energyMax ? Math.max(0, Math.min(1, (energy ?? 0) / energyMax)) : 0;

  const barColor = hpColor(hpPct);
  const glowColor = hpGlow(hpPct);

  return (
    <div
      className="flex flex-col gap-1 w-full"
      style={{ direction: flip ? 'rtl' : 'ltr' }}
    >
      {/* Name + status */}
      <div className="flex items-center gap-2" style={{ direction: 'ltr' }}>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>

        {status && STATUS_ICONS[status] && (
          <span
            title={status}
            style={{
              fontSize: '0.75rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4,
              padding: '1px 5px',
            }}
          >
            {STATUS_ICONS[status]} {status}
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.8rem',
            color: barColor,
            fontWeight: 600,
            textShadow: `0 0 8px ${glowColor}`,
            direction: 'ltr',
          }}
        >
          {current}/{max}
        </span>
      </div>

      {/* HP bar */}
      <div
        style={{
          width: '100%',
          height: 10,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: barColor,
            boxShadow: `0 0 8px ${glowColor}`,
            borderRadius: 6,
          }}
          initial={false}
          animate={{ width: `${hpPct * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Energy bar (player only) */}
      {energyMax != null && (
        <>
          <div
            className="flex items-center justify-between"
            style={{ direction: 'ltr' }}
          >
            <span style={{ fontSize: '0.7rem', color: 'rgba(0,229,255,0.7)', letterSpacing: 1 }}>
              ENERGIA
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(0,229,255,0.9)', fontWeight: 600 }}>
              {energy ?? 0}/{energyMax}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(0,229,255,0.15)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
                boxShadow: '0 0 6px rgba(0,229,255,0.4)',
                borderRadius: 4,
              }}
              initial={false}
              animate={{ width: `${energyPct * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </>
      )}
    </div>
  );
}
