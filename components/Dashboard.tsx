import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { UserProgress, Word } from '../types';
import { MasteryLevel } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import ProgressBar from './common/ProgressBar';
import { MASTERY_LEVEL_CHART_COLORS, MASTERY_LEVEL_NAMES } from '../constants';

interface DashboardProps {
  userProgress: UserProgress;
  words: Word[];
  learningQueueSize: number;
  onStartSession: () => void;
  recentlyLearned: Word[];
  dailyGoal: number;
}

const Dashboard: React.FC<DashboardProps> = ({ userProgress, words, learningQueueSize, onStartSession, recentlyLearned, dailyGoal }) => {
    
    const masteryData = Object.keys(MasteryLevel)
        .filter(key => !isNaN(Number(key)))
        .map(key => {
            const level = Number(key) as MasteryLevel;
            return {
                name: MASTERY_LEVEL_NAMES[level],
                level: level,
                value: words.filter(w => w.masteryLevel === level).length,
            };
        })
        .filter(item => item.value > 0);

    const [weeklyActivity, setWeeklyActivity] = useState<{name: string, ord: number}[]>([]);
    const [todayStudied, setTodayStudied] = useState(0);

    useEffect(() => {
        const activityLog = JSON.parse(localStorage.getItem('palabrita_activity') || '{}');
        const activityData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' });
            const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');

            const key = date.toISOString().split('T')[0];

            activityData.push({
                name: capitalizedDayName,
                ord: activityLog[key] || 0,
            });

            if (i === 0) {
                setTodayStudied(activityLog[key] || 0);
            }
        }
        setWeeklyActivity(activityData);
    }, []);

    const totalWords = words.length;
    const learnedWords = words.filter(w => w.masteryLevel > MasteryLevel.New).length;

    const dailyGoalProgress = dailyGoal > 0 ? Math.min(100, (todayStudied / dailyGoal) * 100) : 0;
    const remainingWords = Math.max(dailyGoal - todayStudied, 0);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Välkommen tillbaka!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Redo för dagens lektion?</p>
            </div>

            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Dagens lektion</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{learningQueueSize} ord att repetera.</p>
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Dagsmål</span>
                            <span>{Math.min(todayStudied, dailyGoal)} / {dailyGoal} ord</span>
                        </div>
                        <ProgressBar progress={dailyGoalProgress} />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {remainingWords > 0 ? `${remainingWords} ord kvar till målet.` : 'Målet för dagen är uppnått!'}
                        </p>
                    </div>
                    <Button
                        onClick={onStartSession}
                        disabled={learningQueueSize === 0}
                        className="w-full mt-4 dark:bg-pink-500 dark:hover:bg-pink-400 dark:focus:ring-pink-400"
                    >
                        {learningQueueSize > 0 ? 'Starta lektion' : 'Inga ord att repetera'}
                    </Button>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Dina framsteg</h3>
                    <div className="flex justify-between items-center mt-4 text-sm text-slate-600 dark:text-slate-300">
                        <span>Ord du kan</span>
                        <span className="font-semibold">{learnedWords} / {totalWords}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(learnedWords / totalWords) * 100}%` }}></div>
                    </div>
                </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Bemästringsgrad</h3>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={masteryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {masteryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={MASTERY_LEVEL_CHART_COLORS[entry.level]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Veckoaktivitet</h3>
                         <div style={{ width: '100%', height: 200 }}>
                             <ResponsiveContainer>
                                <BarChart data={weeklyActivity} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip wrapperClassName="!bg-white !border-slate-200 !rounded-lg !shadow-lg" />
                                    <Bar dataKey="ord" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Nyligen lärda ord</h3>
                    {recentlyLearned.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                            {recentlyLearned.map(word => (
                                <li key={word.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50 dark:bg-slate-800/70">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{word.spanish}</span>
                                    <span className="text-slate-500 dark:text-slate-400">{word.swedish}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Du har inte lärt dig några nya ord än. Starta en lektion för att komma igång!</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;