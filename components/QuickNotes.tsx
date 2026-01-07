import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Plus, Trash2, AlertCircle, Edit2, Check, X, BookOpen, ChevronLeft, ChevronRight, Calendar, Save, Type, Palette, LayoutGrid } from './Icons';
import { Note, JournalEntry } from '../types';
import { getLocalDateKey } from '../utils/storage';

interface QuickNotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  journal: JournalEntry[];
  setJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const FONTS = [
    { id: 'sans', label: 'Modern', class: 'font-sans' },
    { id: 'serif', label: 'Elegant', class: 'font-serif tracking-wide' },
    { id: 'mono', label: 'Code', class: 'font-mono text-xs' },
    { id: 'hand', label: 'Hand', class: 'font-hand text-xl' }
];

const COLORS = [
    { id: 'default', label: 'Default', class: 'text-gray-200' },
    { id: 'muted', label: 'Muted', class: 'text-gray-400' },
    { id: 'rose', label: 'Rose', class: 'text-rose-300' },
    { id: 'gold', label: 'Gold', class: 'text-amber-300' },
    { id: 'mint', label: 'Mint', class: 'text-emerald-300' },
];

const QuickNotes: React.FC<QuickNotesProps> = ({ notes, setNotes, journal, setJournal }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'journal'>('notes');
  
  // --- NOTES STATE ---
  const [newNote, setNewNote] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // --- JOURNAL STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entryContent, setEntryContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  
  // Journal Appearance (Persist in state for session)
  const [currentFont, setCurrentFont] = useState(FONTS[1]); // Default to Elegant
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date()); // For navigating calendar without selecting

  // Sync Journal Entry on Date Change
  useEffect(() => {
    if (activeTab === 'journal') {
        const dateKey = getLocalDateKey(selectedDate);
        const entry = journal.find(j => j.date === dateKey);
        setEntryContent(entry ? entry.content : '');
        setIsSaved(true);
        // Sync calendar view to selected date initially
        setCalendarViewDate(new Date(selectedDate));
    }
  }, [selectedDate, activeTab, journal]);

  // --- NOTE HANDLERS ---
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      isUrgent,
      createdAt: new Date().toISOString()
    };
    setNotes([note, ...notes]);
    setNewNote('');
    setIsUrgent(false);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Delete this note?')) setNotes(notes.filter(n => n.id !== id));
  };

  const startEditingNote = (note: Note) => {
      setEditingId(note.id);
      setEditText(note.content);
  };

  const saveEditNote = () => {
      if (!editingId || !editText.trim()) {
          setEditingId(null); return;
      }
      setNotes(notes.map(n => n.id === editingId ? { ...n, content: editText } : n));
      setEditingId(null);
      setEditText('');
  };

  // --- JOURNAL HANDLERS ---
  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const saveJournalEntry = () => {
    const dateKey = getLocalDateKey(selectedDate);
    const existingEntryIndex = journal.findIndex(j => j.date === dateKey);
    
    // If empty, remove entry if exists
    if (!entryContent.trim()) {
        if (existingEntryIndex >= 0) {
            setJournal(journal.filter(j => j.date !== dateKey));
        }
        setIsSaved(true);
        return;
    }

    const updatedJournal = [...journal];
    if (existingEntryIndex >= 0) {
        updatedJournal[existingEntryIndex] = {
            ...updatedJournal[existingEntryIndex],
            content: entryContent,
            lastUpdated: new Date().toISOString()
        };
    } else {
        updatedJournal.push({
            id: Date.now().toString(),
            date: dateKey,
            content: entryContent,
            lastUpdated: new Date().toISOString()
        });
    }
    setJournal(updatedJournal);
    setIsSaved(true);
  };

  // --- CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    // Days
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    
    return days;
  }, [calendarViewDate]);

  const selectCalendarDate = (date: Date) => {
      setSelectedDate(date);
      setShowCalendar(false);
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl transition-all duration-300 h-full flex flex-col">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex bg-surfaceHighlight/50 p-1 rounded-xl">
             <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'notes' ? 'bg-surface text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
             >
                 <StickyNote size={14} className={activeTab === 'notes' ? 'text-yellow-400' : ''} />
                 Notes
             </button>
             <button
                onClick={() => setActiveTab('journal')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'journal' ? 'bg-surface text-white shadow-lg border border-white/5' : 'text-gray-500 hover:text-gray-300'}`}
             >
                 <BookOpen size={14} className={activeTab === 'journal' ? 'text-pink-400' : ''} />
                 Journal
             </button>
        </div>
        <div className="text-xs text-gray-500 font-medium hidden sm:block">
             {activeTab === 'notes' ? `${notes.length} items` : journal.length > 0 ? `${journal.length} entries` : 'Your Space'}
        </div>
      </div>

      {activeTab === 'notes' ? (
        // --- QUICK NOTES VIEW ---
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 bg-surfaceHighlight/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-600"
                placeholder="Add important info..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                className="bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded-xl transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
               <button
                 onClick={() => setIsUrgent(!isUrgent)}
                 className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${isUrgent ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500'}`}
               >
                 <AlertCircle size={12} />
                 Mark as Urgent
               </button>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
            {notes.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-white/5 rounded-xl">
                    No notes available.
                </div>
            )}
            {notes.map(note => {
                const isEditing = editingId === note.id;
                return (
                  <div key={note.id} className={`group p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${note.isUrgent ? 'bg-red-500/5 border-red-500/30' : 'bg-surfaceHighlight/20 border-white/5'}`}>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    className="w-full bg-black/40 text-white text-sm px-2 py-1.5 rounded border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={2}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditNote(); }
                                        if(e.key === 'Escape') setEditingId(null);
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <button onClick={saveEditNote} className="flex items-center gap-1 px-2 py-1 rounded bg-success/20 text-success text-xs hover:bg-success/30 transition-colors">
                                        <Check size={12} /> Save
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-colors">
                                        <X size={12} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-2">
                                    {note.isUrgent && <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                                    <p className={`text-sm break-words whitespace-pre-wrap ${note.isUrgent ? 'text-red-100 font-medium' : 'text-gray-300'}`}>{note.content}</p>
                                </div>
                                <span className="text-[10px] text-gray-600 mt-2 block pl-0.5">
                                    {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditingNote(note)} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
      ) : (
        // --- JOURNAL VIEW ---
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
             
             {/* Styling Toolbar */}
             <div className="absolute top-0 right-0 z-20 flex gap-2">
                 {/* Font Picker */}
                <div className="relative group">
                    <button className="p-2 bg-surfaceHighlight/50 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5" title="Change Font">
                        <Type size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-surfaceHighlight rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                        {FONTS.map(f => (
                            <button 
                                key={f.id} 
                                onClick={() => setCurrentFont(f)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-surfaceHighlight transition-colors ${f.class} ${currentFont.id === f.id ? 'text-primary' : 'text-gray-400'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div className="relative group">
                    <button className="p-2 bg-surfaceHighlight/50 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5" title="Change Color">
                        <Palette size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-surfaceHighlight rounded-xl shadow-xl p-2 hidden group-hover:flex flex-wrap gap-1 z-50">
                        {COLORS.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => setCurrentColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${c.class.replace('text-', 'bg-')} ${currentColor.id === c.id ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>

                {/* Calendar Toggle */}
                 <button 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`p-2 rounded-lg transition-colors border border-white/5 ${showCalendar ? 'bg-primary text-white' : 'bg-surfaceHighlight/50 hover:bg-surfaceHighlight text-gray-400 hover:text-white'}`}
                    title="Toggle Calendar"
                >
                    <LayoutGrid size={16} />
                </button>
             </div>

             {showCalendar ? (
                 // --- CALENDAR VIEW ---
                 <div className="flex-1 bg-surfaceHighlight/10 rounded-2xl p-4 border border-white/5 animate-in zoom-in-95 mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white font-serif tracking-wide">
                            {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex gap-1">
                            <button onClick={() => setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><ChevronLeft size={18}/></button>
                            <button onClick={() => setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><ChevronRight size={18}/></button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 h-[260px] overflow-y-auto custom-scrollbar">
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="p-2" />;
                            
                            const dateKey = getLocalDateKey(date);
                            const hasEntry = journal.some(j => j.date === dateKey);
                            const isSelected = getLocalDateKey(selectedDate) === dateKey;
                            const isToday = getLocalDateKey(new Date()) === dateKey;

                            return (
                                <button
                                    key={dateKey}
                                    onClick={() => selectCalendarDate(date)}
                                    className={`relative p-2 rounded-xl flex flex-col items-center justify-center min-h-[40px] transition-all border ${
                                        isSelected 
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                        : 'bg-surfaceHighlight/20 border-white/5 text-gray-400 hover:bg-surfaceHighlight hover:text-white hover:border-white/10'
                                    }`}
                                >
                                    <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{date.getDate()}</span>
                                    {hasEntry && (
                                        <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-accent'}`} />
                                    )}
                                    {isToday && !isSelected && (
                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                 </div>
             ) : (
                // --- WRITING VIEW ---
                <>
                    {/* Date Navigation */}
                    <div className="flex items-center justify-between pr-32 mb-4 mt-2"> {/* Added padding-right to avoid overlap with toolbar */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleDateChange(-1)} 
                                className="p-1.5 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">
                                    {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                                <span className="text-base font-serif text-white font-medium leading-tight">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            <button 
                                onClick={() => handleDateChange(1)} 
                                className="p-1.5 hover:bg-surfaceHighlight rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Aesthetic Writing Area */}
                    <div className="relative flex-1 min-h-[350px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-surfaceHighlight/5 rounded-2xl p-6 border border-white/5 flex flex-col group focus-within:border-primary/30 transition-colors">
                        
                        {/* Lines decoration */}
                        <div className="absolute top-6 left-8 bottom-6 w-px bg-red-500/10 pointer-events-none" />
                        
                        <textarea
                            className={`w-full h-full bg-transparent border-none focus:ring-0 text-lg leading-loose resize-none custom-scrollbar pl-6 ${currentFont.class} ${currentColor.class}`}
                            placeholder="Dear Diary..."
                            value={entryContent}
                            onChange={(e) => { setEntryContent(e.target.value); setIsSaved(false); }}
                            spellCheck={false}
                        />

                        {/* Status Footer */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 italic transition-opacity duration-500">
                                {isSaved ? "Saved" : "Unsaved changes..."}
                            </span>
                            <button 
                                onClick={saveJournalEntry}
                                disabled={isSaved}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${isSaved ? 'bg-surfaceHighlight text-gray-500 cursor-default' : 'bg-primary text-white hover:bg-primaryDark hover:scale-105'}`}
                            >
                                <Save size={14} />
                                Save
                            </button>
                        </div>
                    </div>
                </>
             )}
        </div>
      )}
    </div>
  );
};

export default QuickNotes;