export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_color: string;
  is_authorized: boolean;
  last_active_at?: string;
  created_at?: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Note {
  id: string;
  room_id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned?: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Doubt {
  id: string;
  room_id: string;
  author_id: string;
  title: string;
  description: string;
  subject: string;
  is_solved: boolean;
  created_at: string;
  updated_at: string;
  author?: UserProfile;
}

export interface DoubtReply {
  id: string;
  doubt_id: string;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  author?: UserProfile;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
}

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface Assignment {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  subject: string;
  deadline: string; // ISO string
  status: AssignmentStatus;
  notes?: string;
  created_at: string;
}

export type SessionType = 'pomodoro' | 'short_break' | 'long_break' | 'free_focus';

export interface StudySession {
  id: string;
  room_id: string;
  user_id: string;
  duration_minutes: number;
  subject: string;
  session_type: SessionType;
  completed_at: string;
}

export interface ProgressSummary {
  user_id: string;
  display_name: string;
  total_study_minutes: number;
  tasks_completed_count: number;
  doubts_solved_count: number;
  notes_created_count: number;
}
