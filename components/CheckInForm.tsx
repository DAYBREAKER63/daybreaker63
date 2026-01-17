
import React, { useState, useMemo } from 'react';
import { NIGHT_SCORING, BASE_SCORE } from '../constants';
import { CheckIn, PhoneTime, ScreenUse, ContentType, SleepTime } from '../types';
import { evaluatePerformance } from '../services/geminiService';

interface CheckInFormProps {
  onSubmit: (checkIn: CheckIn) => void;
  onCancel: () => void;
  history: CheckIn[];
  currentDate: string;
  systemTime: string;
}

const CheckInForm: React.FC<CheckInFormProps> = ({ onSubmit, onCancel, history, currentDate, systemTime }) => {
  const [loading, setLoading] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [log, setLog] = useState({
    phoneTime: '10:15-11' as PhoneTime,
    screenUse: '<30 min' as ScreenUse,
    contentType: 'Clean' as ContentType,
    sleepTime: '11-12' as SleepTime,
    resistedUrge: false,
    disciplinedAction: '',
  });

  const isToday = useMemo(() => {
    return currentDate === new Date().toISOString().split('T')[0];
  }, [currentDate]);

  const hour = parseInt(systemTime.split(':')[0], 10);
  const isTooEarlyForAfter12 = isToday && hour < 23;
  const isPhoneSelectionInvalid = isTooEarlyForAfter12 && log.phoneTime === 'After 12';

  const MIN_CHARS = 10;
  const isActionValid = log.disciplinedAction.trim().length >= MIN_CHARS;
  const isActionEmpty = log.disciplinedAction.trim().length === 0;

  const calculateScore = () => {
    let score = BASE_SCORE;
    score += NIGHT_SCORING.PHONE[log.phoneTime];
    score += NIGHT_SCORING.SCREEN[log.screenUse];
    score += NIGHT_SCORING.CONTENT[log.contentType];
    score += NIGHT_SCORING.SLEEP[log.sleepTime];
    if (log.resistedUrge) score += NIGHT_SCORING.RESISTED_URGE;
    return Math.min(100, Math.max(0, score));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!isActionValid || isPhoneSelectionInvalid) return;
    
    setLoading(true);
    const score = calculateScore();
    
    const newCheckIn: CheckIn = {
      id: crypto.randomUUID(),
      date: currentDate,
      score,
      nightLog: { ...log },
      pillars: {
        discipline: 0.5, sexualControl: 0.5, physicalOutput: 0.5, attentionControl: 0.5, socialConduct: 0.5
      }
    };

    const feedback = await evaluatePerformance(newCheckIn, history);
    newCheckIn.aiFeedback = feedback;

    onSubmit(newCheckIn);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-sm bg-black border border-zinc-900 p-8 pt-24 max-h-[90vh] overflow-y-auto relative scrollbar-hide">
        {/* BACK BUTTON */}
        <button 
          onClick={onCancel}
          className="absolute top-8 left-8 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 hover:text-zinc-500 transition-colors flex items-center gap-2 group"
        >
          <span className="text-xs transition-transform group-hover:-translate-x-1">←</span> BACK
        </button>

        <div className="mb-12 border-b border-zinc-900 pb-4">
           <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 block mb-1">Entry For</span>
           <p className="text-xs font-black tracking-widest text-white uppercase">{currentDate} <span className="text-zinc-700">@ {systemTime}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block">Phone away</label>
              {isPhoneSelectionInvalid && (
                <span className="text-[8px] font-black uppercase tracking-widest text-red-900 animate-pulse">[ FUTURE PREDICTION PROHIBITED ]</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {['Before 10:15', '10:15-11', '11-12', 'After 12'].map(opt => {
                const isForbidden = isTooEarlyForAfter12 && opt === 'After 12';
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => !isForbidden && setLog(prev => ({ ...prev, phoneTime: opt as PhoneTime }))}
                    className={`text-[9px] uppercase py-2.5 px-3.5 border font-black tracking-widest transition-all ${
                      log.phoneTime === opt 
                        ? (isForbidden ? 'border-red-900 text-red-900' : 'bg-white text-black border-white') 
                        : (isForbidden ? 'border-zinc-950 text-zinc-950' : 'border-zinc-900 text-zinc-800 hover:border-zinc-700')
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isPhoneSelectionInvalid && (
              <p className="text-[8px] text-red-900/50 uppercase font-bold tracking-widest leading-relaxed">
                System time is before 11 PM. You cannot log a future failure yet. Wait or correct system clock.
              </p>
            )}
          </div>

          <SelectField 
            label="Screen usage (Post 10PM)" 
            options={['None', '<30 min', '30-60 min', '60+ min']} 
            value={log.screenUse} 
            onChange={(v) => setLog(prev => ({ ...prev, screenUse: v as ScreenUse }))} 
          />

          <SelectField 
            label="Consumption" 
            options={['Clean', 'Reels', 'Sexual', 'Mixed']} 
            value={log.contentType} 
            onChange={(v) => setLog(prev => ({ ...prev, contentType: v as ContentType }))} 
          />

          <SelectField 
            label="Rest time" 
            options={['Before 11', '11-12', 'After 12']} 
            value={log.sleepTime} 
            onChange={(v) => setLog(prev => ({ ...prev, sleepTime: v as SleepTime }))} 
          />

          <div 
            className="flex items-center justify-between cursor-pointer group py-2" 
            onClick={() => setLog(p => ({ ...p, resistedUrge: !p.resistedUrge }))}
          >
            <span className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] group-hover:text-zinc-500 transition-colors">Resisted urge</span>
            <div className={`w-4 h-4 border transition-colors ${log.resistedUrge ? 'bg-white border-white' : 'border-zinc-800 group-hover:border-zinc-700'}`} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block">Disciplined Action</label>
              <div className="flex items-center gap-3">
                {touched && (
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isActionValid ? 'text-zinc-600' : 'text-red-900 animate-pulse'}`}>
                    {isActionEmpty ? '[ REQUIRED ]' : isActionValid ? '[ VALIDATED ]' : '[ TOO BRIEF ]'}
                  </span>
                )}
                <span className={`text-[9px] font-mono font-black tracking-tighter transition-colors ${isActionValid ? 'text-white' : 'text-zinc-800'}`}>
                  {log.disciplinedAction.length}/{MIN_CHARS}
                </span>
              </div>
            </div>
            <textarea 
              required
              rows={3}
              className={`w-full bg-black border p-4 text-sm text-white outline-none transition-all placeholder:text-zinc-900 ${
                touched && !isActionValid 
                  ? 'border-red-900 focus:border-red-800' 
                  : isActionValid 
                    ? 'border-zinc-500 focus:border-white/40' 
                    : 'border-zinc-900 focus:border-zinc-600'
              }`}
              placeholder="Record the objective truth of today's discipline..."
              value={log.disciplinedAction}
              onChange={(e) => {
                setLog(p => ({ ...p, disciplinedAction: e.target.value }));
                if (!touched && e.target.value.length > 2) setTouched(true);
              }}
              onBlur={() => setTouched(true)}
            />
          </div>

          <div className="pt-8 space-y-6">
            <button
              type="submit"
              disabled={loading || (!isActionValid && touched) || isPhoneSelectionInvalid}
              className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.5em] text-[11px] hover:bg-zinc-200 transition-all disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed"
            >
              {loading ? 'PROCESSING...' : 'COMMIT TO LOG'}
            </button>
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              className="w-full text-[9px] uppercase font-black text-zinc-800 tracking-[0.4em] hover:text-zinc-500 transition-colors"
            >
              Discard Draft
            </button>
          </div>
        </form>

        {showDiscardConfirm && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8 z-[60] text-center border border-zinc-900">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-12 italic">Discard current entry?</p>
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full border border-white text-white py-4 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white/5 transition-colors"
              >
                Return to form
              </button>
              <button 
                onClick={onCancel}
                className="w-full text-[9px] uppercase font-black text-zinc-800 tracking-[0.4em] hover:text-red-900 transition-colors py-2"
              >
                Confirm Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SelectField: React.FC<{ label: string; options: string[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div className="space-y-4">
    <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-[9px] uppercase py-2.5 px-3.5 border font-black tracking-widest transition-all ${value === opt ? 'bg-white text-black border-white' : 'border-zinc-900 text-zinc-800 hover:border-zinc-700'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default CheckInForm;
