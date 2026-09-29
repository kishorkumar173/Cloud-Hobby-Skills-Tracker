import React, { useState } from 'react';
import { Heart, MessageSquare, Trash2, Send, Clock, Award } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const PostCard = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = user && (user.user_id === post.author.user_id || user.role === 'moderator' || user.role === 'admin');

  const handleToggleLike = async () => {
    if (!user) return;
    const prevLiked = liked;
    const prevCount = likesCount;

    // Optimistic UI update
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (prevLiked) {
        await api.delete(`/api/posts/${post.post_id}/like`);
      } else {
        await api.post(`/api/posts/${post.post_id}/like`);
      }
    } catch (err) {
      // Revert if error
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleFetchComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/api/posts/${post.post_id}/comments`);
        if (res.success) {
          setComments(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/posts/${post.post_id}/comments`, {
        content: newComment.trim()
      });
      if (res.success && res.data) {
        setComments([...comments, res.data]);
        setNewComment('');
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this community post?')) return;
    try {
      const res = await api.delete(`/api/posts/${post.post_id}`);
      if (res.success && onPostDeleted) {
        onPostDeleted(post.post_id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c.comment_id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden transition-all hover:border-slate-700">
      
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author.profile_picture || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{post.author.name}</span>
              <span className="text-xs text-slate-500">@{post.author.username}</span>
              {post.author.role === 'moderator' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Mod</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Skill Tag and Owner Actions */}
        <div className="flex items-center gap-2">
          {post.skill && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
              <Award className="w-3 h-3 text-indigo-400" />
              {post.skill.skill_name}
            </span>
          )}

          {isOwner && (
            <button
              onClick={handleDeletePost}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Text */}
      <p className="text-sm text-slate-200 mt-3.5 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Cloud Object Storage Media Image */}
      {post.media_url && (
        <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 max-h-96 flex items-center justify-center">
          <img
            src={post.media_url}
            alt="Achievement proof"
            className="w-full h-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&fit=crop";
            }}
          />
        </div>
      )}

      {/* Engagement Footer: Likes and Comments */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              liked 
                ? 'text-rose-400 bg-rose-500/15' 
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comments Toggle */}
          <button
            onClick={handleFetchComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 font-semibold transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count || comments.length || 0}</span>
          </button>

        </div>

        <span className="text-[11px] text-slate-500">Cloud Feed Verified</span>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-3">
          
          {/* Comments list */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {loadingComments ? (
              <p className="text-xs text-slate-500 text-center py-2">Loading comments from cloud...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-2">No comments yet. Be the first to cheer them on!</p>
            ) : (
              comments.map((c) => {
                const canDelete = user && (user.user_id === c.author.user_id || user.role === 'moderator');
                return (
                  <div key={c.comment_id} className="flex items-start justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={c.author.profile_picture || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                        alt={c.author.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{c.author.name}</span>
                          <span className="text-[10px] text-slate-500">@{c.author.username}</span>
                        </div>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">{c.content}</p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(c.comment_id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment Input */}
          {user && (
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Write a supportive comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-3 py-2 rounded-xl gradient-purple-pink text-white text-xs font-bold disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>
      )}

    </div>
  );
};
