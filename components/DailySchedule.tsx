import React, { useState, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Circle, CheckCircle2 } from './Icons';
import { ScheduleData, ScheduleItem } from '../types';
import { generateAiSchedule } from '../services/geminiService';
import { getLocalDateKey } from '../utils/storage';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DailyScheduleProps {
  scheduleData: ScheduleData;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
}

// Updated to cover full 24 hours: 00:00 to 23:00
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DailySchedule: React.FC<DailyScheduleProps> = ({ scheduleData, setScheduleData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  // Pie Chart Data
  const chartData = useMemo(() => {
    const activeTasks = currentItems.filter(i => i.activity && i.activity.trim() !== '');
    const activeTotal = activeTasks.length;
    const activeCompleted = activeTasks.filter(i => i.completed).length;
    const activePending = activeTotal - activeCompleted;
    
    if (activeTotal === 0) return [{ name: 'Empty', value: 1 }];
    return [
        { name: 'Completed', value: activeCompleted },
        { name: 'Remaining', value: activePending }
    ];
  }, [currentItems]);

  const COLORS = ['#10b981', '#27272a']; // Success, SurfaceHighlight

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
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
            // Create new if trying to edit an empty slot
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

  const handleAiGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    const generatedItems = await generateAiSchedule(prompt, dateKey);
    
    setScheduleData(prev => ({
        ...prev,
        [dateKey]: generatedItems // Overwrites for now
    }));
    
    setLoading(false);
    setShowPrompt(false);
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl h-full flex flex-col">
      {/* Header & Nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-xl font-bold text-white">Daily Schedule</h2>
            <div className="flex items-center gap-2 mt-1">
                <button onClick={() => handleDateChange(-1)} className="hover:text-primary transition-colors"><ChevronLeft size={16}/></button>
                <span className="text-sm text-gray-400 min-w-[100px] text-center font-medium">
                    {isToday ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <button onClick={() => handleDateChange(1)} className="hover:text-primary transition-colors"><ChevronRight size={16}/></button>
            </div>
        </div>
        
        {/* Increased Size of Pie Chart */}
        <div className="h-28 w-28 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Empty' ? '#27272a' : COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '12px' }} 
                        itemStyle={{ color: '#fff' }}
                    />
                </PieChart>
             </ResponsiveContainer>
             {/* Center Text for Percentage */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-gray-400">
                    {chartData[0].name === 'Empty' ? '0%' : `${Math.round((chartData[0].value / (chartData[0].value + chartData[1].value)) * 100)}%`}
                </span>
             </div>
        </div>
      </div>

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
                        placeholder="e.g. Focus on coding and workout..."
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

      {/* Hour Blocks */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {HOURS.map(hour => {
            const item = currentItems.find(i => i.hour === hour);
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
            const isCompleted = item?.completed;
            const hasActivity = !!item?.activity;
            
            return (
                <div key={hour} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${isCompleted ? 'bg-surfaceHighlight/30 border-transparent opacity-60' : hasActivity ? 'bg-surfaceHighlight/20 border-white/5' : 'border-dashed border-white/5 hover:border-white/10'}`}>
                    <span className="text-xs font-mono text-gray-500 w-10">{timeLabel}</span>
                    
                    <div className="flex-1">
                        {isPast ? (
                             <div className="text-sm text-gray-300 min-h-[20px]">{item?.activity || '-'}</div>
                        ) : (
                            <input 
                                type="text"
                                placeholder={isCompleted ? "Completed" : "Plan this hour..."}
                                className={`w-full bg-transparent text-sm focus:outline-none placeholder-gray-600 ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}
                                value={item?.activity || ''}
                                onChange={(e) => updateItem(hour, { activity: e.target.value })}
                            />
                        )}
                    </div>

                    <button 
                        onClick={() => updateItem(hour, { completed: !isCompleted })}
                        disabled={isPast || !hasActivity}
                        className={`transition-colors flex-shrink-0 ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={20} className="text-success" />
                        ) : (
                            <Circle size={20} className={`text-gray-600 ${hasActivity ? 'group-hover:text-primary' : ''}`} />
                        )}
                    </button>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default DailySchedule;