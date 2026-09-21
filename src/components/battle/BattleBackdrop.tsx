// Patch 6.2 — Dramatic battle backdrops that swap when a Legendary+ card
// activates. Pure CSS/SVG — zero image assets.
//
// API
//   <BattleBackdrop activeKey="reino_espiritual" /> overlays the current
//   battle scene. Crossfade between keys is driven by GSAP via the
//   `pickBackdropForRarity()` helper consumers can call.
//
// Catalogue + helpers are exported so the HeroScreen profile collection can
// render the same visuals as preview tiles.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export type BackdropKey =
  | "default"
  | "vazio_cosmico"
  | "inferno_energetico"
  | "limbo_distorcido"
  | "reino_espiritual"
  | "aurora_boreal"
  | "expansao_dominio"
  | "instinto_superior"
  | "soro_tita";

export interface BackdropMeta {
  key:   BackdropKey;
  name:  string;
  tone:  string;   // primary tone
  blurb: string;
}

export const BACKDROPS: Record<BackdropKey, BackdropMeta> = {
  default:            { key: "default",           name: "Arena Padrão",       tone: "#475569", blurb: "Cenário base da batalha." },
  vazio_cosmico:      { key: "vazio_cosmico",     name: "Vazio Cósmico",      tone: "#7c3aed", blurb: "Estrelas distantes em silêncio absoluto." },
  inferno_energetico: { key: "inferno_energetico", name: "Inferno Energético", tone: "#f05050", blurb: "Faíscas e brasas no ar quente." },
  limbo_distorcido:   { key: "limbo_distorcido",  name: "Limbo Distorcido",    tone: "#94a3b8", blurb: "Realidade quebrada em camadas." },
  reino_espiritual:   { key: "reino_espiritual",  name: "Reino Espiritual",    tone: "#f5c84b", blurb: "Luz dourada e marcas etéreas." },
  aurora_boreal:      { key: "aurora_boreal",     name: "Aurora Boreal",       tone: "#22d3ee", blurb: "Véus de luz fria dançando." },
  expansao_dominio:   { key: "expansao_dominio",  name: "Expansão de Domínio", tone: "#111827", blurb: "O espaço se distorce em uma realidade inescapável." },
  instinto_superior:  { key: "instinto_superior", name: "Instinto Superior",   tone: "#f8fafc", blurb: "Aura platinada transborda transcendência." },
  soro_tita:          { key: "soro_tita",         name: "Despertar Titã",      tone: "#ef4444", blurb: "Raios vermelhos rasgam um cenário fervente." },
};

// Map a card rarity to a backdrop key. Deterministic so the same card always
// theatres in the same place — but no two rarities share a backdrop.
export function pickBackdropForRarity(rarity: string | null | undefined): BackdropKey {
  switch ((rarity ?? "").toLowerCase()) {
    case "legendary": return "reino_espiritual";
    case "mythic":    return "inferno_energetico";
    case "unknown":   return "limbo_distorcido";
    case "epic":      return "vazio_cosmico";
    case "rare":      return "aurora_boreal";
    default:          return "default";
  }
}

interface Props {
  activeKey: BackdropKey;
}

/** Duração do crossfade; a camada que sai é desmontada logo depois. */
const FADE_IN_S  = 0.9;
const FADE_OUT_S = 0.6;

