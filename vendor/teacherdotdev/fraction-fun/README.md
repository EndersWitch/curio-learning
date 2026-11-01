# Fraction Fun

fractionfun.org

Find a fraction of a whole number by cutting a donut into equal groups and sharing sprinkles onto it. See `GLOSSARY.md` for the words we use and `docs/adr/` for the decisions behind them.

## Setting a problem

One link is one problem: `?n=1&d=4&of=20` asks "What is one fourth of 20?" That's also the default.

- `d` (groups) is 2–12
- `n` is 1 to `d − 1`
- `of` is a multiple of `d`, up to 60

Anything invalid falls back to the default.

Two optional params change how it's shown, and are left out for the defaults:

- `item=pizza`, `item=cookie`, `item=cake`, `item=watermelon` or `item=cheese` works the problem on that food instead of the donut (anything else is a donut)
- `mode=watch` is **Watch** mode: no −/+ or taps, and each press of the step's button (Start!, Chop!, Share!, Count!, Keep!, Again!) plays that step as an animation. Without it the problem is **Interactive**.

For example `?n=3&d=4&of=24&item=pizza&mode=watch`. While a problem is being worked the app adds `step=` for the browser's Back button; links shouldn't include it.

### Teacher setup

`/teacher` (the gear button beside the sound button) builds these links: pick the numerator, denominator, whole, item and mode, see the question and whether it's valid (with nearby wholes that split evenly), then Copy link or Open. It's the same single-page app; `vercel.json` rewrites `/teacher` to `index.html` so a direct load works, and Vite's dev and preview servers already fall back to it.

## Student steps

1. **Question**: the problem fills the screen. **Start!**
2. **Groups**: −/+ previews the cut lines. **Chop!**
3. **Sprinkles**: each + throws a sprinkle onto the next group in turn. **Share!**
4. **Count**: the view zooms into one group and the student taps each sprinkle to count it. **Done!**
5. **Pick**: tap the groups you need, starting from none. **Keep!**
6. **Answer**: the equation, plus "2 groups of 5 → 2 × 5 = 10". **Again!**

A wrong confirm makes the donut wobble and shows a hint. The hints get more direct each try.

## Development

```bash
npm install
npm run dev
npm test        # logic: problem links, dealing, steps, hints, throws
npm run check
npm run build
```

Sound effects are all CC0, mostly from Kenney (see `public/sounds/CREDITS.md`). The −/+ notes are synthesised in the browser.

Cloudflare Web Analytics loads in production builds, using the fractionfun.org token in `src/main.ts` (or `VITE_CF_BEACON` if set).

## License

Apache License 2.0. See `LICENSE`. Sound effects keep their own CC0 licences (`public/sounds/CREDITS.md`).
