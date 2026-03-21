import { useEffect, useRef } from "react";

export type SceneType = 'login' | 'home' | 'quests' | 'ranking' | 'character' | 'shop' | 'xp_result' | 'level_up' | 'default';

interface AincradBackgroundProps {
  scene?: SceneType;
}

const SCENE_GRADIENTS: Record<SceneType, string> = {
  login:     'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(230 40% 12%) 30%, hsl(250 30% 18%) 60%, hsl(270 25% 14%) 80%, hsl(222 47% 6%) 100%)',
  home:      'linear-gradient(180deg, #060a14 0%, #0d1528 20%, #1a1535 40%, #2d1f3d 55%, #3a2520 65%, #1a1020 80%, #0a0e1a 100%)',
  quests:    'linear-gradient(180deg, #0a0610 0%, #1a0d18 20%, #2d1520 40%, #3d2018 55%, #2a1a10 70%, #150c08 85%, #0a0e1a 100%)',
  ranking:   'linear-gradient(180deg, #06040a 0%, #120820 25%, #1e1035 45%, #2a1545 60%, #1e1035 80%, #0a0e1a 100%)',
  character: 'linear-gradient(180deg, #060a14 0%, #0d1528 20%, #151a35 40%, #1d2040 55%, #151a30 75%, #0a0e1a 100%)',
  shop:      'linear-gradient(180deg, #0a0810 0%, #14100d 25%, #1e1812 45%, #1a1410 70%, #0a0e1a 100%)',
  xp_result: 'linear-gradient(180deg, #8ab665 0%, #7da858 30%, #6d9a4a 60%, #5a8840 100%)',
  level_up:  'linear-gradient(180deg, #060a14 0%, #0d0a20 50%, #060a14 100%)',
  default:   'linear-gradient(180deg, hsl(222 47% 4%) 0%, hsl(230 40% 12%) 30%, hsl(250 30% 18%) 60%, hsl(270 25% 14%) 80%, hsl(222 47% 6%) 100%)',
};

function AincradSilhouette() {
  return (
    <svg
      className="fixed top-4 right-[-40px] w-[260px] h-[420px] pointer-events-none z-0 animate-slow-drift"
      style={{ opacity: 0.065 }}
      viewBox="0 0 200 380"
      fill="none"
    >
      <path d="M55 220 Q40 260 30 310 Q60 295 100 300 Q140 295 170 310 Q160 260 145 220 Z" fill="hsl(215 25% 18%)"/>
      <path d="M60 218 Q80 230 100 228 Q120 230 140 218 Q130 215 100 212 Q70 215 60 218Z" fill="hsl(215 20% 22%)"/>
      <rect x="45" y="185" width="110" height="35" rx="1" fill="hsl(215 25% 16%)"/>
      <rect x="45" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="62" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="79" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="96" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="113" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="130" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="147" y="185" width="8" height="12" fill="hsl(215 20% 12%)"/>
      <rect x="75" y="100" width="50" height="90" rx="2" fill="hsl(215 25% 18%)"/>
      <path d="M70 100 L100 30 L130 100 Z" fill="hsl(215 22% 20%)"/>
      <rect x="42" y="135" width="28" height="60" rx="1" fill="hsl(215 22% 16%)"/>
      <path d="M38 135 L56 90 L74 135 Z" fill="hsl(215 20% 18%)"/>
      <rect x="130" y="120" width="28" height="75" rx="1" fill="hsl(215 22% 16%)"/>
      <path d="M126 120 L144 75 L162 120 Z" fill="hsl(215 20% 18%)"/>
      <rect x="22" y="155" width="18" height="50" rx="1" fill="hsl(215 20% 14%)"/>
      <path d="M19 155 L31 115 L43 155 Z" fill="hsl(215 18% 16%)"/>
      <rect x="160" y="148" width="18" height="57" rx="1" fill="hsl(215 20% 14%)"/>
      <path d="M157 148 L169 105 L181 148 Z" fill="hsl(215 18% 16%)"/>
      <path d="M70 168 Q100 160 130 168" stroke="hsl(215 20% 22%)" strokeWidth="4" fill="none"/>
      <circle cx="100" cy="68" r="2.5" fill="rgba(0,229,255,0.35)"/>
      <circle cx="100" cy="115" r="2" fill="rgba(0,229,255,0.25)"/>
      <circle cx="100" cy="130" r="2" fill="rgba(0,229,255,0.25)"/>
      <circle cx="100" cy="145" r="2" fill="rgba(0,229,255,0.25)"/>
      <circle cx="56" cy="150" r="1.5" fill="rgba(0,229,255,0.2)"/>
      <circle cx="56" cy="162" r="1.5" fill="rgba(0,229,255,0.2)"/>
      <circle cx="144" cy="140" r="1.5" fill="rgba(0,229,255,0.2)"/>
      <circle cx="144" cy="155" r="1.5" fill="rgba(0,229,255,0.2)"/>
      <circle cx="31" cy="170" r="1" fill="rgba(0,229,255,0.15)"/>
      <circle cx="169" cy="163" r="1" fill="rgba(0,229,255,0.15)"/>
    </svg>
  );
}

