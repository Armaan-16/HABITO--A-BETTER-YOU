import React, { useState, useRef } from 'react';
import { VisionItem, VisionCategory } from '../types';
import { Target, Rocket, Crown, Calendar, Plus, Trash2, Edit2, Check, X, ListTodo, Sun, GripVertical } from './Icons';

interface VisionBoardProps {
  visions: VisionItem[];
  setVisions: React.Dispatch<React.SetStateAction<VisionItem[]>>;
}

const CATEGORIES: { id: VisionCategory; label: string; icon: React.FC<any>; color: string }[] = [
  { id: 'DAILY', label: 'Priorities', icon: ListTodo, color: 'text-green-400' },
  { id: 'WEEKLY', label: 'Week', icon: Calendar, color: 'text-blue-400' },
  { id: 'MONTHLY', label: 'Month', icon: Target, color: 'text-primary' },
  { id: 'YEARLY', label: 'Year', icon: Rocket, color: 'text-accent' },
  { id: '5_YEARS', label: '5 Years', icon: Crown, color: 'text-amber-400' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const VisionBoard: React.FC<VisionBoardProps> = ({ visions, setVisions }) => {
  const [activeTab, setActiveTab] = useState<VisionCategory>('DAILY');
  const [activeDay, setActiveDay] = useState<string>(WEEK_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]); // Default to today (adjusting Sun=0 to index 6)
  
  const [newVision, setNewVision] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Drag & Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Filter logic: Standard categories vs Weekly with Day breakdown
  const currentVisions = visions.filter(v => {
      if (v.category !== activeTab) return false;
      if (activeTab === 'WEEKLY') {
          return (v.day === activeDay) || (!v.day && activeDay === 'Mon');
      }
      return true;
  });

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    // We allow standard move effect
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    
    // If we are over a different item than the one we are dragging
    if (dragItem.current !== null && dragItem.current !== position) {
        
        // 1. Create a copy of the current visible list
        const newOrderedVisible = [...currentVisions];
        const itemToMove = newOrderedVisible[dragItem.current];
        
        // 2. Perform the swap in the visible list
        newOrderedVisible.splice(dragItem.current, 1);
        newOrderedVisible.splice(position, 0, itemToMove);
        
        // 3. Update the ref immediately to avoid flickering
        dragItem.current = position;

        // 4. Update the global visions state
        // We filter out items that match the current view criteria from the global list,
        // then append our reordered list.
        const others = visions.filter(v => {
             if (v.category !== activeTab) return true;
             if (activeTab === 'WEEKLY') {
                  const isVisible = (v.day === activeDay) || (!v.day && activeDay === 'Mon');
                  return !isVisible;
             }
             return false;
        });

        setVisions([...others, ...newOrderedVisible]);
    }
  };

  const handleDragEnd = () => {
      dragItem.current = null;
      dragOverItem.current = null;
  };

  const handleAdd = () => {
    if (!newVision.trim()) return;
    
    const newItem: VisionItem = {
        id: Date.now().toString(),
        text: newVision,
        category: activeTab,
        // Only add day if we are in Weekly tab
        ...(activeTab === 'WEEKLY' ? { day: activeDay } : {}) 
    };

    setVisions([...visions, newItem]);
    setNewVision('');
  };

  const handleDelete = (id: string) => {
    setVisions(visions.filter(v => v.id !== id));
  };

  const startEdit = (vision: VisionItem) => {
    setEditingId(vision.id);
    setEditText(vision.text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) {
        cancelEdit();
        return;
    }
    setVisions(visions.map(v => v.id === editingId ? { ...v, text: editText } : v));
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <Sun className="text-primary" />
           Commit
        </h2>
        
        <div className="flex bg-surfaceHighlight/50 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === cat.id 
                  ? 'bg-surface border border-white/10 text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <cat.icon size={14} className={activeTab === cat.id ? cat.color : ''} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Day Selector */}
      {activeTab === 'WEEKLY' && (
          <div className="flex gap-1 mb-4 pb-2 overflow-x-auto scrollbar-hide border-b border-white/5">
              {WEEK_DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`flex-1 min-w-[40px] py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                        activeDay === day 
                        ? 'bg-primary/20 text-primary border border-primary/20' 
                        : 'bg-surfaceHighlight/30 text-gray-500 hover:bg-surfaceHighlight/50'
                    }`}
                  >
                      {day}
                  </button>
              ))}
          </div>
      )}

      {/* Daily Header Prompt */}
      {activeTab === 'DAILY' && (
          <div className="mb-4 text-xs text-gray-400 bg-surfaceHighlight/20 p-2 rounded-lg flex items-center gap-2">
              <ListTodo size={14} className="text-green-400"/>
              <span>What are your absolute top priorities for today?</span>
          </div>
      )}

      <div className="space-y-3 min-h-[150px]">
        {currentVisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[150px] text-gray-600 border-2 border-dashed border-surfaceHighlight rounded-xl">
            <Target size={32} className="mb-2 opacity-20" />
            <span className="text-sm">
                {activeTab === 'WEEKLY' 
                    ? `No plans set for ${activeDay}.` 
                    : activeTab === 'DAILY' 
                        ? "No priorities added yet."
                        : `No goals set for this ${CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()}.`
                }
            </span>
          </div>
        ) : (
          <div className="space-y-3">
             {currentVisions.map((vision, index) => {
                const isEditing = editingId === vision.id;
                return (
                    <div 
                        key={vision.id} 
                        draggable={!isEditing}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${isEditing ? 'bg-surfaceHighlight/40 border-primary/30 cursor-default' : 'bg-surfaceHighlight/20 border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing'}`}
                    >
                        {/* Drag Handle (Visible on Group Hover) */}
                        {!isEditing && (
                            <div className="text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title="Drag to reorder">
                                <GripVertical size={14} />
                            </div>
                        )}

                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CATEGORIES.find(c => c.id === vision.category)?.color.replace('text-', 'bg-') || 'bg-white'}`} />
                        
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                            <input 
                                className="w-full bg-black/40 text-white text-sm px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, saveEdit)}
                                autoFocus
                            />
                            ) : (
                            <p className="text-sm text-gray-200 truncate select-none">{vision.text}</p>
                            )}
                        </div>

                        <div className={`flex gap-2 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isEditing ? (
                            <>
                                <button onClick={saveEdit} className="text-success hover:text-success/80 bg-success/10 p-1 rounded">
                                    <Check size={14} />
                                </button>
                                <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-200 bg-white/5 p-1 rounded">
                                    <X size={14} />
                                </button>
                            </>
                            ) : (
                            <>
                                <button onClick={() => startEdit(vision)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/5">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(vision.id)} className="text-gray-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10">
                                    <Trash2 size={14} />
                                </button>
                            </>
                            )}
                        </div>
                    </div>
                );
             })}
          </div>
        )}

        <div className="mt-4 relative group">
          <input 
             className="w-full bg-surfaceHighlight/30 text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-primary/50 focus:bg-surfaceHighlight/50 focus:outline-none transition-all placeholder-gray-600"
             placeholder={
                 activeTab === 'WEEKLY' 
                 ? `+ Add plan for ${activeDay}...` 
                 : activeTab === 'DAILY'
                 ? "+ Add priority task..."
                 : `+ Add ${CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} goal...`
             }
             value={newVision}
             onChange={(e) => setNewVision(e.target.value)}
             onKeyDown={(e) => {
                 if(e.key === 'Enter') handleAdd();
             }}
          />
          <Plus size={16} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default VisionBoard;