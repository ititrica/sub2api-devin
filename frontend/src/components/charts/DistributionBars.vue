<template>
  <div class="distribution-bars">
    <div class="distribution-summary">
      <span>{{ formatValue(total) }}<small>{{ metric === 'actual_cost' ? 'USD' : 'TOKENS' }}</small></span>
      <span class="distribution-count">{{ labels.length }} {{ t('common.analytics.series') }}</span>
    </div>
    <div v-motion-rows="'.distribution-item'" class="distribution-rows" :aria-label="label" role="list">
      <div v-for="(name, index) in labels" :key="`${name}-${index}`" class="distribution-item" role="listitem">
        <component
          :is="interactive ? 'button' : 'div'"
          :type="interactive ? 'button' : undefined"
          class="distribution-row"
          :class="{ 'is-interactive': interactive }"
          :aria-label="`${name}: ${formatValue(values[index] || 0)}, ${percentage(index)}%`"
          @click="interactive && emit('select', index)"
        >
          <div class="distribution-row-label">
            <span class="distribution-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="distribution-name" :title="name">{{ name }}</span>
            <span class="distribution-value">{{ formatValue(values[index] || 0) }}</span>
          </div>
          <div class="distribution-row-chart">
            <div class="distribution-track"><span :style="{ width: `${percentage(index)}%`, backgroundColor: colors[index] || 'var(--ef-ink)' }"></span></div>
            <span class="distribution-percent">{{ percentage(index) }}%</span>
          </div>
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { motionRows as vMotionRows } from "@/directives/motionRows"
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const props = withDefaults(defineProps<{
  labels: string[]
  values: number[]
  colors?: string[]
  metric?: 'tokens' | 'actual_cost'
  label?: string
  interactive?: boolean
}>(), { colors: () => [], metric: 'tokens', label: '', interactive: false })
const emit = defineEmits<{ select: [index: number] }>()
const { t } = useI18n()
const safeValue = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0
const total = computed(() => props.values.reduce((sum, value) => sum + safeValue(value), 0))
const percentage = (index: number) => total.value > 0 ? Number((safeValue(props.values[index] || 0) / total.value * 100).toFixed(1)) : 0
function formatValue(value: number) {
  if (props.metric === 'actual_cost') return `$${safeValue(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(safeValue(value))
}
</script>

<style scoped>
.distribution-bars { min-width: 0; }
.distribution-summary { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 20px; }
.distribution-summary > span:first-child { font: 600 clamp(26px, 2.8vw, 38px)/1 var(--ef-font-ui); font-stretch: 112%; font-variant-numeric: tabular-nums; }
.distribution-summary small { margin-left: 10px; font-size: 9px; font-weight: 500; letter-spacing: .12em; color: var(--ef-ink-2); }
.distribution-count { font: 500 10px var(--ef-font-ui); color: var(--ef-ink-2); white-space: nowrap; }
.distribution-rows { max-height: 280px; overflow-y: auto; overscroll-behavior: contain; padding-right: 6px; }
.distribution-item + .distribution-item { margin-top: 16px; }
.distribution-row { display: block; width: 100%; min-width: 0; text-align: left; }
.distribution-row-label { display: flex; align-items: baseline; gap: 10px; margin-bottom: 7px; font-size: 12px; }
.distribution-index { color: var(--ef-ink-2); font: 500 9px var(--ef-font-ui); font-variant-numeric: tabular-nums; }
.distribution-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 550; }
.distribution-value { font: 550 12px var(--ef-font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }
.distribution-row-chart { display: flex; align-items: center; gap: 12px; padding-left: 22px; }
.distribution-track { flex: 1; min-width: 0; height: 6px; background: var(--ef-chip); }
.distribution-track span { display: block; height: 100%; }
.distribution-percent { width: 42px; text-align: right; font: 500 10px var(--ef-font-ui); color: var(--ef-ink-2); font-variant-numeric: tabular-nums; }
.is-interactive { padding: 8px; clip-path: var(--ef-clip); }
.is-interactive:hover { background: var(--ef-paper); }
.is-interactive:hover .distribution-track span { background: var(--ef-signal) !important; }
.is-interactive:focus-visible { outline: 2px solid var(--ef-ink); outline-offset: -2px; }
</style>
