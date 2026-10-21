import type { ObjectDirective } from 'vue'
import { reducedMotion, SNAP } from '@/utils/motion'
type Options = string | { selector: string; revision: unknown } | undefined
const controls = new WeakMap<HTMLElement, { schedule: () => void; cleanup: () => void }>()

/** Reveal visible results when data changes. Virtual scroll never restarts an entrance. */
export const motionRows: ObjectDirective<HTMLElement, Options> = {
  mounted(element, binding) {
    const selector = typeof binding.value === 'object' ? binding.value.selector : binding.value || '[data-row-id]'
    let previous = ''
    let frame = 0
    const animations = new Set<Animation>()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => { animations.forEach(animation => animation.cancel()); animations.clear() }
    const reveal = () => {
      const rows = [...element.querySelectorAll<HTMLElement>(selector)]
      const signature = rows.map(row => `${row.dataset.rowId || ''}:${row.textContent}`).join('|')
      if (signature === previous) return
      previous = signature
      stop()
      if (reducedMotion() || document.documentElement.classList.contains('ef-routing')) return
      const bounds = element.getBoundingClientRect()
      const visible = rows.filter(row => {
        const box = row.getBoundingClientRect()
        return box.height > 0 && box.bottom > Math.max(0, bounds.top) && box.top < Math.min(innerHeight, bounds.bottom)
      }).slice(0, 12)
      visible.forEach((row, index) => {
        if (!row.animate) return
        const animation = row.animate([
          { opacity: 0, transform: 'translateX(-10px)', clipPath: 'inset(0 100% 0 0)' },
          { opacity: 1, transform: 'none', clipPath: 'inset(0)' }
        ], { duration: 320, delay: Math.min(index, 8) * 38, easing: SNAP, fill: 'backwards' })
        animations.add(animation)
        animation.finished.catch(() => {}).finally(() => animations.delete(animation))
      })
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(reveal) }
    // Tables pass the complete result revision; their virtual DOM also changes on scroll.
    const observer = typeof binding.value === 'object' ? undefined : new MutationObserver(schedule)
    observer?.observe(element, { childList: true, subtree: true, characterData: true })
    media.addEventListener('change', stop)
    schedule()
    controls.set(element, { schedule, cleanup: () => { cancelAnimationFrame(frame); observer?.disconnect(); media.removeEventListener('change', stop); stop() } })
  },
  updated(element, binding) {
    if (typeof binding.value === 'object' && (typeof binding.oldValue !== 'object' || binding.value.revision !== binding.oldValue?.revision)) controls.get(element)?.schedule()
  },
  beforeUnmount(element) { controls.get(element)?.cleanup(); controls.delete(element) }
}
