import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, DEFAULT_ROOM_ID } from './supabase';
import type {
  Note,
  Doubt,
  DoubtReply,
  Task,
  TaskCompletion,
  Assignment,
  StudySession,
  UserProfile,
} from '../types';

// Pre-configured mock data for offline/local testing when Supabase keys aren't set yet
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-001',
    email: 'user1@example.com',
    display_name: 'Alex (Partner 1)',
    avatar_color: '#10b981',
    is_authorized: true,
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'user-002',
    email: 'user2@example.com',
    display_name: 'Sam (Partner 2)',
    avatar_color: '#6366f1',
    is_authorized: true,
    last_active_at: new Date().toISOString(),
  },
];

const INITIAL_MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    room_id: DEFAULT_ROOM_ID,
    author_id: 'user-001',
    title: 'Operating Systems & Concurrency Notes',
    content: `# Operating Systems & Concurrency Summary\n\n### Key Concepts\n- **Mutex vs Semaphore**: Mutex is a locking mechanism (mutual exclusion), Semaphore is a signaling mechanism.\n- **Deadlock conditions**: Mutual exclusion, Hold & Wait, No preemption, Circular wait.\n\n### Formula Cheat Sheet\n- Turnaround Time = Completion Time - Arrival Time\n- Waiting Time = Turnaround Time - Burst Time\n\n*Updated by Alex during morning session.*`,
    tags: ['OS', 'CS Core', 'Exams'],
    is_pinned: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    updated_by: 'user-001',
  },
  {
    id: 'note-2',
    room_id: DEFAULT_ROOM_ID,
    author_id: 'user-002',
    title: 'Database Normalization (1NF to BCNF)',
    content: `## Database Normalization Walkthrough\n\n1. **1NF**: Atomic values, unique records.\n2. **2NF**: In 1NF and no partial dependencies on composite primary key.\n3. **3NF**: In 2NF and no transitive dependencies.\n4. **BCNF**: For every functional dependency X -> Y, X must be a super key.\n\n*Review this together before Thursday's assignment!*`,
    tags: ['Databases', 'SQL'],
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    updated_by: 'user-002',
  },
];

