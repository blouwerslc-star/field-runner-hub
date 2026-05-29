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
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          subject: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          subject?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          subject?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          due_at: string | null
          id: string
          investor_id: string
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          id?: string
          investor_id: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          id?: string
          investor_id?: string
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          bucket: string
          created_at: string
          filename: string | null
          id: string
          message_id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          uploader_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          filename?: string | null
          id?: string
          message_id: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          uploader_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          filename?: string | null
          id?: string
          message_id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          investor_id: string | null
          paid_at: string | null
          paid_by: string | null
          payout_method: string | null
          payout_reference: string | null
          platform_fee_cents: number
          runner_id: string | null
          runner_payout_cents: number
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          task_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          investor_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          platform_fee_cents?: number
          runner_id?: string | null
          runner_payout_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          investor_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          platform_fee_cents?: number
          runner_id?: string | null
          runner_payout_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_methods: {
        Row: {
          created_at: string
          details: Json
          display_name: string | null
          id: string
          is_default: boolean
          method_type: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          details?: Json
          display_name?: string | null
          id?: string
          is_default?: boolean
          method_type: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          details?: Json
          display_name?: string | null
          id?: string
          is_default?: boolean
          method_type?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          payout_method_id: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          runner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payout_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          runner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payout_method_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          runner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          availability_status: string
          avatar_url: string | null
          average_rating: number
          background_check_verified: boolean
          bio: string | null
          city: string | null
          company_description: string | null
          company_name: string | null
          company_verified: boolean
          completed_tasks_count: number
          cover_photo_url: string | null
          created_at: string
          dashboard_prefs: Json
          deletion_requested_at: string | null
          email: string | null
          email_verified: boolean
          experience_level: string | null
          featured: boolean
          full_name: string | null
          headline: string | null
          hourly_rate: number | null
          id: string
          identity_verified: boolean
          markets_served: string | null
          monthly_deal_volume: string | null
          notification_prefs: Json
          phone: string | null
          phone_public: boolean
          phone_verified: boolean
          preferred_markets: string | null
          preferred_payout_max: number | null
          preferred_payout_min: number | null
          preferred_task_radius: string | null
          privacy_prefs: Json
          profile_photo_url: string | null
          profile_slug: string | null
          public_profile_enabled: boolean
          repeat_client_count: number
          response_time: string | null
          review_count: number
          service_radius: string | null
          services_offered: string[]
          state: string | null
          stripe_customer_id: string | null
          suspended: boolean
          task_rate: number | null
          task_types: string[]
          theme_preference: string | null
          timezone: string | null
          transportation_available: boolean | null
          turnaround_time: string | null
          updated_at: string
          user_id: string
          verified_status: boolean
          years_experience: number | null
        }
        Insert: {
          account_status?: string
          availability_status?: string
          avatar_url?: string | null
          average_rating?: number
          background_check_verified?: boolean
          bio?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          company_verified?: boolean
          completed_tasks_count?: number
          cover_photo_url?: string | null
          created_at?: string
          dashboard_prefs?: Json
          deletion_requested_at?: string | null
          email?: string | null
          email_verified?: boolean
          experience_level?: string | null
          featured?: boolean
          full_name?: string | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          identity_verified?: boolean
          markets_served?: string | null
          monthly_deal_volume?: string | null
          notification_prefs?: Json
          phone?: string | null
          phone_public?: boolean
          phone_verified?: boolean
          preferred_markets?: string | null
          preferred_payout_max?: number | null
          preferred_payout_min?: number | null
          preferred_task_radius?: string | null
          privacy_prefs?: Json
          profile_photo_url?: string | null
          profile_slug?: string | null
          public_profile_enabled?: boolean
          repeat_client_count?: number
          response_time?: string | null
          review_count?: number
          service_radius?: string | null
          services_offered?: string[]
          state?: string | null
          stripe_customer_id?: string | null
          suspended?: boolean
          task_rate?: number | null
          task_types?: string[]
          theme_preference?: string | null
          timezone?: string | null
          transportation_available?: boolean | null
          turnaround_time?: string | null
          updated_at?: string
          user_id: string
          verified_status?: boolean
          years_experience?: number | null
        }
        Update: {
          account_status?: string
          availability_status?: string
          avatar_url?: string | null
          average_rating?: number
          background_check_verified?: boolean
          bio?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          company_verified?: boolean
          completed_tasks_count?: number
          cover_photo_url?: string | null
          created_at?: string
          dashboard_prefs?: Json
          deletion_requested_at?: string | null
          email?: string | null
          email_verified?: boolean
          experience_level?: string | null
          featured?: boolean
          full_name?: string | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          identity_verified?: boolean
          markets_served?: string | null
          monthly_deal_volume?: string | null
          notification_prefs?: Json
          phone?: string | null
          phone_public?: boolean
          phone_verified?: boolean
          preferred_markets?: string | null
          preferred_payout_max?: number | null
          preferred_payout_min?: number | null
          preferred_task_radius?: string | null
          privacy_prefs?: Json
          profile_photo_url?: string | null
          profile_slug?: string | null
          public_profile_enabled?: boolean
          repeat_client_count?: number
          response_time?: string | null
          review_count?: number
          service_radius?: string | null
          services_offered?: string[]
          state?: string | null
          stripe_customer_id?: string | null
          suspended?: boolean
          task_rate?: number | null
          task_types?: string[]
          theme_preference?: string | null
          timezone?: string | null
          transportation_available?: boolean | null
          turnaround_time?: string | null
          updated_at?: string
          user_id?: string
          verified_status?: boolean
          years_experience?: number | null
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          direction: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          direction: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          direction?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      runner_profiles: {
        Row: {
          created_at: string
          id: string
          onboarding_completed: boolean
          payouts_enabled: boolean
          stripe_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_tasks: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_applications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          runner_id: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          runner_id: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          runner_id?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_files: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          submission_id: string | null
          task_id: string | null
          uploader_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          submission_id?: string | null
          task_id?: string | null
          uploader_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          submission_id?: string | null
          task_id?: string | null
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          runner_id: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          runner_id: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          runner_id?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          default_payout: number | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          owner_id: string | null
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_payout?: number | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          owner_id?: string | null
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_payout?: number | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          owner_id?: string | null
          task_type?: string
          title?: string
          updated_at?: string
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
          funded: boolean
          funding_payment_id: string | null
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
          funded?: boolean
          funding_payment_id?: string | null
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
          funded?: boolean
          funding_payment_id?: string | null
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
      public_profiles: {
        Row: {
          availability_status: string | null
          average_rating: number | null
          bio: string | null
          city: string | null
          company_description: string | null
          company_name: string | null
          completed_tasks_count: number | null
          cover_photo_url: string | null
          created_at: string | null
          experience_level: string | null
          featured: boolean | null
          full_name: string | null
          headline: string | null
          hourly_rate: number | null
          markets_served: string | null
          monthly_deal_volume: string | null
          profile_photo_url: string | null
          profile_slug: string | null
          response_time: string | null
          review_count: number | null
          roles: string[] | null
          service_radius: string | null
          services_offered: string[] | null
          state: string | null
          task_rate: number | null
          task_types: string[] | null
          transportation_available: boolean | null
          turnaround_time: string | null
          user_id: string | null
          verified_status: boolean | null
          years_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          completed_tasks_count?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          experience_level?: string | null
          featured?: boolean | null
          full_name?: string | null
          headline?: string | null
          hourly_rate?: number | null
          markets_served?: string | null
          monthly_deal_volume?: string | null
          profile_photo_url?: string | null
          profile_slug?: string | null
          response_time?: string | null
          review_count?: number | null
          roles?: never
          service_radius?: string | null
          services_offered?: string[] | null
          state?: string | null
          task_rate?: number | null
          task_types?: string[] | null
          transportation_available?: boolean | null
          turnaround_time?: string | null
          user_id?: string | null
          verified_status?: boolean | null
          years_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          average_rating?: number | null
          bio?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          completed_tasks_count?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          experience_level?: string | null
          featured?: boolean | null
          full_name?: string | null
          headline?: string | null
          hourly_rate?: number | null
          markets_served?: string | null
          monthly_deal_volume?: string | null
          profile_photo_url?: string | null
          profile_slug?: string | null
          response_time?: string | null
          review_count?: number | null
          roles?: never
          service_radius?: string | null
          services_offered?: string[] | null
          state?: string | null
          task_rate?: number | null
          task_types?: string[] | null
          transportation_available?: boolean | null
          turnaround_time?: string | null
          user_id?: string | null
          verified_status?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conv_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
