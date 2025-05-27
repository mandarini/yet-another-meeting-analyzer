import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { AlertCircle, BarChart2, TrendingUp, Star } from 'lucide-react';
import { getMeetings } from '../lib/supabase';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface PainPoint {
  id: string;
  description: string;
  urgency_score: number;
  category: string;
  status: string;
  is_main_pain: boolean;
  meeting_id?: string;
  company?: string;
}

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
  pain_points: PainPoint[];
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

function isValidTranscriptProcessed(data: unknown): data is Meeting['transcript_processed'] {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  // Check if all properties are of the correct type
  if (obj.mainPain !== undefined && typeof obj.mainPain !== 'string') return false;
  if (obj.whyNow !== undefined && typeof obj.whyNow !== 'string') return false;
  if (obj.callObjective !== undefined && typeof obj.callObjective !== 'string') return false;
  if (obj.problematicTasks !== undefined && !Array.isArray(obj.problematicTasks)) return false;
  if (obj.currentBenefits !== undefined && !Array.isArray(obj.currentBenefits)) return false;
  if (obj.favoriteFeatures !== undefined && !Array.isArray(obj.favoriteFeatures)) return false;
  if (obj.featureRequests !== undefined) {
    const featureRequests = obj.featureRequests as Record<string, unknown>;
    if (featureRequests.nx !== undefined && !Array.isArray(featureRequests.nx)) return false;
    if (featureRequests.nxCloud !== undefined && !Array.isArray(featureRequests.nxCloud)) return false;
  }
  if (obj.summary !== undefined && typeof obj.summary !== 'string') return false;
  
  return true;
}

const PainPoints: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | 'all'>('all');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMeetings(50); // Get more meetings for historical view
      
      // Validate and transform the data
      const validMeetings = data.map(meeting => ({
        ...meeting,
        transcript_processed: isValidTranscriptProcessed(meeting.transcript_processed) 
          ? meeting.transcript_processed 
          : null,
        pain_points: (meeting.pain_points || []).map(point => ({
          ...point,
          is_main_pain: Boolean(point.is_main_pain)
        }))
      }));
      
      setMeetings(validMeetings);
    } catch (err) {
      console.error('Error loading meetings:', err);
      setError('Failed to load pain points data');
    } finally {
      setLoading(false);
    }
  };

  // Get unique companies
  const companies = Array.from(new Set(meetings.map(m => m.companies?.name))).filter(Boolean);

  // Filter meetings by selected company
  const filteredMeetings = selectedCompany === 'all' 
    ? meetings 
    : meetings.filter(m => m.companies?.name === selectedCompany);

  // Prepare data for charts
  const painPointsByCategory = filteredMeetings.reduce((acc: Record<string, { total: number; main: number }>, meeting) => {
    meeting.pain_points?.forEach(point => {
      if (!acc[point.category]) {
        acc[point.category] = { total: 0, main: 0 };
      }
      acc[point.category].total++;
      if (point.is_main_pain) {
        acc[point.category].main++;
      }
    });
    return acc;
  }, {});

  const chartData = Object.entries(painPointsByCategory).map(([category, data]) => ({
    category: category.replace('_', ' '),
    total: data.total,
    main: data.main
  }));

  // Helper function to render urgency indicator
  const renderUrgencyIndicator = (score: number) => {
    const color = score > 7 ? 'bg-red-500' : score > 5 ? 'bg-orange-500' : 'bg-yellow-500';
    return (
      <div className="flex items-center">
        <div className={`h-2 w-2 rounded-full ${color} mr-2`}></div>
        <span className="text-sm font-medium">{score}/10</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7B7B] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading pain points data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pain Points Analysis</h1>
      
      {/* Company Filter */}
      <div className="mb-6">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full md:w-64 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pain Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredMeetings.reduce((sum, m) => sum + (m.pain_points?.length || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Main Pain Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredMeetings.reduce((sum, m) => 
                    sum + (m.pain_points?.filter(p => p.is_main_pain).length || 0), 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Urgency Issues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredMeetings.reduce((sum, m) => 
                    sum + (m.pain_points?.filter(p => p.urgency_score > 7).length || 0), 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pain Points by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2" size={20} />
              Pain Points by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#FF7B7B" name="Total Pain Points" />
                  <Bar dataKey="main" fill="#FFD700" name="Main Pain Points" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Urgent Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Most Urgent Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMeetings
                .flatMap(m => m.pain_points || [])
                .sort((a, b) => b.urgency_score - a.urgency_score)
                .slice(0, 5)
                .map((point) => (
                  <div key={point.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {point.is_main_pain && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {point.description}
                        </p>
                      </div>
                      <div className="mt-1">
                        <Badge variant="primary">
                          {point.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4">
                      {renderUrgencyIndicator(point.urgency_score)}
                    </div>
                  </div>
                ))}

              {filteredMeetings.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Pain Points Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Pain Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMeetings
                  .flatMap(m => m.pain_points?.map(p => ({ ...p, company: m.companies?.name })) || [])
                  .map((point) => (
                    <tr key={point.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {point.is_main_pain && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-gray-900 dark:text-gray-100">
                            {point.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {point.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              point.urgency_score >= 8 ? 'bg-red-500' :
                              point.urgency_score >= 5 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${point.urgency_score * 10}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={point.status === 'active' ? 'warning' : 'success'}>
                          {point.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {point.company}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Follow-up Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMeetings
                  .flatMap(m => m.follow_ups?.map(f => ({ ...f, company: m.companies?.name })) || [])
                  .map((followUp) => (
                    <tr key={followUp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {followUp.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(followUp.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={followUp.status === 'pending' ? 'warning' : 'success'}>
                          {followUp.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {followUp.company}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PainPoints;