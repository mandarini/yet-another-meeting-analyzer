import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getMeetings } from '../lib/supabase';
import { 
  BarChart2, 
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Meeting {
  id: string;
  date: string;
  title: string;
  companies: {
    name: string;
  };
  pain_points: Array<{
    id: string;
    description: string;
    urgency_score: number;
    category: string;
  }>;
  follow_ups: Array<{
    id: string;
    description: string;
    status: string;
  }>;
}

const HistoricalData = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | 'all'>('all');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await getMeetings(50); // Get more meetings for historical view
      setMeetings(data);
    } catch (err) {
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get unique companies
  const companies = Array.from(new Set(meetings.map(m => m.companies?.name))).filter(Boolean);

  // Filter meetings by selected company
  const filteredMeetings = selectedCompany === 'all' 
    ? meetings 
    : meetings.filter(m => m.companies?.name === selectedCompany);

  // Prepare data for charts
  const painPointsByCategory = filteredMeetings.reduce((acc: Record<string, number>, meeting) => {
    meeting.pain_points?.forEach(point => {
      acc[point.category] = (acc[point.category] || 0) + 1;
    });
    return acc;
  }, {});

  const chartData = Object.entries(painPointsByCategory).map(([category, count]) => ({
    category: category.replace('_', ' '),
    count,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7B7B] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historical Data</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Analysis and trends from past meetings
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="all">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredMeetings.length}</p>
              </div>
              <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-md">
                <Calendar className="h-6 w-6 text-[#FF7B7B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pain Points</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredMeetings.reduce((sum, m) => sum + (m.follow_ups?.length || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
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
                  <Bar dataKey="count" fill="#FF7B7B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trending Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Most Reported Issues
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
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {point.description}
                      </p>
                      <div className="mt-1">
                        <Badge variant="primary">
                          {point.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${
                        point.urgency_score > 7 ? 'bg-red-500' :
                        point.urgency_score > 5 ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-medium">{point.urgency_score}/10</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" size={20} />
            Meeting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pain Points
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Follow-ups
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(meeting.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {meeting.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {meeting.companies?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant="warning">
                        {meeting.pain_points?.length || 0}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant="primary">
                        {meeting.follow_ups?.length || 0}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link to={`/analysis/${meeting.id}`}>
                        <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={16} />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredMeetings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No meetings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalData;