import { useState, useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import { 
  LogOut, 
  Settings, 
  MessageCircle,
  Users,
  BarChart3,
  FolderOpen,
  Award,
  Bell,
  Home,
  UserCheck,
  Building,
  Globe,
  CheckSquare,
  FileText,
  Target
} from 'lucide-react';

interface UserData {
  mochaUser: any;
  localUser: any;
  needsRegistration: boolean;
}

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUserDataLoad?: (userData: UserData) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange, onUserDataLoad }: DashboardLayoutProps) {
  console.log({children});
  
  // const { user, logout, isPending } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>({
      mochaUser: { email: "test@example.com" },
      localUser: {
        first_name: "John",
        last_name: "Doe",
        mobile_number: "1234567890",
        place_city: "Somewhere",
        district: "SomeDistrict",
        state: "SomeState",
        role: "mentor",
        is_approved: true
      },
      needsRegistration: false,
    });
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     if (!user) {
  //       navigate('/');
  //       return;
  //     }

  //     try {
  //       const response = await fetch('/api/users/me');
  //       if (response.ok) {
  //         const data = await response.json();
  //         setUserData(data);
  //         onUserDataLoad?.(data);
          
  //         if (data.needsRegistration) {
  //           navigate('/');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch user data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (!isPending) {
  //     fetchUserData();
  //   }
  // }, [user, isPending, navigate]);

  const handleLogout = async () => {
    try {
      // await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavigationItems = (role: string): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { key: 'overview', label: 'Overview', icon: Home },
    ];
    console.log({role});
    

    switch (role) {
      case 'super_admin':
        return [
          ...baseItems,
          { key: 'states', label: 'States & UTs', icon: Globe },
          { key: 'industries', label: 'Industries', icon: Building },
          { key: 'users', label: 'User Management', icon: Users },
          { key: 'analytics', label: 'National Analytics', icon: BarChart3 },
          { key: 'projects', label: 'All Projects', icon: FolderOpen },
        ];
      
      case 'state_admin':
        return [
          ...baseItems,
          { key: 'districts', label: 'Districts & Blocks', icon: Globe },
          { key: 'approvals', label: 'Approvals', icon: UserCheck },
          { key: 'analytics', label: 'State Analytics', icon: BarChart3 },
          { key: 'projects', label: 'State Projects', icon: FolderOpen },
          { key: 'users', label: 'State Users', icon: Users },
        ];
      
      case 'mentor':
        return [
          ...baseItems,
          { key: 'mentees', label: 'My Mentees', icon: Users },
          { key: 'projects', label: 'My Projects', icon: FolderOpen },
          { key: 'tasks', label: 'Tasks', icon: CheckSquare },
          { key: 'announcements', label: 'Announcements', icon: Bell },
          { key: 'chat', label: 'Messages', icon: MessageCircle },
        ];
      
      case 'mentee':
        return [
          ...baseItems,
          { key: 'projects', label: 'Browse Projects', icon: FolderOpen },
          { key: 'my-projects', label: 'My Projects', icon: Target },
          { key: 'tasks', label: 'My Tasks', icon: CheckSquare },
          { key: 'certificates', label: 'Certificates', icon: Award },
          { key: 'chat', label: 'Messages', icon: MessageCircle },
        ];
      
      case 'reviewer':
        return [
          ...baseItems,
          { key: 'review-queue', label: 'Review Queue', icon: FileText },
          { key: 'reviewed', label: 'Reviewed Projects', icon: CheckSquare },
          { key: 'analytics', label: 'Review Stats', icon: BarChart3 },
        ];
      
      default:
        return baseItems;
    }
  };

  // if (loading) {
  //   console.log({test:loading});
    
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  if (!userData || !userData.localUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Setting up your account...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const { localUser } = userData;
  console.log({localUser});
  
  const navigationItems = getNavigationItems(localUser.role);

  const roleColors: Record<string, string> = {
    mentor: 'blue',
    mentee: 'green',
    reviewer: 'purple',
    state_admin: 'orange',
    super_admin: 'red'
  };

  const roleIcons: Record<string, string> = {
    mentor: '🎓',
    mentee: '🚀',
    reviewer: '📋',
    state_admin: '🏛️',
    super_admin: '👑'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo & User Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {/* <img 
                src="https://mocha-cdn.com/019919f5-097e-7a4c-a5b4-3db644c27839/app-icon.png" 
                alt="Vidya Shakti Yuva" 
                className="w-10 h-10 rounded-lg" 
              /> */}
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Vidya Shakti
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Yuva Platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-2xl">{roleIcons[localUser.role]}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {localUser.first_name} {localUser.last_name}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full bg-${roleColors[localUser.role]}-100 dark:bg-${roleColors[localUser.role]}-900/30 text-${roleColors[localUser.role]}-700 dark:text-${roleColors[localUser.role]}-300`}>
                  {localUser.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onTabChange(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? `bg-${roleColors[localUser.role]}-100 dark:bg-${roleColors[localUser.role]}-900/30 text-${roleColors[localUser.role]}-700 dark:text-${roleColors[localUser.role]}-300`
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {navigationItems.find(item => item.key === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {localUser.first_name}!
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
