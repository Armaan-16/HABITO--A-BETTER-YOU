import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, AlertCircle } from './Icons';
import { Note } from '../types';

interface QuickNotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const QuickNotes: React.FC<QuickNotesProps> = ({ notes, setNotes }) => {
  const [newNote, setNewNote] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleAdd = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      isUrgent,
      createdAt: new Date().toISOString()
    };
    // Add to beginning of list
    setNotes([note, ...notes]);
    setNewNote('');
    setIsUrgent(false);
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="bg-surface rounded-3xl p-6 border border-surfaceHighlight shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <StickyNote className="text-yellow-400" />
          Quick Notes
        </h2>
        <span className="text-xs text-gray-500">{notes.length} notes</span>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="flex-1 bg-surfaceHighlight/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-600"
            placeholder="Add important info..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
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

      <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
        {notes.length === 0 && (
            <div className="text-center py-6 text-gray-600 text-sm border-2 border-dashed border-white/5 rounded-xl">
                No notes available. Add important info here.
            </div>
        )}
        {notes.map(note => (
          <div key={note.id} className={`group p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${note.isUrgent ? 'bg-red-500/5 border-red-500/30' : 'bg-surfaceHighlight/20 border-white/5'}`}>
            <div className="flex-1">
                <div className="flex items-start gap-2">
                     {note.isUrgent && <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
                     <p className={`text-sm ${note.isUrgent ? 'text-red-100 font-medium' : 'text-gray-300'}`}>{note.content}</p>
                </div>
                <span className="text-[10px] text-gray-600 mt-2 block pl-0.5">
                    {new Date(note.createdAt).toLocaleDateString()} • {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
            <button
                onClick={() => handleDelete(note.id)}
                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
                <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickNotes;