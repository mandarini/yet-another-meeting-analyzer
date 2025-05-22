import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
            <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
        
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-8">
          <Link to="/">
            <Button leftIcon={<Home size={16} />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;