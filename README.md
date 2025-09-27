# Palabrita

Palabrita is a progressive web app that helps Swedish speakers build and retain Spanish vocabulary through short, data-driven study sessions. The app combines a curated word list with a lightweight spaced-repetition system, interactive flashcards, and progress tracking so you can study anywhere—even offline.

## Features

- **Spaced repetition queue** – Words are prioritized based on their mastery level and next review date, mixing due reviews with a handful of new terms for each session.
- **Interactive study sessions** – Flashcards let you reveal translations, self-assess your recall, and immediately move on to the next word.
- **Personal dashboard** – Track learned words, review backlogs, and recently mastered vocabulary alongside weekly activity and mastery distribution charts.
- **Achievements and streaks** – Earn points, maintain streaks, and unlock trophies as motivation to keep practicing.
- **Offline-ready PWA** – Install the app on desktop or mobile; your progress is stored locally so you can continue learning without an internet connection.

## Vocabulary data

The built-in word list lives in [`data/spanish_words.json`](./data/spanish_words.json). It contains Spanish headwords, Swedish translations, and example sentences in both languages. You can open the file directly in your browser or download it via the repository's **Raw** view if you want to repurpose the dataset for other projects.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (bundled with Node.js)

### Installation

```bash
npm install
```

### Run a development server

```bash
npm run dev
```

The command starts Vite's development server and prints a local URL. Visit it in your browser to explore Palabrita with hot module reloading.

### Build for production

```bash
npm run build
```

This produces an optimized bundle in the `dist` directory. You can preview the production build locally with `npm run preview`.

## Project structure

```
.
├── App.tsx               # App shell, view routing, and state management
├── components/           # UI building blocks (dashboard, flashcards, achievements, etc.)
├── data/spanish_words.json  # Spanish ↔︎ Swedish vocabulary dataset
├── services/             # Word loading and transformation helpers
├── types.ts              # Shared TypeScript types and enums
└── vite.config.ts        # Vite configuration (includes PWA setup)
```

## Tech stack

- [React](https://react.dev/) with TypeScript for the UI
- [Vite](https://vitejs.dev/) for fast development and builds
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for visualizing progress
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) to enable offline support

## Contributing

Issues and pull requests are welcome! If you plan to contribute larger features, please open an issue first so we can discuss the approach. When submitting changes, include relevant tests or screenshots and keep the documentation up to date.
