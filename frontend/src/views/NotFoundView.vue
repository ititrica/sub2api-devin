<template>
  <main class="not-found-page">
    <section class="not-found-content">
      <p class="ef-eyebrow">// PAGE NOT FOUND</p>
      <p class="not-found-code" aria-hidden="true">404</p>
      <h1>{{ t('errors.pageNotFound') }}</h1>
      <p class="not-found-description">The page you are looking for doesn't exist or has been moved.</p>
      <div class="not-found-actions">
        <button type="button" @click="goBack" class="btn btn-secondary"><Icon name="arrowLeft" size="md" />{{ t('common.back') }}</button>
        <router-link to="/dashboard" class="btn btn-primary"><Icon name="home" size="md" />{{ t('home.goToDashboard') }}</router-link>
      </div>
      <p class="not-found-help">Need help? <a href="#">{{ t('common.contactSupport') }}</a></p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const router = useRouter()

function goBack(): void {
  router.back()
}
</script>

<style scoped>
.not-found-page { min-height: 100dvh; display: grid; place-items: center; padding: 48px 24px; background: var(--ef-paper); color: var(--ef-ink); }
.not-found-content { width: min(100%, 600px); border-top: 3px solid var(--ef-ink); padding-block: 30px; }
.not-found-code { margin-top: 24px; font: 800 clamp(100px, 24vw, 208px) / 1 var(--ef-font-ui); font-stretch: 125%; color: transparent; -webkit-text-stroke: 1px var(--ef-ink); }
.not-found-content h1 { margin-top: 28px; font-size: clamp(24px, 4vw, 36px); font-weight: 750; }
.not-found-description { max-width: 420px; margin-top: 14px; font-size: 14px; line-height: 1.8; color: var(--ef-ink-2); }
.not-found-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.not-found-help { border-top: 1px solid var(--ef-rule); margin-top: 40px; padding-top: 20px; color: var(--ef-ink-2); font-size: 12px; }
.not-found-help a { text-decoration: underline; text-underline-offset: 4px; margin-left: 8px; color: var(--ef-ink); }
</style>
