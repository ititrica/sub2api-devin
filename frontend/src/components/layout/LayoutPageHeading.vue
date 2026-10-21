<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore, useAdminSettingsStore } from '@/stores'
import { resolveRouteMetaKeys } from '@/router/title'
import { resolveSiteBillingMode } from '@/utils/siteBillingMode'

const route = useRoute()
const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const adminSettingsStore = useAdminSettingsStore()
const visible = computed(() => !['/dashboard', '/admin/dashboard'].includes(route.path))
const metaKeys = computed(() => resolveRouteMetaKeys(route, { billingMode: resolveSiteBillingMode(appStore.cachedPublicSettings) }))
const title = computed(() => {
  if (route.name === 'CustomPage') {
    const items = [...(appStore.cachedPublicSettings?.custom_menu_items ?? []), ...(authStore.isAdmin ? adminSettingsStore.customMenuItems : [])]
    const item = items.find(item => item.id === route.params.id)
    if (item?.label) return item.label
  }
  return metaKeys.value.titleKey ? t(metaKeys.value.titleKey) : String(route.meta.title || '')
})
const eyebrow = computed(() => route.name === 'CustomPage' ? 'PAGE' : String(route.meta.title || 'WORKSPACE').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase())
const description = computed(() => metaKeys.value.descriptionKey ? t(metaKeys.value.descriptionKey) : String(route.meta.description || ''))
</script>

<template>
  <div v-if="visible && title" class="workspace-heading">
    <div>
      <p class="ef-eyebrow">// {{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="workspace-description">{{ description }}</p>
    </div>
    <div class="workspace-heading-hatch" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.workspace-heading { display: flex; justify-content: space-between; align-items: end; gap: 28px; margin-bottom: 26px; padding-bottom: 22px; border-bottom: 1px solid var(--ef-rule); }
.workspace-heading > div:first-child { min-width: 0; }
.workspace-heading .ef-eyebrow { margin-bottom: 8px; color: var(--ef-ink-2); font: 600 10px var(--ef-font-ui); font-stretch: 125%; letter-spacing: .16em; }
.workspace-heading h1 { margin: 0; font-size: clamp(25px, 2.5vw, 34px); font-weight: 750; line-height: 1.2; letter-spacing: -.04em; }
.workspace-description { margin-top: 10px; color: var(--ef-ink-2); font-size: 12px; line-height: 1.7; max-width: 72ch; }
.workspace-heading-hatch { flex: 0 1 180px; height: 30px; background: repeating-linear-gradient(-45deg, transparent, transparent 4px, var(--ef-rule) 4px, var(--ef-rule) 5px); }
@media (max-width: 639px) { .workspace-heading { margin-bottom: 20px; padding-bottom: 18px; } .workspace-heading-hatch { display: none; } }
</style>
