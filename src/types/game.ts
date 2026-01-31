export interface Student {
  name: string;
  className: string;
  characterName: string;
  coins: number;
  level: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  requested: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  minLevel: number;
  type: 'weapon' | 'armor' | 'ability';
  icon: string;
}

export interface ItemRequest {
  itemId: string;
  itemName: string;
  timestamp: Date;
}

export interface ChallengeRequest {
  challengeId: string;
  challengeTitle: string;
  timestamp: Date;
}
