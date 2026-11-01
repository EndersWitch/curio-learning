// Curio hooks. Inside a curio page (?embed=1) the tool hides its own chrome and tells the
// page when the learner finishes. Messages go to the same origin only.
export const embedded = new URLSearchParams(location.search).get('embed') === '1'

export function report(type, detail = {}) {
  if (!embedded || window.parent === window) return
  window.parent.postMessage({ source: 'curio-activity', tool: 'lines', type, ...detail }, location.origin)
}
