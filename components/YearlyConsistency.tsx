import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';
import { Habit } from '../types';
import { getLocalDateKey } from '../utils/storage';

interface YearlyConsistencyProps {
  habits: Habit[];
}

const YearlyConsistency: React.FC<YearlyConsistencyProps> = ({ habits }) => {
  const [year, setYear] = useState(new Date().getFullYear());

  // Helper to get all days in the year
  const getDaysInYear = (year: number) => {
    const dates = [];
    const date = new Date(year, 0, 1);
    while (date.getFullYear() === year) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const days = getDaysInYear(year);
  
  // Calculate completion rate for each day
  const getIntensity = (dateStr: string) => {
    let completed = 0;
    let total = 0;
    
    // Find habits scheduled for this day of week
    // Note: getLocalDateKey returns 'YYYY-MM-DD'. We need to parse it back for getDay()
    // Using simple Date(dateStr) works usually, but let's be safe since we just constructed the string
    // Actually dayOfWeek is constant for a specific dateStr
    
    // Parse dateStr parts to avoid UTC shift
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayObj = new Date(y, m - 1, d);
    const dayOfWeek = dayObj.getDay();

    habits.forEach(h => {
        if (h.frequency.includes(dayOfWeek)) {
            total++;
            if (h.history[dateStr]) {
                completed++;
            }
        }
    });

    if (total === 0) return 0;
    return completed / total;
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Yearly Consistency: {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex text-xs text-gray-500 mb-2 justify-between px-8">
        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
        <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
         <div className="grid grid-flow-col grid-rows-7 gap-1 w-full">
            {days.map((day) => {
                const dateStr = getLocalDateKey(day);
                const intensity = getIntensity(dateStr);
                
                let bgClass = 'bg-surfaceHighlight/50'; // 0
                if (intensity > 0) bgClass = 'bg-primary/30';
                if (intensity > 0.3) bgClass = 'bg-primary/50';
                if (intensity > 0.6) bgClass = 'bg-primary/80';
                if (intensity === 1) bgClass = 'bg-primary';

                return (
                    <div 
                        key={dateStr}
                        title={`${dateStr}: ${Math.round(intensity * 100)}%`}
                        className={`w-3 h-3 rounded-sm ${bgClass} hover:ring-1 ring-white/50 transition-all`}
                    />
                );
            })}
         </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 justify-end">
        <span>Less</span>
        <div className="w-3 h-3 bg-surfaceHighlight/50 rounded-sm" />
        <div className="w-3 h-3 bg-primary/30 rounded-sm" />
        <div className="w-3 h-3 bg-primary/50 rounded-sm" />
        <div className="w-3 h-3 bg-primary/80 rounded-sm" />
        <div className="w-3 h-3 bg-primary rounded-sm" />
        <span>More</span>
      </div>
    </div>
  );
};

export default YearlyConsistency;