import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudySpace } from '../../lib/studyStore';
import { NavTab } from '../layout/Sidebar';
import { formatDate, isDueSoon, isOverdue } from '../../lib/utils';
import {
  Users,
  FileText,
  HelpCircle,
  CheckSquare,
  Calendar,
  Timer,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface StudyRoomViewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenNewTask: () => void;
  onOpenNewDoubt: () => void;
  onOpenNewNote: () => void;
}

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({
  onSelectTab,
  onOpenNewTask,
  onOpenNewDoubt,
  onOpenNewNote,
}) => {
  const { currentUser, partnerUser } = useAuth();
  const {
    notes,
    doubts,
    tasks,
    completions,
    assignments,
    sessions,
  } = useStudySpace(currentUser?.id);

  // Stats calculation
  const unsolvedDoubts = doubts.filter((d) => !d.is_solved);
  
  // Pending tasks for currentUser
  const myCompletedTaskIds = new Set(
    completions.filter((c) => c.user_id === currentUser?.id).map((c) => c.task_id)
  );
  const myPendingTasks = tasks.filter((t) => !myCompletedTaskIds.has(t.id));

  // Partner pending tasks
  const partnerCompletedTaskIds = new Set(
    completions.filter((c) => c.user_id === partnerUser?.id).map((c) => c.task_id)
  );
  const partnerPendingTasks = tasks.filter((t) => !partnerCompletedTaskIds.has(t.id));

  // Upcoming assignments (within 4 days or overdue)
  const urgentAssignments = assignments.filter(
    (a) => a.status !== 'completed' && (isDueSoon(a.deadline, 96) || isOverdue(a.deadline))
  );

  // Total study minutes today
  const todayStr = new Date().toDateString();
  const todayMinutes = sessions
    .filter((s) => new Date(s.completed_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome & Room Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active Study Chamber
              </span>
              <span className="text-xs text-slate-400">• Room ID: 00000000-0000-0000-0000-000000000001</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser?.display_name}!
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Shared workspace with <strong className="text-emerald-400">{partnerUser?.display_name || 'your partner'}</strong>. 
              All notes, tasks, and discussions are encrypted with Row Level Security.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onSelectTab('timer')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <Timer className="w-4 h-4" />
              <span>Focus Pomodoro</span>
            </button>
            <button
              onClick={onOpenNewNote}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>New Note</span>
            </button>
            <button
              onClick={onOpenNewDoubt}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Ask Doubt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Study Partners Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current User Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shadow"
              style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
            >
              {currentUser?.display_name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {currentUser?.display_name}
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">You</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {myPendingTasks.length} pending tasks • {myCompletedTaskIds.size} completed
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        {/* Partner Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shadow"
              style={{ backgroundColor: partnerUser?.avatar_color || '#6366f1' }}
            >
              {partnerUser?.display_name.charAt(0) || 'P'}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {partnerUser?.display_name || 'Study Partner'}
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Partner</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {partnerPendingTasks.length} pending tasks • {partnerCompletedTaskIds.size} completed
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectTab('tasks')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">My Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{myPendingTasks.length}</span>
            <span className="text-xs text-slate-500">of {tasks.length} shared</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('doubts')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unsolved Doubts</span>
            <HelpCircle className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{unsolvedDoubts.length}</span>
            <span className="text-xs text-slate-500">awaiting answers</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('calendar')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Deadlines</span>
            <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{urgentAssignments.length}</span>
            <span className="text-xs text-amber-400">urgent milestones</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('timer')}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Focus</span>
            <Timer className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{todayMinutes}m</span>
            <span className="text-xs text-slate-500">study logged</span>
          </div>
        </div>
      </div>

      {/* Main Split Section: Urgent Attention & Recent Shared Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Deadlines & Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Attention & Deadlines</h2>
            </div>
            <button
              onClick={() => onSelectTab('calendar')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentAssignments.length === 0 && myPendingTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              🎉 All caught up! No urgent deadlines or pending tasks.
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentAssignments.map((assign) => (
                <div
                  key={assign.id}
                  className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{assign.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-amber-400">{assign.subject}</span>
                      <span>• Due {formatDate(assign.deadline)}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Deadline
                  </span>
                </div>
              ))}

              {myPendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">{task.title}</div>
                    {task.due_date && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Due: {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Shared Notes Activity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Recent Shared Notes</h2>
            </div>
            <button
              onClick={() => onSelectTab('notes')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>All Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {notes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectTab('notes')}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{note.title}</div>
                  <span className="text-[10px] text-slate-500">
                    {formatDate(note.updated_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {note.content.replace(/#|\*|_/g, '').slice(0, 100) || 'Empty note...'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
