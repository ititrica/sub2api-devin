<template>
  <div class="auth-shell">
    <header class="auth-header">
      <router-link to="/" class="auth-brand" :aria-label="siteName">
        <img class="site-brand-image" :src="siteLogo || '/logo.png'" :alt="siteName" />
        <span>{{ siteName }}<small>AI API GATEWAY</small></span>
      </router-link>
      <div class="auth-tools">
        <LocaleSwitcher />
        <button type="button" class="auth-theme" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')" :title="isDark ? t('home.switchToLight') : t('home.switchToDark')" @click="toggleTheme">
          <Icon :name="isDark ? 'sun' : 'moon'" size="md" />
        </button>
      </div>
    </header>

    <main class="auth-main">
      <aside class="auth-introduction">
        <div class="auth-intro-copy">
          <p class="ef-eyebrow">// AI API GATEWAY</p>
          <h1>{{ siteName }}<span>CONNECTED.</span></h1>
          <h2>{{ t('home.heroSubtitle') }}</h2>
          <p class="auth-description">{{ siteSubtitle }}</p>
        </div>
        <div class="auth-api-map" aria-hidden="true">
          <div class="auth-map-input"><span>API KEY</span><i></i></div>
          <div class="auth-map-gateway">
            <img class="site-brand-image auth-map-logo" :src="siteLogo || '/logo.png'" alt="" />
            <span>API GATEWAY</span>
          </div>
          <div class="auth-map-models"><span>Claude</span><span>GPT</span><span>Gemini</span></div>
        </div>
        <div class="auth-intro-footer">
          <span>{{ t('home.tags.subscriptionToApi') }}</span><span>{{ t('home.tags.stickySession') }}</span><span>{{ t('home.tags.realtimeBilling') }}</span>
        </div>
      </aside>

      <section class="auth-form-section" :aria-label="siteName">
        <div class="auth-form-content">
          <p class="ef-eyebrow auth-form-eyebrow">// ACCOUNT</p>
          <div class="auth-form"><slot /></div>
          <div v-if="$slots.footer" class="auth-form-footer"><slot name="footer" /></div>
        </div>
      </section>
    </main>

    <footer class="auth-footer">
      <span>&copy; {{ currentYear }} {{ siteName }}</span>
      <router-link to="/">{{ siteName }} <Icon name="arrowRight" size="sm" /></router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@/composables/useTheme"
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const appStore = useAppStore()
const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || t('home.heroDescription'))
const currentYear = computed(() => new Date().getFullYear())
const { isDark, toggleTheme } = useTheme()



onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.auth-shell { min-height: 100dvh; display: flex; flex-direction: column; background: var(--ef-paper); color: var(--ef-ink); }
.auth-header { min-height: 84px; padding: 16px clamp(22px, 4vw, 64px); display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--ef-rule); }
.auth-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.auth-brand img { width: 36px; height: 36px; object-fit: cover; }
.auth-brand > span { font: 750 20px / 1.15 var(--ef-font-ui); font-stretch: 112%; overflow-wrap: anywhere; }
.auth-brand small { display: block; color: var(--ef-ink-2); font-size: 9px; font-weight: 500; letter-spacing: .16em; margin-top: 6px; }
.auth-tools { display: flex; align-items: center; gap: 8px; }
.auth-theme { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; }
.auth-theme:hover { background: var(--ef-chip); }
.auth-main { display: grid; grid-template-columns: 1fr 1fr; flex: 1; width: min(100%, 1440px); margin-inline: auto; }
.auth-introduction { display: flex; flex-direction: column; padding: clamp(40px, 5vw, 80px) clamp(30px, 5vw, 80px); border-right: 1px solid var(--ef-rule); position: relative; }
.auth-intro-copy h1 { font: 800 clamp(40px, 4.6vw, 70px) / 1.1 var(--ef-font-ui); font-stretch: 125%; letter-spacing: -.04em; overflow-wrap: anywhere; margin-top: 24px; }
.auth-intro-copy h1 > span { display: block; margin-top: 4px; font-size: .64em; color: transparent; -webkit-text-stroke: 1px var(--ef-ink); letter-spacing: -.02em; }
.auth-intro-copy h2 { font-size: clamp(18px, 1.7vw, 23px); line-height: 1.6; font-weight: 750; margin-top: 32px; }
.auth-description { max-width: 390px; color: var(--ef-ink-2); font-size: 13px; line-height: 1.9; margin-top: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.auth-api-map { display: flex; align-items: center; min-height: 210px; padding-block: 34px; margin-top: auto; }
.auth-map-input { display: flex; flex: 1; align-items: center; font: 500 10px var(--ef-font-ui); letter-spacing: .08em; }
.auth-map-input > span { border: 1px solid var(--ef-rule); padding: 14px 12px; white-space: nowrap; }
.auth-map-input > i { height: 1px; flex: 1; background: var(--ef-ink-2); }
.auth-map-gateway { display: flex; flex-direction: column; align-items: center; border: 1px solid var(--ef-ink); padding: 14px 18px; }
.auth-map-gateway .auth-map-logo { width: 68px; height: 68px; }
.auth-map-gateway span { font: 600 9px var(--ef-font-ui); letter-spacing: .1em; margin-top: 8px; }
.auth-map-models { flex: 1; display: flex; flex-direction: column; gap: 10px; padding-left: 22px; position: relative; }
.auth-map-models::before { content: ''; position: absolute; width: 22px; top: 50%; left: 0; border-top: 1px solid var(--ef-ink-2); }
.auth-map-models > span { padding: 6px 10px; font: 550 11px var(--ef-font-ui); border: 1px solid var(--ef-rule); text-align: center; }
.auth-intro-footer { display: flex; flex-wrap: wrap; gap: 12px 20px; padding-top: 24px; border-top: 1px solid var(--ef-rule); font-size: 11px; color: var(--ef-ink-2); }
.auth-intro-footer span { display: flex; align-items: center; gap: 8px; }
.auth-intro-footer span::before { content: '/'; font: 650 12px var(--ef-font-ui); }
.auth-form-section { display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 0; padding: 64px clamp(30px, 5vw, 80px); background: var(--ef-panel); }
.auth-form-content { width: 100%; max-width: 400px; min-width: 0; }
.auth-form-eyebrow { margin-bottom: 20px; }
.auth-form :deep(h2) { font-size: 28px; line-height: 1.3; font-weight: 750; text-align: left; }
.auth-form :deep(.text-center:has(> h2)) { text-align: left; padding-bottom: 8px; }
.auth-form :deep(input:not([type=checkbox]):not([type=radio])) { min-height: 48px; }
.auth-form :deep(.btn) { min-height: 48px; }
.auth-form :deep(button.absolute) { min-width: 44px; justify-content: center; padding-inline: 10px; }
.auth-form-footer { margin-top: 26px; padding-top: 24px; border-top: 1px solid var(--ef-rule); font-size: 13px; line-height: 1.8; }
.auth-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px clamp(22px, 4vw, 64px); border-top: 1px solid var(--ef-rule); color: var(--ef-ink-2); font-size: 11px; }
.auth-footer > span { overflow-wrap: anywhere; }
.auth-footer a { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; }
.auth-shell :is(a, button):focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
@media (max-width: 900px) {
  .auth-introduction { padding: 44px 28px; }
  .auth-intro-copy h1 { font-size: 40px; }
  .auth-form-section { padding: 48px 28px; }
  .auth-map-input > span { padding-inline: 7px; font-size: 9px; }
  .auth-map-gateway { padding-inline: 10px; }
  .auth-map-gateway .auth-map-logo { width: 58px; height: 58px; }
  .auth-map-models { padding-left: 14px; }
  .auth-map-models::before { width: 14px; }
}
@media (max-width: 680px) {
  .auth-header { min-height: 76px; padding-block: 12px; }
  .auth-brand { gap: 10px; }
  .auth-brand img { width: 30px; height: 30px; }
  .auth-brand > span { font-size: 18px; }
  .auth-main { display: flex; flex-direction: column; }
  .auth-introduction { padding: 28px 24px; border-right: 0; border-bottom: 1px solid var(--ef-rule); }
  .auth-intro-copy > .ef-eyebrow { display: none; }
  .auth-intro-copy h1 { font-size: 32px; margin-top: 0; }
  .auth-intro-copy h1 > span { display: none; }
  .auth-intro-copy h2 { font-size: 15px; margin-top: 8px; }
  .auth-description, .auth-api-map, .auth-intro-footer { display: none; }
  .auth-form-section { flex: 1; padding: 34px 24px 42px; }
  .auth-form :deep(h2) { font-size: 25px; }
  .auth-form-eyebrow { margin-bottom: 14px; }
  .auth-footer { padding-block: 10px; }
}
</style>
