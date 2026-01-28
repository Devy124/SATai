import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Question, QuizSettings, Stats, DailyStreak, QuizState } from './types.ts';
import Background from './components/Background.tsx';
import StudyLibrary from './components/StudyLibrary.tsx';
import { explainQuestion, generateQuestions } from './services/gemini.ts';
import { AuthService } from './services/auth.ts';

// --- Constants ---

const DIFFICULTY_CONFIG = {
  easy: { numQuestions: 10, timePerQ: 120 },
  medium: { numQuestions: 20, timePerQ: 75 },
  hard: { numQuestions: 30, timePerQ: 45 }
};

const DEFAULT_STATS: Stats = {
  totalQuizzes: 0, totalCorrect: 0, totalIncorrect: 0, totalScore: 0,
  subjects: { math: { correct: 0, incorrect: 0 }, english: { correct: 0, incorrect: 0 } }
};

const DEFAULT_DAILY: DailyStreak = { lastDate: null, streak: 0 };

const TIPS = [
  "Pace yourself!",
  "Eliminate wrong answers first.",
  "Double-check calculations.",
  "Context matters in English.",
  "Don't get stuck on one question.",
  "Read all options carefully.",
  "Pro Tip: Use keyboard 1-4 to answer!"
];

// --- Main App Component ---

