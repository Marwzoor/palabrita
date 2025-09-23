
import React from 'react';
import type { Achievement } from './types';
import Icon from './components/common/Icon';

// FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file without causing parsing errors.
export const MOCK_ACHIEVEMENTS: Achievement[] = [
    { id: '10_words', title: 'Nybörjare', description: 'Lär dig dina första 10 ord.', icon: React.createElement(Icon, { name: "star" }) },
    { id: '100_words', title: 'Ordsmed', description: 'Bemästra 100 ord.', icon: React.createElement(Icon, { name: "book" }) },
    { id: '7_day_streak', title: 'Ihärdig', description: 'Håll en streak i 7 dagar.', icon: React.createElement(Icon, { name: "fire" }) },
    { id: 'perfect_session', title: 'Perfektionist', description: 'Avsluta en lektion med alla rätt.', icon: React.createElement(Icon, { name: "target" }) },
];

export const MASTERY_LEVEL_CHART_COLORS: { [key: number]: string } = {
  0: '#94A3B8', // slate-400 (New)
  1: '#60A5FA', // blue-400 (Learning)
  2: '#FBBF24', // amber-400 (Familiar)
  3: '#84CC16', // lime-500 (Confident)
  4: '#22C55E', // green-500 (Mastered)
};

export const MASTERY_LEVEL_COLORS: { [key: number]: string } = {
  0: 'bg-slate-300',
  1: 'bg-blue-400',
  2: 'bg-amber-400',
  3: 'bg-lime-500',
  4: 'bg-green-500',
};

export const MASTERY_LEVEL_NAMES: { [key: number]: string } = {
  0: 'Ny',
  1: 'Lärande',
  2: 'Bekant',
  3: 'Säker',
  4: 'Bemästrad',
};