<script lang="ts">
  // A label typed in Caret's math field (docs/adr/0003-caret-for-labels.md):
  // "theta" → θ, "deg" or "^o" → °, "_" for a subscript and "^" for a
  // superscript, or Google Docs' Ctrl+, and Ctrl+. (⌘ on a Mac). A vector is
  // typed the LaTeX way, \vec{F} or \mathbf{F}, and shown with its arrow or in bold.
  // `value` is the label's text as it is written in the page address ("m_1").
  //
  // Caret's field drops typed spaces, so before it reads the keyboard or a
  // paste, spaces are swapped for FIELD_SPACE, a blank character it keeps.
  import { MathField } from '@caret-js/svelte'
  import { createCaretVDOMComponent, h, type Doc } from '@caret-js/core'
  import { FIELD_SPACE, SHORTCUTS, commands, labelFromText, labelToText, schema, typingRules, vectorTokenType } from './label'

  interface Props {
    value: string
    id?: string
    placeholder?: string
    'aria-label'?: string
  }
  let { value = $bindable(''), ...rest }: Props = $props()

  const swapSpaces = (text: string) => text.replace(/ /g, FIELD_SPACE)
  // The field keeps one of these in its hidden textarea and ignores it when reading.
  const ZERO_WIDTH = String.fromCodePoint(0x200b)

  // Capture runs before the field's own listeners on its hidden textarea.
  function oninputcapture(event: Event) {
    const area = event.target as HTMLTextAreaElement
    if (area.value.includes(' ')) area.value = swapSpaces(area.value)
  }
  function onpastecapture(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? ''
    if (!text.includes(' ')) return
    event.preventDefault()
    event.stopPropagation()
    const area = event.target as HTMLTextAreaElement
    area.value = ZERO_WIDTH + swapSpaces(text)
    area.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Google Docs' shortcuts for a subscript and a superscript, typed into the
  // field as characters its commands turn into boxes.
  function onkeydowncapture(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
    const box = event.key === '.' || event.code === 'Period' ? 'superscript' : event.key === ',' || event.code === 'Comma' ? 'subscript' : null
    if (!box || !(event.target instanceof HTMLTextAreaElement)) return
    event.preventDefault()
    event.stopPropagation()
    event.target.value = ZERO_WIDTH + SHORTCUTS[box]
    event.target.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const classify = (doc: Doc<any>) =>
    new Map((doc.root.tokens as any[]).filter((t) => t.props?.char === FIELD_SPACE).map((t) => [t.id, 'label-space']))

  const components = {
    [vectorTokenType.type]: createCaretVDOMComponent<any>(({ token, children }) =>
      h('span', { class: `label-vector ${(token.props as { style: string }).style}` }, h('span', { class: 'label-vector-body' }, children.get('body'))),
    ),
  }
</script>

<div class="label-input" {oninputcapture} {onpastecapture} {onkeydowncapture}>
  <MathField {schema} bind:value fromText={labelFromText} toText={labelToText} {typingRules} {commands} {classify} {components} {...rest} />
</div>

<style>
  .label-input :global(.caret-field) {
    --caret-border: var(--border);
    --caret-focus: var(--blue);
    --caret-color: var(--ink);
    --caret-font-size: 1.1rem;
    --caret-placeholder-font: system-ui, sans-serif;
  }
  .label-input :global(.label-space) { display: inline-block; width: 0.3em; color: transparent; }
  /* Caret raises every sub/superscript box, so a lone subscript sits up where a
     superscript would. Here the box is a column (superscript over subscript)
     whose baseline is its first line, set as far off the baseline as
     FigureLabel sets them: a subscript down 0.3, a superscript up 0.45.
     Lengths are in the box's own 0.6em font size. */
  .label-input :global(.caret-field .subsup) { display: inline-flex; flex-direction: column; line-height: 1.25; vertical-align: 0.75em; }
  .label-input :global(.caret-field .subsup > .subscript) { float: none; }
  .label-input :global(.caret-field .subsup:not(:has(> .superscript))) { vertical-align: -0.5em; }
  /* A vector: bold and upright, or with an arrow over it (a line and a small
     head drawn with borders), and a grey slot while it's empty. */
  .label-input :global(.label-vector) { --arrow-y: 0.3em; display: inline-block; position: relative; }
  .label-input :global(.label-vector.bold) { font-weight: 700; }
  .label-input :global(.label-vector.bold .caret-var) { font-style: normal; }
  .label-input :global(.label-vector.arrow::before) {
    content: ''; position: absolute; left: 0.12em; right: 0.02em; top: var(--arrow-y); border-top: 0.06em solid currentColor;
  }
  .label-input :global(.label-vector.arrow::after) {
    content: ''; position: absolute; right: -0.02em; top: calc(var(--arrow-y) - 0.09em);
    border-style: solid; border-color: transparent; border-width: 0.12em 0 0.12em 0.22em; border-left-color: currentColor;
  }
  .label-input :global(.label-vector-body:not(:has(:not(.cursor.placeholder)))::after) {
    display: inline-block; content: ''; width: 0.6em; height: 0.7em; background: var(--caret-slot, #e5e7eb); vertical-align: -0.1em;
  }
</style>
