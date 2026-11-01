<svelte:options namespace="svg" />

<script lang="ts">
  // One birthday candle: a stubby striped stick with a big flame on top. It only
  // tilts a little either way (from `rotation`), so the flame always points up; in
  // flight the spinning rotation makes it wobble.
  let { rotation = 0, toward = 0 }: { rotation?: number; toward?: number } = $props()
  void toward
  const uid = $props.id()
  const tilt = $derived((((rotation % 30) + 30) % 30) - 15)
  const STICK = { x: -5.5, y: -1, width: 11, height: 9.5, rx: 3 }
  const FLAME = 'M0 -11.2C3.8 -8.4 4.8 -6.4 4.8 -5A4.8 4.8 0 0 1 -4.8 -5C-4.8 -6.4 -3.8 -8.4 0 -11.2Z'
</script>

<defs>
  <clipPath id="candle-{uid}"><rect {...STICK} /></clipPath>
</defs>
<g transform={`translate(1 2.5) rotate(${tilt})`} fill="#2b2b3a" opacity="0.24">
  <rect {...STICK} />
  <path d={FLAME} />
</g>
<g transform={`rotate(${tilt})`}>
  <rect {...STICK} fill="#2456c8" />
  <path
    clip-path="url(#candle-{uid})"
    d="M-6 3L6 -1.4V1.8L-6 6.2Z M-6 9L6 4.6V7.8L-6 12.2Z"
    fill="#ff5c9d"
  />
  <path d={FLAME} fill="#ff8a1a" />
  <path d="M0 -8.6C2 -6.9 2.5 -5.8 2.5 -5.1A2.5 2.5 0 0 1 -2.5 -5.1C-2.5 -5.8 -2 -6.9 0 -8.6Z" fill="#ffe14d" />
</g>
