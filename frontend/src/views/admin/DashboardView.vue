<template>
  <AppLayout>
    <div class="dashboard-page">
      <header class="dashboard-heading">
        <div>
          <p class="ef-eyebrow">// GATEWAY OVERVIEW</p>
          <h1>{{ t('admin.dashboard.title') }}</h1>
        </div>
        <span class="dashboard-period">{{ startDate }} / {{ endDate }}</span>
      </header>
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>

      <template v-else-if="stats">
        <div class="dashboard-metrics">
          <DashboardMetric
            eyebrow="REQUESTS / TODAY"
            :label="t('admin.dashboard.todayRequests')"
            :value="formatNumber(stats.today_requests)"
            prominent
          >
            {{ t('common.total') }} / {{ formatNumber(stats.total_requests) }}
          </DashboardMetric>
          <DashboardMetric
            eyebrow="API KEYS"
            :label="t('admin.dashboard.apiKeys')"
            :value="stats.total_api_keys"
          >
            {{ stats.active_api_keys }} {{ t('common.active') }}
          </DashboardMetric>
          <DashboardMetric
            eyebrow="SERVICE ACCOUNTS"
            :label="t('admin.dashboard.accounts')"
            :value="stats.total_accounts"
          >
            {{ stats.normal_accounts }} {{ t('common.active') }}
            <mark v-if="stats.error_accounts > 0"
              >{{ stats.error_accounts }} {{ t('common.error') }}</mark
            >
          </DashboardMetric>
          <DashboardMetric
            eyebrow="NEW USERS / TODAY"
            :label="t('admin.dashboard.users')"
            :value="`+${stats.today_new_users}`"
          >
            {{ t('common.total') }} / {{ formatNumber(stats.total_users) }}
          </DashboardMetric>
          <DashboardMetric
            eyebrow="TOKENS / TODAY"
            :label="t('admin.dashboard.todayTokens')"
            :value="formatTokens(stats.today_tokens)"
          >
            <dl class="metric-prices">
              <div>
                <dt>{{ t('admin.dashboard.actual') }}</dt>
                <dd>${{ formatCost(stats.today_actual_cost) }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.dashboard.accountCost') }}</dt>
                <dd>${{ formatCost(stats.today_account_cost) }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.dashboard.standard') }}</dt>
                <dd>${{ formatCost(stats.today_cost) }}</dd>
              </div>
            </dl>
          </DashboardMetric>
          <DashboardMetric
            eyebrow="TOTAL TOKENS"
            :label="t('admin.dashboard.totalTokens')"
            :value="formatTokens(stats.total_tokens)"
          >
            <dl class="metric-prices">
              <div>
                <dt>{{ t('admin.dashboard.actual') }}</dt>
                <dd>${{ formatCost(stats.total_actual_cost) }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.dashboard.accountCost') }}</dt>
                <dd>${{ formatCost(stats.total_account_cost) }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.dashboard.standard') }}</dt>
                <dd>${{ formatCost(stats.total_cost) }}</dd>
              </div>
            </dl>
          </DashboardMetric>
          <DashboardMetric
            eyebrow="THROUGHPUT"
            :label="t('admin.dashboard.performance')"
            :value="formatTokens(stats.rpm)"
          >
            RPM / {{ formatTokens(stats.tpm) }} TPM
          </DashboardMetric>
          <DashboardMetric
            eyebrow="RESPONSE TIME"
            :label="t('admin.dashboard.avgResponse')"
            :value="formatDuration(stats.average_duration_ms)"
          >
            {{ stats.active_users }} {{ t('admin.dashboard.activeUsers') }}
          </DashboardMetric>
        </div>

        <!-- Charts Section -->
        <div class="space-y-6">
          <!-- Date Range Filter -->
          <div>
            <div class="dashboard-toolbar">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ t('admin.dashboard.timeRange') }}:</span
                >
                <DateRangePicker
                  v-model:start-date="startDate"
                  v-model:end-date="endDate"
                  @change="onDateRangeChange"
                />
              </div>
              <button
                @click="loadDashboardStats"
                :disabled="chartsLoading"
                class="btn btn-secondary"
              >
                {{ t('common.refresh') }}
              </button>
              <div class="ml-auto flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ t('admin.dashboard.granularity') }}:</span
                >
                <div class="w-28">
                  <Select
                    v-model="granularity"
                    :options="granularityOptions"
                    @change="loadChartData"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Grid -->
          <div class="dashboard-analysis">
            <ModelDistributionChart
              :model-stats="modelStats"
              :enable-ranking-view="true"
              :ranking-items="rankingItems"
              :ranking-total-actual-cost="rankingTotalActualCost"
              :ranking-total-requests="rankingTotalRequests"
              :ranking-total-tokens="rankingTotalTokens"
              :loading="chartsLoading"
              :ranking-loading="rankingLoading"
              :ranking-error="rankingError"
              :start-date="startDate"
              :end-date="endDate"
              @ranking-click="goToUserUsage"
            />
            <TokenUsageTrend :trend-data="trendData" :loading="chartsLoading" />
          </div>

          <!-- User Usage Trend (Full Width) -->
          <div class="chart-panel user-comparison">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                <span class="ef-eyebrow block mb-1">// USER ACTIVITY</span>{{ t('admin.dashboard.recentUsage') }} / Top 12
              </h3>
              <div class="flex gap-1" role="group" :aria-label="t('admin.dashboard.recentUsage')">
                <button
                  v-for="metric in ['tokens', 'actual_cost'] as const"
                  :key="metric"
                  type="button"
                  class="rounded px-2 py-1 text-xs"
                  :class="
                    userTrendMetric === metric
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  "
                  :aria-pressed="userTrendMetric === metric"
                  @click="setUserTrendMetric(metric)"
                >
                  {{
                    t(
                      metric === 'tokens'
                        ? 'admin.dashboard.tokens'
                        : 'admin.dashboard.actualSpending'
                    )
                  }}
                </button>
              </div>
            </div>
            <div class="h-64">
              <div v-if="userTrendLoading" class="flex h-full items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
              <Bar
                v-else-if="userTrendChartData"
                :data="userTrendChartData"
                :options="userTrendOptions"
              />
              <div
                v-else
                class="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400"
              >
                {{ t('admin.dashboard.noDataAvailable') }}
              </div>
            </div>
          </div>
        </div>
        <!-- Quick Actions -->
        <div class="dashboard-actions">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ t('admin.dashboard.quickActions') }}
            </h2>
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              v-if="canUseBatchImage"
              type="button"
              class="dashboard-action"
              @click="router.push('/batch-image')"
            >
              <span
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
              >
                <Icon name="sparkles" size="md" :stroke-width="2" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ t('admin.dashboard.batchImage') }}
                </span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.batchImageDesc') }}
                </span>
              </span>
              <Icon name="chevronRight" size="sm" class="text-gray-400 group-hover:text-sky-500" />
            </button>
            <button type="button" class="dashboard-action" @click="router.push('/admin/groups')">
              <span
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Icon name="grid" size="md" :stroke-width="2" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-gray-900 dark:text-white">
                  {{ t('admin.dashboard.groupPricing') }}
                </span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.groupPricingDesc') }}
                </span>
              </span>
              <Icon
                name="chevronRight"
                size="sm"
                class="text-gray-400 group-hover:text-emerald-500"
              />
            </button>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const { t } = useI18n()
