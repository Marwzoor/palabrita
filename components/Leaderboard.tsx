
import React from 'react';
import type { LeaderboardEntry } from '../types';
import Card from './common/Card';
import Icon from './common/Icon';

interface LeaderboardProps {
    data: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Icon name="trophy" className="text-yellow-400" />;
        if (rank === 2) return <Icon name="trophy" className="text-slate-400" />;
        if (rank === 3) return <Icon name="trophy" className="text-amber-600" />;
        return <span className="font-bold text-slate-400 text-sm w-6 text-center">{rank}</span>;
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Topplista</h2>
            <Card>
                <ul className="divide-y divide-slate-200">
                    {data.map((entry) => (
                        <li key={entry.rank} className={`p-4 flex items-center space-x-4 ${entry.isUser ? 'bg-indigo-50' : ''}`}>
                            <div className="flex-shrink-0 w-6 flex justify-center">{getRankIcon(entry.rank)}</div>
                            <div className="flex-1">
                                <p className={`font-semibold ${entry.isUser ? 'text-indigo-700' : 'text-slate-800'}`}>{entry.name}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${entry.isUser ? 'text-indigo-700' : 'text-slate-800'}`}>{entry.points.toLocaleString('sv-SE')}</p>
                                <p className="text-xs text-slate-500">poäng</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

export default Leaderboard;
