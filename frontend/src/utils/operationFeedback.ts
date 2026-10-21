import { reducedMotion } from './motion'
let lastAction: { element: HTMLElement; at: number } | undefined
export function captureOperation(event: MouseEvent) {
  const element = (event.target as Element | null)?.closest<HTMLElement>('button[type=submit], .btn, .endpoint-strip button')
  if (element && !element.closest('.site-toast')) lastAction = { element, at: performance.now() }
}
/** Called only for a confirmed success toast, never for a click alone. */
export function completeOperation() {
  if (!lastAction || performance.now() - lastAction.at > 60_000) return
  const { element } = lastAction
  lastAction = undefined
  if (!element.isConnected || reducedMotion()) return
  element.classList.remove('operation-done')
  // Restart the one-shot sweep without changing any Vue-owned label.
  requestAnimationFrame(() => {
    if (!element.isConnected || reducedMotion()) return
    element.classList.add('operation-done')
    element.addEventListener('animationend', () => element.classList.remove('operation-done'), { once: true })
  })
}
