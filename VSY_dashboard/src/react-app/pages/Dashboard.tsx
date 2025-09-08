import { useState } from 'react';
import DashboardLayout from '@/react-app/components/DashboardLayout';
import OverviewDashboard from '@/react-app/components/dashboards/OverviewDashboard';
import ChatModule from '@/react-app/components/chat/ChatModule';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState<any>({
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

  const renderContent = () => {
    if (!userData?.localUser) {
      console.log("no user details");
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const { localUser } = userData;

    console.log("Active tab info -----------------",activeTab);

    switch (activeTab) {
      case 'overview':
        console.log({in: activeTab});
        
        return (
          <OverviewDashboard 
            userRole={localUser.role} 
            userId={localUser.id} 
          />
        );
      
      case 'chat':
        return (
          <ChatModule 
            userId={localUser.id} 
            userRole={localUser.role} 
          />
        );

      case 'projects':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Projects
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-500 dark:text-gray-400">
                Project management coming soon...
              </p>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tasks
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-500 dark:text-gray-400">
                Task management coming soon...
              </p>
            </div>
          </div>
        );

      case 'mentees':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              My Mentees
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-500 dark:text-gray-400">
                Mentee management coming soon...
              </p>
            </div>
          </div>
        );

      case 'certificates':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Certificates
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-500 dark:text-gray-400">
                Certificate management coming soon...
              </p>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Analytics
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-500 dark:text-gray-400">
                Advanced analytics coming soon...
              </p>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Management
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👤</div>
              <p className="text-gray-500 dark:text-gray-400">
                User management interface coming soon...
              </p>
            </div>
          </div>
        );

      case 'approvals':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Approvals
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-gray-500 dark:text-gray-400">
                Approval workflow coming soon...
              </p>
            </div>
          </div>
        );

      case 'announcements':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Announcements
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📢</div>
              <p className="text-gray-500 dark:text-gray-400">
                Announcement system coming soon...
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h3>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚧</div>
              <p className="text-gray-500 dark:text-gray-400">
                This feature is under development...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onUserDataLoad={setUserData}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
