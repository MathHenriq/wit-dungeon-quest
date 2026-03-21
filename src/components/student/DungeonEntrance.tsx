import { useEffect, useState } from "react";
import { AincradBackground } from "@/components/ui/AincradBackground";

interface DungeonEntranceProps {
  studentId: string;
  studentName: string;
  level: number;
  characterClass: string | null;
  onComplete: () => void;
}

const LINK_START_TEXT = "LINK  START";

export function DungeonEntrance({ studentId, studentName, level, characterClass, onComplete }: DungeonEntranceProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const key = `wit-entrance-seen-${studentId}`;
    if (sessionStorage.getItem(key)) {
      onComplete();
      return;
    }
    sessionStorage.setItem(key, '1');

    let charCount = 0;
    const typeInterval = setInterval(() => {
      charCount++;
      setDisplayedChars(charCount);
      if (charCount >= LINK_START_TEXT.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          setPhase(2);
          setFlashOpacity(0.8);
          setTimeout(() => setFlashOpacity(0), 200);
          setTimeout(() => {
            setPhase(3);
            setStatsVisible(true);
            setTimeout(() => {
              setFadeOut(true);
              setTimeout(onComplete, 600);
            }, 1300);
          }, 1000);
        }, 400);
      }
    }, 90);

    return () => clearInterval(typeInterval);
  }, [studentId, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ opacity: fadeOut ? 0 : 1, background: '#000', transition: 'opacity 0.6s ease' }}
    >
      <AincradBackground scene="login" />
      <div
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ opacity: flashOpacity, transition: 'opacity 0.2s ease' }}
      />
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        <h1
          className="text-cyan-400 font-bold"
          style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '2rem', letterSpacing: '12px', textShadow: '0 0 30px rgba(0,229,255,0.6)' }}
        >
          {LINK_START_TEXT.slice(0, displayedChars)}
          {displayedChars < LINK_START_TEXT.length && (
            <span style={{ animation: 'typewriter-cursor 0.8s infinite' }}>|</span>
          )}
        </h1>
        {phase >= 2 && (
          <p className="text-white font-bold animate-fade-in-up" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.75rem', textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
            {studentName}
          </p>
        )}
        {statsVisible && (
          <div className="flex gap-6 text-sm text-white/70">
            <span className="animate-fade-in-up stagger-1" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>Lv. {level}</span>
            {characterClass && (
              <span className="animate-fade-in-up stagger-2" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>{characterClass}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
