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
    PostgrestVersion: "14.4"
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
          enemies_defeated: number | null
          floor_id: number
          times_completed: number | null
        }
        Insert: {
          best_time_seconds?: number | null
          boss_defeated?: boolean | null
          character_id: string
          enemies_defeated?: number | null
          floor_id: number
          times_completed?: number | null
        }
        Update: {
          best_time_seconds?: number | null
          boss_defeated?: boolean | null
          character_id?: string
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      chest_types: {
        Row: {
          bonus_coins_max: number
          bonus_coins_min: number
          bonus_xp_max: number
          bonus_xp_min: number
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
          id: string
          is_active: boolean
          is_limited: boolean
          max_items: number
          min_items: number
          min_level: number
          name: string
          stock: number | null
          teacher_id: string
          tier: number
        }
        Insert: {
          bonus_coins_max?: number
          bonus_coins_min?: number
          bonus_xp_max?: number
          bonus_xp_min?: number
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
          id?: string
          is_active?: boolean
          is_limited?: boolean
          max_items?: number
          min_items?: number
          min_level?: number
          name: string
          stock?: number | null
          teacher_id: string
          tier?: number
        }
        Update: {
          bonus_coins_max?: number
          bonus_coins_min?: number
          bonus_xp_max?: number
          bonus_xp_min?: number
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
          id?: string
          is_active?: boolean
          is_limited?: boolean
          max_items?: number
          min_items?: number
          min_level?: number
          name?: string
          stock?: number | null
          teacher_id?: string
          tier?: number
        }
        Relationships: [
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
      classroom_activity_completions: {
        Row: {
          id: string
          link_id: string
          rewarded_at: string
          student_id: string
          submission_state: string
        }
        Insert: {
          id?: string
          link_id: string
          rewarded_at?: string
          student_id: string
          submission_state: string
        }
        Update: {
          id?: string
          link_id?: string
          rewarded_at?: string
          student_id?: string
          submission_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_activity_completions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "classroom_activity_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_activity_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_activity_links: {
        Row: {
          class_id: string | null
          course_id: string
          coursework_id: string
          created_at: string
          id: string
          last_synced_at: string | null
          reward_coins: number
          teacher_id: string
          title: string
        }
        Insert: {
          class_id?: string | null
          course_id: string
          coursework_id: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          reward_coins?: number
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string | null
          course_id?: string
          coursework_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          reward_coins?: number
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_activity_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_activity_links_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      google_classroom_connections: {
        Row: {
          access_token: string
          connected_at: string
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          scopes: string[]
          teacher_id: string
          token_expires_at: string | null
        }
        Insert: {
          access_token: string
          connected_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[]
          teacher_id: string
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string
          connected_at?: string
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string[]
          teacher_id?: string
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_classroom_connections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
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
            referencedRelation: "students"
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      parent_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          student_id: string
          teacher_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_code: string
          student_id: string
          teacher_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          student_id?: string
          teacher_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invites_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_reports: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          report_data?: Json
          report_type?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          parent_id: string
          student_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          parent_id: string
          student_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          parent_id?: string
          student_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
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
            referencedRelation: "students"
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
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          item_type: string
          min_level: number
          name: string
          rarity: string
          source_anime: string | null
          teacher_id: string
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
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          min_level?: number
          name: string
          rarity?: string
          source_anime?: string | null
          teacher_id: string
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
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_type?: string
          min_level?: number
          name?: string
          rarity?: string
          source_anime?: string | null
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_missions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_return_mission: boolean
          reward: number
          teacher_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_return_mission?: boolean
          reward?: number
          teacher_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_return_mission?: boolean
          reward?: number
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_missions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_titles: {
        Row: {
          assigned_at: string
          assigned_by: string
          expires_at: string
          id: string
          student_id: string
          title_type: Database["public"]["Enums"]["student_title_type"]
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          expires_at: string
          id?: string
          student_id: string
          title_type: Database["public"]["Enums"]["student_title_type"]
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
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
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
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
          classroom_email: string | null
          classroom_user_id: string | null
          coins: number
          created_at: string
          diamonds: number
          difficulty_level: string
          id: string
          is_mentor: boolean
          level: number
          lore: string | null
          mentor_xp: number
          motivation: string | null
          name: string
          needs_return_mission: boolean
          personality: string | null
          pontos_disponiveis: number
          presencas_consecutivas: number
          profile_photo_url: string | null
          race: string | null
          school_name: string | null
          status: string
          streak_best: number
          streak_current: number
          streak_last_activity: string | null
          teacher_id: string
          total_boss_kills: number
          total_crafts: number
          total_missions_completed: number
          total_pvp_wins: number
          user_id: string | null
          xp: number
        }
        Insert: {
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
          classroom_email?: string | null
          classroom_user_id?: string | null
          coins?: number
          created_at?: string
          diamonds?: number
          difficulty_level?: string
          id?: string
          is_mentor?: boolean
          level?: number
          lore?: string | null
          mentor_xp?: number
          motivation?: string | null
          name: string
          needs_return_mission?: boolean
          personality?: string | null
          pontos_disponiveis?: number
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
          school_name?: string | null
          status?: string
          streak_best?: number
          streak_current?: number
          streak_last_activity?: string | null
          teacher_id: string
          total_boss_kills?: number
          total_crafts?: number
          total_missions_completed?: number
          total_pvp_wins?: number
          user_id?: string | null
          xp?: number
        }
        Update: {
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
          classroom_email?: string | null
          classroom_user_id?: string | null
          coins?: number
          created_at?: string
          diamonds?: number
          difficulty_level?: string
          id?: string
          is_mentor?: boolean
          level?: number
          lore?: string | null
          mentor_xp?: number
          motivation?: string | null
          name?: string
          needs_return_mission?: boolean
          personality?: string | null
          pontos_disponiveis?: number
          presencas_consecutivas?: number
          profile_photo_url?: string | null
          race?: string | null
          school_name?: string | null
          status?: string
          streak_best?: number
          streak_current?: number
          streak_last_activity?: string | null
          teacher_id?: string
          total_boss_kills?: number
          total_crafts?: number
          total_missions_completed?: number
          total_pvp_wins?: number
          user_id?: string | null
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
      students_level_backup_20260409: {
        Row: {
          id: string | null
          level: number | null
          name: string | null
          xp: number | null
        }
        Insert: {
          id?: string | null
          level?: number | null
          name?: string | null
          xp?: number | null
        }
        Update: {
          id?: string | null
          level?: number | null
          name?: string | null
          xp?: number | null
        }
        Relationships: []
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
    }
    Functions: {
      add_class_war_points: {
        Args: { p_class_id: string; p_points: number }
        Returns: undefined
      }
      add_item_to_inventory: {
        Args: { p_character_id: string; p_item_id: string; p_quantity: number }
        Returns: undefined
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
      award_classroom_activity: {
        Args: {
          p_link_id: string
          p_reward_coins: number
          p_student_id: string
          p_submission_state: string
        }
        Returns: boolean
      }
      calculate_guild_score: { Args: { p_guild_id: string }; Returns: number }
      calculate_level_from_xp: { Args: { total_xp: number }; Returns: number }
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
      complete_skill_node: {
        Args: { p_node_id: string; p_student_id: string }
        Returns: Json
      }
      craft_item: {
        Args: { p_recipe_id: string; p_student_id: string }
        Returns: Json
      }
      create_mentorship: {
        Args: { p_mentee_id: string; p_mentor_id: string; p_teacher_id: string }
        Returns: undefined
      }
      execute_trade: { Args: { p_trade_id: string }; Returns: Json }
      finalize_class_war: { Args: { p_war_id: string }; Returns: Json }
      generate_parent_invite: {
        Args: { p_student_id: string }
        Returns: string
      }
      generate_parent_report: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_student_id: string
          p_type?: string
        }
        Returns: string
      }
      get_analytics_overview: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_class_comparison: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_daily_activity: {
        Args: { p_class_id?: string; p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_engagement_heatmap: {
        Args: { p_days?: number; p_teacher_id: string }
        Returns: Json
      }
      get_parent_child_summary: {
        Args: { p_days?: number; p_student_id: string }
        Returns: Json
      }
      get_pvp_opponent_data: { Args: { p_student_id: string }; Returns: Json }
      get_student_dna: { Args: { p_student_id: string }; Returns: Json }
      get_student_risk_scores: { Args: { p_teacher_id: string }; Returns: Json }
      get_student_teacher_id: {
        Args: { p_student_id: string }
        Returns: string
      }
      get_teacher_id: { Args: never; Returns: string }
      give_boss_rewards: {
        Args: { p_coins: number; p_student_id: string; p_xp: number }
        Returns: undefined
      }
      give_pet_xp: {
        Args: { p_student_id: string; p_xp: number }
        Returns: Json
      }
      is_teacher_of_class: { Args: { class_id: string }; Returns: boolean }
      is_teacher_of_student: { Args: { student_id: string }; Returns: boolean }
      merge_student: {
        Args: { p_existing_id: string; p_pending_id: string }
        Returns: undefined
      }
      open_chest: {
        Args: { p_chest_type_id: string; p_student_id: string }
        Returns: Json
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
      redeem_parent_invite: {
        Args: { p_invite_code: string; p_parent_name: string }
        Returns: Json
      }
      student_belongs_to_teacher: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      teacher_reset_skill_points: {
        Args: { p_student_user_id: string }
        Returns: Json
      }
      update_student_difficulty: {
        Args: { p_new_difficulty: string; p_student_id: string }
        Returns: undefined
      }
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
      drop_rarity: [
        "comum",
        "incomum",
        "raro",
        "epico",
        "lendario",
        "mitico",
        "???",
      ],
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
