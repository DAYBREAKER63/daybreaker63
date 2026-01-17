
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserState, CheckIn, Domain, Habit, HabitLog, DietConfig } from './types';
import Header from './components/Header';
import ScoreCard from './components/ScoreCard';
import CheckInForm from './components/CheckInForm';
import AIEvaluator from './components/AIEvaluator';
import StructureTab from './components/StructureTab';
import DietTab from './components/DietTab';
import LiveMentor from './components/LiveMentor';
import PerformanceSummary from './components/PerformanceSummary';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'STRUCTURE' | 'DIET'>('HOME');
  const [systemDate, setSystemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [systemTime, setSystemTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('frame_user_state_v4');
    return saved ? JSON.parse(saved) : {
      checkIns: [],
      lastCheckInDate: null,
      relapseStreak: 0,
      habits: [],
      habitLogs: [],
      aiModelName: 'Mentor Fenrir'
    };
  });

  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isConsultingMentor, setIsConsultingMentor] = useState(false);
  const [autoStartGuru, setAutoStartGuru] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('frame_user_state_v4', JSON.stringify(userState));
  }, [userState]);

  // Optimized Wake Word Listener
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (
            transcript.includes('hey guru ji') || 
            transcript.includes('hey guruji') || 
            transcript.includes('hay guruji') || 
            transcript.includes('hay guru ji') ||
            transcript.includes('hi guru ji')
        ) {
          setAutoStartGuru(true);
          setIsConsultingMentor(true);
          recognition.stop();
          break;
        }
      }
    };

    recognition.onend = () => {
      if (!isConsultingMentor && activeTab === 'HOME' && !isCheckingIn) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    if (!isConsultingMentor && activeTab === 'HOME' && !isCheckingIn) {
      try { recognition.start(); } catch (e) {}
    }

    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [isConsultingMentor, activeTab, isCheckingIn]);

  const currentCheckIn = useMemo(() => {
    return userState.checkIns.find(c => c.date === systemDate) || null;
  }, [userState.checkIns, systemDate]);

  const handleCheckIn = (newCheckIn: CheckIn) => {
    setUserState(prev => {
      const isRelapse = newCheckIn.nightLog.contentType === 'Sexual' || newCheckIn.nightLog.contentType === 'Reels';
      const newStreak = isRelapse ? 0 : prev.relapseStreak + 1;
      const filteredCheckIns = prev.checkIns.filter(c => c.date !== systemDate);
      
      return {
        ...prev,
        checkIns: [...filteredCheckIns, newCheckIn],
        lastCheckInDate: newCheckIn.date,
        relapseStreak: newStreak
      };
    });
    setIsCheckingIn(false);
  };

  const handleManualReset = () => {
    setUserState(prev => ({
      ...prev,
      relapseStreak: 0,
      lastCheckInDate: null, // Allow immediate re-check-in to start Day 1
    }));
  };

  const handleAddHabit = (domain: Domain, name: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      domain,
      name
    };
    setUserState(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit]
    }));
  };

  const handleUpdateHabit = (id: string, name: string, domain: Domain) => {
    setUserState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, name, domain } : h)
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setUserState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      habitLogs: prev.habitLogs.map(log => ({
        ...log,
        completedHabitIds: log.completedHabitIds.filter(hid => hid !== id)
      }))
    }));
  };

  const handleToggleHabit = (habitId: string) => {
    setUserState(prev => {
      const existingLogIndex = prev.habitLogs.findIndex(l => l.date === systemDate);
      let newLogs = [...prev.habitLogs];

      if (existingLogIndex >= 0) {
        const log = { ...newLogs[existingLogIndex] };
        if (log.completedHabitIds.includes(habitId)) {
          log.completedHabitIds = log.completedHabitIds.filter(id => id !== habitId);
        } else {
          log.completedHabitIds = [...log.completedHabitIds, habitId];
        }
        newLogs[existingLogIndex] = log;
      } else {
        newLogs.push({
          date: systemDate,
          completedHabitIds: [habitId]
        });
      }

      return { ...prev, habitLogs: newLogs };
    });
  };

  const handleUpdateDiet = (dietConfig: DietConfig) => {
    setUserState(prev => ({ ...prev, dietConfig }));
  };

  const handleUpdateAIName = (name: string) => {
    setUserState(prev => ({ ...prev, aiModelName: name }));
  };

  const hasCheckedInToday = !!currentCheckIn;

  return (
    <div className="min-h-screen max-w-sm mx-auto px-8 py-16 flex flex-col gap-0">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        systemDate={systemDate}
        setSystemDate={setSystemDate}
        systemTime={systemTime}
        setSystemTime={setSystemTime}
        aiModelName={userState.aiModelName || 'Mentor Fenrir'}
        onUpdateAIName={handleUpdateAIName}
      />
      
      <main className="flex flex-col flex-1">
        {activeTab === 'HOME' ? (
          <div className="flex flex-col gap-16">
            <ScoreCard 
              score={currentCheckIn?.score || 0} 
              streak={userState.relapseStreak} 
              onReset={handleManualReset}
            />
            
            <div className="flex flex-col gap-4">
               {!hasCheckedInToday && !isCheckingIn && (
                <button
                  onClick={() => setIsCheckingIn(true)}
                  className="w-full border border-white text-white font-black py-5 px-6 hover:bg-white hover:text-black transition-all uppercase tracking-[0.4em] text-[10px]"
                >
                  Verify Tonight
                </button>
              )}
              
              <div className="relative group">
                <button
                  onClick={() => {
                    setAutoStartGuru(false);
                    setIsConsultingMentor(true);
                  }}
                  className="w-full border border-zinc-900 text-zinc-600 font-black py-5 px-6 hover:border-zinc-500 hover:text-zinc-300 transition-all uppercase tracking-[0.4em] text-[10px]"
                >
                  Fitness Guru
                </button>
                <div className="absolute -bottom-8 left-0 w-full flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`w-0.5 h-1 bg-zinc-800 animate-pulse`} style={{ animationDelay: `${i*0.2}s` }} />
                    ))}
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-900">
                    Sensing: "Hey Guru Ji"
                  </span>
                </div>
              </div>
            </div>

            {currentCheckIn && !isCheckingIn && (
              <div className="space-y-4">
                <AIEvaluator lastCheckIn={currentCheckIn} />
                <PerformanceSummary 
                  score={currentCheckIn.score} 
                  streak={userState.relapseStreak} 
                />
              </div>
            )}

            {!currentCheckIn && !isCheckingIn && (
              <div className="py-8 opacity-20 border-t border-zinc-900 mt-8">
                <p className="text-[9px] font-black uppercase tracking-[0.6em]">System Standby: {systemDate} @ {systemTime}</p>
              </div>
            )}
          </div>
        ) : activeTab === 'STRUCTURE' ? (
          <StructureTab 
            habits={userState.habits}
            habitLogs={userState.habitLogs}
            onAddHabit={handleAddHabit}
            onUpdateHabit={handleUpdateHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleHabit={handleToggleHabit}
            onBack={() => setActiveTab('HOME')}
            currentDate={systemDate}
          />
        ) : (
          <DietTab 
            dietConfig={userState.dietConfig}
            onUpdateDiet={handleUpdateDiet}
            onBack={() => setActiveTab('HOME')}
          />
        )}
      </main>

      {isCheckingIn && (
        <CheckInForm 
          onSubmit={handleCheckIn} 
          onCancel={() => setIsCheckingIn(false)}
          history={userState.checkIns}
          currentDate={systemDate}
          systemTime={systemTime}
        />
      )}

      {isConsultingMentor && (
        <LiveMentor 
          onClose={() => {
            setIsConsultingMentor(false);
            setAutoStartGuru(false);
          }} 
          systemDate={systemDate}
          systemTime={systemTime}
          aiModelName={userState.aiModelName || 'Mentor Fenrir'}
          autoStart={autoStartGuru}
        />
      )}

      <footer className="mt-auto pt-16 opacity-5 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-[1.5em] block text-center">NO ESCAPE</span>
      </footer>
    </div>
  );
};

export default App;
