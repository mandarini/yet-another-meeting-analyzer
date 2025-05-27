import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  Home, 
  FileText, 
  Building2, 
  AlertCircle, 
  BarChart2, 
  ClipboardCheck,
  X,
  Lightbulb
} from 'lucide-react';

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const { signOut } = useAuthStore();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/submit', label: 'Submit Transcript', icon: <FileText size={20} /> },
    { path: '/companies', label: 'Companies', icon: <Building2 size={20} /> },
    { path: '/pain-points', label: 'Pain Points', icon: <AlertCircle size={20} /> },
    { path: '/opportunities', label: 'Opportunities', icon: <Lightbulb size={20} /> },
    { path: '/historical', label: 'Historical Data', icon: <BarChart2 size={20} /> },
    { path: '/follow-ups', label: 'Follow Ups', icon: <ClipboardCheck size={20} /> },
  ];

  return (
    <div className="h-full flex flex-col py-4">
      <div className="px-4 flex items-center justify-between md:justify-center">
        <div className="flex items-center">
          <img src="/assets/yama-face.png" alt="Yama" className="h-8 w-8 mr-2" />
          <span className="font-bold text-xl text-[#FF7B7B] dark:text-[#FF9B9B]">
            Yama
          </span>
        </div>
        <button 
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 md:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-2 mt-8 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              location.pathname === item.path
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;