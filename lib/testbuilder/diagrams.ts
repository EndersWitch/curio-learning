// Labelled-diagram drawings. Each diagram draws itself and knows where every
// part is, so code can put numbered pins on it and mark the answers.

export interface DiagramPart { name: string; target: [number, number]; label: [number, number] }
export interface Diagram { id: string; title: string; minGrade: number; svg: (pins: Map<string, number>) => string; parts: DiagramPart[]; use: string }

const INK = '#222'
const W = 440, H = 290

function wrap(body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`
}
function pins(parts: DiagramPart[], numbers: Map<string, number>): string {
  return parts.filter(p => numbers.has(p.name)).map(p => {
    const n = numbers.get(p.name)!
    return `<line x1="${p.label[0]}" y1="${p.label[1]}" x2="${p.target[0]}" y2="${p.target[1]}" stroke="${INK}" stroke-width="1.5"/>` +
      `<circle cx="${p.target[0]}" cy="${p.target[1]}" r="3" fill="${INK}"/>` +
      `<circle cx="${p.label[0]}" cy="${p.label[1]}" r="12" fill="#fff" stroke="${INK}" stroke-width="1.8"/>` +
      `<text x="${p.label[0]}" y="${p.label[1] + 4.5}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="${INK}">${n}</text>`
  }).join('')
}

// ---- animal cell ----
const animalParts: DiagramPart[] = [
  { name: 'Cell membrane', target: [92, 150], label: [30, 150] },
  { name: 'Nucleus', target: [185, 112], label: [150, 20] },
  { name: 'Cytoplasm', target: [320, 175], label: [410, 215] },
  { name: 'Mitochondrion', target: [290, 115], label: [410, 80] },
  { name: 'Nucleolus', target: [215, 142], label: [330, 20] },
]
const animalBody = `
<ellipse cx="220" cy="150" rx="130" ry="100" fill="#fdf1e0" stroke="#b2431f" stroke-width="3"/>
<circle cx="205" cy="135" r="38" fill="#e6dcf3" stroke="#6a4c93" stroke-width="2.5"/>
<circle cx="215" cy="142" r="11" fill="#6a4c93"/>
<g fill="#f6c9b3" stroke="#b2431f" stroke-width="2"><ellipse cx="290" cy="115" rx="24" ry="12" transform="rotate(-25 290 115)"/><ellipse cx="150" cy="205" rx="24" ry="12" transform="rotate(20 150 205)"/></g>
<g fill="none" stroke="#b2431f" stroke-width="1.5"><path d="M272 119 q6 -10 12 0 t12 -4 t10 -6" transform="rotate(-25 290 115)"/><path d="M132 209 q6 -10 12 0 t12 -4 t10 -6" transform="rotate(20 150 205)"/></g>`

// ---- plant cell ----
const plantParts: DiagramPart[] = [
  { name: 'Cell wall', target: [60, 140], label: [22, 140] },
  { name: 'Cell membrane', target: [74, 205], label: [22, 255] },
  { name: 'Nucleus', target: [335, 100], label: [410, 40] },
  { name: 'Vacuole', target: [185, 145], label: [185, 22] },
  { name: 'Chloroplast', target: [350, 205], label: [410, 255] },
  { name: 'Cytoplasm', target: [105, 90], label: [105, 22] },
]
const plantBody = `
<rect x="60" y="50" width="320" height="210" rx="14" fill="#fff" stroke="#3d7a45" stroke-width="9"/>
<rect x="74" y="64" width="292" height="182" rx="8" fill="#f1f8e9" stroke="#222" stroke-width="1.5"/>
<rect x="130" y="95" width="125" height="120" rx="30" fill="#d6ecfa" stroke="#3b7dd8" stroke-width="2"/>
<circle cx="335" cy="100" r="28" fill="#e6dcf3" stroke="#6a4c93" stroke-width="2.5"/><circle cx="341" cy="106" r="8" fill="#6a4c93"/>
<g fill="#6fbf73" stroke="#2f6b3a" stroke-width="2"><ellipse cx="350" cy="205" rx="22" ry="12"/><ellipse cx="290" cy="170" rx="20" ry="11" transform="rotate(30 290 170)"/><ellipse cx="105" cy="200" rx="21" ry="11" transform="rotate(-20 105 200)"/></g>`

