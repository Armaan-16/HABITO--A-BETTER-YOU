
import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { Plus, Trash2, TrendingUp, CheckCircle2, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getLocalDateKey } from '../utils/storage';

interface HabitMatrixProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const HabitMatrix: React.FC<HabitMatrixProps> = ({ habits, setHabits }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({ name: '', frequency: [0,1,2,3,4,5,6] });
  const [view, setView] = useState<'matrix' | 'analytics'>('matrix');
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  const todayStr = getLocalDateKey(new Date());
  const todayDay = new Date().getDay();

  const toggleToday = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent toggling expansion
    setHabits(prev => prev.map(h => {
        if (h.id === id) {
            const isCompleted = !!h.history[todayStr];
            const newHistory = { ...h.history };
            if (isCompleted) {
                delete newHistory[todayStr];
            } else {
                newHistory[todayStr] = true;
            }
            return { ...h, history: newHistory };
        }
        return h;
    }));
  };

  const handleAddHabit = () => {
    if (!newHabit.name) return;
    const habit: Habit = {
        id: Date.now().toString(),
        name: newHabit.name || 'New Habit',
        icon: 'Circle',
        color: 'primary',
        category: 'productivity',
        frequency: newHabit.frequency || [],
        history: {},
        streak: 0
    };
    setHabits([...habits, habit]);
    setShowAdd(false);
    setNewHabit({ name: '', frequency: [0,1,2,3,4,5,6] });
  };

  const deleteHabit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHabits(habits.filter(h => h.id !== id));
  };

  const toggleFrequencyDay = (dayIndex: number) => {
      const currentFreq = newHabit.frequency || [];
      if (currentFreq.includes(dayIndex)) {
          setNewHabit({...newHabit, frequency: currentFreq.filter(d => d !== dayIndex)});
      } else {
          setNewHabit({...newHabit, frequency: [...currentFreq, dayIndex].sort()});
      }
  };

  const calculateStreak = (habit: Habit) => {
    let streak = 0;
    const today = new Date();
    // Start checking from today backwards
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = getLocalDateKey(d);
        const dayOfWeek = d.getDay();

        // If today is NOT in frequency, it doesn't break streak, but also doesn't add to it?
        // Actually typically streak is consecutive *scheduled* completions.
        
        if (habit.frequency.includes(dayOfWeek)) {
            if (habit.history[dateKey]) {
                streak++;
            } else {
                // If it's today and not done yet, we don't break streak from yesterday
                if (i === 0) continue; 
                break;
            }
        }
    }
    return streak;
  };

  const getHeatmapData = (habit: Habit) => {
      const days = [];
      const today = new Date();
      // Generate last ~140 days (20 weeks) for a compact view
      for (let i = 139; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          days.push({
              date: getLocalDateKey(d),
              dayOfWeek: d.getDay(),
              isScheduled: habit.frequency.includes(d.getDay()),
          });
      }
      return days;
  };

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // --- ANALYTICS DATA PREP ---
  const barData = habits.map(h => ({
      name: h.name,
      completed: Object.keys(h.history).length
  }));

  const trendData = useMemo(() => {
    const days = 14; // Last 2 weeks
    const result = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateKey(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        
        let completed = 0;
        let totalActive = 0;
        const dayOfWeek = d.getDay();

        habits.forEach(h => {
            if (h.frequency.includes(dayOfWeek)) {
                totalActive++;
                if (h.history[dateStr]) completed++;
            }
        });

        const percentage = totalActive > 0 ? Math.round((completed / totalActive) * 100) : 0;
        result.push({ name: dayName, value: percentage });
    }
    return result;
  }, [habits]);

  const avgTrendScore = Math.round(trendData.reduce((acc, curr) => acc + curr.value, 0) / trendData.length) || 0;

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Habit Matrix</h2>
        <div className="flex bg-surfaceHighlight rounded-lg p-1">
            <button 
                onClick={() => setView('matrix')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'matrix' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setView('analytics')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'analytics' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
                Analytics
            </button>
        </div>
      </div>

      {view === 'matrix' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500 px-2 uppercase tracking-wider">
                <span>Habit</span>
                <span>Today</span>
            </div>
            
            <div className="space-y-3">
                {habits.map(habit => {
                    const isTodayScheduled = habit.frequency.includes(todayDay);
                    const isCompleted = !!habit.history[todayStr];
                    const isExpanded = expandedHabitId === habit.id;
                    const streak = calculateStreak(habit);
                    const heatmapDays = getHeatmapData(habit);

                    return (
                        <div 
                            key={habit.id} 
                            onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                            className={`group rounded-xl bg-surfaceHighlight/20 border border-white/5 transition-all cursor-pointer overflow-hidden ${isExpanded ? 'bg-surfaceHighlight/30 border-primary/20 ring-1 ring-primary/20' : 'hover:bg-surfaceHighlight/40'}`}
                        >
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-primary/20 text-primary' : 'bg-surfaceHighlight text-gray-500'}`}>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">{habit.name}</h4>
                                        <div className="flex gap-1 mt-1">
                                            {DAYS.map((d, i) => (
                                                <span key={i} className={`text-[9px] w-3 h-3 flex items-center justify-center rounded ${habit.frequency.includes(i) ? 'bg-primary/20 text-primary' : 'bg-black/20 text-gray-600'}`}>
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                                        <Flame size={14} fill="currentColor" />
                                        <span>{streak}</span>
                                     </div>

                                    {isTodayScheduled ? (
                                        <button 
                                            onClick={(e) => toggleToday(e, habit.id)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 scale-110' : 'bg-surfaceHighlight border-2 border-gray-700 hover:border-primary/50'}`}
                                        >
                                            {isCompleted && <CheckCircle2 size={16} className="text-white" />}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-600 italic px-2">Rest</span>
                                    )}
                                </div>
                            </div>

                            {/* EXPANDED DETAILS */}
                            {isExpanded && (
                                <div className="px-3 pb-4 pt-1 border-t border-white/5 bg-black/20 cursor-default" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-semibold text-gray-400">Consistency Heatmap</span>
                                        <button 
                                            onClick={(e) => deleteHabit(e, habit.id)} 
                                            className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={12} /> Delete Habit
                                        </button>
                                    </div>
                                    
                                    {/* Heatmap Grid */}
                                    <div className="flex flex-wrap gap-1">
                                        {heatmapDays.map((d) => {
                                            const done = habit.history[d.date];
                                            let bg = 'bg-surfaceHighlight/30';
                                            if (!d.isScheduled) bg = 'opacity-0'; // Invisible if not scheduled
                                            else if (done) bg = 'bg-primary';
                                            
                                            return (
                                                <div 
                                                    key={d.date} 
                                                    title={`${d.date}: ${done ? 'Done' : d.isScheduled ? 'Missed' : 'Rest'}`}
                                                    className={`w-2.5 h-2.5 rounded-[2px] ${bg} ${d.isScheduled && !done ? 'border border-white/5' : ''}`}
                                                />
                                            )
                                        })}
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 text-right">Last 20 Weeks</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {showAdd ? (
                <div className="p-4 bg-surfaceHighlight/50 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <input 
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-primary"
                        placeholder="Habit Name"
                        value={newHabit.name}
                        onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-center mb-3">
                        {DAYS.map((d, i) => (
                            <button 
                                key={i}
                                onClick={() => toggleFrequencyDay(i)}
                                className={`w-6 h-6 text-[10px] rounded flex items-center justify-center transition-colors ${newHabit.frequency?.includes(i) ? 'bg-primary text-white' : 'bg-black/40 text-gray-500 hover:bg-white/10'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddHabit} className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primaryDark">Save</button>
                        <button onClick={() => setShowAdd(false)} className="px-3 bg-white/5 text-gray-400 text-xs font-bold rounded-lg hover:bg-white/10">Cancel</button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowAdd(true)}
                    className="w-full py-2 border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Habit
                </button>
            )}
          </div>
      ) : (
          <div className="space-y-8">
            {/* GROWTH TREND CHART */}
            <div className="h-[250px] w-full">
                <div className="flex justify-between items-end mb-2 px-2">
                    <h3 className="text-sm font-semibold text-gray-300">Overall Consistency Trend</h3>
                    <span className="text-xs text-primary font-bold">{avgTrendScore}% Avg</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 10 }} 
                            dy={10}
                            interval={2} // Show fewer labels
                        />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                            formatter={(value: number) => [`${value}%`, 'Completion']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* TOTAL COMPLETIONS BAR CHART */}
            <div className="h-[250px] w-full border-t border-white/5 pt-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2 px-2">Total Completions</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis type="number" hide />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                            cursor={{ fill: '#ffffff05' }}
                        />
                        <Bar dataKey="completed" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
      )}
    </div>
  );
};

export default HabitMatrix;
