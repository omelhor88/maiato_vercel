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
      angariadores: {
        Row: {
          created_at: string | null
          morada: string | null
          nome: string
          numero_angariador: string
        }
        Insert: {
          created_at?: string | null
          morada?: string | null
          nome: string
          numero_angariador?: string
        }
        Update: {
          created_at?: string | null
          morada?: string | null
          nome?: string
          numero_angariador?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          internet: string | null
          mobile_key: string | null
          name: string
          new_customer_viewed: boolean | null
          nib: string | null
          nif: string | null
          niss: string | null
          notes: string | null
          phone: string | null
          phone2: string | null
          postal_code: string | null
          profession_code: string | null
          social_security_code: string | null
          spouse_internet: string | null
          spouse_nif: string | null
          title_code: string | null
          updated_at: string
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internet?: string | null
          mobile_key?: string | null
          name: string
          new_customer_viewed?: boolean | null
          nib?: string | null
          nif?: string | null
          niss?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          postal_code?: string | null
          profession_code?: string | null
          social_security_code?: string | null
          spouse_internet?: string | null
          spouse_nif?: string | null
          title_code?: string | null
          updated_at?: string
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internet?: string | null
          mobile_key?: string | null
          name?: string
          new_customer_viewed?: boolean | null
          nib?: string | null
          nif?: string | null
          niss?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          postal_code?: string | null
          profession_code?: string | null
          social_security_code?: string | null
          spouse_internet?: string | null
          spouse_nif?: string | null
          title_code?: string | null
          updated_at?: string
          user_id?: string
          viewed?: boolean | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          customer_id: string
          customer_ref_id: string | null
          id: string
          name: string
          relationship: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_ref_id?: string | null
          id?: string
          name: string
          relationship: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_ref_id?: string | null
          id?: string
          name?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_customer_ref_id_fkey"
            columns: ["customer_ref_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      historial: {
        Row: {
          created_at: string
          customer_id: string
          historial_number: string
          id: string
          nif: string | null
          occurrence: string
          occurrence_date: string
          response: string | null
          updated_at: string
          urgent: boolean
          user_id: string
          viewed: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          historial_number: string
          id?: string
          nif?: string | null
          occurrence: string
          occurrence_date?: string
          response?: string | null
          updated_at?: string
          urgent?: boolean
          user_id: string
          viewed?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          historial_number?: string
          id?: string
          nif?: string | null
          occurrence?: string
          occurrence_date?: string
          response?: string | null
          updated_at?: string
          urgent?: boolean
          user_id?: string
          viewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "historial_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance: {
        Row: {
          codigo_estado: string | null
          codigo_marca: string | null
          codigo_mediador: string | null
          codigo_pagamento: string | null
          created_at: string | null
          customer_id: string | null
          data_cancelamento: string | null
          data_emissao_seg: string | null
          data_ultima_alteracao: string | null
          data_vencimento: string | null
          insurance_company_codigo: string | null
          matricula: string | null
          nif: string | null
          numero: string
          numero_angariador: string | null
          numero_apolice: string | null
          numero_mes: number | null
          numero_produto: string | null
          seguro_novo_apresent: boolean | null
          subanga_codigo: string | null
          updated_at: string | null
          user_id: string
          visto: boolean | null
        }
        Insert: {
          codigo_estado?: string | null
          codigo_marca?: string | null
          codigo_mediador?: string | null
          codigo_pagamento?: string | null
          created_at?: string | null
          customer_id?: string | null
          data_cancelamento?: string | null
          data_emissao_seg?: string | null
          data_ultima_alteracao?: string | null
          data_vencimento?: string | null
          insurance_company_codigo?: string | null
          matricula?: string | null
          nif?: string | null
          numero?: string
          numero_angariador?: string | null
          numero_apolice?: string | null
          numero_mes?: number | null
          numero_produto?: string | null
          seguro_novo_apresent?: boolean | null
          subanga_codigo?: string | null
          updated_at?: string | null
          user_id: string
          visto?: boolean | null
        }
        Update: {
          codigo_estado?: string | null
          codigo_marca?: string | null
          codigo_mediador?: string | null
          codigo_pagamento?: string | null
          created_at?: string | null
          customer_id?: string | null
          data_cancelamento?: string | null
          data_emissao_seg?: string | null
          data_ultima_alteracao?: string | null
          data_vencimento?: string | null
          insurance_company_codigo?: string | null
          matricula?: string | null
          nif?: string | null
          numero?: string
          numero_angariador?: string | null
          numero_apolice?: string | null
          numero_mes?: number | null
          numero_produto?: string | null
          seguro_novo_apresent?: boolean | null
          subanga_codigo?: string | null
          updated_at?: string | null
          user_id?: string
          visto?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_codigo_estado_fkey"
            columns: ["codigo_estado"]
            isOneToOne: false
            referencedRelation: "insurance_states"
            referencedColumns: ["codigo_estado"]
          },
          {
            foreignKeyName: "insurance_codigo_marca_fkey"
            columns: ["codigo_marca"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["codigo_marca"]
          },
          {
            foreignKeyName: "insurance_codigo_pagamento_fkey"
            columns: ["codigo_pagamento"]
            isOneToOne: false
            referencedRelation: "payment_types"
            referencedColumns: ["codigo_pagamento"]
          },
          {
            foreignKeyName: "insurance_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_insurance_company_codigo_fkey"
            columns: ["insurance_company_codigo"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "insurance_numero_mes_fkey"
            columns: ["numero_mes"]
            isOneToOne: false
            referencedRelation: "insurance_months"
            referencedColumns: ["numero"]
          },
        ]
      }
      insurance_companies: {
        Row: {
          codigo: string
          codigo_mediador: string | null
          created_at: string | null
          logotipo: string | null
          nome: string
        }
        Insert: {
          codigo?: string
          codigo_mediador?: string | null
          created_at?: string | null
          logotipo?: string | null
          nome: string
        }
        Update: {
          codigo?: string
          codigo_mediador?: string | null
          created_at?: string | null
          logotipo?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_companies_codigo_mediador_fkey"
            columns: ["codigo_mediador"]
            isOneToOne: false
            referencedRelation: "insurance_mediators"
            referencedColumns: ["bi"]
          },
        ]
      }
      insurance_mediators: {
        Row: {
          bi: string
          created_at: string | null
          nome: string
        }
        Insert: {
          bi?: string
          created_at?: string | null
          nome: string
        }
        Update: {
          bi?: string
          created_at?: string | null
          nome?: string
        }
        Relationships: []
      }
      insurance_months: {
        Row: {
          created_at: string | null
          mes: string
          numero: number
        }
        Insert: {
          created_at?: string | null
          mes: string
          numero: number
        }
        Update: {
          created_at?: string | null
          mes?: string
          numero?: number
        }
        Relationships: []
      }
      insurance_products: {
        Row: {
          created_at: string | null
          nome: string
          numero_produto: string
        }
        Insert: {
          created_at?: string | null
          nome: string
          numero_produto?: string
        }
        Update: {
          created_at?: string | null
          nome?: string
          numero_produto?: string
        }
        Relationships: []
      }
      insurance_receipts: {
        Row: {
          anulado: boolean | null
          apolice_numero: string | null
          created_at: string
          customer_id: string | null
          data_entrega: string | null
          data_pagamento: string | null
          data_ultima_alteracao_seg: string | null
          estorno: boolean | null
          id: string
          numero_recibo_companhia: string | null
          numero_recibo_seg: string
          pago_companhia: boolean | null
          premio_total: number | null
          recebido_maiato: boolean | null
          updated_at: string
          user_id: string
          visto: boolean | null
        }
        Insert: {
          anulado?: boolean | null
          apolice_numero?: string | null
          created_at?: string
          customer_id?: string | null
          data_entrega?: string | null
          data_pagamento?: string | null
          data_ultima_alteracao_seg?: string | null
          estorno?: boolean | null
          id?: string
          numero_recibo_companhia?: string | null
          numero_recibo_seg: string
          pago_companhia?: boolean | null
          premio_total?: number | null
          recebido_maiato?: boolean | null
          updated_at?: string
          user_id: string
          visto?: boolean | null
        }
        Update: {
          anulado?: boolean | null
          apolice_numero?: string | null
          created_at?: string
          customer_id?: string | null
          data_entrega?: string | null
          data_pagamento?: string | null
          data_ultima_alteracao_seg?: string | null
          estorno?: boolean | null
          id?: string
          numero_recibo_companhia?: string | null
          numero_recibo_seg?: string
          pago_companhia?: boolean | null
          premio_total?: number | null
          recebido_maiato?: boolean | null
          updated_at?: string
          user_id?: string
          visto?: boolean | null
        }
        Relationships: []
      }
      insurance_states: {
        Row: {
          codigo_estado: string
          created_at: string | null
          estado: string
        }
        Insert: {
          codigo_estado: string
          created_at?: string | null
          estado: string
        }
        Update: {
          codigo_estado?: string
          created_at?: string | null
          estado?: string
        }
        Relationships: []
      }
      payment_types: {
        Row: {
          codigo_pagamento: string
          created_at: string | null
          tipo_pagamento: string
        }
        Insert: {
          codigo_pagamento: string
          created_at?: string | null
          tipo_pagamento: string
        }
        Update: {
          codigo_pagamento?: string
          created_at?: string | null
          tipo_pagamento?: string
        }
        Relationships: []
      }
      professions: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          description: string | null
          id: string
          issue_date: string
          last_modified_date: string | null
          nfc: string | null
          notes: string | null
          paid_date: string | null
          receipt_number: string
          status: string
          sub_type: string | null
          type: string
          updated_at: string
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          issue_date?: string
          last_modified_date?: string | null
          nfc?: string | null
          notes?: string | null
          paid_date?: string | null
          receipt_number: string
          status?: string
          sub_type?: string | null
          type?: string
          updated_at?: string
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          issue_date?: string
          last_modified_date?: string | null
          nfc?: string | null
          notes?: string | null
          paid_date?: string | null
          receipt_number?: string
          status?: string
          sub_type?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          reminder_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          reminder_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          reminder_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subangariadores: {
        Row: {
          created_at: string | null
          subanga_codigo: string
          subanga_morada: string | null
          subanga_nome: string
        }
        Insert: {
          created_at?: string | null
          subanga_codigo?: string
          subanga_morada?: string | null
          subanga_nome: string
        }
        Update: {
          created_at?: string | null
          subanga_codigo?: string
          subanga_morada?: string | null
          subanga_nome?: string
        }
        Relationships: []
      }
      titles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
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
      vehicle_brands: {
        Row: {
          codigo_marca: string
          created_at: string | null
          marca: string
        }
        Insert: {
          codigo_marca: string
          created_at?: string | null
          marca: string
        }
        Update: {
          codigo_marca?: string
          created_at?: string | null
          marca?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
