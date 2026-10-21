import React, { useState } from 'react';
import { Task, TaskCompletion } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isDueSoon, isOverdue, triggerConfetti } from '../../lib/utils';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle2,
  X,
  Users,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  completions: TaskCompletion[];
  onCreateTask: (title: string, description?: string, priority?: Task['priority'], dueDate?: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onToggleCompletion: (taskId: string, targetUserId: string) => Promise<boolean>;
  isOpenNewTaskModal?: boolean;
  onCloseNewTaskModal?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  completions,
  onCreateTask,
  onDeleteTask,
  onToggleCompletion,
  isOpenNewTaskModal = false,
  onCloseNewTaskModal,
}) => {
  const { currentUser, partnerUser } = useAuth();
  const [isAddingTask, setIsAddingTask] = useState(isOpenNewTaskModal);
  const [filterMode, setFilterMode] = useState<'all' | 'my_pending' | 'both_done' | 'high_priority'>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpenNewTaskModal) {
      setIsAddingTask(true);
    }
  }, [isOpenNewTaskModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onCreateTask(title.trim(), description.trim() || undefined, priority, dueDate || undefined);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setIsSubmitting(false);
    setIsAddingTask(false);
    if (onCloseNewTaskModal) onCloseNewTaskModal();
  };

  const handleToggleMyCompletion = async (taskId: string) => {
    if (!currentUser) return;
    const isNowDone = await onToggleCompletion(taskId, currentUser.id);
    if (isNowDone) {
      triggerConfetti();
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Delete task "${taskTitle}"?`)) {
      await onDeleteTask(taskId);
    }
  };

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const isMeDone = completions.some((c) => c.task_id === t.id && c.user_id === currentUser?.id);
    const isPartnerDone = partnerUser
      ? completions.some((c) => c.task_id === t.id && c.user_id === partnerUser.id)
      : false;

    if (filterMode === 'my_pending') return !isMeDone;
    if (filterMode === 'both_done') return isMeDone && isPartnerDone;
    if (filterMode === 'high_priority') return t.priority === 'high';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Shared Tasks & Dual Tracking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Both partners share the task list, but check off progress independently.
          </p>
        </div>

        <button
          onClick={() => setIsAddingTask(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterMode === 'all'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilterMode('my_pending')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterMode === 'my_pending'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Pending
        </button>
        <button
          onClick={() => setFilterMode('both_done')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterMode === 'both_done'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Both Completed
        </button>
        <button
          onClick={() => setFilterMode('high_priority')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterMode === 'high_priority'
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          High Priority
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-6 text-slate-500 text-xs">
            No tasks found in this view. Add a task to collaborate!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isMeCompleted = completions.some(
              (c) => c.task_id === task.id && c.user_id === currentUser?.id
            );
            const isPartnerCompleted = partnerUser
              ? completions.some(
                  (c) => c.task_id === task.id && c.user_id === partnerUser.id
                )
              : false;

            const isBothDone = isMeCompleted && (partnerUser ? isPartnerCompleted : true);
            const isOver = isOverdue(task.due_date);

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isBothDone
                    ? 'border-emerald-500/30 bg-slate-900/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Task Title & Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                        task.priority === 'high'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          isOver
                            ? 'text-red-400 font-semibold'
                            : isDueSoon(task.due_date)
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Due {formatDate(task.due_date)} {isOver && '(Overdue)'}
                      </span>
                    )}

                    {isBothDone && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Both Finished
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm sm:text-base font-semibold mt-1.5 ${
                      isMeCompleted ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Right: Separate Completion Controls for Both Users */}
                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                  {/* Current User Toggle */}
                  <button
                    onClick={() => handleToggleMyCompletion(task.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      isMeCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isMeCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>{currentUser?.display_name || 'You'} (Your Status)</span>
                  </button>

                  {/* Partner Status Display */}
                  {partnerUser && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border ${
                        isPartnerCompleted
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-950/80 text-slate-500 border-slate-800'
                      }`}
                      title={`${partnerUser.display_name}'s completion status`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{partnerUser.display_name}:</span>
                      <span className="font-bold">
                        {isPartnerCompleted ? 'Done ✓' : 'Pending'}
                      </span>
                    </div>
                  )}

                  {/* Delete Task */}
                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    title="Delete task"
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

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Create Shared Task</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  if (onCloseNewTaskModal) onCloseNewTaskModal();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish Operating Systems problem set"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add specific instructions, problem numbers, or links..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                  </input>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    if (onCloseNewTaskModal) onCloseNewTaskModal();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
