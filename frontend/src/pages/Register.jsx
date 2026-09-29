import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, User, Mail, Sparkles, ArrowRight } from 'lucide-react';

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('Coding, Music, Photography');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await register(name.trim(), username.trim(), email.trim(), password, interests.trim());
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username/email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-purple-pink flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-3">
            <Cloud className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Create Cloud Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Join the community of disciplined creators & skill masters
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 sm:p-8 relative">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Jordan Lee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="jordan_pro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="jordan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password *</label>
              <input
                type="password"
                placeholder="•••••••• (Min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Interests / Focus Hobbies</label>
              <input
                type="text"
                placeholder="e.g. Guitar, Coding, Chess, Cooking"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl gradient-purple-pink text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? 'Creating Profile...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
