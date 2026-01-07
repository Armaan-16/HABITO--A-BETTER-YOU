import React, { useState, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Circle, CheckCircle2, Calendar, Activity, List, TrendingUp, Plus, Minus } from './Icons';
import { ScheduleData, ScheduleItem } from '../types';
import { generateAiSchedule } from '../services/geminiService';
import { getLocalDateKey } from '../utils/storage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

interface DailyScheduleProps {
  scheduleData: ScheduleData;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
}

// Updated to cover full 24 hours: 00:00 to 23:00
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DailySchedule: React.FC<DailyScheduleProps> = ({ scheduleData, setScheduleData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'list' | 'analytics'>('list');
  const [graphPeriod, setGraphPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Use consistent local date keys
  const dateKey = getLocalDateKey(selectedDate);
  const todayKey = getLocalDateKey(new Date());
  
  const currentItems = scheduleData[dateKey] || [];
  
  // Strict string comparison for date logic
  const isToday = dateKey === todayKey;
  const isPast = dateKey < todayKey;

  // Single Day Calculations (List View)
  const activeTasks = currentItems.filter(i => i.activity && i.activity.trim() !== '');
  const activeTotal = activeTasks.length;
  const activeCompleted = activeTasks.filter(i => i.completed).length;

  // Pie Chart Data (Completion) - Single Day
  const pieData = useMemo(() => {
    const activePending = activeTotal - activeCompleted;
    if (activeTotal === 0) return [{ name: 'Empty', value: 1 }];
    return [
        { name: 'Completed', value: activeCompleted },
        { name: 'Remaining', value: activePending }
    ];
  }, [activeTotal, activeCompleted]);

  // --- AGGREGATED ANALYTICS LOGIC ---
  const analyticsData = useMemo(() => {
    let totalActive = 0;
    let totalCompleted = 0;
    const categoryCounts: Record<string, number> = { work: 0, health: 0, rest: 0, focus: 0, other: 0 };
    const trend = [];

    const endDate = new Date(selectedDate);

    if (graphPeriod === 'year') {
        // Year Logic: 12 months aggregation
        for (let i = 11; i >= 0; i--) {
            const d = new Date(endDate);
            d.setMonth(d.getMonth() - i);
            d.setDate(1); // Start of month
            
            const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
            let monthActive = 0;
            let monthCompleted = 0;
            
            // Iterate days in this month
            const tempDay = new Date(d);
            const targetMonth = tempDay.getMonth();
            
            while (tempDay.getMonth() === targetMonth && tempDay <= endDate) {
                const k = getLocalDateKey(tempDay);
                const dayItems = scheduleData[k] || [];
                const active = dayItems.filter(x => x.activity?.trim());
                
                monthActive += active.length;
                monthCompleted += active.filter(x => x.completed).length;
                
                active.forEach(task => {
                    const cat = task.category?.toLowerCase() || 'other';
                    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
                    else categoryCounts['other']++;
                });
                
                tempDay.setDate(tempDay.getDate() + 1);
            }

            totalActive += monthActive;
            totalCompleted += monthCompleted;
            
            trend.push({
                label: monthLabel,
                score: monthActive > 0 ? Math.round((monthCompleted / monthActive) * 100) : 0
            });
        }
    } else {
        // Week (7 days) or Month (30 days) Logic
        const daysToLookBack = graphPeriod === 'week' ? 6 : 29;
        
        for (let i = daysToLookBack; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const k = getLocalDateKey(d);
            
            const dayItems = scheduleData[k] || [];
            const active = dayItems.filter(x => x.activity?.trim());
            
            totalActive += active.length;
            totalCompleted += active.filter(x => x.completed).length;
            
            active.forEach(task => {
                const cat = task.category?.toLowerCase() || 'other';
                if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
                else categoryCounts['other']++;
            });

            const dayLabel = graphPeriod === 'week' 
                ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
                : d.getDate().toString();

            trend.push({
                label: dayLabel,
                fullDate: d.toLocaleDateString(),
                score: active.length > 0 ? Math.round((active.filter(x => x.completed).length / active.length) * 100) : 0
            });
        }
    }

    // Format Category Data for Chart
    const formattedCategories = Object.keys(categoryCounts).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        hours: categoryCounts[key]
    })).filter(d => d.hours > 0);

    return {
        totalActive,
        totalCompleted,
        productivity: totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0,
        trend,
        categories: formattedCategories
    };

  }, [scheduleData, selectedDate, graphPeriod]);

  const PIE_COLORS = ['#10b981', '#27272a']; // Success, SurfaceHighlight
  const BAR_COLORS: Record<string, string> = {
      Work: '#8b5cf6', // Primary
      Health: '#10b981', // Success
      Rest: '#3b82f6', // Blue
      Focus: '#f59e0b', // Amber
      Other: '#71717a' // Gray
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleCalendarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    // Create date at start of day local time
    const newDate = new Date(y, m - 1, d);
    setSelectedDate(newDate);
  };

  const updateItem = (hour: number, updates: Partial<ScheduleItem>) => {
    if (isPast) return; // Read only for past days
    
    setScheduleData(prev => {
        const dayItems = prev[dateKey] || [];
        const existingIndex = dayItems.findIndex(i => i.hour === hour);
        
        let newDayItems = [...dayItems];
        if (existingIndex >= 0) {
            newDayItems[existingIndex] = { ...newDayItems[existingIndex], ...updates };
        } else {
             newDayItems.push({
                id: `${dateKey}-${hour}-${Date.now()}`,
                hour,
                activity: '',
                completed: false,
                category: 'other',
                ...updates
             } as ScheduleItem);
        }
        return { ...prev, [dateKey]: newDayItems };
    });
  };

  const copyToNextHour = (hour: number, activity: string) => {
      if (!activity) return;
      const nextHour = (hour + 1) % 24;
      if (nextHour === 0) return; // Prevent wrapping to next day start
      updateItem(nextHour, { activity });
  };

  const handleAiGenerate = async () => {
    setLoading(true);
    
    try {
        // Pass prompt even if empty (service handles it)
        const generatedItems = await generateAiSchedule(prompt, dateKey);
        
        setScheduleData(prev => ({
            ...prev,
            [dateKey]: generatedItems
        }));
        setShowPrompt(false);
    } catch (error: any) {
        // Show specific error from service
        alert(`Creation Failed: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl h-full flex flex-col">
      {/* Header & Nav */}
      <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-xl font-bold text-white">Plan Your Day</h2>
            <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleDateChange(-1)} className="hover:text-primary transition-colors p-1"><ChevronLeft size={16}/></button>
                
                <div className="relative group flex items-center gap-2 bg-surfaceHighlight/30 hover:bg-surfaceHighlight/50 rounded-lg px-2 py-1 transition-colors">
                    <span className="text-sm text-gray-300 min-w-[90px] text-center font-medium">
                        {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="border-l border-white/10 pl-2 text-gray-400">
                        <Calendar size={14} />
                    </div>
                    
                    <input 
                        type="date"
                        value={dateKey}
                        onChange={handleCalendarSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                </div>

                <button onClick={() => handleDateChange(1)} className="hover:text-primary transition-colors p-1"><ChevronRight size={16}/></button>
            </div>
        </div>
        
        {/* Pie Chart Summary (Visible in List View) */}
        {view === 'list' && (
            <div className="h-24 w-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            innerRadius={30}
                            outerRadius={45}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Empty' ? '#27272a' : PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-gray-400">
                        {pieData[0].name === 'Empty' ? '0%' : `${Math.round((pieData[0].value / (pieData[0].value + pieData[1].value)) * 100)}%`}
                    </span>
                </div>
            </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4 p-1 bg-surfaceHighlight/30 rounded-lg">
          <button 
            onClick={() => setView('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
              <List size={14} /> Schedule
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
              <TrendingUp size={14} /> Analytics
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        
        {/* ANALYTICS VIEW */}
        {view === 'analytics' ? (
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
                                } capitalize`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surfaceHighlight/20 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400 text-xs mb-1">Avg Productivity</div>
                        <div className="text-2xl font-bold text-primary">
                            {analyticsData.productivity}%
                        </div>
                    </div>
                    <div className="bg-surfaceHighlight/20 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400 text-xs mb-1">Total Hours</div>
                        <div className="text-2xl font-bold text-white">{analyticsData.totalActive} <span className="text-sm font-normal text-gray-500">hrs</span></div>
                    </div>
                </div>

                {/* Consistency Trend Graph */}
                <div className="h-[200px] w-full bg-surfaceHighlight/10 rounded-xl p-2 border border-white/5">
                    <h4 className="text-xs font-bold text-gray-400 mb-2 pl-2 capitalize">{graphPeriod}ly Consistency Trend</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.trend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis 
                                dataKey="label" 
                                tick={{ fill: '#71717a', fontSize: 10 }} 
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                interval={graphPeriod === 'month' ? 4 : 'preserveStartEnd'}
                            />
                            <YAxis 
                                hide={false} 
                                tick={{ fill: '#71717a', fontSize: 10 }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }} 
                                itemStyle={{ color: '#10b981' }}
                                formatter={(value) => [`${value}%`, 'Adherence']}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorScore)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Bar Chart */}
                <div className="h-[250px] w-full bg-surfaceHighlight/10 rounded-xl p-2 border border-white/5">
                    <h4 className="text-xs font-bold text-gray-400 mb-2 pl-2">Time by Category ({graphPeriod})</h4>
                    {analyticsData.categories.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.categories} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={60} 
                                    tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#ffffff05'}}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }} 
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                                    {analyticsData.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[entry.name] || BAR_COLORS.Other} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                            No activities recorded for this period.
                        </div>
                    )}
                </div>

                {/* Category Legend */}
                <div className="flex flex-wrap gap-2 justify-center pb-4">
                    {analyticsData.categories.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 bg-surfaceHighlight/30 px-2 py-1 rounded-lg text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BAR_COLORS[d.name] || BAR_COLORS.Other }} />
                            <span className="text-gray-300">{d.name}: {d.hours}h</span>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            // LIST VIEW
            <>
                {/* AI Prompt */}
                {!isPast && (
                    <div className="mb-4">
                        {!showPrompt ? (
                            <button 
                                onClick={() => setShowPrompt(true)}
                                className="w-full py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl text-primary text-sm font-medium hover:bg-primary/30 transition-all"
                            >
                                <Sparkles size={16} />
                                <span>AI Plan My Day</span>
                            </button>
                        ) : (
                            <div className="bg-surfaceHighlight rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none mb-2"
                                    placeholder="e.g. Sleep at 11pm, wake at 7am, focus on coding..."
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleAiGenerate} 
                                        disabled={loading}
                                        className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primaryDark transition-colors"
                                    >
                                        {loading ? 'Thinking...' : 'Generate Plan'}
                                    </button>
                                    <button onClick={() => setShowPrompt(false)} className="px-3 bg-white/5 text-gray-400 text-xs font-bold rounded-lg hover:bg-white/10">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {HOURS.map(hour => {
                        const item = currentItems.find(i => i.hour === hour);
                        
                        // Generate formatted time range (e.g., 9-10 AM)
                        const nextHour = (hour + 1) % 24;
                        const formatHour = (h: number) => {
                            if (h === 0 || h === 24) return 12;
                            if (h > 12) return h - 12;
                            return h;
                        };
                        
                        const startPeriod = hour < 12 ? 'AM' : 'PM';
                        const endPeriod = nextHour < 12 ? 'AM' : 'PM';
                        
                        let timeLabel;
                        if (startPeriod === endPeriod) {
                             timeLabel = `${formatHour(hour)} - ${formatHour(nextHour)} ${startPeriod}`;
                        } else {
                             timeLabel = `${formatHour(hour)} ${startPeriod} - ${formatHour(nextHour)} ${endPeriod}`;
                        }

                        const isCompleted = item?.completed;
                        const hasActivity = !!item?.activity;
                        
                        return (
                            <div key={hour} className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-surfaceHighlight/30 border-transparent opacity-60' : hasActivity ? 'bg-surfaceHighlight/20 border-white/5' : 'border-dashed border-white/5 hover:border-white/10'}`}>
                                
                                {/* Time Label - Increased visibility */}
                                <div className="min-w-[85px] sm:text-right">
                                    <span className="text-base font-bold text-gray-300 block leading-tight">{timeLabel}</span>
                                </div>
                                
                                <div className="flex-1 flex items-center gap-2 w-full">
                                    {isPast ? (
                                        <div className="text-sm text-gray-300 min-h-[24px] py-1">{item?.activity || '-'}</div>
                                    ) : (
                                        <div className="flex-1 relative group/input">
                                            <input 
                                                type="text"
                                                placeholder={isCompleted ? "Completed" : "Plan this hour..."}
                                                className={`w-full bg-transparent text-sm md:text-base focus:outline-none placeholder-gray-600 py-1 ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}
                                                value={item?.activity || ''}
                                                onChange={(e) => updateItem(hour, { activity: e.target.value })}
                                            />
                                            {/* Action Buttons: Plus (Copy) and Minus (Clear) */}
                                            {hasActivity && !isPast && (
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex opacity-0 group-hover/input:opacity-100 transition-opacity bg-surfaceHighlight/80 rounded-lg backdrop-blur-sm border border-white/5 z-10">
                                                    <button 
                                                        onClick={() => updateItem(hour, { activity: '' })}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-l-lg transition-colors border-r border-white/10"
                                                        title="Clear (Undo)"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => copyToNextHour(hour, item!.activity)}
                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-white/5 rounded-r-lg transition-colors"
                                                        title="Copy to next hour"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => updateItem(hour, { completed: !isCompleted })}
                                    disabled={isPast || !hasActivity}
                                    className={`self-end sm:self-center transition-all flex-shrink-0 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={24} className="text-success" />
                                    ) : (
                                        <Circle size={24} className={`text-gray-600 ${hasActivity ? 'text-gray-400 group-hover:text-primary' : ''}`} />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default DailySchedule;