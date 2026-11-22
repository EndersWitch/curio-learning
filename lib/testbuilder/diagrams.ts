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
export const DIAGRAM_IDS: string[] = DIAGRAMS.map(d => d.id)

// ---- eye (side view, front of the eye on the left) ----
const eyeParts: DiagramPart[] = [
  { name: 'Cornea', target: [141, 145], label: [40, 145] },
  { name: 'Iris', target: [171, 108], label: [100, 40] },
  { name: 'Pupil', target: [171, 145], label: [40, 235] },
  { name: 'Lens', target: [190, 125], label: [190, 25] },
  { name: 'Retina', target: [326, 120], label: [400, 70] },
  { name: 'Optic nerve', target: [370, 160], label: [400, 235] },
  { name: 'Sclera', target: [250, 56], label: [290, 22] },
]
const eyeBody = `
<rect x="330" y="150" width="75" height="20" rx="8" fill="#f2d16b" stroke="#8a6d1d" stroke-width="2"/>
<circle cx="240" cy="145" r="92" fill="#eaf4fb" stroke="#555" stroke-width="7"/>
<path d="M163 100 Q118 145 163 190" fill="#dff1fb" stroke="#4aa3c8" stroke-width="5"/>
<path d="M240 57 A88 88 0 0 1 240 233" fill="none" stroke="#c0392b" stroke-width="0"/>
<path d="${'M ' + (240 + 88 * Math.cos(-1.15)).toFixed(1) + ' ' + (145 + 88 * Math.sin(-1.15)).toFixed(1) + ' A 88 88 0 0 1 ' + (240 + 88 * Math.cos(1.15)).toFixed(1) + ' ' + (145 + 88 * Math.sin(1.15)).toFixed(1)}" fill="none" stroke="#c0392b" stroke-width="7"/>
<g fill="#5b3a29" stroke="#2b1a10" stroke-width="1.5"><rect x="166" y="98" width="11" height="30" rx="3"/><rect x="166" y="162" width="11" height="30" rx="3"/></g>
<ellipse cx="190" cy="145" rx="14" ry="34" fill="#cfe9f7" stroke="#4a7fa8" stroke-width="2.5"/>`

// ---- leaf cross-section ----
const leafParts: DiagramPart[] = [
  { name: 'Upper epidermis', target: [75, 52], label: [40, 18] },
  { name: 'Palisade mesophyll', target: [140, 92], label: [140, 18] },
  { name: 'Spongy mesophyll', target: [170, 156], label: [40, 270] },
  { name: 'Vein (xylem and phloem)', target: [285, 152], label: [405, 120] },
  { name: 'Lower epidermis', target: [340, 202], label: [405, 255] },
  { name: 'Stoma', target: [170, 203], label: [240, 270] },
]
const leafCells = (() => {
  let out = ''
  for (let x = 30; x < 410; x += 38) out += `<rect x="${x}" y="40" width="36" height="24" fill="#d9efc9" stroke="#3d7a45" stroke-width="1.6"/>`
  for (let x = 30; x < 410; x += 24) out += `<rect x="${x}" y="66" width="22" height="54" rx="6" fill="#8fd18a" stroke="#2f6b3a" stroke-width="1.4"/><circle cx="${x + 11}" cy="82" r="3.2" fill="#1f7a34"/><circle cx="${x + 11}" cy="100" r="3.2" fill="#1f7a34"/>`
  const pts = [[48, 140], [90, 152], [130, 138], [210, 150], [250, 140], [330, 148], [370, 140], [60, 175], [110, 178], [200, 176], [330, 176], [380, 172], [230, 180], [150, 168]]
  for (const [x, y] of pts) out += `<circle cx="${x}" cy="${y}" r="15" fill="#c8e8b4" stroke="#2f6b3a" stroke-width="1.2"/>`
  for (let x = 30; x < 410; x += 38) if (Math.abs(x + 18 - 170) > 36) out += `<rect x="${x}" y="192" width="36" height="22" fill="#d9efc9" stroke="#3d7a45" stroke-width="1.6"/>`
  out += `<circle cx="285" cy="152" r="26" fill="#fff" stroke="#6a4c93" stroke-width="2.4"/><circle cx="278" cy="148" r="9" fill="#e8d8a0" stroke="#8a6d1d" stroke-width="1.5"/><circle cx="294" cy="160" r="8" fill="#bcd7f0" stroke="#3b7dd8" stroke-width="1.5"/>`
  out += `<path d="M152 192 Q170 205 152 214 M188 192 Q170 205 188 214" fill="#7fc47a" stroke="#2f6b3a" stroke-width="2.4"/>`
  return out
})()
const leafBody = leafCells

