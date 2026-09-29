import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  User, 
  Camera, 
  Mail, 
  AtSign, 
  Calendar, 
  Sparkles, 
  FileText, 
  Shield, 
  Key, 
  ExternalLink,
  CheckCircle2,
  Cloud,
  Download
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [myFiles, setMyFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfileAndFiles = async () => {
    try {
      const [profileRes, filesRes] = await Promise.all([
        api.get('/api/profile'),
        api.get('/api/files')
      ]);

      if (profileRes.success && profileRes.data) {
        setProfileData(profileRes.data);
        setName(profileRes.data.name || '');
        setBio(profileRes.data.bio || '');
        setInterests(profileRes.data.interests || '');
      }
      if (filesRes.success) {
        setMyFiles(filesRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndFiles();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/api/profile', {
        name: name.trim(),
        bio: bio.trim(),
        interests: interests.trim()
      });
      if (res.success) {
        setMessage('Profile updated successfully in cloud database');
        refreshProfile();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload('/api/profile/picture', formData);
      if (res.success) {
        fetchProfileAndFiles();
        refreshProfile();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload profile image to cloud storage');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleGetSignedUrl = async (fileId) => {
    try {
      const res = await api.get(`/api/files/${fileId}/signed-url?expires_in=1800`);
      if (res.success && res.data?.signed_url) {
        window.open(res.data.signed_url, '_blank');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate signed URL');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Loading cloud profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      
      {/* Profile Header Card */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/80 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar with Cloud Upload */}
          <div className="relative group shrink-0">
            <img
              src={profileData?.profile_picture || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
              alt={profileData?.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-indigo-500/40 shadow-xl"
            />
            <label className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-center p-1">
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">{uploadingPic ? 'Uploading...' : 'Change Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingPic}
                className="hidden"
              />
            </label>
          </div>

          {/* Details */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white">{profileData?.name}</h2>
              <span className="text-xs text-slate-400 font-semibold">@{profileData?.username}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {profileData?.role}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
              {profileData?.bio}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {profileData?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Joined {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : ''}
              </span>
              <span className="font-bold text-white">
                {profileData?.followers_count || 0} <span className="text-slate-400 font-normal">Followers</span>
              </span>
              <span className="font-bold text-white">
                {profileData?.following_count || 0} <span className="text-slate-400 font-normal">Following</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" /> Edit Profile Information
        </h3>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Interests / Tags</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Guitar, Coding, Art, Photography"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Bio</label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Cloud Object Storage Files Manager */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" /> Cloud Object Storage Proof Records
            </h3>
            <p className="text-xs text-slate-400">Media, screenshots, and achievement certificates stored in bucket</p>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            {myFiles.length} Objects Stored
          </span>
        </div>

        {myFiles.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No files uploaded yet. Upload proof through practice logs or community posts!</p>
        ) : (
          <div className="space-y-2">
            {myFiles.map((f) => (
              <div key={f.file_id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{f.file_name}</span>
                    <span className="text-[10px] text-slate-500">{f.storage_path} ({(f.file_size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGetSignedUrl(f.file_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Key className="w-3 h-3 text-amber-400" />
                    Signed URL
                  </button>
                  <a
                    href={f.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Open public link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
