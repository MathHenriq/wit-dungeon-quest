import { cn } from "@/lib/utils";

type StatVariant = "health" | "energy" | "xp" | "boss" | "legendary";

interface StatBarProps {
  label?: string;
  current: number;
  max: number;
  variant?: StatVariant;
  showNumbers?: boolean;
  animated?: boolean;
  thick?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<
  StatVariant,
  { fill: string; glow: string; track: string; text: string }
> = {
  health: {
    fill: "linear-gradient(90deg, #dc2626, #ef4444, #f87171)",
    glow: "rgba(239, 68, 68, 0.5)",
    track: "rgba(220, 38, 38, 0.1)",
    text: "#f87171",
  },
  energy: {
    fill: "linear-gradient(90deg, #0284c7, #00d9ff, #38bdf8)",
    glow: "rgba(0, 217, 255, 0.5)",
    track: "rgba(0, 217, 255, 0.08)",
    text: "#00d9ff",
  },
  xp: {
    fill: "linear-gradient(90deg, #15803d, #22c55e, #4ade80)",
    glow: "rgba(74, 222, 128, 0.5)",
    track: "rgba(74, 222, 128, 0.08)",
    text: "#4ade80",
  },
  boss: {
    fill: "linear-gradient(90deg, #7e1d1d, #dc2626, #ef4444)",
    glow: "rgba(220, 38, 38, 0.6)",
    track: "rgba(120, 0, 0, 0.2)",
    text: "#ef4444",
  },
  legendary: {
    fill: "linear-gradient(90deg, #7e22ce, #a855f7, #c084fc)",
    glow: "rgba(168, 85, 247, 0.5)",
    track: "rgba(168, 85, 247, 0.08)",
    text: "#c084fc",
  },
};

/**
 * AAA-tier stat bar — Apex/Valorant aesthetic.
 * Gradient fill with glow, shimmer sweep, segmented dividers.
 */
export function StatBar({
  label,
  current,
  max,
  variant = "health",
  showNumbers = true,
  animated = true,
  thick = false,
  className,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const cfg = VARIANT_CONFIG[variant];
  const height = thick ? 14 : 8;
  const segments = thick ? 10 : 5;

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showNumbers) && (
        <div className="flex items-center justify-between">
          {label && (
            <span
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {label}
            </span>
          )}
          {showNumbers && (
            <span
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: cfg.text,
                letterSpacing: "0.04em",
              }}
            >
              {current} / {max}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          position: "relative",
          height,
          borderRadius: height / 2,
          background: cfg.track,
          overflow: "hidden",
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct}%`,
            background: cfg.fill,
            borderRadius: height / 2,
            boxShadow: `0 0 ${thick ? 12 : 8}px ${cfg.glow}`,
            transition: animated ? "width 0.7s cubic-bezier(0.4,0,0.2,1)" : "none",
          }}
        >
          {/* Shimmer sweep */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: animated ? "shimmer-sweep 2.5s linear infinite" : "none",
            }}
          />
          {/* Top shine */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "rgba(255,255,255,0.12)",
              borderRadius: `${height / 2}px ${height / 2}px 0 0`,
            }}
          />
        </div>

        {/* Segment dividers */}
        {thick &&
          Array.from({ length: segments - 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${((i + 1) / segments) * 100}%`,
                width: 1,
                background: "rgba(0,0,0,0.4)",
                zIndex: 2,
              }}
            />
          ))}
      </div>
    </div>
  );
}
