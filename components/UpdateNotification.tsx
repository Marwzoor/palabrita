import React from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-20 right-4 bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/30 rounded-lg p-4 flex items-center space-x-4 z-50">
      <p className="text-slate-700 dark:text-slate-200">En ny version finns tillgänglig.</p>
      <button
        onClick={onUpdate}
        className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
      >
        Ladda om
      </button>
    </div>
  );
};

export default UpdateNotification;
