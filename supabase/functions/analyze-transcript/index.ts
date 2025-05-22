import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';

interface TranscriptInput {
  transcript: string;
  meetingDate: string;
  meetingTitle?: string;
  meetingPurpose?: string;
  userId: string;
}

interface AnalysisResults {
  metadata: {
    companyName: string;
    companyDomain?: string;
    participantNames: string[];
    detectedTopics: string[];
  };
  painPoints: Array<{
    description: string;
    urgencyScore: number;
    category: string;
    relatedNxFeatures?: string[];
  }>;
  followUps: Array<{
    description: string;
    deadline: string;
    assignedTo?: string;
  }>;
  nxOpportunities: Array<{
    feature: string;
    confidenceScore: number;
    suggestedApproach: string;
    relatedPainPointIds?: string[];
  }>;
  recurringIssues: Array<{
    description: string;
    occurrences: number;
    firstSeen: string;
    lastSeen: string;
    priority: number;
  }>;
  executiveSummary: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function processTranscript(transcript: string): Promise<AnalysisResults> {
  // Initialize OpenAI client
  const openai = new Supabase.ai.Session('gpt-4');

  // Process transcript with OpenAI
  const response = await openai.run(transcript, {
    system_prompt: `You are an expert at analyzing meeting transcripts and extracting structured information. Focus on identifying:
      1. Company and participant information
      2. Technical pain points with urgency scoring
      3. Follow-up commitments with deadlines
      4. Nx-specific opportunities
      
      Format the output as a structured JSON object matching the AnalysisResults interface.`,
    temperature: 0.2,
    max_tokens: 2000,
  });

  // Parse and validate the response
  const results = JSON.parse(response) as AnalysisResults;
  return results;
}

async function generateEmbeddings(painPoints: AnalysisResults['painPoints']) {
  const embeddings = new Supabase.ai.Session('text-embedding-ada-002');
  
  return Promise.all(
    painPoints.map(async (point) => {
      const embedding = await embeddings.run(point.description, {
        mean_pool: true,
        normalize: true,
      });
      return embedding;
    })
  );
}

async function findSimilarPainPoints(
  supabase: any,
  companyId: string,
  embedding: number[],
  threshold = 0.85
) {
  const { data, error } = await supabase.rpc('match_pain_points', {
    query_embedding: embedding,
    similarity_threshold: threshold,
    company_id: companyId,
  });

  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const input: TranscriptInput = await req.json();
    const { transcript, meetingDate, meetingTitle, meetingPurpose, userId } = input;

    // Process transcript
    const analysisResults = await processTranscript(transcript);

    // Generate embeddings for pain points
    const embeddings = await generateEmbeddings(analysisResults.painPoints);

    // Start a database transaction
    const { data: company } = await supabase
      .from('companies')
      .upsert({
        name: analysisResults.metadata.companyName,
        domain: analysisResults.metadata.companyDomain,
      })
      .select()
      .single();

    if (!company) throw new Error('Failed to create/update company');

    // Create meeting record
    const meetingId = uuidv4();
    const { error: meetingError } = await supabase
      .from('meetings')
      .insert({
        id: meetingId,
        date: meetingDate,
        title: meetingTitle || `Meeting with ${analysisResults.metadata.companyName}`,
        company_id: company.id,
        participants: analysisResults.metadata.participantNames,
        transcript_processed: {
          topics: analysisResults.metadata.detectedTopics,
          summary: analysisResults.executiveSummary,
        },
        created_by: userId,
      });

    if (meetingError) throw meetingError;

    // Store pain points with embeddings
    const painPointPromises = analysisResults.painPoints.map(async (point, index) => {
      const { data: painPoint } = await supabase
        .from('pain_points')
        .insert({
          meeting_id: meetingId,
          description: point.description,
          urgency_score: point.urgencyScore,
          category: point.category,
          related_nx_features: point.relatedNxFeatures,
        })
        .select()
        .single();

      if (painPoint) {
        // Find similar pain points
        const similarPoints = await findSimilarPainPoints(
          supabase,
          company.id,
          embeddings[index]
        );

        if (similarPoints.length > 0) {
          // Update or create recurring issue
          await supabase.from('recurring_issues').upsert({
            company_id: company.id,
            description: point.description,
            occurrences: similarPoints.map((sp: any) => ({
              date: sp.created_at,
              meeting_id: sp.meeting_id,
            })),
            priority: point.urgencyScore * similarPoints.length,
          });
        }
      }

      return painPoint;
    });

    // Store follow-ups
    const followUpPromises = analysisResults.followUps.map((followUp) =>
      supabase.from('follow_ups').insert({
        meeting_id: meetingId,
        description: followUp.description,
        deadline: followUp.deadline,
        assigned_to: followUp.assignedTo,
      })
    );

    // Store Nx opportunities
    const opportunityPromises = analysisResults.nxOpportunities.map((opportunity) =>
      supabase.from('nx_opportunities').insert({
        meeting_id: meetingId,
        nx_feature: opportunity.feature,
        confidence_score: opportunity.confidenceScore,
        suggested_approach: opportunity.suggestedApproach,
      })
    );

    // Wait for all database operations to complete
    await Promise.all([
      ...painPointPromises,
      ...followUpPromises,
      ...opportunityPromises,
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        companyName: company.name,
        analysisResults,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error processing transcript:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});