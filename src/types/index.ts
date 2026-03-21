// Shared domain types for WIT Dungeon Quest

export type TitleType = "helper_of_week" | "presence_guardian" | "attitude_example";

export type ItemCategory = "armamento" | "armadura" | "utilizavel" | "colecao" | "habilidade" | "token";

export const CATEGORY_META: Record<ItemCategory, { label: string; iconId: string; color: string }> = {
  armamento:  { label: "Armamento",  iconId: "sword",   color: "bg-orange-500/20 text-orange-400" },
  armadura:   { label: "Armadura",   iconId: "shield",  color: "bg-blue-500/20 text-blue-400" },
  utilizavel: { label: "Utilizável", iconId: "potion",  color: "bg-green-500/20 text-green-400" },
  colecao:    { label: "Coleção",    iconId: "star",    color: "bg-yellow-500/20 text-yellow-400" },
  habilidade: { label: "Habilidade", iconId: "wand",    color: "bg-purple-500/20 text-purple-400" },
  token:      { label: "Token",      iconId: "scroll",  color: "bg-amber-500/20 text-amber-400" },
};

export const ATTRIBUTES = [
  { key: "attr_forca",        label: "Força",         iconId: "sword" },
  { key: "attr_destreza",     label: "Destreza",      iconId: "bow" },
  { key: "attr_inteligencia", label: "Inteligência",  iconId: "wand" },
  { key: "attr_carisma",      label: "Carisma",       iconId: "heart" },
  { key: "attr_agilidade",    label: "Agilidade",     iconId: "flame" },
  { key: "attr_resistencia",  label: "Resistência",   iconId: "shield" },
] as const;

export type AttrKey = typeof ATTRIBUTES[number]["key"];

export interface Student {
  id: string;
  name: string;
  character_name: string | null;
  coins: number;
  level: number;
  class_id: string;
  teacher_id: string;
  race: string | null;
  character_class: string | null;
  motivation: string | null;
  lore: string | null;
  appearance: string | null;
  personality: string | null;
  presencas_consecutivas: number;
  profile_photo_url: string | null;
  /** Set when the student self-registered via Google OAuth. */
  user_id?: string | null;
  /** 'pending' = awaiting teacher approval, 'active' = full access. */
  status?: "pending" | "active" | "rejected";
  /** Points available to distribute across attributes */
  pontos_disponiveis?: number;
  // Character attributes
  attr_forca?: number;
  attr_destreza?: number;
  attr_inteligencia?: number;
  attr_carisma?: number;
  attr_agilidade?: number;
  attr_resistencia?: number;
}

export interface ShopItem {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  category: ItemCategory;
  cost: number;
  min_level: number;
  icon: string;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  attr_forca: number;
  attr_destreza: number;
  attr_inteligencia: number;
  attr_carisma: number;
  attr_agilidade: number;
  attr_resistencia: number;
}

export interface InventoryItem {
  id: string;
  student_id: string;
  item_id: string;
  added_at: string;
  item?: ShopItem;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  /** Present when queried by teacher; omitted in student-facing queries (only active are returned). */
  is_active?: boolean;
  challenge_type: "simples" | "unica";
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  /** Present when queried by teacher; omitted in student-facing queries (only active are returned). */
  is_active?: boolean;
  is_return_mission: boolean;
}

export interface MissionCompletion {
  id: string;
  mission_id: string;
  /** Populated in teacher-facing queries. */
  student_id?: string;
  status: "pending" | "approved" | "rejected";
  /** Populated in teacher-facing queries. */
  created_at?: string;
  student?: { id: string; name: string };
  mission?: Mission;
}

export interface StudentRequest {
  id: string;
  /** Populated in teacher-facing queries. */
  student_id?: string;
  request_type: "challenge" | "item" | "attendance";
  challenge_id: string | null;
  item_id: string | null;
  status: "pending" | "approved" | "rejected";
  /** Populated in teacher-facing queries. */
  created_at?: string;
  student?: Student;
  challenge?: Challenge;
}

export interface Class {
  id: string;
  name: string;
  /** Present in student-facing queries; omitted in some teacher queries. */
  teacher_id?: string;
  /** Present in teacher-facing queries. */
  created_at?: string;
}

export interface Teacher {
  id: string;
  name: string;
  /** Present when the full teacher row is fetched (auth context). */
  user_id?: string;
}

export interface StudentTitle {
  id: string;
  title_type: TitleType;
  expires_at: string;
  /** Present in teacher-facing queries. */
  student_id?: string;
}
