import { afterEach, describe, expect, it, vi } from 'vitest'
import { switchPanel } from '../motion'

function fixture() {
  let reduce = false
  let change: (() => void) | undefined
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    get matches() { return reduce },
    addEventListener: (_event: string, listener: () => void) => { change = listener },
    removeEventListener: vi.fn()
  }) as unknown as MediaQueryList)
  const element = document.createElement('div')
  document.body.append(element)
  const animations: { finish: () => void; cancel: ReturnType<typeof vi.fn>; finished: Promise<void> }[] = []
  element.animate = vi.fn(() => {
    let finish!: () => void
    let reject!: (error: Error) => void
    const finished = new Promise<void>((resolve, fail) => { finish = resolve; reject = fail })
    const animation = { finished, finish, cancel: vi.fn(() => reject(new Error('cancelled'))) }
    animations.push(animation)
    return animation as unknown as Animation
  })
  return { element, animations, reduce: () => { reduce = true; change?.() } }
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks() })
describe('settings transitions', () => {
  it('commits only the latest tab during rapid navigation', async () => {
    const { element, animations } = fixture()
    const first = vi.fn(async () => {})
    const last = vi.fn(async () => {})
    const pending = switchPanel(element, first)
    const latest = switchPanel(element, last)
    expect(animations[0].cancel).toHaveBeenCalled()
    animations[1].finish()
    await vi.waitFor(() => expect(animations).toHaveLength(3))
    animations[2].finish()
    await Promise.all([pending, latest])
    expect(first).not.toHaveBeenCalled()
    expect(last).toHaveBeenCalledOnce()
  })
  it('commits immediately without animation under reduced motion', async () => {
    const { element, reduce } = fixture()
    reduce()
    const commit = vi.fn(async () => {})
    await switchPanel(element, commit)
    expect(element.animate).not.toHaveBeenCalled()
    expect(commit).toHaveBeenCalledOnce()
  })
  it('finishes content changes when reduced motion is enabled mid-transition', async () => {
    const { element, animations, reduce } = fixture()
    const commit = vi.fn(async () => {})
    const pending = switchPanel(element, commit)
    reduce()
    await pending
    expect(animations[0].cancel).toHaveBeenCalled()
    expect(animations).toHaveLength(1)
    expect(commit).toHaveBeenCalledOnce()
  })
})
