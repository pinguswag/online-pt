/**
 * Supabase Database Types - 자동 생성된 타입
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string | null;
          diet_photos: string[] | null;
          id: string;
          log_date: string;
          status: string;
          user_id: string;
          workout_checked: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          diet_photos?: string[] | null;
          id?: string;
          log_date: string;
          status?: string;
          user_id: string;
          workout_checked?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          diet_photos?: string[] | null;
          id?: string;
          log_date?: string;
          status?: string;
          user_id?: string;
          workout_checked?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users_profile";
            referencedColumns: ["id"];
          }
        ];
      };
      users_profile: {
        Row: {
          created_at: string | null;
          id: string;
          nickname: string | null;
          required_diet_photos: number;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          nickname?: string | null;
          required_diet_photos?: number;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          nickname?: string | null;
          required_diet_photos?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
