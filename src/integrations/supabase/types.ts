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
          id: string
          parent_affiliate_id: string | null
          status: string | null
          total_clicks: number | null
          total_conversions: number | null
          total_earnings_usd: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string
          email: string
          id?: string
          parent_affiliate_id?: string | null
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings_usd?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string
          email?: string
          id?: string
          parent_affiliate_id?: string | null
          status?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings_usd?: number | null
          updated_at?: string
          user_id?: string | null
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
      orders: {
        Row: {
          activation_code: string | null
          airlo_order_id: string | null
          airlo_request_id: string | null
          created_at: string
          data_amount: string | null
          email: string
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
          status: string
          total_amount_usd: number
          updated_at: string
          user_id: string | null
          validity_days: number | null
        }
        Insert: {
          activation_code?: string | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email: string
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
          status?: string
          total_amount_usd: number
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
        }
        Update: {
          activation_code?: string | null
          airlo_order_id?: string | null
          airlo_request_id?: string | null
          created_at?: string
          data_amount?: string | null
          email?: string
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
          status?: string
          total_amount_usd?: number
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
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
      products: {
        Row: {
          airlo_package_id: string
          country_code: string
          country_name: string
          created_at: string
          data_amount: string
          features: Json | null
          id: string
          is_popular: boolean | null
          name: string
          price_usd: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          airlo_package_id: string
          country_code: string
          country_name: string
          created_at?: string
          data_amount: string
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name: string
          price_usd: number
          updated_at?: string
          validity_days: number
        }
        Update: {
          airlo_package_id?: string
          country_code?: string
          country_name?: string
          created_at?: string
          data_amount?: string
          features?: Json | null
          id?: string
          is_popular?: boolean | null
          name?: string
          price_usd?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
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
      update_all_prices: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
