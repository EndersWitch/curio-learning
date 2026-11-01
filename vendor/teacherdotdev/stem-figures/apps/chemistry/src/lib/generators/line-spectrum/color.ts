// The color of light of each wavelength, for drawing lines and the rainbow
// behind absorption lines. Dan Bruton's approximation
// (http://www.physics.sfasu.edu/astro/color/spectra.html): a piecewise-linear
// run through violet, blue, cyan, green, yellow and red, dimmed toward the
// ends of what eyes can see (380 and 780 nm), with his gamma of 0.8.

export const VISIBLE_FROM = 380
export const VISIBLE_TO = 780

const GAMMA = 0.8

/** The color at `nm` as red, green and blue from 0 to 1, black outside 380–780 nm. */
export function wavelengthRgb(nm: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  if (nm >= 380 && nm < 440) [r, b] = [(440 - nm) / 60, 1]
  else if (nm >= 440 && nm < 490) [g, b] = [(nm - 440) / 50, 1]
  else if (nm >= 490 && nm < 510) [g, b] = [1, (510 - nm) / 20]
  else if (nm >= 510 && nm < 580) [r, g] = [(nm - 510) / 70, 1]
  else if (nm >= 580 && nm < 645) [r, g] = [1, (645 - nm) / 65]
  else if (nm >= 645 && nm <= 780) r = 1
  const fade = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1
  const shade = (c: number) => (c === 0 ? 0 : (c * fade) ** GAMMA)
  return [shade(r), shade(g), shade(b)]
}

/** The color at `nm` as "#rrggbb". */
export function wavelengthColor(nm: number): string {
  const hex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0')
  return `#${wavelengthRgb(nm).map(hex).join('')}`
}
