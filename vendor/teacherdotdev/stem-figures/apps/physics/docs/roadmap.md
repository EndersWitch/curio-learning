# Roadmap

The first generators are **Coil and Magnet**, **Inclined Plane** and **Pulley**
(see `CONTEXT.md` and ADR 0002), followed by the **Free Body Diagram**, the
figure teachers search for most. The ones below came from the same teacher
request and are planned next, in this order. Each still needs its own design
questions before it is built.

## Free Body Diagram (built)

One body, a dot or an Object, with up to eight forces at any angle, drawn at
relative lengths, with optional angle marks, components, and velocity or
acceleration beside it. Left out on purpose, until teachers ask: tilted
(along-the-slope) axes, plain x/y axes, a net force arrow, more than one body
per figure, and placing a label by hand. Its force list is the settings `list`
field, which Torque Balance can use for its hanging objects.

## Projectile Motion (built)

A ball or dot launched from level ground or off a cliff, with its real
parabolic path, the launch velocity, its angle and components, g, the ball at
equal time steps (lettered or not), and marks for the maximum height, range
and cliff height. Kept simple on purpose, next to the textbook figure it came
from: no formulas on the figure, no axes, no velocity arrows along the path,
no downward launches, no landing on a raised or sloped surface, and no air
resistance, until teachers ask.

## Vector Diagram (built)

Up to three vectors drawn to scale head to tail, each set by its magnitude
(in grid squares) and direction, and their resultant. Every vector and the
resultant can be drawn solid, dashed or left off, and each can show an angle
mark and its components. A grid (no tick marks) is on by default; plain x and
y axes through the first tail are optional. Left out on purpose, until
teachers ask: vector subtraction, tail-to-tail (parallelogram) addition,
setting a vector by its components, tick marks or a scale, and more than
three vectors.

## Wave (built)

A transverse wave against distance or time, a longitudinal wave as vertical
lines bunched at its compressions, or the longitudinal one above its matching
transverse one, on numbered axes fitted to the wave (gridlines or tick
marks), or with no axes about a dashed rest line. The amplitude, wavelength
or period, and cycles are set; λ (or T) and A are marked with arrows, and a
crest, trough, compression and rarefaction can be labeled. Next, in the same
generator: standing waves (harmonic n, nodes and antinodes) and
superposition (two waves and their sum). Left for later: sound waves (loud
and quiet, high and low pitch), the Doppler effect, the EM spectrum,
diffraction and interference.

## Torque Balance

A beam balanced on a pivot with objects hanging from it at different
distances, for teaching torque. It can reuse the Pulley's hanging objects.
Open questions: meter-stick markings, a beam with its own weight, more than
one pivot, a spring scale holding the beam.

## Magnetic Field

Field figures that don't belong to Coil and Magnet (ADR 0002 keeps that one to
"a coil and what's next to it"). It can reuse the Coil and Magnet's field
lines.

- Two bar magnets attracting or repelling
- A horseshoe magnet
- Iron filings instead of field lines
- A loop or wire seen end-on, with the field as dots and crosses (into and out
  of the page)

## Circuits

The Circuit Diagram Generator draws a cell or battery with 1 to 4 resistors
or bulbs, all in series or all in parallel, with a switch, an ammeter and a
voltmeter (ADR 0005). Anything else is left to a Circuit Editor, planned but
not built yet, where a teacher would draw a circuit by hand; until then the
generator page says it's coming soon. Left for later:

- A pictorial style (drawn bulbs, D-cells, real-looking wires) for middle
  school, drawn from the same tree
- Capacitors, variable resistors, fuses, diodes and inductors
- Bridge circuits, which a series/parallel tree can't describe

## Atomic Models

Atomic modeling for introductory courses, such as Bohr models with electron
shells, energy level diagrams, and nuclei with protons and neutrons. Last,
because introductory physics uses it least.

## Later ideas

- **Copy description**: a toolbar button that copies a short written
  description of the figure, built from its settings, for alt text in Docs or
  Slides. Blank labels would be described as blank so the description never
  gives an answer away. Not now.
