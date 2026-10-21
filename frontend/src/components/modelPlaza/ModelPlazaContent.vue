<template>
  <div class="plaza-content">
    <header v-if="!embedded" class="plaza-page-heading">
      <div><p class="ef-eyebrow">// MODEL CATALOG</p><h1>{{ t('modelPlaza.title') }}</h1><p class="plaza-subtitle">{{ t('modelPlaza.description') }}</p></div>
      <dl v-if="response" class="plaza-summary">
        <div><dt>{{ t('modelPlaza.filters.modelLabel') }}</dt><dd>{{ modelCount }}</dd></div>
        <div><dt>{{ t('modelPlaza.filters.groupLabel') }}</dt><dd>{{ response.groups.length }}</dd></div>
        <div><dt>{{ t('modelPlaza.filters.platformLabel') }}</dt><dd>{{ platforms.length }}</dd></div>
      </dl>
    </header>

    <div v-if="descriptionHtml" class="plaza-description" v-html="descriptionHtml"></div>
    <p v-if="!isAuthenticated" class="plaza-anonymous"><Icon name="infoCircle" size="sm" />{{ t('modelPlaza.anonymousHint') }}</p>

    <div v-if="loading" class="plaza-loading" role="status"><div class="plaza-load-track" aria-hidden="true"></div>{{ t('common.loading') }}</div>
    <div v-else-if="error" class="plaza-state plaza-error" role="alert"><span aria-hidden="true">!</span>{{ t('modelPlaza.loadFailed') }}</div>
    <template v-else>
      <PlazaFilterBar
        :platforms="platforms"
        :groups="groupOptions"
        :rates="rates"
        :platform="selectedPlatform"
        :group-id="selectedGroupId"
        :rate="selectedRate"
        :search="searchQuery"
        @update:platform="selectedPlatform = $event"
        @update:group-id="selectedGroupId = $event"
        @update:rate="selectedRate = $event"
        @update:search="searchQuery = $event"
      />
      <div v-if="filteredGroups.length > 0" class="plaza-groups"><PlazaGroupSection v-for="g in filteredGroups" :key="g.id" :group="g" /></div>
      <div v-else class="plaza-state">{{ searchActive ? t('modelPlaza.noSearchResult') : t('modelPlaza.empty') }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Icon from '@/components/icons/Icon.vue'
import PlazaFilterBar from './PlazaFilterBar.vue'
import PlazaGroupSection from './PlazaGroupSection.vue'
import type { ModelPlazaGroup, ModelPlazaResponse } from '@/api/modelPlaza'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  response: ModelPlazaResponse | null
  loading: boolean
  error?: boolean
  /** 后台内嵌形态(AppLayout 内):隐藏页头。 */
  embedded?: boolean
}>()

const { t } = useI18n()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelCount = computed(() => new Set((props.response?.groups ?? []).flatMap(group => group.models.map(model => `${model.platform}:${model.name}`))).size)

const selectedPlatform = ref<string>('all')
const selectedGroupId = ref<number | 'all'>('all')
const selectedRate = ref<number | 'all'>('all')
const searchQuery = ref('')

const searchActive = computed(() => searchQuery.value.trim() !== '')

const descriptionHtml = computed(() => {
  const md = props.response?.description?.trim()
  if (!md) return ''
  return DOMPurify.sanitize(marked.parse(md) as string)
})

/** 生效倍率 = 用户专属倍率 ?? 分组默认倍率。 */
function effectiveRate(g: ModelPlazaGroup): number {
  return g.user_rate_multiplier ?? g.rate_multiplier
}

const platforms = computed(() =>
  [...new Set((props.response?.groups ?? []).map((g) => g.platform).filter(Boolean))].sort()
)

const groupOptions = computed(() =>
  (props.response?.groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    platform: g.platform,
    rate: effectiveRate(g)
  }))
)

/** 全量生效倍率;当前组合下不可用的项由 FilterBar 置灰而非隐藏。 */
const rates = computed(() =>
  [...new Set((props.response?.groups ?? []).map(effectiveRate))].sort((a, b) => a - b)
)

/** 数据刷新后选中的倍率可能不复存在,重置为全部。 */
watch(rates, (list) => {
  if (selectedRate.value !== 'all' && !list.includes(selectedRate.value)) {
    selectedRate.value = 'all'
  }
})

