import React from 'react';
import Card from './common/Card';
import Button from './common/Button';

interface ReminderBannerProps {
  hoursSinceLastSession: number;
  onStartSession: () => void;
  onDismiss: () => void;
}

const ReminderBanner: React.FC<ReminderBannerProps> = ({ hoursSinceLastSession, onStartSession, onDismiss }) => {
  const days = Math.floor(hoursSinceLastSession / 24);
  const hours = Math.round(hoursSinceLastSession % 24);

  const message = days > 0
    ? `Det var ${days} ${days === 1 ? 'dag' : 'dagar'} sedan du senast repeterade.`
    : `Det var ${hours} tim${hours === 1 ? 'me' : 'mar'} sedan du övade sist.`;

  return (
    <Card>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Dags att repetera</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message} Ska vi ta några ord nu?</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Kanske senare
          </button>
          <Button onClick={onStartSession}>
            Starta lektion
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReminderBanner;
