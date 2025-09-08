import { 
  UsersIcon, 
  FolderIcon, 
  CheckIcon, 
  AcademicCapIcon 
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/react-app/components/StatCard';
import { useAuth } from '@/react-app/contexts/AuthContext';

const mentorStats = [
  { title: 'My Mentees', value: '1200', change: '+12% from last month', changeType: 'positive' as const, icon: UsersIcon, iconColor: 'bg-blue-500' },
  { title: 'My Projects', value: '85', change: '+8% from last month', changeType: 'positive' as const, icon: FolderIcon, iconColor: 'bg-green-500' },
  { title: 'Tasks Created', value: '340', change: '+15% from last month', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-purple-500' },
  { title: 'Mentee Certificates', value: '220', change: '+5% from last month', changeType: 'positive' as const, icon: AcademicCapIcon, iconColor: 'bg-orange-500' },
];

const menteeStats = [
  { title: 'Enrolled Projects', value: '3', change: '+1 this month', changeType: 'positive' as const, icon: FolderIcon, iconColor: 'bg-green-500' },
  { title: 'Completed Tasks', value: '24', change: '+6 this week', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-blue-500' },
  { title: 'Active Mentors', value: '2', change: 'No change', changeType: 'neutral' as const, icon: UsersIcon, iconColor: 'bg-purple-500' },
  { title: 'Certificates Earned', value: '5', change: '+2 this month', changeType: 'positive' as const, icon: AcademicCapIcon, iconColor: 'bg-orange-500' },
];

const reviewerStats = [
  { title: 'Projects to Review', value: '12', change: '+3 this week', changeType: 'positive' as const, icon: FolderIcon, iconColor: 'bg-blue-500' },
  { title: 'Reviews Completed', value: '48', change: '+8 this month', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-green-500' },
  { title: 'Pending Comments', value: '6', change: '-2 from yesterday', changeType: 'positive' as const, icon: UsersIcon, iconColor: 'bg-purple-500' },
  { title: 'Total Reviews', value: '156', change: '+12% this quarter', changeType: 'positive' as const, icon: AcademicCapIcon, iconColor: 'bg-orange-500' },
];

const growthData = [
  { month: 'Jan', mentors: 25, mentees: 150 },
  { month: 'Feb', mentors: 35, mentees: 180 },
  { month: 'Mar', mentors: 45, mentees: 220 },
  { month: 'Apr', mentors: 55, mentees: 250 },
  { month: 'May', mentors: 65, mentees: 300 },
  { month: 'Jun', mentors: 75, mentees: 320 },
];

const pieData = [
  { name: 'Mentors', value: 45, color: '#3B82F6' },
  { name: 'Mentees', value: 40, color: '#10B981' },
  { name: 'Reviewers', value: 15, color: '#8B5CF6' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const getStatsForRole = () => {
    switch (user?.role) {
      case 'mentee':
        return menteeStats;
      case 'reviewer':
        return reviewerStats;
      default:
        return mentorStats;
    }
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'mentee':
        return 'Welcome to your learning dashboard!';
      case 'reviewer':
        return 'Welcome to your review dashboard!';
      default:
        return 'Welcome to your mentor dashboard!';
    }
  };

  const getDashboardSubtitle = () => {
    switch (user?.role) {
      case 'mentee':
        return "Here's your learning progress and upcoming tasks.";
      case 'reviewer':
        return "Here are the projects awaiting your review.";
      default:
        return "Here's what's happening in your Vidya Shakti Yuva journey today.";
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{getDashboardTitle()}</h1>
        <p className="text-blue-100">{getDashboardSubtitle()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Growth Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-sm" />
              <YAxis className="text-sm" />
              <Bar dataKey="mentees" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mentors" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
