import React, { useState } from 'react';
import { Doubt, DoubtReply } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, triggerConfetti } from '../../lib/utils';
import {
  X,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface DoubtDetailModalProps {
  doubt: Doubt | null;
  replies: DoubtReply[];
  isOpen: boolean;
  onClose: () => void;
  onAddReply: (doubtId: string, content: string, isSolution?: boolean) => Promise<void>;
  onToggleSolved: (doubtId: string, solvedState: boolean) => Promise<void>;
  onDeleteDoubt: (doubtId: string) => Promise<void>;
}

export const DoubtDetailModal: React.FC<DoubtDetailModalProps> = ({
  doubt,
  replies,
  isOpen,
  onClose,
  onAddReply,
  onToggleSolved,
  onDeleteDoubt,
}) => {
  const { currentUser } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [markAsSolution, setMarkAsSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !doubt) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    await onAddReply(doubt.id, replyText.trim(), markAsSolution);
    if (markAsSolution) {
      triggerConfetti();
    }
    setReplyText('');
    setMarkAsSolution(false);
    setIsSubmitting(false);
  };

  const handleToggleSolvedStatus = async () => {
    const nextState = !doubt.is_solved;
    await onToggleSolved(doubt.id, nextState);
    if (nextState) {
      triggerConfetti();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this doubt and all associated discussion replies?')) {
      await onDeleteDoubt(doubt.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {doubt.subject || 'General'}
            </span>
            <button
              onClick={handleToggleSolvedStatus}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                doubt.is_solved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{doubt.is_solved ? 'Solved' : 'Mark as Solved'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              title="Delete Doubt"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question Details */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
              {doubt.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Asked {formatDateTime(doubt.created_at)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
              {doubt.description}
            </div>
          </div>

          {/* Discussion Thread */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Study Discussion ({replies.length})</span>
              </div>
            </div>

            {replies.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                No replies yet. Share your understanding or solution below!
              </div>
            ) : (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-xl border transition ${
                      reply.is_solution
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {reply.author_id === currentUser?.id ? 'You' : 'Partner'}
                        </span>
                        {reply.is_solution && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Sparkles className="w-3 h-3" /> Marked Solution
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reply Input Box */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSendReply} className="space-y-2.5">
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a clear answer, explanation, or question..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsSolution}
                  onChange={(e) => setMarkAsSolution(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>This reply solves the doubt</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Reply</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
