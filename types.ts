export interface Question {
  q: string;
  a: string[];
  correct: number;
}

export interface SubjectStats {
  correct: number;
  incorrect: number;
}

export interface Stats {
  totalQuizzes: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalScore: number;
  unlockedAchievements: string[];
  subjects: {
    math: SubjectStats;
    english: SubjectStats;
    [key: string]: SubjectStats;
  };
}

export interface Daily {
  lastDate: string | null;
  streak: number;
}

export interface UserData {
  stats: Stats;
  daily: Daily;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, number>;
  score: number;
  timeLeft: number;
  isPaused: boolean;
  isActive: boolean;
  isFinished: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Subject = 'math' | 'english';
export type Mode = 'timed' | 'practice';

export interface Settings {
  subject: Subject;
  difficulty: Difficulty;
  mode: Mode;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  condition: (stats: Stats, daily: Daily, lastQuizScore?: number, lastQuizTotal?: number) => boolean;
}

export interface LevelConfig {
  min: number;
  title: string;
  color: string;
}