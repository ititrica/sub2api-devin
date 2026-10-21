<template>
  <div class="card p-4">
    <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
      {{ t('payment.admin.dailyRevenue') }}
    </h3>
    <div class="h-64">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
      <Line v-else-if="chartData" :data="chartData" :options="chartOptions" />
      <div
        v-else
        class="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400"
      >
        {{ t('payment.admin.noData') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChartTheme } from '@/components/charts/useChartTheme'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { DailyPaymentStats } from '@/types/payment'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const { t } = useI18n()

const props = defineProps<{
  data: DailyPaymentStats[]
  loading?: boolean
}>()

const chartTheme = useChartTheme()

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null
  const currencies = [...new Set(props.data.flatMap(day => Object.keys(day.amount)))].sort()
  return {
    labels: props.data.map(d => d.date),
    datasets: [
      ...currencies.map((currency, index) => {
        const borderColor = chartTheme.value.series(index)
        const backgroundColor = 'transparent'
        return {
          label: `${currency} ${t('payment.admin.revenue')}`,
          data: props.data.map(day => day.amount[currency] || 0),
          borderColor,
          backgroundColor,
          fill: false,
          borderDash: index % 2 ? [6, 3] : [],
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 5,
        }
      }),
      {
        label: t('payment.admin.orderCount'),
        data: props.data.map(d => d.count),
        borderColor: chartTheme.value.ink,
        backgroundColor: 'transparent',
        borderDash: [2, 3],
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      }
    ]
  }
})

const chartOptions = computed(() => ({
  animation: chartTheme.value.animation,
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    x: { ticks: { color: chartTheme.value.text }, grid: { color: chartTheme.value.grid } },
    y: {
      ticks: { color: chartTheme.value.text },
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      grid: { color: chartTheme.value.grid },
      title: { display: true, color: chartTheme.value.text, text: t('payment.admin.revenue') },
    },
    y1: {
      ticks: { color: chartTheme.value.text },
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: { display: true, color: chartTheme.value.text, text: t('payment.admin.orderCount') },
      grid: { drawOnChartArea: false },
    }
  },
  plugins: {
    legend: { position: 'top' as const, labels: { color: chartTheme.value.text, usePointStyle: true, pointStyle: 'rect' } },
    tooltip: { ...chartTheme.value.tooltip },
  }
}))
</script>
