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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          clicked_at: string
          commission_amount_usd: number | null
          commission_level: number | null
          converted_at: string | null
          created_at: string
          id: string
          order_id: string | null
          registered_at: string | null
          registered_user_id: string | null
          source: string | null
          status: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          commission_amount_usd?: number | null
          commission_level?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          registered_at?: string | null
          registered_user_id?: string | null
          source?: string | null
          status?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          commission_amount_usd?: number | null
          commission_level?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          registered_at?: string | null
          registered_user_id?: string | null
          source?: string | null
          status?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string
          email: string
          email_verified: boolean | null
          id: string
          max_referrals: number | null
          miner_boost_percentage: number | null
          parent_affiliate_id: string | null
          referrals_capped_at: string | null
          registration_milestone_level: number | null
          status: string | null
          tier_level: number
          total_conversions: number | null
          total_earnings_usd: number | null
          total_registrations: number | null
          updated_at: string
          user_id: string | null
          username: string | null
          verification_code_expires_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          id?: string
          max_referrals?: number | null
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
          referrals_capped_at?: string | null
          registration_milestone_level?: number | null
          status?: string | null
          tier_level?: number
          total_conversions?: number | null
          total_earnings_usd?: number | null
          total_registrations?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          verification_code_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          id?: string
          max_referrals?: number | null
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
          referrals_capped_at?: string | null
          registration_milestone_level?: number | null
          status?: string | null
          tier_level?: number
          total_conversions?: number | null
          total_earnings_usd?: number | null
          total_registrations?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          verification_code_expires_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      app_remote_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          metric_type: string
          reward_points: number
          target_value: number
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          metric_type: string
          reward_points: number
          target_value: number
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          metric_type?: string
          reward_points?: number
          target_value?: number
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_events: {
        Row: {
          accuracy_meters: number | null
          carrier_name: string | null
          created_at: string | null
          event_type: string
          from_state: string | null
          id: string
          is_roaming: boolean | null
          latitude: number | null
          longitude: number | null
          network_type: string | null
          recorded_at: string
          session_id: string | null
          to_state: string | null
          user_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          carrier_name?: string | null
          created_at?: string | null
          event_type: string
          from_state?: string | null
          id?: string
          is_roaming?: boolean | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          recorded_at: string
          session_id?: string | null
          to_state?: string | null
          user_id: string
        }
        Update: {
          accuracy_meters?: number | null
          carrier_name?: string | null
          created_at?: string | null
          event_type?: string
          from_state?: string | null
          id?: string
          is_roaming?: boolean | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          recorded_at?: string
          session_id?: string | null
          to_state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_events_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contribution_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_sessions: {
        Row: {
          average_signal_strength: number | null
          created_at: string | null
          data_points_count: number | null
          ended_at: string | null
          id: string
          started_at: string
          status: string | null
          total_distance_meters: number | null
          total_points_earned: number | null
          user_id: string
        }
        Insert: {
          average_signal_strength?: number | null
          created_at?: string | null
          data_points_count?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string | null
          total_distance_meters?: number | null
          total_points_earned?: number | null
          user_id: string
        }
        Update: {
          average_signal_strength?: number | null
          created_at?: string | null
          data_points_count?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string | null
          total_distance_meters?: number | null
          total_points_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      coverage_confirmations: {
        Row: {
          accuracy_meters: number | null
          can_browse: boolean | null
          can_call: boolean | null
          can_stream: boolean | null
          carrier_name: string | null
          country_code: string | null
          created_at: string | null
          id: string
          latitude: number
          location_geohash: string | null
          longitude: number
          nearest_log_id: string | null
          network_type: string | null
          quality: string
          recorded_at: string
          session_id: string
          trigger_reason: string
          user_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          can_browse?: boolean | null
          can_call?: boolean | null
          can_stream?: boolean | null
          carrier_name?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          latitude: number
          location_geohash?: string | null
          longitude: number
          nearest_log_id?: string | null
          network_type?: string | null
          quality: string
          recorded_at: string
          session_id: string
          trigger_reason: string
          user_id: string
        }
        Update: {
          accuracy_meters?: number | null
          can_browse?: boolean | null
          can_call?: boolean | null
          can_stream?: boolean | null
          carrier_name?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          latitude?: number
          location_geohash?: string | null
          longitude?: number
          nearest_log_id?: string | null
          network_type?: string | null
          quality?: string
          recorded_at?: string
          session_id?: string
          trigger_reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coverage_confirmations_nearest_log_id_fkey"
            columns: ["nearest_log_id"]
            isOneToOne: false
            referencedRelation: "signal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_confirmations_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contribution_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          bonus_points: number
          check_in_date: string
          created_at: string | null
          id: string
          streak_day: number
          user_id: string
        }
        Insert: {
          bonus_points?: number
          check_in_date?: string
          created_at?: string | null
          id?: string
          streak_day?: number
          user_id: string
        }
        Update: {
          bonus_points?: number
          check_in_date?: string
          created_at?: string | null
          id?: string
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          created_at: string
          email: string
          email_type: string
          id: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_type: string
          id?: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_type?: string
          id?: string
          sent_at?: string
        }
        Relationships: []
      }
      esim_usage: {
        Row: {
          created_at: string | null
          expired_at: string | null
          iccid: string
          id: string
          last_updated: string | null
          order_id: string | null
          remaining_mb: number | null
          remaining_text: number | null
          remaining_voice: number | null
          status: string | null
          total_mb: number | null
        }
        Insert: {
          created_at?: string | null
          expired_at?: string | null
          iccid: string
          id?: string
          last_updated?: string | null
          order_id?: string | null
          remaining_mb?: number | null
          remaining_text?: number | null
          remaining_voice?: number | null
          status?: string | null
          total_mb?: number | null
        }
        Update: {
          created_at?: string | null
          expired_at?: string | null
          iccid?: string
          id?: string
          last_updated?: string | null
          order_id?: string | null
          remaining_mb?: number | null
          remaining_text?: number | null
          remaining_voice?: number | null
          status?: string | null
          total_mb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_cache: {
        Row: {
          id: string
          monthly_points: number | null
          rank_all_time: number | null
          rank_monthly: number | null
          rank_weekly: number | null
          total_distance_meters: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          weekly_points: number | null
        }
        Insert: {
          id?: string
          monthly_points?: number | null
          rank_all_time?: number | null
          rank_monthly?: number | null
          rank_weekly?: number | null
          total_distance_meters?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          weekly_points?: number | null
        }
        Update: {
          id?: string
          monthly_points?: number | null
          rank_all_time?: number | null
          rank_monthly?: number | null
          rank_weekly?: number | null
          total_distance_meters?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          weekly_points?: number | null
        }
        Relationships: []
      }
      mining_logs: {
        Row: {
          carrier: string | null
          device_type: string | null
          id: number
          latitude: number
          longitude: number
          network_type: string | null
          signal_dbm: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          device_type?: string | null
          id?: never
          latitude: number
          longitude: number
          network_type?: string | null
          signal_dbm?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          device_type?: string | null
          id?: never
          latitude?: number
          longitude?: number
          network_type?: string | null
          signal_dbm?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievement_unlocks: boolean
          created_at: string
          daily_reminders: boolean
          id: string
          push_enabled: boolean
          referral_conversions: boolean
          reminder_time: string | null
          streak_warnings: boolean
          updated_at: string
          user_id: string
          weekly_summaries: boolean
        }
        Insert: {
          achievement_unlocks?: boolean
          created_at?: string
          daily_reminders?: boolean
          id?: string
          push_enabled?: boolean
          referral_conversions?: boolean
          reminder_time?: string | null
          streak_warnings?: boolean
          updated_at?: string
          user_id: string
          weekly_summaries?: boolean
        }
        Update: {
          achievement_unlocks?: boolean
          created_at?: string
          daily_reminders?: boolean
          id?: string
          push_enabled?: boolean
          referral_conversions?: boolean
          reminder_time?: string | null
          streak_warnings?: boolean
          updated_at?: string
          user_id?: string
          weekly_summaries?: boolean
        }
        Relationships: []
      }
      offline_contribution_queue: {
        Row: {
          accuracy_meters: number | null
          carrier: string | null
          created_at: string | null
          device_fingerprint: string | null
          device_hash: string | null
          device_type: string | null
          id: string
          latitude: number
          location_hash: string | null
          longitude: number
          network_hash: string | null
          network_type: string | null
          processed: boolean | null
          proof_hash: string | null
          proof_timestamp: string | null
          proof_version: number | null
          recorded_at: string
          session_id: string | null
          signal_dbm: number | null
          speed_mps: number | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          carrier?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_hash?: string | null
          device_type?: string | null
          id?: string
          latitude: number
          location_hash?: string | null
          longitude: number
          network_hash?: string | null
          network_type?: string | null
          processed?: boolean | null
          proof_hash?: string | null
          proof_timestamp?: string | null
          proof_version?: number | null
          recorded_at: string
          session_id?: string | null
          signal_dbm?: number | null
          speed_mps?: number | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_meters?: number | null
          carrier?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          device_hash?: string | null
          device_type?: string | null
          id?: string
          latitude?: number
          location_hash?: string | null
          longitude?: number
          network_hash?: string | null
          network_type?: string | null
          processed?: boolean | null
          proof_hash?: string | null
          proof_timestamp?: string | null
          proof_version?: number | null
          recorded_at?: string
          session_id?: string | null
          signal_dbm?: number | null
          speed_mps?: number | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_contribution_queue_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contribution_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          access_token_invalidated: boolean | null
          airlo_order_id: string | null
          airlo_request_id: string | null
          created_at: string
          data_amount: string | null
          email: string | null
          id: string
          package_name: string | null
          product_id: string
          referral_code: string | null
          status: string
          total_amount_usd: number
          updated_at: string
          user_id: string | null
          validity_days: number | null
          visitor_id: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          access_token_invalidated?: boolean | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email?: string | null
          id?: string
          package_name?: string | null
          product_id: string
          referral_code?: string | null
          status?: string
          total_amount_usd: number
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
          visitor_id?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          access_token_invalidated?: boolean | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email?: string | null
          id?: string
          package_name?: string | null
          product_id?: string
          referral_code?: string | null
          status?: string
          total_amount_usd?: number
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_pii: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          access_token_invalidated: boolean | null
          activation_code: string | null
          created_at: string
          email: string
          full_name: string | null
          iccid: string | null
          id: string
          lpa: string | null
          manual_installation: string | null
          matching_id: string | null
          qr_code_url: string | null
          qrcode: string | null
          qrcode_installation: string | null
          sharing_access_code: string | null
          sharing_link: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          access_token_invalidated?: boolean | null
          activation_code?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          iccid?: string | null
          id: string
          lpa?: string | null
          manual_installation?: string | null
          matching_id?: string | null
          qr_code_url?: string | null
          qrcode?: string | null
          qrcode_installation?: string | null
          sharing_access_code?: string | null
          sharing_link?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          access_token_invalidated?: boolean | null
          activation_code?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          iccid?: string | null
          id?: string
          lpa?: string | null
          manual_installation?: string | null
          matching_id?: string | null
          qr_code_url?: string | null
          qrcode?: string | null
          qrcode_installation?: string | null
          sharing_access_code?: string | null
          sharing_link?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_pii_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_referral_bonuses: {
        Row: {
          bonus_points: number
          created_at: string | null
          expires_at: string | null
          id: string
          referred_user_id: string
          referrer_user_id: string
          requirement_met: boolean | null
          requirement_met_at: string | null
          requirement_type: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referred_user_id: string
          referrer_user_id: string
          requirement_met?: boolean | null
          requirement_met_at?: string | null
          requirement_type?: string
        }
        Update: {
          bonus_points?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          requirement_met?: boolean | null
          requirement_met_at?: string | null
          requirement_type?: string
        }
        Relationships: []
      }
      processed_webhook_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string
          transaction_id: string
          webhook_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string
          transaction_id: string
          webhook_type: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string
          transaction_id?: string
          webhook_type?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          airlo_package_id: string
          country_code: string
          country_image_url: string | null
          country_name: string
          coverages: Json | null
          created_at: string
          data_amount: string
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          operator_image_url: string | null
          operator_name: string | null
          package_type: string | null
          price_usd: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          airlo_package_id: string
          country_code: string
          country_image_url?: string | null
          country_name: string
          coverages?: Json | null
          created_at?: string
          data_amount: string
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          operator_image_url?: string | null
          operator_name?: string | null
          package_type?: string | null
          price_usd: number
          updated_at?: string
          validity_days: number
        }
        Update: {
          airlo_package_id?: string
          country_code?: string
          country_image_url?: string | null
          country_name?: string
          coverages?: Json | null
          created_at?: string
          data_amount?: string
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          operator_image_url?: string | null
          operator_name?: string | null
          package_type?: string | null
          price_usd?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string
          data_consent_accepted_at: string | null
          data_consent_version: string | null
          email: string | null
          email_verified: boolean | null
          id: string
          is_early_member: boolean
          password_reset_code: string | null
          password_reset_expires_at: string | null
          solana_wallet: string | null
          updated_at: string
          user_id: string
          username: string
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          data_consent_accepted_at?: string | null
          data_consent_version?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_early_member?: boolean
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          solana_wallet?: string | null
          updated_at?: string
          user_id: string
          username: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          data_consent_accepted_at?: string | null
          data_consent_version?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_early_member?: boolean
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          solana_wallet?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: []
      }
      referral_audit_log: {
        Row: {
          affiliate_code: string | null
          affiliate_id: string | null
          affiliate_username: string | null
          created_at: string
          id: string
          ip_hash: string | null
          landing_page: string | null
          referrer_url: string | null
          user_agent: string | null
          visitor_fingerprint: string | null
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          affiliate_username?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
        }
        Update: {
          affiliate_code?: string | null
          affiliate_id?: string | null
          affiliate_username?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          commission_points: number
          commission_rate: number
          created_at: string
          id: string
          points_earned: number
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          commission_points: number
          commission_rate?: number
          created_at?: string
          id?: string
          points_earned: number
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          commission_points?: number
          commission_rate?: number
          created_at?: string
          id?: string
          points_earned?: number
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: []
      }
      referral_velocity_tracking: {
        Row: {
          affiliate_id: string
          created_at: string | null
          id: string
          referral_count: number | null
          window_start: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string | null
          id?: string
          referral_count?: number | null
          window_start?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string | null
          id?: string
          referral_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_velocity_tracking_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_velocity_tracking_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_hash: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_hash?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      signal_logs: {
        Row: {
          accuracy_meters: number | null
          altitude_meters: number | null
          app_version: string | null
          band_number: number | null
          bandwidth_mhz: number | null
          carrier_name: string | null
          cell_id: string | null
          confidence_score: number | null
          country_code: string | null
          created_at: string | null
          data_quality_score: number | null
          device_manufacturer: string | null
          device_model: string | null
          frequency_mhz: number | null
          heading_degrees: number | null
          id: string
          is_emulator: boolean | null
          is_indoor: boolean | null
          is_mock_location: boolean | null
          is_rare_location: boolean | null
          is_rooted_jailbroken: boolean | null
          jitter_ms: number | null
          latency_error: string | null
          latency_method: string | null
          latency_ms: number | null
          latency_provider: string | null
          latitude: number
          location_geohash: string | null
          longitude: number
          mcc: string | null
          mcc_mnc: string | null
          mnc: string | null
          network_generation: string | null
          network_type: string | null
          os_version: string | null
          pci: number | null
          recorded_at: string
          roaming_status: boolean | null
          rsrp: number | null
          rsrq: number | null
          rssi: number | null
          session_id: string | null
          sinr: number | null
          speed_mps: number | null
          speed_test_down: number | null
          speed_test_error: string | null
          speed_test_provider: string | null
          speed_test_up: number | null
          tac: string | null
          user_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          altitude_meters?: number | null
          app_version?: string | null
          band_number?: number | null
          bandwidth_mhz?: number | null
          carrier_name?: string | null
          cell_id?: string | null
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          device_manufacturer?: string | null
          device_model?: string | null
          frequency_mhz?: number | null
          heading_degrees?: number | null
          id?: string
          is_emulator?: boolean | null
          is_indoor?: boolean | null
          is_mock_location?: boolean | null
          is_rare_location?: boolean | null
          is_rooted_jailbroken?: boolean | null
          jitter_ms?: number | null
          latency_error?: string | null
          latency_method?: string | null
          latency_ms?: number | null
          latency_provider?: string | null
          latitude: number
          location_geohash?: string | null
          longitude: number
          mcc?: string | null
          mcc_mnc?: string | null
          mnc?: string | null
          network_generation?: string | null
          network_type?: string | null
          os_version?: string | null
          pci?: number | null
          recorded_at: string
          roaming_status?: boolean | null
          rsrp?: number | null
          rsrq?: number | null
          rssi?: number | null
          session_id?: string | null
          sinr?: number | null
          speed_mps?: number | null
          speed_test_down?: number | null
          speed_test_error?: string | null
          speed_test_provider?: string | null
          speed_test_up?: number | null
          tac?: string | null
          user_id: string
        }
        Update: {
          accuracy_meters?: number | null
          altitude_meters?: number | null
          app_version?: string | null
          band_number?: number | null
          bandwidth_mhz?: number | null
          carrier_name?: string | null
          cell_id?: string | null
          confidence_score?: number | null
          country_code?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          device_manufacturer?: string | null
          device_model?: string | null
          frequency_mhz?: number | null
          heading_degrees?: number | null
          id?: string
          is_emulator?: boolean | null
          is_indoor?: boolean | null
          is_mock_location?: boolean | null
          is_rare_location?: boolean | null
          is_rooted_jailbroken?: boolean | null
          jitter_ms?: number | null
          latency_error?: string | null
          latency_method?: string | null
          latency_ms?: number | null
          latency_provider?: string | null
          latitude?: number
          location_geohash?: string | null
          longitude?: number
          mcc?: string | null
          mcc_mnc?: string | null
          mnc?: string | null
          network_generation?: string | null
          network_type?: string | null
          os_version?: string | null
          pci?: number | null
          recorded_at?: string
          roaming_status?: boolean | null
          rsrp?: number | null
          rsrq?: number | null
          rssi?: number | null
          session_id?: string | null
          sinr?: number | null
          speed_mps?: number | null
          speed_test_down?: number | null
          speed_test_error?: string | null
          speed_test_provider?: string | null
          speed_test_up?: number | null
          tac?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contribution_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_task_claims: {
        Row: {
          claimed_at: string
          id: string
          platform: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          platform: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          platform?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      speed_test_results: {
        Row: {
          carrier: string | null
          created_at: string | null
          download_mbps: number | null
          error: string | null
          id: string
          latency_ms: number | null
          latitude: number | null
          longitude: number | null
          network_type: string | null
          provider: string | null
          recorded_at: string | null
          upload_mbps: number | null
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          download_mbps?: number | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          provider?: string | null
          recorded_at?: string | null
          upload_mbps?: number | null
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          download_mbps?: number | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          latitude?: number | null
          longitude?: number | null
          network_type?: string | null
          provider?: string | null
          recorded_at?: string | null
          upload_mbps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      spin_wheel_results: {
        Row: {
          claimed: boolean | null
          created_at: string | null
          id: string
          prize_type: string
          prize_value: number
          spin_date: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          prize_type: string
          prize_value: number
          spin_date?: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          prize_type?: string
          prize_value?: number
          spin_date?: string
          user_id?: string
        }
        Relationships: []
      }
      token_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          active_days_this_period: number | null
          challenge_id: string
          claimed_at: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          network_types_this_period: string[] | null
          period_start: string
          started_at: string | null
          unique_geohashes_this_period: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_days_this_period?: number | null
          challenge_id: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          network_types_this_period?: string[] | null
          period_start?: string
          started_at?: string | null
          unique_geohashes_this_period?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_days_this_period?: number | null
          challenge_id?: string
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          network_types_this_period?: string[] | null
          period_start?: string
          started_at?: string | null
          unique_geohashes_this_period?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collection_preferences: {
        Row: {
          battery_saver_mode: boolean | null
          collection_enabled: boolean | null
          created_at: string | null
          id: string
          low_power_collection: boolean | null
          pause_until: string | null
          send_usage_stats: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery_saver_mode?: boolean | null
          collection_enabled?: boolean | null
          created_at?: string | null
          id?: string
          low_power_collection?: boolean | null
          pause_until?: string | null
          send_usage_stats?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery_saver_mode?: boolean | null
          collection_enabled?: boolean | null
          created_at?: string | null
          id?: string
          low_power_collection?: boolean | null
          pause_until?: string | null
          send_usage_stats?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_contribution_levels: {
        Row: {
          active_days: number | null
          areas_mapped: number | null
          created_at: string | null
          current_level: number | null
          id: string
          level_achieved_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_days?: number | null
          areas_mapped?: number | null
          created_at?: string | null
          current_level?: number | null
          id?: string
          level_achieved_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_days?: number | null
          areas_mapped?: number | null
          created_at?: string | null
          current_level?: number | null
          id?: string
          level_achieved_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_limits: {
        Row: {
          created_at: string | null
          id: string
          limit_date: string
          points_earned: number | null
          signal_logs_count: number | null
          speed_tests_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          limit_date?: string
          points_earned?: number | null
          signal_logs_count?: number | null
          speed_tests_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          limit_date?: string
          points_earned?: number | null
          signal_logs_count?: number | null
          speed_tests_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_points: number | null
          goal_type: string
          id: string
          period_start: string
          target_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_points?: number | null
          goal_type: string
          id?: string
          period_start?: string
          target_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_points?: number | null
          goal_type?: string
          id?: string
          period_start?: string
          target_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_monthly_limits: {
        Row: {
          created_at: string | null
          id: string
          month_key: string
          points_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month_key: string
          points_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month_key?: string
          points_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          background_streak_days: number | null
          contribution_streak_days: number | null
          created_at: string | null
          daily_challenge_streak_days: number | null
          frozen_at: string | null
          frozen_reason: string | null
          id: string
          is_frozen: boolean | null
          last_all_daily_completed_date: string | null
          last_background_date: string | null
          last_commission_points: number | null
          last_contribution_date: string | null
          lifetime_cap_reached: boolean | null
          pending_points: number | null
          total_contribution_time_seconds: number | null
          total_distance_meters: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          background_streak_days?: number | null
          contribution_streak_days?: number | null
          created_at?: string | null
          daily_challenge_streak_days?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_all_daily_completed_date?: string | null
          last_background_date?: string | null
          last_commission_points?: number | null
          last_contribution_date?: string | null
          lifetime_cap_reached?: boolean | null
          pending_points?: number | null
          total_contribution_time_seconds?: number | null
          total_distance_meters?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          background_streak_days?: number | null
          contribution_streak_days?: number | null
          created_at?: string | null
          daily_challenge_streak_days?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_all_daily_completed_date?: string | null
          last_background_date?: string | null
          last_commission_points?: number | null
          last_contribution_date?: string | null
          lifetime_cap_reached?: boolean | null
          pending_points?: number | null
          total_contribution_time_seconds?: number | null
          total_distance_meters?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_spending: {
        Row: {
          cashback_rate: number
          created_at: string
          id: string
          membership_tier: string
          total_spent_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cashback_rate?: number
          created_at?: string
          id?: string
          membership_tier?: string
          total_spent_usd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cashback_rate?: number
          created_at?: string
          id?: string
          membership_tier?: string
          total_spent_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          signature: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          signature?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          signature?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      affiliates_safe: {
        Row: {
          affiliate_code: string | null
          commission_rate: number | null
          created_at: string | null
          email_verified: boolean | null
          id: string | null
          miner_boost_percentage: number | null
          parent_affiliate_id: string | null
          registration_milestone_level: number | null
          status: string | null
          tier_level: number | null
          total_conversions: number | null
          total_earnings_usd: number | null
          total_registrations: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          affiliate_code?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email_verified?: boolean | null
          id?: string | null
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
          registration_milestone_level?: number | null
          status?: string | null
          tier_level?: number | null
          total_conversions?: number | null
          total_earnings_usd?: number | null
          total_registrations?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          affiliate_code?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email_verified?: boolean | null
          id?: string | null
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
          registration_milestone_level?: number | null
          status?: string | null
          tier_level?: number | null
          total_conversions?: number | null
          total_earnings_usd?: number | null
          total_registrations?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_tiles: {
        Row: {
          avg_confidence: number | null
          avg_download_mbps: number | null
          avg_latency_ms: number | null
          avg_rsrp: number | null
          carrier_name: string | null
          country_code: string | null
          first_seen: string | null
          high_confidence_samples: number | null
          last_updated: string | null
          location_geohash: string | null
          median_download_mbps: number | null
          median_latency_ms: number | null
          median_rsrp: number | null
          median_rsrq: number | null
          median_sinr: number | null
          median_upload_mbps: number | null
          network_generation: string | null
          pct_excellent_signal: number | null
          pct_good_signal: number | null
          pct_poor_signal: number | null
          pct_roaming: number | null
          sample_count: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      profiles_safe: {
        Row: {
          country_code: string | null
          created_at: string | null
          data_consent_accepted_at: string | null
          data_consent_version: string | null
          email: string | null
          email_verified: boolean | null
          id: string | null
          is_early_member: boolean | null
          solana_wallet: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          data_consent_accepted_at?: string | null
          data_consent_version?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string | null
          is_early_member?: boolean | null
          solana_wallet?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          data_consent_accepted_at?: string | null
          data_consent_version?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string | null
          is_early_member?: boolean | null
          solana_wallet?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_points_with_cap:
        | {
            Args: {
              p_base_points: number
              p_source?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_base_points: number
              p_session_hours?: number
              p_source?: string
              p_user_id: string
            }
            Returns: Json
          }
      add_referral_points: {
        Args: { p_points: number; p_source?: string; p_user_id: string }
        Returns: Json
      }
      admin_freeze_user_points: {
        Args: { p_reason?: string; p_target_user_id: string }
        Returns: Json
      }
      admin_unfreeze_user_points: {
        Args: { p_target_user_id: string }
        Returns: Json
      }
      admin_update_leaderboard_rankings: { Args: never; Returns: undefined }
      check_and_award_pending_referral_bonus: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_referral_eligibility: {
        Args: { p_affiliate_id: string }
        Returns: Json
      }
      claim_challenge_reward: {
        Args: {
          p_bonus_points?: number
          p_challenge_id: string
          p_is_daily?: boolean
          p_period_start?: string
          p_reward_points: number
          p_user_id: string
        }
        Returns: Json
      }
      cleanup_expired_order_pii: { Args: never; Returns: number }
      cleanup_old_email_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_mining_logs: { Args: never; Returns: number }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_webhook_requests: { Args: never; Returns: undefined }
      get_leaderboard_top: {
        Args: { p_limit?: number }
        Returns: {
          total_distance_meters: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_leaderboard_with_periods: {
        Args: { p_limit?: number }
        Returns: {
          daily_points: number
          monthly_points: number
          total_distance_meters: number
          total_points: number
          user_id: string
          username: string
          weekly_points: number
        }[]
      }
      get_streak_multiplier: { Args: { streak_days: number }; Returns: number }
      get_team_activity_status: {
        Args: { p_team_user_ids: string[] }
        Returns: {
          is_active: boolean
          last_session_start: string
          team_user_id: string
          username: string
        }[]
      }
      get_time_multiplier: { Args: { hours: number }; Returns: number }
      get_user_daily_speed_tests: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_earning_status: { Args: { p_user_id: string }; Returns: Json }
      get_user_email: { Args: never; Returns: string }
      get_user_monthly_status: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_affiliate_by_code: {
        Args: { lookup_code: string }
        Returns: {
          id: string
          username: string
        }[]
      }
      lookup_affiliate_by_username: {
        Args: { lookup_username: string }
        Returns: {
          affiliate_code: string
          id: string
        }[]
      }
      refresh_coverage_tiles: { Args: never; Returns: undefined }
      request_data_deletion: {
        Args: { requesting_user_id: string }
        Returns: Json
      }
      update_all_prices: { Args: never; Returns: number }
      update_leaderboard_rankings: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
