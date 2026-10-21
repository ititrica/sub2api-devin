<template>
  <div class="plaza-filters">
    <div class="plaza-filter-row">
      <span class="plaza-filter-label">{{ t('modelPlaza.filters.platformLabel') }}</span>
      <div class="plaza-filter-options">
        <button v-for="p in ['all', ...platforms]" :key="`platform-${p}`" type="button" :class="[chipClass(platform === p), { 'plaza-chip--brand': p !== 'all' }]" :style="p !== 'all' ? { '--chip-accent': platformAccentColor(p) } : undefined" :aria-pressed="platform === p" :disabled="p !== 'all' && !platformEnabled(p)" @click="$emit('update:platform', p)">
          <PlatformIcon v-if="p !== 'all'" :platform="p as GroupPlatform" size="xs" />{{ p === 'all' ? t('modelPlaza.filters.all') : p }}
        </button>
      </div>
    </div>
    <div class="plaza-filter-row">
      <span class="plaza-filter-label">{{ t('modelPlaza.filters.groupLabel') }}</span>
      <div class="plaza-filter-options">
        <button type="button" :class="chipClass(groupId === 'all')" :aria-pressed="groupId === 'all'" @click="$emit('update:groupId', 'all')">{{ t('modelPlaza.filters.all') }}</button>
        <button v-for="g in groups" :key="`group-${g.id}`" type="button" :class="[chipClass(groupId === g.id), 'plaza-chip--brand']" :style="{ '--chip-accent': platformAccentColor(g.platform) }" :aria-pressed="groupId === g.id" :disabled="!groupEnabled(g)" @click="$emit('update:groupId', g.id)">{{ g.name }}</button>
      </div>
    </div>
    <div class="plaza-filter-row">
      <span class="plaza-filter-label">{{ t('modelPlaza.filters.rateLabel') }}</span>
      <div class="plaza-filter-options">
        <button type="button" :class="chipClass(rate === 'all')" :aria-pressed="rate === 'all'" @click="$emit('update:rate', 'all')">{{ t('modelPlaza.filters.all') }}</button>
        <button v-for="r in rates" :key="`rate-${r}`" type="button" :class="chipClass(rate === r)" :aria-pressed="rate === r" :disabled="!rateEnabled(r)" @click="$emit('update:rate', r)">{{ r }}x</button>
      </div>
    </div>
    <div class="plaza-filter-row plaza-search-row">
      <label for="plaza-model-search" class="plaza-filter-label">{{ t('modelPlaza.filters.modelLabel') }}</label>
      <div class="plaza-search">
        <Icon name="search" size="sm" />
        <input id="plaza-model-search" :value="search" type="search" :placeholder="t('modelPlaza.filters.searchPlaceholder')" class="input" @input="$emit('update:search', ($event.target as HTMLInputElement).value)" />
        <button v-if="search" type="button" :aria-label="t('common.clear')" @click="$emit('update:search', '')"><Icon name="x" size="sm" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { platformAccentColor } from '@/utils/platformColors'
import type { GroupPlatform } from '@/types'

const props = defineProps<{
  /** 数据中出现的平台(去重排序后)。 */
  platforms: string[]
  /** 全量分组(含平台与生效倍率),三个维度的置灰联动由此推导。 */
  groups: Array<{ id: number; name: string; platform: string; rate: number }>
  /** 全量生效倍率去重升序。 */
  rates: number[]
  platform: string
  groupId: number | 'all'
  rate: number | 'all'
  /** 模型名搜索词(纯前端过滤)。 */
  search: string
}>()

defineEmits<{
  'update:platform': [value: string]
  'update:groupId': [value: number | 'all']
  'update:rate': [value: number | 'all']
  'update:search': [value: string]
}>()

const { t } = useI18n()

/**
 * 三个维度互为约束(faceted):某选项可点 ⟺ 在「其他两维」当前选择下仍有分组命中。
 * 「全部」永远可点,作为解除本维约束的出口;可点项组合恒有结果,无需选择修正。
 */
