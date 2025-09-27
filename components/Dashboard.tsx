import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { UserProgress, Word } from '../types';
import { MasteryLevel } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { MASTERY_LEVEL_CHART_COLORS, MASTERY_LEVEL_NAMES } from '../constants';

interface DashboardProps {
  userProgress: UserProgress;
  words: Word[];
  learningQueueSize: number;
  onStartSession: () => void;
  recentlyLearned: Word[];
}

const Dashboard: React.FC<DashboardProps> = ({ userProgress, words, learningQueueSize, onStartSession, recentlyLearned }) => {
    
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
        }
        setWeeklyActivity(activityData);
    }, []);

    const totalWords = words.length;
    const learnedWords = words.filter(w => w.masteryLevel > MasteryLevel.New).length;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Välkommen tillbaka!</h2>
                <p className="text-slate-500 mt-1">Redo för dagens lektion?</p>
            </div>
            
            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-800">Dagens Lektion</h3>
                    <p className="text-slate-500 mt-1">{learningQueueSize} ord att repetera.</p>
                    <Button onClick={onStartSession} disabled={learningQueueSize === 0} className="w-full mt-4">
                        {learningQueueSize > 0 ? 'Starta Lektion' : 'Inga ord att repetera'}
                    </Button>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h3 className="font-semibold text-lg text-slate-800">Dina Framsteg</h3>
                    <div className="flex justify-between items-center mt-4 text-sm">
                        <span>Lärda ord</span>
                        <span className="font-semibold">{learnedWords} / {totalWords}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(learnedWords / totalWords) * 100}%` }}></div>
                    </div>
                </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <div className="p-6">
                        <h3 className="font-semibold text-lg text-slate-800">Bemästringsgrad</h3>
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
                        <h3 className="font-semibold text-lg text-slate-800">Veckoaktivitet</h3>
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
                    <h3 className="font-semibold text-lg text-slate-800">Nyligen Lärda Ord</h3>
                    {recentlyLearned.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                            {recentlyLearned.map(word => (
                                <li key={word.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-slate-50">
                                    <span className="font-medium text-slate-700">{word.spanish}</span>
                                    <span className="text-slate-500">{word.swedish}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 mt-2 text-sm">Du har inte lärt dig några nya ord än. Starta en lektion för att komma igång!</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;