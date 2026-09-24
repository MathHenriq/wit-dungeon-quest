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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abilities: {
        Row: {
          accuracy: number | null
          base_damage: number | null
          damage_type: string | null
          description: string | null
          effect_chance: number | null
          effect_type: string | null
          effect_value: number | null
          element_id: number | null
          energy_cost: number | null
          id: string
          name: string
          requirement: number | null
          tier: number | null
        }
        Insert: {
          accuracy?: number | null
          base_damage?: number | null
          damage_type?: string | null
          description?: string | null
          effect_chance?: number | null
          effect_type?: string | null
          effect_value?: number | null
          element_id?: number | null
          energy_cost?: number | null
          id: string
          name: string
          requirement?: number | null
          tier?: number | null
        }
        Update: {
          accuracy?: number | null
          base_damage?: number | null
          damage_type?: string | null
          description?: string | null
          effect_chance?: number | null
          effect_type?: string | null
          effect_value?: number | null
          element_id?: number | null
          energy_cost?: number | null
          id?: string
          name?: string
          requirement?: number | null
          tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "abilities_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "elements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_feed: {
        Row: {
          achievement_data: Json
          achievement_type: string
          created_at: string
          id: string
          message: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          achievement_data?: Json
          achievement_type: string
          created_at?: string
          id?: string
          message: string
          student_id: string
          teacher_id: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          created_at?: string
          id?: string
          message?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_feed_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "achievement_feed_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_feed_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_feed_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_reactions: {
        Row: {
          created_at: string
          feed_item_id: string
          id: string
          reaction: string
          student_id: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          id?: string
          reaction?: string
          student_id: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          id?: string
          reaction?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_reactions_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "achievement_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_reactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "achievement_reactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_reactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_secret: boolean | null
          name: string
          requirement_type: string | null
          requirement_value: number | null
          reward_coins: number | null
          reward_diamonds: number | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          icon_url?: string | null
          id: string
          is_secret?: boolean | null
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
          reward_coins?: number | null
          reward_diamonds?: number | null
        }
        Update: {
          category?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_secret?: boolean | null
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
          reward_coins?: number | null
          reward_diamonds?: number | null
        }
        Relationships: []
      }
      action_log: {
        Row: {
          action: string
          actor_name: string | null
          actor_role: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: number
          payload: Json
          target_id: string | null
          target_label: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_role: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: number
          payload?: Json
          target_id?: string | null
          target_label?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_role?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: number
          payload?: Json
          target_id?: string | null
          target_label?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          class_id: string | null
          created_at: string
          event_data: Json
          event_type: string
          id: string
          student_id: string | null
          teacher_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          student_id?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          student_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "analytics_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_catalog: {
        Row: {
          condition_payload: Json
          condition_value: number | null
          created_at: string
          description: string | null
          id: string
          image_data: Json
          is_active: boolean
          key: string
          name: string
          rarity: string
          unlock_condition: string
        }
        Insert: {
          condition_payload?: Json
          condition_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_data?: Json
          is_active?: boolean
          key: string
          name: string
          rarity?: string
          unlock_condition: string
        }
        Update: {
          condition_payload?: Json
          condition_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_data?: Json
          is_active?: boolean
          key?: string
          name?: string
          rarity?: string
          unlock_condition?: string
        }
        Relationships: []
      }
      battle_history: {
        Row: {
          character_id: string | null
          coins_gained: number | null
          created_at: string | null
          diamonds_gained: number | null
          duration_seconds: number | null
          enemy_level: number | null
          enemy_name: string | null
          id: string
          is_boss: boolean | null
          items_dropped: Json | null
          result: string | null
          xp_gained: number | null
        }
        Insert: {
          character_id?: string | null
          coins_gained?: number | null
          created_at?: string | null
          diamonds_gained?: number | null
          duration_seconds?: number | null
          enemy_level?: number | null
          enemy_name?: string | null
          id?: string
          is_boss?: boolean | null
          items_dropped?: Json | null
          result?: string | null
          xp_gained?: number | null
        }
        Update: {
          character_id?: string | null
          coins_gained?: number | null
          created_at?: string | null
          diamonds_gained?: number | null
          duration_seconds?: number | null
          enemy_level?: number | null
          enemy_name?: string | null
          id?: string
          is_boss?: boolean | null
          items_dropped?: Json | null
          result?: string | null
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_attempts: {
        Row: {
          answers: Json
          boss_defeated: boolean
          boss_id: string
          coins_earned: number
          finished_at: string | null
          id: string
          started_at: string
          student_id: string
          total_damage: number
          xp_earned: number
        }
        Insert: {
          answers?: Json
          boss_defeated?: boolean
          boss_id: string
          coins_earned?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          student_id: string
          total_damage?: number
          xp_earned?: number
        }
        Update: {
          answers?: Json
          boss_defeated?: boolean
          boss_id?: string
          coins_earned?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          student_id?: string
          total_damage?: number
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "boss_attempts_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "boss_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "boss_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_battles: {
        Row: {
          boss_hp: number
          boss_icon: string
          boss_name: string
          class_id: string | null
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          reward_coins: number
          reward_xp: number
          teacher_id: string
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          boss_hp?: number
          boss_icon?: string
          boss_name?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          reward_coins?: number
          reward_xp?: number
          teacher_id: string
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          boss_hp?: number
          boss_icon?: string
          boss_name?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          reward_coins?: number
          reward_xp?: number
          teacher_id?: string
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_battles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_battles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_questions: {
        Row: {
          boss_id: string
          correct_answer: string
          created_at: string
          damage: number
          difficulty: number | null
          explanation: string | null
          id: string
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
          topic: string | null
        }
        Insert: {
          boss_id: string
          correct_answer: string
          created_at?: string
          damage?: number
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
          topic?: string | null
        }
        Update: {
          boss_id?: string
          correct_answer?: string
          created_at?: string
          damage?: number
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boss_questions_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "boss_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_raid_attacks: {
        Row: {
          damage: number
          id: string
          occurred_at: string
          phase: number
          raid_id: string
          student_id: string
          was_killshot: boolean
        }
        Insert: {
          damage: number
          id?: string
          occurred_at?: string
          phase: number
          raid_id: string
          student_id: string
          was_killshot?: boolean
        }
        Update: {
          damage?: number
          id?: string
          occurred_at?: string
          phase?: number
          raid_id?: string
          student_id?: string
          was_killshot?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "boss_raid_attacks_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "boss_raids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_attacks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "boss_raid_attacks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_attacks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_raid_contributions: {
        Row: {
          attacks_count: number
          damage_dealt: number
          last_attack_at: string | null
          raid_id: string
          student_id: string
        }
        Insert: {
          attacks_count?: number
          damage_dealt?: number
          last_attack_at?: string | null
          raid_id: string
          student_id: string
        }
        Update: {
          attacks_count?: number
          damage_dealt?: number
          last_attack_at?: string | null
          raid_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_raid_contributions_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "boss_raids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_contributions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "boss_raid_contributions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_contributions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_raid_rewards: {
        Row: {
          awarded_at: string
          chests_awarded: Json
          coins_awarded: number
          contribution_pct: number
          diamonds_awarded: number
          id: string
          is_top: boolean
          raid_id: string
          student_id: string
          victory: boolean
        }
        Insert: {
          awarded_at?: string
          chests_awarded?: Json
          coins_awarded?: number
          contribution_pct?: number
          diamonds_awarded?: number
          id?: string
          is_top?: boolean
          raid_id: string
          student_id: string
          victory: boolean
        }
        Update: {
          awarded_at?: string
          chests_awarded?: Json
          coins_awarded?: number
          contribution_pct?: number
          diamonds_awarded?: number
          id?: string
          is_top?: boolean
          raid_id?: string
          student_id?: string
          victory?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "boss_raid_rewards_raid_id_fkey"
            columns: ["raid_id"]
            isOneToOne: false
            referencedRelation: "boss_raids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "boss_raid_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raid_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      boss_raids: {
        Row: {
          boss_id: string
          boss_name: string
          boss_sprite: string | null
          created_at: string
          created_by: string | null
          current_hp: number
          defeated_at: string | null
          ends_at: string
          guild_id: string
          id: string
          max_attacks_per_member: number
          phase: number
          starts_at: string
          status: string
          total_hp: number
        }
        Insert: {
          boss_id: string
          boss_name: string
          boss_sprite?: string | null
          created_at?: string
          created_by?: string | null
          current_hp: number
          defeated_at?: string | null
          ends_at: string
          guild_id: string
          id?: string
          max_attacks_per_member?: number
          phase?: number
          starts_at?: string
          status?: string
          total_hp: number
        }
        Update: {
          boss_id?: string
          boss_name?: string
          boss_sprite?: string | null
          created_at?: string
          created_by?: string | null
          current_hp?: number
          defeated_at?: string | null
          ends_at?: string
          guild_id?: string
          id?: string
          max_attacks_per_member?: number
          phase?: number
          starts_at?: string
          status?: string
          total_hp?: number
        }
        Relationships: [
          {
            foreignKeyName: "boss_raids_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raids_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild_ranking_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boss_raids_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      card_creation_tickets: {
        Row: {
          created_at: string
          id: string
          proposed_effect: string | null
          proposed_image_url: string | null
          proposed_lore: string | null
          proposed_name: string | null
          proposed_notes: string | null
          proposed_rarity: string | null
          ranking_type: string
          resulting_shop_item_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposed_effect?: string | null
          proposed_image_url?: string | null
          proposed_lore?: string | null
          proposed_name?: string | null
          proposed_notes?: string | null
          proposed_rarity?: string | null
          ranking_type: string
          resulting_shop_item_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          submitted_at?: string | null
          teacher_id: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          proposed_effect?: string | null
          proposed_image_url?: string | null
          proposed_lore?: string | null
          proposed_name?: string | null
          proposed_notes?: string | null
          proposed_rarity?: string | null
          ranking_type?: string
          resulting_shop_item_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          teacher_id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_creation_tickets_resulting_shop_item_id_fkey"
            columns: ["resulting_shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_creation_tickets_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "card_creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_creation_tickets_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      card_skins: {
        Row: {
          base_card_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          unlock_condition: string
          unlock_payload: Json
          visual_data: Json
        }
        Insert: {
          base_card_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          unlock_condition: string
          unlock_payload?: Json
          visual_data?: Json
        }
        Update: {
          base_card_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          unlock_condition?: string
          unlock_payload?: Json
          visual_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "card_skins_base_card_id_fkey"
            columns: ["base_card_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          reward: number
          teacher_id: string
          title: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward?: number
          teacher_id: string
          title: string
        }
        Update: {
          challenge_type?: string
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
      character_abilities: {
        Row: {
          ability_id: string | null
          character_id: string
          slot: number
        }
        Insert: {
          ability_id?: string | null
          character_id: string
          slot: number
        }
        Update: {
          ability_id?: string | null
          character_id?: string
          slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_abilities_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_abilities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_achievements: {
        Row: {
          achievement_id: string
          character_id: string
          progress: number | null
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: string
          character_id: string
          progress?: number | null
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string
          character_id?: string
          progress?: number | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_achievements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_inventory: {
        Row: {
          character_id: string
          item_id: string
          quantity: number | null
        }
        Insert: {
          character_id: string
          item_id: string
          quantity?: number | null
        }
        Update: {
          character_id?: string
          item_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      character_progress: {
        Row: {
          best_time_seconds: number | null
          boss_defeated: boolean | null
          character_id: string
          completed_at: string | null
          enemies_defeated: number | null
          floor_id: number
          times_completed: number | null
        }
        Insert: {
          best_time_seconds?: number | null
          boss_defeated?: boolean | null
          character_id: string
          completed_at?: string | null
          enemies_defeated?: number | null
          floor_id: number
          times_completed?: number | null
        }
        Update: {
          best_time_seconds?: number | null
          boss_defeated?: boolean | null
          character_id?: string
          completed_at?: string | null
          enemies_defeated?: number | null
          floor_id?: number
          times_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "character_progress_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_progress_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          agilidade: number | null
          carisma: number | null
          class: string | null
          coins: number | null
          created_at: string | null
          destreza: number | null
          diamonds: number | null
          energy_max: number | null
          forca: number | null
          free_points: number | null
          hp_current: number | null
          hp_max: number | null
          id: string
          inteligencia: number | null
          level: number | null
          name: string | null
          pts_dark: number | null
          pts_electric: number | null
          pts_fighting: number | null
          pts_fire: number | null
          pts_flying: number | null
          pts_ghost: number | null
          pts_grass: number | null
          pts_ground: number | null
          pts_ice: number | null
          pts_poison: number | null
          pts_steel: number | null
          pts_water: number | null
          resistencia: number | null
          sprite_normal: string | null
          sprite_pixel_attack: string | null
          sprite_pixel_back: string | null
          sprite_pixel_front: string | null
          updated_at: string | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          agilidade?: number | null
          carisma?: number | null
          class?: string | null
          coins?: number | null
          created_at?: string | null
          destreza?: number | null
          diamonds?: number | null
          energy_max?: number | null
          forca?: number | null
          free_points?: number | null
          hp_current?: number | null
          hp_max?: number | null
          id?: string
          inteligencia?: number | null
          level?: number | null
          name?: string | null
          pts_dark?: number | null
          pts_electric?: number | null
          pts_fighting?: number | null
          pts_fire?: number | null
          pts_flying?: number | null
          pts_ghost?: number | null
          pts_grass?: number | null
          pts_ground?: number | null
          pts_ice?: number | null
          pts_poison?: number | null
          pts_steel?: number | null
          pts_water?: number | null
          resistencia?: number | null
          sprite_normal?: string | null
          sprite_pixel_attack?: string | null
          sprite_pixel_back?: string | null
          sprite_pixel_front?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          agilidade?: number | null
          carisma?: number | null
          class?: string | null
          coins?: number | null
          created_at?: string | null
          destreza?: number | null
          diamonds?: number | null
          energy_max?: number | null
          forca?: number | null
          free_points?: number | null
          hp_current?: number | null
          hp_max?: number | null
          id?: string
          inteligencia?: number | null
          level?: number | null
          name?: string | null
          pts_dark?: number | null
          pts_electric?: number | null
          pts_fighting?: number | null
          pts_fire?: number | null
          pts_flying?: number | null
          pts_ghost?: number | null
          pts_grass?: number | null
          pts_ground?: number | null
          pts_ice?: number | null
          pts_poison?: number | null
          pts_steel?: number | null
          pts_water?: number | null
          resistencia?: number | null
          sprite_normal?: string | null
          sprite_pixel_attack?: string | null
          sprite_pixel_back?: string | null
          sprite_pixel_front?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      chest_item_pool: {
        Row: {
          chest_type_id: string
          id: string
          item_id: string
          weight: number
        }
        Insert: {
          chest_type_id: string
          id?: string
          item_id: string
          weight?: number
        }
        Update: {
          chest_type_id?: string
          id?: string
          item_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "chest_item_pool_chest_type_id_fkey"
            columns: ["chest_type_id"]
            isOneToOne: false
            referencedRelation: "chest_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chest_item_pool_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      chest_openings: {
        Row: {
          bonus_coins: number
          bonus_xp: number
          chest_type_id: string
          id: string
          items_received: Json
          opened_at: string
          student_id: string
        }
        Insert: {
          bonus_coins?: number
          bonus_xp?: number
          chest_type_id: string
          id?: string
          items_received?: Json
          opened_at?: string
          student_id: string
        }
        Update: {
          bonus_coins?: number
          bonus_xp?: number
          chest_type_id?: string
          id?: string
          items_received?: Json
          opened_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chest_openings_chest_type_id_fkey"
            columns: ["chest_type_id"]
            isOneToOne: false
            referencedRelation: "chest_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chest_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "chest_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chest_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chest_subpercent_weights: {
        Row: {
          chest_key: string
          rarity: string
          weight_bp: number
        }
        Insert: {
          chest_key: string
          rarity: string
          weight_bp: number
        }
        Update: {
          chest_key?: string
          rarity?: string
          weight_bp?: number
        }
        Relationships: []
      }
      chest_types: {
        Row: {
          bonus_coins_max: number
          bonus_coins_min: number
          bonus_xp_max: number
          bonus_xp_min: number
          card_pool: Json | null
          chest_key: string | null
          cost_coins: number
          cost_diamonds: number
          created_at: string
          description: string | null
          drop_common: number
          drop_epic: number
          drop_legendary: number
          drop_mythic: number
          drop_rare: number
          drop_uncommon: number
          drop_unknown: number
          event_id: string | null
          id: string
          is_active: boolean
          is_limited: boolean
          max_items: number
          min_items: number
          min_level: number
          name: string
          stock: number | null
          teacher_id: string | null
          tier: number
        }
        Insert: {
          bonus_coins_max?: number
          bonus_coins_min?: number
          bonus_xp_max?: number
          bonus_xp_min?: number
          card_pool?: Json | null
          chest_key?: string | null
          cost_coins?: number
          cost_diamonds?: number
          created_at?: string
          description?: string | null
          drop_common?: number
          drop_epic?: number
          drop_legendary?: number
          drop_mythic?: number
          drop_rare?: number
          drop_uncommon?: number
          drop_unknown?: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          max_items?: number
          min_items?: number
          min_level?: number
          name: string
          stock?: number | null
          teacher_id?: string | null
          tier?: number
        }
        Update: {
          bonus_coins_max?: number
          bonus_coins_min?: number
          bonus_xp_max?: number
          bonus_xp_min?: number
          card_pool?: Json | null
          chest_key?: string | null
          cost_coins?: number
          cost_diamonds?: number
          created_at?: string
          description?: string | null
          drop_common?: number
          drop_epic?: number
          drop_legendary?: number
          drop_mythic?: number
          drop_rare?: number
          drop_uncommon?: number
          drop_unknown?: number
          event_id?: string | null
          id?: string
          is_active?: boolean
          is_limited?: boolean
          max_items?: number
          min_items?: number
          min_level?: number
          name?: string
          stock?: number | null
          teacher_id?: string | null
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "chest_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chest_types_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      class_wars: {
        Row: {
          class_a_id: string
          class_a_score: number
          class_b_id: string
          class_b_score: number
          created_at: string
          description: string | null
          ends_at: string
          id: string
          reward_coins: number
          starts_at: string
          status: string
          teacher_id: string
          title: string
          winner_class_id: string | null
        }
        Insert: {
          class_a_id: string
          class_a_score?: number
          class_b_id: string
          class_b_score?: number
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          reward_coins?: number
          starts_at?: string
          status?: string
          teacher_id: string
          title: string
          winner_class_id?: string | null
        }
        Update: {
          class_a_id?: string
          class_a_score?: number
          class_b_id?: string
          class_b_score?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          reward_coins?: number
          starts_at?: string
          status?: string
          teacher_id?: string
          title?: string
          winner_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_wars_class_a_id_fkey"
            columns: ["class_a_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_wars_class_b_id_fkey"
            columns: ["class_b_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_wars_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_wars_winner_class_id_fkey"
            columns: ["winner_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          biome: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          biome?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          biome?: string | null
          created_at?: string
          description?: string | null
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
      consumables: {
        Row: {
          created_at: string
          description: string
          effect: string
          effect_value: number
          icon: string
          id: string
          key: string
          name: string
          rarity: Database["public"]["Enums"]["material_rarity"]
        }
        Insert: {
          created_at?: string
          description?: string
          effect: string
          effect_value?: number
          icon?: string
          id?: string
          key: string
          name: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
        }
        Update: {
          created_at?: string
          description?: string
          effect?: string
          effect_value?: number
          icon?: string
          id?: string
          key?: string
          name?: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
        }
        Relationships: []
      }
      craft_recipes: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          ingredient_nodes: Json
          name: string
          rarity: string
          result_coins: number | null
          result_item_id: string | null
          result_xp: number | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          ingredient_nodes?: Json
          name: string
          rarity?: string
          result_coins?: number | null
          result_item_id?: string | null
          result_xp?: number | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          ingredient_nodes?: Json
          name?: string
          rarity?: string
          result_coins?: number | null
          result_item_id?: string | null
          result_xp?: number | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "craft_recipes_result_item_id_fkey"
            columns: ["result_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craft_recipes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      creation_tickets: {
        Row: {
          card_created_id: string | null
          created_at: string
          granted_at: string
          id: string
          master_notes: string | null
          ranking_type: string
          requested_at: string | null
          student_id: string
          used_at: string | null
          week_start: string
        }
        Insert: {
          card_created_id?: string | null
          created_at?: string
          granted_at?: string
          id?: string
          master_notes?: string | null
          ranking_type: string
          requested_at?: string | null
          student_id: string
          used_at?: string | null
          week_start: string
        }
        Update: {
          card_created_id?: string | null
          created_at?: string
          granted_at?: string
          id?: string
          master_notes?: string | null
          ranking_type?: string
          requested_at?: string | null
          student_id?: string
          used_at?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "creation_tickets_card_created_id_fkey"
            columns: ["card_created_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creation_tickets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_currency_log: {
        Row: {
          coins_earned_today: number
          log_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coins_earned_today?: number
          log_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coins_earned_today?: number
          log_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_dungeon_attempts: {
        Row: {
          coins_earned: number
          completed: boolean
          created_at: string
          day_seed: number
          floors_completed: number
          id: string
          student_id: string
          xp_earned: number
        }
        Insert: {
          coins_earned?: number
          completed?: boolean
          created_at?: string
          day_seed: number
          floors_completed?: number
          id?: string
          student_id: string
          xp_earned?: number
        }
        Update: {
          coins_earned?: number
          completed?: boolean
          created_at?: string
          day_seed?: number
          floors_completed?: number
          id?: string
          student_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_dungeon_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "daily_dungeon_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_dungeon_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quest_pool: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          id: string
          is_active: boolean
          key: string
          reward_coins: number
          reward_diamonds: number
        }
        Insert: {
          category: string
          condition_type: string
          condition_value: number
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          key: string
          reward_coins?: number
          reward_diamonds?: number
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          key?: string
          reward_coins?: number
          reward_diamonds?: number
        }
        Relationships: []
      }
      drop_items: {
        Row: {
          base_sell_value: number
          created_at: string
          description: string | null
          floor_theme: string
          id: string
          name: string
          rarity: Database["public"]["Enums"]["drop_rarity"]
        }
        Insert: {
          base_sell_value: number
          created_at?: string
          description?: string | null
          floor_theme: string
          id?: string
          name: string
          rarity: Database["public"]["Enums"]["drop_rarity"]
        }
        Update: {
          base_sell_value?: number
          created_at?: string
          description?: string | null
          floor_theme?: string
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["drop_rarity"]
        }
        Relationships: []
      }
      element_mastery_log: {
        Row: {
          element: string
          mastered_at: string
          student_id: string
        }
        Insert: {
          element: string
          mastered_at?: string
          student_id: string
        }
        Update: {
          element?: string
          mastered_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "element_mastery_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "element_mastery_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "element_mastery_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      elements: {
        Row: {
          color_hex: string | null
          icon_url: string | null
          id: number
          name: string
        }
        Insert: {
          color_hex?: string | null
          icon_url?: string | null
          id?: number
          name: string
        }
        Update: {
          color_hex?: string | null
          icon_url?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      enemies: {
        Row: {
          ability_1: string | null
          ability_2: string | null
          ability_3: string | null
          ability_4: string | null
          atk: number | null
          created_at: string | null
          def_fisica: number | null
          def_magica: number | null
          description: string | null
          element_type: string | null
          element_type_secondary: string | null
          floor_id: number | null
          hp_max: number | null
          icon_type: string
          id: string
          is_boss: boolean | null
          level: number | null
          lore: string | null
          name: string | null
          position_x: number
          position_y: number
          skills: Json | null
          special_ability_effect: string | null
          special_ability_name: string | null
          special_trigger: string | null
          sprite_id: string | null
          sprite_url: string | null
          title: string | null
          velocidade: number | null
        }
        Insert: {
          ability_1?: string | null
          ability_2?: string | null
          ability_3?: string | null
          ability_4?: string | null
          atk?: number | null
          created_at?: string | null
          def_fisica?: number | null
          def_magica?: number | null
          description?: string | null
          element_type?: string | null
          element_type_secondary?: string | null
          floor_id?: number | null
          hp_max?: number | null
          icon_type?: string
          id?: string
          is_boss?: boolean | null
          level?: number | null
          lore?: string | null
          name?: string | null
          position_x?: number
          position_y?: number
          skills?: Json | null
          special_ability_effect?: string | null
          special_ability_name?: string | null
          special_trigger?: string | null
          sprite_id?: string | null
          sprite_url?: string | null
          title?: string | null
          velocidade?: number | null
        }
        Update: {
          ability_1?: string | null
          ability_2?: string | null
          ability_3?: string | null
          ability_4?: string | null
          atk?: number | null
          created_at?: string | null
          def_fisica?: number | null
          def_magica?: number | null
          description?: string | null
          element_type?: string | null
          element_type_secondary?: string | null
          floor_id?: number | null
          hp_max?: number | null
          icon_type?: string
          id?: string
          is_boss?: boolean | null
          level?: number | null
          lore?: string | null
          name?: string | null
          position_x?: number
          position_y?: number
          skills?: Json | null
          special_ability_effect?: string | null
          special_ability_name?: string | null
          special_trigger?: string | null
          sprite_id?: string | null
          sprite_url?: string | null
          title?: string | null
          velocidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enemies_ability_1_fkey"
            columns: ["ability_1"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemies_ability_2_fkey"
            columns: ["ability_2"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemies_ability_3_fkey"
            columns: ["ability_3"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemies_ability_4_fkey"
            columns: ["ability_4"]
            isOneToOne: false
            referencedRelation: "abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemies_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      enemy_drop_table: {
        Row: {
          drop_chance: number
          drop_item_id: string
          enemy_id: string
          id: string
          max_quantity: number
          min_quantity: number
        }
        Insert: {
          drop_chance: number
          drop_item_id: string
          enemy_id: string
          id?: string
          max_quantity?: number
          min_quantity?: number
        }
        Update: {
          drop_chance?: number
          drop_item_id?: string
          enemy_id?: string
          id?: string
          max_quantity?: number
          min_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "enemy_drop_table_drop_item_id_fkey"
            columns: ["drop_item_id"]
            isOneToOne: false
            referencedRelation: "drop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enemy_drop_table_enemy_id_fkey"
            columns: ["enemy_id"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cards: {
        Row: {
          created_at: string
          event_id: string
          id: string
          migrated_at: string | null
          migrated_to_pool: boolean
          shop_item_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          migrated_at?: string | null
          migrated_to_pool?: boolean
          shop_item_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          migrated_at?: string | null
          migrated_to_pool?: boolean
          shop_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cards_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_fragments: {
        Row: {
          battles_count: number
          bosses_count: number
          event_id: string
          fragments: number
          last_drop_at: string | null
          student_id: string
        }
        Insert: {
          battles_count?: number
          bosses_count?: number
          event_id: string
          fragments?: number
          last_drop_at?: string | null
          student_id: string
        }
        Update: {
          battles_count?: number
          bosses_count?: number
          event_id?: string
          fragments?: number
          last_drop_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_fragments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fragments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "event_fragments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_fragments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      event_vault_openings: {
        Row: {
          event_id: string
          fragments_total: number
          id: string
          opened_at: string
          rewards: Json
          shown_at: string | null
          student_id: string
        }
        Insert: {
          event_id: string
          fragments_total: number
          id?: string
          opened_at?: string
          rewards?: Json
          shown_at?: string | null
          student_id: string
        }
        Update: {
          event_id?: string
          fragments_total?: number
          id?: string
          opened_at?: string
          rewards?: Json
          shown_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_vault_openings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vault_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "event_vault_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vault_openings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image_url: string | null
          color_primary: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          ends_at: string | null
          event_boss_id: string | null
          id: string
          name: string
          started_at: string | null
          starts_at: string | null
          status: string
          teacher_id: string | null
          theme: string | null
        }
        Insert: {
          banner_image_url?: string | null
          color_primary?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          ends_at?: string | null
          event_boss_id?: string | null
          id?: string
          name: string
          started_at?: string | null
          starts_at?: string | null
          status?: string
          teacher_id?: string | null
          theme?: string | null
        }
        Update: {
          banner_image_url?: string | null
          color_primary?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          ends_at?: string | null
          event_boss_id?: string | null
          id?: string
          name?: string
          started_at?: string | null
          starts_at?: string | null
          status?: string
          teacher_id?: string | null
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_event_boss_id_fkey"
            columns: ["event_boss_id"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_boss_quizzes: {
        Row: {
          boss_battle_id: string
          created_at: string | null
          floor_id: number
          id: string
        }
        Insert: {
          boss_battle_id: string
          created_at?: string | null
          floor_id: number
          id?: string
        }
        Update: {
          boss_battle_id?: string
          created_at?: string | null
          floor_id?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_boss_quizzes_boss_battle_id_fkey"
            columns: ["boss_battle_id"]
            isOneToOne: false
            referencedRelation: "boss_battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_boss_quizzes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: true
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_enemy_defeats: {
        Row: {
          character_id: string
          defeated_at: string
          enemy_id: string
        }
        Insert: {
          character_id: string
          defeated_at?: string
          enemy_id: string
        }
        Update: {
          character_id?: string
          defeated_at?: string
          enemy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floor_enemy_defeats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_enemy_defeats_enemy_id_fkey"
            columns: ["enemy_id"]
            isOneToOne: false
            referencedRelation: "enemies"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          created_at: string | null
          created_by: string | null
          floor_number: number | null
          id: number
          level_max: number | null
          level_min: number | null
          lore: string | null
          lore_description: string | null
          lore_history: string | null
          lore_warning: string | null
          name: string | null
          theme: string | null
          visual_accent_color: string | null
          visual_fog_color: string | null
          visual_fog_opacity: number | null
          visual_particle_type: string | null
          visual_primary_color: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          floor_number?: number | null
          id?: number
          level_max?: number | null
          level_min?: number | null
          lore?: string | null
          lore_description?: string | null
          lore_history?: string | null
          lore_warning?: string | null
          name?: string | null
          theme?: string | null
          visual_accent_color?: string | null
          visual_fog_color?: string | null
          visual_fog_opacity?: number | null
          visual_particle_type?: string | null
          visual_primary_color?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          floor_number?: number | null
          id?: number
          level_max?: number | null
          level_min?: number | null
          lore?: string | null
          lore_description?: string | null
          lore_history?: string | null
          lore_warning?: string | null
          name?: string | null
          theme?: string | null
          visual_accent_color?: string | null
          visual_fog_color?: string | null
          visual_fog_opacity?: number | null
          visual_particle_type?: string | null
          visual_primary_color?: string | null
        }
        Relationships: []
      }
      forge_recipes: {
        Row: {
          buff_id: string | null
          consumable_id: string | null
          created_at: string
          description: string
          icon: string
          id: string
          ingredients: Json
          key: string
          name: string
          rarity: Database["public"]["Enums"]["material_rarity"]
          result_type: string
        }
        Insert: {
          buff_id?: string | null
          consumable_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          ingredients?: Json
          key: string
          name: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
          result_type: string
        }
        Update: {
          buff_id?: string | null
          consumable_id?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          ingredients?: Json
          key?: string
          name?: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
          result_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forge_recipes_buff_id_fkey"
            columns: ["buff_id"]
            isOneToOne: false
            referencedRelation: "temporary_buffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forge_recipes_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_join_requests: {
        Row: {
          created_at: string
          guild_id: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          guild_id: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          guild_id?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_join_requests_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild_ranking_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_join_requests_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_join_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "guild_join_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_join_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string
          role: string
          student_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
          student_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild_ranking_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "guild_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_missions: {
        Row: {
          created_at: string
          deadline_days: number | null
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          required: number
          reward_coins: number
          reward_xp: number
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          required?: number
          reward_coins?: number
          reward_xp?: number
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          deadline_days?: number | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          required?: number
          reward_coins?: number
          reward_xp?: number
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_missions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_posts: {
        Row: {
          content: string
          created_at: string
          guild_id: string
          id: string
          post_type: string
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          guild_id: string
          id?: string
          post_type?: string
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          guild_id?: string
          id?: string
          post_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_posts_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild_ranking_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "guild_posts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_posts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string
          description: string | null
          emblem: string
          emblem_color: string
          id: string
          level: number
          max_members: number
          name: string
          teacher_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emblem?: string
          emblem_color?: string
          id?: string
          level?: number
          max_members?: number
          name: string
          teacher_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emblem?: string
          emblem_color?: string
          id?: string
          level?: number
          max_members?: number
          name?: string
          teacher_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "guilds_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          description: string | null
          effect_type: string | null
          effect_value: number | null
          icon_url: string | null
          id: string
          name: string
          rarity: string | null
          shop_price_coins: number | null
          shop_price_diamonds: number | null
          type: string | null
        }
        Insert: {
          description?: string | null
          effect_type?: string | null
          effect_value?: number | null
          icon_url?: string | null
          id: string
          name: string
          rarity?: string | null
          shop_price_coins?: number | null
          shop_price_diamonds?: number | null
          type?: string | null
        }
        Update: {
          description?: string | null
          effect_type?: string | null
          effect_value?: number | null
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string | null
          shop_price_coins?: number | null
          shop_price_diamonds?: number | null
          type?: string | null
        }
        Relationships: []
      }
      loot_tables: {
        Row: {
          drop_chance: number | null
          floor_id: number | null
          id: number
          is_boss: boolean | null
          item_id: string | null
          max_quantity: number | null
          min_quantity: number | null
        }
        Insert: {
          drop_chance?: number | null
          floor_id?: number | null
          id?: number
          is_boss?: boolean | null
          item_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
        }
        Update: {
          drop_chance?: number | null
          floor_id?: number | null
          id?: number
          is_boss?: boolean | null
          item_id?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loot_tables_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loot_tables_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      lore_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          teacher_id: string
          tip_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          teacher_id: string
          tip_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          teacher_id?: string
          tip_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lore_tips_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          rarity: Database["public"]["Enums"]["material_rarity"]
          theme: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
          theme?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
          theme?: string
        }
        Relationships: []
      }
      mentorships: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          status: string
          teacher_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          status?: string
          teacher_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_completions: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "student_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "mission_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_types: {
        Row: {
          bonus_type: string | null
          bonus_value: number | null
          created_at: string
          description: string | null
          evolution_threshold_2: number
          evolution_threshold_3: number
          icon: string
          id: string
          name: string
          stage1_icon: string
          stage1_name: string
          stage2_icon: string
          stage2_name: string
          stage3_icon: string
          stage3_name: string
          teacher_id: string
        }
        Insert: {
          bonus_type?: string | null
          bonus_value?: number | null
          created_at?: string
          description?: string | null
          evolution_threshold_2?: number
          evolution_threshold_3?: number
          icon?: string
          id?: string
          name: string
          stage1_icon?: string
          stage1_name?: string
          stage2_icon?: string
          stage2_name?: string
          stage3_icon?: string
          stage3_name?: string
          teacher_id: string
        }
        Update: {
          bonus_type?: string | null
          bonus_value?: number | null
          created_at?: string
          description?: string | null
          evolution_threshold_2?: number
          evolution_threshold_3?: number
          icon?: string
          id?: string
          name?: string
          stage1_icon?: string
          stage1_name?: string
          stage2_icon?: string
          stage2_name?: string
          stage3_icon?: string
          stage3_name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_types_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_matches: {
        Row: {
          challenger_id: string
          challenger_score: number
          created_at: string
          finished_at: string | null
          id: string
          opponent_id: string
          opponent_score: number
          questions: Json | null
          reward_coins: number
          status: string
          teacher_id: string
          winner_id: string | null
        }
        Insert: {
          challenger_id: string
          challenger_score?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          opponent_id: string
          opponent_score?: number
          questions?: Json | null
          reward_coins?: number
          status?: string
          teacher_id: string
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string
          challenger_score?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          opponent_id?: string
          opponent_score?: number
          questions?: Json | null
          reward_coins?: number
          status?: string
          teacher_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pvp_matches_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pvp_matches_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pvp_matches_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pvp_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_presence: {
        Row: {
          last_seen: string
          student_id: string
        }
        Insert: {
          last_seen?: string
          student_id: string
        }
        Update: {
          last_seen?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pvp_presence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pvp_presence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_presence_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_rating_history: {
        Row: {
          character_id: string | null
          created_at: string | null
          id: number
          match_id: string | null
          new_rating: number | null
          old_rating: number | null
          rating_change: number | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string | null
          id?: number
          match_id?: string | null
          new_rating?: number | null
          old_rating?: number | null
          rating_change?: number | null
        }
        Update: {
          character_id?: string | null
          created_at?: string | null
          id?: number
          match_id?: string | null
          new_rating?: number | null
          old_rating?: number | null
          rating_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pvp_rating_history_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_rating_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "pvp_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_stats: {
        Row: {
          best_win_streak: number | null
          character_id: string
          draws: number | null
          highest_rating: number | null
          losses: number | null
          rating: number | null
          total_damage_dealt: number | null
          total_damage_received: number | null
          updated_at: string | null
          win_streak: number | null
          wins: number | null
        }
        Insert: {
          best_win_streak?: number | null
          character_id: string
          draws?: number | null
          highest_rating?: number | null
          losses?: number | null
          rating?: number | null
          total_damage_dealt?: number | null
          total_damage_received?: number | null
          updated_at?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Update: {
          best_win_streak?: number | null
          character_id?: string
          draws?: number | null
          highest_rating?: number | null
          losses?: number | null
          rating?: number | null
          total_damage_dealt?: number | null
          total_damage_received?: number | null
          updated_at?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pvp_stats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_student_stats: {
        Row: {
          losses: number
          rating: number
          student_id: string
          updated_at: string
          win_streak: number
          wins: number
        }
        Insert: {
          losses?: number
          rating?: number
          student_id: string
          updated_at?: string
          win_streak?: number
          wins?: number
        }
        Update: {
          losses?: number
          rating?: number
          student_id?: string
          updated_at?: string
          win_streak?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "pvp_student_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "pvp_student_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pvp_student_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pvp_weekly_rewards: {
        Row: {
          character_id: string | null
          claimed: boolean | null
          coins_earned: number | null
          diamonds_earned: number | null
          id: number
          week_start: string | null
          wins: number | null
        }
        Insert: {
          character_id?: string | null
          claimed?: boolean | null
          coins_earned?: number | null
          diamonds_earned?: number | null
          id?: number
          week_start?: string | null
          wins?: number | null
        }
        Update: {
          character_id?: string | null
          claimed?: boolean | null
          coins_earned?: number | null
          diamonds_earned?: number | null
          id?: number
          week_start?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pvp_weekly_rewards_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      school_feed_events: {
        Row: {
          class_id: string | null
          created_at: string
          event_data: Json
          event_type: string
          guild_id: string | null
          id: string
          student_id: string
          teacher_id: string
          views_count: number
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          event_data?: Json
          event_type: string
          guild_id?: string | null
          id?: string
          student_id: string
          teacher_id: string
          views_count?: number
        }
        Update: {
          class_id?: string | null
          created_at?: string
          event_data?: Json
          event_type?: string
          guild_id?: string | null
          id?: string
          student_id?: string
          teacher_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "school_feed_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild_ranking_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_events_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "school_feed_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_feed_views: {
        Row: {
          event_id: string
          student_id: string
          viewed_at: string
        }
        Insert: {
          event_id: string
          student_id: string
          viewed_at?: string
        }
        Update: {
          event_id?: string
          student_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_feed_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "school_feed_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_views_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "school_feed_views_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_feed_views_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          ability_config: Json
          ability_description: string | null
          ability_key: string | null
          ability_mode: string
          ability_name: string | null
          attr_agilidade: number
          attr_carisma: number
          attr_destreza: number
          attr_forca: number
          attr_inteligencia: number
          attr_resistencia: number
          category: string
          cost: number
          created_at: string
          description: string | null
          diamond_cost: number
          event_id: string | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          is_event_exclusive: boolean
          is_premium: boolean
          item_type: string
          min_level: number
          name: string
          rarity: string
          source_anime: string | null
          teacher_id: string | null
        }
        Insert: {
          ability_config?: Json
          ability_description?: string | null
          ability_key?: string | null
          ability_mode?: string
          ability_name?: string | null
          attr_agilidade?: number
          attr_carisma?: number
          attr_destreza?: number
          attr_forca?: number
          attr_inteligencia?: number
          attr_resistencia?: number
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          diamond_cost?: number
          event_id?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_event_exclusive?: boolean
          is_premium?: boolean
          item_type?: string
          min_level?: number
          name: string
          rarity?: string
          source_anime?: string | null
          teacher_id?: string | null
        }
        Update: {
          ability_config?: Json
          ability_description?: string | null
          ability_key?: string | null
          ability_mode?: string
          ability_name?: string | null
          attr_agilidade?: number
          attr_carisma?: number
          attr_destreza?: number
          attr_forca?: number
          attr_inteligencia?: number
          attr_resistencia?: number
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          diamond_cost?: number
          event_id?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_event_exclusive?: boolean
          is_premium?: boolean
          item_type?: string
          min_level?: number
          name?: string
          rarity?: string
          source_anime?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_items_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_nodes: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_node_id: string | null
          position_x: number
          position_y: number
          reward_coins: number | null
          reward_title: string | null
          sort_order: number
          tree_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_node_id?: string | null
          position_x?: number
          position_y?: number
          reward_coins?: number | null
          reward_title?: string | null
          sort_order?: number
          tree_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_node_id?: string | null
          position_x?: number
          position_y?: number
          reward_coins?: number | null
          reward_title?: string | null
          sort_order?: number
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_nodes_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "skill_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_trees: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_trees_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_active_buffs: {
        Row: {
          battles_left: number
          buff_id: string
          granted_at: string
          student_id: string
        }
        Insert: {
          battles_left: number
          buff_id: string
          granted_at?: string
          student_id: string
        }
        Update: {
          battles_left?: number
          buff_id?: string
          granted_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_active_buffs_buff_id_fkey"
            columns: ["buff_id"]
            isOneToOne: false
            referencedRelation: "temporary_buffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_active_buffs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_active_buffs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_active_buffs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attribute_points: {
        Row: {
          agilidade: number
          carisma: number
          destreza: number
          forca: number
          inteligencia: number
          resistencia: number
          student_id: string
        }
        Insert: {
          agilidade?: number
          carisma?: number
          destreza?: number
          forca?: number
          inteligencia?: number
          resistencia?: number
          student_id: string
        }
        Update: {
          agilidade?: number
          carisma?: number
          destreza?: number
          forca?: number
          inteligencia?: number
          resistencia?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attribute_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_attribute_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attribute_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_audit_log: {
        Row: {
          changed_at: string
          changed_by_role: string | null
          changed_by_user_id: string | null
          column_name: string
          id: number
          new_value: string | null
          old_value: string | null
          student_id: string
        }
        Insert: {
          changed_at?: string
          changed_by_role?: string | null
          changed_by_user_id?: string | null
          column_name: string
          id?: number
          new_value?: string | null
          old_value?: string | null
          student_id: string
        }
        Update: {
          changed_at?: string
          changed_by_role?: string | null
          changed_by_user_id?: string | null
          column_name?: string
          id?: number
          new_value?: string | null
          old_value?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_audit_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_audit_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_audit_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_card_usage: {
        Row: {
          shop_item_id: string
          student_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          shop_item_id: string
          student_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          shop_item_id?: string
          student_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_card_usage_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_card_usage_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_card_usage_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_card_usage_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_chest_grants: {
        Row: {
          chest_key: string
          granted_at: string
          id: string
          opened_at: string | null
          reason: string | null
          source_payload: Json
          student_id: string
        }
        Insert: {
          chest_key: string
          granted_at?: string
          id?: string
          opened_at?: string | null
          reason?: string | null
          source_payload?: Json
          student_id: string
        }
        Update: {
          chest_key?: string
          granted_at?: string
          id?: string
          opened_at?: string | null
          reason?: string | null
          source_payload?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_chest_grants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_chest_grants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_chest_grants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_class_profile: {
        Row: {
          chose_class_at: string | null
          class_type: string | null
          is_veteran_onboarded: boolean
          last_element_reset_at: string | null
          primary_element: string | null
          secondary_element: string | null
          student_id: string
        }
        Insert: {
          chose_class_at?: string | null
          class_type?: string | null
          is_veteran_onboarded?: boolean
          last_element_reset_at?: string | null
          primary_element?: string | null
          secondary_element?: string | null
          student_id: string
        }
        Update: {
          chose_class_at?: string | null
          class_type?: string | null
          is_veteran_onboarded?: boolean
          last_element_reset_at?: string | null
          primary_element?: string | null
          secondary_element?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_class_profile_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_class_profile_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_profile_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_consumables: {
        Row: {
          consumable_id: string
          quantity: number
          student_id: string
          updated_at: string
        }
        Insert: {
          consumable_id: string
          quantity?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          consumable_id?: string
          quantity?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_consumables_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_consumables_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_consumables_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_consumables_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_crafts: {
        Row: {
          crafted_at: string
          id: string
          recipe_id: string
          student_id: string
        }
        Insert: {
          crafted_at?: string
          id?: string
          recipe_id: string
          student_id: string
        }
        Update: {
          crafted_at?: string
          id?: string
          recipe_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_crafts_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "craft_recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_crafts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_crafts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_crafts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_daily_counters: {
        Row: {
          counter_type: string
          date: string
          student_id: string
          value: number
        }
        Insert: {
          counter_type: string
          date: string
          student_id: string
          value?: number
        }
        Update: {
          counter_type?: string
          date?: string
          student_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_counters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_daily_counters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_daily_counters_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_daily_quests: {
        Row: {
          assigned_date: string
          completed_at: string | null
          id: string
          progress: number
          quest_id: string
          student_id: string
        }
        Insert: {
          assigned_date: string
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id: string
          student_id: string
        }
        Update: {
          assigned_date?: string
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "daily_quest_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_daily_quests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_daily_quests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_daily_quests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_drop_inventory: {
        Row: {
          acquired_at: string
          drop_item_id: string
          id: string
          quantity: number
          student_id: string
        }
        Insert: {
          acquired_at?: string
          drop_item_id: string
          id?: string
          quantity?: number
          student_id: string
        }
        Update: {
          acquired_at?: string
          drop_item_id?: string
          id?: string
          quantity?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_drop_inventory_drop_item_id_fkey"
            columns: ["drop_item_id"]
            isOneToOne: false
            referencedRelation: "drop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drop_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_drop_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drop_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_inventory: {
        Row: {
          added_at: string
          added_by: string | null
          equipped_slot: string | null
          id: string
          is_equipped: boolean | null
          item_id: string
          student_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          equipped_slot?: string | null
          id?: string
          is_equipped?: boolean | null
          item_id: string
          student_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          equipped_slot?: string | null
          id?: string
          is_equipped?: boolean | null
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
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
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
      student_inventory_materials: {
        Row: {
          material_id: string
          quantity: number
          student_id: string
          updated_at: string
        }
        Insert: {
          material_id: string
          quantity?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          material_id?: string
          quantity?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_inventory_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_inventory_materials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_inventory_materials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_inventory_materials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_missions: {
        Row: {
          condition_payload: Json | null
          condition_target: number | null
          condition_type: string | null
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          is_active: boolean
          is_return_mission: boolean
          reward: number
          reward_chest_key: string | null
          reward_diamonds: number
          reward_fragments: number
          teacher_id: string
          title: string
        }
        Insert: {
          condition_payload?: Json | null
          condition_target?: number | null
          condition_type?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          is_return_mission?: boolean
          reward?: number
          reward_chest_key?: string | null
          reward_diamonds?: number
          reward_fragments?: number
          teacher_id: string
          title: string
        }
        Update: {
          condition_payload?: Json | null
          condition_target?: number | null
          condition_type?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          is_return_mission?: boolean
          reward?: number
          reward_chest_key?: string | null
          reward_diamonds?: number
          reward_fragments?: number
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_missions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_missions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_pending_rewards: {
        Row: {
          body: string | null
          claimed_at: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          student_id: string
          title: string
        }
        Insert: {
          body?: string | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          student_id: string
          title: string
        }
        Update: {
          body?: string | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_pending_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_pending_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pending_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_pets: {
        Row: {
          adopted_at: string
          current_stage: number
          id: string
          is_active: boolean
          name: string
          pet_type_id: string
          student_id: string
          xp: number
        }
        Insert: {
          adopted_at?: string
          current_stage?: number
          id?: string
          is_active?: boolean
          name?: string
          pet_type_id: string
          student_id: string
          xp?: number
        }
        Update: {
          adopted_at?: string
          current_stage?: number
          id?: string
          is_active?: boolean
          name?: string
          pet_type_id?: string
          student_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_pets_pet_type_id_fkey"
            columns: ["pet_type_id"]
            isOneToOne: false
            referencedRelation: "pet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_pets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_quest_streak: {
        Row: {
          current_streak: number
          last_completed_date: string | null
          longest_streak: number
          student_id: string
          updated_at: string
        }
        Insert: {
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          current_streak?: number
          last_completed_date?: string | null
          longest_streak?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_quest_streak_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_quest_streak_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_quest_streak_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
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
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
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
      student_skill_points: {
        Row: {
          available_points: number
          student_id: string
          total_earned: number
        }
        Insert: {
          available_points?: number
          student_id: string
          total_earned?: number
        }
        Update: {
          available_points?: number
          student_id?: string
          total_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_skill_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_skill_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skill_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skill_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          node_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          node_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          node_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_skill_progress_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "skill_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skill_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_skill_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skill_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_titles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string
          id: string
          student_id: string
          title_type: Database["public"]["Enums"]["student_title_type"]
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at: string
          id?: string
          student_id: string
          title_type: Database["public"]["Enums"]["student_title_type"]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string
          id?: string
          student_id?: string
          title_type?: Database["public"]["Enums"]["student_title_type"]
        }
        Relationships: [
          {
            foreignKeyName: "student_titles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_backdrops: {
        Row: {
          backdrop_key: string
          is_favorite: boolean
          student_id: string
          unlocked_at: string
        }
        Insert: {
          backdrop_key: string
          is_favorite?: boolean
          student_id: string
          unlocked_at?: string
        }
        Update: {
          backdrop_key?: string
          is_favorite?: boolean
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_backdrops_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_backdrops_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_backdrops_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_banners: {
        Row: {
          banner_id: string
          id: string
          source: string | null
          student_id: string
          unlocked_at: string
        }
        Insert: {
          banner_id: string
          id?: string
          source?: string | null
          student_id: string
          unlocked_at?: string
        }
        Update: {
          banner_id?: string
          id?: string
          source?: string | null
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_banners_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banner_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_banners_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_banners_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_banners_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_evolutions: {
        Row: {
          evolution_id: string
          student_id: string
          unlocked_at: string
        }
        Insert: {
          evolution_id: string
          student_id: string
          unlocked_at?: string
        }
        Update: {
          evolution_id?: string
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_evolutions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_evolutions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_evolutions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_skills: {
        Row: {
          skill_id: string
          student_id: string
          unlocked_at: string
        }
        Insert: {
          skill_id: string
          student_id: string
          unlocked_at?: string
        }
        Update: {
          skill_id?: string
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_skins: {
        Row: {
          equipped: boolean
          id: string
          skin_id: string
          source: string | null
          student_id: string
          unlocked_at: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          skin_id: string
          source?: string | null
          student_id: string
          unlocked_at?: string
        }
        Update: {
          equipped?: boolean
          id?: string
          skin_id?: string
          source?: string | null
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_skins_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "card_skins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_skins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_skins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_skins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_unlocked_titles: {
        Row: {
          id: string
          is_active: boolean
          student_id: string
          title_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          student_id: string
          title_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          student_id?: string
          title_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_unlocked_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_unlocked_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_titles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_unlocked_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "title_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active_banner_key: string | null
          appearance: string | null
          attr_agilidade: number
          attr_carisma: number
          attr_destreza: number
          attr_forca: number
          attr_inteligencia: number
          attr_resistencia: number
          character_class: string | null
          character_name: string | null
          class_id: string
          coins: number
          created_at: string
          diamonds: number
          difficulty_level: string
          id: string
          is_mentor: boolean
          is_test_account: boolean
          level: number
          lore: string | null
          mentor_xp: number
          motivation: string | null
          name: string
          needs_return_mission: boolean
          patch_1_1_refund: number | null
          patch_1_1_wipe_v: number
          personality: string | null
          pontos_disponiveis: number
          presencas_consecutivas: number
          profile_photo_url: string | null
          race: string | null
          seen_patch_1_1: boolean
          status: string
          streak_best: number
          streak_current: number
          streak_last_activity: string | null
          suspended_reason: string | null
          suspended_until: string | null
          teacher_id: string
          total_boss_kills: number
          total_crafts: number
          total_missions_completed: number
          total_pvp_wins: number
          tutorial_completed: boolean
          user_id: string | null
          wiped_at_patch_1_1: string | null
          xp: number
        }
        Insert: {
          active_banner_key?: string | null
          appearance?: string | null
          attr_agilidade?: number
          attr_carisma?: number
          attr_destreza?: number
          attr_forca?: number
          attr_inteligencia?: number
          attr_resistencia?: number
          character_class?: string | null
          character_name?: string | null
          class_id: string
          coins?: number
          created_at?: string
          diamonds?: number
          difficulty_level?: string
          id?: string
          is_mentor?: boolean
          is_test_account?: boolean
          level?: number
          lore?: string | null
          mentor_xp?: number
          motivation?: string | null
          name: string
          needs_return_mission?: boolean
          patch_1_1_refund?: number | null
          patch_1_1_wipe_v?: number
          personality?: string | null
          pontos_disponiveis?: number
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
          seen_patch_1_1?: boolean
          status?: string
          streak_best?: number
          streak_current?: number
          streak_last_activity?: string | null
          suspended_reason?: string | null
          suspended_until?: string | null
          teacher_id: string
          total_boss_kills?: number
          total_crafts?: number
          total_missions_completed?: number
          total_pvp_wins?: number
          tutorial_completed?: boolean
          user_id?: string | null
          wiped_at_patch_1_1?: string | null
          xp?: number
        }
        Update: {
          active_banner_key?: string | null
          appearance?: string | null
          attr_agilidade?: number
          attr_carisma?: number
          attr_destreza?: number
          attr_forca?: number
          attr_inteligencia?: number
          attr_resistencia?: number
          character_class?: string | null
          character_name?: string | null
          class_id?: string
          coins?: number
          created_at?: string
          diamonds?: number
          difficulty_level?: string
          id?: string
          is_mentor?: boolean
          is_test_account?: boolean
          level?: number
          lore?: string | null
          mentor_xp?: number
          motivation?: string | null
          name?: string
          needs_return_mission?: boolean
          patch_1_1_refund?: number | null
          patch_1_1_wipe_v?: number
          personality?: string | null
          pontos_disponiveis?: number
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
          seen_patch_1_1?: boolean
          status?: string
          streak_best?: number
          streak_current?: number
          streak_last_activity?: string | null
          suspended_reason?: string | null
          suspended_until?: string | null
          teacher_id?: string
          total_boss_kills?: number
          total_crafts?: number
          total_missions_completed?: number
          total_pvp_wins?: number
          tutorial_completed?: boolean
          user_id?: string | null
          wiped_at_patch_1_1?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_rewards: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          teacher_id: string
          unit_label_plural: string
          unit_label_singular: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          teacher_id: string
          unit_label_plural?: string
          unit_label_singular?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          teacher_id?: string
          unit_label_plural?: string
          unit_label_singular?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_rewards_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      temporary_buffs: {
        Row: {
          created_at: string
          description: string
          duration_battles: number
          effect: string
          effect_value: number
          icon: string
          id: string
          key: string
          name: string
          rarity: Database["public"]["Enums"]["material_rarity"]
        }
        Insert: {
          created_at?: string
          description?: string
          duration_battles?: number
          effect: string
          effect_value?: number
          icon?: string
          id?: string
          key: string
          name: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
        }
        Update: {
          created_at?: string
          description?: string
          duration_battles?: number
          effect?: string
          effect_value?: number
          icon?: string
          id?: string
          key?: string
          name?: string
          rarity?: Database["public"]["Enums"]["material_rarity"]
        }
        Relationships: []
      }
      time_capsules: {
        Row: {
          goals: string | null
          id: string
          is_active: boolean
          message: string | null
          open_date: string
          opened: boolean
          opened_at: string | null
          sealed_at: string
          snapshot_data: Json
          student_id: string
          teacher_id: string
        }
        Insert: {
          goals?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          open_date: string
          opened?: boolean
          opened_at?: string | null
          sealed_at?: string
          snapshot_data?: Json
          student_id: string
          teacher_id: string
        }
        Update: {
          goals?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          open_date?: string
          opened?: boolean
          opened_at?: string | null
          sealed_at?: string
          snapshot_data?: Json
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_capsules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "time_capsules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_capsules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_capsules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      title_catalog: {
        Row: {
          auto_unlock: boolean
          category: string
          color: string
          condition_payload: Json
          condition_type: string
          condition_value: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
        }
        Insert: {
          auto_unlock?: boolean
          category: string
          color: string
          condition_payload?: Json
          condition_type: string
          condition_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
        }
        Update: {
          auto_unlock?: boolean
          category?: string
          color?: string
          condition_payload?: Json
          condition_type?: string
          condition_value?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      trade_items: {
        Row: {
          id: string
          item_id: string
          side: string
          trade_id: string
        }
        Insert: {
          id?: string
          item_id: string
          side: string
          trade_id: string
        }
        Update: {
          id?: string
          item_id?: string
          side?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          coins_amount: number
          created_at: string
          id: string
          proposer_id: string
          proposer_item_id: string
          receiver_id: string
          receiver_item_id: string | null
          resolved_at: string | null
          status: string
          teacher_id: string
        }
        Insert: {
          coins_amount?: number
          created_at?: string
          id?: string
          proposer_id: string
          proposer_item_id: string
          receiver_id: string
          receiver_item_id?: string | null
          resolved_at?: string | null
          status?: string
          teacher_id: string
        }
        Update: {
          coins_amount?: number
          created_at?: string
          id?: string
          proposer_id?: string
          proposer_item_id?: string
          receiver_id?: string
          receiver_item_id?: string | null
          resolved_at?: string | null
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "trades_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_proposer_item_id_fkey"
            columns: ["proposer_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiver_item_id_fkey"
            columns: ["receiver_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_rankings_snapshot: {
        Row: {
          class_id: string | null
          created_at: string
          entity_id: string
          entity_name: string | null
          id: number
          position: number
          ranking_type: string
          score: number
          teacher_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          entity_id: string
          entity_name?: string | null
          id?: number
          position: number
          ranking_type: string
          score: number
          teacher_id: string
          week_end: string
          week_start: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          id?: number
          position?: number
          ranking_type?: string
          score?: number
          teacher_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_rankings_snapshot_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_rankings_snapshot_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_rewards_log: {
        Row: {
          distributed_at: string
          entity_id: string
          id: number
          ranking_type: string
          reward_kind: string
          reward_payload: Json
          week_start: string
        }
        Insert: {
          distributed_at?: string
          entity_id: string
          id?: number
          ranking_type: string
          reward_kind: string
          reward_payload?: Json
          week_start: string
        }
        Update: {
          distributed_at?: string
          entity_id?: string
          id?: number
          ranking_type?: string
          reward_kind?: string
          reward_payload?: Json
          week_start?: string
        }
        Relationships: []
      }
      weekly_xp_baseline: {
        Row: {
          baseline_xp: number
          captured_at: string
          student_id: string
          week_start: string
        }
        Insert: {
          baseline_xp?: number
          captured_at?: string
          student_id: string
          week_start: string
        }
        Update: {
          baseline_xp?: number
          captured_at?: string
          student_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_xp_baseline_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "master_wave11_classes_view"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "weekly_xp_baseline_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_xp_baseline_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      guild_ranking_global: {
        Row: {
          avg_member_level: number | null
          created_at: string | null
          emblem: string | null
          emblem_color: string | null
          id: string | null
          level: number | null
          member_count: number | null
          name: string | null
          score: number | null
          teacher_id: string | null
          total_member_xp: number | null
          total_pvp_wins: number | null
          xp: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guilds_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      master_wave11_classes_view: {
        Row: {
          available_points: number | null
          chose_class_at: string | null
          class_id: string | null
          class_name: string | null
          elements_mastered: number | null
          primary_element: string | null
          secondary_element: string | null
          skills_unlocked: number | null
          student_id: string | null
          student_name: string | null
          total_earned: number | null
          wave11_class: string | null
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
      student_profiles: {
        Row: {
          active_banner_key: string | null
          attr_agilidade: number | null
          attr_carisma: number | null
          attr_destreza: number | null
          attr_forca: number | null
          attr_inteligencia: number | null
          attr_resistencia: number | null
          character_class: string | null
          character_name: string | null
          class_id: string | null
          coins: number | null
          id: string | null
          is_mentor: boolean | null
          is_test_account: boolean | null
          level: number | null
          name: string | null
          presencas_consecutivas: number | null
          profile_photo_url: string | null
          race: string | null
          status: string | null
          streak_best: number | null
          streak_current: number | null
          teacher_id: string | null
          total_boss_kills: number | null
          total_crafts: number | null
          total_missions_completed: number | null
          total_pvp_wins: number | null
          xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _brt_today: { Args: never; Returns: string }
      _bump_quest_streak: {
        Args: { p_student_id: string; p_today: string }
        Returns: number
      }
      _crypto_rand_int: { Args: { p_n: number }; Returns: number }
      _emit_feed_event: {
        Args: { p_event_data: Json; p_event_type: string; p_student_id: string }
        Returns: string
      }
      _frame_for_student: { Args: { p_student_id: string }; Returns: string }
      _pick_monthly_boss: { Args: { p_month_idx: number }; Returns: string }
      _raid_phase: {
        Args: { p_current: number; p_total: number }
        Returns: number
      }
      _spawn_raid_for_guild: {
        Args: {
          p_body: string
          p_boss_id: string
          p_guild_id: string
          p_hours: number
          p_source: string
          p_title: string
        }
        Returns: string
      }
      _unlock_title_if_new: {
        Args: { p_student_id: string; p_title_id: string }
        Returns: boolean
      }
      add_class_war_points: {
        Args: { p_class_id: string; p_points: number }
        Returns: undefined
      }
      add_item_to_inventory: {
        Args: { p_character_id: string; p_item_id: string; p_quantity: number }
        Returns: undefined
      }
      admin_assign_student_to_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: undefined
      }
      admin_delete_student: { Args: { p_student_id: string }; Returns: string }
      admin_delete_student_as: {
        Args: { p_caller_user_id: string; p_student_id: string }
        Returns: string
      }
      admin_delete_teacher: { Args: { p_teacher_id: string }; Returns: string }
      admin_delete_teacher_as: {
        Args: { p_caller_user_id: string; p_teacher_id: string }
        Returns: string
      }
      apply_battle_drops: {
        Args: { p_enemy_id: string; p_student_id: string }
        Returns: {
          base_sell_value: number
          drop_item_id: string
          floor_theme: string
          name: string
          quantity: number
          rarity: Database["public"]["Enums"]["drop_rarity"]
        }[]
      }
      apply_battle_event_fragments: {
        Args: { p_is_boss?: boolean }
        Returns: Json
      }
      apply_battle_materials: {
        Args: {
          p_enemy_id: string
          p_floor_number?: number
          p_student_id: string
        }
        Returns: {
          out_icon_url: string
          out_material_id: string
          out_name: string
          out_quantity: number
          out_rarity: Database["public"]["Enums"]["material_rarity"]
          out_theme: string
        }[]
      }
      apply_battle_rewards: {
        Args: { p_coins: number; p_xp: number }
        Returns: Json
      }
      apply_daily_coin_cap: { Args: { p_amount: number }; Returns: Json }
      apply_patch11_wipe: { Args: never; Returns: Json }
      approve_attendance_request: {
        Args: { p_request_id: string }
        Returns: number
      }
      approve_challenge_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      approve_mission_completion: {
        Args: { p_completion_id: string }
        Returns: undefined
      }
      assign_daily_quests_for: {
        Args: { p_date: string; p_student_id: string }
        Returns: number
      }
      assign_daily_quests_tick: { Args: never; Returns: Json }
      attach_event_card: {
        Args: { p_event_id: string; p_shop_item_id: string }
        Returns: Json
      }
      attack_boss_raid: {
        Args: { p_damage: number; p_raid_id: string }
        Returns: Json
      }
      award_skill_points: {
        Args: { p_points: number; p_student_id: string }
        Returns: Json
      }
      brt_week_start: { Args: { p_at?: string }; Returns: string }
      calculate_guild_score: { Args: { p_guild_id: string }; Returns: number }
      calculate_level_from_xp: { Args: { total_xp: number }; Returns: number }
      can_act_for_student: { Args: { p_student_id: string }; Returns: boolean }
      can_act_for_teacher: { Args: { p_teacher_id: string }; Returns: boolean }
      cancel_event: { Args: { p_event_id: string }; Returns: Json }
      check_all_title_conditions: { Args: never; Returns: Json }
      check_element_mastery: { Args: { p_student_id: string }; Returns: Json }
      check_my_achievements: {
        Args: { p_grant_diamonds?: boolean }
        Returns: Json
      }
      check_my_banner_conditions: { Args: never; Returns: Json }
      check_my_daily_quests: { Args: never; Returns: Json }
      check_my_event_missions: { Args: never; Returns: Json }
      check_my_title_conditions: { Args: never; Returns: Json }
      check_title_conditions_for: {
        Args: { p_student_id: string }
        Returns: Json
      }
      chest_ping: { Args: never; Returns: string }
      choose_class_and_element: {
        Args: { p_class: string; p_primary_element: string }
        Returns: Json
      }
      claim_my_pending_rewards: { Args: { p_ids?: string[] }; Returns: number }
      complete_daily_dungeon: {
        Args: {
          p_coins: number
          p_completed: boolean
          p_day_seed: number
          p_floors: number
          p_student_id: string
          p_xp: number
        }
        Returns: undefined
      }
      complete_my_tutorial: { Args: never; Returns: Json }
      complete_skill_node: {
        Args: { p_node_id: string; p_student_id: string }
        Returns: Json
      }
      compute_weekly_rankings: { Args: never; Returns: Json }
      consume_my_consumable: {
        Args: { p_consumable_key: string }
        Returns: Json
      }
      convert_diamonds_to_coins: { Args: { p_amount: number }; Returns: Json }
      craft_item: {
        Args: { p_recipe_id: string; p_student_id: string }
        Returns: Json
      }
      create_event: {
        Args: {
          p_banner_url?: string
          p_color?: string
          p_description: string
          p_ends_at?: string
          p_name: string
          p_starts_at?: string
          p_theme: string
        }
        Returns: Json
      }
      create_mentorship: {
        Args: { p_mentee_id: string; p_mentor_id: string; p_teacher_id: string }
        Returns: undefined
      }
      distribute_raid_rewards: { Args: { p_raid_id: string }; Returns: Json }
      distribute_weekly_rewards: {
        Args: { p_week_start?: string }
        Returns: Json
      }
      end_event: { Args: { p_event_id: string }; Returns: Json }
      ensure_my_daily_quests: { Args: never; Returns: Json }
      equip_skin: { Args: { p_skin_id: string }; Returns: Json }
      event_lifecycle_tick: { Args: never; Returns: Json }
      execute_trade: { Args: { p_trade_id: string }; Returns: Json }
      expire_raids_tick: { Args: never; Returns: Json }
      finalize_class_war: { Args: { p_war_id: string }; Returns: Json }
      first_two_names: { Args: { p: string }; Returns: string }
      forge_recipe: { Args: { p_recipe_key: string }; Returns: Json }
      gen_group_code: { Args: never; Returns: string }
      get_active_raid_for_guild: { Args: { p_guild_id: string }; Returns: Json }
      get_analytics_overview: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_audit_alerts: {
        Args: never
        Returns: {
          actor_name: string
          count: number
          detail: string
          kind: string
          last_seen: string
          sample_id: number
          severity: string
          title: string
        }[]
      }
      get_audit_log_page: {
        Args: {
          p_action?: string
          p_actor_role?: string
          p_actor_user_id?: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_target_id?: string
          p_target_table?: string
          p_to?: string
        }
        Returns: {
          action: string
          actor_name: string
          actor_role: string
          actor_user_id: string
          after_state: Json
          before_state: Json
          created_at: string
          id: number
          payload: Json
          target_id: string
          target_label: string
          target_table: string
          total_count: number
        }[]
      }
      get_card_skins_for: {
        Args: { p_base_card_id: string }
        Returns: {
          description: string
          equipped: boolean
          name: string
          skin_id: string
          unlock_condition: string
          unlock_payload: Json
          unlocked: boolean
          usage_count: number
          visual_data: Json
        }[]
      }
      get_class_comparison: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_daily_activity: {
        Args: { p_class_id?: string; p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_daily_coins_summary: { Args: never; Returns: Json }
      get_engagement_heatmap: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_event_detail: { Args: { p_event_id: string }; Returns: Json }
      get_my_backdrops: {
        Args: never
        Returns: {
          backdrop_key: string
          is_favorite: boolean
          unlocked_at: string
        }[]
      }
      get_my_banner_catalog: {
        Args: never
        Returns: {
          banner_id: string
          condition_label: string
          description: string
          image_data: Json
          is_active: boolean
          key: string
          name: string
          rarity: string
          unlocked: boolean
        }[]
      }
      get_my_card_tickets: {
        Args: never
        Returns: {
          created_at: string
          id: string
          proposed_effect: string | null
          proposed_image_url: string | null
          proposed_lore: string | null
          proposed_name: string | null
          proposed_notes: string | null
          proposed_rarity: string | null
          ranking_type: string
          resulting_shop_item_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
          week_start: string
        }[]
        SetofOptions: {
          from: "*"
          to: "card_creation_tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_chest_grants: {
        Args: never
        Returns: {
          chest_key: string
          granted_at: string
          id: string
          reason: string
        }[]
      }
      get_my_creation_tickets: {
        Args: never
        Returns: {
          granted_at: string
          id: string
          ranking_type: string
          requested_at: string
          status: string
          used_at: string
          week_start: string
        }[]
      }
      get_my_daily_quests: { Args: never; Returns: Json }
      get_my_equipped_skins: {
        Args: never
        Returns: {
          base_card_id: string
          skin_id: string
          visual_data: Json
        }[]
      }
      get_my_event_fragments: {
        Args: never
        Returns: {
          color_primary: string
          ends_at: string
          event_id: string
          event_name: string
          fragments: number
        }[]
      }
      get_my_forge_state: { Args: never; Returns: Json }
      get_my_materials: {
        Args: never
        Returns: {
          description: string
          icon_url: string
          material_id: string
          name: string
          quantity: number
          rarity: Database["public"]["Enums"]["material_rarity"]
          theme: string
        }[]
      }
      get_my_pending_rewards: {
        Args: never
        Returns: {
          body: string
          created_at: string
          id: string
          kind: string
          payload: Json
          title: string
        }[]
      }
      get_my_raid_rewards: {
        Args: never
        Returns: {
          awarded_at: string
          boss_name: string
          chests_awarded: Json
          coins_awarded: number
          contribution_pct: number
          diamonds_awarded: number
          is_top: boolean
          raid_id: string
          victory: boolean
        }[]
      }
      get_my_titles: {
        Args: never
        Returns: {
          category: string
          color: string
          condition_type: string
          condition_value: number
          description: string
          is_active: boolean
          key: string
          name: string
          title_id: string
          unlocked: boolean
          unlocked_at: string
        }[]
      }
      get_my_unread_vaults: {
        Args: never
        Returns: {
          color_primary: string
          event_id: string
          event_name: string
          fragments_total: number
          opened_at: string
          opening_id: string
          rewards: Json
        }[]
      }
      get_my_vault_history: {
        Args: never
        Returns: {
          event_id: string
          event_name: string
          fragments_total: number
          opened_at: string
          rewards: Json
        }[]
      }
      get_my_weekly_positions: {
        Args: { p_finalized?: boolean }
        Returns: Json
      }
      get_patch11_status: { Args: never; Returns: Json }
      get_pending_card_proposals: {
        Args: never
        Returns: {
          created_at: string
          id: string
          proposed_effect: string | null
          proposed_image_url: string | null
          proposed_lore: string | null
          proposed_name: string | null
          proposed_notes: string | null
          proposed_rarity: string | null
          ranking_type: string
          resulting_shop_item_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
          week_start: string
        }[]
        SetofOptions: {
          from: "*"
          to: "card_creation_tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_profile_card: { Args: { p_student_id: string }; Returns: Json }
      get_pvp_opponent_data: { Args: { p_student_id: string }; Returns: Json }
      get_school_feed: {
        Args: { p_filter?: string; p_limit?: number; p_offset?: number }
        Returns: {
          class_id: string
          created_at: string
          event_data: Json
          event_type: string
          guild_id: string
          guild_name: string
          id: string
          student_id: string
          student_name: string
          viewed_by_me: boolean
          views_count: number
        }[]
      }
      get_student_dna: { Args: { p_student_id: string }; Returns: Json }
      get_student_risk_scores: { Args: { p_teacher_id: string }; Returns: Json }
      get_student_teacher_id: {
        Args: { p_student_id: string }
        Returns: string
      }
      get_teacher_id: { Args: never; Returns: string }
      get_weekly_ranking: {
        Args: {
          p_class_id?: string
          p_finalized?: boolean
          p_limit?: number
          p_offset?: number
          p_ranking_type: string
          p_teacher_id?: string
        }
        Returns: {
          entity_id: string
          entity_name: string
          rank: number
          score: number
          week_end: string
          week_start: string
        }[]
      }
      give_boss_rewards: {
        Args: { p_coins: number; p_student_id: string; p_xp: number }
        Returns: undefined
      }
      give_pet_xp: {
        Args: { p_student_id: string; p_xp: number }
        Returns: Json
      }
      grant_top1_creation_tickets: {
        Args: { p_week_start: string }
        Returns: number
      }
      increment_daily_counter: {
        Args: { p_amount?: number; p_type: string }
        Returns: Json
      }
      increment_my_card_usage: {
        Args: { p_item_ids?: string[] }
        Returns: Json
      }
      is_caller_admin: { Args: never; Returns: boolean }
      is_guild_officer: { Args: { p_guild_id: string }; Returns: boolean }
      is_master_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      is_server_context: { Args: never; Returns: boolean }
      is_teacher_of_class: { Args: { class_id: string }; Returns: boolean }
      is_teacher_of_guild: { Args: { p_guild_id: string }; Returns: boolean }
      is_teacher_of_student: { Args: { student_id: string }; Returns: boolean }
      issue_top1_card_tickets: {
        Args: { p_week_start: string }
        Returns: number
      }
      list_active_events: {
        Args: never
        Returns: {
          banner_image_url: string
          color_primary: string
          description: string
          ends_at: string
          id: string
          name: string
          starts_at: string
          theme: string
        }[]
      }
      list_event_eligible_items: {
        Args: { p_event_id: string }
        Returns: {
          id: string
          image_url: string
          name: string
          rarity: string
        }[]
      }
      list_event_missions: {
        Args: { p_event_id: string }
        Returns: {
          condition_payload: Json
          condition_target: number
          condition_type: string
          description: string
          id: string
          is_active: boolean
          reward: number
          reward_chest_key: string
          reward_diamonds: number
          reward_fragments: number
          title: string
        }[]
      }
      list_events_admin: {
        Args: never
        Returns: {
          card_count: number
          chest_count: number
          created_at: string
          ended_at: string
          ends_at: string
          id: string
          name: string
          started_at: string
          starts_at: string
          status: string
          theme: string
        }[]
      }
      list_open_chest_funcs: { Args: never; Returns: Json }
      list_teachers_for_signup: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      log_action: {
        Args: {
          p_action: string
          p_payload?: Json
          p_target_id?: string
          p_target_label?: string
          p_target_table?: string
        }
        Returns: number
      }
      log_action_v2: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_payload?: Json
          p_target_id?: string
          p_target_label?: string
          p_target_table?: string
        }
        Returns: number
      }
      mark_patch11_seen: { Args: never; Returns: undefined }
      mark_vault_shown: { Args: { p_opening_id: string }; Returns: number }
      master_adjust_currency: {
        Args: { p_amount: number; p_currency: string; p_student_id: string }
        Returns: number
      }
      master_create_boss_raid: {
        Args: {
          p_boss_id: string
          p_guild_id: string
          p_hours?: number
          p_max_per_member?: number
          p_total_hp?: number
        }
        Returns: Json
      }
      master_create_class: {
        Args: { p_biome?: string; p_name: string; p_teacher_id: string }
        Returns: string
      }
      master_delete_class: {
        Args: { p_class_id: string; p_reassign_to_class_id?: string }
        Returns: number
      }
      master_grant_skill_points: {
        Args: { p_points: number; p_student_id: string }
        Returns: Json
      }
      master_grant_skin: {
        Args: { p_skin_id: string; p_student_id: string }
        Returns: Json
      }
      master_grant_title: {
        Args: { p_student_id: string; p_title_key: string }
        Returns: Json
      }
      master_list_pending_tickets: {
        Args: never
        Returns: {
          character_name: string
          class_name: string
          granted_at: string
          ranking_type: string
          requested_at: string
          status: string
          student_id: string
          student_name: string
          teacher_id: string
          ticket_id: string
          used_at: string
          week_start: string
        }[]
      }
      master_mark_ticket_used: {
        Args: {
          p_card_created_id?: string
          p_notes?: string
          p_ticket_id: string
        }
        Returns: Json
      }
      master_reset_class: { Args: { p_student_id: string }; Returns: Json }
      master_set_admin: {
        Args: { p_is_admin: boolean; p_teacher_id: string }
        Returns: undefined
      }
      master_set_event_boss: {
        Args: { p_boss_id: string; p_event_id: string }
        Returns: Json
      }
      master_spawn_card: {
        Args: { p_item_id: string; p_student_id: string }
        Returns: string
      }
      master_update_class: {
        Args: { p_biome?: string; p_class_id: string; p_name: string }
        Returns: undefined
      }
      master_update_teacher: {
        Args: { p_name: string; p_teacher_id: string }
        Returns: undefined
      }
      master_upsert_card_skin: {
        Args: {
          p_base_card_id: string
          p_description?: string
          p_name: string
          p_skin_id?: string
          p_unlock_condition: string
          p_unlock_payload?: Json
          p_visual_data?: Json
        }
        Returns: Json
      }
      master_upsert_event_chest: {
        Args: {
          p_card_pool?: Json
          p_chest_key: string
          p_cost_coins?: number
          p_cost_diamonds?: number
          p_description?: string
          p_event_id: string
          p_min_level?: number
          p_name: string
          p_tier?: number
        }
        Returns: Json
      }
      master_upsert_event_mission: {
        Args: {
          p_condition_payload?: Json
          p_condition_target: number
          p_condition_type: string
          p_description: string
          p_event_id: string
          p_mission_id?: string
          p_reward_chest_key?: string
          p_reward_coins?: number
          p_reward_diamonds?: number
          p_reward_fragments?: number
          p_title: string
        }
        Returns: Json
      }
      merge_student: {
        Args: { p_existing_id: string; p_pending_id: string }
        Returns: undefined
      }
      my_student_id: { Args: never; Returns: string }
      my_student_teacher_id: { Args: never; Returns: string }
      nickname_contains_name: {
        Args: { p_name: string; p_nick: string }
        Returns: boolean
      }
      open_chest: {
        Args: { p_chest_key: string; p_count?: number; p_grant_id?: string }
        Returns: Json
      }
      open_chest_v2: {
        Args: { p_chest_key: string; p_count?: number; p_grant_id?: string }
        Returns: Json
      }
      open_event_vault_for: {
        Args: { p_event_id: string; p_student_id: string }
        Returns: Json
      }
      open_event_vault_for_all: { Args: { p_event_id: string }; Returns: Json }
      prof_adjust_student_xp: {
        Args: { p_delta_xp: number; p_student_id: string }
        Returns: number
      }
      prof_suspend_student: {
        Args: { p_days: number; p_reason: string; p_student_id: string }
        Returns: string
      }
      prof_unsuspend_student: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      purchase_item:
        | { Args: { p_item_id: string; p_student_id: string }; Returns: Json }
        | {
            Args: {
              p_item_id: string
              p_student_id: string
              p_use_diamonds?: boolean
            }
            Returns: Json
          }
      record_enemy_defeat: {
        Args: {
          p_character_id: string
          p_enemy_id: string
          p_floor_id: number
          p_is_boss: boolean
        }
        Returns: Json
      }
      register_my_student: {
        Args: {
          p_class_id: string
          p_first_names: string
          p_nickname: string
          p_teacher_id: string
        }
        Returns: Json
      }
      request_creation_ticket: { Args: { p_ticket_id: string }; Returns: Json }
      reset_skill_element: {
        Args: { p_element: string; p_total_spent_override?: number }
        Returns: Json
      }
      respond_guild_join_request: {
        Args: { p_approve: boolean; p_request_id: string }
        Returns: {
          created_at: string
          guild_id: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          student_id: string
        }
        SetofOptions: {
          from: "*"
          to: "guild_join_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_card_proposal: {
        Args: {
          p_card_overrides?: Json
          p_decision: string
          p_review_notes?: string
          p_ticket_id: string
        }
        Returns: {
          created_at: string
          id: string
          proposed_effect: string | null
          proposed_image_url: string | null
          proposed_lore: string | null
          proposed_name: string | null
          proposed_notes: string | null
          proposed_rarity: string | null
          ranking_type: string
          resulting_shop_item_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "card_creation_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_my_active_banner: { Args: { p_banner_key: string }; Returns: Json }
      set_my_active_title: { Args: { p_title_id: string }; Returns: Json }
      spawn_event_boss_raids: { Args: { p_event_id: string }; Returns: Json }
      spawn_monthly_raids: { Args: never; Returns: Json }
      spend_attribute_point: { Args: { p_attribute: string }; Returns: Json }
      start_event: { Args: { p_event_id: string }; Returns: Json }
      storage_owner_student: { Args: { p_name: string }; Returns: string }
      student_belongs_to_teacher: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      submit_card_proposal: {
        Args: {
          p_effect: string
          p_image_url?: string
          p_lore: string
          p_name: string
          p_notes?: string
          p_rarity?: string
          p_ticket_id: string
        }
        Returns: {
          created_at: string
          id: string
          proposed_effect: string | null
          proposed_image_url: string | null
          proposed_lore: string | null
          proposed_name: string | null
          proposed_notes: string | null
          proposed_rarity: string | null
          ranking_type: string
          resulting_shop_item_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "card_creation_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      swap_secondary_element: {
        Args: {
          p_new_element: string
          p_refund?: number
          p_remove_element?: string
        }
        Returns: Json
      }
      teacher_delete_student: {
        Args: { p_student_id: string }
        Returns: string
      }
      teacher_move_student_to_own_class: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: undefined
      }
      teacher_reset_skill_points: {
        Args: { p_student_user_id: string }
        Returns: Json
      }
      tick_my_active_buffs: { Args: never; Returns: number }
      toggle_favorite_backdrop: { Args: { p_key: string }; Returns: Json }
      unequip_skin: { Args: { p_skin_id: string }; Returns: Json }
      unlock_backdrop: { Args: { p_key: string }; Returns: Json }
      unlock_skill: {
        Args: {
          p_cost?: number
          p_prerequisites?: string[]
          p_skill_id: string
        }
        Returns: Json
      }
      update_my_character: {
        Args: {
          p_appearance: string
          p_character_class: string
          p_character_name: string
          p_lore: string
          p_motivation: string
          p_personality: string
          p_race: string
        }
        Returns: string
      }
      update_my_profile_photo: { Args: { p_url: string }; Returns: string }
      update_student_difficulty: {
        Args: { p_new_difficulty: string; p_student_id: string }
        Returns: undefined
      }
      view_feed_event: { Args: { p_event_id: string }; Returns: Json }
    }
    Enums: {
      drop_rarity:
        | "comum"
        | "incomum"
        | "raro"
        | "epico"
        | "lendario"
        | "mitico"
        | "???"
      material_rarity: "common" | "uncommon" | "rare" | "epic"
      request_status: "pending" | "approved" | "rejected"
      request_type: "challenge" | "item" | "attendance"
      student_title_type:
        | "helper_of_week"
        | "presence_guardian"
        | "attitude_example"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      drop_rarity: [
        "comum",
        "incomum",
        "raro",
        "epico",
        "lendario",
        "mitico",
        "???",
      ],
      material_rarity: ["common", "uncommon", "rare", "epic"],
      request_status: ["pending", "approved", "rejected"],
      request_type: ["challenge", "item", "attendance"],
      student_title_type: [
        "helper_of_week",
        "presence_guardian",
        "attitude_example",
      ],
    },
  },
} as const
