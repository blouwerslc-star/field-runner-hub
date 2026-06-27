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
      academy_certifications: {
        Row: {
          certificate_url: string | null
          certification_name: string
          course_id: string
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_name: string
          course_id: string
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_name?: string
          course_id?: string
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_certifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          required: boolean
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          required?: boolean
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      academy_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          checklist: Json
          content: string | null
          course_id: string
          created_at: string
          id: string
          lesson_number: number
          slug: string
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          checklist?: Json
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_number: number
          slug: string
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          checklist?: Json
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_number?: number
          slug?: string
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_products: {
        Row: {
          active: boolean
          affiliate_url: string
          audience: string
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          lesson_id: string | null
          price_display: string | null
          sort_order: number
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          active?: boolean
          affiliate_url: string
          audience?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          price_display?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          active?: boolean
          affiliate_url?: string
          audience?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lesson_id?: string | null
          price_display?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          id: string
          module_id: string
          passed: boolean
          quiz_attempts: number
          quiz_score: number | null
          sections_completed: string[]
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          module_id: string
          passed?: boolean
          quiz_attempts?: number
          quiz_score?: number | null
          sections_completed?: string[]
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          module_id?: string
          passed?: boolean
          quiz_attempts?: number
          quiz_score?: number | null
          sections_completed?: string[]
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_quiz_questions: {
        Row: {
          answers: Json
          correct_answer: number
          created_at: string
          id: string
          question: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          answers: Json
          correct_answer: number
          created_at?: string
          id?: string
          question: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          answers?: Json
          correct_answer?: number
          created_at?: string
          id?: string
          question?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_results: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          passed?: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          passing_score: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          passing_score?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          passing_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_events: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          event_type: string
          id: string
          link: string | null
          metadata: Json
          title: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          event_type: string
          id?: string
          link?: string | null
          metadata?: Json
          title: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          event_type?: string
          id?: string
          link?: string | null
          metadata?: Json
          title?: string
        }
        Relationships: []
      }
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
      background_check_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          subject_user_id: string
          submission_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          subject_user_id: string
          submission_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          subject_user_id?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_check_audit_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "background_check_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_submissions: {
        Row: {
          admin_notes: string | null
          background_check_consent: boolean
          created_at: string
          current_address_line1: string
          current_address_line2: string | null
          current_address_since: string | null
          current_city: string
          current_state: string
          current_zip: string
          date_of_birth: string
          drivers_license_expiration: string | null
          drivers_license_number: string | null
          drivers_license_state: string | null
          email: string
          fcra_consent: boolean
          id: string
          id_back_path: string | null
          id_front_path: string | null
          info_truthful_consent: boolean
          legal_first_name: string
          legal_last_name: string
          legal_middle_name: string | null
          name_suffix: string | null
          needs_info_reason: string | null
          other_names: Json
          phone: string
          prior_addresses: Json
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string | null
          signature_full_name: string
          signature_ip: string | null
          signed_at: string
          ssn_full_encrypted: string | null
          ssn_last4: string
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          background_check_consent?: boolean
          created_at?: string
          current_address_line1: string
          current_address_line2?: string | null
          current_address_since?: string | null
          current_city: string
          current_state: string
          current_zip: string
          date_of_birth: string
          drivers_license_expiration?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email: string
          fcra_consent?: boolean
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          info_truthful_consent?: boolean
          legal_first_name: string
          legal_last_name: string
          legal_middle_name?: string | null
          name_suffix?: string | null
          needs_info_reason?: string | null
          other_names?: Json
          phone: string
          prior_addresses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          signature_full_name: string
          signature_ip?: string | null
          signed_at?: string
          ssn_full_encrypted?: string | null
          ssn_last4: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          background_check_consent?: boolean
          created_at?: string
          current_address_line1?: string
          current_address_line2?: string | null
          current_address_since?: string | null
          current_city?: string
          current_state?: string
          current_zip?: string
          date_of_birth?: string
          drivers_license_expiration?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email?: string
          fcra_consent?: boolean
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          info_truthful_consent?: boolean
          legal_first_name?: string
          legal_last_name?: string
          legal_middle_name?: string | null
          name_suffix?: string | null
          needs_info_reason?: string | null
          other_names?: Json
          phone?: string
          prior_addresses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string | null
          signature_full_name?: string
          signature_ip?: string | null
          signed_at?: string
          ssn_full_encrypted?: string | null
          ssn_last4?: string
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broadcast_sends: {
        Row: {
          audience: string
          created_at: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          recipient_email: string
          recipient_name: string | null
          sent_by: string | null
          status: string
          subject: string
        }
        Insert: {
          audience: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          audience?: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      broadcast_template_overrides: {
        Row: {
          audience: string
          created_at: string
          html: string
          id: string
          subject: string
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience: string
          created_at?: string
          html: string
          id?: string
          subject: string
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string
          created_at?: string
          html?: string
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string
          updated_by?: string | null
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
      disputes: {
        Row: {
          against_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          opened_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          against_id?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          opened_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          against_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: []
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
      facebook_leads: {
        Row: {
          channel: string | null
          email: string
          full_name: string
          id: string
          imported_at: string
          lead_created_at: string | null
          notes: string | null
          source: string | null
          stage: string | null
        }
        Insert: {
          channel?: string | null
          email: string
          full_name: string
          id?: string
          imported_at?: string
          lead_created_at?: string | null
          notes?: string | null
          source?: string | null
          stage?: string | null
        }
        Update: {
          channel?: string | null
          email?: string
          full_name?: string
          id?: string
          imported_at?: string
          lead_created_at?: string | null
          notes?: string | null
          source?: string | null
          stage?: string | null
        }
        Relationships: []
      }
      favorite_runners: {
        Row: {
          created_at: string
          id: string
          investor_id: string
          list_name: string
          notes: string | null
          runner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_id: string
          list_name?: string
          notes?: string | null
          runner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_id?: string
          list_name?: string
          notes?: string | null
          runner_id?: string
        }
        Relationships: []
      }
      field_runner_applications: {
        Row: {
          admin_notes: string | null
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
          reviewed_at: string | null
          reviewed_by: string | null
          sample_url: string | null
          services: string[]
          social_links: string | null
          state: string
          status: string
          street_address: string | null
          travel_radius_miles: string | null
          user_id: string | null
          vehicle_type: string | null
          zip_code: string | null
        }
        Insert: {
          admin_notes?: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_url?: string | null
          services?: string[]
          social_links?: string | null
          state: string
          status?: string
          street_address?: string | null
          travel_radius_miles?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          zip_code?: string | null
        }
        Update: {
          admin_notes?: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_url?: string | null
          services?: string[]
          social_links?: string | null
          state?: string
          status?: string
          street_address?: string | null
          travel_radius_miles?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      investor_inquiries: {
        Row: {
          accredited_status: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interest_type: string | null
          investment_range: string | null
          ip_hash: string | null
          message: string | null
          phone: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          accredited_status?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interest_type?: string | null
          investment_range?: string | null
          ip_hash?: string | null
          message?: string | null
          phone?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          accredited_status?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interest_type?: string | null
          investment_range?: string | null
          ip_hash?: string | null
          message?: string | null
          phone?: string | null
          source?: string | null
          user_agent?: string | null
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
      job_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          result: Json | null
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          result?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          result?: Json | null
          started_at?: string
          status?: string
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
          kind: string
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
          kind?: string
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
          kind?: string
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
      phone_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_addons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          investor_price: number | null
          investor_price_max: number | null
          investor_price_min: number | null
          key: string
          name: string
          platform_fee: number | null
          platform_pct: number | null
          price_type: string
          runner_payout: number | null
          runner_pct: number | null
          sort_order: number
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          investor_price?: number | null
          investor_price_max?: number | null
          investor_price_min?: number | null
          key: string
          name: string
          platform_fee?: number | null
          platform_pct?: number | null
          price_type?: string
          runner_payout?: number | null
          runner_pct?: number | null
          sort_order?: number
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          investor_price?: number | null
          investor_price_max?: number | null
          investor_price_min?: number | null
          key?: string
          name?: string
          platform_fee?: number | null
          platform_pct?: number | null
          price_type?: string
          runner_payout?: number | null
          runner_pct?: number | null
          sort_order?: number
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_market_overrides: {
        Row: {
          active: boolean
          addon_key: string | null
          created_at: string
          experience_level: string | null
          id: string
          investor_price: number | null
          market_city: string | null
          market_state: string | null
          notes: string | null
          platform_fee: number | null
          runner_payout: number | null
          template_id: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          active?: boolean
          addon_key?: string | null
          created_at?: string
          experience_level?: string | null
          id?: string
          investor_price?: number | null
          market_city?: string | null
          market_state?: string | null
          notes?: string | null
          platform_fee?: number | null
          runner_payout?: number | null
          template_id?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          active?: boolean
          addon_key?: string | null
          created_at?: string
          experience_level?: string | null
          id?: string
          investor_price?: number | null
          market_city?: string | null
          market_state?: string | null
          notes?: string | null
          platform_fee?: number | null
          runner_payout?: number | null
          template_id?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_market_overrides_addon_key_fkey"
            columns: ["addon_key"]
            isOneToOne: false
            referencedRelation: "pricing_addons"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "pricing_market_overrides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_completion_emails: {
        Row: {
          id: string
          sent_at: string
          stage: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          stage: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          stage?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_portfolio: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: string
          sort_order: number
          thumb_url: string | null
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          sort_order?: number
          thumb_url?: string | null
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          sort_order?: number
          thumb_url?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avail_emergency: boolean
          avail_this_week: boolean
          avail_today: boolean
          avail_weekends: boolean
          availability_status: string
          avatar_url: string | null
          average_rating: number
          background_check_paid_at: string | null
          background_check_verified: boolean
          bio: string | null
          checkr_candidate_id: string | null
          checkr_invitation_url: string | null
          checkr_report_id: string | null
          checkr_status: string | null
          city: string | null
          company_description: string | null
          company_name: string | null
          company_verified: boolean
          completed_tasks_count: number
          completion_rate: number
          contractor_experience: boolean
          contractor_years: number | null
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
          home_lat: number | null
          home_lng: number | null
          hourly_rate: number | null
          id: string
          identity_verified: boolean
          insurance_verified: boolean
          insurance_verified_at: string | null
          last_active_at: string | null
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
          property_management_experience: boolean
          property_management_years: number | null
          public_profile_enabled: boolean
          rate_lockbox_install: number | null
          rate_occupancy_check: number | null
          rate_property_photos: number | null
          rate_sign_placement: number | null
          rate_video_walkthrough: number | null
          real_estate_experience: boolean
          real_estate_years: number | null
          realtor_experience: boolean
          realtor_years: number | null
          referral_code: string | null
          referred_by: string | null
          repeat_client_count: number
          repeat_client_rate: number
          response_time: string | null
          response_time_minutes: number | null
          review_count: number
          service_radius: string | null
          services_offered: string[]
          specialties: string[]
          state: string | null
          stripe_customer_id: string | null
          suspended: boolean
          task_rate: number | null
          task_types: string[]
          theme_preference: string | null
          timezone: string | null
          top_runner: boolean
          transportation_available: boolean | null
          turnaround_time: string | null
          updated_at: string
          user_id: string
          verification_level: number
          verification_notes: string | null
          verification_requested_at: string | null
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          verification_status: string
          verified_status: boolean
          years_experience: number | null
        }
        Insert: {
          account_status?: string
          avail_emergency?: boolean
          avail_this_week?: boolean
          avail_today?: boolean
          avail_weekends?: boolean
          availability_status?: string
          avatar_url?: string | null
          average_rating?: number
          background_check_paid_at?: string | null
          background_check_verified?: boolean
          bio?: string | null
          checkr_candidate_id?: string | null
          checkr_invitation_url?: string | null
          checkr_report_id?: string | null
          checkr_status?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          company_verified?: boolean
          completed_tasks_count?: number
          completion_rate?: number
          contractor_experience?: boolean
          contractor_years?: number | null
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
          home_lat?: number | null
          home_lng?: number | null
          hourly_rate?: number | null
          id?: string
          identity_verified?: boolean
          insurance_verified?: boolean
          insurance_verified_at?: string | null
          last_active_at?: string | null
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
          property_management_experience?: boolean
          property_management_years?: number | null
          public_profile_enabled?: boolean
          rate_lockbox_install?: number | null
          rate_occupancy_check?: number | null
          rate_property_photos?: number | null
          rate_sign_placement?: number | null
          rate_video_walkthrough?: number | null
          real_estate_experience?: boolean
          real_estate_years?: number | null
          realtor_experience?: boolean
          realtor_years?: number | null
          referral_code?: string | null
          referred_by?: string | null
          repeat_client_count?: number
          repeat_client_rate?: number
          response_time?: string | null
          response_time_minutes?: number | null
          review_count?: number
          service_radius?: string | null
          services_offered?: string[]
          specialties?: string[]
          state?: string | null
          stripe_customer_id?: string | null
          suspended?: boolean
          task_rate?: number | null
          task_types?: string[]
          theme_preference?: string | null
          timezone?: string | null
          top_runner?: boolean
          transportation_available?: boolean | null
          turnaround_time?: string | null
          updated_at?: string
          user_id: string
          verification_level?: number
          verification_notes?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string
          verified_status?: boolean
          years_experience?: number | null
        }
        Update: {
          account_status?: string
          avail_emergency?: boolean
          avail_this_week?: boolean
          avail_today?: boolean
          avail_weekends?: boolean
          availability_status?: string
          avatar_url?: string | null
          average_rating?: number
          background_check_paid_at?: string | null
          background_check_verified?: boolean
          bio?: string | null
          checkr_candidate_id?: string | null
          checkr_invitation_url?: string | null
          checkr_report_id?: string | null
          checkr_status?: string | null
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          company_verified?: boolean
          completed_tasks_count?: number
          completion_rate?: number
          contractor_experience?: boolean
          contractor_years?: number | null
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
          home_lat?: number | null
          home_lng?: number | null
          hourly_rate?: number | null
          id?: string
          identity_verified?: boolean
          insurance_verified?: boolean
          insurance_verified_at?: string | null
          last_active_at?: string | null
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
          property_management_experience?: boolean
          property_management_years?: number | null
          public_profile_enabled?: boolean
          rate_lockbox_install?: number | null
          rate_occupancy_check?: number | null
          rate_property_photos?: number | null
          rate_sign_placement?: number | null
          rate_video_walkthrough?: number | null
          real_estate_experience?: boolean
          real_estate_years?: number | null
          realtor_experience?: boolean
          realtor_years?: number | null
          referral_code?: string | null
          referred_by?: string | null
          repeat_client_count?: number
          repeat_client_rate?: number
          response_time?: string | null
          response_time_minutes?: number | null
          review_count?: number
          service_radius?: string | null
          services_offered?: string[]
          specialties?: string[]
          state?: string | null
          stripe_customer_id?: string | null
          suspended?: boolean
          task_rate?: number | null
          task_types?: string[]
          theme_preference?: string | null
          timezone?: string | null
          top_runner?: boolean
          transportation_available?: boolean | null
          turnaround_time?: string | null
          updated_at?: string
          user_id?: string
          verification_level?: number
          verification_notes?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string
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
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          qualified_at: string | null
          qualifying_task_id: string | null
          referee_id: string
          referrer_id: string
          reward_amount_cents: number
          rewarded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          qualified_at?: string | null
          qualifying_task_id?: string | null
          referee_id: string
          referrer_id: string
          reward_amount_cents?: number
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          qualified_at?: string | null
          qualifying_task_id?: string | null
          referee_id?: string
          referrer_id?: string
          reward_amount_cents?: number
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_qualifying_task_id_fkey"
            columns: ["qualifying_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
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
      runner_availability_blocks: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          reason: string | null
          runner_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          reason?: string | null
          runner_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          reason?: string | null
          runner_id?: string
        }
        Relationships: []
      }
      runner_eligibility_reminders: {
        Row: {
          id: string
          kind: string
          last_sent_at: string
          send_count: number
          user_id: string
        }
        Insert: {
          id?: string
          kind: string
          last_sent_at?: string
          send_count?: number
          user_id: string
        }
        Update: {
          id?: string
          kind?: string
          last_sent_at?: string
          send_count?: number
          user_id?: string
        }
        Relationships: []
      }
      runner_id_documents: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          path: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          path: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          path?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runner_profiles: {
        Row: {
          certification_level: number
          certification_status: string
          certified_at: string | null
          created_at: string
          elite_at: string | null
          id: string
          onboarding_completed: boolean
          payouts_enabled: boolean
          stripe_account_id: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          certification_level?: number
          certification_status?: string
          certified_at?: string | null
          created_at?: string
          elite_at?: string | null
          id?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          certification_level?: number
          certification_status?: string
          certified_at?: string | null
          created_at?: string
          elite_at?: string | null
          id?: string
          onboarding_completed?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "saved_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_attempts: {
        Row: {
          blocked: boolean
          created_at: string
          email: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_hash: string | null
          reason: string | null
          role: string | null
          stage: string | null
          user_agent: string | null
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_hash?: string | null
          reason?: string | null
          role?: string | null
          stage?: string | null
          user_agent?: string | null
        }
        Update: {
          blocked?: boolean
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_hash?: string | null
          reason?: string | null
          role?: string | null
          stage?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      sms_send_log: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          notification_id: string | null
          phone: string
          provider: string | null
          provider_message_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          notification_id?: string | null
          phone: string
          provider?: string | null
          provider_message_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          notification_id?: string | null
          phone?: string
          provider?: string | null
          provider_message_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_send_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "task_applications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_progress: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          data: Json
          file_ids: string[]
          id: string
          status: string
          step_key: string
          task_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          data?: Json
          file_ids?: string[]
          id?: string
          status?: string
          step_key: string
          task_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          data?: Json
          file_ids?: string[]
          id?: string
          status?: string
          step_key?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
      task_location_pings: {
        Row: {
          accuracy_m: number | null
          created_at: string
          distance_ft: number | null
          heading_deg: number | null
          id: string
          investor_id: string | null
          latitude: number
          longitude: number
          runner_id: string
          runner_state: string | null
          speed_mps: number | null
          task_id: string
          within_geofence: boolean | null
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          distance_ft?: number | null
          heading_deg?: number | null
          id?: string
          investor_id?: string | null
          latitude: number
          longitude: number
          runner_id: string
          runner_state?: string | null
          speed_mps?: number | null
          task_id: string
          within_geofence?: boolean | null
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          distance_ft?: number | null
          heading_deg?: number | null
          id?: string
          investor_id?: string | null
          latitude?: number
          longitude?: number
          runner_id?: string
          runner_state?: string | null
          speed_mps?: number | null
          task_id?: string
          within_geofence?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "task_location_pings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_permission_events: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          outcome: string
          runner_id: string
          task_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          outcome: string
          runner_id: string
          task_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          outcome?: string
          runner_id?: string
          task_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_permission_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_code: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          note: string | null
          task_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_code: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          note?: string | null
          task_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_code?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          note?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_events_task_id_fkey"
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
          active: boolean
          available_addons: string[]
          category: string | null
          created_at: string
          default_payout: number | null
          deliverables: string[]
          description: string | null
          est_minutes: number | null
          excludes_notes: string | null
          id: string
          includes_notes: string | null
          intro_notes: string | null
          investor_price: number | null
          is_system: boolean
          name: string
          owner_id: string | null
          platform_fee: number | null
          required_fields: Json
          runner_payout: number | null
          runner_steps: Json
          sort_order: number
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          available_addons?: string[]
          category?: string | null
          created_at?: string
          default_payout?: number | null
          deliverables?: string[]
          description?: string | null
          est_minutes?: number | null
          excludes_notes?: string | null
          id?: string
          includes_notes?: string | null
          intro_notes?: string | null
          investor_price?: number | null
          is_system?: boolean
          name: string
          owner_id?: string | null
          platform_fee?: number | null
          required_fields?: Json
          runner_payout?: number | null
          runner_steps?: Json
          sort_order?: number
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          available_addons?: string[]
          category?: string | null
          created_at?: string
          default_payout?: number | null
          deliverables?: string[]
          description?: string | null
          est_minutes?: number | null
          excludes_notes?: string | null
          id?: string
          includes_notes?: string | null
          intro_notes?: string | null
          investor_price?: number | null
          is_system?: boolean
          name?: string
          owner_id?: string | null
          platform_fee?: number | null
          required_fields?: Json
          runner_payout?: number | null
          runner_steps?: Json
          sort_order?: number
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_type_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          created_template_id: string | null
          deliverables: string[]
          description: string
          example_inputs: Json
          id: string
          proposed_name: string
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_payout: number | null
          task_type_slug: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          created_template_id?: string | null
          deliverables?: string[]
          description: string
          example_inputs?: Json
          id?: string
          proposed_name: string
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_payout?: number | null
          task_type_slug?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          created_template_id?: string | null
          deliverables?: string[]
          description?: string
          example_inputs?: Json
          id?: string
          proposed_name?: string
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_payout?: number | null
          task_type_slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_type_requests_created_template_id_fkey"
            columns: ["created_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          accepted_at: string | null
          admin_notes: string | null
          arrived_at: string | null
          city: string
          completed_at: string | null
          created_at: string
          deliverable_url: string | null
          description: string | null
          due_date: string | null
          en_route_at: string | null
          funded: boolean
          funding_payment_id: string | null
          geofence_radius_ft: number
          id: string
          investor_id: string | null
          last_ping_at: string | null
          last_ping_distance_ft: number | null
          last_ping_lat: number | null
          last_ping_lng: number | null
          last_ping_within_geofence: boolean | null
          payout_amount: number | null
          preferred_runner_id: string | null
          property_address: string
          property_lat: number | null
          property_lng: number | null
          recurrence_active: boolean
          recurrence_next_at: string | null
          recurrence_parent_id: string | null
          recurrence_rule: string | null
          requires_interior_access: boolean
          runner_id: string | null
          runner_state: string | null
          started_at: string | null
          state: string
          status: string
          task_type: string
          template_id: string | null
          template_inputs: Json
          title: string
          tracking_active: boolean
          updated_at: string
          verified_at: string | null
          zip_code: string | null
        }
        Insert: {
          accepted_at?: string | null
          admin_notes?: string | null
          arrived_at?: string | null
          city: string
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          en_route_at?: string | null
          funded?: boolean
          funding_payment_id?: string | null
          geofence_radius_ft?: number
          id?: string
          investor_id?: string | null
          last_ping_at?: string | null
          last_ping_distance_ft?: number | null
          last_ping_lat?: number | null
          last_ping_lng?: number | null
          last_ping_within_geofence?: boolean | null
          payout_amount?: number | null
          preferred_runner_id?: string | null
          property_address: string
          property_lat?: number | null
          property_lng?: number | null
          recurrence_active?: boolean
          recurrence_next_at?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          requires_interior_access?: boolean
          runner_id?: string | null
          runner_state?: string | null
          started_at?: string | null
          state: string
          status?: string
          task_type: string
          template_id?: string | null
          template_inputs?: Json
          title: string
          tracking_active?: boolean
          updated_at?: string
          verified_at?: string | null
          zip_code?: string | null
        }
        Update: {
          accepted_at?: string | null
          admin_notes?: string | null
          arrived_at?: string | null
          city?: string
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          description?: string | null
          due_date?: string | null
          en_route_at?: string | null
          funded?: boolean
          funding_payment_id?: string | null
          geofence_radius_ft?: number
          id?: string
          investor_id?: string | null
          last_ping_at?: string | null
          last_ping_distance_ft?: number | null
          last_ping_lat?: number | null
          last_ping_lng?: number | null
          last_ping_within_geofence?: boolean | null
          payout_amount?: number | null
          preferred_runner_id?: string | null
          property_address?: string
          property_lat?: number | null
          property_lng?: number | null
          recurrence_active?: boolean
          recurrence_next_at?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          requires_interior_access?: boolean
          runner_id?: string | null
          runner_state?: string | null
          started_at?: string | null
          state?: string
          status?: string
          task_type?: string
          template_id?: string | null
          template_inputs?: Json
          title?: string
          tracking_active?: boolean
          updated_at?: string
          verified_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_location: string | null
          author_name: string
          author_role: string
          author_title: string | null
          created_at: string
          featured: boolean
          id: string
          published: boolean
          quote: string
          rating: number | null
          sort_order: number
        }
        Insert: {
          author_location?: string | null
          author_name: string
          author_role: string
          author_title?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published?: boolean
          quote: string
          rating?: number | null
          sort_order?: number
        }
        Update: {
          author_location?: string | null
          author_name?: string
          author_role?: string
          author_title?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published?: boolean
          quote?: string
          rating?: number | null
          sort_order?: number
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          notes: string | null
          requested_level: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_level: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_level?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          environment: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
          source: string
          status: string
        }
        Insert: {
          environment?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string
          source: string
          status?: string
        }
        Update: {
          environment?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          source?: string
          status?: string
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
      admin_override_task_completion: {
        Args: { _reason: string; _task_id: string }
        Returns: undefined
      }
      bg_decrypt_ssn: {
        Args: { _key: string; _submission_id: string }
        Returns: string
      }
      bg_encrypt_ssn: { Args: { _key: string; _ssn: string }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_metrics: {
        Args: never
        Returns: {
          oldest_msg_age_sec: number
          queue_length: number
          queue_name: string
          total_messages: number
        }[]
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
      haversine_ft: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
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
      record_webhook_event: {
        Args: {
          _env: string
          _event_id: string
          _event_type: string
          _payload: Json
          _source: string
        }
        Returns: boolean
      }
      sweep_stale_tracking: { Args: { _minutes?: number }; Returns: number }
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
