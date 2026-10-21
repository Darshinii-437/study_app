import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Save, Trash2, Eye, Edit3, Tag, X, Clock, Check } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date(note.updated_at));

  // Sync state if external note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setLastSaved(new Date(note.updated_at));
  }, [note.id]);

  // Autosave debouncer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only trigger if changes occurred
    if (title === note.title && content === note.content && JSON.stringify(tags) === JSON.stringify(note.tags)) {
      return;
    }

    setIsSaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      await onUpdate(note.id, {
        title: title.trim() || 'Untitled Note',
        content,
        tags,
      });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, content, tags, note.id]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${note.title}"? This will remove it for both study partners.`)) {
      await onDelete(note.id);
      if (onClose) onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          {/* Autosave Status Pill */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                <Save className="w-3.5 h-3.5" />
                <span>Autosaving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-[11px] text-slate-400">
                  Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {isPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preview</span>
              </>
            )}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            title="Delete shared note"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Tags */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          className="w-full text-xl sm:text-2xl font-bold bg-transparent text-white placeholder-slate-600 focus:outline-none"
        />

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag (Press Enter)..."
            className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none py-1 px-1.5"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isPreview ? (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-sans">
            {content ? content : <span className="text-slate-600 italic">No content to preview...</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your study notes here... (Supports Markdown headings, bullet points, and code snippets)"
            className="w-full h-full min-h-[350px] bg-transparent text-slate-100 placeholder-slate-600 text-sm leading-relaxed resize-none focus:outline-none font-mono"
          />
        )}
      </div>

      {/* Editor Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{content.length} characters</span>
          <span>•</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Last modified: {formatDateTime(note.updated_at)}</span>
        </div>
      </div>
    </div>
  );
};