function SwordsInGround() {
  return (
    <svg viewBox="0 0 400 120" className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ opacity: 0.07, color: 'white' }}>
      <line x1="200" y1="110" x2="195" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <rect x="188" y="50" width="18" height="5" rx="1" fill="currentColor"/>
      <line x1="120" y1="115" x2="130" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <rect x="124" y="55" width="14" height="4" rx="1" fill="currentColor" transform="rotate(-5 131 57)"/>
      <line x1="280" y1="115" x2="268" y2="20" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
      <rect x="261" y="52" width="16" height="4.5" rx="1" fill="currentColor" transform="rotate(5 269 54)"/>
      <line x1="60" y1="118" x2="68" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.6}/>
      <line x1="340" y1="118" x2="330" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity={0.6}/>
    </svg>
  );
}

function ParticleCanvas({ scene }: { scene: SceneType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number; y: number; r: number; speed: number; opacity: number; color: string; isGold: boolean;
    }

    const isQuests = scene === 'quests';
    const isRanking = scene === 'ranking';
    const count = 35;

    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.4 + 0.1,
      color: i < 4
        ? (isQuests ? 'rgba(255,160,60,' : isRanking ? 'rgba(180,100,255,' : 'rgba(255,215,0,')
        : (isQuests ? 'rgba(255,120,50,' : isRanking ? 'rgba(140,80,255,' : 'rgba(0,229,255,'),
      isGold: i < 4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isGold ? p.r * 2.5 : p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `${p.color}${(0.04 * (1 - dist / 100)).toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [scene]);

  if (scene === 'xp_result') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}

export function AincradBackground({ scene = 'default' }: AincradBackgroundProps) {
  const showCastle = ['login', 'home', 'character', 'default'].includes(scene);
  const showSwords = scene === 'quests';
  const gradient = SCENE_GRADIENTS[scene];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: gradient }} />
      {showCastle && <AincradSilhouette />}
      {showSwords && <SwordsInGround />}
      {scene !== 'xp_result' && (
        <>
          <div
            className="absolute top-[15%] left-0 h-[80px] pointer-events-none"
            style={{
              width: '200%',
              background: 'radial-gradient(ellipse 60% 100% at 30% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)',
              animation: 'cloud-drift 80s linear infinite',
            }}
          />
          <div
            className="absolute top-[30%] pointer-events-none"
            style={{
              left: '-20%',
              width: '200%',
              height: '60px',
              background: 'radial-gradient(ellipse 50% 100% at 40% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)',
              animation: 'cloud-drift 110s linear infinite',
            }}
          />
        </>
      )}
      <ParticleCanvas scene={scene} />
    </div>
  );
}
