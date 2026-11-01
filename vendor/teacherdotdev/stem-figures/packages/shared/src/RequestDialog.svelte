<script lang="ts">
  // Request a generator: the same dialog as Help, with its own wording, and the
  // same on every site. Opened from the search box or the directory through
  // openRequest(); each site's layout shows it.
  import EmailDialog from './EmailDialog.svelte'
  import { request } from './request.svelte'

  const subject = $derived(request.topic ? `Generator request: ${request.topic}` : 'Generator request')
  const body = $derived(
    `${request.topic ? `I'd like a generator for: ${request.topic}\n\n` : ''}(Attach screenshots or images of the figures you'd like it to make.)\n\n`,
  )
</script>

{#if request.open}
  <EmailDialog title="Request a generator" {subject} {body} onclose={() => (request.open = false)}>
    <p>
      {#if request.topic}We don’t have a generator for “{request.topic}” yet.{/if}
      You can email us with a suggestion, and we’ll build it.
    </p>
    <p>
      Please send us a screenshot or an image of the kind of figure you’d like it to make, as an example of
      what it should draw. The more examples you send, the better the generator will be.
    </p>
  </EmailDialog>
{/if}
