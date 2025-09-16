import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  HomeIcon, 
  UsersIcon, 
  FolderIcon, 
  CheckIcon, 
  SpeakerWaveIcon, 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  AcademicCapIcon,

} from '@heroicons/react/24/outline';
import { Settings, LogOut } from 'lucide-react';
// import { useAuth, UserRole } from '@/react-app/contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../contexts/AuthContext.types';
// import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigation = {
  mentor: [
    { name: 'Overview', href: '/app/dashboard', icon: HomeIcon },
    { name: 'My Mentees', href: '/app/mentees', icon: UsersIcon },
    { name: 'My Projects', href: '/app/projects', icon: FolderIcon },
    { name: 'Tasks', href: '/app/tasks', icon: CheckIcon },
    { name: 'Announcements', href: '/app/announcements', icon: SpeakerWaveIcon },
    { name: 'Messages', href: '/app/messages', icon: ChatBubbleLeftRightIcon },
  ],
  mentee: [
    { name: 'Overview', href: '/app/dashboard', icon: HomeIcon },
    { name: 'My Mentors', href: '/app/mentors', icon: UsersIcon },
    { name: 'Projects', href: '/app/projects', icon: FolderIcon },
    { name: 'Tasks', href: '/app/tasks', icon: CheckIcon },
    { name: 'Announcements', href: '/app/announcements', icon: SpeakerWaveIcon },
    { name: 'Messages', href: '/app/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Certificates', href: '/app/certificates', icon: AcademicCapIcon },
  ],
  reviewer: [
    { name: 'Overview', href: '/app/dashboard', icon: HomeIcon },
    { name: 'Project Reviews', href: '/app/reviews', icon: FolderIcon },
    { name: 'Comments', href: '/app/comments', icon: ChatBubbleLeftRightIcon },
    { name: 'Messages', href: '/app/messages', icon: ChatBubbleLeftRightIcon },
  ],
  state_admin: [
    { name: 'Overview', href: '/app/dashboard', icon: HomeIcon },
    { name: 'User Management', href: '/app/users', icon: UsersIcon },
    { name: 'Project Approvals', href: '/app/approvals', icon: FolderIcon },
    { name: 'Analytics', href: '/app/analytics', icon: CheckIcon },
    { name: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
  ],
  super_admin: [
    { name: 'Overview', href: '/app/dashboard', icon: HomeIcon },
    { name: 'System Config', href: '/app/config', icon: Cog6ToothIcon },
    { name: 'User Management', href: '/app/users', icon: UsersIcon },
    { name: 'Analytics', href: '/app/analytics', icon: CheckIcon },
    { name: 'Messages', href: '/app/messages', icon: ChatBubbleLeftRightIcon },
  ]
};

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user,logout } = useAuth();
  const userNavigation = navigation[user?.role as UserRole] || navigation.mentor;
  // const navigate = useNavigate();


  const handleNavClick = () => {
    // Close sidebar on mobile/tablet after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

    const handleLogout = async () => {
    try {
      // await logout();
      localStorage.removeItem('user');
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vidya Shakti</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Yuva Platform</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                {user?.avatar || user?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {userNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
            {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
