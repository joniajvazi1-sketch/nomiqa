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
          miner_boost_percentage: number | null
          parent_affiliate_id: string | null
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
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
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
          miner_boost_percentage?: number | null
          parent_affiliate_id?: string | null
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
      offline_contribution_queue: {
        Row: {
          accuracy_meters: number | null
          carrier: string | null
          created_at: string | null
          device_type: string | null
          id: string
          latitude: number
          longitude: number
          network_type: string | null
          processed: boolean | null
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
          device_type?: string | null
          id?: string
          latitude: number
          longitude: number
          network_type?: string | null
          processed?: boolean | null
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
          device_type?: string | null
          id?: string
          latitude?: number
          longitude?: number
          network_type?: string | null
          processed?: boolean | null
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
          activation_code: string | null
          airlo_order_id: string | null
          airlo_request_id: string | null
          created_at: string
          data_amount: string | null
          email: string
          full_name: string | null
          iccid: string | null
          id: string
          lpa: string | null
          manual_installation: string | null
          matching_id: string | null
          package_name: string | null
          product_id: string
          qr_code_url: string | null
          qrcode: string | null
          qrcode_installation: string | null
          referral_code: string | null
          sharing_access_code: string | null
          sharing_link: string | null
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
          activation_code?: string | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email: string
          full_name?: string | null
          iccid?: string | null
          id?: string
          lpa?: string | null
          manual_installation?: string | null
          matching_id?: string | null
          package_name?: string | null
          product_id: string
          qr_code_url?: string | null
          qrcode?: string | null
          qrcode_installation?: string | null
          referral_code?: string | null
          sharing_access_code?: string | null
          sharing_link?: string | null
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
          activation_code?: string | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email?: string
          full_name?: string | null
          iccid?: string | null
          id?: string
          lpa?: string | null
          manual_installation?: string | null
          matching_id?: string | null
          package_name?: string | null
          product_id?: string
          qr_code_url?: string | null
          qrcode?: string | null
          qrcode_installation?: string | null
          referral_code?: string | null
          sharing_access_code?: string | null
          sharing_link?: string | null
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
          created_at: string
          email: string | null
          email_verified: boolean | null
          id: string
          is_early_member: boolean
          password_reset_code: string | null
          password_reset_expires_at: string | null
          updated_at: string
          user_id: string
          username: string
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_early_member?: boolean
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          updated_at?: string
          user_id: string
          username: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          id?: string
          is_early_member?: boolean
          password_reset_code?: string | null
          password_reset_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          contribution_streak_days: number | null
          created_at: string | null
          id: string
          last_contribution_date: string | null
          pending_points: number | null
          total_contribution_time_seconds: number | null
          total_distance_meters: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contribution_streak_days?: number | null
          created_at?: string | null
          id?: string
          last_contribution_date?: string | null
          pending_points?: number | null
          total_contribution_time_seconds?: number | null
          total_distance_meters?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contribution_streak_days?: number | null
          created_at?: string | null
          id?: string
          last_contribution_date?: string | null
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
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_order_pii: { Args: never; Returns: number }
      cleanup_old_email_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_mining_logs: { Args: never; Returns: number }
      cleanup_old_webhook_requests: { Args: never; Returns: undefined }
      get_user_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_data_deletion: {
        Args: { requesting_user_id: string }
        Returns: Json
      }
      update_all_prices: { Args: never; Returns: number }
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
