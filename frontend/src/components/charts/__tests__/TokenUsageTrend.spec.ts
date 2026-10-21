import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import TokenUsageTrend from '../TokenUsageTrend.vue'

const messages: Record<string, string> = {
  'admin.dashboard.tokenUsageTrend': 'Token Usage Trend',
  'admin.dashboard.noDataAvailable': 'No data available',
}

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  }
})

vi.mock('vue-chartjs', () => ({
  Chart: {
    name: 'Chart',
    props: ['data', 'options'],
    template: '<div class="chart-data">{{ JSON.stringify(data) }}</div>',
  },
}))

describe('TokenUsageTrend', () => {
  it('calculates cache hit rate against all prompt tokens', () => {
    const wrapper = mount(TokenUsageTrend, {
      props: {
        trendData: [
          {
            date: '2026-05-08',
            requests: 1,
            input_tokens: 500,
            output_tokens: 100,
            cache_creation_tokens: 0,
            cache_read_tokens: 1500,
            cost: 0.01,
            actual_cost: 0.005,
          },
        ],
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const tooltip = wrapper.findComponent({ name: 'Chart' }).props('options').plugins.tooltip
    const details = tooltip.callbacks.afterBody([{ dataIndex: 0 }])
    // Hit rate = 1500 / (500 + 1500 + 0) * 100 = 75%
    expect(details.at(-1)).toContain('75.0%')
    expect(wrapper.get('.trend-footer').text()).toContain('75.0%')
  })

  it('returns 0 hit rate when all prompt tokens are zero', () => {
    const wrapper = mount(TokenUsageTrend, {
      props: {
        trendData: [
          {
            date: '2026-05-08',
            requests: 0,
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_tokens: 0,
            cache_read_tokens: 0,
            cost: 0,
            actual_cost: 0,
          },
        ],
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const tooltip = wrapper.findComponent({ name: 'Chart' }).props('options').plugins.tooltip
    const details = tooltip.callbacks.afterBody([{ dataIndex: 0 }])
    expect(details.at(-1)).toContain('0.0%')
  })

  it('includes cache_creation_tokens in denominator for Anthropic models', () => {
    const wrapper = mount(TokenUsageTrend, {
      props: {
        trendData: [
          {
            date: '2026-05-08',
            requests: 1,
            input_tokens: 200,
            output_tokens: 50,
            cache_creation_tokens: 300,
            cache_read_tokens: 500,
            cost: 0.02,
            actual_cost: 0.01,
          },
        ],
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const tooltip = wrapper.findComponent({ name: 'Chart' }).props('options').plugins.tooltip
    const details = tooltip.callbacks.afterBody([{ dataIndex: 0 }])
    // Hit rate = 500 / (200 + 500 + 300) * 100 = 50%
    expect(details.at(-1)).toContain('50.0%')
  })
})
describe('trend metric selection', () => {
  it('shows one filled total trend and switches to requests or both billing amounts', async () => {
    const wrapper = mount(TokenUsageTrend, {
      props: { trendData: [{ date: '2026-10-21', requests: 4, input_tokens: 200, output_tokens: 50, cache_creation_tokens: 100, cache_read_tokens: 300, total_tokens: 650, cost: .08, actual_cost: .04 }] },
      global: { stubs: { LoadingSpinner: true } },
    })
    const chart = () => JSON.parse(wrapper.get('.chart-data').text())
    expect(chart().datasets).toHaveLength(1)
    expect(chart().datasets[0].data).toEqual([650])
    expect(chart().datasets[0].fill).toBe('origin')
    const options = wrapper.findComponent({ name: 'Chart' }).props('options')
    expect(options.scales.yPercent).toBeUndefined()
    expect(options.plugins.tooltip.callbacks.afterBody([{ dataIndex: 0 }])).toEqual(expect.arrayContaining([expect.stringContaining('200'), expect.stringContaining('300')]))
    expect(wrapper.get('.trend-readout').text()).toContain('650')
    await wrapper.findAll('.trend-modes button')[1].trigger('click')
    expect(chart().datasets).toHaveLength(1)
    expect(chart().datasets[0].data).toEqual([4])
    await wrapper.findAll('.trend-modes button')[2].trigger('click')
    expect(chart().datasets.map((item: any) => item.data[0])).toEqual([.04, .08])
    expect(wrapper.get('.trend-readout').text()).toContain('0.04')
  })
})
