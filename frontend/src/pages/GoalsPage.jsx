import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { GoalTracker } from '../components/GoalTracker';
import { Target, Plus, Filter, Sparkles, X } from 'lucide-react';

export const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState(30);
  const [unit, setUnit] = useState('hours');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchGoalsAndSkills = async () => {
    try {
      const [goalsRes, skillsRes] = await Promise.all([
        api.get('/api/goals'),
        api.get('/api/skills')
      ]);
      if (goalsRes.success) setGoals(goalsRes.data || []);
      if (skillsRes.success) {
        setSkills(skillsRes.data || []);
        if (skillsRes.data.length > 0 && !skillId) {
          setSkillId(skillsRes.data[0].skill_id);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStarterPack = async () => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/skills/starter-pack');
      if (res.success) {
        await fetchGoalsAndSkills();
      }
    } catch (err) {
      alert(err.message || 'Failed to seed starter pack');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndSkills();
  }, []);

  const handleToggleMilestone = async (milestoneId, newStatus) => {
    try {
      const res = await api.put(`/api/goals/milestones/${milestoneId}`, { achieved: newStatus });
      if (res.success) {
        // Refresh goals to get updated percentages
        fetchGoalsAndSkills();
      }
    } catch (err) {
      alert(err.message || 'Failed to update milestone');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!skillId) {
      setError('Please select or create a skill first');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a goal title');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/goals', {
        skill_id: parseInt(skillId),
        title: title.trim(),
        target_value: parseFloat(targetValue),
        unit,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      });

      if (res.success) {
        setTitle('');
        setShowAddModal(false);
        fetchGoalsAndSkills();
      }
    } catch (err) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (statusFilter === 'ALL') return true;
    return g.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Target className="w-7 h-7 text-indigo-400" />
            Learning Goals & Milestones
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Turn ambitious skills into achievable target milestones. Automatically synced as you practice.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-violet-indigo text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Set New Goal
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === st
                ? 'gradient-violet-indigo text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st === 'ALL' ? 'All Goals' : st === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading learning goals...</div>
      ) : filteredGoals.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Goals Found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Break your practice into measurable objectives to accelerate mastery.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 rounded-xl gradient-violet-indigo text-white text-xs font-bold"
          >
            + Set Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => (
            <GoalTracker
              key={goal.goal_id}
              goal={goal}
              onToggleMilestone={handleToggleMilestone}
            />
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gradient-violet-indigo text-white">
              <h3 className="font-bold text-base">Set Learning Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-black/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30">{error}</div>}

              {skills.length === 0 && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
                  <span>No hobbies in your portfolio yet!</span>
                  <button
                    type="button"
                    onClick={handleLoadStarterPack}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                  >
                    ⚡ Load Starters
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Skill *</label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {skills.length === 0 && <option value="">No skills available - add a skill first</option>}
                  {skills.map((s) => (
                    <option key={s.skill_id} value={s.skill_id}>{s.skill_name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Goal Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Practice 30 hours of fingerstyle acoustic guitar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Value *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="projects">Projects</option>
                    <option value="sessions">Sessions</option>
                    <option value="chapters">Chapters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Completion Date (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                💡 4 proportional milestones (25%, 50%, 75%, 100%) will be automatically generated and synced with your practice logs!
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || skills.length === 0}
                  className="px-5 py-2 gradient-violet-indigo text-white text-xs font-bold rounded-xl shadow hover:brightness-110 active:scale-95"
                >
                  {submitting ? 'Setting...' : 'Set Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
