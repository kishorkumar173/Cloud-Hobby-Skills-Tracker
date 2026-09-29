import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SkillsPage } from './pages/SkillsPage';
import { GoalsPage } from './pages/GoalsPage';
import { PracticePage } from './pages/PracticePage';
import { CommunityFeed } from './pages/CommunityFeed';
import { ProfilePage } from './pages/ProfilePage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PracticeModal } from './components/PracticeModal';
import { api } from './api/client';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [practiceDefaultSkillId, setPracticeDefaultSkillId] = useState(null);
  const [skills, setSkills] = useState([]);

  // Fetch skills for modal
  const fetchSkillsForModal = async () => {
    if (user) {
      try {
        const res = await api.get('/api/skills');
        if (res.success) setSkills(res.data || []);
      } catch (e) {
        // Ignored
      }
    }
  };

  useEffect(() => {
    fetchSkillsForModal();
  }, [user]);

  const handleOpenPracticeModal = (skillId = null) => {
    setPracticeDefaultSkillId(skillId);
    setIsPracticeModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Connecting to Cloud Services...
        </span>
      </div>
    );
  }

  // Unauthenticated screen
  if (!user) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Authenticated application
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPracticeModal={() => handleOpenPracticeModal()}
      />

      {/* Main Dynamic View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenPracticeModal={() => handleOpenPracticeModal()}
          />
        )}
        {activeTab === 'skills' && (
          <SkillsPage onOpenPracticeModal={(id) => handleOpenPracticeModal(id)} />
        )}
        {activeTab === 'goals' && <GoalsPage />}
        {activeTab === 'practice' && (
          <PracticePage onOpenPracticeModal={() => handleOpenPracticeModal()} />
        )}
        {activeTab === 'community' && <CommunityFeed />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Global Practice Logging Modal */}
      <PracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        skills={skills}
        defaultSkillId={practiceDefaultSkillId}
        onSkillCreated={fetchSkillsForModal}
        onPracticeLogged={() => {
          fetchSkillsForModal();
          // Trigger refresh of active page if needed
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>SkillPulse</strong> &bull; Online Hobby & Skills Tracker on Cloud
          </span>
          <span className="text-[11px] text-slate-400">
            Cloud Computing Course Capstone Project &bull; Placement & GitHub Ready
          </span>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
