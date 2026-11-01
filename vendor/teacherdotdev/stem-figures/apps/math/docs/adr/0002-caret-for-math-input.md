# Caret for math input

Teachers type inequalities (−2 < x ≤ 5, x < −1 or x ≥ 3) and range values (π/4, 1/3) that should look like math as they type, so math input uses Caret, a friend's extensible math-input library, rather than plain text boxes or MathLive. Anything general, such as comparisons, and/or, π, exponents, square roots, evaluating with variables, string ↔ Doc serialization, typing rules, the editing controller (`Editor`) and the Svelte field (`@caret-js/svelte`), is built inside Caret. Math Figures keeps only what is specific to figures, such as turning an inequality into intervals and drawing them.

Caret is unpublished and its packages don't build on install, so we work on a local clone of Caret on its own branch and commit its built packages here as tarballs (`vendor/caret-*.tgz`, referenced with `file:`). Nothing is pushed to Caret's repo; what we build and find is reported to its author by hand.

## Considered Options

- **Plain text field with our own parser**: least risk, but it looks like code, not math, and gives the author no real-world use to learn from.
- **MathLive**: mature and MIT licensed, but heavy (~700 KB) and styled as a full equation editor.
- **Switching this repo to pnpm workspaces with Caret as a submodule**: tighter development loop, but it changes the whole repo's tooling and Vercel's build.

## Consequences

- Caret has no license file yet. Its author has said we can use it, and on that basis it ships in Math Figures; a license file would still be better.
- Caret's parser relies on `instanceof`, so the app must load exactly one copy of `@caret-js/core`, and only its ES module build.
- The query string stores a plain ASCII form of each input (`x<-1 or x>=3`, `pi`), so links stay readable and never depend on Caret's internal Doc format.
- Updating Caret means rebuilding the tarballs (`npm run caret`) and committing them. Every build is version 0.0.0, so `npm install` over an existing `node_modules` keeps the old one; Vercel restores `node_modules` from its build cache, so `vercel.json` installs with `npm ci`, which always starts clean. Locally, run `npm ci` after pulling a Caret update.
