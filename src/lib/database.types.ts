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
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          logo: string | null
          name: string
          owner_id: string
          slug: string
          theme_color: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          owner_id: string
          slug: string
          theme_color?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          owner_id?: string
          slug?: string
          theme_color?: string
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
