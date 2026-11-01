<script lang="ts">
  // A strip of pH paper, its wet end turned the color of the reading, above
  // the color chart students match it against.
  import { CHART_COLORS, PH_PAPER as P, paperColor } from './paper'

  let { reading }: { reading: number } = $props()

  const s = P.strip
</script>

<g stroke-linejoin="round">
  <!-- the strip, wet at its left end -->
  <rect x={s.x} y={s.y} width={s.width} height={s.height} rx="2" fill="#fbf8ee" />
  <rect x={s.x} y={s.y} width={s.wet} height={s.height} rx="2" fill={paperColor(reading)} />
  <rect x={s.x} y={s.y} width={s.width} height={s.height} rx="2" fill="none" stroke="#111" stroke-width="1.5" />

  <!-- the color chart -->
  <rect x={P.card.x + 1} y={P.card.y} width={P.card.width - 2} height={P.card.height} rx="8" fill="#fff" stroke="#111" stroke-width="2" />
  <text x={P.swatchX(0)} y={P.card.y + 22} font-size="14" font-weight="700" fill="#111">pH</text>
  {#each CHART_COLORS as color, pH (pH)}
    <rect x={P.swatchX(pH)} y={P.swatchY} width={P.swatch} height={P.swatch} fill={color} stroke="#111" stroke-width="1" />
    <text x={P.swatchX(pH) + P.swatch / 2} y={P.swatchY + P.swatch + 18} text-anchor="middle" font-size="13" fill="#111">{pH}</text>
  {/each}
</g>
