import { create } from 'zustand';
import { getMeetings, getFollowUps } from '../lib/supabase';

interface DashboardState {
  recentMeetings: any[];
  pendingFollowUps: any[];
  trendingIssues: any[];
  loading: boolean;
  error: string | null;
  
  loadDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  recentMeetings: [],
  pendingFollowUps: [],
  trendingIssues: [],
  loading: false,
  error: null,
  
  loadDashboardData: async () => {
    set({ loading: true, error: null });
    
    try {
      // Load recent meetings
      const meetings = await getMeetings(5);
      
      // Load pending follow-ups
      const followUps = await getFollowUps('pending');
      
      // For a real implementation, this would use an API call
      // Here we're just simulating trending issues by extracting from meetings
      const issues = extractTrendingIssues(meetings);
      
      set({
        recentMeetings: meetings,
        pendingFollowUps: followUps,
        trendingIssues: issues,
        loading: false
      });
    } catch (error: any) {
      set({ 
        error: error?.message || 'Failed to load dashboard data', 
        loading: false 
      });
    }
  }
}));

// Helper function to extract trending issues
function extractTrendingIssues(meetings: any[]) {
  // This is a simplified example
  const issuesMap: Record<string, { count: number, urgency: number, category: string }> = {};
  
  meetings.forEach(meeting => {
    const painPoints = meeting.pain_points || [];
    
    painPoints.forEach((point: any) => {
      const key = point.description;
      
      if (issuesMap[key]) {
        issuesMap[key].count += 1;
        issuesMap[key].urgency = Math.max(issuesMap[key].urgency, point.urgency_score);
      } else {
        issuesMap[key] = {
          count: 1,
          urgency: point.urgency_score,
          category: point.category
        };
      }
    });
  });
  
  // Convert to array and sort by count and urgency
  return Object.entries(issuesMap)
    .map(([description, data]) => ({
      description,
      count: data.count,
      urgency: data.urgency,
      category: data.category
    }))
    .sort((a, b) => (b.count * b.urgency) - (a.count * a.urgency))
    .slice(0, 5); // Top 5 issues
}