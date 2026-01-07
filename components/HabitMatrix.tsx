import React, { useState, useMemo } from 'react';
import { Habit } from '../types';
import { Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp, Flame, Edit2, TrendingUp, Calendar } from './Icons';
import * as AllIcons from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { getLocalDateKey } from '../utils/storage';

interface HabitMatrixProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const AVAILABLE_ICONS = [
  'Circle', 'Activity', 'Zap', 'Droplets', 'BookOpen', 
  'Dumbbell', 'BrainCircuit', 'Sparkles', 'Moon', 'Sun', 
  'Target', 'Rocket', 'User', 'Phone', 'Trophy', 'Flame',
  'ListTodo', 'Calendar', 'Clock', 'Music', 'Coffee', 
  'Briefcase', 'Laptop', 'Gamepad2', 'Smile', 'Utensils'
];

const CATEGORY_COLORS: Record<string, string> = {
    health: '#10b981',      // Emerald
    productivity: '#8b5cf6', // Violet
    mindfulness: '#3b82f6', // Blue
    creative: '#f59e0b',    // Amber
    other: '#71717a'        // Zinc
};

const HabitMatrix: React.FC<HabitMatrixProps> = ({ habits, setHabits }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({ name: '', frequency: [0,1,2,3,4,5,6], icon: 'Circle', category: 'productivity' });
  const [view, setView] = useState<'matrix' | 'analytics'>('matrix');
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  
  // Analytics State
  const [graphPeriod, setGraphPeriod] = useState<'week' | 'month' | 'year'>('week');

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

  const handleSaveHabit = () => {
    if (!newHabit.name) return;
    
    if (editingHabitId) {
        setHabits(habits.map(h => h.id === editingHabitId ? { ...h, ...newHabit } as Habit : h));
        setEditingHabitId(null);
    } else {
        const habit: Habit = {
            id: Date.now().toString(),
            name: newHabit.name || 'New Habit',
            icon: newHabit.icon || 'Circle',
            color: 'primary',
            category: newHabit.category as any || 'productivity',
            frequency: newHabit.frequency || [],
            history: {},
            streak: 0
        };
        setHabits([...habits, habit]);
    }
    
    setShowAdd(false);
    setEditingHabitId(null);
    setNewHabit({ name: '', frequency: [0,1,2,3,4,5,6], icon: 'Circle', category: 'productivity' });
  };

  const startEditing = (e: React.MouseEvent, habit: Habit) => {
      e.stopPropagation();
      setNewHabit(habit);
      setEditingHabitId(habit.id);
      setShowAdd(true);
      setExpandedHabitId(null);
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingHabitId(null);
    setNewHabit({ name: '', frequency: [0,1,2,3,4,5,6], icon: 'Circle', category: 'productivity' });
  };

  const deleteHabit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this habit?')) {
        setHabits(habits.filter(h => h.id !== id));
    }
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
        
        if (habit.frequency.includes(dayOfWeek)) {
            if (habit.history[dateKey]) {
                streak++;
            } else {
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
      // Generate last ~140 days (20 weeks)
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

  // --- ANALYTICS DATA LOGIC ---
  const analyticsData = useMemo(() => {
    const trend = [];
    const categoryCounts: Record<string, number> = {};
    const endDate = new Date();
    let totalScheduledPeriod = 0;
    let totalCompletedPeriod = 0;

    // Helper to get stats for a single date
    const getDayStats = (date: Date) => {
        const dateKey = getLocalDateKey(date);
        const dayOfWeek = date.getDay();
        let scheduled = 0;
        let completed = 0;
        
        habits.forEach(h => {
            if (h.frequency.includes(dayOfWeek)) {
                scheduled++;
                if (h.history[dateKey]) {
                    completed++;
                    // Aggregate category data
                    const cat = h.category || 'other';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                }
            }
        });
        return { scheduled, completed };
    };

    if (graphPeriod === 'year') {
        // Monthly Aggregation
        for (let i = 11; i >= 0; i--) {
            const d = new Date(endDate);
            d.setMonth(d.getMonth() - i);
            d.setDate(1); 
            
            const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
            let monthScheduled = 0;
            let monthCompleted = 0;

            const tempDay = new Date(d);
            const targetMonth = tempDay.getMonth();

            while (tempDay.getMonth() === targetMonth && tempDay <= endDate) {
                const stats = getDayStats(tempDay);
                monthScheduled += stats.scheduled;
                monthCompleted += stats.completed;
                tempDay.setDate(tempDay.getDate() + 1);
            }

            totalScheduledPeriod += monthScheduled;
            totalCompletedPeriod += monthCompleted;

            trend.push({
                label: monthLabel,
                score: monthScheduled > 0 ? Math.round((monthCompleted / monthScheduled) * 100) : 0
            });
        }
    } else {
        // Daily Aggregation (Week/Month)
        const daysToLookBack = graphPeriod === 'week' ? 6 : 29;
        for (let i = daysToLookBack; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            
            const stats = getDayStats(d);
            totalScheduledPeriod += stats.scheduled;
            totalCompletedPeriod += stats.completed;

            const dayLabel = graphPeriod === 'week' 
                ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
                : d.getDate().toString();

            trend.push({
                label: dayLabel,
                fullDate: d.toLocaleDateString(),
                score: stats.scheduled > 0 ? Math.round((stats.completed / stats.scheduled) * 100) : 0
            });
        }
    }

    const avgConsistency = totalScheduledPeriod > 0 ? Math.round((totalCompletedPeriod / totalScheduledPeriod) * 100) : 0;

    // Format Category Data for Chart
    const formattedCategories = Object.keys(categoryCounts).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: categoryCounts[key]
    })).sort((a,b) => b.count - a.count);

    return { 
        trend, 
        avgConsistency, 
        totalCompleted: totalCompletedPeriod,
        categories: formattedCategories 
    };

  }, [habits, graphPeriod]);

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
                    
                    // Dynamic Icon
                    const IconComp = (AllIcons as any)[habit.icon] || AllIcons.Circle;

                    return (
                        <div 
                            key={habit.id} 
                            onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                            className={`group rounded-xl bg-surfaceHighlight/20 border border-white/5 transition-all cursor-pointer overflow-hidden ${isExpanded ? 'bg-surfaceHighlight/30 border-primary/20 ring-1 ring-primary/20' : 'hover:bg-surfaceHighlight/40'}`}
                        >
                            {/* Main Habit Row */}
                            <div className="flex items-start justify-between p-3.5">
                                <div className="flex items-start gap-4">
                                    {/* Chevron - Top Aligned */}
                                    <div className={`p-1 mt-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-surfaceHighlight text-gray-300' : 'bg-transparent text-gray-500'}`}>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        {/* Icon - Top Aligned */}
                                        <div className="p-2.5 bg-surfaceHighlight/50 rounded-lg text-primary shadow-sm mt-0.5 border border-white/5">
                                            <IconComp size={20} />
                                        </div>
                                        
                                        {/* Name & Frequency - Stacked */}
                                        <div className="flex flex-col gap-1.5 pt-0.5">
                                            <h4 className="font-bold text-white text-base leading-tight">{habit.name}</h4>
                                            <div className="flex gap-1">
                                                {DAYS.map((d, i) => (
                                                    <span key={i} className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-[4px] font-bold ${habit.frequency.includes(i) ? 'bg-primary/20 text-primary border border-primary/10' : 'bg-black/30 text-gray-600 border border-white/5'}`}>
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side Actions - Vertically Centered relative to content block */}
                                <div className="flex items-center gap-4 h-full pt-1.5">
                                     <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                                        <Flame size={12} fill="currentColor" />
                                        <span>{streak}</span>
                                     </div>

                                    {isTodayScheduled ? (
                                        <button 
                                            onClick={(e) => toggleToday(e, habit.id)}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 scale-105' : 'bg-surfaceHighlight border-2 border-gray-700 hover:border-primary/50'}`}
                                        >
                                            {isCompleted && <CheckCircle2 size={18} className="text-white" />}
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-gray-600 font-medium italic px-2 py-1 border border-dashed border-white/10 rounded-lg">Rest Day</span>
                                    )}
                                </div>
                            </div>

                            {/* EXPANDED DETAILS */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/20 cursor-default" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-semibold text-gray-400">Consistency Heatmap</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => startEditing(e, habit)} 
                                                className="text-xs flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button 
                                                onClick={(e) => deleteHabit(e, habit.id)} 
                                                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Heatmap Grid */}
                                    <div className="flex flex-wrap gap-1">
                                        {heatmapDays.map((d) => {
                                            const done = habit.history[d.date];
                                            let bg = 'bg-surfaceHighlight/30';
                                            if (!d.isScheduled) bg = 'opacity-0';
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
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-white">{editingHabitId ? 'Edit Habit' : 'New Habit'}</h3>
                        <button onClick={cancelForm} className="text-gray-500 hover:text-white"><Trash2 size={14} className="opacity-0" /></button> 
                    </div>

                    <div className="space-y-4">
                        <input 
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                            placeholder="Habit Name"
                            value={newHabit.name}
                            onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                            autoFocus
                        />

                        {/* Category Picker */}
                        <div>
                             <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Category</label>
                             <div className="flex flex-wrap gap-2">
                                {Object.keys(CATEGORY_COLORS).filter(c => c !== 'other').map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setNewHabit({...newHabit, category: cat as any})}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                                            newHabit.category === cat 
                                            ? 'border-transparent text-white shadow-lg' 
                                            : 'border-white/10 bg-black/20 text-gray-500 hover:bg-white/5'
                                        }`}
                                        style={{ backgroundColor: newHabit.category === cat ? CATEGORY_COLORS[cat] : undefined }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Icon Picker */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Icon</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-black/20 rounded-lg">
                                {AVAILABLE_ICONS.map(iconName => {
                                    const IconComp = (AllIcons as any)[iconName] || AllIcons.Circle;
                                    const isSelected = newHabit.icon === iconName || (!newHabit.icon && iconName === 'Circle');
                                    return (
                                        <button
                                            key={iconName}
                                            onClick={() => setNewHabit({...newHabit, icon: iconName})}
                                            className={`p-2 rounded-lg transition-all ${isSelected ? 'bg-primary text-white ring-2 ring-primary/50 shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                                            title={iconName}
                                        >
                                            <IconComp size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Frequency Picker */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Frequency</label>
                            <div className="flex gap-1.5 justify-between">
                                {DAYS.map((d, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => toggleFrequencyDay(i)}
                                        className={`flex-1 h-8 text-[10px] font-bold rounded-lg flex items-center justify-center transition-all ${newHabit.frequency?.includes(i) ? 'bg-primary text-white shadow' : 'bg-black/40 text-gray-600 hover:bg-white/5'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSaveHabit} className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-lg hover:bg-primaryDark transition-colors shadow-lg shadow-primary/25">
                            {editingHabitId ? 'Update Habit' : 'Create Habit'}
                        </button>
                        <button onClick={cancelForm} className="px-4 bg-white/5 text-gray-400 text-xs font-bold rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setShowAdd(true)}
                    className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group"
                >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add New Habit
                </button>
            )}
          </div>
      ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Period Selector */}
            <div className="flex justify-center">
                <div className="flex bg-surfaceHighlight/20 p-1 rounded-lg border border-white/5">
                    {(['week', 'month', 'year'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setGraphPeriod(p)}
                            className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${
                                graphPeriod === p 
                                ? 'bg-primary/20 text-primary border border-primary/20 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            <span className="capitalize">{p}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-surfaceHighlight/20 p-3 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-xs mb-1">Avg Consistency</div>
                    <div className="text-2xl font-bold text-primary">
                        {analyticsData.avgConsistency}%
                    </div>
                </div>
                <div className="bg-surfaceHighlight/20 p-3 rounded-xl border border-white/5">
                    <div className="text-gray-400 text-xs mb-1">Total Completions</div>
                    <div className="text-2xl font-bold text-white">
                        {analyticsData.totalCompleted} <span className="text-sm font-normal text-gray-500">done</span>
                    </div>
                </div>
            </div>

            {/* COMPLETION RATE GRAPH (Bar Chart) */}
            <div className="h-[200px] w-full bg-surfaceHighlight/10 rounded-xl p-2 border border-white/5">
                <h4 className="text-xs font-bold text-gray-400 mb-2 pl-2 capitalize">{graphPeriod}ly Completion Rate</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.trend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                        <XAxis 
                            dataKey="label" 
                            tick={{ fill: '#71717a', fontSize: 10 }} 
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                            interval={graphPeriod === 'month' ? 'preserveStartEnd' : 0}
                        />
                        <YAxis 
                            hide={false} 
                            tick={{ fill: '#71717a', fontSize: 10 }} 
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip 
                            cursor={{fill: '#ffffff05'}}
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }} 
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value: any) => [`${value}%`, 'Completed']}
                            labelFormatter={(label: any, payload: any) => payload[0]?.payload.fullDate || label}
                        />
                        <Bar 
                            dataKey="score" 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]} 
                            barSize={graphPeriod === 'year' ? 16 : 24}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* CATEGORY BREAKDOWN (Bar Chart) */}
            <div className="h-[250px] w-full bg-surfaceHighlight/10 rounded-xl p-2 border border-white/5">
                <h4 className="text-xs font-bold text-gray-400 mb-2 pl-2">Completions by Category</h4>
                {analyticsData.categories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.categories} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={75} 
                                tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: '#ffffff05'}}
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }} 
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                {analyticsData.categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || CATEGORY_COLORS.other} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                        No habits completed in this period.
                    </div>
                )}
            </div>
            
            {/* Category Legend */}
            <div className="flex flex-wrap gap-2 justify-center pb-2">
                {analyticsData.categories.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 bg-surfaceHighlight/30 px-2 py-1 rounded-lg text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name.toLowerCase()] || CATEGORY_COLORS.other }} />
                        <span className="text-gray-300">{d.name}: {d.count}</span>
                    </div>
                ))}
            </div>

          </div>
      )}
    </div>
  );
};

export default HabitMatrix;