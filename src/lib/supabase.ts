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

export const getCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      meetings (
        id,
        date,
        title
      )
    `)
    .order('name');

  if (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }

  // Process the data to include last meeting date
  return data.map(company => ({
    ...company,
    last_meeting_date: company.meetings?.length > 0 
      ? company.meetings.reduce((latest: string, meeting: any) => {
          return !latest || new Date(meeting.date) > new Date(latest) 
            ? meeting.date 
            : latest;
        }, '')
      : null
  }));
};

export const getCompany = async (id: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      meetings (
        id,
        date,
        title,
        transcript_processed,
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
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    throw error;
  }

  return data;
};

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
  pain_points: Array<{
    id: string;
    description: string;
    urgency_score: number;
    category: string;
    status: string;
  }>;
  follow_ups: Array<{
    id: string;
    description: string;
    deadline: string;
    status: string;
    assigned_to: string;
  }>;
  nx_opportunities: Array<{
    id: string;
    nx_feature: string;
    confidence_score: number;
    suggested_approach: string;
  }>;
}

export const getMeetings = async (limit = 10): Promise<Meeting[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
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
        category,
        status
      ),
      follow_ups (
        id,
        description,
        deadline,
        status,
        assigned_to
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

  // Filter follow-ups to only show those assigned to the current user
  return data.map(meeting => ({
    ...meeting,
    follow_ups: meeting.follow_ups?.filter(fu => fu.assigned_to === user?.id) || []
  })) as Meeting[];
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
        nx_usage_level,
        nx_version,
        nx_cloud_usage,
        nx_cloud_why_not,
        years_using_nx,
        workspace_size,
        ci_provider,
        technologies_used
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
    .eq('assigned_to', user.id)
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