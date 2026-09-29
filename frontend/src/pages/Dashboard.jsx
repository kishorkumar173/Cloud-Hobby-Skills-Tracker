import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { StreakBadge } from '../components/StreakBadge';
import { SkillCard } from '../components/SkillCard';
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
  Plus,
  Calendar,
  Cloud,
  ChevronRight,
  Loader2
} from 'lucide-react';

const popularStarters = [
  { name: 'Python & Cloud Coding', category: 'Coding', icon: '💻' },
  { name: 'Acoustic Guitar', category: 'Music', icon: '🎸' },
  { name: 'Digital Photography', category: 'Photography', icon: '📷' },
  { name: 'Fitness & Gym Workout', category: 'Fitness', icon: '🏋️' },
  { name: 'Digital Art & Painting', category: 'Art', icon: '🎨' },
  { name: 'Cooking & Culinary', category: 'Cooking', icon: '🍳' }
];

export const Dashboard = ({ onNavigate, onOpenPracticeModal }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingStarter, setAddingStarter] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, skillsRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/skills')
      ]);
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }
      if (skillsRes.success) {
        setSkills(skillsRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load cloud analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickAddStarter = async (starter) => {
    try {
      setAddingStarter(true);
      const res = await api.post('/api/skills', {
        skill_name: starter.name,
        category: starter.category,
        current_level: 'BEGINNER',
        target_level: 'ADVANCED',
        description: `Practicing and advancing skills in ${starter.name}.`
      });
      if (res.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add hobby');
    } finally {
      setAddingStarter(false);
    }
  };

  const handleLoadStarterPack = async () => {
    try {
      setAddingStarter(true);
      const res = await api.post('/api/skills/starter-pack');
      if (res.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      alert(err.message || 'Failed to load starter pack');
    } finally {
      setAddingStarter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Cloud Analytics & Portfolio...</p>
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

      {/* 4 KPI Metric Cards */}
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
          value={analytics?.active_skills_count || skills.length || 0}
          unit="skills"
          subtext="Click to view & manage"
          icon={Award}
          gradient="gradient-blue-cyan"
          badge={{ label: 'Manage', text: 'View All →', color: 'bg-cyan-500/20 text-cyan-300' }}
          onClick={() => onNavigate('skills')}
        />

        <StatCard
          title="Goals Completed"
          value={analytics?.goals_completed || 0}
          unit="goals"
          subtext={`${analytics?.active_goals || 0} active in progress`}
          icon={Target}
          gradient="gradient-emerald-teal"
          badge={{ label: 'Milestones', text: `${analytics?.milestones_achieved || 0} achieved`, color: 'bg-emerald-500/20 text-emerald-300' }}
          onClick={() => onNavigate('goals')}
        />

        <StatCard
          title="Community Echo"
          value={analytics?.likes_received || 0}
          unit="likes"
          subtext={`${analytics?.posts_count || 0} posts shared`}
          icon={Heart}
          gradient="gradient-amber-flame"
          badge={{ label: 'Comments', text: `${analytics?.comments_received || 0}`, color: 'bg-amber-500/20 text-amber-300' }}
          onClick={() => onNavigate('community')}
        />

      </div>

      {/* MY HOBBIES & SKILLS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              My Hobbies & Skills Portfolio
            </h3>
            <p className="text-xs text-slate-400">
              Click any card to explore details, or tap <span className="text-emerald-400 font-semibold">+ Practice</span> to record time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('skills')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 transition-all"
            >
              <span>+ Add / View All ({skills.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {skills.length === 0 ? (
          /* Empty state with 1-click starter chips */
          <div className="glass-panel p-6 border-dashed border-indigo-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">You haven't added any hobbies or skills yet!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Pick a popular hobby below to add it in 1 second, or load the recommended starter pack to begin tracking immediately:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 max-w-3xl mx-auto pt-1">
              {popularStarters.map((starter) => (
                <button
                  key={starter.name}
                  disabled={addingStarter}
                  onClick={() => handleQuickAddStarter(starter)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/30 transition-all group active:scale-95"
                  title={`Add ${starter.name}`}
                >
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{starter.icon}</span>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 text-center leading-tight line-clamp-2">
                    {starter.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1 font-semibold">{starter.category}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                disabled={addingStarter}
                onClick={handleLoadStarterPack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:brightness-110 active:scale-95"
              >
                {addingStarter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>⚡ Load Starter Pack (3 Skills)</span>
              </button>

              <button
                onClick={() => onNavigate('skills')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                + Create Custom Skill
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {skills.slice(0, 3).map((skill) => (
              <SkillCard
                key={skill.skill_id}
                skill={skill}
                onLogPractice={() => onOpenPracticeModal(skill.skill_id)}
                onViewDetails={() => onNavigate('skills')}
              />
            ))}
          </div>
        )}
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
