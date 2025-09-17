import StatCard from '@/react-app/components/StatCard';
import { BookOpenIcon, CheckIcon, UsersIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const menteeStats = [
  { title: 'Topics Subscribed', value: '0', change: 'Start exploring', changeType: 'neutral' as const, icon: BookOpenIcon, iconColor: 'bg-blue-500' },
  { title: 'Ongoing Topics', value: '0', change: 'Pick one to start', changeType: 'neutral' as const, icon: UsersIcon, iconColor: 'bg-purple-500' },
  { title: 'Tasks Completed', value: '8', change: '+2 this week', changeType: 'positive' as const, icon: CheckIcon, iconColor: 'bg-emerald-500' },
  { title: 'Certificates', value: '2', change: 'Great progress', changeType: 'positive' as const, icon: AcademicCapIcon, iconColor: 'bg-rose-500' },
];

const sampleCards = [
  { tag: 'Video', title: 'Mastering React & TypeScript', author: 'Alicia Keys', duration: '45 min' },
  { tag: 'Document', title: 'Node.js Performance Tuning', author: 'Alicia Keys', duration: '30 min' },
  { tag: 'Audio', title: 'The Agile Product Roadmap', author: 'Ben Carter', duration: '25 min' },
];

export default function MenteeDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {menteeStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Explore Topics</h3>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm" placeholder="Search by topic, skill, or mentor" />
            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
                <option>All Languages</option>
                <option>English</option>
                <option>Tamil</option>
                <option>Spanish</option>
            </select>
            <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm">
                <option>All Media</option>
                <option>Video</option>
                <option>Audio</option>
                </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sampleCards.map((c, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              

                {/* Image section */}
  <img
    src="https://picsum.photos/id/2/400/225" // make sure your object `c` has an `imageUrl`
    alt={c.title}
    className="h-36 w-full object-cover"
  />

  {/* Content section */}
  <div className="p-4 space-y-2">
    <span className="inline-flex text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
      {c.tag}
    </span>
    <h4 className="font-semibold text-gray-900 dark:text-white">{c.title}</h4>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>{c.author}</span>
      <span>{c.duration}</span>
    </div>
    <button className="mt-2 w-full rounded-md bg-blue-500 text-white py-2 text-sm">
      Connect with Mentor
    </button>
  </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


