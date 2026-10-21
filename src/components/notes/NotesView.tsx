import React, { useState } from 'react';
import { Note } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { NoteEditor } from './NoteEditor';
import { formatTimeAgo } from '../../lib/utils';
import {
  Plus,
  Search,
  Pin,
  FileText,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  onCreateNote: (title: string, content?: string, tags?: string[]) => Promise<Note | null>;
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const { currentUser } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []))
  );

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Sort: pinned first, then newest updated
  filteredNotes.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const activeNote = notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleCreateNew = async () => {
    const newNote = await onCreateNote('Untitled Note', '', selectedTag ? [selectedTag] : []);
    if (newNote) {
      setSelectedNoteId(newNote.id);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    await onUpdateNote(note.id, { is_pinned: !note.is_pinned });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
      {/* Left List of Notes (Desktop: 340px width, Mobile: Full width if no note selected) */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shrink-0 ${
          activeNote && 'hidden md:flex'
        }`}
      >
        {/* Header & New Note Button */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Shared Notes</h2>
              <span className="text-xs text-slate-500 font-medium">({notes.length})</span>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes or concepts..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tag Filter Pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                  selectedTag === null
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition ${
                    selectedTag === tag
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-slate-500">
              No shared notes found. Click "New" to start writing!
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3 rounded-xl cursor-pointer transition relative group ${
                    isSelected
                      ? 'bg-slate-800 border border-emerald-500/30'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {note.title || 'Untitled Note'}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(e, note)}
                      title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                      className={`p-0.5 rounded text-slate-500 hover:text-amber-400 transition ${
                        note.is_pinned ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {note.content.replace(/#|\*|_/g, '').slice(0, 90) || 'Empty note...'}
                  </p>

                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(note.updated_at)}
                    </span>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 overflow-hidden">
                        {note.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Note Editor Area */}
      <div className={`flex-1 h-full ${!activeNote && 'hidden md:flex'}`}>
        {activeNote ? (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onClose={() => setSelectedNoteId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-sm font-semibold text-slate-400">No Note Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Select a note from the left or create a new one to start collaborating with your partner.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition"
            >
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
