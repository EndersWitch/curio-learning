# Circuits as a series/parallel tree

The roadmap left circuits open, because "any circuit" doesn't fit a settings form. The Circuit Diagram Generator describes a circuit as a tree instead: the loop is a list of parts and groups, a parallel group holds branches, and a branch is a part or a series group. The teacher edits it as an indented outline ("add in series", "add in parallel"), and the figure is laid out from the tree, the same way every other figure is drawn from its settings (ADR 0002). Batteries can go in any branch, so the tree covers single loops, series/parallel combination problems and two-battery Kirchhoff problems. A voltmeter goes across a part or group rather than being part of the tree, because that's how problems describe it.

## Considered Options

- **Set arrangements** (three in series, two in parallel, and so on, each with slots to fill): fits the flat settings every other generator uses, like the Pulley's setups, but teachers would run past the menu almost at once.
- **A grid canvas where parts snap to edges**: draws anything, including bridges, but it is the drawing tool ADR 0002 turned down, and a figure could come out ugly or impossible.

## Consequences

Bridge circuits (like the Wheatstone bridge) can't be drawn, since they aren't series/parallel. The circuit is one settings field with its own tidying and its own compact form in the page address, rather than a set of flat fields. The layout has to be automatic and must never cross wires, so the tree is capped at 8 parts and groups nested 3 deep, which is about as much as a worksheet figure can hold.
