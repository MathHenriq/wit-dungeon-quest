export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          reward: number
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward?: number
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward?: number
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          cost: number
          created_at: string
          description: string | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          item_type: string
          min_level: number
          name: string
          teacher_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          min_level?: number
          name: string
          teacher_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          min_level?: number
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_inventory: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          item_id: string
          student_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          item_id: string
          student_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          item_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_inventory_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_requests: {
        Row: {
          challenge_id: string | null
          created_at: string
          id: string
          item_id: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_requests_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          appearance: string | null
          character_class: string | null
          character_name: string | null
          class_id: string
          coins: number
          created_at: string
          id: string
          level: number
          lore: string | null
          motivation: string | null
          name: string
          personality: string | null
          presencas_consecutivas: number
          profile_photo_url: string | null
          race: string | null
        }
        Insert: {
          appearance?: string | null
          character_class?: string | null
          character_name?: string | null
          class_id: string
          coins?: number
          created_at?: string
          id?: string
          level?: number
          lore?: string | null
          motivation?: string | null
          name: string
          personality?: string | null
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
        }
        Update: {
          appearance?: string | null
          character_class?: string | null
          character_name?: string | null
          class_id?: string
          coins?: number
          created_at?: string
          id?: string
          level?: number
          lore?: string | null
          motivation?: string | null
          name?: string
          personality?: string | null
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_teacher_id: { Args: never; Returns: string }
      is_teacher_of_class: { Args: { class_id: string }; Returns: boolean }
      is_teacher_of_student: { Args: { student_id: string }; Returns: boolean }
    }
    Enums: {
      request_status: "pending" | "approved" | "rejected"
      request_type: "challenge" | "item" | "attendance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      request_status: ["pending", "approved", "rejected"],
      request_type: ["challenge", "item", "attendance"],
    },
  },
} as const
