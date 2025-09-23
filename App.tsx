

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Word, UserProgress, MasteryLevel } from './types';
import { getInitialWords } from './services/wordService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LearningSession from './components/LearningSession';
import Achievements from './components/Achievements';
import { MOCK_ACHIEVEMENTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    try {
      const savedProgress = localStorage.getItem('linguaflow_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        return {
          ...parsed,
          lastSession: new Date(parsed.lastSession),
          achievements: new Set(parsed.achievements || []), // Convert stored array back to a Set
        };
      }
    } catch (error) {
      // Fallback to default
    }
    return {
      points: 0,
      level: 1,
      streak: 0,
      lastSession: new Date(0),
      achievements: new Set(),
    };
  });

  useEffect(() => {
    const loadWords = async () => {
      try {
        const savedWords = localStorage.getItem('linguaflow_words');
        const parsedWords = savedWords ? JSON.parse(savedWords) : [];
        if (parsedWords.length > 0) {
          setWords(parsedWords);
        } else {
          const initialWords = await getInitialWords();
          setWords(initialWords);
        }
      } catch (error) {
        console.error("Failed to load words, fetching from source:", error);
        const initialWords = await getInitialWords();
        setWords(initialWords);
      } finally {
        setIsLoading(false);
      }
    };
    loadWords();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('linguaflow_words', JSON.stringify(words));
    }
  }, [words, isLoading]);

  useEffect(() => {
    localStorage.setItem('linguaflow_progress', JSON.stringify({
      ...userProgress,
      lastSession: userProgress.lastSession.toISOString(),
      achievements: Array.from(userProgress.achievements), // Convert Set to array for JSON
    }));
  }, [userProgress]);

  useEffect(() => {
    const today = new Date();
    const lastSession = userProgress.lastSession;
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((today.getTime() - lastSession.getTime()) / oneDay));

    if (diffDays > 1 && today.toDateString() !== lastSession.toDateString()) {
      setUserProgress(prev => ({ ...prev, streak: 0 }));
    }
  }, []);

  const learningQueue = useMemo(() => {
    if (isLoading) return [];
    const now = new Date();
    const reviewWords = words.filter(word => new Date(word.nextReviewDate) <= now && word.masteryLevel > MasteryLevel.New);
    const newWords = words.filter(word => word.masteryLevel === MasteryLevel.New);
    return [...reviewWords, ...newWords.slice(0, 10 - reviewWords.length)].slice(0, 10);
  }, [words, isLoading]);

  const handleSessionComplete = useCallback((sessionWords: { wordId: string; correct: boolean }[]) => {
    let pointsEarned = 0;
    const now = new Date();
    
    if (sessionWords.length > 0) {
        const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        try {
            const activityLog = JSON.parse(localStorage.getItem('linguaflow_activity') || '{}');
            activityLog[todayKey] = (activityLog[todayKey] || 0) + sessionWords.length;
            localStorage.setItem('linguaflow_activity', JSON.stringify(activityLog));
        } catch (e) {
            console.error("Failed to update activity log", e);
        }
    }

    const updatedWords = words.map(word => {
      const sessionResult = sessionWords.find(sw => sw.wordId === word.id);
      if (!sessionResult) return word;

      let newMasteryLevel = word.masteryLevel;
      let intervalDays = 1;

      if (sessionResult.correct) {
        pointsEarned += (word.masteryLevel + 1) * 10;
        newMasteryLevel = Math.min(MasteryLevel.Mastered, word.masteryLevel + 1);
        switch (newMasteryLevel) {
          case MasteryLevel.Learning: intervalDays = 1; break;
          case MasteryLevel.Familiar: intervalDays = 3; break;
          case MasteryLevel.Confident: intervalDays = 7; break;
          case MasteryLevel.Mastered: intervalDays = 30; break;
        }
      } else {
        if (word.masteryLevel === MasteryLevel.New) {
          newMasteryLevel = MasteryLevel.New;
        } else {
          newMasteryLevel = Math.max(MasteryLevel.Learning, word.masteryLevel - 1);
        }
        intervalDays = 1;
      }
      
      const nextReviewDate = new Date();
      nextReviewDate.setDate(now.getDate() + intervalDays);

      return { ...word, masteryLevel: newMasteryLevel, nextReviewDate: nextReviewDate.toISOString() };
    });

    setWords(updatedWords);
    
    setUserProgress(prev => {
        const newPoints = prev.points + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        const todayStr = now.toDateString();
        const lastSessionStr = prev.lastSession.toDateString();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        let newStreak = prev.streak;
        if (todayStr !== lastSessionStr) {
           if (lastSessionStr === yesterday.toDateString()) {
               newStreak += 1;
           } else {
               newStreak = 1;
           }
        }

        const newAchievements = new Set(prev.achievements);

        // Nybörjare: Lär dig dina första 10 ord.
        if (updatedWords.filter(w => w.masteryLevel > MasteryLevel.New).length >= 10) {
            newAchievements.add('10_words');
        }

        // Ordsmed: Bemästra 100 ord.
        if (updatedWords.filter(w => w.masteryLevel === MasteryLevel.Mastered).length >= 100) {
            newAchievements.add('100_words');
        }

        // Ihärdig: Håll en streak i 7 dagar.
        if (newStreak >= 7) {
            newAchievements.add('7_day_streak');
        }

        // Perfektionist: Avsluta en lektion med alla rätt.
        if (sessionWords.length > 0 && sessionWords.every(r => r.correct)) {
            newAchievements.add('perfect_session');
        }
        
        return {
          points: newPoints,
          level: newLevel,
          streak: newStreak,
          lastSession: now,
          achievements: newAchievements,
        };
    });

    setView(View.Dashboard);
  }, [words]);

  if (isLoading) {
    return (
        <div className="bg-slate-50 min-h-screen flex items-center justify-center">
            <div className="max-w-md mx-auto w-full h-screen bg-white shadow-2xl shadow-slate-300 flex flex-col items-center justify-center">
                <div className="text-xl font-semibold text-slate-600">Laddar ord...</div>
            </div>
        </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case View.Learning:
        return <LearningSession words={learningQueue} onSessionComplete={handleSessionComplete} />;
      case View.Achievements:
        return <Achievements data={MOCK_ACHIEVEMENTS} userProgress={userProgress} />;
      case View.Dashboard:
      default:
        return <Dashboard 
                  userProgress={userProgress} 
                  words={words}
                  learningQueueSize={learningQueue.length}
                  onStartSession={() => setView(View.Learning)}
                />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl shadow-slate-300 flex flex-col">
        <Header userProgress={userProgress} />
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
          {renderContent()}
        </main>
        <nav className="border-t border-slate-200 bg-white p-2 flex justify-around">
            {(Object.keys(View) as Array<keyof typeof View>).map(key => (
                <button key={key} onClick={() => setView(View[key])} className={`p-2 rounded-lg transition-colors ${view === View[key] ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {View[key]}
                </button>
            ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
