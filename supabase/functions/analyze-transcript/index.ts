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

interface NxAnalysisResults {
  // Primary Nx Information
  mainPain: string;
  whyNow: string;
  callObjective: string;
  ciProvider: string;
  problematicTasks: string[];
  technologiesUsed: string[];
  nxVersion: string;
  nxCloudUsage: {
    status: 'yes' | 'no' | 'considering' | 'unknown';
    whyNot?: string;
  };
  
  // Secondary Information
  yearsUsingNx: string;
  workspaceSize: string;
  nxAdoptionApproach: 'started_with_nx' | 'added_to_existing' | 'unknown';
  satisfaction: {
    nx: number;
    nxCloud: number;
  };
  featureRequests: {
    nx: string[];
    nxCloud: string[];
  };
  currentBenefits: string[];
  favoriteFeatures: string[];
  advancedFeatureUsage: {
    agents: 'yes' | 'no' | 'unknown';
    mfe: 'yes' | 'no' | 'unknown';
    crystalInferredTasks: 'yes' | 'no' | 'unknown';
    atomizer: 'yes' | 'no' | 'unknown';
  };
  
  // Traditional fields
  participants: string[];
  followUps: Array<{
    description: string;
    deadline: string;
    assignedTo?: string;
  }>;
  executiveSummary: string;
  
  // Additional pain points beyond main pain
  additionalPainPoints: Array<{
    description: string;
    urgencyScore: number;
    category: string;
  }>;

  // Nx Opportunities
  nxOpportunities: Array<{
    nx_feature: string;
    confidence_score: number;
    suggested_approach: string;
  }>;
  
