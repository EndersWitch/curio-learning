# Orbital diagrams start correct and are changed from settings

An orbital diagram is always worked out from the element and charge the teacher picks: the aufbau filling order with Pauli exclusion and Hund's rule, a table of real exceptions (Cr, Cu, Pd…) unless the teacher asks for filling order, and cations losing electrons from the highest n first. Teachers can then change any orbital's electrons to make a wrong or excited-state diagram for a "which rule is broken?" question. The settings store the element, charge and configuration rule plus the orbitals the teacher changed, not the whole diagram, so the address stays short (ADR 0001) and "Back to correct" just clears the changes.

Drawing and checking are kept apart, as for Lewis structures (ADR 0003). The drawing draws any diagram, even an impossible one (two up electrons in one orbital). A separate check compares the drawn diagram with the correct one and writes each mistake as a sentence; the answer key of a changed diagram lists them and says whether it is an excited state or not allowed.

## Considered Options

- **Type a configuration** ("1s2 2s2 2p4"): lets a teacher write any configuration, but most want a real atom's, typing it is the work the generator is meant to save, and it can't say which spin each electron has.
- **Store the whole diagram in the address**: loses "Back to correct" and knowing which orbitals the teacher changed.
- **Click the orbitals on the figure**: quicker to find, but the figure is also the exported picture and is scaled to fit its card; the settings keep a small copy of the orbitals to click instead.

## Consequences

The check needs the correct diagram, so a changed diagram is always of a known element and charge. A change to an orbital that stops being drawn (another element, the noble gas core turned on) is dropped.
