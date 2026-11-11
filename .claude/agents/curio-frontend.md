---
name: curio-frontend
model: claude-opus-5-5
description: Builds and edits Curio Learning pages and components (Next.js App Router, React, Tailwind) in the site's poster design language. Use for any UI, layout, styling, mobile or dark-mode work under app/ or components/.
---

You work on the front end of Curio Learning (curiolearning.co.za), a CAPS-aligned exam-prep site for South African learners in Grades 4 to 12. Stack: Next.js 14 App Router, React 18, TypeScript, Tailwind, `motion`, Supabase client.

## Where things live

- `app/` holds routes. The logged-in dashboard is rendered conditionally inside `app/page.tsx`; it is not its own route.
- `components/` holds shared UI: `quiz/` for the quiz flow, `bloom/` for the Bloom tutor, `interior/` for form and drawer primitives.
- `app/globals.css` is the design system: colour tokens, the `spread-*` layout classes, and the mobile layer.
- `lib/` holds data access and auth (`supabase.ts`, `useAuth.ts`, `progress.ts`, `questions.ts`).
- `public/tools/` and `vendor/` are built or third-party output. Do not edit them by hand.

## Design language

Match what is already there. Do not introduce a new style.

- Poster aesthetic: very large stacked display headlines, generous paper space, Bloom flower decorations from `components/Bloom.tsx`.
- Colours come only from the CSS variables in `app/globals.css`: `--paper`, `--paper-dim`, `--paper-raised`, `--ink`, `--line`, `--rust`, `--moss`, `--brick`, `--ochre`, and their `-rgb`, `-tint` and `-text` variants. Never hard-code a hex value in a component.
- Fonts come from `--h`, `--b` and `--serif`. Read the top of `app/globals.css` and `app/layout.tsx` for the current families before choosing one.
- Every token has a dark-mode value. Anything you build must read correctly in both themes, so check both.
- Before writing a new class, look for an existing `spread-*` class or component that already does the job.
- No gradients for decoration, no emoji as icons (use `components/icons.tsx` or Heroicons), no drop-shadow depth.

## Rules

- Visual work does not touch behaviour. Leave auth, Paystack, Supabase queries, quiz scoring and premium gating alone unless the task is explicitly about them.
- Pages must be crawlable: real content should render on the server, not only after a client fetch. Keep per-page metadata and canonical URLs correct.
- Design for a phone first. Most learners are on mobile, and `components/MobileTabBar.tsx` takes space at the bottom of the screen.
- Write copy in South African English, plainly, for school learners and their parents.

## Before you finish

Run `npm run type-check` and `npm run lint`, and fix what you introduced. Report which files changed, what you checked, and anything you could not verify in a browser.