import { adminAPI } from '@/api/admin'
import type {
  DashboardStats,
  TrendDataPoint,
  ModelStat,
  UserUsageTrendPoint,
  UserSpendingRankingItem
} from '@/types'
import DashboardMetric from '@/components/dashboard/DashboardMetric.vue'
import { useChartTheme } from '@/components/charts/useChartTheme'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Icon from '@/components/icons/Icon.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const appStore = useAppStore()
const router = useRouter()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()
const stats = ref<DashboardStats | null>(null)
const loading = ref(false)
const chartsLoading = ref(false)
const userTrendLoading = ref(false)
const rankingLoading = ref(false)
const rankingError = ref(false)

// Chart data
const trendData = ref<TrendDataPoint[]>([])
const modelStats = ref<ModelStat[]>([])
const userTrend = ref<UserUsageTrendPoint[]>([])
const userTrendMetric = ref<'tokens' | 'actual_cost'>('tokens')
const rankingItems = ref<UserSpendingRankingItem[]>([])
const rankingTotalActualCost = ref(0)
const rankingTotalRequests = ref(0)
const rankingTotalTokens = ref(0)
let chartLoadSeq = 0
let usersTrendLoadSeq = 0
let rankingLoadSeq = 0
const rankingLimit = 12

// Helper function to format date in local timezone
const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getLast24HoursRangeDates = (): { start: string; end: string } => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end)
  }
}

