import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Check, AlertCircle } from 'lucide-react';

interface Opportunity {
  id: string;
  nx_feature: string;
  confidence_score: number;
  suggested_approach: string;
  meeting: {
    id: string;
    date: string;
    title: string;
    company: {
      id: string;
      name: string;
    };
  };
}

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabase
          .from('nx_opportunities')
          .select(`
            id,
            nx_feature,
            confidence_score,
            suggested_approach,
            meeting:meetings (
              id,
              date,
              title,
              company:companies (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOpportunities(data as unknown as Opportunity[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7B7B] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading opportunities...</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nx Opportunities</h1>
      </div>

      <div className="grid gap-6">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="mr-2" size={20} />
                  {opportunity.nx_feature}
                </div>
                <Badge variant="success">
                  {Math.round(opportunity.confidence_score * 100)}% Confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {opportunity.suggested_approach}
              </p>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Identified in </span>
                <Link 
                  to={`/analysis/${opportunity.meeting.id}`}
                  className="mx-1 text-[#FF7B7B] hover:underline"
                >
                  {opportunity.meeting.title}
                </Link>
                <span> for </span>
                <Link 
                  to={`/companies/${opportunity.meeting.company.id}`}
                  className="mx-1 text-[#FF7B7B] hover:underline"
                >
                  {opportunity.meeting.company.name}
                </Link>
                <span className="ml-2">
                  ({new Date(opportunity.meeting.date).toLocaleDateString()})
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Opportunities; 