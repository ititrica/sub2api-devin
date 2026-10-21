<template>
  <!-- Administrator-provided home content keeps its existing full-page behavior. -->
  <div v-if="hasHomeContent" class="min-h-screen">
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      :title="siteName"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- Content is managed by administrators, as in the original home page. -->
    <div v-else v-html="homeContent"></div>
  </div>

  <div v-else class="gateway-home" :data-testid="compactHomeEnabled ? 'compact-home' : 'gateway-home'">
    <header class="home-header">
      <nav class="home-nav" :aria-label="siteName">
        <div class="home-brand">
          <img class="site-brand-image" :src="siteLogo || '/logo.png'" :alt="siteName" />
          <span>{{ siteName }}<small>AI API GATEWAY</small></span>
        </div>
        <div class="home-tools">
          <LocaleSwitcher />
          <button
            type="button"
            class="home-icon-button"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" size="md" />
          </button>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="home-enter">
            <span v-if="isAuthenticated && userInitial" class="home-initial">{{ userInitial }}</span>
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
            <Icon name="externalLink" size="sm" />
          </router-link>
        </div>
      </nav>
      <div class="home-navigation">
        <span class="home-current" aria-current="page"><span>//</span> {{ siteName }}</span>
        <div class="home-links">
          <router-link v-if="showModelPlazaEntry" to="/model-plaza">
            {{ t('nav.modelPlaza') }}<Icon name="externalLink" size="sm" />
          </router-link>
          <router-link to="/key-usage">{{ t('keyUsage.title') }}</router-link>
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}<Icon name="externalLink" size="sm" /></a>
        </div>
      </div>
    </header>

    <main v-if="compactHomeEnabled" class="compact-main">
      <p class="ef-eyebrow">// AI API GATEWAY</p>
      <h1>{{ siteName }}</h1>
      <p class="compact-subtitle">{{ siteSubtitle }}</p>
      <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="btn btn-primary">
        {{ isAuthenticated ? t('home.goToDashboard') : t('home.login') }}
        <Icon name="arrowRight" size="md" />
      </router-link>
      <div class="compact-rule" aria-hidden="true"></div>
    </main>

    <main v-else class="home-main">
      <section class="gateway-hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="ef-eyebrow">// AI API GATEWAY</p>
          <h1 id="home-title" class="home-wordmark ef-in-drive">{{ siteName }}</h1>
          <div class="hero-outline ef-in-drive" style="animation-delay:140ms" aria-hidden="true">CONNECTED.</div>
          <h2>{{ t('home.heroSubtitle') }}</h2>
          <p class="hero-description">{{ siteSubtitle }}</p>
          <div class="hero-actions">
            <span class="hatch-action">
              <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="btn btn-primary">
                {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                <Icon name="arrowRight" size="md" />
              </router-link>
            </span>
            <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="hero-secondary">
              {{ t('nav.modelPlaza') }}<Icon name="externalLink" size="sm" />
            </router-link>
            <a v-else-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="hero-secondary">
              {{ t('home.viewDocs') }}<Icon name="externalLink" size="sm" />
            </a>
          </div>
        </div>

        <div class="gateway-diagram ef-in-power" data-testid="gateway-diagram">
          <div class="diagram-heading"><span>// API ROUTING</span><Icon name="swap" size="md" /></div>
          <div class="diagram-route">
            <div class="diagram-client"><span>CLIENT</span><code>API KEY</code></div>
            <div class="diagram-connector" aria-hidden="true"></div>
            <div class="diagram-core">
              <img class="site-brand-image diagram-logo" :src="siteLogo || '/logo.png'" :alt="siteName" />
              <strong>{{ siteName }}</strong>
              <span>API GATEWAY</span>
            </div>
            <div class="diagram-branches" aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="diagram-models"><span :class="platformTextClass('anthropic')">Claude</span><span :class="platformTextClass('openai')">GPT</span><span :class="platformTextClass('gemini')">Gemini</span></div>
          </div>
          <div class="diagram-protocols"><code>/v1/messages</code><code>/v1/responses</code><code>/v1/chat/completions</code></div>
          <div class="diagram-caption"><span>{{ t('home.providers.description') }}</span><span aria-hidden="true">↗</span></div>
        </div>
      </section>

      <section class="endpoint-strip" aria-label="API BASE URL">
        <div class="endpoint-label"><span>API BASE URL</span><span class="endpoint-tag">{{ t('home.tags.subscriptionToApi') }}</span></div>
        <code>{{ apiBaseUrl }}</code>
        <button type="button" :aria-label="t('common.copy') + ' API BASE URL'" :class="{ 'is-copied': copied }" @click="copyToClipboard(apiBaseUrl)">
          <Icon :name="copied ? 'check' : 'copy'" size="md" />
          <span aria-live="polite">{{ copied ? t('common.copied') : t('common.copy') }}</span>
        </button>
      </section>

      <section class="home-features" :aria-label="t('home.solutions.title')">
        <article v-for="(feature, index) in featureItems" :key="feature.key" class="feature-record ef-in-come" :style="{ '--i': index }">
          <div class="feature-heading"><span class="feature-number">{{ String(index + 1).padStart(2, '0') }}</span><Icon :name="feature.icon" size="lg" /></div>
          <p class="ef-eyebrow">// {{ feature.label }}</p>
          <h3>{{ t(`home.features.${feature.key}`) }}</h3>
          <p class="feature-description">{{ t(`home.features.${feature.key}Desc`) }}</p>
        </article>
      </section>

      <section class="home-providers">
        <div><p class="ef-eyebrow">// MODELS</p><h2>{{ t('home.providers.title') }}</h2></div>
        <div class="provider-list"><span :class="platformTextClass('anthropic')">Claude</span><span :class="platformTextClass('openai')">GPT</span><span :class="platformTextClass('gemini')">Gemini</span><span :class="platformTextClass('antigravity')">Antigravity</span></div>
        <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="home-icon-button" :aria-label="t('nav.modelPlaza')"><Icon name="externalLink" size="lg" /></router-link>
      </section>
    </main>

    <footer class="home-footer">
      <p>&copy; {{ currentYear }} {{ siteName }}<span class="footer-rights"> / {{ t('home.footer.allRightsReserved') }}</span></p>
      <div><a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}</a><a :href="githubUrl" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a></div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useTheme, initTheme } from "@/composables/useTheme"
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { platformTextClass } from '@/utils/platformColors'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { useClipboard } from '@/composables/useClipboard'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()
const { copied, copyToClipboard } = useClipboard()
const apiBaseUrl = computed(() => appStore.cachedPublicSettings?.api_base_url || appStore.apiBaseUrl || window.location.origin)
const featureItems = [
  { key: 'unifiedGateway', label: 'UNIFIED ACCESS', icon: 'server' },
  { key: 'multiAccount', label: 'RELIABLE ROUTING', icon: 'shield' },
  { key: 'balanceQuota', label: 'USAGE & QUOTAS', icon: 'chart' },
] as const

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const { isDark, toggleTheme } = useTheme()

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelPlazaRequiresAuth = computed(
  () => appStore.cachedPublicSettings?.model_plaza_require_auth === true,
)
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || !modelPlazaRequiresAuth.value),
)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const userInitial = computed(() => {
  const user = authStore.user
  if (!user || !user.email) return ''
  return user.email.charAt(0).toUpperCase()
})

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme


