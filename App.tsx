

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { View, Word, UserProgress, MasteryLevel, AppSettings, ThemePreference } from './types';
import { getInitialWords } from './services/wordService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LearningSession from './components/LearningSession';
import Achievements from './components/Achievements';
import Settings from './components/Settings';
import UpdateNotification from './components/UpdateNotification';
import { MOCK_ACHIEVEMENTS } from './constants';
import ReminderBanner from './components/ReminderBanner';
import Confetti from './components/Confetti';

const DEFAULT_SETTINGS: AppSettings = {
  themePreference: 'system',
  remindersEnabled: true,
  enableConfetti: true,
  dailyGoal: 20,
};

const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const savedSettings = localStorage.getItem('palabrita_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...DEFAULT_SETTINGS, ...parsed } satisfies AppSettings;
    }
  } catch (error) {
    console.warn('Failed to parse saved settings', error);
  }

  return DEFAULT_SETTINGS;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUpdate, setShowUpdate] = useState<boolean>(false);
  const [updateSW, setUpdateSW] = useState<(() => void) | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const initialSettings = getStoredSettings();
    if (initialSettings.themePreference === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          document.documentElement.setAttribute('data-color-scheme', 'dark');
        }
        return 'dark';
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        document.documentElement.setAttribute('data-color-scheme', 'light');
      }
      return 'light';
    }
    if (typeof document !== 'undefined') {
      const isDark = initialSettings.themePreference === 'dark';
      const nextTheme = isDark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = nextTheme;
      document.documentElement.setAttribute('data-color-scheme', nextTheme);
    }
    return initialSettings.themePreference;
  });
  const [showReminder, setShowReminder] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh: () => {
        setShowUpdate(true);
      },
    });
    setUpdateSW(() => updateSW);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('palabrita_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (prefersDark: boolean) => {
      const nextTheme: 'light' | 'dark' =
        settings.themePreference === 'system'
          ? prefersDark
            ? 'dark'
            : 'light'
          : settings.themePreference;

      setResolvedTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.documentElement.style.colorScheme = nextTheme;
      document.documentElement.setAttribute('data-color-scheme', nextTheme);
    };

    applyTheme(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      if (settings.themePreference === 'system') {
        applyTheme(event.matches);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [settings.themePreference]);
  
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    try {
      const savedProgress = localStorage.getItem('palabrita_progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        const parsedLastSession = parsed.lastSession ? new Date(parsed.lastSession) : new Date();
        const lastSession = Number.isNaN(parsedLastSession.getTime()) ? new Date() : parsedLastSession;

        return {
          ...parsed,
          lastSession,
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
      lastSession: new Date(),
      achievements: new Set(),
    };
  });

  const hoursSinceLastSession = useMemo(() => {
    const diffMs = Date.now() - userProgress.lastSession.getTime();
    return diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
  }, [userProgress.lastSession]);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const masterWords = await getInitialWords();
        const savedWordsJSON = localStorage.getItem('palabrita_words');
        const savedWords = savedWordsJSON ? JSON.parse(savedWordsJSON) : [];

        if (savedWords.length === 0) {
          setWords(masterWords);
        } else {
          const savedWordsMap = new Map(savedWords.map((word: Word) => [word.id, word]));
          const mergedWords = masterWords.map(masterWord =>
            savedWordsMap.has(masterWord.id)
              ? savedWordsMap.get(masterWord.id)!
              : masterWord
          );
          setWords(mergedWords);
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
      localStorage.setItem('palabrita_words', JSON.stringify(words));
    }
  }, [words, isLoading]);

  useEffect(() => {
    localStorage.setItem('palabrita_progress', JSON.stringify({
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!settings.remindersEnabled) {
      setShowReminder(false);
      return;
    }

    const evaluateReminder = () => {
      const now = new Date();
      const diffHours = (now.getTime() - userProgress.lastSession.getTime()) / (1000 * 60 * 60);
      const dismissedString = localStorage.getItem('palabrita_last_reminder_dismissed');
      const dismissedDate = dismissedString ? new Date(dismissedString) : null;
      const dismissedToday = dismissedDate ? dismissedDate.toDateString() === now.toDateString() : false;

      if (diffHours >= 24 && !dismissedToday) {
        setShowReminder(true);

        if ('Notification' in window && Notification.permission === 'granted') {
          const lastPush = localStorage.getItem('palabrita_last_push_reminder');
          const lastPushDate = lastPush ? new Date(lastPush) : null;
          const alreadyPushedToday = lastPushDate ? lastPushDate.toDateString() === now.toDateString() : false;

          if (!alreadyPushedToday) {
            new Notification('Dags att öva spanska!', {
              body: 'Kom tillbaka till Palabrita och repetera några ord.',
              tag: 'palabrita-reminder',
            });
            localStorage.setItem('palabrita_last_push_reminder', now.toISOString());
          }
        }
      } else {
        setShowReminder(false);
      }
    };

    evaluateReminder();
    const interval = window.setInterval(evaluateReminder, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [settings.remindersEnabled, userProgress.lastSession]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (!settings.remindersEnabled) {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, [settings.remindersEnabled]);

  useEffect(() => {
    if (!showCelebration) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const timeout = window.setTimeout(() => setShowCelebration(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [showCelebration]);

  useEffect(() => {
    if (view !== View.Learning) {
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('palabrita_last_reminder_dismissed', new Date().toISOString());
    }
    setShowReminder(false);
  }, [view]);

  const handleThemeChange = useCallback((preference: ThemePreference) => {
    setSettings(prev => ({ ...prev, themePreference: preference }));
  }, []);

  const handleToggleReminders = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, remindersEnabled: enabled }));
  }, []);

  const handleToggleConfetti = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableConfetti: enabled }));
  }, []);

  const handleDailyGoalChange = useCallback((goal: number) => {
    setSettings(prev => ({ ...prev, dailyGoal: goal }));
  }, []);

  const handleDismissReminder = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('palabrita_last_reminder_dismissed', new Date().toISOString());
    }
    setShowReminder(false);
  }, []);

  const startLearning = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('palabrita_last_reminder_dismissed', new Date().toISOString());
    }
    setShowReminder(false);
    setView(View.Learning);
  }, []);

  const recentlyLearnedWords = useMemo(() => {
    try {
        return words
        .filter(word => typeof word.learnedDate === 'string' && word.learnedDate)
        .sort((a, b) => {
            const dateA = new Date(a.learnedDate!).getTime();
            const dateB = new Date(b.learnedDate!).getTime();
            if (isNaN(dateB)) return -1;
            if (isNaN(dateA)) return 1;
            return dateB - dateA;
        })
        .slice(0, 5);
    } catch (error) {
        console.error("Failed to calculate recently learned words:", error);
        return []; // Return empty array on error to prevent app crash
    }
  }, [words]);

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

    const wasPerfect = sessionWords.length > 0 && sessionWords.every(r => r.correct);
    if (settings.enableConfetti && wasPerfect) {
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('palabrita_last_reminder_dismissed', now.toISOString());
    }
    setShowReminder(false);

    if (sessionWords.length > 0) {
        const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        try {
            const activityLog = JSON.parse(localStorage.getItem('palabrita_activity') || '{}');
            activityLog[todayKey] = (activityLog[todayKey] || 0) + sessionWords.length;
            localStorage.setItem('palabrita_activity', JSON.stringify(activityLog));
        } catch (e) {
            console.error("Failed to update activity log", e);
        }
    }

    const updatedWords = words.map(word => {
      const sessionResult = sessionWords.find(sw => sw.wordId === word.id);
      if (!sessionResult) return word;

      let newMasteryLevel = word.masteryLevel;
      let intervalDays = 1;
      let learnedDate = word.learnedDate;

      if (sessionResult.correct) {
        pointsEarned += (word.masteryLevel + 1) * 10;
        newMasteryLevel = Math.min(MasteryLevel.Mastered, word.masteryLevel + 1);

        if (word.masteryLevel === MasteryLevel.New && newMasteryLevel > MasteryLevel.New) {
            learnedDate = now.toISOString();
        }

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

      return { ...word, masteryLevel: newMasteryLevel, nextReviewDate: nextReviewDate.toISOString(), learnedDate };
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
  }, [words, settings.enableConfetti]);

  if (isLoading) {
    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen flex items-center justify-center text-slate-800 dark:text-slate-200">
            <div className="max-w-md mx-auto w-full h-screen bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300/70 dark:shadow-black/40 flex flex-col items-center justify-center">
                <div className="text-xl font-semibold text-slate-600 dark:text-slate-200">Laddar ord...</div>
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
      case View.Settings:
        return (
          <Settings
            settings={settings}
            onThemeChange={handleThemeChange}
            onToggleReminders={handleToggleReminders}
            onToggleConfetti={handleToggleConfetti}
            onDailyGoalChange={handleDailyGoalChange}
          />
        );
      case View.Dashboard:
      default:
        return <Dashboard
                  userProgress={userProgress}
                  words={words}
                  learningQueueSize={learningQueue.length}
                  onStartSession={startLearning}
                  recentlyLearned={recentlyLearnedWords}
                  dailyGoal={settings.dailyGoal}
                />;
    }
  };

    return (
      <div className="bg-white dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100" data-theme={resolvedTheme}>
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen shadow-2xl shadow-slate-300/70 dark:shadow-black/40 flex flex-col">
          <Header userProgress={userProgress} />
          {showCelebration && settings.enableConfetti && <Confetti />}
          <main className="flex-grow p-4 sm:p-6 overflow-y-auto pb-20 space-y-4">
            {showReminder && view === View.Dashboard && (
              <ReminderBanner
                hoursSinceLastSession={hoursSinceLastSession}
                onStartSession={startLearning}
                onDismiss={handleDismissReminder}
              />
            )}
            {renderContent()}
          </main>
        <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 p-2 flex justify-around items-center transform transition-transform duration-300 ${view === View.Learning ? 'translate-y-full' : ''}`}>
            {(Object.keys(View) as Array<keyof typeof View>).map(key => (
                <button key={key} onClick={() => setView(View[key])} className={`p-2 rounded-lg transition-colors ${view === View[key] ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'}`}>
                    {View[key]}
                </button>
            ))}
        </nav>
        {showUpdate && <UpdateNotification onUpdate={() => updateSW?.()} />}
      </div>
    </div>
  );
};

export default App;
