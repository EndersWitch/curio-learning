# Morphology Mash

A web app where students build words out of morphemes and break words back
down into them. A teacher sets up an activity and shares a link; there are no
accounts, and nothing is stored on a server.

The words used here (Morpheme Bank, base, root, Tray…) are defined in
[`GLOSSARY.md`](GLOSSARY.md), and the decisions behind them are recorded in
[`docs/adr/`](docs/adr/).

## Activities (home page)

The home page lists the teacher's activities. The first visit adds the starter
activities from `src/lib/content/starters.json`; they can be edited or deleted
like any other, and a deleted one stays deleted. Starters added to
`starters.json` later reach teachers who have already visited, on their next visit. **New activity** asks for an
activity type — Build or Break — and opens the new activity's editor.

Each card copies its student link in one click, and its ⋯ menu can duplicate,
delete, or copy a teacher link: opening that link adds a copy of the activity to
the other teacher's list.

## Editing an activity

The editor's sidebar has the activity's name and its two pages, and — pinned to
the bottom — the student link, View as student, and the QR code. Every change is
saved as it happens. Once a link has been copied, editing the activity turns the
button into **Copy new link**, since students holding the old link still get the
old version.

- **Morpheme Bank** — search by spelling or meaning ("carry" finds _port_), filter
  by grade band, origin and meaning group, and tick morphemes in or out. A bar
  along the bottom counts the words the bank makes and warns below 5.
- **Activity settings** — each activity type has its own, chosen from picture
  cards:
  - Build: morpheme types labelled or plain, and feedback right away or at the
    end. Build tiles always show each morpheme's meaning.
  - Break: after cutting, show or ask the types; show or ask the meanings; and
    feedback.
  - Both: a word limit and/or time limit (endless by default).

All of an activity's settings travel in its link; nothing is stored on a server.

## Taking an activity

Endless practice starts straight away and ends with **Finish**. With a limit, a
Start gate holds the clock until the student is ready. Either way the session
ends on a report of every missed word and what went wrong, which the student can
save as a PDF with their name on it.

## Adding words, morphemes and starter activities

Content lives in `src/lib/content/`:

- `morphemes.json` — every morpheme, keyed by id: its type, spelling, meanings
  (most have one; a few, like `un`, have two), for bases an optional `root`, and
  three tags for the Morpheme Bank's filters: `grade` (`3-4`, `5-6`, `7-8`),
  `origin` (`english`, `latin`, `greek` — words that came through French count as
  Latin) and `group` (its meaning group; see `GROUP_NAMES` in `src/lib/content.ts`)
- `words.json` — each word, its grade, its definition, and its parts in order.
  A part names a morpheme (`m`), how it is written in this word when a spelling
  change alters it (`as`, e.g. `hope` written `hop` in _hoping_), and which
  meaning it uses (`meaning`, needed only when the morpheme has more than one)
- `starters.json` — the starter activities: a name, a type (`build` or
  `break`) and a Morpheme Bank. A bank must contain every prefix and suffix its
  words need, not only the bases.

Morphemes that mean the same thing (_-ion_, _-ment_) share one wording on
purpose, so one is never offered as the "wrong" meaning of the other.

After editing, run `bun run check:content`. It checks that every word's parts
join back into the word, every id, meaning number and tag is valid, and every
starter activity makes at least 5 words.

## Telling teachers what's changed

`NEWS` in `src/lib/news.svelte.ts` is the "What's changed" window: each piece
of news is a few changes, each beside a drawing from `NewsArt.svelte`. A teacher
who was already using the app sees the news they haven't seen yet, once, on the
next teacher page they open; a first visit counts all news as seen, and students
never see it. The Help pop-up shows it all again. Add new news at the end.

## Running

```
bun install
bun run dev            # start the site
bun run check          # type-check
bun run lint           # format + lint check
bun run check:content  # check the word lists
```

## Visitor counts

The site is published at morphologymash.com on Vercel by the teacher.dev Sites
scripts (`../sites`). `VITE_CF_BEACON_TOKEN` (see `.env.example`) carries the
Cloudflare Web Analytics token; it is set in Vercel's production environment
only, so local and preview runs load no analytics script. The Literata font is served from this site, not a font
service, so a visit reaches no one else.
