export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      actions: {
        Row: {
          archived_at: string | null;
          communication_id: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          meeting_id: string | null;
          name: string;
          notes: string;
          owner_id: string;
          priority: string;
          property_id: string | null;
          status: string;
          tenant_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          communication_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          meeting_id?: string | null;
          name: string;
          notes?: string;
          owner_id?: string;
          priority?: string;
          property_id?: string | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          communication_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          meeting_id?: string | null;
          name?: string;
          notes?: string;
          owner_id?: string;
          priority?: string;
          property_id?: string | null;
          status?: string;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "actions_owner_id_communication_id_fkey";
            columns: ["owner_id", "communication_id"];
            isOneToOne: false;
            referencedRelation: "communications";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "actions_owner_id_meeting_id_fkey";
            columns: ["owner_id", "meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "actions_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "actions_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      arrears_balances: {
        Row: {
          amount: number;
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          property_id: string;
          snapshot_id: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          amount: number;
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          property_id: string;
          snapshot_id: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          amount?: number;
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          property_id?: string;
          snapshot_id?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "arrears_balances_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "arrears_balances_owner_id_snapshot_id_fkey";
            columns: ["owner_id", "snapshot_id"];
            isOneToOne: false;
            referencedRelation: "arrears_snapshots";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "arrears_balances_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      arrears_snapshots: {
        Row: {
          archived_at: string | null;
          as_of: string;
          created_at: string;
          currency: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          as_of: string;
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          as_of?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          actor_id: string;
          changed_fields: string[];
          id: number;
          occurred_at: string;
          operation: string;
          owner_id: string;
          record_id: string;
          table_name: string;
        };
        Insert: {
          actor_id: string;
          changed_fields: string[];
          id?: never;
          occurred_at?: string;
          operation: string;
          owner_id: string;
          record_id: string;
          table_name: string;
        };
        Update: {
          actor_id?: string;
          changed_fields?: string[];
          id?: never;
          occurred_at?: string;
          operation?: string;
          owner_id?: string;
          record_id?: string;
          table_name?: string;
        };
        Relationships: [];
      };
      communications: {
        Row: {
          archived_at: string | null;
          channel: string;
          contact: string;
          created_at: string;
          id: string;
          name: string;
          notes: string;
          occurred_at: string;
          owner_id: string;
          property_id: string | null;
          tenant_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          channel?: string;
          contact?: string;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string;
          occurred_at: string;
          owner_id?: string;
          property_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          channel?: string;
          contact?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string;
          occurred_at?: string;
          owner_id?: string;
          property_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "communications_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "communications_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      contacts: {
        Row: {
          archived_at: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          phone: string;
          role: string;
          tenant_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          phone?: string;
          role?: string;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          phone?: string;
          role?: string;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      document_versions: {
        Row: {
          content_type: string;
          created_at: string;
          document_id: string;
          id: string;
          name: string;
          object_path: string;
          owner_id: string;
          revision: number;
          size_bytes: number;
        };
        Insert: {
          content_type: string;
          created_at?: string;
          document_id: string;
          id?: string;
          name: string;
          object_path: string;
          owner_id: string;
          revision: number;
          size_bytes: number;
        };
        Update: {
          content_type?: string;
          created_at?: string;
          document_id?: string;
          id?: string;
          name?: string;
          object_path?: string;
          owner_id?: string;
          revision?: number;
          size_bytes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_owner_id_document_id_fkey";
            columns: ["owner_id", "document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      documents: {
        Row: {
          archived_at: string | null;
          content_type: string;
          created_at: string;
          id: string;
          lease_id: string | null;
          meeting_id: string | null;
          name: string;
          notes: string;
          object_path: string;
          owner_id: string;
          property_id: string | null;
          size_bytes: number;
          tenant_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          content_type: string;
          created_at?: string;
          id?: string;
          lease_id?: string | null;
          meeting_id?: string | null;
          name: string;
          notes?: string;
          object_path: string;
          owner_id?: string;
          property_id?: string | null;
          size_bytes: number;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          content_type?: string;
          created_at?: string;
          id?: string;
          lease_id?: string | null;
          meeting_id?: string | null;
          name?: string;
          notes?: string;
          object_path?: string;
          owner_id?: string;
          property_id?: string | null;
          size_bytes?: number;
          tenant_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "documents_owner_id_lease_id_fkey";
            columns: ["owner_id", "lease_id"];
            isOneToOne: false;
            referencedRelation: "leases";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "documents_owner_id_meeting_id_fkey";
            columns: ["owner_id", "meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "documents_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
          {
            foreignKeyName: "documents_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      events: {
        Row: {
          archived_at: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          location: string;
          name: string;
          notes: string;
          owner_id: string;
          property_id: string | null;
          starts_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          location?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          property_id?: string | null;
          starts_at: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          location?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          property_id?: string | null;
          starts_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "events_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      import_batches: {
        Row: {
          as_of: string;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          rows: Json;
          snapshot_id: string | null;
          source_hash: string;
          source_namespace: string;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          as_of: string;
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
          rows: Json;
          snapshot_id?: string | null;
          source_hash: string;
          source_namespace: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          as_of?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          rows?: Json;
          snapshot_id?: string | null;
          source_hash?: string;
          source_namespace?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_owner_id_snapshot_id_fkey";
            columns: ["owner_id", "snapshot_id"];
            isOneToOne: false;
            referencedRelation: "arrears_snapshots";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      leases: {
        Row: {
          archived_at: string | null;
          created_at: string;
          currency: string;
          end_date: string;
          id: string;
          monthly_rent: number;
          name: string;
          notes: string;
          owner_id: string;
          premises_id: string;
          property_id: string;
          start_date: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          end_date: string;
          id?: string;
          monthly_rent: number;
          name: string;
          notes?: string;
          owner_id?: string;
          premises_id: string;
          property_id: string;
          start_date: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          end_date?: string;
          id?: string;
          monthly_rent?: number;
          name?: string;
          notes?: string;
          owner_id?: string;
          premises_id?: string;
          property_id?: string;
          start_date?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "leases_owner_id_property_id_premises_id_fkey";
            columns: ["owner_id", "property_id", "premises_id"];
            isOneToOne: false;
            referencedRelation: "premises";
            referencedColumns: ["owner_id", "property_id", "id"];
          },
          {
            foreignKeyName: "leases_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      meetings: {
        Row: {
          archived_at: string | null;
          consent: string;
          created_at: string;
          decisions: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          participants: string;
          property_id: string | null;
          starts_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          consent?: string;
          created_at?: string;
          decisions?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          participants?: string;
          property_id?: string | null;
          starts_at: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          consent?: string;
          created_at?: string;
          decisions?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          participants?: string;
          property_id?: string | null;
          starts_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      premises: {
        Row: {
          archived_at: string | null;
          area: number | null;
          created_at: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          property_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          area?: number | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          property_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          area?: number | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          property_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "premises_owner_id_property_id_fkey";
            columns: ["owner_id", "property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      properties: {
        Row: {
          address: string;
          archived_at: string | null;
          category: string;
          created_at: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          property_type: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          address?: string;
          archived_at?: string | null;
          category?: string;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          property_type?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          address?: string;
          archived_at?: string | null;
          category?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          property_type?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      tenant_external_ids: {
        Row: {
          created_at: string;
          external_id: string;
          id: string;
          owner_id: string;
          source_namespace: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          external_id: string;
          id?: string;
          owner_id?: string;
          source_namespace: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          external_id?: string;
          id?: string;
          owner_id?: string;
          source_namespace?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_external_ids_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      tenants: {
        Row: {
          archived_at: string | null;
          created_at: string;
          email: string;
          external_id: string | null;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          phone: string;
          registration: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          email?: string;
          external_id?: string | null;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          phone?: string;
          registration?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          email?: string;
          external_id?: string | null;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          phone?: string;
          registration?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      turnover_requirements: {
        Row: {
          archived_at: string | null;
          created_at: string;
          end_date: string | null;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          start_date: string;
          tenant_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          start_date: string;
          tenant_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          start_date?: string;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "turnover_requirements_owner_id_tenant_id_fkey";
            columns: ["owner_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      turnover_submissions: {
        Row: {
          amount: number;
          archived_at: string | null;
          created_at: string;
          currency: string;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          period: string;
          requirement_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          amount: number;
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          notes?: string;
          owner_id?: string;
          period: string;
          requirement_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          amount?: number;
          archived_at?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          period?: string;
          requirement_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "turnover_submissions_owner_id_requirement_id_fkey";
            columns: ["owner_id", "requirement_id"];
            isOneToOne: false;
            referencedRelation: "turnover_requirements";
            referencedColumns: ["owner_id", "id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          owner_id: string;
          updated_at: string;
          value: Json;
          version: number;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          updated_at?: string;
          value?: Json;
          version?: number;
        };
        Update: {
          id?: string;
          owner_id?: string;
          updated_at?: string;
          value?: Json;
          version?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_arrears_import: {
        Args: { batch_id: string; expected_version: number };
        Returns: string;
      };
      portfolio_insights: { Args: { report_month: string }; Returns: Json };
      resolve_import_matches: {
        Args: { input_rows: Json; source_name: string };
        Returns: Json;
      };
      restore_workspace: { Args: { payload: Json }; Returns: boolean };
      revise_import: {
        Args: {
          batch_id: string;
          expected_version: number;
          report_date: string;
          review_rows: Json;
        };
        Returns: {
          as_of: string;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          rows: Json;
          snapshot_id: string | null;
          source_hash: string;
          source_namespace: string;
          status: string;
          updated_at: string;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "import_batches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      workspace_access: { Args: never; Returns: boolean };
      workspace_backup: { Args: never; Returns: Json };
      workspace_summary: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
