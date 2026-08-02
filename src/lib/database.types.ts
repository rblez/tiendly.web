export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          store_id: string
          customer_name: string
          customer_phone: string
          notes: string | null
          items: Json
          total: number
          currency: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          customer_name: string
          customer_phone: string
          notes?: string | null
          items?: Json
          total?: number
          currency?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          customer_name?: string
          customer_phone?: string
          notes?: string | null
          items?: Json
          total?: number
          currency?: string
          status?: string
          created_at?: string
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
          created_at: string
          id: string
          name: string
          phone: string | null
          plan: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
          phone?: string | null
          plan?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          plan?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          banner: string | null
          created_at: string
          description: string | null
          id: string
          logo: string | null
          name: string
          owner_id: string
          slug: string
          social: Json
          theme_color: string
          visits: number
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          banner?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          owner_id: string
          slug: string
          social?: Json
          theme_color?: string
          visits?: number
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          banner?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          owner_id?: string
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
      store_visits: {
        Row: {
          id: string
          store_id: string
          visit_date: string
          visits: number
        }
        Insert: {
          id?: string
          store_id: string
          visit_date?: string
          visits?: number
        }
        Update: {
          id?: string
          store_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_store_visit: { Args: { p_slug: string }; Returns: number }
      is_store_owner: { Args: { store_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
