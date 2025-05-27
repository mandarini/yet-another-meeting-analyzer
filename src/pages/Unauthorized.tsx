import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Shield, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
            <Shield size={40} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Unauthorized Access</h1>
        
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          You don't have permission to access this page.
        </p>
        
        <div className="mt-8">
          <Link to="/">
            <Button leftIcon={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;