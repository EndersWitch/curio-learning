<script lang="ts">
  // The cross typed in Caret's math field (see crossField.ts): "^" for a
  // superscript and "_" for a subscript, or Google Docs' Ctrl+. and Ctrl+,
  // (⌘ on a Mac). `value` is the cross as the page address keeps it
  // ("C^R C^W × C^R C^W").
  //
  // Caret's field drops typed spaces, so before it reads the keyboard or a
  // paste, spaces are swapped for FIELD_SPACE, a blank character it keeps.
  import { MathField } from '@caret-js/svelte'
  import type { Doc } from '@caret-js/core'
  import { FIELD_SPACE, SHORTCUTS, commands, crossFromText, crossToText, schema, typingRules } from './crossField'

  interface Props {
    value: string
    id?: string
    'aria-label'?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    /** when the teacher leaves the field */
    onleave?: () => void
  }
  let { value = $bindable(''), onleave, ...rest }: Props = $props()

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

  function onfocusout(event: FocusEvent) {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) onleave?.()
  }

  const classify = (doc: Doc<any>) =>
    new Map((doc.root.tokens as any[]).filter((t) => t.props?.char === FIELD_SPACE).map((t) => [t.id, 'cross-space']))
</script>

<div class="cross-input" {oninputcapture} {onpastecapture} {onkeydowncapture} {onfocusout}>
  <MathField {schema} bind:value fromText={crossFromText} toText={crossToText} {typingRules} {commands} {classify} {...rest} />
</div>

<style>
  .cross-input :global(.caret-field) {
    --caret-border: var(--border);
    --caret-focus: var(--blue);
    --caret-color: var(--ink);
    --caret-font-size: 1.15rem;
    --caret-invalid: var(--red);
    --caret-font: Georgia, 'Times New Roman', Times, serif;
  }
  .cross-input :global(.cross-space) { display: inline-block; width: 0.3em; color: transparent; }
  /* Caret raises every sub/superscript box, so a lone subscript sits up where a
     superscript would. Here the box is a column (superscript over subscript)
     whose baseline is its first line, a lone subscript set below the baseline.
     Lengths are in the box's own 0.6em font size. */
  .cross-input :global(.caret-field .subsup) { display: inline-flex; flex-direction: column; line-height: 1.25; vertical-align: 0.75em; }
  .cross-input :global(.caret-field .subsup > .subscript) { float: none; }
  .cross-input :global(.caret-field .subsup:not(:has(> .superscript))) { vertical-align: -0.5em; }
</style>
