// Server-only. Builds a practice 1:50 000 topographic sheet of a REAL place in
// South Africa from open data, so no official (State copyright) map is copied:
//   - elevation: Mapzen/AWS "terrarium" terrain tiles (SRTM and other open DEMs)
//   - roads, rivers, buildings: OpenStreetMap (c) OpenStreetMap contributors, ODbL
// The sheet is 4 km x 4 km (8 cm at 1 : 50 000). Finished sheets are cached in
// topo_cache so the public servers are only asked once per sheet.

import { PNG } from 'pngjs'
import { GRID, terrainFromGrid, type Overlay, type Sheet } from '@/lib/testbuilder/topo'
import { serviceClient } from '@/lib/testbuilder/admin'

export const PLACES: { name: string; lat: number; lon: number }[] = [
  { name: 'Table Mountain, Cape Town', lat: -33.9628, lon: 18.4098 },
  { name: 'Lion’s Head and Signal Hill, Cape Town', lat: -33.935, lon: 18.388 },
  { name: 'Hartbeespoort and the Magaliesberg', lat: -25.76, lon: 27.88 },
  { name: 'Pilanesberg', lat: -25.25, lon: 27.1 },
  { name: 'Blyde River Canyon', lat: -24.57, lon: 30.8 },
  { name: 'Champagne Castle, Drakensberg', lat: -29.03, lon: 29.37 },
  { name: 'Cathedral Peak, Drakensberg', lat: -28.95, lon: 29.2 },
  { name: 'Swartberg Pass', lat: -33.32, lon: 22.05 },
  { name: 'Hogsback', lat: -32.59, lon: 26.94 },
]

export const CREDIT = '© OpenStreetMap contributors (ODbL); elevation: Mapzen terrain tiles (SRTM and other open data); Practice map, not an official NGI sheet.'

const Z = 13
const SHEET_M = 4000
const UA = 'CurioLearning/1.0 (https://curiolearning.co.za; practice maps)'
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

const worldPx = (lat: number, lon: number) => {
  const W = 256 * 2 ** Z, s = Math.sin((lat * Math.PI) / 180)
  return { x: ((lon + 180) / 360) * W, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * W }
}
const toLatLon = (x: number, y: number) => {
  const W = 256 * 2 ** Z, n = Math.PI - (2 * Math.PI * y) / W
  return { lat: (180 / Math.PI) * Math.atan(Math.sinh(n)), lon: (x / W) * 360 - 180 }
}

async function withTimeout(f: Fetcher, url: string, init: RequestInit = {}, ms = 20000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms)
  try { return await f(url, { ...init, signal: ctl.signal, headers: { 'User-Agent': UA, ...(init.headers ?? {}) } }) } finally { clearTimeout(t) }
}

/** Heights (metres) on a (GRID+1) x (GRID+1) grid covering the sheet. */
async function elevationGrid(f: Fetcher, lat: number, lon: number): Promise<{ h: number[][]; x0: number; y0: number; span: number } | null> {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** Z
  const span = SHEET_M / mpp, c = worldPx(lat, lon), x0 = c.x - span / 2, y0 = c.y - span / 2
  const tiles = new Map<string, PNG>()
  const need: [number, number][] = []
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + span) / 256); tx++) for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + span) / 256); ty++) need.push([tx, ty])
  if (need.length > 9) return null
  const got = await Promise.all(need.map(async ([tx, ty]) => {
    const r = await withTimeout(f, `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`)
    if (!r.ok) return null
    return { k: `${tx}:${ty}`, png: PNG.sync.read(Buffer.from(await r.arrayBuffer())) }
  }))
  for (const g of got) { if (!g) return null; tiles.set(g.k, g.png) }
  const at = (px: number, py: number) => {
    const tx = Math.floor(px / 256), ty = Math.floor(py / 256), t = tiles.get(`${tx}:${ty}`)
    if (!t) return NaN
    const ix = Math.min(255, Math.max(0, Math.floor(px - tx * 256))), iy = Math.min(255, Math.max(0, Math.floor(py - ty * 256))), o = (iy * 256 + ix) * 4
    return t.data[o]! * 256 + t.data[o + 1]! + t.data[o + 2]! / 256 - 32768
  }
  const bil = (px: number, py: number) => {
    const fx = px - 0.5, fy = py - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy
    return at(ix, iy) * (1 - tx) * (1 - ty) + at(ix + 1, iy) * tx * (1 - ty) + at(ix, iy + 1) * (1 - tx) * ty + at(ix + 1, iy + 1) * tx * ty
  }
  const raw: number[][] = []
  for (let j = 0; j <= GRID; j++) { raw[j] = []; for (let i = 0; i <= GRID; i++) raw[j]![i] = bil(x0 + (i / GRID) * span, y0 + (j / GRID) * span) }
  if (raw.some(r => r.some(v => !Number.isFinite(v)))) return null
  // One light smoothing pass: the source data is about 30 m, and contours should not look stepped.
  const h = raw.map((row, j) => row.map((_, i) => {
    let sum = 0, n = 0
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = raw[j + dj]?.[i + di]; if (v !== undefined) { sum += v * (di === 0 && dj === 0 ? 4 : 1); n += di === 0 && dj === 0 ? 4 : 1 } }
    return Math.round((sum / n) * 10) / 10
  }))
  return { h, x0, y0, span }
}

