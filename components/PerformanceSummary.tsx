
import React, { useState } from 'react';
import { getControlIndexStatus } from '../constants';

interface PerformanceSummaryProps {
  score: number;
  streak: number;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ score, streak }) => {
  const [isOpen, setIsOpen] = useState(false);
  const status = getControlIndexStatus(score);

  const getSummaryNote = () => {
    if (streak === 0) return "PROTOCOL RESET DETECTED. BIOLOGICAL BASELINE COMPROMISED. PREVIOUS DATA ARCHIVED. IMMEDIATE RECONSTRUCTION OF DISCIPLINE IS MANDATORY.";
    if (score >= 85) return "PEAK BIOLOGICAL ALIGNMENT. NEURAL CHANNELS CLEAR. ENVIRONMENTAL RESISTANCE IS OPTIMAL. NO DEVIATION PERMITTED.";
    if (score >= 70) return "STABLE PERFORMANCE. RHYTHM ESTABLISHED. TARGETING ELIMINATION OF MINOR FRICTION POINTS. MAINTAIN CURRENT CONSTRAINTS.";
    if (score >= 50) return "WARNING: SYSTEM INSTABILITY. VOLATILITY DETECTED IN NIGHT LOGS. BIOLOGY IS FIGHTING THE PROTOCOL. INCREASE EXTERNAL RIGIDITY.";
    return "CRITICAL SYSTEM BREACH. ENVIRONMENT HAS TAKEN CONTROL OF BEHAVIOR. RE-ESTABLISH FRAME IMMEDIATELY THROUGH PHYSICAL EXERTION.";
  };

  return (
    <div className="mt-8 border-t border-zinc-900 pt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-baseline group outline-none"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800 group-hover:text-zinc-500 transition-colors">
          [ PERFORMANCE SUMMARY ]
        </span>
        <span className="text-[10px] font-black text-zinc-900 group-hover:text-zinc-600 font-mono">
          {isOpen ? '[-]' : '[+]'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-zinc-950 p-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-800 block mb-1">Stability</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{status}</span>
            </div>
            <div className="border border-zinc-950 p-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-800 block mb-1">Momentum</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{streak} NIGHTS</span>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-950/20 border-l border-zinc-900">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 leading-relaxed italic">
              {getSummaryNote()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceSummary;
