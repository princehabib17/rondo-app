/**
 * Generated Supabase types placeholder.
 * Regenerate after schema changes: npm run db:types
 * (requires Supabase CLI linked to your project)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      webhook_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          processed_at?: string;
        };
      };
    };
  };
}
