import { create } from 'zustand';
import { submitTranscript, getMeeting } from '../lib/supabase';

interface TranscriptState {
  currentMeeting: any | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  
  submitNewTranscript: (transcriptData: any) => Promise<any>;
  loadMeeting: (id: string) => Promise<any>;
  clearCurrentMeeting: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  currentMeeting: null,
  loading: false,
  error: null,
  success: false,
  
  submitNewTranscript: async (transcriptData) => {
    set({ loading: true, error: null, success: false });
    
    try {
      const result = await submitTranscript(transcriptData);
      
      if (!result) {
        set({ 
          error: 'Failed to submit transcript', 
          loading: false, 
          success: false 
        });
        return null;
      }
      
      set({ 
        currentMeeting: result, 
        loading: false, 
        success: true 
      });
      
      return result;
    } catch (error: any) {
      set({ 
        error: error?.message || 'An error occurred while submitting the transcript', 
        loading: false, 
        success: false 
      });
      return null;
    }
  },
  
  loadMeeting: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const meeting = await getMeeting(id);
      
      if (!meeting) {
        set({ 
          error: 'Failed to load meeting data', 
          loading: false 
        });
        return null;
      }
      
      set({ 
        currentMeeting: meeting, 
        loading: false 
      });
      
      return meeting;
    } catch (error: any) {
      set({ 
        error: error?.message || 'An error occurred while loading the meeting', 
        loading: false 
      });
      return null;
    }
  },
  
  clearCurrentMeeting: () => {
    set({ 
      currentMeeting: null,
      success: false,
      error: null
    });
  }
}));