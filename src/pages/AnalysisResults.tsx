import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranscriptStore } from '../stores/transcriptStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BarChart2, FileText, Check, AlertCircle, ExternalLink, Clock, ArrowLeft } from 'lucide-react';

const AnalysisResults = () => {
  const { id } = useParams<{ id: string }>();
  const { loadMeeting, currentMeeting, loading, error } = useTranscriptStore();
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (id) {
      loadMeeting(id);
    }
  }, [id, loadMeeting]);

  // Function to render urgency indicator
  const renderUrgencyIndicator = (score: number) => {
    let color = 'bg-green-500';
    if (score > 7) color = 'bg-red-500';
    else if (score > 5) color = 'bg-orange-500';
    else if (score > 3) color = 'bg-yellow-500';

    return (
      <div className="flex items-center">
        <div className={`h-2 w-2 rounded-full ${color} mr-2`}></div>
        <span className="text-sm font-medium">{score}/10</span>
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Results</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
        <Link to="/">
          <Button leftIcon={<ArrowLeft size={16} />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Mock data for the analysis result
  // In a real app, this would come from currentMeeting
  const analysisData = {
    id: id || '1',
    title: 'Acme Inc. Technical Review',
    date: '2025-06-10',
    company: 'Acme Inc.',
    participants: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    summary: 'This meeting focused on the technical challenges Acme Inc. is facing with their monorepo structure. The team expressed frustration with build times and CI pipeline issues. Several Nx opportunities were identified, particularly around caching and distributed task execution.',
    painPoints: [
      { id: '1', description: 'Build times are too slow for large projects', urgency: 8, category: 'build_performance', status: 'active' },
      { id: '2', description: 'Developer onboarding takes too long', urgency: 6, category: 'developer_experience', status: 'active' },
      { id: '3', description: 'CI pipeline frequently times out', urgency: 9, category: 'ci_cd_issues', status: 'active' },
      { id: '4', description: 'Difficulty managing dependencies between projects', urgency: 7, category: 'scaling_challenges', status: 'active' },
    ],
    followUps: [
      { id: '1', description: 'Send documentation on Nx caching', deadline: '2025-06-15', status: 'pending' },
      { id: '2', description: 'Schedule technical deep dive on distributed task execution', deadline: '2025-06-20', status: 'pending' },
      { id: '3', description: 'Share case studies of similar implementations', deadline: '2025-06-18', status: 'pending' },
    ],
    nxOpportunities: [
      { id: '1', feature: 'Computation Caching', confidence: 0.9, approach: 'Implement Nx caching to significantly reduce build times by only rebuilding what changed.' },
      { id: '2', feature: 'Distributed Task Execution', confidence: 0.85, approach: 'Use Nx Cloud to distribute CI tasks across multiple machines, reducing pipeline time by 70%.' },
      { id: '3', feature: 'Dependency Graph Visualization', confidence: 0.75, approach: 'Leverage Nx dependency graph to help developers understand project relationships.' },
    ],
    history: {
      recurring: [
        { description: 'Build performance concerns', occurrences: 3 },
        { description: 'CI pipeline timeouts', occurrences: 2 },
      ]
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <Link to="/" className="mr-2">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{analysisData.title}</h1>
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            {formatDate(analysisData.date)} • {analysisData.company}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<ExternalLink size={16} />}
          >
            Share Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: <FileText size={16} /> },
            { id: 'pain-points', label: 'Pain Points', icon: <AlertCircle size={16} /> },
            { id: 'follow-ups', label: 'Follow-ups', icon: <Clock size={16} /> },
            { id: 'opportunities', label: 'Nx Opportunities', icon: <Check size={16} /> },
            { id: 'history', label: 'Historical Context', icon: <BarChart2 size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2" size={20} />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {analysisData.summary}
                </p>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participants:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.participants.map((participant, index) => (
                      <Badge key={index} variant="default">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2" size={20} />
                    Top Pain Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisData.painPoints.slice(0, 3).map((point) => (
                      <li key={point.id} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {point.description}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <Badge variant="primary">
                              {point.category.replace('_', ' ')}
                            </Badge>
                            {renderUrgencyIndicator(point.urgency)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2" size={20} />
                    Follow-up Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisData.followUps.map((item) => (
                      <li key={item.id} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.description}
                          </p>
                          <div className="mt-1 flex items-center">
                            <Clock size={12} className="text-gray-500 dark:text-gray-400 mr-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Due {formatDate(item.deadline)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="mr-2" size={20} />
                    Nx Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisData.nxOpportunities.map((opp) => (
                      <li key={opp.id} className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {opp.feature}
                          </p>
                          <div className="mt-1 flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Confidence: {Math.round(opp.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'pain-points' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2" size={20} />
                Client Pain Points
              </CardTitle>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analysisData.painPoints.map((point) => (
                      <tr key={point.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {point.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant="primary">
                            {point.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {renderUrgencyIndicator(point.urgency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={point.status === 'active' ? 'warning' : 'success'}>
                            {point.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'follow-ups' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" size={20} />
                Your Follow-up Commitments
              </CardTitle>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analysisData.followUps.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(item.deadline)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={item.status === 'pending' ? 'warning' : 'success'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button 
                            variant={item.status === 'pending' ? 'primary' : 'outline'} 
                            size="sm"
                            disabled={item.status !== 'pending'}
                          >
                            {item.status === 'pending' ? 'Complete' : 'Completed'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            {analysisData.nxOpportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Check className="mr-2" size={20} />
                      {opp.feature}
                    </div>
                    <Badge variant="success">
                      {Math.round(opp.confidence * 100)}% Confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">
                    {opp.approach}
                  </p>
                  
                  {/* Related pain points section */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Addresses these pain points:
                    </h3>
                    <ul className="space-y-2">
                      {analysisData.painPoints
                        .slice(0, 2) // Just showing a couple for each opportunity
                        .map((point) => (
                          <li key={point.id} className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {point.description}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2" size={20} />
                Historical Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Recurring Issues
                </h3>
                
                <div className="space-y-4">
                  {analysisData.history.recurring.map((issue, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {issue.description}
                        </p>
                        <Badge variant="primary">
                          Mentioned {issue.occurrences} times
                        </Badge>
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-indigo-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(issue.occurrences * 20, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Previous Meetings
                </h3>
                
                <div className="space-y-4">
                  {[
                    { title: 'Initial Consultation', date: '2025-05-01' },
                    { title: 'Technical Requirements Discussion', date: '2025-05-15' },
                  ].map((meeting, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(meeting.date)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;