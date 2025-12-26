
import React from 'react';
import { Zap, LogOut, Settings } from './Icons';
import { logoutUser } from '../services/authService';

interface SidebarProps {
  onLogout: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, onOpenSettings }) => {
  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-20 md:w-24 bg-surface border-r border-surfaceHighlight flex flex-col items-center py-8 z-50">
      <div className="mb-12 flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="text-white w-7 h-7" fill="currentColor" />
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-8">
         <div className="w-10 h-10 rounded-lg bg-surfaceHighlight/50 flex items-center justify-center text-primary border border-primary/20 cursor-default">
            <span className="font-bold text-lg">H</span>
         </div>
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <button 
            onClick={onOpenSettings}
            title="Settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-surfaceHighlight transition-all"
        >
            <Settings size={20} />
        </button>

        <button 
            onClick={handleLogout}
            title="Sign Out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-surfaceHighlight transition-all"
        >
            <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;