// Initialize theme


onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>

<style scoped>
.gateway-home {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--ef-paper);
  color: var(--ef-ink);
}
.home-header { border-bottom: 1px solid var(--ef-rule); }
.home-nav, .home-navigation, .home-main, .home-footer { width: min(100%, 1440px); margin-inline: auto; padding-inline: clamp(20px, 4vw, 64px); }
.home-nav { min-height: 84px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.home-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.home-brand img { width: 36px; height: 36px; object-fit: cover; }
.home-brand > span { font: 700 20px / 1.15 var(--ef-font-ui); font-stretch: 112%; overflow-wrap: anywhere; }
.home-brand small { display: block; margin-top: 6px; color: var(--ef-ink-2); font-size: 9px; font-weight: 500; letter-spacing: .18em; }
.home-tools { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.home-icon-button { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; color: var(--ef-ink); background: transparent; border: 1px solid transparent; }
.home-icon-button:hover { background: var(--ef-chip); }
.home-enter { display: inline-flex; align-items: center; gap: 9px; min-height: 44px; padding: 10px calc(14px + var(--ef-cut)) 10px 18px; background: var(--ef-ink); color: var(--ef-panel); font-weight: 650; font-size: 12px; clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--ef-cut)), calc(100% - var(--ef-cut)) 100%, 0 100%); }
.home-enter:hover { background: var(--ef-signal); color: var(--ef-on-signal); }
.home-initial { font: 700 12px var(--ef-font-ui); }
.home-navigation { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 46px; border-top: 1px solid var(--ef-rule); }
.home-current { display: inline-flex; align-items: center; gap: 10px; min-height: 46px; font: 650 11px var(--ef-font-ui); text-transform: uppercase; letter-spacing: .1em; }
.home-current > span { font-weight: 850; }
.home-links { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px 28px; }
.home-links a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 12px; font-weight: 550; }
.home-links a:hover, .hero-secondary:hover { text-decoration: underline; text-underline-offset: 5px; }
.home-main { flex: 1; }
.gateway-hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: clamp(32px, 4vw, 72px); align-items: center; padding-block: clamp(52px, 6vw, 90px); }
.hero-copy { min-width: 0; }
.home-wordmark { margin-top: 20px; font: 800 clamp(48px, 6.1vw, 92px) / .98 var(--ef-font-ui); font-stretch: 125%; letter-spacing: -.055em; overflow-wrap: anywhere; }
.hero-outline { margin-top: 3px; font: 750 clamp(30px, 4.3vw, 66px) / 1.12 var(--ef-font-ui); font-stretch: 125%; letter-spacing: -.035em; color: transparent; -webkit-text-stroke: 1px var(--ef-ink); }
.hero-copy h2 { max-width: 540px; margin-top: 32px; font-size: clamp(19px, 2.1vw, 28px); font-weight: 750; line-height: 1.5; }
.hero-description { max-width: 480px; color: var(--ef-ink-2); margin-top: 10px; font-size: 14px; line-height: 1.85; white-space: pre-wrap; overflow-wrap: anywhere; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; margin-top: 30px; }
.hero-actions .btn { min-height: 50px; min-width: 160px; justify-content: space-between; }
.hero-secondary { display: inline-flex; align-items: center; gap: 16px; min-height: 44px; font-size: 13px; font-weight: 650; }
.gateway-diagram { position: relative; min-width: 0; border: 1px solid var(--ef-rule); background: var(--ef-panel); margin-bottom: 15px; }
.gateway-diagram::after { content: ''; position: absolute; inset: 16px -16px -16px 16px; z-index: 0; pointer-events: none; background: repeating-linear-gradient(135deg, transparent 0 5px, var(--ef-rule) 5px 6px); clip-path: polygon(100% 0, 100% 100%, 0 100%, 0 calc(100% - 16px), calc(100% - 16px) calc(100% - 16px), calc(100% - 16px) 0); }
.diagram-heading { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--ef-rule); font: 600 10px var(--ef-font-ui); letter-spacing: .15em; }
.diagram-route { display: grid; grid-template-columns: .85fr 24px 1.1fr 28px .9fr; align-items: center; padding: 42px 20px; }
.diagram-client { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 7px; border: 1px solid var(--ef-rule); }
.diagram-client span { font: 650 10px var(--ef-font-ui); letter-spacing: .08em; }
.diagram-client code { font-size: 9px; color: var(--ef-ink-2); }
.diagram-connector { height: 1px; background: var(--ef-ink-2); }
.diagram-core { min-width: 0; display: flex; flex-direction: column; align-items: center; padding: 14px 6px; border: 1px solid var(--ef-ink); }
.diagram-core .diagram-logo { width: 72px; height: 72px; }
.diagram-core strong { margin-top: 10px; max-width: 100%; overflow-wrap: anywhere; text-align: center; font: 750 15px var(--ef-font-ui); }
.diagram-core > span { margin-top: 4px; font: 500 8px var(--ef-font-ui); letter-spacing: .12em; }
.diagram-branches { display: grid; grid-template-rows: repeat(3, 48px); }
.diagram-branches i { align-self: center; display: block; height: 1px; background: var(--ef-ink-2); }
.diagram-branches i:first-child { align-self: end; height: 24px; background: transparent; border-left: 1px solid var(--ef-ink-2); border-top: 1px solid var(--ef-ink-2); margin-left: 13px; }
.diagram-branches i:last-child { align-self: start; height: 24px; background: transparent; border-left: 1px solid var(--ef-ink-2); border-bottom: 1px solid var(--ef-ink-2); margin-left: 13px; }
.diagram-models { display: grid; gap: 12px; }
.diagram-models span { display: grid; place-items: center; min-height: 36px; border: 1px solid var(--ef-rule); font: 600 12px var(--ef-font-ui); }
.diagram-protocols { display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 0 20px 24px; }
.diagram-protocols code { color: var(--ef-ink-2); font-size: 9px; }
.diagram-caption { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 12px 20px; background: var(--ef-ink); color: var(--ef-panel); font-size: 12px; }
.diagram-caption > span:last-child { font-size: 22px; }
.endpoint-strip { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 24px; padding-block: 19px; border-block: 1px solid var(--ef-ink); }
.endpoint-label { display: flex; flex-direction: column; gap: 4px; font: 650 10px var(--ef-font-ui); letter-spacing: .12em; }
.endpoint-tag { color: var(--ef-ink-2); font-size: 8px; }
.endpoint-strip > code { font-size: 13px; overflow-wrap: anywhere; }
.endpoint-strip button { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 10px calc(12px + var(--ef-cut)) 10px 16px; background: var(--ef-chip); font-size: 12px; font-weight: 650; clip-path: polygon(0 0, 100% 0, 100% calc(100% - var(--ef-cut)), calc(100% - var(--ef-cut)) 100%, 0 100%); }
.endpoint-strip button:hover, .endpoint-strip button.is-copied { background: var(--ef-signal); color: var(--ef-on-signal); }
.home-features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding-block: 44px; }
.feature-record { padding-inline: 32px; border-right: 1px solid var(--ef-rule); }
.feature-record:first-child { padding-left: 0; }
.feature-record:last-child { border-right: 0; padding-right: 0; }
.feature-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 23px; }
.feature-number { font: 650 39px / 1 var(--ef-font-ui); color: transparent; -webkit-text-stroke: 1px var(--ef-ink-2); }
.feature-heading > svg { color: var(--ef-ink-2); }
.feature-record .ef-eyebrow { font-size: 9px; }
.feature-record h3 { font-size: 20px; font-weight: 750; margin-top: 7px; }
.feature-description { color: var(--ef-ink-2); font-size: 13px; line-height: 1.9; margin-top: 11px; max-width: 340px; }
.home-providers { display: flex; align-items: center; gap: 28px; padding-block: 30px; border-top: 1px solid var(--ef-rule); margin-bottom: 32px; }
.home-providers h2 { font-size: 16px; font-weight: 700; margin-top: 5px; }
.provider-list { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 12px 32px; margin-left: auto; }
.provider-list span { font: 650 21px var(--ef-font-ui); }
.home-footer { display: flex; justify-content: space-between; gap: 20px; padding-block: 22px; border-top: 1px solid var(--ef-rule); font-size: 11px; color: var(--ef-ink-2); }
.home-footer p { overflow-wrap: anywhere; }
.home-footer > div { display: flex; gap: 22px; flex-shrink: 0; }
.compact-main { flex: 1; padding: 100px max(24px, calc((100vw - 1080px) / 2)); }
.compact-main h1 { margin-top: 28px; max-width: 100%; font: 800 clamp(44px, 8vw, 100px) / 1.1 var(--ef-font-ui); font-stretch: 125%; overflow-wrap: anywhere; }
.compact-subtitle { margin-top: 20px; max-width: 620px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--ef-ink-2); }
.compact-main .btn { margin-top: 34px; min-height: 50px; }
.compact-rule { margin-top: 70px; height: 28px; background: repeating-linear-gradient(135deg, transparent 0 5px, var(--ef-rule) 5px 6px); }
.gateway-home :is(a, button):focus-visible { outline: 2px solid currentColor; outline-offset: -4px; }
@media (hover: none) { .home-enter { background: var(--ef-signal); color: var(--ef-on-signal); } }
@media (max-width: 980px) {
  .gateway-hero { grid-template-columns: 1fr 1fr; gap: 30px; }
  .home-wordmark { font-size: clamp(42px, 6.4vw, 64px); }
  .hero-outline { font-size: clamp(28px, 4.2vw, 42px); }
  .diagram-route { padding-inline: 12px; grid-template-columns: .8fr 15px 1.1fr 20px .85fr; }
  .diagram-core .diagram-logo { width: 58px; height: 58px; }
  .diagram-client code { font-size: 8px; }
  .diagram-branches i:first-child, .diagram-branches i:last-child { margin-left: 10px; }
  .home-providers { flex-wrap: wrap; }
  .provider-list { gap: 12px 24px; }
  .provider-list span { font-size: 18px; }
}
@media (max-width: 700px) {
  .home-nav { min-height: 76px; gap: 12px; }
  .home-brand { gap: 9px; }
  .home-brand img { width: 28px; height: 28px; }
  .home-brand > span { font-size: 16px; }
  .home-brand small { font-size: 7px; letter-spacing: .1em; }
  .home-tools { gap: 2px; }
  .home-enter { padding-left: 12px; padding-right: calc(7px + var(--ef-cut)); }
  .home-enter > svg, .home-initial { display: none; }
  .home-navigation { justify-content: flex-start; gap: 0; }
  .home-current { display: none; }
  .home-links { justify-content: flex-start; gap: 2px 20px; }
  .home-links a { font-size: 11px; }
  .gateway-hero { grid-template-columns: 1fr; padding-block: 42px; gap: 36px; }
  .home-wordmark { font-size: clamp(48px, 10vw, 70px); }
  .hero-outline { font-size: clamp(30px, 7.2vw, 48px); }
  .hero-copy h2 { margin-top: 24px; }
  .hero-description { font-size: 13px; }
  .gateway-diagram { width: calc(100% - 12px); }
  .diagram-route { padding: 28px 18px; grid-template-columns: .85fr 25px 1.1fr 28px .9fr; }
  .diagram-core .diagram-logo { width: 68px; height: 68px; }
  .diagram-core strong { font-size: 13px; }
  .diagram-protocols { padding-bottom: 18px; }
  .endpoint-strip { grid-template-columns: minmax(0, 1fr) auto; gap: 12px; }
  .endpoint-label { grid-column: 1; }
  .endpoint-strip > code { grid-row: 2; grid-column: 1; font-size: 11px; }
  .endpoint-strip button { grid-column: 2; grid-row: 1 / 3; }
  .home-features { grid-template-columns: 1fr; padding-block: 8px 24px; }
  .feature-record, .feature-record:first-child, .feature-record:last-child { padding: 24px 0; border-right: 0; border-bottom: 1px solid var(--ef-rule); }
  .feature-record:last-child { border-bottom: 0; }
  .feature-heading { float: left; display: block; width: 62px; margin-bottom: 0; }
  .feature-heading > svg { display: none; }
  .feature-number { font-size: 32px; }
  .feature-record h3 { font-size: 18px; }
  .feature-description { margin-left: 62px; max-width: none; }
  .home-providers { gap: 18px; }
  .provider-list { margin-left: 0; justify-content: flex-start; gap: 12px 22px; width: calc(100% - 62px); }
  .home-providers > .home-icon-button { margin-left: auto; }
  .provider-list span { font-size: 17px; }
  .home-footer { flex-wrap: wrap; gap: 14px; }
  .footer-rights { display: none; }
  .compact-main { padding: 72px 24px; }
}
@media (max-width: 380px) {
  .home-brand img { width: 30px; height: 30px; }
  .home-tools :deep(button) { padding-inline: 7px; }
  .home-links { gap: 2px 16px; }
}
</style>
