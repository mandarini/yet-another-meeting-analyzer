import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStore } from '../stores/dashboardStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Line } from 'react-chartjs-2';
import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  BarChart2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

// Mock data for chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Dashboard = () => {
  const { 
    recentMeetings, 
    pendingFollowUps, 
    trendingIssues, 
    loading, 
    error, 
    loadDashboardData 
  } = useDashboardStore();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Pain Points',
        data: [12, 19, 15, 17, 14, 10],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Follow-ups',
        data: [8, 11, 13, 9, 7, 5],
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">16</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
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
              Tracking Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.datasets[0].data.map((value, index) => ({
                name: chartData.labels[index],
                painPoints: value,
                followUps: chartData.datasets[1].data[index]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="painPoints" stroke="#4f46e5" name="Pain Points" />
                <Line type="monotone" dataKey="followUps" stroke="#0d9488" name="Follow-ups" />
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
              {/* Mocking trending issues since we don't have real data yet */}
              {[
                { description: 'Build performance degradation', category: 'build_performance', urgency: 8 },
                { description: 'Developer onboarding challenges', category: 'developer_experience', urgency: 7 },
                { description: 'CI pipeline timeouts', category: 'ci_cd_issues', urgency: 6 },
                { description: 'Scaling issues with large repos', category: 'scaling_challenges', urgency: 9 },
              ].map((issue, index) => (
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
              {/* Mocking recent meetings since we don't have real data yet */}
              {[
                { id: '1', title: 'Acme Inc. Technical Review', date: '2025-06-10', company: 'Acme Inc.' },
                { id: '2', title: 'Globex Corp. Initial Consultation', date: '2025-06-08', company: 'Globex Corp.' },
                { id: '3', title: 'Initech Follow-up', date: '2025-06-05', company: 'Initech' },
              ].map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {meeting.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(meeting.date)} • {meeting.company}
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
              {/* Mocking follow-ups since we don't have real data yet */}
              {[
                { id: '1', description: 'Send build optimization examples', deadline: '2025-06-12', company: 'Acme Inc.' },
                { id: '2', description: 'Schedule technical deep dive on caching', deadline: '2025-06-15', company: 'Globex Corp.' },
                { id: '3', description: 'Share documentation on distributed builds', deadline: '2025-06-11', company: 'Initech' },
              ].map((followUp) => (
                <div key={followUp.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {followUp.description}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock size={12} className="text-gray-500 dark:text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due {formatDate(followUp.deadline)} • {followUp.company}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Complete
                  </Button>
                </div>
              ))}
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