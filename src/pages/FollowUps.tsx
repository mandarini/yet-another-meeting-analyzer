import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getFollowUps, updateFollowUpStatus } from '../lib/supabase';

interface FollowUp {
  id: string;
  description: string;
  deadline: string;
  status: string;
  meetings: {
    title: string;
    date: string;
    companies: {
      name: string;
    };
  };
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      const data = await getFollowUps('pending');
      setFollowUps(data);
    } catch (err) {
      setError('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const success = await updateFollowUpStatus(id, newStatus);
      if (success) {
        await loadFollowUps(); // Reload the list
      }
    } catch (err) {
      setError('Failed to update follow-up status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Follow-ups</h2>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-up Tasks</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="warning">
            {followUps.filter(f => f.status === 'pending').length} Pending
          </Badge>
          <Badge variant="success">
            {followUps.filter(f => f.status === 'completed').length} Completed
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {followUps.map((followUp) => (
          <Card key={followUp.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-800">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2" size={20} />
                  <span className="text-lg">{followUp.meetings.title}</span>
                </div>
                <Badge 
                  variant={isOverdue(followUp.deadline) ? 'danger' : 'warning'}
                >
                  Due {formatDate(followUp.deadline)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    {followUp.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {followUp.meetings.companies.name} • Meeting on {formatDate(followUp.meetings.date)}
                  </p>
                </div>
                <div className="ml-4">
                  {followUp.status === 'pending' ? (
                    <Button
                      onClick={() => handleStatusUpdate(followUp.id, 'completed')}
                      leftIcon={<CheckCircle2 size={16} />}
                    >
                      Mark Complete
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(followUp.id, 'pending')}
                      leftIcon={<Clock size={16} />}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {followUps.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You have no pending follow-up tasks.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FollowUps;