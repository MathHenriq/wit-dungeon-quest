import { Award, Star, Heart, Crown } from "lucide-react";
import type { TitleType, StudentTitle } from "@/types";

export type { TitleType };

interface StudentTitleBadgeProps {
  titles: StudentTitle[];
  showAll?: boolean;
}

const TITLE_CONFIG: Record<TitleType, { label: string; icon: typeof Award; color: string }> = {
  helper_of_week: {
    label: "Ajudante da Semana",
    icon: Heart,
    color: "text-pink-400 bg-pink-500/20 border-pink-500/30",
  },
  presence_guardian: {
    label: "Guardião da Presença",
    icon: Star,
    color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  },
  attitude_example: {
    label: "Exemplo de Atitude",
    icon: Award,
    color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  },
};

export function StudentTitleBadge({ titles, showAll = false }: StudentTitleBadgeProps) {
  // Filter only active titles (not expired)
  const activeTitles = titles.filter((t) => new Date(t.expires_at) > new Date());

  if (activeTitles.length === 0) return null;

  const displayTitles = showAll ? activeTitles : [activeTitles[0]];

  return (
    <div className="flex flex-wrap gap-2">
      {displayTitles.map((title) => {
        const config = TITLE_CONFIG[title.title_type];
        const Icon = config.icon;

        return (
          <div
            key={title.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${config.color}`}
          >
            <Icon className="w-3 h-3" />
            <span>{config.label}</span>
          </div>
        );
      })}
      {!showAll && activeTitles.length > 1 && (
        <span className="text-xs text-muted-foreground">+{activeTitles.length - 1}</span>
      )}
    </div>
  );
}

interface AttendanceCrownProps {
  consecutiveAttendance: number;
  threshold?: number;
}

export function AttendanceCrown({ consecutiveAttendance, threshold = 3 }: AttendanceCrownProps) {
  if (consecutiveAttendance < threshold) return null;

  // Determine crown color based on streak
  let crownColor = "text-amber-400"; // Gold
  if (consecutiveAttendance >= 10) {
    crownColor = "text-purple-400"; // Legendary
  } else if (consecutiveAttendance >= 7) {
    crownColor = "text-cyan-400"; // Diamond
  } else if (consecutiveAttendance >= 5) {
    crownColor = "text-emerald-400"; // Emerald
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <Crown className={`w-6 h-6 ${crownColor} drop-shadow-lg animate-pulse`} />
      <span className="absolute -bottom-1 text-[10px] font-bold text-foreground bg-background/80 rounded px-1">
        {consecutiveAttendance}
      </span>
    </div>
  );
}