  // Global analysis results
  globalInsights: {
    similarPainPointsAcrossCustomers: Array<{
      description: string;
      companyName: string;
      meetingDate: string;
      similarity: number;
    }>;
    industryTrends: Array<{
      trend: string;
      frequency: number;
      companies: string[];
    }>;
    commonFeatureRequests: Array<{
      feature: string;
      requestCount: number;
      companies: string[];
    }>;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function processNxTranscript(transcript: string, purpose?: string): Promise<NxAnalysisResults> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('Missing OpenAI API key');
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
    timeout: 300000,
    maxRetries: 5,
  });

  const systemPrompt = `You are an expert at analyzing Nx sales calls and customer conversations. Your task is to extract specific Nx-related information that helps with sales qualification and customer success.

CRITICAL: You are looking for SPECIFIC ANSWERS to these common Nx sales questions:

PRIMARY INFORMATION (most important):
1. What is their MAIN PAIN POINT? (the primary problem they're trying to solve)
2. WHY NOW? (what triggered their outreach - urgency, timeline, event)
3. CALL OBJECTIVE - what do they want to achieve from this conversation?
4. CI PROVIDER - GitHub Actions, Jenkins, CircleCI, Azure DevOps, etc. (set to "unknown" if not mentioned)
5. PROBLEMATIC CI TASKS - which specific tasks are slow/causing issues (builds, tests, linting, etc.)
6. TECHNOLOGIES USED - React, Angular, Node.js, Python, etc.
7. NX VERSION - what version are they currently on (set to "unknown" if not mentioned)
8. NX CLOUD USAGE - are they using it? considering it? why not if they aren't?

SECONDARY INFORMATION:
- Years using Nx
- Workspace size (number of projects/apps)
- How they adopted Nx (started new project vs added to existing)
- SATISFACTION SCORES (CRITICAL):
  * Look for explicit statements about satisfaction with Nx and Nx Cloud
  * Examples of satisfaction statements:
    - "We're very happy with Nx, I'd give it a 9/10"
    - "Nx Cloud has been great, probably an 8 out of 10"
    - "We're somewhat satisfied with Nx, maybe a 6/10"
    - "Nx Cloud is okay, I'd rate it a 5"
  * If no explicit score is mentioned, infer from context:
    - Very positive feedback = 8-10
    - Somewhat positive = 6-7
    - Neutral = 5
    - Somewhat negative = 3-4
    - Very negative = 1-2
  * If no satisfaction mentioned at all, use 5 (neutral) instead of 0
- Feature requests for Nx or Nx Cloud
- Current benefits they're seeing
- Favorite Nx features
- Advanced feature usage (Agents, MFE, Crystal/Inferred tasks, Atomizer)

NX OPPORTUNITIES (CRITICAL):
- Identify potential Nx features or solutions that could help with their pain points
- For each opportunity:
  * The specific Nx feature that could help
  * A confidence score (0-1) based on how well it matches their needs
  * A suggested approach for implementing the solution
- Examples:
  * If they mention slow builds: "Nx Cloud" with high confidence
  * If they mention complex monorepo: "Nx Agents" with medium confidence
  * If they mention micro-frontends: "Nx MFE" with high confidence
- Only include opportunities with confidence score > 0.5

FOLLOW-UPS (CRITICAL):
- Extract ALL action items and follow-ups mentioned in the conversation
- Each follow-up MUST have:
  * A clear description of what needs to be done
  * A specific deadline (use "ASAP" if no specific date mentioned)
  * Who it's assigned to (use "sales_rep" if not specified)
- Examples of follow-ups:
  * "Schedule a demo of Nx Cloud features" (deadline: "ASAP", assignedTo: "sales_rep")
  * "Send pricing information for enterprise plan" (deadline: "2024-06-01", assignedTo: "sales_rep")
  * "Follow up on migration plan" (deadline: "2024-05-30", assignedTo: "sales_rep")
- If no follow-ups are mentioned, include at least one default follow-up:
  * "Schedule next check-in call" (deadline: "ASAP", assignedTo: "sales_rep")

FORMAT RULES:
- If information is not mentioned, set to "unknown" or empty array
- For satisfaction scores, use 0 if not mentioned
- Be specific about CI providers and technologies
- Extract exact version numbers when mentioned
- Capture the WHY behind their responses (especially for "why now" and "why not Nx Cloud")

Return a JSON object with this exact structure:
{
  "mainPain": string,
  "whyNow": string,
  "callObjective": string,
  "ciProvider": string,
  "problematicTasks": string[],
  "technologiesUsed": string[],
  "nxVersion": string,
  "nxCloudUsage": {
    "status": "yes" | "no" | "considering" | "unknown",
    "whyNot": string // only if status is "no"
  },
  "yearsUsingNx": string,
  "workspaceSize": string,
  "nxAdoptionApproach": "started_with_nx" | "added_to_existing" | "unknown",
  "satisfaction": {
    "nx": number,
    "nxCloud": number
  },
  "featureRequests": {
    "nx": string[],
    "nxCloud": string[]
  },
  "currentBenefits": string[],
  "favoriteFeatures": string[],
  "advancedFeatureUsage": {
    "agents": "yes" | "no" | "unknown",
    "mfe": "yes" | "no" | "unknown",
    "crystalInferredTasks": "yes" | "no" | "unknown",
    "atomizer": "yes" | "no" | "unknown"
  },
  "participants": string[],
  "followUps": [{
    "description": string,
    "deadline": string,
    "assignedTo": string
  }],
  "executiveSummary": string,
  "additionalPainPoints": [{
    "description": string,
    "urgencyScore": number,
    "category": string
  }],
  "nxOpportunities": [{
    "nx_feature": string,
    "confidence_score": number,
    "suggested_approach": string
  }]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Meeting Purpose: ${purpose || 'Nx Sales Call'}\n\nTranscript:\n${transcript}`
      }
    ],
    temperature: 0.1,
  });

  let results;
  try {
    const content = response.choices[0].message.content;
    // First, try to clean the response by removing any potential control characters
    const cleanedContent = content.replace(/[^\x20-\x7E]/g, '');
    
    // Try to parse the JSON, if it fails, try to fix common truncation issues
    try {
      results = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Initial parse error:', parseError);
      console.error('Raw content:', cleanedContent);
      
      // If the content ends with an incomplete object/array, try to complete it
      const fixedContent = cleanedContent
        .replace(/,\s*$/, '') // Remove trailing comma
        .replace(/,\s*([}\]])/g, '$1') // Remove comma before closing bracket/brace
        .replace(/([{[])\s*$/, '$1}') // Add closing brace if missing
        .replace(/}\s*$/, '}') // Ensure single closing brace
        .replace(/]\s*$/, ']') // Ensure single closing bracket
        .replace(/(["\w\s]+):\s*$/, '$1: "unknown"}') // Handle truncated property values
        .replace(/(["\w\s]+):\s*"([^"]*)$/, '$1: "$2"}') // Handle truncated string values
        .replace(/(["\w\s]+):\s*(\d+)$/, '$1: $2}') // Handle truncated number values
        .replace(/(["\w\s]+):\s*\[([^\]]*)$/, '$1: [$2]}') // Handle truncated arrays
        .replace(/(["\w\s]+):\s*{([^}]*)$/, '$1: {$2}}'); // Handle truncated objects
      
      try {
        results = JSON.parse(fixedContent);
      } catch (finalError) {
        console.error('Failed to parse even after fixing:', finalError);
        console.error('Fixed content:', fixedContent);
        throw new Error('Failed to parse GPT response even after attempting to fix truncation.');
      }
    }

    // Validate and ensure required structure with more detailed logging
    console.log('Parsed results:', JSON.stringify(results, null, 2));
    
    // Ensure all required fields are present with proper types
    const validatedResults = {
      mainPain: typeof results.mainPain === 'string' ? results.mainPain : 'unknown',
      whyNow: typeof results.whyNow === 'string' ? results.whyNow : 'unknown',
      callObjective: typeof results.callObjective === 'string' ? results.callObjective : 'unknown',
      ciProvider: typeof results.ciProvider === 'string' ? results.ciProvider : 'unknown',
      problematicTasks: Array.isArray(results.problematicTasks) ? results.problematicTasks : [],
      technologiesUsed: Array.isArray(results.technologiesUsed) ? results.technologiesUsed : [],
      nxVersion: typeof results.nxVersion === 'string' ? results.nxVersion : 'unknown',
      nxCloudUsage: {
        status: ['yes', 'no', 'considering', 'unknown'].includes(results.nxCloudUsage?.status) 
          ? results.nxCloudUsage.status 
          : 'unknown',
        whyNot: results.nxCloudUsage?.status === 'no' ? (results.nxCloudUsage.whyNot || 'unknown') : undefined
      },
      yearsUsingNx: typeof results.yearsUsingNx === 'string' ? results.yearsUsingNx : 'unknown',
      workspaceSize: typeof results.workspaceSize === 'string' ? results.workspaceSize : 'unknown',
      nxAdoptionApproach: ['started_with_nx', 'added_to_existing', 'unknown'].includes(results.nxAdoptionApproach)
        ? results.nxAdoptionApproach
        : 'unknown',
      satisfaction: {
        nx: typeof results.satisfaction?.nx === 'number' ? results.satisfaction.nx : 5,
        nxCloud: typeof results.satisfaction?.nxCloud === 'number' ? results.satisfaction.nxCloud : 5
      },
      featureRequests: {
        nx: Array.isArray(results.featureRequests?.nx) ? results.featureRequests.nx : [],
        nxCloud: Array.isArray(results.featureRequests?.nxCloud) ? results.featureRequests.nxCloud : []
      },
      currentBenefits: Array.isArray(results.currentBenefits) ? results.currentBenefits : [],
      favoriteFeatures: Array.isArray(results.favoriteFeatures) ? results.favoriteFeatures : [],
      advancedFeatureUsage: {
        agents: ['yes', 'no', 'unknown'].includes(results.advancedFeatureUsage?.agents) 
          ? results.advancedFeatureUsage.agents 
          : 'unknown',
        mfe: ['yes', 'no', 'unknown'].includes(results.advancedFeatureUsage?.mfe)
          ? results.advancedFeatureUsage.mfe
          : 'unknown',
        crystalInferredTasks: ['yes', 'no', 'unknown'].includes(results.advancedFeatureUsage?.crystalInferredTasks)
          ? results.advancedFeatureUsage.crystalInferredTasks
          : 'unknown',
        atomizer: ['yes', 'no', 'unknown'].includes(results.advancedFeatureUsage?.atomizer)
          ? results.advancedFeatureUsage.atomizer
          : 'unknown'
      },
      participants: Array.isArray(results.participants) ? results.participants : [],
      followUps: Array.isArray(results.followUps) ? results.followUps.map(followUp => ({
        description: typeof followUp.description === 'string' ? followUp.description : 'Unknown follow-up',
        deadline: typeof followUp.deadline === 'string' ? followUp.deadline : 'ASAP',
        assignedTo: typeof followUp.assignedTo === 'string' ? followUp.assignedTo : 'sales_rep'
      })) : [{
        description: 'Schedule next check-in call',
        deadline: 'ASAP',
        assignedTo: 'sales_rep'
      }],
      executiveSummary: typeof results.executiveSummary === 'string' ? results.executiveSummary : '',
      additionalPainPoints: Array.isArray(results.additionalPainPoints) 
        ? results.additionalPainPoints.map(point => ({
            description: typeof point.description === 'string' ? point.description : 'Unknown pain point',
            urgencyScore: typeof point.urgencyScore === 'number' ? point.urgencyScore : 5,
            category: typeof point.category === 'string' ? point.category : 'general'
          }))
        : [],
      nxOpportunities: Array.isArray(results.nxOpportunities)
        ? results.nxOpportunities.map(opp => ({
            nx_feature: typeof opp.nx_feature === 'string' ? opp.nx_feature : 'Unknown feature',
            confidence_score: typeof opp.confidence_score === 'number' ? opp.confidence_score : 0.5,
            suggested_approach: typeof opp.suggested_approach === 'string' ? opp.suggested_approach : 'Standard implementation'
          }))
        : []
    };

    console.log('Validated results:', JSON.stringify(validatedResults, null, 2));
    return validatedResults;

  } catch (error) {
    console.error('Error parsing GPT response:', error);
    console.error('Raw response:', response.choices[0].message.content);
    throw new Error('Failed to parse GPT response. The response was not valid JSON.');
  }
}

async function generateEmbeddings(painPoints: string[]) {
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
    painPoints.map(async (pain) => {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: pain,
        });
        return response.data[0].embedding;
      } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
      }
    })
  );
}

async function findSimilarPainPointsGlobally(
  supabase: any,
  embedding: number[] | null,
  threshold = 0.85,
  maxResults = 10
) {
  if (!embedding) return [];

  try {
    // Updated function to search ALL pain points globally, not just for one company
    const { data, error } = await supabase.rpc('match_all_pain_points', {
      _query_embedding: embedding,
      _similarity_threshold: threshold,
      _match_count: maxResults
    });

    if (error) {
      console.error('Error in match_all_pain_points:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error finding similar pain points globally:', error);
    return [];
  }
}

async function analyzeGlobalTrends(
  supabase: any,
  openai: any,
  currentAnalysis: NxAnalysisResults
) {
  try {
    // Get all feature requests from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: recentMeetings, error } = await supabase
      .from('meetings')
      .select(`
        transcript_processed,
        companies!inner(name),
        date
      `)
      .gte('date', sixMonthsAgo.toISOString())
      .not('transcript_processed', 'is', null);

    if (error || !recentMeetings) return {};

    // Aggregate feature requests across all meetings, including current analysis
    const allFeatureRequests = {
      nx: [] as Array<{feature: string, company: string, date: string}>,
      nxCloud: [] as Array<{feature: string, company: string, date: string}>
    };

    // Add current analysis feature requests
    if (currentAnalysis.featureRequests) {
      if (currentAnalysis.featureRequests.nx) {
        currentAnalysis.featureRequests.nx.forEach((feature: string) => {
          allFeatureRequests.nx.push({
            feature,
            company: 'Current Meeting',
            date: new Date().toISOString()
          });
        });
      }
      if (currentAnalysis.featureRequests.nxCloud) {
        currentAnalysis.featureRequests.nxCloud.forEach((feature: string) => {
          allFeatureRequests.nxCloud.push({
            feature,
            company: 'Current Meeting',
            date: new Date().toISOString()
          });
        });
      }
    }

    // Add historical feature requests
    recentMeetings.forEach(meeting => {
      const processed = meeting.transcript_processed;
      if (processed?.featureRequests) {
        if (processed.featureRequests.nx) {
          processed.featureRequests.nx.forEach((feature: string) => {
            allFeatureRequests.nx.push({
              feature,
              company: meeting.companies.name,
              date: meeting.date
            });
          });
        }
        if (processed.featureRequests.nxCloud) {
          processed.featureRequests.nxCloud.forEach((feature: string) => {
            allFeatureRequests.nxCloud.push({
              feature,
              company: meeting.companies.name,
              date: meeting.date
            });
          });
        }
      }
    });

    // Count feature request frequency
    const featureRequestCounts = new Map();
    [...allFeatureRequests.nx, ...allFeatureRequests.nxCloud].forEach(item => {
      const key = item.feature.toLowerCase();
      if (!featureRequestCounts.has(key)) {
        featureRequestCounts.set(key, {
          feature: item.feature,
          count: 0,
          companies: new Set()
        });
      }
      const existing = featureRequestCounts.get(key);
      existing.count++;
      existing.companies.add(item.company);
    });

    // Convert to array and sort by popularity
    const commonFeatureRequests = Array.from(featureRequestCounts.values())
      .map(item => ({
        feature: item.feature,
        requestCount: item.count,
        companies: Array.from(item.companies)
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    // Analyze if current pain points are common
    const currentPainPoints = [
      currentAnalysis.mainPain,
      ...currentAnalysis.additionalPainPoints.map(p => p.description)
    ];

    // Get all pain points from recent meetings
    const allPainPoints = recentMeetings
      .map(meeting => meeting.transcript_processed?.mainPain)
      .filter(Boolean);

    // Count pain point frequency
    const painPointCounts = new Map();
    allPainPoints.forEach(pain => {
      const key = pain.toLowerCase();
      if (!painPointCounts.has(key)) {
        painPointCounts.set(key, {
          pain: pain,
          count: 0,
          companies: new Set()
        });
      }
      const existing = painPointCounts.get(key);
      existing.count++;
    });

    // Check if current pain points are common
    const commonPainPoints = currentPainPoints.map(pain => {
      const count = painPointCounts.get(pain.toLowerCase())?.count || 0;
      return {
        pain,
        isCommon: count > 1,
        frequency: count
      };
    });

    return {
      commonFeatureRequests,
      commonPainPoints
    };

  } catch (error) {
    console.error('Error analyzing global trends:', error);
    return {};
  }
}

async function performGlobalAnalysis(
  supabase: any,
  openai: any,
  analysisResults: NxAnalysisResults,
  painPointEmbeddings: (number[] | null)[]
): Promise<NxAnalysisResults['globalInsights']> {
  try {
    // Find similar pain points across all customers
    const allPainPoints = [analysisResults.mainPain, ...analysisResults.additionalPainPoints.map(p => p.description)];
    const similarPainPointsPromises = painPointEmbeddings.map(async (embedding, index) => {
      if (!embedding) return [];
      
      const similarPoints = await findSimilarPainPointsGlobally(supabase, embedding, 0.8, 5);
      return similarPoints.map((point: any) => ({
        description: allPainPoints[index],
        companyName: point.company_name,
        meetingDate: point.meeting_date,
        similarity: point.similarity
      }));
    });

    const similarPainPointsResults = await Promise.all(similarPainPointsPromises);
    const similarPainPointsAcrossCustomers = similarPainPointsResults.flat();

    // Analyze global trends
    const globalTrends = await analyzeGlobalTrends(supabase, openai, analysisResults);

    return {
      similarPainPointsAcrossCustomers,
      industryTrends: [], // Could be expanded with more analysis
      commonFeatureRequests: globalTrends.commonFeatureRequests || []
    };

  } catch (error) {
    console.error('Error in global analysis:', error);
    return {
      similarPainPointsAcrossCustomers: [],
      industryTrends: [],
      commonFeatureRequests: []
    };
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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const input: TranscriptInput = await req.json();
    const { transcript, meetingDate, meetingTitle, meetingPurpose, userId, companyName } = input;

    if (!transcript || !meetingDate || !userId || !companyName) {
      throw new Error('Missing required fields');
    }

    // Process transcript with Nx-specific analysis
    const analysisResults = await processNxTranscript(transcript, meetingPurpose);

    // Try to find existing company first
    const { data: existingCompany, error: lookupError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('normalized_name', companyName.toLowerCase().trim())
      .maybeSingle();

    if (lookupError) {
      console.error('Error looking up company:', lookupError);
      throw new Error(`Failed to look up company: ${lookupError.message}`);
    }

    console.log('Existing company:', existingCompany);
    console.log('Company data to upsert:', {
      id: existingCompany?.id,
      name: companyName,
      technologies_used: analysisResults.technologiesUsed,
      nx_version: analysisResults.nxVersion,
      nx_cloud_usage: analysisResults.nxCloudUsage.status,
      nx_cloud_why_not: analysisResults.nxCloudUsage.whyNot,
      years_using_nx: analysisResults.yearsUsingNx,
      workspace_size: analysisResults.workspaceSize,
      nx_adoption_approach: analysisResults.nxAdoptionApproach,
      ci_provider: analysisResults.ciProvider,
      satisfaction_nx: analysisResults.satisfaction.nx,
      satisfaction_nx_cloud: analysisResults.satisfaction.nxCloud,
      agents_usage: analysisResults.advancedFeatureUsage.agents,
      mfe_usage: analysisResults.advancedFeatureUsage.mfe,
      crystal_usage: analysisResults.advancedFeatureUsage.crystalInferredTasks,
      atomizer_usage: analysisResults.advancedFeatureUsage.atomizer,
      updated_at: new Date().toISOString()
    });

    // Create or update company with extracted information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: existingCompany?.id, // Will be undefined for new companies
        name: companyName,
        technologies_used: analysisResults.technologiesUsed,
        nx_version: analysisResults.nxVersion,
        nx_cloud_usage: analysisResults.nxCloudUsage.status,
        nx_cloud_why_not: analysisResults.nxCloudUsage.whyNot,
        years_using_nx: analysisResults.yearsUsingNx,
        workspace_size: analysisResults.workspaceSize,
        nx_adoption_approach: analysisResults.nxAdoptionApproach,
        ci_provider: analysisResults.ciProvider,
        satisfaction_nx: analysisResults.satisfaction.nx,
        satisfaction_nx_cloud: analysisResults.satisfaction.nxCloud,
        agents_usage: analysisResults.advancedFeatureUsage.agents,
        mfe_usage: analysisResults.advancedFeatureUsage.mfe,
        crystal_usage: analysisResults.advancedFeatureUsage.crystalInferredTasks,
        atomizer_usage: analysisResults.advancedFeatureUsage.atomizer,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating/updating company:', companyError);
      throw new Error(`Failed to create/update company: ${companyError.message}`);
    }

    if (!company) {
      console.error('No company data returned after upsert');
      throw new Error('Failed to create/update company: No data returned');
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
          mainPain: analysisResults.mainPain,
          whyNow: analysisResults.whyNow,
          callObjective: analysisResults.callObjective,
          problematicTasks: analysisResults.problematicTasks,
          currentBenefits: analysisResults.currentBenefits,
          favoriteFeatures: analysisResults.favoriteFeatures,
          featureRequests: analysisResults.featureRequests,
          summary: analysisResults.executiveSummary
        },
        created_by: userId,
      });

    if (meetingError) throw meetingError;

    // Store main pain point and additional pain points
    const allPainPoints = [
      {
        description: analysisResults.mainPain,
        urgencyScore: 10,
        category: 'main_pain',
        is_main_pain: true
      },
      ...analysisResults.additionalPainPoints.map(point => ({
        ...point,
        is_main_pain: false
      }))
    ];

    // Generate embeddings for pain points
    const painDescriptions = allPainPoints.map(p => p.description);
    const embeddings = await generateEmbeddings(painDescriptions);

    // Store pain points with embeddings
    const painPointPromises = allPainPoints.map(async (point, index) => {
      try {
        const { data: painPoint, error: painPointError } = await supabase
          .from('pain_points')
          .insert({
            meeting_id: meetingId,
            description: point.description,
            urgency_score: point.urgencyScore,
            category: point.category,
            embedding: embeddings[index],
            is_main_pain: point.is_main_pain
          })
          .select()
          .single();

        if (painPointError) throw painPointError;

        // Create opportunities for this pain point
        const opportunities = analysisResults.nxOpportunities
          .filter(opp => opp.confidence_score > 0.5)
          .map(async (opp) => {
            const { error: oppError } = await supabase
              .from('nx_opportunities')
              .insert({
                meeting_id: meetingId,
                pain_point_id: painPoint.id,
                nx_feature: opp.nx_feature,
                confidence_score: opp.confidence_score,
                suggested_approach: opp.suggested_approach
              });

            if (oppError) {
              console.error('Error creating opportunity:', oppError);
            }
          });

        await Promise.all(opportunities);
        return painPoint;
      } catch (error) {
        console.error('Error processing pain point:', error);
        return null;
      }
    });

    // Store follow-ups
    console.log('Generated follow-ups:', analysisResults.followUps);
    const followUpPromises = analysisResults.followUps.map(async (followUp) => {
      try {
        console.log('Storing follow-up:', followUp);
        const deadline = followUp.deadline.toLowerCase() === 'asap' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Set to tomorrow
          : followUp.deadline;

        const { error: followUpError } = await supabase
          .from('follow_ups')
          .insert({
            meeting_id: meetingId,
            description: followUp.description,
            deadline: deadline,
            assigned_to: userId,
            status: 'pending'
          });
        
        if (followUpError) {
          console.error('Error storing follow-up:', followUpError);
          throw followUpError;
        }
      } catch (error) {
        console.error('Error in follow-up promise:', error);
        throw error;
      }
    });

    // Wait for pain points to be stored
    await Promise.all(painPointPromises);

    // Perform global analysis using ALL pain points in the system
    const globalInsights = await performGlobalAnalysis(
      supabase,
      openai,
      analysisResults,
      embeddings
    );

    // Update analysis results with global insights
    analysisResults.globalInsights = globalInsights;

    // Wait for follow-ups to be stored before sending response
    try {
      await Promise.all(followUpPromises);
    } catch (error) {
      console.error('Error storing follow-ups:', error);
      throw new Error('Failed to store follow-ups');
    }

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