<script lang="ts">
  // Paper confetti that shoots from the screen corners, then flutters down.

  const COLORS = ['#ff4d4d', '#ffb020', '#ffe14d', '#2fbf71', '#3d8bff', '#9b5cff', '#ff4f98']
  const GRAVITY = 900
  const DRAG = 2.4

  type Piece = {
    x: number
    y: number
    vx: number
    vy: number
    width: number
    height: number
    color: string
    angle: number
    spin: number
    tilt: number
    tiltSpeed: number
    sway: number
    /** How fast it drifts down once the burst is spent. */
    fall: number
  }

  let canvas: HTMLCanvasElement
  let pieces: Piece[] = []
  let frame = 0
  let last = 0

  /** Fires a burst from each corner. */
  export function burst({ few = false } = {}) {
    const w = innerWidth
    const h = innerHeight
    const count = few ? 14 : 55
    // Bottom corners shoot up and inward; top corners spray inward and down.
    shoot(0, h, -70, 1500, count)
    shoot(w, h, -110, 1500, count)
    shoot(0, 0, -20, 900, Math.round(count * 0.5))
    shoot(w, 0, -160, 900, Math.round(count * 0.5))
    if (!frame) {
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
  }

  function shoot(x: number, y: number, angleDeg: number, speed: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      const angle = ((angleDeg + (Math.random() - 0.5) * 30) * Math.PI) / 180
      const v = speed * (0.55 + Math.random() * 0.6)
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        width: 8 + Math.random() * 6,
        height: 12 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 8,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 5 + Math.random() * 6,
        sway: Math.random() * Math.PI * 2,
        fall: 70 + Math.random() * 80,
      })
    }
  }

  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const ratio = devicePixelRatio || 1
    if (canvas.width !== innerWidth * ratio) {
      canvas.width = innerWidth * ratio
      canvas.height = innerHeight * ratio
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, innerWidth, innerHeight)

    const slow = Math.exp(-DRAG * dt)
    for (const p of pieces) {
      p.vx *= slow
      p.vy = Math.min(p.vy * slow + GRAVITY * dt, p.fall)
      p.sway += dt * 3
      p.x += (p.vx + Math.sin(p.sway) * 35) * dt
      p.y += p.vy * dt
      p.angle += p.spin * dt
      p.tilt += p.tiltSpeed * dt

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      // Squashing one axis makes the paper look like it's flipping over.
      ctx.scale(1, Math.cos(p.tilt))
      ctx.fillStyle = p.color
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      ctx.restore()
    }
    pieces = pieces.filter((p) => p.y < innerHeight + 40)
    frame = pieces.length ? requestAnimationFrame(tick) : 0
    if (!frame) ctx.clearRect(0, 0, innerWidth, innerHeight)
  }

  /** Clears everything, for starting again. */
  export function clear() {
    pieces = []
  }
</script>

<canvas bind:this={canvas} class="confetti" aria-hidden="true"></canvas>

<style>
  .confetti {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 7;
  }
</style>
