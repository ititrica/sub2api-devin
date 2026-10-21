import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DistributionBars from '../DistributionBars.vue'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
describe('DistributionBars', () => {
  it('shows shares based on the complete series and keeps labels accessible', () => {
    const wrapper = mount(DistributionBars, { props: { labels: ['model-a', 'model-b'], values: [750, 250] } })
    expect(wrapper.findAll('.distribution-percent').map(item => item.text())).toEqual(['75%', '25%'])
    expect(wrapper.get('.distribution-row').attributes('aria-label')).toContain('model-a')
  })
  it('keeps zero and invalid data finite', () => {
    const wrapper = mount(DistributionBars, { props: { labels: ['a', 'b', 'c'], values: [0, Number.NaN, -2] } })
    expect(wrapper.findAll('.distribution-percent').map(item => item.text())).toEqual(['0%', '0%', '0%'])
    expect(wrapper.html()).not.toContain('NaN')
  })
  it('emits the selected record for keyboard accessible drilldown', async () => {
    const wrapper = mount(DistributionBars, { props: { labels: ['alpha'], values: [12.5], metric: 'actual_cost', interactive: true } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[0]])
    expect(wrapper.get('button').attributes('aria-label')).toContain('$12.50')
  })
})