// ---- flower ----
const flowerParts: DiagramPart[] = [
  { name: 'Petal', target: [128, 120], label: [30, 90] },
  { name: 'Anther', target: [180, 100], label: [95, 25] },
  { name: 'Filament', target: [188, 135], label: [30, 175] },
  { name: 'Stigma', target: [240, 62], label: [240, 20] },
  { name: 'Style', target: [240, 110], label: [330, 25] },
  { name: 'Ovary', target: [240, 180], label: [410, 150] },
  { name: 'Sepal', target: [196, 224], label: [95, 262] },
  { name: 'Stem', target: [240, 270], label: [330, 270] },
]
const flowerBody = `
<line x1="240" y1="215" x2="240" y2="285" stroke="#3d7a45" stroke-width="8"/>
<g fill="#f7b6d2" stroke="#b02b6a" stroke-width="2"><ellipse cx="135" cy="125" rx="30" ry="62" transform="rotate(-22 135 125)"/><ellipse cx="345" cy="125" rx="30" ry="62" transform="rotate(22 345 125)"/></g>
<g stroke="#8a6d1d" stroke-width="3" fill="none"><line x1="225" y1="185" x2="188" y2="115"/><line x1="255" y1="185" x2="292" y2="115"/></g>
<g fill="#e0a73a" stroke="#8a6d1d" stroke-width="2"><ellipse cx="182" cy="102" rx="9" ry="14" transform="rotate(-25 182 102)"/><ellipse cx="298" cy="102" rx="9" ry="14" transform="rotate(25 298 102)"/></g>
<line x1="240" y1="150" x2="240" y2="75" stroke="#3d7a45" stroke-width="5"/>
<circle cx="240" cy="66" r="10" fill="#c97b7b" stroke="#8a3a3a" stroke-width="2"/>
<ellipse cx="240" cy="182" rx="26" ry="34" fill="#a9d68b" stroke="#3d7a45" stroke-width="2.5"/>
<g fill="#6fbf73" stroke="#2f6b3a" stroke-width="2"><ellipse cx="205" cy="226" rx="30" ry="9" transform="rotate(-14 205 226)"/><ellipse cx="275" cy="226" rx="30" ry="9" transform="rotate(14 275 226)"/></g>`

// ---- heart (simplified, front view: the patient's right side is on the left of the picture) ----
const heartParts: DiagramPart[] = [
  { name: 'Right atrium', target: [165, 140], label: [30, 120] },
  { name: 'Left atrium', target: [305, 125], label: [410, 120] },
  { name: 'Right ventricle', target: [180, 205], label: [30, 255] },
  { name: 'Left ventricle', target: [290, 210], label: [410, 255] },
  { name: 'Aorta', target: [262, 52], label: [345, 22] },
  { name: 'Pulmonary artery', target: [190, 50], label: [105, 22] },
  { name: 'Vena cava', target: [118, 95], label: [30, 40] },
  { name: 'Pulmonary vein', target: [372, 128], label: [410, 60] },
]
const heartBody = `
<path d="M215 85 C150 80 120 120 130 170 C140 225 190 262 220 272 C250 262 320 235 332 175 C342 120 300 82 215 85 Z" fill="#fbe9e7" stroke="#222" stroke-width="2.5"/>
<path d="M215 90 L222 270" stroke="#222" stroke-width="2.5" fill="none"/>
<path d="M135 150 C170 165 200 160 218 150 M222 150 C255 165 320 150 330 140" stroke="#222" stroke-width="2" fill="none"/>
<g fill="#aac4e8" stroke="#222" stroke-width="1" opacity=".75"><path d="M140 120 C150 100 190 92 214 96 L216 148 C190 160 160 160 138 148 Z"/><path d="M140 160 C150 200 190 250 220 268 L218 156 C195 162 160 162 140 160 Z"/></g>
<g fill="#e8a7a0" stroke="#222" stroke-width="1" opacity=".75"><path d="M226 96 C260 92 318 98 328 128 C318 148 260 160 224 152 Z"/><path d="M224 160 C280 164 322 156 328 172 C322 225 270 252 223 270 Z"/></g>
<path d="M243 90 C243 50 262 38 285 48 C310 58 318 100 316 130" stroke="#c0392b" stroke-width="16" fill="none" stroke-linecap="round"/>
<g stroke="#2a5fa8" stroke-width="15" fill="none" stroke-linecap="round"><path d="M200 92 C196 68 180 52 165 40"/><path d="M200 92 C206 70 225 56 238 56"/></g>
<path d="M150 112 C128 100 118 70 118 40" stroke="#2a5fa8" stroke-width="15" fill="none" stroke-linecap="round"/>
<path d="M330 135 L385 128" stroke="#c0392b" stroke-width="14" fill="none" stroke-linecap="round"/>`

export const DIAGRAMS: Diagram[] = [
  { id: 'animalCell', title: 'Animal cell', minGrade: 6, parts: animalParts, svg: n => wrap(animalBody + pins(animalParts, n)), use: 'Grades 6-9 natural sciences: label the parts of an animal cell.' },
  { id: 'plantCell', title: 'Plant cell', minGrade: 6, parts: plantParts, svg: n => wrap(plantBody + pins(plantParts, n)), use: 'Grades 6-9 natural sciences/life sciences: label the parts of a plant cell.' },
  { id: 'flower', title: 'Flower', minGrade: 6, parts: flowerParts, svg: n => wrap(flowerBody + pins(flowerParts, n)), use: 'Grades 6-10 natural sciences/life sciences: label the parts of a flower.' },
  { id: 'heart', title: 'Heart', minGrade: 7, parts: heartParts, svg: n => wrap(heartBody + pins(heartParts, n)), use: 'Grades 7-11 natural sciences/life sciences: label the chambers and vessels of the heart.' },
]
export const DIAGRAM_IDS = DIAGRAMS.map(d => d.id)
