import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useStudySpace } from './lib/studyStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { SetupGuideModal } from './components/layout/SetupGuideModal';
import { LoginPage } from './components/auth/LoginPage';
import { StudyRoomView } from './components/room/StudyRoomView';
import { NotesView } from './components/notes/NotesView';
import { DoubtsView } from './components/doubts/DoubtsView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { ProgressDashboard } from './components/progress/ProgressDashboard';
import { PomodoroTimer } from './components/timer/PomodoroTimer';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('room');
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Trigger modals from room shortcuts
  const [isOpenNewTaskModal, setIsOpenNewTaskModal] = useState(false);
  const [isOpenNewDoubtModal, setIsOpenNewDoubtModal] = useState(false);

  const {
    notes,
    doubts,
    replies,
    tasks,
    completions,
    assignments,
    sessions,
    isSyncing,
    refreshData,
    createNote,
    updateNote,
    deleteNote,
    createDoubt,
    addDoubtReply,
    toggleDoubtSolved,
    deleteDoubt,
    createTask,
    deleteTask,
    toggleTaskCompletion,
    createAssignment,
    updateAssignmentStatus,
    deleteAssignment,
    logStudySession,
  } = useStudySpace(currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium">Entering Secure Study Chamber...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginPage onOpenSetup={() => setIsSetupOpen(true)} />
        <SetupGuideModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      </>
    );
  }

  // Pending counts for badges
  const myCompletedTaskIds = new Set(
    completions.filter((c) => c.user_id === currentUser.id).map((c) => c.task_id)
  );
  const myPendingTasksCount = tasks.filter((t) => !myCompletedTaskIds.has(t.id)).length;
  const unsolvedDoubtsCount = doubts.filter((d) => !d.is_solved).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenSetup={() => setIsSetupOpen(true)}
        isSyncing={isSyncing}
        onRefresh={refreshData}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          unsolvedDoubtsCount={unsolvedDoubtsCount}
          pendingTasksCount={myPendingTasksCount}
        />

        {/* Dynamic Tab Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'room' && (
            <StudyRoomView
              onSelectTab={setCurrentTab}
              onOpenNewTask={() => {
                setCurrentTab('tasks');
                setIsOpenNewTaskModal(true);
              }}
              onOpenNewDoubt={() => {
                setCurrentTab('doubts');
                setIsOpenNewDoubtModal(true);
              }}
              onOpenNewNote={() => {
                setCurrentTab('notes');
              }}
            />
          )}

          {currentTab === 'notes' && (
            <NotesView
              notes={notes}
              onCreateNote={createNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
            />
          )}

          {currentTab === 'doubts' && (
            <DoubtsView
              doubts={doubts}
              replies={replies}
              onCreateDoubt={createDoubt}
              onAddReply={addDoubtReply}
              onToggleSolved={toggleDoubtSolved}
              onDeleteDoubt={deleteDoubt}
              isOpenNewDoubtModal={isOpenNewDoubtModal}
              onCloseNewDoubtModal={() => setIsOpenNewDoubtModal(false)}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              completions={completions}
              onCreateTask={createTask}
              onDeleteTask={deleteTask}
              onToggleCompletion={toggleTaskCompletion}
              isOpenNewTaskModal={isOpenNewTaskModal}
              onCloseNewTaskModal={() => setIsOpenNewTaskModal(false)}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              assignments={assignments}
              tasks={tasks}
              onCreateAssignment={createAssignment}
              onUpdateStatus={updateAssignmentStatus}
              onDeleteAssignment={deleteAssignment}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressDashboard
              notes={notes}
              doubts={doubts}
              tasks={tasks}
              completions={completions}
              sessions={sessions}
            />
          )}

          {currentTab === 'timer' && (
            <PomodoroTimer
              sessions={sessions}
              onLogSession={logStudySession}
            />
          )}
        </main>
      </div>

      {/* Setup Guide Modal */}
      <SetupGuideModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
