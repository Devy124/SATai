import { Achievement, LevelConfig } from './types';

export const DIFFICULTY_CONFIG = {
  easy: { numQuestions: 10, timePerQ: 120 },
  medium: { numQuestions: 20, timePerQ: 75 },
  hard: { numQuestions: 30, timePerQ: 45 }
};

export const DEFAULT_STATS = {
  totalQuizzes: 0, 
  totalCorrect: 0, 
  totalIncorrect: 0, 
  totalScore: 0,
  unlockedAchievements: [],
  subjects: { 
    math: { correct: 0, incorrect: 0 }, 
    english: { correct: 0, incorrect: 0 } 
  }
};

export const DEFAULT_DAILY = { lastDate: null, streak: 0 };

export const TIPS = [
  "Pace yourself!",
  "Eliminate wrong answers first.",
  "Double-check calculations.",
  "Context matters in English.",
  "Don't get stuck on one question.",
  "Read all options carefully.",
  "Pro Tip: Use keyboard 1-4 to answer!"
];

// Level System: Based on Total Correct Answers per Subject
export const LEVELS: LevelConfig[] = [
  { min: 0, title: "Novice", color: "from-gray-400 to-gray-500" },
  { min: 20, title: "Apprentice", color: "from-green-400 to-emerald-600" },
  { min: 50, title: "Scholar", color: "from-blue-400 to-indigo-600" },
  { min: 100, title: "Expert", color: "from-purple-400 to-fuchsia-600" },
  { min: 250, title: "Master", color: "from-amber-300 to-yellow-600" },
  { min: 500, title: "Grandmaster", color: "from-red-500 to-rose-700" }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    icon: '🏁',
    title: 'First Steps',
    desc: 'Complete your first quiz',
    condition: (stats) => stats.totalQuizzes >= 1
  },
  {
    id: 'math_whiz',
    icon: '🧮',
    title: 'Math Whiz',
    desc: 'Get 50 Math questions correct',
    condition: (stats) => stats.subjects.math.correct >= 50
  },
  {
    id: 'wordsmith',
    icon: '📚',
    title: 'Wordsmith',
    desc: 'Get 50 English questions correct',
    condition: (stats) => stats.subjects.english.correct >= 50
  },
  {
    id: 'streak_flame',
    icon: '🔥',
    title: 'On Fire',
    desc: 'Reach a 3-day streak',
    condition: (_, daily) => daily.streak >= 3
  },
  {
    id: 'perfectionist',
    icon: '💎',
    title: 'Perfectionist',
    desc: 'Get 100% on a quiz',
    condition: (_, __, score, total) => !!(score && total && score === total && total >= 5)
  },
  {
    id: 'dedicated',
    icon: '🏋️',
    title: 'Dedicated',
    desc: 'Complete 25 total quizzes',
    condition: (stats) => stats.totalQuizzes >= 25
  }
];