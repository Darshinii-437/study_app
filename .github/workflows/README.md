# StudySpace • Private Duo Study Application

A private, distraction-free personal study application built with **React**, **TypeScript**, **Vite**, and **Supabase**. Designed specifically for two authorized study partners to collaborate on notes, solve doubts, track shared tasks independently, maintain assignment deadlines, and log Pomodoro focus sessions.

---

## Architecture & Privacy Guarantee

- **Two Authorized Accounts:** Only two pre-configured accounts are permitted to authenticate and access room data.
- **No Public Registration:** Public signups are disabled. Arbitrary users cannot register or discover the study space.
- **Server-Side Authorization (PostgreSQL RLS):** All tables are protected by Row Level Security. Even if someone obtains your frontend URL or anonymous Supabase key, database policies reject unauthorized reads and mutations.
- **Separate Task Completion Tracking:** Tasks are shared, but each partner maintains their own individual completion checkbox. Partner 1 finishing a task does not mark it complete for Partner 2.
- **Zero LocalStorage Dependency for Primary Storage:** Cloud database synchronization via Supabase PostgreSQL and Realtime.
- **Extensible Database Design:** Normalized `room_members` join pattern allows adding future users or rooms without rewriting database schemas.

---

## Prerequisites

- **Node.js:** v18+ (tested on Node v24.13.1)
- **npm:** v9+ (tested on npm 11.8.0)
- **Supabase Account:** Free tier at [supabase.com](https://supabase.com)

---

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <your-repo>
cd PERSONAL
npm install
```

### 2. Configure Supabase Cloud Database

1. Sign in to [Supabase](https://supabase.com) and create a new project (e.g. `studyspace-private`).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql), copy its contents, and paste them into the SQL Editor.
4. Replace the placeholder emails with you and your partner's exact emails:
   ```sql
   INSERT INTO public.authorized_emails (email, display_name, avatar_color)
   VALUES 
       ('your_email@domain.com', 'Alex', '#10b981'),
       ('partner_email@domain.com', 'Sam', '#6366f1')
   ON CONFLICT (email) DO NOTHING;
   ```
5. Click **Run** to execute the script. This creates all 11 tables, triggers, and Row Level Security policies.
6. Disable open public signups:
   - Navigate to **Authentication > Providers > Email**.
   - Toggle off **"Enable Signups"** (or use the whitelist trigger).
7. Create the two user accounts in **Authentication > Users > Add User** using the whitelisted emails and passwords of your choice.

### 3. Environment Variables Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your project credentials from **Project Settings > API**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STUDY_ROOM_ID=00000000-0000-0000-0000-000000000001
```

*(Note: If `.env` is omitted during initial local exploration, the application automatically runs in an integrated local duo mode with pre-seeded test accounts so you can verify the interface immediately).*

---

## Running Locally

### Development Server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Preview:
```bash
npm run build
npm run preview
```
Runs a production bundle on [http://localhost:4173](http://localhost:4173).

---

## Verification & Testing Steps

To test the application locally and verify all private duo workflows:

### 1. Test Private Login & Access Control
- **Authorized Login:** Log in with `user1@example.com` or `user2@example.com`. The application admits the user and displays their partner's presence.
- **Unauthorized Rejection:** Attempt to log in with an unauthorized address (e.g. `stranger@gmail.com`). The application rejects the attempt with:
  > *"Access Denied: Account is not in the authorized whitelist."*

### 2. Test Shared Notes with Autosave
- Navigate to **Shared Notes**.
- Create a new note, add tags (e.g. `#OS`), and write content in Markdown.
- Notice the autosave indicator: within 700ms of pausing typing, the badge displays *"Saved at HH:MM:SS"*.
- Toggle the **Preview** button to view formatted Markdown.
- Refresh the page to verify persistence.

### 3. Test Doubt-Solving Arena
- Navigate to **Doubts**.
- Click **Ask Question**, enter a subject (e.g. `Algorithms`), question title, and description.
- Switch to Partner 2 (via the top tester switcher or a second incognito browser session).
- Open the doubt and post a reply.
- Check *"This reply solves the doubt"* or click **Mark as Solved**.
- Observe the celebratory feedback and the status update from *Unsolved* to *Solved*.

### 4. Test Shared Tasks with Dual Tracking
- Navigate to **Shared Tasks**.
- Create a task: *"Solve Chapter 4 Exercises"* with `High` priority and a due date.
- As Partner 1, click your completion checkbox. Notice that your status turns to *Done*, while Partner 2's status remains *Pending*.
- Switch to Partner 2. Notice that Partner 1's checkbox is checked, while Partner 2's box is available to check off independently.
- Check Partner 2's box to see the task turn to *"Both Finished (100%)"*.

### 5. Test Deadlines & Calendar Reminders
- Navigate to **Deadlines**.
- Add an assignment deadline within the next 48 hours.
- Notice the **In-App Reminders** banner alerting both partners about the upcoming submission.
- Update status between `Pending`, `In Progress`, and `Completed`.

### 6. Test Pomodoro Focus Timer & Analytics
- Navigate to **Pomodoro**.
- Select a subject (e.g. `Operating Systems`) and click **Start Focus**.
- Upon completion, an audio chime plays (synthesized via Web Audio API) and session history is logged.
- Navigate to **Progress**: view both combined focus hours and individual side-by-side metrics.

---

## Future Expansion: Adding Users or Rooms

The schema is built to scale without redesigning existing tables:

### Adding a 3rd User:
Execute in Supabase SQL editor:
```sql
-- 1. Whitelist new email
INSERT INTO public.authorized_emails (email, display_name, avatar_color)
VALUES ('friend3@example.com', 'Charlie', '#f59e0b');

-- 2. Once Charlie signs up, enroll them into the room
INSERT INTO public.room_members (room_id, user_id)
VALUES ('00000000-0000-0000-0000-000000000001', '<charlie-user-uuid>');
```
All existing notes, tasks, and doubts immediately support the 3rd user's independent completion tracking without migration.

### Adding Additional Rooms:
```sql
INSERT INTO public.study_rooms (id, name, description)
VALUES (gen_random_uuid(), 'Advanced Algorithms Lab', 'Secondary focused room');
```

---

## Private Online Access Options & Security Limitations

Per your requirement, **no public deployment has been performed by default**. When you and your friend want to access the app online from your phones and laptops, here are the secure options:

### Option A: Vercel or Netlify with Password Protection (Recommended)
- **Deployment:** Connect your private GitHub repository to Vercel or Netlify.
- **Privacy Layer:** Enable **Vercel Password Protection** (Settings > Deployment Protection) or Netlify Access Control. Anyone navigating to the URL must enter a private passphrase before the application bundle loads.
- **Free Tier Limits:**
  - Vercel Free: 100 GB bandwidth/month, unlimited static requests. For two people, usage will not exceed 1–2 GB/month.
- **Security Limitations:** Even if someone bypasses the frontend password, Supabase Row Level Security strictly prevents them from querying or modifying database rows.

### Option B: Cloudflare Zero Trust Tunnel
- **Deployment:** Host the app locally or on a lightweight server, and expose it via Cloudflare Tunnel (`cloudflared`).
- **Privacy Layer:** Protect the domain with Cloudflare Access (e.g. requires entering a one-time PIN sent to your authorized emails).
- **Free Tier Limits:** Free for up to 50 users on Cloudflare Zero Trust.
- **Security Limitations:** High privacy; requires installing the Cloudflare agent.

### Supabase Free Tier Limits:
- **Database Storage:** 500 MB (sufficient for tens of thousands of study notes and tasks).
- **Monthly Active Users:** 50,000 (well beyond the 2 authorized accounts).
- **Realtime Connections:** 200 concurrent WebSockets.
- **Pause Policy:** Supabase free-tier projects pause after 7 days of complete inactivity. Re-opening the dashboard or opening the app immediately wakes it up.

> *Before configuring any public or online deployment, we will confirm with you.*
