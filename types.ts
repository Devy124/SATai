export type Subject = 'math' | 'english';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Mode = 'timed' | 'practice';

export interface Question {
  q: string;
  a: string[];
  correct: number;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, number>; // questionIndex -> answerIndex
  score: number;
  timeLeft: number;
  isPaused: boolean;
  isActive: boolean;
  isFinished: boolean;
}

export interface QuizSettings {
  subject: Subject;
  difficulty: Difficulty;
  mode: Mode;
}

export interface Stats {
  totalQuizzes: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalScore: number;
  subjects: {
    math: { correct: number; incorrect: number };
    english: { correct: number; incorrect: number };
  };
}

export interface DailyStreak {
  lastDate: string | null;
  streak: number;
}