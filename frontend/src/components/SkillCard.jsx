import React from 'react';
import { 
  Music, 
  Code, 
  Camera, 
  Activity, 
  Palette, 
  BookOpen, 
  Utensils, 
  Sparkles,
  Clock,
  ChevronRight,
  TrendingUp,
  MoreVertical
} from 'lucide-react';

const categoryGradients = {
  Music: 'gradient-purple-pink',
  Coding: 'gradient-blue-cyan',
  Photography: 'gradient-amber-flame',
  Fitness: 'gradient-emerald-teal',
  Art: 'gradient-violet-indigo',
  Cooking: 'gradient-amber-flame',
  Writing: 'gradient-blue-cyan',
  Other: 'gradient-purple-pink'
};

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'music': return Music;
    case 'coding': return Code;
    case 'photography': return Camera;
    case 'fitness': return Activity;
    case 'art': return Palette;
    case 'cooking': return Utensils;
    case 'writing': return BookOpen;
    default: return Sparkles;
  }
};

export const SkillCard = ({ skill, onLogPractice, onViewDetails, onDelete }) => {
  const Icon = getCategoryIcon(skill.category);
  const gradientClass = categoryGradients[skill.category] || 'gradient-purple-pink';

  const levelProgress = {
    BEGINNER: 33,
    INTERMEDIATE: 66,
    ADVANCED: 100
  }[skill.current_level] || 33;

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(skill)}
      className="glass-panel p-5 relative overflow-hidden group flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5"
      title="Click card to view full details and progress"
    >
      
      <div>
        {/* Header: Icon, Category & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${gradientClass} group-hover:scale-105 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{skill.category}</span>
              <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                {skill.skill_name}
              </h4>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            skill.status === 'ACTIVE' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : skill.status === 'COMPLETED'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-slate-700 text-slate-300'
          }`}>
            {skill.status}
          </span>
        </div>

        {/* Description */}
        {skill.description && (
          <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
            {skill.description}
          </p>
        )}

        {/* Level & Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              {skill.current_level}
            </span>
            <span className="text-slate-500 text-[11px]">Goal: {skill.target_level}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${gradientClass} progress-fill`} 
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Hours logged stat */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Total Practice
          </span>
          <span className="font-bold text-white">
            {skill.total_practice_hours || 0} hrs
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLogPractice(skill);
          }}
          className="flex-1 py-2 px-3 rounded-lg gradient-emerald-teal text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>+ Practice</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(skill);
          }}
          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
        >
          Details
        </button>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(skill.skill_id);
            }}
            className="py-2 px-2.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Skill"
          >
            ×
          </button>
        )}
      </div>

    </div>
  );
};
