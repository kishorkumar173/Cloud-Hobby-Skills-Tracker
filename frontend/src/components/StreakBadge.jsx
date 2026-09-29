import React from 'react';
import { Flame, Trophy, Zap } from 'lucide-react';

export const StreakBadge = ({ currentStreak = 0, longestStreak = 0 }) => {
  const getMotivationalMessage = (streak) => {
    if (streak === 0) return "Log practice today to ignite your streak!";
    if (streak < 3) return "Great start! Keep the momentum burning.";
    if (streak < 7) return "You're on fire! Unstoppable consistency.";
    if (streak < 14) return "Master of habit! Legendary streak.";
    return "God-tier discipline! You're inspiring the community.";
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-amber-flame flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-flame">
            <Flame className="w-8 h-8 fill-amber-200 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {currentStreak} <span className="text-base font-bold text-amber-400">Day Streak</span>
              </h3>
              {currentStreak > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{getMotivationalMessage(currentStreak)}</p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end pl-4 border-l border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" /> All-Time Best
          </div>
          <span className="text-lg font-bold text-slate-200 mt-0.5">{longestStreak} Days</span>
        </div>

      </div>
    </div>
  );
};
