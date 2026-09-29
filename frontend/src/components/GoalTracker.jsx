import React from 'react';
import { Target, CheckCircle2, Circle, Calendar, Trophy } from 'lucide-react';

export const GoalTracker = ({ goal, onToggleMilestone }) => {
  const isCompleted = goal.status === 'COMPLETED' || goal.progress_percent >= 100;

  return (
    <div className={`glass-panel p-5 relative overflow-hidden transition-all ${
      isCompleted ? 'border-emerald-500/40 bg-emerald-950/10' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
            isCompleted ? 'gradient-emerald-teal' : 'gradient-violet-indigo'
          }`}>
            {isCompleted ? <Trophy className="w-5 h-5 text-amber-200" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              {goal.skill_name || 'General Goal'}
            </span>
            <h4 className="text-base font-bold text-white leading-snug">{goal.title}</h4>
          </div>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          isCompleted 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        }`}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </span>
      </div>

      {/* Progress metrics */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-400">
            Current: <strong className="text-white">{goal.current_value}</strong> / {goal.target_value} {goal.unit}
          </span>
          <span className={`font-black ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>
            {goal.progress_percent}%
          </span>
        </div>

        {/* Capped Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full progress-fill ${
              isCompleted ? 'gradient-emerald-teal' : 'gradient-purple-pink'
            }`}
            style={{ width: `${Math.min(100, goal.progress_percent)}%` }}
          />
        </div>
      </div>

      {/* Milestones Checkpoints */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Milestone Checkpoints ({goal.milestones.filter(m => m.achieved).length}/{goal.milestones.length})
          </span>
          
          <div className="space-y-2">
            {goal.milestones.map((m) => (
              <div 
                key={m.milestone_id}
                onClick={() => onToggleMilestone && onToggleMilestone(m.milestone_id, !m.achieved)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  m.achieved 
                    ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' 
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  {m.achieved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className={m.achieved ? 'line-through text-slate-400 font-medium' : 'font-medium'}>
                    {m.title}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                  {m.target_value} {goal.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadline Info */}
      {goal.deadline && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Target Date: {new Date(goal.deadline).toLocaleDateString()}
        </div>
      )}

    </div>
  );
};
