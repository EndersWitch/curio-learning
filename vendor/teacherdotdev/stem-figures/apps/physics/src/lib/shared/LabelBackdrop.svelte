<script lang="ts">
  // A filter that paints a white box behind a label, just bigger than its
  // text, subscripts and all, so the label reads over anything behind it
  // without an outline round each letter. Put it in a figure's <defs> and pass
  // its id to FigureLabel's `backdrop`. It needs a unique id per SVG on the page.
  let { id }: { id: string } = $props()
</script>

<filter {id} x="-0.08" y="-0.02" width="1.16" height="1.04" color-interpolation-filters="sRGB">
  <feFlood flood-color="#fff" />
  <feComposite in="SourceGraphic" />
</filter>
