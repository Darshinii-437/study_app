# StudySpace Specification: Private Two-User Personal Study Application

## 1. Executive Summary & Objective

**StudySpace** has been tailored from a generic study platform into a **private, personal study chamber exclusively for two authorized study partners**.

It is explicitly **not** a public social platform, multi-tenant SaaS, or open community. All public registrations, discovery feeds, public link sharing, and multi-tenant billing systems are stripped away. Instead, it prioritizes cryptographic data isolation, server-enforced authorization, responsive mobile/laptop usability, and distraction-free collaboration.

---

## 2. Access Control, Privacy & Extensibility Architecture

### 2.1 Two-User Authorization Model
- **Authorized Accounts:** Exactly two pre-configured user profiles exist in the system (e.g. Partner 1 and Partner 2).
- **No Public Registration:** Registration is disabled in Supabase Auth. Only email addresses present in `public.authorized_emails` can hold valid sessions.
- **Server-Side Enforcement:** Every query and mutation is filtered by PostgreSQL Row Level Security (RLS). A user whose JWT email does not match `authorized_emails` receives zero records.
- **No Client Secrets:** All passwords and Supabase Service Role keys remain strictly off frontend code. The frontend only uses the public Supabase Anon key alongside user-authenticated JWTs.
- **Extensibility Guarantee:** The schema utilizes a normalized `study_rooms` and `room_members` join pattern. Adding a third user in the future requires merely inserting a single row into `authorized_emails` and `room_members`—no table rewrites, column additions, or database redesigns required.

---

## 3. Core Feature Specification

### 3.1 Permanent Shared Private Study Room
- One dedicated, permanent study chamber (`00000000-0000-0000-0000-000000000001`).
- Real-time partner presence indicators (Active, Connected, Last active).
- Urgent milestone snapshot: upcoming assignments due within 48–96 hours, open doubts, pending tasks.

### 3.2 Shared Notes with Real-Time Autosave
- **Create, Read, Update, Delete (CRUD):** Both users can manage notes.
- **Debounced Autosave:** Edits automatically synchronize 700ms after keystrokes cease, displaying a timestamped "Saved at HH:MM:SS" confirmation.
- **Markdown & Code Support:** Live toggle between raw editor and clean Markdown reader.
- **Tags & Search:** Rapid filtering by subject or concept tags (`#OS`, `#Algorithms`).
- **Audit Metadata:** Displays author and last modified timestamps.

### 3.3 Doubt-Solving Arena
- **Structured Threads:** Dedicated section separate from regular notes.
- **Question Details:** Problem statements, subject categorization, and code/theory snippets.
- **Discussion Replies:** Partners exchange explanations, hints, and derivations.
- **Solved State Toggle:** Either partner can mark the doubt as resolved with celebratory feedback, updating room velocity stats.

### 3.4 Shared Tasks with Separate Completion Tracking
- **The Dual-Tracking Pattern:**
  - Standard task management apps mark a shared task "complete" for everyone when one user checks it.
  - StudySpace implements independent tracking via the `task_completions` table (`task_id`, `user_id`).
  - Task A is shared. Partner 1 checking it marks it done *only* for Partner 1. Partner 2 sees Partner 1 has finished, while their own checkbox remains actionable.
  - Overall status badges: *Both Finished (100%)*, *1 of 2 Finished (50%)*, *Pending (0%)*.
- Priority classification (High, Medium, Low) and due dates.

### 3.5 Assignment Deadlines, Calendar & In-App Reminders
- Academic assignment logging with course subject, deadline date/time, and deliverables rubric.
- In-app reminder banners triggering automatically for items due within 24–48 hours or overdue.
- Status workflow: `pending` → `in_progress` → `completed`.

### 3.6 Individual and Combined Progress Dashboards
- **Combined Velocity:**
  - Total study focus hours logged across the duo.
  - Combined task completion tally.
  - Total doubts resolved and notes produced.
- **Individual Breakdown:**
  - Side-by-side comparison cards (Partner 1 vs Partner 2).
  - Individual study minutes, completed task percentages, doubts asked, and notes authored.
- **Subject Distribution:** Visual breakdown of study time allocated across subjects (e.g. Operating Systems vs Databases).

### 3.7 Pomodoro Focus Timer & Session Log
- Interval cycles: 25-minute Focus, 5-minute Short Break, 15-minute Long Break.
- Zero-dependency audio chime synthesized via Web Audio API oscillators upon interval completion.
- Subject tagging: automatically attributes logged focus time to specific subjects in the progress analytics.
- Persistent session history recording timestamp, subject, and duration.

### 3.8 Responsive Mobile & Laptop Usability
- Laptop / Desktop: Multi-column split view with permanent left navigation and rich editors.
- Mobile / Android: Ergonomic bottom tab bar, thumb-friendly touch targets, full-screen editors, and responsive modals.

---

## 4. Database Schema Summary

| Table | Purpose | Security Policy (RLS) |
|---|---|---|
| `authorized_emails` | Whitelist of the 2 authorized email addresses | Authenticated read |
| `profiles` | User identity (`display_name`, `avatar_color`, `is_authorized`) | Read whitelisted profiles |
| `study_rooms` | Permanent private study room record | Room member only |
| `room_members` | Maps users to study rooms | Room member only |
| `notes` | Shared Markdown documents with tags and autosave metadata | Room member CRUD |
| `doubts` | Questions with subject tags and solved status | Room member CRUD |
| `doubt_replies` | Threaded replies and solutions | Room member CRUD |
| `tasks` | Shared study assignments and exercises | Room member CRUD |
| `task_completions` | **Independent completion records per user** | Own-user insert/delete |
| `assignments` | Deadlines, due dates, and rubric details | Room member CRUD |
| `study_sessions` | Logged Pomodoro focus intervals | Own-user insert, room member read |
