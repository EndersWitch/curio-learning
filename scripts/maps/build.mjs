import fs from 'fs'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const world = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'))
const countries = feature(world, world.objects.countries).features.filter(c => c.geometry)
const za = JSON.parse(fs.readFileSync("za.json")).features

const AFRICA = ['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Cape Verde','Central African Rep.','Chad','Comoros','Congo','Dem. Rep. Congo',"Côte d'Ivoire",'Djibouti','Egypt','Eq. Guinea','Eritrea','eSwatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','Senegal','Sierra Leone','Somalia','South Africa','S. Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','W. Sahara','Zambia','Zimbabwe']
const names = countries.map(c => c.properties.name)
console.log('missing', AFRICA.filter(n => !names.includes(n)))

function rdp(pts, eps) {
  if (pts.length < 3) return pts
  let dmax = 0, idx = 0
  const [a, b] = [pts[0], pts[pts.length - 1]]
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > eps) return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
  return [a, b]
}
// projected geometry → simplified path
function pathFor(geom, proj, eps) {
  const rings = []
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  for (const poly of polys) for (const ring of poly) {
    const pts = ring.map(c => proj(c)).filter(Boolean)
    let s
    if (pts.length > 4) { let fi = 0, fd = 0; pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > fd) { fd = d; fi = i } }); s = [...rdp(pts.slice(0, fi + 1), eps).slice(0, -1), ...rdp([...pts.slice(fi)], eps)] } else s = pts
    if (s.length >= 4) rings.push(s)
  }
  return rings.map(r => 'M' + r.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L') + 'Z').join('')
}
const area = r => Math.abs(r.reduce((s, p, i) => s + (p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1]), 0) / 2)
const cen = (geom, proj) => {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  let best = null, ba = -1
  for (const poly of polys) { const r = poly[0].map(c => proj(c)); const a = area(r); if (a > ba) { ba = a; best = r } }
  const x = best.reduce((s, p) => s + p[0], 0) / best.length, y = best.reduce((s, p) => s + p[1], 0) / best.length
  return [x, y]
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

// Drop far-off specks (Prince Edward Islands and the like) so the map fills the frame.
function tidy(f) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const keep = polys.filter(p => {
    const lons = p[0].map(c => c[0]), lats = p[0].map(c => c[1])
    const w = Math.max(...lons) - Math.min(...lons), h = Math.max(...lats) - Math.min(...lats)
    const cx = lons.reduce((a, b) => a + b, 0) / lons.length, cy = lats.reduce((a, b) => a + b, 0) / lats.length
    return w * h > 0.15 && cx > -26 && cx < 52 && cy > -36 && cy < 38
  })
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: keep } }
}
za.forEach((f, i) => { za[i] = tidy(f) })
for (let i = 0; i < countries.length; i++) countries[i] = tidy(countries[i])
const out = {}
// ── South Africa ──
{
  const fc = { type: 'FeatureCollection', features: za }
  const W = 600, H = 480
  const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], fc)
  const regions = za.map(f => {
    const name = f.properties.name
    const [cx, cy] = cen(f.geometry, proj)
    return { id: slug(name), name, d: pathFor(f.geometry, proj, 0.5), cx: +cx.toFixed(1), cy: +cy.toFixed(1) }
  })
  const around = countries.filter(c => ['Lesotho', 'eSwatini', 'Namibia', 'Botswana', 'Zimbabwe', 'Mozambique'].includes(c.properties.name))
  const context = around.map(c => pathFor(c.geometry, proj, 0.6)).join('')
  out.za = { viewBox: [W, H], regions, context, project: null }
  out._zaProj = proj
}
// ── Africa ──
{
  const feats = countries.filter(c => AFRICA.includes(c.properties.name) && c.geometry.coordinates.length > 0)
  const fc = { type: 'FeatureCollection', features: feats }
  const W = 560, H = 600
  const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], fc)
  const regions = feats.map(f => {
    const name = f.properties.name
    const [cx, cy] = cen(f.geometry, proj)
    return { id: slug(name), name, d: pathFor(f.geometry, proj, 0.7), cx: +cx.toFixed(1), cy: +cy.toFixed(1) }
  })
  out.africa = { viewBox: [W, H], regions, context: '' }
  out._afProj = proj
}
const PLACES_ZA = {
  johannesburg: ['Johannesburg', -26.2041, 28.0473], pretoria: ['Pretoria', -25.7479, 28.2293], cape_town: ['Cape Town', -33.9249, 18.4241],
  durban: ['Durban', -29.8587, 31.0218], bloemfontein: ['Bloemfontein', -29.0852, 26.1596], polokwane: ['Polokwane', -23.9045, 29.4689],
  mbombela: ['Mbombela', -25.4753, 30.9694], mahikeng: ['Mahikeng', -25.856, 25.6403], kimberley: ['Kimberley', -28.7282, 24.7499],
  pietermaritzburg: ['Pietermaritzburg', -29.6006, 30.3794], bhisho: ['Bhisho', -32.8472, 27.4422], gqeberha: ['Gqeberha', -33.9608, 25.6022],
  east_london: ['East London', -33.0153, 27.9116], upington: ['Upington', -28.4478, 21.2561], richards_bay: ['Richards Bay', -28.7807, 32.0383], george: ['George', -33.963, 22.4617],
}
const PLACES_AF = {
  cairo: ['Cairo', 30.0444, 31.2357], nairobi: ['Nairobi', -1.2921, 36.8219], abuja: ['Abuja', 9.0765, 7.3986], addis_ababa: ['Addis Ababa', 9.03, 38.74],
  kinshasa: ['Kinshasa', -4.4419, 15.2663], luanda: ['Luanda', -8.839, 13.289], windhoek: ['Windhoek', -22.5609, 17.0658], harare: ['Harare', -17.8252, 31.0335],
  lusaka: ['Lusaka', -15.3875, 28.3228], maputo: ['Maputo', -25.9692, 32.5732], dodoma: ['Dodoma', -6.163, 35.7516], antananarivo: ['Antananarivo', -18.8792, 47.5079],
  accra: ['Accra', 5.6037, -0.187], rabat: ['Rabat', 34.02, -6.84], algiers: ['Algiers', 36.7538, 3.0588], tunis: ['Tunis', 36.8065, 10.1815],
  dakar: ['Dakar', 14.7167, -17.4677], khartoum: ['Khartoum', 15.5007, 32.5599], kampala: ['Kampala', 0.3476, 32.5825], gaborone: ['Gaborone', -24.6282, 25.9231], pretoria: ['Pretoria', -25.7479, 28.2293],
}
const place = (proj, P) => Object.entries(P).map(([id, [name, lat, lon]]) => { const [x, y] = proj([lon, lat]); return { id, name, x: +x.toFixed(1), y: +y.toFixed(1) } })
out.za.places = place(out._zaProj, PLACES_ZA)
out.africa.places = place(out._afProj, PLACES_AF)
delete out._zaProj; delete out._afProj; delete out.za.project
const ts = `// GENERATED by scripts/maps/build.mjs from Natural Earth (public domain). Do not edit by hand.
export interface MapRegion { id: string; name: string; d: string; cx: number; cy: number }
export interface MapPlace { id: string; name: string; x: number; y: number }
export interface MapDef { viewBox: [number, number]; regions: MapRegion[]; context: string; places: MapPlace[] }
export const MAPS: Record<'za' | 'africa', MapDef> = ${JSON.stringify(out)}
`
fs.writeFileSync('mapData.ts', ts)
console.log('size', (ts.length / 1024).toFixed(0), 'KB', 'za', out.za.regions.length, 'af', out.africa.regions.length)
