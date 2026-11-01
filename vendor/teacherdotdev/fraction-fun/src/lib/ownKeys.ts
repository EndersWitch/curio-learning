/**
 * The app reads Enter and Space on the window to press its step button. Chrome
 * controls (help, the teacher.dev menu) take this so those keys press them instead.
 */
export function ownKeys(node: HTMLElement) {
  const onkeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
  }
  node.addEventListener('keydown', onkeydown)
  return () => node.removeEventListener('keydown', onkeydown)
}
