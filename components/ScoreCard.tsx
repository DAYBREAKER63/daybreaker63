
import React from 'react';
import { getControlIndexStatus } from '../constants';

interface ScoreCardProps {
  score: number;
  streak: number;
  onReset?: () => void;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score, streak, onReset }) => {
  const status = getControlIndexStatus(score);
  
  const statusColors: Record<string, string> = {
    'GROUNDED': 'text-white',
    'STABLE': 'text-white',
    'UNSTABLE': 'text-zinc-500',
    'CRITICAL': 'text-red-800',
  };

  return (
    <div className="flex flex-col gap-12">
      <section>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 block mb-2">Control Index</span>
        <div className="flex items-baseline gap-4">
          <span className={`text-4xl font-black italic tracking-tighter ${statusColors[status]}`}>
            {score || '--'}
          </span>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            — {status}
          </span>
        </div>
      </section>

      <section>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 block mb-2">Streak Status</span>
        <div className="flex flex-col">
          {streak === 0 ? (
            <div className="space-y-6 self-start">
              <div className="border-b border-red-900/40 pb-1">
                <span className="text-3xl font-black italic tracking-tighter text-red-900 uppercase">
                  Streak Broken
                </span>
                <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-1">
                  Reset required.
                </p>
              </div>
              
              <button 
                onClick={onReset}
                className="group flex items-baseline gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-colors"
              >
                <span>[</span>
                <span className="group-hover:px-2 transition-all">INITIALIZE NEW ATTEMPT</span>
                <span>]</span>
              </button>
            </div>
          ) : (
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black italic tracking-tighter text-white">
                {streak}
              </span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Nights
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ScoreCard;
