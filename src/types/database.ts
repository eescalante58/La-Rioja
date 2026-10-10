/**
 * Tipos generados desde el esquema de Supabase (proyecto wfkqsifhxnarmxrvbgiu).
 * NO editar a mano: regenerar con el MCP de Supabase (generate_typescript_types)
 * o con `supabase gen types typescript` tras aplicar migraciones.
 */

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
      cards: {
        Row: {
          card_number: number
          card_price: number | null
          card_status: Database["public"]["Enums"]["card_status_enum"] | null
          card_type: Database["public"]["Enums"]["card_type_enum"] | null
          comment: string | null
          company_id: number
          created_at: string | null
          event_id: string
          id: number
          image_url: string | null
          invoice_number: string | null
          player_email: string | null
          player_name: string | null
          player_phone_number: string | null
          prize: string | null
          sales_price: number | null
          search_vector: unknown
          sold_by: string | null
          updated_at: string | null
        }
        Insert: {
          card_number: number
          card_price?: number | null
          card_status?: Database["public"]["Enums"]["card_status_enum"] | null
          card_type?: Database["public"]["Enums"]["card_type_enum"] | null
          comment?: string | null
          company_id: number
          created_at?: string | null
          event_id: string
          id?: number
          image_url?: string | null
          invoice_number?: string | null
          player_email?: string | null
          player_name?: string | null
          player_phone_number?: string | null
          prize?: string | null
          sales_price?: number | null
          search_vector?: unknown
          sold_by?: string | null
          updated_at?: string | null
        }
        Update: {
          card_number?: number
          card_price?: number | null
          card_status?: Database["public"]["Enums"]["card_status_enum"] | null
          card_type?: Database["public"]["Enums"]["card_type_enum"] | null
          comment?: string | null
          company_id?: number
          created_at?: string | null
          event_id?: string
          id?: number
          image_url?: string | null
          invoice_number?: string | null
          player_email?: string | null
          player_name?: string | null
          player_phone_number?: string | null
          prize?: string | null
          sales_price?: number | null
          search_vector?: unknown
          sold_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
          {
            foreignKeyName: "cards_company_id_invoice_number_fkey"
            columns: ["company_id", "invoice_number"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["company_id", "invoice_number"]
          },
        ]
      }
      companies: {
        Row: {
          company_id: number
          company_name: string | null
          created_at: string
          def_dash_event_id: string | null
          phone_code_area: string | null
          phone_number: string | null
          session_timeout_minutes: number | null
          updated_at: string | null
          web_site: string | null
        }
        Insert: {
          company_id?: number
          company_name?: string | null
          created_at?: string
          def_dash_event_id?: string | null
          phone_code_area?: string | null
          phone_number?: string | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          web_site?: string | null
        }
        Update: {
          company_id?: number
          company_name?: string | null
          created_at?: string
          def_dash_event_id?: string | null
          phone_code_area?: string | null
          phone_number?: string | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
          web_site?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_company_def_dash_event_id_fkey"
            columns: ["company_id", "def_dash_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          target_email: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          target_email: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          target_email?: string
          type?: string | null
        }
        Relationships: []
      }
      country_codes: {
        Row: {
          created_at: string
          flag_emoji: string | null
          id: number
          iso2: string
          iso3: string
          name: string
          phone_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_emoji?: string | null
          id?: number
          iso2: string
          iso3: string
          name: string
          phone_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_emoji?: string | null
          id?: number
          iso2?: string
          iso3?: string
          name?: string
          phone_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_phone_number: {
        Row: {
          company_id: number
          created_at: string
          customer_name: string
          id: number
          phone_number: string | null
          table_data_source: string | null
          updated_at: string
        }
        Insert: {
          company_id: number
          created_at?: string
          customer_name: string
          id?: number
          phone_number?: string | null
          table_data_source?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: number
          created_at?: string
          customer_name?: string
          id?: number
          phone_number?: string | null
          table_data_source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_phone_number_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      event_gallery: {
        Row: {
          caption: string | null
          company_id: number
          content_order: number | null
          created_at: string | null
          event_id: string
          id: string
          image_url: string
          is_active: boolean | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          company_id: number
          content_order?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          image_url: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          company_id?: number
          content_order?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_gallery_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      events: {
        Row: {
          card_value: number | null
          company_id: number
          created_at: string
          event_cartons_number: number | null
          event_date: string | null
          event_description: string | null
          event_goal: number | null
          event_id: string
          event_manager: string | null
          event_name: string | null
          event_start_promotion_date: string | null
          event_venue: string | null
          id: number
          is_active: boolean | null
          Method_of_payment: string | null
          status: string | null
          total_amount_solded: number | null
          updated_at: string | null
        }
        Insert: {
          card_value?: number | null
          company_id: number
          created_at?: string
          event_cartons_number?: number | null
          event_date?: string | null
          event_description?: string | null
          event_goal?: number | null
          event_id: string
          event_manager?: string | null
          event_name?: string | null
          event_start_promotion_date?: string | null
          event_venue?: string | null
          id?: number
          is_active?: boolean | null
          Method_of_payment?: string | null
          status?: string | null
          total_amount_solded?: number | null
          updated_at?: string | null
        }
        Update: {
          card_value?: number | null
          company_id?: number
          created_at?: string
          event_cartons_number?: number | null
          event_date?: string | null
          event_description?: string | null
          event_goal?: number | null
          event_id?: string
          event_manager?: string | null
          event_name?: string | null
          event_start_promotion_date?: string | null
          event_venue?: string | null
          id?: number
          is_active?: boolean | null
          Method_of_payment?: string | null
          status?: string | null
          total_amount_solded?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      faq_sections: {
        Row: {
          content_order: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          content_order: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          section_id: string | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          content_order?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          section_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          content_order?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          section_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "faq_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          card_price: number
          cards_number: number
          company_id: number
          created_at: string | null
          customer_email: string | null
          customer_name: string
          event_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          manager_name: string | null
          observation: string | null
          payment_method:
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          phone_area: string | null
          phone_number: string | null
          search_vector: unknown
          send_whatsapp_message: string | null
          status: Database["public"]["Enums"]["invoice_status_enum"] | null
          total_amount: number
          updated_at: string | null
          url_invoice: string | null
          whatsapp_number: string | null
        }
        Insert: {
          card_price: number
          cards_number: number
          company_id: number
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          event_id?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          manager_name?: string | null
          observation?: string | null
          payment_method?:
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          phone_area?: string | null
          phone_number?: string | null
          search_vector?: unknown
          send_whatsapp_message?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          total_amount: number
          updated_at?: string | null
          url_invoice?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          card_price?: number
          cards_number?: number
          company_id?: number
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          event_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          manager_name?: string | null
          observation?: string | null
          payment_method?:
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          phone_area?: string | null
          phone_number?: string | null
          search_vector?: unknown
          send_whatsapp_message?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          total_amount?: number
          updated_at?: string | null
          url_invoice?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      product_catalogs: {
        Row: {
          company_id: number
          content_order: number
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          pdf_size_bytes: number | null
          pdf_updated_at: string | null
          pdf_url: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          company_id: number
          content_order?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
          pdf_size_bytes?: number | null
          pdf_updated_at?: string | null
          pdf_url?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: number
          content_order?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
          pdf_size_bytes?: number | null
          pdf_updated_at?: string | null
          pdf_url?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_catalogs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      product_lines: {
        Row: {
          catalog_id: number
          content_order: number
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          slogan: string | null
          updated_at: string
        }
        Insert: {
          catalog_id: number
          content_order?: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
          slogan?: string | null
          updated_at?: string
        }
        Update: {
          catalog_id?: number
          content_order?: number
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
          slogan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lines_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          content_order: number
          created_at: string
          id: number
          is_available: boolean
          label: string | null
          price: number
          product_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          content_order?: number
          created_at?: string
          id?: never
          is_available?: boolean
          label?: string | null
          price: number
          product_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          content_order?: number
          created_at?: string
          id?: never
          is_available?: boolean
          label?: string | null
          price?: number
          product_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: number
          content_order: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          line_id: number
          name: string
          updated_at: string
        }
        Insert: {
          company_id: number
          content_order?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          line_id: number
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: number
          content_order?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          line_id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "product_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_attempts: {
        Row: {
          attempted_at: string
          client_ip: string
          id: number
        }
        Insert: {
          attempted_at?: string
          client_ip: string
          id?: never
        }
        Update: {
          attempted_at?: string
          client_ip?: string
          id?: never
        }
        Relationships: []
      }
      registration_limits: {
        Row: {
          id: number
          max_attempts_minute: number
          max_cards_day_ip: number
          max_cards_phone: number
          mode: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          max_attempts_minute?: number
          max_cards_day_ip?: number
          max_cards_phone?: number
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          max_attempts_minute?: number
          max_cards_day_ip?: number
          max_cards_phone?: number
          mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          level: number
          name: string
          role_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          level?: number
          name: string
          role_id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          level?: number
          name?: string
          role_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_order_attempts: {
        Row: {
          attempted_at: string
          client_ip: string
          id: number
        }
        Insert: {
          attempted_at?: string
          client_ip: string
          id?: never
        }
        Update: {
          attempted_at?: string
          client_ip?: string
          id?: never
        }
        Relationships: []
      }
      shop_order_items: {
        Row: {
          id: number
          order_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit: string | null
          unit_price: number
          variant_id: number | null
          variant_label: string | null
        }
        Insert: {
          id?: never
          order_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit?: string | null
          unit_price: number
          variant_id?: number | null
          variant_label?: string | null
        }
        Update: {
          id?: never
          order_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit?: string | null
          unit_price?: number
          variant_id?: number | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          client_ip: string | null
          company_id: number
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_number: number
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          client_ip?: string | null
          company_id: number
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_number?: never
          status?: string
          total: number
          updated_at?: string
        }
        Update: {
          client_ip?: string | null
          company_id?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_number?: never
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      site_content: {
        Row: {
          content_order: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          page: Database["public"]["Enums"]["site_page_type"]
          section_key: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          page: Database["public"]["Enums"]["site_page_type"]
          section_key: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          page?: Database["public"]["Enums"]["site_page_type"]
          section_key?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          company_id: number
          created_at: string | null
          event_id: string
          id: number
          student_id: number
          student_level:
            | Database["public"]["Enums"]["student_level_enum"]
            | null
          student_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: number
          created_at?: string | null
          event_id: string
          id?: number
          student_id: number
          student_level?:
            | Database["public"]["Enums"]["student_level_enum"]
            | null
          student_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: number
          created_at?: string | null
          event_id?: string
          id?: number
          student_id?: number
          student_level?:
            | Database["public"]["Enums"]["student_level_enum"]
            | null
          student_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_event"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      students_cards: {
        Row: {
          card_number: number
          company_id: number
          created_at: string | null
          event_id: string
          id: number
          student_id: number
          updated_at: string | null
        }
        Insert: {
          card_number: number
          company_id: number
          created_at?: string | null
          event_id: string
          id?: number
          student_id: number
          updated_at?: string | null
        }
        Update: {
          card_number?: number
          company_id?: number
          created_at?: string | null
          event_id?: string
          id?: number
          student_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_cards_card"
            columns: ["company_id", "event_id", "card_number"]
            isOneToOne: true
            referencedRelation: "cards"
            referencedColumns: ["company_id", "event_id", "card_number"]
          },
          {
            foreignKeyName: "fk_students_cards_student"
            columns: ["company_id", "event_id", "student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["company_id", "event_id", "student_id"]
          },
          {
            foreignKeyName: "fk_students_cards_student"
            columns: ["company_id", "event_id", "student_id"]
            isOneToOne: false
            referencedRelation: "v_students_with_counts"
            referencedColumns: ["company_id", "event_id", "student_id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: number
          created_at: string | null
          default_event_id: string | null
          role: string | null
          role_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string | null
          default_event_id?: string | null
          role?: string | null
          role_id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string | null
          default_event_id?: string | null
          role?: string | null
          role_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_companies_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          first_second_name: string | null
          full_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          last_second_name: string | null
          metadata: Json | null
          phone: string | null
          role_id: number
          secondary_email: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          first_second_name?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          last_second_name?: string | null
          metadata?: Json | null
          phone?: string | null
          role_id?: number
          secondary_email?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          first_second_name?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          last_second_name?: string | null
          metadata?: Json | null
          phone?: string | null
          role_id?: number
          secondary_email?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      whatsapp_promo_logs: {
        Row: {
          batch_id: string
          company_id: number
          created_at: string | null
          customer_name: string
          error_message: string | null
          id: number
          image_url: string | null
          message_body: string
          phone_number: string
          status: string
        }
        Insert: {
          batch_id: string
          company_id: number
          created_at?: string | null
          customer_name: string
          error_message?: string | null
          id?: number
          image_url?: string | null
          message_body: string
          phone_number: string
          status: string
        }
        Update: {
          batch_id?: string
          company_id?: number
          created_at?: string | null
          customer_name?: string
          error_message?: string | null
          id?: number
          image_url?: string | null
          message_body?: string
          phone_number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_promo_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      wheel_configs: {
        Row: {
          automatic_timeout_rotation: number
          company_id: number
          created_at: string
          created_by: string | null
          event_id: string
          id: number
          is_automatic_rotation: boolean
          mode: string
          prizes_number: number
          published: boolean
          time_rotation: number
          updated_at: string
          wheel_name: string
        }
        Insert: {
          automatic_timeout_rotation?: number
          company_id: number
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: never
          is_automatic_rotation?: boolean
          mode: string
          prizes_number?: number
          published?: boolean
          time_rotation?: number
          updated_at?: string
          wheel_name: string
        }
        Update: {
          automatic_timeout_rotation?: number
          company_id?: number
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: never
          is_automatic_rotation?: boolean
          mode?: string
          prizes_number?: number
          published?: boolean
          time_rotation?: number
          updated_at?: string
          wheel_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_configs_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      wheel_items: {
        Row: {
          color: string | null
          company_id: number
          created_at: string
          event_id: string
          id: number
          initial_quantity: number
          is_active: boolean
          is_prize: boolean
          label: string
          mode: string
          position: number | null
          quantity: number
          updated_at: string
          wheel_id: number
          wheel_name: string
        }
        Insert: {
          color?: string | null
          company_id: number
          created_at?: string
          event_id: string
          id?: never
          initial_quantity?: number
          is_active?: boolean
          is_prize?: boolean
          label: string
          mode: string
          position?: number | null
          quantity?: number
          updated_at?: string
          wheel_id: number
          wheel_name: string
        }
        Update: {
          color?: string | null
          company_id?: number
          created_at?: string
          event_id?: string
          id?: never
          initial_quantity?: number
          is_active?: boolean
          is_prize?: boolean
          label?: string
          mode?: string
          position?: number | null
          quantity?: number
          updated_at?: string
          wheel_id?: number
          wheel_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_items_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheel_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_participating_cards: {
        Row: {
          card_number: number
          company_id: number
          created_at: string
          document_number: string | null
          document_type: string | null
          event_id: string
          id: number
          is_winner: boolean
          mode: string
          observation: string | null
          updated_at: string
          wheel_id: number
          wheel_name: string
          winner_name: string | null
          winner_order: number | null
          winner_phone_number: string | null
          winner_prize: string | null
          winner_registered_at: string | null
          won_at: string | null
        }
        Insert: {
          card_number: number
          company_id: number
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          event_id: string
          id?: number
          is_winner?: boolean
          mode: string
          observation?: string | null
          updated_at?: string
          wheel_id: number
          wheel_name: string
          winner_name?: string | null
          winner_order?: number | null
          winner_phone_number?: string | null
          winner_prize?: string | null
          winner_registered_at?: string | null
          won_at?: string | null
        }
        Update: {
          card_number?: number
          company_id?: number
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          event_id?: string
          id?: number
          is_winner?: boolean
          mode?: string
          observation?: string | null
          updated_at?: string
          wheel_id?: number
          wheel_name?: string
          winner_name?: string | null
          winner_order?: number | null
          winner_phone_number?: string | null
          winner_prize?: string | null
          winner_registered_at?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wheel_participating_cards_company_id_event_id_card_number_fkey"
            columns: ["company_id", "event_id", "card_number"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["company_id", "event_id", "card_number"]
          },
          {
            foreignKeyName: "wheel_participating_cards_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheel_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_spins: {
        Row: {
          card_number: number | null
          company_id: number
          event_id: string
          id: number
          item_id: number | null
          mode: string
          prize_label: string | null
          spun_at: string
          spun_by: string | null
          verification_hash: string | null
          wheel_id: number
          wheel_name: string
          winner_label: string
        }
        Insert: {
          card_number?: number | null
          company_id: number
          event_id: string
          id?: never
          item_id?: number | null
          mode: string
          prize_label?: string | null
          spun_at?: string
          spun_by?: string | null
          verification_hash?: string | null
          wheel_id: number
          wheel_name: string
          winner_label: string
        }
        Update: {
          card_number?: number | null
          company_id?: number
          event_id?: string
          id?: never
          item_id?: number | null
          mode?: string
          prize_label?: string | null
          spun_at?: string
          spun_by?: string | null
          verification_hash?: string | null
          wheel_id?: number
          wheel_name?: string
          winner_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_spins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "wheel_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wheel_spins_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheel_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      wheels_presents_cards: {
        Row: {
          card_number: number
          company_id: number
          created_at: string
          document_number: string | null
          document_type: string | null
          event_id: string
          id: number
          is_winner: boolean
          mode: string
          observation: string | null
          player_name: string
          player_phone_number: string
          registered_ip: string | null
          updated_at: string
          wheel_id: number
          wheel_name: string
          winner_name: string | null
          winner_order: number | null
          winner_phone_number: string | null
          winner_prize: string | null
          winner_registered_at: string | null
          won_at: string | null
        }
        Insert: {
          card_number: number
          company_id: number
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          event_id: string
          id?: never
          is_winner?: boolean
          mode: string
          observation?: string | null
          player_name: string
          player_phone_number: string
          registered_ip?: string | null
          updated_at?: string
          wheel_id: number
          wheel_name: string
          winner_name?: string | null
          winner_order?: number | null
          winner_phone_number?: string | null
          winner_prize?: string | null
          winner_registered_at?: string | null
          won_at?: string | null
        }
        Update: {
          card_number?: number
          company_id?: number
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          event_id?: string
          id?: never
          is_winner?: boolean
          mode?: string
          observation?: string | null
          player_name?: string
          player_phone_number?: string
          registered_ip?: string | null
          updated_at?: string
          wheel_id?: number
          wheel_name?: string
          winner_name?: string | null
          winner_order?: number | null
          winner_phone_number?: string | null
          winner_prize?: string | null
          winner_registered_at?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wheels_presents_cards_company_id_event_id_card_number_fkey"
            columns: ["company_id", "event_id", "card_number"]
            isOneToOne: true
            referencedRelation: "cards"
            referencedColumns: ["company_id", "event_id", "card_number"]
          },
          {
            foreignKeyName: "wheels_presents_cards_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "wheel_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_customer_search: {
        Row: {
          company_id: number | null
          customer_name: string | null
          id: number | null
          phone_number: string | null
        }
        Insert: {
          company_id?: number | null
          customer_name?: string | null
          id?: number | null
          phone_number?: string | null
        }
        Update: {
          company_id?: number | null
          customer_name?: string | null
          id?: number | null
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_phone_number_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_invoices: {
        Row: {
          Cliente: string | null
          Email: string | null
          "Fecha factura": string | null
          "Gestor venta": string | null
          "Metodo de pago":
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          "No Cartones": number | null
          "Numero factura": string | null
          status: Database["public"]["Enums"]["invoice_status_enum"] | null
          Telefono: string | null
          "Total factura": number | null
          "Valor del carton": number | null
          Whatsapp: string | null
        }
        Insert: {
          Cliente?: string | null
          Email?: string | null
          "Fecha factura"?: string | null
          "Gestor venta"?: string | null
          "Metodo de pago"?:
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          "No Cartones"?: number | null
          "Numero factura"?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          Telefono?: never
          "Total factura"?: number | null
          "Valor del carton"?: number | null
          Whatsapp?: never
        }
        Update: {
          Cliente?: string | null
          Email?: string | null
          "Fecha factura"?: string | null
          "Gestor venta"?: string | null
          "Metodo de pago"?:
            | Database["public"]["Enums"]["invoice_payment_method_enum"]
            | null
          "No Cartones"?: number | null
          "Numero factura"?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          Telefono?: never
          "Total factura"?: number | null
          "Valor del carton"?: number | null
          Whatsapp?: never
        }
        Relationships: []
      }
      v_promo_batch_summary: {
        Row: {
          batch_id: string | null
          company_id: number | null
          error_count: number | null
          finished_at: string | null
          started_at: string | null
          success_count: number | null
          total_messages: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_promo_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_sold_by: {
        Row: {
          company_id: number | null
          event_id: string | null
          sold_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      v_students_with_counts: {
        Row: {
          assigned_cards_calc: number | null
          company_id: number | null
          created_at: string | null
          event_id: string | null
          id: number | null
          student_id: number | null
          student_level:
            | Database["public"]["Enums"]["student_level_enum"]
            | null
          student_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_event"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
      v_unique_player_phone_number: {
        Row: {
          company_id: number | null
          event_id: string | null
          player_name: string | null
          player_phone_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_company_id_event_id_fkey"
            columns: ["company_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["company_id", "event_id"]
          },
        ]
      }
    }
    Functions: {
      busqueda_universal: {
        Args: { p_company_id: number; p_event_id: string; p_termino: string }
        Returns: {
          detalle: string
          origen: string
          ref: string
          subtitulo: string
          titulo: string
        }[]
      }
      check_security_definer_views: {
        Args: never
        Returns: {
          view_name: string
        }[]
      }
      create_shop_order: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_notes: string
        }
        Returns: Json
      }
      get_table_policies: {
        Args: { t_name: string }
        Returns: {
          cmd: string
          definition: string
          policy_name: string
          roles: string[]
        }[]
      }
      get_tables_rls_status: {
        Args: never
        Returns: {
          rls_enabled: boolean
          table_name: string
        }[]
      }
      get_views_status: {
        Args: never
        Returns: {
          base_tables: string[]
          is_security_definer: boolean
          view_name: string
        }[]
      }
      is_admin_global: { Args: never; Returns: boolean }
      is_global_admin: { Args: never; Returns: boolean }
      is_global_role: { Args: { p_role: string }; Returns: boolean }
      is_reader_global: { Args: never; Returns: boolean }
      log_user_activity: {
        Args: {
          p_action: string
          p_entity?: string
          p_entity_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      participant_card_status: {
        Args: {
          p_card_number: number
          p_company_id: number
          p_event_id: string
        }
        Returns: string
      }
      register_participant_cards: {
        Args: {
          p_card_numbers: number[]
          p_player_name: string
          p_player_phone: string
          p_wheel_id: number
        }
        Returns: Json
      }
      role_id_by_name: { Args: { p_name: string }; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_customers_from_cards: { Args: never; Returns: undefined }
    }
    Enums: {
      card_status_enum:
        | "Disponible"
        | "Asignado"
        | "Vendido"
        | "Cancelado"
        | "Donado"
        | "Reservado"
        | "Anulado"
      card_type_enum: "Fisico" | "Virtual" | "Ticket ruleta"
      invoice_payment_method_enum:
        | "efectivo"
        | "tarjeta credito"
        | "tarjeta debito"
        | "transferencia"
      invoice_status_enum: "pagada" | "pendiente" | "anulada" | "Donada"
      site_page_type:
        | "home"
        | "about"
        | "contact"
        | "global"
        | "social media"
        | "whatsapp message"
        | "services"
        | "programs"
        | "Bingo"
        | "bingo"
        | "tombola"
        | "productos"
      student_level_enum:
        | "1.Terapeutico"
        | "2.Inicial"
        | "3.Medio"
        | "4.Prelaboral"
        | "5.Laboral"
        | "6.Personal La Rioja"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      card_status_enum: [
        "Disponible",
        "Asignado",
        "Vendido",
        "Cancelado",
        "Donado",
        "Reservado",
        "Anulado",
      ],
      card_type_enum: ["Fisico", "Virtual", "Ticket ruleta"],
      invoice_payment_method_enum: [
        "efectivo",
        "tarjeta credito",
        "tarjeta debito",
        "transferencia",
      ],
      invoice_status_enum: ["pagada", "pendiente", "anulada", "Donada"],
      site_page_type: [
        "home",
        "about",
        "contact",
        "global",
        "social media",
        "whatsapp message",
        "services",
        "programs",
        "Bingo",
        "bingo",
        "tombola",
        "productos",
      ],
      student_level_enum: [
        "1.Terapeutico",
        "2.Inicial",
        "3.Medio",
        "4.Prelaboral",
        "5.Laboral",
        "6.Personal La Rioja",
      ],
    },
  },
} as const
