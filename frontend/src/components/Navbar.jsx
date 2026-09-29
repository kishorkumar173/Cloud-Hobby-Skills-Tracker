import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  Award, 
  Target, 
  Clock, 
  Users, 
  User, 
  LogOut, 
  PlusCircle,
  Flame,
  Cloud
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenPracticeModal }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'Skills & Hobbies', icon: Award },
    { id: 'goals', label: 'Goals & Milestones', icon: Target },
    { id: 'practice', label: 'Practice Log', icon: Clock },
    { id: 'community', label: 'Community Feed', icon: Users },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl gradient-purple-pink flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">Skill<span className="text-gradient-purple">Pulse</span></span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Cloud</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Track • Elevate • Share</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Quick Log Practice Button */}
          <button
            onClick={onOpenPracticeModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-emerald-teal text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Log Practice</span>
          </button>

          {/* User profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={user.profile_picture || "https://api.dicebear.com/7.x/bottts/svg?seed=user"}
                alt={user.name}
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-xl object-cover border-2 border-indigo-500/50 cursor-pointer hover:border-pink-500 transition-colors"
                title={`Logged in as ${user.name}`}
              />
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Nav Scroller */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pt-3 pb-1 border-t border-slate-800/60 mt-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 bg-slate-900 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
