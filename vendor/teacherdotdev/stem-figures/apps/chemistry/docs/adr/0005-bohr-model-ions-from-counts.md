# A Bohr model's element, charge and gained or lost electrons come from its counts

A teacher asked for an easier way to make Bohr models of atoms and their ions, with the electrons an ion gained or lost marked. Bohr Model already stored only the proton, neutron and per-shell electron counts, and drew any counts as set. The element picker and charge field are shortcuts that set those counts; the settings stay the same, and the element, the charge and which electrons were gained or lost are all worked out from them: the element is the one with the proton count, the charge is the protons minus the electrons, and the gained and lost electrons are how each shell differs from the neutral atom's.

The ion's shells come from Orbital Diagram's ground-state configuration grouped by shell, so the two generators always agree on which electrons an ion loses (Fe²⁺ its 4s, not its 3d).

## Considered Options

- **Store the element and charge, as Orbital Diagram does (ADR 0004)**: makes a correct ion the source of truth, but then shells set by hand either have to be stored as changes to it, or picking an element throws them away. A Bohr model has no answer key or mistakes to find, so there is nothing to gain from knowing the correct one.
- **Store which electrons are gained or lost**: lets a teacher mark any electron, but the marks can then disagree with the counts, and every count change would have to fix them up.
- **A separate Bohr Ion generator**: would duplicate the whole of Bohr Model to add one setting.

## Consequences

A link to a Bohr model made before this change draws the same figure. A model set by hand shows its gained and lost electrons too, so an excited atom (Na at 2, 7, 2) shows one lost on shell 2 and one gained on shell 3. With them shown, a shell that lost electrons is laid out for the neutral atom's count, so the lost ones leave gaps instead of the rest spreading out; with them hidden, the shell is spread evenly as before.
