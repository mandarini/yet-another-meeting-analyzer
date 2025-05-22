import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      // Load both pending and completed follow-ups
      const [pendingData, completedData] = await Promise.all([
        getFollowUps('pending'),
        getFollowUps('completed')
      ]);
      setFollowUps([...pendingData, ...completedData]);
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
        // Update the local state immediately
        setFollowUps(followUps.map(followUp => 
          followUp.id === id 
            ? { ...followUp, status: newStatus }
            : followUp
        ));
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

  const filteredFollowUps = followUps.filter(followUp => {
    if (filter === 'all') return true;
    return followUp.status === filter;
  });

  const stats = {
    pending: followUps.filter(f => f.status === 'pending').length,
    completed: followUps.filter(f => f.status === 'completed').length,
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-up Tasks</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            Track and manage your meeting follow-ups
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge variant="warning">
              {stats.pending} Pending
            </Badge>
            <Badge variant="success">
              {stats.completed} Completed
            </Badge>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'completed')}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredFollowUps.map((followUp) => (
          <Card key={followUp.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-gray-800">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="mr-2" size={20} />
                  <span className="text-lg">{followUp.meetings.title}</span>
                </div>
                <Badge 
                  variant={
                    followUp.status === 'completed' ? 'success' :
                    isOverdue(followUp.deadline) ? 'danger' : 'warning'
                  }
                >
                  {followUp.status === 'completed' ? 'Completed' : `Due ${formatDate(followUp.deadline)}`}
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

        {filteredFollowUps.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {filter === 'all' 
                  ? 'No Follow-up Tasks'
                  : filter === 'pending'
                  ? 'No Pending Tasks'
                  : 'No Completed Tasks'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {filter === 'all'
                  ? 'You have no follow-up tasks.'
                  : filter === 'pending'
                  ? 'All caught up! No pending tasks.'
                  : 'No completed tasks yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FollowUps;