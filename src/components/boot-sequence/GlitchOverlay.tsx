import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function GlitchOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current) return;
    const tl = gsap.timeline();

    for (let i = 0; i < 5; i++) {
      tl.to(overlayRef.current, { opacity: 1, x: Math.random() * 20 - 10, duration: 0.05 });
      tl.to(overlayRef.current, { opacity: 0, x: 0, duration: 0.05 });
    }

    tl.to('.glitch-flash', { opacity: 1, duration: 0.1 });
    tl.to('.glitch-flash', { opacity: 0, duration: 0.3 });
  }, []);

  return (
    <>
      <div ref={overlayRef} className="glitch-overlay">
        <div className="glitch-line" style={{ top: '20%' }} />
        <div className="glitch-line" style={{ top: '45%' }} />
        <div className="glitch-line" style={{ top: '70%' }} />
      </div>
      <div className="glitch-flash" />
    </>
  );
}
