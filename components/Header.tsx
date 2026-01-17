
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  activeTab: 'HOME' | 'STRUCTURE' | 'DIET';
  onTabChange: (tab: 'HOME' | 'STRUCTURE' | 'DIET') => void;
  systemDate: string;
  setSystemDate: (date: string) => void;
  systemTime: string;
  setSystemTime: (time: string) => void;
  aiModelName: string;
  onUpdateAIName: (name: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onTabChange, 
  systemDate, 
  setSystemDate, 
  systemTime, 
  setSystemTime,
  aiModelName,
  onUpdateAIName
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="flex flex-col gap-6 mb-12 relative">
      <div className="flex justify-between items-baseline opacity-40">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xs font-black tracking-[0.6em] uppercase">FRAME</h1>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-white transition-colors group p-1 -m-1"
            aria-label="System Settings"
          >
            <svg 
              className="w-2.5 h-2.5 fill-current transition-transform group-hover:rotate-45" 
              viewBox="0 0 24 24"
            >
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex gap-4 items-baseline">
          <span className="text-[9px] font-mono uppercase tracking-widest tabular-nums text-white/50">{systemTime}</span>
          <span className="text-[9px] font-mono uppercase tracking-widest">v1.0.7-FG</span>
        </div>
      </div>
      
      <nav className="flex gap-8 border-b border-zinc-900 pb-2">
        <button 
          onClick={() => onTabChange('HOME')}
          className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${activeTab === 'HOME' ? 'text-white' : 'text-zinc-800 hover:text-zinc-600'}`}
        >
          Home
        </button>
        <button 
          onClick={() => onTabChange('STRUCTURE')}
          className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${activeTab === 'STRUCTURE' ? 'text-white' : 'text-zinc-800 hover:text-zinc-600'}`}
        >
          Structure
        </button>
        <button 
          onClick={() => onTabChange('DIET')}
          className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${activeTab === 'DIET' ? 'text-white' : 'text-zinc-800 hover:text-zinc-600'}`}
        >
          Diet
        </button>
      </nav>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-8">
          <div className="w-full max-w-xs border border-zinc-900 p-8 space-y-12">
            <header className="flex justify-between items-baseline">
              <span className="text-[10px] font-black tracking-[0.5em] text-zinc-600 uppercase">System Config</span>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-[9px] font-black tracking-widest text-white"
              >
                [ CLOSE ]
              </button>
            </header>

            <section className="space-y-6">
              <div className="space-y-4">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-800 block">AI Identity</label>
                <input 
                  type="text" 
                  value={aiModelName}
                  onChange={(e) => onUpdateAIName(e.target.value)}
                  placeholder="e.g. Mentor Fenrir"
                  className="w-full bg-transparent border-b border-zinc-800 p-3 text-lg font-black uppercase tracking-widest text-white outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-800 block">System Time Override</label>
                <input 
                  type="time" 
                  value={systemTime}
                  onChange={(e) => setSystemTime(e.target.value)}
                  className="w-full bg-transparent border border-zinc-800 p-3 text-2xl font-black italic tracking-tighter text-white outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-900">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-800">System Date Override</label>
                <input 
                  type="date" 
                  value={systemDate}
                  onChange={(e) => setSystemDate(e.target.value)}
                  className="w-full bg-transparent border border-zinc-800 p-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </section>

            <footer className="pt-8 text-center">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 border border-zinc-800 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white hover:border-white transition-all"
              >
                COMMIT SYSTEM PARAMS
              </button>
            </footer>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