const INITIAL_MOCK_DOUBTS: Doubt[] = [
  {
    id: 'doubt-1',
    room_id: DEFAULT_ROOM_ID,
    author_id: 'user-001',
    title: 'How does optimistic concurrency control differ from pessimistic locking?',
    description: 'In distributed databases or Supabase RLS, when should we prefer version-check columns over row-level locking?',
    subject: 'Databases',
    is_solved: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'doubt-2',
    room_id: DEFAULT_ROOM_ID,
    author_id: 'user-002',
    title: 'Confusion on Time Complexity of Dijkstra with Min-Heap vs Fibonacci Heap',
    description: 'Why do textbooks cite O(E + V log V) with Fibonacci heap but in real code standard binary heap O((V + E) log V) is preferred?',
    subject: 'Algorithms',
    is_solved: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const INITIAL_MOCK_REPLIES: DoubtReply[] = [
  {
    id: 'reply-1',
    doubt_id: 'doubt-1',
    author_id: 'user-002',
    content: 'Optimistic concurrency control assumes conflicts are rare, checks a version/timestamp on commit, and retries if modified. Pessimistic locking locks records upfront, best for high-contention transactions.',
    is_solution: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    room_id: DEFAULT_ROOM_ID,
    created_by: 'user-001',
    title: 'Solve Chapter 4 Practice Problems (Concurrency & Semaphores)',
    description: 'Exercises 4.1 to 4.15 in Silberschatz book.',
    priority: 'high',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-2',
    room_id: DEFAULT_ROOM_ID,
    created_by: 'user-002',
    title: 'Complete Distributed Systems Paper Summary',
    description: 'Read Dynamo paper sections 3 and 4, write brief 1-page notes in Shared Notes.',
    priority: 'medium',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-3',
    room_id: DEFAULT_ROOM_ID,
    created_by: 'user-001',
    title: 'Review LeetCode Graph Traversal (BFS & DFS)',
    description: '10 problems on topological sort and cycle detection.',
    priority: 'low',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// Separate completion tracking per user
const INITIAL_MOCK_COMPLETIONS: TaskCompletion[] = [
  // User 1 has completed task 1, but User 2 hasn't!
  {
    id: 'comp-1',
    task_id: 'task-1',
    user_id: 'user-001',
    completed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  // User 2 has completed task 3
  {
    id: 'comp-2',
    task_id: 'task-3',
    user_id: 'user-002',
    completed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const INITIAL_MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-1',
    room_id: DEFAULT_ROOM_ID,
    created_by: 'user-001',
    title: 'OS Kernel Scheduler Lab Submission',
    subject: 'Operating Systems',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'in_progress',
    notes: 'Need to run valgrind and benchmark test suite before final git push.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'assign-2',
    room_id: DEFAULT_ROOM_ID,
    created_by: 'user-002',
    title: 'Database Schema Optimization Milestone',
    subject: 'Database Management',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'pending',
    notes: 'Include query execution plans and index trade-offs.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_MOCK_SESSIONS: StudySession[] = [
  {
    id: 'sess-1',
    room_id: DEFAULT_ROOM_ID,
    user_id: 'user-001',
    duration_minutes: 50,
    subject: 'Operating Systems',
    session_type: 'pomodoro',
    completed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'sess-2',
    room_id: DEFAULT_ROOM_ID,
    user_id: 'user-002',
    duration_minutes: 25,
    subject: 'Algorithms',
    session_type: 'pomodoro',
    completed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'sess-3',
    room_id: DEFAULT_ROOM_ID,
    user_id: 'user-001',
    duration_minutes: 25,
    subject: 'Databases',
    session_type: 'pomodoro',
    completed_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function useStudySpace(currentUserId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const isRealSupabase = isSupabaseConfigured() && supabase !== null;

  // Load initial data
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (isRealSupabase && supabase) {
        // Query Supabase tables
        const [
          { data: notesData },
          { data: doubtsData },
          { data: repliesData },
          { data: tasksData },
          { data: completionsData },
          { data: assignmentsData },
          { data: sessionsData },
          { data: profilesData },
        ] = await Promise.all([
          supabase.from('notes').select('*').order('updated_at', { ascending: false }),
          supabase.from('doubts').select('*').order('created_at', { ascending: false }),
          supabase.from('doubt_replies').select('*').order('created_at', { ascending: true }),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('task_completions').select('*'),
          supabase.from('assignments').select('*').order('deadline', { ascending: true }),
          supabase.from('study_sessions').select('*').order('completed_at', { ascending: false }),
          supabase.from('profiles').select('*').eq('is_authorized', true),
        ]);

        if (notesData) setNotes(notesData);
        if (doubtsData) setDoubts(doubtsData);
        if (repliesData) setReplies(repliesData);
        if (tasksData) setTasks(tasksData);
        if (completionsData) setCompletions(completionsData);
        if (assignmentsData) setAssignments(assignmentsData);
        if (sessionsData) setSessions(sessionsData);
        if (profilesData) setProfiles(profilesData);
      } else {
        // Use realistic pre-seeded data
        const localSavedNotes = localStorage.getItem('studyspace_mock_notes');
        const localSavedTasks = localStorage.getItem('studyspace_mock_tasks');
        const localSavedComps = localStorage.getItem('studyspace_mock_comps');
        const localSavedDoubts = localStorage.getItem('studyspace_mock_doubts');
        const localSavedReplies = localStorage.getItem('studyspace_mock_replies');
        const localSavedAssign = localStorage.getItem('studyspace_mock_assign');
        const localSavedSess = localStorage.getItem('studyspace_mock_sess');

        setNotes(localSavedNotes ? JSON.parse(localSavedNotes) : INITIAL_MOCK_NOTES);
        setTasks(localSavedTasks ? JSON.parse(localSavedTasks) : INITIAL_MOCK_TASKS);
        setCompletions(localSavedComps ? JSON.parse(localSavedComps) : INITIAL_MOCK_COMPLETIONS);
        setDoubts(localSavedDoubts ? JSON.parse(localSavedDoubts) : INITIAL_MOCK_DOUBTS);
        setReplies(localSavedReplies ? JSON.parse(localSavedReplies) : INITIAL_MOCK_REPLIES);
        setAssignments(localSavedAssign ? JSON.parse(localSavedAssign) : INITIAL_MOCK_ASSIGNMENTS);
        setSessions(localSavedSess ? JSON.parse(localSavedSess) : INITIAL_MOCK_SESSIONS);
        setProfiles(MOCK_USERS);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to load study space data:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [isRealSupabase]);

  // Initial load and Realtime setup
  useEffect(() => {
    loadData();

    const client = supabase;
    if (isRealSupabase && client) {
      // Setup Realtime channels for all shared tables
      const channel = client
        .channel('study-space-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          loadData();
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [loadData, isRealSupabase]);

  // Helper to persist mock state changes
  const saveMock = (key: string, data: unknown) => {
    if (!isRealSupabase) {
      localStorage.setItem(`studyspace_mock_${key}`, JSON.stringify(data));
    }
  };

  // --- NOTES ACTIONS ---
  const createNote = async (title: string, content = '', tags: string[] = []): Promise<Note | null> => {
    if (!currentUserId) return null;
    const newNote: Note = {
      id: isRealSupabase ? undefined as unknown as string : `note-${Date.now()}`,
      room_id: DEFAULT_ROOM_ID,
      author_id: currentUserId,
      title: title || 'Untitled Note',
      content,
      tags,
      is_pinned: false,
      updated_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('notes').insert(newNote).select().single();
      if (error) {
        console.error('Error creating note:', error);
        return null;
      }
      setNotes((prev) => [data, ...prev]);
      return data;
    } else {
      const updated = [newNote, ...notes];
      setNotes(updated);
      saveMock('notes', updated);
      return newNote;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updatedPayload = {
      ...updates,
      updated_by: currentUserId,
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updatedPayload } : n))
    );

    if (isRealSupabase && supabase) {
      await supabase.from('notes').update(updatedPayload).eq('id', id);
    } else {
      setNotes((prev) => {
        saveMock('notes', prev);
        return prev;
      });
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (isRealSupabase && supabase) {
      await supabase.from('notes').delete().eq('id', id);
    } else {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        saveMock('notes', next);
        return next;
      });
    }
  };

  // --- DOUBTS ACTIONS ---
  const createDoubt = async (title: string, description: string, subject = 'General') => {
    if (!currentUserId) return;
    const newDoubt: Doubt = {
      id: isRealSupabase ? undefined as unknown as string : `doubt-${Date.now()}`,
      room_id: DEFAULT_ROOM_ID,
      author_id: currentUserId,
      title,
      description,
      subject,
      is_solved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('doubts').insert(newDoubt).select().single();
      if (!error && data) setDoubts((prev) => [data, ...prev]);
    } else {
      const updated = [newDoubt, ...doubts];
      setDoubts(updated);
      saveMock('doubts', updated);
    }
  };

  const addDoubtReply = async (doubtId: string, content: string, isSolution = false) => {
    if (!currentUserId) return;
    const newReply: DoubtReply = {
      id: isRealSupabase ? undefined as unknown as string : `reply-${Date.now()}`,
      doubt_id: doubtId,
      author_id: currentUserId,
      content,
      is_solution: isSolution,
      created_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('doubt_replies').insert(newReply).select().single();
      if (data) setReplies((prev) => [...prev, data]);
      if (isSolution) {
        await supabase.from('doubts').update({ is_solved: true }).eq('id', doubtId);
        setDoubts((prev) => prev.map((d) => (d.id === doubtId ? { ...d, is_solved: true } : d)));
      }
    } else {
      const updatedReplies = [...replies, newReply];
      setReplies(updatedReplies);
      saveMock('replies', updatedReplies);
      if (isSolution) {
        const updatedDoubts = doubts.map((d) => (d.id === doubtId ? { ...d, is_solved: true } : d));
        setDoubts(updatedDoubts);
        saveMock('doubts', updatedDoubts);
      }
    }
  };

  const toggleDoubtSolved = async (doubtId: string, solvedState: boolean) => {
    setDoubts((prev) => prev.map((d) => (d.id === doubtId ? { ...d, is_solved: solvedState } : d)));
    if (isRealSupabase && supabase) {
      await supabase.from('doubts').update({ is_solved: solvedState }).eq('id', doubtId);
    } else {
      setDoubts((prev) => {
        saveMock('doubts', prev);
        return prev;
      });
    }
  };

  const deleteDoubt = async (doubtId: string) => {
    setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    setReplies((prev) => prev.filter((r) => r.doubt_id !== doubtId));
    if (isRealSupabase && supabase) {
      await supabase.from('doubts').delete().eq('id', doubtId);
    } else {
      setDoubts((prev) => {
        const next = prev.filter((d) => d.id !== doubtId);
        saveMock('doubts', next);
        return next;
      });
    }
  };

  // --- TASKS ACTIONS & SEPARATE COMPLETION ---
  const createTask = async (title: string, description?: string, priority: Task['priority'] = 'medium', dueDate?: string) => {
    if (!currentUserId) return;
    const newTask: Task = {
      id: isRealSupabase ? undefined as unknown as string : `task-${Date.now()}`,
      room_id: DEFAULT_ROOM_ID,
      created_by: currentUserId,
      title,
      description,
      priority,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('tasks').insert(newTask).select().single();
      if (data) setTasks((prev) => [data, ...prev]);
    } else {
      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveMock('tasks', updated);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletions((prev) => prev.filter((c) => c.task_id !== taskId));
    if (isRealSupabase && supabase) {
      await supabase.from('tasks').delete().eq('id', taskId);
    } else {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== taskId);
        saveMock('tasks', next);
        return next;
      });
      setCompletions((prev) => {
        const next = prev.filter((c) => c.task_id !== taskId);
        saveMock('comps', next);
        return next;
      });
    }
  };

  // Toggle completion specifically for a given user
  const toggleTaskCompletion = async (taskId: string, targetUserId: string) => {
    const existingIndex = completions.findIndex(
      (c) => c.task_id === taskId && c.user_id === targetUserId
    );

    if (existingIndex >= 0) {
      // Remove completion
      const compId = completions[existingIndex].id;
      setCompletions((prev) => prev.filter((_, idx) => idx !== existingIndex));
      if (isRealSupabase && supabase) {
        await supabase.from('task_completions').delete().match({ task_id: taskId, user_id: targetUserId });
      } else {
        setCompletions((prev) => {
          saveMock('comps', prev);
          return prev;
        });
      }
      return false; // Now uncompleted
    } else {
      // Add completion
      const newComp: TaskCompletion = {
        id: isRealSupabase ? undefined as unknown as string : `comp-${Date.now()}`,
        task_id: taskId,
        user_id: targetUserId,
        completed_at: new Date().toISOString(),
      };
      setCompletions((prev) => [...prev, newComp]);
      if (isRealSupabase && supabase) {
        await supabase.from('task_completions').insert(newComp);
      } else {
        setCompletions((prev) => {
          saveMock('comps', prev);
          return prev;
        });
      }
      return true; // Now completed
    }
  };

  // --- ASSIGNMENTS & CALENDAR ACTIONS ---
  const createAssignment = async (title: string, subject: string, deadline: string, notes?: string) => {
    if (!currentUserId) return;
    const newAssign: Assignment = {
      id: isRealSupabase ? undefined as unknown as string : `assign-${Date.now()}`,
      room_id: DEFAULT_ROOM_ID,
      created_by: currentUserId,
      title,
      subject,
      deadline,
      status: 'pending',
      notes,
      created_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('assignments').insert(newAssign).select().single();
      if (data) setAssignments((prev) => [...prev, data]);
    } else {
      const updated = [...assignments, newAssign];
      setAssignments(updated);
      saveMock('assign', updated);
    }
  };

  const updateAssignmentStatus = async (id: string, status: Assignment['status']) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (isRealSupabase && supabase) {
      await supabase.from('assignments').update({ status }).eq('id', id);
    } else {
      setAssignments((prev) => {
        saveMock('assign', prev);
        return prev;
      });
    }
  };

  const deleteAssignment = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    if (isRealSupabase && supabase) {
      await supabase.from('assignments').delete().eq('id', id);
    } else {
      setAssignments((prev) => {
        const next = prev.filter((a) => a.id !== id);
        saveMock('assign', next);
        return next;
      });
    }
  };

  // --- STUDY SESSIONS & POMODORO ACTIONS ---
  const logStudySession = async (durationMinutes: number, subject: string, sessionType: StudySession['session_type'] = 'pomodoro') => {
    if (!currentUserId) return;
    const newSession: StudySession = {
      id: isRealSupabase ? undefined as unknown as string : `sess-${Date.now()}`,
      room_id: DEFAULT_ROOM_ID,
      user_id: currentUserId,
      duration_minutes: durationMinutes,
      subject: subject || 'General',
      session_type: sessionType,
      completed_at: new Date().toISOString(),
    };

    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('study_sessions').insert(newSession).select().single();
      if (data) setSessions((prev) => [data, ...prev]);
    } else {
      const updated = [newSession, ...sessions];
      setSessions(updated);
      saveMock('sess', updated);
    }
  };

  return {
    notes,
    doubts,
    replies,
    tasks,
    completions,
    assignments,
    sessions,
    profiles,
    loading,
    isSyncing,
    lastSyncTime,
    refreshData: loadData,
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
  };
}
