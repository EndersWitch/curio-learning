<script lang="ts">
  type Props = {
    value: number
    label: string
    onMinus?: () => void
    onPlus: () => void
    /** Optional bigger jumps, shown outside − and +. */
    onMinusFive?: () => void
    onPlusFive?: () => void
    /** Which button to pulse when the third hint wants to point the way. */
    pulse?: 'minus' | 'plus' | null
  }

  let { value, label, onMinus, onPlus, onMinusFive, onPlusFive, pulse = null }: Props = $props()
</script>

<div class="stepper">
  {#if onMinusFive}
    <button class="five" aria-label="Five fewer" onclick={onMinusFive}>−5</button>
  {/if}
  {#if onMinus}
    <button class="round" class:pulse={pulse === 'minus'} aria-label="One fewer" onclick={onMinus}>−</button>
  {/if}
  <div class="value" aria-live="polite">
    {#key value}<span class="number">{value}</span>{/key}
    <span class="label">{label}</span>
  </div>
  <button class="round plus" class:pulse={pulse === 'plus'} aria-label="One more" onclick={onPlus}>+</button>
  {#if onPlusFive}
    <button class="five plus" aria-label="Five more" onclick={onPlusFive}>+5</button>
  {/if}
</div>

<style>
  .stepper {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .round {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    border: none;
    background: var(--ink);
    color: #fff;
    font: 700 44px/1 var(--font);
    box-shadow: 0 6px 0 #00000033;
    cursor: pointer;
    transition: transform 0.08s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .round:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #00000033;
  }

  .plus {
    background: var(--accent);
  }

  .five {
    width: 64px;
    height: 52px;
    border-radius: 999px;
    border: none;
    background: var(--ink);
    color: #fff;
    font: 700 24px/1 var(--font);
    box-shadow: 0 5px 0 #00000033;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .five.plus {
    background: var(--accent);
  }

  .five:active {
    transform: translateY(3px);
    box-shadow: 0 2px 0 #00000033;
  }

  .value {
    min-width: 120px;
    display: grid;
    justify-items: center;
    line-height: 1;
  }

  .number {
    font: 700 56px/1 var(--font);
    animation: bump 0.2s ease-out;
  }

  .label {
    font: 600 18px/1.2 var(--font);
    color: var(--ink-soft);
  }

  @keyframes bump {
    from { transform: scale(1.3); }
  }

  .pulse {
    animation: pulse 0.9s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      transform: scale(1.15);
      box-shadow: 0 0 0 10px #ffd23f88, 0 6px 0 #00000033;
    }
  }

  /* Phones: smaller buttons so ±5, −, + and the number fit across. The number keeps
     its size, so the controls stay as tall as on the other steps. */
  @media (max-width: 480px) {
    .stepper {
      gap: 10px;
    }

    .round {
      width: 60px;
      height: 60px;
      font-size: 36px;
    }

    .five {
      width: 50px;
      height: 44px;
      font-size: 20px;
    }

    .value {
      min-width: 76px;
    }
  }

  @media (max-width: 380px) {
    .stepper {
      gap: 8px;
    }

    .round {
      width: 54px;
      height: 54px;
    }

    .five {
      width: 44px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .number { animation: none; }
  }
</style>
