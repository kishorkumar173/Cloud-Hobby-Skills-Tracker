import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { 
  Users, 
  Plus, 
  Sparkles, 
  Flame, 
  MessageSquare, 
  Heart, 
  Filter, 
  TrendingUp,
  Globe
} from 'lucide-react';

const categories = ['All', 'Music', 'Coding', 'Photography', 'Fitness', 'Art', 'Cooking', 'Other'];

export const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [communityStats, setCommunityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'popular'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchFeedAndStats = async () => {
    try {
      const categoryParam = selectedCategory !== 'All' ? `&skill_category=${selectedCategory}` : '';
      const [feedRes, skillsRes, statsRes] = await Promise.all([
        api.get(`/api/feed?sort_by=${sortBy}${categoryParam}`),
        api.get('/api/skills'),
        api.get('/api/analytics/community')
      ]);

      if (feedRes.success) setPosts(feedRes.data || []);
      if (skillsRes.success) setSkills(skillsRes.data || []);
      if (statsRes.success) setCommunityStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedAndStats();
  }, [selectedCategory, sortBy]);

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.post_id !== postId));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-pink-400" />
            Community Practice Feed
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real learners sharing tangible progress, milestone victories, and proof across the cloud.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Share Achievement
        </button>
      </div>

      {/* Community Global Telemetry Bar */}
      {communityStats && (
        <div className="glass-panel p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gradient-to-r from-purple-950/20 via-pink-950/20 to-indigo-950/20 border-purple-500/20">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Learners Registered</span>
            <div className="text-xl font-black text-white mt-0.5">{communityStats.total_learners}</div>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Cloud Hours</span>
            <div className="text-xl font-black text-indigo-400 mt-0.5">{communityStats.total_practice_hours} hrs</div>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Skills Tracked</span>
            <div className="text-xl font-black text-pink-400 mt-0.5">{communityStats.total_skills_tracked}</div>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Posts Shared</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">{communityStats.total_posts_shared}</div>
          </div>
        </div>
      )}

      {/* Filters and Sorting Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'gradient-purple-pink text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'recent'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              sortBy === 'popular'
                ? 'gradient-amber-flame text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 Most Liked
          </button>
        </div>

      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Syncing with community feed...</div>
      ) : posts.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-md mx-auto">
          <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Posts in this Category</h4>
          <p className="text-xs text-slate-400 mt-1">
            Be the pioneer! Share your learning milestone or practice photo with the community.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 rounded-xl gradient-purple-pink text-white text-xs font-bold"
          >
            + Post Achievement
          </button>
        </div>
      ) : (
        <div className="space-y-5 max-w-3xl mx-auto">
          {posts.map((post) => (
            <PostCard
              key={post.post_id}
              post={post}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        skills={skills}
        onPostCreated={fetchFeedAndStats}
      />

    </div>
  );
};
