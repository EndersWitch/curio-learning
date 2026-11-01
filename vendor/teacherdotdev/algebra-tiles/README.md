# Algebra Tiles

A web app where students multiply and factor polynomials, and solve equations,
with algebra tiles. A teacher types one problem and shares a link; there are no
accounts, and nothing is stored on a server.

The words used here (mat, side, rectangle, zero pair, like-term group, balance,
pan…) are
defined in [`GLOSSARY.md`](GLOSSARY.md), and the decisions behind them are
recorded in [`docs/adr/`](docs/adr/).

## Choosing an activity (home page)

The home page is a gallery of the activities: **Solve an Equation**,
**Multiply Factors** and **Factor a Polynomial**, each a card with a worked
example drawn in the app's own tiles, and a last dashed card that asks
teachers to suggest another activity, by email. In each picture the tiles
students are given are drawn in color, and what they make (Multiply's
rectangle, Factor's sides, and every answer) is drawn as dashed ghosts. Above
the cards are the Algebra Tiles wordmark and "Choose an activity".

On a wide screen (1024px and up) the page is two panels the height of the
window, with the footer along the bottom: the cards on the left scroll on
their own, and the chosen card's details stay put on the right, Solve first:
a larger picture, the steps students go through, problems like the ones it
takes, and **Set up ▸** pinned to the bottom, in the same place whichever card
is chosen. On a narrow screen there are only the cards; tapping one slides
the same details up in a drawer, which closes on a drag down, a tap outside,
Escape or the browser's Back button. On every teacher page the footer sits at
the bottom of the window when the page is shorter than it.

## Making an activity link (`/multiply`, `/factor`, `/solve`)

Each activity has its own setup page, which starts with the example from its
card. The teacher types the problem in a math field (`^` for a power). For
Multiply and Factor it can be in either form: `(x+2)(x-3)` or `x^2-x-6` works
for both. Multiply starts students from the factors and Factor from the
polynomial, whichever was typed. Solve takes an equation. Anything tiles can
build is allowed:

- Multiply: two factors, each some x's and some units, like `(x+2)(x-3)`,
  `(2x+1)(-x+4)`, `2x(x+3)`, `3(x-1)` or `(x+3)^2`.
- Factor: any polynomial up to x² that factors over the whole numbers, like
  `x^2-x-6`, `6x^2+x-2`, `x^2-9` or `4x+6`.
- Solve: an equation in x with whole numbers and a whole-number answer, x on
  either side or both, like `2x+3=7`, `3x-4=x+6`, `-2x=6` or `x^2+3x=x^2+6`
  (x² only when it's the same on both sides). No brackets: multiplying them
  out is Multiply's job. Equations with no solution, or with every number a
  solution, are refused, and so is one already solved, like `x=4`.

Anything else is refused with the reason, as it's typed; an `=` sign is only
for Solve. For Multiply and Factor the teacher also picks what students start
with: all the tiles they need (for Multiply, both sides' tiles and the
rectangle's; for Factor, the rectangle's, zero pairs included), or none. A box
beside the choices shows the tiles the chosen one gives for the problem typed.

Solve always starts with each side's tiles in its pan, and its one setting is
the **live balance**, on unless the teacher turns it off. On, the board shows
a balance that tips as students work. Off, there's no balance: the board shows
the equation's two sides as dashed boxes either side of a gray line standing
for =, nothing tips, and only step 1's Check says whether the two sides are
equal (never which is heavier); every message then speaks of sides, never pans
or a balance. The preview beside it shows the starting tiles in the small
balance's pans, or on the two sides, in the same frame, so toggling it only
swaps the drawing.

On the right, the page gives the activity link, a way to try it as a
student, and its QR code, all kept up to date as the teacher types. One link
is one problem, carried in the link: `/play?type=factor&p=x^2-x-6&start=all`
or `/play?type=solve&p=2x+3=7`, with `&live=0` when the live balance is off.
Older links with `start=positive` (a choice there used to be) open with all
the tiles, and so does any Solve link, whatever its `start`.

A help button in the bottom-left corner of the window gives the support
email, and the footer links to the About and Privacy pages.

## Doing a problem (`/play`)

The board is a whiteboard. Scroll to pan, pinch or Ctrl/⌘ + scroll to zoom, and
use − / + / Fit. One bar across the top holds, in a row, the activity, the
problem, its steps and **Check**, pinned to the right. It is as wide and tall
as the widest of its states for that activity from the start, so it never
moves as the steps go by, and wraps on a narrow screen. On the last step, the answer field
(`x = ___` for Solve, `(x+2)(x-3) = ___` for Multiply and Factor) takes the
steps' place, ready to type in, and Enter checks. Once it's done, the bar says
so, with the answer and **Start again**. Nothing is written on the board: what
a failed Check found wrong shows just under the bar, and the tiles it found
are marked in red. When a step re-frames the board (Multiply's T fading, Solve's
division step), the view eases there, along with the tiles.

The toolbar at the bottom holds two tools, **Select** (V) and **Hand** (H, or
hold space). With Select, dragging empty board draws a box that selects the
tiles it touches; with Hand, it pans. Then come undo, redo and **Reset**,
which asks first, then goes back to step 1 with the starting tiles where they
began; **Flip**, which turns the tray's tiles over to their negatives, and
**Turn**, which stands its x tile up; the tiles, to drag out or to tap and
then tap the board; and the trash, which deletes what's dropped on it or
what's selected. On a phone (600px wide or less) the toolbar fits the screen
in two rows, the tools as icons above, the tray and the trash below, with the
zoom above it. Locked tiles let taps through to the board, so a picked tray
tile can be placed right beside them.

A tile can go anywhere, and snaps to the edges of the T and of tiles nearby,
with no grid (see ADR 0002). A side of the T holds one row, laid end to end
from the corner: a tile dropped there slides along to the corner or the tile
before it, and the row closes up when one leaves. Starting tiles lie flush
together, beside the mat or in the pans. Tiles keep whichever way they face:
double-click one to turn it, except on a side of the T. Click a tile, or
Shift-click several, or Ctrl/⌘ + A for all of them, for their buttons: Turn,
Flip (to the opposite sign), Duplicate, Delete, and **Zero out** when the
selection holds zero pairs. One tile zeroes out with the opposite lying flush
against it; several pair up every positive tile with a negative tile of the
same kind, nearest first, flush or not (in Solve only within one pan, or both
off the balance, never across the middle). The pairs rumble, slide into each
other and poof together; tiles without a partner stay put and stay selected.
Dragging a selected tile moves the whole selection; Alt/Option-dragging copies
it, leaving the tiles where they were. Duplicates and pasted tiles go directly
below what was copied, flush and laid out the same, each staying in its
original's pan (the pans grow taller to fit) or off the balance; copies of
tiles on a side of the T go on along its row. Ctrl/⌘ + Z and Ctrl/⌘ + Shift +
Z undo and redo, back to the last passed Check.

Keyboard shortcuts:

| Keys                           | What they do                                              |
| ------------------------------ | --------------------------------------------------------- |
| V / H, or hold space           | Select tool / Hand tool                                   |
| Ctrl/⌘ + A                     | Select every tile                                         |
| Ctrl/⌘ + C, X, V               | Copy, cut, paste (below; just after a cut, back in place) |
| Ctrl/⌘ + D                     | Duplicate, below the selection                            |
| 0                              | Zero out the selection's zero pairs                       |
| Delete / Backspace             | Delete the selection                                      |
| Ctrl/⌘ + Z, Ctrl/⌘ + Shift + Z | Undo, redo                                                |
| Escape                         | Let go of the selection                                   |
| Enter (in the answer field)    | Check                                                     |

Each Check marks what's wrong in red; only a passed Check opens the next step,
and it locks the tiles it read.

- **Multiply**: lay the factors along the two sides of the T → the sides lock
  and gray out; fill the rectangle → the T fades away; sort its tiles into
  their like-term groups and zero out the zero pairs → type the product after
  the printed `(x+2)(x-3) =`.
- **Factor**: arrange the tiles into a rectangle in the corner of the T,
  bringing out zero pairs as needed → lay tiles on the sides that measure it →
  type the factors after the printed `x^2-x-6 =`.
- **Solve**: the board has a balance in place of the T, a pan for each side of
  the equation (or, with the live balance off, the two sides divided by a
  line), and its steps are Isolate → Divide → Answer. The balance weighs the
  pans (see ADR 0005): it hangs level when they weigh the same with x set to
  the answer (two empty pans included), and otherwise tips toward the heavier
  pan. **Isolate**:
  do the same to both pans until they weigh the same, one holds only positive
  x tiles and the other only unit tiles (or nothing), with no x² tiles or zero
  pairs left (for `-2x=6`, select everything in both pans and Flip). Tiles off
  the balance don't count. → The balance fades, all but its post, which
  stretches into a line standing for = (with the live balance off, the line
  is already there and the sides' boxes fade); a dashed box spans the line for each
  x tile, stacked down and as tall as the screen allows, and each x tile
  slides into its own box on its side of the line. The units wait in a heap
  above the boxes on their side. **Divide**: drag the units into the boxes
  until every unit is in one and every box holds the same number (uneven
  boxes are marked red); with one x tile there's no division step. → Every
  box but the first fades away. **Answer**: type the number after `x =`.

For Multiply and Factor, the answer has to be the other form: the simplified
polynomial, or the factors multiplied. One that's equal but not simplified
gets a nudge.

With reduced motion asked for by the system, everything still works: tiles,
the balance and the view move at once, and zero pairs vanish without a poof.

## Code

- `src/lib/algebra.ts`: reading typed math with Caret, polynomials, which
  problems tiles can build or solve, and checking the student's equation or
  answer.
- `src/lib/mat.ts`: tile sizes, snapping, and the checks for the sides, the
  rectangle and the like-term groups; also pairing up a selection's zero
  pairs and stacking copies below what was copied. Positions on the mat are
  kept as so many x's plus so many units, and the checks read those, never
  pixels.
- `src/lib/balance.ts`: Solve's balance: where its pans lie, weighing them and
  which way it leans, the check for step 1, and the division step's line,
  boxes and check. Like the mat's checks, they read where tiles lie on the
  board as if the balance were level; tipping only moves how a pan's tiles
  are drawn.
- `src/lib/BalanceArt.svelte`: the balance's drawing, for the board, the
  gallery's picture and the setup page's preview.
- `src/lib/settings.ts`: the tiles an activity starts with, and laying them
  out flush.
- `src/lib/activities.ts`: the activities as the teacher pages describe
  them: title, tagline, steps, problems like, and the worked example.
- `src/lib/ActivityPicture.svelte`: an activity's worked example, drawn in
  tiles at their true sizes, at card or panel size.
- `src/routes/+page.svelte`: the gallery, its details panel and drawer.
- `src/lib/Setup.svelte`: an activity's setup page, behind the thin
  `src/routes/{multiply,factor,solve}` pages.
- `src/lib/support.ts`: the support email, used by the help box, About and
  Privacy.
- `src/lib/Activity.svelte`: the student's board, its top bar and its steps.
- `vendor/`: Caret, the math field, packed from a local clone by
  `bun run caret` (see ADR 0003).

## Running

```
bun install
bun run dev     # start the site
bun run test    # the algebra, mat and balance tests
bun run check   # type-check
bun run lint    # format + lint check
```

## Visitor counts

The site is published at algebratiles.org (mirrored at
algebratiles.teacher.dev) on Vercel by the teacher.dev Sites scripts
(`../sites`). `VITE_CF_BEACON_TOKEN` (see `.env.example`) carries the
Cloudflare Web Analytics token; it is set in Vercel's production environment
only, so local and preview runs load no analytics script.
