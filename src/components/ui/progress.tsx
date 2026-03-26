import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// ─── Variant Config ───────────────────────────────────────────────────────────
type ProgressVariant = "default" | "health" | "xp" | "mana" | "gold";

interface VariantStyle {
  track: string;
  bar: string;
  glow: string;
  criticalGlow?: string;
}

const VARIANTS: Record<ProgressVariant, VariantStyle> = {
  // Cyan → roxo (padrão, genérico)
  default: {
    track: "bg-[rgba(0,229,255,0.06)]",
    bar:   "bg-[linear-gradient(90deg,hsl(187,100%,40%)_0%,hsl(262,83%,58%)_100%)]",
    glow:  "shadow-[0_0_8px_rgba(0,229,255,0.35)]",
  },
  // Laranja → vermelho (HP)
  health: {
    track: "bg-[rgba(239,68,68,0.1)]",
    bar:   "bg-[linear-gradient(90deg,hsl(16,100%,55%)_0%,hsl(0,89%,56%)_100%)]",
    glow:  "shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    criticalGlow: "shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-[glow-breathe_1s_ease-in-out_infinite]",
  },
  // Ciano → verde (XP)
  xp: {
    track: "bg-[rgba(34,197,94,0.08)]",
    bar:   "bg-[linear-gradient(90deg,hsl(187,100%,44%)_0%,hsl(145,80%,45%)_100%)]",
    glow:  "shadow-[0_0_8px_rgba(34,197,94,0.3)]",
  },
  // Azul → índigo (Mana)
  mana: {
    track: "bg-[rgba(99,102,241,0.1)]",
    bar:   "bg-[linear-gradient(90deg,hsl(210,100%,60%)_0%,hsl(245,85%,65%)_100%)]",
    glow:  "shadow-[0_0_8px_rgba(99,102,241,0.35)]",
  },
  // Âmbar → ouro (Moedas, ouro)
  gold: {
    track: "bg-[rgba(234,179,8,0.08)]",
    bar:   "bg-[linear-gradient(90deg,hsl(38,90%,50%)_0%,hsl(45,96%,60%)_100%)]",
    glow:  "shadow-[0_0_8px_rgba(234,179,8,0.35)]",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProgressProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    "value"
  > {
  value?: number;
  /** Valor máximo (default: 100) */
  max?: number;
  /** Variante visual */
  variant?: ProgressVariant;
  /** Altura da barra */
  size?: "xs" | "sm" | "md" | "lg";
  /** Mostra label "valor/max" dentro ou acima da barra */
  showLabel?: boolean;
  /** Texto customizado no label (sobreescreve valor/max) */
  label?: string;
}

const SIZE_CLASSES: Record<NonNullable<ProgressProps["size"]>, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

// ─── Component ────────────────────────────────────────────────────────────────
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      size = "md",
      showLabel = false,
      label,
      ...props
    },
    ref,
  ) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const isCritical = variant === "health" && pct < 20;
    const styles = VARIANTS[variant];

    const labelText = label ?? `${Math.round(value)}/${max}`;

    return (
      <div className="w-full">
        {/* Label acima da barra */}
        {showLabel && size !== "xs" && size !== "sm" && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-[0.6rem] font-display font-semibold tracking-[0.1em] uppercase text-muted-foreground">
              {variant !== "default" && variant}
            </span>
            <span className="text-[0.65rem] font-mono font-semibold text-foreground/70">
              {labelText}
            </span>
          </div>
        )}

        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative w-full overflow-hidden rounded-full",
            SIZE_CLASSES[size],
            styles.track,
            className,
          )}
          value={pct}
          max={100}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              styles.bar,
              isCritical ? styles.criticalGlow : styles.glow,
            )}
            style={{ width: `${pct}%` }}
          />

          {/* Label inline para barras grandes */}
          {showLabel && size === "lg" && (
            <span
              className="absolute inset-0 flex items-center justify-end pr-2 text-[0.6rem] font-mono font-bold text-white/80 pointer-events-none"
              aria-hidden="true"
            >
              {labelText}
            </span>
          )}
        </ProgressPrimitive.Root>

        {/* Pulse crítico — barra "tremendo" quando HP crítico */}
        {isCritical && (
          <div
            className="mt-0.5 text-[0.6rem] font-display font-bold tracking-[0.12em] uppercase text-destructive animate-[glow-breathe_1s_ease-in-out_infinite]"
            role="alert"
            aria-live="polite"
          >
            ⚠ CRÍTICO
          </div>
        )}
      </div>
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
