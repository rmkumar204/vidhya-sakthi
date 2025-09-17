import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RoleCard as RoleCardType, UserRoleType } from '@/shared/types';
import RoleCard from '@/react-app/components/RoleCard';
import ThemeToggle from '@/react-app/components/ThemeToggle';

const roleCards: RoleCardType[] = [
  {
    role: 'mentor',
    title: 'Mentor',
    description: 'Share your knowledge and experience with aspiring youth. Guide mentees through projects and help shape their future.',
    icon: '🎓',
    color: 'blue',
    gradient: '#3B82F6, #1E40AF'
  },
  {
    role: 'mentee',
    title: 'Mentee',
    description: 'Learn from experienced professionals. Join projects, gain practical experience, and accelerate your career growth.',
    icon: '🌱',
    color: 'green',
    gradient: '#10B981, #047857'
  },
  {
    role: 'reviewer',
    title: 'Reviewer',
    description: 'Evaluate projects and provide valuable feedback. Help maintain quality standards and support the learning process.',
    icon: '📋',
    color: 'purple',
    gradient: '#8B5CF6, #6D28D9'
  }
];

export default function RoleSelection() {
  // Handle role selection logic here
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRoleType) => {
    navigate(`/login/${role}`);
  };

  const handleAdminAccess = () => {
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      <ThemeToggle />
      
      {/* Logo */}
      <div className="absolute top-8 left-8 z-40 animate-fade-in">
        <img 
          src="https://mocha-cdn.com/019919f5-097e-7a4c-a5b4-3db644c27839/app-icon.png" 
          alt="Vidya Shakti Yuva Logo" 
          className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg" 
        />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Vidya Shakti Yuva
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Connecting mentors and mentees across India
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-4">
            Empowering youth through personalized mentoring and hands-on learning
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {roleCards.map((card, index) => (
            <div
              key={card.role}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <RoleCard
                card={card}
                onClick={() => handleRoleSelect(card.role)}
              />
            </div>
          ))}
        </div>

        {/* Admin Access */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <button
            onClick={handleAdminAccess}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 underline underline-offset-4 hover:underline-offset-8"
          >
            For administrator access, click here
          </button>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl animate-float-slow"></div>
      </div>
    </div>
  );
}
