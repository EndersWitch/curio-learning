<script lang="ts">
  // Settings for the chart title and the answer key line. `answer` is the
  // line as it would print, e.g. "Reading: 23.47 mL".
  import LabelField from './LabelField.svelte'

  interface Props {
    titleMode: 'none' | 'text'
    title: string
    answerKey: boolean
    answer: string
  }
  let { titleMode = $bindable(), title = $bindable(), answerKey = $bindable(), answer }: Props = $props()
</script>

<p class="field-label">Chart title</p>
<LabelField name="Chart title" bind:mode={titleMode} bind:text={title} placeholder="e.g. Read the volume" blank={false} />

<label class="check">
  <input type="checkbox" bind:checked={answerKey} />
  <span>
    <strong>Answer key</strong>
    <small>Print “{answer}” under the figure.</small>
  </span>
</label>

<style>
  .field-label { margin: 0 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
</style>
