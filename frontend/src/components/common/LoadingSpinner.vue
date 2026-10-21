<template>
  <div class="site-loader" :class="`site-loader--${size}`" role="status" :aria-label="t('common.loading')">
    <span class="sr-only">{{ t('common.loading') }}</span>
    <span class="loader-track" aria-hidden="true"><i></i></span>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
}>(), { size: 'md', color: 'primary' })
</script>
<style scoped>
.site-loader { display:inline-flex; width:40px; height:12px; flex-shrink:0; }
.site-loader--sm { width:24px; height:8px; }
.site-loader--lg { width:56px; height:14px; }
.site-loader--xl { width:72px; height:16px; }
.loader-track { position:relative; display:block; width:100%; overflow:hidden; background:var(--ef-chip); border:1px solid var(--ef-rule); }
.loader-track::after { content:''; position:absolute; inset:0; background:repeating-linear-gradient(90deg,transparent 0 5px,var(--ef-panel) 5px 7px); }
.loader-track i { display:block; height:100%; width:100%; background:var(--ef-signal); transform:translateX(-65%); }
@media(prefers-reduced-motion:no-preference) { .loader-track i { animation:loader-run 1200ms steps(12) infinite; } }
@keyframes loader-run { to { transform:translateX(100%); } }
</style>
