import TranscriptForm from '../components/transcript/TranscriptForm';

const SubmitTranscript = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Transcript</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Paste your meeting transcript to analyze and extract actionable insights.
        </p>
      </div>
      
      <TranscriptForm />
    </div>
  );
};

export default SubmitTranscript;