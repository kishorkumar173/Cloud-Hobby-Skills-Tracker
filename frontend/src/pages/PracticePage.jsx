import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Clock, Plus, Trash2, Calendar, Award, Sparkles, Filter } from 'lucide-react';

export const PracticePage = ({ onOpenPracticeModal }) => {
  const [sessions, setSessions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPracticeAndSkills = async () => {
    try {
      const [sessionsRes, skillsRes] = await Promise.all([
        api.get('/api/practice'),
        api.get('/api/skills')
      ]);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
      if (skillsRes.success) setSkills(skillsRes.data || []);
    } catch (err) {
      console.error('Failed to load practice logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeAndSkills();
  }, []);

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this practice session record?')) return;
    try {
      await api.delete(`/api/practice/${sessionId}`);
      setSessions(sessions.filter(s => s.session_id !== sessionId));
    } catch (err) {
      alert(err.message || 'Failed to delete practice session');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!selectedSkillFilter) return true;
    return s.skill_id === parseInt(selectedSkillFilter);
  });

  const totalMinutes = filteredSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-emerald-400" />
            Practice Session Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every minute practiced is permanently logged into cloud storage and database telemetry.
          </p>
        </div>

        <button
          onClick={() => onOpenPracticeModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-emerald-teal text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Practice Session
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="glass-panel p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-emerald-teal flex items-center justify-center text-white shadow">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Filtered Hours</span>
            <div className="text-2xl font-black text-white">{totalHours} <span className="text-sm font-semibold text-slate-400">hrs</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-blue-cyan flex items-center justify-center text-white shadow">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Practice Sessions</span>
            <div className="text-2xl font-black text-white">{filteredSessions.length} <span className="text-sm font-semibold text-slate-400">entries</span></div>
          </div>
        </div>

        {/* Skill filter */}
        <div className="flex flex-col justify-center">
          <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter By Discipline
          </label>
          <select
            value={selectedSkillFilter}
            onChange={(e) => setSelectedSkillFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Disciplines & Hobbies</option>
            {skills.map((s) => (
              <option key={s.skill_id} value={s.skill_id}>{s.skill_name} ({s.category})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Session History List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading practice sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Sessions Logged</h4>
          <p className="text-xs text-slate-400 mt-1">
            {selectedSkillFilter ? 'No practice recorded for this skill yet.' : 'Start logging your daily practice to build your streak!'}
          </p>
          <button
            onClick={() => onOpenPracticeModal()}
            className="mt-4 px-4 py-2 rounded-xl gradient-emerald-teal text-white text-xs font-bold"
          >
            + Log Practice Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((s) => (
            <div 
              key={s.session_id}
              className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-black">{s.duration_minutes}</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-500">min</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {s.skill_name}
                    </span>
                    <h4 className="text-sm font-bold text-white">{s.activity}</h4>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      "{s.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {s.practiced_at ? new Date(s.practiced_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </span>

                <button
                  onClick={() => handleDeleteSession(s.session_id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete practice record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
