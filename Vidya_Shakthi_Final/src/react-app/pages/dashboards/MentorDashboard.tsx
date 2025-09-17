import { UsersIcon, FolderIcon, CheckIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import StatCard from '@/react-app/components/StatCard';

const mentorStats = [
  { title: 'Projects Uploaded', value: '2', change: '+1 this week', changeType: 'positive' as const, icon: FolderIcon, iconColor: 'bg-blue-500' },
  { title: 'Mentees Trained', value: '1', change: 'Steady', changeType: 'neutral' as const, icon: UsersIcon, iconColor: 'bg-purple-500' },
  { title: 'Hours This Week', value: '12', change: '+3h vs last week', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-orange-500' },
  { title: 'Live Sessions', value: '1', change: 'Schedule more', changeType: 'neutral' as const, icon: AcademicCapIcon, iconColor: 'bg-rose-500' },
];

export default function MentorDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mentor Overview</h1>
        <p className="text-gray-500 dark:text-gray-300">Quick snapshot of your impact and upcoming actions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {mentorStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggested Mentees</h3>
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            No new suggestions. We’ll notify you when good matches appear.
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Requests</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              {/* <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Grace Harris</p>
                  <p className="text-xs text-gray-500">Wants to connect</p>
                </div>
              </div> */}
              <div className="flex items-center gap-3">
  {/* Profile image */}
  <img
    src="https://picsum.photos/id/211/200/200" // replace with dynamic value
    alt="Profile"
    className="h-10 w-10 rounded-full object-cover"
  />

  {/* Text */}
  <div>
    <p className="font-medium text-gray-900 dark:text-white">Grace Harris</p>
    <p className="text-xs text-gray-500">Wants to connect</p>
  </div>
</div>

              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-md bg-emerald-500 text-white text-sm">Accept</button>
                <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm">Decline</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


