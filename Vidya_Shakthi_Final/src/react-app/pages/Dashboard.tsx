import { useAuth } from '../hooks/useAuth';
import MentorDashboard from './dashboards/MentorDashboard.tsx';
import MenteeDashboard from './dashboards/MenteeDashboard.tsx';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'mentee') {
    return <MenteeDashboard />;
  }
  // default to mentor-style dashboard for mentors and other roles for now
  return <MentorDashboard />;
}
