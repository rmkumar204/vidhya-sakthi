import { useState, useEffect } from 'react';
import { 
  Users, 
  FolderOpen, 
  CheckSquare, 
  Award, 
  TrendingUp,
  MessageCircle,
  Bell
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  completedTasks: number;
  certificates: number;
  monthlyGrowth: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  time: string;
  user?: string;
}

interface OverviewDashboardProps {
  userRole: string;
  userId: number;
}

export default function OverviewDashboard({ userRole, userId }: OverviewDashboardProps) {
 console.log({ userRole, userId });
 
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate API call with sample data
    const sampleStats: DashboardStats = {
      totalUsers: 1200,
      totalProjects: 85,
      completedTasks: 340,
      certificates: 220,
      monthlyGrowth: 12,
      recentActivity: [
        { id: 1, type: 'mentee', description: 'New mentee joined project "Web Development Basics"', time: '2 hours ago' },
        { id: 2, type: 'task', description: 'Task "Create wireframes" was completed', time: '4 hours ago' },
        { id: 3, type: 'project', description: 'New project "Mobile App Development" was approved', time: '1 day ago' },
        { id: 4, type: 'certificate', description: 'Certificate issued for project completion', time: '2 days ago' },
      ]
    };

    setTimeout(() => {
      setStats(sampleStats);
      // setLoading(false);
    }, 800); // small delay to mimic loading
  }, [userRole, userId]);

  // useEffect(() => {
  //   fetchDashboardStats();
  // }, [userRole, userId]);

  // const fetchDashboardStats = async () => {
  //   try {
  //     const response = await fetch(`/api/dashboard/overview?role=${userRole}`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setStats(data);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch dashboard stats:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const getStatCards = () => {
    const baseCards = [
      {
        title: 'Total Users',
        value: stats?.totalUsers || 0,
        icon: Users,
        color: 'blue',
        change: '+12%'
      },
      {
        title: 'Active Projects',
        value: stats?.totalProjects || 0,
        icon: FolderOpen,
        color: 'green',
        change: '+8%'
      },
      {
        title: 'Completed Tasks',
        value: stats?.completedTasks || 0,
        icon: CheckSquare,
        color: 'purple',
        change: '+15%'
      },
      {
        title: 'Certificates Issued',
        value: stats?.certificates || 0,
        icon: Award,
        color: 'orange',
        change: '+5%'
      }
    ];

    // Customize cards based on role
    switch (userRole) {
      case 'mentor':
        return [
          { ...baseCards[0], title: 'My Mentees' },
          { ...baseCards[1], title: 'My Projects' },
          { ...baseCards[2], title: 'Tasks Created' },
          { ...baseCards[3], title: 'Mentee Certificates' }
        ];
      case 'mentee':
        return [
          { ...baseCards[0], title: 'Available Mentors' },
          { ...baseCards[1], title: 'Joined Projects' },
          { ...baseCards[2], title: 'My Tasks' },
          { ...baseCards[3], title: 'My Certificates' }
        ];
      case 'reviewer':
        return [
          { ...baseCards[0], title: 'Projects to Review' },
          { ...baseCards[1], title: 'Reviewed Projects' },
          { ...baseCards[2], title: 'Pending Reviews' },
          { ...baseCards[3], title: 'Reviews Completed' }
        ];
      default:
        return baseCards;
    }
  };

  const sampleChartData = [
    { month: 'Jan', projects: 20, users: 150 },
    { month: 'Feb', projects: 25, users: 180 },
    { month: 'Mar', projects: 30, users: 220 },
    { month: 'Apr', projects: 35, users: 250 },
    { month: 'May', projects: 42, users: 290 },
    { month: 'Jun', projects: 48, users: 320 }
  ];

  const pieData = [
    { name: 'Mentors', value: 45, color: '#3B82F6' },
    { name: 'Mentees', value: 40, color: '#10B981' },
    { name: 'Reviewers', value: 15, color: '#8B5CF6' }
  ];

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to your {userRole.replace('_', ' ')} dashboard!
        </h2>
        <p className="opacity-90">
          Here's what's happening in your Vidya Shakti Yuva journey today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className={`text-sm mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
                    {card.change} from last month
                  </p>
                </div>
                <div className={`p-3 bg-${card.color}-100 dark:bg-${card.color}-900/30 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Growth Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sampleChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="projects" fill="#3B82F6" name="Projects" />
              <Bar dataKey="users" fill="#10B981" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {stats?.recentActivity?.length ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            // Sample activity data
            [
              { id: 1, description: 'New mentee joined project "Web Development Basics"', time: '2 hours ago' },
              { id: 2, description: 'Task "Create wireframes" was completed', time: '4 hours ago' },
              { id: 3, description: 'New project "Mobile App Development" was approved', time: '1 day ago' },
              { id: 4, description: 'Certificate issued for project completion', time: '2 days ago' }
            ].map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userRole === 'mentor' && (
            <>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Create New Project</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Message Mentees</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Create Announcement</span>
              </button>
            </>
          )}
          {userRole === 'mentee' && (
            <>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Browse Projects</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">View My Tasks</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Award className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">My Certificates</span>
              </button>
            </>
          )}
          {['state_admin', 'super_admin'].includes(userRole) && (
            <>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Users</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</span>
              </button>
              <button className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FolderOpen className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Review Projects</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
