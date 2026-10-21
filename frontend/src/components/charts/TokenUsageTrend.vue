<template>
  <section class="chart-panel trend-panel" :aria-label="t('common.analytics.trend')">
    <header class="trend-heading">
      <div>
        <p class="ef-eyebrow">// USAGE OVER TIME</p>
        <h3>{{ t('common.analytics.trend') }}</h3>
      </div>
      <div class="trend-modes" role="group" :aria-label="t('common.analytics.metric')">
        <span class="trend-mode-cursor" aria-hidden="true" :style="{ transform: `translateX(${modes.findIndex(item => item.value === mode) * 100}%)` }"></span>
        <button v-for="item in modes" :key="item.value" type="button" :class="{ 'is-active': mode === item.value }" :aria-pressed="mode === item.value" @click="mode = item.value">{{ item.label }}</button>
      </div>
    </header>
    <div class="trend-readout">
      <span><SettledText :value="formattedTotal" /><small>{{ mode === 'cost' ? 'USD' : mode === 'requests' ? 'REQUESTS' : 'TOKENS' }}</small></span>
      <div v-if="trendData.length" class="trend-range">{{ trendData[0].date }}<span>/</span>{{ trendData[trendData.length - 1].date }}</div>
    </div>
    <div v-if="loading" class="trend-canvas trend-loading"><LoadingSpinner /></div>
    <div v-else-if="trendData.length && chartData" class="trend-canvas">
      <Chart type="line" :data="chartData" :options="chartOptions" :plugins="[crosshair]" :aria-label="t('common.analytics.trend')" role="img" />
    </div>
    <div v-else class="trend-canvas trend-empty"><Icon name="chart" size="lg" /><p>{{ t('common.analytics.emptyTrend') }}</p></div>
    <footer class="trend-footer">
      <span>{{ t('usage.inSelectedRange') }}</span>
      <span v-if="mode === 'tokens'">{{ t('common.analytics.cacheRate') }}<strong>{{ cacheRate.toFixed(1) }}%</strong></span>
      <span v-else>{{ t('common.analytics.points', { count: trendData.length }) }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, CategoryScale, LinearScale, LineController, PointElement, LineElement, Filler, Tooltip, Legend, type ChartData, type ChartOptions, type Plugin } from 'chart.js'
