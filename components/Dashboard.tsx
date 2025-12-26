import React, { useState, useEffect } from 'react';
import HabitMatrix from './HabitMatrix';
import DailySchedule from './DailySchedule';
import YearlyConsistency from './YearlyConsistency';
import ImportantEvents from './ImportantEvents';
import VisionBoard from './VisionBoard';
import QuickNotes from './QuickNotes';
import DailySummary from './DailySummary';
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
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [visions, setVisions] = useState<VisionItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quote, setQuote] = useState("");

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
      <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Welcome Back, {user.name}</h1>
          <div className="inline-block px-4 py-2 rounded-r-xl border-l-4 border-primary bg-surfaceHighlight/30 backdrop-blur-sm">
             <p className="text-gray-300 italic font-medium text-sm md:text-base">"{quote}"</p>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
            {/* 1. Daily Summary (New) */}
            <DailySummary scheduleData={scheduleData} habits={habits} />

            {/* 2. Yearly Consistency (Based on Daily Schedule) */}
            <YearlyConsistency scheduleData={scheduleData} />

            {/* 3. Habit Matrix */}
            <HabitMatrix habits={habits} setHabits={setHabits} />

            {/* 4. Vision Board */}
            <VisionBoard visions={visions} setVisions={setVisions} />
            
            {/* 5. Important Events */}
            <ImportantEvents events={events} setEvents={setEvents} />

            {/* 6. Quick Notes - Urgent Information */}
            <QuickNotes notes={notes} setNotes={setNotes} />
        </div>

        {/* Right Column (Side Panel) */}
        <div className="xl:col-span-1 flex flex-col gap-6 h-full">
            {/* 7. Daily Schedule - Now takes full height of the column */}
            <div className="flex-grow sticky top-8" style={{ height: 'calc(100vh - 100px)' }}>
                <DailySchedule scheduleData={scheduleData} setScheduleData={setScheduleData} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;