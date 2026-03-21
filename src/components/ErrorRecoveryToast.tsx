import { useEffect, useRef } from "react";
import { toast } from "sonner";

const REJECTION_THRESHOLD = 3;   // erros não tratados consecutivos para disparar
const REJECTION_WINDOW_MS = 5000; // janela de tempo

function showReloadToast() {
  toast.error("O sistema está com problemas", {
    description: "Deseja recarregar a página?",
    action: {
      label: "Recarregar agora",
      onClick: () => window.location.reload(),
    },
    duration: Infinity,
    id: "error-recovery", // evita duplicatas
  });
}

export function ErrorRecoveryToast() {
  const rejectionCount = useRef(0);
  const rejectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastShown = useRef(false);

  useEffect(() => {
    // ── 1. Vite HMR failures (dev only) ───────────────────────────
    if (import.meta.hot) {
      import.meta.hot.on("vite:error", () => {
        if (!toastShown.current) {
          toastShown.current = true;
          showReloadToast();
        }
      });
    }

    // ── 2. Unhandled promise rejections ───────────────────────────
    const handleRejection = () => {
      rejectionCount.current += 1;

      // Reset counter after the window
      if (rejectionTimer.current) clearTimeout(rejectionTimer.current);
      rejectionTimer.current = setTimeout(() => {
        rejectionCount.current = 0;
      }, REJECTION_WINDOW_MS);

      if (rejectionCount.current >= REJECTION_THRESHOLD && !toastShown.current) {
        toastShown.current = true;
        showReloadToast();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      if (rejectionTimer.current) clearTimeout(rejectionTimer.current);
    };
  }, []);

  return null;
}
