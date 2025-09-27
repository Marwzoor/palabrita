
import React, { useState } from 'react';
import type { Word } from '../types';
import Icon from './common/Icon';

interface FlashcardProps {
  word: Word;
  onAnswer: (correct: boolean) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, onAnswer }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleFlip = () => {
    if (!isAnswered) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleGrade = (correct: boolean) => {
    setIsAnswered(true);
    // Add a short delay to see the feedback before the next card loads
    setTimeout(() => {
        onAnswer(correct);
        setIsFlipped(false);
        setIsAnswered(false);
    }, 500);
  };
  
  return (
    <div className="w-full max-w-sm h-96 perspective-[1000px]">
      <div 
        className={`relative w-full h-full transform-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg flex flex-col justify-center items-center p-6 text-center cursor-pointer">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Spanska</p>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100">{word.spanish}</h2>
            <div className="absolute bottom-6 text-slate-400 dark:text-slate-500 flex items-center space-x-2">
                <Icon name="flip" />
                <span>Klicka för att vända</span>
            </div>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full rotate-u-180 backface-hidden bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl shadow-lg flex flex-col justify-between p-6 text-center rotate-y-180">
          <div>
            <div>
              <p className="text-indigo-500 dark:text-indigo-300 mb-2 font-semibold">Svenska</p>
              <h3 className="text-4xl font-bold text-indigo-900 dark:text-indigo-200">{word.swedish}</h3>
              <p className="text-slate-600 dark:text-slate-300 mt-6 italic">"{word.exampleSentence}"</p>
            </div>
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Hur bra kan du detta ord?</p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleGrade(false); }}
                  className="flex-1 py-3 px-4 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-200 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                >
                  Svårt
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGrade(true); }}
                  className="flex-1 py-3 px-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 rounded-lg font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                >
                  Lätt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
