import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SkillCard } from '../components/SkillCard';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Sparkles,
  X,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

const categories = [
  'All',
  'Music',
  'Coding',
  'Photography',
  'Fitness',
  'Art',
  'Cooking',
  'Writing',
  'Other'
];

const popularStarters = [
  { name: 'Python & Cloud Coding', category: 'Coding', icon: '💻', desc: 'Mastering Python APIs and cloud computing architecture.' },
  { name: 'Acoustic Guitar', category: 'Music', icon: '🎸', desc: 'Fingerstyle guitar, chord transitions, and rhythm.' },
  { name: 'Digital Photography', category: 'Photography', icon: '📷', desc: 'Framing, lighting, and camera exposure controls.' },
  { name: 'Fitness & Gym Workout', category: 'Fitness', icon: '🏋️', desc: 'Strength training, calisthenics, and progressive overload.' },
  { name: 'Digital Art & Painting', category: 'Art', icon: '🎨', desc: 'Color theory, digital illustration, and concept art.' },
  { name: 'Cooking & Culinary', category: 'Cooking', icon: '🍳', desc: 'Knife skills, flavor profiles, and international cuisines.' }
];

export const SkillsPage = ({ onOpenPracticeModal }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSkillDetails, setSelectedSkillDetails] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coding');
  const [currentLevel, setCurrentLevel] = useState('BEGINNER');
  const [targetLevel, setTargetLevel] = useState('ADVANCED');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuickAddStarter = async (starter) => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/skills', {
        skill_name: starter.name,
        category: starter.category,
        current_level: 'BEGINNER',
        target_level: 'ADVANCED',
        description: starter.desc
      });
      if (res.success) {
        await fetchSkills();
      }
    } catch (err) {
      alert(err.message || 'Failed to add hobby');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadStarterPack = async () => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/skills/starter-pack');
      if (res.success) {
        await fetchSkills();
      }
    } catch (err) {
      alert(err.message || 'Failed to seed starter pack');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPreset = (starter) => {
    setName(starter.name);
    setCategory(starter.category);
    setDescription(starter.desc);
  };

  const fetchSkills = async () => {
    try {
      const res = await api.get('/api/skills');
      if (res.success) {
        setSkills(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a skill name');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/api/skills', {
        skill_name: name.trim(),
        category,
        current_level: currentLevel,
        target_level: targetLevel,
        description: description.trim() || undefined
      });

      if (res.success) {
        setName('');
        setDescription('');
        setShowAddModal(false);
        fetchSkills();
      }
    } catch (err) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Are you sure you want to delete this skill and its associated records?')) return;
    try {
      await api.delete(`/api/skills/${skillId}`);
      setSkills(skills.filter(s => s.skill_id !== skillId));
    } catch (err) {
      alert(err.message || 'Failed to delete skill');
    }
  };

  const handleViewDetails = async (skill) => {
    try {
      const res = await api.get(`/api/skills/${skill.skill_id}`);
      if (res.success) {
        setSelectedSkillDetails(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch details');
    }
  };

  // Filter skills
  const filteredSkills = skills.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Award className="w-7 h-7 text-indigo-400" />
            Hobby & Skill Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cultivate your passions and build proof of work stored in the cloud.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Skill
        </button>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="glass-panel p-4 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search your skills or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'gradient-purple-pink text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Loading your skills...</div>
      ) : filteredSkills.length === 0 ? (
        searchQuery || selectedCategory !== 'All' ? (
          <div className="glass-panel p-12 text-center max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No Skills Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or filter category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center max-w-2xl mx-auto space-y-5 border-dashed border-indigo-500/40">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Your Hobby Portfolio is Ready!</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                Click any popular starter hobby below to add it in 1 click, or load our curated starter pack:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
              {popularStarters.map((starter) => (
                <button
                  key={starter.name}
                  onClick={() => handleQuickAddStarter(starter)}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/30 transition-all group active:scale-95"
                >
                  <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">{starter.icon}</span>
                  <div className="font-bold text-xs text-white group-hover:text-indigo-300 truncate">{starter.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{starter.category}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={handleLoadStarterPack}
                className="px-5 py-2.5 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Load Starter Pack (3 Skills)</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                + Add Custom Skill
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.skill_id}
              skill={skill}
              onLogPractice={(s) => onOpenPracticeModal(s.skill_id)}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteSkill}
            />
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gradient-purple-pink text-white">
              <h3 className="font-bold text-base">Add New Hobby / Skill</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-black/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="p-6 space-y-4">
              {error && <div className="p-2.5 rounded bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30">{error}</div>}

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Popular Presets (1-Click Fill)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {popularStarters.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-300 text-[11px] text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <span>{p.icon}</span>
                      <span>{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Skill Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Photography, Classical Guitar, Python Coding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Level</label>
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Level</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description / Focus Areas</label>
                <textarea
                  rows="2"
                  placeholder="Describe your learning goals and curriculum..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
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
                  disabled={submitting}
                  className="px-5 py-2 gradient-purple-pink text-white text-xs font-bold rounded-xl shadow hover:brightness-110 active:scale-95"
                >
                  {submitting ? 'Creating...' : 'Create Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skill Details Modal */}
      {selectedSkillDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gradient-blue-cyan text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">{selectedSkillDetails.category}</span>
                <h3 className="font-bold text-lg">{selectedSkillDetails.skill_name}</h3>
              </div>
              <button onClick={() => setSelectedSkillDetails(null)} className="p-1 hover:bg-black/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Total Practice:</span>
                  <span className="ml-1 font-bold text-white">{selectedSkillDetails.total_practice_hours} hrs</span>
                </div>
                <div>
                  <span className="text-slate-400">Level:</span>
                  <span className="ml-1 font-bold text-cyan-400">{selectedSkillDetails.current_level} → {selectedSkillDetails.target_level}</span>
                </div>
              </div>

              {selectedSkillDetails.description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {selectedSkillDetails.description}
                </p>
              )}

              {/* Goals list */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Goals Associated</h5>
                {selectedSkillDetails.goals.length === 0 ? (
                  <p className="text-xs text-slate-500">No active goals yet for this skill.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSkillDetails.goals.map(g => (
                      <div key={g.goal_id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <div className="flex justify-between font-bold text-slate-200 mb-1">
                          <span>{g.title}</span>
                          <span className="text-indigo-400">{g.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full gradient-emerald-teal rounded-full" style={{ width: `${g.progress_percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Practice Sessions */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Practice Logs</h5>
                {selectedSkillDetails.recent_sessions.length === 0 ? (
                  <p className="text-xs text-slate-500">No practice sessions logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSkillDetails.recent_sessions.map(s => (
                      <div key={s.session_id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-emerald-400">+{s.duration_minutes}m</span>
                          <span className="text-slate-300 ml-2">{s.activity}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(s.practiced_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedSkillDetails(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