export function BattleBackdrop({ activeKey }: Props) {
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevKey = useRef<BackdropKey>(activeKey);

  /**
   * Só o cenário ativo fica montado — e, durante a transição, também o que
   * está saindo.
   *
   * Antes isto renderizava OS NOVE cenários de uma vez e escondia os inativos
   * com `opacity: 0`, para que o GSAP pudesse fazer crossfade entre camadas
   * que já existiam. Mas `opacity: 0` não pausa animação nenhuma: o navegador
   * seguia rodando todas elas, o tempo inteiro, durante toda batalha. Medido
   * na tela de batalha, com as partículas de todos os temas somadas:
   *
   *   144 elementos animando ao mesmo tempo, de 267 nós no documento
   *   128 partículas (60 estrelas + 30 brasas + 20 do instinto + 18 runas)
   *     4 animando background-position / background-image em tela cheia,
   *       que é repaint completo por quadro
   *     1 grade em perspectiva (rotateX 75°) cuja caixa projetada dava
   *       700 bilhões de px²
   *
   * O aluno via um cenário e pagava por nove. Montando só o que está na tela,
   * o custo passa a ser o do tema escolhido.
   */
  const [montados, setMontados] = useState<BackdropKey[]>(() => [activeKey]);

  // Um timer de remoção POR camada que sai, guardado fora do efeito.
  //
  // A primeira versão disto criava o timer dentro do efeito e o cancelava no
  // cleanup. Parece certo e está errado: trocar de cenário de novo antes do
  // fade acabar roda o cleanup, que cancela a remoção pendente — e a camada
  // anterior nunca sai. Disparando cartas em sequência, que é justamente o que
  // troca cenário, as camadas iam se acumulando de volta ao estado que esta
  // mudança veio resolver. Coberto por teste.
  const timers = useRef<Map<BackdropKey, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (activeKey === prevKey.current) return;
    const saindo = prevKey.current;
    prevKey.current = activeKey;

    // Monta o novo por baixo antes de animar — o GSAP precisa do elemento.
    setMontados(atual => (atual.includes(activeKey) ? atual : [...atual, activeKey]));

    // Se o cenário que volta a ser o ativo tinha remoção agendada, cancela.
    const pendente = timers.current.get(activeKey);
    if (pendente !== undefined) {
      clearTimeout(pendente);
      timers.current.delete(activeKey);
    }

    // Desmonta o que saiu quando o fade dele terminar — sem depender de
    // nenhuma troca futura.
    if (!timers.current.has(saindo)) {
      timers.current.set(saindo, setTimeout(() => {
        timers.current.delete(saindo);
        setMontados(atual => atual.filter(k => k !== saindo));
      }, Math.max(FADE_IN_S, FADE_OUT_S) * 1000 + 100));
    }
  }, [activeKey]);

  // Só no unmount: aqui sim os timers pendentes devem morrer.
  useEffect(() => {
    const mapa = timers.current;
    return () => { for (const t of mapa.values()) clearTimeout(t); mapa.clear(); };
  }, []);

  // O fade roda depois que a camada nova existe no DOM.
  useLayoutEffect(() => {
    const incoming = layerRefs.current[activeKey];
    if (incoming) {
      gsap.fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: FADE_IN_S, ease: "power2.out" });
    }
    for (const k of montados) {
      if (k === activeKey) continue;
      const outgoing = layerRefs.current[k];
      if (outgoing) gsap.to(outgoing, { opacity: 0, duration: FADE_OUT_S, ease: "power2.in" });
    }
  }, [montados, activeKey]);

  return (
    <div className="bbd-root" aria-hidden="true">
      <style>{CSS}</style>
      {montados.map(k => (
        <div
          key={k}
          ref={el => { layerRefs.current[k] = el; }}
          className={`bbd-layer bbd-${k}`}
          style={{ opacity: k === activeKey ? 1 : 0 }}
        >
          {renderInnerEffects(k)}
        </div>
      ))}
    </div>
  );
}

