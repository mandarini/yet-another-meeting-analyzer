import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getCompanies } from '../lib/supabase';
import {
  Building2,
  Search,
  AlertCircle,
  Cloud,
  GitBranch,
  Users
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  nx_version: string;
  nx_cloud_usage: 'yes' | 'no' | 'considering' | 'unknown';
  ci_provider: string;
  satisfaction_nx: number;
  technologies_used: string[];
  last_meeting_date: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    cloudUsage: 'all',
    ciProvider: 'all',
    satisfaction: 'all'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const getNxVersionColor = (version: string) => {
    if (!version || version === 'unknown') return 'text-gray-400';
    const major = parseInt(version.split('.')[0]);
    if (major >= 16) return 'text-green-500';
    if (major >= 14) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCloudUsageBadge = (usage: string) => {
    const variants = {
      'yes': 'success',
      'no': 'danger',
      'considering': 'warning',
      'unknown': 'default'
    } as const;
    return variants[usage as keyof typeof variants] || 'default';
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.technologies_used.some(tech => 
        tech.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCloudUsage = 
      filters.cloudUsage === 'all' || 
      company.nx_cloud_usage === filters.cloudUsage;

    const matchesCiProvider = 
      filters.ciProvider === 'all' || 
      company.ci_provider === filters.ciProvider;

    const matchesSatisfaction = () => {
      if (filters.satisfaction === 'all') return true;
      const score = company.satisfaction_nx;
      switch (filters.satisfaction) {
        case 'high': return score >= 8;
        case 'medium': return score >= 5 && score < 8;
        case 'low': return score < 5;
        default: return true;
      }
    };

    return matchesSearch && matchesCloudUsage && matchesCiProvider && matchesSatisfaction();
  });

  // Calculate summary stats
  const stats = {
    totalCompanies: companies.length,
    cloudAdoptionRate: companies.filter(c => c.nx_cloud_usage === 'yes').length / companies.length * 100,
    averageSatisfaction: companies.reduce((sum, c) => sum + c.satisfaction_nx, 0) / companies.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Manage and track company information
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompanies}</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-md">
                <Building2 className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cloud Adoption Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.cloudAdoptionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                <Cloud className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageSatisfaction.toFixed(1)}/10
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-md">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search companies or technologies..."
            className="pl-10 pr-4 py-2 w-full border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={filters.cloudUsage}
            onChange={(e) => setFilters(f => ({ ...f, cloudUsage: e.target.value }))}
          >
            <option value="all">All Cloud Usage</option>
            <option value="yes">Using Cloud</option>
            <option value="no">Not Using Cloud</option>
            <option value="considering">Considering Cloud</option>
          </select>

          <select
            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={filters.ciProvider}
            onChange={(e) => setFilters(f => ({ ...f, ciProvider: e.target.value }))}
          >
            <option value="all">All CI Providers</option>
            <option value="github">GitHub Actions</option>
            <option value="jenkins">Jenkins</option>
            <option value="circle">CircleCI</option>
            <option value="azure">Azure DevOps</option>
          </select>

          <select
            className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            value={filters.satisfaction}
            onChange={(e) => setFilters(f => ({ ...f, satisfaction: e.target.value }))}
          >
            <option value="all">All Satisfaction</option>
            <option value="high">High (8-10)</option>
            <option value="medium">Medium (5-7)</option>
            <option value="low">Low (0-4)</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2" size={20} />
            Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nx Version
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cloud Usage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CI Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Satisfaction
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Technologies
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Meeting
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.map((company) => (
                  <tr 
                    key={company.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/companies/${company.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {company.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${getNxVersionColor(company.nx_version)}`}>
                        {company.nx_version || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getCloudUsageBadge(company.nx_cloud_usage)}>
                        {company.nx_cloud_usage}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <GitBranch size={16} className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {company.ci_provider || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            company.satisfaction_nx >= 8 ? 'bg-green-500' :
                            company.satisfaction_nx >= 5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${company.satisfaction_nx * 10}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {company.technologies_used.slice(0, 3).map((tech, i) => (
                          <Badge key={i} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                        {company.technologies_used.length > 3 && (
                          <Badge variant="default">
                            +{company.technologies_used.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(company.last_meeting_date)}
                    </td>
                  </tr>
                ))}

                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No companies found
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

export default Companies;