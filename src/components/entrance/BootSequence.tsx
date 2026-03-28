import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [stage, setStage] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 100),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => setStage(3), 2600),
      setTimeout(() => setStage(4), 4800),
      setTimeout(() => {
        localStorage.setItem('wit_boot_seen', 'true');
        onCompleteRef.current();
      }, 5400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      animate={{ opacity: stage === 4 ? 0 : 1 }}
      transition={{ duration: 0.5, delay: stage === 4 ? 0.15 : 0 }}
    >
      {/* Scanlines sweep */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="fixed left-0 w-full h-0.5 bg-cyan-500/30"
          initial={{ top: '-2px' }}
          animate={stage >= 1 ? { top: '100vh' } : { top: '-2px' }}
          transition={{ duration: 1.8, delay: i * 0.15, ease: 'linear' }}
        />
      ))}

      <div className="relative text-center">
        {/* Logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={stage >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-7xl font-orbitron font-black text-glow-cyan tracking-widest">
            WIT DUNGEON
          </h1>
          <motion.div
            className="h-px mx-auto mt-4 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            initial={{ width: 0 }}
            animate={stage >= 1 ? { width: 256 } : { width: 0 }}
            transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Typewriter text */}
        <motion.div
          className="font-mono text-cyan-400 text-xl tracking-[0.3em] mb-12"
          initial={{ opacity: 0 }}
          animate={stage >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stage >= 2 && <TypewriterText text="INITIALIZING LINK..." />}
        </motion.div>

        {/* Loading circle */}
        <motion.div
          className="relative w-32 h-32 mx-auto"
          initial={{ opacity: 0 }}
          animate={stage >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={stage >= 3 ? { rotate: 720 } : { rotate: 0 }}
            transition={{ duration: 2.0, ease: 'linear' }}
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="1" />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="url(#grad-boot)"
              strokeWidth="2"
              strokeDasharray="283"
              strokeDashoffset="70"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="grad-boot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d9ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#9d4edd" stopOpacity="1" />
              </linearGradient>
            </defs>
          </motion.svg>
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400 font-mono text-2xl font-bold">
            {stage >= 3 && <GlyphRotator />}
          </div>
        </motion.div>
      </div>

      {/* Flash */}
      <motion.div
        className="fixed inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={stage >= 4 ? { opacity: [0, 0.8, 0] } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    const cursorInterval = setInterval(() => setCursorVisible(v => !v), 500);
    return () => { clearInterval(interval); clearInterval(cursorInterval); };
  }, [text]);

  return (
    <span>
      {displayText}
      <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>▮</span>
    </span>
  );
}

function GlyphRotator() {
  const [glyph, setGlyph] = useState('◬');
  const glyphs = ['◬', '◭', '◮', '◯', '◰', '◱', '◲', '◳'];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setGlyph(glyphs[index % glyphs.length]);
      index++;
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-glow-cyan">{glyph}</span>;
}

export function BootSequenceWrapper({ children }: { children: React.ReactNode }) {
  // Read localStorage synchronously at first render — no null state, no race
  const [showBoot, setShowBoot] = useState(() => !localStorage.getItem('wit_boot_seen'));

  const handleComplete = useCallback(() => setShowBoot(false), []);

  if (!showBoot) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {showBoot && <BootSequence onComplete={handleComplete} />}
      </AnimatePresence>
      <motion.div
        animate={{ opacity: showBoot ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </>
  );
}
