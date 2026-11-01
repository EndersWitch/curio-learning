# Photoelectron spectra use the textbook's energies, then Lotz's, on a log or broken axis

A teacher asked for photoelectron spectrum (PES) figures for AP Chemistry. A spectrum's peaks come from Orbital Diagram's ground-state configuration, so the two generators always agree (Cr and Cu included); where each peak sits comes from a table of binding energies, and the table and the axis are the two choices that matter.

**Energies.** For H to Ca, the figure uses the table in MJ/mol that AP materials, worksheets and textbooks quote (Ne: 84.0, 4.68, 2.08 MJ/mol), from Hutchinson's *Concept Development Studies in Chemistry* (OpenStax CNX). Students check a figure's peaks against those numbers, so it must match them exactly. That table stops at Ca. For Sc to Xe, the figure uses Lotz (1970), *Electron binding energies in free atoms*, the standard compilation for free atoms, in eV, converted to MJ/mol. Lotz's values for Ne, Na and Ca round to the textbook's, so the two tables meet without a jump. Lotz gives a p or d sublevel as two values (2p½ and 2p³⁄₂), which AP draws as one peak, so the figure draws their average, weighted by how many electrons each holds. The generator stops at Xe. Past it, 4f and 5d fill in orders the course doesn't teach, and Lotz's values are more extrapolated.

**Axis.** Binding energy runs high on the left to low on the right, as AP draws it. A 1s peak sits hundreds or thousands of times higher than a valence peak, so a linear axis crushes every valence peak into one line at the right. The axis is logarithmic by default, which keeps every peak apart for every element with one simple rule. A broken axis is offered too, closest to the hand-drawn AP figures: peaks are grouped where the next one is less than 2.5 times lower, and each group gets its own linear stretch, with break marks between them. A linear axis is kept for the "look how far out the core is" point.

## Considered Options

- **Draw with `$shared/graph`, as Titration Curve does**: its grid is linear on square blocks, with no log or broken axis and no reversed axis, and adding those would change every site that uses it. The figure draws its own SVG instead.
- **One table for every element (Lotz only)**: simpler, but Lotz’s H to Ca values for some inner sublevels differ from the ones students have in front of them (Na 2p: 3.28 against 3.67 MJ/mol).
- **Draw 2p½ and 2p³⁄₂ as two peaks**: true to high-resolution data, but AP never shows the split.

## Consequences

Heavier elements need another table, not a formula. A compared element shares the first element's axis, so its peaks shift left or right along the same numbers.
