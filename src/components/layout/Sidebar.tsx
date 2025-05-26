import { 
  Home, 
  FileText, 
  BarChart2, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  Shield,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const { signOut, userRole } = useAuthStore();
  
  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = userRole === 'super_admin' || userRole === 'admin';

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/submit', label: 'Submit Transcript', icon: <FileText size={20} /> },
    { path: '/historical', label: 'Historical Data', icon: <BarChart2 size={20} /> },
    { path: '/follow-ups', label: 'Follow Ups', icon: <ClipboardCheck size={20} /> },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: <Shield size={20} /> }] : []),
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
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
      
      <nav className="mt-8 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => window.innerWidth < 768 && closeSidebar()}
                className={({ isActive }) => 
                  `flex items-center px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-[#FF7B7B] dark:text-[#FF9B9B] bg-pink-50 dark:bg-pink-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:text-[#FF7B7B] dark:hover:text-[#FF9B9B] hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                end={item.path === '/'}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 mt-auto">
        <button
          className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          onClick={handleSignOut}
        >
          <LogOut size={20} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;