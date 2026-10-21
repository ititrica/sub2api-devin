<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
      badgeClass
    ]"
  >
    <!-- Platform logo -->
    <PlatformIcon v-if="platform" :platform="platform" size="sm" />
    <!-- Group name -->
    <span :class="truncate ? 'truncate' : 'min-w-0 whitespace-normal [overflow-wrap:anywhere]'">{{ name }}</span>
    <!-- Right side label -->
    <span v-if="showLabel" :class="labelClass">
      <template v-if="hasCustomRate">
        <!-- 原倍率删除线 + 专属倍率高亮 -->
        <span class="line-through opacity-50 mr-0.5">{{ rateMultiplier }}x</span>
        <span class="font-bold">{{ userRateMultiplier }}x</span>
      </template>
      <template v-else>
        {{ labelText }}
      </template>
    </span>
    <span v-if="hasPeakRate" :class="peakRateClass" :title="peakRateTitle">
      {{ peakRateText }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SubscriptionType, GroupPlatform } from '@/types'
import { useAppStore } from '@/stores/app'
import { formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import PlatformIcon from './PlatformIcon.vue'

interface Props {
  name: string
  platform?: GroupPlatform
  subscriptionType?: SubscriptionType
  rateMultiplier?: number
  userRateMultiplier?: number | null // 用户专属倍率
  peakRateEnabled?: boolean
  peakStart?: string
  peakEnd?: string
  peakRateMultiplier?: number
  showRate?: boolean
  /** Allow full group names to wrap in layouts that have room for multiple lines. */
  truncate?: boolean
  daysRemaining?: number | null // 剩余天数（订阅类型时使用）
  /**
   * 订阅分组默认在右侧 label 展示"订阅"或剩余天数；
   * 开启后订阅分组也改为显示倍率（保留订阅主题色 label，配合可用渠道这类
   * 只关心费率、不关心有效期的场景）。
   */
  alwaysShowRate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subscriptionType: 'standard',
  showRate: true,
  truncate: true,
  daysRemaining: null,
  userRateMultiplier: null,
  peakRateEnabled: false,
  alwaysShowRate: false
})

const { t } = useI18n()

const isSubscription = computed(() => props.subscriptionType === 'subscription')

// 是否有专属倍率（且与默认倍率不同）
const hasCustomRate = computed(() => {
  return (
    props.userRateMultiplier !== null &&
    props.userRateMultiplier !== undefined &&
    props.rateMultiplier !== undefined &&
    props.userRateMultiplier !== props.rateMultiplier
  )
})

const appStore = useAppStore()

const hasPeakRate = computed(() => {
  return Boolean(props.showRate && props.peakRateEnabled && props.peakStart && props.peakEnd)
})

