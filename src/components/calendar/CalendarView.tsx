import React, { useState } from 'react';
import { Assignment, Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, isDueSoon, isOverdue } from '../../lib/utils';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Bell,
  X,
  BookOpen,
} from 'lucide-react';

interface CalendarViewProps {
  assignments: Assignment[];
  tasks: Task[];
  onCreateAssignment: (title: string, subject: string, deadline: string, notes?: string) => Promise<void>;
  onUpdateStatus: (id: string, status: Assignment['status']) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  assignments,
  tasks,
  onCreateAssignment,
  onUpdateStatus,
  onDeleteAssignment,
}) => {
  const { currentUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-app reminders: Deadlines due within 48h or overdue
  const urgentReminders = assignments.filter(
    (a) => a.status !== 'completed' && (isDueSoon(a.deadline, 48) || isOverdue(a.deadline))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    setIsSubmitting(true);
    await onCreateAssignment(title.trim(), subject.trim() || 'General', new Date(deadline).toISOString(), notes.trim() || undefined);
    setTitle('');
    setSubject('');
    setDeadline('');
    setNotes('');
    setIsSubmitting(false);
    setIsAdding(false);
  };

  const handleDelete = async (id: string, assignTitle: string) => {
    if (window.confirm(`Delete assignment "${assignTitle}"?`)) {
      await onDeleteAssignment(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Assignments & Deadline Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Keep both study partners synchronized on upcoming academic milestones.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deadline</span>
        </button>
      </div>

      {/* In-App Reminders Banner */}
      {urgentReminders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              In-App Reminders ({urgentReminders.length} Urgent)
            </h3>
            <div className="mt-2 space-y-1.5">
              {urgentReminders.map((r) => {
                const over = isOverdue(r.deadline);
                return (
                  <div key={r.id} className="text-xs text-slate-300 flex items-center justify-between">
                    <span>
                      <strong className="text-white">{r.title}</strong> ({r.subject})
                    </span>
                    <span className={`font-semibold ${over ? 'text-red-400' : 'text-amber-400'}`}>
                      {over ? 'OVERDUE' : `Due ${formatDate(r.deadline)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-6 text-slate-500 text-xs">
            No assignments logged yet. Click "Add Deadline" to stay organized!
          </div>
        ) : (
          assignments.map((assign) => {
            const over = isOverdue(assign.deadline) && assign.status !== 'completed';
            const soon = isDueSoon(assign.deadline, 48) && assign.status !== 'completed';

            return (
              <div
                key={assign.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  assign.status === 'completed'
                    ? 'border-emerald-500/20 bg-slate-900/60'
                    : over
                    ? 'border-red-500/40 bg-red-950/10'
                    : soon
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {assign.subject}
                    </span>

                    <span
                      className={`text-xs flex items-center gap-1 font-medium ${
                        over
                          ? 'text-red-400 font-bold'
                          : soon
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Deadline: {formatDateTime(assign.deadline)} {over && '(OVERDUE)'}
                    </span>
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-semibold mt-1.5 ${
                      assign.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {assign.title}
                  </h3>

                  {assign.notes && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {assign.notes}
                    </p>
                  )}
                </div>

                {/* Status Selector & Actions */}
                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <select
                    value={assign.status}
                    onChange={(e) => onUpdateStatus(assign.id, e.target.value as Assignment['status'])}
                    className={`text-xs rounded-xl px-3 py-2 border font-medium focus:outline-none transition ${
                      assign.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : assign.status === 'in_progress'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    onClick={() => handleDelete(assign.id, assign.title)}
                    title="Delete deadline"
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Assignment Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Add Assignment Deadline</h3>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Lab 3 Submission"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems, Computer Networks..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Submission Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes & Rubric (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Grading rubrics, submission portal link, or deliverables..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : 'Add Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
