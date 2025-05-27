import { create } from 'zustand';
import { getCompanies, getCompany } from '../lib/supabase';

interface PainPoint {
  id: string;
  description: string;
  urgency_score: number;
  category: string;
  is_main_pain: boolean;
  status: string;
}

interface Meeting {
  id: string;
  date: string;
  title: string;
  company_id: string;
  participants: string[];
  transcript_raw: string;
  transcript_processed: {
    mainPain?: string;
    whyNow?: string;
    callObjective?: string;
    problematicTasks?: string[];
    currentBenefits?: string[];
    favoriteFeatures?: string[];
    featureRequests?: {
      nx: string[];
      nxCloud: string[];
    };
    summary?: string;
  } | null;
  created_by: string;
  companies: {
    id: string;
    name: string;
  };
  pain_points: PainPoint[];
  follow_ups: Array<{
    id: string;
    description: string;
    deadline: string;
    status: string;
  }>;
  nx_opportunities: Array<{
    id: string;
    nx_feature: string;
    confidence_score: number;
    suggested_approach: string;
  }>;
}

interface Company {
  id: string;
  name: string;
  nx_version: string;
  nx_cloud_usage: 'yes' | 'no' | 'considering' | 'unknown';
  ci_provider: string;
  satisfaction_nx: number;
  technologies_used: string[];
  last_meeting_date: string;
  meetings: Meeting[];
  latest_meeting: Meeting | null;
}

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
  
  loadCompanies: () => Promise<void>;
  loadCompany: (id: string) => Promise<void>;
  clearCurrentCompany: () => void;
  clearError: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
  
  loadCompanies: async () => {
    set({ loading: true, error: null });
    
    try {
      const data = await getCompanies();
      set({ companies: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to load companies', 
        loading: false 
      });
    }
  },
  
  loadCompany: async (id) => {
    set({ loading: true, error: null, currentCompany: null });
    
    try {
      const data = await getCompany(id);
      set({ currentCompany: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to load company', 
        loading: false,
        currentCompany: null
      });
    }
  },
  
  clearCurrentCompany: () => {
    set({ currentCompany: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  }
}));