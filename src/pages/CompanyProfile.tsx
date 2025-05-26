import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompanyStore } from '../stores/companyStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  Building2,
  Cloud,
  GitBranch,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const CompanyProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { loadCompany, currentCompany, loading, error } = useCompanyStore();

  useEffect(() => {
    if (id) {
      loadCompany(id);
    }
  }, [id, loadCompany]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFeatureStatusIcon = (status: string) => {
    switch (status) {
      case 'yes':
        return <CheckCircle2 className="text-green-500" size={24} />;
      case 'no':
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <HelpCircle className="text-gray-400" size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Company</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'Company not found'}</p>
        <Link to="/companies">
          <Button leftIcon={<ArrowLeft size={16} />}>
            Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <Link to="/companies" className="mr-2">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentCompany.name}</h1>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nx Version</p>
                <p className="mt-1 text-lg font-semibold">{currentCompany.nx_version || 'Unknown'}</p>
              </div>
              <GitBranch className="text-gray-400" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Years Using Nx</p>
                <p className="mt-1 text-lg font-semibold">{currentCompany.years_using_nx || 'Unknown'}</p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Workspace Size</p>
                <p className="mt-1 text-lg font-semibold">{currentCompany.workspace_size || 'Unknown'}</p>
              </div>
              <Building2 className="text-gray-400" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Meeting</p>
                <p className="mt-1 text-lg font-semibold">
                  {currentCompany.last_meeting_date ? 
                    formatDate(currentCompany.last_meeting_date) : 
                    'No meetings yet'
                  }
                </p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nx Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cloud className="mr-2" size={20} />
              Nx Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CI Provider</p>
                <div className="mt-1 flex items-center">
                  <GitBranch className="mr-2 text-gray-400" size={16} />
                  <span className="text-gray-900 dark:text-gray-100">
                    {currentCompany.ci_provider || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nx Cloud Usage</p>
                <div className="mt-1">
                  <Badge 
                    variant={
                      currentCompany.nx_cloud_usage === 'yes' ? 'success' :
                      currentCompany.nx_cloud_usage === 'no' ? 'danger' :
                      currentCompany.nx_cloud_usage === 'considering' ? 'warning' :
                      'default'
                    }
                  >
                    {currentCompany.nx_cloud_usage}
                  </Badge>
                  {currentCompany.nx_cloud_why_not && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Why not: {currentCompany.nx_cloud_why_not}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Adoption Approach</p>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {currentCompany.nx_adoption_approach?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Technologies</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {currentCompany.technologies_used?.map((tech: string, index: number) => (
                    <Badge key={index} variant="primary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2" size={20} />
              Satisfaction Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nx</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentCompany.satisfaction_nx}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    currentCompany.satisfaction_nx >= 8 ? 'bg-green-500' :
                    currentCompany.satisfaction_nx >= 5 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(currentCompany.satisfaction_nx / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nx Cloud</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentCompany.satisfaction_nx_cloud}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    currentCompany.satisfaction_nx_cloud >= 8 ? 'bg-green-500' :
                    currentCompany.satisfaction_nx_cloud >= 5 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${(currentCompany.satisfaction_nx_cloud / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2" size={20} />
            Advanced Features Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Agents</p>
              {getFeatureStatusIcon(currentCompany.agents_usage)}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">MFE</p>
              {getFeatureStatusIcon(currentCompany.mfe_usage)}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Crystal</p>
              {getFeatureStatusIcon(currentCompany.crystal_usage)}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Atomizer</p>
              {getFeatureStatusIcon(currentCompany.atomizer_usage)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Recent Meetings
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
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
                    Main Pain
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Participants
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentCompany.meetings?.slice(0, 10).map((meeting: any) => (
                  <tr key={meeting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(meeting.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {meeting.title}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {meeting.pain_points?.[0]?.description || 'No pain points recorded'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {meeting.participants?.slice(0, 3).map((participant: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {participant}
                          </Badge>
                        ))}
                        {(meeting.participants?.length || 0) > 3 && (
                          <Badge variant="default">
                            +{meeting.participants.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link to={`/analysis/${meeting.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}

                {(!currentCompany.meetings || currentCompany.meetings.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No meetings recorded
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

export default CompanyProfile;