import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const getMeetings = async (limit = 10) => {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      id,
      date,
      title,
      company_id,
      participants,
      transcript_raw,
      transcript_processed,
      created_by,
      companies (
        id,
        name
      ),
      pain_points (
        id,
        description,
        urgency_score,
        category
      ),
      follow_ups (
        id,
        description,
        deadline,
        status
      ),
      nx_opportunities (
        id,
        nx_feature,
        confidence_score,
        suggested_approach
      )
    `)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }

  return data;
};

export const getMeeting = async (id: string) => {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      id,
      date,
      title,
      company_id,
      participants,
      transcript_raw,
      transcript_processed,
      created_by,
      companies (
        id,
        name,
        domain,
        nx_usage_level
      ),
      pain_points (
        id,
        description,
        urgency_score,
        category
      ),
      follow_ups (
        id,
        description,
        deadline,
        status
      ),
      nx_opportunities (
        id,
        nx_feature,
        confidence_score,
        suggested_approach
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching meeting:', error);
    return null;
  }

  return data;
};

export const getFollowUps = async (status = 'pending') => {
  const { data, error } = await supabase
    .from('follow_ups')
    .select(`
      id,
      description,
      deadline,
      status,
      meeting_id,
      meetings (
        id,
        title,
        date,
        company_id,
        companies (
          id,
          name
        )
      )
    `)
    .eq('status', status)
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching follow-ups:', error);
    return [];
  }

  return data;
};

export const updateFollowUpStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('follow_ups')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating follow-up status:', error);
    return false;
  }

  return true;
};

export const submitTranscript = async (transcriptData: any) => {
  try {
    // Call the analyze-transcript Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/analyze-transcript`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          transcript: transcriptData.transcriptText,
          meetingDate: transcriptData.date,
          meetingTitle: transcriptData.title,
          meetingPurpose: transcriptData.purpose,
          companyName: transcriptData.companyName,
          userId: transcriptData.userId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze transcript');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process transcript');
    }

    return result.data;
  } catch (error: any) {
    console.error('Error submitting transcript:', error);
    throw error;
  }
};