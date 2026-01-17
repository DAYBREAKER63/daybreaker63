
import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Domain, Habit, HabitLog } from '../types';

interface StructureTabProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  onAddHabit: (domain: Domain, name: string) => void;
  onUpdateHabit: (id: string, name: string, domain: Domain) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabit: (habitId: string) => void;
  onBack: () => void;
  currentDate: string;
}

const DOMAINS: { key: Domain; label: string }[] = [
  { key: 'Sleep', label: 'Sleep' },
  { key: 'Physical', label: 'Physical' },
  { key: 'Attention', label: 'Attention' },
  { key: 'Control', label: 'Control' },
  { key: 'Order', label: 'Order' },
];

const StructureTab: React.FC<StructureTabProps> = ({ 
  habits, 
  habitLogs, 
  onAddHabit, 
  onUpdateHabit,
  onDeleteHabit,
  onToggleHabit, 
  onBack, 
  currentDate 
}) => {
  const [newHabitName, setNewHabitName] = useState<Partial<Record<Domain, string>>>({});
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState<Domain>('Sleep');

  const todayLog = habitLogs.find(l => l.date === currentDate);

  const radarData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    return DOMAINS.map(domain => {
      const domainHabits = habits.filter(h => h.domain === domain.key);
      if (domainHabits.length === 0) return { subject: domain.key, A: 0, fullMark: 100 };

      let totalCompletions = 0;
      let totalPossible = domainHabits.length * 7;

      last7Days.forEach(date => {
        const log = habitLogs.find(l => l.date === date);
        if (log) {
          const completedCount = domainHabits.filter(h => log.completedHabitIds.includes(h.id)).length;
          totalCompletions += completedCount;
        }
      });

      const score = Math.round((totalCompletions / totalPossible) * 100);
      return { subject: domain.key, A: score, fullMark: 100 };
    });
  }, [habits, habitLogs, currentDate]);

  const handleAdd = (domain: Domain) => {
    const rawName = newHabitName[domain];
    if (!rawName) return;
    
    const name = rawName.trim();
    if (name.length < 3) return;

    const isDuplicate = habits.some(h => h.domain === domain && h.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setNewHabitName(prev => ({ ...prev, [domain]: '' }));
      return;
    }

    onAddHabit(domain, name);
    setNewHabitName(prev => ({ ...prev, [domain]: '' }));
  };

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    setEditDomain(habit.domain);
  };

  const saveEdit = () => {
    if (editingHabitId && editName.trim().length >= 3) {
      onUpdateHabit(editingHabitId, editName.trim(), editDomain);
      setEditingHabitId(null);
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onBack}
          className="self-start text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 hover:text-zinc-500 transition-colors flex items-center gap-2 group"
        >
          <span className="text-xs transition-transform group-hover:-translate-x-1">←</span> BACK
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{currentDate}</span>
      </div>

      <section className="space-y-16">
        {DOMAINS.map(domain => {
          const domainHabits = habits.filter(h => h.domain === domain.key);
          return (
            <div key={domain.key} className="space-y-6">
              <div className="space-y-4">
                {domainHabits.map(habit => {
                  const isCompleted = todayLog?.completedHabitIds.includes(habit.id);
                  const isEditing = editingHabitId === habit.id;

                  if (isEditing) {
                    return (
                      <div key={habit.id} className="border border-zinc-900 p-4 space-y-4">
                        <input 
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-black border-b border-zinc-800 text-[11px] font-bold uppercase tracking-widest text-white outline-none focus:border-white pb-1"
                        />
                        <div className="flex flex-wrap gap-2">
                          {DOMAINS.map(d => (
                            <button
                              key={d.key}
                              onClick={() => setEditDomain(d.key)}
                              className={`text-[8px] px-2 py-1 border font-black uppercase tracking-widest ${editDomain === d.key ? 'bg-white text-black border-white' : 'text-zinc-700 border-zinc-900 hover:text-zinc-400'}`}
                            >
                              {d.key}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <button 
                            onClick={() => onDeleteHabit(habit.id)}
                            className="text-[8px] font-black uppercase text-red-900 hover:text-red-600"
                          >
                            [ DELETE ]
                          </button>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setEditingHabitId(null)}
                              className="text-[9px] font-black uppercase text-zinc-600 hover:text-zinc-400"
                            >
                              CANCEL
                            </button>
                            <button 
                              onClick={saveEdit}
                              className="text-[9px] font-black uppercase text-white hover:text-zinc-300"
                            >
                              SAVE
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={habit.id} 
                      className="flex items-center justify-between py-2.5 border-b border-transparent group"
                    >
                      <div 
                        className="flex-1 cursor-pointer flex items-baseline gap-4"
                        onClick={() => onToggleHabit(habit.id)}
                      >
                        <span className={`text-[11px] uppercase font-bold tracking-widest transition-colors ${isCompleted ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                          {habit.name}
                        </span>
                        {!isCompleted && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(habit);
                            }}
                            className="text-[8px] font-black tracking-widest text-zinc-900 group-hover:text-zinc-700 transition-colors uppercase"
                          >
                            [ EDIT ]
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => onToggleHabit(habit.id)}>
                        <div className={`w-4 h-4 border transition-all ${isCompleted ? 'bg-white border-white' : 'border-zinc-800'}`}>
                          {isCompleted && (
                            <div className="w-full h-full flex items-center justify-center">
                               <div className="w-1.5 h-1.5 bg-black" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900/30">
                <input 
                  type="text"
                  placeholder={`ADD ${domain.key.toUpperCase()} HABIT`}
                  className="bg-transparent text-[9px] font-bold uppercase tracking-widest text-zinc-800 outline-none w-full placeholder:text-zinc-900 border-b border-transparent focus:border-zinc-700 transition-colors pb-1"
                  value={newHabitName[domain.key] || ''}
                  onChange={(e) => setNewHabitName(prev => ({ ...prev, [domain.key]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd(domain.key)}
                />
                <button 
                  onClick={() => handleAdd(domain.key)}
                  disabled={!newHabitName[domain.key]?.trim() || newHabitName[domain.key]!.trim().length < 3}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-900 hover:text-white transition-colors disabled:opacity-0"
                >
                  [ COMMIT ]
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="pt-24 border-t border-zinc-950">
        <div className="h-[250px] w-full pointer-events-none opacity-20 grayscale">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#111" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={false}
              />
              <Radar
                name="Structure"
                dataKey="A"
                stroke="#444"
                fill="#fff"
                fillOpacity={0.02}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default StructureTab;