const peakRateText = computed(() => {
  return formatPeakRateWindow(
    {
      peak_rate_enabled: props.peakRateEnabled,
      peak_start: props.peakStart,
      peak_end: props.peakEnd,
      peak_rate_multiplier: props.peakRateMultiplier
    },
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
})

const peakRateTitle = computed(() => {
  return t('common.peakRateTooltip', { window: peakRateText.value })
})

// 是否显示右侧标签
const showLabel = computed(() => {
  if (!props.showRate) return false
  // 订阅类型：显示天数或"订阅"
  if (isSubscription.value) return true
  // 标准类型：显示倍率（包括专属倍率）
  return props.rateMultiplier !== undefined || hasCustomRate.value
})

// Label text
const labelText = computed(() => {
  const rateLabel = props.rateMultiplier !== undefined ? `${props.rateMultiplier}x` : ''
  if (isSubscription.value && !props.alwaysShowRate) {
    // 如果有剩余天数，显示天数
    if (props.daysRemaining !== null && props.daysRemaining !== undefined) {
      if (props.daysRemaining <= 0) {
        return t('admin.users.expired')
      }
      return t('admin.users.daysRemaining', { days: props.daysRemaining })
    }
    // 否则显示"订阅"
    return t('groups.subscription')
  }
  return rateLabel
})

// Label style based on type and days remaining
const labelClass = computed(() => {
  const base = 'px-1.5 py-0.5 rounded text-[10px] font-semibold'

  if (!isSubscription.value) {
    // Standard: subtle background (不再为专属倍率使用不同的背景色)
    return `${base} bg-black/10 dark:bg-white/10`
  }

  // 订阅类型：根据剩余天数显示不同颜色
  if (props.daysRemaining !== null && props.daysRemaining !== undefined) {
    if (props.daysRemaining <= 0 || props.daysRemaining <= 3) {
      // 已过期或紧急（<=3天）：红色
      return `${base} bg-red-200/80 text-red-800 dark:bg-red-800/50 dark:text-red-300`
    }
    if (props.daysRemaining <= 7) {
      // 警告（<=7天）：橙色
      return `${base} bg-amber-200/80 text-amber-800 dark:bg-amber-800/50 dark:text-amber-300`
    }
  }

  // 正常状态或无天数：根据平台显示主题色
  if (props.platform === 'anthropic') {
    return `${base} bg-brand-orange-200/60 text-brand-orange-800 dark:bg-brand-orange-800/40 dark:text-brand-orange-300`
  }
  if (props.platform === 'openai') {
    return `${base} bg-brand-emerald-200/60 text-brand-emerald-800 dark:bg-brand-emerald-800/40 dark:text-brand-emerald-300`
  }
  if (props.platform === 'gemini') {
    return `${base} bg-brand-blue-200/60 text-brand-blue-800 dark:bg-brand-blue-800/40 dark:text-brand-blue-300`
  }
  if (props.platform === 'antigravity') {
    return `${base} bg-brand-purple-200/60 text-brand-purple-800 dark:bg-brand-purple-800/40 dark:text-brand-purple-300`
  }
  if (props.platform === 'grok') {
    return `${base} bg-brand-zinc-300/70 text-brand-zinc-800 dark:bg-brand-zinc-700/60 dark:text-brand-zinc-200`
  }
  if (props.platform === 'kimi') {
    return `${base} bg-brand-pink-200/60 text-brand-pink-800 dark:bg-brand-pink-800/40 dark:text-brand-pink-300`
  }
  if (props.platform === 'zhipu') {
    return `${base} bg-brand-indigo-200/60 text-brand-indigo-800 dark:bg-brand-indigo-800/40 dark:text-brand-indigo-300`
  }
  if (props.platform === 'deepseek') {
    return `${base} bg-brand-teal-200/60 text-brand-teal-800 dark:bg-brand-teal-800/40 dark:text-brand-teal-300`
  }
  if (props.platform === 'minimax') {
    return `${base} bg-brand-rose-200/60 text-brand-rose-800 dark:bg-brand-rose-800/40 dark:text-brand-rose-300`
  }
  if (props.platform === 'composite') {
    return `${base} bg-brand-cyan-200/70 text-brand-cyan-900 dark:bg-brand-cyan-900/50 dark:text-brand-cyan-300`
  }
  return `${base} bg-brand-violet-200/60 text-brand-violet-800 dark:bg-brand-violet-800/40 dark:text-brand-violet-300`
})

const peakRateClass = computed(() => {
  return 'px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
})

// Badge color based on platform and subscription type
const badgeClass = computed(() => {
  if (props.platform === 'anthropic') {
    // Claude: orange theme
    return isSubscription.value
      ? 'bg-brand-orange-100 text-brand-orange-700 dark:bg-brand-orange-900/30 dark:text-brand-orange-400'
      : 'bg-brand-amber-50 text-brand-amber-700 dark:bg-brand-amber-900/20 dark:text-brand-amber-400'
  } else if (props.platform === 'openai') {
    // OpenAI: green theme
    return isSubscription.value
      ? 'bg-brand-emerald-100 text-brand-emerald-700 dark:bg-brand-emerald-900/30 dark:text-brand-emerald-400'
      : 'bg-brand-green-50 text-brand-green-700 dark:bg-brand-green-900/20 dark:text-brand-green-400'
  }
  if (props.platform === 'gemini') {
    return isSubscription.value
      ? 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-900/30 dark:text-brand-blue-400'
      : 'bg-brand-sky-50 text-brand-sky-700 dark:bg-brand-sky-900/20 dark:text-brand-sky-400'
  }
  if (props.platform === 'antigravity') {
    return isSubscription.value
      ? 'bg-brand-purple-100 text-brand-purple-700 dark:bg-brand-purple-900/30 dark:text-brand-purple-400'
      : 'bg-brand-fuchsia-50 text-brand-fuchsia-700 dark:bg-brand-fuchsia-900/20 dark:text-brand-fuchsia-400'
  }
  if (props.platform === 'grok') {
    return isSubscription.value
      ? 'bg-brand-zinc-200 text-brand-zinc-800 dark:bg-brand-zinc-700 dark:text-brand-zinc-100'
      : 'bg-brand-zinc-100 text-brand-zinc-700 dark:bg-brand-zinc-800 dark:text-brand-zinc-200'
  }
  if (props.platform === 'kimi') {
    return isSubscription.value
      ? 'bg-brand-pink-100 text-brand-pink-700 dark:bg-brand-pink-900/30 dark:text-brand-pink-400'
      : 'bg-brand-pink-50 text-brand-pink-700 dark:bg-brand-pink-900/20 dark:text-brand-pink-400'
  }
  if (props.platform === 'zhipu') {
    return isSubscription.value
      ? 'bg-brand-indigo-100 text-brand-indigo-700 dark:bg-brand-indigo-900/30 dark:text-brand-indigo-400'
      : 'bg-brand-indigo-50 text-brand-indigo-700 dark:bg-brand-indigo-900/20 dark:text-brand-indigo-400'
  }
  if (props.platform === 'deepseek') {
    return isSubscription.value
      ? 'bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-900/30 dark:text-brand-teal-400'
      : 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-900/20 dark:text-brand-teal-400'
  }
  if (props.platform === 'minimax') {
    return isSubscription.value
      ? 'bg-brand-rose-100 text-brand-rose-700 dark:bg-brand-rose-900/30 dark:text-brand-rose-400'
      : 'bg-brand-rose-50 text-brand-rose-700 dark:bg-brand-rose-900/20 dark:text-brand-rose-400'
  }
  if (props.platform === 'composite') {
    return isSubscription.value
      ? 'bg-brand-cyan-100 text-brand-cyan-800 dark:bg-brand-cyan-900/30 dark:text-brand-cyan-300'
      : 'bg-brand-cyan-50 text-brand-cyan-800 dark:bg-brand-cyan-900/20 dark:text-brand-cyan-300'
  }
  // Fallback: original colors
  return isSubscription.value
    ? 'bg-brand-violet-100 text-brand-violet-700 dark:bg-brand-violet-900/30 dark:text-brand-violet-400'
    : 'bg-brand-emerald-100 text-brand-emerald-700 dark:bg-brand-emerald-900/30 dark:text-brand-emerald-400'
})
</script>
