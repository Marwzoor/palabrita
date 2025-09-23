import { Word, MasteryLevel } from '../types';

interface RawWord {
  word: string;
  translation: string;
  sentence_es: string;
  sentence_sv: string;
}

export const getInitialWords = async (): Promise<Word[]> => {
  try {
    const response = await fetch('./data/spanish_words.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const spanishWords = await response.json() as RawWord[];
    
    const now = new Date().toISOString();
    
    return spanishWords
      .filter(wordData => wordData.word && wordData.translation && wordData.sentence_es)
      .map((wordData, index) => ({
        id: `${index + 1}`,
        spanish: wordData.word,
        swedish: wordData.translation,
        exampleSentence: wordData.sentence_es,
        masteryLevel: MasteryLevel.New,
        nextReviewDate: now,
      }));
  } catch (error) {
    console.error("Could not fetch or parse word data:", error);
    return [];
  }
};