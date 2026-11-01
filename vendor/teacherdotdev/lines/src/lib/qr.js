// The shareable link as a QR code, so a class can point their devices at the
// board instead of typing a long address. The encoding comes from
// `qrcode-generator`; this file only turns its grid into an SVG path.

import qrcode from 'qrcode-generator'

// Blank margin around the code, in modules. Scanners need it to find the edges.
const QUIET = 4

export function makeQr(text) {
  const code = qrcode(0, 'M')
  code.addData(text)
  code.make()
  const count = code.getModuleCount()
  let path = ''
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (code.isDark(r, c)) path += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
    }
  }
  return { extent: count + QUIET * 2, path }
}

/** The same code as a PNG blob, large enough to print or paste into a slide. */
export function qrPng(text, modulePixels = 10) {
  const code = qrcode(0, 'M')
  code.addData(text)
  code.make()
  const count = code.getModuleCount()
  const side = (count + QUIET * 2) * modulePixels
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, side, side)
  ctx.fillStyle = '#000'
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (code.isDark(r, c)) {
        ctx.fillRect((c + QUIET) * modulePixels, (r + QUIET) * modulePixels, modulePixels, modulePixels)
      }
    }
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not draw the QR code'))), 'image/png'),
  )
}
