import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

interface TranscriptInput {
  transcript: string;
  meetingDate: string;
  meetingTitle?: string;
  meetingPurpose?: string;
  userId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transcript, meetingDate, meetingTitle, meetingPurpose, userId }: TranscriptInput = await req.json();

    // Process transcript with OpenAI
    const analysisResults = await processTranscript(transcript);

    // Store results in database
    const { data, error } = await storeAnalysisResults(
      supabaseClient,
      analysisResults,
      { meetingDate, meetingTitle, meetingPurpose, userId }
    );

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});

async function processTranscript(transcript: string) {
  // This would be implemented with OpenAI API
  // For now, return mock data
  return {
    metadata: {
      companyName: 'Acme Inc.',
      companyDomain: 'acme.com',
      participantNames: ['John Doe', 'Jane Smith'],
      detectedTopics: ['Build Performance', 'Developer Experience'],
    },
    painPoints: [
      {
        description: 'Build times are too slow',
        urgencyScore: 8,
        category: 'build_performance',
        relatedNxFeatures: ['computation-caching', 'distributed-tasks'],
      }
    ],
    followUps: [
      {
        description: 'Send documentation on Nx caching',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: null,
      }
    ],
    nxOpportunities: [
      {
        nxFeature: 'Computation Caching',
        confidenceScore: 0.9,
        suggestedApproach: 'Implement Nx caching to reduce build times',
      }
    ],
    executiveSummary: 'Meeting focused on build performance challenges...',
  };
}

async function storeAnalysisResults(supabase: any, results: any, metadata: any) {
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .insert({
      date: metadata.meetingDate,
      title: metadata.meetingTitle,
      participants: results.metadata.participantNames,
      transcript_processed: results,
      created_by: metadata.userId,
    })
    .select()
    .single();

  if (meetingError) {
    throw meetingError;
  }

  // Store pain points
  await supabase.from('pain_points').insert(
    results.painPoints.map((point: any) => ({
      meeting_id: meeting.id,
      description: point.description,
      urgency_score: point.urgencyScore,
      category: point.category,
      related_nx_features: point.relatedNxFeatures,
    }))
  );

  // Store follow-ups
  await supabase.from('follow_ups').insert(
    results.followUps.map((item: any) => ({
      meeting_id: meeting.id,
      description: item.description,
      deadline: item.deadline,
      assigned_to: item.assignedTo,
    }))
  );

  // Store Nx opportunities
  await supabase.from('nx_opportunities').insert(
    results.nxOpportunities.map((opp: any) => ({
      meeting_id: meeting.id,
      nx_feature: opp.nxFeature,
      confidence_score: opp.confidenceScore,
      suggested_approach: opp.suggestedApproach,
    }))
  );

  return { data: meeting, error: null };
}