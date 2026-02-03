// Supabase Database Types
// Auto-generated types should be placed here after running: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          last_active_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          last_active_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          last_active_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          organization_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organization_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          organization_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'admin' | 'coder' | 'reviewer' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'admin' | 'coder' | 'reviewer' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'admin' | 'coder' | 'reviewer' | 'viewer'
          joined_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          name: string
          content: string | null
          file_path: string | null
          file_type: string
          word_count: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          content?: string | null
          file_path?: string | null
          file_type: string
          word_count?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          content?: string | null
          file_path?: string | null
          file_type?: string
          word_count?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      codes: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          name: string
          description: string | null
          color: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          name: string
          description?: string | null
          color?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          parent_id?: string | null
          name?: string
          description?: string | null
          color?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      codings: {
        Row: {
          id: string
          document_id: string
          code_id: string
          start_offset: number
          end_offset: number
          selected_text: string
          memo: string | null
          coded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          code_id: string
          start_offset: number
          end_offset: number
          selected_text: string
          memo?: string | null
          coded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          code_id?: string
          start_offset?: number
          end_offset?: number
          selected_text?: string
          memo?: string | null
          coded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          project_id: string
          document_id: string | null
          coding_id: string | null
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          document_id?: string | null
          coding_id?: string | null
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          document_id?: string | null
          coding_id?: string | null
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'admin' | 'member'
          invited_by: string
          token: string
          status: 'pending' | 'accepted' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: 'admin' | 'member'
          invited_by: string
          token: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'admin' | 'member'
          invited_by?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      organization_role: 'owner' | 'admin' | 'member'
      project_role: 'admin' | 'coder' | 'reviewer' | 'viewer'
      invitation_status: 'pending' | 'accepted' | 'expired'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type Project = Tables<'projects'>
export type ProjectMember = Tables<'project_members'>
export type Document = Tables<'documents'>
export type Code = Tables<'codes'>
export type Coding = Tables<'codings'>
export type Comment = Tables<'comments'>
export type Invitation = Tables<'invitations'>
export type Profile = Tables<'profiles'>