// Per-backdrop ornamental nodes — each gets its own kineticism so they
// feel distinct without buying assets.
function renderInnerEffects(k: BackdropKey) {
  switch (k) {
    case "vazio_cosmico":
      return (
        <>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="bbd-star" style={{
              top:  `${(i * 17.3) % 100}%`,
              left: `${(i * 23.7) % 100}%`,
              animationDelay: `${(i * 0.13) % 4}s`,
              opacity: 0.3 + ((i * 0.07) % 0.7),
            }} />
          ))}
          <div className="bbd-nebula" />
        </>
      );
    case "inferno_energetico":
      return (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="bbd-ember" style={{
              left: `${(i * 11) % 100}%`,
              animationDelay: `${(i * 0.21) % 3}s`,
              animationDuration: `${3 + ((i * 0.18) % 2)}s`,
            }} />
          ))}
          <div className="bbd-heat" />
        </>
      );
    case "limbo_distorcido":
      return (
        <>
          <div className="bbd-glitch-pane" />
          <div className="bbd-glitch-pane bbd-glitch-pane--alt" />
          <div className="bbd-static" />
        </>
      );
    case "reino_espiritual":
      return (
        <>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="bbd-rune" style={{
              top:  `${10 + ((i * 19) % 80)}%`,
              left: `${5 + ((i * 23) % 90)}%`,
              animationDelay: `${(i * 0.27) % 4}s`,
            }}>✦</div>
          ))}
          <div className="bbd-divine-ray" />
        </>
      );
    case "aurora_boreal":
      return (
        <>
          <div className="bbd-aurora bbd-aurora--1" />
          <div className="bbd-aurora bbd-aurora--2" />
          <div className="bbd-aurora bbd-aurora--3" />
        </>
      );
    case "expansao_dominio":
      return (
        <>
          <div className="bbd-domain-grid" />
          <div className="bbd-domain-portal" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`bbd-domain-shrine bbd-domain-shrine--${i}`} />
          ))}
        </>
      );
    case "instinto_superior":
      return (
        <>
          <div className="bbd-ui-aura" />
          <div className="bbd-ui-glow" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bbd-ui-particle" style={{
              left: `${5 + ((i * 17) % 90)}%`,
              animationDelay: `${(i * 0.12) % 2}s`,
              animationDuration: `${1 + ((i * 0.15) % 1)}s`,
            }} />
          ))}
        </>
      );
    case "soro_tita":
      return (
        <>
          <div className="bbd-titan-smoke" />
          <div className="bbd-titan-lightning" />
          <div className="bbd-titan-lightning bbd-titan-lightning--alt" />
          <div className="bbd-titan-flesh" />
        </>
      );
    default:
      return null;
  }
}

// ─── Static preview (for collection viewer in HeroScreen) ──────────────────
export function BackdropPreview({ keyName, size = 140 }: { keyName: BackdropKey; size?: number }) {
  return (
    <div
      className={`bbd-preview bbd-${keyName}`}
      style={{ width: size, height: size * 0.65 }}
    >
      <style>{CSS}</style>
      {renderInnerEffects(keyName)}
    </div>
  );
}

