# Engineering Figures

Engineering Figures (engineeringfigures.com) is a directory of generators that make
clean, printable engineering figures for teachers to paste into tests, worksheets
and slides. It is a teacher.dev project.

## Language

### The directory

**Figure**:
A finished engineering picture a teacher puts in front of students.
_Avoid_: Graphic, image, visual, resource

**Generator**:
A page that makes one kind of figure from a teacher's settings, named for what its figures show without the word "Generator" (e.g. "Gear Ratio").
_Avoid_: Maker, tool, builder, app

**Directory**:
The home page, which lists every generator with a live preview of its figure.
_Avoid_: Catalog, gallery, index

**Generator request**:
A teacher asking for a kind of figure that no generator makes yet.
_Avoid_: Feature request, suggestion

**Chart title**:
The title across the top of a figure.
_Avoid_: Title (alone), heading

**Preset**:
A named set of settings for one generator, saved by the teacher in their browser. None are built in.
_Avoid_: Template, favorite

### Measurement figures

Terms for the shared pieces (`src/lib/shared/`) that figures of measuring
instruments build on.

**Instrument**:
The measuring device a figure shows, drawn so students can read a measurement from it. A figure shows exactly one instrument.
_Avoid_: Tool, device, apparatus

**Reading**:
The value an instrument shows, which the teacher types and students read back. On a scale with marks it has one digit beyond the smallest mark (the estimated digit); on a digital display it is exactly what the display shows.
_Avoid_: Value, measurement, answer

**Magnifier**:
An enlarged circle showing a small stretch of an instrument's scale around the reading, beside or instead of the whole instrument.
_Avoid_: Zoom, callout, inset

**Answer key**:
An optional line printed under the instrument stating its reading, so one figure can serve as both question and key.
_Avoid_: Solution, label
