-- ==============================================================================
-- STUDYSPACE: PRIVATE TWO-USER PERSONAL STUDY APPLICATION SCHEMA
-- ==============================================================================
-- Designed specifically for a private 2-user study room setup.
-- Includes:
-- 1. Whitelist-based authorization (strict server-side rejection of uninvited users)
-- 2. Single shared private study room with room membership
-- 3. Row Level Security (RLS) on every table
-- 4. Shared notes with autosave metadata
-- 5. Doubt-solving questions & replies with solved status
-- 6. Shared tasks with SEPARATE completion tracking per user
-- 7. Assignments & calendar deadlines
-- 8. Pomodoro study sessions and time tracking
-- 9. Realtime replication setup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AUTHORIZED USERS WHITELIST TABLE
-- Only emails in this whitelist are permitted to log in and access data.
CREATE TABLE IF NOT EXISTS public.authorized_emails (
    email TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with the two authorized user emails:
-- (Change these placeholders to your actual emails or configure them in Supabase SQL editor)
INSERT INTO public.authorized_emails (email, display_name, avatar_color)
VALUES 
    ('user1@example.com', 'Study Partner 1', '#10b981'),
    ('user2@example.com', 'Study Partner 2', '#6366f1')
ON CONFLICT (email) DO NOTHING;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#10b981',
    is_authorized BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TRIGGER: AUTO-CREATE PROFILE ON AUTH SIGNUP ONLY IF WHITELISTED
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_display_name TEXT;
    v_avatar_color TEXT;
    v_is_whitelisted BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.authorized_emails WHERE email = NEW.email) INTO v_is_whitelisted;
    
    IF NOT v_is_whitelisted THEN
        -- Mark as unauthorized. RLS policies will block any access.
        INSERT INTO public.profiles (id, email, display_name, avatar_color, is_authorized)
        VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), '#64748b', false);
        RETURN NEW;
    END IF;

    SELECT display_name, avatar_color INTO v_display_name, v_avatar_color
    FROM public.authorized_emails
    WHERE email = NEW.email;

    INSERT INTO public.profiles (id, email, display_name, avatar_color, is_authorized)
    VALUES (NEW.id, NEW.email, COALESCE(v_display_name, split_part(NEW.email, '@', 1)), COALESCE(v_avatar_color, '#10b981'), true);

    -- Automatically enroll whitelisted user into the shared study room
    INSERT INTO public.room_members (room_id, user_id)
    VALUES ('00000000-0000-0000-0000-000000000001', NEW.id)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SHARED STUDY ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed permanent shared study room
INSERT INTO public.study_rooms (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Private Duo Study Space', 'Shared private room for two partners')
ON CONFLICT (id) DO NOTHING;

-- 6. ROOM MEMBERSHIP TABLE
CREATE TABLE IF NOT EXISTS public.room_members (
    room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

-- Connect handle_new_user trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SHARED NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DOUBTS AND REPLIES
CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT DEFAULT 'General',
    is_solved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doubt_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. SHARED TASKS WITH SEPARATE COMPLETION TRACKING PER USER
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_id, user_id)
);

-- 10. ASSIGNMENTS & CALENDAR DEADLINES
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. POMODORO STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General',
    session_type TEXT CHECK (session_type IN ('pomodoro', 'short_break', 'long_break', 'free_focus')) DEFAULT 'pomodoro',
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict access control: only authorized members of the study room can view or modify data.
-- ==============================================================================

ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an authorized room member?
CREATE OR REPLACE FUNCTION public.is_room_member(check_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.room_members rm
        JOIN public.profiles p ON p.id = rm.user_id
        WHERE rm.room_id = check_room_id
          AND rm.user_id = auth.uid()
          AND p.is_authorized = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read authorized profiles in their shared room
CREATE POLICY "Authorized users can read profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (is_authorized = true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Study Rooms: Members can view
CREATE POLICY "Room members can view room"
    ON public.study_rooms FOR SELECT
    TO authenticated
    USING (public.is_room_member(id));

-- Room Members: Members can view membership
CREATE POLICY "Room members can view members"
    ON public.room_members FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

-- Notes Policies
CREATE POLICY "Members can select notes"
    ON public.notes FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can insert notes"
    ON public.notes FOR INSERT
    TO authenticated
    WITH CHECK (public.is_room_member(room_id) AND auth.uid() = author_id);

CREATE POLICY "Members can update notes"
    ON public.notes FOR UPDATE
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can delete notes"
    ON public.notes FOR DELETE
    TO authenticated
    USING (public.is_room_member(room_id));

-- Doubts Policies
CREATE POLICY "Members can select doubts"
    ON public.doubts FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can insert doubts"
    ON public.doubts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_room_member(room_id) AND auth.uid() = author_id);

CREATE POLICY "Members can update doubts"
    ON public.doubts FOR UPDATE
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can delete doubts"
    ON public.doubts FOR DELETE
    TO authenticated
    USING (public.is_room_member(room_id));

-- Doubt Replies Policies
CREATE POLICY "Members can select replies"
    ON public.doubt_replies FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.doubts d 
        WHERE d.id = doubt_id AND public.is_room_member(d.room_id)
    ));

CREATE POLICY "Members can insert replies"
    ON public.doubt_replies FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.doubts d 
        WHERE d.id = doubt_id AND public.is_room_member(d.room_id)
    ) AND auth.uid() = author_id);

CREATE POLICY "Members can update replies"
    ON public.doubt_replies FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.doubts d 
        WHERE d.id = doubt_id AND public.is_room_member(d.room_id)
    ));

-- Tasks Policies
CREATE POLICY "Members can select tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can insert tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (public.is_room_member(room_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (public.is_room_member(room_id));

-- Task Completions Policies (Separate user completion tracking)
CREATE POLICY "Members can select task completions"
    ON public.task_completions FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND public.is_room_member(t.room_id)
    ));

CREATE POLICY "Users can insert their own completions"
    ON public.task_completions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id AND public.is_room_member(t.room_id)
    ));

CREATE POLICY "Users can delete their own completions"
    ON public.task_completions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Assignments Policies
CREATE POLICY "Members can select assignments"
    ON public.assignments FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can insert assignments"
    ON public.assignments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_room_member(room_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update assignments"
    ON public.assignments FOR UPDATE
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Members can delete assignments"
    ON public.assignments FOR DELETE
    TO authenticated
    USING (public.is_room_member(room_id));

-- Study Sessions Policies
CREATE POLICY "Members can select study sessions"
    ON public.study_sessions FOR SELECT
    TO authenticated
    USING (public.is_room_member(room_id));

CREATE POLICY "Users can log their own study sessions"
    ON public.study_sessions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_room_member(room_id) AND auth.uid() = user_id);

-- 12. REALTIME NOTIFICATIONS PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubt_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
