import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { MECH, reducedMotion } from '@/utils/motion'

// One theme value across navigation, public pages, and embedded charts.
const isDark = ref(document.documentElement.classList.contains('dark'))
let changing = false

export function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}
export function initTheme() {
  const saved = localStorage.getItem('theme')
  applyTheme(saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches))
}
export function useTheme() {
  const sync = () => {
    const dark = document.documentElement.classList.contains('dark')
    isDark.value = dark
    if (document.documentElement.dataset.theme !== (dark ? 'dark' : 'light')) document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }
  let observer: MutationObserver | undefined
  onMounted(() => {
    sync()
    observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })
  onBeforeUnmount(() => observer?.disconnect())

  async function toggleTheme(event?: MouseEvent) {
    if (changing) return
    const dark = !isDark.value
    const commit = async () => {
      applyTheme(dark)
      localStorage.setItem('theme', dark ? 'dark' : 'light')
      await nextTick()
    }
    if (reducedMotion() || !document.startViewTransition) { await commit(); return }
    changing = true
    const root = document.documentElement
    const target = event?.currentTarget as HTMLElement | undefined
    const rect = target?.getBoundingClientRect()
    const x = rect ? rect.x + rect.width / 2 : innerWidth / 2
    const y = rect ? rect.y + rect.height / 2 : innerHeight / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    root.classList.add('ef-theming')
    const transition = document.startViewTransition(commit)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => { if (media.matches) transition.skipTransition() }
    media.addEventListener('change', stop)
    try {
      await transition.ready
      if (!reducedMotion()) {
        await root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, {
          duration: Math.min(600, Math.max(240, radius / 3)), easing: MECH,
          pseudoElement: '::view-transition-new(root)'
        }).finished
      }
    } catch { /* Superseded view transitions still commit the requested theme. */ }
    finally {
      await transition.finished.catch(() => {})
      media.removeEventListener('change', stop)
      root.classList.remove('ef-theming')
      changing = false
    }
  }
  return { isDark, toggleTheme }
}
