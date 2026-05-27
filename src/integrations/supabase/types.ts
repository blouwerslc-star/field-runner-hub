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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      field_runner_applications: {
        Row: {
          availability: string
          background_check_consent: boolean | null
          city: string
          created_at: string
          date_of_birth: string | null
          disclaimer_agreed: boolean
          email: string
          experience: string | null
          full_name: string
          has_drivers_license: string | null
          has_smartphone: string
          has_transportation: string
          heard_about: string | null
          hours_per_week: string | null
          id: string
          phone: string
          preferred_payout: string | null
          referral_code: string | null
          sample_url: string | null
          services: string[]
          social_links: string | null
          state: string
          street_address: string | null
          travel_radius_miles: string | null
          user_id: string | null
          vehicle_type: string | null
          zip_code: string | null
        }
        Insert: {
          availability: string
          background_check_consent?: boolean | null
          city: string
          created_at?: string
          date_of_birth?: string | null
          disclaimer_agreed?: boolean
          email: string
          experience?: string | null
          full_name: string
          has_drivers_license?: string | null
          has_smartphone: string
          has_transportation: string
          heard_about?: string | null
          hours_per_week?: string | null
          id?: string
          phone: string
          preferred_payout?: string | null
          referral_code?: string | null
          sample_url?: string | null
          services?: string[]
          social_links?: string | null
          state: string
          street_address?: string | null
          travel_radius_miles?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          zip_code?: string | null
        }
        Update: {
          availability?: string
          background_check_consent?: boolean | null
          city?: string
          created_at?: string
          date_of_birth?: string | null
          disclaimer_agreed?: boolean
          email?: string
          experience?: string | null
          full_name?: string
          has_drivers_license?: string | null
          has_smartphone?: string
          has_transportation?: string
          heard_about?: string | null
          hours_per_week?: string | null
          id?: string
          phone?: string
          preferred_payout?: string | null
          referral_code?: string | null
          sample_url?: string | null
          services?: string[]
          social_links?: string | null
          state?: string
          street_address?: string | null
          travel_radius_miles?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      real_estate_pro_applications: {
        Row: {
          budget: string | null
          company_name: string | null
          created_at: string
          details: string | null
          email: string
          frequency: string
          full_name: string
          id: string
          market_city: string
          market_state: string
          phone: string
          role: string
          services_needed: string[]
          urgency: string
          user_id: string | null
        }
        Insert: {
          budget?: string | null
          company_name?: string | null
          created_at?: string
          details?: string | null
          email: string
          frequency: string
          full_name: string
          id?: string
          market_city: string
          market_state: string
          phone: string
          role: string
          services_needed?: string[]
          urgency: string
          user_id?: string | null
        }
        Update: {
          budget?: string | null
          company_name?: string | null
          created_at?: string
          details?: string | null
          email?: string
          frequency?: string
          full_name?: string
          id?: string
          market_city?: string
          market_state?: string
          phone?: string
          role?: string
          services_needed?: string[]
          urgency?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          admin_notes: string | null
          city: string
          created_at: string
          deliverable_url: string | null
          description: string | null
          due_date: string | null
          id: string
          investor_id: string | null
          payout_amount: number | null
          property_address: string
          runner_id: string | null
          state: string
          status: string
          task_type: string
          title: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          admin_notes?: string | null
          city: string
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          investor_id?: string | null
          payout_amount?: number | null
          property_address: string
          runner_id?: string | null
          state: string
          status?: string
          task_type: string
          title: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          investor_id?: string | null
          payout_amount?: number | null
          property_address?: string
          runner_id?: string | null
          state?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "runner" | "investor" | "admin"
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
      app_role: ["runner", "investor", "admin"],
    },
  },
} as const
