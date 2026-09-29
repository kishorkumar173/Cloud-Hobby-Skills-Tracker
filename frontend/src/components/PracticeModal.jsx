import React, { useState } from 'react';
import { X, Clock, Award, FileText, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export const PracticeModal = ({ isOpen, onClose, skills = [], defaultSkillId = null, onPracticeLogged }) => {
  const [skillId, setSkillId] = useState(defaultSkillId || (skills[0]?.skill_id || ''));
  const [duration, setDuration] = useState(60);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const quickMinutes = [15, 30, 45, 60, 90, 120];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillId) {
      setError('Please select a skill');
      return;
    }
    if (!activity.trim()) {
      setError('Please describe what you practiced');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/practice', {
        skill_id: parseInt(skillId),
        duration_minutes: parseInt(duration),
        activity: activity.trim(),
        notes: notes.trim() || undefined
      });

      if (res.success) {
        setSuccessInfo(res.data);
        if (onPracticeLogged) onPracticeLogged(res.data);
        setTimeout(() => {
          setSuccessInfo(null);
          setActivity('');
          setNotes('');
          onClose();
        }, 1400);
      }
    } catch (err) {
      setError(err.message || 'Failed to log practice session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gradient-emerald-teal text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-lg">Log Practice Session</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/20 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successInfo ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-white">Practice Logged!</h4>
            <p className="text-sm text-slate-300 mt-1">
              +{successInfo.duration_minutes} minutes recorded for <span className="text-emerald-400 font-bold">{successInfo.skill_name}</span>
            </p>
            {successInfo.current_streak > 0 && (
              <span className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                🔥 {successInfo.current_streak} Day Streak Active!
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Select Skill */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Skill / Hobby
              </label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {skills.length === 0 && <option value="">No skills yet - create one first!</option>}
                {skills.map((s) => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.skill_name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Practice Duration: <span className="text-emerald-400 font-bold">{duration} minutes</span> ({roundHrs(duration)} hrs)
              </label>
              
              <div className="grid grid-cols-6 gap-2 mb-2">
                {quickMinutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      duration === m 
                        ? 'gradient-emerald-teal text-white shadow' 
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="5"
                max="360"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Activity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Activity Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Practiced fingerstyle chord progressions"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Reflections / Notes (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="What felt good? What needs work next time?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || skills.length === 0}
                className="px-6 py-2.5 rounded-xl gradient-emerald-teal text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Recording...' : 'Record Session'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

const roundHrs = (m) => (m / 60).toFixed(1);
