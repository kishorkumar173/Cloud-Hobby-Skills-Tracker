import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, User, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide your username/email and password');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await login(usernameOrEmail.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (username, pw) => {
    setUsernameOrEmail(username);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-purple-pink flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Skill<span className="text-gradient-purple">Pulse</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Online Hobby & Skills Cloud Tracking Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 sm:p-8 relative">
          <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your cloud credentials to access your tracking telemetry.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="alex_creator or alex@example.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl gradient-purple-pink text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Cloud'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 1-Click Evaluation Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alex_creator', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left transition-colors"
              >
                <span className="font-bold text-indigo-300 block">Alex (User A)</span>
                <span className="text-[10px] text-slate-500">Guitar & Coding</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sarah_lens', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-left transition-colors"
              >
                <span className="font-bold text-pink-300 block">Sarah (Moderator)</span>
                <span className="text-[10px] text-slate-500">Photography</span>
              </button>
            </div>
          </div>

          {/* Footer switch */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
            >
              Create Account
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