const CSS = `
.bbd-root {
  position: absolute; inset: 0; z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.bbd-layer {
  position: absolute; inset: 0;
  transition: opacity 0.05s linear; /* GSAP drives the actual crossfade */
}

/* === Vazio Cósmico === */
.bbd-vazio_cosmico {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.30), transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(36,12,76,0.5),  transparent 65%),
    linear-gradient(180deg, #04030a 0%, #0a0518 50%, #04030a 100%);
}
.bbd-star {
  position: absolute; width: 2px; height: 2px;
  border-radius: 50%; background: #fff;
  animation: bbd-twinkle 3s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255,255,255,0.6);
}
.bbd-nebula {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 60% 40%, rgba(167,139,250,0.18) 0%, transparent 35%),
    radial-gradient(circle at 30% 70%, rgba(56,189,248,0.12)  0%, transparent 30%);
  filter: blur(40px);
  animation: bbd-nebula-drift 18s ease-in-out infinite alternate;
  mix-blend-mode: screen;
}

/* === Inferno Energético === */
.bbd-inferno_energetico {
  background:
    radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.5), transparent 70%),
    linear-gradient(180deg, #1a0204 0%, #3b0a0a 50%, #1a0204 100%);
}
.bbd-ember {
  position: absolute; bottom: -10px;
  width: 4px; height: 4px; border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 10px #f59e0b, 0 0 20px #f05050;
  animation: bbd-rise 4s linear infinite;
}
.bbd-heat {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 110%, rgba(240,80,80,0.35), transparent 60%);
  animation: bbd-heat-pulse 2.6s ease-in-out infinite;
  mix-blend-mode: screen;
}

/* === Limbo Distorcido === */
.bbd-limbo_distorcido {
  background:
    linear-gradient(180deg, #1f2937 0%, #0f172a 50%, #1f2937 100%);
}
.bbd-glitch-pane {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 3px),
    repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(148,163,184,0.07) 14px, rgba(148,163,184,0.07) 15px);
  animation: bbd-glitch-pan 6s linear infinite;
  mix-blend-mode: overlay;
}
.bbd-glitch-pane--alt {
  filter: hue-rotate(180deg);
  animation-duration: 9s; animation-direction: reverse;
  opacity: 0.55;
}
.bbd-static {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 40% 60%, rgba(148,163,184,0.18) 0%, transparent 30%),
    radial-gradient(circle at 70% 30%, rgba(56,189,248,0.18)  0%, transparent 25%);
  animation: bbd-static-shake 0.8s steps(8) infinite;
  filter: blur(20px);
  mix-blend-mode: screen;
}

/* === Reino Espiritual === */
.bbd-reino_espiritual {
  background:
    radial-gradient(ellipse at 50% 30%, rgba(245,200,75,0.35), transparent 55%),
    linear-gradient(180deg, #2a1c05 0%, #11080d 50%, #2a1c05 100%);
}
.bbd-rune {
  position: absolute;
  font-family: 'Cinzel', serif;
  color: rgba(245,200,75,0.55);
  font-size: 18px;
  text-shadow: 0 0 8px #f5c84b, 0 0 18px #f5c84b;
  animation: bbd-rune-pulse 3s ease-in-out infinite;
  pointer-events: none;
}
.bbd-divine-ray {
  position: absolute; left: 50%; top: -10%;
  width: 60%; height: 130%;
  transform: translateX(-50%) rotate(2deg);
  background:
    conic-gradient(from 90deg at 50% 0%,
      transparent 0deg,
      rgba(245,200,75,0.18) 4deg,
      transparent 8deg,
      rgba(245,200,75,0.12) 14deg,
      transparent 18deg,
      rgba(245,200,75,0.20) 24deg,
      transparent 28deg);
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: bbd-divine-ray-spin 14s linear infinite;
}

/* === Aurora Boreal === */
.bbd-aurora_boreal {
  background: linear-gradient(180deg, #020617 0%, #03192a 60%, #020617 100%);
}
.bbd-aurora {
  position: absolute; left: -20%; right: -20%; height: 50%;
  filter: blur(40px);
  mix-blend-mode: screen;
  opacity: 0.7;
  animation: bbd-aurora-flow 16s ease-in-out infinite alternate;
}
.bbd-aurora--1 { top: 10%;
  background: linear-gradient(90deg, transparent, #22d3ee 50%, transparent);
}
.bbd-aurora--2 { top: 30%;
  background: linear-gradient(90deg, transparent, #34d399 40%, #22d3ee 70%, transparent);
  animation-duration: 22s; animation-delay: -8s;
}
.bbd-aurora--3 { top: 50%;
  background: linear-gradient(90deg, transparent, #a7f3d0 30%, transparent);
  animation-duration: 30s; animation-delay: -4s;
}

/* === Default === */
.bbd-default {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(80,80,100,0.18), transparent 60%),
    linear-gradient(180deg, #0a0d18 0%, #050610 100%);
}

/* === Animations === */
@keyframes bbd-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%      { opacity: 1;   transform: scale(1.3); }
}
@keyframes bbd-nebula-drift {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(-30px, -16px); }
}
@keyframes bbd-rise {
  0%   { transform: translateY(0) scale(1);   opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
}
@keyframes bbd-heat-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 0.9; }
}
@keyframes bbd-glitch-pan {
  0%   { background-position: 0 0,   0 0; }
  100% { background-position: 0 100%, 30px 0; }
}
@keyframes bbd-static-shake {
  0%, 100% { transform: translate(0, 0); }
  25%  { transform: translate(-4px, 3px); }
  50%  { transform: translate(3px, -4px); }
  75%  { transform: translate(-2px, 2px); }
}
@keyframes bbd-rune-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50%      { opacity: 1;   transform: scale(1.15); }
}
@keyframes bbd-divine-ray-spin {
  from { transform: translateX(-50%) rotate(0deg); }
  to   { transform: translateX(-50%) rotate(360deg); }
}
@keyframes bbd-aurora-flow {
  0%   { transform: translateX(-15%) skewX(-8deg); }
  100% { transform: translateX(15%) skewX(8deg); }
}

/* === Expansão de Domínio === */
.bbd-expansao_dominio {
  background: radial-gradient(circle at 50% 50%, #1e1b4b 0%, #000000 100%);
}
.bbd-domain-grid {
  position: absolute; inset: -50%;
  background-image: 
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 80px 80px;
  transform: perspective(800px) rotateX(75deg);
  animation: bbd-domain-grid-move 10s linear infinite;
  mix-blend-mode: screen;
}
.bbd-domain-portal {
  position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
  width: 400px; height: 400px;
  border-radius: 50%;
  box-shadow: 0 0 80px #000 inset, 0 0 120px rgba(79,70,229,0.3);
  border: 2px solid rgba(255,255,255,0.1);
  background: radial-gradient(circle, #000 30%, transparent 70%);
  animation: bbd-domain-portal-pulse 4s ease-in-out infinite alternate;
}
@keyframes bbd-domain-grid-move {
  0% { transform: perspective(800px) rotateX(75deg) translateY(0); }
  100% { transform: perspective(800px) rotateX(75deg) translateY(80px); }
}
@keyframes bbd-domain-portal-pulse {
  0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
}

/* === Instinto Superior (Ultra Instinct) === */
.bbd-instinto_superior {
  background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
}
.bbd-ui-aura {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 60%, rgba(226,232,240,0.3) 0%, transparent 60%);
  filter: blur(20px);
  animation: bbd-ui-aura-pulse 2s ease-in-out infinite alternate;
  mix-blend-mode: screen;
}
.bbd-ui-glow {
  position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(0deg, rgba(248,250,252,0.15) 0%, transparent 100%);
}
.bbd-ui-particle {
  position: absolute; bottom: -20px;
  width: 3px; height: 15px;
  background: #f8fafc;
  box-shadow: 0 0 10px #f8fafc, 0 0 20px #94a3b8;
  border-radius: 50%;
  animation: bbd-ui-rise linear infinite;
  opacity: 0;
}
@keyframes bbd-ui-aura-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.1); opacity: 1; }
}
@keyframes bbd-ui-rise {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-100vh) scale(0); opacity: 0; }
}

/* === Soro de Titã === */
.bbd-soro_tita {
  background: radial-gradient(circle at 50% 50%, #450a0a 0%, #000000 100%);
}
.bbd-titan-smoke {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 100%, rgba(239,68,68,0.2) 0%, transparent 70%);
  filter: blur(30px);
  animation: bbd-titan-smoke-drift 8s ease-in-out infinite alternate;
}
.bbd-titan-flesh {
  position: absolute; inset: 0;
  background: repeating-radial-gradient(circle at 50% 50%, rgba(185,28,28,0.05) 0%, rgba(185,28,28,0.05) 10px, transparent 10px, transparent 20px);
  opacity: 0.5;
  mix-blend-mode: multiply;
}
.bbd-titan-lightning {
  position: absolute; inset: 0;
  background: transparent;
  box-shadow: inset 0 0 0 0 transparent;
  animation: bbd-titan-strike 3s steps(1) infinite;
}
.bbd-titan-lightning--alt {
  animation-duration: 5s;
  animation-delay: 1.5s;
  transform: scaleX(-1);
}
@keyframes bbd-titan-smoke-drift {
  0% { transform: scale(1) translateY(0); }
  100% { transform: scale(1.1) translateY(-20px); }
}
@keyframes bbd-titan-strike {
  0%, 100% { background: transparent; }
  5% { background: rgba(254,226,226,0.3); }
  10% { background: transparent; }
  15% { background: rgba(254,226,226,0.5); }
  20% { background: transparent; }
}

/* === Preview tile (collection viewer) === */
.bbd-preview {
  position: relative; overflow: hidden;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
}
.bbd-preview .bbd-star,
.bbd-preview .bbd-ember,
.bbd-preview .bbd-rune,
.bbd-preview .bbd-aurora { animation-duration: 6s; }
`;
