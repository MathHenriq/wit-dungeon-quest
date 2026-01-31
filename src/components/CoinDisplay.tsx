import { Coins } from "lucide-react";

interface CoinDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

export function CoinDisplay({ amount, size = "md" }: CoinDisplayProps) {
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-1.5",
    lg: "text-xl px-4 py-2",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className={`coin-badge ${sizeClasses[size]}`}>
      <Coins size={iconSizes[size]} className="animate-float" />
      <span>{amount}</span>
    </div>
  );
}