type OsmWay = { tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }
async function osmOverlay(f: Fetcher, g: { x0: number; y0: number; span: number }): Promise<Overlay> {
  const a = toLatLon(g.x0, g.y0 + g.span), b = toLatLon(g.x0 + g.span, g.y0)
  const bbox = `${a.lat.toFixed(5)},${a.lon.toFixed(5)},${b.lat.toFixed(5)},${b.lon.toFixed(5)}`
  const q = `[out:json][timeout:25];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|track)$"](${bbox});way["waterway"~"^(river|stream)$"](${bbox});way["building"](${bbox}););out geom 400;`
  const r = await withTimeout(f, 'https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) }, 28000)
  if (!r.ok) throw new Error(`overpass ${r.status}`)
  const j = (await r.json()) as { elements?: OsmWay[] }
  const scale = 480 / g.span
  const toMap = (p: { lat: number; lon: number }): [number, number] => { const w = worldPx(p.lat, p.lon); return [(w.x - g.x0) * scale, (w.y - g.y0) * scale] }
  const inside = (p: [number, number]) => p[0] >= 0 && p[0] <= 480 && p[1] >= 0 && p[1] <= 480
  const runs = (pts: [number, number][]) => { // split a way into the parts that lie on the sheet
    const out: [number, number][][] = []; let cur: [number, number][] = []
    for (const p of pts) { if (inside(p)) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = [] } }
    if (cur.length > 1) out.push(cur)
    return out
  }
  const ov: Overlay = { roads: [], water: [], buildings: [] }
  for (const w of j.elements ?? []) {
    const pts = (w.geometry ?? []).map(toMap)
    if (pts.length < 2) continue
    if (w.tags?.building) { const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]) as [number, number]; if (inside(c)) ov.buildings.push(c) }
    else if (w.tags?.waterway) ov.water.push(...runs(pts))
    else if (w.tags?.highway) ov.roads.push(...runs(pts))
  }
  return ov
}

type Stored = { h: number[][]; overlay: Overlay; place: string }

/** One real sheet, or null when the open data cannot be reached (callers then use the drawn map). */
export async function loadRealSheet(f: Fetcher = fetch, rng: () => number = Math.random): Promise<Sheet | null> {
  const sb = serviceClient()
  for (let attempt = 0; attempt < 3; attempt++) {
    const pl = PLACES[Math.floor(rng() * PLACES.length)]!
    const dx = Math.floor(rng() * 3) - 1, dy = Math.floor(rng() * 3) - 1
    // Move the sheet by whole kilometres so a handful of sheets per place can be cached.
    const lat = pl.lat + (dy * 2000) / 111320, lon = pl.lon + (dx * 2000) / (111320 * Math.cos((pl.lat * Math.PI) / 180))
    const key = `real:v1:${pl.name}:${dx}:${dy}`
    try {
      let st: Stored | null = null
      if (sb) { const { data } = await sb.from('topo_cache').select('data').eq('key', key).maybeSingle(); st = (data?.data as Stored | undefined) ?? null }
      if (!st) {
        const g = await elevationGrid(f, lat, lon)
        if (!g) continue
        const overlay = await osmOverlay(f, g).catch(() => ({ roads: [], water: [], buildings: [] }) as Overlay)
        st = { h: g.h, overlay, place: pl.name }
        const t0 = terrainFromGrid(st.h)
        if (t0.max - t0.min < 100) continue // too flat to make a good contour question
        if (sb) await sb.from('topo_cache').upsert({ key, data: st })
      }
      const terrain = terrainFromGrid(st.h)
      if (terrain.max - terrain.min < 100) continue
      return { terrain, overlay: st.overlay, credit: CREDIT, place: st.place }
    } catch (e) {
      console.error('[topo] real sheet failed', e)
    }
  }
  return null
}
