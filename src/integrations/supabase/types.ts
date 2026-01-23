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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aktiviti: {
        Row: {
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          image_url: string | null
          lokasi: string | null
          max_peserta: number | null
          status: string
          tajuk: string
          tarikh_mula: string
          tarikh_tamat: string
          updated_at: string
          yuran: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          image_url?: string | null
          lokasi?: string | null
          max_peserta?: number | null
          status?: string
          tajuk: string
          tarikh_mula: string
          tarikh_tamat: string
          updated_at?: string
          yuran?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          image_url?: string | null
          lokasi?: string | null
          max_peserta?: number | null
          status?: string
          tajuk?: string
          tarikh_mula?: string
          tarikh_tamat?: string
          updated_at?: string
          yuran?: number | null
        }
        Relationships: []
      }
      dana_masuk: {
        Row: {
          bukti_url: string | null
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          jumlah: number
          sumber: string
          tajuk: string
          tarikh: string
        }
        Insert: {
          bukti_url?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jumlah: number
          sumber?: string
          tajuk: string
          tarikh?: string
        }
        Update: {
          bukti_url?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jumlah?: number
          sumber?: string
          tajuk?: string
          tarikh?: string
        }
        Relationships: []
      }
      dokumen: {
        Row: {
          created_at: string
          created_by: string | null
          deskripsi: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          kategori: string | null
          tajuk: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          kategori?: string | null
          tajuk: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          kategori?: string | null
          tajuk?: string
          updated_at?: string
        }
        Relationships: []
      }
      galeri_aktiviti: {
        Row: {
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          image_url: string
          tajuk: string
          tarikh_event: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          image_url: string
          tajuk: string
          tarikh_event: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          image_url?: string
          tajuk?: string
          tarikh_event?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dibaca: boolean
          id: string
          jenis: string
          mesej: string
          tajuk: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dibaca?: boolean
          id?: string
          jenis?: string
          mesej: string
          tajuk: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dibaca?: boolean
          id?: string
          jenis?: string
          mesej?: string
          tajuk?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pendaftaran_aktiviti: {
        Row: {
          aktiviti_id: string
          catatan: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          aktiviti_id: string
          catatan?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          aktiviti_id?: string
          catatan?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendaftaran_aktiviti_aktiviti_id_fkey"
            columns: ["aktiviti_id"]
            isOneToOne: false
            referencedRelation: "aktiviti"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          pilihan_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pilihan_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pilihan_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          pilihan: Json
          status: string
          tajuk: string
          tarikh_mula: string
          tarikh_tamat: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          pilihan?: Json
          status?: string
          tajuk: string
          tarikh_mula?: string
          tarikh_tamat: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          pilihan?: Json
          status?: string
          tajuk?: string
          tarikh_mula?: string
          tarikh_tamat?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nama_penuh: string
          no_ahli: number
          member_number: number
          no_rumah: string
          no_telefon: string | null
          status_ahli: Database["public"]["Enums"]["status_ahli"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nama_penuh: string
          no_ahli?: number
          no_rumah: string
          no_telefon?: string | null
          status_ahli?: Database["public"]["Enums"]["status_ahli"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nama_penuh?: string
          no_ahli?: number
          no_rumah?: string
          no_telefon?: string | null
          status_ahli?: Database["public"]["Enums"]["status_ahli"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      yuran_bulanan: {
        Row: {
          bulan: number
          created_at: string
          id: string
          jumlah: number
          rujukan_bayaran: string | null
          status: string
          tahun: number
          tarikh_bayar: string | null
          user_id: string
        }
        Insert: {
          bulan: number
          created_at?: string
          id?: string
          jumlah?: number
          rujukan_bayaran?: string | null
          status?: string
          tahun: number
          tarikh_bayar?: string | null
          user_id: string
        }
        Update: {
          bulan?: number
          created_at?: string
          id?: string
          jumlah?: number
          rujukan_bayaran?: string | null
          status?: string
          tahun?: number
          tarikh_bayar?: string | null
          user_id?: string
        }
        Relationships: []
      }
      yuran_keluar: {
        Row: {
          bukti_resit_url: string | null
          created_at: string
          created_by: string | null
          deskripsi: string | null
          id: string
          jumlah: number
          kategori: Database["public"]["Enums"]["kategori_belanja"]
          tajuk_belanja: string
          tarikh: string
        }
        Insert: {
          bukti_resit_url?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jumlah: number
          kategori: Database["public"]["Enums"]["kategori_belanja"]
          tajuk_belanja: string
          tarikh?: string
        }
        Update: {
          bukti_resit_url?: string | null
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          id?: string
          jumlah?: number
          kategori?: Database["public"]["Enums"]["kategori_belanja"]
          tajuk_belanja?: string
          tarikh?: string
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "pengerusi" | "naib_pengerusi" | "setiausaha" | "penolong_setiausaha" | "bendahari" | "ajk" | "ahli"
      kategori_belanja:
        | "penyelenggaraan"
        | "aktiviti"
        | "kebajikan"
        | "lain-lain"
      status_ahli: "pending" | "active" | "inactive"
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
      app_role: ["pengerusi", "naib_pengerusi", "setiausaha", "penolong_setiausaha", "bendahari", "ajk", "ahli"],
      kategori_belanja: [
        "penyelenggaraan",
        "aktiviti",
        "kebajikan",
        "lain-lain",
      ],
      status_ahli: ["pending", "active", "inactive"],
    },
  },
} as const
