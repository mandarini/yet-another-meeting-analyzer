import { create } from 'zustand';
import { getMeetings, getFollowUps } from '../lib/supabase';

interface DashboardState {
  recentMeetings: any[];
  pendingFollowUps: any[];
  trendingIssues: any[];
  loading: boolean;
  error: string | null;
  stats: {
    totalMeetings: number;
    pendingFollowUps: number;
    completedTasks: number;
    opportunities: number;
  };
  
  loadDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  recentMeetings: [],
  pendingFollowUps: [],
  trendingIssues: [],
  loading: false,
  error: null,
  stats: {
    totalMeetings: 0,
    pendingFollowUps: 0,
    completedTasks: 0,
    opportunities: 0,
  },
  
  loadDashboardData: async () => {
    set({ loading: true, error: null });
    
    try {
      // Load all meetings for opportunities count
      const allMeetings = await getMeetings();
      
      // Load recent meetings for display
      const recentMeetings = await getMeetings(5);
      
      // Load both pending and completed follow-ups
      const [pendingFollowUps, completedFollowUps] = await Promise.all([
        getFollowUps('pending'),
        getFollowUps('completed')
      ]);
      
      // Calculate stats
      const stats = {
        totalMeetings: allMeetings.length,
        pendingFollowUps: pendingFollowUps.length,
        completedTasks: completedFollowUps.length,
        opportunities: allMeetings.reduce((sum, meeting) => 
          sum + (meeting.nx_opportunities?.length || 0), 0),
      };
      
      // Extract trending issues from recent meetings
      const issues = extractTrendingIssues(recentMeetings);
      
      set({
        recentMeetings,
        pendingFollowUps,
        trendingIssues: issues,
        stats,
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
  const issuesMap: Record<string, { 
    description: string;
    count: number;
    urgency: number;
    category: string;
    lastMentioned: string;
  }> = {};
  
  meetings.forEach(meeting => {
    const painPoints = meeting.pain_points || [];
    
    painPoints.forEach((point: any) => {
      const key = point.description;
      
      if (issuesMap[key]) {
        issuesMap[key].count += 1;
        issuesMap[key].urgency = Math.max(issuesMap[key].urgency, point.urgency_score);
        if (meeting.date > issuesMap[key].lastMentioned) {
          issuesMap[key].lastMentioned = meeting.date;
        }
      } else {
        issuesMap[key] = {
          description: point.description,
          count: 1,
          urgency: point.urgency_score,
          category: point.category,
          lastMentioned: meeting.date
        };
      }
    });
  });
  
  // Convert to array and sort by recency, count, and urgency
  return Object.values(issuesMap)
    .sort((a, b) => {
      // First sort by count
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      
      // Then by urgency
      const urgencyDiff = b.urgency - a.urgency;
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Finally by date
      return new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime();
    })
    .slice(0, 5); // Top 5 issues
}