// ---- neuron ----
const neuronParts: DiagramPart[] = [
  { name: 'Dendrites', target: [48, 100], label: [40, 30] },
  { name: 'Cell body', target: [112, 150], label: [112, 255] },
  { name: 'Nucleus', target: [118, 142], label: [190, 30] },
  { name: 'Axon', target: [200, 146], label: [230, 255] },
  { name: 'Myelin sheath', target: [262, 146], label: [300, 30] },
  { name: 'Axon terminal', target: [395, 118], label: [410, 255] },
]
const neuronBody = `
<g stroke="#6a4c93" stroke-width="3" fill="none" stroke-linecap="round"><path d="M85 130 L55 100 L35 85 M55 100 L38 112 M85 145 L45 150 L25 140 M45 150 L28 165 M88 165 L60 195 L40 205 M60 195 L48 214 M100 118 L88 85 L78 66"/></g>
<line x1="140" y1="148" x2="395" y2="148" stroke="#6a4c93" stroke-width="3.5"/>
<g fill="#f7e6a6" stroke="#8a6d1d" stroke-width="2"><rect x="165" y="134" width="50" height="28" rx="12"/><rect x="225" y="134" width="50" height="28" rx="12"/><rect x="285" y="134" width="50" height="28" rx="12"/></g>
<g stroke="#6a4c93" stroke-width="3" fill="none" stroke-linecap="round"><path d="M395 148 L405 125 M395 148 L412 148 M395 148 L405 170"/></g>
<g fill="#6a4c93"><circle cx="406" cy="122" r="5"/><circle cx="415" cy="148" r="5"/><circle cx="406" cy="173" r="5"/></g>
<ellipse cx="112" cy="148" rx="40" ry="35" fill="#e6dcf3" stroke="#6a4c93" stroke-width="3"/>
<circle cx="118" cy="142" r="14" fill="#9b7fc8" stroke="#4b2f7a" stroke-width="2"/>`

