import React from "react";

export interface SaoIconProps {
  size?: number;
  ringColor?: string;
  fillColor?: string;
  bgColor?: string;
  className?: string;
}

export function SwordIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M31 11L37 17L21 33L15 27Z" fill={fillColor}/>
      <path d="M15 27L11 35L19 31Z" fill={fillColor} opacity={0.85}/>
      <rect x="18" y="24" width="7" height="3" rx="1" transform="rotate(-45 21.5 25.5)" fill={fillColor} opacity={0.7}/>
    </svg>
  );
}

export function ShieldIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 11L35 16V25C35 31 30 36 24 38C18 36 13 31 13 25V16L24 11Z" fill={fillColor}/>
    </svg>
  );
}

export function ScrollIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <rect x="15" y="13" width="18" height="22" rx="2" fill={fillColor}/>
      <circle cx="15" cy="15" r="3" fill={fillColor}/>
      <circle cx="15" cy="33" r="3" fill={fillColor}/>
      <rect x="19" y="18" width="10" height="2" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="19" y="22" width="10" height="2" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="19" y="26" width="7" height="2" rx="1" fill="rgba(0,0,0,0.3)"/>
    </svg>
  );
}

export function CoinIcon({ size = 44, ringColor = '#ffd700', fillColor = '#ffd700', bgColor = 'rgba(255,215,0,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <circle cx="24" cy="24" r="12" fill={fillColor}/>
      <circle cx="24" cy="24" r="8" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
    </svg>
  );
}

export function GemIcon({ size = 44, ringColor = '#b388ff', fillColor = '#b388ff', bgColor = 'rgba(124,77,255,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 11L33 20L24 37L15 20Z" fill={fillColor}/>
      <path d="M15 20L24 11L33 20" fill={fillColor} opacity={0.6}/>
    </svg>
  );
}

export function FlameIcon({ size = 44, ringColor = '#ff6b35', fillColor = '#ff6b35', bgColor = 'rgba(255,107,53,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 10C24 10 17 19 17 26C17 30.5 20 34 24 34C28 34 31 30.5 31 26C31 19 24 10 24 10Z" fill={fillColor}/>
      <path d="M24 20C24 20 20 25 20 28C20 30.2 21.8 32 24 32C26.2 32 28 30.2 28 28C28 25 24 20 24 20Z" fill="rgba(0,0,0,0.3)"/>
    </svg>
  );
}

export function TrophyIcon({ size = 44, ringColor = '#ffd700', fillColor = '#ffd700', bgColor = 'rgba(255,215,0,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <rect x="18" y="11" width="12" height="14" rx="2" fill={fillColor}/>
      <path d="M13 13H18V20C18 20 13 20 13 15Z" fill={fillColor} opacity={0.8}/>
      <path d="M35 13H30V20C30 20 35 20 35 15Z" fill={fillColor} opacity={0.8}/>
      <rect x="20" y="25" width="8" height="6" rx="1" fill={fillColor}/>
      <rect x="16" y="31" width="16" height="3" rx="1" fill={fillColor}/>
    </svg>
  );
}

export function UserSaoIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <circle cx="24" cy="18" r="7" fill={fillColor}/>
      <path d="M12 39C12 31.8 17.4 26 24 26C30.6 26 36 31.8 36 39" fill={fillColor}/>
    </svg>
  );
}

export function PotionIcon({ size = 44, ringColor = '#4caf50', fillColor = '#4caf50', bgColor = 'rgba(76,175,80,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <rect x="20" y="10" width="8" height="8" rx="1" fill={fillColor}/>
      <rect x="18" y="10" width="12" height="3" rx="1" fill={fillColor}/>
      <path d="M17 18H31L35 36H13Z" fill={fillColor}/>
    </svg>
  );
}

export function WandIcon({ size = 44, ringColor = '#b388ff', fillColor = '#b388ff', bgColor = 'rgba(124,77,255,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <line x1="33" y1="13" x2="13" y2="35" stroke={fillColor} strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="33" cy="13" r="3" fill={fillColor}/>
      <circle cx="31" cy="11" r="1.5" fill={fillColor} opacity={0.6}/>
      <circle cx="35" cy="15" r="1" fill={fillColor} opacity={0.4}/>
    </svg>
  );
}

