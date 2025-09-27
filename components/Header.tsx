
import React from 'react';
import type { UserProgress } from '../types';
import Icon from './common/Icon';

interface HeaderProps {
  userProgress: UserProgress;
}

const StatItem: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center space-x-2">
        <div className="text-indigo-500">{icon}</div>
        <div>
            <div className="font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    </div>
);

const Header: React.FC<HeaderProps> = ({ userProgress }) => {
  return (
    <header className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">Palabrita</h1>
        <div className="flex items-center space-x-4">
            <StatItem icon={<Icon name="fire" />} value={userProgress.streak} label="Streak" />
            <StatItem icon={<Icon name="star" />} value={userProgress.points} label="Poäng" />
            <StatItem icon={<Icon name="level" />} value={userProgress.level} label="Nivå" />
        </div>
      </div>
    </header>
  );
};

export default Header;
