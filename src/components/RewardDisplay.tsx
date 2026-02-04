interface RewardDisplayProps {
  amount: number;
  icon?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RewardDisplay({ 
  amount, 
  icon = "🪙", 
  name,
  size = "md",
  showLabel = false 
}: RewardDisplayProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-1 gap-1",
    md: "text-base px-3 py-1.5 gap-1.5",
    lg: "text-xl px-4 py-2 gap-2",
  };

  const iconSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`coin-badge ${sizeClasses[size]}`}>
      <span className={`${iconSizes[size]} animate-float`}>{icon}</span>
      <span>{amount}</span>
      {showLabel && name && (
        <span className="text-muted-foreground ml-1">{name}</span>
      )}
    </div>
  );
}
