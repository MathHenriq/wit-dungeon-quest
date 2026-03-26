import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// ─── Badge Variants ───────────────────────────────────────────────────────────
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 px-2.5 py-0.5",
    "font-display text-[0.65rem] font-semibold tracking-[0.08em] uppercase",
    "rounded-md border",
    "transition-colors duration-150",
    "select-none",
  ],
  {
    variants: {
      variant: {
        // ── DEFAULT — cyan cyber ───────────────────────────────────────────
        default: [
          "bg-[rgba(0,229,255,0.1)] border-[rgba(0,229,255,0.3)] text-primary",
        ],
        // ── SUCCESS — verde, completado ────────────────────────────────────
        success: [
          "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] text-success",
        ],
        // ── WARNING — âmbar, atenção ───────────────────────────────────────
        warning: [
          "bg-[rgba(234,179,8,0.1)] border-[rgba(234,179,8,0.3)] text-[hsl(var(--gold))]",
        ],
        // ── ERROR — vermelho, perigo ───────────────────────────────────────
        error: [
          "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-destructive",
        ],
        // ── INFO — azul diamante ───────────────────────────────────────────
        info: [
          "bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.3)] text-[hsl(210,100%,66%)]",
        ],
        // ── XP — verde XP (rewards) ───────────────────────────────────────
        xp: [
          "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.25)] text-success",
        ],
        // ── GOLD — moedas, raridade ───────────────────────────────────────
        gold: [
          "bg-[rgba(234,179,8,0.1)] border-[rgba(234,179,8,0.3)] text-[hsl(var(--gold))]",
        ],
        // ── LEGENDARY — roxo, lendário ────────────────────────────────────
        legendary: [
          "bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.35)] text-[hsl(262,83%,75%)]",
        ],
        // ── SECONDARY — backward compat ───────────────────────────────────
        secondary: [
          "bg-secondary/60 border-border/50 text-secondary-foreground",
        ],
        // ── DESTRUCTIVE — backward compat ─────────────────────────────────
        destructive: [
          "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.3)] text-destructive",
        ],
        // ── OUTLINE — backward compat ──────────────────────────────────────
        outline: [
          "bg-transparent border-border text-foreground",
        ],
      },
      // ── Modificador outline: remove fundo, mantém apenas borda/texto ──────
      outline: {
        true: "bg-transparent",
        false: "",
      },
    },
    compoundVariants: [
      // Ajustes de outline por variante
      { variant: "default",     outline: true, class: "border-[rgba(0,229,255,0.45)]   text-primary" },
      { variant: "success",     outline: true, class: "border-[rgba(34,197,94,0.45)]   text-success" },
      { variant: "warning",     outline: true, class: "border-[rgba(234,179,8,0.45)]   text-[hsl(var(--gold))]" },
      { variant: "error",       outline: true, class: "border-[rgba(239,68,68,0.45)]   text-destructive" },
      { variant: "info",        outline: true, class: "border-[rgba(59,130,246,0.45)]  text-[hsl(210,100%,66%)]" },
      { variant: "legendary",   outline: true, class: "border-[rgba(168,85,247,0.5)]   text-[hsl(262,83%,75%)]" },
      { variant: "gold",        outline: true, class: "border-[rgba(234,179,8,0.5)]    text-[hsl(var(--gold))]" },
    ],
    defaultVariants: {
      variant: "default",
      outline: false,
    },
  },
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Ponto decorativo antes do label */
  dot?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
function Badge({ className, variant, outline, dot, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, outline }), className)}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
