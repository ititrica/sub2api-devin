<template>
  <header class="plaza-nav-header">
    <nav class="plaza-nav" :aria-label="siteName">
      <RouterLink to="/" class="plaza-brand">
        <img class="site-brand-image" :src="siteLogo || '/logo.png'" :alt="siteName" />
        <span>{{ siteName }}<small>AI API GATEWAY</small></span>
      </RouterLink>
      <span class="plaza-nav-location">// MODEL CATALOG</span>
      <div class="plaza-nav-actions">
        <LocaleSwitcher />
        <button class="plaza-theme" type="button" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')" @click="toggleTheme"><Icon :name="isDark ? 'sun' : 'moon'" size="md" /></button>
        <RouterLink :to="isAuthenticated ? backTarget : { path: '/login', query: { redirect: '/model-plaza' } }" class="btn btn-primary">
          {{ isAuthenticated ? t('modelPlaza.nav.backToDashboard') : t('modelPlaza.nav.login') }}
          <Icon name="arrowRight" size="sm" />
        </RouterLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useTheme } from "@/composables/useTheme"
import { computed } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useI18n } from 'vue-i18n'
import { sanitizeUrl } from '@/utils/url'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const { isDark, toggleTheme } = useTheme()

const appStore = useAppStore()
const authStore = useAuthStore()

const settings = computed(() => appStore.cachedPublicSettings)
const siteName = computed(() => settings.value?.site_name || 'Sub2API')
const siteLogo = computed(() =>
  sanitizeUrl(settings.value?.site_logo || '', { allowRelative: true, allowDataUrl: true })
)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const backTarget = computed(() => (authStore.isAdmin ? '/admin/dashboard' : '/dashboard'))
</script>

<style scoped>
.plaza-nav-header { background: var(--ef-paper); border-bottom: 1px solid var(--ef-rule); position: sticky; top: 0; z-index: 30; }
.plaza-nav { display: flex; align-items: center; gap: 24px; min-height: 84px; width: min(100%, 1440px); margin-inline: auto; padding: 16px clamp(20px, 4vw, 64px); }
.plaza-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.plaza-brand img { width: 34px; height: 34px; object-fit: cover; }
.plaza-brand > span { font: 750 20px / 1.15 var(--ef-font-ui); overflow-wrap: anywhere; }
.plaza-brand small { display: block; margin-top: 5px; font-size: 9px; letter-spacing: .14em; font-weight: 500; color: var(--ef-ink-2); }
.plaza-nav-location { padding-left: 24px; border-left: 1px solid var(--ef-rule); font: 550 10px var(--ef-font-ui); letter-spacing: .12em; color: var(--ef-ink-2); }
.plaza-nav-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.plaza-theme { display: grid; place-items: center; width: 44px; height: 44px; }
.plaza-theme:hover { background: var(--ef-chip); }
.plaza-nav :is(a, button):focus-visible { outline: 2px solid currentColor; outline-offset: -4px; }
@media (max-width: 850px) { .plaza-nav-location { display: none; } }
@media (max-width: 600px) {
  .plaza-nav { min-height: 76px; gap: 12px; }
  .plaza-brand { gap: 8px; }
  .plaza-brand img { width: 28px; height: 28px; }
  .plaza-brand > span { font-size: 16px; }
  .plaza-brand small { font-size: 7px; letter-spacing: .08em; }
  .plaza-nav-actions { gap: 2px; }
  .plaza-nav-actions .btn { min-height: 44px; padding-left: 12px; font-size: 11px; }
  .plaza-nav-actions .btn > svg { display: none; }
}
@media (max-width: 380px) { .plaza-brand img { width: 30px; height: 30px; } }
</style>