// Date range
const granularity = ref<'day' | 'hour'>('hour')
const defaultRange = getLast24HoursRangeDates()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)

// Granularity options for Select component
const granularityOptions = computed(() => [
  { value: 'day', label: t('admin.dashboard.day') },
  { value: 'hour', label: t('admin.dashboard.hour') }
])

const chartTheme = useChartTheme()
const chartColors = chartTheme

// Line chart options (for user trend chart)
const userTrendOptions = computed(() => ({
  responsive: true,
  animation: chartTheme.value.animation,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: chartColors.value.text,
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 15,
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      ...chartTheme.value.tooltip,
      itemSort: (a: any, b: any) => {
        const aValue = typeof a?.raw === 'number' ? a.raw : Number(a?.parsed?.y ?? 0)
        const bValue = typeof b?.raw === 'number' ? b.raw : Number(b?.parsed?.y ?? 0)
        return bValue - aValue
      },
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: ${formatUserTrendValue(Number(context.raw))}`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        }
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: chartColors.value.grid
      },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        },
        callback: (value: string | number) => formatUserTrendValue(Number(value))
      }
    }
  }
}))

// User trend chart data
const userTrendChartData = computed(() => {
  if (!userTrend.value?.length) return null

  const getDisplayName = (point: UserUsageTrendPoint): string => {
    const username = point.username?.trim()
    if (username) {
      return username
    }

    const email = point.email?.trim()
    if (email) {
      return email
    }

    return t('admin.redeem.userPrefix', { id: point.user_id })
  }

  // Group by user_id to avoid merging different users with the same display name
  const userGroups = new Map<number, { name: string; data: Map<string, number> }>()
  const allDates = new Set<string>()

  userTrend.value.forEach((point) => {
    allDates.add(point.date)
    const key = point.user_id
    if (!userGroups.has(key)) {
      userGroups.set(key, { name: getDisplayName(point), data: new Map() })
    }
    userGroups
      .get(key)!
      .data.set(point.date, userTrendMetric.value === 'tokens' ? point.tokens : point.actual_cost)
  })

  const sortedDates = Array.from(allDates).sort()
  const colors = chartTheme.value.palette

  const datasets = Array.from(userGroups.values()).map((group, idx) => ({
    label: group.name,
    data: sortedDates.map((date) => group.data.get(date) || 0),
    backgroundColor: colors[idx % colors.length],
    hoverBackgroundColor: chartTheme.value.signal,
    borderWidth: 0,
    borderRadius: 0,
    maxBarThickness: 38,
    stack: 'users'

  }))

  return {
    labels: sortedDates,
    datasets
  }
})

// Format helpers
const formatUserTrendValue = (value: number): string =>
  userTrendMetric.value === 'tokens' ? formatTokens(value) : `$${formatCost(value)}`

const formatTokens = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const formatNumber = (value: number | null | undefined): string => {
  return toFiniteNumber(value).toLocaleString()
}

const formatCost = (value: number | null | undefined): string => {
  const safeValue = toFiniteNumber(value)
  if (safeValue >= 1000) {
    return (safeValue / 1000).toFixed(2) + 'K'
  } else if (safeValue >= 1) {
    return safeValue.toFixed(2)
  } else if (safeValue >= 0.01) {
    return safeValue.toFixed(3)
  }
  return safeValue.toFixed(4)
}

const formatDuration = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  return `${Math.round(ms)}ms`
}

const goToUserUsage = (item: UserSpendingRankingItem) => {
  void router.push({
    path: '/admin/usage',
    query: {
      user_id: String(item.user_id),
      start_date: startDate.value,
      end_date: endDate.value
    }
  })
}

// Date range change handler
const onDateRangeChange = (range: {
  startDate: string
  endDate: string
  preset: string | null
}) => {
  // Auto-select granularity based on date range
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // If range is 1 day, use hourly granularity
  if (daysDiff <= 1) {
    granularity.value = 'hour'
  } else {
    granularity.value = 'day'
  }

  loadChartData()
}

// Load data
const loadDashboardSnapshot = async (includeStats: boolean) => {
  const currentSeq = ++chartLoadSeq
  if (includeStats && !stats.value) {
    loading.value = true
  }
  chartsLoading.value = true
  try {
    const response = await adminAPI.dashboard.getSnapshotV2({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      include_stats: includeStats,
      include_trend: true,
      include_model_stats: true,
      include_group_stats: false,
      include_users_trend: false
    })
    if (currentSeq !== chartLoadSeq) return
    if (includeStats && response.stats) {
      stats.value = response.stats
    }
    trendData.value = response.trend || []
    modelStats.value = response.models || []
  } catch (error) {
    if (currentSeq !== chartLoadSeq) return
    appStore.showError(t('admin.dashboard.failedToLoad'))
    console.error('Error loading dashboard snapshot:', error)
  } finally {
    if (currentSeq === chartLoadSeq) {
      loading.value = false
      chartsLoading.value = false
    }
  }
}

const setUserTrendMetric = (metric: 'tokens' | 'actual_cost') => {
  if (userTrendMetric.value === metric) return
  userTrendMetric.value = metric
  userTrend.value = []
  loadUsersTrend()
}

const loadUsersTrend = async () => {
  const currentSeq = ++usersTrendLoadSeq
  userTrendLoading.value = true
  try {
    const response = await adminAPI.dashboard.getUserUsageTrend({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      limit: 12,
      metric: userTrendMetric.value
    })
    if (currentSeq !== usersTrendLoadSeq) return
    userTrend.value = response.trend || []
  } catch (error) {
    if (currentSeq !== usersTrendLoadSeq) return
    console.error('Error loading users trend:', error)
    userTrend.value = []
  } finally {
    if (currentSeq === usersTrendLoadSeq) {
      userTrendLoading.value = false
    }
  }
}

const loadUserSpendingRanking = async () => {
  const currentSeq = ++rankingLoadSeq
  rankingLoading.value = true
  rankingError.value = false
  try {
    const response = await adminAPI.dashboard.getUserSpendingRanking({
      start_date: startDate.value,
      end_date: endDate.value,
      limit: rankingLimit
    })
    if (currentSeq !== rankingLoadSeq) return
    rankingItems.value = response.ranking || []
    rankingTotalActualCost.value = response.total_actual_cost || 0
    rankingTotalRequests.value = response.total_requests || 0
    rankingTotalTokens.value = response.total_tokens || 0
  } catch (error) {
    if (currentSeq !== rankingLoadSeq) return
    console.error('Error loading user spending ranking:', error)
    rankingItems.value = []
    rankingTotalActualCost.value = 0
    rankingTotalRequests.value = 0
    rankingTotalTokens.value = 0
    rankingError.value = true
  } finally {
    if (currentSeq === rankingLoadSeq) {
      rankingLoading.value = false
    }
  }
}

const loadDashboardStats = async () => {
  await Promise.all([loadDashboardSnapshot(true), loadUsersTrend(), loadUserSpendingRanking()])
}

const loadChartData = async () => {
  await Promise.all([loadDashboardSnapshot(false), loadUsersTrend(), loadUserSpendingRanking()])
}

onMounted(() => {
  void refreshBatchImageAccess()
  loadDashboardStats()
})
</script>

<style scoped></style>

<style scoped src="../../components/dashboard/dashboard.css"></style>
<style scoped>
.dashboard-actions {
  border-top: 1px solid var(--ef-rule);
  padding-top: 18px;
}
.dashboard-action {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  padding: 16px calc(16px + var(--ef-cut)) 16px 16px;
  background: var(--ef-panel);
  color: var(--ef-ink);
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - var(--ef-cut)),
    calc(100% - var(--ef-cut)) 100%,
    0 100%
  );
  transition: background 180ms var(--ef-mech);
}
.dashboard-action:hover {
  background: var(--ef-signal);
  color: var(--ef-on-signal);
}
.dashboard-action > span:first-child {
  background: transparent;
  color: inherit;
}
.dashboard-action:hover :deep(span),
.dashboard-action:hover :deep(svg) {
  color: var(--ef-on-signal);
}
.dashboard-action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -4px;
}
</style>

<style scoped src="../../components/charts/chart-panel.css"></style>
