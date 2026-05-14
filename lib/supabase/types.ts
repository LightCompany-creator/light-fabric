export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workshops: {
        Row: {
          id: string;
          code: string;
          name: string;
          seq_order: number;
          color: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          seq_order: number;
          color: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          seq_order?: number;
          color?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
articles: {
        Row: {
          id: string;
          code: string;
          name: string;
          material: Database["public"]["Enums"]["material_type"];
          box_qty: number;
          size_min: number | null;
          size_max: number | null;
          wholesale_price: number | null;
          weight_per_pair: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          material: Database["public"]["Enums"]["material_type"];
          box_qty: number;
          size_min?: number | null;
          size_max?: number | null;
          wholesale_price?: number | null;
          weight_per_pair?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          material?: Database["public"]["Enums"]["material_type"];
          box_qty?: number;
          size_min?: number | null;
          size_max?: number | null;
          wholesale_price?: number | null;
          weight_per_pair?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
materials: {
        Row: {
          id: string;
          code: string;
          name: string;
          unit: Database["public"]["Enums"]["material_unit"];
          current_stock: number;
          min_stock: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          unit: Database["public"]["Enums"]["material_unit"];
          current_stock?: number;
          min_stock?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          unit?: Database["public"]["Enums"]["material_unit"];
          current_stock?: number;
          min_stock?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
employees: {
        Row: {
          id: string;
          tab_number: string;
          full_name: string;
          workshop_id: string | null;
          position: string | null;
          user_id: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          is_active: boolean;
          hire_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tab_number: string;
          full_name: string;
          workshop_id?: string | null;
          position?: string | null;
          user_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          is_active?: boolean;
          hire_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tab_number?: string;
          full_name?: string;
          workshop_id?: string | null;
          position?: string | null;
          user_id?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          is_active?: boolean;
          hire_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
rates: {
        Row: {
          id: string;
          workshop_id: string | null;
          article_id: string | null;
          operation: string | null;
          rate_per_unit: number;
          unit_type: Database["public"]["Enums"]["rate_unit_type"];
          valid_from: string;
          valid_to: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workshop_id?: string | null;
          article_id?: string | null;
          operation?: string | null;
          rate_per_unit: number;
          unit_type?: Database["public"]["Enums"]["rate_unit_type"];
          valid_from?: string;
          valid_to?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          workshop_id?: string | null;
          article_id?: string | null;
          operation?: string | null;
          rate_per_unit?: number;
          unit_type?: Database["public"]["Enums"]["rate_unit_type"];
          valid_from?: string;
          valid_to?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
norms: {
        Row: {
          id: string;
          article_id: string;
          material_id: string;
          qty_per_pair: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          material_id: string;
          qty_per_pair: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          material_id?: string;
          qty_per_pair?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
shifts: {
        Row: {
          id: string;
          workshop_id: string;
          foreman_id: string;
          shift_date: string;
          shift_type: Database["public"]["Enums"]["shift_type"];
          status: Database["public"]["Enums"]["shift_status"];
          opened_at: string;
          closed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workshop_id: string;
          foreman_id: string;
          shift_date: string;
          shift_type?: Database["public"]["Enums"]["shift_type"];
          status?: Database["public"]["Enums"]["shift_status"];
          opened_at?: string;
          closed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workshop_id?: string;
          foreman_id?: string;
          shift_date?: string;
          shift_type?: Database["public"]["Enums"]["shift_type"];
          status?: Database["public"]["Enums"]["shift_status"];
          opened_at?: string;
          closed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
shift_outputs: {
        Row: {
          id: string;
          shift_id: string;
          article_id: string;
          quantity: number;
          weight: number | null;
          defect_qty: number;
          machine: string | null;
          cast_forms: number | null;
          downtime_min: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          article_id: string;
          quantity: number;
          weight?: number | null;
          defect_qty?: number;
          machine?: string | null;
          cast_forms?: number | null;
          downtime_min?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          article_id?: string;
          quantity?: number;
          weight?: number | null;
          defect_qty?: number;
          machine?: string | null;
          cast_forms?: number | null;
          downtime_min?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
shift_workers: {
        Row: {
          id: string;
          shift_id: string;
          employee_id: string;
          operations: Json | null;
          qty_done: number;
          calculated_pay: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          employee_id: string;
          operations?: Json | null;
          qty_done?: number;
          calculated_pay?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          employee_id?: string;
          operations?: Json | null;
          qty_done?: number;
          calculated_pay?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
material_consumption: {
        Row: {
          id: string;
          shift_id: string;
          material_id: string;
          qty_used: number;
          is_by_norm: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          material_id: string;
          qty_used: number;
          is_by_norm?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          material_id?: string;
          qty_used?: number;
          is_by_norm?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
payroll_lines: {
        Row: {
          id: string;
          period: string;
          employee_id: string;
          workshop_id: string;
          amount: number;
          breakdown: Json | null;
          exported_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          employee_id: string;
          workshop_id: string;
          amount: number;
          breakdown?: Json | null;
          exported_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          period?: string;
          employee_id?: string;
          workshop_id?: string;
          amount?: number;
          breakdown?: Json | null;
          exported_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
sync_log: {
        Row: {
          id: string;
          sync_type: string;
          direction: string;
          status: string;
          records_count: number | null;
          errors_count: number;
          details: Json | null;
          performed_by: string | null;
          performed_at: string;
        };
        Insert: {
          id?: string;
          sync_type: string;
          direction: string;
          status: string;
          records_count?: number | null;
          errors_count?: number;
          details?: Json | null;
          performed_by?: string | null;
          performed_at?: string;
        };
        Update: {
          id?: string;
          sync_type?: string;
          direction?: string;
          status?: string;
          records_count?: number | null;
          errors_count?: number;
          details?: Json | null;
          performed_by?: string | null;
          performed_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      material_type: "ЭВА" | "ПВХ" | "силикон" | "текстиль" | "фурнитура" | "прочее";
      material_unit: "кг" | "шт" | "м" | "м²" | "л";
      user_role: "foreman" | "technologist" | "director" | "accountant" | "admin";
      shift_type: "день" | "ночь";
      shift_status: "open" | "closed";
      rate_unit_type: "пара" | "деталь" | "операция" | "единица" | "кг";
    };
  };
};

// Удобные хелперы
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
