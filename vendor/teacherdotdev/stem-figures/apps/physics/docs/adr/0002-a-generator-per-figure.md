# A generator per kind of figure, not a design canvas

The teacher request that started the physics generators asked for "a simple design suite" covering inclines, pulleys, torque balances, magnets, coils, circuits and atoms. We are building a separate generator for each kind of figure instead (Coil and Magnet, Inclined Plane, Pulley, and so on), each a short settings form that draws a finished figure. The teacher's real complaint was speed: "I just want a coil with a bunch of field lines and a moving magnet and I really don't want to have to draw that." A freeform canvas makes the teacher draw again, only with physics parts, and it doesn't fit how teachers find the site: searching for one generator by name (ADR 0001).

## Considered Options

- **One design canvas with a parts palette**: the most flexible, but slow to use and far larger to build. It is the Google Drawings experience the teacher wanted to escape.
- **Generators whose figures can take extra parts**: still possible later inside a single generator if teachers ask for it. It is not the starting point.

## Consequences

A setup that no generator covers needs a new generator or a new option, so each generator's options must be chosen from the questions teachers actually write. Figures are drawn from settings rather than hand placement, which keeps them physically consistent (field lines that don't cross, strings that stay taut) and lets a link reproduce the exact figure.
