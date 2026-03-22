import { Settings, X } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";

interface Props {
  onClose: () => void;
}

export function AccessibilitySettings({ onClose }: Props) {
  const { settings, update } = useAccessibility();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações de acessibilidade"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm rounded-xl"
        style={{
          background: "rgba(10,14,26,0.97)",
          border: "1px solid rgba(0,229,255,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-xl"
          style={{
            background: "rgba(10,14,26,0.97)",
            borderBottom: "1px solid rgba(0,229,255,0.08)",
          }}
        >
          <div className="flex items-center gap-2 text-cyan-400">
            <Settings size={18} />
            <h2
              className="font-bold text-white text-base"
              style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}
            >
              ACESSIBILIDADE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 1. Alto Contraste */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="font-semibold text-white text-sm"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                Alto Contraste
              </p>
              <p className="text-white/40 text-xs">Aumenta o contraste visual para melhor legibilidade</p>
            </div>
            <button
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => update({ highContrast: !settings.highContrast })}
              className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-200"
              style={{
                background: settings.highContrast
                  ? "rgba(0,229,255,0.4)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                style={{ left: settings.highContrast ? "28px" : "4px" }}
              />
            </button>
          </div>

          {/* 2. Modo Daltonismo */}
          <div>
            <p
              className="font-semibold text-white text-sm mb-1"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              Modo Daltonismo
            </p>
            <p className="text-white/40 text-xs mb-2">Aplica filtro de cor para diferentes tipos</p>
            <select
              value={settings.colorBlindMode}
              onChange={(e) =>
                update({
                  colorBlindMode: e.target.value as AccessibilitySettings["colorBlindMode"],
                })
              }
              className="w-full px-3 py-2 rounded-lg text-sm text-white/80"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                outline: "none",
              }}
            >
              <option value="none">Nenhum</option>
              <option value="deuteranopia">Deuteranopia (verde-vermelho)</option>
              <option value="protanopia">Protanopia (vermelho)</option>
              <option value="tritanopia">Tritanopia (azul-amarelo)</option>
            </select>
          </div>

          {/* 3. Reduzir Animações */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="font-semibold text-white text-sm"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                Reduzir Animações
              </p>
              <p className="text-white/40 text-xs">Minimiza efeitos de movimento e transições</p>
            </div>
            <button
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => update({ reducedMotion: !settings.reducedMotion })}
              className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-200"
              style={{
                background: settings.reducedMotion
                  ? "rgba(0,229,255,0.4)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                style={{ left: settings.reducedMotion ? "28px" : "4px" }}
              />
            </button>
          </div>

          {/* 4. Tamanho do Texto */}
          <div>
            <p
              className="font-semibold text-white text-sm mb-2"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              Tamanho do Texto
            </p>
            <div className="flex gap-2">
              {(["small", "normal", "large"] as const).map((size) => {
                const label = size === "small" ? "Pequeno" : size === "normal" ? "Normal" : "Grande";
                const active = settings.fontSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => update({ fontSize: size })}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: active ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? "rgba(0,229,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                      color: active ? "#00e5ff" : "rgba(255,255,255,0.4)",
                      fontFamily: "Rajdhani, sans-serif",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

