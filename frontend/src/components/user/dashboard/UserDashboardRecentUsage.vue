<template>
  <div class="recent-usage">
    <div class="recent-heading">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        <span class="ef-eyebrow block mb-1">// RECENT REQUESTS</span
        >{{ t('dashboard.recentUsage') }}
      </h2>
      <span class="badge badge-gray">{{ t('dashboard.last7Days') }}</span>
    </div>
    <div class="recent-body">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else-if="data.length === 0" class="py-8">
        <EmptyState
          :title="t('dashboard.noUsageRecords')"
          :description="t('dashboard.startUsingApi')"
        />
      </div>
      <div v-else class="space-y-3">
        <div v-for="log in data" :key="log.id" class="recent-record">
          <div class="flex items-center gap-4">
            <span class="record-id">{{ String(log.id).padStart(3, '0') }}</span>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ log.model }}</p>
              <p class="text-xs text-gray-500 dark:text-dark-400">
                {{ formatDateTime(log.created_at) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold">
              <span class="text-gray-900 dark:text-white" :title="t('dashboard.actual')"
                >${{ formatCost(log.actual_cost) }}</span
              >
              <span
                class="font-normal text-gray-400 dark:text-gray-500"
                :title="t('dashboard.standard')"
              >
                / ${{ formatCost(log.total_cost) }}</span
              >
            </p>
            <p class="text-xs text-gray-500 dark:text-dark-400">
              {{ (log.input_tokens + log.output_tokens).toLocaleString() }} tokens
            </p>
          </div>
        </div>

        <router-link
          to="/usage"
          class="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {{ t('dashboard.viewAllUsage') }}
          <Icon name="arrowRight" size="sm" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'
import type { UsageLog } from '@/types'

defineProps<{
  data: UsageLog[]
  loading: boolean
}>()
const { t } = useI18n()
const formatCost = (c: number) => c.toFixed(4)
</script>

<style scoped>
.recent-usage {
  min-width: 0;
  border-top: 2px solid var(--ef-ink);
}
.recent-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 22px 0;
}
.recent-body {
  background: var(--ef-panel);
  padding: 0 18px;
}
.recent-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 17px 0;
  border-bottom: 1px solid var(--ef-rule);
}
.recent-record > div {
  min-width: 0;
}
.recent-record p {
  overflow-wrap: anywhere;
}
.record-id {
  font-family: var(--ef-font-ui);
  font-size: 12px;
  color: var(--ef-ink-2);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 550px) {
  .recent-record {
    flex-wrap: wrap;
  }
  .recent-record > div:last-child {
    margin-left: auto;
  }
}
</style>
