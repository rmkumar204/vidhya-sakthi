import { useNavigate } from 'react-router';
import { RoleCard as RoleCardType, UserRoleType } from '@/shared/types';
import RoleCard from '@/react-app/components/RoleCard';
import ThemeToggle from '@/react-app/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

const adminRoleCards: RoleCardType[] = [
  {
    role: 'state_admin',
    title: 'State Administrator',
    description: 'Manage users and projects within your state. Approve mentors, mentees, and oversee regional operations.',
    icon: '🏛️',
    color: 'orange',
    gradient: '#F59E0B, #D97706'
  },
  {
    role: 'super_admin',
    title: 'Super Administrator',
    description: 'Complete system access across all regions. Configure system settings, manage all users and maintain platform integrity.',
    icon: '👑',
    color: 'red',
    gradient: '#EF4444, #DC2626'
  }
];

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRoleType) => {
    navigate(`/login/${role}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900 transition-colors duration-500">
      <ThemeToggle />
      
      {/* Logo */}
      <div className="absolute top-8 left-20 z-40 animate-fade-in">
        <img 
          src="https://mocha-cdn.com/019919f5-097e-7a4c-a5b4-3db644c27839/app-icon.png" 
          alt="Vidya Shakti Yuva Logo" 
          className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-lg" 
        />
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Administrator Access
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Select your administrative role to access the management dashboard
          </p>
        </div>

        {/* Admin Role Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {adminRoleCards.map((card, index) => (
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
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-red-300/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>
    </div>
  );
}
