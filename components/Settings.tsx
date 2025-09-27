import React from 'react';
import Card from './common/Card';
import type { AppSettings, ThemePreference } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onThemeChange: (preference: ThemePreference) => void;
  onToggleReminders: (enabled: boolean) => void;
  onToggleConfetti: (enabled: boolean) => void;
  onDailyGoalChange: (goal: number) => void;
}

const themeOptions: { label: string; value: ThemePreference; description: string }[] = [
  { label: 'System', value: 'system', description: 'Följer automatiskt systemets ljusa eller mörka läge.' },
  { label: 'Ljust', value: 'light', description: 'Alltid ljust läge oavsett systeminställning.' },
  { label: 'Mörkt', value: 'dark', description: 'Alltid mörkt läge oavsett systeminställning.' },
];

const Settings: React.FC<SettingsProps> = ({
  settings,
  onThemeChange,
  onToggleReminders,
  onToggleConfetti,
  onDailyGoalChange,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Utseende</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Välj hur Palabrita ska följa systemets mörkerläge eller använda ett eget.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const isActive = settings.themePreference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onThemeChange(option.value)}
                  className={`text-left p-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-400'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:hover:border-indigo-500/80 dark:hover:bg-indigo-500/5'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Studieplan</h2>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="daily-goal" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Dagligt mål
              </label>
              <span className="text-sm text-slate-500 dark:text-slate-400">{settings.dailyGoal} ord</span>
            </div>
            <input
              id="daily-goal"
              type="range"
              min={5}
              max={50}
              step={5}
              value={settings.dailyGoal}
              onChange={(event) => onDailyGoalChange(Number(event.target.value))}
              className="w-full mt-3 accent-indigo-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hur många ord vill du repetera varje dag?
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Motivation</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">Påminnelser</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Få en vänlig knuff om du inte studerat på ett tag.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.remindersEnabled}
                onChange={(event) => onToggleReminders(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">Fira framgångar</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visa animationer när du klarar en lektion perfekt.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableConfetti}
                onChange={(event) => onToggleConfetti(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
