import { create } from 'zustand';
import { getMeeting, submitTranscript } from '../lib/supabase';

interface TranscriptState {
  currentMeeting: any | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  
  loadMeeting: (id: string) => Promise<void>;
  submitNewTranscript: (data: any) => Promise<void>;
  clearCurrentMeeting: () => void;
  clearError: () => void;
  clearSuccess: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  currentMeeting: null,
  loading: false,
  error: null,
  success: false,
  
  loadMeeting: async (id) => {
    set({ loading: true, error: null, currentMeeting: null });
    
    try {
      const data = await getMeeting(id);
      set({ currentMeeting: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to load meeting', 
        loading: false,
        currentMeeting: null
      });
    }
  },
  
  submitNewTranscript: async (data) => {
    set({ loading: true, error: null, success: false });
    
    try {
      await submitTranscript(data);
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to submit transcript', 
        loading: false,
        success: false
      });
    }
  },
  
  clearCurrentMeeting: () => {
    set({ currentMeeting: null, error: null });
  },

  clearError: () => {
    set({ error: null });
  },

  clearSuccess: () => {
    set({ success: false });
  }
}));