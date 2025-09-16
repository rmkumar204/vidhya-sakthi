import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '@/react-app/contexts/ThemeContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`h-screen ${isDark ? 'dark' : ''}`}>
      <div className="h-screen flex bg-white dark:bg-gray-900 transition-colors duration-200">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Main content */}
        <div className="flex flex-col flex-1">
          <Header setSidebarOpen={setSidebarOpen} />
          
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
            <div className="p-3 sm:p-4 lg:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
