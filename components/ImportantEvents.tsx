import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { LifeEvent } from '../types';

interface ImportantEventsProps {
  events: LifeEvent[];
  setEvents: React.Dispatch<React.SetStateAction<LifeEvent[]>>;
}

const ImportantEvents: React.FC<ImportantEventsProps> = ({ events, setEvents }) => {
  const [now, setNow] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '' });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeLeft = (targetDate: string) => {
    const total = Date.parse(targetDate) - now.getTime();
    if (total <= 0) return null;
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds };
  };

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...events, {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        color: 'primary'
    }]);
    setIsAdding(false);
    setNewEvent({ title: '', date: '' });
  };

  const handleDelete = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            Important Events
        </h2>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surfaceHighlight hover:bg-primary/20 text-gray-300 hover:text-white rounded-lg transition-colors text-xs font-medium"
        >
            <Plus size={14} /> Add Event
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-surfaceHighlight/30 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input 
                    type="text" 
                    placeholder="e.g. Exam, Marathon"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
            </div>
            <div className="md:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input 
                    type="datetime-local" 
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
            </div>
            <div className="md:col-span-1 flex gap-2">
                <button onClick={handleAdd} className="flex-1 bg-primary text-white text-sm font-bold py-2 rounded-lg hover:bg-primaryDark transition-colors">Save</button>
                <button onClick={() => setIsAdding(false)} className="px-4 bg-white/5 text-gray-400 text-sm font-bold rounded-lg hover:bg-white/10">Cancel</button>
            </div>
        </div>
      )}

      {/* Grid Layout for Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 && !isAdding && (
            <div className="col-span-full py-8 text-center text-gray-500 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                No upcoming events tracked. Add one to see the countdown!
            </div>
        )}
        
        {events.map(event => {
            const timeLeft = getTimeLeft(event.date);
            return (
                <div key={event.id} className="group relative p-5 rounded-2xl bg-gradient-to-br from-surfaceHighlight/50 to-surface border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-white truncate pr-6">{event.title}</h3>
                        <button 
                            onClick={() => handleDelete(event.id)}
                            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    
                    {timeLeft ? (
                        <div className="grid grid-cols-4 gap-2 text-center mb-2">
                            <TimeBox value={timeLeft.days} label="Days" color="text-white" />
                            <TimeBox value={timeLeft.hours} label="Hrs" color="text-white" />
                            <TimeBox value={timeLeft.minutes} label="Min" color="text-white" />
                            <TimeBox value={timeLeft.seconds} label="Sec" color="text-accent" />
                        </div>
                    ) : (
                        <div className="py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-success/20 text-success rounded-full text-xs font-bold">Completed</span>
                        </div>
                    )}
                    
                    <div className="text-[10px] text-gray-500 text-center mt-3 pt-3 border-t border-white/5">
                        {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

const TimeBox: React.FC<{ value: number, label: string, color: string }> = ({ value, label, color }) => (
    <div className="bg-black/30 rounded-lg py-2 border border-white/5">
        <div className={`text-lg md:text-xl font-bold ${color} leading-none`}>{value}</div>
        <div className="text-[9px] text-gray-500 uppercase mt-1 font-medium">{label}</div>
    </div>
);

export default ImportantEvents;