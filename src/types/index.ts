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
  /** School the student attends — used for the "escola" ranking scope. */
  school_name?: string | null;
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

// ─── Boss Battle types ────────────────────────────────────────────────────────

export interface BossBattle {
  id: string;
  teacher_id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  boss_name: string;
  boss_icon: string;
  boss_hp: number;
  reward_coins: number;
  reward_xp: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary';
  is_active: boolean;
  time_limit_minutes: number | null;
  created_at?: string;
}

export interface BossQuestion {
  id: string;
  boss_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text';
  options: string[] | null;
  correct_answer: string;
  damage: number;
  sort_order: number;
}

export interface BossAttempt {
  id: string;
  boss_id: string;
  student_id: string;
  answers: { question_id: string; answer: string; correct: boolean; damage_dealt: number }[];
  total_damage: number;
  boss_defeated: boolean;
  coins_earned: number;
  xp_earned: number;
  started_at: string;
  finished_at: string | null;
}

// ─── Guild types ──────────────────────────────────────────────────────────────

export interface Guild {
  id: string;
  teacher_id: string;
  name: string;
  emblem: string;
  description: string | null;
  level: number;
  xp: number;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  student_id: string;
  role: 'leader' | 'officer' | 'member';
  joined_at: string;
  student?: Student;
}

export interface GuildPost {
  id: string;
  guild_id: string;
  student_id: string;
  content: string;
  post_type: 'message' | 'achievement' | 'tip';
  created_at: string;
  student?: { name: string; character_name: string | null };
}

export interface PetType {
  id: string;
  teacher_id: string;
  name: string;
  icon: string;
  description: string | null;
  stage1_name: string;
  stage2_name: string;
  stage3_name: string;
  stage1_icon: string;
  stage2_icon: string;
  stage3_icon: string;
  bonus_type: 'xp' | 'coins' | 'streak_protection' | null;
  bonus_value: number | null;
  evolution_threshold_2: number;
  evolution_threshold_3: number;
  created_at: string;
}

export interface StudentPet {
  id: string;
  student_id: string;
  pet_type_id: string;
  name: string;
  xp: number;
  current_stage: number;
  is_active: boolean;
  adopted_at: string;
  pet_type?: PetType;
}

export interface SkillTree {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  icon: string;
  created_at?: string;
}

export interface SkillNode {
  id: string;
  tree_id: string;
  name: string;
  description: string | null;
  icon: string;
  parent_node_id: string | null;
  reward_coins: number;
  reward_title: string | null;
  position_x: number;
  position_y: number;
  sort_order: number;
  created_at?: string;
}

export interface SkillProgress {
  id: string;
  student_id: string;
  node_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  teacher_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  mentor?: Student;
  mentee?: Student;
}

export interface CraftRecipe {
  id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  icon: string;
  result_item_id: string | null;
  result_coins: number;
  result_xp: number;
  ingredient_nodes: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at?: string;
}

export interface StudentCraft {
  id: string;
  student_id: string;
  recipe_id: string;
  crafted_at: string;
}

export interface ChestType {
  id: string;
  teacher_id: string;
  name: string;
  tier: number;
  description: string | null;
  cost_coins: number;
  cost_diamonds: number;
  min_level: number;
  min_items: number;
  max_items: number;
  drop_common: number;
  drop_uncommon: number;
  drop_rare: number;
  drop_epic: number;
  drop_legendary: number;
  drop_mythic: number;
  bonus_coins_min: number;
  bonus_coins_max: number;
  bonus_xp_min: number;
  bonus_xp_max: number;
  is_active: boolean;
  is_limited: boolean;
  stock: number | null;
  created_at?: string;
}

export interface ChestOpening {
  id: string;
  student_id: string;
  chest_type_id: string;
  items_received: { item_id: string; item_name: string; rarity: string }[];
  bonus_coins: number;
  bonus_xp: number;
  opened_at: string;
}

// ─── Parent Portal types ──────────────────────────────────────────────────────

export interface ParentAccount {
  id: string;
  user_id: string;
  email: string;
  name: string;
}

export interface ParentInvite {
  id: string;
  student_id: string;
  teacher_id: string;
  invite_code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface ParentReport {
  id: string;
  student_id: string;
  teacher_id: string;
  report_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  report_data: Record<string, unknown>;
  created_at: string;
}