// ---- atom (Bohr model of carbon: 6 protons, 6 neutrons, 2 + 4 electrons) ----
const ballPos: [number, number][] = [[210, 133], [230, 133], [200, 148], [220, 148], [240, 148], [210, 163], [230, 163], [220, 120], [220, 176], [196, 128], [244, 128], [196, 168]]
const atomParts: DiagramPart[] = [
  { name: 'Proton', target: [ballPos[0]![0], ballPos[0]![1]], label: [60, 40] },
  { name: 'Neutron', target: [ballPos[1]![0], ballPos[1]![1]], label: [380, 40] },
  { name: 'Nucleus', target: [244, 158], label: [380, 255] },
  { name: 'Electron', target: [220 + 62, 145], label: [60, 255] },
  { name: 'Energy level (shell)', target: [220 - 108, 145], label: [60, 145] },
]
const atomBody = `
<g fill="none" stroke="#7a8aa0" stroke-width="1.8"><circle cx="220" cy="145" r="62"/><circle cx="220" cy="145" r="108"/></g>
<g fill="#2a5fa8" stroke="#fff" stroke-width="1.5"><circle cx="282" cy="145" r="7"/><circle cx="158" cy="145" r="7"/><circle cx="220" cy="37" r="7"/><circle cx="220" cy="253" r="7"/><circle cx="296" cy="69" r="7"/><circle cx="144" cy="221" r="7"/></g>
${ballPos.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="10" fill="${i % 2 === 0 ? '#d93b2b' : '#9aa0a6'}" stroke="#222" stroke-width="1.2"/>`).join('')}`

// ---- lungs (front view) ----
const lungParts: DiagramPart[] = [
  { name: 'Trachea', target: [220, 45], label: [320, 22] },
  { name: 'Bronchus', target: [188, 112], label: [320, 70] },
  { name: 'Lung', target: [120, 150], label: [30, 100] },
  { name: 'Bronchiole', target: [130, 160], label: [30, 205] },
  { name: 'Alveoli', target: [298, 188], label: [410, 205] },
  { name: 'Diaphragm', target: [220, 262], label: [330, 270] },
]
const lungBody = `
<path d="M205 150 C170 80 80 90 80 175 C80 225 120 245 190 238 C205 232 208 190 205 150 Z" fill="#f8cfc6" stroke="#b34a3a" stroke-width="3"/>
<path d="M235 150 C270 80 360 90 360 175 C360 225 320 245 250 238 C235 232 232 190 235 150 Z" fill="#f8cfc6" stroke="#b34a3a" stroke-width="3"/>
<path d="M60 262 Q220 215 380 262" fill="none" stroke="#7a4a8a" stroke-width="6"/>
<rect x="212" y="30" width="16" height="70" rx="5" fill="#cfe3f5" stroke="#3b6fa0" stroke-width="2.5"/>
<g stroke="#3b6fa0" stroke-width="7" fill="none" stroke-linecap="round"><path d="M220 100 L190 124 L150 150 L120 175"/><path d="M220 100 L250 124 L290 150 L320 175"/></g>
<g stroke="#3b6fa0" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M175 135 L170 105 M160 142 L128 128 M145 157 L142 190 M135 165 L110 160"/><path d="M265 135 L270 105 M280 142 L312 128 M295 157 L298 190"/></g>
<g fill="#f3a8a0" stroke="#b34a3a" stroke-width="1.6"><circle cx="292" cy="186" r="7"/><circle cx="305" cy="186" r="7"/><circle cx="298" cy="198" r="7"/></g>`

// ---- digestive system (simplified) ----
const digParts: DiagramPart[] = [
  { name: 'Oesophagus', target: [232, 62], label: [330, 25] },
  { name: 'Liver', target: [175, 118], label: [60, 70] },
  { name: 'Stomach', target: [260, 118], label: [390, 80] },
  { name: 'Small intestine', target: [225, 190], label: [60, 175] },
  { name: 'Large intestine', target: [300, 215], label: [395, 190] },
  { name: 'Rectum', target: [225, 262], label: [330, 270] },
]
const digBody = `
<rect x="226" y="20" width="12" height="62" rx="5" fill="#f4c9a8" stroke="#a0561c" stroke-width="2.5"/>
<path d="M175 90 C130 95 125 150 175 150 C210 150 235 130 232 100 C225 85 200 88 175 90 Z" fill="#a0522d" stroke="#5c2a10" stroke-width="2.5"/>
<path d="M236 82 C285 80 310 110 292 140 C275 160 245 150 238 130 C232 112 236 95 236 82 Z" fill="#f2b8b0" stroke="#b34a3a" stroke-width="2.8"/>
<path d="M170 205 L270 205 L270 235 L170 235 Z" fill="none" stroke="#b34a3a" stroke-width="0"/>
<path d="M175 170 C215 160 275 168 285 178 M285 178 C300 190 250 200 185 192 M185 192 C160 198 170 215 215 212 M215 212 C265 208 275 226 235 232" fill="none" stroke="#e08a6a" stroke-width="12" stroke-linecap="round"/>
<path d="M150 255 L150 160 Q150 150 160 150 M150 160 L150 150 M150 150 L150 130 M150 130 Q250 118 330 140 L330 255 M330 255 L330 140" fill="none" stroke="#8a5a2b" stroke-width="0"/>
<path d="M312 245 L312 175 Q312 160 295 160 M312 175 L312 172" fill="none" stroke="#7a5a3a" stroke-width="0"/>
<path d="M330 255 L330 165 Q330 152 315 152 M150 255 L150 165" fill="none" stroke="#7a5a3a" stroke-width="0"/>
<path d="M145 246 L145 168 Q145 156 160 156 L300 156 Q330 156 330 180 L330 246" fill="none" stroke="#8d6b3b" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="219" y="246" width="12" height="26" rx="5" fill="#8d6b3b" stroke="#5a4020" stroke-width="2"/>`

export const MORE_DIAGRAMS: Diagram[] = [
  { id: 'eye', title: 'Eye', minGrade: 7, parts: eyeParts, svg: n => wrap(eyeBody + pins(eyeParts, n)), use: 'Grades 7-11 natural sciences/life sciences: label the parts of the human eye.' },
  { id: 'leaf', title: 'Leaf (cross-section)', minGrade: 8, parts: leafParts, svg: n => wrap(leafBody + pins(leafParts, n)), use: 'Grades 8-11 natural sciences/life sciences: label the tissues in a leaf cross-section.' },
  { id: 'neuron', title: 'Neuron (nerve cell)', minGrade: 8, parts: neuronParts, svg: n => wrap(neuronBody + pins(neuronParts, n)), use: 'Grades 8-12 life sciences: label the parts of a neuron.' },
  { id: 'atom', title: 'Atom (carbon)', minGrade: 8, parts: atomParts, svg: n => wrap(atomBody + pins(atomParts, n)), use: 'Grades 8-10 natural sciences/physical sciences: label the parts of an atom.' },
  { id: 'lungs', title: 'Breathing system', minGrade: 7, parts: lungParts, svg: n => wrap(lungBody + pins(lungParts, n)), use: 'Grades 7-11 natural sciences/life sciences: label the parts of the breathing (respiratory) system.' },
  { id: 'digestive', title: 'Digestive system', minGrade: 7, parts: digParts, svg: n => wrap(digBody + pins(digParts, n)), use: 'Grades 7-11 natural sciences/life sciences: label the organs of the digestive system.' },
]
DIAGRAMS.push(...MORE_DIAGRAMS)
DIAGRAM_IDS.push(...MORE_DIAGRAMS.map(d => d.id))
