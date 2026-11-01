# Third-party software

Curio Learning includes software adapted from open-source projects by teacher.dev
(https://github.com/teacherdotdev), released under the Apache License, Version 2.0
(https://www.apache.org/licenses/LICENSE-2.0). Each project's full licence text is kept with
its code in `vendor/teacherdotdev/<project>/` and, for the tools we serve, in
`public/tools/<tool>/LICENSE.txt`.

| In curio | Based on | Changes we made |
| --- | --- | --- |
| `public/tools/fraction-fun` | Fraction Fun | Served under `/tools/fraction-fun/`; curio colours and branding; analytics, community photo and teacher-only links removed; reports completion to the host page |
| `public/tools/lines` | Rounding on a Number Line (lines) | Served under `/tools/lines/`; curio colours and branding; analytics and community photo removed; reports completion to the host page |
| `public/tools/algebra-tiles` | Algebra Tiles | Built as a static site under `/tools/algebra-tiles/`; curio colours and branding; analytics and community photo removed; reports completion to the host page |
| `lib/data/morphology` | Morphology Mash content (morphemes and words) | Copied unchanged |
| `public/tools/figures/<site>` | STEM Figures (maths, physics, chemistry, biology, economics) | Built as static single-page apps under `/tools/figures/`; curio logo and wording; About and Privacy pages rewritten; example galleries, analytics and people photos removed; links kept inside curio (see `scripts/figures/host-patch.py`) |
| `public/tools/figure-library` | Example figures from STEM Figures, rendered to SVG | Unchanged output of the generators (CC0) |
| `vendor/teacherdotdev/stem-figures`, `vendor/teacherdotdev/question-commons` | STEM Figures, Question Commons | Upstream source, untouched; Question Commons is not served

Figures made with STEM Figures are dedicated to the public domain (CC0 1.0).
Fraction Fun's sound effects are CC0 (mostly Kenney, kenney.nl); see `public/tools/fraction-fun/sounds/CREDITS.md`.

"teacher.dev" and the names of the original projects belong to their owners. Curio is not affiliated
with or endorsed by teacher.dev.
