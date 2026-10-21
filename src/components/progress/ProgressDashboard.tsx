import React from 'react';
import { Note, Doubt, Task, TaskCompletion, StudySession, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Clock,
  CheckSquare,
  HelpCircle,
  FileText,
  Users,
  Trophy,
  Flame,
  Award,
} from 'lucide-react';

interface ProgressDashboardProps {
  notes: Note[];
  doubts: Doubt[];
  tasks: Task[];
  completions: TaskCompletion[];
  sessions: StudySession[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  notes,
  doubts,
  tasks,
  completions,
  sessions,
}) => {
  const { currentUser, partnerUser } = useAuth();

  // Helper to compute user stats
  const getUserStats = (userId?: string) => {
    if (!userId) {
      return { minutes: 0, tasksDone: 0, doubtsAsked: 0, notesWritten: 0 };
    }
    const userSessions = sessions.filter((s) => s.user_id === userId);
    const minutes = userSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
    const tasksDone = completions.filter((c) => c.user_id === userId).length;
    const doubtsAsked = doubts.filter((d) => d.author_id === userId).length;
    const notesWritten = notes.filter((n) => n.author_id === userId).length;
    return { minutes, tasksDone, doubtsAsked, notesWritten };
  };

  const myStats = getUserStats(currentUser?.id);
  const partnerStats = getUserStats(partnerUser?.id);

  // Combined stats
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const totalTasks = tasks.length;
  const totalSolvedDoubts = doubts.filter((d) => d.is_solved).length;

  // Subject breakdown for sessions
  const subjectMap: Record<string, number> = {};
  sessions.forEach((s) => {
    const subj = s.subject || 'General';
    subjectMap[subj] = (subjectMap[subj] || 0) + s.duration_minutes;
  });

  const subjectEntries = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Study Analytics & Duo Velocity
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Individual effort meets collective mastery. Track shared milestones and personal dedication.
        </p>
      </div>

      {/* Combined Room Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Duo Focus</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalFocusHours}h
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">
            {totalFocusMinutes} minutes combined
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tasks Solved</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {completions.length}
          </div>
          <div className="text-[11px] text-indigo-400 mt-1 font-medium">
            across {totalTasks} shared tasks
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Doubts Solved</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {totalSolvedDoubts}
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-medium">
            of {doubts.length} questions answered
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/30 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Shared Notes</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {notes.length}
          </div>
          <div className="text-[11px] text-purple-400 mt-1 font-medium">
            collaborative documents
          </div>
        </div>
      </div>

      {/* Side-by-Side Duo Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User 1 Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: currentUser?.avatar_color || '#10b981' }}
              >
                {currentUser?.display_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {currentUser?.display_name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    You
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
              </div>
            </div>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Focus Time</span>
              <div className="text-lg font-bold text-white mt-0.5">{myStats.minutes} mins</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Tasks Completed</span>
              <div className="text-lg font-bold text-white mt-0.5">{myStats.tasksDone} / {totalTasks}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Doubts Asked</span>
              <div className="text-lg font-bold text-white mt-0.5">{myStats.doubtsAsked}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Notes Authored</span>
              <div className="text-lg font-bold text-white mt-0.5">{myStats.notesWritten}</div>
            </div>
          </div>
        </div>

        {/* User 2 (Partner) Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: partnerUser?.avatar_color || '#6366f1' }}
              >
                {partnerUser?.display_name.charAt(0) || 'P'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {partnerUser?.display_name || 'Study Partner'}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                    Partner
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{partnerUser?.email || 'user2@example.com'}</p>
              </div>
            </div>
            <Trophy className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Focus Time</span>
              <div className="text-lg font-bold text-white mt-0.5">{partnerStats.minutes} mins</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Tasks Completed</span>
              <div className="text-lg font-bold text-white mt-0.5">{partnerStats.tasksDone} / {totalTasks}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Doubts Asked</span>
              <div className="text-lg font-bold text-white mt-0.5">{partnerStats.doubtsAsked}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Notes Authored</span>
              <div className="text-lg font-bold text-white mt-0.5">{partnerStats.notesWritten}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Distribution by Subject */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-400" />
          <span>Subject Time Distribution</span>
        </h3>

        {subjectEntries.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">
            Log Pomodoro sessions to visualize focus distribution by subject!
          </div>
        ) : (
          <div className="space-y-3">
            {subjectEntries.map(([subj, mins]) => {
              const percent = totalFocusMinutes > 0 ? Math.round((mins / totalFocusMinutes) * 100) : 0;
              return (
                <div key={subj} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{subj}</span>
                    <span className="text-slate-400">{mins} mins ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
