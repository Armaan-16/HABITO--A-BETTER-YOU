import React, { useState, useEffect } from 'react';
import HabitMatrix from './HabitMatrix';
import DailySchedule from './DailySchedule';
import YearlyConsistency from './YearlyConsistency';
import ImportantEvents from './ImportantEvents';
import VisionBoard from './VisionBoard';
import QuickNotes from './QuickNotes';
import DailySummary from './DailySummary';
import { Zap, Settings, LogOut, BookOpen, MessageSquare, ChevronRight, User as UserIcon } from './Icons'; 
import { Habit, ScheduleData, LifeEvent, VisionItem, Note, User } from '../types';
import { 
    loadHabits, saveHabits, 
    loadSchedule, saveSchedule, 
    loadEvents, saveEvents,
    loadVisions, saveVisions,
    loadNotes, saveNotes
} from '../utils/storage';

const QUOTES = [
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "The secret of your future is hidden in your daily routine.",
  "Small daily improvements are the key to staggering long-term results.",
  "Don't watch the clock; do what it does. Keep going.",
  "Your life does not get better by chance, it gets better by change.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "The only bad workout is the one that didn't happen."
];

interface DashboardProps {
    user: User;
    onOpenStory: () => void;
    onOpenSettings: () => void;
    onOpenFeedback: () => void;
    onOpenProfile: () => void; // New prop for profile
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onOpenStory, onOpenSettings, onOpenFeedback, onOpenProfile, onLogout }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [visions, setVisions] = useState<VisionItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quote, setQuote] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load Initial Data (Runs whenever User ID changes)
  useEffect(() => {
    setHabits(loadHabits());
    setScheduleData(loadSchedule());
    setEvents(loadEvents());
    setVisions(loadVisions());
    setNotes(loadNotes());
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, [user.id]);

  // Persistence Effects
  useEffect(() => { saveHabits(habits); }, [habits]);
  useEffect(() => { saveSchedule(scheduleData); }, [scheduleData]);
  useEffect(() => { saveEvents(events); }, [events]);
  useEffect(() => { saveVisions(visions); }, [visions]);
  useEffect(() => { saveNotes(notes); }, [notes]);

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <div className="mb-10 relative z-50">
          <div className="flex items-start gap-5">
              
              {/* Logo Menu Button */}
              <div className="relative pt-1">
                  <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0 animate-in zoom-in-50 hover:scale-105 transition-transform"
                  >
                      <Zap className="text-white w-6 h-6" fill="currentColor" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute top-14 left-0 w-56 bg-surface border border-surfaceHighlight rounded-xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Menu
                            </div>
                            <button 
                                onClick={() => { onOpenStory(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surfaceHighlight rounded-lg transition-colors text-left"
                            >
                                <BookOpen size={16} className="text-pink-400" />
                                Our Story
                            </button>
                            <button 
                                onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surfaceHighlight rounded-lg transition-colors text-left"
                            >
                                <Settings size={16} className="text-blue-400" />
                                Settings
                            </button>
                            <button 
                                onClick={() => { onOpenFeedback(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surfaceHighlight rounded-lg transition-colors text-left w-full"
                            >
                                <MessageSquare size={16} className="text-emerald-400" />
                                Feedback
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                      </>
                  )}
              </div>

              {/* Clickable Name & Quote Section */}
              <div className="flex flex-col gap-1 pt-0.5">
                  <button 
                    onClick={onOpenProfile}
                    className="group flex items-center gap-3 text-left focus:outline-none"
                    title="View Profile & Password"
                  >
                      <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none group-hover:text-primary transition-colors">
                        {user.name}
                      </h1>
                      <div className="p-1 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                          <ChevronRight size={24} />
                      </div>
                  </button>
                  
                  <p className="text-gray-400 font-medium text-sm md:text-base italic pl-1 opacity-80 mt-1 border-l-2 border-primary/40 pl-3">
                    "{quote}"
                  </p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
            {/* 1. Daily Summary */}
            <DailySummary scheduleData={scheduleData} habits={habits} />

            {/* 2. Yearly Consistency (Renamed to Momentum) */}
            <YearlyConsistency scheduleData={scheduleData} habits={habits} />

            {/* 3. Habit Matrix */}
            <HabitMatrix habits={habits} setHabits={setHabits} />

            {/* 4. Vision Board */}
            <VisionBoard visions={visions} setVisions={setVisions} />
            
            {/* 5. Important Events */}
            <ImportantEvents events={events} setEvents={setEvents} />

            {/* 6. Quick Notes */}
            <QuickNotes notes={notes} setNotes={setNotes} />
        </div>

        {/* Right Column (Side Panel) */}
        <div className="xl:col-span-1 flex flex-col gap-6 h-full">
            {/* 7. Daily Schedule */}
            <div className="flex-grow sticky top-8" style={{ height: 'calc(100vh - 100px)' }}>
                <DailySchedule scheduleData={scheduleData} setScheduleData={setScheduleData} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;