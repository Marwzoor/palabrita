
import React, { useState, useEffect } from 'react';
import type { Word, SessionResult } from '../types';
import { ReviewQuality } from '../types';
import Flashcard from './Flashcard';
import ProgressBar from './common/ProgressBar';
import Button from './common/Button';

interface LearningSessionProps {
  words: Word[];
  onSessionComplete: (sessionWords: SessionResult[]) => void;
}

const LearningSession: React.FC<LearningSessionProps> = ({ words, onSessionComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [sessionFinished, setSessionFinished] = useState(false);

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;

  useEffect(() => {
    if (words.length === 0) {
      setSessionFinished(true);
    }
  }, [words]);

  const handleAnswer = (quality: ReviewQuality) => {
    if (!currentWord) {
      return;
    }

    const newResults = [...sessionResults, { wordId: currentWord.id, quality }];
    setSessionResults(newResults);

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSessionFinished(true);
    }
  };

  if (sessionFinished) {
    const correctCount = sessionResults.filter(r => r.quality >= ReviewQuality.Good).length;
    const totalCount = words.length;

    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Bra jobbat!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Du klarade {correctCount} av {totalCount} ord.</p>
        <div className="w-full max-w-xs my-8">
            <ProgressBar progress={(correctCount / (totalCount || 1)) * 100} />
        </div>
        <Button onClick={() => onSessionComplete(sessionResults)}>
          Gå till översikt
        </Button>
      </div>
    );
  }
  
  if (!currentWord) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inga ord för idag!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Kom tillbaka imorgon för fler repetitioner.</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full">
      <ProgressBar progress={progress} />
      <div className="flex-grow flex items-center justify-center my-4">
        <Flashcard key={currentWord.id} word={currentWord} onAnswer={handleAnswer} />
      </div>
    </div>
  );
};

export default LearningSession;
