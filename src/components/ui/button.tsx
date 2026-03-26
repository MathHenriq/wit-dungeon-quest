import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Button Variants ──────────────────────────────────────────────────────────
const buttonVariants = cva(
  [
    // Base
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-display font-semibold tracking-[0.08em] uppercase",
    "transition-all duration-200 ease-out",
    "select-none cursor-pointer",
    // Focus
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
    // Icon auto-sizing
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Overflow for shine effect
    "overflow-hidden",
  ],
  {
    variants: {
      variant: {
        // ── PRIMARY — verde cyber, ação principal ──────────────────────────
        primary: [
          "bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.35)] text-success",
          "hover:bg-[rgba(34,197,94,0.15)] hover:border-[rgba(34,197,94,0.6)]",
          "hover:shadow-[0_0_24px_rgba(34,197,94,0.3),inset_0_0_24px_rgba(34,197,94,0.04)]",
          "hover:-translate-y-px active:translate-y-px active:shadow-none",
          "before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-200",
          "before:bg-[linear-gradient(135deg,rgba(34,197,94,0.08),transparent_60%)]",
          "hover:before:opacity-100",
        ],
        // ── DEFAULT — cyan cyber (backward compat) ─────────────────────────
        default: [
          "bg-[rgba(0,229,255,0.07)] border border-[rgba(0,229,255,0.3)] text-primary",
          "hover:bg-[rgba(0,229,255,0.14)] hover:border-[rgba(0,229,255,0.55)]",
          "hover:shadow-[0_0_24px_rgba(0,229,255,0.25),inset_0_0_24px_rgba(0,229,255,0.04)]",
          "hover:-translate-y-px active:translate-y-px active:shadow-none",
          "before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-200",
          "before:bg-[linear-gradient(135deg,rgba(0,229,255,0.08),transparent_60%)]",
          "hover:before:opacity-100",
        ],
        // ── SECONDARY — outline limpo ──────────────────────────────────────
        secondary: [
          "bg-transparent border border-[rgba(255,255,255,0.1)] text-foreground/75",
          "hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.22)] hover:text-foreground",
          "hover:-translate-y-px active:translate-y-px",
        ],
        // ── GHOST — sem borda ──────────────────────────────────────────────
        ghost: [
          "bg-transparent border border-transparent text-foreground/55",
          "hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground/90",
          "hover:border-[rgba(255,255,255,0.07)]",
          "active:bg-[rgba(255,255,255,0.1)]",
        ],
        // ── DANGER — destrutivo vermelho ───────────────────────────────────
        danger: [
          "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.35)] text-destructive",
          "hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.6)]",
          "hover:shadow-[0_0_24px_rgba(239,68,68,0.3)]",
          "hover:-translate-y-px active:translate-y-px active:shadow-none",
        ],
        // ── DESTRUCTIVE — backward compat, alias de danger ─────────────────
        destructive: [
          "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.35)] text-destructive",
          "hover:bg-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.6)]",
          "hover:shadow-[0_0_24px_rgba(239,68,68,0.3)]",
          "hover:-translate-y-px active:translate-y-px active:shadow-none",
        ],
        // ── OUTLINE — backward compat shadcn ──────────────────────────────
        outline: [
          "bg-transparent border border-input text-foreground",
          "hover:bg-accent/10 hover:text-accent-foreground",
        ],
        // ── GOLD — recompensas, destaque premium ───────────────────────────
        gold: [
          "bg-[rgba(234,179,8,0.08)] border border-[rgba(234,179,8,0.35)] text-[hsl(var(--gold))]",
          "hover:bg-[rgba(234,179,8,0.15)] hover:border-[rgba(234,179,8,0.6)]",
          "hover:shadow-[0_0_24px_rgba(234,179,8,0.3)]",
          "hover:-translate-y-px active:translate-y-px active:shadow-none",
        ],
        // ── LINK ───────────────────────────────────────────────────────────
        link: [
          "text-primary underline-offset-4 hover:underline",
          "border-transparent bg-transparent p-0 h-auto",
          "normal-case tracking-normal font-medium",
        ],
      },
      size: {
        sm:      "h-8  px-3   text-[0.7rem]  rounded-md  [&_svg]:size-3.5",
        default: "h-10 px-5   text-xs        rounded-lg  [&_svg]:size-4",
        md:      "h-10 px-5   text-xs        rounded-lg  [&_svg]:size-4",
        lg:      "h-12 px-7   text-sm        rounded-lg  [&_svg]:size-5",
        icon:    "h-10 w-10   text-xs        rounded-lg  [&_svg]:size-4",
        "icon-sm": "h-8 w-8   text-xs        rounded-md  [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Mostra spinner e desabilita o botão */
  loading?: boolean;
  /** Ícone renderizado antes do texto */
  icon?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {/* Leading icon or loading spinner */}
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        ) : null}

        {/* Label */}
        {children && (
          <span className="relative z-10">{children}</span>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
