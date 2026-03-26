import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type NeonVariant = "primary" | "secondary" | "danger" | "gold" | "ghost";
type NeonSize = "sm" | "md" | "lg";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeonVariant;
  size?: NeonSize;
  glow?: boolean;
}

const VARIANT_STYLES: Record<
  NeonVariant,
  { bg: string; border: string; color: string; hoverGlow: string; hoverBorder: string }
> = {
  primary: {
    bg: "linear-gradient(135deg, rgba(0,217,255,0.12), rgba(157,78,221,0.12))",
    border: "rgba(0,217,255,0.35)",
    color: "#00d9ff",
    hoverGlow: "0 0 24px rgba(0,217,255,0.4), 0 0 48px rgba(0,217,255,0.15)",
    hoverBorder: "rgba(0,217,255,0.8)",
  },
  secondary: {
    bg: "transparent",
    border: "rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.7)",
    hoverGlow: "0 0 16px rgba(255,255,255,0.1)",
    hoverBorder: "rgba(255,255,255,0.4)",
  },
  danger: {
    bg: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))",
    border: "rgba(239,68,68,0.4)",
    color: "#f87171",
    hoverGlow: "0 0 24px rgba(239,68,68,0.4), 0 0 48px rgba(239,68,68,0.15)",
    hoverBorder: "rgba(239,68,68,0.8)",
  },
  gold: {
    bg: "linear-gradient(135deg, rgba(255,214,10,0.12), rgba(251,146,60,0.08))",
    border: "rgba(255,214,10,0.4)",
    color: "#ffd60a",
    hoverGlow: "0 0 24px rgba(255,214,10,0.4), 0 0 48px rgba(255,214,10,0.15)",
    hoverBorder: "rgba(255,214,10,0.8)",
  },
  ghost: {
    bg: "transparent",
    border: "transparent",
    color: "rgba(255,255,255,0.35)",
    hoverGlow: "none",
    hoverBorder: "rgba(255,255,255,0.15)",
  },
};

const SIZE_STYLES: Record<NeonSize, { padding: string; fontSize: number; gap: number }> = {
  sm: { padding: "6px 14px", fontSize: 11, gap: 6 },
  md: { padding: "9px 20px", fontSize: 12, gap: 8 },
  lg: { padding: "12px 28px", fontSize: 14, gap: 10 },
};

/**
 * AAA-tier neon button — Destiny 2 / Valorant aesthetic.
 * Gradient background, animated border glow, shimmer on hover.
 */
export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      glow = true,
      className,
      disabled,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const v = VARIANT_STYLES[variant];
    const s = SIZE_STYLES[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn("relative overflow-hidden group", className)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: s.gap,
          padding: s.padding,
          fontSize: s.fontSize,
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          borderRadius: 8,
          background: v.bg,
          border: `1px solid ${v.border}`,
          color: v.color,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          userSelect: "none",
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            const el = e.currentTarget;
            el.style.transform = "translateY(-2px) scale(1.02)";
            el.style.borderColor = v.hoverBorder;
            if (glow) el.style.boxShadow = v.hoverGlow;
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "";
          el.style.borderColor = v.border;
          el.style.boxShadow = "";
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          if (!disabled) e.currentTarget.style.transform = "translateY(0) scale(0.97)";
        }}
        onMouseUp={(e) => {
          if (!disabled) e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        }}
        {...props}
      >
        {/* Shimmer sweep on hover */}
        <span
          className="absolute inset-0 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          }}
        />
        <span className="relative z-10 flex items-center gap-[inherit]">
          {children}
        </span>
      </button>
    );
  }
);
NeonButton.displayName = "NeonButton";
