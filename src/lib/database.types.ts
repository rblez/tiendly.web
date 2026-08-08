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
      orders: {
        Row: {
          code: string | null
          created_at: string
          currency: string
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          status: string
          store_id: string
          total: number
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          customer_phone: string
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          store_id: string
          total?: number
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
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
          bajo_pedido: boolean
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          image: string | null
          images: Json
          name: string
          position: number
          price: number
          store_id: string
          variants: Json
        }
        Insert: {
          active?: boolean
          agotado?: boolean
          bajo_pedido?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          name: string
          position?: number
          price?: number
          store_id: string
          variants?: Json
        }
        Update: {
          active?: boolean
          agotado?: boolean
          bajo_pedido?: boolean
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image?: string | null
          images?: Json
          name?: string
          position?: number
          price?: number
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
          active: boolean
          banner: string | null
          code: string
          created_at: string
          description: string | null
          extra_links: Json
          id: string
          location: string | null
          logo: string | null
          name: string
          owner_id: string | null
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
          active?: boolean
          banner?: string | null
          code: string
          created_at?: string
          description?: string | null
          extra_links?: Json
          id?: string
          location?: string | null
          logo?: string | null
          name: string
          owner_id?: string | null
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
          active?: boolean
          banner?: string | null
          code?: string
          created_at?: string
          description?: string | null
          extra_links?: Json
          id?: string
          location?: string | null
          logo?: string | null
          name?: string
          owner_id?: string | null
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
      delete_account: { Args: { p_user_id: string }; Returns: undefined }
      gen_store_code: { Args: never; Returns: string }
      increment_store_visit: { Args: { p_slug: string }; Returns: number }
      is_store_owner: { Args: { store_id: string }; Returns: boolean }
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

