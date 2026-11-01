# Rounding on a Number Line

A small web app that helps students practise rounding by finding the
**starting point**, **end point** and **midpoint (halfway)** on a number line.
Teachers configure a drill and share a link; students work through it on their
own device and get a report at the end. Everything runs in the browser — the
settings live entirely in the link.

Live at **https://lines.teacher.dev**.

## Setting up a drill (home page)

Choose the settings on the left; a live preview and the shareable link (with a
QR code) update on the right.

- **Round to the nearest** — any place from 0.001 through 1,000,000 (pick several for a mix)
- **Numbers up to** — 1, 10, 100, …, 10,000,000
- **How students answer** — *Guided* asks for the starting point, end point and
  midpoint before rounding; *Quick* shows the number on the line and just asks
  which way it rounds
- **Have students plot the number first** — hides the target dot and asks the
  student to choose the closest tick before rounding
- **Number of questions** — 1–100
- **Number every tick mark** — an easier line with every tick labelled
- **Allow retries** — students try a step again after a miss (the miss still
  shows in the report)

## Taking a drill

Opening the link shows a start screen; the clock begins when the student presses
**Start**. The top bar shows the question number, running score and time. When
the drill ends, the results screen shows the score and a **report**: which steps
were missed most, and a per-question table of every wrong answer. It can be
printed.

## Link format

`/practice?to=10,100&max=1000&n=10&mode=guided&plot=1&labels=0&retry=0`

| param    | meaning                                  |
| -------- | ---------------------------------------- |
| `to`     | units to round to, comma-separated       |
| `max`    | largest number (1, 10, …, 10000000)     |
| `n`      | number of questions (1–100)              |
| `mode`   | `guided` or `quick`                      |
| `plot`   | `1` asks the student to plot the number  |
| `labels` | `1` numbers every tick mark              |
| `retry`  | `1` allows retries                       |

Anything missing or invalid falls back to the default.

## Running

```sh
npm install
npm run dev
```

Build for deployment with `npm run build` (output in `dist/`). Set
`VITE_CF_BEACON_TOKEN` to the Cloudflare Web Analytics token to add the beacon;
leave it unset and no analytics script is loaded.
