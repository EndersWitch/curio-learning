import type { Point } from './donut'

/** Pixels per second squared. Tuned so a throw takes most of a second. */
export const GRAVITY = 2400

export type Flight = {
  start: Point
  /** Initial velocity in px/s. */
  velocity: Point
  duration: number
}

/** A parabola from `start` that lands exactly on `target` after `duration` seconds. */
export function planFlight(start: Point, target: Point, duration: number): Flight {
  return {
    start,
    velocity: {
      x: (target.x - start.x) / duration,
      y: (target.y - start.y) / duration - 0.5 * GRAVITY * duration,
    },
    duration,
  }
}

export function positionAt(flight: Flight, seconds: number): Point {
  const t = Math.min(seconds, flight.duration)
  return {
    x: flight.start.x + flight.velocity.x * t,
    y: flight.start.y + flight.velocity.y * t + 0.5 * GRAVITY * t * t,
  }
}

/** A random spot just off the left, right or bottom edge, in the lower half of the screen. */
export function launchPoint(width: number, height: number, random = Math.random): Point {
  const side = random()
  const offscreen = 30
  if (side < 0.4) return { x: -offscreen, y: height * (0.5 + random() * 0.45) }
  if (side < 0.8) return { x: width + offscreen, y: height * (0.5 + random() * 0.45) }
  // Bottom edge, avoiding the middle where the controls sit.
  const left = random() < 0.5
  return { x: width * (left ? 0.05 + random() * 0.25 : 0.7 + random() * 0.25), y: height + offscreen }
}
