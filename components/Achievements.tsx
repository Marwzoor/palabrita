
import React from 'react';
import type { Achievement, UserProgress } from '../types';
import Card from './common/Card';

interface AchievementsProps {
    data: Achievement[];
    userProgress: UserProgress;
}

const Achievements: React.FC<AchievementsProps> = ({ data, userProgress }) => {
    const unlockedAchievements = userProgress.achievements;

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-6">Dina Troféer</h2>
            <div className="grid grid-cols-2 gap-4">
                {data.map((achievement) => {
                    const isUnlocked = unlockedAchievements.has(achievement.id);
                    return (
                        <Card key={achievement.id} className={`p-4 text-center transition-opacity ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                           <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${isUnlocked ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                                {achievement.icon}
                           </div>
                           <h3 className="font-semibold text-slate-800 dark:text-slate-100">{achievement.title}</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{achievement.description}</p>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Achievements;
