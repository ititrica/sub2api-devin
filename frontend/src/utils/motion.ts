/** Shared mechanical motion. Every animation is finite and can be cancelled. */
export const SNAP = 'cubic-bezier(.16,1,.3,1)'
export const MECH = 'cubic-bezier(.7,0,.2,1)'
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true

const switches = new WeakMap<HTMLElement, { animation?: Animation }>()
export async function switchPanel(element: HTMLElement | null, commit: () => Promise<unknown>) {
  if (!element) { await commit(); return }
  switches.get(element)?.animation?.cancel()
  const operation: { animation?: Animation } = {}
  switches.set(element, operation)
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const stop = () => { if (media.matches) operation.animation?.cancel() }
  media.addEventListener('change', stop)
  try {
    if (!reducedMotion() && element.animate) {
      operation.animation = element.animate([
        { clipPath: 'inset(0)', opacity: 1 },
        { clipPath: 'inset(0 0 100% 0)', opacity: 0 }
      ], { duration: 180, easing: MECH, fill: 'forwards' })
      await operation.animation.finished.catch(() => {})
    }
    if (switches.get(element) !== operation) return
    await commit()
    operation.animation?.cancel()
    if (!element.isConnected || reducedMotion() || !element.animate) return
    operation.animation = element.animate([
      { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
      { clipPath: 'inset(0)', opacity: 1 }
    ], { duration: 280, easing: MECH })
    await operation.animation.finished.catch(() => {})
  } finally {
    operation.animation?.cancel()
    media.removeEventListener('change', stop)
    if (switches.get(element) === operation) switches.delete(element)
  }
}
