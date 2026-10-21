import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettledText from '../SettledText.vue'

afterEach(() => vi.restoreAllMocks())
describe('animated readouts', () => {
  it('keeps accessible text stable and cancels stale readout frames on updates and unmount', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    vi.spyOn(performance, 'now').mockReturnValue(0)
    let tick!: FrameRequestCallback
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { tick = callback; return 42 })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const wrapper = mount(SettledText, { props: { value: '1,862' } })
    tick(100)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.sr-only').text()).toBe('1,862')
    expect(wrapper.get('[aria-hidden=true]').attributes('aria-hidden')).toBe('true')
    await wrapper.setProps({ value: '2,100' })
    expect(cancel).toHaveBeenCalledWith(42)
    tick(600)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-hidden=true]').text()).toBe('2,100')
    expect(wrapper.get('.sr-only').text()).toBe('2,100')
    expect(request).toHaveBeenCalled()
    wrapper.unmount()
    expect(cancel).toHaveBeenCalledWith(42)
  })
  it('renders the final value immediately and does not animate on hover when motion is reduced', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    const request = vi.spyOn(window, 'requestAnimationFrame')
    const wrapper = mount(SettledText, { props: { value: '84.26' } })
    await wrapper.trigger('pointerenter')
    expect(wrapper.get('[aria-hidden=true]').text()).toBe('84.26')
    expect(request).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