function platformEnabled(p: string): boolean {
  return props.groups.some(
    (g) =>
      g.platform === p &&
      (props.groupId === 'all' || g.id === props.groupId) &&
      (props.rate === 'all' || g.rate === props.rate)
  )
}

function groupEnabled(g: { platform: string; rate: number }): boolean {
  return (
    (props.platform === 'all' || g.platform === props.platform) &&
    (props.rate === 'all' || g.rate === props.rate)
  )
}

function rateEnabled(r: number): boolean {
  return props.groups.some(
    (g) =>
      g.rate === r &&
      (props.platform === 'all' || g.platform === props.platform) &&
      (props.groupId === 'all' || g.id === props.groupId)
  )
}

function chipClass(active: boolean): string {
  return active ? 'plaza-chip is-active' : 'plaza-chip'
}
</script>

<style scoped>
.plaza-filters { padding: 8px 0; border-bottom: 1px solid var(--ef-rule); }
.plaza-filter-row { display: flex; align-items: flex-start; gap: 20px; padding-block: 8px; }
.plaza-filter-label { width: 64px; flex-shrink: 0; padding-top: 13px; font-size: 12px; color: var(--ef-ink-2); font-weight: 650; }
.plaza-filter-options { display: flex; flex-wrap: wrap; gap: 8px; min-width: 0; }
.plaza-chip { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; padding: 9px calc(12px + var(--ef-cut)) 9px 16px; background: var(--ef-chip); color: var(--ef-ink); font: 550 12px var(--ef-font-ui); clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--ef-cut)), calc(100% - var(--ef-cut)) 100%, 0 100%); transition: background-color 160ms var(--ef-ease-mech); }
.plaza-chip:hover:not(:disabled) { background: var(--ef-rule); }
.plaza-chip.is-active { background: var(--ef-signal); color: var(--ef-on-signal); font-weight: 750; }
.plaza-chip:disabled { opacity: .4; cursor: not-allowed; }
.plaza-chip:focus-visible { outline: 2px solid currentColor; outline-offset: -4px; }
/* Brand choices retain their own hue in every state; neutral filters use site amber. */
.plaza-chip--brand { color:color-mix(in srgb,var(--chip-accent) 78%,black); background:color-mix(in srgb,var(--chip-accent) 10%,var(--ef-panel)); }
.plaza-chip--brand:hover:not(:disabled) { background:color-mix(in srgb,var(--chip-accent) 18%,var(--ef-panel)); }
.plaza-chip--brand.is-active { color:#fff; background:color-mix(in srgb,var(--chip-accent) 70%,black); }
.plaza-chip--brand.is-active:hover:not(:disabled) { background:color-mix(in srgb,var(--chip-accent) 63%,black); }
.plaza-chip--brand :deep(.platform-icon) { color:inherit; }
.dark .plaza-chip--brand:not(.is-active) { color:color-mix(in srgb,var(--chip-accent) 72%,white); background:color-mix(in srgb,var(--chip-accent) 15%,var(--ef-panel)); }
.dark .plaza-chip--brand:not(.is-active):hover:not(:disabled) { background:color-mix(in srgb,var(--chip-accent) 23%,var(--ef-panel)); }
.plaza-search-row { padding-block: 14px 20px; }
.plaza-search { width: min(100%, 460px); position: relative; }
.plaza-search > svg { position: absolute; left: 14px; top: 15px; color: var(--ef-ink-2); pointer-events: none; }
.plaza-search input { min-height: 46px; padding-left: 40px; padding-right: 44px; }
.plaza-search input::-webkit-search-cancel-button { display: none; }
.plaza-search button { position: absolute; right: 1px; top: 1px; width: 44px; height: 44px; display: grid; place-items: center; }
@media (max-width: 600px) { .plaza-filter-row { gap: 12px; } .plaza-filter-label { width: 40px; font-size: 11px; } .plaza-chip { padding-left: 12px; } }
</style>
