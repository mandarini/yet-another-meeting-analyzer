import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { useAuthStore } from '../../stores/authStore';
import { Input, TextArea, Select } from '../ui/FormElements';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { FileText, SendHorizonal, Loader } from 'lucide-react';
import { getCompanies } from '../../lib/supabase';

interface TranscriptFormData {
  title: string;
  date: string;
  companyName: string;
  newCompanyName?: string;
  purpose: string;
  transcriptText: string;
}

const MEETING_PURPOSE_OPTIONS = [
  { value: 'initial_consultation', label: 'Initial Consultation' },
  { value: 'technical_review', label: 'Technical Review' },
  { value: 'follow_up', label: 'Follow-up Meeting' },
  { value: 'demo', label: 'Product Demo' },
  { value: 'training', label: 'Training Session' },
];

const TranscriptForm = () => {
  const { submitNewTranscript, loading, error, success } = useTranscriptStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [charCount, setCharCount] = useState(0);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TranscriptFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });
  
  const transcriptText = watch('transcriptText');
  const selectedCompany = watch('companyName');
  const newCompanyName = watch('newCompanyName');
  
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await getCompanies();
        setCompanies(data.map(c => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.error('Error loading companies:', err);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany === 'new') {
      setIsNewCompany(true);
    } else {
      setIsNewCompany(false);
    }
  }, [selectedCompany]);

  const validateCompanyName = (name: string) => {
    if (companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCompanyError('A company with this name already exists');
      return false;
    }
    setCompanyError(null);
    return true;
  };
  
  const onSubmit = async (data: TranscriptFormData) => {
    if (!user) return;

    const finalCompanyName = data.companyName === 'new' ? data.newCompanyName : data.companyName;
    
    if (!finalCompanyName) {
      setCompanyError('Company name is required');
      return;
    }

    if (data.companyName === 'new' && !validateCompanyName(finalCompanyName)) {
      return;
    }

    setSubmitting(true);

    try {
      const formattedData = {
        ...data,
        companyName: finalCompanyName,
        userId: user.id,
      };
      
      const result = await submitNewTranscript(formattedData);
      
      if (result?.meetingId) {
        // Wait for the data to be saved before navigating
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigate(`/analysis/${result.meetingId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error submitting transcript:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            Submit New Transcript
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Meeting Title"
              placeholder="Enter meeting title"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
            />
            
            <Input
              label="Meeting Date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              error={errors.date?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Company"
                {...register('companyName', { required: 'Company is required' })}
                error={errors.companyName?.message}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))}
                <option value="new">
                  + Add New Company
                </option>
              </Select>

              {isNewCompany && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter new company name"
                    {...register('newCompanyName', {
                      required: isNewCompany ? 'Company name is required' : false,
                    })}
                    error={companyError || errors.newCompanyName?.message}
                  />
                </div>
              )}
            </div>
            
            <Select
              label="Meeting Purpose"
              {...register('purpose', { required: 'Purpose is required' })}
              error={errors.purpose?.message}
            >
              <option value="">Select purpose</option>
              {MEETING_PURPOSE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <TextArea
              label="Transcript"
              placeholder="Paste your meeting transcript here..."
              rows={12}
              {...register('transcriptText', { 
                required: 'Transcript is required',
                minLength: {
                  value: 100,
                  message: 'Transcript should be at least 100 characters'
                }
              })}
              error={errors.transcriptText?.message}
              onChange={(e) => setCharCount(e.target.value.length)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {charCount} characters
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-md text-sm">
              Transcript submitted successfully!
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || submitting}
            isLoading={loading || submitting}
            rightIcon={loading || submitting ? <Loader size={16} /> : <SendHorizonal size={16} />}
          >
            {loading || submitting ? 'Analyzing...' : 'Submit for Analysis'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default TranscriptForm;