const filteredGroups = computed(() => {
  let groups = props.response?.groups ?? []
  if (selectedPlatform.value !== 'all') {
    groups = groups.filter((g) => g.platform === selectedPlatform.value)
  }
  if (selectedGroupId.value !== 'all') {
    groups = groups.filter((g) => g.id === selectedGroupId.value)
  }
  if (selectedRate.value !== 'all') {
    groups = groups.filter((g) => effectiveRate(g) === selectedRate.value)
  }
  // 模型名搜索:分组内只留命中的模型,整组无命中则隐藏该分组。
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    groups = groups
      .map((g) => ({ ...g, models: g.models.filter((m) => m.name.toLowerCase().includes(q)) }))
      .filter((g) => g.models.length > 0)
  }
  // 专属倍率会改变生效值,不能只依赖后端按默认倍率的排序。
  return [...groups].sort(
    (a, b) => effectiveRate(a) - effectiveRate(b) || a.name.localeCompare(b.name)
  )
})
</script>

<style scoped>
.plaza-content { min-width: 0; display: flex; flex-direction: column; gap: 24px; }
.plaza-page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; padding-bottom: 30px; border-bottom: 1px solid var(--ef-ink); }
.plaza-page-heading h1 { font-size: clamp(28px, 3.2vw, 44px); line-height: 1.2; font-weight: 800; margin-top: 12px; }
.plaza-subtitle { font-size: 13px; color: var(--ef-ink-2); line-height: 1.8; margin-top: 12px; }
.plaza-summary { display: flex; gap: 32px; flex-shrink: 0; }
.plaza-summary > div { display: flex; flex-direction: column-reverse; min-width: 52px; }
.plaza-summary dt { font-size: 11px; color: var(--ef-ink-2); }
.plaza-summary dd { font: 650 38px / 1.2 var(--ef-font-ui); font-stretch: 112%; font-variant-numeric: tabular-nums; }
.plaza-description { background: var(--ef-panel); border-left: 3px solid var(--ef-ink); padding: 18px 22px; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.plaza-description :deep(h1), .plaza-description :deep(h2), .plaza-description :deep(h3) { margin: 12px 0 8px; font-weight: 700; color: var(--ef-ink); }
.plaza-description :deep(h1:first-child), .plaza-description :deep(h2:first-child), .plaza-description :deep(h3:first-child) { margin-top: 0; }
.plaza-description :deep(p) { margin-bottom: 8px; }
.plaza-description :deep(p:last-child) { margin-bottom: 0; }
.plaza-description :deep(a) { text-decoration: underline; text-underline-offset: 4px; color: var(--ef-ink); }
.plaza-description :deep(ul) { list-style: disc; padding-left: 20px; }
.plaza-description :deep(ol) { list-style: decimal; padding-left: 20px; }
.plaza-description :deep(code) { padding: 2px 5px; background: var(--ef-chip); font-size: 11px; }
.plaza-description :deep(blockquote) { border-left: 2px solid var(--ef-rule); padding-left: 12px; margin-block: 10px; color: var(--ef-ink-2); }
.plaza-anonymous { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ef-ink-2); }
.plaza-anonymous svg { flex-shrink: 0; }
.plaza-groups { display: flex; flex-direction: column; gap: 32px; min-width: 0; }
.plaza-loading { display: grid; place-content: center; gap: 18px; min-height: 250px; font-size: 12px; text-align: center; color: var(--ef-ink-2); }
.plaza-load-track { width: 160px; height: 10px; background: repeating-linear-gradient(90deg, var(--ef-chip) 0 12px, transparent 12px 16px); position: relative; overflow: hidden; }
.plaza-load-track::before { content: ''; position: absolute; width: 44px; height: 10px; background: var(--ef-signal); animation: plaza-loading 1s linear infinite; }
.plaza-state { padding: 48px 24px; text-align: center; border-block: 1px solid var(--ef-rule); font-size: 13px; color: var(--ef-ink-2); }
.plaza-error { display: flex; justify-content: center; align-items: center; gap: 12px; }
.plaza-error > span { display: grid; place-items: center; width: 28px; height: 28px; background: var(--ef-signal); color: var(--ef-on-signal); font-weight: 750; }
@keyframes plaza-loading { from { transform: translateX(-44px); } to { transform: translateX(160px); } }
@media (prefers-reduced-motion: reduce) { .plaza-load-track::before { animation: none; left: 58px; } }
@media (max-width: 700px) { .plaza-page-heading { flex-direction: column; align-items: flex-start; gap: 24px; } .plaza-summary { gap: 36px; } .plaza-summary dd { font-size: 30px; } }
</style>
