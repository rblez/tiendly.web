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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          store_id: string
          type: string
          uses: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          store_id: string
          type?: string
          uses?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          store_id?: string
          type?: string
          uses?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          customer_name: string
          customer_phone: string
          delivery: Json | null
          discount: number
          id: string
          items: Json
          notes: string | null
          payment: Json | null
          payment_receipt: string | null
          status: string
          store_id: string
          total: number
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          code?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          customer_phone: string
          delivery?: Json | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment?: Json | null
          payment_receipt?: string | null
          status?: string
          store_id: string
          total?: number
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          code?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          customer_phone?: string
          delivery?: Json | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          payment?: Json | null
          payment_receipt?: string | null
          status?: string
          store_id?: string
          total?: number
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          agotado: boolean
          ask?: string[] | null
          bajo_pedido: boolean
          category: string
          created_at: string
          currency: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          delivery_type: string
          id: string
          image: string | null
          images: Json
          name: string
          position: number
          price: number
          stock: number | null
          store_id: string
          variants: Json
        }
        Insert: {
          active?: boolean
          agotado?: boolean
          ask?: string[] | null
          bajo_pedido?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          delivery_type?: string
          id?: string
          image?: string | null
          images?: Json
          name: string
          position?: number
          price?: number
          stock?: number | null
          store_id: string
          variants?: Json
        }
        Update: {
          active?: boolean
          agotado?: boolean
          ask?: string[] | null
          bajo_pedido?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          delivery_type?: string
          id?: string
          image?: string | null
          images?: Json
          name?: string
          position?: number
          price?: number
          stock?: number | null
          store_id?: string
          variants?: Json
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          plan: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string
          phone?: string | null
          plan?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          plan?: string
        }
        Relationships: []
      }
      store_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          store_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          store_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          id: string
          store_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visit_date: string
          visits: number
        }
        Insert: {
          id?: string
          store_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visit_date?: string
          visits?: number
        }
        Update: {
          id?: string
          store_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visit_date?: string
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          action: string
          active: boolean
          banner: string | null
          category: string | null
          code: string
          created_at: string
          currency: string | null
          delivery: Json | null
          description: string | null
          exchange_rate: number | null
          exchange_rates: Json
          extra_links: Json
          id: string
          location: string | null
          logo: string | null
          name: string
          owner_id: string | null
          payments: Json | null
          preview_expires_at: string | null
          preview_token: string | null
          schedule: string | null
          slug: string
          social: Json
          theme_color: string
          visits: number
          whatsapp: string | null
        }
        Insert: {
          action?: string
          active?: boolean
          banner?: string | null
          category?: string | null
          code: string
          created_at?: string
          currency?: string | null
          delivery?: Json | null
          description?: string | null
          exchange_rate?: number | null
          exchange_rates?: Json
          extra_links?: Json
          id?: string
          location?: string | null
          logo?: string | null
          name: string
          owner_id?: string | null
          payments?: Json | null
          preview_expires_at?: string | null
          preview_token?: string | null
          schedule?: string | null
          slug: string
          social?: Json
          theme_color?: string
          visits?: number
          whatsapp?: string | null
        }
        Update: {
          action?: string
          active?: boolean
          banner?: string | null
          category?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          delivery?: Json | null
          description?: string | null
          exchange_rate?: number | null
          exchange_rates?: Json
          extra_links?: Json
          id?: string
          location?: string | null
          logo?: string | null
          name?: string
          owner_id?: string | null
          payments?: Json | null
          preview_expires_at?: string | null
          preview_token?: string | null
          schedule?: string | null
          slug?: string
          social?: Json
          theme_color?: string
          visits?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_preview_store: {
        Args: {
          p_name: string
          p_slug: string
          p_code: string
          p_category: string | null
          p_description: string | null
          p_whatsapp: string | null
          p_theme_color: string
          p_preview_token: string
          p_preview_expires_at: string
          p_products: Json
        }
        Returns: Json
      }
      delete_account: { Args: { p_user_id: string }; Returns: undefined }
      gen_store_code: { Args: never; Returns: string }
      increment_store_visit: { Args: { p_slug: string }; Returns: number }
      is_store_owner: { Args: { store_id: string }; Returns: boolean }
      redeem_coupon: { Args: { p_store_slug: string; p_code: string }; Returns: Json }
      validate_coupon: { Args: { p_store_slug: string; p_code: string }; Returns: Json }
      track_order: { Args: { p_slug: string; p_code: string }; Returns: Json }
      track_visit: {
        Args: {
          p_slug: string
          p_utm_source?: string | null
          p_utm_medium?: string | null
          p_utm_campaign?: string | null
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

