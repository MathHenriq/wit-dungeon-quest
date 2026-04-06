import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { EquipSlot } from './EquipSlot';
import type { EquippedItems, Item } from './inventory-types';

interface CharacterEquipProps {
  equipped:      EquippedItems;
  characterName: string;
  characterClass?: string;
  onSlotClick:   (item: Item | undefined, slotType: string) => void;
}

export function CharacterEquip({ equipped, characterName, characterClass, onSlotClick }: CharacterEquipProps) {
  const charRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (charRef.current) {
      gsap.from(charRef.current, {
        scale: 0.7,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.4)',
        delay: 0.1,
      });
    }
  }, []);

  return (
    <div className="char-equip">
      {/* Left slots */}
      <div className="char-slots-left">
        <EquipSlot slotType="head"      equippedItem={equipped.head}      onClick={() => onSlotClick(equipped.head, 'head')}      animDelay={0.15} />
        <EquipSlot slotType="armor"     equippedItem={equipped.armor}     onClick={() => onSlotClick(equipped.armor, 'armor')}     animDelay={0.20} />
        <EquipSlot slotType="accessory" equippedItem={equipped.accessory} onClick={() => onSlotClick(equipped.accessory, 'accessory')} animDelay={0.25} />
      </div>

      {/* Center character silhouette */}
      <div className="char-center" ref={charRef}>
        <div className="char-silhouette">
          <svg width="48" height="72" viewBox="0 0 48 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <circle cx="24" cy="10" r="7" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8"/>
            {/* Body */}
            <path d="M12 28 Q24 22 36 28 L38 50 Q24 56 10 50 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
            {/* Arms */}
            <path d="M12 30 L6 46" stroke="rgba(255,255,255,0.07)" strokeWidth="3" strokeLinecap="round"/>
            <path d="M36 30 L42 46" stroke="rgba(255,255,255,0.07)" strokeWidth="3" strokeLinecap="round"/>
            {/* Legs */}
            <path d="M18 50 L16 66" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M30 50 L32 66" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" strokeLinecap="round"/>
            {/* Gold accent */}
            <path d="M20 28 L24 26 L28 28" stroke="rgba(201,164,74,0.15)" strokeWidth="0.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="char-name">{characterName}</div>
        {characterClass && (
          <div className="char-class">{characterClass}</div>
        )}
      </div>

      {/* Right slots */}
      <div className="char-slots-right">
        <EquipSlot slotType="weapon"  equippedItem={equipped.weapon}  onClick={() => onSlotClick(equipped.weapon, 'weapon')}  animDelay={0.15} />
        <EquipSlot slotType="offhand" equippedItem={equipped.offhand} onClick={() => onSlotClick(equipped.offhand, 'offhand')} animDelay={0.20} />
        <EquipSlot slotType="ring"    equippedItem={equipped.ring}    onClick={() => onSlotClick(equipped.ring, 'ring')}    animDelay={0.25} />
      </div>
    </div>
  );
}
