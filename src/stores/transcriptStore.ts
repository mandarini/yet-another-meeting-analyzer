import { create } from 'zustand';
import { getMeeting, submitTranscript } from '../lib/supabase';

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
}

interface TranscriptState {
  currentMeeting: Meeting | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  
  loadMeeting: (id: string) => Promise<void>;
  submitNewTranscript: (data: any) => Promise<{ meetingId: string }>;
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
    set({ loading: true, error: null });
    
    try {
      const data = await getMeeting(id);
      if (!data) {
        throw new Error('Meeting not found');
      }
      set({ currentMeeting: data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load meeting', 
        loading: false,
        currentMeeting: null
      });
      throw error;
    }
  },
  
  submitNewTranscript: async (data) => {
    set({ loading: true, error: null, success: false });
    
    try {
      const result = await submitTranscript(data);
      set({ success: true, loading: false });
      return result;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to submit transcript', 
        loading: false,
        success: false
      });
      throw error;
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