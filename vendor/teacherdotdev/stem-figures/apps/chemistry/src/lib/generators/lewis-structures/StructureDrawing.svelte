<script lang="ts">
  // One structure, drawn from its worked-out drawing with its top left
  // corner at (0, 0). With `onselect`, clicking an atom or bond selects it
  // for changing. The selection flashes briefly each time `flash` changes,
  // then fades, so a projected figure doesn't give away what was changed;
  // it and the click targets are left out of exports.
  import { CHARGE_FONT, DOT_R, FONT, LABEL_FONT, type Drawing } from './drawing'
  import type { Selection } from './figureLayout'

  interface Props {
    drawing: Drawing
    selected?: Selection | null
    /** bumped to flash the selection again */
    flash?: number
    onselect?: (selection: Selection) => void
  }
  let { drawing, selected = null, flash = 0, onselect }: Props = $props()

  const INK = '#111'
  const selectedAtom = $derived(selected?.kind === 'atom' ? drawing.symbols.find((t) => t.atom === selected!.index) : undefined)
  const selectedBond = $derived(selected?.kind === 'bond' ? drawing.bondSpots.find((b) => b.bond === selected!.index) : undefined)
</script>

{#key flash}
  {#if selectedAtom}
    <rect
      data-no-export
      class="flash"
      x={selectedAtom.x - selectedAtom.w / 2 - 7}
      y={selectedAtom.y - selectedAtom.h / 2 - 7}
      width={selectedAtom.w + 14}
      height={selectedAtom.h + 14}
      rx="7"
      fill="#dbeafe"
    />
  {/if}
  {#if selectedBond}
    <rect
      data-no-export
      class="flash"
      x={-Math.max(selectedBond.length, 12) / 2 - 3}
      y="-9"
      width={Math.max(selectedBond.length, 12) + 6}
      height="18"
      rx="6"
      fill="#dbeafe"
      transform="translate({selectedBond.x} {selectedBond.y}) rotate({selectedBond.angle})"
    />
  {/if}
{/key}
{#each drawing.lines as l, i (i)}
  <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={INK} stroke-width="2" stroke-linecap="round" />
{/each}
{#each drawing.symbols as t (t.atom)}
  <text x={t.x} y={t.y} dy="0.35em" text-anchor="middle" font-size={FONT} fill={INK}>{t.text}</text>
{/each}
{#each drawing.dots as d, i (i)}
  <circle cx={d.x} cy={d.y} r={DOT_R} fill={INK} />
{/each}
{#each drawing.labels as l, i (i)}
  <text x={l.x} y={l.y} dy="0.35em" text-anchor="middle" font-size={LABEL_FONT} fill={INK}>{l.text}</text>
{/each}
{#if drawing.brackets}
  {@const b = drawing.brackets}
  <path d="M {b.x1 + 7} {b.y1} H {b.x1} V {b.y2} H {b.x1 + 7} M {b.x2 - 7} {b.y1} H {b.x2} V {b.y2} H {b.x2 - 7}" fill="none" stroke={INK} stroke-width="1.8" />
{/if}
{#if drawing.charge}
  <text x={drawing.charge.x} y={drawing.charge.y} font-size={CHARGE_FONT} fill={INK}>{drawing.charge.text}</text>
{/if}
{#if onselect}
  <!-- Click targets for picking what to change. The same choices are in the
       settings for keyboard and screen reader users, so these are hidden. -->
  <g data-no-export aria-hidden="true">
    {#each drawing.bondSpots as b (b.bond)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <rect
        x={-Math.max(b.length, 14) / 2}
        y="-9"
        width={Math.max(b.length, 14)}
        height="18"
        fill="transparent"
        style="cursor: pointer"
        transform="translate({b.x} {b.y}) rotate({b.angle})"
        onclick={() => onselect({ kind: 'bond', index: b.bond })}
      />
    {/each}
    {#each drawing.symbols as t (t.atom)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <rect
        x={t.x - t.w / 2 - 8}
        y={t.y - t.h / 2 - 8}
        width={t.w + 16}
        height={t.h + 16}
        fill="transparent"
        style="cursor: pointer"
        onclick={() => onselect({ kind: 'atom', index: t.atom })}
      />
    {/each}
  </g>
{/if}

<style>
  .flash { animation: flash 1.4s ease-in forwards; }
  @keyframes flash {
    0%, 45% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
