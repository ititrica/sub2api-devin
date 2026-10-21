import { nextTick } from 'vue'
import type { Router, RouteLocationNormalized } from 'vue-router'
import { reducedMotion } from './motion'

interface NavigationTransition {
  to: RouteLocationNormalized
  transition?: ViewTransition
  release: () => void
  committed: () => void
}

/**
 * Snapshot the old page after guards and lazy imports finish, then commit the
 * navigation inside the browser's view-transition callback. The old snapshot
 * stays visible until the new page is ready, including its scroll position.
 */
export function installRouteMotion(router: Router) {
  let active: NavigationTransition | undefined
  const root = document.documentElement
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const skip = () => {
    active?.transition?.skipTransition()
    active?.release()
    active?.committed()
  }
  const onPreferenceChange = () => { if (media.matches) skip() }
  media.addEventListener('change', onPreferenceChange)

  const removeBefore = router.beforeResolve((to, from) => {
    // Query-only filters keep their component state and use local result feedback.
    if (!from.matched.length || to.path === from.path) return
    skip()
    if (reducedMotion() || !document.startViewTransition || root.classList.contains('ef-theming')) return

    return new Promise<void>(release => {
      let committed!: () => void
      const ready = new Promise<void>(resolve => { committed = resolve })
      const operation: NavigationTransition = { to, release, committed }
      active = operation
      root.classList.add('ef-routing')
      const cleanup = () => {
        if (active !== operation) return
        active = undefined
        root.classList.remove('ef-routing')
      }
      try {
        operation.transition = document.startViewTransition(async () => {
          // Keep route entrances suppressed for this rendered shell afterwards:
          // restoring CSS animations at the end would replay them and flash again.
          document.querySelector('.site-route')?.setAttribute('data-route-revealed', '')
          // Navigation can now commit; afterEach resolves once Vue has rendered.
          release()
          await ready
        })
        // A failed capture must never block navigation or leave a rejected promise.
        operation.transition.ready.catch(() => {})
        operation.transition.finished.catch(() => {}).finally(cleanup)
      } catch {
        release()
        committed()
        cleanup()
      }
    })
  })

  const removeAfter = router.afterEach(async (to, _from, failure) => {
    const operation = active
    if (!operation || operation.to !== to) return
    if (failure) operation.transition?.skipTransition()
    await nextTick()
    // Vue Router restores scroll after its own nextTick; let that microtask finish.
    await Promise.resolve()
    operation.committed()
  })
  const removeError = router.onError(skip)

  return () => {
    skip()
    active = undefined
    root.classList.remove('ef-routing')
    media.removeEventListener('change', onPreferenceChange)
    removeBefore()
    removeAfter()
    removeError()
  }
}
