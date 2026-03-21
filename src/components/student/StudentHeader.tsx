import { Coins, Flame, LogOut } from "lucide-react";
import type { Student } from "@/types";

interface StudentHeaderProps {
  student: Student;
  onLogout: () => void;
}

export function StudentHeader({ student, onLogout }: StudentHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 px-4 py-3"
      style={{
        background: 'rgba(10, 14, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.08)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" className="text-cyan-400">
            <polygon points="9,1 17,5 17,13 9,17 1,13 1,5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="font-bold text-cyan-400 hidden sm:block text-xs tracking-[3px] uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            WIT Dungeon
          </span>
        </div>
        <div className="flex-1 flex items-center gap-3 min-w-0 justify-center sm:justify-start">
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {student.character_name || student.name}
            </p>
            {student.character_class && (
              <p className="text-white/40 text-xs truncate">{student.character_class}</p>
            )}
          </div>
          {student.presencas_consecutivas > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-orange-400 text-xs flex-shrink-0">
              <Flame size={14} />
              <span>{student.presencas_consecutivas}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="coin-badge text-xs">
            <Coins size={13} />
            <span>{student.coins.toLocaleString()}</span>
          </div>
          <div className="level-badge text-sm" style={{ width: '32px', height: '32px' }}>
            {student.level}
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
