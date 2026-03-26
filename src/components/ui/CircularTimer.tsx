interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
}

export function CircularTimer({ timeLeft, totalTime, size = 72 }: CircularTimerProps) {
  const cx = size / 2;
  const r = cx - 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, timeLeft / totalTime);
  const offset = circ * (1 - pct);

  const urgent = timeLeft <= 10;
  const warning = timeLeft <= 20;
  const color = urgent ? "#ef4444" : warning ? "#fb923c" : "#00e5ff";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", overflow: "visible" }}
      >
        {/* Glow filter */}
        <defs>
          <filter id="timer-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={6}
        />

        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          filter="url(#timer-glow)"
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
          }}
        />
      </svg>

      {/* Number */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 700,
          fontSize: Math.round(size * 0.32),
          color,
          transition: "color 0.3s",
          animation: urgent ? "timer-pulse 0.6s ease-in-out infinite" : "none",
        }}
      >
        {timeLeft}
      </div>

      <style>{`
        @keyframes timer-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
