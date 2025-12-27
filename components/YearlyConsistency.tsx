import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from './Icons';
import { ScheduleData } from '../types';
import { getLocalDateKey } from '../utils/storage';

interface YearlyConsistencyProps {
  scheduleData: ScheduleData;
}

const YearlyConsistency: React.FC<YearlyConsistencyProps> = ({ scheduleData }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate completion rate based on Daily Schedule
  const getIntensity = (dateStr: string) => {
    const dayItems = scheduleData[dateStr] || [];
    
    // Filter only items that have an actual activity defined
    const activeItems = dayItems.filter(i => i.activity && i.activity.trim() !== '');
    
    if (activeItems.length === 0) return 0;

    const completed = activeItems.filter(i => i.completed).length;
    return completed / activeItems.length;
  };

  const { weeks, monthLabels } = useMemo(() => {
    const daysInYear: Date[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Determine start offset (0 = Sunday)
    const startDay = startDate.getDay();
    
    // Generate all dates
    const current = new Date(startDate);
    while (current <= endDate) {
      daysInYear.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(7).fill(null);

    // Fill initial empty days
    for (let i = 0; i < startDay; i++) {
        currentWeek[i] = null;
    }

    daysInYear.forEach(date => {
        const dayOfWeek = date.getDay();
        currentWeek[dayOfWeek] = date;
        if (dayOfWeek === 6) {
            weeks.push(currentWeek);
            currentWeek = Array(7).fill(null);
        }
    });

    // Push last week if not empty
    if (currentWeek.some(d => d !== null)) {
        weeks.push(currentWeek);
    }
    
    // Calculate Month Labels positions
    const monthLabels: { month: number; label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, index) => {
        const firstDayOfWeek = week.find(d => d !== null);
        if (firstDayOfWeek) {
             const m = firstDayOfWeek.getMonth();
             // Only add label if month changed
             if (m !== lastMonth) {
                lastMonth = m;
                monthLabels.push({
                    month: m,
                    label: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
                    weekIndex: index
                });
             }
        }
    });

    return { weeks, monthLabels };
  }, [year]);

  // Scroll logic
  useEffect(() => {
    if (scrollRef.current) {
        if (year === new Date().getFullYear()) {
             // Scroll to near end (current date)
             scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        } else {
             scrollRef.current.scrollLeft = 0;
        }
    }
  }, [year, weeks]); // Added weeks dependency to ensure scroll happens after render

  // Grid dimensions configuration
  const CELL_SIZE = 16; // Increased from 12
  const GAP_SIZE = 3;   // Increased from 2
  const COL_WIDTH = CELL_SIZE + GAP_SIZE; // 19px
  
  // Calculate specific positions for Y-Axis labels (Mon=1, Wed=3, Fri=5)
  // Each row is at index * COL_WIDTH. We want to center text vertically relative to the cell.
  // We'll approximate the "top" offset. 
  // Row 1 starts at 1 * 19 = 19px.
  // Row 3 starts at 3 * 19 = 57px.
  // Row 5 starts at 5 * 19 = 95px.
  const LABEL_OFFSET_MON = COL_WIDTH * 1; 
  const LABEL_OFFSET_WED = COL_WIDTH * 3;
  const LABEL_OFFSET_FRI = COL_WIDTH * 5;

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Momentum
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">{year}</span>
          <div className="flex gap-1">
            <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={18} />
            </button>
            <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-4 custom-scrollbar"
      >
        <div className="min-w-max pl-10 relative pr-4"> {/* Increased left padding for labels */}
            
            {/* Y Axis Labels (Absolute positioned to left) */}
            <div className="absolute left-0 top-[24px] flex flex-col h-full text-[10px] text-gray-500 font-bold uppercase tracking-wide leading-none select-none">
                <span className="absolute" style={{ top: LABEL_OFFSET_MON }}>Mon</span>
                <span className="absolute" style={{ top: LABEL_OFFSET_WED }}>Wed</span>
                <span className="absolute" style={{ top: LABEL_OFFSET_FRI }}>Fri</span>
            </div>

            {/* Month Labels */}
            <div className="flex mb-2 relative h-5 w-full select-none">
                 {monthLabels.map((m, i) => (
                     <div 
                        key={i} 
                        className="absolute text-[11px] font-bold text-gray-500"
                        style={{ left: `${m.weekIndex * COL_WIDTH}px` }} 
                     >
                        {m.label}
                     </div>
                 ))}
            </div>

            {/* Heatmap Grid */}
            <div className="flex" style={{ gap: GAP_SIZE }}>
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col" style={{ gap: GAP_SIZE }}>
                        {week.map((date, dIndex) => {
                            // If date is null (placeholder), render transparent box
                            if (!date) return <div key={dIndex} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                            
                            const dateStr = getLocalDateKey(date);
                            const intensity = getIntensity(dateStr);
                            
                            let bgClass = 'bg-surfaceHighlight/30';
                            if (intensity > 0) bgClass = 'bg-primary/30';
                            if (intensity > 0.4) bgClass = 'bg-primary/60';
                            if (intensity > 0.7) bgClass = 'bg-primary';
                            if (intensity === 1) bgClass = 'bg-success'; // Emerald for 100%

                            return (
                                <div 
                                    key={dIndex}
                                    title={`${date.toDateString()}: ${Math.round(intensity * 100)}%`}
                                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                                    className={`rounded-[3px] ${bgClass} hover:ring-2 ring-white/50 transition-all cursor-default`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 justify-end border-t border-white/5 pt-3">
        <span>Less</span>
        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-surfaceHighlight/30 rounded-[3px]" />
        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-primary/30 rounded-[3px]" />
        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-primary/60 rounded-[3px]" />
        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-primary rounded-[3px]" />
        <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="bg-success rounded-[3px]" />
        <span>More</span>
      </div>
    </div>
  );
};

export default YearlyConsistency;