import { Chart } from 'vue-chartjs'
import { useChartTheme } from './useChartTheme'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SettledText from '@/components/common/SettledText.vue'
import Icon from '@/components/icons/Icon.vue'
import type { TrendDataPoint } from '@/types'
ChartJS.register(CategoryScale, LinearScale, LineController, PointElement, LineElement, Filler, Tooltip, Legend)
const props = defineProps<{ trendData: TrendDataPoint[]; loading?: boolean }>()
const { t } = useI18n()
const theme = useChartTheme()
const mode = ref<'tokens' | 'requests' | 'cost'>('tokens')
const modes = computed(() => [
  { value: 'tokens' as const, label: 'Token' },
  { value: 'requests' as const, label: t('dashboard.requests') },
  { value: 'cost' as const, label: t('usage.totalCost') }
])
const tokenFields = ['input_tokens', 'output_tokens', 'cache_creation_tokens', 'cache_read_tokens'] as const
const tokenLabels = computed(() => [t('usage.in'), t('usage.out'), t('usage.cacheCreationTokensLabel'), t('usage.cacheReadTokensLabel')])
const number = (value: unknown) => Number(value) || 0
const tokens = (point: TrendDataPoint) => tokenFields.reduce((sum, field) => sum + number(point[field]), 0)
const sum = (field: keyof TrendDataPoint) => props.trendData.reduce((total, point) => total + number(point[field]), 0)
const total = computed(() => mode.value === 'cost' ? sum('actual_cost') : mode.value === 'requests' ? sum('requests') : props.trendData.reduce((sum, point) => sum + tokens(point), 0))
const formattedTotal = computed(() => mode.value === 'cost' ? total.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : total.value.toLocaleString())
const cacheRate = computed(() => {
  const prompt = sum('input_tokens') + sum('cache_creation_tokens') + sum('cache_read_tokens')
  return prompt > 0 ? sum('cache_read_tokens') / prompt * 100 : 0
})
const compact = (value: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
const chartData = computed<ChartData<'line'>>(() => {
  const primary = {
    label: mode.value === 'tokens' ? 'Token' : mode.value === 'cost' ? t('usage.totalCost') : t('dashboard.requests'),
    data: props.trendData.map(point => mode.value === 'tokens' ? tokens(point) : number(point[mode.value === 'cost' ? 'actual_cost' : 'requests'])),
    borderColor: theme.value.ink, backgroundColor: 'rgba(255, 179, 31, .13)',
    borderWidth: 1.6, pointRadius: props.trendData.length === 1 ? 3 : 0,
    pointHoverRadius: 4, pointHoverBackgroundColor: theme.value.signal,
    pointHoverBorderColor: theme.value.ink, pointHoverBorderWidth: 1.5,
    tension: .18, cubicInterpolationMode: 'monotone' as const, fill: 'origin' as const
  }
  return { labels: props.trendData.map(point => point.date), datasets: [primary, ...(mode.value === 'cost' ? [{
    ...primary, label: t('usage.standardCost'), data: props.trendData.map(point => number(point.cost)),
    borderColor: theme.value.text, borderDash: [5, 4], borderWidth: 1.2, fill: false as const
  }] : [])] }
})
const crosshair: Plugin<'line'> = {
  id: 'usage-crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements()[0]
    if (!active) return
    const { ctx, chartArea } = chart
    ctx.save()
    ctx.strokeStyle = theme.value.grid
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(active.element.x, chartArea.top)
    ctx.lineTo(active.element.x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  }
}
const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true, maintainAspectRatio: false, animation: false,
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { top: 12, right: 4 } },
  plugins: {
    legend: { display: mode.value === 'cost', position: 'bottom', align: 'start', labels: { color: theme.value.text, boxWidth: 14, boxHeight: 2, padding: 18, font: { family: 'Saira, sans-serif', size: 10 } } },
    tooltip: { ...theme.value.tooltip, displayColors: false, callbacks: {
      label: context => `${context.dataset.label}: ${mode.value === 'cost' ? `$${Number(context.raw).toFixed(4)}` : Number(context.raw).toLocaleString()}`,
      afterBody: items => {
        const point = props.trendData[items[0]?.dataIndex]
        if (!point || mode.value !== 'tokens') return []
        const prompt = number(point.input_tokens) + number(point.cache_creation_tokens) + number(point.cache_read_tokens)
        return [...tokenFields.map((field, index) => `${tokenLabels.value[index]}: ${number(point[field]).toLocaleString()}`), `${t('common.analytics.cacheRate')}: ${(prompt > 0 ? number(point.cache_read_tokens) / prompt * 100 : 0).toFixed(1)}%`]
      },
      footer: items => {
        const point = props.trendData[items[0]?.dataIndex]
        return point ? `${t('usage.totalCost')}: $${number(point.actual_cost).toFixed(4)} / ${t('usage.standardCost')}: $${number(point.cost).toFixed(4)}` : ''
      }
    } }
  },
  scales: {
    x: { grid: { color: theme.value.grid, drawTicks: false }, border: { display: false }, ticks: { color: theme.value.text, padding: 12, maxRotation: 0, autoSkip: true, maxTicksLimit: 7, font: { family: 'Saira, sans-serif', size: 10 }, callback: (_value, index) => { const date = props.trendData[index]?.date || ''; return date.match(/[ T](\d{2}:\d{2})/)?.[1] || date.replace(/^\d{4}-/, '') } } },
    y: { beginAtZero: true, grid: { color: theme.value.grid, drawTicks: false }, border: { display: false }, ticks: { count: 5, color: theme.value.text, padding: 12, font: { family: 'Saira, sans-serif', size: 10 }, callback: value => mode.value === 'cost' ? `$${Number(value).toFixed(2)}` : compact(Number(value)) } }
  }
}))
</script>
<style scoped src="./chart-panel.css"></style>
<style scoped>
.trend-heading { display:flex; justify-content:space-between; flex-wrap:wrap; gap:16px; align-items:start; }
.trend-heading h3 { font-size:18px; font-weight:650; margin-top:6px; }
.trend-modes { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); position:relative; isolation:isolate; min-width:260px; padding:3px; border:1px solid var(--ef-rule); }
.trend-modes button { position:relative; z-index:1; min-height:34px; padding:6px 14px; font-size:11px; color:var(--ef-ink-2); }
.trend-modes .is-active { color:var(--ef-panel); }
.trend-mode-cursor { position:absolute; left:3px; top:3px; bottom:3px; width:calc((100% - 6px) / 3); background:var(--ef-ink); transition:transform 280ms var(--ef-mech); }
.trend-readout { display:flex; justify-content:space-between; align-items:end; flex-wrap:wrap; gap:12px; margin:24px 0 16px; }
.trend-readout > span { font:600 clamp(28px,3vw,42px)/1.1 var(--ef-font-ui); font-stretch:112%; font-variant-numeric:tabular-nums; }
.trend-readout small { margin-left:12px; font-size:10px; letter-spacing:.1em; color:var(--ef-ink-2); }
.trend-range { display:flex; gap:10px; font:500 11px var(--ef-font-ui); color:var(--ef-ink-2); }
.trend-canvas { height:270px; min-width:0; overflow:hidden; }
.trend-loading,.trend-empty { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px; color:var(--ef-ink-2); font-size:13px; }
.trend-empty { border-block:1px dashed var(--ef-rule); background:repeating-linear-gradient(-45deg,transparent 0 9px,color-mix(in srgb,var(--ef-rule) 35%,transparent) 9px 10px); }
.trend-empty p { background:var(--ef-panel); padding:6px 12px; }
.trend-footer { display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-top:18px; margin-top:12px; border-top:1px solid var(--ef-rule); color:var(--ef-ink-2); font-size:11px; }
.trend-footer strong { margin-left:12px; color:var(--ef-ink); font-weight:600; font-variant-numeric:tabular-nums; }
@media(max-width:600px) { .trend-modes { width:100%; min-width:0; } .trend-modes button { flex:1; min-height:44px; } .trend-canvas { height:240px; } .trend-range { font-size:10px; } }
</style>