export function BowIcon({ size = 44, ringColor = '#4caf50', fillColor = '#4caf50', bgColor = 'rgba(76,175,80,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M16 11C16 11 12 24 16 37" stroke={fillColor} strokeWidth="3" fill="none" strokeLinecap="round"/>
      <line x1="16" y1="24" x2="34" y2="24" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="11" x2="34" y2="24" stroke={fillColor} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="29" y1="37" x2="34" y2="24" stroke={fillColor} strokeWidth="2.5" strokeLinecap="round"/>
      <polygon points="34,22 38,24 34,26" fill={fillColor}/>
    </svg>
  );
}

export function HeartIcon({ size = 44, ringColor = '#00e5ff', fillColor = '#00e5ff', bgColor = 'rgba(0,229,255,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 36C24 36 10 27 10 18C10 13 14 10 18 10C21 10 23 12 24 14C25 12 27 10 30 10C34 10 38 13 38 18C38 27 24 36 24 36Z" fill={fillColor}/>
    </svg>
  );
}

export function StarIcon({ size = 44, ringColor = '#ffd700', fillColor = '#ffd700', bgColor = 'rgba(255,215,0,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 10L28 19H37L30 25L32 34L24 29L16 34L18 25L11 19H20Z" fill={fillColor}/>
    </svg>
  );
}

export function CrownIcon({ size = 44, ringColor = '#ffd700', fillColor = '#ffd700', bgColor = 'rgba(255,215,0,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M10 32L14 17L20 24L24 13L28 24L34 17L38 32Z" fill={fillColor}/>
      <rect x="10" y="32" width="28" height="5" rx="1" fill={fillColor}/>
    </svg>
  );
}

export function PackageIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" fill={fillColor}/>
      <line x1="14" y1="18" x2="34" y2="18" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"/>
      <line x1="24" y1="12" x2="24" y2="36" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"/>
    </svg>
  );
}

export function StoreIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M12 22L24 11L36 22V36H12V22Z" fill={fillColor} opacity={0.85}/>
      <rect x="19" y="27" width="10" height="9" rx="1" fill="rgba(0,0,0,0.3)"/>
    </svg>
  );
}

export function DragonIcon({ size = 44, ringColor = '#e24b4a', fillColor = '#e24b4a', bgColor = 'rgba(226,75,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <path d="M24 14C20 14 16 17 15 21C14 25 16 28 18 30L15 36H20L22 32C22.6 32.3 23.3 32.5 24 32.5C24.7 32.5 25.4 32.3 26 32L28 36H33L30 30C32 28 34 25 33 21C32 17 28 14 24 14Z" fill={fillColor}/>
      <path d="M18 14L15 11L17 16" fill={fillColor}/>
      <path d="M30 14L33 11L31 16" fill={fillColor}/>
    </svg>
  );
}

export function HealIcon({ size = 44, ringColor = '#00e5ff', fillColor = '#00e5ff', bgColor = 'rgba(0,229,255,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      <rect x="20" y="12" width="8" height="24" rx="2" fill={fillColor}/>
      <rect x="12" y="20" width="24" height="8" rx="2" fill={fillColor}/>
    </svg>
  );
}

export function ChestIcon({ size = 44, ringColor = '#c9a44a', fillColor = '#c9a44a', bgColor = 'rgba(201,164,74,0.12)', className }: SaoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="22.5" fill={bgColor} stroke={ringColor} strokeWidth="2"/>
      {/* Base do baú */}
      <rect x="11" y="26" width="26" height="13" rx="2" fill={fillColor}/>
      {/* Tampa */}
      <path d="M11 26C11 26 11 18 24 17C37 18 37 26 37 26Z" fill={fillColor} opacity="0.85"/>
      {/* Linha de divisão */}
      <rect x="11" y="25" width="26" height="2" rx="0" fill="rgba(0,0,0,0.25)"/>
      {/* Fecho central */}
      <rect x="21" y="23" width="6" height="6" rx="1.5" fill="rgba(0,0,0,0.35)"/>
      <rect x="22.5" y="24.5" width="3" height="3" rx="0.75" fill={fillColor} opacity="0.6"/>
      {/* Dobradiças */}
      <rect x="13" y="24.5" width="3" height="3" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="32" y="24.5" width="3" height="3" rx="1" fill="rgba(0,0,0,0.3)"/>
    </svg>
  );
}
