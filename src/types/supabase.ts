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
      companies: {
        Row: {
          id: string
          name: string
          domain: string
          nx_usage_level: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          nx_usage_level: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          nx_usage_level?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          id: string
          meeting_id: string
          description: string
          deadline: string
          status: string
          assigned_to: string
        }
        Insert: {
          id?: string
          meeting_id: string
          description: string
          deadline: string
          status: string
          assigned_to: string
        }
        Update: {
          id?: string
          meeting_id?: string
          description?: string
          deadline?: string
          status?: string
          assigned_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      meetings: {
        Row: {
          id: string
          date: string
          title: string
          company_id: string
          participants: string[]
          transcript_raw: string
          transcript_processed: Json
          created_by: string
        }
        Insert: {
          id?: string
          date: string
          title: string
          company_id: string
          participants: string[]
          transcript_raw: string
          transcript_processed?: Json
          created_by: string
        }
        Update: {
          id?: string
          date?: string
          title?: string
          company_id?: string
          participants?: string[]
          transcript_raw?: string
          transcript_processed?: Json
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      nx_opportunities: {
        Row: {
          id: string
          meeting_id: string
          pain_point_id: string
          nx_feature: string
          confidence_score: number
          suggested_approach: string
        }
        Insert: {
          id?: string
          meeting_id: string
          pain_point_id: string
          nx_feature: string
          confidence_score: number
          suggested_approach: string
        }
        Update: {
          id?: string
          meeting_id?: string
          pain_point_id?: string
          nx_feature?: string
          confidence_score?: number
          suggested_approach?: string
        }
        Relationships: [
          {
            foreignKeyName: "nx_opportunities_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nx_opportunities_pain_point_id_fkey"
            columns: ["pain_point_id"]
            referencedRelation: "pain_points"
            referencedColumns: ["id"]
          }
        ]
      }
      pain_points: {
        Row: {
          id: string
          meeting_id: string
          description: string
          urgency_score: number
          category: string
          related_nx_features: string[]
          status: string
        }
        Insert: {
          id?: string
          meeting_id: string
          description: string
          urgency_score: number
          category: string
          related_nx_features: string[]
          status: string
        }
        Update: {
          id?: string
          meeting_id?: string
          description?: string
          urgency_score?: number
          category?: string
          related_nx_features?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_meeting_id_fkey"
            columns: ["meeting_id"]
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recurring_issues: {
        Row: {
          id: string
          company_id: string
          description: string
          occurrences: Json
          status: string
          priority: number
        }
        Insert: {
          id?: string
          company_id: string
          description: string
          occurrences: Json
          status: string
          priority: number
        }
        Update: {
          id?: string
          company_id?: string
          description?: string
          occurrences?: Json
          status?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_issues_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
  }
}