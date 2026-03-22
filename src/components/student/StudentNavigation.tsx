import React from "react";
import { Sword, ScrollText, Store, Package, Trophy, User, Skull, Shield } from "lucide-react";

export type StudentTab = 'challenges' | 'missions' | 'bosses' | 'guild' | 'shop' | 'inventory' | 'ranking' | 'character';

const NAV_ITEMS: { id: StudentTab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'challenges', label: 'Quests',  Icon: Sword },
  { id: 'missions',   label: 'Missões', Icon: ScrollText },
  { id: 'bosses',     label: 'Bosses',  Icon: Skull },
  { id: 'guild',      label: 'Guilda',  Icon: Shield },
  { id: 'shop',       label: 'Loja',    Icon: Store },
  { id: 'inventory',  label: 'Mochila', Icon: Package },
  { id: 'ranking',    label: 'Rank',    Icon: Trophy },
  { id: 'character',  label: 'Herói',   Icon: User },
];

interface StudentNavigationProps {
  activeTab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
}

export function StudentNavigation({ activeTab, onTabChange }: StudentNavigationProps) {
  return (
    <>
      {/* Mobile: scrollable bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: 'rgba(10, 14, 26, 0.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 229, 255, 0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            const isBoss = id === 'bosses';
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex-shrink-0 flex flex-col items-center gap-1 py-2.5 px-3 transition-colors relative"
                style={{
                  minWidth: '56px',
                  color: active ? (isBoss ? '#ef4444' : '#00e5ff') : 'rgba(255,255,255,0.3)',
                  background: active ? (isBoss ? 'rgba(239,68,68,0.06)' : 'rgba(0,229,255,0.05)') : 'transparent',
                  borderTop: active ? `2px solid ${isBoss ? '#ef4444' : '#00e5ff'}` : '2px solid transparent',
                }}
              >
                <Icon size={17} />
                <span className="text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col items-center py-20 gap-1 overflow-y-auto"
        style={{
          width: '72px',
          background: 'rgba(10, 14, 26, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(0, 229, 255, 0.06)',
          scrollbarWidth: 'none',
        }}
      >
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          const isBoss = id === 'bosses';
          const activeColor = isBoss ? '#ef4444' : '#00e5ff';
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              title={label}
              className="relative w-full flex flex-col items-center gap-1.5 py-3 transition-all group"
              style={{
                color: active ? activeColor : 'rgba(255,255,255,0.3)',
                background: active ? (isBoss ? 'rgba(239,68,68,0.08)' : 'rgba(0,229,255,0.08)') : 'transparent',
                borderLeft: active ? `2px solid ${activeColor}` : '2px solid transparent',
              }}
            >
              <Icon size={20} />
              <span className="text-[8px] font-semibold uppercase tracking-wider">{label}</span>
              <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(0,229,255,0.2)', color: activeColor }}>
                {label}
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );
}
