# Curio Learning — Next.js

## How this works

**Next.js routes (new):**
- `/` → `app/page.tsx` — home page (landing + dashboard)
- `/login` → `app/login/page.tsx` — auth page
- `/quiz/*` → `app/quiz/...` — quiz system

**Existing HTML pages → go in `/public`:**

Copy these files from your repo root into the `/public` folder:
- `papers.html` → `/public/papers.html` (accessible at `/papers.html`)
- `admin.html` → `/public/admin.html`
- `profile.html` → `/public/profile.html`
- `subscription.html` → `/public/subscription.html`
- `deeplearn.html` → `/public/deeplearn.html`
- `formatter.html` → `/public/formatter.html`
- `privacy.html` → `/public/privacy.html`
- `terms.html` → `/public/terms.html`
- `contact.html` → `/public/contact.html`
- `ads.txt` → `/public/ads.txt`
- `api/` folder → stays as-is (Vercel serverless functions)

Vercel will serve files from `/public` at their exact paths.
Next.js handles `/`, `/login`, `/quiz/*`.

## Vercel settings
- Framework: **Next.js**
- Build command: `next build`
- Install command: `npm install`
- Output directory: (leave blank)

## Environment variables (set in Vercel dashboard)
```
NEXT_PUBLIC_SUPABASE_URL=https://inmrsgujgfktapjnekjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU
ANTHROPIC_API_KEY=<your key>
```
