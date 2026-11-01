<script lang="ts">
  // A pH electrode standing in a beaker of liquid, wired to its meter: the
  // cable runs from `from` (the meter's socket) up and over to the
  // electrode's cap. The electrode's center line is at `x`, its cap at `top`,
  // and the beaker sits on `bottom`.
  let { x, top, bottom, from }: { x: number; top: number; bottom: number; from: { x: number; y: number } } = $props()

  const beaker = $derived({ left: x - 52, right: x + 52, top: bottom - 142, bottom, liquid: bottom - 98 })
  const lift = $derived(Math.min(from.y, top) - 30)
  const cable = $derived(`M ${from.x} ${from.y} C ${from.x} ${lift} ${x} ${lift} ${x} ${top + 4}`)
  // The shaft, a cylinder straight down from under the cap to a flat end,
  // its corners just softened.
  const tip = $derived(bottom - 22)
  const glass = $derived.by(() => {
    const [w, r] = [7, 2]
    return `M ${x - w} ${top + 52} V ${tip - r} Q ${x - w} ${tip} ${x - w + r} ${tip} H ${x + w - r} Q ${x + w} ${tip} ${x + w} ${tip - r} V ${top + 52}`
  })
</script>

<g stroke-linejoin="round" stroke-linecap="round">
  <!-- the cable, from the meter over to the electrode's cap -->
  <path d={cable} fill="none" stroke="#111" stroke-width="5" />
  <path d={cable} fill="none" stroke="#fff" stroke-width="2" />

  <!-- beaker of liquid behind the electrode -->
  <rect x={beaker.left} y={beaker.top} width={beaker.right - beaker.left} height={beaker.bottom - beaker.top} fill="#fff" />
  <path
    d="M {beaker.left} {beaker.liquid} H {beaker.right} V {beaker.bottom - 4} Q {beaker.right} {beaker.bottom} {beaker.right - 4} {beaker.bottom} H {beaker.left + 4} Q {beaker.left} {beaker.bottom} {beaker.left} {beaker.bottom - 4} Z"
    fill="#dcdcdc"
  />
  <line x1={beaker.left} y1={beaker.liquid} x2={beaker.right} y2={beaker.liquid} stroke="#444" stroke-width="1.5" />
  {#each [0.23, 0.43, 0.63, 0.83] as f}
    {@const y = beaker.top + f * (beaker.bottom - beaker.top)}
    <line x1={beaker.right - 22} x2={beaker.right - 6} y1={y} y2={y} stroke="#111" stroke-width="1.2" />
  {/each}

  <!-- electrode: strain relief, cap, and the glass shaft with its inner tube, a cylinder down to its flat end -->
  <path d="M {x - 4} {top} H {x + 4} L {x + 8} {top + 12} H {x - 8} Z" fill="#fff" stroke="#111" stroke-width="1.5" />
  <rect x={x - 11} y={top + 12} width="22" height="40" rx="4" fill="#555" stroke="#111" stroke-width="2" />
  <path d={glass} fill="#f4f6f7" stroke="#111" stroke-width="1.5" />
  <line x1={x} y1={top + 58} x2={x} y2={tip - 6} stroke="#9a9a9a" stroke-width="1.5" />

  <!-- beaker glass in front -->
  <path
    d="M {beaker.left - 8} {beaker.top - 4} Q {beaker.left - 2} {beaker.top - 2} {beaker.left} {beaker.top + 4} V {beaker.bottom - 4} Q {beaker.left} {beaker.bottom} {beaker.left + 4} {beaker.bottom} H {beaker.right - 4} Q {beaker.right} {beaker.bottom} {beaker.right} {beaker.bottom - 4} V {beaker.top - 2}"
    fill="none"
    stroke="#111"
    stroke-width="2"
  />
</g>
