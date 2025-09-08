import { ArrowRight } from 'lucide-react';
import { RoleCard as RoleCardType } from '@/shared/types';

interface RoleCardProps {
  card: RoleCardType;
  onClick: () => void;
  className?: string;
}

export default function RoleCard({ card, onClick, className = '' }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${card.gradient})`,
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl">{card.icon}</div>
          <ArrowRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
        <p className="text-white/90 text-sm leading-relaxed mb-6">{card.description}</p>
        
        {/* Click to Login Button - appears on hover */}
        <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl">
            Click to Login
          </button>
        </div>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}
