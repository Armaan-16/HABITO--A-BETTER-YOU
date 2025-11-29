import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Habit } from '../types';
import { getLocalDateKey } from '../utils/storage';

interface GrowthChartsProps {
  habits: Habit[];
}

const GrowthCharts: React.FC<GrowthChartsProps> = ({ habits }) => {
  
  const data = useMemo(() => {
    const days = 7;
    const result = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateKey(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        
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

  const todayScore = data[data.length - 1]?.value || 0;
  const avgScore = Math.round(data.reduce((acc, curr) => acc + curr.value, 0) / data.length) || 0;

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-xl font-bold text-white">Growth Trends</h2>
        </div>
        <div className="text-right">
            <div className="text-3xl font-bold text-primary">{todayScore}%</div>
            <div className="text-xs text-gray-400">Today's Efficiency</div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
                tick={{ fill: '#71717a', fontSize: 12 }} 
                dy={10}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
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
                animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm">
        <span className="text-gray-500">7-Day Average</span>
        <span className="font-bold text-white">{avgScore}%</span>
      </div>
    </div>
  );
};

export default GrowthCharts;