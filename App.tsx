import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal';
import StoryModal from './components/StoryModal';
import { getCurrentUser, logoutUser } from './services/authService';
import { loadTheme } from './utils/theme';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    // Load theme from storage
    loadTheme();
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary/30">
      <main className="min-h-screen transition-all duration-300">
        <Dashboard 
          user={user} 
          onOpenStory={() => setIsStoryOpen(true)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        />
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <StoryModal
        isOpen={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
      />

      {/* Mobile Background Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />
    </div>
  );
};

export default App;