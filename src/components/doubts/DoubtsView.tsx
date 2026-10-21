import React, { useState } from 'react';
import { Doubt, DoubtReply } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DoubtDetailModal } from './DoubtDetailModal';
import { formatTimeAgo } from '../../lib/utils';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  X,
} from 'lucide-react';

interface DoubtsViewProps {
  doubts: Doubt[];
  replies: DoubtReply[];
  onCreateDoubt: (title: string, description: string, subject: string) => Promise<void>;
  onAddReply: (doubtId: string, content: string, isSolution?: boolean) => Promise<void>;
  onToggleSolved: (doubtId: string, solvedState: boolean) => Promise<void>;
  onDeleteDoubt: (doubtId: string) => Promise<void>;
  isOpenNewDoubtModal?: boolean;
  onCloseNewDoubtModal?: () => void;
}

export const DoubtsView: React.FC<DoubtsViewProps> = ({
  doubts,
  replies,
  onCreateDoubt,
  onAddReply,
  onToggleSolved,
  onDeleteDoubt,
  isOpenNewDoubtModal = false,
  onCloseNewDoubtModal,
}) => {
  const { currentUser } = useAuth();
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [isAskingDoubt, setIsAskingDoubt] = useState(isOpenNewDoubtModal);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unsolved' | 'solved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync external prop if triggered from room banner
  React.useEffect(() => {
    if (isOpenNewDoubtModal) {
      setIsAskingDoubt(true);
    }
  }, [isOpenNewDoubtModal]);

  const allSubjects = Array.from(new Set(doubts.map((d) => d.subject || 'General')));

  const filteredDoubts = doubts.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'solved'
        ? d.is_solved
        : !d.is_solved;

    const matchesSubject = subjectFilter === 'all' ? true : d.subject === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const handleSubmitNewDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    await onCreateDoubt(title.trim(), description.trim(), subject.trim() || 'General');
    setTitle('');
    setDescription('');
    setSubject('General');
    setIsSubmitting(false);
    setIsAskingDoubt(false);
    if (onCloseNewDoubtModal) onCloseNewDoubtModal();
  };

  const handleCloseModal = () => {
    setIsAskingDoubt(false);
    if (onCloseNewDoubtModal) onCloseNewDoubtModal();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Doubt-Solving Arena
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ask questions, unpack tough topics, and log verified answers together.
          </p>
        </div>

        <button
          onClick={() => setIsAskingDoubt(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Ask Question</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {(['all', 'unsolved', 'solved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                filterStatus === status
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        {allSubjects.length > 0 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Doubts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDoubts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-6 text-slate-500 text-xs">
            No doubts match the selected criteria. Post a question to get partner feedback!
          </div>
        ) : (
          filteredDoubts.map((doubt) => {
            const count = replies.filter((r) => r.doubt_id === doubt.id).length;
            return (
              <div
                key={doubt.id}
                onClick={() => setSelectedDoubt(doubt)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {doubt.subject || 'General'}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        doubt.is_solved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {doubt.is_solved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Solved</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Unsolved</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition line-clamp-2">
                    {doubt.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                    {doubt.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>{formatTimeAgo(doubt.created_at)}</span>
                  <div className="flex items-center gap-1 text-slate-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{count} {count === 1 ? 'reply' : 'replies'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ask Doubt Modal */}
      {isAskingDoubt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Ask a Study Doubt</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDoubt} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject / Domain</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems, Algorithms, Calculus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why does Peterson's solution fail on modern out-of-order CPUs?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Details & Context</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what concept is confusing, what you tried, or what the textbook says..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Posting...' : 'Post Doubt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Doubt Detail Modal */}
      <DoubtDetailModal
        doubt={selectedDoubt}
        replies={selectedDoubt ? replies.filter((r) => r.doubt_id === selectedDoubt.id) : []}
        isOpen={selectedDoubt !== null}
        onClose={() => setSelectedDoubt(null)}
        onAddReply={onAddReply}
        onToggleSolved={onToggleSolved}
        onDeleteDoubt={onDeleteDoubt}
      />
    </div>
  );
};
