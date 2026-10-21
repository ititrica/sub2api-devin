<template>
  <div class="dashboard-chart-section">
    <div class="dashboard-toolbar">
      <div class="analysis-heading"><p class="ef-eyebrow">// ANALYSIS</p><h2>{{ t('common.analytics.analysis') }}</h2></div>
      <div class="analysis-controls">
        <DateRangePicker :start-date="startDate" :end-date="endDate" @update:startDate="$emit('update:startDate', $event)" @update:endDate="$emit('update:endDate', $event)" @change="$emit('dateRangeChange', $event)" />
        <Select :model-value="granularity" :options="[{ value: 'day', label: t('dashboard.day') }, { value: 'hour', label: t('dashboard.hour') }]" :aria-label="t('dashboard.granularity')" @update:model-value="changeGranularity" />
        <button class="btn btn-secondary btn-icon" :disabled="loading" :aria-label="t('common.refresh')" @click="$emit('refresh')"><Icon name="refresh" size="md" /></button>
      </div>
    </div>
    <TokenUsageTrend :trend-data="trend" :loading="loading" />
    <ModelDistributionChart v-model:metric="modelMetric" :model-stats="models" :loading="loading" show-metric-toggle :enable-breakdown="false" :show-account-cost="false" />
  </div>
</template>
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import type { TrendDataPoint, ModelStat } from '@/types'
defineProps<{ loading: boolean; startDate: string; endDate: string; granularity: string; trend: TrendDataPoint[]; models: ModelStat[] }>()
const emit = defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()
const modelMetric = ref<'tokens' | 'actual_cost'>('tokens')
async function changeGranularity(value: unknown) {
  emit('update:granularity', value)
  await nextTick()
  emit('granularityChange')
}
</script>
<style scoped src="../../dashboard/dashboard.css"></style>
