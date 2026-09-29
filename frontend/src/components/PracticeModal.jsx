import React, { useState, useEffect } from 'react';
import { X, Clock, Award, FileText, CheckCircle, Plus, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api/client';

const popularStarters = [
  { name: 'Python & Cloud Coding', category: 'Coding', icon: '💻' },
  { name: 'Acoustic Guitar', category: 'Music', icon: '🎸' },
  { name: 'Digital Photography', category: 'Photography', icon: '📷' },
  { name: 'Fitness & Gym Workout', category: 'Fitness', icon: '🏋️' },
  { name: 'Digital Art & Illustration', category: 'Art', icon: '🎨' },
  { name: 'Cooking & Culinary', category: 'Cooking', icon: '🍳' }
];

export const PracticeModal = ({ 
  isOpen, 
  onClose, 
  skills = [], 
  defaultSkillId = null, 
  onPracticeLogged,
  onSkillCreated 
}) => {
  const [skillId, setSkillId] = useState('');
  const [duration, setDuration] = useState(60);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  
  // Custom quick-add state inside modal
  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Coding');

  // Synchronize selected skillId when modal opens or skills change
  useEffect(() => {
    if (defaultSkillId) {
      setSkillId(String(defaultSkillId));
    } else if (skills && skills.length > 0) {
      const exists = skills.some(s => String(s.skill_id) === String(skillId));
      if (!exists || !skillId) {
        setSkillId(String(skills[0].skill_id));
      }
    } else {
      setSkillId('');
    }
  }, [defaultSkillId, skills]);

  if (!isOpen) return null;

  const quickMinutes = [15, 30, 45, 60, 90, 120];

  const handleQuickAddStarter = async (starter) => {
    setAddingSkill(true);
    setError('');
    try {
      const res = await api.post('/api/skills', {
        skill_name: starter.name,
        category: starter.category,
        current_level: 'BEGINNER',
        target_level: 'ADVANCED',
        description: `Practicing and developing expertise in ${starter.name}.`
      });

      if (res.success && res.data) {
        if (onSkillCreated) await onSkillCreated(res.data);
        setSkillId(String(res.data.skill_id));
        setActivity(`Initial practice session for ${starter.name}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to add hobby');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleLoadStarterPack = async () => {
    setAddingSkill(true);
    setError('');
    try {
      const res = await api.post('/api/skills/starter-pack');
      if (res.success) {
        if (onSkillCreated) await onSkillCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to seed starter pack');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleCreateCustomSkill = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setAddingSkill(true);
    setError('');
    try {
      const res = await api.post('/api/skills', {
        skill_name: customName.trim(),
        category: customCategory,
        current_level: 'BEGINNER',
        target_level: 'ADVANCED',
        description: `Self-directed learning in ${customName.trim()}.`
      });
      if (res.success && res.data) {
        if (onSkillCreated) await onSkillCreated(res.data);
        setSkillId(String(res.data.skill_id));
        setCustomName('');
        setShowCustomAdd(false);
        setActivity(`Practice for ${res.data.skill_name}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to add skill');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillId) {
      setError('Please select or add a skill first');
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
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* If user has 0 skills: Helpful 1-click onboarder banner */}
            {skills.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>No Hobbies Created Yet — Pick One to Start Logging!</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any popular hobby below to instantly add it to your cloud account and start recording your practice time:
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {popularStarters.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      disabled={addingSkill}
                      onClick={() => handleQuickAddStarter(p)}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/40 text-left text-xs text-slate-200 transition-all group"
                    >
                      <span className="text-base">{p.icon}</span>
                      <span className="font-semibold truncate group-hover:text-indigo-300">{p.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    type="button"
                    disabled={addingSkill}
                    onClick={handleLoadStarterPack}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    ⚡ Load Starter Pack (3 Skills)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomAdd(!showCustomAdd)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {showCustomAdd ? 'Cancel Custom' : '+ Create Custom Skill'}
                  </button>
                </div>

                {showCustomAdd && (
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="e.g. Keyboard, French Language, Chess"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                      >
                        <option value="Coding">Coding</option>
                        <option value="Music">Music</option>
                        <option value="Photography">Photography</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Art">Art</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Other">Other</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateCustomSkill}
                        disabled={addingSkill || !customName.trim()}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                      >
                        {addingSkill ? 'Adding...' : 'Add & Select'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard Practice Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Select Skill Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Skill / Hobby *
                  </label>
                  {skills.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCustomAdd(!showCustomAdd)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add another
                    </button>
                  )}
                </div>

                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {skills.length === 0 ? (
                    <option value="">No skills yet — pick one above</option>
                  ) : (
                    skills.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name} ({s.category})
                      </option>
                    ))
                  )}
                </select>

                {showCustomAdd && skills.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mt-2">
                    <span className="text-[11px] font-bold text-slate-300 block">Quick Add New Skill:</span>
                    <input
                      type="text"
                      placeholder="e.g. Piano, Marathon Training, UI Design"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                      >
                        <option value="Coding">Coding</option>
                        <option value="Music">Music</option>
                        <option value="Photography">Photography</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Art">Art</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomAdd(false)}
                          className="px-2 py-1 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCustomSkill}
                          disabled={addingSkill || !customName.trim()}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                        >
                          {addingSkill ? 'Saving...' : 'Save & Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                  placeholder="e.g. Practiced fingerstyle chord progressions or solved DSA problem"
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

              {/* Submit Button */}
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
                  disabled={submitting || !skillId}
                  className="px-6 py-2.5 rounded-xl gradient-emerald-teal text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Recording...' : 'Record Session'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

const roundHrs = (m) => (m / 60).toFixed(1);
