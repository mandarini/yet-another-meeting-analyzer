import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development, if env vars aren't set, return a mock client
const createMockClient = () => {
  console.warn('Using mock Supabase client. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for real data.');
  
  // Mock data that matches our schema
  const mockMeetings = [
    {
      id: '1',
      date: new Date().toISOString(),
      title: 'Mock Technical Review',
      company_id: '1',
      participants: ['John Doe', 'Jane Smith'],
      transcript_raw: 'Mock transcript',
      transcript_processed: {},
      created_by: '123',
      companies: {
        id: '1',
        name: 'Acme Inc.',
        domain: 'acme.com',
        nx_usage_level: 'evaluating'
      },
      pain_points: [
        {
          id: '1',
          description: 'Build times are slow',
          severity: 8
        }
      ],
      follow_ups: [
        {
          id: '1',
          description: 'Send documentation',
          deadline: new Date().toISOString(),
          status: 'pending'
        }
      ],
      nx_opportunities: [
        {
          id: '1',
          description: 'Implement caching',
          potential_value: 'high'
        }
      ]
    }
  ];

  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockMeetings[0], error: null }),
          order: () => ({
            limit: async () => ({ data: mockMeetings, error: null })
          }),
        }),
        order: () => ({
          limit: async () => ({ data: mockMeetings, error: null })
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: mockMeetings[0], error: null })
        })
      }),
      update: () => ({
        eq: async () => ({ error: null })
      })
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      signInWithOAuth: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null })
    }
  };
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createMockClient() as any;

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
        severity
      ),
      follow_ups (
        id,
        description,
        deadline,
        status
      ),
      nx_opportunities (
        id,
        description,
        potential_value
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
        severity
      ),
      follow_ups (
        id,
        description,
        deadline,
        status
      ),
      nx_opportunities (
        id,
        description,
        potential_value
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
  // First check if the company exists
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', transcriptData.companyId)
    .single();

  if (!company) {
    console.error('Company not found');
    return null;
  }

  // Then insert the meeting
  const { data, error } = await supabase
    .from('meetings')
    .insert([{
      date: transcriptData.date,
      title: transcriptData.title,
      company_id: transcriptData.companyId,
      participants: transcriptData.participants,
      transcript_raw: transcriptData.transcriptText,
      transcript_processed: {}, // This would be filled by the Edge Function
      created_by: transcriptData.userId
    }])
    .select(`
      id,
      date,
      title,
      company_id,
      participants,
      transcript_raw,
      transcript_processed,
      created_by
    `)
    .single();

  if (error) {
    console.error('Error submitting transcript:', error);
    return null;
  }

  return data;
};