import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Primitives (pass-through) ────────────────────────────────────────────────
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ─── Overlay ──────────────────────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Base
      "fixed inset-0 z-50",
      // Blur + dark overlay
      "bg-black/65 backdrop-blur-[3px]",
      // Radix animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-200",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ─── Content ──────────────────────────────────────────────────────────────────
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Position
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        // Size
        "w-full max-w-lg",
        // Glassmorphism panel
        "bg-[rgba(10,14,26,0.92)] backdrop-blur-xl",
        "border border-[rgba(0,229,255,0.14)]",
        "rounded-xl",
        // Inner glow on border
        "shadow-[0_0_0_1px_rgba(0,229,255,0.06),0_24px_64px_rgba(0,0,0,0.65)]",
        // Radix animations — scale + fade
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        // Accent line at top
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-[linear-gradient(90deg,transparent,rgba(0,229,255,0.4),transparent)]",
        "before:rounded-t-xl",
        className,
      )}
      {...props}
    >
      {children}

      {/* Close button — estilo gaming */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 z-10",
          "flex items-center justify-center w-7 h-7",
          "rounded-md",
          "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]",
          "text-muted-foreground",
          "transition-all duration-150",
          "hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.3)] hover:text-destructive",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:pointer-events-none",
        )}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ─── Header ───────────────────────────────────────────────────────────────────
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 px-6 pt-6 pb-4",
      "border-b border-[rgba(255,255,255,0.05)]",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// ─── Footer ───────────────────────────────────────────────────────────────────
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end",
      "border-t border-[rgba(255,255,255,0.05)]",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

// ─── Body ─────────────────────────────────────────────────────────────────────
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

// ─── Title ────────────────────────────────────────────────────────────────────
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-base font-semibold tracking-[0.04em] text-foreground pr-8",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ─── Description ──────────────────────────────────────────────────────────────
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
  DialogDescription,
};
