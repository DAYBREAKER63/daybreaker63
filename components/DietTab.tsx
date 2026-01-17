
import React, { useState, useMemo } from 'react';
import { DietConfig } from '../types';
import { generateDietPlan } from '../services/geminiService';

interface DietTabProps {
  dietConfig?: DietConfig;
  onUpdateDiet: (config: DietConfig) => void;
  onBack: () => void;
}

const DietTab: React.FC<DietTabProps> = ({ dietConfig, onUpdateDiet, onBack }) => {
  const [localConfig, setLocalConfig] = useState<DietConfig>(dietConfig || {
    weight: 75,
    height: 180,
    age: 20,
    goal: 'Gain'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<{ text: string; sources: any[] } | null>(null);

  // Mifflin-St Jeor Calculation
  const calculations = useMemo(() => {
    const bmr = (10 * localConfig.weight) + (6.25 * localConfig.height) - (5 * localConfig.age) + 5;
    const tdee = Math.round(bmr * 1.55); // Assuming moderate activity for this age group
    const target = localConfig.goal === 'Gain' ? tdee + 500 : tdee - 500;
    return { bmr, tdee, target };
  }, [localConfig]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    onUpdateDiet(localConfig);
    try {
      const result = await generateDietPlan(localConfig);
      setPlanData(result);
    } catch (err: any) {
      console.error("Diet Tab Error:", err);
      setError("Network or Protocol Error. Verify connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 pb-20">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="self-start text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 hover:text-zinc-500 transition-colors flex items-center gap-2 group"
        >
          <span className="text-xs transition-transform group-hover:-translate-x-1">←</span> BACK
        </button>
        <div className="text-right">
           <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 block">System Data</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-white">NUTRITION</span>
        </div>
      </div>

      <section className="space-y-12">
        <div className="grid grid-cols-2 gap-6">
          <InputGroup 
            label="Weight (kg)" 
            value={localConfig.weight} 
            onChange={(v) => setLocalConfig(p => ({ ...p, weight: Number(v) }))}
            type="number"
          />
          <InputGroup 
            label="Height (cm)" 
            value={localConfig.height} 
            onChange={(v) => setLocalConfig(p => ({ ...p, height: Number(v) }))}
            type="number"
          />
        </div>
        
        <InputGroup 
          label="Age" 
          value={localConfig.age} 
          onChange={(v) => setLocalConfig(p => ({ ...p, age: Number(v) }))}
          type="number"
        />

        <div className="space-y-4">
          <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block">Objective</label>
          <div className="flex gap-4">
            <GoalButton 
              active={localConfig.goal === 'Gain'} 
              onClick={() => setLocalConfig(p => ({ ...p, goal: 'Gain' }))}
              label="Weight Gain"
            />
            <GoalButton 
              active={localConfig.goal === 'Lose'} 
              onClick={() => setLocalConfig(p => ({ ...p, goal: 'Lose' }))}
              label="Weight Loss"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 space-y-6">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Caloric Target</span>
            <span className="text-2xl font-black italic text-white tabular-nums">{calculations.target} kcal</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
            Based on a TDEE of {calculations.tdee} kcal. {localConfig.goal === 'Gain' ? 'Surplus (+500)' : 'Deficit (-500)'} applied for optimal biological response.
          </p>
        </div>

        {error && (
          <div className="p-4 border border-red-900/40 bg-red-950/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-700">{error}</p>
          </div>
        )}

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full border border-white text-white font-black py-5 px-6 hover:bg-white hover:text-black transition-all uppercase tracking-[0.4em] text-[10px]"
        >
          {loading ? 'RESEARCHING PROTOCOL...' : 'GENERATE AI PLAN'}
        </button>
      </section>

      {planData && (
        <section className="pt-16 border-t border-zinc-900 space-y-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Nutritional Protocol</h3>
          <div className="prose prose-invert max-w-none">
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {planData.text}
            </div>
          </div>
          
          {planData.sources.length > 0 && (
            <div className="space-y-4">
               <h4 className="text-[8px] font-black uppercase tracking-widest text-zinc-800">Grounding Sources</h4>
               <div className="flex flex-col gap-2">
                 {planData.sources.map((chunk: any, i: number) => {
                   if (!chunk.web) return null;
                   return (
                     <a 
                       key={i} 
                       href={chunk.web.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-[9px] text-zinc-700 hover:text-white transition-colors truncate uppercase font-bold tracking-widest"
                     >
                       [{i+1}] {chunk.web.title}
                     </a>
                   );
                 })}
               </div>
            </div>
          )}
        </section>
      )}

      <section className="pt-16 border-t border-zinc-950 opacity-50">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800 mb-6">Theory</h3>
        <p className="text-[10px] text-zinc-600 leading-relaxed uppercase font-bold tracking-widest">
          Weight management is a thermodynamic calculation. Gain requires a persistent caloric surplus to fuel protein synthesis. Loss requires a persistent deficit to force lipid oxidation. Emotions are irrelevant to the chemical process.
        </p>
      </section>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: number; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-3">
    <label className="text-[10px] uppercase font-black text-zinc-700 tracking-[0.3em] block">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-zinc-900 py-2 text-xl font-black italic text-white outline-none focus:border-white/20 transition-colors tabular-nums"
    />
  </div>
);

const GoalButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 border text-[9px] font-black uppercase tracking-[0.3em] transition-all ${active ? 'bg-white text-black border-white' : 'border-zinc-900 text-zinc-700 hover:border-zinc-700'}`}
  >
    {label}
  </button>
);

export default DietTab;
