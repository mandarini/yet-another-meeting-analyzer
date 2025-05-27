import { create } from 'zustand';
import { getCompanies, getCompany } from '../lib/supabase';

interface CompanyState {
  companies: any[];
  currentCompany: any | null;
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