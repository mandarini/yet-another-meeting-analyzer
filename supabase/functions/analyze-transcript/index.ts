import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { v4 as uuidv4 } from 'npm:uuid@9.0.1';
import OpenAI from 'npm:openai@4.28.0';

interface TranscriptInput {
  transcript: string;
  meetingDate: string;
  meetingTitle?: string;
  meetingPurpose?: string;
  userId: string;
  companyName: string;
}

interface AnalysisResults {
  topics: string[];
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
  participants: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function processTranscript(transcript: string): Promise<AnalysisResults> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing meeting transcripts and extracting structured information. Focus on identifying:
          1. Main discussion topics
          2. Participant names and roles from the conversation context
          3. Technical pain points with urgency scoring
          4. Follow-up commitments with deadlines
          5. Nx-specific opportunities
          
          Format the output as a structured JSON object with the following structure:
          {
            "topics": string[],
            "painPoints": Array<{
              "description": string,
              "urgencyScore": number,
              "category": string,
              "relatedNxFeatures"?: string[]
            }>,
            "followUps": Array<{
              "description": string,
              "deadline": string,
              "assignedTo"?: string
            }>,
            "nxOpportunities": Array<{
              "feature": string,
              "confidenceScore": number,
              "suggestedApproach": string
            }>,
            "executiveSummary": string,
            "participants": string[]
          }

          For participants, extract them from the conversation flow and context.
          For topics, identify 3-5 main themes discussed in the meeting.
          Ensure all arrays are initialized even if empty.`
      },
      {
        role: 'user',
        content: transcript
      }
    ],
    temperature: 0.2,
  });

  const results = JSON.parse(response.choices[0].message.content);
  
  // Ensure all required arrays exist
  return {
    topics: results.topics || [],
    painPoints: results.painPoints || [],
    followUps: results.followUps || [],
    nxOpportunities: results.nxOpportunities || [],
    recurringIssues: results.recurringIssues || [],
    executiveSummary: results.executiveSummary || '',
    participants: results.participants || []
  };
}

async function generateEmbeddings(painPoints: AnalysisResults['painPoints']) {
  if (!Array.isArray(painPoints) || painPoints.length === 0) {
    return [];
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  return Promise.all(
    painPoints.map(async (point) => {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: point.description,
        });
        return response.data[0].embedding;
      } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
      }
    })
  );
}

async function findSimilarPainPoints(
  supabase: any,
  companyId: string,
  embedding: number[] | null,
  threshold = 0.85
) {
  if (!embedding || !companyId) return [];

  try {
    const { data, error } = await supabase.rpc('match_pain_points', {
      _company_id: companyId,
      _query_embedding: embedding,
      _similarity_threshold: threshold,
    });

    if (error) {
      console.error('Error in match_pain_points:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error finding similar pain points:', error);
    return [];
  }
}

Deno.serve(async (req) => {
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
    const { transcript, meetingDate, meetingTitle, meetingPurpose, userId, companyName } = input;

    if (!transcript || !meetingDate || !userId || !companyName) {
      throw new Error('Missing required fields');
    }

    // Process transcript first to get analysis results
    const analysisResults = await processTranscript(transcript);

    // Create or get company first to ensure we have the company ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({ name: companyName })
      .select()
      .single();

    if (companyError || !company) {
      throw new Error('Failed to create/get company');
    }

    // Create meeting record
    const meetingId = uuidv4();
    const { error: meetingError } = await supabase
      .from('meetings')
      .insert({
        id: meetingId,
        date: meetingDate,
        title: meetingTitle || `Meeting with ${companyName}`,
        company_id: company.id,
        participants: analysisResults.participants,
        transcript_raw: transcript,
        transcript_processed: {
          topics: analysisResults.topics,
          summary: analysisResults.executiveSummary,
        },
        created_by: userId,
      });

    if (meetingError) throw meetingError;

    // Generate embeddings for pain points
    const embeddings = await generateEmbeddings(analysisResults.painPoints);

    // Store pain points and process recurring issues
    const painPointPromises = analysisResults.painPoints.map(async (point, index) => {
      try {
        // Insert pain point first
        const { data: painPoint, error: painPointError } = await supabase
          .from('pain_points')
          .insert({
            meeting_id: meetingId,
            description: point.description,
            urgency_score: point.urgencyScore,
            category: point.category,
            related_nx_features: point.relatedNxFeatures,
            embedding: embeddings[index],
          })
          .select()
          .single();

        if (painPointError) throw painPointError;

        // Only check for similar points if we have both the embedding and company ID
        if (painPoint && embeddings[index] && company.id) {
          const similarPoints = await findSimilarPainPoints(
            supabase,
            company.id,
            embeddings[index]
          );

          if (similarPoints && similarPoints.length > 0) {
            // Create or update recurring issue
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
      } catch (error) {
        console.error('Error processing pain point:', error);
        return null;
      }
    });

    // Store follow-ups
    const followUpPromises = analysisResults.followUps.map((followUp) =>
      supabase.from('follow_ups').insert({
        meeting_id: meetingId,
        description: followUp.description,
        deadline: followUp.deadline,
        assigned_to: userId, // Assign to the meeting creator by default
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
        data: {
          meetingId,
          companyId: company.id,
          companyName,
          analysisResults,
        }
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