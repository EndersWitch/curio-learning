// Curio hooks. When the tool is shown inside a curio page (?embed=1) it hides its own
// chrome and tells the page when the learner finishes, so a quiz or Learning Zone card
// can react. Messages go to the same origin only.
export const embedded = new URLSearchParams(location.search).get('embed') === '1'

export function report(type: 'ready' | 'complete', detail: Record<string, unknown> = {}) {
  if (!embedded || window.parent === window) return
  window.parent.postMessage({ source: 'curio-activity', tool: 'fraction-fun', type, ...detail }, location.origin)
}
