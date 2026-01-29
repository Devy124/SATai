import React, { useState, useEffect, useRef, useCallback } from 'react';
import Background from './components/Background';
import StudyLibrary from './components/StudyLibrary';
import SetupScreen from './components/SetupScreen';
import QuizHeader from './components/QuizHeader';
import QuestionCard from './components/QuestionCard';
import ResultScreen from './components/ResultScreen';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { generateQuestions } from './services/gemini';
import { AuthService } from './services/auth';
import { DIFFICULTY_CONFIG, DEFAULT_STATS, DEFAULT_DAILY, TIPS, ACHIEVEMENTS } from './constants';
import { Stats, Daily, Settings, QuizState, UserData } from './types';

const LoadingDisplay = ({ tip }: { tip: string }) => (
    <div className="flex flex-col items-center justify-center animate-fade-in p-8 text-center">
        <div className="relative w-24 h-24 mb-8 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🤖</div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Constructing Quiz...</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xs mx-auto leading-relaxed">
            AI is generating unique questions based on your settings.
        </p>
    </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    const sessionUser = AuthService.getCurrentUser();
    if (sessionUser) {
      const userData = AuthService.getUserData(sessionUser);
      if (userData) return sessionUser;
      AuthService.logout();
    }
    return null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    const theme = localStorage.getItem('theme');
    return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [stats, setStats] = useState<Stats>(() => {
    let loadedStats = DEFAULT_STATS;
    if (currentUser) {
       const userData = AuthService.getUserData(currentUser);
       if(userData) loadedStats = userData.stats;
    } else {
       const saved = localStorage.getItem("quizStats");
       if(saved) loadedStats = JSON.parse(saved);
    }
    // Backward compatibility merge
    return { ...DEFAULT_STATS, ...loadedStats, unlockedAchievements: loadedStats.unlockedAchievements || [] };
  });

  const [daily, setDaily] = useState<Daily>(() => {
    if (currentUser) {
      const userData = AuthService.getUserData(currentUser);
      return userData ? userData.daily : DEFAULT_DAILY;
    }
    const saved = localStorage.getItem("dailyStreak");
    return saved ? JSON.parse(saved) : DEFAULT_DAILY;
  });

  const [screen, setScreen] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');
  const [settings, setSettings] = useState<Settings>({ subject: 'math', difficulty: 'easy', mode: 'timed' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [tip, setTip] = useState(TIPS[0]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

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

  // Use refs to avoid stale closures in timeouts/intervals
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const dailyRef = useRef(daily);
  useEffect(() => { dailyRef.current = daily; }, [daily]);

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

  // Defined here to be accessible by finishQuiz
  const finishQuiz = useCallback((finalState: QuizState) => {
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
      
      const subject = settingsRef.current.subject;
      if (newStats.subjects[subject]) {
        newStats.subjects[subject].correct += correctCount;
        newStats.subjects[subject].incorrect += (finalState.questions.length - correctCount);
      }

      // Check Achievements
      const currentUnlocked = new Set(newStats.unlockedAchievements);
      ACHIEVEMENTS.forEach(ach => {
        if (!currentUnlocked.has(ach.id)) {
            if (ach.condition(newStats, dailyRef.current, correctCount, finalState.questions.length)) {
                currentUnlocked.add(ach.id);
                // Optional: Trigger a toast here in future
            }
        }
      });
      newStats.unlockedAchievements = Array.from(currentUnlocked);

      return newStats;
    });

    setQuizState(prev => ({ ...prev, score: correctCount, isActive: false, isFinished: true }));
    setScreen('result');
  }, []); 

  // Timer Interval Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (screen === 'quiz' && quizState.isActive && !quizState.isPaused && !quizState.isFinished && settings.mode === 'timed') {
      interval = setInterval(() => {
        setQuizState(prev => {
           // Only decrement. Completion logic handled in separate effect.
           return { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, quizState.isActive, quizState.isPaused, quizState.isFinished, settings.mode]);

  // Timer Completion Effect
  useEffect(() => {
    if (screen === 'quiz' && quizState.isActive && settings.mode === 'timed' && quizState.timeLeft === 0) {
      finishQuiz({ ...quizState, isFinished: true, isActive: false });
    }
  }, [quizState.timeLeft, quizState.isActive, screen, settings.mode, finishQuiz, quizState]);

  const handleResetStats = () => {
    const reset = { ...DEFAULT_STATS };
    const resetDaily = { ...DEFAULT_DAILY };
    setStats(reset);
    setDaily(resetDaily);
    if(currentUser) AuthService.updateProgress(currentUser, reset, resetDaily);
    else {
        localStorage.setItem("quizStats", JSON.stringify(reset));
        localStorage.setItem("dailyStreak", JSON.stringify(resetDaily));
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    const savedStats = localStorage.getItem("quizStats");
    const savedDaily = localStorage.getItem("dailyStreak");
    setStats(savedStats ? { ...DEFAULT_STATS, ...JSON.parse(savedStats) } : DEFAULT_STATS);
    setDaily(savedDaily ? JSON.parse(savedDaily) : DEFAULT_DAILY);
  };

  const startQuiz = async (isDaily = false) => {
    setIsGenerating(true);
    setScreen('loading');
    
    let qList = [];
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
      // Prevent answering multiple times or if quiz inactive
      if (prev.answers[prev.currentIndex] !== undefined || !prev.isActive) return prev;

      const newAnswers = { ...prev.answers, [prev.currentIndex]: answerIdx };
      
      setTimeout(() => {
          setQuizState(curr => {
             // Check if mounted/active to avoid stale updates on unmount
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
  }, [finishQuiz]); 
  
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

  const quitQuiz = () => {
    setQuizState(prev => ({ ...prev, isActive: false, isFinished: true }));
    setScreen('setup');
    setShowConfirmLeave(false);
    setShowPauseModal(false);
  };

  return (
    <div className={`min-h-screen w-full relative overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white`}>
      <Background />
      
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center supports-[min-height:100dvh]:min-h-[100dvh]">
        
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
             mode={settings.mode}
          />
        )}

        {(screen === 'setup' || screen === 'loading') && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2 glass-panel backdrop-blur-md text-gray-800 dark:text-gray-200 rounded-full text-xs font-medium shadow-xl whitespace-nowrap z-40 pointer-events-none transition-all duration-500 opacity-90 border border-white/20">
            💡 {tip}
            </div>
        )}

      </div>

      {/* Modals */}
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLogin={(user, userData) => {
            setCurrentUser(user);
            // Ensure compatibility with new mastery system
            setStats({ ...DEFAULT_STATS, ...userData.stats, unlockedAchievements: userData.stats.unlockedAchievements || [] });
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
           onResetStats={handleResetStats}
        />
      )}

      {showStudyModal && (
        <StudyLibrary onClose={() => setShowStudyModal(false)} />
      )}

      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
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
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
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