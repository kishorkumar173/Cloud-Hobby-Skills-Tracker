import React from 'react';

export const StatCard = ({ title, value, unit = '', subtext, icon: Icon, gradient = 'gradient-purple-pink', badge }) => {
  return (
    <div className="glass-panel p-5 relative overflow-hidden group">
      {/* Background glow circle */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-20 blur-xl ${gradient}`} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
          </div>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${gradient} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {badge && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">{badge.label}</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.color || 'bg-indigo-500/20 text-indigo-300'}`}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
};
