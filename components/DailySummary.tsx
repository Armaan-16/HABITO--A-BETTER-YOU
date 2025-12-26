import React from 'react';
import { CheckCircle2, Flame, ListTodo, Trophy } from './Icons';
import { Habit, ScheduleData } from '../types';
import { getLocalDateKey } from '../utils/storage';

interface DailySummaryProps {
  scheduleData: ScheduleData;
  habits: Habit[];
}

const DailySummary: React.FC<DailySummaryProps> = ({ scheduleData, habits }) => {
  const todayKey = getLocalDateKey(new Date());
  
  // Tasks Logic
  const todayTasks = scheduleData[todayKey] || [];
  const activeTasks = todayTasks.filter(t => t.activity && t.activity.trim() !== '');
  const completedTasks = activeTasks.filter(t => t.completed).length;
  const totalTasks = activeTasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Habits Logic
  const todayDay = new Date().getDay();
  const todayHabits = habits.filter(h => h.frequency.includes(todayDay));
  const completedHabits = todayHabits.filter(h => h.history[todayKey]).length;
  const totalHabits = todayHabits.length;
  const habitProgress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Streak Logic
  const calculateStreak = (habit: Habit) => {
      let streak = 0;
      const today = new Date();
      // Check last 365 days
      for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateKey = getLocalDateKey(d);
          const dayOfWeek = d.getDay();
          
          if (habit.frequency.includes(dayOfWeek)) {
              if (habit.history[dateKey]) {
                  streak++;
              } else {
                  if (i === 0) continue; // Today doesn't break streak if not done yet
                  break;
              }
          }
      }
      return streak;
  };

  const bestStreak = habits.length > 0 ? Math.max(...habits.map(calculateStreak)) : 0;
  const topHabit = habits.sort((a,b) => calculateStreak(b) - calculateStreak(a))[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Tasks Card */}
      <div className="bg-surface rounded-3xl p-5 border border-surfaceHighlight relative overflow-hidden group hover:border-blue-500/30 transition-all">
        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <ListTodo size={80} className="text-blue-500" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                    <ListTodo size={20} />
                </div>
                <span className="text-sm font-semibold text-gray-400">Daily Tasks</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">{completedTasks}<span className="text-gray-500 text-lg font-medium">/{totalTasks}</span></span>
            </div>
            <div className="flex items-center gap-2">
                 <div className="flex-1 h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${taskProgress}%` }} />
                </div>
                <span className="text-xs font-bold text-blue-400">{taskProgress}%</span>
            </div>
        </div>
      </div>

      {/* Habits Card */}
      <div className="bg-surface rounded-3xl p-5 border border-surfaceHighlight relative overflow-hidden group hover:border-emerald-500/30 transition-all">
        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <CheckCircle2 size={80} className="text-emerald-500" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={20} />
                </div>
                <span className="text-sm font-semibold text-gray-400">Habits</span>
            </div>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">{completedHabits}<span className="text-gray-500 text-lg font-medium">/{totalHabits}</span></span>
            </div>
             <div className="flex items-center gap-2">
                 <div className="flex-1 h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${habitProgress}%` }} />
                </div>
                <span className="text-xs font-bold text-emerald-400">{habitProgress}%</span>
            </div>
        </div>
      </div>

      {/* Streak Card */}
      <div className="bg-surface rounded-3xl p-5 border border-surfaceHighlight relative overflow-hidden group hover:border-orange-500/30 transition-all">
        <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Flame size={80} className="text-orange-500" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
                    <Flame size={20} />
                </div>
                <span className="text-sm font-semibold text-gray-400">Best Streak</span>
            </div>
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">{bestStreak} <span className="text-lg font-medium text-gray-500">days</span></span>
            </div>
            <div className="text-xs text-orange-400 font-medium truncate flex items-center gap-1">
                <Trophy size={12} />
                {topHabit ? topHabit.name : "Start building!"}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummary;