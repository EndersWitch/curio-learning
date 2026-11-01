<script lang="ts" generics="T extends string">
  // A short choice shown as segmented buttons, like Toward / Away / None.
  let { name, options, value = $bindable() }: { name: string; options: readonly (readonly [T, string])[]; value: T } = $props()
</script>

<div class="segmented" role="radiogroup" aria-label={name}>
  {#each options as [v, text]}
    <button type="button" role="radio" aria-checked={value === v} class:on={value === v} onclick={() => (value = v)}>{text}</button>
  {/each}
</div>
