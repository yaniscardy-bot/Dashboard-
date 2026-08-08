/**
 * Types générés à la main pour correspondre à supabase/schema.sql.
 * À remplacer par la sortie réelle de :
 *   npx supabase gen types typescript --project-id <id> > types/database.types.ts
 * une fois le projet Supabase créé (voir supabase/README.md).
 */

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          frequency_type: "daily" | "weekly_count" | "specific_weekdays";
          frequency_target: number | null;
          frequency_weekdays: number[] | null;
          archived: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["habits"]["Row"]> & {
          name: string;
          frequency_type: "daily" | "weekly_count" | "specific_weekdays";
        };
        Update: Partial<Database["public"]["Tables"]["habits"]["Row"]>;
        Relationships: [];
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          log_date: string;
          completed: boolean;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["habit_logs"]["Row"]> & {
          habit_id: string;
          log_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["habit_logs"]["Row"]>;
        Relationships: [];
      };
      metrics: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          unit: string;
          target_value: number | null;
          target_direction: "at_least" | "at_most" | "exact" | null;
          decimals: number;
          color: string | null;
          archived: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["metrics"]["Row"]> & {
          name: string;
          unit: string;
        };
        Update: Partial<Database["public"]["Tables"]["metrics"]["Row"]>;
        Relationships: [];
      };
      metric_logs: {
        Row: {
          id: string;
          metric_id: string;
          user_id: string;
          log_date: string;
          value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["metric_logs"]["Row"]> & {
          metric_id: string;
          log_date: string;
          value: number;
        };
        Update: Partial<Database["public"]["Tables"]["metric_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
