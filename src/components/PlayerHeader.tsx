import { Student } from "@/types/game";
import { CoinDisplay } from "./CoinDisplay";
import { LevelBadge } from "./LevelBadge";
import { LogOut, User } from "lucide-react";

interface PlayerHeaderProps {
  student: Student;
  onLogout: () => void;
}

export function PlayerHeader({ student, onLogout }: PlayerHeaderProps) {
  const displayName = student.characterName || student.name;

  return (
    <header className="bg-dungeon-dark text-primary-foreground py-4 px-4 md:px-6 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h1 className="font-display text-xl md:text-2xl font-bold text-gold">
              WIT Dungeon
            </h1>
          </div>
          
          <div className="flex items-center gap-3 bg-primary/20 rounded-lg px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="text-secondary-foreground" size={20} />
            </div>
            <div>
              <p className="font-semibold text-primary-foreground">
                {displayName}
              </p>
              <p className="text-sm text-primary-foreground/70">
                Turma {student.className}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CoinDisplay amount={student.coins} size="md" />
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-primary-foreground/70">Nível</span>
              <LevelBadge level={student.level} />
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
