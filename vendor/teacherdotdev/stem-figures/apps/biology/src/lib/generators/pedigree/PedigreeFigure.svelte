<script lang="ts">
  // The Pedigree figure: generation numerals down the left, the family's
  // lines and symbols, each person's number and genotype under them, and the
  // key below. With `onselect`, clicking a person selects them for changing;
  // the selection and click targets are left out of exports.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import { refKey, type Member, type Ref } from './family'
  import { answerText, describeFigure, KEY_FONT, KEY_SYMBOL, pedigreeFigure, SUP_SCALE, BLANK_WIDTH } from './figure'
  import { GENOTYPE_FONT, NUMBER_FONT, NUMERAL_FONT, SYMBOL } from './layout'
  import type { Allele, Mode } from './genetics'
  import type { PedigreeSettings } from './settings'
  import Symbol from './Symbol.svelte'

  interface Props {
    settings: PedigreeSettings
    family: Member
    selected?: Ref | null
    onselect?: (ref: Ref) => void
    svg?: SVGSVGElement
  }
  let { settings, family, selected = null, onselect, svg = $bindable() }: Props = $props()

  const INK = '#111'
  const fig = $derived(pedigreeFigure(settings, family))
  const layout = $derived(fig.layout)
  const picked = $derived(selected ? layout.people.find((p) => p.key === refKey(selected!)) : undefined)
  /** A genotype label as runs of text: each superscript raised, and the
   *  text after it brought back down. */
  function runs(label: Allele[]) {
    const shift = GENOTYPE_FONT * 0.38
    const out: { text: string; dy: number; sup: boolean }[] = []
    let down = 0
    for (const a of label) {
      out.push({ text: a.text, dy: down, sup: false })
      down = 0
      if (a.sup) {
        out.push({ text: a.sup, dy: -shift, sup: true })
        down = shift
      }
    }
    return out
  }
</script>

<FigureFrame
  bind:svg
  width={fig.width}
  height={fig.height}
  label={describeFigure(settings, fig)}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answerText(settings.mode as Mode) : ''}
>
  <g transform="translate({fig.dx} 0)">
    {#each layout.numerals as n (n.text)}
      <text x="0" y={n.y} dominant-baseline="central" font-size={NUMERAL_FONT} font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill={INK}>{n.text}</text>
    {/each}
    {#if picked}
      <rect data-no-export x={picked.x - SYMBOL / 2 - 7} y={picked.y - SYMBOL / 2 - 7} width={SYMBOL + 14} height={SYMBOL + 14} rx="9" fill="#dbeafe" />
    {/if}
    <g stroke={INK} stroke-width="2" stroke-linecap="square">
      {#each layout.lines as l, i (i)}
        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      {/each}
    </g>
    {#each layout.people as p (p.key)}
      <Symbol person={p.person} x={p.x} y={p.y} size={SYMBOL} carriers={settings.carriers} />
    {/each}
    {#if settings.numbers}
      {#each layout.people as p (p.key)}
        <text x={p.x} y={p.y + layout.numberY} text-anchor="middle" font-size={NUMBER_FONT} fill={INK}>{p.name.split('-')[1]}</text>
      {/each}
    {/if}
    {#if settings.genotypes === 'blank'}
      {#each layout.people as p (p.key)}
        <line x1={p.x - BLANK_WIDTH / 2} y1={p.y + layout.genotypeY + 1} x2={p.x + BLANK_WIDTH / 2} y2={p.y + layout.genotypeY + 1} stroke={INK} stroke-width="1.2" />
      {/each}
    {:else if settings.genotypes === 'answers'}
      {#each layout.people as p (p.key)}
        {@const label = fig.labels.get(p.key)}
        {#if label}
          <text x={p.x} y={p.y + layout.genotypeY} text-anchor="middle" font-size={GENOTYPE_FONT} fill={INK}>
            {#each runs(label) as r, i (i)}<tspan dy={r.dy || undefined} font-size={r.sup ? GENOTYPE_FONT * SUP_SCALE : undefined}>{r.text}</tspan>{/each}
          </text>
        {/if}
      {/each}
    {/if}
  </g>
  {#if fig.key}
    {@const key = fig.key}
    <g transform="translate({key.x} {key.y})">
      <rect x="0.75" y="0.75" width={key.width - 1.5} height={key.height - 1.5} fill="none" stroke={INK} stroke-width="1.2" />
      {#each key.entries as e (e.text)}
        <Symbol person={e.person} x={e.x + KEY_SYMBOL / 2 + (e.person.proband ? 6 : 0)} y={e.y} size={KEY_SYMBOL} carriers={settings.carriers} />
        <text x={e.x + KEY_SYMBOL + 12} y={e.y} dominant-baseline="central" font-size={KEY_FONT} fill={INK}>{e.text}</text>
      {/each}
    </g>
  {/if}
  {#if onselect}
    <!-- Click targets for picking whom to change. The same choices are in the
         settings for keyboard and screen reader users, so these are hidden. -->
    <g data-no-export aria-hidden="true" transform="translate({fig.dx} 0)">
      {#each layout.people as p (p.key)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <rect
          x={p.x - layout.spacing / 2 + 2}
          y={p.y - SYMBOL / 2 - 8}
          width={layout.spacing - 4}
          height={SYMBOL + 16}
          fill="transparent"
          style="cursor: pointer"
          onclick={() => onselect(p.ref)}
        />
      {/each}
    </g>
  {/if}
</FigureFrame>
