import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { useAuthStore } from '../../stores/authStore';
import { Input, TextArea, Select } from '../ui/FormElements';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { FileText, SendHorizonal, Loader } from 'lucide-react';

interface TranscriptFormData {
  title: string;
  date: string;
  companyId: string;
  purpose: string;
  participants: string;
  transcriptText: string;
}

// Mock company data - in a real app, this would come from Supabase
const COMPANY_OPTIONS = [
  { value: '1', label: 'Acme Inc.' },
  { value: '2', label: 'Globex Corporation' },
  { value: '3', label: 'Initech' },
  { value: '4', label: 'Massive Dynamic' },
];

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
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TranscriptFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });
  
  const transcriptText = watch('transcriptText');
  
  const onSubmit = async (data: TranscriptFormData) => {
    if (user) {
      const formattedData = {
        ...data,
        participants: data.participants.split(',').map(p => p.trim()),
        userId: user.id,
      };
      
      const result = await submitNewTranscript(formattedData);
      
      if (result) {
        navigate(`/analysis/${result.id}`);
      }
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
            <Select
              label="Company"
              options={COMPANY_OPTIONS}
              {...register('companyId', { required: 'Company is required' })}
              error={errors.companyId?.message}
            />
            
            <Select
              label="Meeting Purpose"
              options={MEETING_PURPOSE_OPTIONS}
              {...register('purpose', { required: 'Purpose is required' })}
              error={errors.purpose?.message}
            />
          </div>
          
          <Input
            label="Participants (comma separated)"
            placeholder="John Doe, Jane Smith, etc."
            {...register('participants', { required: 'Participants are required' })}
            error={errors.participants?.message}
          />
          
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
            disabled={loading}
            isLoading={loading}
            rightIcon={loading ? <Loader size={16} /> : <SendHorizonal size={16} />}
          >
            {loading ? 'Analyzing...' : 'Submit for Analysis'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default TranscriptForm;