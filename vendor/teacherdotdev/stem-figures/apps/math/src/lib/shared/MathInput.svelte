<script lang="ts">
  // A math field, set up the way every generator uses it: typing rules like
  // <= → ≤ and pi → π, "/" for fractions, and the value kept as readable text
  // for the page address. `kind` is "number" (a range value like 3π/2) or
  // "inequality" (like −2 < x ≤ 5, with "or" and "and" set as words).
  import { MathField } from '@caret-js/svelte'
  import { classifyFor, commands, fromText, schema, toText, typingRules, type MathKind } from './math.js'

  // The rest (id, aria-label, placeholder…) go to the field's text box.
  let { value = $bindable(''), kind = 'number', ...rest }: { value?: string; kind?: MathKind; [attribute: string]: unknown } = $props()
</script>

<MathField
  {schema}
  bind:value
  {fromText}
  toText={(doc) => toText(doc, kind)}
  {typingRules}
  {commands}
  classify={classifyFor(kind)}
  {...rest}
/>

<style>
  :global(.caret-field) {
    --caret-border: var(--border);
    --caret-focus: var(--blue);
    --caret-invalid: var(--red);
    --caret-color: var(--ink);
    --caret-font-size: 1.1rem;
    --caret-placeholder-font: system-ui, sans-serif;
  }
  /* Room after a comma, as in (1, 2), and a minus that starts a number (−3) set tight. */
  :global(.caret-math .caret-comma) { margin-right: 0.3em; }
  :global(.caret-math .caret-unary) { margin: 0 0.04em 0 0; }
  /* Function names like sin and log: upright, with a little room before what they act on. */
  :global(.caret-math .caret-fn) { font-style: normal; }
  :global(.caret-math .caret-fn-end) { margin-right: 0.15em; }
  /* A subscript on its own, like log₂'s 2 (Caret places a subsup box as if it were an exponent), and a grey slot while it's empty. */
  :global(.caret-math .subsup.subsup:not(:has(.superscript))) { vertical-align: -0.75em; }
  /* A function's power or base hugs its name (log₂, sin²), and the room goes after it instead. */
  :global(.caret-math .caret-fn-end:has(+ .cursor + .subsup)) { margin-right: 0; }
  :global(.caret-math .caret-fn-end + .cursor + .subsup) { margin-right: 0.25em; }
  :global(.caret-math .subscript.subscript:not(:has(:not(.cursor.placeholder)))::after) {
    display: inline-block; content: ''; width: 0.6em; height: 0.7em; background: var(--caret-slot, #e5e7eb); vertical-align: -0.1em;
  }
</style>
