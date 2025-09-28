import { Word, MasteryLevel } from '../types';
import spanishWords from '../data/spanish_words.json';

interface RawWord {
  word: string;
  translation: string;
  sentence_es: string;
  sentence_sv: string;
}

export const getInitialWords = async (): Promise<Word[]> => {
  const now = new Date().toISOString();

  return (spanishWords as RawWord[])
    .filter(
      (wordData) =>
        wordData.word &&
        wordData.translation &&
        wordData.sentence_es &&
        wordData.sentence_sv
    )
    .map((wordData, index) => ({
      id: `${index + 1}`,
      spanish: wordData.word,
      swedish: wordData.translation,
      exampleSentenceSpanish: wordData.sentence_es,
      exampleSentenceSwedish: wordData.sentence_sv,
      masteryLevel: MasteryLevel.New,
      nextReviewDate: now,
      easeFactor: 2.5,
      repetitionCount: 0,
      reviewInterval: 0,
    }));
};