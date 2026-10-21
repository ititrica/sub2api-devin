import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { installRouteMotion } from '../routeMotion'

let dispose: (() => void) | undefined
let router: Router
function mockCapture() {
  const transitions: Array<{ capture: () => Promise<void>; finish: () => void; skipTransition: ReturnType<typeof vi.fn> }> = []
  const start = vi.fn((update: () => Promise<void>) => {
    let finish!: () => void
    const finished = new Promise<void>(resolve => { finish = resolve })
    const transition = { capture: update, finish, skipTransition: vi.fn(finish), finished, ready: Promise.resolve(), updateCallbackDone: Promise.resolve() }
    transitions.push(transition)
    return transition as unknown as ViewTransition
  })
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start })
  return { transitions, start }
}
async function setup() {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
  router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/one', component: { template: '<div>one</div>' } },
    { path: '/two', component: { template: '<div>two</div>' } },
    { path: '/three', component: { template: '<div>three</div>' } }
  ] })
  await router.push('/one')
  dispose = installRouteMotion(router)
  document.body.innerHTML = '<div class="site-route">Old page</div>'
}
afterEach(() => {
  dispose?.()
  document.body.replaceChildren()
  Reflect.deleteProperty(document, 'startViewTransition')
  vi.restoreAllMocks()
})
describe('page transitions', () => {
  it('keeps the previous route until it is captured, and waits for the committed route before revealing', async () => {
    await setup()
    const { transitions } = mockCapture()
    const navigation = router.push('/two')
    await vi.waitFor(() => expect(transitions).toHaveLength(1))
    expect(router.currentRoute.value.path).toBe('/one')
    const capture = transitions[0].capture()
    await navigation
    await capture
    expect(router.currentRoute.value.path).toBe('/two')
    expect(document.querySelector('.site-route')?.hasAttribute('data-route-revealed')).toBe(true)
    transitions[0].finish()
    await vi.waitFor(() => expect(document.documentElement.classList.contains('ef-routing')).toBe(false))
    // Prevent block entrance animations from replaying after the snapshot disappears.
    expect(document.querySelector('.site-route')?.hasAttribute('data-route-revealed')).toBe(true)
  })
  it('handles rapid navigation without stranding an earlier guard', async () => {
    await setup()
    const { transitions } = mockCapture()
    const first = router.push('/two')
    await vi.waitFor(() => expect(transitions).toHaveLength(1))
    const second = router.push('/three')
    await vi.waitFor(() => expect(transitions).toHaveLength(2))
    expect(transitions[0].skipTransition).toHaveBeenCalled()
    await transitions[1].capture()
    await Promise.all([first, second])
    expect(router.currentRoute.value.path).toBe('/three')
    transitions[1].finish()
  })
  it('does not animate query filters, reduced motion, or unsupported browsers', async () => {
    await setup()
    const { start } = mockCapture()
    await router.push('/one?filter=today')
    expect(start).not.toHaveBeenCalled()
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    await router.push('/two')
    expect(start).not.toHaveBeenCalled()
    Reflect.deleteProperty(document, 'startViewTransition')
    await router.push('/three')
    expect(router.currentRoute.value.path).toBe('/three')
  })
  it('continues navigation if snapshot capture throws', async () => {
    await setup()
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: () => { throw new Error('capture unavailable') } })
    await router.push('/two')
    expect(router.currentRoute.value.path).toBe('/two')
    expect(document.documentElement.classList.contains('ef-routing')).toBe(false)
  })
})
