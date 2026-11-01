# Making figures with STEM Figures

The five STEM Figures sites (maths, physics, chemistry, biology, economics) are saved in
`vendor/teacherdotdev/stem-figures`. Every figure's settings live in its page address, so a
figure can be reproduced from a link. The figures are public domain (CC0): no credit needed.

1. Run one site locally:

   ```sh
   cd vendor/teacherdotdev/stem-figures
   npm install
   cd apps/math && npx vite dev --port 5190
   ```

2. Open `http://127.0.0.1:5190/<figure>` (for example `/pie-chart`, `/number-line`,
   `/triangle`, `/coordinate-grid`), set it up, and copy the address bar (path and query).

3. Save it as an SVG:

   ```sh
   npm i -D playwright && npx playwright install chromium
   node scripts/figures/render-figure.mjs http://127.0.0.1:5190 "/pie-chart?<settings>" public/figures/my-pie.svg
   ```

4. Use `/figures/my-pie.svg` in a question or card, or pass the SVG to the PDF generator.
   Keep figures as SVG, never PNG.
