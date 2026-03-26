import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// ─── Card Variants ────────────────────────────────────────────────────────────
const cardVariants = cva(
  "relative rounded-lg text-card-foreground",
  {
    variants: {
      variant: {
        // ── DEFAULT — holo panel sutil, fundo de cards padrão ─────────────
        default: [
          "bg-[rgba(255,255,255,0.03)]",
          "border border-[rgba(0,229,255,0.09)]",
          "backdrop-blur-sm",
        ],
        // ── ELEVATED — painel com mais profundidade ────────────────────────
        elevated: [
          "bg-[rgba(255,255,255,0.055)]",
          "border border-[rgba(255,255,255,0.09)]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)]",
          "backdrop-blur-md",
        ],
        // ── INTERACTIVE — hover com borda iluminada estilo Destiny 2 ───────
        interactive: [
          "bg-[rgba(255,255,255,0.03)]",
          "border border-[rgba(0,229,255,0.09)]",
          "backdrop-blur-sm",
          "cursor-pointer",
          "transition-all duration-200 ease-out",
          "hover:bg-[rgba(0,229,255,0.05)]",
          "hover:border-[rgba(0,229,255,0.28)]",
          "hover:shadow-[0_0_32px_rgba(0,229,255,0.08),0_4px_24px_rgba(0,0,0,0.4)]",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
        ],
        // ── GLASS — backdrop forte, superfícies flutuantes ────────────────
        glass: [
          "bg-[rgba(255,255,255,0.06)]",
          "border border-[rgba(255,255,255,0.14)]",
          "backdrop-blur-xl",
          "shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        ],
        // ── ACCENT — borda verde cyber, destaque ──────────────────────────
        accent: [
          "bg-[rgba(34,197,94,0.04)]",
          "border border-[rgba(34,197,94,0.2)]",
          "backdrop-blur-sm",
          "shadow-[0_0_20px_rgba(34,197,94,0.06)]",
        ],
        // ── GOLD — recompensas e raridade ─────────────────────────────────
        gold: [
          "bg-[rgba(234,179,8,0.04)]",
          "border border-[rgba(234,179,8,0.18)]",
          "backdrop-blur-sm",
          "shadow-[0_0_20px_rgba(234,179,8,0.06)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

// ─── CardHeader ───────────────────────────────────────────────────────────────
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// ─── CardTitle ────────────────────────────────────────────────────────────────
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-lg font-semibold leading-none tracking-[0.02em] text-foreground",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ─── CardDescription ─────────────────────────────────────────────────────────
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ─── CardContent ──────────────────────────────────────────────────────────────
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ─── CardFooter ───────────────────────────────────────────────────────────────
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 gap-2",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ─── CardSeparator — linha divisória sutil ────────────────────────────────────
const CardSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn("border-0 border-t border-[rgba(255,255,255,0.06)] mx-6", className)}
    {...props}
  />
));
CardSeparator.displayName = "CardSeparator";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardSeparator,
  cardVariants,
};
