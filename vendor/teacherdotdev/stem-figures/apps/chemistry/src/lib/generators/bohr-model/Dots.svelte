<script lang="ts">
  // Protons, neutrons and electrons as drawn: a disc in the component's
  // color with a dark outline, and its symbol, if it has one, in the middle.
  // A gained electron is in its own color, and a lost one is an empty spot
  // with a dashed outline.
  import { COLOR_FILL, symbolFill, symbolText, type Color, type Component, type ComponentLook, type Dot } from './model'

  let { dots, looks, gainedColor = 'green' }: { dots: Dot[]; looks: Record<Component, ComponentLook>; gainedColor?: Color } = $props()

  /** Two-character symbols ("p⁺", "e⁻") are set smaller so they fit. */
  const fontSize = (d: Dot, text: string) => d.r * ([...text].length > 1 ? 1.15 : 1.5)
  /** Dashes that go evenly around a spot of radius `r`, about 2 long. */
  const dashes = (r: number) => {
    const step = (2 * Math.PI * r) / Math.max(4, Math.round((2 * Math.PI * r) / 3.4))
    return `${(step * 0.6).toFixed(3)} ${(step * 0.4).toFixed(3)}`
  }
</script>

{#each dots as d, i (i)}
  {#if d.change === 'lost'}
    <circle cx={d.x} cy={d.y} r={d.r} fill="#fff" stroke="#222" stroke-width="1.2" stroke-dasharray={dashes(d.r)} />
  {:else}
    {@const look = d.change === 'gained' ? { ...looks[d.component], color: gainedColor } : looks[d.component]}
    {@const text = symbolText(look.symbol)}
    <circle cx={d.x} cy={d.y} r={d.r} fill={COLOR_FILL[look.color]} stroke="#222" stroke-width={d.component === 'electron' && !text ? 1 : 1.2} />
    {#if text}
      <text
        x={d.x}
        y={d.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={fontSize(d, text)}
        font-weight="700"
        fill={symbolFill(look.color)}>{text}</text
      >
    {/if}
  {/if}
{/each}
