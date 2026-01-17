
import React from 'react';
import { CheckIn } from '../types';

interface AIEvaluatorProps {
  lastCheckIn: CheckIn;
}

const AIEvaluator: React.FC<AIEvaluatorProps> = ({ lastCheckIn }) => {
  if (!lastCheckIn.aiFeedback) return null;

  const { observation, interpretation, command } = lastCheckIn.aiFeedback;

  return (
    <div className="flex flex-col gap-12 mt-4">
      <section>
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 mb-6">Tonight's Command</h4>
        <p className="text-white text-3xl font-black uppercase tracking-tight italic command-text">
          {command}
        </p>
      </section>

      <div className="space-y-8 pt-12 border-t border-zinc-900">
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800 mb-2">Observation</h4>
          <p className="text-zinc-600 text-sm leading-relaxed max-w-sm">{observation}</p>
        </section>
        
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800 mb-2">Interpretation</h4>
          <p className="text-zinc-600 text-sm leading-relaxed max-w-sm">{interpretation}</p>
        </section>
      </div>
    </div>
  );
};

export default AIEvaluator;
