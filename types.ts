// FIX: Imported `ReactNode` from 'react' and used it to correctly type the `icon` property in the `Achievement` interface. This resolves the 'Cannot find namespace React' error.
import type { ReactNode } from 'react';

export interface Word {
  id: string;
  spanish: string;
  swedish: string;
  exampleSentence: string;
  masteryLevel: MasteryLevel;
  nextReviewDate: string; // ISO string
  learnedDate?: string; // ISO string
  easeFactor: number;
  repetitionCount: number;
  reviewInterval: number;
}

export enum MasteryLevel {
  New = 0,
  Learning = 1,
  Familiar = 2,
  Confident = 3,
  Mastered = 4,
}

export interface UserProgress {
  points: number;
  level: number;
  streak: number;
  lastSession: Date;
  achievements: Set<string>;
}

export enum View {
  Dashboard = 'Översikt',
  Learning = 'Lektion',
  Achievements = 'Trofér',
  Settings = 'Inställningar',
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettings {
  themePreference: ThemePreference;
  remindersEnabled: boolean;
  enableConfetti: boolean;
  dailyGoal: number;
  sessionSize: number;
  newWordsRatio: number;
}

export enum ReviewQuality {
  Again = 0,
  Hard = 3,
  Good = 4,
  Easy = 5,
}

export interface SessionResult {
  wordId: string;
  quality: ReviewQuality;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}

// FIX: Added and exported the `LeaderboardEntry` interface to resolve the 'has no exported member' error in Leaderboard.tsx.
export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isUser: boolean;
}
