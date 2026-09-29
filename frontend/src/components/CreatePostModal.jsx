import React, { useState } from 'react';
import { X, Image as ImageIcon, Send, CloudUpload, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export const CreatePostModal = ({ isOpen, onClose, skills = [], onPostCreated }) => {
  const [content, setContent] = useState('');
  const [skillId, setSkillId] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write some content to share');
      return;
    }

    setSubmitting(true);
    setError('');

    let uploadedMediaUrl = null;

    try {
      // 1. If file attached, upload to Cloud Object Storage first
      if (file) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'posts');

        const uploadRes = await api.upload('/api/files/upload', formData);
        if (uploadRes.success && uploadRes.data?.public_url) {
          uploadedMediaUrl = uploadRes.data.public_url;
        }
        setUploadingImage(false);
      }

      // 2. Create post with media URL
      const postRes = await api.post('/api/posts', {
        content: content.trim(),
        skill_id: skillId ? parseInt(skillId) : null,
        media_url: uploadedMediaUrl
      });

      if (postRes.success) {
        setContent('');
        setSkillId('');
        setFile(null);
        setPreviewUrl('');
        if (onPostCreated) onPostCreated();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to share post');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gradient-purple-pink text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-200" />
            <h3 className="font-bold text-lg">Share Achievement with Community</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/20 text-pink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Post Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              What milestone or update did you achieve? *
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Completed 30 hours of acoustic guitar practice! Hit the second milestone today."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              required
            />
          </div>

          {/* Skill Tag Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tag Skill (Optional)
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- No specific skill --</option>
              {skills.map((s) => (
                <option key={s.skill_id} value={s.skill_id}>
                  {s.skill_name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Image / Proof Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Proof Photo / Screenshot (Cloud Storage)
            </label>
            
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer relative bg-slate-950/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Upload preview" 
                    className="max-h-40 mx-auto rounded-lg object-contain shadow-md"
                  />
                  <span className="text-[11px] text-indigo-400 mt-2 block font-medium">
                    Click to change image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                  <CloudUpload className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-xs font-medium text-slate-300">
                    Upload image proof (PNG, JPG, WebP up to 5MB)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Uploaded directly to Cloud Object Storage
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
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
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-purple-pink text-white text-sm font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingImage ? 'Uploading Image...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share Post
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
