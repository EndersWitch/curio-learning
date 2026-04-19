# Curio Learning — Quiz System

A Duolingo-style quiz experience for CAPS-aligned school learning.  
**Next.js 14 · TypeScript · Tailwind CSS · Supabase**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run locally
npm run dev
# → http://localhost:3000/quiz
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Optional | For AI deep-learn explanations (set in Vercel, never in .env) |

---

## Supabase Schema Required

The quiz system expects these tables. Create them if they don't exist.

### `quiz_levels`
```sql
create table quiz_levels (
  id            uuid primary key default gen_random_uuid(),
  broad_topic   text not null,
  subject       text not null,
  grade         int  not null,
  subtopic_id   text,
  level_number  int  default 1,
  title         text not null,
  description   text,
  section_type  text not null,   -- 'level' | 'subtopic_mastery' | 'broad_topic_mastery' | 'general_practice'
  question_count int default 10,
  xp_reward     int default 50,
  pass_threshold float default 0.6,
  is_premium    boolean default false,
  -- Learning zone fields
  intro         text,
  concepts      jsonb,           -- array of LearningConcept objects
  tested        text[],          -- array of strings
  difficulty    text             -- 'easy' | 'medium' | 'hard'
);
```

### `questions`
```sql
create table questions (
  id            uuid primary key default gen_random_uuid(),
  grade         int  not null,
  subject       text not null,
  broad_topic   text not null,
  subtopic_id   text,
  level_id      uuid references quiz_levels(id),
  section_type  text not null,
  question_text text not null,
  option_a      text not null,
  option_b      text not null,
  option_c      text not null,
  option_d      text not null,
  correct_option text not null,  -- 'a' | 'b' | 'c' | 'd'
  explanation   text,
  is_premium    boolean default false
);
```

### `user_progress`
```sql
create table user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  level_id     uuid references quiz_levels(id),
  subtopic_id  text,
  completed    boolean default false,
  passed       boolean default false,
  best_score   int     default 0,
  attempts     int     default 0,
  xp_earned    int     default 0,
  completed_at timestamptz,
  unique (user_id, level_id)
);
```

### `profiles`
```sql
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_xp     int     default 0,
  streak       int     default 0,
  is_premium   boolean default false,
  is_founder   boolean default false,
  grade        int
);
```

### Required RPC

```sql
create or replace function award_quiz_xp(p_user_id uuid, p_xp int)
returns void as $$
begin
  update profiles
  set total_xp = total_xp + p_xp
  where id = p_user_id;
end;
$$ language plpgsql security definer;
```

### Row Level Security

```sql
-- user_progress: users can only read/write their own rows
alter table user_progress enable row level security;
create policy "users own progress" on user_progress
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- quiz_levels: public read
alter table quiz_levels enable row level security;
create policy "public read levels" on quiz_levels for select using (true);

-- questions: public read for free, premium gated by app logic
alter table questions enable row level security;
create policy "public read questions" on questions for select using (true);

-- profiles: users read/write own
alter table profiles enable row level security;
create policy "users own profile" on profiles
  using (auth.uid() = id) with check (auth.uid() = id);
```

---

## Route Structure

```
/quiz                                      Browse all topics (grade filter)
/quiz/[broadTopic]                         Broad topic overview + subtopics
/quiz/[broadTopic]/[subtopic]              Subtopic level path
/quiz/[broadTopic]/[subtopic]/[level]/learn  Learning zone (pre-quiz)
/quiz/[broadTopic]/[subtopic]/[level]/play   Quiz runner
/quiz/[broadTopic]/practice                General practice entry
```

### URL Encoding

`broadTopic` and `subtopic` in URLs are URI-encoded versions of the actual string values stored in Supabase.

For example: `Parts of Speech` → `Parts%20of%20Speech`

---

## Mastery System

Two-layer mastery — both layers are required:

```
Normal levels (Level 1, Level 2, Level 3...)
       ↓ all passed
Subtopic Mastery (e.g. "Nouns Mastery")
       ↓ all subtopic masteries passed
Broad Topic Mastery (e.g. "Parts of Speech Mastery")  ← final boss
```

In `quiz_levels`:
- Normal levels: `section_type = 'level'`
- Subtopic mastery: `section_type = 'subtopic_mastery'` + same `subtopic_id`
- Broad topic mastery: `section_type = 'broad_topic_mastery'` + same `broad_topic`

---

## Randomisation

Every quiz attempt:
1. Questions are shuffled (Fisher-Yates) — different order each time
2. Options within each question are shuffled — A/B/C/D reassigned
3. Correct answer tracked through shuffle — never lost

Implemented in `lib/questions.ts` → `shuffleQuestion()` and `fetchLevelQuestions()`.

---

## Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js

This quiz system integrates cleanly alongside the existing static HTML pages (index.html, papers.html, admin.html) — they are separate and unaffected.

---

## Brand Tokens

| Token | Value |
|---|---|
| Plum | `#2B1E3F` |
| Cyan | `#6DD3CE` |
| Coral | `#FF5E5B` |
| Amber | `#F5C842` |
| Font Heading | Poppins 800/900 |
| Font Body | DM Sans |
