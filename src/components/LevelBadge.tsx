interface LevelBadgeProps {
  level: number;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  return (
    <div className="level-badge animate-glow">
      {level}
    </div>
  );
}
