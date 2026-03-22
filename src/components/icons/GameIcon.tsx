import React from "react";
import {
  SwordIcon, ShieldIcon, CoinIcon, GemIcon, FlameIcon, ScrollIcon,
  PotionIcon, StarIcon, WandIcon, BowIcon, HeartIcon, CrownIcon,
  TrophyIcon, UserSaoIcon, PackageIcon, StoreIcon, DragonIcon, HealIcon, ChestIcon,
} from './SaoIcons';
import type { SaoIconProps } from './SaoIcons';

const ICON_MAP: Record<string, React.FC<SaoIconProps>> = {
  sword: SwordIcon,
  shield: ShieldIcon,
  coin: CoinIcon,
  gem: GemIcon,
  flame: FlameIcon,
  scroll: ScrollIcon,
  potion: PotionIcon,
  star: StarIcon,
  wand: WandIcon,
  bow: BowIcon,
  heart: HeartIcon,
  crown: CrownIcon,
  trophy: TrophyIcon,
  user: UserSaoIcon,
  pack: PackageIcon,
  store: StoreIcon,
  dragon: DragonIcon,
  heal: HealIcon,
  chest: ChestIcon,
};

const DEFAULT_COLORS: Record<string, { ring: string; fill: string; bg: string }> = {
  sword:  { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  shield: { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  coin:   { ring: '#ffd700', fill: '#ffd700', bg: 'rgba(255,215,0,0.06)' },
  gem:    { ring: '#b388ff', fill: '#b388ff', bg: 'rgba(124,77,255,0.06)' },
  flame:  { ring: '#ff6b35', fill: '#ff6b35', bg: 'rgba(255,107,53,0.06)' },
  scroll: { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  potion: { ring: '#4caf50', fill: '#4caf50', bg: 'rgba(76,175,80,0.06)' },
  star:   { ring: '#ffd700', fill: '#ffd700', bg: 'rgba(255,215,0,0.06)' },
  wand:   { ring: '#b388ff', fill: '#b388ff', bg: 'rgba(124,77,255,0.06)' },
  bow:    { ring: '#4caf50', fill: '#4caf50', bg: 'rgba(76,175,80,0.06)' },
  heart:  { ring: '#00e5ff', fill: '#00e5ff', bg: 'rgba(0,229,255,0.06)' },
  crown:  { ring: '#ffd700', fill: '#ffd700', bg: 'rgba(255,215,0,0.06)' },
  trophy: { ring: '#ffd700', fill: '#ffd700', bg: 'rgba(255,215,0,0.06)' },
  user:   { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  pack:   { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  store:  { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
  dragon: { ring: '#e24b4a', fill: '#e24b4a', bg: 'rgba(226,75,74,0.06)' },
  heal:   { ring: '#00e5ff', fill: '#00e5ff', bg: 'rgba(0,229,255,0.06)' },
  chest:  { ring: '#c9a44a', fill: '#c9a44a', bg: 'rgba(201,164,74,0.06)' },
};

interface GameIconProps {
  id: string;
  size?: number;
  className?: string;
  ringColor?: string;
  fillColor?: string;
  bgColor?: string;
}

export function GameIcon({ id, size = 20, className, ringColor, fillColor, bgColor }: GameIconProps) {
  const Icon = ICON_MAP[id] || StarIcon;
  const defaults = DEFAULT_COLORS[id] || DEFAULT_COLORS.star;
  return (
    <Icon
      size={size}
      ringColor={ringColor || defaults.ring}
      fillColor={fillColor || defaults.fill}
      bgColor={bgColor || defaults.bg}
      className={className}
    />
  );
}