export default function App() {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const sessionUser = AuthService.getCurrentUser();
    if (sessionUser) {
      const userData = AuthService.getUserData(sessionUser);
      if (userData) return sessionUser;
      AuthService.logout();
    }
    return null;
  });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  
  const [stats, setStats] = useState<Stats>(() => {
    if (currentUser) {
       const userData = AuthService.getUserData(currentUser);
       return userData ? userData.stats : DEFAULT_STATS;
    }
    const saved = localStorage.getItem("quizStats");
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  const [daily, setDaily] = useState<DailyStreak>(() => {
    if (currentUser) {
      const userData = AuthService.getUserData(currentUser);
      return userData ? userData.daily : DEFAULT_DAILY;
    }
    const saved = localStorage.getItem("dailyStreak");
    return saved ? JSON.parse(saved) : DEFAULT_DAILY;
  });

  // UI State
  const [screen, setScreen] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');
  const [settings, setSettings] = useState<QuizSettings>({ subject: 'math', difficulty: 'easy', mode: 'timed' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [tip, setTip] = useState(TIPS[0]);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Quiz Logic State
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    score: 0,
    timeLeft: 0,
    isPaused: false,
    isActive: false,
    isFinished: false
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (currentUser) {
      AuthService.updateProgress(currentUser, stats, daily);
    } else {
      localStorage.setItem("quizStats", JSON.stringify(stats));
      localStorage.setItem("dailyStreak", JSON.stringify(daily));
    }
  }, [stats, daily, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (quizState.isActive && !quizState.isPaused && !quizState.isFinished && settings.mode === 'timed') {
      timerRef.current = setInterval(() => {
        setQuizState(prev => {
          if (prev.timeLeft <= 1) {
            finishQuiz(prev);
            return { ...prev, timeLeft: 0, isFinished: true, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quizState.isActive, quizState.isPaused, quizState.isFinished, settings.mode]);

  // --- Handlers ---

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    const savedStats = localStorage.getItem("quizStats");
    const savedDaily = localStorage.getItem("dailyStreak");
    setStats(savedStats ? JSON.parse(savedStats) : DEFAULT_STATS);
    setDaily(savedDaily ? JSON.parse(savedDaily) : DEFAULT_DAILY);
  };

  const startQuiz = async (isDaily = false) => {
    setIsGenerating(true);
    setScreen('loading');
    
    let qList: Question[] = [];
    let time = 0;

    try {
        if (isDaily) {
          qList = await generateQuestions(settings.subject, settings.difficulty, 1);
          time = DIFFICULTY_CONFIG[settings.difficulty].timePerQ;
          
          const today = new Date().toISOString().slice(0, 10);
          if (daily.lastDate !== today) {
             setDaily(prev => ({
                 lastDate: today,
                 streak: prev.lastDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? prev.streak + 1 : 1
             }));
          }
        } else {
          const config = DIFFICULTY_CONFIG[settings.difficulty];
          const count = config.numQuestions;
          qList = await generateQuestions(settings.subject, settings.difficulty, count);
          time = settings.mode === 'timed' ? count * config.timePerQ : 0;
        }
    
        if (qList.length === 0) {
            alert("Could not generate questions. Please try again later.");
            setIsGenerating(false);
            setScreen('setup');
            return;
        }
    
        setQuizState({
          questions: qList,
          currentIndex: 0,
          answers: {},
          score: 0,
          timeLeft: time,
          isPaused: false,
          isActive: true,
          isFinished: false
        });
        setScreen('quiz');

    } catch (e) {
        console.error(e);
        alert("Error generating quiz.");
        setScreen('setup');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAnswer = useCallback((answerIdx: number) => {
    setQuizState(prev => {
      if (prev.answers[prev.currentIndex] !== undefined) return prev;
      if (!prev.isActive) return prev;

      const newAnswers = { ...prev.answers, [prev.currentIndex]: answerIdx };
      
      setTimeout(() => {
          setQuizState(curr => {
             if (!curr.isActive) return curr;
             if (curr.currentIndex < curr.questions.length - 1) {
                 return { ...curr, currentIndex: curr.currentIndex + 1 };
             } else {
                 finishQuiz({ ...curr, answers: newAnswers });
                 return { ...curr, answers: newAnswers, isFinished: true, isActive: false };
             }
          });
      }, 700);

      return { ...prev, answers: newAnswers };
    });
  }, []); 
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (screen !== 'quiz' || quizState.isPaused || quizState.isFinished) return;
        
        const key = e.key.toLowerCase();
        if (['1', 'a'].includes(key)) handleAnswer(0);
        if (['2', 'b'].includes(key)) handleAnswer(1);
        if (['3', 'c'].includes(key)) handleAnswer(2);
        if (['4', 'd'].includes(key)) handleAnswer(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, quizState.isPaused, quizState.isFinished, handleAnswer]);

  const finishQuiz = (finalState: QuizState) => {
    let correctCount = 0;
    finalState.questions.forEach((q, idx) => {
      if (finalState.answers[idx] === q.correct) correctCount++;
    });
    
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalQuizzes++;
      newStats.totalCorrect += correctCount;
      newStats.totalIncorrect += (finalState.questions.length - correctCount);
      newStats.totalScore += Math.round((correctCount / finalState.questions.length) * 800);
      newStats.subjects[settings.subject].correct += correctCount;
      newStats.subjects[settings.subject].incorrect += (finalState.questions.length - correctCount);
      return newStats;
    });

    setQuizState(prev => ({ ...prev, score: correctCount, isActive: false, isFinished: true }));
    setScreen('result');
  };

  const quitQuiz = () => {
    setQuizState(prev => ({ ...prev, isActive: false, isFinished: true }));
    setScreen('setup');
    setShowConfirmLeave(false);
    setShowPauseModal(false);
  };

  // --- Render ---

  return (
    <div className={`min-h-screen w-full relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white`}>
      <Background />
      
      <div className="relative z-10 container mx-auto px-4 py-6 min-h-screen flex flex-col items-center justify-center">
        
        {screen === 'setup' && (
          <SetupScreen 
            currentUser={currentUser}
            stats={stats}
            daily={daily}
            settings={settings}
            setSettings={setSettings}
            onStart={() => startQuiz(false)}
            onDaily={() => startQuiz(true)}
            onSettings={() => setShowSettingsModal(true)}
            onAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            isGenerating={isGenerating}
          />
        )}

        {screen === 'loading' && (
          <LoadingDisplay tip={tip} />
        )}

        {screen === 'quiz' && (
          <div className="w-full max-w-3xl animate-slide-up relative">
              <QuizHeader 
                  currentIndex={quizState.currentIndex}
                  total={quizState.questions.length}
                  timeLeft={quizState.timeLeft}
                  totalTime={DIFFICULTY_CONFIG[settings.difficulty].numQuestions * DIFFICULTY_CONFIG[settings.difficulty].timePerQ}
                  mode={settings.mode}
                  subject={settings.subject}
                  onPause={() => setShowPauseModal(true)}
              />
              
              <QuestionCard 
                  question={quizState.questions[quizState.currentIndex]}
                  currentIndex={quizState.currentIndex}
                  total={quizState.questions.length}
                  selectedAnswer={quizState.answers[quizState.currentIndex]}
                  onAnswer={handleAnswer}
                  onExit={() => setShowConfirmLeave(true)}
              />
          </div>
        )}

        {screen === 'result' && (
          <ResultScreen 
             score={quizState.score}
             total={quizState.questions.length}
             questions={quizState.questions}
             answers={quizState.answers}
             onRetry={() => startQuiz(false)}
             onMenu={() => setScreen('setup')}
          />
        )}

        {/* Global Tip Toast (only on setup/loading) */}
        {(screen === 'setup' || screen === 'loading') && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 glass-panel backdrop-blur-md text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium shadow-xl whitespace-nowrap z-40 pointer-events-none transition-all duration-500 opacity-90 border border-white/20">
            💡 {tip}
            </div>
        )}

      </div>

      {/* --- Modals --- */}
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLogin={(user, userData) => {
            setCurrentUser(user);
            setStats(userData.stats);
            setDaily(userData.daily);
            setShowAuthModal(false);
          }}
          onSignup={(user, userData) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
          currentStats={stats}
          currentDaily={daily}
        />
      )}

      {showSettingsModal && (
        <SettingsModal 
           onClose={() => setShowSettingsModal(false)}
           darkMode={darkMode}
           setDarkMode={setDarkMode}
           stats={stats}
           onOpenStudy={() => { setShowSettingsModal(false); setShowStudyModal(true); }}
        />
      )}

      {showStudyModal && (
        <StudyLibrary onClose={() => setShowStudyModal(false)} />
      )}

      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
           <div className="text-center">
              <h2 className="text-5xl font-black text-white mb-8 tracking-widest drop-shadow-lg">PAUSED</h2>
              <button 
                onClick={() => setShowPauseModal(false)}
                className="px-8 py-3 bg-white text-black rounded-full font-bold text-lg hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                RESUME
              </button>
              <div className="mt-8">
                 <button onClick={quitQuiz} className="text-white/60 hover:text-red-400 text-sm font-semibold tracking-wide transition-colors">QUIT QUIZ</button>
              </div>
           </div>
        </div>
      )}

      {showConfirmLeave && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Abandon Quiz?</h3>
               <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Progress will not be saved.</p>
               <div className="flex gap-3">
                  <button onClick={() => setShowConfirmLeave(false)} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">Stay</button>
                  <button onClick={quitQuiz} className="flex-1 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">Leave</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}

// --- Components ---

const LoadingDisplay = ({ tip }: { tip: string }) => (
    <div className="flex flex-col items-center justify-center animate-fade-in p-8">
        <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🤖</div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Constructing Quiz...</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium text-center max-w-xs leading-relaxed">
            AI is generating unique questions based on your settings.
        </p>
    </div>
);

const SetupScreen = memo(({ currentUser, stats, daily, settings, setSettings, onStart, onDaily, onSettings, onAuth, onLogout, isGenerating }: any) => {
  const getMastery = (subject: 'math' | 'english') => {
    const s = stats.subjects[subject];
    const total = s.correct + s.incorrect;
    return total === 0 ? 0 : Math.round((s.correct / total) * 100);
  };

  return (
    <div className="w-full max-w-md glass-panel shadow-2xl rounded-3xl p-8 animate-float relative overflow-hidden">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-8 relative z-10">
            <button onClick={onSettings} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
            
            {currentUser ? (
                 <div className="group relative">
                    <button className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{currentUser}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-32 glass-panel rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-fade-in origin-top-right z-50">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium transition-colors">Log Out</button>
                    </div>
                 </div>
               ) : (
                 <button onClick={onAuth} className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-full shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
                   Sign In
                 </button>
            )}
        </div>

        <div className="text-center mb-10">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent mb-1">SATAI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">Mastery System V2.0</p>
        </div>

        {/* Controls */}
        <div className="space-y-6 mb-8">
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Subject</label>
                <div className="grid grid-cols-2 gap-3">
                    {(['math', 'english'] as const).map(s => {
                        const mastery = getMastery(s);
                        const isSelected = settings.subject === s;
                        return (
                            <button key={s} onClick={() => setSettings({...settings, subject: s})}
                                className={`relative overflow-hidden p-4 rounded-2xl text-left transition-all duration-300 border group ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10 scale-[1.03]' : 'border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 opacity-80 hover:opacity-100'}`}>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-2xl">{s === 'math' ? '🧮' : '📖'}</span>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                    </div>
                                    <div className={`font-bold capitalize ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>{s}</div>
                                    <div className="text-[10px] font-medium opacity-60 uppercase tracking-wider mt-1">Mastery</div>
                                    <div className="mt-1 h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out" 
                                            style={{ width: `${mastery}%` }} 
                                        />
                                    </div>
                                    <div className="text-right text-[10px] font-bold mt-1 opacity-70">{mastery}%</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                        <button key={d} onClick={() => setSettings({...settings, difficulty: d})}
                            className={`py-2 rounded-xl font-semibold capitalize text-sm transition-all duration-300 border ${settings.difficulty === d ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10' : 'border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'} hover:scale-105 active:scale-95`}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mode</label>
                <div className="grid grid-cols-2 gap-3">
                    {(['timed', 'practice'] as const).map(m => (
                        <button key={m} onClick={() => setSettings({...settings, mode: m})}
                            className={`py-2 rounded-xl font-bold capitalize text-sm transition-all duration-300 border flex items-center justify-center gap-2 ${settings.mode === m ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-md shadow-purple-500/10' : 'border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'} hover:scale-105 active:scale-95`}>
                            <span>{m === 'timed' ? '⏱️' : '🧘'}</span> {m}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <button onClick={onStart} disabled={isGenerating}
            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30 transform transition-all hover:scale-[1.02] active:scale-95 mb-4 ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}>
            {isGenerating ? "Initializing AI..." : "Start Quiz"}
        </button>

        {/* Daily Streak Button */}
        <button onClick={onDaily} className="w-full relative group overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 transition-all hover:bg-amber-500/20 hover:border-amber-500/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm filter drop-shadow-lg">🔥</span>
                    <div className="text-left">
                        <div className="font-bold text-amber-700 dark:text-amber-500">Daily Challenge</div>
                        <div className="text-xs font-medium text-amber-600/70 dark:text-amber-500/70">{daily.streak} Day Streak</div>
                    </div>
                </div>
                {daily.lastDate === new Date().toISOString().slice(0, 10) ? (
                    <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-2 py-1 rounded font-bold">Done ✓</span>
                ) : (
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></div>
                )}
            </div>
        </button>
    </div>
  );
});

const QuizHeader = memo(({ currentIndex, total, timeLeft, totalTime, mode, onPause, subject }: any) => {
  // Calculate progress for bar
  const progress = mode === 'timed' ? (timeLeft / totalTime) * 100 : 100;
  
  // Format time
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, '0');
  
  // Dynamic timer color
  let timerColor = "text-gray-800 dark:text-white";
  if (mode === 'timed' && timeLeft < 30) timerColor = "text-red-500 animate-pulse";

  return (
    <div className="mb-6 flex items-center justify-between glass-card p-4 rounded-2xl shadow-lg relative overflow-hidden">
        {mode === 'timed' && (
            <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full">
                <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-400'}`} style={{ width: `${progress}%` }} />
            </div>
        )}
        
        <div className="flex items-center gap-4 z-10">
            <button onClick={onPause} className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                Question <span className="text-gray-900 dark:text-white text-lg ml-1">{currentIndex + 1}</span><span className="opacity-50 text-xs mx-1">/</span>{total}
            </div>
        </div>

        <div className="flex items-center gap-4 z-10">
            <div className={`font-mono font-bold text-xl tabular-nums ${timerColor}`}>
                {mode === 'timed' ? `${mins}:${secs}` : '∞'}
            </div>
        </div>
    </div>
  );
});

const QuestionCard = memo(({ question, currentIndex, total, selectedAnswer, onAnswer, onExit }: any) => {
  const isAnswered = selectedAnswer !== undefined;

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-10 shadow-2xl min-h-[500px] flex flex-col justify-center relative overflow-hidden animate-slide-up">
        {/* Progress Line Top */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-gray-800 z-10">
           <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-500 ease-out" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>
        
        {/* Keyboard Hints */}
        <div className="absolute top-4 right-4 z-20 hidden md:flex gap-2">
             {['1','2','3','4'].map(k => (
                 <span key={k} className="text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded bg-white/50 dark:bg-black/20">{k}</span>
             ))}
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-0">
            <h2 className="text-2xl md:text-3xl font-bold text-left mb-10 text-gray-900 dark:text-white leading-snug tracking-tight">
              {question.q}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {question.a.map((ans: string, idx: number) => {
                 const isSelected = selectedAnswer === idx;
                 const isCorrect = question.correct === idx;
                 
                 let btnClass = "border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm";
                 
                 if (isAnswered) {
                    if (isSelected && isCorrect) {
                        btnClass = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pop z-10 scale-[1.02]";
                    } else if (isSelected && !isCorrect) {
                        btnClass = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-shake z-10";
                    } else if (!isSelected && isCorrect) {
                        btnClass = "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400 opacity-70";
                    } else {
                        btnClass = "opacity-40 grayscale blur-[0.5px] border-transparent scale-95";
                    }
                 } else if (isSelected) {
                     btnClass = "bg-blue-500 text-white";
                 }

                 return (
                   <button
                     key={idx}
                     disabled={isAnswered}
                     onClick={() => onAnswer(idx)} 
                     className={`relative group p-5 md:p-6 rounded-2xl text-left font-semibold text-lg transition-all duration-300 border ${btnClass} ${!isAnswered && 'hover:scale-[1.01] hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-500/30'} cursor-pointer overflow-hidden`}
                   >
                     {!isAnswered && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:animate-shimmer" />}

                     <div className="flex items-center gap-5 relative z-10">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors duration-300 ${
                            isAnswered && (isSelected || isCorrect) 
                                ? 'border-current bg-current/10' 
                                : 'border-gray-300 dark:border-gray-600 text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                        }`}>
                            {['A','B','C','D'][idx]}
                        </span>
                        <span className="leading-snug">{ans}</span>
                     </div>
                   </button>
                 );
              })}
            </div>
        </div>

        <div className="mt-8 flex justify-center z-10 relative">
            <button onClick={onExit} className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-[10px] font-bold text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all uppercase tracking-widest">
                Exit Quiz
            </button>
        </div>
    </div>
  );
});

const ResultScreen = memo(({ score, total, questions, answers, onRetry, onMenu }: any) => {
  const percentage = Math.round((score / total) * 100);
  const scaledScore = Math.round((score / total) * 800);
  
  useEffect(() => {
    if (percentage > 60) {
       const createConfetti = () => {
           const colors = ['#60A5FA', '#818CF8', '#34D399', '#FBBF24', '#F472B6'];
           for(let i=0; i<60; i++) {
               const el = document.createElement('div');
               el.style.position = 'fixed';
               el.style.left = '50%';
               el.style.top = '50%';
               el.style.width = '8px';
               el.style.height = '8px';
               el.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
               el.style.borderRadius = '50%';
               el.style.zIndex = '100';
               document.body.appendChild(el);
               
               const angle = Math.random() * Math.PI * 2;
               const velocity = 5 + Math.random() * 12;
               const tx = Math.cos(angle) * velocity * 25;
               const ty = Math.sin(angle) * velocity * 25;
               
               el.animate([
                   { transform: 'translate(0,0) scale(1)', opacity: 1 },
                   { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
               ], {
                   duration: 1200 + Math.random() * 1000,
                   easing: 'cubic-bezier(0, .9, .57, 1)',
                   fill: 'forwards'
               }).onfinish = () => el.remove();
           }
       };
       createConfetti();
    }
  }, [percentage]);

  return (
    <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 shadow-2xl animate-float text-center border-t-2 border-white/50">
         <div className="text-center mb-10">
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 mb-4 tracking-tight drop-shadow-sm">
                {percentage >= 80 ? "Outstanding!" : percentage >= 60 ? "Good Job!" : "Keep Going"}
            </h2>
            <div className="flex justify-center my-8">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 filter drop-shadow-lg">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray={502} 
                            strokeDashoffset={502 - (502 * percentage) / 100} 
                            strokeLinecap="round"
                            className={`text-blue-500 dark:text-blue-400 transition-all duration-1000 ease-out`} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-black text-gray-800 dark:text-white tracking-tighter">{scaledScore}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-800/30">
                    <div className="text-xs text-green-600 dark:text-green-400 uppercase font-bold tracking-wider">Correct</div>
                    <div className="text-2xl font-black text-green-700 dark:text-green-300">{score}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800/30">
                    <div className="text-xs text-red-600 dark:text-red-400 uppercase font-bold tracking-wider">Incorrect</div>
                    <div className="text-2xl font-black text-red-700 dark:text-red-300">{total - score}</div>
                </div>
            </div>
         </div>

         <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar mb-10 px-2 text-left">
            {questions.map((q: Question, i: number) => {
                const isCorrect = answers[i] === q.correct;
                if(isCorrect) return null;
                return <ReviewItem key={i} question={q} userAnswer={answers[i]} index={i} />;
            })}
            {score === total && (
                <div className="text-center py-10 bg-white/30 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <span className="text-4xl block mb-2">🏆</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Perfect score! No mistakes to review.</p>
                </div>
            )}
         </div>

         <div className="grid grid-cols-2 gap-4">
            <button onClick={onMenu} className="py-4 rounded-2xl font-bold bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                Main Menu
            </button>
            <button onClick={onRetry} className="py-4 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all">
                Try Again
            </button>
         </div>
    </div>
  );
});

const ReviewItem = ({ question, userAnswer, index }: any) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    const text = await explainQuestion(question);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 border border-red-100 dark:border-red-500/10 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-shadow">
       <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs mt-1">
             {index + 1}
          </div>
          <div className="flex-1">
             <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">{question.q}</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-red-50 dark:bg-red-900/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/20">
                    <span className="text-[10px] uppercase font-bold text-red-500 dark:text-red-400 block mb-0.5">Your Answer</span>
                    <span className="text-red-700 dark:text-red-300 font-medium line-through decoration-red-400/50">{question.a[userAnswer] || "Skipped"}</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 p-2.5 rounded-lg border border-green-100 dark:border-green-900/20">
                    <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 block mb-0.5">Correct Answer</span>
                    <span className="text-green-800 dark:text-green-300 font-medium">{question.a[question.correct]}</span>
                </div>
             </div>
          </div>
       </div>
       
       <div className="mt-4 pl-12">
         {!explanation && !loading && (
           <button onClick={handleExplain} className="group flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 uppercase tracking-wide transition-colors">
             <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">✨</span>
             Explain with AI
           </button>
         )}
         {loading && (
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
            </div>
         )}
         {explanation && (
           <div className="mt-2 text-sm bg-indigo-50/80 dark:bg-indigo-900/20 p-4 rounded-xl text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-500/20 animate-fade-in leading-relaxed whitespace-pre-wrap shadow-inner">
              <div className="flex items-center gap-2 mb-2 border-b border-indigo-200 dark:border-indigo-500/30 pb-2">
                 <span className="text-lg">🤖</span>
                 <span className="text-xs font-bold uppercase tracking-wider opacity-70">AI Tutor Analysis</span>
              </div>
              {explanation}
           </div>
         )}
       </div>
    </div>
  );
};

const SettingsModal = ({ onClose, darkMode, setDarkMode, stats, onOpenStudy }: any) => {
    // API key state removed
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="glass-panel w-full max-w-sm p-6 rounded-2xl shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h3>
              
              <div className="flex items-center justify-between mb-6 p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                 <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
                 <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
              </div>

              {/* API Key section removed entirely */}
              
              <div className="space-y-4 mb-6">
                 <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Lifetime Stats</h4>
                 <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl space-y-2 text-sm border border-black/5 dark:border-white/5">
                    <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Total Quizzes</span>
                       <span className="font-bold dark:text-white">{stats.totalQuizzes}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-gray-500 dark:text-gray-400">Total Score</span>
                       <span className="font-bold dark:text-white">{stats.totalCorrect} / {stats.totalCorrect + stats.totalIncorrect}</span>
                    </div>
                 </div>
              </div>

              <button onClick={onOpenStudy} className="w-full py-3 mb-3 border-2 border-blue-500/50 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold transition-colors">
                📚 Study Library
              </button>

              <button onClick={onClose} className="w-full py-3 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-white/20 font-bold transition-colors">
                Close
              </button>
           </div>
        </div>
    );
};

// Auth Modal Component remains largely the same but with glass styles
const AuthModal = ({ onClose, onLogin, onSignup, currentStats, currentDaily }: any) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'login') {
      const res = AuthService.login(username, password);
      if (res.success) onLogin(username, res.data);
      else setError(res.message || 'Login failed');
    } else {
      const res = AuthService.signup(username, password, currentStats, currentDaily);
      if (res.success) onSignup(username, res.data);
      else setError(res.message || 'Signup failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-sm p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{mode === 'login' ? 'Welcome Back' : 'Join Now'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white font-medium"
              placeholder="Enter username" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white font-medium"
              placeholder="••••••••" />
          </div>

          {error && <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg text-center animate-pulse">{error}</div>}

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setError(''); setMode(mode === 'login' ? 'signup' : 'login'); }}
              className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">
              {mode === 'login' ? 'Create an account' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
};