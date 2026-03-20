// Shared domain types for WIT Dungeon Quest

export type TitleType = "helper_of_week" | "presence_guardian" | "attitude_example";

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
