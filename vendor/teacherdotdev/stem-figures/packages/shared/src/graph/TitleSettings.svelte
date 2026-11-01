<script lang="ts">
  // The Titles settings group: a graph's chart title and axis titles, each
  // written text, a blank line for students, or nothing.
  import { Heading } from '@lucide/svelte'
  import Section from '../Section.svelte'
  import LabelField from '../LabelField.svelte'
  import { TITLE_KEYS, TITLE_NAMES, titlesSummary, type TitleMode } from './axes'

  interface Props {
    title: string
    titleMode: TitleMode
    xTitle: string
    xTitleMode: TitleMode
    yTitle: string
    yTitleMode: TitleMode
    /** An example for each, shown while it's empty. */
    placeholders: Record<(typeof TITLE_KEYS)[number], string>
  }
  let {
    title = $bindable(), titleMode = $bindable(), xTitle = $bindable(), xTitleMode = $bindable(),
    yTitle = $bindable(), yTitleMode = $bindable(), placeholders,
  }: Props = $props()

  const summary = $derived(titlesSummary({ title, titleMode, xTitle, xTitleMode, yTitle, yTitleMode }))
</script>

<Section title="Titles" icon={Heading} {summary}>
  <div class="field">
    <span>{TITLE_NAMES.title}</span>
    <LabelField name={TITLE_NAMES.title} placeholder={placeholders.title} bind:mode={titleMode} bind:text={title} />
  </div>
  <div class="field">
    <span>{TITLE_NAMES.xTitle}</span>
    <LabelField name={TITLE_NAMES.xTitle} placeholder={placeholders.xTitle} bind:mode={xTitleMode} bind:text={xTitle} />
  </div>
  <div class="field">
    <span>{TITLE_NAMES.yTitle}</span>
    <LabelField name={TITLE_NAMES.yTitle} placeholder={placeholders.yTitle} bind:mode={yTitleMode} bind:text={yTitle} />
  </div>
</Section>

<style>
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
</style>
