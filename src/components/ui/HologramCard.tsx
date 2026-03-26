import { cn } from "@/lib/utils";

interface HologramCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  noHover?: boolean;
  noPadding?: boolean;
}

/**
 * Hologram-style card — Destiny 2 / SAO aesthetic.
 * Corner bracket accents, glass blur, neon border on hover.
 */
export function HologramCard({
  children,
  className,
  accentColor = "#00d9ff",
  noHover = false,
  noPadding = false,
}: HologramCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        "glass-heavy",
        !noHover && "transition-all duration-300 group",
        className
      )}
      style={
        !noHover
          ? ({ "--accent": accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {/* Inner glow on hover */}
      {!noHover && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accentColor}08 0%, transparent 60%)`,
            boxShadow: `inset 0 0 0 1px ${accentColor}40`,
          }}
        />
      )}

      {/* Corner bracket TL */}
      <div
        className="absolute top-0 left-0 w-5 h-5 pointer-events-none z-10"
        style={{
          borderTop: `2px solid ${accentColor}`,
          borderLeft: `2px solid ${accentColor}`,
          borderRadius: "4px 0 0 0",
          opacity: 0.7,
        }}
      />
      {/* Corner bracket TR */}
      <div
        className="absolute top-0 right-0 w-5 h-5 pointer-events-none z-10"
        style={{
          borderTop: `2px solid ${accentColor}`,
          borderRight: `2px solid ${accentColor}`,
          borderRadius: "0 4px 0 0",
          opacity: 0.7,
        }}
      />
      {/* Corner bracket BL */}
      <div
        className="absolute bottom-0 left-0 w-5 h-5 pointer-events-none z-10"
        style={{
          borderBottom: `2px solid ${accentColor}`,
          borderLeft: `2px solid ${accentColor}`,
          borderRadius: "0 0 0 4px",
          opacity: 0.7,
        }}
      />
      {/* Corner bracket BR */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none z-10"
        style={{
          borderBottom: `2px solid ${accentColor}`,
          borderRight: `2px solid ${accentColor}`,
          borderRadius: "0 0 4px 0",
          opacity: 0.7,
        }}
      />

      {/* Content */}
      <div className={cn("relative z-10", !noPadding && "p-5")}>
        {children}
      </div>
    </div>
  );
}
