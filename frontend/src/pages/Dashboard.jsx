import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { StreakBadge } from '../components/StreakBadge';
import { WeeklyTrendChart, SkillDistributionChart, BadgesShowcase } from '../components/AnalyticsCharts';
import { GoalTracker } from '../components/GoalTracker';
import { 
  Clock, 
  Award, 
  Target, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  MessageSquare,
  PlusCircle,
  Calendar,
  Cloud
} from 'lucide-react';

export const Dashboard = ({ onNavigate, onOpenPracticeModal }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/analytics/dashboard');
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load cloud analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Cloud Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-purple-950/50 to-slate-950/80 border-indigo-500/30">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Cloud Command Center
              </span>
              <span className="text-xs text-slate-400">Multi-Device Synced</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              WELCOME BACK, <span className="text-gradient-purple">{user?.name?.toUpperCase() || 'LEARNER'}</span>!
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              Your decentralized skills and practice records are live in the cloud. Keep your momentum burning and inspire your peers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPracticeModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-emerald-teal text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              Log Practice Session
            </button>
            <button
              onClick={() => onNavigate('community')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              Share Proof
            </button>
          </div>

        </div>
      </div>

      {/* Streak Banner */}
      <StreakBadge 
        currentStreak={analytics?.current_streak || 0} 
        longestStreak={analytics?.longest_streak || 0} 
      />

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatCard
          title="Total Practice Time"
          value={analytics?.total_practice_hours || 0}
          unit="hrs"
          subtext={`Weekly: +${analytics?.weekly_practice_hours || 0} hrs`}
          icon={Clock}
          gradient="gradient-purple-pink"
          badge={{ label: 'Monthly', text: `${analytics?.monthly_practice_hours || 0} hrs`, color: 'bg-indigo-500/20 text-indigo-300' }}
        />

        <StatCard
          title="Active Disciplines"
          value={analytics?.active_skills_count || 0}
          unit="skills"
          subtext={`Top: ${analytics?.most_practiced_skill || 'None'}`}
          icon={Award}
          gradient="gradient-blue-cyan"
          badge={{ label: 'Completed', text: `${analytics?.completed_skills_count || 0}`, color: 'bg-cyan-500/20 text-cyan-300' }}
        />

        <StatCard
          title="Goals Completed"
          value={analytics?.goals_completed || 0}
          unit="goals"
          subtext={`${analytics?.active_goals || 0} active in progress`}
          icon={Target}
          gradient="gradient-emerald-teal"
          badge={{ label: 'Milestones', text: `${analytics?.milestones_achieved || 0} achieved`, color: 'bg-emerald-500/20 text-emerald-300' }}
        />

        <StatCard
          title="Community Echo"
          value={analytics?.likes_received || 0}
          unit="likes"
          subtext={`${analytics?.posts_count || 0} posts shared`}
          icon={Heart}
          gradient="gradient-amber-flame"
          badge={{ label: 'Comments', text: `${analytics?.comments_received || 0}`, color: 'bg-amber-500/20 text-amber-300' }}
        />

      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyTrendChart data={analytics?.weekly_trend || []} />
        <SkillDistributionChart skillsData={analytics?.hours_by_skill || []} />
      </div>

      {/* Gamified Badges & Achievements */}
      <BadgesShowcase badges={analytics?.badges || []} />

      {/* Goals & Recent Practice Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goals Progress list */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Active Learning Goals
              </h4>
              <p className="text-xs text-slate-400">Real-time completion telemetry</p>
            </div>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View All Goals →
            </button>
          </div>

          {analytics?.goals_summary && analytics.goals_summary.length > 0 ? (
            <div className="space-y-3">
              {analytics.goals_summary.slice(0, 3).map((g) => (
                <div key={g.goal_id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{g.title}</span>
                    <span className="text-indigo-400 font-bold">{g.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full gradient-emerald-teal progress-fill"
                      style={{ width: `${g.progress_percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{g.skill_name}</span>
                    <span>{g.current} / {g.target} {g.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No learning goals set yet. Click to create one!
            </div>
          )}
        </div>

        {/* Recent Practice Activity */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Recent Practice Sessions
              </h4>
              <p className="text-xs text-slate-400">Latest activity records in cloud database</p>
            </div>
            <button
              onClick={() => onNavigate('practice')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View History →
            </button>
          </div>

          {analytics?.recent_sessions && analytics.recent_sessions.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.recent_sessions.map((s) => (
                <div key={s.session_id} className="flex items-start justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{s.skill_name}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                        +{s.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{s.activity}</p>
                    {s.notes && <p className="text-slate-500 italic mt-0.5">"{s.notes}"</p>}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {s.practiced_at ? new Date(s.practiced_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No sessions logged yet. Record your first practice today!
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
