import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStore } from '../stores/dashboardStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';
import {
  BarChart2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const { 
    recentMeetings, 
    pendingFollowUps, 
    trendingIssues,
    stats,
    loading, 
    error, 
    loadDashboardData 
  } = useDashboardStore();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Function to get badge variant based on category
  const getCategoryBadge = (category: string) => {
    const mapping: Record<string, 'primary' | 'secondary' | 'warning' | 'danger'> = {
      'build_performance': 'primary',
      'developer_experience': 'secondary', 
      'ci_cd_issues': 'warning',
      'scaling_challenges': 'danger',
      'technical_debt': 'warning'
    };
    
    return mapping[category] || 'default';
  };

  // Function to get date in readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && recentMeetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link to="/submit">
          <Button 
            size="sm" 
            leftIcon={<FileText size={16} />}
          >
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMeetings}</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-md">
                <FileText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingFollowUps}</p>
              </div>
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-md">
                <Clock className="h-6 w-6 text-teal-500 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTasks}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-md">
                <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Identified Opportunities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.opportunities}</p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                <TrendingUp className="h-6 w-6 text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2" size={20} />
              Activity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMeetings.map(meeting => ({
                date: formatDate(meeting.date),
                painPoints: meeting.pain_points?.length || 0,
                followUps: meeting.follow_ups?.length || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="painPoints" 
                  stroke="#FF7B7B" 
                  name="Pain Points"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="followUps" 
                  stroke="#FF9B9B" 
                  name="Follow-ups"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trending Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Trending Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendingIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className={`mt-0.5 h-2 w-2 rounded-full mr-2 bg-${
                        issue.urgency > 7 ? 'red' : issue.urgency > 5 ? 'orange' : 'yellow'
                      }-500`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {issue.description}
                        </p>
                        <div className="mt-1">
                          <Badge variant={getCategoryBadge(issue.category)}>
                            {issue.category.replace('_', ' ')}
                          </Badge>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            Mentioned {issue.count} times
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {trendingIssues.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No trending issues found
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/historical" className="w-full">
              <Button variant="outline" size="sm" fullWidth rightIcon={<ChevronRight size={16} />}>
                View All Trends
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Meetings and Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2" size={20} />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {meeting.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(meeting.date)} • {meeting.companies?.name}
                      </p>
                    </div>
                  </div>
                  <Link to={`/analysis/${meeting.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}

              {recentMeetings.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No recent meetings found
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/historical" className="w-full">
              <Button variant="outline" size="sm" fullWidth rightIcon={<ChevronRight size={16} />}>
                View All Analyses
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Pending Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Pending Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingFollowUps.map((followUp) => (
                <div key={followUp.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {followUp.description}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock size={12} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due {formatDate(followUp.deadline)} • {followUp.meetings?.companies?.name}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Complete
                  </Button>
                </div>
              ))}

              {pendingFollowUps.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No pending follow-ups
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/follow-ups" className="w-full">
              <Button variant="outline" size="sm" fullWidth rightIcon={<ChevronRight size={16} />}>
                View All Follow-ups
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;