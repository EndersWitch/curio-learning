<script lang="ts">
  // How one component looks: its color, and the symbol written on it (with
  // no symbols given, only its color, as for a gained electron).
  import { COLORS, COLOR_FILL, COLOR_NAMES, symbolText, type Color, type ComponentSymbol } from './model'

  interface Props {
    name: string
    color: Color
    symbol?: ComponentSymbol
    symbols?: readonly ComponentSymbol[]
  }
  let { name, color = $bindable(), symbol = $bindable(), symbols = [] }: Props = $props()
</script>

<div class="row">
  <span class="label">Color</span>
  <div class="options colors" role="radiogroup" aria-label="{name} color">
    {#each COLORS as c (c)}
      <button
        type="button"
        role="radio"
        aria-checked={color === c}
        aria-label={COLOR_NAMES[c]}
        data-tip={COLOR_NAMES[c]}
        class="swatch"
        class:on={color === c}
        onclick={() => (color = c)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10" fill={COLOR_FILL[c]} stroke="#222" stroke-width="1.5" /></svg>
      </button>
    {/each}
  </div>
</div>
{#if symbols.length}
  <div class="row">
    <span class="label">Symbol</span>
    <div class="options" role="radiogroup" aria-label="{name} symbol">
      {#each symbols as sym (sym)}
        <button type="button" role="radio" aria-checked={symbol === sym} class="chip small" class:on={symbol === sym} onclick={() => (symbol = sym)}>
          {sym ? symbolText(sym) : 'None'}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .row { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 0.55rem; }
  .label { flex: none; width: 3.6rem; padding-top: 0.35rem; font-size: 0.84rem; font-weight: 700; }
  .options { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  /* Small enough for all the colors to fit on one line in a wide panel. */
  .colors { gap: 0.2rem; }
  .small { padding: 0.3rem 0.6rem; font-size: 0.84rem; min-width: 2.4rem; }
  .swatch {
    display: grid;
    place-items: center;
    width: 1.9rem;
    height: 1.9rem;
    padding: 0;
    border: 1.5px solid var(--border);
    border-radius: 999px;
    background: #fff;
  }
  .swatch:hover { border-color: var(--blue-border); background: var(--blue-soft); }
  .swatch.on { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue); }
</style>
