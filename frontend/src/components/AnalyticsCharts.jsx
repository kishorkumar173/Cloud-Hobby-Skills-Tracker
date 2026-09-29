import React from 'react';
import { 
  BarChart2, 
  PieChart, 
  Flame, 
  Award, 
  CheckCircle, 
  Lock, 
  Sparkles,
  Footprints,
  Zap,
  Layers,
  Trophy,
  Crown,
  MessageSquare
} from 'lucide-react';

const badgeIconMap = {
  Footprints,
  Flame,
  Zap,
  Layers,
  Trophy,
  Crown,
  MessageSquare
};

export const WeeklyTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-xs text-slate-500">No practice sessions logged this week</div>;
  }

  const maxHours = Math.max(...data.map(d => d.hours), 1);

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Weekly Practice Trend (Hours)
          </h4>
          <p className="text-xs text-slate-400">Daily practice volume over the past 7 days</p>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
          Last 7 Days
        </span>
      </div>

      <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
        {data.map((item, idx) => {
          const heightPct = Math.max(10, Math.round((item.hours / maxHours) * 100));
          const isPeak = item.hours === maxHours && item.hours > 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <span className={`text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
                isPeak ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {item.hours}h
              </span>
              
              <div className="w-full max-w-[36px] bg-slate-800/80 rounded-t-xl h-full flex items-end overflow-hidden">
                <div 
                  className={`w-full rounded-t-xl transition-all duration-700 ease-out ${
                    isPeak 
                      ? 'gradient-amber-flame shadow-lg shadow-orange-500/30' 
                      : item.hours > 0 
                      ? 'gradient-purple-pink' 
                      : 'bg-slate-800'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              <div className="text-center">
                <span className={`text-xs font-bold block ${isPeak ? 'text-amber-300' : 'text-slate-400'}`}>
                  {item.day}
                </span>
                <span className="text-[10px] text-slate-500 block">{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SkillDistributionChart = ({ skillsData = [] }) => {
  if (!skillsData || skillsData.length === 0) {
    return <div className="text-center py-8 text-xs text-slate-500">No skill hours recorded yet</div>;
  }

  const total = skillsData.reduce((acc, curr) => acc + curr.hours, 0) || 1;
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600'
  ];

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-pink-400" /> Practice Hours by Skill
          </h4>
          <p className="text-xs text-slate-400">Total hours invested per discipline</p>
        </div>
        <span className="text-xs font-extrabold text-white">
          {total.toFixed(1)} hrs total
        </span>
      </div>

      <div className="space-y-3.5">
        {skillsData.map((item, idx) => {
          const pct = Math.round((item.hours / total) * 100);
          const colorClass = colors[idx % colors.length];
          return (
            <div key={item.skill} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">{item.skill}</span>
                <span className="text-slate-400">{item.hours}h ({pct}%)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${colorClass} progress-fill`} 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BadgesShowcase = ({ badges = [] }) => {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Gamified Achievements & Badges
          </h4>
          <p className="text-xs text-slate-400">Milestones unlocked through continuous cloud practice</p>
        </div>
        <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          {badges.filter(b => b.unlocked).length} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {badges.map((b) => {
          const Icon = badgeIconMap[b.icon] || Sparkles;
          return (
            <div 
              key={b.id}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                b.unlocked 
                  ? 'bg-slate-900/90 border-slate-700/80 shadow-md hover:scale-105' 
                  : 'bg-slate-950/40 border-slate-900 opacity-40 grayscale'
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-2 shadow-md ${
                b.unlocked ? `bg-gradient-to-br ${b.color}` : 'bg-slate-800 text-slate-500'
              }`}>
                {b.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-white leading-tight">{b.name}</span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{b.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
