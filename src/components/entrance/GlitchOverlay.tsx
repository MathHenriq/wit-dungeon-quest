import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function GlitchOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current) return;

    const tl = gsap.timeline();

    for (let i = 0; i < 5; i++) {
      tl.to(overlayRef.current, { opacity: 1, duration: 0.05 });
      tl.to(overlayRef.current, { x: (Math.random() - 0.5) * 20, duration: 0.05 });
      tl.to(overlayRef.current, { opacity: 0, duration: 0.05 });
      tl.to(overlayRef.current, { x: 0, duration: 0.05 });
    }

    tl.to('.boot-glitch-flash', { opacity: 1, duration: 0.1 });
    tl.to('.boot-glitch-flash', { opacity: 0, duration: 0.3 });
  }, []);

  return (
    <>
      <div ref={overlayRef} className="boot-glitch-overlay">
        <div className="boot-glitch-line" style={{ top: '20%' }} />
        <div className="boot-glitch-line" style={{ top: '45%' }} />
        <div className="boot-glitch-line" style={{ top: '70%' }} />
      </div>
      <div className="boot-glitch-flash" />
    </>
  );
}
